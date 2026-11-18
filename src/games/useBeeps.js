// Bips curtos gerados pelo navegador (Web Audio): sem atraso de carregar arquivo, ideal pra jogos
// de reflexo. Respeita a opção de som do jogo.
export function useBeeps(enabledRef) {
  let ctx = null

  function beep(freq, duration = 0.12, { type = 'sine', delay = 0, volume = 0.35 } = {}) {
    if (!enabledRef.value) return
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
      if (ctx.state === 'suspended') ctx.resume()
      const t0 = ctx.currentTime + delay
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t0)
      gain.gain.setValueAtTime(volume, t0)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + duration + 0.02)
    } catch (err) {
      // sem áudio: o jogo segue normal
    }
  }

  return { beep }
}
