<template>
  <div class="space-y-4">
    <label class="text-sm font-bold text-ink">Tempo sorteado</label>
    <p class="text-sm text-ink-muted">
      A cada rodada o jogo sorteia um tempo dentro desse intervalo (ex: 1,15 s) e a pessoa precisa parar o cronômetro
      exatamente nele. O cronômetro tem sempre 5 s de escala, então o alvo pode ser de 0,1 s até 5 s.
    </p>

    <div class="grid grid-cols-2 gap-3">
      <div class="field">
        <label>Tempo mínimo (segundos)</label>
        <input v-model.number="settings.min_seconds" type="number" min="0.1" max="5" step="0.1" />
      </div>
      <div class="field">
        <label>Tempo máximo (segundos)</label>
        <input v-model.number="settings.max_seconds" type="number" min="0.1" max="5" step="0.1" />
      </div>
    </div>

    <label class="flex items-center gap-3 rounded-xl border border-ink/10 p-4 text-sm text-ink">
      <input v-model="settings.hide_clock" type="checkbox" class="h-5 w-5" />
      <span>
        <strong>Modo difícil:</strong> esconder o cronômetro depois de alguns segundos (a pessoa para "no sentimento").
      </span>
    </label>

    <div v-if="settings.hide_clock" class="field">
      <label>Esconder o cronômetro após (segundos)</label>
      <input v-model.number="settings.hide_after" type="number" min="0" max="5" step="0.5" />
    </div>

    <p class="text-xs text-ink-soft">
      O ranking mostra o tempo sorteado, onde a pessoa parou e a diferença. Quem chegou mais perto fica em primeiro.
    </p>
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

const DEFAULTS = { min_seconds: 0.1, max_seconds: 5, hide_clock: false, hide_after: 2 }

// Objeto reativo de leitura/escrita: cada campo editado emite o objeto inteiro de volta.
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
