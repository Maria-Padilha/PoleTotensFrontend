<template>
  <div class="field">
    <label v-if="label" :for="inputId">{{ label }}</label>

    <div class="flex items-center gap-3">
      <div class="flex flex-1 flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <label
            :for="inputId"
            class="btn-outline !px-3.5 !py-2 text-xs"
            :class="{ 'pointer-events-none opacity-60': uploading }"
          >
            <Upload :size="13" /> {{ uploading ? 'Enviando...' : modelValue ? 'Trocar música' : 'Escolher música' }}
          </label>
          <button
            v-if="modelValue"
            type="button"
            class="text-xs font-bold text-ink-muted hover:text-danger"
            @click="$emit('update:modelValue', '')"
          >
            Remover
          </button>
        </div>
        <audio v-if="modelValue" :src="modelValue" controls class="h-9 w-full max-w-xs" />
        <input :id="inputId" type="file" accept="audio/*" class="hidden" @change="handleChange" />
        <p v-if="error" class="field-error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload } from '@lucide/vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  eventId: { type: [Number, String], default: null },
  gameSlug: { type: String, default: '' },
  folder: { type: String, default: 'arquivos' },
})
const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const error = ref('')
const inputId = `upload-${Math.random().toString(36).slice(2, 9)}`

async function handleChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  error.value = ''
  uploading.value = true

  const formData = new FormData()
  formData.append('file', file)
  if (props.eventId) formData.append('event_id', props.eventId)
  if (props.gameSlug) formData.append('game_slug', props.gameSlug)
  formData.append('folder', props.folder)

  try {
    const { data } = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    emit('update:modelValue', data.url)
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível enviar o áudio.'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}
</script>
