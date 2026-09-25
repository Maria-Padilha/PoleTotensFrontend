<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12 text-center" :style="rootBgStyle">
    <div v-if="loading" class="text-ink-muted">Carregando...</div>

    <div v-else-if="!info" class="w-full max-w-sm">
      <span class="flex h-20 w-20 items-center justify-center rounded-full bg-ink/5 text-ink-soft mx-auto">
        <ImageOff :size="32" />
      </span>
      <h1 class="font-elegant mt-6 text-3xl font-bold text-ink">Link inválido</h1>
      <p class="mt-2 text-ink-muted">Peça pra escanear o QR code de novo.</p>
    </div>

    <div v-else-if="uploaded || info.already_uploaded" class="w-full max-w-sm">
      <span class="flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-600 mx-auto">
        <PartyPopper :size="40" />
      </span>
      <h1 class="font-elegant mt-6 text-4xl font-bold text-ink">Foto enviada!</h1>
      <p class="mt-3 text-lg text-ink-muted">
        Obrigado, {{ info.player_name }}! Ela vai aparecer no recap do evento.
      </p>
    </div>

    <div v-else class="w-full max-w-sm">
      <span class="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 mx-auto">
        <Camera :size="32" />
      </span>
      <h1 class="font-elegant mt-6 text-4xl font-bold text-ink">Oi, {{ info.player_name }}!</h1>
      <p class="mt-3 text-lg text-ink-muted">
        Manda uma foto sua jogando <strong class="text-ink">{{ info.game_name }}</strong> pro recap do evento.
      </p>

      <template v-if="!previewUrl">
        <label
          class="mt-9 flex flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed
            border-ink/15 bg-white/60 px-6 py-16 text-ink-muted transition-colors active:border-primary"
        >
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Camera :size="28" />
          </span>
          <span class="text-base font-bold text-ink">Toque pra tirar ou escolher uma foto</span>
          <input type="file" accept="image/*" capture="environment" class="hidden" @change="handleSelect" />
        </label>
      </template>

      <template v-else>
        <div class="mt-9 overflow-hidden rounded-[2rem] border border-ink/10 shadow-2xl">
          <img :src="previewUrl" alt="Prévia da foto" class="aspect-square w-full object-cover" />
        </div>

        <div class="mt-6 flex flex-col gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-lg
              font-bold text-white shadow-xl transition-transform active:scale-95 disabled:opacity-60"
            :disabled="uploading"
            @click="handleUpload"
          >
            <Check :size="22" /> {{ uploading ? 'Enviando...' : 'Enviar essa foto' }}
          </button>
          <label
            class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2
              border-ink/15 bg-white px-8 py-4 text-base font-bold text-ink transition-colors active:border-primary"
          >
            <RotateCcw :size="18" /> Escolher outra
            <input
              type="file"
              accept="image/*"
              capture="environment"
              class="hidden"
              :disabled="uploading"
              @change="handleSelect"
            />
          </label>
        </div>
      </template>

      <p v-if="error" class="mt-5 text-sm font-bold text-danger">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Camera, Check, RotateCcw, PartyPopper, ImageOff } from '@lucide/vue'
import api from '@/services/api'

const route = useRoute()
const loading = ref(true)
const info = ref(null)
const uploading = ref(false)
const uploaded = ref(false)
const error = ref('')
const selectedFile = ref(null)
const previewUrl = ref('')

const rootBgStyle = {
  background: 'radial-gradient(circle at 20% 20%, #d9e8e6 0%, #fcf8f5 45%, #f6f2e9 100%)',
}

async function load() {
  try {
    const { data } = await api.get(`/foto/${route.params.token}`)
    info.value = data
  } catch (err) {
    info.value = null
  } finally {
    loading.value = false
  }
}

// Mostra uma prévia antes de enviar de verdade — antes subia direto ao
// escolher o arquivo, sem chance de conferir/trocar a foto primeiro.
function handleSelect(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  error.value = ''
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

async function handleUpload() {
  if (!selectedFile.value) return

  error.value = ''
  uploading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    await api.post(`/foto/${route.params.token}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    uploaded.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível enviar a foto.'
  } finally {
    uploading.value = false
  }
}

onMounted(load)
onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>
