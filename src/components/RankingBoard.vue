<template>
  <div class="rb relative flex h-full w-full flex-col items-center overflow-hidden px-6 pb-28 pt-14 sm:px-14 sm:pt-20">
    <div v-if="!transparent" class="absolute inset-0" :style="bgStyle" aria-hidden="true" />

    <div class="relative z-10 flex h-full w-full max-w-4xl flex-col">
      <!-- cabeçalho -->
      <div class="text-center">
        <p class="text-xl font-bold uppercase sm:text-2xl" :style="eyebrowStyle">{{ slide.eyebrow }}</p>
        <h2 :key="slide.title" class="rb-fade mt-3 font-bold leading-tight" :class="transparent ? 'font-elegant' : ''" :style="titleStyle">{{ slide.title }}</h2>
        <p v-if="slide.subtitle" class="mt-2 text-xl sm:text-2xl" :style="textStyle">{{ slide.subtitle }}</p>
        <div class="mt-6 flex items-center justify-center gap-4" aria-hidden="true">
          <span class="h-px w-24" :style="{ background: `linear-gradient(to right, transparent, ${accent})` }" />
          <span class="h-3 w-3 rotate-45" :style="{ backgroundColor: accent, boxShadow: `0 0 16px ${accent}` }" />
          <span class="h-px w-24" :style="{ background: `linear-gradient(to left, transparent, ${accent})` }" />
        </div>

        <!-- escolha do jogo (só no ranking aberto pelo botão; no modo atração troca sozinho) -->
        <div v-if="manual && total > 1" class="mt-6 flex flex-wrap justify-center gap-3">
          <button
            v-for="tab in tabs"
            :key="tab.index"
            type="button"
            class="rounded-full border-2 px-6 py-2.5 text-lg font-bold transition-colors"
            :style="tab.index === index ? activeTabStyle : tabStyle"
            @click="$emit('select', tab.index)"
          >
            {{ tab.title }}
          </button>
        </div>
      </div>

      <!-- tabela: todos os jogadores -->
      <div
        class="@container mt-8 flex min-h-0 flex-col overflow-hidden rounded-[2rem] border-2"
        :style="panelStyle"
      >
        <div class="rb-head grid items-center gap-4 px-6 py-4 text-base font-bold uppercase sm:px-10 sm:text-lg" :class="gridCols" :style="headStyle">
          <span class="text-center">#</span>
          <span>Jogador</span>
          <span v-if="slide.showSong" class="hidden whitespace-nowrap @3xl:block">{{ slide.detailLabel || 'Música' }}</span>
          <span class="whitespace-nowrap text-right">{{ slide.scoreLabel || 'Pontos' }}</span>
        </div>

        <div ref="scroller" class="rb-scroll min-h-0 flex-1 overflow-y-auto">
          <div
            v-for="(row, idx) in slide.rows"
            :key="`${slide.title}-${row.position}-${row.name}-${row.id ?? idx}`"
            class="rb-row grid items-center gap-4 px-6 py-4 sm:px-10"
            :class="[gridCols, row.position <= 3 ? 'rb-top' : '', isMine(row) ? 'rb-mine' : '']"
            :style="[rowStyle(row), rowMotion(row, idx)]"
          >
            <span
              class="mx-auto flex items-center justify-center rounded-full font-bold"
              :class="row.position <= 3 ? 'h-14 w-14 text-2xl' : 'h-11 w-11 text-xl'"
              :style="{ backgroundColor: positionColor(row.position), color: row.position <= 3 ? '#ffffff' : onAccent }"
            >
              {{ row.position }}
            </span>
            <span class="min-w-0">
              <span class="block truncate" :class="row.position <= 3 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'" :style="nameStyle(row)">
                {{ row.name }}
              </span>
              <span v-if="row.song" class="block truncate text-base @3xl:hidden" :style="mutedStyle">{{ row.song }}</span>
            </span>
            <span v-if="slide.showSong" class="hidden truncate text-xl @3xl:block sm:text-2xl" :style="mutedStyle">{{ row.song }}</span>
            <span class="whitespace-nowrap text-right font-bold" :class="row.position <= 3 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'" :style="scoreStyle(row)">
              {{ row.scoreText || formatScore(row.score) }}
            </span>
          </div>
        </div>
      </div>

      <!-- bolinhas: qual ranking está aparecendo -->
      <div v-if="total > 1" class="mt-6 flex justify-center gap-2.5" aria-hidden="true">
        <span
          v-for="n in total"
          :key="n"
          class="h-2.5 rounded-full transition-all duration-300"
          :class="n - 1 === index ? 'w-9' : 'w-2.5'"
          :style="{ backgroundColor: n - 1 === index ? accent : dotMuted }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { resolveAppearance, backgroundStyle, fontStack, loadFont, DEFAULT_APPEARANCE } from '@/utils/appearance'

const props = defineProps({
  // { eyebrow, title, subtitle, showSong, rows: [{ position, name, score, song }] }
  slide: { type: Object, required: true },
  // aparência crua do evento (mesma da tela inicial do totem)
  appearance: { type: Object, default: () => ({}) },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  // aberto pelo botão (mostra abas e não troca sozinho) x modo atração
  manual: { type: Boolean, default: false },
  // quanto tempo o ranking fica na tela (pra rolar a tabela até o fim se for longa)
  duration: { type: Number, default: 10000 },
  tabs: { type: Array, default: () => [] },
  // sobe a cada volta do modo atração (reinicia a rolagem mesmo com um ranking só)
  cycle: { type: Number, default: 0 },
  // dentro de um jogo: sem fundo próprio (usa o do jogo), tom claro/escuro e cor de destaque do jogo
  transparent: { type: Boolean, default: false },
  tone: { type: String, default: '' }, // '' | 'light' | 'dark'
  accentColor: { type: String, default: '' },
  // linha da jogada recém-feita: sobe até a posição dela, com destaque
  highlightId: { type: [Number, String], default: null },
})

defineEmits(['select'])

const ap = computed(() => resolveAppearance(props.appearance))

watch(
  () => [ap.value.title_font, ap.value.text_font],
  (fonts) => fonts.forEach(loadFont),
  { immediate: true }
)

// Sem imagem de fundo mantém o verde-escuro de sempre do ranking (não o creme da tela inicial).
const bgStyle = computed(() =>
  ap.value.hasBg
    ? backgroundStyle(ap.value)
    : { background: 'radial-gradient(circle at 30% 20%, #17a6ae 0%, #0b3a3e 55%, #05181a 100%)' }
)

// Cor de destaque: a que o organizador escolheu; sem escolha (ou com a padrão) e sem imagem de
// fundo, usa um dourado — o verde-azulado padrão some no fundo verde-escuro do ranking.
const accent = computed(() => {
  if (props.accentColor) return props.accentColor
  const custom = String(props.appearance?.accent_color || '').toLowerCase()
  const isDefault = !custom || custom === DEFAULT_APPEARANCE.accent_color
  return isDefault && !ap.value.hasBg ? '#ffc94d' : ap.value.accent_color
})

// texto legível em cima da cor de destaque (aba ativa)
const onAccent = computed(() => {
  const hex = accent.value.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#102a2d' : '#ffffff'
})

const onLight = computed(() => (props.tone ? props.tone === 'light' : ap.value.hasBg && !ap.value.onDarkBg))
const titleColor = computed(() => props.appearance?.title_color || (onLight.value ? (props.tone ? '#2b2b2b' : ap.value.titleColor) : '#ffffff'))
const textColor = computed(() => props.appearance?.text_color || (onLight.value ? (props.tone ? '#3d3d3d' : ap.value.textColor) : 'rgba(255, 255, 255, 0.9)'))
const mutedColor = computed(() => (onLight.value ? 'rgba(22, 40, 43, 0.65)' : 'rgba(255, 255, 255, 0.62)'))
const dotMuted = computed(() => (onLight.value ? 'rgba(22, 40, 43, 0.25)' : 'rgba(255, 255, 255, 0.28)'))

// dentro de um jogo o tamanho do título vem do zoom do .game-typo, não daqui
const titleScale = computed(() => (props.transparent ? 1 : Math.min(2.5, Math.max(0.5, Number(ap.value.title_size) / 100))))

// Dentro de um jogo (transparent) a fonte/peso/espaçamento são herdados da tipografia do jogo
// (.game-typo), então não setamos nada aqui.
const titleStyle = computed(() => ({
  ...(props.transparent ? {} : { fontFamily: fontStack(ap.value.title_font), fontWeight: ap.value.title_weight, letterSpacing: `${ap.value.title_spacing}em` }),
  color: titleColor.value,
  fontSize: `clamp(calc(3rem * ${titleScale.value}), calc(8vw * ${titleScale.value}), calc(5.5rem * ${titleScale.value}))`,
  textShadow: onLight.value ? '0 0 24px rgba(255, 255, 255, 0.7)' : '0 2px 24px rgba(0, 0, 0, 0.4)',
}))

const textStyle = computed(() => ({
  ...(props.transparent ? {} : { fontFamily: fontStack(ap.value.text_font), fontWeight: ap.value.text_weight, letterSpacing: `${ap.value.text_spacing}em` }),
  color: textColor.value,
}))

const mutedStyle = computed(() => ({ ...textStyle.value, color: mutedColor.value, fontWeight: 500 }))

const eyebrowStyle = computed(() => ({
  ...(props.transparent ? {} : { fontFamily: fontStack(ap.value.text_font) }),
  color: mutedColor.value,
  letterSpacing: '0.4em',
}))

const panelStyle = computed(() => ({
  backgroundColor: onLight.value ? 'rgba(255, 255, 255, 0.62)' : 'rgba(255, 255, 255, 0.09)',
  borderColor: onLight.value ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
}))

const headStyle = computed(() => ({ ...textStyle.value, color: mutedColor.value, fontWeight: 700, borderBottom: `1px solid ${dotMuted.value}` }))

const tabStyle = computed(() => ({
  ...textStyle.value,
  borderColor: dotMuted.value,
  backgroundColor: 'transparent',
}))
const activeTabStyle = computed(() => ({
  ...textStyle.value,
  borderColor: accent.value,
  backgroundColor: accent.value,
  color: '#ffffff',
}))

// Painel largo (>= 48rem): # | jogador | detalhe | pontuação, com larguras fixas iguais em todas as linhas.
// Painel estreito: # | jogador (com o detalhe embaixo) | pontuação — o nome nunca some.
const gridCols = computed(() =>
  props.slide.showSong
    ? 'grid-cols-[4rem_minmax(0,1fr)_auto] sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] @3xl:grid-cols-[4.5rem_minmax(0,1fr)_14rem_12rem]'
    : 'grid-cols-[4rem_minmax(0,1fr)_auto] sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]'
)

function positionColor(position) {
  if (position === 1) return '#f4b400'
  if (position === 2) return '#9ca3af'
  if (position === 3) return '#b45309'
  return accent.value
}

function rowStyle(row) {
  return {
    borderBottom: `1px solid ${dotMuted.value}`,
    backgroundColor: row.position <= 3 ? (onLight.value ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.07)') : 'transparent',
  }
}

const nameStyle = (row) => ({ ...textStyle.value, color: row.position <= 3 ? titleColor.value : textColor.value, fontWeight: row.position <= 3 ? 800 : 600 })
const scoreStyle = (row) => ({ ...textStyle.value, color: row.position <= 3 ? accent.value : textColor.value, fontWeight: 800 })

const isMine = (row) => props.highlightId != null && row.id === props.highlightId
const mineIndex = computed(() => (props.highlightId == null ? -1 : props.slide.rows.findIndex((r) => r.id === props.highlightId)))

// Entrada das linhas: sobem em sequência. A jogada recém-feita vem de baixo, passando por cima das
// outras até o lugar dela; as que ficam abaixo dela entram depois, "descendo" pra dar lugar.
function rowMotion(row, idx) {
  if (isMine(row)) {
    const k = Math.min(6, Math.max(1, props.slide.rows.length - idx))
    return { '--k': k, '--d': '0ms' }
  }
  const after = mineIndex.value >= 0 && idx > mineIndex.value
  const base = Math.min(idx, 12) * 55
  return { '--d': `${after ? base + 1300 : base}ms` }
}

function formatScore(score) {
  return Number(score).toLocaleString('pt-BR')
}

// ---- rolagem automática quando a tabela não cabe (só no modo atração) ----
const scroller = ref(null)
let rafId = null

function stopAutoScroll() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
}

async function startAutoScroll() {
  stopAutoScroll()
  await nextTick()
  const el = scroller.value
  if (!el) return
  el.scrollTop = 0
  const distance = el.scrollHeight - el.clientHeight
  if (props.manual || distance <= 4) return

  // espera um instante lendo o topo, rola até o fim e para um instante lá
  const pause = 1800
  const travel = Math.max(2000, props.duration - pause * 2)
  const startedAt = performance.now() + pause
  const step = (now) => {
    const progress = Math.min(1, Math.max(0, (now - startedAt) / travel))
    el.scrollTop = distance * progress
    if (progress < 1) rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}

watch(() => [props.slide, props.manual, props.cycle], startAutoScroll, { immediate: true })
onBeforeUnmount(stopAutoScroll)
</script>

<style scoped>
.rb-scroll {
  scrollbar-width: none;
}
.rb-scroll::-webkit-scrollbar {
  display: none;
}

@keyframes rb-fade {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.rb-row {
  animation: rb-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) var(--d, 0ms) backwards;
}
@keyframes rb-in {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
}
.rb-mine {
  position: relative;
  z-index: 2;
  background: linear-gradient(90deg, rgba(244, 180, 0, 0.28), rgba(244, 180, 0, 0.08)) !important;
  box-shadow: inset 0 0 0 2px rgba(244, 180, 0, 0.85), 0 0 30px rgba(244, 180, 0, 0.35);
  animation: rb-climb 1.3s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s backwards, rb-glow 1.4s ease-in-out 1.9s 3;
}
@keyframes rb-climb {
  0% {
    opacity: 0;
    transform: translateY(calc(100% * var(--k, 3))) scale(0.96);
  }
  20% {
    opacity: 1;
  }
  80% {
    transform: translateY(-6%) scale(1.03);
  }
  100% {
    transform: none;
  }
}
@keyframes rb-glow {
  50% {
    box-shadow: inset 0 0 0 2px #f4b400, 0 0 46px rgba(244, 180, 0, 0.7);
  }
}
.rb-fade {
  animation: rb-fade 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
}

@media (prefers-reduced-motion: reduce) {
  .rb-row,
  .rb-mine,
  .rb-fade {
    animation: none;
  }
}
</style>
