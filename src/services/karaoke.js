import api from '@/services/api'

// A gravação sobe depois da jogada já salva (com a nota); o recordingToken
// vem na resposta da criação da jogada e autoriza o envio.
export async function uploadKaraokeRecording(publicToken, playId, recordingToken, blob) {
  const formData = new FormData()
  formData.append('file', blob, 'apresentacao.webm')
  formData.append('recording_token', recordingToken)

  await api.post(`/play/${publicToken}/plays/${playId}/recording`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function fetchKaraokeLibrary() {
  const { data } = await api.get('/karaoke-songs')
  return data.data
}

export async function deleteKaraokeLibrarySong(id) {
  await api.delete(`/karaoke-songs/${id}`)
}

export async function saveKaraokeLibrarySong(song) {
  const payload = {
    title: song.title,
    artist: song.artist || null,
    genre: song.genre || null,
    audio_url: song.audio_url,
    lyrics: song.lyrics || null,
    color: song.color || null,
    offset: Number(song.offset) || 0,
  }
  const { data } = song.id ? await api.put(`/karaoke-songs/${song.id}`, payload) : await api.post('/karaoke-songs', payload)
  return data.data
}

// Importa pra biblioteca as músicas que já estão nos jogos de karaokê dos eventos.
export async function importKaraokeSongsFromGames() {
  const { data } = await api.post('/karaoke-songs/import')
  return data // { found, created }
}
