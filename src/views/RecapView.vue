<template>
  <div class="fixed inset-0 z-[9999] overflow-hidden text-white" :style="gradientStyle">
    <div v-if="loading" class="flex h-full items-center justify-center text-white/70">Carregando recap...</div>

    <div v-else-if="!recap" class="flex h-full items-center justify-center p-6 text-center">
      <div>
        <h1 class="font-elegant text-3xl font-bold">Recap não encontrado</h1>
        <p class="mt-2 text-white/70">Verifique o link com o organizador do evento.</p>
      </div>
    </div>

    <template v-else>
      <audio v-if="recap.music_url" ref="audioRef" loop preload="auto">
        <source :src="recap.music_url" type="audio/mpeg" />
      </audio>

      <!-- blobs decorativos: cor muda a cada slide, dão vida ao fundo -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          :key="`a-${step}`"
          class="blob blob-a"
          :style="{ background: `rgba(${currentTheme.a},0.55)` }"
        />
        <span
          :key="`b-${step}`"
          class="blob blob-b"
          :style="{ background: `rgba(${currentTheme.b},0.5)` }"
        />
      </div>

      <!-- barra de progresso estilo stories -->
      <div class="absolute inset-x-0 top-0 z-40 flex gap-1.5 p-4">
        <div v-for="(_, i) in slides" :key="i" class="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
          <span
            class="block h-full rounded-full bg-white transition-[width] duration-100 ease-linear"
            :style="{ width: `${i < step ? 100 : i === step ? progress : 0}%` }"
          />
        </div>
      </div>

      <!-- marca + controles: sempre por cima das zonas de toque -->
      <div class="absolute left-5 top-9 z-40 flex items-center gap-1.5 text-sm font-bold tracking-wide text-white/90">
        <Sparkles :size="16" /> PoleEventos
      </div>
      <div v-if="started" class="absolute right-4 top-7 z-40 flex items-center gap-2">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur
            transition-colors hover:bg-black/60"
          @click="togglePause"
        >
          <Pause v-if="!paused" :size="16" />
          <Play v-else :size="16" />
        </button>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur
            transition-colors hover:bg-black/60"
          @click="toggleMute"
        >
          <Volume2 v-if="!muted" :size="16" />
          <VolumeX v-else :size="16" />
        </button>
      </div>

      <!-- zonas de toque pra navegar, igual stories: esquerda volta, direita avança -->
      <button type="button" class="absolute inset-y-0 left-0 z-20 w-1/3" @click="prevSlide" />
      <button type="button" class="absolute inset-y-0 right-0 z-20 w-2/3" @click="nextSlide" />

      <div class="pointer-events-none relative z-30 flex h-full flex-col items-center justify-center px-6 py-16 text-center sm:px-16">
        <Transition name="slide-fade" mode="out-in">
          <div :key="step" class="flex w-full flex-col items-center" :class="currentSlide.type === 'gallery' ? 'max-w-none' : 'max-w-2xl'">
            <template v-if="currentSlide.type === 'intro'">
              <section class="recap-intro">
                <div class="recap-orb recap-orb--one"></div>
                <div class="recap-orb recap-orb--two"></div>
                <div class="recap-orb recap-orb--three"></div>

                <div class="recap-intro__content">
                  <div class="recap-intro__eyebrow">
                    <span class="recap-intro__sparkle">✳</span>
                    SUA NOITE EM RETROSPECTIVA
                  </div>

                  <p class="recap-intro__lead">Foi mais do que um evento.</p>

                  <h1 class="recap-intro__title">
                    {{ recap.event_name }}
                    <span class="recap-intro__title-accent">em replay.</span>
                  </h1>

                  <p class="recap-intro__description">
                    Os momentos, as fotos e as surpresas que fizeram essa festa acontecer.
                  </p>

                  <button
                    v-if="!started"
                    type="button"
                    class="recap-intro__button"
                    @click="begin"
                  >
                    <span class="recap-intro__play">▶</span>
                    Ver meu recap
                    <span aria-hidden="true">↗</span>
                  </button>

                  <div class="recap-intro__footer">
                    <span>FEITO PARA REVIVER</span>
                    <span>✳</span>
                    <span>Pole Eventos</span>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="currentSlide.type === 'bigMetric'">
              <section class="metric-slide">
                <div class="metric-slide__content">
                  <p class="metric-slide__kicker">
                    <span class="metric-slide__asterisk">✳</span>
                    {{ currentSlide.kicker }}
                  </p>

                  <p class="metric-slide__number font-elegant tabular-nums">
                    {{ animatedMetric }}
                  </p>

                  <div class="metric-slide__rule"></div>

                  <p class="metric-slide__text">
                    {{ currentSlide.text }}
                  </p>
                </div>

                <span class="metric-slide__decoration" aria-hidden="true">✳</span>
              </section>
            </template>

            <template v-else-if="currentSlide.type === 'ranking'">
              <section class="ranking-slide">
                <p class="ranking-slide__eyebrow">✳ OS FAVORITOS DA FESTA</p>
                <h2 class="ranking-slide__title">{{ currentSlide.title }}</h2>

                <!-- Vencedor -->
                <div v-if="currentSlide.items.length" class="ranking-winner">
                  <div class="ranking-winner__top">
                    <span>O CAMPEÃO DA NOITE</span>
                    <span>01 / {{ String(currentSlide.items.length).padStart(2, '0') }}</span>
                  </div>

                  <div class="ranking-winner__body">
                    <span class="ranking-winner__position">#1</span>
                    <p class="ranking-winner__name">
                      {{ currentSlide.items[0].name }}
                    </p>
                  </div>

                  <div class="ranking-winner__bottom">
                    <span>{{ currentSlide.items[0].detail }}</span>
                    <strong>{{ currentSlide.items[0].value }}</strong>
                  </div>
                </div>

                <!-- Demais posições -->
                <div v-if="currentSlide.items.length > 1" class="ranking-rest">
                  <p class="ranking-rest__label">O RESTO DO PÓDIO</p>

                  <div
                    v-for="(item, i) in currentSlide.items.slice(1)"
                    :key="i"
                    class="ranking-rest__item rank-item"
                    :style="{ animationDelay: `${(i + 1) * 90}ms` }"
                  >
                    <span class="ranking-rest__position">
                      {{ String(i + 2).padStart(2, '0') }}
                    </span>

                    <div class="ranking-rest__info">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.detail }}</span>
                    </div>

                    <strong class="ranking-rest__value">{{ item.value }}</strong>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="currentSlide.type === 'gallery'">
              <section class="gallery-full">
                <img
                  class="gallery-full__image"
                  :src="currentSlide.photo.photo_url"
                  :alt="`Foto de ${currentSlide.photo.player_name}`"
                />

                <div class="gallery-full__shade"></div>

                <h2 class="gallery-full__name">
                  {{ currentSlide.photo.player_name }}
                </h2>
              </section>
            </template>

            <template v-else-if="currentSlide.type === 'final'">
              <section class="recap-final">
                <div class="recap-final__card">
                  <div class="recap-final__top">
                    <span>✳ POLE EVENTOS RECAP</span>
                    <span>O GRANDE FINAL</span>
                  </div>

                  <div class="recap-final__hero">
                    <p>Uma festa para lembrar.</p>
                    <h2>{{ recap.event_name }}</h2>
                    <span class="recap-final__accent">em números.</span>
                  </div>

                  <div class="recap-final__stats">
                    <div>
                      <strong>{{ recap.data?.total_jogadas ?? 0 }}</strong>
                      <span>JOGADAS</span>
                    </div>
                    <div>
                      <strong>{{ recap.data?.total_jogadores ?? 0 }}</strong>
                      <span>JOGADORES</span>
                    </div>
                  </div>

                  <p class="recap-final__summary">
                    {{ currentSlide.text }}
                  </p>

                  <div class="recap-final__signature">
                    <span>VOCÊ FEZ PARTE DISSO</span>
                    <span>✳</span>
                  </div>
                </div>

                <div class="recap-final__actions pointer-events-auto">
                  <button
                    type="button"
                    class="recap-final__download"
                    @click="downloadSummaryImage"
                  >
                    <Download :size="20" />
                    Baixar meu recap
                  </button>

                  <button
                    type="button"
                    class="recap-final__restart"
                    @click="restart"
                  >
                    Assistir de novo ↗
                  </button>
                </div>
              </section>
            </template>
          </div>
        </Transition>
      </div>

      <p class="pointer-events-none absolute bottom-4 left-0 right-0 z-30 text-center text-xs text-white/40">
        {{ step + 1 }} / {{ slides.length }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Sparkles, Play, Pause, Volume2, VolumeX, Download } from '@lucide/vue'
import api from '@/services/api'

const route = useRoute()
const loading = ref(true)
const recap = ref(null)
const step = ref(0)
const progress = ref(0)
const started = ref(false)
const paused = ref(false)
const muted = ref(false)
const audioRef = ref(null)
const animatedMetric = ref(0)
let progressTimer = null
let metricFrameId = null

// Paleta "estilo Wrapped": cada slide troca de cor, sempre com base escura
// pro texto branco continuar legível por cima.
const THEMES = [
  { a: '16,147,155', b: '240,180,41', base: '#05161a' },
  { a: '236,72,153', b: '124,58,237', base: '#120821' },
  { a: '249,115,22', b: '239,68,68', base: '#210a05' },
  { a: '34,211,238', b: '59,130,246', base: '#041322' },
  { a: '132,204,22', b: '16,185,129', base: '#04170f' },
  { a: '250,204,21', b: '236,72,153', base: '#1a0f02' },
]

const slides = computed(() => {
  const d = recap.value?.data || {}
  const list = [
    { type: 'intro' },
    {
      type: 'bigMetric',
      kicker: 'Jogadas no evento',
      value: `${d.total_jogadas ?? 0}`,
      text: 'Total de partidas jogadas durante o evento.',
    },
    {
      type: 'bigMetric',
      kicker: 'Jogadores',
      value: `${d.total_jogadores ?? 0}`,
      text: 'Pessoas diferentes que jogaram.',
    },
  ]
  if (d.top_jogos?.length) {
    list.push({ type: 'ranking', title: 'Jogos mais jogados', items: d.top_jogos })
  }
  if (d.top_jogadores?.length) {
    list.push({ type: 'ranking', title: 'Ranking geral', items: d.top_jogadores })
  }
  ;(d.por_jogo || []).forEach((entry) => {
    if (entry.ranking?.length) {
      list.push({ type: 'ranking', title: `Ranking: ${entry.jogo}`, items: entry.ranking })
    }
  })
  if (d.fotos?.length) {
      d.fotos.forEach((foto) => {
        list.push({ type: 'gallery', photo: foto })
    })
}
  list.push({ type: 'final', text: d.resumo || '' })
  return list
})

const currentSlide = computed(() => slides.value[step.value] || slides.value[0])
const currentTheme = computed(() => THEMES[step.value % THEMES.length])

const gradientStyle = computed(() => {
  const t = currentTheme.value
  return {
    background:
      `radial-gradient(circle at 15% 15%, rgba(${t.a},0.55), transparent 45%),` +
      `radial-gradient(circle at 85% 20%, rgba(${t.b},0.45), transparent 50%),` +
      `radial-gradient(circle at 50% 95%, rgba(${t.a},0.3), transparent 55%),` +
      `${t.base}`,
  }
})

function progressIncrement() {
  if (currentSlide.value?.type === 'gallery') return 2
  if (currentSlide.value?.type === 'ranking') return 0.65
  return 0.8
}

function startProgress(reset = true) {
  clearInterval(progressTimer)
  if (reset) progress.value = 0
  progressTimer = setInterval(() => {
    progress.value += progressIncrement()
    if (progress.value >= 100) nextSlide()
  }, 80)
}

function stopProgress() {
  clearInterval(progressTimer)
}

function animateValue(setter, from, to, duration) {
  const startTime = performance.now()
  function tick(now) {
    const p = Math.min(1, (now - startTime) / duration)
    setter(Math.round(from + (to - from) * p))
    if (p < 1) return requestAnimationFrame(tick)
    setter(to)
  }
  return requestAnimationFrame(tick)
}

function nextSlide() {
  if (!started.value) return
  if (step.value < slides.value.length - 1) {
    step.value += 1
  } else {
    stopProgress()
  }
}

function prevSlide() {
  if (!started.value) return
  if (step.value > 0) step.value -= 1
}

function begin() {
  started.value = true
  if (audioRef.value) {
    audioRef.value.muted = muted.value
    audioRef.value.play().catch(() => {})
  }
  startProgress()
}

function restart() {
  step.value = 0
  paused.value = false
  audioRef.value?.play().catch(() => {})
  startProgress()
}

function togglePause() {
  paused.value = !paused.value
  if (paused.value) {
    stopProgress()
    audioRef.value?.pause()
  } else {
    startProgress(false)
    audioRef.value?.play().catch(() => {})
  }
}

function toggleMute() {
  muted.value = !muted.value
  if (audioRef.value) audioRef.value.muted = muted.value
}

watch(step, () => {
  if (started.value) startProgress()
})

watch(
  () => currentSlide.value,
  (slide) => {
    if (metricFrameId) cancelAnimationFrame(metricFrameId)
    if (slide?.type === 'bigMetric') {
      animatedMetric.value = 0
      metricFrameId = animateValue((v) => (animatedMetric.value = v), 0, Number(slide.value) || 0, 900)
    }
  },
  { immediate: true }
)

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ')
  let line = ''
  let curY = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY)
      line = word
      curY += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, curY)
  return curY + lineHeight
}

// Card de resumo desenhado num canvas (sem depender de captura de tela) —
// evita problemas de CORS com as fotos hospedadas no R2 e dá controle total
// do visual, no mesmo espírito colorido do resto do recap.
async function downloadSummaryImage() {
  await document.fonts.ready

  const d = recap.value?.data || {}
  const eventName = recap.value?.event_name || 'Seu evento'
  const champion = d.top_jogadores?.[0]
  const favoriteGame = d.jogo_mais_jogado || d.top_jogos?.[0]?.name

  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const lime = '#C7FF57'
  const white = '#FFFFFF'
  const muted = '#C8D3D0'
  const dark = '#101D22'

  function roundedRect(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  function fitText(text, maxWidth, startSize, minSize, weight = 900) {
    let size = startSize
    while (size > minSize) {
      ctx.font = `${weight} ${size}px Arial, sans-serif`
      if (ctx.measureText(text).width <= maxWidth) break
      size -= 2
    }
    return size
  }

  function drawWrapped(text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const words = String(text).split(/\s+/)
    const lines = []
    let line = ''

    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= maxWidth || !line) {
        line = next
      } else {
        lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)

    lines.slice(0, maxLines).forEach((value, index) => {
      ctx.fillText(value, x, y + index * lineHeight)
    })

    return Math.min(lines.length, maxLines)
  }

  // Fundo
  const background = ctx.createLinearGradient(0, 0, W, H)
  background.addColorStop(0, '#183B5A')
  background.addColorStop(0.48, '#202249')
  background.addColorStop(1, '#0D302C')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(850, 180, 20, 850, 180, 800)
  glow.addColorStop(0, 'rgba(199,255,87,0.48)')
  glow.addColorStop(1, 'rgba(199,255,87,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 1000)

  const bottomGlow = ctx.createRadialGradient(80, 1650, 0, 80, 1650, 750)
  bottomGlow.addColorStop(0, 'rgba(20,190,180,0.42)')
  bottomGlow.addColorStop(1, 'rgba(20,190,180,0)')
  ctx.fillStyle = bottomGlow
  ctx.fillRect(0, 900, W, 1020)

  // Elemento gráfico de fundo
  ctx.save()
  ctx.translate(900, 460)
  ctx.rotate(-0.22)
  ctx.font = '900 620px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.055)'
  ctx.textAlign = 'center'
  ctx.fillText('✳', 0, 0)
  ctx.restore()

  ctx.textAlign = 'left'

  // Cabeçalho
  ctx.fillStyle = lime
  ctx.font = '900 32px Arial, sans-serif'
  ctx.fillText('✳  POLE EVENTOS RECAP', 76, 115)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '700 27px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('MOMENTOS EM NÚMEROS', W - 76, 115)
  ctx.textAlign = 'left'

  // Título principal
  ctx.fillStyle = white
  ctx.font = '700 42px Arial, sans-serif'
  ctx.fillText('Uma festa para lembrar.', 76, 258)

  ctx.font = '900 104px Arial, sans-serif'
  const titleLines = drawWrapped(eventName, 76, 374, W - 152, 105, 3)

  const accentY = 374 + titleLines * 105 + 15
  ctx.fillStyle = lime
  ctx.font = 'italic 900 90px Arial, sans-serif'
  ctx.fillText('em replay.', 76, accentY)

  // Linha de divisão
  const dividerY = Math.max(accentY + 90, 730)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillRect(76, dividerY, W - 152, 2)

  // Números principais
  const statY = dividerY + 68
  const statWidth = 446
  const statHeight = 310

  ctx.fillStyle = 'rgba(255,255,255,0.11)'
  roundedRect(76, statY, statWidth, statHeight, 34)
  ctx.fill()
  roundedRect(558, statY, statWidth, statHeight, 34)
  ctx.fill()

  const stats = [
    { x: 110, value: d.total_jogadas ?? 0, label: 'JOGADAS' },
    { x: 592, value: d.total_jogadores ?? 0, label: 'JOGADORES' },
  ]

  stats.forEach(({ x, value, label }) => {
    ctx.fillStyle = lime
    const size = fitText(String(value), 370, 166, 96)
    ctx.font = `900 ${size}px Arial, sans-serif`
    ctx.fillText(String(value), x, statY + 190)

    ctx.fillStyle = white
    ctx.font = '900 28px Arial, sans-serif'
    ctx.fillText(label, x, statY + 260)
  })

  // Destaque do jogo
  const gameY = statY + statHeight + 54
  ctx.fillStyle = lime
  roundedRect(76, gameY, W - 152, 226, 34)
  ctx.fill()

  ctx.fillStyle = dark
  ctx.font = '900 27px Arial, sans-serif'
  ctx.fillText('O JOGO FAVORITO DA FESTA', 110, gameY + 62)

  const gameName = String(favoriteGame || 'Muita diversão')
  const gameSize = fitText(gameName, W - 220, 103, 55)
  ctx.font = `900 ${gameSize}px Arial, sans-serif`
  ctx.fillText(gameName, 110, gameY + 172)

  // Campeão, quando houver
  if (champion) {
    const championY = gameY + 282

    ctx.fillStyle = muted
    ctx.font = '900 27px Arial, sans-serif'
    ctx.fillText('QUEM DOMINOU O RANKING', 76, championY)

    ctx.fillStyle = white
    const championName = String(champion.name || 'Campeão')
    const championSize = fitText(championName, W - 152, 94, 52)
    ctx.font = `900 ${championSize}px Arial, sans-serif`
    ctx.fillText(championName, 76, championY + 105)

    ctx.fillStyle = lime
    ctx.font = '800 43px Arial, sans-serif'
    ctx.fillText(String(champion.value ?? ''), 76, championY + 168)
  }

  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(76, H - 174, W - 152, 2)

  ctx.fillStyle = white
  ctx.font = '900 31px Arial, sans-serif'
  ctx.fillText('FOI INESQUECÍVEL. ✳', 76, H - 104)

  ctx.fillStyle = muted
  ctx.font = '800 25px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('POLE EVENTOS', W - 76, H - 104)

  canvas.toBlob((blob) => {
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = eventName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    link.href = url
    link.download = `recap-${safeName}.png`
    link.click()

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}

async function load() {
  try {
    const { data } = await api.get(`/recap/${route.params.token}`)
    recap.value = data
  } catch (err) {
    recap.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
onUnmounted(stopProgress)
</script>

<style scoped>
/* Substitua apenas o conteúdo de <style scoped> por este CSS. */
:global(body) { margin: 0; }

.slide-fade-enter-active {
  transition: opacity .38s ease, transform .38s cubic-bezier(.22, 1, .36, 1);
}

.slide-fade-leave-active {
  transition: opacity .08s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.slide-fade-leave-to {
  opacity: 0;
}

.rank-item {
  border: 1px solid rgba(255,255,255,.2);
  box-shadow: 0 16px 45px rgba(0,0,0,.16);
  animation: pop-in .55s cubic-bezier(.22,1,.36,1) both;
}
.rank-item:first-child { background: rgba(255,255,255,.23); border-color: rgba(255,255,255,.45); }
.rank-item:nth-child(2) { background: rgba(255,255,255,.16); }
@keyframes pop-in {
  from { opacity: 0; transform: translateY(20px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.glass-text {
  background: linear-gradient(135deg,#fff 15%,#d9fff7 55%,#fff 88%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 10px 28px rgba(0,0,0,.22));
}

.blob {
  position: absolute;
  width: 56vmax;
  height: 56vmax;
  border-radius: 45%;
  filter: blur(105px);
  opacity: .45;
  mix-blend-mode: screen;
  animation: blob-float 20s ease-in-out infinite alternate;
}
.blob-a { top: -30%; left: -25%; }
.blob-b { right: -28%; bottom: -30%; animation-delay: -8s; }
@keyframes blob-float { to { transform: translate(8%, 7%) rotate(18deg) scale(1.13); } }

/* Capa: ocupa a tela toda mesmo dentro do contêiner max-w-2xl. */
.recap-intro {
  --lime: #c7ff57;
  position: fixed;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  padding: 90px 24px 62px;
  color: #fff;
  background:
    radial-gradient(ellipse at 86% 21%,rgba(199,255,87,.24),transparent 35%),
    radial-gradient(ellipse at 15% 76%,rgba(25,180,183,.45),transparent 40%),
    #101923;
  isolation: isolate;
  box-sizing: border-box;
}
.recap-intro::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: repeating-linear-gradient(145deg,transparent 0 82px,rgba(255,255,255,.035) 83px 84px);
  mask-image: linear-gradient(to bottom,black,transparent 90%);
}
.recap-intro::after {
  content: 'RECAP';
  position: absolute;
  right: -2vw;
  bottom: -7vw;
  z-index: -1;
  color: rgba(255,255,255,.035);
  font-size: min(27vw,440px);
  font-weight: 1000;
  letter-spacing: -.11em;
  line-height: 1;
  pointer-events: none;
}
.recap-orb {
  position: absolute;
  z-index: -1;
  border-radius: 43%;
  pointer-events: none;
  animation: orbit 17s ease-in-out infinite alternate;
}
.recap-orb--one {
  top: -28vmin;
  right: -8vmin;
  width: 62vmin;
  height: 62vmin;
  background: linear-gradient(125deg,#b7ff66,#00a99c);
  opacity: .62;
  transform: rotate(-25deg);
  filter: blur(18px);
}
.recap-orb--two {
  bottom: -35vmin;
  left: -20vmin;
  width: 72vmin;
  height: 72vmin;
  background: #12bbb5;
  opacity: .25;
  filter: blur(45px);
  animation-delay: -7s;
}
.recap-orb--three {
  top: 15%;
  left: 8%;
  width: 17vmin;
  height: 17vmin;
  border: 2px solid rgba(255,255,255,.23);
  background: rgba(255,255,255,.04);
  transform: rotate(27deg);
  animation-delay: -3s;
}
@keyframes orbit { to { translate: 6% 8%; rotate: 14deg; } }

.recap-intro__content {
  width: min(100%,960px);
  margin: auto;
  text-align: left;
  pointer-events: none;
  animation: cover-in .7s cubic-bezier(.22,1,.36,1) both;
}
@keyframes cover-in { from { opacity: 0; transform: translateY(26px); } }
.recap-intro__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 100px;
  background: rgba(255,255,255,.08);
  color: #fff;
  font-size: clamp(10px,1vw,12px);
  font-weight: 850;
  letter-spacing: .16em;
  backdrop-filter: blur(18px);
}
.recap-intro__sparkle { color: var(--lime); font-size: 18px; line-height: 1; }
.recap-intro__lead {
  margin: clamp(26px,5vh,55px) 0 10px;
  color: rgba(255,255,255,.83);
  font-size: clamp(17px,2.4vw,25px);
  font-weight: 650;
  letter-spacing: -.025em;
}
.recap-intro__title {
  max-width: 960px;
  margin: 0;
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
  font-size: clamp(64px, 11vw, 148px);
  font-weight: 950;
  line-height: .96;
  letter-spacing: -.075em;
  overflow-wrap: break-word;
  text-wrap: balance;
  text-shadow: 0 10px 44px rgba(0,0,0,.25);
}
.recap-intro__title-accent {
  display: block;
  width: fit-content;
  margin: 5px 0 0 clamp(0px,7vw,90px);
  color: var(--lime) !important;
  -webkit-text-fill-color: var(--lime) !important;
  font-size: .78em;
  font-style: italic;
  letter-spacing: -.085em;
  transform: rotate(-3deg);
  text-shadow: 0 9px 28px rgba(0,0,0,.3);
}
.recap-intro__description {
  max-width: 500px;
  margin: clamp(24px,4vh,42px) 0 0;
  color: rgba(255,255,255,.83);
  font-size: clamp(15px,1.6vw,19px);
  line-height: 1.5;
}
.recap-intro__button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  min-height: 66px;
  margin-top: clamp(24px,4vh,40px);
  padding: 10px 25px 10px 11px;
  border: 0;
  border-radius: 100px;
  background: var(--lime);
  color: #101923;
  font: inherit;
  font-size: 17px;
  font-weight: 850;
  box-shadow: 0 12px 34px rgba(0,0,0,.25),0 0 45px rgba(199,255,87,.22);
  cursor: pointer;
  pointer-events: auto;
  transition: transform .22s ease, box-shadow .22s ease;
}
.recap-intro__button:hover { transform: translateY(-4px); box-shadow: 0 18px 46px rgba(0,0,0,.28),0 0 55px rgba(199,255,87,.4); }
.recap-intro__button:active { transform: translateY(0) scale(.97); }
.recap-intro__button:focus-visible { outline: 3px solid #fff; outline-offset: 5px; }
.recap-intro__play {
  display: grid;
  width: 44px;
  height: 44px;
  flex: none;
  place-items: center;
  border-radius: 50%;
  background: #101923;
  color: var(--lime);
  font-size: 14px;
}
.recap-intro__footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: clamp(38px,6vh,72px);
  color: rgba(255,255,255,.58);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .17em;
}
.recap-intro__footer span:nth-child(2) { color: var(--lime); font-size: 16px; }

@media (min-width: 900px) {
  .recap-intro__content { padding-left: min(5vw,70px); }
}
@media (max-width: 640px) {
  .recap-intro { padding: 84px 24px 38px; }
  .recap-intro__content { text-align: left; }
  .recap-intro__title { font-size: clamp(48px,13vw,78px); line-height: 1.01; }
  .recap-intro__title-accent { margin-left: 10px; font-size: .8em; }
  .recap-intro__description { max-width: 340px; }
  .recap-intro__footer { margin-top: 40px; }
  .recap-orb--one { top: -15vmin; right: -25vmin; width: 95vmin; height: 95vmin; }
  .recap-orb--two { bottom: -20vmin; left: -55vmin; width: 115vmin; height: 115vmin; }
}
@media (max-height: 680px) {
  .recap-intro { padding-top: 70px; padding-bottom: 22px; }
  .recap-intro__lead { margin-top: 18px; }
  .recap-intro__description { margin-top: 15px; }
  .recap-intro__button { margin-top: 18px; min-height: 54px; }
  .recap-intro__footer { margin-top: 22px; }
}
@media (prefers-reduced-motion: reduce) {
  .blob,.recap-orb,.recap-intro__content,.rank-item { animation: none; }
  .slide-fade-enter-active,.slide-fade-leave-active { transition-duration: .01ms; }
}

/* SEGUNDA PAGINA */
.metric-slide {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 420px;
  overflow: hidden;
  padding: 40px 0;
  box-sizing: border-box;
  color: #fff;
  pointer-events: none;
  background: transparent;
}

.metric-slide::before {
  content: "";
  position: absolute;
  width: min(75vw, 850px);
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 50%;
  transform: rotate(-20deg) scaleX(1.35);
}

.metric-slide__content {
  position: relative;
  z-index: 1;
  width: min(100%, 850px);
  text-align: left;
}

.metric-slide__kicker {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: rgba(255, 255, 255, .8);
  font-size: clamp(12px, 1.4vw, 16px);
  font-weight: 850;
  letter-spacing: .23em;
  text-transform: uppercase;
}

.metric-slide__asterisk {
  color: #c7ff57;
  font-size: 26px;
  line-height: 1;
}

.metric-slide__number {
  margin: 10px 0 0;
  color: #c7ff57;
  font-size: clamp(170px, 32vw, 430px);
  font-weight: 950;
  line-height: .9;
  letter-spacing: -.12em;
  text-shadow: 0 20px 70px rgba(0, 0, 0, .28);
}

.metric-slide__rule {
  width: min(100%, 580px);
  height: 2px;
  margin: 28px 0;
  background: linear-gradient(90deg, #c7ff57, rgba(255, 255, 255, .15));
}

.metric-slide__text {
  max-width: 650px;
  margin: 0;
  color: rgba(255, 255, 255, .9);
  font-size: clamp(22px, 3.5vw, 38px);
  font-weight: 750;
  line-height: 1.18;
  letter-spacing: -.035em;
  text-wrap: balance;
}

.metric-slide__decoration {
  position: absolute;
  right: -4vw;
  bottom: -15vw;
  color: rgba(255, 255, 255, .045);
  font-size: min(55vw, 700px);
  line-height: 1;
}

@media (max-width: 640px) {
  .metric-slide {
    padding: 80px 26px 60px;
  }

  .metric-slide__number {
    font-size: clamp(155px, 43vw, 260px);
  }

  .metric-slide__rule {
    margin: 24px 0;
  }
}

/* TERCEIRA PAG */
.ranking-slide {
  width: 100%;
  max-width: 720px;
  color: #fff;
  text-align: left;
}

.ranking-slide__eyebrow {
  margin: 0 0 9px;
  color: #c7ff57;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .2em;
}

.ranking-slide__title {
  margin: 0 0 25px;
  color: #fff;
  font-size: clamp(38px, 7vw, 65px);
  font-weight: 950;
  line-height: 1;
  letter-spacing: -.065em;
}

/* Capa exclusiva do vencedor */
.ranking-winner {
  position: relative;
  display: flex;
  min-height: 285px;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 24px 28px;
  border: 1px solid rgba(199, 255, 87, .7);
  border-radius: 26px;
  background:
    radial-gradient(circle at 82% 20%, rgba(255, 255, 255, .35), transparent 28%),
    linear-gradient(125deg, #c7ff57 0%, #a4df35 60%, #69bd65 100%);
  color: #17201a;
  box-shadow: 0 24px 55px rgba(0, 0, 0, .24);
}

.ranking-winner::after {
  content: "✳";
  position: absolute;
  right: -30px;
  top: 0;
  color: rgba(23, 32, 26, .12);
  font-size: 320px;
  line-height: 1;
  pointer-events: none;
}

.ranking-winner__top,
.ranking-winner__bottom {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.ranking-winner__top {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .17em;
}

.ranking-winner__body {
  position: relative;
  z-index: 1;
}

.ranking-winner__position {
  display: inline-block;
  margin-bottom: 2px;
  font-size: 24px;
  font-weight: 950;
}

.ranking-winner__name {
  max-width: 90%;
  margin: 0;
  font-size: clamp(68px, 12vw, 130px);
  font-weight: 1000;
  line-height: .85;
  letter-spacing: -.09em;
  overflow-wrap: anywhere;
}

.ranking-winner__bottom {
  font-size: 14px;
  font-weight: 700;
}

.ranking-winner__bottom strong {
  font-size: clamp(18px, 3vw, 26px);
  font-weight: 950;
  white-space: nowrap;
}

/* Lista abaixo do vencedor */
.ranking-rest {
  margin-top: 24px;
}

.ranking-rest__label {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, .65);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .2em;
}

.rank-item {
  animation: pop-in .55s cubic-bezier(.22, 1, .36, 1) both;
}

.ranking-rest__item {
  display: flex;
  align-items: center;
  gap: 17px;
  min-height: 70px;
  margin-top: 8px;
  padding: 12px 18px;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 16px;
  background: rgba(255, 255, 255, .11);
  backdrop-filter: blur(14px);
}

.ranking-rest__position {
  flex: 0 0 42px;
  color: rgba(255, 255, 255, .55);
  font-size: 31px;
  font-weight: 950;
  letter-spacing: -.07em;
}

.ranking-rest__info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.ranking-rest__info strong {
  font-size: 19px;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.ranking-rest__info span {
  margin-top: 3px;
  color: rgba(255, 255, 255, .6);
  font-size: 12px;
}

.ranking-rest__value {
  max-width: 130px;
  font-size: 15px;
  text-align: right;
}

@media (max-width: 640px) {
  .ranking-slide__title {
    margin-bottom: 18px;
    font-size: clamp(38px, 10vw, 55px);
  }

  .ranking-winner {
    min-height: 240px;
    padding: 19px;
    border-radius: 21px;
  }

  .ranking-winner::after {
    right: -50px;
    top: 20px;
    font-size: 240px;
  }

  .ranking-winner__top {
    font-size: 9px;
  }

  .ranking-winner__name {
    font-size: clamp(64px, 18vw, 105px);
  }

  .ranking-winner__bottom {
    font-size: 12px;
  }

  .ranking-rest {
    margin-top: 18px;
  }

  .ranking-rest__item {
    gap: 10px;
    min-height: 64px;
    padding: 10px 12px;
  }

  .ranking-rest__position {
    flex-basis: 36px;
    font-size: 27px;
  }

  .ranking-rest__info strong {
    font-size: 16px;
  }

  .ranking-rest__value {
    max-width: 83px;
    font-size: 12px;
  }
}

/* GALERIA */
.gallery-full {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100svh;
  flex: none;
  overflow: hidden;
  background: #151515;
  text-align: left;
}

.gallery-full__photos {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(
    min(var(--photo-count), 4),
    minmax(0, 1fr)
  );
  grid-auto-rows: minmax(0, 1fr);
  gap: 4px;
}

.gallery-full__image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center;
}

.gallery-full__shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, .12),
    transparent 35%,
    rgba(0, 0, 0, .15) 55%,
    rgba(0, 0, 0, .82)
  );
}

.gallery-full__name {
  position: absolute;
  right: 28px;
  bottom: clamp(75px, 12vh, 140px);
  left: 28px;
  margin: 0;
  color: #fff;
  font-size: clamp(68px, 15vw, 170px);
  font-weight: 950;
  line-height: .9;
  letter-spacing: -.075em;
  overflow-wrap: anywhere;
  text-shadow: 0 8px 30px rgba(0, 0, 0, .45);
}

@media (max-width: 640px) {
  .gallery-full__photos {
    grid-template-columns: repeat(
      min(var(--photo-count), 2),
      minmax(0, 1fr)
    );
  }

  .gallery-full__name {
    right: 22px;
    bottom: 105px;
    left: 22px;
    font-size: clamp(62px, 18vw, 100px);
  }
}

/* FINAL */

.recap-final {
  width: 100%;
  max-width: 650px;
  color: #fff;
  text-align: left;
}

.recap-final__card {
  position: relative;
  overflow: hidden;
  min-height: 550px;
  padding: clamp(24px, 5vw, 42px);
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 28px;
  background:
    radial-gradient(circle at 90% 8%, rgba(205, 255, 82, .65), transparent 31%),
    radial-gradient(circle at -5% 95%, rgba(70, 219, 208, .5), transparent 41%),
    linear-gradient(145deg, #283073 0%, #272052 51%, #122c3b 100%);
  box-shadow: 0 25px 80px rgba(0, 0, 0, .3);
}

.recap-final__card::before {
  content: "✳";
  position: absolute;
  top: 42px;
  right: -100px;
  color: rgba(255, 255, 255, .11);
  font-size: 390px;
  line-height: 1;
  pointer-events: none;
}

.recap-final__top,
.recap-final__signature {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .14em;
}

.recap-final__hero {
  position: relative;
  z-index: 1;
  margin-top: clamp(40px, 8vh, 85px);
}

.recap-final__hero p {
  margin: 0 0 12px;
  font-size: clamp(17px, 3vw, 24px);
  font-weight: 650;
}

.recap-final__hero h2 {
  max-width: 550px;
  margin: 0;
  color: #fff;
  font-size: clamp(52px, 10vw, 105px);
  font-weight: 950;
  line-height: .9;
  letter-spacing: -.075em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.recap-final__accent {
  display: block;
  margin-top: 8px;
  color: #c7ff57;
  font-size: clamp(36px, 7vw, 70px);
  font-weight: 950;
  font-style: italic;
  line-height: 1;
  letter-spacing: -.07em;
}

.recap-final__stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: clamp(35px, 7vh, 65px);
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, .5);
}

.recap-final__stats div {
  display: flex;
  flex-direction: column;
}

.recap-final__stats strong {
  color: #c7ff57;
  font-size: clamp(55px, 10vw, 90px);
  font-weight: 950;
  line-height: 1;
  letter-spacing: -.08em;
}

.recap-final__stats span {
  margin-top: 7px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .16em;
}

.recap-final__summary {
  position: relative;
  z-index: 1;
  margin: 26px 0 0;
  color: rgba(255, 255, 255, .86);
  font-size: clamp(15px, 2vw, 19px);
  line-height: 1.4;
}

.recap-final__signature {
  margin-top: 35px;
  color: rgba(255, 255, 255, .66);
}

.recap-final__signature span:last-child {
  color: #c7ff57;
  font-size: 19px;
  line-height: .6;
}

.recap-final__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.recap-final__actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 58px;
  padding: 14px 23px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 850;
  cursor: pointer;
  transition: transform .2s ease;
}

.recap-final__actions button:hover {
  transform: translateY(-3px);
}

.recap-final__actions button:active {
  transform: scale(.97);
}

.recap-final__download {
  border: 0;
  background: #c7ff57;
  color: #17201a;
}

.recap-final__restart {
  border: 1px solid rgba(255, 255, 255, .65);
  background: rgba(255, 255, 255, .08);
  color: #fff;
}

@media (max-width: 640px) {
  .recap-final__card {
    min-height: 0;
    padding: 23px;
    border-radius: 22px;
  }

  .recap-final__card::before {
    top: 70px;
    right: -75px;
    font-size: 270px;
  }

  .recap-final__top {
    font-size: 8px;
  }

  .recap-final__hero {
    margin-top: 42px;
  }

  .recap-final__hero h2 {
    font-size: clamp(48px, 12vw, 75px);
  }

  .recap-final__stats {
    margin-top: 38px;
  }

  .recap-final__stats strong {
    font-size: 63px;
  }

  .recap-final__summary {
    margin-top: 20px;
    font-size: 14px;
  }

  .recap-final__signature {
    margin-top: 25px;
  }

  .recap-final__actions {
    flex-direction: column;
  }

  .recap-final__actions button {
    width: 100%;
  }
}

@media (max-height: 740px) {
  .recap-final__hero {
    margin-top: 25px;
  }

  .recap-final__stats {
    margin-top: 25px;
  }

  .recap-final__signature {
    margin-top: 18px;
  }
}
</style>