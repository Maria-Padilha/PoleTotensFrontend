<template>
  <div
    class="ew relative flex w-full flex-col items-center overflow-hidden px-6 py-14 text-center sm:px-10"
    :style="{ minHeight: preview ? '1920px' : '100vh', '--ew-accent': ap.accent_color, '--ew-radius': radiusValue, '--ew-h': preview ? '1920px' : '100vh' }"
  >
    <!-- fundo: imagem do evento com cortina, ou degradê com manchas de cor -->
    <div class="absolute inset-0" :style="bgStyle" aria-hidden="true" />
    <template v-if="!ap.hasBg">
      <span class="ew-blob absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full" :style="blobStyle(0.22)" aria-hidden="true" />
      <span class="ew-blob absolute -bottom-52 -right-40 h-[40rem] w-[40rem] rounded-full" :style="blobStyle(0.16)" aria-hidden="true" />
    </template>

    <!-- partículas animadas (bolhas, estrelas ou confete) -->
    <div v-if="particles.length" class="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <span
        v-for="p in particles"
        :key="p.id"
        class="ew-particle"
        :class="`ew-p-${ap.fx_particles}`"
        :style="p.style"
      >{{ p.char }}</span>
    </div>

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

      <div v-else class="mt-10 grid w-full" :class="gridClass" :style="{ gap: spec.gap }">
        <button
          v-for="(game, i) in games"
          :key="game.id"
          type="button"
          class="ew-card group relative overflow-hidden"
          :class="[
            isList ? 'items-center text-left' : 'flex-col items-center justify-center text-center',
            isFun ? 'ew-fun' : '',
            ap.fx_float ? 'ew-floaty' : 'ew-rise',
          ]"
          :style="[cardStyleFor(i), { '--i': i + 5, padding: spec.pad, gap: spec.cardGap, minHeight: spec.minHeight }]"
          @click="$emit('pick', game)"
        >
          <span v-if="ap.fx_shine" class="ew-shine" :style="{ animationDelay: `${(i % 6) * 0.7}s` }" aria-hidden="true" />

          <span
            class="relative flex shrink-0 items-center justify-center rounded-full text-white shadow-lg"
            :class="[isColorful ? 'ew-fun-icon' : '', ap.fx_glow ? 'ew-glow' : '']"
            :style="{ background: iconBackground(game, i), width: iconSize, height: iconSize, '--ring': ringColor(i) }"
          >
            <component :is="gameIcon(game.game.slug)" :stroke-width="1.8" style="width: 52%; height: 52%" />
          </span>

          <span class="relative min-w-0" :class="isList ? 'flex-1' : 'w-full'">
            <span
              class="block break-words leading-tight"
              :class="isList ? 'line-clamp-2' : 'line-clamp-3'"
              :style="[gameNameStyle, { fontSize: nameSize }]"
            ><HighlightedText :text="game.title" :color="highlightColor" /></span>
            <span
              v-if="ap.show_game_type"
              class="mt-2 inline-block rounded-full px-3.5 py-1 font-bold uppercase tracking-[0.12em]"
              :style="{ backgroundColor: card.chip, color: card.chipText, fontSize: spec.chip }"
            >{{ game.game.name }}</span>
          </span>

          <span
            v-if="isList"
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg transition-transform
              group-hover:translate-x-1 sm:h-14 sm:w-14"
            :class="ap.fx_glow ? 'ew-glow' : ''"
            :style="{ ...playButtonStyle(i), '--ring': ringColor(i) }"
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

function blobStyle(alpha) {
  return { background: `radial-gradient(circle, ${ap.value.accent_color}, transparent 70%)`, opacity: alpha * 3 }
}

// ---- layout da lista de jogos ----
const layout = computed(() => {
  if (ap.value.games_layout !== 'auto') return ap.value.games_layout
  return props.games.length >= 5 ? 'grid2' : 'list'
})
const isList = computed(() => layout.value === 'list')
const gridClass = computed(() => ({ list: 'grid-cols-1', grid2: 'grid-cols-2', grid3: 'grid-cols-3', poster: 'grid-cols-2' })[layout.value])

// Medidas por layout (cqw = % da largura da própria tela, então a prévia do painel fica idêntica ao totem).
const SPECS = {
  list: { icon: 'clamp(4rem, 8cqw, 5.5rem)', name: 'clamp(1.5rem, 3.6cqw, 2.4rem)', chip: '0.8rem', pad: '1.5rem 2rem', cardGap: '1.25rem', gap: '1rem', minHeight: 'auto' },
  grid2: { icon: 'clamp(3.6rem, 10cqw, 5.5rem)', name: 'clamp(1.3rem, 3.4cqw, 2rem)', chip: '0.75rem', pad: '1.5rem 1.25rem', cardGap: '0.9rem', gap: '1rem', minHeight: 'clamp(11rem, 28cqw, 16rem)' },
  grid3: { icon: 'clamp(3rem, 8cqw, 4.5rem)', name: 'clamp(1.05rem, 2.6cqw, 1.6rem)', chip: '0.62rem', pad: '1.1rem 0.7rem', cardGap: '0.7rem', gap: '0.8rem', minHeight: 'clamp(9.5rem, 24cqw, 14rem)' },
  poster: { icon: 'clamp(5rem, 16cqw, 9rem)', name: 'clamp(1.5rem, 4.2cqw, 2.6rem)', chip: '0.85rem', pad: '2rem 1.25rem', cardGap: '1.4rem', gap: '1.25rem', minHeight: 'clamp(15rem, 44cqw, 26rem)' },
}
const spec = computed(() => SPECS[layout.value])

const iconScale = computed(() => Math.min(1.8, Math.max(0.6, Number(ap.value.icon_size) / 100)))
const nameScale = computed(() => Math.min(1.8, Math.max(0.6, Number(ap.value.game_name_size) / 100)))
const iconSize = computed(() => `calc(${spec.value.icon} * ${iconScale.value})`)
const nameSize = computed(() => `calc(${spec.value.name} * ${nameScale.value})`)

const radiusValue = computed(() => ({ round: '2rem', soft: '1rem', square: '0.35rem' })[ap.value.card_radius] || '2rem')

// tamanho do título escolhido no painel (100 = padrão)
const titleScale = computed(() => Math.min(2.5, Math.max(0.5, Number(ap.value.title_size) / 100)))

const titleStyle = computed(() => {
  const base = ap.value.onDarkBg
    ? '0 2px 28px rgba(0, 0, 0, 0.5)'
    : ap.value.hasBg
      ? '0 0 28px rgba(255, 255, 255, 0.75)'
      : ''
  const glow = ap.value.title_glow ? `0 0 14px ${ap.value.accent_color}, 0 0 38px ${ap.value.accent_color}, 0 0 70px ${ap.value.accent_color}99` : ''
  return {
    fontFamily: fontStack(ap.value.title_font),
    fontWeight: ap.value.title_weight,
    color: ap.value.titleColor,
    letterSpacing: `${ap.value.title_spacing}em`,
    fontSize: `clamp(calc(2.5rem * ${titleScale.value}), calc(7vw * ${titleScale.value}), calc(5rem * ${titleScale.value}))`,
    textShadow: [glow, base].filter(Boolean).join(', ') || 'none',
  }
})

const textStyle = computed(() => ({
  fontFamily: fontStack(ap.value.text_font),
  fontWeight: ap.value.text_weight,
  color: ap.value.textColor,
  letterSpacing: `${ap.value.text_spacing}em`,
  textShadow: ap.value.onDarkBg ? '0 1px 14px rgba(0, 0, 0, 0.45)' : 'none',
}))

// ---- estilos de cartão ----
const isFun = computed(() => ap.value.cardStyle === 'fun')
// estilos com fundo colorido (texto branco, ícone translúcido)
const isColorful = computed(() => ap.value.cardStyle === 'fun' || ap.value.cardStyle === 'gradient')
const isNeon = computed(() => ap.value.cardStyle === 'neon')

const card = computed(() => {
  const a = ap.value
  if (a.cardStyle === 'dark') {
    return { bg: 'rgba(9, 31, 36, 0.92)', border: 'rgba(255, 255, 255, 0.1)', text: '#ffffff', chip: 'rgba(255, 255, 255, 0.14)', chipText: '#ffffff', blur: false }
  }
  if (a.cardStyle === 'neon') {
    return { bg: 'rgba(7, 11, 24, 0.9)', border: a.accent_color, text: '#ffffff', chip: `${a.accent_color}33`, chipText: '#ffffff', blur: false }
  }
  if (a.cardStyle === 'fun' || a.cardStyle === 'gradient') {
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
  backgroundColor: isColorful.value ? ap.value.accent_color : card.value.bg,
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
  textShadow: isColorful.value ? '0 2px 10px rgba(0, 0, 0, 0.28)' : isNeon.value ? `0 0 12px ${ap.value.accent_color}99` : 'none',
}))

// palavra em destaque do nome do jogo: nos cartões escuros/coloridos a cor de destaque sumiria,
// então usa uma versão clara dela
const highlightColor = computed(() => {
  const accent = ap.value.accent_color
  if (isFun.value) return '#fff3a3'
  if (ap.value.cardStyle === 'gradient' || isNeon.value || ap.value.cardStyle === 'dark') {
    return `color-mix(in srgb, ${accent} 30%, #ffffff)`
  }
  return accent
})

// ---- degradês do estilo "divertido": cada jogo com o seu ----
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
const funColors = (i) => FUN_GRADIENTS[i % FUN_GRADIENTS.length]

function cardStyleFor(i) {
  const accent = ap.value.accent_color
  if (isFun.value) {
    const [from, to] = funColors(i)
    return {
      background: `linear-gradient(125deg, ${from}, ${to})`,
      borderColor: card.value.border,
      boxShadow: `0 20px 44px -14px ${from}b3, 0 8px 18px -8px ${to}80`,
    }
  }
  if (ap.value.cardStyle === 'gradient') {
    return {
      background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 52%, #000))`,
      borderColor: card.value.border,
      boxShadow: `0 20px 44px -14px ${accent}b3`,
    }
  }
  if (isNeon.value) {
    return {
      ...cardStyle.value,
      boxShadow: `0 0 0 1px ${accent}, 0 0 28px -2px ${accent}aa, inset 0 0 28px -12px ${accent}88`,
    }
  }
  return cardStyle.value
}

function playButtonStyle(i) {
  if (isFun.value) return { backgroundColor: '#ffffff', color: funColors(i)[1] }
  if (ap.value.cardStyle === 'gradient') return { backgroundColor: '#ffffff', color: ap.value.accent_color }
  return { backgroundColor: ap.value.accent_color, color: '#ffffff' }
}

function iconBackground(game, i) {
  if (isColorful.value) return 'rgba(255, 255, 255, 0.24)'
  const color = game.config?.primary_color || ap.value.accent_color
  return `linear-gradient(140deg, ${color}, color-mix(in srgb, ${color} 62%, #000))`
}

// cor do anel que pulsa em volta do ícone/botão (efeito "pulsar")
function ringColor(i) {
  if (isFun.value) return funColors(i)[0]
  if (ap.value.cardStyle === 'gradient') return '#ffffff'
  return ap.value.accent_color
}

// ---- partículas de fundo ----
const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const CONFETTI_COLORS = ['#ff4d8d', '#ffc107', '#22c55e', '#3b82f6', '#a855f7', '#ff7a00']

const particles = computed(() => {
  const kind = ap.value.fx_particles
  if (!kind || kind === 'none') return []
  const list = []
  const count = kind === 'confetti' ? 26 : 22
  for (let n = 0; n < count; n++) {
    const left = rnd(n + 1) * 100
    const size = kind === 'bubbles' ? 14 + rnd(n + 7) * 46 : kind === 'stars' ? 14 + rnd(n + 7) * 26 : 8 + rnd(n + 7) * 10
    const duration = kind === 'confetti' ? 7 + rnd(n + 13) * 7 : 9 + rnd(n + 13) * 11
    const delay = -rnd(n + 19) * duration
    const color =
      kind === 'confetti'
        ? CONFETTI_COLORS[n % CONFETTI_COLORS.length]
        : kind === 'stars'
          ? n % 3 === 0 ? '#ffffff' : ap.value.accent_color
          : ap.value.accent_color
    const style = {
      left: `${left}%`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      '--p-color': color,
      '--p-drift': `${(rnd(n + 29) - 0.5) * 120}px`,
    }
    if (kind === 'bubbles') Object.assign(style, { width: `${size}px`, height: `${size}px` })
    else if (kind === 'stars') style.fontSize = `${size}px`
    else Object.assign(style, { width: `${size}px`, height: `${size * 1.6}px` })
    list.push({ id: n, style, char: kind === 'stars' ? '✦' : '' })
  }
  return list
})
</script>

<style scoped>
.ew {
  container-type: inline-size;
}

.ew-card {
  display: flex;
  border: 1.5px solid;
  border-radius: var(--ew-radius, 2rem);
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

/* efeito: cartões flutuando de leve (entram subindo e depois ficam balançando) */
@keyframes ew-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px);
  }
}
.ew-floaty {
  animation: ew-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards, ew-float 5.5s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 90ms), calc(0.9s + var(--i, 0) * 280ms);
}

/* efeito: brilho que atravessa o cartão */
@keyframes ew-shine {
  0% {
    transform: translateX(-160%) skewX(-20deg);
  }
  35%,
  100% {
    transform: translateX(380%) skewX(-20deg);
  }
}
.ew-shine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 28%;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  animation: ew-shine 4.2s ease-in-out infinite;
}

/* efeito: anel pulsando em volta do ícone e do botão */
@keyframes ew-glow {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--ring, #fff) 65%, transparent);
  }
  70%,
  100% {
    box-shadow: 0 0 0 16px transparent;
  }
}
.ew-glow {
  animation: ew-glow 1.9s ease-out infinite;
}

/* partículas */
.ew-particle {
  position: absolute;
  display: block;
  color: var(--p-color);
  will-change: transform;
}
.ew-p-bubbles {
  bottom: -80px;
  border-radius: 9999px;
  border: 2px solid color-mix(in srgb, var(--p-color) 55%, transparent);
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.55), color-mix(in srgb, var(--p-color) 18%, transparent));
  animation: ew-bubble linear infinite;
}
.ew-p-stars {
  top: -40px;
  line-height: 1;
  text-shadow: 0 0 12px currentColor;
  animation: ew-twinkle linear infinite;
}
.ew-p-confetti {
  top: -40px;
  border-radius: 2px;
  background: var(--p-color);
  animation: ew-confetti linear infinite;
}
@keyframes ew-bubble {
  from {
    transform: translate(0, 0);
    opacity: 0;
  }
  12% {
    opacity: 0.85;
  }
  to {
    transform: translate(var(--p-drift), calc(var(--ew-h) * -1.15));
    opacity: 0;
  }
}
@keyframes ew-twinkle {
  0% {
    transform: translate(0, 0) scale(0.6) rotate(0);
    opacity: 0;
  }
  15%,
  85% {
    opacity: 0.95;
  }
  50% {
    transform: translate(calc(var(--p-drift) * 0.5), calc(var(--ew-h) * 0.55)) scale(1.15) rotate(90deg);
  }
  100% {
    transform: translate(var(--p-drift), calc(var(--ew-h) * 1.15)) scale(0.6) rotate(180deg);
    opacity: 0;
  }
}
@keyframes ew-confetti {
  from {
    transform: translate(0, 0) rotate(0);
  }
  to {
    transform: translate(var(--p-drift), calc(var(--ew-h) * 1.15)) rotate(720deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ew-rise,
  .ew-floaty,
  .ew-shine,
  .ew-glow,
  .ew-particle {
    animation: none;
  }
}
</style>
