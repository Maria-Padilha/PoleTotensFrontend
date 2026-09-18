<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-ink">Afirmações do jogo</label>
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addStatement">
        <Plus :size="14" /> Adicionar afirmação
      </button>
    </div>

    <p v-if="statements.length === 0" class="text-sm text-ink-muted">
      Nenhuma afirmação ainda. Adicione ao menos uma.
    </p>

    <div
      v-for="(statement, sIndex) in statements"
      :key="statement.id"
      class="rounded-xl border border-ink/10 p-4"
    >
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          @click="toggleExpanded(statement.id)"
        >
          <component :is="isExpanded(statement.id) ? ChevronDown : ChevronRight" :size="16" class="shrink-0 text-ink-soft" />
          <span class="shrink-0 text-sm font-bold text-ink">Afirmação {{ sIndex + 1 }}</span>
          <span v-if="statement.text" class="truncate text-sm text-ink-muted">— {{ statement.text }}</span>
          <span v-else class="truncate text-sm italic text-ink-soft">Sem texto ainda</span>
        </button>
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft
            transition-colors hover:!bg-danger-tint hover:!text-danger"
          title="Remover afirmação"
          @click="removeStatement(sIndex)"
        >
          <Trash2 :size="15" />
        </button>
      </div>

      <template v-if="isExpanded(statement.id)">
        <HighlightPicker
          :id="`statement-${statement.id}`"
          v-model="statement.text"
          label="Texto da afirmação"
          placeholder="Ex: A torre Eiffel fica em Londres."
          :color="color"
          class="mt-3"
        />

        <ImageUploadField
          v-model="statement.image_url"
          label="Imagem da afirmação (opcional)"
          :event-id="eventId"
          game-slug="verdadeiro-ou-falso"
          folder="afirmacoes"
          class="mt-3"
        />

        <div class="field mt-3">
          <label>Resposta certa</label>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold
                transition-colors"
              :class="statement.correct_answer === true
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-ink/10 text-ink-muted hover:border-ink/20'"
              @click="statement.correct_answer = true"
            >
              <Check :size="15" /> Verdadeiro
            </button>
            <button
              type="button"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold
                transition-colors"
              :class="statement.correct_answer === false
                ? 'border-danger bg-danger-tint text-danger'
                : 'border-ink/10 text-ink-muted hover:border-ink/20'"
              @click="statement.correct_answer = false"
            >
              <X :size="15" /> Falso
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus, Trash2, Check, X, ChevronDown, ChevronRight } from '@lucide/vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import HighlightPicker from '@/components/HighlightPicker.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  eventId: { type: [Number, String], default: null },
  color: { type: String, default: '#10939b' },
})
const emit = defineEmits(['update:modelValue'])

const statements = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Estado só de UI (não vai pro backend) — afirmações ficam fechadas por
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

function addStatement() {
  const statement = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text: '',
    image_url: '',
    correct_answer: true,
  }
  statements.value = [...statements.value, statement]
  expandedIds.value = new Set([...expandedIds.value, statement.id])
}

function removeStatement(index) {
  statements.value = statements.value.filter((_, i) => i !== index)
}
</script>
