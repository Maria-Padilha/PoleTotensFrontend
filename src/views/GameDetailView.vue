<template>
  <AppShell>
    <section v-if="game" class="max-w-2xl">
      <router-link
        :to="{ name: 'jogos' }"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft :size="16" /> Voltar para jogos
      </router-link>

      <div class="card mt-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex gap-4">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50
                text-primary-600"
            >
              <Gamepad2 :size="26" />
            </span>
            <div>
              <h1 class="text-2xl">{{ game.name }}</h1>
              <span class="badge mt-1" :class="{ 'badge-muted': !game.is_active }">
                {{ game.is_active ? 'Disponível no catálogo' : 'Inativo' }}
              </span>
            </div>
          </div>
        </div>

        <p class="mt-5 text-sm text-ink-muted">
          {{ game.description || 'Sem descrição cadastrada.' }}
        </p>

        <div class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink/[0.06] pt-5">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-ink-soft">Preço</p>

            <div v-if="!auth.isAdmin || !editingPrice" class="mt-1 flex items-center gap-2">
              <span class="font-heading text-2xl font-bold text-primary">{{ priceLabel }}</span>
              <button
                v-if="auth.isAdmin"
                class="text-xs font-bold text-ink-muted hover:text-primary"
                @click="startEditPrice"
              >
                <Pencil :size="12" class="inline" /> editar
              </button>
            </div>

            <form v-else class="mt-1 flex items-center gap-2" @submit.prevent="handleSavePrice">
              <input
                v-model="priceDraft"
                type="number"
                min="0"
                step="0.01"
                class="w-28 rounded-xl border border-ink/10 px-3 py-1.5 text-sm"
              />
              <button type="submit" class="btn-primary !px-3 !py-1.5 text-xs" :disabled="savingPrice">
                {{ savingPrice ? 'Salvando...' : 'Salvar' }}
              </button>
              <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="editingPrice = false">
                Cancelar
              </button>
            </form>
          </div>

          <span v-if="game.owned" class="badge">Já está na sua biblioteca</span>
          <button v-else class="btn-primary" :disabled="acquiring" @click="handleAcquire">
            {{ acquiring ? 'Adquirindo...' : 'Adquirir jogo' }}
          </button>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Gamepad2, Pencil } from '@lucide/vue'
import api from '@/services/api'
import AppShell from '@/layouts/AppShell.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const game = ref(null)
const acquiring = ref(false)
const editingPrice = ref(false)
const priceDraft = ref(0)
const savingPrice = ref(false)

const priceLabel = computed(() => {
  if (!game.value) return ''
  return Number(game.value.base_price) > 0 ? `R$ ${Number(game.value.base_price).toFixed(2)}` : 'Grátis'
})

async function loadGame() {
  const { data } = await api.get('/games')
  game.value = data.data.find((g) => g.slug === route.params.slug) || null
}

function startEditPrice() {
  priceDraft.value = game.value.base_price
  editingPrice.value = true
}

async function handleSavePrice() {
  savingPrice.value = true
  try {
    await api.put(`/games/${game.value.id}`, { base_price: priceDraft.value })
    editingPrice.value = false
    await loadGame()
  } finally {
    savingPrice.value = false
  }
}

async function handleAcquire() {
  acquiring.value = true
  try {
    await api.post(`/games/${game.value.id}/acquire`)
    await loadGame()
  } finally {
    acquiring.value = false
  }
}

onMounted(loadGame)
</script>
