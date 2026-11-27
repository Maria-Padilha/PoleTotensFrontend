import { computed, ref } from 'vue'

// Gêneros disponíveis no cadastro da música (select, pra ninguém precisar digitar).
export const KARAOKE_GENRES = [
  'Sertanejo',
  'Pop',
  'Rock',
  'MPB',
  'Pagode',
  'Samba',
  'Forró',
  'Funk',
  'Axé',
  'Gospel',
  'Romântica',
  'Internacional',
  'Infantil',
  'Eletrônica',
  'Rap / Hip-hop',
  'Reggae',
  'Country',
  'Clássica',
  'Outro',
]

export const normalizeText = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

// Busca + filtro por artista + filtro por gênero, igual na biblioteca, no seletor e no totem.
export function useSongFilters(songs) {
  const query = ref('')
  const artist = ref('')
  const genre = ref('')

  const artists = computed(() => {
    const names = new Map()
    for (const song of songs.value) {
      const name = (song.artist || '').trim()
      if (name) names.set(normalizeText(name), name)
    }
    return [...names.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  })

  // só os gêneros que existem nas músicas, na ordem da lista padrão
  const genres = computed(() => {
    const used = new Set(songs.value.map((song) => song.genre).filter(Boolean))
    const known = KARAOKE_GENRES.filter((g) => used.has(g))
    const custom = [...used].filter((g) => !KARAOKE_GENRES.includes(g)).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return [...known, ...custom]
  })

  const filtered = computed(() => {
    const q = normalizeText(query.value)
    const a = normalizeText(artist.value)
    return songs.value.filter((song) => {
      if (genre.value && song.genre !== genre.value) return false
      if (a && normalizeText(song.artist) !== a) return false
      if (q && !normalizeText(`${song.title} ${song.artist} ${song.genre}`).includes(q)) return false
      return true
    })
  })

  const active = computed(() => Boolean(query.value.trim() || artist.value || genre.value))

  function clear() {
    query.value = ''
    artist.value = ''
    genre.value = ''
  }

  return { query, artist, genre, artists, genres, filtered, active, clear }
}
