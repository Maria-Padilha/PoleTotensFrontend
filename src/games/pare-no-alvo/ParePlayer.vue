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
        @click="begin"
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

    <!-- jogando -->
    <div
      v-else-if="phase === 'playing' || phase === 'over'"
      class="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-20 sm:py-12"
      :style="phasePadding"
    >
      <GameHud :icon="Crosshair" :label="`Nível ${cleared + 1}`" :accent-color="accentColor" :dark="isDarkTheme">
        <div class="flex items-center gap-4 rounded-full border-[1.5px] px-6 py-3 backdrop-blur" :style="chipStyle">
          <span class="flex items-center gap-1.5">
            <Heart
              v-for="i in maxLives"
              :key="i"
              :size="28"
              :fill="i <= lives ? '#ef4444' : 'none'"
              :style="{ color: i <= lives ? '#ef4444' : isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(43,43,43,0.25)' }"
            />
          </span>
          <span class="text-2xl font-extrabold tabular-nums sm:text-3xl">{{ score }}</span>
        </div>
      </GameHud>

      <div class="flex flex-1 flex-col items-center justify-center py-6">
        <p class="text-xs font-bold uppercase tracking-[0.3em] opacity-70 sm:text-lg" :style="hudSubTextStyle">
          Toque para parar dentro da zona
        </p>

        <!-- pista -->
        <div class="relative mt-32 w-full max-w-5xl" :class="shake ? 'pa-shake' : ''">
          <div
            class="relative h-28 w-full overflow-hidden rounded-full border-2 shadow-xl backdrop-blur sm:h-36"
            :style="trackStyle"
          >
            <!-- zona alvo -->
            <div
              class="absolute inset-y-0 rounded-full"
              :class="flash === 'hit' ? 'pa-zone-hit' : ''"
              :style="{
                left: `${zone.left * 100}%`,
                width: `${zone.width * 100}%`,
                background: 'linear-gradient(180deg, #4ade80, #16a34a)',
                boxShadow: '0 0 28px rgba(74, 222, 128, 0.75)',
              }"
            >
              <span class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/60" />
            </div>
          </div>

          <!-- marcador: barra fina branca com um contorno sutil, pra não sumir sobre a pista clara -->
          <div
            data-marker
            class="pointer-events-none absolute inset-y-0 w-3 -translate-x-1/2 rounded-full"
            :style="{
              left: `${pos * 100}%`,
              backgroundColor: markerColor,
              border: `1.5px solid ${markerOutline}`,
              boxShadow: `0 0 14px 3px ${markerGlow}`,
            }"
          />

          <p
            v-if="feedback"
            :key="feedbackKey"
            class="pa-feedback font-elegant absolute -top-24 left-0 right-0 text-center text-5xl font-extrabold sm:text-7xl"
            :style="{ color: feedback.color }"
          >
            {{ feedback.text }}
          </p>
        </div>

        <button
          class="mt-16 inline-flex items-center gap-4 rounded-3xl px-24 py-12 text-5xl font-extrabold text-white shadow-xl transition-transform active:scale-95 sm:text-6xl"
          :style="{ backgroundColor: accentColor }"
          :disabled="phase !== 'playing'"
          @pointerdown.prevent="tap"
        >
          <Crosshair :size="52" /> PARAR
        </button>

        <p class="mt-8 text-xl font-semibold opacity-70 sm:text-2xl" :style="hudSubTextStyle">
          A zona diminui e a barra acelera a cada acerto.
        </p>
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
      <div class="relative w-full max-w-2xl rounded-[2.5rem] p-10 pt-14 shadow-2xl backdrop-blur sm:p-12 sm:pt-16" :class="cardSurfaceClass">
        <div
          class="absolute -top-9 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full shadow-md"
          :class="cardSurfaceClass"
        >
          <Trophy :size="36" :style="{ color: accentColor }" />
        </div>

        <p class="text-xs font-bold uppercase tracking-[0.3em] sm:text-sm" :class="cardMutedClass">Seu resultado</p>
        <p class="font-elegant mt-3 text-7xl font-bold sm:text-8xl" :style="{ color: accentColor }">
          {{ cleared }}<span class="ml-3 text-3xl sm:text-4xl" :class="cardMutedClass">{{ cleared === 1 ? 'nível' : 'níveis' }}</span>
        </p>

        <div class="mt-6 grid grid-cols-2 gap-4">
          <div class="rounded-2xl p-4" :class="isDarkTheme ? 'bg-white/10' : 'bg-black/5'">
            <p class="text-sm font-semibold uppercase" :class="cardMutedClass">Precisão</p>
            <p class="font-elegant mt-1 text-5xl font-bold tabular-nums" :class="cardTextClass">{{ precision }}%</p>
          </div>
          <div class="rounded-2xl p-4" :class="isDarkTheme ? 'bg-white/10' : 'bg-black/5'">
            <p class="text-sm font-semibold uppercase" :class="cardMutedClass">Pontos</p>
            <p class="font-elegant mt-1 text-5xl font-bold tabular-nums" :style="{ color: accentColor }">{{ score }}</p>
          </div>
        </div>
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
import { Crosshair, Heart, Trophy, RotateCcw, Home, MousePointerClick } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import GameHud from '@/components/GameHud.vue'
import RankingBoard from '@/components/RankingBoard.vue'
import api from '@/services/api'
import { useGameTheme } from '@/composables/useGameTheme'
import { useBeeps } from '../useBeeps'

const props = defineProps({
  title: { type: String, default: 'Pare no Alvo' },
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
  containerStyle,
  startButtonText,
  startIconComponent,
  buttonStyle,
  outlineButtonStyle,
} = useGameTheme(props)

const { beep } = useBeeps(soundEnabled)

const hintText = computed(() => props.config?.start_hint || 'Toque para parar a barra dentro da zona verde')

// ---- regras ----
const BASE_SPEED = 0.55 // pistas por segundo no nível 1
const SPEED_STEP = 0.07
const MAX_SPEED = 1.9
const START_ZONE = 0.32 // largura da zona no nível 1 (fração da pista)
const ZONE_DECAY = 0.9
const MIN_ZONE = 0.05
const HIT_POINTS = 100
const PERFECT_BONUS = 50

const settings = computed(() => {
  const z = props.config?.zone || {}
  const lives = Math.min(5, Math.max(1, Math.round(Number(z.lives) || 3)))
  const speed = Math.min(2, Math.max(0.5, Number(z.speed) || 1))
  return { lives, speed }
})
const maxLives = computed(() => settings.value.lives)

const phase = ref('start') // start | playing | over | result | ranking
const cleared = ref(0)
const lives = ref(3)
const score = ref(0)
const pos = ref(0)
const zone = ref({ left: 0.4, width: START_ZONE })
const flash = ref('')
const shake = ref(false)
const feedback = ref(null)
const feedbackKey = ref(0)
const accuracySum = ref(0)
const attempts = ref(0)
const ranking = ref([])
const rankingFrom = ref('start')

// linhas do ranking no mesmo formato do ranking do totem (mesmos níveis e pontos dividem a posição)
const rankingSlide = computed(() => {
  let position = 0
  const rows = ranking.value.map((row, i) => {
    const prev = ranking.value[i - 1]
    if (i === 0 || row.cleared !== prev.cleared || row.score !== prev.score) position = i + 1
    return {
      id: row.id,
      position,
      name: row.name,
      score: row.cleared,
      scoreText: `${row.cleared} ${row.cleared === 1 ? 'nível' : 'níveis'}`,
      song: `precisão ${row.precision}% · ${row.score} pts`,
    }
  })
  return {
    eyebrow: 'Ranking',
    title: 'Quem foi mais longe',
    subtitle: 'Níveis passados em uma tentativa',
    showSong: true,
    detailLabel: 'Precisão',
    scoreLabel: 'Níveis',
    rows,
  }
})

// a jogada que acabou de ser feita (só destaca quando o ranking foi aberto pela tela de resultado)
const highlightId = computed(() => {
  if (rankingFrom.value !== 'result') return null
  return ranking.value.find((x) => x.cleared === cleared.value && x.score === score.value && x.precision === precision.value)?.id ?? null
})
const rankingLoading = ref(false)

let dir = 1
let lastFrame = 0
let paused = false // congela a barra por um instante depois de cada toque
let rafId = null
let timers = []

const precision = computed(() => (attempts.value ? Math.round((accuracySum.value / attempts.value) * 100) : 0))

const chipStyle = computed(() =>
  isDarkTheme.value
    ? { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.26)', color: '#ffffff' }
    : { backgroundColor: 'rgba(255,255,255,0.82)', borderColor: 'rgba(255,255,255,0.95)', color: '#2b2b2b' }
)
// marcador: branco (vermelho no erro), com contorno e brilho discretos
const markerColor = computed(() => (flash.value === 'miss' ? '#ef4444' : '#ffffff'))
const markerOutline = computed(() => (flash.value === 'miss' ? '#b91c1c' : isDarkTheme.value ? 'rgba(255,255,255,0.9)' : 'rgba(55,65,81,0.55)'))
const markerGlow = computed(() => (flash.value === 'miss' ? 'rgba(239,68,68,0.8)' : isDarkTheme.value ? 'rgba(255,255,255,0.8)' : 'rgba(55,65,81,0.35)'))
const trackStyle = computed(() => ({
  backgroundColor: isDarkTheme.value ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.7)',
  borderColor: isDarkTheme.value ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.95)',
}))

const resultMessage = computed(() => {
  if (cleared.value >= 12) return 'Mira de elite! Impressionante!'
  if (cleared.value >= 8) return 'Que pontaria! Mandou muito bem.'
  if (cleared.value >= 4) return 'Muito bom! Dá pra ir ainda mais longe.'
  if (cleared.value >= 1) return 'Boa! Bora tentar passar mais níveis?'
  return 'Não foi dessa vez… tenta de novo!'
})

function later(fn, ms) {
  timers.push(setTimeout(fn, ms))
}

function speedFor(level) {
  return Math.min(MAX_SPEED, (BASE_SPEED + level * SPEED_STEP) * settings.value.speed)
}

function zoneWidthFor(level) {
  return Math.max(MIN_ZONE, START_ZONE * ZONE_DECAY ** level)
}

// nova zona: posição aleatória, longe de onde a barra está agora (pra não cair em cima)
function newZone() {
  const width = zoneWidthFor(cleared.value)
  const margin = 0.04
  let left = margin + Math.random() * (1 - width - margin * 2)
  for (let i = 0; i < 8 && Math.abs(left + width / 2 - pos.value) < 0.25; i++) {
    left = margin + Math.random() * (1 - width - margin * 2)
  }
  zone.value = { left, width }
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000)
  lastFrame = now
  if (!paused) {
    let next = pos.value + dir * speedFor(cleared.value) * dt
    if (next >= 1) {
      next = 1
      dir = -1
    } else if (next <= 0) {
      next = 0
      dir = 1
    }
    pos.value = next
  }
  rafId = requestAnimationFrame(loop)
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
}

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function showFeedback(text, color) {
  feedback.value = { text, color }
  feedbackKey.value += 1
  later(() => (feedback.value = null), 800)
}

function begin() {
  clearTimers()
  cleared.value = 0
  lives.value = settings.value.lives
  score.value = 0
  accuracySum.value = 0
  attempts.value = 0
  pos.value = 0
  dir = 1
  paused = false
  flash.value = ''
  feedback.value = null
  newZone()
  phase.value = 'playing'
  beep(660, 0.1, { type: 'triangle' })
  beep(990, 0.18, { type: 'triangle', delay: 0.1 })
  lastFrame = performance.now()
  stopLoop()
  rafId = requestAnimationFrame(loop)
}

function tap() {
  if (phase.value !== 'playing' || paused) return
  paused = true
  attempts.value += 1

  const center = zone.value.left + zone.value.width / 2
  const distance = Math.abs(pos.value - center)
  const half = zone.value.width / 2

  if (distance <= half) {
    // acerto: quanto mais perto do centro, melhor
    const accuracy = 1 - distance / half
    accuracySum.value += accuracy
    const perfect = accuracy >= 0.85
    score.value += HIT_POINTS + (perfect ? PERFECT_BONUS : 0) + Math.round(accuracy * 20)
    cleared.value += 1
    flash.value = 'hit'
    if (perfect) {
      showFeedback('PERFEITO!', '#facc15')
      ;[784, 988, 1319].forEach((f, i) => beep(f, 0.16, { type: 'triangle', delay: i * 0.07 }))
    } else {
      showFeedback('BOA!', '#4ade80')
      beep(880, 0.14, { type: 'triangle' })
      beep(1175, 0.14, { type: 'triangle', delay: 0.08 })
    }
    later(() => {
      flash.value = ''
      newZone()
      paused = false
    }, 520)
  } else {
    // erro: perde uma vida
    lives.value -= 1
    flash.value = 'miss'
    shake.value = true
    showFeedback(pos.value < center ? 'CEDO DEMAIS' : 'TARDE DEMAIS', '#ef4444')
    beep(150, 0.3, { type: 'sawtooth', volume: 0.3 })
    later(() => (shake.value = false), 420)
    if (lives.value <= 0) {
      phase.value = 'over'
      stopLoop()
      later(finish, 1400)
    } else {
      later(() => {
        flash.value = ''
        newZone()
        paused = false
      }, 700)
    }
  }
}

function finish() {
  flash.value = ''
  phase.value = 'result'
  if (cleared.value >= 4) beep(1047, 0.4, { type: 'triangle' })
  emit('finished', {
    score: score.value,
    maxScore: null,
    won: cleared.value >= 4,
    run: { cleared: cleared.value, precision: precision.value, misses: attempts.value - cleared.value },
  })
}

function restart() {
  emit('restarted')
  begin()
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
    const { data } = await api.get(`/play/${props.publicToken}/target-ranking`)
    ranking.value = data.ranking || []
  } catch (err) {
    ranking.value = []
  } finally {
    rankingLoading.value = false
  }
}

watch(phase, (value) => {
  emit('busy', value === 'ranking' || value === 'playing' || value === 'over')
  if (value !== 'playing' && value !== 'over') stopLoop()
})

onUnmounted(() => {
  stopLoop()
  clearTimers()
})
</script>

<style scoped>
@keyframes pa-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-14px); }
  40% { transform: translateX(12px); }
  60% { transform: translateX(-9px); }
  80% { transform: translateX(6px); }
}
.pa-shake {
  animation: pa-shake 0.42s ease-in-out;
}
@keyframes pa-feedback {
  0% { opacity: 0; transform: translateY(14px) scale(0.6); }
  25% { opacity: 1; transform: translateY(0) scale(1.15); }
  100% { opacity: 0; transform: translateY(-18px) scale(1); }
}
.pa-feedback {
  animation: pa-feedback 0.8s ease-out forwards;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
}
@keyframes pa-zone-hit {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.7); }
}
.pa-zone-hit {
  animation: pa-zone-hit 0.4s ease-in-out;
}
</style>
