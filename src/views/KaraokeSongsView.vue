<template>
  <AppShell>
    <section>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl">Músicas do karaokê</h1>
          <p class="mt-1 max-w-2xl text-sm text-ink-muted sm:text-base">
            Suas músicas já sincronizadas, prontas para usar em qualquer evento. No jogo de karaokê, clique em
            <strong>Escolher da biblioteca</strong>.
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <button type="button" class="btn-outline" :disabled="importing" @click="importFromGames">
            <Download :size="16" /> {{ importing ? 'Importando...' : 'Importar dos jogos' }}
          </button>
          <button type="button" class="btn-primary" @click="openForm(null)"><Plus :size="16" /> Adicionar música</button>
        </div>
      </div>

      <p v-if="importMessage" class="mt-4 rounded-xl bg-primary-50 px-4 py-3 text-sm font-bold text-primary-700">{{ importMessage }}</p>

      <KaraokeSongFormModal v-if="formOpen" :song="editing" @saved="onSaved" @close="formOpen = false" />

      <div v-if="songs.length" class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div class="relative w-full sm:max-w-sm">
          <Search :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input v-model="query" type="text" placeholder="Buscar por título ou artista" class="w-full pl-10!" />
        </div>
        <span class="badge badge-muted">{{ songs.length }} {{ songs.length === 1 ? 'música' : 'músicas' }}</span>
      </div>

      <p v-if="loading" class="mt-8 text-ink-muted">Carregando...</p>
      <p v-else-if="error" class="field-error mt-8">{{ error }}</p>
      <p v-else-if="!songs.length" class="card mt-8 text-ink-muted">
        Nenhuma música salva ainda. Clique em "Importar dos jogos" para trazer as músicas que você já cadastrou nos eventos, ou em "Adicionar música".
      </p>
      <p v-else-if="!filtered.length" class="card mt-6 text-ink-muted">Nenhuma música encontrada.</p>

      <div v-else class="mt-5 grid gap-4 lg:grid-cols-2">
        <article v-for="song in filtered" :key="song.id" class="card flex flex-col gap-3 !p-5">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 h-11 w-1.5 shrink-0 rounded-full" :style="{ backgroundColor: song.color || '#10939b' }" />
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-lg leading-tight">{{ song.title }}</h2>
              <p class="truncate text-sm text-ink-muted">{{ song.artist || 'Artista não informado' }}</p>
            </div>
            <div class="flex shrink-0 gap-1">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5"
                title="Editar música"
                @click="openForm(song)"
              >
                <Pencil :size="15" />
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-danger-tint! hover:text-danger!"
                title="Remover da biblioteca"
                @click="remove(song)"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <span class="badge" :class="lineCount(song) ? 'badge-muted' : 'bg-danger-tint text-danger'">
              {{ lineCount(song) }} {{ lineCount(song) === 1 ? 'linha sincronizada' : 'linhas sincronizadas' }}
            </span>
            <span class="badge badge-muted">Salva em {{ formatDate(song.updated_at) }}</span>
          </div>

          <audio :src="song.audio_url" controls preload="none" class="h-10 w-full" />
        </article>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Download, Pencil, Plus, Search, Trash2 } from '@lucide/vue'
import KaraokeSongFormModal from '@/games/karaoke/KaraokeSongFormModal.vue'
import AppShell from '@/layouts/AppShell.vue'
import { deleteKaraokeLibrarySong, fetchKaraokeLibrary, importKaraokeSongsFromGames } from '@/services/karaoke'
import { parseLrc } from '@/games/karaoke/lrc'

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

const lineCount = (song) => parseLrc(song.lyrics).filter((line) => line.text).length
const formatDate = (value) => new Date(value).toLocaleDateString('pt-BR')

const importing = ref(false)
const importMessage = ref('')

// Traz pra biblioteca as músicas já cadastradas nos jogos de karaokê (as que já estão aqui ficam como estão).
async function importFromGames() {
  importing.value = true
  importMessage.value = ''
  error.value = ''
  try {
    const { found, created } = await importKaraokeSongsFromGames()
    songs.value = await fetchKaraokeLibrary()
    if (!found) importMessage.value = 'Nenhuma música encontrada nos jogos de karaokê dos seus eventos.'
    else if (!created) importMessage.value = 'Todas as músicas dos seus jogos já estão na biblioteca.'
    else importMessage.value = `${created} ${created === 1 ? 'música importada' : 'músicas importadas'} dos seus jogos de karaokê.`
  } catch {
    error.value = 'Não foi possível importar as músicas dos jogos.'
  } finally {
    importing.value = false
  }
}

const formOpen = ref(false)
const editing = ref(null)

function openForm(song) {
  editing.value = song
  formOpen.value = true
}

function onSaved(saved) {
  const index = songs.value.findIndex((s) => s.id === saved.id)
  if (index >= 0) songs.value.splice(index, 1, saved)
  else songs.value.push(saved)
  songs.value.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  formOpen.value = false
}

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
    error.value = 'Não foi possível carregar as músicas.'
  } finally {
    loading.value = false
  }
})
</script>
