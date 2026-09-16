<template>
  <div class="inline-flex items-center gap-2.5" :class="stacked ? 'flex-col text-center' : ''">
    <img
      src="@/assets/logo.png"
      alt="Pole Eventos"
      class="shrink-0 object-contain"
      :class="stacked ? 'h-11 w-11' : 'h-7 w-7'"
    />
    <span class="flex flex-col leading-tight" :class="stacked ? 'items-center text-center' : 'text-left'">
      <strong class="font-heading text-base font-bold text-ink">Pole Eventos</strong>
      <small v-if="subtitle" class="text-xs text-ink-muted">{{ subtitle }}</small>
    </span>
  </div>
</template>

<script setup>
defineProps({
  stacked: { type: Boolean, default: false },
  subtitle: { type: String, default: '' },
})
</script>
