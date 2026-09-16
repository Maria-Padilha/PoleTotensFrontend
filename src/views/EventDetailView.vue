<template>
  <AppShell>
    <section v-if="event" class="max-w-4xl">
      <router-link
        :to="{ name: 'eventos' }"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft :size="16" /> Voltar para eventos
      </router-link>

      <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex gap-3.5 sm:gap-4">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50
              font-heading text-lg font-bold text-primary-600"
          >
            {{ event.name.charAt(0).toUpperCase() }}
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-xl sm:text-2xl">{{ event.name }}</h1>
              <span class="badge" :class="{ 'badge-muted': event.status !== 'active' }">
                {{ statusLabel(event.status) }}
              </span>
            </div>
            <p class="mt-0.5 text-sm text-ink-muted">
              {{ formatDate(event.starts_at) }} <span v-if="event.slug"> · /{{ event.slug }}</span>
            </p>
          </div>
        </div>
        <button
          class="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-sm
            font-bold text-danger transition-colors hover:bg-danger-tint"
          @click="handleRemoveEvent"
        >
          <Trash2 :size="16" /> Remover evento
        </button>
      </div>

      <nav class="mt-6 flex gap-5 overflow-x-auto border-b border-ink/[0.06] sm:gap-7">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="flex shrink-0 items-center gap-1.5 border-b-2 py-3 text-sm font-bold transition-colors"
          :class="
            tab === t.value
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          "
          @click="tab = t.value"
        >
          <component :is="t.icon" :size="16" />
          {{ t.label }}
        </button>
      </nav>

      <div v-if="tab === 'info'" class="card mt-6">
        <form class="space-y-5" @submit.prevent="handleSave">
          <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div class="field">
              <label for="name">Nome do evento</label>
              <input id="name" v-model="form.name" required />
            </div>
            <div class="field">
              <label for="status">Status</label>
              <select id="status" v-model="form.status">
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="active">Em andamento</option>
                <option value="finished">Finalizado</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>
            <div class="field">
              <label for="client_name">Cliente</label>
              <input id="client_name" v-model="form.client_name" />
            </div>
            <div class="field">
              <label for="location">Local</label>
              <input id="location" v-model="form.location" />
            </div>
            <div class="field">
              <label for="starts_at">Início</label>
              <input id="starts_at" v-model="form.starts_at" type="datetime-local" />
            </div>
            <div class="field">
              <label for="ends_at">Término</label>
              <input id="ends_at" v-model="form.ends_at" type="datetime-local" />
            </div>
          </div>
          <div class="field">
            <label for="description">Descrição</label>
            <textarea id="description" v-model="form.description" rows="3" />
          </div>

          <p v-if="error" class="field-error">{{ error }}</p>

          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </form>
      </div>

      <div v-else-if="tab === 'jogos'" class="mt-6">
        <div v-if="event.totems.length === 0" class="flex flex-col items-center gap-2 rounded-2xl border
          border-dashed border-ink/15 bg-white px-6 py-14 text-center text-ink-muted">
          <Gamepad2 :size="28" />
          <h3 class="mt-1 text-ink">Vincule um totem primeiro</h3>
          <p class="max-w-sm text-sm">
            Jogos são configurados por totem. Vá na aba Totens e vincule ao menos um totem a este evento.
          </p>
        </div>

        <template v-else>
          <div class="flex items-center justify-between">
            <p class="text-sm text-ink-muted">Jogos personalizados disponíveis para este evento.</p>
            <button class="btn-primary shrink-0" @click="openCreateInstance">
              <Plus :size="16" /> Adicionar jogo
            </button>
          </div>

          <GameInstanceForm
            v-if="showInstanceForm && !editingInstance"
            class="mt-4 max-w-2xl"
            :form="instanceForm"
            :totems="event.totems"
            :my-games="myGames"
            :game-def="gameDef"
            :event-id="event.id"
            :game-slug="selectedGameSlug"
            :error="instanceError"
            :saving="savingInstance"
            @save="handleSubmitInstance"
            @cancel="closeInstanceForm"
          />

          <p v-if="!loadingInstances && gameInstances.length === 0" class="mt-6 text-sm text-ink-muted">
            Nenhum jogo adicionado ainda.
          </p>

          <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <template v-for="instance in gameInstances" :key="instance.id">
              <GameInstanceForm
                v-if="editingInstance && editingInstance.id === instance.id"
                class="sm:col-span-2 xl:col-span-3"
                editing
                :form="instanceForm"
                :game-def="gameDef"
                :event-id="event.id"
                :game-slug="selectedGameSlug"
                :error="instanceError"
                :saving="savingInstance"
                :preview-link="previewLinks[instance.id]"
                @save="handleSubmitInstance"
                @cancel="closeInstanceForm"
                @generate-preview="handleGeneratePreview(instance)"
              />
              <div v-else class="card flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Gamepad2 :size="18" />
                  </span>
                  <div class="flex items-center gap-1">
                    <button
                      class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft
                        transition-colors hover:!bg-primary-50 hover:!text-primary-600"
                      title="Editar"
                      @click="openEditInstance(instance)"
                    >
                      <Pencil :size="14" />
                    </button>
                    <button
                      class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft
                        transition-colors hover:!bg-danger-tint hover:!text-danger"
                      title="Excluir"
                      @click="handleDeleteInstance(instance)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
                <h3 class="text-base font-bold text-ink">
                  <HighlightedText :text="instance.title" :color="instance.config?.primary_color" />
                </h3>
                <p class="text-xs text-ink-muted">{{ instance.game?.name }} · {{ instance.totem?.name }}</p>

                <span v-if="instance.approved_at" class="badge w-fit !bg-green-50 !text-green-700">
                  <Check :size="12" /> Aprovado pelo cliente
                </span>

                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <button class="btn-outline !px-3.5 !py-1.5 text-xs" @click="handleGeneratePreview(instance)">
                    <Link2 :size="13" /> Gerar link de preview
                  </button>
                </div>
                <a
                  v-if="previewLinks[instance.id]"
                  :href="previewLinks[instance.id]"
                  target="_blank"
                  rel="noopener"
                  class="mt-1 block break-all rounded-lg bg-primary-50 p-2 text-xs font-semibold text-primary-600
                    hover:underline"
                >
                  {{ previewLinks[instance.id] }}
                </a>
              </div>
            </template>
          </div>
        </template>
      </div>

      <div v-else-if="tab === 'totens'" class="card mt-6">
        <div class="flex flex-col gap-3 sm:flex-row">
          <select v-model="totemToLink" class="w-full sm:flex-1">
            <option value="">Selecione um totem disponível...</option>
            <option v-for="totem in availableTotems" :key="totem.id" :value="totem.id">
              {{ totem.name }}
            </option>
          </select>
          <button
            class="btn-primary shrink-0"
            :disabled="!totemToLink || linking"
            @click="handleLinkTotem"
          >
            {{ linking ? 'Vinculando...' : 'Vincular totem' }}
          </button>
        </div>

        <p v-if="event.totems.length === 0" class="mt-6 text-sm text-ink-muted">
          Nenhum totem vinculado a este evento ainda.
        </p>

        <ul v-else class="mt-6 flex flex-col gap-3">
          <li
            v-for="totem in event.totems"
            :key="totem.id"
            class="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 px-4 py-3"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Monitor :size="16" />
            </span>
            <div class="flex flex-1 flex-col">
              <strong class="text-sm text-ink">{{ totem.name }}</strong>
              <small class="font-mono text-xs text-ink-soft">{{ totem.slug }}</small>
            </div>
            <span class="badge">{{ pivotStatusLabel(totem.event_totem?.status) }}</span>
            <button class="btn-outline" @click="handleUnlinkTotem(totem)">Desvincular</button>
          </li>
        </ul>
      </div>

      <div v-else-if="tab === 'midia'" class="mt-6 flex flex-col items-center gap-2 rounded-2xl border
        border-dashed border-ink/15 bg-white px-6 py-14 text-center text-ink-muted">
        <ImageIcon :size="28" />
        <h3 class="mt-1 text-ink">Nenhuma mídia disponível ainda</h3>
        <p class="max-w-sm text-sm">
          O recap e outros materiais do evento vão aparecer aqui quando estiverem prontos.
        </p>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Trash2,
  Info,
  Gamepad2,
  Monitor,
  Image as ImageIcon,
  Plus,
  Pencil,
  Link2,
  Check,
} from '@lucide/vue'
import api from '@/services/api'
import AppShell from '@/layouts/AppShell.vue'
import { getGameDefinition } from '@/games/registry'
import HighlightedText from '@/components/HighlightedText.vue'
import GameInstanceForm from '@/components/GameInstanceForm.vue'

const route = useRoute()
const router = useRouter()

const event = ref(null)
const allTotems = ref([])
const tab = ref('info')
const saving = ref(false)
const linking = ref(false)
const error = ref('')
const totemToLink = ref('')

const gameInstances = ref([])
const myGames = ref([])
const loadingInstances = ref(false)
const showInstanceForm = ref(false)
const editingInstance = ref(null)
const savingInstance = ref(false)
const instanceError = ref('')
const previewLinks = reactive({})

function defaultInstanceConfig() {
  return {
    theme: 'claro',
    primary_color: '#10939b',
    background_url: '',
    logo_url: '',
    icon: '',
    headline: '',
    subtitle: '',
    start_button_text: '',
    start_hint: '',
    timer_seconds: null,
    points_per_question: 10,
    win_threshold: 60,
    win_message: '',
    lose_message: '',
    sound_enabled: true,
    questions: [],
  }
}

const instanceForm = reactive({
  totem_id: '',
  user_game_id: '',
  title: '',
  config: defaultInstanceConfig(),
})

const tabs = [
  { value: 'info', label: 'Informações', icon: Info },
  { value: 'jogos', label: 'Jogos', icon: Gamepad2 },
  { value: 'totens', label: 'Totens', icon: Monitor },
  { value: 'midia', label: 'Mídia', icon: ImageIcon },
]

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

function pivotStatusLabel(status) {
  return { pending: 'Pendente', active: 'Ativo', finished: 'Finalizado' }[status] || status
}

function formatDate(value) {
  if (!value) return 'Sem data definida'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const form = reactive({
  name: '',
  status: 'draft',
  client_name: '',
  location: '',
  starts_at: '',
  ends_at: '',
  description: '',
})

const availableTotems = computed(() => {
  const linkedIds = new Set((event.value?.totems || []).map((t) => t.id))
  return allTotems.value.filter((t) => !linkedIds.has(t.id))
})

const selectedGameSlug = computed(() => {
  if (editingInstance.value) return editingInstance.value.game?.slug
  const ug = myGames.value.find((g) => g.id === instanceForm.user_game_id)
  return ug?.game?.slug
})

const gameDef = computed(() => getGameDefinition(selectedGameSlug.value))

function fillForm() {
  form.name = event.value.name
  form.status = event.value.status
  form.client_name = event.value.client_name || ''
  form.location = event.value.location || ''
  form.starts_at = event.value.starts_at ? event.value.starts_at.slice(0, 16) : ''
  form.ends_at = event.value.ends_at ? event.value.ends_at.slice(0, 16) : ''
  form.description = event.value.description || ''
}

async function loadEvent() {
  const { data } = await api.get(`/events/${route.params.id}`)
  event.value = data.data
  fillForm()
}

async function loadTotems() {
  const { data } = await api.get('/totems')
  allTotems.value = data.data
}

async function handleSave() {
  error.value = ''
  saving.value = true
  try {
    await api.put(`/events/${route.params.id}`, form)
    await loadEvent()
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível salvar as alterações.'
  } finally {
    saving.value = false
  }
}

async function handleRemoveEvent() {
  if (!confirm(`Remover o evento "${event.value.name}"? Essa ação não pode ser desfeita.`)) return
  await api.delete(`/events/${route.params.id}`)
  router.push({ name: 'eventos' })
}

async function handleLinkTotem() {
  linking.value = true
  try {
    await api.post(`/events/${route.params.id}/totems`, { totem_id: totemToLink.value })
    totemToLink.value = ''
    await loadEvent()
    await loadGameInstances()
  } finally {
    linking.value = false
  }
}

async function handleUnlinkTotem(totem) {
  await api.delete(`/events/${route.params.id}/totems/${totem.id}`)
  await loadEvent()
  await loadGameInstances()
}

async function loadMyGames() {
  const { data } = await api.get('/my-games')
  myGames.value = data.data
}

async function loadGameInstances() {
  if (!event.value || event.value.totems.length === 0) {
    gameInstances.value = []
    return
  }

  loadingInstances.value = true
  const results = await Promise.all(
    event.value.totems.map((totem) =>
      api.get(`/events/${route.params.id}/totems/${totem.id}/games`).then((res) => res.data.data)
    )
  )
  gameInstances.value = results.flat()
  loadingInstances.value = false
}

function resetInstanceForm() {
  instanceForm.totem_id = event.value.totems.length === 1 ? event.value.totems[0].id : ''
  instanceForm.user_game_id = ''
  instanceForm.title = ''
  instanceForm.config = defaultInstanceConfig()
}

function openCreateInstance() {
  editingInstance.value = null
  instanceError.value = ''
  resetInstanceForm()
  showInstanceForm.value = true
}

function openEditInstance(instance) {
  editingInstance.value = instance
  instanceError.value = ''
  instanceForm.title = instance.title
  instanceForm.config = {
    ...defaultInstanceConfig(),
    ...instance.config,
  }
  showInstanceForm.value = true
}

function closeInstanceForm() {
  showInstanceForm.value = false
  editingInstance.value = null
}

async function handleSubmitInstance({ close = true } = {}) {
  instanceError.value = ''
  savingInstance.value = true
  try {
    if (editingInstance.value) {
      const { data } = await api.put(`/game-instances/${editingInstance.value.id}`, {
        title: instanceForm.title,
        config: instanceForm.config,
      })
      // atualiza o registro em memória (mantém o form aberto no lugar certo
      // do grid quando "Aplicar alterações" é usado, em vez de fechar tudo)
      editingInstance.value = data.data
    } else {
      await api.post(`/events/${route.params.id}/totems/${instanceForm.totem_id}/games`, {
        user_game_id: instanceForm.user_game_id,
        title: instanceForm.title,
        config: instanceForm.config,
      })
    }
    await loadGameInstances()
    if (close) closeInstanceForm()
  } catch (err) {
    instanceError.value = err.response?.data?.message || 'Não foi possível salvar o jogo.'
  } finally {
    savingInstance.value = false
  }
}

async function handleDeleteInstance(instance) {
  if (!confirm(`Excluir o jogo "${instance.title}"?`)) return
  await api.delete(`/game-instances/${instance.id}`)
  await loadGameInstances()
}

async function handleGeneratePreview(instance) {
  const { data } = await api.post(`/game-instances/${instance.id}/preview`)
  previewLinks[instance.id] = `${window.location.origin}${data.preview_path}`
}

onMounted(async () => {
  await Promise.all([loadEvent(), loadTotems(), loadMyGames()])
  await loadGameInstances()
})
</script>
