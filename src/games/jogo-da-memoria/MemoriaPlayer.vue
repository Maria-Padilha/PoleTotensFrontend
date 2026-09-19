<template>
  <div class="relative min-h-screen overflow-hidden" :style="containerStyle">
    <!-- brilho clean nas bordas: acende verde ao formar um par -->
    <div class="pointer-events-none fixed inset-0 z-40 transition-all duration-700 ease-out" :style="glowStyle" />

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

      <h1 class="font-elegant text-7xl font-bold leading-[1.05] tracking-tight sm:text-9xl" :style="hudTextStyle">
        <HighlightedText :text="title" :color="accentColor" />
      </h1>
      <h2
        v-if="config.headline"
        class="font-elegant mt-2 text-6xl font-bold leading-[1.05] tracking-tight sm:text-8xl"
        :style="hudTextStyle"
      >
        <HighlightedText :text="config.headline" :color="accentColor" />
      </h2>

      <div v-if="config.headline || config.subtitle" class="mt-8 flex items-center justify-center gap-4">
        <span class="h-px w-20 sm:w-28" :style="dividerFadeStyle(false)" />
        <span
          class="h-2.5 w-2.5 rotate-45"
          :style="{ backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}99` }"
        />
        <span class="h-px w-20 sm:w-28" :style="dividerFadeStyle(true)" />
      </div>

      <p
        v-if="config.subtitle"
        class="font-elegant mt-5 text-3xl italic tracking-wide sm:text-5xl w-[70%]"
        :style="hudSubTextStyle"
      >
        <HighlightedText :text="config.subtitle" :color="accentColor" />
      </p>

      <template v-if="hasCards">
        <button
          class="mt-9 rounded-2xl border px-16 py-8 text-3xl font-bold tracking-wide text-white
            transition-transform active:scale-95 sm:text-4xl"
          :style="buttonStyle"
          @click="start"
        >
          <HighlightedText :text="startButtonText" variant="underline" />
        </button>
        <p class="mt-5 flex items-center gap-2 text-base opacity-60 sm:text-lg" :style="hudSubTextStyle">
          <MousePointerClick :size="18" class="shrink-0" />
          <HighlightedText :text="startHintText" :color="accentColor" />
        </p>
      </template>
      <p v-else class="mt-6 text-2xl" :style="hudSubTextStyle">
        Este jogo ainda não tem cartas cadastradas.
      </p>
    </div>

    <!-- jogando -->
    <div
      v-else-if="phase === 'playing'"
      class="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-20 sm:py-12"
      :style="phasePadding"
    >
      <div class="flex items-center justify-between text-sm font-bold uppercase tracking-[0.2em] sm:text-2xl" :style="hudTextStyle">
        <span class="inline-flex items-center gap-2">
          <LayoutGrid :size="24" class="shrink-0 opacity-80" />
          Pares {{ correctCount }} de {{ totalPairs }}
        </span>
        <span class="inline-flex items-center gap-2">
          <Star :size="24" class="shrink-0 opacity-80" />
          {{ points }} pontos
        </span>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center py-6">
        <div
          class="relative w-full max-w-[1500px] rounded-[2.5rem] p-8 text-center shadow-2xl backdrop-blur sm:p-14"
          :class="cardSurfaceClass"
        >
          <div
            v-if="timerSeconds"
            class="absolute right-5 top-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md
              sm:right-8 sm:top-8 sm:h-24 sm:w-24"
            :class="cardSurfaceClass"
          >
            <svg viewBox="0 0 56 56" class="absolute inset-0 h-full w-full -rotate-90 p-1.5">
              <circle cx="28" cy="28" r="24" fill="none" :stroke="isDarkTheme ? 'rgba(255,255,255,0.15)' : '#e9e9e6'" stroke-width="5" />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                :stroke="timerColor"
                stroke-width="5"
                stroke-linecap="round"
                :stroke-dasharray="timerCircumference"
                :stroke-dashoffset="timerDashOffset"
                style="transition: stroke-dashoffset 1s linear, stroke 0.3s ease"
              />
            </svg>
            <span class="relative text-lg font-bold sm:text-3xl" :style="{ color: timerColor }">
              {{ timeLeft }}
            </span>
          </div>

          <span class="text-sm font-bold uppercase tracking-[0.3em] sm:text-2xl" :class="cardMutedClass">
            Encontre os pares
          </span>

          <div
            class="mx-auto mt-8 grid w-full max-w-[1200px] gap-3 sm:mt-12 sm:gap-5"
            :style="{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }"
          >
            <button
              v-for="card in board"
              :key="card.uid"
              type="button"
              class="relative aspect-square"
              style="perspective: 1000px"
              :disabled="card.matched || busy"
              @click="flipCard(card)"
            >
              <div
                class="relative h-full w-full transition-transform duration-500"
                style="transform-style: preserve-3d"
                :style="{ transform: card.revealed || card.matched ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
              >
                <div
                  class="absolute inset-0 flex items-center justify-center rounded-xl shadow-md sm:rounded-2xl"
                  style="backface-visibility: hidden"
                  :style="{ backgroundColor: accentColor }"
                >
                  <span class="h-4 w-4 rotate-45 bg-white/70 sm:h-7 sm:w-7" />
                </div>
                <div
                  class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl border-2 p-1.5
                    shadow-md sm:rounded-2xl"
                  style="backface-visibility: hidden; transform: rotateY(180deg)"
                  :class="[
                    card.matched ? 'border-green-400' : 'border-transparent',
                    isDarkTheme ? 'bg-primary-900/70' : 'bg-white',
                  ]"
                >
                  <img :src="card.image_url" alt="" class="h-full w-full object-contain" />
                </div>
              </div>
            </button>
          </div>
        </div>

        <p
          class="mt-9 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em]
            opacity-60 sm:text-xl"
          :style="hudSubTextStyle"
        >
          <MousePointerClick :size="20" class="shrink-0" />
          Toque em duas cartas pra formar um par
        </p>
      </div>
    </div>

    <!-- resultado -->
    <div
      v-else
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center"
      :style="phasePadding"
    >
      <div
        class="relative w-full max-w-xl rounded-[2.5rem] p-10 pt-14 shadow-2xl backdrop-blur sm:p-12 sm:pt-16"
        :class="cardSurfaceClass"
      >
        <div
          class="absolute -top-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center
            rounded-full shadow-md sm:-top-9 sm:h-20 sm:w-20"
          :class="cardSurfaceClass"
        >
          <Trophy :size="30" class="sm:hidden" :style="{ color: accentColor }" />
          <Trophy :size="36" class="hidden sm:block" :style="{ color: accentColor }" />
        </div>

        <p
          class="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em] sm:text-sm"
          :class="cardMutedClass"
        >
          <span :style="{ color: accentColor }">•</span> Seu resultado <span :style="{ color: accentColor }">•</span>
        </p>
        <p class="font-elegant mt-3 flex items-baseline justify-center gap-2 text-5xl font-bold sm:text-6xl">
          <span :style="{ color: accentColor }">{{ points }}</span>
          <span class="text-2xl sm:text-3xl" :class="cardMutedClass">/{{ maxPoints }}</span>
          <span class="text-lg font-sans font-normal sm:text-xl" :class="cardMuted2Class">pontos</span>
        </p>
        <div class="mx-auto mt-4 h-px w-24" :style="{ backgroundColor: accentColor, opacity: 0.3 }" />
        <p class="mt-4 text-sm sm:text-base" :class="cardMuted2Class">
          Você encontrou {{ correctCount }} de {{ totalPairs }} pares.
        </p>
      </div>

      <p class="font-elegant mt-12 text-4xl font-bold sm:text-6xl" :style="hudTextStyle">
        <HighlightedText :text="resultMessage" :color="accentColor" />
      </p>
      <p class="mt-3 text-xl sm:text-2xl" :style="hudSubTextStyle">Obrigado por jogar!</p>

      <div class="mt-12 flex w-full max-w-xl flex-col items-stretch gap-5">
        <button
          class="inline-flex items-center justify-center gap-4 rounded-2xl px-14 py-8 text-3xl font-extrabold
            text-white shadow-xl transition-transform active:scale-[0.98] sm:text-4xl"
          :style="{ backgroundColor: accentColor }"
          @click="restart"
        >
          <RotateCcw :size="36" /> Jogar novamente
        </button>
        <button
          class="inline-flex items-center justify-center gap-4 rounded-2xl border-2 px-14 py-8 text-3xl
            font-extrabold shadow-lg transition-transform active:scale-[0.98] sm:text-4xl"
          :style="outlineButtonStyle"
          @click="backToStart"
        >
          <Home :size="36" /> Voltar ao início
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { RotateCcw, Trophy, MousePointerClick, LayoutGrid, Star, Home } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { useGameSounds } from '@/composables/useGameSounds'
import { useGameTheme } from '@/composables/useGameTheme'

const props = defineProps({
  title: { type: String, default: 'Jogo da Memória' },
  config: { type: Object, default: () => ({}) },
  // espaço reservado no topo pra não ficar embaixo de uma barra fixa externa
  // (ex: o "Preview do jogo" da PreviewView) — no totem, sem barra, fica 0.
  topInset: { type: Number, default: 0 },
})

const phasePadding = computed(() => ({ paddingTop: `${props.topInset}px` }))

const TIMER_RADIUS = 24
const timerCircumference = 2 * Math.PI * TIMER_RADIUS
const MISMATCH_DELAY_MS = 900

const configuredCards = computed(() => (props.config?.cards || []).filter((c) => c.image_url))
const hasCards = computed(() => configuredCards.value.length >= 2)

const {
  accentColor,
  timerSeconds,
  soundEnabled,
  pointsPerQuestion,
  isDarkTheme,
  hudTextStyle,
  hudSubTextStyle,
  cardSurfaceClass,
  cardMutedClass,
  cardMuted2Class,
  containerStyle,
  startButtonText,
  startHintText,
  startIconComponent,
  dividerFadeStyle,
  buttonStyle,
  outlineButtonStyle,
  timerColorFor,
  glowStyleFor,
} = useGameTheme(props)

const { playCorrect, playIncorrect, playWin, playLose, startCountdown, stopCountdown } = useGameSounds(soundEnabled)

const phase = ref('start')
const board = ref([])
const firstCard = ref(null)
const secondCard = ref(null)
const busy = ref(false)
const locked = ref(false)
const timeLeft = ref(timerSeconds.value || 0)
const flash = ref(null)
let intervalId = null
let flashTimeoutId = null
let mismatchTimeoutId = null

const totalPairs = computed(() => board.value.length / 2)
const correctCount = computed(() => board.value.filter((c) => c.matched).length / 2)
const allMatched = computed(() => totalPairs.value > 0 && correctCount.value === totalPairs.value)
const points = computed(() => correctCount.value * pointsPerQuestion.value)
const maxPoints = computed(() => totalPairs.value * pointsPerQuestion.value)

const gridColumns = computed(() => {
  const n = board.value.length || 1
  const target = Math.sqrt(n * 1.6)
  const candidates = [6, 5, 4, 3]
  const divisor = candidates.find((c) => n % c === 0 && Math.abs(c - target) <= 2)
  if (divisor) return divisor
  return candidates.reduce((a, b) => (Math.abs(a - target) < Math.abs(b - target) ? a : b))
})

const timerDashOffset = computed(() => {
  if (!timerSeconds.value) return 0
  const ratio = Math.max(0, timeLeft.value / timerSeconds.value)
  return timerCircumference * (1 - ratio)
})
const timerColor = timerColorFor(timeLeft)

const won = computed(() => {
  if (!totalPairs.value) return false
  const percent = (correctCount.value / totalPairs.value) * 100
  const threshold = props.config?.win_threshold ?? 60
  return percent >= threshold
})

const resultMessage = computed(() => {
  if (won.value) return props.config?.win_message || 'Mandou muito bem, parabéns!'
  return props.config?.lose_message || 'Quase lá! Bora tentar de novo?'
})

const glowStyle = glowStyleFor(flash)

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Monta e embaralha o tabuleiro do zero a cada início/replay.
function buildBoard() {
  const doubled = configuredCards.value.flatMap((c) => [
    { uid: `${c.id}_a`, pairId: c.id, image_url: c.image_url, revealed: false, matched: false },
    { uid: `${c.id}_b`, pairId: c.id, image_url: c.image_url, revealed: false, matched: false },
  ])
  board.value = shuffle(doubled)
}

function triggerFlash(kind) {
  flash.value = kind
  if (flashTimeoutId) clearTimeout(flashTimeoutId)
  flashTimeoutId = setTimeout(() => {
    flash.value = null
  }, 800)
}

function resetTurn() {
  firstCard.value = null
  secondCard.value = null
  busy.value = false
}

function flipCard(card) {
  if (locked.value || busy.value || card.matched || card.revealed) return

  if (!firstCard.value) {
    card.revealed = true
    firstCard.value = card
    return
  }

  card.revealed = true
  secondCard.value = card
  busy.value = true

  if (firstCard.value.pairId === card.pairId) {
    firstCard.value.matched = true
    card.matched = true
    triggerFlash('correct')
    playCorrect()
    resetTurn()
    if (allMatched.value) finishRound()
  } else {
    triggerFlash('incorrect')
    playIncorrect()
    if (mismatchTimeoutId) clearTimeout(mismatchTimeoutId)
    const a = firstCard.value
    const b = card
    mismatchTimeoutId = setTimeout(() => {
      a.revealed = false
      b.revealed = false
      resetTurn()
    }, MISMATCH_DELAY_MS)
  }
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  stopCountdown()
}

// Cronômetro pra rodada inteira (não por par) — quando zera, encerra com os
// pares já encontrados até então.
function startTimer() {
  stopTimer()
  if (!timerSeconds.value) return
  timeLeft.value = timerSeconds.value
  startCountdown()
  intervalId = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      stopTimer()
      if (!locked.value) finishRound()
    }
  }, 1000)
}

function finishRound() {
  locked.value = true
  stopTimer()
  setTimeout(() => {
    phase.value = 'finished'
    if (won.value) playWin()
    else playLose()
  }, 1200)
}

function start() {
  buildBoard()
  locked.value = false
  resetTurn()
  phase.value = 'playing'
  startTimer()
}

function restart() {
  start()
}

function backToStart() {
  stopTimer()
  locked.value = false
  phase.value = 'start'
}

watch(
  () => phase.value,
  (value) => {
    if (value !== 'playing') stopTimer()
  }
)

onUnmounted(() => {
  stopTimer()
  if (flashTimeoutId) clearTimeout(flashTimeoutId)
  if (mismatchTimeoutId) clearTimeout(mismatchTimeoutId)
})
</script>
