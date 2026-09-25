<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-ink">Opções da roleta</label>
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addPrize">
        <Plus :size="14" /> Adicionar opção
      </button>
    </div>

    <p class="text-xs text-ink-soft">
      Use no mínimo 2 opções — prêmios, desafios, decisões, o que fizer sentido pro seu evento. Nomes curtos cabem
      melhor na fatia. O "peso" define a chance relativa de cair naquela opção (todas as fatias aparecem do mesmo
      tamanho, o peso só afeta o sorteio) — deixe 1 pra todas terem a mesma chance. A classificação
      (positiva/negativa/neutra) define a cor do brilho e o som ao parar nela.
    </p>

    <div class="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-ink/[0.02] p-3">
      <label class="flex items-center gap-2 text-xs font-bold text-ink">
        <input v-model="usePalette" type="checkbox" />
        Seguir uma cor base
      </label>
      <input v-if="usePalette" v-model="paletteBase" type="color" class="h-8 w-12 shrink-0 cursor-pointer rounded" />
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="randomizeColors">
        <Shuffle :size="14" /> Gerar cores aleatórias
      </button>
    </div>

    <p v-if="prizes.length === 0" class="text-sm text-ink-muted">
      Nenhuma opção ainda. Adicione ao menos duas.
    </p>

    <div v-for="(prize, pIndex) in prizes" :key="prize.id" class="rounded-xl border border-ink/10 p-3">
      <div class="flex items-center gap-2">
        <span class="w-6 shrink-0 text-right text-xs font-bold text-ink-soft">{{ pIndex + 1 }}.</span>
        <input
          :value="prize.color || '#10939b'"
          type="color"
          class="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-ink/10"
          title="Cor da fatia"
          @input="prize.color = $event.target.value"
        />
        <input
          v-model="prize.label"
          type="text"
          placeholder="Ex: 2 shots"
          class="w-full flex-1 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none
            transition-colors focus:border-primary"
          maxlength="40"
        />
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft
            transition-colors hover:!bg-danger-tint hover:!text-danger"
          title="Remover opção"
          @click="removePrize(pIndex)"
        >
          <Trash2 :size="15" />
        </button>
      </div>

      <div class="mt-2.5 flex flex-wrap items-center gap-3 pl-8">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-ink-soft">Peso</span>
          <input
            v-model.number="prize.weight"
            type="number"
            min="1"
            max="100"
            class="w-16 rounded-xl border border-ink/10 bg-white px-2 py-2 text-center text-sm text-ink outline-none
              transition-colors focus:border-primary"
          />
        </div>
        <div class="flex gap-1.5">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors"
            :class="prize.outcome_type === 'positive'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-ink/10 text-ink-muted hover:border-ink/20'"
            @click="prize.outcome_type = 'positive'"
          >
            <ThumbsUp :size="13" /> Positiva
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors"
            :class="prize.outcome_type === 'negative'
              ? 'border-danger bg-danger-tint text-danger'
              : 'border-ink/10 text-ink-muted hover:border-ink/20'"
            @click="prize.outcome_type = 'negative'"
          >
            <ThumbsDown :size="13" /> Negativa
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors"
            :class="(!prize.outcome_type || prize.outcome_type === 'neutral')
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-ink/10 text-ink-muted hover:border-ink/20'"
            @click="prize.outcome_type = 'neutral'"
          >
            <Minus :size="13" /> Neutra
          </button>
        </div>
      </div>

      <div class="mt-2.5 pl-8">
        <input
          v-model="prize.message"
          type="text"
          placeholder="Mensagem ao cair aqui (opcional — se vazio, usa a mensagem genérica do tipo)"
          class="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none
            transition-colors focus:border-primary"
          maxlength="150"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus, Trash2, Shuffle, ThumbsUp, ThumbsDown, Minus } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  color: { type: String, default: '#10939b' },
})
const emit = defineEmits(['update:modelValue'])

const prizes = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Só ferramentas de geração — não fazem parte da config salva.
const usePalette = ref(false)
const paletteBase = ref(props.color || '#10939b')

function addPrize() {
  const prize = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    weight: 1,
    color: '',
    outcome_type: 'neutral',
    message: '',
  }
  prizes.value = [...prizes.value, prize]
}

function removePrize(index) {
  prizes.value = prizes.value.filter((_, i) => i !== index)
}

function hexToHsl(hex) {
  const clean = (hex || '#10939b').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16) || 0
  const r = ((num >> 16) & 0xff) / 255
  const g = ((num >> 8) & 0xff) / 255
  const b = (num & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360
  const sat = s / 100
  const light = l / 100
  const k = (n) => (n + hue / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

// Sem paleta: matiz espalhado por igual ao redor da roda de cores (+ um
// pouco de jitter pra não ficar mecânico demais). Com paleta: variações de
// matiz/luz em torno da cor base escolhida, mantendo tudo na mesma família.
function randomizeColors() {
  const n = prizes.value.length
  if (!n) return

  const baseHsl = usePalette.value ? hexToHsl(paletteBase.value) : null
  const startOffset = Math.random() * 360

  prizes.value.forEach((prize, i) => {
    let hue
    let sat
    let light
    if (baseHsl) {
      hue = baseHsl.h + (Math.random() * 70 - 35)
      sat = Math.min(85, Math.max(45, baseHsl.s + (Math.random() * 20 - 10)))
      light = Math.min(60, Math.max(32, baseHsl.l + (Math.random() * 24 - 12)))
    } else {
      hue = startOffset + i * (360 / n) + (Math.random() * 16 - 8)
      sat = 55 + Math.random() * 20
      light = 40 + Math.random() * 14
    }
    prize.color = hslToHex(hue, sat, light)
  })
}
</script>
