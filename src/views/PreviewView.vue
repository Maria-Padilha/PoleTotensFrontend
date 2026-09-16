<template>
  <div>
    <div v-if="loading" class="flex min-h-screen items-center justify-center bg-primary-900 text-white/80">
      Carregando preview...
    </div>

    <div v-else-if="expired" class="flex min-h-screen items-center justify-center bg-primary-900 p-6">
      <div class="card max-w-sm text-center">
        <h1 class="text-xl">Link expirado</h1>
        <p class="mt-2 text-sm text-ink-muted">
          Este link de preview expirou (válido por 5 minutos após aberto). Peça um novo link ao organizador
          do evento.
        </p>
      </div>
    </div>

    <template v-else-if="preview">
      <!-- barra de chrome do preview: some por cima do jogo, não faz parte dele -->
      <div
        class="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-ink/70 px-4 py-2.5
          text-white backdrop-blur"
      >
        <span class="inline-flex items-center gap-1.5 text-xs font-bold sm:text-sm">
          <Sparkles :size="14" /> Preview do jogo
        </span>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 text-xs font-bold sm:text-sm">
            <Clock :size="14" /> {{ clockLabel }}
          </span>
          <button
            class="rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-ink transition-colors
              hover:bg-white/90 disabled:opacity-60 sm:text-sm"
            :class="{ '!bg-green-500 !text-white': approved }"
            :disabled="approving"
            @click="handleApprove"
          >
            {{ approved ? 'Aprovado ✓' : approving ? 'Aprovando...' : 'Aprovar' }}
          </button>
        </div>
      </div>

      <component
        :is="gameDef.player"
        v-if="gameDef"
        :title="preview.title"
        :config="preview.config"
        :top-inset="56"
      />

      <div
        v-else
        class="flex min-h-screen items-center justify-center p-6"
        :style="backgroundStyle"
      >
        <div class="w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl backdrop-blur">
          <span class="badge mx-auto">{{ preview.game.name }}</span>
          <h1 class="mt-3 text-3xl" :style="{ color: preview.config.primary_color || undefined }">
            {{ preview.title }}
          </h1>

          <div v-if="preview.config.timer_seconds" class="mt-6 inline-flex flex-col items-center">
            <span class="font-heading text-4xl font-bold text-primary">
              {{ formatTimer(preview.config.timer_seconds) }}
            </span>
            <span class="text-xs text-ink-muted">cronômetro do jogo</span>
          </div>

          <p class="mt-6 text-xs text-ink-soft">Ainda sem experiência jogável — só a personalização.</p>
        </div>
      </div>
    </template>

    <div v-else class="flex min-h-screen items-center justify-center bg-primary-900 p-6">
      <div class="card max-w-sm text-center">
        <h1 class="text-xl">Link inválido</h1>
        <p class="mt-2 text-sm text-ink-muted">Não encontramos um preview para este link.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Sparkles, Clock } from '@lucide/vue'
import api from '@/services/api'
import { getGameDefinition } from '@/games/registry'

const route = useRoute()
const loading = ref(true)
const expired = ref(false)
const preview = ref(null)
const approved = ref(false)
const approving = ref(false)
const now = ref(Date.now())
let timer = null

const gameDef = computed(() => (preview.value ? getGameDefinition(preview.value.game.slug) : null))

const backgroundStyle = computed(() => {
  const bg = preview.value?.config?.background_url
  if (bg) {
    return { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return {
    background: 'radial-gradient(circle at 20% 20%, #0f6971 0%, #05161a 60%, #05161a 100%)',
  }
})

const clockLabel = computed(() => {
  if (!preview.value) return '0:00'
  const diffMs = new Date(preview.value.expires_at).getTime() - now.value
  const totalSeconds = Math.max(0, Math.ceil(diffMs / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function load() {
  try {
    const { data } = await api.get(`/preview/${route.params.token}`)
    preview.value = data
    approved.value = Boolean(data.approved_at)
  } catch (err) {
    if (err.response?.status === 410) {
      expired.value = true
    }
  } finally {
    loading.value = false
  }
}

async function handleApprove() {
  approving.value = true
  try {
    await api.post(`/preview/${route.params.token}/approve`)
    approved.value = true
  } finally {
    approving.value = false
  }
}

onMounted(() => {
  load()
  timer = setInterval(() => {
    now.value = Date.now()
    if (preview.value && new Date(preview.value.expires_at).getTime() <= now.value) {
      expired.value = true
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
