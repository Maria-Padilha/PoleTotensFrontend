<template>
  <AppShell>
    <section>
      <div>
        <h1 class="text-2xl sm:text-3xl">Jogos</h1>
        <p class="mt-1 text-sm text-ink-muted">
          Catálogo de jogos disponíveis. Adquira jogos para usá-los nos seus eventos.
        </p>
      </div>

      <p v-if="!loadingList && games.length === 0" class="mt-8 text-sm text-ink-muted">
        Nenhum jogo cadastrado ainda.
      </p>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <router-link
          v-for="game in games"
          :key="game.id"
          :to="{ name: 'jogo', params: { slug: game.slug } }"
          class="card flex flex-col gap-2 transition-shadow hover:shadow-md hover:shadow-ink/[0.06]"
        >
          <div class="mb-1 flex items-center justify-between">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Gamepad2 :size="18" />
            </span>
            <span v-if="!game.is_active" class="badge badge-muted">Inativo</span>
          </div>
          <h3 class="text-base font-bold text-ink">{{ game.name }}</h3>
          <p v-if="game.description" class="text-xs text-ink-muted">{{ game.description }}</p>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-sm font-bold text-primary">{{ priceLabel(game.base_price) }}</span>
            <span v-if="game.owned" class="badge">Na biblioteca</span>
            <span v-else class="text-xs font-bold text-ink-soft">Ver detalhes →</span>
          </div>
        </router-link>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Gamepad2 } from '@lucide/vue'
import api from '@/services/api'
import AppShell from '@/layouts/AppShell.vue'

const games = ref([])
const loadingList = ref(true)

function priceLabel(price) {
  return Number(price) > 0 ? `R$ ${Number(price).toFixed(2)}` : 'Grátis'
}

async function loadGames() {
  loadingList.value = true
  const { data } = await api.get('/games')
  games.value = data.data
  loadingList.value = false
}

onMounted(loadGames)
</script>
