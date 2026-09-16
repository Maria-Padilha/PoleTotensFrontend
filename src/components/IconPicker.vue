<template>
  <div class="field">
    <label v-if="label">{{ label }}</label>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-colors"
        :class="!modelValue ? 'border-primary bg-primary-50 text-primary-600' : 'border-ink/10 text-ink-soft hover:border-primary/40'"
        title="Nenhum ícone"
        @click="$emit('update:modelValue', '')"
      >
        <Ban :size="18" />
      </button>
      <button
        v-for="opt in ICONS"
        :key="opt.key"
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-colors"
        :class="modelValue === opt.key ? 'border-primary bg-primary-50 text-primary-600' : 'border-ink/10 text-ink-soft hover:border-primary/40'"
        :title="opt.label"
        @click="$emit('update:modelValue', opt.key)"
      >
        <component :is="opt.component" :size="18" />
      </button>
    </div>
    <p class="text-[11px] text-ink-soft">Aparece no lugar do logo, na tela inicial do jogo.</p>
  </div>
</template>

<script setup>
import { Ban } from '@lucide/vue'
import { ICONS } from './iconMap'

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>
