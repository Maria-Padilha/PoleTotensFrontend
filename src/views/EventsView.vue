<template>
  <AppShell>
    <section>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl">Eventos</h1>
          <p class="mt-1 text-sm text-ink-muted">Gerencie os eventos e o que está configurado em cada um.</p>
        </div>
        <button class="btn-primary shrink-0" @click="showForm = !showForm">
          <Plus :size="16" /> {{ showForm ? 'Cancelar' : 'Novo evento' }}
        </button>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex flex-1 items-center gap-2 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5">
          <Search :size="16" class="shrink-0 text-ink-muted" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nome..."
            class="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
          />
        </div>
        <div class="inline-flex w-fit shrink-0 gap-1 rounded-full bg-ink/[0.05] p-1">
          <button
            v-for="option in filters"
            :key="option.value"
            class="rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors"
            :class="filter === option.value ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'"
            @click="filter = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <form v-if="showForm" class="card mt-6 max-w-md space-y-4" @submit.prevent="handleCreate">
        <div class="field">
          <label for="name">Nome do evento</label>
          <input id="name" v-model="form.name" required placeholder="Casamento Ana e Bruno" />
        </div>
        <div class="field">
          <label for="client_name">Cliente</label>
          <input id="client_name" v-model="form.client_name" placeholder="Nome do cliente" />
        </div>
        <div class="field">
          <label for="location">Local</label>
          <input id="location" v-model="form.location" placeholder="Buffet Central" />
        </div>
        <div class="field">
          <label for="starts_at">Data/hora de início</label>
          <input id="starts_at" v-model="form.starts_at" type="datetime-local" />
        </div>

        <p v-if="error" class="field-error">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar evento' }}
        </button>
      </form>

      <p v-if="!loadingList && filteredEvents.length === 0" class="mt-8 text-sm text-ink-muted">
        Nenhum evento encontrado.
      </p>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <router-link
          v-for="event in filteredEvents"
          :key="event.id"
          :to="{ name: 'evento', params: { id: event.id } }"
          class="card flex flex-col gap-1 transition-shadow hover:shadow-md hover:shadow-ink/[0.06]"
        >
          <div class="mb-1 flex items-center justify-between">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 font-heading
                font-bold text-primary-600"
            >
              {{ event.name.charAt(0).toUpperCase() }}
            </span>
            <span
              title="Excluir"
              class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors
                hover:!bg-danger-tint hover:!text-danger"
              @click.stop.prevent="handleDelete(event)"
            >
              <Trash2 :size="15" />
            </span>
          </div>
          <h3 class="text-base font-bold text-ink">{{ event.name }}</h3>
          <span class="text-xs text-ink-muted">{{ event.client_name || 'Sem cliente definido' }}</span>
          <span v-if="event.location" class="inline-flex items-center gap-1 text-xs text-ink-muted">
            <MapPin :size="12" /> {{ event.location }}
          </span>
          <div class="mt-3 flex items-center justify-between">
            <span class="badge" :class="{ 'badge-muted': event.status !== 'active' }">
              {{ statusLabel(event.status) }}
            </span>
            <ChevronRight :size="18" class="text-ink-soft" />
          </div>
        </router-link>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { Plus, Search, MapPin, ChevronRight, Trash2 } from '@lucide/vue'
import api from '@/services/api'
import AppShell from '@/layouts/AppShell.vue'

const events = ref([])
const loadingList = ref(true)
const showForm = ref(false)
const loading = ref(false)
const error = ref('')
const search = ref('')
const filter = ref('all')

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Em andamento' },
  { value: 'finished', label: 'Finalizados' },
]

const form = reactive({
  name: '',
  client_name: '',
  location: '',
  starts_at: '',
})

const statusLabels = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  active: 'Em andamento',
  finished: 'Finalizado',
  canceled: 'Cancelado',
}

function statusLabel(status) {
  return statusLabels[status] || status
}

const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.value.toLowerCase())
    const matchesFilter = filter.value === 'all' || event.status === filter.value
    return matchesSearch && matchesFilter
  })
})

async function loadEvents() {
  loadingList.value = true
  const { data } = await api.get('/events')
  events.value = data.data
  loadingList.value = false
}

async function handleCreate() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/events', form)
    form.name = ''
    form.client_name = ''
    form.location = ''
    form.starts_at = ''
    showForm.value = false
    await loadEvents()
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível salvar o evento.'
  } finally {
    loading.value = false
  }
}

async function handleDelete(event) {
  if (!confirm(`Excluir o evento "${event.name}"?`)) return
  await api.delete(`/events/${event.id}`)
  await loadEvents()
}

onMounted(loadEvents)
</script>
