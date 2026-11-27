<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-ink">Músicas do karaokê</label>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="libraryOpen = true">
          <Library :size="14" /> Escolher da biblioteca
        </button>
        <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addSong">
          <Plus :size="14" /> Adicionar nova
        </button>
      </div>
    </div>

    <KaraokeLibraryModal
      v-if="libraryOpen"
      :used-audio-urls="songs.map((s) => s.audio_url)"
      @select="addFromLibrary"
      @close="libraryOpen = false"
    />

    <p v-if="songs.length === 0" class="text-sm text-ink-muted">
      Nenhuma música ainda. Escolha uma da biblioteca ou adicione uma nova.
    </p>

    <div v-for="(song, index) in songs" :key="song.id" class="rounded-xl border border-ink/10 p-4">
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          @click="toggleExpanded(song.id)"
        >
          <component :is="isExpanded(song.id) ? ChevronDown : ChevronRight" :size="16" class="shrink-0 text-ink-soft" />
          <span class="shrink-0 text-sm font-bold text-ink">Música {{ index + 1 }}</span>
          <span v-if="song.title" class="truncate text-sm text-ink-muted">— {{ song.title }}</span>
          <span v-else class="truncate text-sm italic text-ink-soft">Sem título ainda</span>
        </button>
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft
            transition-colors hover:!bg-danger-tint hover:!text-danger"
          title="Remover música"
          @click="removeSong(index)"
        >
          <Trash2 :size="15" />
        </button>
      </div>

      <div v-if="isExpanded(song.id)" class="mt-3 space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="field">
            <label :for="`song-title-${song.id}`">Título</label>
            <input :id="`song-title-${song.id}`" v-model="song.title" type="text" maxlength="255" />
          </div>
          <div class="field">
            <label :for="`song-artist-${song.id}`">Artista (opcional)</label>
            <input :id="`song-artist-${song.id}`" v-model="song.artist" type="text" maxlength="255" />
          </div>
          <div class="field">
            <label :for="`song-genre-${song.id}`">Gênero (opcional)</label>
            <select :id="`song-genre-${song.id}`" v-model="song.genre">
              <option value="">Sem gênero</option>
              <option v-for="g in genreOptions(song.genre)" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
        </div>

        <ColorField v-model="song.color" label="Cor da música no totem (cartão e número)" fallback="#e4572e" />

        <AudioUploadField
          v-model="song.audio_url"
          label="Áudio da música (de preferência a versão instrumental)"
          :event-id="eventId"
          game-slug="karaoke"
          folder="musicas"
        />

        <div class="field">
          <label :for="`song-lyrics-${song.id}`">Letra sincronizada (formato LRC)</label>
          <textarea
            :id="`song-lyrics-${song.id}`"
            v-model="song.lyrics"
            rows="8"
            class="font-mono text-xs"
            placeholder="[00:12.40] Parabéns pra você&#10;[00:16.80] Nesta data querida&#10;[00:21.00]"
          />
          <p class="mt-1 text-xs text-ink-muted">
            Aceita dois formatos. LRC: <code>[minutos:segundos.centésimos] texto</code>, uma frase por linha.
            Ou blocos: o tempo (<code>1:14</code>) numa linha e o texto embaixo — parágrafos longos são
            quebrados em frases automaticamente. Tempo sem texto marca uma pausa instrumental.
          </p>
          <button
            v-if="song.audio_url && lineCount(song) && syncingId !== song.id"
            type="button"
            class="btn-outline mt-2 !px-3.5 !py-2 text-xs"
            @click="syncingId = song.id"
          >
            <Timer :size="13" /> Sincronizar tocando a música
          </button>
          <button
            v-if="song.audio_url && lineCount(song) && testingId !== song.id"
            type="button"
            class="btn-outline mt-2 ml-2 !px-3.5 !py-2 text-xs"
            @click="testingId = song.id"
          >
            <Headphones :size="13" /> Testar sincronia
          </button>
          <KaraokePreview
            v-if="testingId === song.id"
            class="mt-3"
            :audio-url="song.audio_url"
            :lyrics="song.lyrics"
            :offset="Number(song.offset) || 0"
            :color="songColor(song, index)"
            @update:offset="song.offset = $event"
            @close="testingId = null"
          />
          <KaraokeLyricsSync
            v-if="syncingId === song.id"
            class="mt-2"
            :audio-url="song.audio_url"
            :lyrics="song.lyrics"
            @apply="applySync(song, $event)"
            @cancel="syncingId = null"
          />
          <div
            v-if="warnings(song).outOfOrder.length || warnings(song).tight.length"
            class="mt-2 rounded-lg bg-danger-tint p-3 text-xs text-danger"
          >
            <p class="font-bold">A marcação de tempo tem problemas — o jogo não vai ficar no ritmo nesses trechos:</p>
            <p v-if="warnings(song).outOfOrder.length" class="mt-1">
              Tempos fora de ordem em: {{ warnings(song).outOfOrder.slice(0, 8).join(', ') }}.
            </p>
            <p v-if="warnings(song).tight.length" class="mt-1">
              Frases curtas demais pro tempo que têm (impossível cantar tão rápido) em:
              {{ warnings(song).tight.slice(0, 8).join(', ') }}.
            </p>
            <p class="mt-1">Use "Sincronizar tocando a música" pra refazer a marcação certinha.</p>
          </div>
          <div class="field mt-3 max-w-xs">
            <label :for="`song-offset-${song.id}`">Ajuste fino da sincronia (segundos)</label>
            <input :id="`song-offset-${song.id}`" v-model.number="song.offset" type="number" step="0.1" min="-10" max="10" />
            <p class="mt-1 text-xs text-ink-muted">Positivo atrasa a letra, negativo adianta (vale pra música toda).</p>
          </div>
          <p class="mt-1 text-xs font-bold" :class="lineCount(song) ? 'text-primary-600' : 'text-danger'">
            {{ lineCount(song) }} {{ lineCount(song) === 1 ? 'linha' : 'linhas' }} com letra reconhecida.
            <template v-if="!lineCount(song)">Sem letra sincronizada não há pontuação.</template>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus, Trash2, ChevronDown, ChevronRight, Timer, Headphones, Library } from '@lucide/vue'
import KaraokeLibraryModal from './KaraokeLibraryModal.vue'
import KaraokeLyricsSync from './KaraokeLyricsSync.vue'
import KaraokePreview from './KaraokePreview.vue'
import { songColor } from './songColors'
import { KARAOKE_GENRES } from './genres'
import ColorField from '@/components/ColorField.vue'
import AudioUploadField from '@/components/AudioUploadField.vue'
import { parseLrc, analyzeLyrics } from './lrc'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  eventId: { type: [Number, String], default: null },
  color: { type: String, default: '#10939b' },
})
const emit = defineEmits(['update:modelValue'])

const songs = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const expandedIds = ref(new Set())
const syncingId = ref(null)
const testingId = ref(null)
const libraryOpen = ref(false)

function applySync(song, lrc) {
  song.lyrics = lrc
  syncingId.value = null
}

function isExpanded(id) {
  return expandedIds.value.has(id)
}

function toggleExpanded(id) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

// lista padrão; se a música veio com um gênero fora dela, ele continua selecionável
const genreOptions = (current) => (current && !KARAOKE_GENRES.includes(current) ? [...KARAOKE_GENRES, current] : KARAOKE_GENRES)

function lineCount(song) {
  return parseLrc(song.lyrics).filter((line) => line.text).length
}

function warnings(song) {
  return analyzeLyrics(song.lyrics)
}

function addSong() {
  const song = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    artist: '',
    genre: '',
    audio_url: '',
    lyrics: '',
    offset: 0,
    color: '',
  }
  songs.value = [...songs.value, song]
  expandedIds.value = new Set([...expandedIds.value, song.id])
}

// Copia a música da biblioteca pro evento: mesmo áudio (mesmo link no R2, nada é reenviado)
// e a sincronização já pronta.
function addFromLibrary(entry) {
  const song = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: entry.title,
    artist: entry.artist || '',
    genre: entry.genre || '',
    audio_url: entry.audio_url,
    lyrics: entry.lyrics || '',
    offset: Number(entry.offset) || 0,
    color: entry.color || '',
  }
  songs.value = [...songs.value, song]
  libraryOpen.value = false
}

function removeSong(index) {
  songs.value = songs.value.filter((_, i) => i !== index)
}
</script>
