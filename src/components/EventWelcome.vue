<template>
  <div
    class="ew relative flex w-full flex-col items-center overflow-hidden px-6 py-14 text-center sm:px-10"
    :style="{ minHeight: preview ? '1920px' : '100vh' }"
  >
    <!-- fundo: imagem do evento com cortina, ou degradê com manchas de cor -->
    <div class="absolute inset-0" :style="bgStyle" aria-hidden="true" />
    <template v-if="!ap.hasBg">
      <span class="ew-blob absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full" :style="blobStyle(0.22)" aria-hidden="true" />
      <span class="ew-blob absolute -bottom-52 -right-40 h-[40rem] w-[40rem] rounded-full" :style="blobStyle(0.16)" aria-hidden="true" />
    </template>

    <div class="relative z-10 flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
      <img
        v-if="ap.logo_url"
        :src="ap.logo_url"
        alt=""
        class="ew-rise mb-7 h-20 max-w-[60%] object-contain drop-shadow-lg sm:h-28"
      />

      <h1
        class="ew-rise font-bold leading-[0.95]"
        :style="titleStyle"
        style="--i: 1"
      >
        {{ eventName }}
      </h1>

      <div class="ew-rise mt-6 flex items-center gap-3" style="--i: 2" aria-hidden="true">
        <span class="h-px w-16 sm:w-24" :style="{ background: `linear-gradient(to right, transparent, ${ap.accent_color})` }" />
        <span class="h-3 w-3 rotate-45" :style="{ backgroundColor: ap.accent_color, boxShadow: `0 0 14px ${ap.accent_color}` }" />
        <span class="h-px w-16 sm:w-24" :style="{ background: `linear-gradient(to left, transparent, ${ap.accent_color})` }" />
      </div>

      <p class="ew-rise mt-5 text-xl sm:text-3xl" :style="textStyle" style="--i: 3">{{ ap.welcome_text }}</p>

      <div class="ew-rise mt-7 flex flex-wrap items-center justify-center gap-3" style="--i: 4">
        <button type="button" class="ew-pill" :style="pillStyle" @click="$emit('ranking', 'overall')">
          <Trophy :size="18" /> Ranking geral
        </button>
        <button type="button" class="ew-pill" :style="pillStyle" @click="$emit('ranking', 'games')">
          <Medal :size="18" /> Ranking por jogo
        </button>
      </div>

      <p v-if="!games.length" class="ew-rise mt-14 text-xl" :style="textStyle" style="--i: 5">
        Nenhum jogo disponível neste evento ainda.
      </p>

      <div v-else class="mt-10 grid w-full gap-4" :class="compact ? 'grid-cols-2' : 'grid-cols-1'">
        <button
          v-for="(game, i) in games"
          :key="game.id"
          type="button"
          class="ew-card ew-rise group relative overflow-hidden text-left"
          :class="[compact ? 'flex-col items-center !p-5 text-center' : 'items-center gap-5 px-6 py-6 sm:px-8 sm:py-7', isFun ? 'ew-fun' : '']"
          :style="[cardStyleFor(i), { '--i': i + 5 }]"
          @click="$emit('pick', game)"
        >
          <span
            class="flex shrink-0 items-center justify-center rounded-full text-white shadow-lg"
            :class="[compact ? 'h-16 w-16' : 'h-16 w-16 sm:h-20 sm:w-20', isFun ? 'ew-fun-icon' : '']"
            :style="{ background: iconBackground(game, i) }"
          >
            <component :is="gameIcon(game.game.slug)" :size="compact ? 30 : 36" :stroke-width="1.8" />
          </span>

          <span class="min-w-0 flex-1" :class="compact ? 'mt-4' : ''">
            <span
              class="line-clamp-2 block leading-tight"
              :class="compact ? 'text-2xl' : 'text-2xl sm:text-4xl'"
              :style="gameNameStyle"
            ><HighlightedText :text="game.title" :color="ap.accent_color" /></span>
            <span
              class="mt-2 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-[0.12em] sm:text-sm"
              :style="{ backgroundColor: card.chip, color: card.chipText }"
            >{{ game.game.name }}</span>
          </span>

          <span
            v-if="!compact"
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg transition-transform
              group-hover:translate-x-1 sm:h-14 sm:w-14"
            :style="playButtonStyle(i)"
          >
            <Play :size="22" class="translate-x-0.5 fill-current" />
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { Trophy, Medal, Play } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import { gameIcon } from '@/games/gameIcons'
import { resolveAppearance, backgroundStyle, fontStack, loadFont } from '@/utils/appearance'

const props = defineProps({
  eventName: { type: String, default: '' },
  games: { type: Array, default: () => [] },
  // aparência crua salva no evento (o que o organizador escolheu)
  appearance: { type: Object, default: () => ({}) },
  // na prévia do painel, a tela é desenhada no tamanho de um totem (1080x1920)
  preview: { type: Boolean, default: false },
})

defineEmits(['pick', 'ranking'])

const ap = computed(() => resolveAppearance(props.appearance))

watch(
  () => [ap.value.title_font, ap.value.text_font],
  (fonts) => fonts.forEach(loadFont),
  { immediate: true }
)

const bgStyle = computed(() => backgroundStyle(ap.value))
const compact = computed(() => props.games.length >= 5)

function blobStyle(alpha) {
  return { background: `radial-gradient(circle, ${ap.value.accent_color}, transparent 70%)`, opacity: alpha * 3 }
}

// tamanho do título escolhido no painel (100 = padrão)
const titleScale = computed(() => Math.min(2.5, Math.max(0.5, Number(ap.value.title_size) / 100)))

const titleStyle = computed(() => ({
  fontFamily: fontStack(ap.value.title_font),
  fontWeight: ap.value.title_weight,
  color: ap.value.titleColor,
  letterSpacing: `${ap.value.title_spacing}em`,
  fontSize: `clamp(calc(2.5rem * ${titleScale.value}), calc(7vw * ${titleScale.value}), calc(5rem * ${titleScale.value}))`,
  textShadow: ap.value.onDarkBg
    ? '0 2px 28px rgba(0, 0, 0, 0.5)'
    : ap.value.hasBg
      ? '0 0 28px rgba(255, 255, 255, 0.75)'
      : 'none',
}))

const textStyle = computed(() => ({
  fontFamily: fontStack(ap.value.text_font),
  fontWeight: ap.value.text_weight,
  color: ap.value.textColor,
  letterSpacing: `${ap.value.text_spacing}em`,
  textShadow: ap.value.onDarkBg ? '0 1px 14px rgba(0, 0, 0, 0.45)' : 'none',
}))

// Cores do cartão conforme o estilo escolhido (claro, escuro ou vidro).
const card = computed(() => {
  const a = ap.value
  if (a.cardStyle === 'dark') {
    return { bg: 'rgba(9, 31, 36, 0.92)', border: 'rgba(255, 255, 255, 0.1)', text: '#ffffff', chip: 'rgba(255, 255, 255, 0.14)', chipText: '#ffffff', blur: false }
  }
  if (a.cardStyle === 'fun') {
    return { bg: 'transparent', border: 'rgba(255, 255, 255, 0.55)', text: '#ffffff', chip: 'rgba(255, 255, 255, 0.26)', chipText: '#ffffff', blur: false }
  }
  if (a.cardStyle === 'glass') {
    return a.onDarkBg
      ? { bg: 'rgba(255, 255, 255, 0.13)', border: 'rgba(255, 255, 255, 0.3)', text: '#ffffff', chip: 'rgba(255, 255, 255, 0.2)', chipText: '#ffffff', blur: true }
      : { bg: 'rgba(255, 255, 255, 0.62)', border: 'rgba(255, 255, 255, 0.85)', text: '#16282b', chip: 'rgba(16, 147, 155, 0.14)', chipText: '#0f6971', blur: true }
  }
  return { bg: '#ffffff', border: 'rgba(43, 43, 43, 0.08)', text: '#2b2b2b', chip: '#eaf6f7', chipText: '#0f6971', blur: false }
})

const cardStyle = computed(() => ({
  backgroundColor: card.value.bg,
  borderColor: card.value.border,
  backdropFilter: card.value.blur ? 'blur(18px) saturate(1.2)' : 'none',
  WebkitBackdropFilter: card.value.blur ? 'blur(18px) saturate(1.2)' : 'none',
}))

const pillStyle = computed(() => ({
  backgroundColor: isFun.value ? ap.value.accent_color : card.value.bg,
  borderColor: card.value.border,
  color: card.value.text,
  fontFamily: fontStack(ap.value.text_font),
  letterSpacing: `${ap.value.text_spacing}em`,
  backdropFilter: card.value.blur ? 'blur(14px)' : 'none',
  WebkitBackdropFilter: card.value.blur ? 'blur(14px)' : 'none',
}))

// nome do jogo: usa a fonte dos textos; só troca a cor se o organizador escolheu uma
const gameNameStyle = computed(() => ({
  fontFamily: fontStack(ap.value.text_font),
  fontWeight: Math.min(900, Number(ap.value.text_weight) + 200),
  letterSpacing: `${ap.value.text_spacing}em`,
  color: props.appearance?.text_color || card.value.text,
  textShadow: isFun.value ? '0 2px 10px rgba(0, 0, 0, 0.28)' : 'none',
}))

// ---- estilo "divertido": cada jogo com um degradê vivo próprio ----
const FUN_GRADIENTS = [
  ['#ff4d8d', '#ff9f43'], // rosa → laranja
  ['#7c4dff', '#3b82f6'], // roxo → azul
  ['#10b981', '#06b6d4'], // verde → turquesa
  ['#ff8a00', '#ef233c'], // laranja → vermelho
  ['#06b6d4', '#6366f1'], // ciano → índigo
  ['#d946ef', '#7c3aed'], // magenta → violeta
  ['#f59e0b', '#ef4444'], // âmbar → vermelho
  ['#22c55e', '#0ea5e9'], // verde → azul
]
const isFun = computed(() => ap.value.cardStyle === 'fun')
const funColors = (i) => FUN_GRADIENTS[i % FUN_GRADIENTS.length]

function cardStyleFor(i) {
  if (!isFun.value) return cardStyle.value
  const [from, to] = funColors(i)
  return {
    background: `linear-gradient(125deg, ${from}, ${to})`,
    borderColor: card.value.border,
    boxShadow: `0 20px 44px -14px ${from}b3, 0 8px 18px -8px ${to}80`,
  }
}

function playButtonStyle(i) {
  if (!isFun.value) return { backgroundColor: ap.value.accent_color, color: '#ffffff' }
  return { backgroundColor: '#ffffff', color: funColors(i)[1] }
}

function iconBackground(game, i) {
  if (isFun.value) return 'rgba(255, 255, 255, 0.24)'
  const color = game.config?.primary_color || ap.value.accent_color
  return `linear-gradient(140deg, ${color}, color-mix(in srgb, ${color} 62%, #000))`
}
</script>

<style scoped>
.ew-card {
  display: flex;
  border: 1.5px solid;
  border-radius: 2rem;
  box-shadow: 0 18px 50px -18px rgba(0, 0, 0, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.ew-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 60px -18px rgba(0, 0, 0, 0.45);
}
.ew-card:active {
  transform: scale(0.985);
}

/* cartão divertido: brilho no canto, bolhas translúcidas e ícone em destaque */
.ew-fun {
  border-width: 2.5px;
  isolation: isolate;
}
.ew-fun::before,
.ew-fun::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 9999px;
  pointer-events: none;
}
.ew-fun::before {
  right: -3.5rem;
  top: -4.5rem;
  height: 14rem;
  width: 14rem;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.38), transparent 68%);
}
.ew-fun::after {
  left: 28%;
  bottom: -5rem;
  height: 9rem;
  width: 9rem;
  background: rgba(255, 255, 255, 0.12);
}
.ew-fun-icon {
  border: 2.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.35);
  transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.ew-card:hover .ew-fun-icon {
  transform: rotate(-8deg) scale(1.1);
}

.ew-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1.5px solid;
  border-radius: 9999px;
  padding: 0.6rem 1.3rem;
  font-size: 0.95rem;
  font-weight: 700;
  transition: transform 0.2s ease;
}
.ew-pill:active {
  transform: scale(0.96);
}

.ew-blob {
  filter: blur(40px);
}

@keyframes ew-rise {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.ew-rise {
  animation: ew-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
  animation-delay: calc(var(--i, 0) * 90ms);
}

@media (prefers-reduced-motion: reduce) {
  .ew-rise {
    animation: none;
  }
}
</style>
