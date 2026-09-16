import cronometroSrc from '@/assets/audios/cronometro.mp3'
import erroSrc from '@/assets/audios/erro.mp3'
import perguntaCertaSrc from '@/assets/audios/pergunta-certa.mp3'
import perguntaErradaSrc from '@/assets/audios/pergunta-errada.mp3'
import sucessoSrc from '@/assets/audios/sucesso.mp3'

// Nota: navegadores bloqueiam áudio antes do primeiro gesto do usuário; o
// cronômetro só passa a tocar de verdade depois do primeiro clique numa
// alternativa (ou do "Toque para começar").
export function useGameSounds(enabledRef) {
  function playOnce(src) {
    if (!enabledRef.value) return
    const audio = new Audio(src)
    audio.play().catch(() => {})
  }

  function playCorrect() {
    playOnce(perguntaCertaSrc)
  }

  function playIncorrect() {
    playOnce(perguntaErradaSrc)
  }

  function playWin() {
    playOnce(sucessoSrc)
  }

  function playLose() {
    playOnce(erroSrc)
  }

  // Cronômetro: toca em loop pela duração do tempo restante da pergunta. Em
  // vez de deixar o áudio chegar até o fim natural (que pode ter uma cauda/
  // fade estranho pra repetir), reinicia 1s ANTES do fim pra manter o loop
  // soando contínuo — pedido explícito do usuário.
  let countdownAudio = null
  let countdownHandler = null

  function stopCountdown() {
    if (countdownAudio) {
      countdownAudio.removeEventListener('timeupdate', countdownHandler)
      countdownAudio.pause()
      countdownAudio.currentTime = 0
    }
    countdownAudio = null
    countdownHandler = null
  }

  function startCountdown() {
    stopCountdown()
    if (!enabledRef.value) return

    const audio = new Audio(cronometroSrc)
    countdownHandler = () => {
      if (audio.duration && audio.duration - audio.currentTime <= 1) {
        audio.currentTime = 0
      }
    }
    audio.addEventListener('timeupdate', countdownHandler)
    audio.play().catch(() => {})
    countdownAudio = audio
  }

  return { playCorrect, playIncorrect, playWin, playLose, startCountdown, stopCountdown }
}
