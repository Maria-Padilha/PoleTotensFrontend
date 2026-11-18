<template>
  <div class="mx-auto w-full max-w-4xl pt-10 sm:pt-16">
    <div class="flex items-center justify-between gap-4">
      <!-- progresso / título do jogo -->
      <div class="gh-chip" :style="chipStyle">
        <span class="gh-icon" :style="{ backgroundColor: accentColor }">
          <component :is="icon" :size="22" />
        </span>
        <span class="min-w-0 truncate text-lg font-bold sm:text-2xl">{{ label }}</span>
      </div>

      <!-- pontos (ou o que o jogo quiser, via slot) -->
      <slot>
        <div class="gh-chip" :style="chipStyle">
          <Star :size="24" :style="{ color: accentColor }" class="shrink-0 fill-current" />
          <span class="text-2xl font-extrabold tabular-nums sm:text-3xl">{{ points }}</span>
          <span class="text-sm font-semibold opacity-70 sm:text-lg">{{ points === 1 ? 'ponto' : 'pontos' }}</span>
        </div>
      </slot>
    </div>

    <!-- barra de progresso -->
    <div v-if="total > 0" class="mt-5 h-2.5 overflow-hidden rounded-full" :style="{ backgroundColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(43,43,43,0.12)' }">
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :style="{ width: `${Math.min(100, (current / total) * 100)}%`, backgroundColor: accentColor }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Star } from '@lucide/vue'

const props = defineProps({
  icon: { type: [Object, Function], required: true },
  label: { type: String, required: true },
  points: { type: Number, default: 0 },
  // andamento (ex: pergunta 2 de 5): alimenta a barra; sem total, a barra some
  current: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  accentColor: { type: String, default: '#10939b' },
  // tema escuro do jogo (chips claros sobre fundo escuro)
  dark: { type: Boolean, default: false },
})

const chipStyle = computed(() =>
  props.dark
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderColor: 'rgba(255, 255, 255, 0.26)',
        color: '#ffffff',
      }
    : {
        backgroundColor: 'rgba(255, 255, 255, 0.82)',
        borderColor: 'rgba(255, 255, 255, 0.95)',
        color: '#2b2b2b',
      }
)
</script>

<style scoped>
.gh-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 62%;
  padding: 0.6rem 1.25rem 0.6rem 0.6rem;
  border: 1.5px solid;
  border-radius: 9999px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px -14px rgba(0, 0, 0, 0.35);
}
/* o chip de pontos não tem ícone redondo à esquerda: padding simétrico */
.gh-chip:not(:has(.gh-icon)) {
  padding: 0.6rem 1.4rem;
}
.gh-icon {
  display: flex;
  height: 2.6rem;
  width: 2.6rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: #ffffff;
}
</style>
