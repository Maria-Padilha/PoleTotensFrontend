<template>
  <div class="field">
    <label v-if="label" :for="id">{{ label }}</label>
    <input :id="id" v-model="rawText" :placeholder="placeholder" :required="required" />
    <div v-if="words.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="(word, i) in words"
        :key="i"
        type="button"
        class="rounded-md px-2 py-1 text-xs font-bold transition-colors"
        :class="word.highlighted ? 'text-white' : 'bg-ink/5 text-ink-muted hover:bg-ink/10'"
        :style="word.highlighted ? { backgroundColor: color } : undefined"
        @click="toggleWord(i)"
      >
        {{ word.text }}
      </button>
    </div>
    <p v-if="words.length" class="text-[11px] text-ink-soft">
      Clique nas palavras acima para ligar/desligar o destaque na cor de acento.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  id: { type: String, default: undefined },
  color: { type: String, default: '#10939b' },
  required: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function parseToWords(value) {
  if (!value) return []
  return value
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((chunk) => chunk.length > 0)
    .flatMap((chunk) => {
      const highlighted = chunk.startsWith('**') && chunk.endsWith('**')
      const text = highlighted ? chunk.slice(2, -2) : chunk
      return text
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map((w) => ({ text: w, highlighted }))
    })
}

function wordsToString(words) {
  const parts = []
  let i = 0
  while (i < words.length) {
    if (words[i].highlighted) {
      const group = []
      while (i < words.length && words[i].highlighted) {
        group.push(words[i].text)
        i++
      }
      parts.push(`**${group.join(' ')}**`)
    } else {
      parts.push(words[i].text)
      i++
    }
  }
  return parts.join(' ')
}

const initialWords = parseToWords(props.modelValue)
// `rawText` é o texto "cru" que o input mostra e edita livremente — nunca é
// reescrito a partir de `words`, senão o cursor perde espaços/posição a cada
// tecla (era esse o bug: reconstruir o valor a cada input apagava o espaço
// assim que ele era digitado, antes da próxima letra).
const rawText = ref(initialWords.map((w) => w.text).join(' '))
const highlightFlags = ref(initialWords.map((w) => w.highlighted))

const words = computed(() =>
  rawText.value
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((text, i) => ({ text, highlighted: highlightFlags.value[i] || false }))
)

// Sincroniza quando o valor vem de fora (ex: abrir o form em modo edição) —
// só reparse se o valor externo não bater com o que já temos localmente,
// pra não sobrescrever o estado enquanto o usuário está digitando/clicando.
watch(
  () => props.modelValue,
  (value) => {
    if (value === wordsToString(words.value)) return
    const parsed = parseToWords(value)
    rawText.value = parsed.map((w) => w.text).join(' ')
    highlightFlags.value = parsed.map((w) => w.highlighted)
  }
)

watch(rawText, () => {
  emit('update:modelValue', wordsToString(words.value))
})

function toggleWord(index) {
  highlightFlags.value[index] = !highlightFlags.value[index]
  emit('update:modelValue', wordsToString(words.value))
}
</script>
