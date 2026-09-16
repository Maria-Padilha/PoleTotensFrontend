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
        <component :is="startIconComponent" :size="72" :style="{ color: accentColor }" />
      </div>

      <h1 class="font-elegant text-6xl font-bold leading-[1.05] tracking-tight sm:text-8xl" :style="hudTextStyle">
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
        class="font-elegant mt-5 text-2xl italic tracking-wide sm:text-4xl"
        :style="hudSubTextStyle"
      >
        <HighlightedText :text="config.subtitle" :color="accentColor" />
      </p>

      <template v-if="hasQuestions">
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
        Este quiz ainda não tem perguntas cadastradas.
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
          Pergunta {{ currentIndex + 1 }} de {{ questions.length }}
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
          <!-- posicionado dentro do card (absolute, mas sem sair da borda —
               ficar "pra fora" deixava metade sobre o fundo escuro e ilegível),
               não disputa espaço na linha do rótulo: some sem empurrar nada -->
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
            Pergunta {{ pad(currentIndex + 1) }}
          </span>

          <p class="font-elegant mt-8 text-4xl font-bold leading-snug sm:text-6xl" :class="cardTextClass">
            <HighlightedText :text="currentQuestion.text" :color="accentColor" />
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
            v-if="currentQuestion.image_url"
            class="mx-auto mt-6 flex aspect-square w-48 items-center justify-center overflow-hidden rounded-2xl
              border-2 p-1.5 shadow-sm sm:w-64"
            :class="isDarkTheme ? 'bg-primary-900/60' : 'bg-black/5'"
            :style="{ borderColor: `${accentColor}55` }"
          >
            <img :src="currentQuestion.image_url" alt="" class="h-full w-full rounded-xl object-contain" />
          </div>
        </div>

        <div class="mt-8 flex w-full max-w-4xl flex-col gap-5">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="flex items-center gap-7 rounded-2xl border-2 px-10 py-10 text-left text-4xl font-bold
              backdrop-blur transition-colors sm:text-5xl"
            :class="optionClass(index)"
            :disabled="answered"
            @click="selectOption(index)"
          >
            <span
              class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold
                text-white sm:h-24 sm:w-24 sm:text-4xl"
              :style="badgeStyle(index)"
            >
              {{ letters[index] }}
            </span>
            {{ option }}
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
          Você acertou {{ correctCount }} de {{ questions.length }} perguntas.
        </p>
      </div>

      <p class="font-elegant mt-12 text-4xl font-bold sm:text-6xl" :style="hudTextStyle">
        <HighlightedText :text="resultMessage" :color="accentColor" />
      </p>
      <p class="mt-3 text-xl sm:text-2xl" :style="hudSubTextStyle">Obrigado por jogar!</p>

      <div class="mt-12 flex w-full max-w-md flex-col items-stretch gap-4">
        <button
          class="inline-flex items-center justify-center gap-3 rounded-2xl px-12 py-6 text-2xl font-extrabold
            text-white shadow-xl transition-transform active:scale-95 sm:text-3xl"
          :style="{ backgroundColor: accentColor }"
          @click="restart"
        >
          <RotateCcw :size="28" /> Jogar novamente
        </button>
        <button
          class="inline-flex items-center justify-center gap-3 rounded-2xl border-2 px-12 py-6 text-2xl
            font-extrabold transition-transform active:scale-95 sm:text-3xl"
          :style="outlineButtonStyle"
          @click="backToStart"
        >
          <Home :size="28" /> Voltar ao início
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { RotateCcw, Trophy, MousePointerClick, HelpCircle, Star, Home } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { ICON_MAP } from '@/components/iconMap'
import { useGameSounds } from '@/composables/useGameSounds'

const props = defineProps({
  title: { type: String, default: 'Quiz' },
  config: { type: Object, default: () => ({}) },
  // espaço reservado no topo pra não ficar embaixo de uma barra fixa externa
  // (ex: o "Preview do jogo" da PreviewView) — no totem, sem barra, fica 0.
  topInset: { type: Number, default: 0 },
})

const phasePadding = computed(() => ({ paddingTop: `${props.topInset}px` }))

const letters = ['A', 'B', 'C', 'D', 'E', 'F']
const TIMER_RADIUS = 24
const timerCircumference = 2 * Math.PI * TIMER_RADIUS

const questions = computed(() => props.config?.questions || [])
const hasQuestions = computed(() => questions.value.length > 0)
const accentColor = computed(() => props.config?.primary_color || '#10939b')
const timerSeconds = computed(() => props.config?.timer_seconds || null)
const soundEnabled = computed(() => props.config?.sound_enabled !== false)
const pointsPerQuestion = computed(() => props.config?.points_per_question || 10)
const { playCorrect, playIncorrect, playWin, playLose, startCountdown, stopCountdown } = useGameSounds(soundEnabled)

const isDarkTheme = computed(() => props.config?.theme === 'escuro')
const hasBackgroundImage = computed(() => Boolean(props.config?.background_url))

// Texto solto (título/subtítulo/HUD/mensagens): só vira claro quando tem foto de
// fundo (pra garantir legibilidade sobre qualquer imagem imprevisível). No tema
// escuro sem foto, o texto continua na tinta escura elegante — igual ao tema
// claro — em vez de virar branco; foi um pedido explícito do usuário depois de
// ver o preview real ("modo escuro deve mudar os textos pra escuro também").
const useLightText = computed(() => hasBackgroundImage.value)
// No tema escuro sem foto de fundo, tinta escura pura ficava quase invisível
// contra o gradiente escuro (testado e confirmado ilegível) — mantém a cor
// escura pedida, mas com um halo claro sutil atrás das letras só pra garantir
// contraste, sem parecer "texto branco".
const hudTextStyle = computed(() => {
  if (useLightText.value) return { color: '#ffffff', textShadow: '0 1px 10px rgba(0,0,0,0.35)' }
  if (isDarkTheme.value) {
    return { color: '#2b2b2b', textShadow: '0 0 20px rgba(255,255,255,0.55), 0 0 6px rgba(255,255,255,0.45)' }
  }
  return { color: '#2b2b2b' }
})
const hudSubTextStyle = computed(() => {
  if (useLightText.value) return { color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }
  if (isDarkTheme.value) {
    return { color: '#6b6b6b', textShadow: '0 0 16px rgba(255,255,255,0.5), 0 0 5px rgba(255,255,255,0.4)' }
  }
  return { color: '#6b6b6b' }
})

// Superfícies opacas (card da pergunta/resultado, alternativas, bolinha do
// ícone): escurecem tanto com foto de fundo quanto com o tema escuro
// selecionado — diferente do texto, aqui um vidro/cartão escuro sempre fica
// melhor que branco puro nos dois casos.
const useDarkSurface = computed(() => hasBackgroundImage.value || isDarkTheme.value)
const cardSurfaceClass = computed(() =>
  isDarkTheme.value ? 'border border-white/10 bg-primary-900/85' : 'bg-white/95'
)
const cardTextClass = computed(() => (isDarkTheme.value ? 'text-white' : 'text-ink'))
const cardMutedClass = computed(() => (isDarkTheme.value ? 'text-white/55' : 'text-ink-soft'))
const cardMuted2Class = computed(() => (isDarkTheme.value ? 'text-white/70' : 'text-ink-muted'))

const containerStyle = computed(() => {
  if (props.config?.background_url) {
    return {
      backgroundImage: `url(${props.config.background_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  const dark = props.config?.theme === 'escuro'
  return {
    background: dark
      ? 'radial-gradient(circle at 20% 20%, #0f6971 0%, #05161a 60%, #05161a 100%)'
      : 'radial-gradient(circle at 20% 20%, #d9e8e6 0%, #fcf8f5 45%, #f6f2e9 100%)',
  }
})

const phase = ref('start')
const currentIndex = ref(0)
const correctCount = ref(0)
const answered = ref(false)
const selectedIndex = ref(null)
const timeLeft = ref(timerSeconds.value || 0)
const flash = ref(null)
let intervalId = null
let flashTimeoutId = null

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const points = computed(() => correctCount.value * pointsPerQuestion.value)
const maxPoints = computed(() => questions.value.length * pointsPerQuestion.value)

const timerDashOffset = computed(() => {
  if (!timerSeconds.value) return 0
  const ratio = Math.max(0, timeLeft.value / timerSeconds.value)
  return timerCircumference * (1 - ratio)
})

// Verde no começo, amarelo/laranja a partir da metade do tempo, vermelho nos
// últimos 4s — pedido explícito do usuário pra dar mais urgência visual.
const timerColor = computed(() => {
  if (!timerSeconds.value) return accentColor.value
  if (timeLeft.value <= 4) return '#ef4444'
  if (timeLeft.value <= timerSeconds.value / 2) return '#f59e0b'
  return '#22c55e'
})

const won = computed(() => {
  if (!questions.value.length) return false
  const percent = (correctCount.value / questions.value.length) * 100
  const threshold = props.config?.win_threshold ?? 60
  return percent >= threshold
})

const resultMessage = computed(() => {
  if (won.value) return props.config?.win_message || 'Mandou muito bem, parabéns!'
  return props.config?.lose_message || 'Quase lá! Bora tentar de novo?'
})

const startButtonText = computed(() => props.config?.start_button_text || 'Toque para começar')
const startHintText = computed(() => props.config?.start_hint || 'Responda e veja sua pontuação no final')
const startIconComponent = computed(() => ICON_MAP[props.config?.icon] || null)

// Divisor ornamental do início: duas linhas que desvanecem em direção ao
// losango central, em vez de um traço reto liso — usa a mesma cor do texto
// solto ao redor (clara ou escura conforme o tema) só que esmaecendo via
// gradiente até transparente na ponta externa.
function dividerFadeStyle(reversed) {
  const c = useLightText.value ? 'rgba(255,255,255,0.55)' : 'rgba(43,43,43,0.4)'
  const dir = reversed ? 'to left' : 'to right'
  return { background: `linear-gradient(${dir}, transparent, ${c})` }
}

// Mesma ideia do divisor da tela inicial, mas com a cor baseada no tema do
// card (branco/escuro) em vez de `useLightText` (que é sobre o fundo da
// página) — esse divisor vive dentro do card da pergunta.
function cardDividerFadeStyle(reversed) {
  const c = isDarkTheme.value ? 'rgba(255,255,255,0.35)' : 'rgba(43,43,43,0.25)'
  const dir = reversed ? 'to left' : 'to right'
  return { background: `linear-gradient(${dir}, transparent, ${c})` }
}

const buttonStyle = computed(() => ({
  backgroundColor: accentColor.value,
  backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))',
  borderColor: 'rgba(255,255,255,0.25)',
  boxShadow: `0 16px 34px -12px ${accentColor.value}b3, 0 2px 6px rgba(0,0,0,0.15)`,
}))

// Botão "fantasma" (Voltar ao início): só contorno, cor de texto igual ao
// resto do texto solto da tela (branco sobre foto/tema escuro, tinta escura
// no tema claro) — não usa `accentColor` pra não competir com o botão sólido
// ao lado.
const outlineButtonStyle = computed(() => ({
  borderColor: useLightText.value ? 'rgba(255,255,255,0.4)' : 'rgba(43,43,43,0.25)',
  color: hudTextStyle.value.color,
}))

const glowStyle = computed(() => {
  if (!flash.value) return { opacity: 0 }
  const rgb = flash.value === 'correct' ? '34,197,94' : '239,68,68'
  return {
    opacity: 1,
    boxShadow: `inset 0 0 40px 16px rgba(${rgb},0.5), inset 0 0 280px 100px rgba(${rgb},0.26)`,
  }
})

function pad(n) {
  return String(n).padStart(2, '0')
}

function optionClass(index) {
  if (!answered.value) {
    return useDarkSurface.value
      ? 'border-white/40 bg-white/15 text-white hover:bg-white/25'
      : 'border-ink/10 bg-white text-ink hover:border-primary hover:bg-primary-50'
  }
  // Acerto/erro: mantém o vidro translúcido (backdrop-blur já vem da classe fixa
  // no template) só tingido de verde/vermelho, em vez de virar um bloco sólido
  // opaco — pedido explícito do usuário ("não todo branco").
  if (index === currentQuestion.value.correct_index) {
    return 'border-green-400 bg-green-500/25 text-white'
  }
  if (index === selectedIndex.value) {
    return 'border-red-400 bg-red-500/25 text-white'
  }
  return useDarkSurface.value ? 'border-white/20 bg-white/5 text-white/50' : 'border-ink/10 bg-white/40 text-ink opacity-50'
}

function badgeStyle(index) {
  if (answered.value && index === currentQuestion.value.correct_index) {
    return { backgroundColor: '#22c55e' }
  }
  if (answered.value && index === selectedIndex.value) {
    return { backgroundColor: '#ef4444' }
  }
  if (answered.value) {
    return { backgroundColor: useDarkSurface.value ? 'rgba(255,255,255,0.15)' : 'rgba(43,43,43,0.15)' }
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
      selectOption(null)
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

function selectOption(index) {
  if (answered.value || !currentQuestion.value) return
  answered.value = true
  selectedIndex.value = index
  stopTimer()

  const isCorrect = index === currentQuestion.value.correct_index
  if (isCorrect) {
    correctCount.value += 1
    triggerFlash('correct')
    playCorrect()
  } else {
    triggerFlash('incorrect')
    playIncorrect()
  }

  setTimeout(() => {
    if (currentIndex.value + 1 < questions.value.length) {
      currentIndex.value += 1
      answered.value = false
      selectedIndex.value = null
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
  selectedIndex.value = null
  phase.value = 'playing'
  startTimer()
}

function backToStart() {
  currentIndex.value = 0
  correctCount.value = 0
  answered.value = false
  selectedIndex.value = null
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
