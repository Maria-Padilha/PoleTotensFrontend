import { ref } from 'vue'

// Microfone do karaokê: mede a voz (pra nota) e grava (pro replay).
//
// A nota não compara com a melodia original (não existe faixa de referência
// pra isso) — ela mede se a pessoa está CANTANDO durante cada linha da letra
// e se ENTROU NA HORA. Uma frame de áudio conta como "voz" quando tem volume
// acima do ruído do ambiente E é periódica (som tonal, tipo voz cantada) —
// bater palma ou barulho de fundo não passa nessa checagem.

const FRAME_MS = 50
const MIN_PITCH_HZ = 80
const MAX_PITCH_HZ = 1000
const MIN_CLARITY = 0.45

// Janela de avaliação de cada linha, deslocada um pouquinho porque a pessoa
// naturalmente entra um instante depois do tempo marcado na letra.
const WINDOW_START_OFFSET = 0.15
const WINDOW_END_OFFSET = 0.35

// Quanto da linha precisa ter voz pra valer nota cheia (ninguém canta 100% do
// tempo — respira, faz pausa).
const FULL_COVERAGE = 0.65

// A gravação sai com a voz amplificada (um <audio> não passa de volume 1, então
// o ganho tem que ser aplicado na própria gravação). O compressor evita estourar
// quando a pessoa canta alto.
const RECORDING_GAIN = 2.5

// estimativa do atraso do caminho microfone → compressor → codificador (ms)
const RECORDER_PIPELINE_MS = 50

const RECORDER_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

function rootMeanSquare(buffer) {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
  return Math.sqrt(sum / buffer.length)
}

// Autocorrelação normalizada: devolve o quão "periódico" é o trecho (0..1) —
// voz/instrumento tonal dá perto de 1, ruído dá perto de 0.
function periodicity(buffer, sampleRate) {
  const size = 1024
  const minLag = Math.floor(sampleRate / MAX_PITCH_HZ)
  const maxLag = Math.min(Math.floor(sampleRate / MIN_PITCH_HZ), buffer.length - size)
  if (maxLag <= minLag) return 0

  let energy = 0
  for (let i = 0; i < size; i++) energy += buffer[i] * buffer[i]
  if (energy === 0) return 0

  let best = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0
    let shifted = 0
    for (let i = 0; i < size; i++) {
      const v = buffer[i + lag]
      corr += buffer[i] * v
      shifted += v * v
    }
    const normalized = corr / Math.sqrt(energy * shifted || 1)
    if (normalized > best) best = normalized
  }
  return best
}

export function useKaraokeVoice() {
  const level = ref(0)
  const micError = ref('')

  let stream = null
  let audioCtx = null
  let analyser = null
  let source = null
  let recordingDestination = null
  let timeBuffer = null
  let sampleTimer = null
  let recorder = null
  let recordedChunks = []
  let recordingStartedAt = null
  let noiseFloor = 0.012
  let frames = []

  async function openMic() {
    micError.value = ''
    if (!navigator.mediaDevices?.getUserMedia) {
      micError.value = 'Este navegador não permite usar o microfone (precisa de HTTPS ou localhost).'
      return false
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      })
    } catch (err) {
      micError.value =
        err?.name === 'NotFoundError'
          ? 'Nenhum microfone encontrado.'
          : 'Permissão do microfone negada. Libere o microfone no navegador e tente de novo.'
      return false
    }

    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    timeBuffer = new Float32Array(analyser.fftSize)

    const gain = audioCtx.createGain()
    gain.gain.value = RECORDING_GAIN
    const compressor = audioCtx.createDynamicsCompressor()
    recordingDestination = audioCtx.createMediaStreamDestination()
    source.connect(gain)
    gain.connect(compressor)
    compressor.connect(recordingDestination)
    return true
  }

  // Mede o ruído do ambiente (sala em silêncio, música ainda parada) pra
  // calibrar o que conta como "voz" naquele lugar.
  async function calibrate(ms = 1500) {
    const readings = []
    const started = performance.now()
    while (performance.now() - started < ms) {
      analyser.getFloatTimeDomainData(timeBuffer)
      readings.push(rootMeanSquare(timeBuffer))
      level.value = Math.min(1, readings[readings.length - 1] * 12)
      await new Promise((resolve) => setTimeout(resolve, FRAME_MS))
    }
    readings.sort((a, b) => a - b)
    const typical = readings[Math.floor(readings.length * 0.9)] || 0
    noiseFloor = Math.max(0.012, typical * 2.5)
  }

  // `getTime` devolve o segundo atual da música — cada medição é carimbada
  // com ele pra ser comparada com o tempo de cada linha da letra.
  function start(getTime) {
    frames = []
    recordedChunks = []

    const mimeType = RECORDER_TYPES.find((type) => window.MediaRecorder?.isTypeSupported?.(type))
    try {
      recorder = new MediaRecorder(recordingDestination?.stream || stream, mimeType ? { mimeType } : undefined)
      recorder.ondataavailable = (e) => {
        if (e.data?.size) recordedChunks.push(e.data)
      }
      recordingStartedAt = performance.now()
      // o evento 'start' marca o instante em que a gravação realmente começou
      recorder.onstart = () => {
        recordingStartedAt = performance.now()
      }
      recorder.start(1000)
    } catch (err) {
      recorder = null
    }

    sampleTimer = setInterval(() => {
      analyser.getFloatTimeDomainData(timeBuffer)
      const rms = rootMeanSquare(timeBuffer)
      level.value = Math.min(1, rms * 12)

      const loud = rms > noiseFloor
      const voiced = loud && periodicity(timeBuffer, audioCtx.sampleRate) > MIN_CLARITY
      frames.push({ t: getTime(), voiced })
    }, FRAME_MS)
  }

  function stopSampling() {
    if (sampleTimer) clearInterval(sampleTimer)
    sampleTimer = null
    level.value = 0
  }

  function stopRecording() {
    return new Promise((resolve) => {
      if (!recorder || recorder.state === 'inactive') {
        resolve(recordedChunks.length ? new Blob(recordedChunks, { type: recorder?.mimeType || 'audio/webm' }) : null)
        return
      }
      recorder.onstop = () => {
        resolve(recordedChunks.length ? new Blob(recordedChunks, { type: recorder.mimeType || 'audio/webm' }) : null)
      }
      recorder.stop()
    })
  }

  function scoreLines(lines) {
    const scored = lines.filter((line) => line.text)
    let weightedSum = 0
    let totalWeight = 0
    const perLine = []

    for (const line of scored) {
      const from = line.time + WINDOW_START_OFFSET
      const to = line.end + WINDOW_END_OFFSET
      const inWindow = frames.filter((f) => f.t >= from && f.t < to)
      const voicedFrames = inWindow.filter((f) => f.voiced)

      const coverage = inWindow.length ? voicedFrames.length / inWindow.length : 0
      const coverageScore = Math.min(1, coverage / FULL_COVERAGE)

      // Sincronia: a primeira voz da linha tem que vir perto do início dela.
      // Até 0.6s depois = cheio, cai linearmente até 0 aos 2.5s de atraso.
      let timingScore = 0
      if (voicedFrames.length) {
        const lateness = voicedFrames[0].t - line.time
        timingScore = lateness <= 0.6 ? 1 : Math.max(0, 1 - (lateness - 0.6) / 1.9)
      }

      const lineScore = coverageScore * 0.75 + timingScore * 0.25 * (coverageScore > 0 ? 1 : 0)
      const weight = Math.min(8, Math.max(1, line.end - line.time))
      weightedSum += lineScore * weight
      totalWeight += weight
      perLine.push(lineScore)
    }

    const score = totalWeight ? Math.round((weightedSum / totalWeight) * 1000) : 0
    return { score, perLine }
  }

  async function finish(lines) {
    stopSampling()
    const result = scoreLines(lines)
    const recording = await stopRecording()
    return { ...result, recording }
  }

  function close() {
    stopSampling()
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch (err) {
        // já parado
      }
    }
    recorder = null
    if (source) source.disconnect()
    if (stream) stream.getTracks().forEach((track) => track.stop())
    if (audioCtx && audioCtx.state !== 'closed') audioCtx.close()
    stream = null
    audioCtx = null
    analyser = null
    source = null
    recordingDestination = null
  }

  // Quanto (ms) a voz gravada chega atrasada em relação à música. Somam:
  //  - o intervalo entre o início da gravação e o início da música;
  //  - o atraso do som sair da caixa (o cantor canta no que OUVE, que é depois do play) e o do
  //    microfone entregar o áudio, ambos informados pelo navegador quando disponíveis;
  //  - uma estimativa do processamento da gravação (compressor + codificador).
  // O replay atrasa a música nessa medida e as duas faixas ficam alinhadas como na hora de cantar.
  function recordingOffsetMs(musicStartedAt) {
    if (recordingStartedAt === null || !Number.isFinite(musicStartedAt)) return null
    const inputLatency = (stream?.getAudioTracks?.()[0]?.getSettings?.().latency || 0) * 1000
    const outputLatency = ((audioCtx?.outputLatency || 0) + (audioCtx?.baseLatency || 0)) * 1000
    const offset = musicStartedAt - recordingStartedAt + inputLatency + outputLatency + RECORDER_PIPELINE_MS
    return Math.round(Math.max(-2000, Math.min(2000, offset)))
  }

  return { level, micError, openMic, calibrate, start, finish, close, recordingOffsetMs }
}
