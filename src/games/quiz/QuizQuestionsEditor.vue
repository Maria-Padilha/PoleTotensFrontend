<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="text-sm font-bold text-ink">Perguntas do quiz</label>
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="addQuestion">
        <Plus :size="14" /> Adicionar pergunta
      </button>
    </div>

    <p v-if="questions.length === 0" class="text-sm text-ink-muted">
      Nenhuma pergunta ainda. Adicione ao menos uma.
    </p>

    <div
      v-for="(question, qIndex) in questions"
      :key="question.id"
      class="rounded-xl border border-ink/10 p-4"
    >
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          @click="toggleExpanded(question.id)"
        >
          <component :is="isExpanded(question.id) ? ChevronDown : ChevronRight" :size="16" class="shrink-0 text-ink-soft" />
          <span class="shrink-0 text-sm font-bold text-ink">Pergunta {{ qIndex + 1 }}</span>
          <span v-if="question.text" class="truncate text-sm text-ink-muted">— {{ question.text }}</span>
          <span v-else class="truncate text-sm italic text-ink-soft">Sem texto ainda</span>
        </button>
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft
            transition-colors hover:!bg-danger-tint hover:!text-danger"
          title="Remover pergunta"
          @click="removeQuestion(qIndex)"
        >
          <Trash2 :size="15" />
        </button>
      </div>

      <template v-if="isExpanded(question.id)">
        <HighlightPicker
          :id="`question-${question.id}`"
          v-model="question.text"
          label="Texto da pergunta"
          placeholder="Qual é a pergunta?"
          :color="color"
          class="mt-3"
        />

        <ImageUploadField
          v-model="question.image_url"
          label="Imagem da pergunta (opcional)"
          :event-id="eventId"
          game-slug="quiz"
          folder="perguntas"
          class="mt-3"
        />

        <div class="mt-3 space-y-2">
          <div
            v-for="(option, oIndex) in question.options"
            :key="oIndex"
            class="flex items-center gap-2"
          >
            <input
              type="radio"
              :name="`correct-${question.id}`"
              class="h-4 w-4 shrink-0 accent-primary"
              :checked="question.correct_index === oIndex"
              title="Marcar como resposta certa"
              @change="question.correct_index = oIndex"
            />
            <input
              v-model="question.options[oIndex]"
              class="w-full rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm text-ink outline-none
                transition-colors focus:border-primary"
              :placeholder="`Alternativa ${oIndex + 1}`"
            />
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft
                transition-colors hover:!bg-danger-tint hover:!text-danger disabled:pointer-events-none
                disabled:opacity-30"
              :disabled="question.options.length <= 2"
              title="Remover alternativa"
              @click="removeOption(question, oIndex)"
            >
              <X :size="14" />
            </button>
          </div>
          <button
            type="button"
            class="text-xs font-bold text-primary hover:text-primary-hover"
            @click="addOption(question)"
          >
            + Adicionar alternativa
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus, Trash2, X, ChevronDown, ChevronRight } from '@lucide/vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import HighlightPicker from '@/components/HighlightPicker.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  eventId: { type: [Number, String], default: null },
  color: { type: String, default: '#10939b' },
})
const emit = defineEmits(['update:modelValue'])

const questions = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Estado só de UI (não vai pro backend) — perguntas ficam fechadas por padrão,
// só mostrando o título, pra lista não ficar gigante com muitas perguntas.
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

function addQuestion() {
  const question = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text: '',
    image_url: '',
    options: ['', ''],
    correct_index: 0,
  }
  questions.value = [...questions.value, question]
  expandedIds.value = new Set([...expandedIds.value, question.id])
}

function removeQuestion(index) {
  questions.value = questions.value.filter((_, i) => i !== index)
}

function addOption(question) {
  question.options.push('')
}

function removeOption(question, index) {
  if (question.options.length <= 2) return
  question.options.splice(index, 1)
  if (question.correct_index >= question.options.length) {
    question.correct_index = question.options.length - 1
  }
}
</script>
