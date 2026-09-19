<template>
  <div class="relative min-h-screen overflow-hidden" :style="containerStyle">
    <!-- brilho clean nas bordas: verde ao acertar a palavra, vermelho ao perder -->
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

      <template v-if="hasWords">
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
        Este jogo ainda não tem palavras cadastradas.
      </p>
    </div>

    <!-- jogando -->
    <div
      v-else-if="phase === 'playing'"
      class="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-20 sm:py-12"
      :style="phasePadding"
    >
      <div class="flex items-center justify-between text-sm font-bold uppercase tracking-[0.2em] sm:text-xl" :style="hudTextStyle">
        <span class="inline-flex items-center gap-2">
          <HelpCircle :size="18" class="shrink-0 opacity-80" />
          Palavra {{ currentIndex + 1 }} de {{ words.length }}
        </span>
        <span class="inline-flex items-center gap-2">
          <Star :size="18" class="shrink-0 opacity-80" />
          {{ points }} pontos
        </span>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center py-6">
        <div
          class="relative w-full max-w-4xl rounded-[2.5rem] p-10 text-center shadow-2xl backdrop-blur sm:p-14"
          :class="cardSurfaceClass"
        >
          <div
            v-if="timerSeconds"
            class="absolute right-5 top-5 flex h-16 w-16 items-center justify-center rounded-full shadow-md
              sm:right-7 sm:top-7 sm:h-20 sm:w-20"
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
            <span class="relative text-lg font-bold sm:text-2xl" :style="{ color: timerColor }">
              {{ timeLeft }}
            </span>
          </div>

          <span class="text-sm font-bold uppercase tracking-[0.3em] sm:text-lg" :class="cardMutedClass">
            Palavra {{ pad(currentIndex + 1) }}
          </span>

          <p class="font-elegant mt-8 text-4xl font-bold leading-snug sm:text-6xl" :class="cardTextClass">
            <HighlightedText :text="currentWord.hint || 'Adivinhe a palavra!'" :color="accentColor" />
          </p>
          <div class="mt-5 flex items-center justify-center gap-3">
            <span class="h-px w-14 sm:w-20" :style="cardDividerFadeStyle(false)" />
            <span
              class="h-2.5 w-2.5 rotate-45"
              :style="{ backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}99` }"
            />
            <span class="h-px w-14 sm:w-20" :style="cardDividerFadeStyle(true)" />
          </div>

          <div
            v-if="currentWord.image_url"
            class="mx-auto mt-6 flex aspect-square w-40 items-center justify-center overflow-hidden rounded-2xl
              border-2 p-1.5 shadow-sm sm:w-52"
            :class="isDarkTheme ? 'bg-primary-900/60' : 'bg-black/5'"
            :style="{ borderColor: `${accentColor}55` }"
          >
            <img :src="currentWord.image_url" alt="" class="h-full w-full rounded-xl object-contain" />
          </div>

          <!-- corações: um a menos a cada letra errada -->
          <div class="mt-7 flex items-center justify-center gap-2 sm:gap-3">
            <Heart
              v-for="i in MAX_LIVES"
              :key="i"
              :size="26"
              class="sm:!h-9 sm:!w-9"
              :fill="i <= livesLeft ? '#ef4444' : 'none'"
              :style="{ color: i <= livesLeft ? '#ef4444' : (isDarkTheme ? 'rgba(255,255,255,0.25)' : 'rgba(43,43,43,0.2)') }"
            />
          </div>

          <!-- palavra com espaços em branco -->
          <div class="mt-7 flex flex-wrap items-end justify-center gap-x-2 gap-y-3 sm:gap-x-3">
            <template v-for="(ch, i) in wordChars" :key="i">
              <span v-if="!isLetterChar(ch)" class="w-3 sm:w-6" />
              <span
                v-else
                class="flex h-12 w-8 items-end justify-center border-b-4 pb-1 text-3xl font-bold sm:h-16 sm:w-11 sm:text-4xl"
                :class="lost && !isGuessed(ch) ? 'text-red-400' : cardTextClass"
                :style="{ borderColor: lost && !isGuessed(ch) ? '#ef4444' : accentColor }"
              >
                {{ revealedChar(ch) }}
              </span>
            </template>
          </div>
        </div>

        <!-- teclado -->
        <div class="mt-9 flex w-full max-w-5xl flex-col items-center gap-3">
          <div v-for="(row, rIndex) in KEYBOARD_ROWS" :key="rIndex" class="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              v-for="letter in row"
              :key="letter"
              class="flex h-14 w-14 items-center justify-center rounded-xl border-2 text-xl font-bold shadow
                backdrop-blur transition-all active:scale-95 sm:h-20 sm:w-20 sm:text-3xl"
              :class="letterClass(letter)"
              :disabled="roundLocked || isGuessed(letter)"
              @click="guessLetter(letter)"
            >
              {{ letter }}
            </button>
          </div>
        </div>

        <p
          class="mt-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em]
            opacity-60 sm:text-base"
          :style="hudSubTextStyle"
        >
          <MousePointerClick :size="16" class="shrink-0" />
          Toque em uma letra para tentar
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
          Você acertou {{ correctCount }} de {{ words.length }} palavras.
        </p>
      </div>

      <p class="font-elegant mt-12 text-4xl font-bold sm:text-6xl w-[80%]" :style="hudTextStyle">
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
import { RotateCcw, Trophy, MousePointerClick, HelpCircle, Star, Home, Heart } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { useGameSounds } from '@/composables/useGameSounds'
import { useGameTheme } from '@/composables/useGameTheme'

const props = defineProps({
  title: { type: String, default: 'Jogo da Forca' },
  config: { type: Object, default: () => ({}) },
  // espaço reservado no topo pra não ficar embaixo de uma barra fixa externa
  // (ex: o "Preview do jogo" da PreviewView) — no totem, sem barra, fica 0.
  topInset: { type: Number, default: 0 },
})

const phasePadding = computed(() => ({ paddingTop: `${props.topInset}px` }))

// pedido explícito do usuário: 6 chances (corações), não configurável por
// palavra — perde um coração a cada letra errada.
const MAX_LIVES = 6
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]
const TIMER_RADIUS = 24
const timerCircumference = 2 * Math.PI * TIMER_RADIUS

const words = computed(() => props.config?.words || [])
const hasWords = computed(() => words.value.length > 0)

const {
  accentColor,
  timerSeconds,
  soundEnabled,
  pointsPerQuestion,
  isDarkTheme,
  hasBackgroundImage,
  hudTextStyle,
  hudSubTextStyle,
  cardSurfaceClass,
  cardTextClass,
  cardMutedClass,
  cardMuted2Class,
  containerStyle,
  startButtonText,
  startHintText,
  startIconComponent,
  dividerFadeStyle,
  cardDividerFadeStyle,
  buttonStyle,
  outlineButtonStyle,
  timerColorFor,
  glowStyleFor,
} = useGameTheme(props)

const { playCorrect, playIncorrect, playWin, playLose, startCountdown, stopCountdown } = useGameSounds(soundEnabled)

const phase = ref('start')
const currentIndex = ref(0)
const correctCount = ref(0)
const guessedLetters = ref(new Set())
const roundLocked = ref(false)
const timeLeft = ref(timerSeconds.value || 0)
const flash = ref(null)
let intervalId = null
let flashTimeoutId = null

const currentWord = computed(() => words.value[currentIndex.value] || null)
const points = computed(() => correctCount.value * pointsPerQuestion.value)
const maxPoints = computed(() => words.value.length * pointsPerQuestion.value)

// letras acentuadas contam como a letra "base" pro teclado simples (A-Z) —
// digitar "C" também revela um "Ç", por exemplo.
function normalize(ch) {
  return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
}

function isLetterChar(ch) {
  return /\p{L}/u.test(ch)
}

const wordChars = computed(() => (currentWord.value?.word || '').split(''))

const wordLettersSet = computed(() => {
  const set = new Set()
  wordChars.value.forEach((ch) => {
    if (isLetterChar(ch)) set.add(normalize(ch))
  })
  return set
})

function isGuessed(ch) {
  return guessedLetters.value.has(normalize(ch))
}

function revealedChar(ch) {
  if (isGuessed(ch) || lost.value) return ch.toUpperCase()
  return ''
}

const wrongCount = computed(
  () => [...guessedLetters.value].filter((l) => !wordLettersSet.value.has(l)).length
)
const livesLeft = computed(() => Math.max(0, MAX_LIVES - wrongCount.value))
const solved = computed(
  () => wordLettersSet.value.size > 0 && [...wordLettersSet.value].every((l) => guessedLetters.value.has(l))
)
const lost = computed(() => livesLeft.value <= 0)

const timerDashOffset = computed(() => {
  if (!timerSeconds.value) return 0
  const ratio = Math.max(0, timeLeft.value / timerSeconds.value)
  return timerCircumference * (1 - ratio)
})

const timerColor = timerColorFor(timeLeft)

const won = computed(() => {
  if (!words.value.length) return false
  const percent = (correctCount.value / words.value.length) * 100
  const threshold = props.config?.win_threshold ?? 60
  return percent >= threshold
})

const resultMessage = computed(() => {
  if (won.value) return props.config?.win_message || 'Mandou muito bem, parabéns!'
  return props.config?.lose_message || 'Quase lá! Bora tentar de novo?'
})

const glowStyle = glowStyleFor(flash)

function pad(n) {
  return String(n).padStart(2, '0')
}

function letterClass(letter) {
  if (!isGuessed(letter)) {
    if (isDarkTheme.value) return 'border-white/40 bg-white/15 text-white hover:bg-white/25'
    if (hasBackgroundImage.value) return 'border-ink/10 bg-white/55 text-ink hover:bg-white/70'
    return 'border-ink/10 bg-white text-ink hover:border-primary hover:bg-primary-50'
  }
  if (wordLettersSet.value.has(letter)) {
    return 'border-green-400 bg-green-500/25 text-white'
  }
  return 'border-red-400 bg-red-500/25 text-white/60'
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  stopCountdown()
}

function startTimer() {
  stopTimer()
  if (!timerSeconds.value) return
  timeLeft.value = timerSeconds.value
  startCountdown()
  intervalId = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      stopTimer()
      handleTimeout()
    }
  }, 1000)
}

function triggerFlash(kind) {
  flash.value = kind
  if (flashTimeoutId) clearTimeout(flashTimeoutId)
  flashTimeoutId = setTimeout(() => {
    flash.value = null
  }, 800)
}

function start() {
  phase.value = 'playing'
  startTimer()
}

function scheduleAdvance() {
  stopTimer()
  setTimeout(() => {
    if (currentIndex.value + 1 < words.value.length) {
      currentIndex.value += 1
      guessedLetters.value = new Set()
      roundLocked.value = false
      startTimer()
    } else {
      phase.value = 'finished'
      if (won.value) playWin()
      else playLose()
    }
  }, 1600)
}

function handleTimeout() {
  if (roundLocked.value || !currentWord.value) return
  roundLocked.value = true
  triggerFlash('incorrect')
  scheduleAdvance()
}

function guessLetter(letter) {
  if (roundLocked.value || !currentWord.value || isGuessed(letter)) return
  const next = new Set(guessedLetters.value)
  next.add(letter)
  guessedLetters.value = next

  const hit = wordLettersSet.value.has(letter)
  if (hit) playCorrect()
  else playIncorrect()

  if (solved.value) {
    roundLocked.value = true
    correctCount.value += 1
    triggerFlash('correct')
    scheduleAdvance()
  } else if (lost.value) {
    roundLocked.value = true
    triggerFlash('incorrect')
    scheduleAdvance()
  }
}

function restart() {
  currentIndex.value = 0
  correctCount.value = 0
  guessedLetters.value = new Set()
  roundLocked.value = false
  phase.value = 'playing'
  startTimer()
}

function backToStart() {
  currentIndex.value = 0
  correctCount.value = 0
  guessedLetters.value = new Set()
  roundLocked.value = false
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
})
</script>
