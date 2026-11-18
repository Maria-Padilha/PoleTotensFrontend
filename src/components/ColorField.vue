<template>
  <div class="field">
    <label :for="inputId">{{ label }}</label>
    <div class="flex items-center gap-3">
      <input
        :id="inputId"
        type="color"
        class="!h-11 !w-16 cursor-pointer !p-1"
        :value="modelValue || fallback"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <span class="text-sm font-semibold text-ink-muted">{{ modelValue || 'Automática' }}</span>
      <button
        v-if="allowAuto && modelValue"
        type="button"
        class="text-xs font-bold text-primary-600 hover:underline"
        @click="$emit('update:modelValue', '')"
      >
        Usar automática
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  // cor mostrada no seletor enquanto o valor está vazio (automático)
  fallback: { type: String, default: '#000000' },
  allowAuto: { type: Boolean, default: true },
})
defineEmits(['update:modelValue'])

const inputId = `color-${Math.random().toString(36).slice(2, 9)}`
</script>
