<template>
  <div class="kl" :style="{ '--kl-accent': accent, ...(fontSize ? { fontSize } : {}) }">
    <!-- bolinhas de contagem antes de cada trecho (como nos karaokês clássicos) -->
    <div class="kl-dots" :class="{ 'is-on': dotCount > 0 }" aria-hidden="true">
      <span v-for="n in 3" :key="n" class="kl-dot" :class="{ 'is-lit': n <= dotCount }" />
    </div>

    <!-- duas linhas de cada vez: a que está sendo cantada e a seguinte -->
    <p
      v-for="(line, slot) in slots"
      :key="line ? `l-${line.time}` : `empty-${slot}`"
      class="kl-line"
      :class="lineClass(line)"
    >
      <template v-if="line">
        <span v-for="(word, i) in line.words" :key="i" class="kl-word">
          <span class="kl-base">{{ word.text }}</span>
          <span class="kl-fill" :style="{ width: fillWidth(word) }" aria-hidden="true">{{ word.text }}</span>
        </span>
      </template>
      <template v-else>&nbsp;</template>
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ time, end, text, words: [{ text, start, end }] }] — com o ajuste de sincronia já aplicado
  lines: { type: Array, default: () => [] },
  // segundo atual da música
  time: { type: Number, default: 0 },
  accent: { type: String, default: '#ffd23f' },
  // tamanho da letra; sem valor, acompanha a largura da tela (totem)
  fontSize: { type: String, default: '' },
})

const textLines = computed(() => props.lines.filter((l) => l.text))

// índice (entre as linhas com letra) da última que já começou
const currentIndex = computed(() => {
  let index = -1
  for (let i = 0; i < textLines.value.length; i++) {
    if (textLines.value[i].time <= props.time) index = i
    else break
  }
  return index
})

const finished = computed(() => {
  const line = textLines.value[currentIndex.value]
  return Boolean(line) && props.time >= line.end - 0.05
})

// par de linhas na tela. Quando a linha de baixo termina, o par seguinte já entra.
const baseIndex = computed(() => {
  const i = currentIndex.value
  if (i < 0) return 0
  if (finished.value && i % 2 === 1) return i + 1
  return Math.floor(i / 2) * 2
})

const slots = computed(() => [textLines.value[baseIndex.value] || null, textLines.value[baseIndex.value + 1] || null])

// qual é a próxima linha a ser cantada (pra contagem regressiva)
const upcoming = computed(() => {
  const i = currentIndex.value
  if (i < 0) return textLines.value[0] || null
  return finished.value ? textLines.value[i + 1] || null : null
})

// 3, 2, 1 bolinhas acesas nos últimos 3 segundos antes da linha começar
const dotCount = computed(() => {
  const next = upcoming.value
  if (!next) return 0
  const remaining = next.time - props.time
  if (remaining <= 0 || remaining > 3.2) return 0
  return Math.min(3, Math.ceil(remaining))
})

function fillWidth(word) {
  const span = Math.max(0.05, word.end - word.start)
  const progress = Math.min(1, Math.max(0, (props.time - word.start) / span))
  return `${(progress * 100).toFixed(1)}%`
}

function lineClass(line) {
  if (!line) return ''
  if (props.time >= line.end) return 'is-sung'
  if (props.time >= line.time) return 'is-active'
  return 'is-next'
}
</script>

<style scoped>
.kl {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 0.5em;
  /* tamanho acompanha a largura da tela (totem em pé ou prévia no painel) */
  font-size: clamp(2.4rem, 7vw, 5.4rem);
  font-weight: 800;
  line-height: 1.22;
  text-align: center;
}

.kl-dots {
  display: flex;
  height: 0.7em;
  gap: 0.35em;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.kl-dots.is-on {
  opacity: 1;
}
.kl-dot {
  width: 0.38em;
  height: 0.38em;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.28);
  border: 0.05em solid rgba(0, 0, 0, 0.6);
  transition: background 0.15s ease, transform 0.15s ease;
}
.kl-dot.is-lit {
  background: var(--kl-accent);
  transform: scale(1.12);
  box-shadow: 0 0 0.5em var(--kl-accent);
}

.kl-line {
  margin: 0;
  max-width: 100%;
  min-height: 1.25em;
  transition: opacity 0.25s ease;
}
.kl-line.is-next {
  opacity: 0.8;
}
.kl-line.is-sung {
  opacity: 0.55;
}

.kl-word {
  position: relative;
  display: inline-block;
  margin: 0 0.12em;
  white-space: nowrap;
}

/* contorno escuro em volta das letras: legível sobre qualquer fundo */
.kl-base,
.kl-fill {
  text-shadow:
    -0.04em -0.04em 0 #000,
    0.04em -0.04em 0 #000,
    -0.04em 0.04em 0 #000,
    0.04em 0.04em 0 #000,
    0 0.05em 0.12em rgba(0, 0, 0, 0.7);
}
.kl-base {
  color: #ffffff;
}
/* camada colorida por cima: vai "enchendo" da esquerda pra direita no tempo da palavra */
.kl-fill {
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  white-space: nowrap;
  color: var(--kl-accent);
}
</style>
