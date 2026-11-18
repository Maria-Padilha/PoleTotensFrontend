<template>
  <div class="space-y-4">
    <label class="text-sm font-bold text-ink">Pare no Alvo</label>
    <p class="text-sm text-ink-muted">
      Uma barra vai e volta e a pessoa toca para pará-la dentro da zona verde. A cada acerto a zona diminui e a barra
      acelera. O ranking vai por quantos níveis a pessoa passou.
    </p>

    <div class="grid grid-cols-2 gap-3">
      <div class="field">
        <label>Vidas (erros permitidos)</label>
        <input v-model.number="settings.lives" type="number" min="1" max="5" step="1" />
      </div>
      <div class="field">
        <label>Velocidade da barra</label>
        <select v-model.number="settings.speed">
          <option :value="0.7">Tranquila</option>
          <option :value="1">Normal</option>
          <option :value="1.4">Rápida</option>
          <option :value="1.8">Insana</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  eventId: { type: [Number, String], default: null },
  color: { type: String, default: '#10939b' },
})
const emit = defineEmits(['update:modelValue'])

const DEFAULTS = { lives: 3, speed: 1 }

// Objeto de leitura/escrita: cada campo editado emite o objeto inteiro de volta.
const settings = computed(() => {
  const base = { ...DEFAULTS, ...(props.modelValue || {}) }
  return new Proxy(base, {
    set(target, key, value) {
      emit('update:modelValue', { ...target, [key]: value })
      return true
    },
  })
})
</script>
