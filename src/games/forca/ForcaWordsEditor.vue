<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-ink">Palavras do jogo</label>
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addWord">
        <Plus :size="14" /> Adicionar palavra
      </button>
    </div>

    <p v-if="words.length === 0" class="text-sm text-ink-muted">
      Nenhuma palavra ainda. Adicione ao menos uma.
    </p>

    <div
      v-for="(word, wIndex) in words"
      :key="word.id"
      class="rounded-xl border border-ink/10 p-4"
    >
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          @click="toggleExpanded(word.id)"
        >
          <component :is="isExpanded(word.id) ? ChevronDown : ChevronRight" :size="16" class="shrink-0 text-ink-soft" />
          <span class="shrink-0 text-sm font-bold text-ink">Palavra {{ wIndex + 1 }}</span>
          <span v-if="word.word" class="truncate text-sm text-ink-muted">— {{ word.word }}</span>
          <span v-else class="truncate text-sm italic text-ink-soft">Sem palavra ainda</span>
        </button>
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

      <template v-if="isExpanded(word.id)">
        <div class="field mt-3">
          <label>Palavra ou frase a ser adivinhada</label>
          <input
            v-model="word.word"
            type="text"
            placeholder="Ex: TORRE EIFFEL"
            class="uppercase"
          />
        </div>

        <HighlightPicker
          :id="`word-hint-${word.id}`"
          v-model="word.hint"
          label="Dica exibida pro jogador (opcional)"
          placeholder="Ex: Um dos cartões-postais mais famosos de Paris."
          :color="color"
          class="mt-3"
        />

        <ImageUploadField
          v-model="word.image_url"
          label="Imagem da palavra (opcional)"
          :event-id="eventId"
          game-slug="forca"
          folder="palavras"
          class="mt-3"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus, Trash2, ChevronDown, ChevronRight } from '@lucide/vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import HighlightPicker from '@/components/HighlightPicker.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  eventId: { type: [Number, String], default: null },
  color: { type: String, default: '#10939b' },
})
const emit = defineEmits(['update:modelValue'])

const words = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Estado só de UI (não vai pro backend) — palavras ficam fechadas por
// padrão, só mostrando o título, pra lista não ficar gigante.
const expandedIds = ref(new Set())

function isExpanded(id) {
  return expandedIds.value.has(id)
}

function toggleExpanded(id) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function addWord() {
  const word = {
    id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    word: '',
    hint: '',
    image_url: '',
  }
  words.value = [...words.value, word]
  expandedIds.value = new Set([...expandedIds.value, word.id])
}

function removeWord(index) {
  words.value = words.value.filter((_, i) => i !== index)
}
</script>
