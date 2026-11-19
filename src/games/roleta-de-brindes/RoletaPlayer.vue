<template>
  <div class="game-typo relative min-h-screen overflow-hidden" :style="containerStyle">
    <!-- brilho clean nas bordas: acende ao parar a roleta -->
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

      <template v-if="hasPrizes">
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
        Esta roleta ainda não tem opções cadastradas.
      </p>
    </div>

    <!-- jogando -->
    <div
      v-else
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center"
      :style="phasePadding"
    >
      <div class="relative mx-auto h-[360px] w-[360px] sm:h-[860px] sm:w-[860px]">
        <!-- ponteiro fixo, aponta pra baixo a partir do topo -->
        <div class="absolute left-1/2 -top-1 z-20 -translate-x-1/2 sm:-top-3">
          <div
            class="h-0 w-0 border-x-[16px] border-x-transparent border-t-[26px] drop-shadow-md sm:border-x-[30px] sm:border-t-[46px]"
            :style="{ borderTopColor: accentColor }"
          />
        </div>

        <div class="absolute inset-0 overflow-hidden rounded-full border-8 border-white/80 shadow-2xl sm:border-[16px]" :style="wheelStyle">
          <div
            v-for="slice in slices"
            :key="slice.id"
            class="absolute inset-0"
            :style="{ transform: `rotate(${slice.mid}deg)` }"
          >
            <!-- sem correção de "meia-volta": como em qualquer roleta física, o texto
                 acompanha a fatia e pode ficar de cabeça pra baixo do lado oposto ao
                 ponteiro — tentar re-endireitar por metade dava rotação errada depois
                 de girar (o mid é fixo, mas a roleta inteira já girou por cima dele) -->
            <span
              class="absolute left-1/2 top-[13%] w-[90px] -translate-x-1/2 whitespace-normal break-words text-center
                font-bold uppercase leading-tight tracking-wide text-white drop-shadow sm:top-[14%] sm:w-[240px]"
              :class="labelSizeClass(slice.label)"
            >
              {{ slice.label }}
            </span>
          </div>
        </div>

        <!-- eixo central: também funciona como botão de girar -->
        <button
          type="button"
          class="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center
            justify-center rounded-full border-4 border-white/85 text-lg font-extrabold uppercase text-white
            shadow-xl transition-transform active:scale-95 disabled:opacity-70 sm:h-48 sm:w-48 sm:text-3xl"
          :style="{ backgroundColor: accentColor }"
          :disabled="spinning || !hasPrizes"
          @click="spin"
        >
          Girar
        </button>
      </div>

      <div
        v-if="result"
        class="relative mt-10 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl backdrop-blur sm:mt-14 sm:p-12"
        :class="cardSurfaceClass"
      >
        <div
          class="absolute -top-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center
            rounded-full shadow-md sm:-top-9 sm:h-20 sm:w-20"
          :class="cardSurfaceClass"
        >
          <component :is="resultIcon" :size="30" class="sm:hidden" :style="{ color: resultAccent }" />
          <component :is="resultIcon" :size="36" class="hidden sm:block" :style="{ color: resultAccent }" />
        </div>

        <p
          class="mt-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em] sm:text-sm"
          :class="cardMutedClass"
        >
          <span :style="{ color: resultAccent }">•</span> {{ resultText }} <span :style="{ color: resultAccent }">•</span>
        </p>
        <p class="font-elegant mt-4 text-4xl font-bold leading-snug sm:text-6xl" :class="cardTextClass">
          {{ result.label }}
        </p>

        <div class="mt-10 flex w-full flex-col items-stretch gap-4">
          <button
            class="inline-flex items-center justify-center gap-4 rounded-2xl px-10 py-6 text-2xl font-extrabold
              text-white shadow-xl transition-transform active:scale-[0.98] sm:text-3xl"
            :style="{ backgroundColor: accentColor }"
            @click="spin"
          >
            <RotateCcw :size="30" /> Girar de novo
          </button>
          <button
            class="inline-flex items-center justify-center gap-4 rounded-2xl border-2 px-10 py-6 text-2xl
              font-extrabold shadow-lg transition-transform active:scale-[0.98] sm:text-3xl"
            :style="outlineButtonStyle"
            @click="backToStart"
          >
            <Home :size="30" /> Voltar ao início
          </button>
        </div>
      </div>
      <p v-else class="mt-9 flex items-center justify-center gap-2 text-base font-bold uppercase tracking-[0.3em]
        opacity-60 sm:mt-12 sm:text-xl" :style="hudSubTextStyle">
        <MousePointerClick :size="20" class="shrink-0" />
        Toque na roleta pra girar
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { RotateCcw, Trophy, Frown, Meh, MousePointerClick, Home } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { useGameSounds } from '@/composables/useGameSounds'
import { useGameTheme } from '@/composables/useGameTheme'

const props = defineProps({
  title: { type: String, default: 'Roleta' },
  config: { type: Object, default: () => ({}) },
  // espaço reservado no topo pra não ficar embaixo de uma barra fixa externa
  // (ex: o "Preview do jogo" da PreviewView) — no totem, sem barra, fica 0.
  topInset: { type: Number, default: 0 },
})

const emit = defineEmits(['finished', 'restarted', 'back-to-start'])

const phasePadding = computed(() => ({ paddingTop: `${props.topInset}px` }))

const SPIN_DURATION_MS = 4500
const MIN_EXTRA_SPINS = 6
const MAX_EXTRA_SPINS = 9

const prizes = computed(() => props.config?.prizes || [])
const hasPrizes = computed(() => prizes.value.length >= 2)

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
  startHintText,
  startIconComponent,
  dividerFadeStyle,
  buttonStyle,
  outlineButtonStyle,
  glowStyleFor,
} = useGameTheme(props)

const { playWin, playLose, playNeutral, startSpin, stopSpin } = useGameSounds(soundEnabled)

const phase = ref('start')
const rotation = ref(0)
const spinning = ref(false)
const result = ref(null)
const flash = ref(null)
let flashTimeoutId = null
let spinTimeoutId = null

function shade(hex, amount) {
  const clean = (hex || '#10939b').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16) || 0
  const clamp = (v) => Math.min(255, Math.max(0, v))
  const r = clamp(((num >> 16) & 0xff) + amount)
  const g = clamp(((num >> 8) & 0xff) + amount)
  const b = clamp((num & 0xff) + amount)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const sliceCount = computed(() => prizes.value.length)
const sliceAngle = computed(() => (sliceCount.value ? 360 / sliceCount.value : 0))

const slices = computed(() =>
  prizes.value.map((prize, i) => ({
    id: prize.id,
    label: prize.label,
    mid: i * sliceAngle.value + sliceAngle.value / 2,
  }))
)

const conicGradient = computed(() => {
  const n = sliceCount.value
  if (!n) return 'none'
  const step = 100 / n
  const stops = prizes.value.map((prize, i) => {
    const color = prize.color || (i % 2 === 0 ? accentColor.value : shade(accentColor.value, 35))
    return `${color} ${(i * step).toFixed(4)}% ${((i + 1) * step).toFixed(4)}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})

// Rótulos longos quebram em até 3 linhas (largura fixa no template) — aqui só
// reduz a fonte pra caber melhor quanto mais comprido o texto.
function labelSizeClass(label) {
  const len = (label || '').length
  if (len > 24) return 'text-xs sm:text-2xl'
  if (len > 14) return 'text-sm sm:text-3xl'
  return 'text-base sm:text-4xl'
}

const wheelStyle = computed(() => ({
  backgroundImage: conicGradient.value,
  transform: `rotate(${rotation.value}deg)`,
  transition: spinning.value ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.72, 0.15, 1)` : 'none',
}))

const glowStyle = glowStyleFor(flash)

const resultOutcome = computed(() => result.value?.outcome_type || 'neutral')
const resultIcon = computed(() => {
  if (resultOutcome.value === 'positive') return Trophy
  if (resultOutcome.value === 'negative') return Frown
  return Meh
})
const resultAccent = computed(() => {
  if (resultOutcome.value === 'positive') return '#22c55e'
  if (resultOutcome.value === 'negative') return '#ef4444'
  return '#f59e0b'
})

// Texto pequeno acima do nome da fatia: a mensagem da própria fatia (se o
// admin escreveu uma) > a genérica do tipo (positiva/negativa/neutra,
// cadastrada na personalização do jogo) > uma frase padrão do tipo como
// último recurso — o nome da fatia em si já aparece embaixo, em destaque.
const resultText = computed(() => {
  if (!result.value) return ''
  if (result.value.message) return result.value.message
  const generic =
    resultOutcome.value === 'positive'
      ? props.config?.win_message
      : resultOutcome.value === 'negative'
        ? props.config?.lose_message
        : props.config?.neutral_message
  if (generic) return generic
  if (resultOutcome.value === 'positive') return 'Parabéns, você ganhou'
  if (resultOutcome.value === 'negative') return 'Ih, deu ruim'
  return 'Resultado'
})

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Sorteio por peso: cada prêmio pode ter uma chance relativa diferente
// (`weight`), mas todas as fatias aparecem do mesmo tamanho na roleta.
function pickPrizeIndex() {
  const weights = prizes.value.map((p) => Math.max(1, Number(p.weight) || 1))
  const total = weights.reduce((sum, w) => sum + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

function triggerFlash(kind) {
  flash.value = kind
  if (flashTimeoutId) clearTimeout(flashTimeoutId)
  flashTimeoutId = setTimeout(() => {
    flash.value = null
  }, 900)
}

function spin() {
  if (spinning.value || !hasPrizes.value) return
  const isRepeat = result.value !== null
  spinning.value = true
  result.value = null
  // só o "Girar de novo" conta como jogar novamente; o primeiro giro é a própria partida
  if (isRepeat) emit('restarted')

  const index = pickPrizeIndex()
  const mid = index * sliceAngle.value + sliceAngle.value / 2
  const currentBase = rotation.value - (rotation.value % 360)
  const extraSpins = randInt(MIN_EXTRA_SPINS, MAX_EXTRA_SPINS)
  rotation.value = currentBase + extraSpins * 360 + (360 - mid)

  startSpin()

  if (spinTimeoutId) clearTimeout(spinTimeoutId)
  spinTimeoutId = setTimeout(() => {
    spinning.value = false
    stopSpin()
    const prize = prizes.value[index]
    result.value = prize
    const outcome = prize.outcome_type || 'neutral'
    triggerFlash(outcome === 'positive' ? 'correct' : outcome === 'negative' ? 'incorrect' : 'neutral')
    if (outcome === 'positive') playWin()
    else if (outcome === 'negative') playLose()
    else playNeutral()
  }, SPIN_DURATION_MS)
}

function start() {
  phase.value = 'playing'
}

function backToStart() {
  result.value = null
  phase.value = 'start'
  emit('back-to-start')
}

onUnmounted(() => {
  if (flashTimeoutId) clearTimeout(flashTimeoutId)
  if (spinTimeoutId) clearTimeout(spinTimeoutId)
  stopSpin()
})

// Roleta não tem "pontuação" nem fase de resultado separada — cada giro que
// pousa numa fatia já conta como uma jogada (pro "jogo mais jogado" do
// recap), mesmo sem contribuir pro ranking por pontos.
watch(result, (value) => {
  if (value) {
    emit('finished', {
      score: null,
      maxScore: null,
      won: null,
      label: value.label,
      outcomeType: value.outcome_type || 'neutral',
    })
  }
})
</script>
