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
