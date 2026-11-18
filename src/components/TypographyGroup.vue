<template>
  <div class="space-y-4">
    <div class="field">
      <label :for="`${uid}-font`">Fonte</label>
      <select :id="`${uid}-font`" :value="get('font')" :style="{ fontFamily: previewFont }" @change="setFont($event.target.value)">
        <option v-if="withDefault" value="">Padrão do jogo</option>
        <option v-for="font in FONT_OPTIONS" :key="font.name" :value="font.name">{{ font.name }} — {{ font.sample }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="field">
        <label :for="`${uid}-weight`">Grossura</label>
        <select :id="`${uid}-weight`" :value="get('weight') ?? ''" @change="setWeight($event.target.value)">
          <option v-if="withDefault" value="">Padrão</option>
          <option v-for="w in weights" :key="w" :value="w">{{ weightLabel(w) }}</option>
        </select>
      </div>
      <ColorField
        :model-value="get('color') || ''"
        label="Cor"
        :fallback="colorFallback"
        @update:model-value="set('color', $event)"
      />
    </div>

    <div v-if="withSize" class="field">
      <label :for="`${uid}-size`">Tamanho: {{ sizeLabel }}</label>
      <input
        :id="`${uid}-size`"
        type="range"
        min="50"
        max="250"
        step="5"
        class="!p-0"
        :value="sizeValue"
        @input="set('size', Number($event.target.value))"
      />
      <div class="flex justify-between text-xs text-ink-muted">
        <span>Menor</span>
        <button type="button" class="font-bold text-primary-600 hover:underline" @click="set('size', null)">Padrão</button>
        <span>Maior</span>
      </div>
    </div>

    <div class="field">
      <label :for="`${uid}-spacing`">Espaçamento entre as letras: {{ spacingLabel }}</label>
      <input
        :id="`${uid}-spacing`"
        type="range"
        min="-0.05"
        max="0.3"
        step="0.01"
        class="!p-0"
        :value="spacingValue"
        @input="set('spacing', Number($event.target.value))"
      />
      <div class="flex justify-between text-xs text-ink-muted">
        <span>Mais junto</span>
        <button type="button" class="font-bold text-primary-600 hover:underline" @click="set('spacing', resetSpacing)">Padrão</button>
        <span>Mais espaçado</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ColorField from '@/components/ColorField.vue'
import { FONT_OPTIONS, WEIGHT_LABELS, weightsFor, fontStack, loadFont, nearestWeight } from '@/utils/appearance'

const props = defineProps({
  // objeto com as chaves <prefix>_font, <prefix>_weight, <prefix>_color, <prefix>_spacing
  modelValue: { type: Object, required: true },
  prefix: { type: String, required: true }, // 'title' | 'text'
  // nos jogos, vazio significa "manter o visual original do jogo"
  withDefault: { type: Boolean, default: false },
  // mostra o controle de tamanho (usado nos títulos dos jogos)
  withSize: { type: Boolean, default: false },
  // fonte considerada quando nenhuma foi escolhida (define os pesos disponíveis)
  defaultFont: { type: String, default: 'Roboto' },
  // valor do espaçamento ao clicar em "Padrão" (null = voltar ao padrão do jogo)
  resetSpacing: { type: Number, default: null },
  colorFallback: { type: String, default: '#000000' },
})
const emit = defineEmits(['update:modelValue'])

const uid = `tg-${props.prefix}-${Math.random().toString(36).slice(2, 7)}`

function get(key) {
  return props.modelValue?.[`${props.prefix}_${key}`]
}

function set(key, value) {
  emit('update:modelValue', { ...props.modelValue, [`${props.prefix}_${key}`]: value })
}

const currentFont = computed(() => get('font') || (props.withDefault ? props.defaultFont : props.defaultFont))
const weights = computed(() => weightsFor(currentFont.value))
const previewFont = computed(() => {
  const font = get('font')
  if (font) loadFont(font)
  return font ? fontStack(font) : undefined
})

function setFont(font) {
  loadFont(font)
  const next = { ...props.modelValue, [`${props.prefix}_font`]: font }
  // o peso escolhido pode não existir na fonte nova: usa o mais próximo
  const weight = get('weight')
  if (font && weight) next[`${props.prefix}_weight`] = nearestWeight(font, Number(weight))
  emit('update:modelValue', next)
}

function setWeight(value) {
  set('weight', value === '' ? '' : Number(value))
}

const sizeValue = computed(() => {
  const value = get('size')
  return value === null || value === undefined || value === '' ? 100 : Number(value)
})

const sizeLabel = computed(() => {
  const value = get('size')
  return value === null || value === undefined || value === '' ? 'padrão (100%)' : `${Number(value)}%`
})

const spacingValue = computed(() => {
  const value = get('spacing')
  return value === null || value === undefined || value === '' ? 0 : Number(value)
})

const spacingLabel = computed(() => {
  const value = get('spacing')
  if (value === null || value === undefined || value === '') return 'padrão'
  const n = Number(value)
  if (Math.abs(n) < 0.005) return 'normal'
  return `${n > 0 ? '+' : ''}${n.toFixed(2)} em`
})

function weightLabel(weight) {
  return `${WEIGHT_LABELS[weight] || ''} (${weight})`.trim()
}
</script>
