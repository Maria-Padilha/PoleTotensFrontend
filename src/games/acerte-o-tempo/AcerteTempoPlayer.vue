<template>
  <div class="game-typo relative min-h-screen overflow-hidden" :style="containerStyle">
    <img
      v-if="config.logo_url"
      :src="config.logo_url"
      alt="Logo"
      class="absolute left-6 top-6 z-10 h-14 object-contain sm:left-10 sm:top-10 sm:h-20"
    />

    <!-- tela inicial -->
    <div
      v-if="phase === 'start'"
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      :style="phasePadding"
    >
      <div
        v-if="!config.logo_url && startIconComponent"
        class="mb-10 flex h-36 w-36 items-center justify-center rounded-full shadow-lg sm:h-48 sm:w-48"
        :class="isDarkTheme ? 'border border-white/10 bg-primary-900/70' : 'bg-white/90'"
      >
        <component :is="startIconComponent" :size="100" :style="{ color: accentColor }" />
      </div>

      <h1 class="font-elegant text-7xl font-light leading-[1.05] tracking-tight sm:text-9xl" :style="hudTextStyle">
        <HighlightedText :text="title" :color="accentColor" />
      </h1>
      <h2
        v-if="config.headline"
        class="font-elegant mt-2 text-6xl font-bold leading-[1.05] tracking-tight sm:text-8xl"
        :style="hudTextStyle"
      >
        <HighlightedText :text="config.headline" :color="accentColor" />
      </h2>
      <p v-if="config.subtitle" class="font-elegant mt-5 w-[70%] text-3xl italic tracking-wide sm:text-5xl" :style="hudSubTextStyle">
        <HighlightedText :text="config.subtitle" :color="accentColor" />
      </p>

      <button
        class="mt-9 rounded-2xl border px-16 py-8 text-3xl font-bold tracking-wide text-white transition-transform active:scale-95 sm:text-4xl"
        :style="buttonStyle"
        @click="prepare"
      >
        <HighlightedText :text="startButtonText" variant="underline" />
      </button>
      <p class="mt-5 flex items-center gap-2 text-base opacity-60 sm:text-lg" :style="hudSubTextStyle">
        <MousePointerClick :size="18" class="shrink-0" />
        <HighlightedText :text="hintText" :color="accentColor" />
      </p>
      <button
        v-if="publicToken"
        class="mt-8 inline-flex items-center gap-3 rounded-2xl border-2 px-10 py-5 text-2xl font-bold transition-transform active:scale-95 sm:text-3xl"
        :style="outlineButtonStyle"
        @click="openRanking(false)"
      >
        <Trophy :size="28" /> Ver ranking
      </button>
    </div>

    <!-- preparar / rodando -->
    <div
      v-else-if="phase === 'ready' || phase === 'running' || phase === 'frozen'"
      class="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-20 sm:py-12"
      :style="phasePadding"
    >
      <!-- NA MOSCA: ondas, confete e título dourado -->
      <div v-if="phase === 'frozen' && bullseye" class="bull-layer pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
        <span class="bull-flash" />
        <span v-for="n in 3" :key="n" class="bull-ring" :style="{ animationDelay: `${(n - 1) * 280}ms` }" />
        <i v-for="(c, i) in confetti" :key="i" class="bull-piece" :style="c" />
        <div class="bull-title">
          <span class="bull-title__kicker">★ PRECISÃO PERFEITA ★</span>
          <span class="bull-title__main">NA MOSCA!</span>
        </div>
      </div>

      <GameHud :icon="Timer" label="Acerte o tempo" :accent-color="accentColor" :dark="isDarkTheme">
        <div class="flex items-center gap-3 rounded-full border-[1.5px] px-6 py-3 backdrop-blur" :style="chipStyle">
          <Target :size="24" :style="{ color: accentColor }" class="shrink-0" />
          <span class="text-sm font-semibold opacity-70 sm:text-lg">Alvo</span>
          <span class="text-2xl font-extrabold tabular-nums sm:text-3xl">{{ fmt(target) }} s</span>
        </div>
      </GameHud>

      <div class="flex flex-1 flex-col items-center justify-center py-6">
        <p class="text-xs font-bold uppercase tracking-[0.3em] opacity-70 sm:text-lg" :style="hudSubTextStyle">
          {{ phase === 'ready' ? 'Pare o cronômetro exatamente em' : phase === 'frozen' ? 'O alvo era' : 'Pare em' }}
        </p>
        <p class="font-elegant mt-3 text-8xl font-bold leading-none sm:text-[10rem]" :style="{ color: accentColor }">
          {{ fmt(target) }}<span class="ml-3 text-4xl opacity-70 sm:text-6xl">s</span>
        </p>

        <!-- anel de progresso + cronômetro -->
        <div class="relative mt-10 flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
          <svg viewBox="0 0 120 120" class="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" :stroke="isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(43,43,43,0.12)'" stroke-width="7" />
            <!-- cronômetro escondido: arco girando em velocidade constante (não revela o tempo) -->
            <g v-if="clockHidden" class="hidden-orbit">
              <circle cx="60" cy="60" r="54" fill="none" :stroke="accentColor" stroke-width="7" stroke-linecap="round" stroke-dasharray="70 270" />
            </g>
            <circle
              v-else
              cx="60"
              cy="60"
              r="54"
              fill="none"
              :stroke="accentColor"
              stroke-width="7"
              stroke-linecap="round"
              :stroke-dasharray="RING"
              :stroke-dashoffset="RING * (1 - ringProgress)"
              :opacity="clockHidden ? 0.25 : 1"
            />
          </svg>
          <div v-if="clockHidden" class="relative flex flex-col items-center gap-3 px-8">
            <span class="hidden-icon flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28" :style="{ backgroundColor: `${accentColor}22`, color: accentColor }">
              <EyeOff :size="52" />
            </span>
            <span class="text-lg font-bold uppercase tracking-[0.25em] sm:text-2xl" :style="hudSubTextStyle">Tempo oculto</span>
          </div>
          <span
            v-else
            class="font-elegant relative text-7xl font-bold tabular-nums sm:text-8xl"
            :class="phase === 'frozen' ? (bullseye ? 'bull-clock' : 'frozen-pulse') : ''"
            :style="phase === 'frozen' ? { color: bullseye ? '#f4b400' : accentColor } : hudTextStyle"
          >
            {{ fmt(elapsed) }}
          </span>
        </div>
        <p v-if="clockHidden" class="mt-4 text-xl font-semibold sm:text-2xl" :style="hudSubTextStyle">Confie no seu relógio interno!</p>

        <button
          v-if="phase === 'ready'"
          class="mt-12 inline-flex items-center gap-4 rounded-3xl px-20 py-10 text-4xl font-extrabold text-white shadow-xl transition-transform active:scale-95 sm:text-5xl"
          :style="{ backgroundColor: accentColor }"
          @click="begin"
        >
          <Play :size="44" /> COMEÇAR
        </button>
        <p v-else-if="phase === 'frozen'" class="font-elegant mt-12 text-5xl font-bold sm:text-7xl" :style="{ color: bullseye ? '#f4b400' : accentColor }">
          {{ fmt(elapsed) }} s
        </p>
        <button
          v-else
          class="mt-12 inline-flex items-center gap-4 rounded-3xl bg-red-500 px-20 py-10 text-4xl font-extrabold text-white shadow-xl transition-transform active:scale-95 sm:text-5xl"
          @pointerdown.prevent="stop"
        >
          <Square :size="44" /> PARAR
        </button>
      </div>
    </div>

    <!-- ranking (mesmo visual do ranking do totem) -->
    <div v-else-if="phase === 'ranking'" class="relative z-10 h-screen" :style="phasePadding">
      <p v-if="rankingLoading && !ranking.length" class="pt-40 text-center text-3xl" :style="hudSubTextStyle">Carregando…</p>
      <p v-else-if="!ranking.length" class="pt-40 text-center text-3xl" :style="hudSubTextStyle">Ninguém jogou ainda.</p>
      <RankingBoard
        v-else
        manual
        transparent
        :slide="rankingSlide"
        :tone="isDarkTheme ? 'dark' : 'light'"
        :accent-color="accentColor"
        :highlight-id="highlightId"
      />
      <button
        class="absolute bottom-8 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 px-12 py-6 text-2xl font-bold backdrop-blur transition-transform active:scale-95 sm:text-3xl"
        :style="outlineButtonStyle"
        @click="phase = rankingFrom"
      >
        <Home :size="28" /> Voltar
      </button>
    </div>

    <!-- resultado -->
    <div v-else class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center" :style="phasePadding">
      <div
        class="relative w-full max-w-2xl rounded-[2.5rem] p-10 pt-14 shadow-2xl backdrop-blur sm:p-12 sm:pt-16"
        :class="[cardSurfaceClass, bullseye ? 'bull-card' : '']"
      >
        <div
          class="absolute -top-9 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full shadow-md"
          :class="cardSurfaceClass"
        >
          <Trophy :size="36" :style="{ color: accentColor }" />
        </div>

        <p class="text-xs font-bold uppercase tracking-[0.3em] sm:text-sm" :class="cardMutedClass">Seu resultado</p>

        <div class="mt-5 grid grid-cols-2 gap-4">
          <div class="rounded-2xl p-4" :class="isDarkTheme ? 'bg-white/10' : 'bg-black/5'">
            <p class="text-sm font-semibold uppercase" :class="cardMutedClass">Tempo sorteado</p>
            <p class="font-elegant mt-1 text-5xl font-bold tabular-nums sm:text-6xl" :class="cardTextClass">{{ fmt(result.target) }}<small class="text-2xl"> s</small></p>
          </div>
          <div class="rounded-2xl p-4" :class="isDarkTheme ? 'bg-white/10' : 'bg-black/5'">
            <p class="text-sm font-semibold uppercase" :class="cardMutedClass">Você parou em</p>
            <p class="font-elegant mt-1 text-5xl font-bold tabular-nums sm:text-6xl" :style="{ color: accentColor }">{{ fmt(result.stopped) }}<small class="text-2xl"> s</small></p>
          </div>
        </div>

        <!-- trilha: alvo x onde parou -->
        <div class="relative mx-auto mt-8 h-3 w-full rounded-full" :style="{ backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.18)' : 'rgba(43,43,43,0.12)' }">
          <span class="absolute top-1/2 h-8 w-1.5 -translate-y-1/2 rounded bg-green-500" :style="{ left: `${trackTarget}%` }" />
          <span
            class="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow"
            :style="{ left: `${trackStopped}%`, backgroundColor: accentColor }"
          />
        </div>

        <p class="font-elegant mt-8 text-4xl font-bold sm:text-5xl" :style="{ color: accentColor }">
          <span v-if="bullseye" class="bull-gold">NA MOSCA! ★</span>
          <template v-else>{{ result.stopped > result.target ? 'Passou' : 'Faltou' }} {{ fmt(result.diff) }} s</template>
        </p>
        <p class="mt-2 text-xl" :class="cardMuted2Class">{{ result.score }} pontos</p>
      </div>

      <p class="font-elegant mt-10 w-[80%] text-4xl font-bold sm:text-5xl" :style="hudTextStyle">
        <HighlightedText :text="resultMessage" :color="accentColor" />
      </p>

      <div class="mt-10 flex w-full max-w-xl flex-col items-stretch gap-5">
        <button
          class="inline-flex items-center justify-center gap-4 rounded-2xl px-14 py-8 text-3xl font-extrabold text-white shadow-xl transition-transform active:scale-[0.98] sm:text-4xl"
          :style="{ backgroundColor: accentColor }"
          @click="restart"
        >
          <RotateCcw :size="36" /> Jogar novamente
        </button>
        <button
          v-if="publicToken"
          class="inline-flex items-center justify-center gap-4 rounded-2xl border-2 px-14 py-6 text-2xl font-extrabold shadow-lg transition-transform active:scale-[0.98] sm:text-3xl"
          :style="outlineButtonStyle"
          @click="openRanking(true)"
        >
          <Trophy :size="30" /> Ver ranking
        </button>
        <button
          class="inline-flex items-center justify-center gap-4 rounded-2xl border-2 px-14 py-6 text-2xl font-extrabold shadow-lg transition-transform active:scale-[0.98] sm:text-3xl"
          :style="outlineButtonStyle"
          @click="backToStart"
        >
          <Home :size="30" /> Voltar ao início
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { Timer, Target, EyeOff, Play, Square, Trophy, RotateCcw, Home, MousePointerClick } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import GameHud from '@/components/GameHud.vue'
import RankingBoard from '@/components/RankingBoard.vue'
import api from '@/services/api'
import { useGameTheme } from '@/composables/useGameTheme'
import { useGameSounds } from '@/composables/useGameSounds'

const props = defineProps({
  title: { type: String, default: 'Acerte o Tempo' },
  config: { type: Object, default: () => ({}) },
  topInset: { type: Number, default: 0 },
  // sem token (preview do painel) não existe ranking
  publicToken: { type: String, default: '' },
})

const emit = defineEmits(['finished', 'restarted', 'back-to-start', 'busy'])

const phasePadding = computed(() => ({ paddingTop: `${props.topInset}px` }))

const {
  accentColor,
  soundEnabled,
  isDarkTheme,
  hudTextStyle,
  hudSubTextStyle,
  cardSurfaceClass,
  cardTextClass,
  cardMutedClass,
  cardMuted2Class,
  containerStyle,
  startButtonText,
  startIconComponent,
  buttonStyle,
  outlineButtonStyle,
} = useGameTheme(props)

const { playWin, playLose, playCorrect } = useGameSounds(soundEnabled)

// a dica padrão do tema é de quiz; aqui explica o jogo
const hintText = computed(() => props.config?.start_hint || 'Pare o cronômetro no tempo sorteado')

const RING = 2 * Math.PI * 54
const MAX_SCORE = 1000
// o cronômetro tem sempre 5 s de escala (anel e trilha), não importa o alvo sorteado.
// Ele ainda corre até 5,5 s antes de travar, pra um alvo de 5 s poder ser ultrapassado.
const CLOCK_SECONDS = 5
const MAX_RUN = 5.5
const MIN_TARGET = 0.1
const MAX_TARGET = 5

// bips curtos (Web Audio: sem atraso, ao contrário de carregar um mp3 a cada toque)
let audioCtx = null
function beep(freq, duration = 0.12, { type = 'sine', delay = 0, volume = 0.35 } = {}) {
  if (!soundEnabled.value) return
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const t0 = audioCtx.currentTime + delay
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(volume, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  } catch (err) {
    // sem áudio: o jogo segue normal
  }
}
function soundStart() {
  beep(660, 0.1, { type: 'triangle' })
  beep(990, 0.18, { type: 'triangle', delay: 0.1 })
}
function soundBullseye() {
  // arpejo ascendente, bem comemorativo
  ;[523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.28, { type: 'triangle', delay: 0.25 + i * 0.09, volume: 0.32 }))
  beep(1568, 0.7, { type: 'sine', delay: 0.75, volume: 0.28 })
}
function soundStop() {
  beep(220, 0.22, { type: 'square', volume: 0.3 })
  beep(110, 0.3, { type: 'sine', volume: 0.5 })
}
const FREEZE_MS = 2200
const BULLSEYE_FREEZE_MS = 3600
const confetti = ref([])

function makeConfetti() {
  const colors = ['#f4b400', '#ffd666', '#ffffff', '#ff6b6b', '#4ade80', '#38bdf8', '#c084fc']
  return Array.from({ length: 44 }, (_, i) => {
    const angle = (i / 44) * Math.PI * 2 + Math.random() * 0.4
    const dist = 220 + Math.random() * 420
    return {
      '--dx': `${Math.cos(angle) * dist}px`,
      '--dy': `${Math.sin(angle) * dist - 80}px`,
      '--rot': `${Math.round(Math.random() * 900 - 450)}deg`,
      width: `${8 + Math.random() * 10}px`,
      height: `${14 + Math.random() * 12}px`,
      backgroundColor: colors[i % colors.length],
      animationDelay: `${Math.round(Math.random() * 250)}ms`,
    }
  })
}
let freezeTimer = null

const settings = computed(() => {
  const t = props.config?.timing || {}
  const min = Math.max(MIN_TARGET, Number(t.min_seconds) > 0 ? Number(t.min_seconds) : MIN_TARGET)
  const cappedMin = Math.min(min, MAX_TARGET)
  const max = Math.min(MAX_TARGET, Number(t.max_seconds) >= cappedMin ? Number(t.max_seconds) : MAX_TARGET)
  return {
    min: cappedMin,
    max,
    hideClock: Boolean(t.hide_clock),
    hideAfter: Number.isFinite(Number(t.hide_after)) ? Number(t.hide_after) : 2,
  }
})

const phase = ref('start') // start | ready | running | result | ranking
const target = ref(0)
const elapsed = ref(0)
const result = ref({ target: 0, stopped: 0, diff: 0, score: 0 })
const ranking = ref([])
const rankingFrom = ref('start')

// linhas do ranking no mesmo formato do ranking do totem (empate na diferença divide a posição)
const rankingSlide = computed(() => {
  let position = 0
  const rows = ranking.value.map((row, i) => {
    if (i === 0 || row.diff !== ranking.value[i - 1].diff) position = i + 1
    return {
      id: row.id,
      position,
      name: row.name,
      score: row.diff,
      scoreText: `± ${fmt(row.diff)} s`,
      song: `${fmt(row.target)} → ${fmt(row.stopped)} s`,
    }
  })
  return {
    eyebrow: 'Ranking',
    title: 'Quem chegou mais perto',
    subtitle: 'Diferença entre o tempo sorteado e onde parou',
    showSong: true,
    detailLabel: 'Alvo → parou',
    scoreLabel: 'Diferença',
    rows,
  }
})

// a jogada que acabou de ser feita (só destaca quando o ranking foi aberto pela tela de resultado)
const highlightId = computed(() => {
  if (rankingFrom.value !== 'result') return null
  const r = result.value
  return ranking.value.find((x) => x.target === r.target && x.stopped === r.stopped && x.diff === r.diff)?.id ?? null
})
const rankingLoading = ref(false)
let startedAt = 0
let rafId = null

const chipStyle = computed(() =>
  isDarkTheme.value
    ? { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.26)', color: '#ffffff' }
    : { backgroundColor: 'rgba(255,255,255,0.82)', borderColor: 'rgba(255,255,255,0.95)', color: '#2b2b2b' }
)

// 1,15 (vírgula, duas casas)
function fmt(n) {
  return Number(n || 0).toFixed(2).replace('.', ',')
}

function drawTarget() {
  const { min, max } = settings.value
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

const clockHidden = computed(() => phase.value === 'running' && settings.value.hideClock && elapsed.value >= settings.value.hideAfter)
const bullseye = computed(() => result.value.diff === 0 && result.value.stopped > 0)
const ringProgress = computed(() => Math.min(1, elapsed.value / CLOCK_SECONDS))

// posição na trilha: eescala fixa (0 a 5,5 s)
const trackMax = computed(() => MAX_RUN)
const trackTarget = computed(() => (result.value.target / trackMax.value) * 100)
const trackStopped = computed(() => Math.min(100, (result.value.stopped / trackMax.value) * 100))

const resultMessage = computed(() => {
  const d = result.value.diff
  if (d === 0) return 'Perfeito! Relógio suíço!'
  if (d <= 0.05) return 'Incrível, pertinho demais!'
  if (d <= 0.15) return 'Muito bom! Quase cravou.'
  if (d <= 0.5) return 'Boa tentativa! Dá pra chegar mais perto.'
  return 'Ainda longe… bora tentar de novo?'
})

function loop() {
  elapsed.value = Math.min(MAX_RUN, (performance.now() - startedAt) / 1000)
  // trava de segurança: ninguém ficou parado pra sempre
  if (elapsed.value >= MAX_RUN) {
    soundStop()
    finish(MAX_RUN)
    return
  }
  rafId = requestAnimationFrame(loop)
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
}

function prepare() {
  target.value = drawTarget()
  elapsed.value = 0
  phase.value = 'ready'
}

function begin() {
  elapsed.value = 0
  startedAt = performance.now()
  soundStart()
  phase.value = 'running'
  rafId = requestAnimationFrame(loop)
}

// o toque conta no instante do evento, não quando o quadro seguinte é desenhado
function stop(event) {
  if (phase.value !== 'running') return
  const t = event?.timeStamp && event.timeStamp > startedAt ? event.timeStamp : performance.now()
  soundStop()
  finish((t - startedAt) / 1000)
}

function finish(seconds) {
  stopLoop()
  const stopped = Math.round(seconds * 100) / 100
  const diff = Math.round(Math.abs(stopped - target.value) * 100) / 100
  const score = Math.max(0, Math.round(MAX_SCORE - diff * 1000))
  elapsed.value = stopped
  result.value = { target: target.value, stopped, diff, score }
  // congela a tela por um instante antes de revelar o resultado (mais tempo se for na mosca)
  const perfect = diff === 0
  confetti.value = perfect ? makeConfetti() : []
  if (perfect) soundBullseye()
  phase.value = 'frozen'
  freezeTimer = setTimeout(() => {
    phase.value = 'result'
    emit('finished', { score, maxScore: MAX_SCORE, won: diff <= 0.15, timing: { target: target.value, stopped, diff } })
  }, perfect ? BULLSEYE_FREEZE_MS : FREEZE_MS)
  if (diff <= 0.15) {
    playWin()
  } else if (diff <= 0.5) {
    playCorrect()
  } else {
    playLose()
  }
}

function restart() {
  emit('restarted')
  prepare()
}

function backToStart() {
  phase.value = 'start'
  emit('back-to-start')
}

async function openRanking(fromResult = false) {
  if (!props.publicToken) return
  rankingFrom.value = fromResult ? 'result' : 'start'
  phase.value = 'ranking'
  rankingLoading.value = true
  try {
    const { data } = await api.get(`/play/${props.publicToken}/timing-ranking`)
    ranking.value = data.ranking || []
  } catch (err) {
    ranking.value = []
  } finally {
    rankingLoading.value = false
  }
}

watch(phase, (value) => {
  emit('busy', value === 'ranking' || value === 'running' || value === 'frozen')
})

onUnmounted(() => {
  stopLoop()
  if (freezeTimer) clearTimeout(freezeTimer)
})
</script>

<style scoped>
@keyframes hidden-orbit {
  to { transform: rotate(360deg); }
}
.hidden-orbit {
  transform-origin: 60px 60px;
  animation: hidden-orbit 2.4s linear infinite;
}
@keyframes hidden-icon {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.08); opacity: 1; }
}
.hidden-icon {
  animation: hidden-icon 1.6s ease-in-out infinite;
}
@keyframes frozen-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}
.frozen-pulse {
  animation: frozen-pulse 0.7s ease-in-out 2;
}

/* ---- NA MOSCA ---- */
.bull-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 214, 102, 0.75), rgba(244, 180, 0, 0.25) 40%, transparent 70%);
  animation: bull-flash 1.1s ease-out forwards;
}
@keyframes bull-flash {
  0% { opacity: 0; transform: scale(0.4); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.6); }
}
.bull-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20rem;
  height: 20rem;
  margin: -10rem 0 0 -10rem;
  border-radius: 9999px;
  border: 6px solid #f4b400;
  box-shadow: 0 0 40px 6px rgba(244, 180, 0, 0.6), inset 0 0 30px rgba(244, 180, 0, 0.4);
  opacity: 0;
  animation: bull-ring 1.6s cubic-bezier(0.1, 0.7, 0.3, 1) forwards;
}
@keyframes bull-ring {
  0% { opacity: 0.95; transform: scale(0.2); }
  100% { opacity: 0; transform: scale(4.2); }
}
.bull-piece {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 2px;
  opacity: 0;
  animation: bull-piece 2.6s cubic-bezier(0.15, 0.7, 0.3, 1) forwards;
}
@keyframes bull-piece {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.4); }
  60% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--dx), calc(var(--dy) + 260px)) rotate(var(--rot)) scale(1); }
}
.bull-title {
  position: absolute;
  left: 0;
  right: 0;
  top: 16%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-align: center;
  animation: bull-title 3.4s ease-out forwards;
}
.bull-title__kicker {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.4em;
  color: #fff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);
}
.bull-title__main {
  font-size: clamp(4.5rem, 17vw, 9rem);
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(180deg, #fff3b0 0%, #ffd23f 45%, #f4a000 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 6px 0 rgba(120, 70, 0, 0.55)) drop-shadow(0 0 28px rgba(255, 190, 40, 0.8));
}
@keyframes bull-title {
  0% { opacity: 0; transform: scale(0.2) rotate(-8deg); }
  14% { opacity: 1; transform: scale(1.25) rotate(3deg); }
  24% { transform: scale(0.94) rotate(-1deg); }
  34% { transform: scale(1) rotate(0); }
  88% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.08); }
}
.bull-clock {
  animation: bull-clock 0.5s ease-in-out infinite alternate;
  text-shadow: 0 0 30px rgba(244, 180, 0, 0.9), 0 0 60px rgba(244, 180, 0, 0.55);
}
@keyframes bull-clock {
  from { transform: scale(1); }
  to { transform: scale(1.18); }
}
.bull-card {
  box-shadow: 0 0 0 4px #f4b400, 0 0 60px 6px rgba(244, 180, 0, 0.55), 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: bull-card 0.7s cubic-bezier(0.2, 0.8, 0.3, 1.2) backwards;
}
@keyframes bull-card {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: none; opacity: 1; }
}
.bull-gold {
  display: inline-block;
  background: linear-gradient(100deg, #a35f00 0%, #d68a00 30%, #f4b400 50%, #d68a00 70%, #a35f00 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: bull-shine 2.2s linear infinite;
}
@keyframes bull-shine {
  from { background-position: 120% 0; }
  to { background-position: -120% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .bull-piece, .bull-ring, .bull-flash { animation-duration: 0.01s; }
}
</style>
