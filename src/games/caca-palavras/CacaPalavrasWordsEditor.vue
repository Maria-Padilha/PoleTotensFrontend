<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-ink">Palavras do caça-palavras</label>
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addWord">
        <Plus :size="14" /> Adicionar palavra
      </button>
    </div>

    <p class="text-xs text-ink-soft">
      Use palavras curtas, sem espaço fica melhor no tabuleiro (até 12 letras — palavras maiores não entram no jogo).
    </p>

    <p v-if="words.length === 0" class="text-sm text-ink-muted">
      Nenhuma palavra ainda. Adicione ao menos uma.
    </p>

    <div v-for="(word, wIndex) in words" :key="word.id" class="flex items-center gap-2">
      <span class="w-6 shrink-0 text-right text-xs font-bold text-ink-soft">{{ wIndex + 1 }}.</span>
      <input
        v-model="word.word"
        type="text"
        placeholder="Ex: ANIVERSARIO"
        class="w-full flex-1 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm uppercase text-ink
          outline-none transition-colors focus:border-primary"
        maxlength="30"
      />
      <span
        class="w-14 shrink-0 text-center text-xs font-bold"
        :class="letterCount(word.word) > 12 ? 'text-danger' : 'text-ink-soft'"
      >
        {{ letterCount(word.word) }}/12
      </span>
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft
          transition-colors hover:!bg-danger-tint hover:!text-danger"
        title="Remover palavra"
        @click="removeWord(wIndex)"
      >
        <Trash2 :size="15" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Trash2 } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const words = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function letterCount(raw) {
  return (raw || '').toUpperCase().replace(/[^\p{L}]/gu, '').length
}

function addWord() {
  const word = {
    id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    word: '',
  }
  words.value = [...words.value, word]
}

function removeWord(index) {
  words.value = words.value.filter((_, i) => i !== index)
}
</script>
