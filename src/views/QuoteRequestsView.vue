<template>
  <AppShell>
    <section>
      <h1 class="text-2xl sm:text-3xl">Orçamentos</h1>
      <p class="mt-1 text-sm text-ink-muted sm:text-base">
        Pedidos enviados pelo formulário da página inicial. {{ requests.length }}
        {{ requests.length === 1 ? 'pedido' : 'pedidos' }}.
      </p>

      <p v-if="loading" class="mt-8 text-ink-muted">Carregando...</p>
      <p v-else-if="error" class="field-error mt-8">{{ error }}</p>
      <p v-else-if="!requests.length" class="card mt-8 text-ink-muted">Nenhum pedido de orçamento ainda.</p>

      <div v-else class="mt-8 space-y-4">
        <article v-for="request in requests" :key="request.id" class="card">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg">{{ request.name }}</h2>
              <p v-if="request.company" class="text-sm text-ink-muted">{{ request.company }}</p>
            </div>
            <span class="badge badge-muted">{{ formatDateTime(request.created_at) }}</span>
          </div>

          <dl class="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt class="font-bold text-ink-soft">E-mail</dt>
              <dd><a :href="`mailto:${request.email}`" class="text-primary-600 hover:underline">{{ request.email }}</a></dd>
            </div>
            <div>
              <dt class="font-bold text-ink-soft">Telefone</dt>
              <dd>
                <a :href="whatsappLink(request.phone)" target="_blank" rel="noopener" class="text-primary-600 hover:underline">
                  {{ request.phone }}
                </a>
              </dd>
            </div>
            <div v-if="request.event_type">
              <dt class="font-bold text-ink-soft">Tipo de evento</dt>
              <dd>{{ request.event_type }}</dd>
            </div>
            <div v-if="request.event_date">
              <dt class="font-bold text-ink-soft">Data</dt>
              <dd>{{ formatDate(request.event_date) }}</dd>
            </div>
            <div v-if="request.guests">
              <dt class="font-bold text-ink-soft">Convidados</dt>
              <dd>{{ request.guests }}</dd>
            </div>
            <div v-if="request.duration_hours">
              <dt class="font-bold text-ink-soft">Duração do totem</dt>
              <dd>{{ request.duration_hours }} horas ({{ request.duration_hours - 1 }} {{ request.duration_hours === 2 ? 'jogo grátis' : 'jogos grátis' }})</dd>
            </div>
          </dl>

          <p v-if="request.games?.length" class="mt-4 flex flex-wrap gap-2">
            <span v-for="game in request.games" :key="game" class="badge">{{ game }}</span>
          </p>
          <p v-if="request.message" class="mt-4 whitespace-pre-line rounded-xl bg-app-bg p-4 text-sm text-ink-muted">
            {{ request.message }}
          </p>
        </article>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import AppShell from '@/layouts/AppShell.vue'

const requests = ref([])
const loading = ref(true)
const error = ref('')

function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function whatsappLink(phone) {
  return `https://wa.me/55${String(phone).replace(/\D/g, '')}`
}

onMounted(async () => {
  try {
    const { data } = await api.get('/contact-requests')
    requests.value = data.data
  } catch (err) {
    error.value = err.response?.status === 403 ? 'Acesso restrito a administradores.' : 'Não foi possível carregar os pedidos.'
  } finally {
    loading.value = false
  }
})
</script>
