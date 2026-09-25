<template>
  <div class="relative min-h-screen overflow-hidden" :style="bgStyle">
    <div v-if="loading" class="flex min-h-screen items-center justify-center text-white/80">
      Carregando...
    </div>

    <div v-else-if="!instance" class="flex min-h-screen items-center justify-center p-6">
      <div class="card max-w-sm text-center">
        <h1 class="text-xl">Link inválido</h1>
        <p class="mt-2 text-sm text-ink-muted">Não encontramos esse jogo. Peça um novo link ao organizador.</p>
      </div>
    </div>

    <template v-else>
      <!-- captura só o nome (sem CPF/lead por enquanto) antes de cada partida -->
      <div
        v-if="stage === 'name'"
        class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <h1
          class="font-elegant text-5xl font-bold leading-tight sm:text-7xl"
          :style="{ color: isDarkTheme ? '#ffffff' : '#2b2b2b' }"
        >
          {{ instance.title }}
        </h1>
        <p class="mt-4 text-lg sm:text-2xl" :style="{ color: isDarkTheme ? 'rgba(255,255,255,0.75)' : '#6b6b6b' }">
          Antes de começar, qual seu nome?
        </p>
        <form class="mt-9 flex w-full max-w-md flex-col items-center gap-4" @submit.prevent="startGame">
          <input
            v-model="playerName"
            type="text"
            placeholder="Seu nome"
            maxlength="60"
            required
            autofocus
            class="w-full rounded-2xl border-2 bg-white px-6 py-5 text-center text-2xl font-bold text-ink shadow-lg
              outline-none sm:text-3xl"
            :style="{ borderColor: accentColor }"
          />
          <button
            type="submit"
            class="rounded-2xl px-16 py-6 text-2xl font-bold text-white shadow-xl transition-transform
              active:scale-95 sm:text-3xl"
            :style="{ backgroundColor: accentColor }"
          >
            Jogar
          </button>
        </form>
      </div>

      <!-- jogo de verdade -->
      <template v-else>
        <component
          :is="gameDef.player"
          v-if="gameDef"
          :key="roundKey"
          :title="instance.title"
          :config="instance.config"
          :top-inset="0"
          @finished="handleFinished"
        />
        <button
          type="button"
          class="fixed right-4 top-4 z-50 rounded-full bg-black/40 px-4 py-2 text-xs font-bold text-white
            backdrop-blur transition-colors hover:bg-black/60"
          @click="switchPlayer"
        >
          Trocar jogador
        </button>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { getGameDefinition } from '@/games/registry'

const route = useRoute()
const loading = ref(true)
const instance = ref(null)
const playerName = ref('')
const stage = ref('name')
const roundKey = ref(0)

const gameDef = computed(() => (instance.value ? getGameDefinition(instance.value.game.slug) : null))
const accentColor = computed(() => instance.value?.config?.primary_color || '#10939b')
const isDarkTheme = computed(() => instance.value?.config?.theme === 'escuro')

const bgStyle = computed(() => {
  const cfg = instance.value?.config || {}
  if (cfg.background_url) {
    return { backgroundImage: `url(${cfg.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return {
    background: isDarkTheme.value
      ? 'radial-gradient(circle at 20% 20%, #0f6971 0%, #05161a 60%, #05161a 100%)'
      : 'radial-gradient(circle at 20% 20%, #d9e8e6 0%, #fcf8f5 45%, #f6f2e9 100%)',
  }
})

async function load() {
  try {
    const { data } = await api.get(`/play/${route.params.token}`)
    instance.value = data
  } catch (err) {
    instance.value = null
  } finally {
    loading.value = false
  }
}

function startGame() {
  if (!playerName.value.trim()) return
  stage.value = 'playing'
}

// Volta pra tela de nome sem sair do link — pra passar o totem pro próximo
// convidado sem precisar reabrir nada.
function switchPlayer() {
  playerName.value = ''
  stage.value = 'name'
  roundKey.value += 1
}

async function handleFinished(payload) {
  try {
    await api.post(`/play/${route.params.token}/plays`, {
      player_name: playerName.value.trim(),
      score: payload?.score ?? null,
      metadata: payload?.won !== null && payload?.won !== undefined ? { won: payload.won } : null,
      client_uuid: crypto.randomUUID(),
    })
  } catch (err) {
    // silencioso: não travar a experiência do convidado por causa de rede
  }
}

onMounted(load)
</script>
