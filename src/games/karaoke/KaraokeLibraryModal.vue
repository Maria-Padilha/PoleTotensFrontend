<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" @click.self="$emit('close')">
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
          <div>
            <h3 class="text-lg font-extrabold text-ink">Biblioteca de músicas</h3>
            <p class="text-xs text-ink-muted">Músicas já sincronizadas — escolha para usar neste evento sem refazer a marcação.</p>
          </div>
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5" title="Fechar" @click="$emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="border-b border-ink/10 px-5 py-3">
          <div class="relative">
            <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input v-model="query" type="text" placeholder="Buscar por título ou artista" class="w-full !pl-9" />
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <p v-if="loading" class="px-2 py-8 text-center text-sm text-ink-muted">Carregando…</p>
          <p v-else-if="error" class="px-2 py-8 text-center text-sm text-danger">{{ error }}</p>
          <p v-else-if="!filtered.length" class="px-2 py-8 text-center text-sm text-ink-muted">
            {{ songs.length ? 'Nenhuma música encontrada.' : 'A biblioteca está vazia. As músicas que você salvar nos eventos aparecem aqui.' }}
          </p>

          <ul v-else class="space-y-1">
            <li
              v-for="song in filtered"
              :key="song.id"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-ink/5"
            >
              <span class="h-9 w-1.5 shrink-0 rounded-full" :style="{ backgroundColor: song.color || '#10939b' }" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-ink">{{ song.title }}</p>
                <p class="truncate text-xs text-ink-muted">
                  {{ song.artist || 'Artista não informado' }} · {{ lineCount(song) }} {{ lineCount(song) === 1 ? 'linha' : 'linhas' }} sincronizadas
                </p>
              </div>
              <span v-if="isUsed(song)" class="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold text-ink-muted">Já neste evento</span>
              <button v-else type="button" class="btn-primary shrink-0 !px-3.5 !py-1.5 text-xs" @click="$emit('select', song)">
                <Plus :size="13" /> Usar
              </button>
              <button
                type="button"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:!bg-danger-tint hover:!text-danger"
                title="Remover da biblioteca"
                @click="remove(song)"
              >
                <Trash2 :size="14" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, Search, Trash2, X } from '@lucide/vue'
import { deleteKaraokeLibrarySong, fetchKaraokeLibrary } from '@/services/karaoke'
import { parseLrc } from './lrc'

const props = defineProps({
  // links de áudio das músicas que já estão no evento
  usedAudioUrls: { type: Array, default: () => [] },
})
defineEmits(['select', 'close'])

const songs = ref([])
const query = ref('')
const loading = ref(true)
const error = ref('')

const norm = (text) => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const filtered = computed(() => {
  const q = norm(query.value).trim()
  if (!q) return songs.value
  return songs.value.filter((song) => norm(`${song.title} ${song.artist}`).includes(q))
})

const isUsed = (song) => props.usedAudioUrls.includes(song.audio_url)
const lineCount = (song) => parseLrc(song.lyrics).filter((line) => line.text).length

async function remove(song) {
  if (!window.confirm(`Remover "${song.title}" da biblioteca? Os eventos que já usam essa música não são afetados.`)) return
  try {
    await deleteKaraokeLibrarySong(song.id)
    songs.value = songs.value.filter((s) => s.id !== song.id)
  } catch {
    error.value = 'Não foi possível remover a música.'
  }
}

onMounted(async () => {
  try {
    songs.value = await fetchKaraokeLibrary()
  } catch {
    error.value = 'Não foi possível carregar a biblioteca.'
  } finally {
    loading.value = false
  }
})
</script>
