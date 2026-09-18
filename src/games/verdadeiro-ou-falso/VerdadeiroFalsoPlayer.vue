<template>
  <div class="relative min-h-screen overflow-hidden" :style="containerStyle">
    <!-- brilho clean nas bordas: verde ao acertar, vermelho ao errar -->
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

      <template v-if="hasStatements">
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
        Este jogo ainda não tem afirmações cadastradas.
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
          Afirmação {{ currentIndex + 1 }} de {{ statements.length }}
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
            Afirmação {{ pad(currentIndex + 1) }}
          </span>

          <p class="font-elegant mt-8 text-4xl font-bold leading-snug sm:text-6xl" :class="cardTextClass">
            <HighlightedText :text="currentStatement.text" :color="accentColor" />
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
            v-if="currentStatement.image_url"
            class="mx-auto mt-6 flex aspect-square w-48 items-center justify-center overflow-hidden rounded-2xl
              border-2 p-1.5 shadow-sm sm:w-64"
            :class="isDarkTheme ? 'bg-primary-900/60' : 'bg-black/5'"
            :style="{ borderColor: `${accentColor}55` }"
          >
            <img :src="currentStatement.image_url" alt="" class="h-full w-full rounded-xl object-contain" />
          </div>
        </div>

        <div class="mt-8 flex w-full max-w-4xl flex-col gap-6">
          <button
            class="relative flex items-center rounded-2xl border-2 py-14 pl-36 pr-10 text-left text-5xl font-bold
              shadow-lg backdrop-blur transition-all active:scale-[0.98] sm:pl-44 sm:pr-14 sm:text-6xl"
            :class="answerClass(true)"
            :disabled="answered"
            @click="selectAnswer(true)"
          >
            <span
              class="absolute left-8 top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center
                rounded-full text-white shadow-md sm:left-10 sm:h-24 sm:w-24"
              :style="answerBadgeStyle(true)"
            >
              <Check :size="44" />
            </span>
            Verdadeiro
          </button>
          <button
            class="relative flex items-center rounded-2xl border-2 py-14 pl-36 pr-10 text-left text-5xl font-bold
              shadow-lg backdrop-blur transition-all active:scale-[0.98] sm:pl-44 sm:pr-14 sm:text-6xl"
            :class="answerClass(false)"
            :disabled="answered"
            @click="selectAnswer(false)"
          >
            <span
              class="absolute left-8 top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center
                rounded-full text-white shadow-md sm:left-10 sm:h-24 sm:w-24"
              :style="answerBadgeStyle(false)"
            >
              <X :size="44" />
            </span>
            Falso
          </button>
        </div>

        <p
          class="mt-9 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em]
            opacity-60 sm:text-base"
          :style="hudSubTextStyle"
        >
          <MousePointerClick :size="16" class="shrink-0" />
          Escolha sua resposta
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
          Você acertou {{ correctCount }} de {{ statements.length }} afirmações.
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
import { RotateCcw, Trophy, MousePointerClick, HelpCircle, Star, Home, Check, X } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { useGameSounds } from '@/composables/useGameSounds'
import { useGameTheme } from '@/composables/useGameTheme'

const props = defineProps({
  title: { type: String, default: 'Verdadeiro ou Falso' },
  config: { type: Object, default: () => ({}) },
  // espaço reservado no topo pra não ficar embaixo de uma barra fixa externa
  // (ex: o "Preview do jogo" da PreviewView) — no totem, sem barra, fica 0.
  topInset: { type: Number, default: 0 },
})

const phasePadding = computed(() => ({ paddingTop: `${props.topInset}px` }))

const TIMER_RADIUS = 24
const timerCircumference = 2 * Math.PI * TIMER_RADIUS

const statements = computed(() => props.config?.statements || [])
const hasStatements = computed(() => statements.value.length > 0)

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
const answered = ref(false)
const selectedAnswer = ref(null)
const timeLeft = ref(timerSeconds.value || 0)
const flash = ref(null)
let intervalId = null
let flashTimeoutId = null

const currentStatement = computed(() => statements.value[currentIndex.value] || null)
const points = computed(() => correctCount.value * pointsPerQuestion.value)
const maxPoints = computed(() => statements.value.length * pointsPerQuestion.value)

const timerDashOffset = computed(() => {
  if (!timerSeconds.value) return 0
  const ratio = Math.max(0, timeLeft.value / timerSeconds.value)
  return timerCircumference * (1 - ratio)
})

const timerColor = timerColorFor(timeLeft)

const won = computed(() => {
  if (!statements.value.length) return false
  const percent = (correctCount.value / statements.value.length) * 100
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

function answerClass(value) {
  if (!answered.value) {
    // Vidro escuro no tema escuro (já validado); no tema claro com foto, vidro
    // CLARO com texto escuro em vez do mesmo branco borrado — evita o "branco
    // demais" sobre um fundo já clareado pela cortina do tema claro.
    if (isDarkTheme.value) return 'border-white/40 bg-white/15 text-white hover:bg-white/25'
    if (hasBackgroundImage.value) return 'border-ink/10 bg-white/55 text-ink hover:bg-white/70'
    return 'border-ink/10 bg-white text-ink hover:border-primary hover:bg-primary-50'
  }
  // Acerto/erro: mantém o vidro translúcido tingido de verde/vermelho, em vez
  // de virar um bloco sólido opaco — mesmo padrão do Quiz.
  if (value === currentStatement.value.correct_answer) {
    return 'border-green-400 bg-green-500/25 text-white'
  }
  if (value === selectedAnswer.value) {
    return 'border-red-400 bg-red-500/25 text-white'
  }
  if (isDarkTheme.value) return 'border-white/20 bg-white/5 text-white/50'
  if (hasBackgroundImage.value) return 'border-ink/10 bg-white/30 text-ink/50'
  return 'border-ink/10 bg-white/40 text-ink opacity-50'
}

function answerBadgeStyle(value) {
  if (answered.value && value === currentStatement.value.correct_answer) {
    return { backgroundColor: '#22c55e' }
  }
  if (answered.value && value === selectedAnswer.value) {
    return { backgroundColor: '#ef4444' }
  }
  if (answered.value) {
    return { backgroundColor: isDarkTheme.value ? 'rgba(255,255,255,0.15)' : 'rgba(43,43,43,0.15)' }
  }
  return { backgroundColor: accentColor.value }
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
      selectAnswer(null)
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

function selectAnswer(value) {
  if (answered.value || !currentStatement.value) return
  answered.value = true
  selectedAnswer.value = value
  stopTimer()

  const isCorrect = value === currentStatement.value.correct_answer
  if (isCorrect) {
    correctCount.value += 1
    triggerFlash('correct')
    playCorrect()
  } else {
    triggerFlash('incorrect')
    playIncorrect()
  }

  setTimeout(() => {
    if (currentIndex.value + 1 < statements.value.length) {
      currentIndex.value += 1
      answered.value = false
      selectedAnswer.value = null
      startTimer()
    } else {
      phase.value = 'finished'
      if (won.value) playWin()
      else playLose()
    }
  }, 1400)
}

function restart() {
  currentIndex.value = 0
  correctCount.value = 0
  answered.value = false
  selectedAnswer.value = null
  phase.value = 'playing'
  startTimer()
}

function backToStart() {
  currentIndex.value = 0
  correctCount.value = 0
  answered.value = false
  selectedAnswer.value = null
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
