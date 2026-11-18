<template>
  <div class="rounded-xl border border-primary/30 bg-primary-50/40 p-4">
    <p class="text-sm font-bold text-ink">Sincronizar palavra por palavra</p>
    <p class="mt-1 text-xs text-ink-muted">
      A música toca e as palavras da frase aparecem abaixo. Toque em <strong>Próxima palavra</strong> (ou aperte
      <kbd>Espaço</kbd>) <strong>no instante em que cada palavra começa a ser cantada</strong>. Se a voz parar num
      trecho instrumental, toque em <strong>Instrumental: início</strong>; quando a voz voltar, em
      <strong>Instrumental: fim</strong> (que já marca a próxima palavra). Dica: diminua a
      velocidade pra marcar com calma — os tempos saem certos na velocidade normal.
    </p>

    <div class="mt-3 flex items-center gap-2 text-xs">
      <label for="sync-speed" class="font-bold text-ink">Velocidade da música</label>
      <select id="sync-speed" v-model.number="rate" class="!w-auto !py-1" @change="applyRate">
        <option :value="0.5">0,5x</option>
        <option :value="0.75">0,75x</option>
        <option :value="1">1x (normal)</option>
      </select>
    </div>

    <div class="mt-4 rounded-lg bg-white p-4 text-center shadow-sm">
      <p v-if="!started" class="text-sm text-ink-muted">
        {{ lines.length }} frases, {{ words.length }} palavras para marcar.
      </p>
      <template v-else-if="nextIndex < words.length">
        <p class="text-xs font-bold uppercase tracking-wider text-ink-soft">
          Frase {{ currentWord.line + 1 }} de {{ lines.length }} · palavra {{ nextIndex + 1 }} de {{ words.length }} ·
          {{ clock }}
        </p>
        <p v-if="inInstrumental" class="mt-2 text-base font-bold text-primary-600">
          ♪ Instrumental em andamento — toque em "Fim" quando a voz voltar
        </p>
        <p class="mt-3 text-2xl font-bold leading-relaxed">
          <span
            v-for="(w, i) in currentLineWords"
            :key="i"
            class="mx-1 inline-block rounded px-1"
            :class="wordClass(w)"
          >{{ w.text }}</span>
        </p>
        <p v-if="nextLineText" class="mt-2 text-sm text-ink-soft">depois: {{ nextLineText }}</p>
      </template>
      <p v-else class="text-sm font-bold text-primary-600">Todas as palavras marcadas!</p>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <button v-if="!started" type="button" class="btn-primary !px-4 !py-2 text-sm" @click="startSync">
        <Play :size="14" /> Começar
      </button>
      <template v-else>
        <button
          type="button"
          class="btn-primary !px-5 !py-2 text-sm"
          :disabled="nextIndex >= words.length"
          @click="mark"
        >
          Próxima palavra
        </button>
        <button
          type="button"
          class="btn-outline !px-3 !py-2 text-xs"
          :disabled="inInstrumental || nextIndex === 0 || nextIndex >= words.length"
          title="A voz parou: começa um trecho instrumental no meio da música"
          @click="startInstrumental"
        >
          Instrumental: início
        </button>
        <button
          type="button"
          class="btn-outline !px-3 !py-2 text-xs"
          :disabled="!inInstrumental"
          title="A voz voltou: termina o instrumental e já marca a próxima palavra"
          @click="mark"
        >
          Instrumental: fim
        </button>
        <button
          type="button"
          class="btn-outline !px-3 !py-2 text-xs"
          :disabled="nextIndex > 0 || hasIntro"
          title="A música começa com instrumental (marca 0:00); depois use Instrumental: fim quando a voz entrar"
          @click="markIntro"
        >
          Abertura instrumental
        </button>
        <button
          type="button"
          class="btn-outline !px-3 !py-2 text-xs"
          :disabled="nextIndex < words.length || endedWithInstrumental"
          title="Depois da última palavra: marca onde começa o instrumental final"
          @click="markOutro"
        >
          Instrumental final
        </button>
        <button type="button" class="btn-outline !px-3 !py-2 text-xs" :disabled="!marks.length" @click="undo">
          <Undo2 :size="13" /> Desfazer
        </button>
        <button type="button" class="btn-outline !px-3 !py-2 text-xs" @click="restartSync">Recomeçar</button>
      </template>
      <button
        v-if="started && nextIndex >= words.length"
        type="button"
        class="btn-primary !px-4 !py-2 text-sm"
        @click="apply"
      >
        <Check :size="14" /> Salvar sincronia
      </button>
      <ul v-if="started && marks.length" class="mt-3 w-full space-y-0.5 text-xs text-ink-muted">
        <li v-for="(m, i) in recentMarks" :key="i">
          <span class="font-mono">{{ stamp(m.time) }}</span>
          <template v-if="!m.pause"> — {{ m.text }}</template>
          <em v-else class="text-primary-600"> — instrumental</em>
        </li>
      </ul>
      <button type="button" class="ml-auto text-xs font-bold text-ink-muted hover:text-ink" @click="cancel">
        Cancelar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Play, Undo2, Check } from '@lucide/vue'
import { formatWordMarks, lyricsToPlainLines } from './lrc'

const props = defineProps({
  audioUrl: { type: String, required: true },
  lyrics: { type: String, default: '' },
})
const emit = defineEmits(['apply', 'cancel'])

// Atraso de quem ouve a palavra e só depois aperta, em segundos REAIS (a
// música em câmera lenta não muda o tempo de reação da pessoa).
const REACTION_SECONDS = 0.12

const lines = computed(() => lyricsToPlainLines(props.lyrics))
// lista plana de palavras de todas as frases, na ordem em que são cantadas
const words = computed(() =>
  lines.value.flatMap((text, line) =>
    text
      .split(/\s+/)
      .filter(Boolean)
      .map((word, index) => ({ text: word, line, index }))
  )
)

const started = ref(false)
const marks = ref([])
const currentTime = ref(0)
const rate = ref(0.75)
let audio = null
let rafId = null

const wordMarks = computed(() => marks.value.filter((m) => !m.pause))
const nextIndex = computed(() => wordMarks.value.length)
const currentWord = computed(() => words.value[nextIndex.value] || { line: 0, index: 0 })
const recentMarks = computed(() => marks.value.slice(-6))
const hasIntro = computed(() => marks.value.some((m) => m.pause && m.time === 0))

const currentLineWords = computed(() => words.value.filter((w) => w.line === currentWord.value.line))
const nextLineText = computed(() => lines.value[currentWord.value.line + 1] || '')

function wordClass(w) {
  const done = w.line < currentWord.value.line || (w.line === currentWord.value.line && w.index < currentWord.value.index)
  if (done) return 'bg-primary-50 text-primary-600'
  if (w.line === currentWord.value.line && w.index === currentWord.value.index) return 'bg-primary text-white'
  return 'text-ink-soft'
}

// "Em instrumental" = a última marca foi uma pausa e ainda faltam palavras —
// a próxima marcação (Próxima palavra/Espaço ou "Fim") é a voz voltando.
const inInstrumental = computed(() => {
  const last = marks.value[marks.value.length - 1]
  return Boolean(last) && last.pause && nextIndex.value < words.value.length
})

// Última marca é uma pausa DEPOIS da última palavra = instrumental final já marcado.
const endedWithInstrumental = computed(() => {
  const last = marks.value[marks.value.length - 1]
  return Boolean(last) && last.pause && nextIndex.value >= words.value.length
})

const clock = computed(() => {
  const total = Math.floor(currentTime.value)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
})

function stamp(seconds) {
  const min = Math.floor(seconds / 60)
  return `${min}:${(seconds % 60).toFixed(2).padStart(5, '0')}`
}

function tick() {
  currentTime.value = audio ? audio.currentTime : 0
  rafId = requestAnimationFrame(tick)
}

function applyRate() {
  if (audio) audio.playbackRate = rate.value
}

function startSync() {
  marks.value = []
  audio = new Audio(props.audioUrl)
  audio.playbackRate = rate.value
  audio.play().catch(() => {})
  started.value = true
  tick()
}

function stopAudio() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
  if (audio) audio.pause()
  audio = null
}

function restartSync() {
  stopAudio()
  startSync()
}

// Tempo da música no momento do toque, descontando o atraso de reação (que em
// "tempo de música" é menor quando ela está mais lenta).
function now() {
  return Math.max(0, (audio?.currentTime ?? 0) - REACTION_SECONDS * rate.value)
}

function mark() {
  if (nextIndex.value >= words.value.length) return
  const word = words.value[nextIndex.value]
  marks.value = [...marks.value, { time: now(), text: word.text, line: word.line }]
}

function startInstrumental() {
  marks.value = [...marks.value, { time: now(), pause: true }]
}

// Abertura instrumental: começa em 0:00, antes da primeira palavra.
function markIntro() {
  marks.value = [{ time: 0, pause: true }, ...marks.value]
}

// Instrumental final: marca o ponto, depois da última palavra, em que a voz
// acaba e a parte instrumental começa (a última palavra não fica "esticada").
function markOutro() {
  marks.value = [...marks.value, { time: now(), pause: true }]
}

function undo() {
  marks.value = marks.value.slice(0, -1)
}

function apply() {
  stopAudio()
  emit('apply', formatWordMarks(marks.value))
}

function cancel() {
  stopAudio()
  emit('cancel')
}

function onKeydown(event) {
  if (!started.value || event.code !== 'Space') return
  event.preventDefault()
  if (!event.repeat) mark()
}

// Sem isso, o Espaço soltando em cima de um botão focado também dispararia o
// clique dele além da marcação.
function onKeyup(event) {
  if (started.value && event.code === 'Space') event.preventDefault()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keyup', onKeyup)
  stopAudio()
})
</script>
