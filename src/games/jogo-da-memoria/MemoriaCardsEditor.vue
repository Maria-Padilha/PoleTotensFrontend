<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-ink">Cartas do jogo (cada uma vira um par)</label>
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addCard">
        <Plus :size="14" /> Adicionar carta
      </button>
    </div>

    <p class="text-xs text-ink-soft">
      Cada carta que você adicionar aqui aparece DUAS vezes no tabuleiro — o convidado precisa achar o par. Use pelo
      menos 2 cartas.
    </p>

    <p v-if="cards.length === 0" class="text-sm text-ink-muted">
      Nenhuma carta ainda. Adicione ao menos duas.
    </p>

    <div v-for="(card, cIndex) in cards" :key="card.id" class="flex items-center gap-3 rounded-xl border border-ink/10 p-3">
      <span class="w-6 shrink-0 text-right text-xs font-bold text-ink-soft">{{ cIndex + 1 }}.</span>
      <ImageUploadField
        v-model="card.image_url"
        :event-id="eventId"
        game-slug="jogo-da-memoria"
        folder="cartas"
        class="flex-1"
      />
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft
          transition-colors hover:!bg-danger-tint hover:!text-danger"
        title="Remover carta"
        @click="removeCard(cIndex)"
      >
        <Trash2 :size="15" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Trash2 } from '@lucide/vue'
import ImageUploadField from '@/components/ImageUploadField.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  eventId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue'])

const cards = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function addCard() {
  const card = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    image_url: '',
  }
  cards.value = [...cards.value, card]
}

function removeCard(index) {
  cards.value = cards.value.filter((_, i) => i !== index)
}
</script>
