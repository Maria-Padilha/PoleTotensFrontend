<template>
  <AppShell>
    <section>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl">Totens</h1>
          <p class="mt-1 text-sm text-ink-muted">Gerencie os totens físicos e onde eles estão instalados.</p>
        </div>
        <button class="btn-primary shrink-0" @click="openCreateForm">
          <Plus :size="16" /> Novo totem
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

      <div v-if="showForm" class="card mt-6 max-w-md">
        <h3 class="mb-4 text-lg">{{ editingTotem ? 'Editar totem' : 'Novo totem' }}</h3>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="field">
            <label for="name">Nome do totem</label>
            <input id="name" v-model="form.name" required placeholder="Totem Entrada Principal" />
          </div>
          <div class="field">
            <label for="location">Local (opcional)</label>
            <input id="location" v-model="form.location" placeholder="Hall de entrada" />
          </div>
          <div class="field">
            <label for="password">{{ editingTotem ? 'Nova senha (opcional)' : 'Senha do totem' }}</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              :required="!editingTotem"
              minlength="4"
              placeholder="Usada no login do app do totem"
            />
          </div>

          <p v-if="error" class="field-error">{{ error }}</p>

          <div class="flex justify-end gap-3 pt-1">
            <button type="button" class="btn-outline" @click="closeForm">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Salvando...' : 'Salvar totem' }}
            </button>
          </div>
        </form>
      </div>

      <p v-if="!loadingList && filteredTotems.length === 0" class="mt-8 text-sm text-ink-muted">
        Nenhum totem encontrado.
      </p>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <button
          v-for="totem in filteredTotems"
          :key="totem.id"
          class="card flex flex-col items-stretch gap-1 text-left transition-shadow hover:shadow-md
            hover:shadow-ink/[0.06]"
          @click="openEditForm(totem)"
        >
          <div class="mb-1 flex items-center justify-between">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Monitor :size="18" />
            </span>
            <span
              title="Excluir"
              class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors
                hover:!bg-danger-tint hover:!text-danger"
              @click.stop="handleDelete(totem)"
            >
              <Trash2 :size="15" />
            </span>
          </div>
          <h3 class="text-base font-bold text-ink">{{ totem.name }}</h3>
          <span class="font-mono text-xs text-ink-soft">{{ totem.slug }}</span>
          <span v-if="totem.location" class="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted">
            <MapPin :size="12" /> {{ totem.location }}
          </span>
          <div class="mt-3 flex items-center justify-between">
            <span class="badge" :class="{ 'badge-muted': totem.status !== 'active' }">
              {{ totem.status === 'active' ? 'Ativo' : 'Inativo' }}
            </span>
            <ChevronRight :size="18" class="text-ink-soft" />
          </div>
        </button>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { Plus, Search, Monitor, MapPin, ChevronRight, Trash2 } from '@lucide/vue'
import api from '@/services/api'
import AppShell from '@/layouts/AppShell.vue'

const totems = ref([])
const loadingList = ref(true)
const showForm = ref(false)
const loading = ref(false)
const error = ref('')
const search = ref('')
const filter = ref('all')
const editingTotem = ref(null)

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

const form = reactive({
  name: '',
  location: '',
  password: '',
})

const filteredTotems = computed(() => {
  return totems.value.filter((totem) => {
    const matchesSearch = totem.name.toLowerCase().includes(search.value.toLowerCase())
    const matchesFilter = filter.value === 'all' || totem.status === filter.value
    return matchesSearch && matchesFilter
  })
})

async function loadTotems() {
  loadingList.value = true
  const { data } = await api.get('/totems')
  totems.value = data.data
  loadingList.value = false
}

function openCreateForm() {
  editingTotem.value = null
  form.name = ''
  form.location = ''
  form.password = ''
  error.value = ''
  showForm.value = true
}

function openEditForm(totem) {
  editingTotem.value = totem
  form.name = totem.name
  form.location = totem.location || ''
  form.password = ''
  error.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTotem.value = null
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (editingTotem.value) {
      await api.put(`/totems/${editingTotem.value.id}`, form)
    } else {
      await api.post('/totems', form)
    }
    closeForm()
    await loadTotems()
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível salvar o totem.'
  } finally {
    loading.value = false
  }
}

async function handleDelete(totem) {
  if (!confirm(`Excluir o totem "${totem.name}"?`)) return
  await api.delete(`/totems/${totem.id}`)
  await loadTotems()
}

onMounted(loadTotems)
</script>
