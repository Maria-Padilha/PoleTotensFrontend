import cronometroSrc from '@/assets/audios/cronometro.mp3'
import erroSrc from '@/assets/audios/erro.mp3'
import perguntaCertaSrc from '@/assets/audios/pergunta-certa.mp3'
import perguntaErradaSrc from '@/assets/audios/pergunta-errada.mp3'
import sucessoSrc from '@/assets/audios/sucesso.mp3'
import roletaSrc from '@/assets/audios/roleta.mp3'

// Nota: navegadores bloqueiam áudio antes do primeiro gesto do usuário; o
// cronômetro só passa a tocar de verdade depois do primeiro clique numa
// alternativa (ou do "Toque para começar").
export function useGameSounds(enabledRef) {
  function playOnce(src, volume = 0.5) {
    if (!enabledRef.value) return
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
  }

  function playCorrect() {
    playOnce(perguntaCertaSrc)
  }

  function playIncorrect() {
    playOnce(perguntaErradaSrc, 1)
  }

  function playWin() {
    playOnce(sucessoSrc)
  }

  function playLose() {
    playOnce(erroSrc)
  }

  // Sem áudio dedicado a "neutro" no acervo — reaproveita o ding mais leve
  // (pergunta-certa) em vez do fanfarrão de vitória (sucesso), já que um
  // resultado neutro não é uma comemoração.
  function playNeutral() {
    playOnce(perguntaCertaSrc, 0.6)
  }

  // Loop genérico: toca um áudio em repetição enquanto durar uma ação (o
  // cronômetro contando ou a roleta girando). Em vez de deixar o áudio
  // chegar até o fim natural (que pode ter uma cauda/fade estranho pra
  // repetir), reinicia 1s ANTES do fim pra manter o loop soando contínuo —
  // pedido explícito do usuário.
  function createLoopPlayer(src, volume) {
    let audio = null
    let handler = null

    function stop() {
      if (audio) {
        audio.removeEventListener('timeupdate', handler)
        audio.pause()
        audio.currentTime = 0
      }
      audio = null
      handler = null
    }

    function start() {
      stop()
      if (!enabledRef.value) return

      audio = new Audio(src)
      handler = () => {
        if (audio.duration && audio.duration - audio.currentTime <= 1) {
          audio.currentTime = 0
        }
      }
      audio.addEventListener('timeupdate', handler)
      audio.volume = volume
      audio.play().catch(() => {})
    }

    return { start, stop }
  }

  // A roleta toca uma vez só, sem repetir — deixa o áudio correr até o fim
  // natural, só permite interromper (`stop`) se a rodinha parar antes disso.
  function createOncePlayer(src, volume) {
    let audio = null

    function stop() {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      audio = null
    }

    function start() {
      stop()
      if (!enabledRef.value) return
      audio = new Audio(src)
      audio.volume = volume
      audio.play().catch(() => {})
    }

    return { start, stop }
  }

  const countdownLoop = createLoopPlayer(cronometroSrc, 0.5)
  const spinPlayer = createOncePlayer(roletaSrc, 0.5)

  return {
    playCorrect,
    playIncorrect,
    playWin,
    playLose,
    playNeutral,
    startCountdown: countdownLoop.start,
    stopCountdown: countdownLoop.stop,
    startSpin: spinPlayer.start,
    stopSpin: spinPlayer.stop,
  }
}
