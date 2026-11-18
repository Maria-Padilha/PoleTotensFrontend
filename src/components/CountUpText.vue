<template>
  <span class="tabular-nums">{{ display }}</span>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

// Texto com um número que "sobe" de 0 até o valor quando `active` vira true.
// Ex: "980 pts" -> 0 pts ... 980 pts. Texto sem número aparece como veio.
const props = defineProps({
  text: { type: String, default: '' },
  active: { type: Boolean, default: false },
  duration: { type: Number, default: 900 },
  delay: { type: Number, default: 0 },
})

// prefixo + número + sufixo (ex: "", "980", " pts")
const parts = computed(() => {
  const match = String(props.text).match(/^(\D*)(\d[\d.,]*)(.*)$/s)
  if (!match) return null
  const target = parseInt(match[2].replace(/\D/g, ''), 10)
  return Number.isFinite(target) ? { prefix: match[1], target, suffix: match[3], dotted: match[2].includes('.') } : null
})

const current = ref(0)
let frameId = null
let timeoutId = null

const display = computed(() => {
  const p = parts.value
  if (!p) return props.text
  const n = props.active || current.value ? current.value : 0
  return `${p.prefix}${p.dotted ? n.toLocaleString('pt-BR') : n}${p.suffix}`
})

function run() {
  const p = parts.value
  if (!p) return
  const started = performance.now()
  const step = (now) => {
    const t = Math.min(1, (now - started) / props.duration)
    // sai rápido e desacelera perto do valor final
    current.value = Math.round(p.target * (1 - Math.pow(1 - t, 3)))
    if (t < 1) frameId = requestAnimationFrame(step)
    else current.value = p.target
  }
  frameId = requestAnimationFrame(step)
}

function stop() {
  cancelAnimationFrame(frameId)
  clearTimeout(timeoutId)
}

watch(
  () => props.active,
  (active) => {
    stop()
    if (!active) {
      current.value = 0
      return
    }
    if (props.delay > 0) timeoutId = setTimeout(run, props.delay)
    else run()
  },
  { immediate: true }
)

onBeforeUnmount(stop)
</script>
