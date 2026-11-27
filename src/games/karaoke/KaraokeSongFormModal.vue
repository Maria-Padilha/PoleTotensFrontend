<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" @click.self="$emit('close')">
      <div class="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
          <h3 class="text-lg font-extrabold text-ink">{{ form.id ? 'Editar música' : 'Nova música' }}</h3>
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5" title="Fechar" @click="$emit('close')">
            <X :size="18" />
          </button>
        </div>

        <form id="song-form" class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" @submit.prevent="submit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="field">
              <label for="lib-title">Título</label>
              <input id="lib-title" v-model="form.title" type="text" maxlength="255" required />
            </div>
            <div class="field">
              <label for="lib-artist">Artista (opcional)</label>
              <input id="lib-artist" v-model="form.artist" type="text" maxlength="255" />
            </div>
            <div class="field">
              <label for="lib-genre">Gênero (opcional)</label>
              <select id="lib-genre" v-model="form.genre">
                <option value="">Sem gênero</option>
                <option v-for="g in genreOptions" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
          </div>

          <ColorField v-model="form.color" label="Cor da música no totem (cartão e número)" fallback="#e4572e" />

          <AudioUploadField
            v-model="form.audio_url"
            label="Áudio da música (de preferência a versão instrumental)"
            game-slug="karaoke"
            folder="biblioteca"
          />

          <div class="field">
            <label for="lib-lyrics">Letra sincronizada (formato LRC)</label>
            <textarea
              id="lib-lyrics"
              v-model="form.lyrics"
              rows="8"
              class="font-mono text-xs"
              placeholder="[00:12.40] Parabéns pra você&#10;[00:16.80] Nesta data querida&#10;[00:21.00]"
            />
            <p class="mt-1 text-xs text-ink-muted">
              Cole a letra (uma frase por linha) e use "Sincronizar tocando a música" para marcar os tempos.
            </p>
            <button
              v-if="form.audio_url && lineCount && !syncing"
              type="button"
              class="btn-outline mt-2 !px-3.5 !py-2 text-xs"
              @click="syncing = true"
            >
              <Timer :size="13" /> Sincronizar tocando a música
            </button>
            <button
              v-if="form.audio_url && lineCount && !testing"
              type="button"
              class="btn-outline mt-2 ml-2 !px-3.5 !py-2 text-xs"
              @click="testing = true"
            >
              <Headphones :size="13" /> Testar sincronia
            </button>
            <KaraokePreview
              v-if="testing"
              class="mt-3"
              :audio-url="form.audio_url"
              :lyrics="form.lyrics"
              :offset="Number(form.offset) || 0"
              :color="form.color || '#e4572e'"
              @update:offset="form.offset = $event"
              @close="testing = false"
            />
            <KaraokeLyricsSync
              v-if="syncing"
              class="mt-2"
              :audio-url="form.audio_url"
              :lyrics="form.lyrics"
              @apply="applySync"
              @cancel="syncing = false"
            />
            <div class="field mt-3 max-w-xs">
              <label for="lib-offset">Ajuste fino da sincronia (segundos)</label>
              <input id="lib-offset" v-model.number="form.offset" type="number" step="0.1" min="-10" max="10" />
              <p class="mt-1 text-xs text-ink-muted">Positivo atrasa a letra, negativo adianta (vale pra música toda).</p>
            </div>
            <p class="mt-1 text-xs font-bold" :class="lineCount ? 'text-primary-600' : 'text-danger'">
              {{ lineCount }} {{ lineCount === 1 ? 'linha' : 'linhas' }} com letra reconhecida.
            </p>
          </div>

          <p v-if="error" class="field-error">{{ error }}</p>
        </form>

        <div class="flex justify-end gap-2 border-t border-ink/10 px-5 py-3">
          <button type="button" class="btn-outline" @click="$emit('close')">Cancelar</button>
          <button type="submit" form="song-form" class="btn-primary" :disabled="saving || !form.title || !form.audio_url">
            {{ saving ? 'Salvando…' : 'Salvar na biblioteca' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Headphones, Timer, X } from '@lucide/vue'
import ColorField from '@/components/ColorField.vue'
import AudioUploadField from '@/components/AudioUploadField.vue'
import KaraokeLyricsSync from './KaraokeLyricsSync.vue'
import KaraokePreview from './KaraokePreview.vue'
import { parseLrc } from './lrc'
import { saveKaraokeLibrarySong } from '@/services/karaoke'
import { KARAOKE_GENRES } from './genres'

const props = defineProps({
  // música existente a editar; vazio = nova
  song: { type: Object, default: null },
})
const emit = defineEmits(['saved', 'close'])

const form = reactive({
  id: props.song?.id ?? null,
  title: props.song?.title ?? '',
  artist: props.song?.artist ?? '',
  genre: props.song?.genre ?? '',
  audio_url: props.song?.audio_url ?? '',
  lyrics: props.song?.lyrics ?? '',
  offset: Number(props.song?.offset) || 0,
  color: props.song?.color ?? '',
})
const syncing = ref(false)
const testing = ref(false)
const saving = ref(false)
const error = ref('')

const genreOptions = computed(() => (form.genre && !KARAOKE_GENRES.includes(form.genre) ? [...KARAOKE_GENRES, form.genre] : KARAOKE_GENRES))

const lineCount = computed(() => parseLrc(form.lyrics).filter((line) => line.text).length)

function applySync(lrc) {
  form.lyrics = lrc
  syncing.value = false
}

async function submit() {
  saving.value = true
  error.value = ''
  try {
    emit('saved', await saveKaraokeLibrarySong(form))
  } catch (e) {
    error.value = e.response?.data?.message || 'Não foi possível salvar a música.'
  } finally {
    saving.value = false
  }
}
</script>
