<template>
  <div class="space-y-4 rounded-xl border border-primary/30 bg-primary-50/40 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm font-bold text-ink">Testar sincronia</p>
        <p class="mt-0.5 text-xs text-ink-muted">
          Ouça a música com a letra, exatamente como no jogo. Se a palavra acende <strong>antes</strong> de cantarem,
          use "Letra mais tarde"; se acende <strong>depois</strong>, use "Letra mais cedo".
        </p>
      </div>
      <button type="button" class="text-xs font-bold text-ink-muted hover:text-ink" @click="close">Fechar teste</button>
    </div>

    <!-- palco igual ao do jogo -->
    <div class="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl px-4 py-8" :style="stageBackground(color)">
      <KaraokeLyrics :lines="lines" :time="time" :accent="lyricFill(color)" font-size="clamp(1.4rem, 2.6vw, 2.2rem)" />
    </div>

    <div class="h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
      <div class="h-full bg-primary" :style="{ width: `${progress}%` }" />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary !px-4 !py-2 text-sm" @click="toggle">
        <component :is="playing ? Pause : Play" :size="14" /> {{ playing ? 'Pausar' : 'Tocar' }}
      </button>
      <button type="button" class="btn-outline !px-3 !py-2 text-xs" @click="seekBy(-5)">-5 s</button>
      <button type="button" class="btn-outline !px-3 !py-2 text-xs" @click="seekBy(5)">+5 s</button>
      <button type="button" class="btn-outline !px-3 !py-2 text-xs" @click="restart"><RotateCcw :size="13" /> Do início</button>
      <span class="ml-auto font-mono text-sm font-bold text-ink-muted">{{ clock }}</span>
    </div>

    <div class="rounded-lg bg-white p-3">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="btn-outline !px-3 !py-2 text-xs" @click="nudge(-0.1)">◀ Letra mais cedo (0,1 s)</button>
        <button type="button" class="btn-outline !px-3 !py-2 text-xs" @click="nudge(0.1)">Letra mais tarde (0,1 s) ▶</button>
        <span class="text-sm font-bold text-ink">Ajuste: {{ offsetLabel }}</span>
        <button v-if="Number(offset)" type="button" class="text-xs font-bold text-primary-600 hover:underline" @click="$emit('update:offset', 0)">
          Zerar
        </button>
      </div>
      <p class="mt-2 text-xs text-ink-muted">
        O ajuste vale para a música toda e é salvo junto com ela (campo "Ajuste fino da sincronia"). Lembre de salvar o jogo.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { Play, Pause, RotateCcw } from '@lucide/vue'
import KaraokeLyrics from './KaraokeLyrics.vue'
import { buildPlayableLines } from './lrc'
import { stageBackground, lyricFill } from './songColors'

const props = defineProps({
  audioUrl: { type: String, required: true },
  lyrics: { type: String, default: '' },
  // ajuste de sincronia da música (segundos)
  offset: { type: Number, default: 0 },
  // cor da música (a mesma do totem)
  color: { type: String, default: '#e4572e' },
})
const emit = defineEmits(['update:offset', 'close'])

const time = ref(0)
const duration = ref(0)
const playing = ref(false)
let audio = null
let rafId = null

const lines = computed(() => buildPlayableLines(props.lyrics, duration.value, props.offset))
const progress = computed(() => (duration.value > 0 ? Math.min(100, (time.value / duration.value) * 100) : 0))
const clock = computed(() => `${format(time.value)} / ${format(duration.value)}`)
const offsetLabel = computed(() => {
  const n = Number(props.offset) || 0
  return Math.abs(n) < 0.005 ? 'nenhum' : `${n > 0 ? '+' : ''}${n.toFixed(1).replace('.', ',')} s`
})

function format(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function ensureAudio() {
  if (audio) return
  audio = new Audio(props.audioUrl)
  audio.preload = 'auto'
  audio.addEventListener('loadedmetadata', () => { duration.value = audio.duration })
  audio.addEventListener('ended', () => { playing.value = false })
}

function tick() {
  time.value = audio ? audio.currentTime : 0
  rafId = requestAnimationFrame(tick)
}

function toggle() {
  ensureAudio()
  if (playing.value) {
    audio.pause()
    playing.value = false
    cancelAnimationFrame(rafId)
    return
  }
  audio.play().catch(() => {})
  playing.value = true
  tick()
}

function seekBy(delta) {
  ensureAudio()
  audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta))
  time.value = audio.currentTime
}

function restart() {
  ensureAudio()
  audio.currentTime = 0
  time.value = 0
}

function nudge(delta) {
  const next = Math.round(((Number(props.offset) || 0) + delta) * 10) / 10
  emit('update:offset', next)
}

function close() {
  stop()
  emit('close')
}

function stop() {
  cancelAnimationFrame(rafId)
  if (audio) audio.pause()
  audio = null
  playing.value = false
}

onBeforeUnmount(stop)
</script>

