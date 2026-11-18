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
          <div :key="step" class="flex w-full flex-col items-center" :class="'max-w-2xl'">
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
                    Os momentos e as surpresas que fizeram essa festa acontecer.
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
                <p class="ranking-slide__eyebrow rk-fade" style="--d: 0ms">{{ currentSlide.eyebrow || '✳ OS FAVORITOS DA FESTA' }}</p>
                <h2 class="ranking-slide__title rk-fade" style="--d: 120ms">{{ currentSlide.title }}</h2>

                <!-- Vencedor: entra por último, com tudo -->
                <div v-if="currentSlide.items.length" class="ranking-winner-wrap">
                  <div class="ranking-winner" :class="{ 'is-in': winnerShown }">
                    <span class="winner-shine" aria-hidden="true" />

                    <div class="ranking-winner__top">
                      <span>{{ currentSlide.championLabel || 'O CAMPEÃO DA NOITE' }}</span>
                      <span>01 / {{ String(currentSlide.items.length).padStart(2, '0') }}</span>
                    </div>

                    <div class="ranking-winner__body">
                      <span class="winner-crown" aria-hidden="true"><Crown :size="34" /></span>
                      <span class="ranking-winner__position">#1</span>
                      <p class="ranking-winner__name" :aria-label="currentSlide.items[0].name">
                        <span v-for="(word, w) in winnerWords" :key="w" class="rk-word" aria-hidden="true">
                          <span v-for="(ch, c) in word.chars" :key="c" class="rk-char" :style="{ '--i': word.start + c }">{{ ch }}</span>
                        </span>
                      </p>
                    </div>

                    <div class="ranking-winner__bottom">
                      <span>{{ currentSlide.items[0].detail }}</span>
                      <strong><CountUpText :text="currentSlide.items[0].value" :active="winnerShown" :duration="1500" :delay="450" /></strong>
                    </div>
                  </div>

                  <!-- confete -->
                  <div v-if="confetti.length" class="confetti" aria-hidden="true">
                    <i v-for="(piece, i) in confetti" :key="i" class="confetti__piece" :style="piece" />
                  </div>
                </div>

                <!-- Demais posições: sobem de baixo pra cima, criando suspense -->
                <div v-if="currentSlide.items.length > 1" class="ranking-rest">
                  <p class="ranking-rest__label rk-fade" style="--d: 260ms">O RESTO DO PÓDIO</p>

                  <div
                    v-for="(item, i) in currentSlide.items.slice(1)"
                    :key="i"
                    class="ranking-rest__item"
                    :class="{ 'is-in': isRestShown(i) }"
                  >
                    <span class="ranking-rest__position">
                      {{ String(i + 2).padStart(2, '0') }}
                    </span>

                    <div class="ranking-rest__info">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.detail }}</span>
                    </div>

                    <strong class="ranking-rest__value">
                      <CountUpText :text="item.value" :active="isRestShown(i)" :duration="900" :delay="250" />
                    </strong>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="currentSlide.type === 'karaokeBest'">
              <section class="ranking-slide">
                <p class="ranking-slide__eyebrow rk-fade" style="--d: 0ms">✳ NO KARAOKÊ</p>
                <h2 class="ranking-slide__title rk-fade" style="--d: 120ms">A maior nota da noite</h2>

                <div class="ranking-winner-wrap">
                  <div class="ranking-winner is-in">
                    <span class="winner-shine" aria-hidden="true" />

                    <div class="ranking-winner__top">
                      <span>NOTA MÁXIMA EM UMA APRESENTAÇÃO</span>
                      <span>1000 pts</span>
                    </div>

                    <div class="ranking-winner__body">
                      <span class="winner-crown" aria-hidden="true"><Crown :size="34" /></span>
                      <span class="ranking-winner__position">🎤</span>
                      <p class="ranking-winner__name" :aria-label="currentSlide.best.player_name">
                        <span v-for="(word, w) in winnerWords" :key="w" class="rk-word" aria-hidden="true">
                          <span v-for="(ch, c) in word.chars" :key="c" class="rk-char" :style="{ '--i': word.start + c }">{{ ch }}</span>
                        </span>
                      </p>
                    </div>

                    <div class="ranking-winner__bottom">
                      <span>{{ currentSlide.best.song }}</span>
                      <strong><CountUpText :text="`${currentSlide.best.score} pts`" active :duration="1800" :delay="500" /></strong>
                    </div>
                  </div>

                  <div v-if="confetti.length" class="confetti" aria-hidden="true">
                    <i v-for="(piece, i) in confetti" :key="i" class="confetti__piece" :style="piece" />
                  </div>
                </div>

                <!-- trecho da gravação -->
                <div v-if="currentSlide.best.recording_url" class="kbest-player rk-fade" style="--d: 900ms">
                  <div class="kbest-bars" :class="{ 'is-playing': snippetPlaying }" aria-hidden="true">
                    <i v-for="n in 26" :key="n" :style="{ animationDelay: `${(n * 83) % 700}ms`, animationDuration: `${620 + ((n * 137) % 520)}ms` }" />
                  </div>
                  <div class="kbest-player__row">
                    <span class="kbest-player__label">{{ snippetPlaying ? 'Ouvindo um trecho da apresentação...' : 'Ouça um trecho da apresentação' }}</span>
                    <button type="button" class="kbest-player__btn pointer-events-auto" @click.stop="playBestSnippet">
                      <Play v-if="!snippetPlaying" :size="15" /> <Pause v-else :size="15" />
                      {{ snippetPlaying ? 'Parar' : 'Ouvir' }}
                    </button>
                  </div>
                </div>
                <p v-else class="kbest-player__none rk-fade" style="--d: 900ms">A gravação desta apresentação não foi salva.</p>
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

                  <p v-if="summary.dateLine" class="recap-final__date">{{ summary.dateLine }}</p>

                  <div class="recap-final__stats recap-final__stats--four">
                    <div v-for="stat in summary.stats" :key="stat.label">
                      <strong>{{ stat.value }}</strong>
                      <span>{{ stat.label }}</span>
                    </div>
                  </div>

                  <div class="fs-grid">
                    <div v-if="summary.favorite" class="fs-card fs-card--lime fs-span">
                      <small>O JOGO FAVORITO DA FESTA</small>
                      <strong>{{ summary.favorite.name }}</strong>
                      <span>{{ summary.favorite.value }}</span>
                    </div>
                    <div v-if="summary.bestScore" class="fs-card">
                      <small>MAIOR PONTUAÇÃO EM UMA PARTIDA</small>
                      <strong>{{ summary.bestScore.player_name }}</strong>
                      <span>{{ summary.bestScore.score }} pts · {{ summary.bestScore.game }}</span>
                    </div>
                    <div v-if="summary.mostActive" class="fs-card">
                      <small>QUEM MAIS JOGOU</small>
                      <strong>{{ summary.mostActive.name }}</strong>
                      <span>{{ summary.mostActive.count }} {{ summary.mostActive.count === 1 ? 'partida' : 'partidas' }}</span>
                    </div>
                  </div>

                  <div v-if="summary.podium.length" class="fs-block">
                    <p class="fs-label">TOP 3 DA NOITE</p>
                    <div v-for="(item, i) in summary.podium" :key="i" class="fs-row">
                      <span class="fs-medal" :class="`fs-medal--${i + 1}`">{{ i + 1 }}</span>
                      <strong>{{ item.name }}</strong>
                      <em>{{ item.value }}</em>
                    </div>
                  </div>

                  <div v-if="summary.karaoke" class="fs-block">
                    <p class="fs-label">NO KARAOKÊ</p>
                    <div class="fs-grid fs-grid--three">
                      <div v-if="summary.karaoke.song" class="fs-card fs-card--small">
                        <small>MÚSICA DA NOITE</small>
                        <strong>{{ summary.karaoke.song.name }}</strong>
                        <span>{{ summary.karaoke.song.value }}</span>
                      </div>
                      <div v-if="summary.karaoke.singer" class="fs-card fs-card--small">
                        <small>REI DO MICROFONE</small>
                        <strong>{{ summary.karaoke.singer.name }}</strong>
                        <span>{{ summary.karaoke.singer.value }}</span>
                      </div>
                      <div v-if="summary.karaoke.best" class="fs-card fs-card--small">
                        <small>MAIOR NOTA</small>
                        <strong>{{ summary.karaoke.best.player_name }}</strong>
                        <span>{{ summary.karaoke.best.score }} pts</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="summary.target" class="fs-block">
                    <p class="fs-label">NO PARE NO ALVO</p>
                    <div class="fs-grid fs-grid--three">
                      <div v-for="card in summary.target" :key="card.label" class="fs-card fs-card--small">
                        <small>{{ card.label }}</small>
                        <strong>{{ card.name }}</strong>
                        <span>{{ card.sub }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="summary.timing" class="fs-block">
                    <p class="fs-label">NO ACERTE O TEMPO</p>
                    <div class="fs-grid fs-grid--three">
                      <div v-for="card in summary.timing" :key="card.label" class="fs-card fs-card--small">
                        <small>{{ card.label }}</small>
                        <strong>{{ card.name }}</strong>
                        <span>{{ card.sub }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="summary.champions.length > 1" class="fs-block">
                    <p class="fs-label">CAMPEÕES POR JOGO</p>
                    <div v-for="(item, i) in summary.champions" :key="i" class="fs-champion">
                      <span>{{ item.game }}</span>
                      <strong>{{ item.name }}</strong>
                    </div>
                  </div>

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
import { Sparkles, Play, Pause, Volume2, VolumeX, Download, Crown } from '@lucide/vue'
import api from '@/services/api'
import CountUpText from '@/components/CountUpText.vue'

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

// ---- revelação do ranking (suspense) --------------------------------------
const restShown = ref(0) // quantos dos "demais" já apareceram (de baixo pra cima)
const winnerShown = ref(false)
const confetti = ref([])
let rankTimers = []
const REVEAL_START = 800
const REVEAL_STEP = 700

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// o lugar i (0 = 2º colocado) aparece quando o contador chega nele, começando do último
function isRestShown(i) {
  const restCount = (currentSlide.value?.items?.length || 1) - 1
  return i >= restCount - restShown.value
}

// nome do campeão em palavras/letras, cada letra com seu atraso (efeito de letras subindo)
const winnerWords = computed(() => {
  const slide = currentSlide.value
  const name = (slide?.type === 'karaokeBest' ? slide.best?.player_name : slide?.items?.[0]?.name) || ''
  let counter = 0
  return name.split(' ').filter(Boolean).map((word) => {
    const chars = word.split('')
    const entry = { chars, start: counter }
    counter += chars.length + 1
    return entry
  })
})

function makeConfetti() {
  const colors = ['#c7ff57', '#ffffff', '#ffd23f', '#ff7ab6', '#7fe3e8', '#ff9f43']
  return Array.from({ length: 56 }, () => {
    const dx = (Math.random() - 0.5) * 760
    const dy = -(120 + Math.random() * 360)
    const size = 7 + Math.random() * 9
    return {
      '--dx': `${dx.toFixed(0)}px`,
      '--dy': `${dy.toFixed(0)}px`,
      '--fall': `${(240 + Math.random() * 260).toFixed(0)}px`,
      '--rot': `${(Math.random() * 900 - 450).toFixed(0)}deg`,
      width: `${size.toFixed(0)}px`,
      height: `${(size * (Math.random() > 0.5 ? 1 : 0.45)).toFixed(0)}px`,
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: Math.random() > 0.6 ? '50%' : '2px',
      animationDelay: `${(Math.random() * 260).toFixed(0)}ms`,
      animationDuration: `${(1700 + Math.random() * 900).toFixed(0)}ms`,
    }
  })
}

// ---- trecho da gravação da maior nota ---------------------------------------
const snippetPlaying = ref(false)
let snippetVoice = null
let snippetMusic = null
let snippetTimer = null
const SNIPPET_SECONDS = 13

function setBackgroundVolume(volume) {
  if (audioRef.value) audioRef.value.volume = volume
}

function stopSnippet() {
  clearTimeout(snippetTimer)
  for (const el of [snippetVoice, snippetMusic]) {
    if (el) {
      el.onended = null
      el.pause()
    }
  }
  snippetVoice = null
  snippetMusic = null
  if (snippetPlaying.value) setBackgroundVolume(1)
  snippetPlaying.value = false
}

// A voz gravada toca junto com a música original, a partir de uns segundos depois da 1ª frase
// (pra não cair numa introdução instrumental). A música de fundo do recap fica MUDA enquanto o
// trecho toca (continua rodando, só sem som) e volta ao normal quando ele termina.
async function playBestSnippet() {
  if (snippetPlaying.value) {
    stopSnippet()
    return
  }
  const best = currentSlide.value?.best
  if (!best?.recording_url) return

  stopSnippet()
  const voice = new Audio(best.recording_url)
  const music = best.audio_url ? new Audio(best.audio_url) : null
  voice.volume = 1
  if (music) music.volume = 0.22
  snippetVoice = voice
  snippetMusic = music

  const start = Number(best.snippet_start || 0) + 6
  try {
    await new Promise((resolve) => {
      if (voice.readyState >= 1) resolve()
      else {
        voice.addEventListener('loadedmetadata', resolve, { once: true })
        voice.addEventListener('error', resolve, { once: true })
      }
    })
    if (snippetVoice !== voice) return
    // gravações sem duração (webm do navegador) podem não deixar pular: usa onde ele realmente parou
    try {
      voice.currentTime = start
    } catch (err) {
      // segue do início
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
    if (music) music.currentTime = voice.currentTime
    setBackgroundVolume(0)
    snippetPlaying.value = true
    await Promise.all([voice.play(), music ? music.play() : Promise.resolve()])
    snippetTimer = setTimeout(stopSnippet, SNIPPET_SECONDS * 1000)
    voice.onended = stopSnippet
  } catch (err) {
    stopSnippet()
  }
}

function clearRankTimers() {
  rankTimers.forEach(clearTimeout)
  rankTimers = []
}

function runRankingReveal(slide) {
  clearRankTimers()
  const restCount = Math.max(0, (slide.items?.length || 1) - 1)
  restShown.value = 0
  winnerShown.value = false
  confetti.value = []

  if (prefersReducedMotion()) {
    restShown.value = restCount
    winnerShown.value = true
    return
  }

  for (let k = 1; k <= restCount; k += 1) {
    rankTimers.push(setTimeout(() => (restShown.value = k), REVEAL_START + (k - 1) * REVEAL_STEP))
  }
  // pausa dramática antes do campeão
  const winnerAt = REVEAL_START + restCount * REVEAL_STEP + 500
  rankTimers.push(
    setTimeout(() => {
      winnerShown.value = true
      confetti.value = makeConfetti()
    }, winnerAt)
  )
}

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
  // karaokê: só aparece se alguém cantou
  const karaoke = d.karaoke
  if (karaoke?.musicas_mais_cantadas?.length) {
    list.push({
      type: 'ranking',
      title: 'Músicas mais cantadas',
      eyebrow: '✳ NO KARAOKÊ',
      championLabel: 'A MÚSICA DA NOITE',
      items: karaoke.musicas_mais_cantadas,
    })
  }
  if (karaoke?.quem_mais_cantou?.length) {
    list.push({
      type: 'ranking',
      title: 'Quem mais cantou',
      eyebrow: '✳ NO KARAOKÊ',
      championLabel: 'O REI DO MICROFONE',
      items: karaoke.quem_mais_cantou,
    })
  }
  if (karaoke?.maior_nota) list.push({ type: 'karaokeBest', best: karaoke.maior_nota })
  // pare no alvo: só aparece se alguém jogou
  if (d.pare_no_alvo?.mais_longe?.length) {
    list.push({
      type: 'ranking',
      title: 'Quem foi mais longe',
      eyebrow: '✳ NO PARE NO ALVO',
      championLabel: 'O MESTRE DA MIRA',
      items: d.pare_no_alvo.mais_longe,
    })
  }
  // acerte o tempo: só aparece se alguém jogou
  if (d.acerte_o_tempo?.mais_perto?.length) {
    list.push({
      type: 'ranking',
      title: 'Quem chegou mais perto',
      eyebrow: '✳ NO ACERTE O TEMPO',
      championLabel: 'O RELÓGIO SUÍÇO',
      items: d.acerte_o_tempo.mais_perto,
    })
  }
  list.push({ type: 'final', text: d.resumo || '' })
  return list
})

const currentSlide = computed(() => slides.value[step.value] || slides.value[0])

function formatEventDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Tudo que o resumo final mostra (na tela e na imagem pra baixar). Cada bloco é opcional: só
// entra o que o evento realmente tem.
const summary = computed(() => {
  const d = recap.value?.data || {}
  const info = recap.value?.event_info || {}
  const plays = d.total_jogadas ?? 0
  const players = d.total_jogadores ?? 0
  const karaoke = d.karaoke
  const timing = d.acerte_o_tempo
  const target = d.pare_no_alvo

  return {
    dateLine: [formatEventDate(info.starts_at), info.location].filter(Boolean).join(' · '),
    stats: [
      { value: plays, label: 'JOGADAS' },
      { value: players, label: 'JOGADORES' },
      { value: d.jogos_jogados ?? d.top_jogos?.length ?? 0, label: 'JOGOS' },
      { value: players ? (plays / players).toFixed(1).replace('.', ',') : '0', label: 'POR PESSOA' },
    ],
    favorite: d.top_jogos?.[0] ? { name: d.jogo_mais_jogado || d.top_jogos[0].name, value: d.top_jogos[0].value } : null,
    bestScore: d.melhor_jogada || null,
    mostActive: d.mais_partidas || null,
    podium: (d.top_jogadores || []).slice(0, 3),
    champions: (d.por_jogo || [])
      .filter((entry) => entry.ranking?.length)
      .map((entry) => ({ game: entry.jogo, name: entry.ranking[0].name, value: entry.ranking[0].value }))
      .slice(0, 3),
    karaoke: karaoke
      ? { song: karaoke.musicas_mais_cantadas?.[0], singer: karaoke.quem_mais_cantou?.[0], best: karaoke.maior_nota }
      : null,
    target: target
      ? [
          { label: 'FOI MAIS LONGE', name: target.melhor.player_name, sub: target.melhor.value },
          { label: 'PRECISÃO MÉDIA', name: `${target.precisao_media}%`, sub: `${target.tentativas} ${target.tentativas === 1 ? 'tentativa' : 'tentativas'}` },
          { label: 'MÉDIA DE NÍVEIS', name: target.media_niveis, sub: 'por tentativa' },
        ]
      : null,
    timing: timing
      ? [
          { label: 'MAIS PRECISO', name: timing.melhor.player_name, sub: timing.melhor.value },
          { label: 'NA MOSCA', name: `${timing.na_mosca}`, sub: timing.na_mosca === 1 ? 'tentativa exata' : 'tentativas exatas' },
          { label: 'PRECISÃO MÉDIA', name: `± ${timing.media} s`, sub: `${timing.tentativas} ${timing.tentativas === 1 ? 'tentativa' : 'tentativas'}` },
        ]
      : null,
  }
})
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
  const slide = currentSlide.value
  if (slide?.type === 'karaokeBest') return 100 / (17000 / 80)
  if (slide?.type === 'ranking') {
    // tempo da revelação (cada lugar + campeão) + uns segundos pra apreciar o resultado
    const ms = 6500 + (slide.items?.length || 1) * 1000
    return 100 / (ms / 80)
  }
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
    stopSnippet()
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
    stopSnippet()
    if (slide?.type === 'ranking') runRankingReveal(slide)
    else clearRankTimers()
    if (slide?.type === 'karaokeBest') {
      confetti.value = []
      rankTimers.push(setTimeout(() => (confetti.value = makeConfetti()), 700))
      // começa a tocar sozinho (a pessoa já tocou em "Ver meu recap", então o navegador deixa)
      if (started.value) rankTimers.push(setTimeout(playBestSnippet, 2200))
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
// dá controle total do visual, no mesmo espírito colorido do resto do recap.
async function downloadSummaryImage() {
  await document.fonts.ready

  const eventName = recap.value?.event_name || 'Seu evento'
  const sm = summary.value

  const W = 1080
  const H = 1920
  const M = 76
  const CW = W - M * 2
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const lime = '#C7FF57'
  const white = '#FFFFFF'
  const muted = '#C8D3D0'
  const dark = '#101D22'
  const FONT = 'Arial, sans-serif'

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

  function box(x, y, w, h, radius, color) {
    ctx.fillStyle = color
    roundedRect(x, y, w, h, radius)
    ctx.fill()
  }

  // escreve um texto; com maxWidth, reduz a fonte até caber
  function write(value, x, y, { size = 28, weight = 900, color = white, align = 'left', maxWidth = 0, min = 16, italic = false } = {}) {
    const textValue = String(value ?? '')
    let fontSize = size
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${fontSize}px ${FONT}`
    if (maxWidth) {
      while (fontSize > min && ctx.measureText(textValue).width > maxWidth) {
        fontSize -= 2
        ctx.font = `${italic ? 'italic ' : ''}${weight} ${fontSize}px ${FONT}`
      }
    }
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.fillText(textValue, x, y)
    ctx.textAlign = 'left'
  }

  function drawWrapped(text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const words = String(text).split(/\s+/)
    const lines = []
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= maxWidth || !line) line = next
      else {
        lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
    lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight))
    return Math.min(lines.length, maxLines)
  }

  // ---- fundo ----
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

  ctx.save()
  ctx.translate(900, 420)
  ctx.rotate(-0.22)
  ctx.font = `900 620px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.055)'
  ctx.textAlign = 'center'
  ctx.fillText('✳', 0, 0)
  ctx.restore()
  ctx.textAlign = 'left'

  // ---- cabeçalho e título ----
  write('✳  POLE EVENTOS RECAP', M, 105, { size: 30, color: lime })
  write('RESUMO DA NOITE', W - M, 105, { size: 26, weight: 700, color: 'rgba(255,255,255,0.55)', align: 'right' })

  write('Uma festa para lembrar.', M, 188, { size: 36, weight: 700 })
  ctx.font = `900 92px ${FONT}`
  ctx.fillStyle = white
  const titleLines = drawWrapped(eventName, M, 282, CW, 94, 2)
  let y = 282 + (titleLines - 1) * 94
  write('em replay.', M, y + 76, { size: 68, color: lime, italic: true })
  y += 76
  if (sm.dateLine) {
    write(sm.dateLine, M, y + 50, { size: 28, weight: 600, color: muted, maxWidth: CW })
    y += 50
  }
  y += 44

  // ---- blocos (os menos importantes só entram se couberem) ----
  const GAP = 22
  const LIMIT = H - 200
  const blocks = []

  // números principais
  blocks.push({
    h: 150,
    draw(top) {
      const w = (CW - 16 * 3) / 4
      sm.stats.forEach((stat, i) => {
        const x = M + i * (w + 16)
        box(x, top, w, 150, 28, 'rgba(255,255,255,0.11)')
        write(stat.value, x + 22, top + 88, { size: 66, color: lime, maxWidth: w - 40, min: 36 })
        write(stat.label, x + 22, top + 126, { size: 19, color: white })
      })
    },
  })

  // jogo favorito
  if (sm.favorite) {
    blocks.push({
      h: 130,
      draw(top) {
        box(M, top, CW, 130, 30, lime)
        write('O JOGO FAVORITO DA FESTA', M + 30, top + 36, { size: 21, color: dark })
        write(sm.favorite.name, M + 30, top + 108, { size: 62, color: dark, maxWidth: CW - 280, min: 34 })
        write(sm.favorite.value, W - M - 30, top + 108, { size: 32, color: dark, align: 'right' })
      },
    })
  }

  // maior pontuação e quem mais jogou
  const highlights = []
  if (sm.bestScore) {
    highlights.push({ label: 'MAIOR PONTUAÇÃO EM UMA PARTIDA', name: sm.bestScore.player_name, sub: `${sm.bestScore.score} pts · ${sm.bestScore.game}` })
  }
  if (sm.mostActive) {
    highlights.push({
      label: 'QUEM MAIS JOGOU',
      name: sm.mostActive.name,
      sub: `${sm.mostActive.count} ${sm.mostActive.count === 1 ? 'partida' : 'partidas'}`,
    })
  }
  if (highlights.length) {
    blocks.push({
      h: 160,
      draw(top) {
        const w = (CW - 16 * (highlights.length - 1)) / highlights.length
        highlights.forEach((item, i) => {
          const x = M + i * (w + 16)
          box(x, top, w, 160, 28, 'rgba(255,255,255,0.11)')
          write(item.label, x + 26, top + 40, { size: 19, color: lime, maxWidth: w - 50, min: 14 })
          write(item.name, x + 26, top + 98, { size: 50, maxWidth: w - 50, min: 28 })
          write(item.sub, x + 26, top + 138, { size: 25, weight: 700, color: muted, maxWidth: w - 50, min: 16 })
        })
      },
    })
  }

  // top 3
  if (sm.podium.length) {
    blocks.push({
      h: 44 + sm.podium.length * 64,
      draw(top) {
        write('TOP 3 DA NOITE', M, top + 26, { size: 23, color: muted })
        const medals = ['#F4B400', '#9CA3AF', '#B45309']
        sm.podium.forEach((item, i) => {
          const rowY = top + 44 + i * 64
          box(M, rowY, CW, 56, 28, 'rgba(255,255,255,0.09)')
          ctx.fillStyle = medals[i]
          ctx.beginPath()
          ctx.arc(M + 34, rowY + 28, 22, 0, Math.PI * 2)
          ctx.fill()
          write(i + 1, M + 34, rowY + 38, { size: 26, color: white, align: 'center' })
          write(item.name, M + 78, rowY + 39, { size: 36, maxWidth: 560, min: 22 })
          write(item.value, W - M - 24, rowY + 38, { size: 32, color: lime, align: 'right' })
        })
      },
    })
  }

  // karaokê
  if (sm.karaoke) {
    const cards = [
      sm.karaoke.song && { label: 'MÚSICA DA NOITE', name: sm.karaoke.song.name, sub: sm.karaoke.song.value },
      sm.karaoke.singer && { label: 'REI DO MICROFONE', name: sm.karaoke.singer.name, sub: sm.karaoke.singer.value },
      sm.karaoke.best && { label: 'MAIOR NOTA', name: sm.karaoke.best.player_name, sub: `${sm.karaoke.best.score} pts` },
    ].filter(Boolean)
    blocks.push({
      h: 44 + 166,
      draw(top) {
        write('NO KARAOKÊ', M, top + 26, { size: 23, color: muted })
        const w = (CW - 16 * (cards.length - 1)) / cards.length
        cards.forEach((card, i) => {
          const x = M + i * (w + 16)
          box(x, top + 44, w, 166, 26, 'rgba(255,255,255,0.11)')
          write(card.label, x + 22, top + 44 + 38, { size: 17, color: lime, maxWidth: w - 40, min: 12 })
          write(card.name, x + 22, top + 44 + 96, { size: 38, maxWidth: w - 40, min: 20 })
          write(card.sub, x + 22, top + 44 + 138, { size: 24, weight: 700, color: muted, maxWidth: w - 40, min: 14 })
        })
      },
    })
  }

  // pare no alvo e acerte o tempo: mesmo desenho de três cards
  for (const [title, cardsOf] of [['NO PARE NO ALVO', sm.target], ['NO ACERTE O TEMPO', sm.timing]]) {
    if (!cardsOf) continue
    const cards = cardsOf
    blocks.push({
      h: 44 + 166,
      draw(top) {
        write(title, M, top + 26, { size: 23, color: muted })
        const w = (CW - 16 * (cards.length - 1)) / cards.length
        cards.forEach((card, i) => {
          const x = M + i * (w + 16)
          box(x, top + 44, w, 166, 26, 'rgba(255,255,255,0.11)')
          write(card.label, x + 22, top + 44 + 38, { size: 17, color: lime, maxWidth: w - 40, min: 12 })
          write(card.name, x + 22, top + 44 + 96, { size: 38, maxWidth: w - 40, min: 20 })
          write(card.sub, x + 22, top + 44 + 138, { size: 24, weight: 700, color: muted, maxWidth: w - 40, min: 14 })
        })
      },
    })
  }

  // campeões por jogo
  if (sm.champions.length > 1) {
    blocks.push({
      h: 44 + sm.champions.length * 52,
      draw(top) {
        write('CAMPEÕES POR JOGO', M, top + 26, { size: 23, color: muted })
        sm.champions.forEach((item, i) => {
          const rowY = top + 44 + i * 52
          write(item.game, M, rowY + 34, { size: 27, weight: 700, color: muted, maxWidth: 400, min: 16 })
          write(item.name, W - M, rowY + 34, { size: 30, align: 'right', maxWidth: 480, min: 18 })
        })
      },
    })
  }

  // linha antes dos números
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillRect(M, y - 24, CW, 2)

  let cursor = y
  for (const block of blocks) {
    if (cursor + block.h > LIMIT) continue
    block.draw(cursor)
    cursor += block.h + GAP
  }

  // ---- rodapé ----
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(M, H - 174, CW, 2)
  write('FOI INESQUECÍVEL. ✳', M, H - 104, { size: 31 })
  write('POLE EVENTOS', W - M, H - 104, { size: 25, weight: 800, color: muted, align: 'right' })

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
onUnmounted(() => {
  stopProgress()
  clearRankTimers()
  stopSnippet()
})
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

/* ============ REVELAÇÃO DO RANKING ============ */
.rk-fade {
  animation: rk-fade .7s cubic-bezier(.22, 1, .36, 1) both;
  animation-delay: var(--d, 0ms);
}
@keyframes rk-fade {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

/* os "demais": entram de baixo pra cima, cada um com um quique */
.ranking-rest__item {
  opacity: 0;
  transform: translateX(-54px) scale(.93);
  animation: none;
  transition: opacity .45s ease, transform .75s cubic-bezier(.34, 1.56, .64, 1);
}
.ranking-rest__item.is-in {
  opacity: 1;
  transform: none;
}
.ranking-rest__item.is-in .ranking-rest__position {
  animation: pos-pop .7s .1s cubic-bezier(.34, 1.56, .64, 1) both;
}
.ranking-rest__item.is-in:first-of-type {
  background: rgba(255, 255, 255, .23);
  border-color: rgba(255, 255, 255, .45);
}
@keyframes pos-pop {
  from { transform: scale(.3) rotate(-18deg); opacity: 0; }
  to { transform: none; opacity: 1; }
}

/* campeão */
.ranking-winner-wrap {
  position: relative;
}
.ranking-winner {
  opacity: 0;
  transform: scale(.82) translateY(30px);
}
.ranking-winner > * {
  position: relative;
  z-index: 1;
}
.ranking-winner.is-in {
  opacity: 1;
  animation:
    winner-in 1s cubic-bezier(.2, 1.25, .3, 1) both,
    winner-ring 2.4s ease-in-out 1s infinite alternate,
    winner-float 4.8s ease-in-out 1s infinite alternate;
}
@keyframes winner-in {
  0% { opacity: 0; transform: scale(.7) translateY(40px) rotate(-2deg); filter: brightness(1.8); }
  55% { opacity: 1; transform: scale(1.045) translateY(-6px) rotate(.4deg); filter: brightness(1.15); }
  100% { opacity: 1; transform: none; filter: none; }
}
@keyframes winner-ring {
  from { box-shadow: 0 24px 55px rgba(0, 0, 0, .24), 0 0 0 0 rgba(199, 255, 87, .0); }
  to { box-shadow: 0 24px 55px rgba(0, 0, 0, .24), 0 0 70px 8px rgba(199, 255, 87, .5); }
}
@keyframes winner-float {
  from { translate: 0 0; }
  to { translate: 0 -7px; }
}

/* brilho que atravessa o cartão */
.winner-shine {
  position: absolute;
  inset: 0;
  z-index: 0 !important;
  background: linear-gradient(115deg, transparent 32%, rgba(255, 255, 255, .7) 50%, transparent 68%);
  transform: translateX(-130%);
  pointer-events: none;
}
.ranking-winner.is-in .winner-shine {
  animation: winner-shine 1.5s .55s ease-out both;
}
@keyframes winner-shine {
  to { transform: translateX(130%); }
}

/* coroa que cai sobre o #1 */
.winner-crown {
  position: absolute;
  right: 0;
  top: -6px;
  color: #17201a;
  opacity: 0;
  transform: translateY(-40px) rotate(-25deg) scale(.5);
}
.ranking-winner.is-in .winner-crown {
  animation: crown-drop .9s .55s cubic-bezier(.34, 1.56, .64, 1) both, crown-bob 2.2s 1.5s ease-in-out infinite alternate;
}
@keyframes crown-drop {
  to { opacity: 1; transform: none; }
}
@keyframes crown-bob {
  from { translate: 0 0; rotate: -4deg; }
  to { translate: 0 -5px; rotate: 5deg; }
}

/* nome: as letras sobem uma a uma */
.ranking-winner__name {
  overflow: hidden;
  padding: .08em 0 .1em;
}
.rk-word {
  display: inline-block;
  margin-right: .14em;
  white-space: nowrap;
}
.rk-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(105%) rotate(6deg);
}
.ranking-winner.is-in .rk-char {
  animation: letter-rise .75s cubic-bezier(.2, 1.2, .3, 1) both;
  animation-delay: calc(.3s + var(--i, 0) * 55ms);
}
@keyframes letter-rise {
  to { opacity: 1; transform: none; }
}

/* confete explodindo do campeão */
.confetti {
  position: absolute;
  left: 50%;
  top: 42%;
  z-index: 5;
  width: 0;
  height: 0;
  pointer-events: none;
}
.confetti__piece {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  animation: confetti-burst 2s cubic-bezier(.15, .7, .3, 1) both;
}
@keyframes confetti-burst {
  0% { opacity: 1; transform: translate(0, 0) rotate(0); }
  45% { opacity: 1; transform: translate(var(--dx), var(--dy)) rotate(calc(var(--rot) * .5)); }
  100% { opacity: 0; transform: translate(calc(var(--dx) * 1.15), calc(var(--dy) + var(--fall))) rotate(var(--rot)); }
}

@media (prefers-reduced-motion: reduce) {
  .ranking-winner, .ranking-rest__item, .rk-char, .winner-crown, .rk-fade { animation: none !important; transition: none !important; }
  .ranking-winner.is-in, .ranking-rest__item.is-in { opacity: 1; transform: none; }
  .rk-char, .winner-crown { opacity: 1; transform: none; }
  .confetti { display: none; }
}

/* ============ MAIOR NOTA DO KARAOKÊ ============ */
.kbest-player {
  margin-top: 20px;
  padding: 16px 18px 14px;
  border: 1px solid rgba(255, 255, 255, .22);
  border-radius: 18px;
  background: rgba(255, 255, 255, .1);
  backdrop-filter: blur(14px);
}
.kbest-bars {
  display: flex;
  height: 46px;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}
.kbest-bars i {
  display: block;
  width: 6px;
  height: 18%;
  border-radius: 6px;
  background: #c7ff57;
  opacity: .55;
  transform-origin: bottom;
}
.kbest-bars.is-playing i {
  opacity: 1;
  animation: kbest-eq ease-in-out infinite alternate;
}
@keyframes kbest-eq {
  from { height: 14%; }
  to { height: 100%; }
}
.kbest-player__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}
.kbest-player__label {
  color: rgba(255, 255, 255, .75);
  font-size: 12px;
  font-weight: 700;
}
.kbest-player__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  background: #c7ff57;
  color: #17201a;
  font-size: 12px;
  font-weight: 900;
}
.kbest-player__none {
  margin: 16px 0 0;
  color: rgba(255, 255, 255, .6);
  font-size: 12px;
}
@media (prefers-reduced-motion: reduce) {
  .kbest-bars.is-playing i { animation: none; height: 60%; }
}

/* ============ RESUMO FINAL (mais completo) ============ */
.recap-final__card {
  max-height: calc(100vh - 170px);
  overflow-y: auto;
  pointer-events: auto;
  scrollbar-width: none;
}
.recap-final__card::-webkit-scrollbar { display: none; }
.recap-final__hero { margin-top: clamp(22px, 4vh, 44px); }
.recap-final__hero h2 { font-size: clamp(40px, 8vw, 72px); }
.recap-final__accent { font-size: clamp(28px, 5.5vw, 48px); }
.recap-final__date {
  position: relative;
  z-index: 1;
  margin: 10px 0 0;
  color: rgba(255, 255, 255, .7);
  font-size: 13px;
  font-weight: 700;
}
.recap-final__stats--four {
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: clamp(20px, 3.5vh, 32px);
}
.recap-final__stats--four strong { font-size: clamp(30px, 6vw, 50px); }
.recap-final__stats--four span { font-size: 9px; letter-spacing: .1em; }

.fs-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}
.fs-grid--three { grid-template-columns: repeat(3, 1fr); margin-top: 8px; }
.fs-span { grid-column: 1 / -1; }
.fs-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  padding: 13px 15px;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 18px;
  background: rgba(255, 255, 255, .1);
  backdrop-filter: blur(10px);
}
.fs-card small { font-size: 9px; font-weight: 900; letter-spacing: .13em; opacity: .75; }
.fs-card strong { font-size: 20px; line-height: 1.1; overflow-wrap: anywhere; }
.fs-card span { font-size: 12px; font-weight: 700; opacity: .75; }
.fs-card--lime { border-color: transparent; background: #c7ff57; color: #17201a; }
.fs-card--lime strong { font-size: clamp(26px, 5vw, 38px); letter-spacing: -.03em; }
.fs-card--small strong { font-size: 15px; }
.fs-card--small span { font-size: 11px; }

.fs-block { position: relative; z-index: 1; margin-top: 18px; }
.fs-label { margin: 0 0 8px; color: rgba(255, 255, 255, .6); font-size: 10px; font-weight: 900; letter-spacing: .18em; }
.fs-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  padding: 9px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .09);
}
.fs-row strong { flex: 1; min-width: 0; font-size: 16px; overflow-wrap: anywhere; }
.fs-row em { color: #c7ff57; font-size: 14px; font-style: normal; font-weight: 900; white-space: nowrap; }
.fs-medal {
  display: flex;
  height: 28px;
  width: 28px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 900;
}
.fs-medal--1 { background: #f4b400; }
.fs-medal--2 { background: #9ca3af; }
.fs-medal--3 { background: #b45309; }
.fs-champion {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 2px;
  border-bottom: 1px solid rgba(255, 255, 255, .12);
  font-size: 13px;
}
.fs-champion span { color: rgba(255, 255, 255, .65); font-weight: 700; }
.fs-champion strong { text-align: right; }
</style>