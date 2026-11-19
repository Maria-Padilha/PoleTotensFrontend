<template>
  <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
    <form class="card space-y-7" @submit.prevent="save">
      <div>
        <h3 class="text-base font-bold text-ink">Aparência da tela inicial do totem</h3>
        <p class="mt-1 text-sm text-ink-muted">
          Personalize a tela onde o convidado escolhe o jogo. A prévia ao lado mostra o resultado na hora.
        </p>
      </div>

      <!-- fundo e logo -->
      <section class="space-y-4">
        <h4 class="text-sm font-extrabold uppercase tracking-wider text-primary-600">Fundo e logo</h4>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImageUploadField
            v-model="form.background_url"
            label="Imagem de fundo"
            :event-id="event.id"
            game-slug="evento"
            folder="fundo-totem"
          />
          <ImageUploadField
            v-model="form.logo_url"
            label="Logo do evento (opcional)"
            :event-id="event.id"
            game-slug="evento"
            folder="logo-totem"
          />
        </div>

        <div v-if="form.background_url" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="field">
            <label for="ap-overlay">Escurecimento da imagem: {{ form.overlay_opacity }}%</label>
            <input id="ap-overlay" v-model.number="form.overlay_opacity" type="range" min="0" max="90" step="5" class="!p-0" />
            <p class="text-xs text-ink-muted">Quanto maior, mais legível o texto fica sobre fotos claras ou movimentadas.</p>
          </div>
          <div class="field">
            <label>Tom da cortina</label>
            <div class="flex gap-2">
              <button
                v-for="tone in tones"
                :key="tone.value"
                type="button"
                class="flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors"
                :class="form.overlay_tone === tone.value ? 'border-primary bg-primary-50 text-primary-700' : 'border-ink/10 text-ink-muted hover:border-primary'"
                @click="form.overlay_tone = tone.value"
              >
                {{ tone.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- título -->
      <section class="space-y-4">
        <h4 class="text-sm font-extrabold uppercase tracking-wider text-primary-600">Título (nome do evento)</h4>
        <TypographyGroup
          :model-value="form"
          prefix="title"
          default-font="Playfair Display"
          :reset-spacing="DEFAULT_APPEARANCE.title_spacing"
          :color-fallback="preview.titleColor.startsWith('#') ? preview.titleColor : '#ffffff'"
          @update:model-value="Object.assign(form, $event)"
        />
        <div class="field">
          <label for="ap-title-size">Tamanho do título: {{ form.title_size }}%</label>
          <input id="ap-title-size" v-model.number="form.title_size" type="range" min="50" max="250" step="5" class="!p-0" />
          <div class="flex justify-between text-xs text-ink-muted">
            <span>Menor</span>
            <button type="button" class="font-bold text-primary-600 hover:underline" @click="form.title_size = DEFAULT_APPEARANCE.title_size">Padrão (100%)</button>
            <span>Maior</span>
          </div>
        </div>
      </section>

      <!-- textos -->
      <section class="space-y-4">
        <h4 class="text-sm font-extrabold uppercase tracking-wider text-primary-600">Textos e nomes dos jogos</h4>
        <div class="field">
          <label for="ap-welcome">Frase de boas-vindas</label>
          <input id="ap-welcome" v-model="form.welcome_text" type="text" maxlength="120" placeholder="Escolha um jogo pra começar" />
        </div>
        <TypographyGroup
          :model-value="form"
          prefix="text"
          default-font="Roboto"
          :reset-spacing="DEFAULT_APPEARANCE.text_spacing"
          color-fallback="#555a5a"
          @update:model-value="Object.assign(form, $event)"
        />
      </section>

      <!-- destaque e cartões -->
      <section class="space-y-4">
        <h4 class="text-sm font-extrabold uppercase tracking-wider text-primary-600">Cartões e destaque</h4>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField v-model="form.accent_color" label="Cor de destaque (botões e detalhes)" fallback="#10939b" :allow-auto="false" />
          <div class="field">
            <label>Estilo dos cartões de jogo</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="style in cardStyles"
                :key="style.value"
                type="button"
                class="rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors"
                :class="form.card_style === style.value ? 'border-primary bg-primary-50 text-primary-700' : 'border-ink/10 text-ink-muted hover:border-primary'"
                @click="form.card_style = style.value"
              >
                {{ style.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- visual da lista de jogos -->
      <section class="space-y-5">
        <h4 class="text-sm font-extrabold uppercase tracking-wider text-primary-600">Lista de jogos: layout e tamanhos</h4>

        <div class="field">
          <label>Layout dos jogos</label>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button
              v-for="option in layouts"
              :key="option.value"
              type="button"
              class="rounded-xl border px-3 py-2.5 text-left transition-colors"
              :class="form.games_layout === option.value ? 'border-primary bg-primary-50 text-primary-700' : 'border-ink/10 text-ink-muted hover:border-primary'"
              @click="form.games_layout = option.value"
            >
              <span class="block text-sm font-bold">{{ option.label }}</span>
              <span class="block text-[11px] font-normal leading-tight opacity-80">{{ option.hint }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="field">
            <label for="ap-icon-size">Tamanho do ícone: {{ form.icon_size }}%</label>
            <input id="ap-icon-size" v-model.number="form.icon_size" type="range" min="60" max="180" step="5" class="!p-0" />
          </div>
          <div class="field">
            <label for="ap-name-size">Tamanho do nome do jogo: {{ form.game_name_size }}%</label>
            <input id="ap-name-size" v-model.number="form.game_name_size" type="range" min="60" max="180" step="5" class="!p-0" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="field">
            <label>Cantos dos cartões</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="option in radii"
                :key="option.value"
                type="button"
                class="rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors"
                :class="form.card_radius === option.value ? 'border-primary bg-primary-50 text-primary-700' : 'border-ink/10 text-ink-muted hover:border-primary'"
                @click="form.card_radius = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>Etiqueta com o tipo do jogo</label>
            <label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm">
              <input v-model="form.show_game_type" type="checkbox" class="h-4 w-4 accent-primary" />
              <span>Mostrar (ex.: "JOGO DA MEMÓRIA" embaixo do nome)</span>
            </label>
          </div>
        </div>
      </section>

      <!-- efeitos -->
      <section class="space-y-4">
        <h4 class="text-sm font-extrabold uppercase tracking-wider text-primary-600">Efeitos e animações</h4>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="fx in effects"
            :key="fx.key"
            class="flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors"
            :class="form[fx.key] ? 'border-primary bg-primary-50' : 'border-ink/10'"
          >
            <input v-model="form[fx.key]" type="checkbox" class="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
            <span>
              <strong class="block text-ink">{{ fx.label }}</strong>
              <span class="text-xs text-ink-muted">{{ fx.hint }}</span>
            </span>
          </label>
        </div>

        <div class="field">
          <label>Partículas no fundo</label>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              v-for="option in particleOptions"
              :key="option.value"
              type="button"
              class="rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors"
              :class="form.fx_particles === option.value ? 'border-primary bg-primary-50 text-primary-700' : 'border-ink/10 text-ink-muted hover:border-primary'"
              @click="form.fx_particles = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- replicar nos jogos -->
      <section class="space-y-3 rounded-xl border border-ink/10 bg-app-bg p-4">
        <h4 class="text-sm font-extrabold uppercase tracking-wider text-primary-600">Aplicar também nos jogos?</h4>
        <label class="flex cursor-pointer items-start gap-3 text-sm">
          <input v-model="replicate" type="radio" :value="false" class="mt-1 h-4 w-4 accent-primary" />
          <span><strong class="text-ink">Só na tela inicial do totem.</strong> Cada jogo mantém o próprio visual.</span>
        </label>
        <label class="flex items-start gap-3 text-sm" :class="instances.length ? 'cursor-pointer' : 'opacity-50'">
          <input v-model="replicate" type="radio" :value="true" :disabled="!instances.length" class="mt-1 h-4 w-4 accent-primary" />
          <span>
            <strong class="text-ink">Também em todos os jogos deste evento</strong>
            <template v-if="instances.length"> ({{ instances.length }} {{ instances.length === 1 ? 'jogo' : 'jogos' }})</template>
            <template v-else> — adicione jogos na aba Jogos primeiro</template>.
            <span class="mt-1 block text-xs text-ink-muted">
              Copia fontes, grossura, cores, espaçamento, cor de destaque, imagem de fundo e logo para cada jogo,
              substituindo o que estiver configurado neles. Depois você ainda pode ajustar cada jogo individualmente.
            </span>
          </span>
        </label>
      </section>

      <p v-if="error" class="field-error">{{ error }}</p>
      <p v-if="saved" class="text-sm font-bold text-primary-600">{{ savedMessage }}</p>

      <div class="flex flex-wrap justify-end gap-3">
        <button type="button" class="btn-outline" @click="reset">Restaurar padrão</button>
        <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Salvando...' : replicate ? 'Salvar e aplicar nos jogos' : 'Salvar aparência' }}</button>
      </div>
    </form>

    <!-- prévia: a tela de verdade, desenhada no tamanho de um totem e reduzida -->
    <aside class="xl:sticky xl:top-4 xl:self-start">
      <p class="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">Prévia no totem</p>
      <div class="mx-auto w-full max-w-[340px] rounded-[2rem] bg-ink p-2.5 shadow-xl">
        <div ref="screen" class="relative overflow-hidden rounded-[1.5rem]" :style="{ height: `${STAGE_H * scale}px` }">
          <div class="absolute left-0 top-0 origin-top-left" :style="{ width: `${STAGE_W}px`, height: `${STAGE_H}px`, transform: `scale(${scale})` }">
            <EventWelcome
              v-if="scale > 0"
              :event-name="event.name"
              :games="previewGames"
              :appearance="form"
              preview
            />
          </div>
        </div>
      </div>
      <p class="mt-3 text-center text-xs text-ink-soft">
        {{ games.length ? 'Com os jogos deste evento.' : 'Jogos de exemplo — adicione os jogos do evento na aba Jogos.' }}
      </p>
    </aside>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import ImageUploadField from '@/components/ImageUploadField.vue'
import TypographyGroup from '@/components/TypographyGroup.vue'
import EventWelcome from '@/components/EventWelcome.vue'
import ColorField from '@/components/ColorField.vue'
import { DEFAULT_APPEARANCE, weightsFor, loadFont, resolveAppearance, gameConfigFromAppearance } from '@/utils/appearance'

const props = defineProps({
  event: { type: Object, required: true },
  // jogos (instâncias) do evento, só pra montar a prévia
  games: { type: Array, default: () => [] },
  // instâncias de jogo do evento (com config), pra replicar a aparência nelas
  instances: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved'])

const STAGE_W = 1080
const STAGE_H = 1920

const tones = [
  { value: 'dark', label: 'Escura' },
  { value: 'light', label: 'Clara' },
]
const cardStyles = [
  { value: 'auto', label: 'Automático' },
  { value: 'glass', label: 'Vidro' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'fun', label: '🎮 Divertido (colorido)' },
  { value: 'gradient', label: '🌈 Degradê da cor de destaque' },
  { value: 'neon', label: '✨ Neon (borda brilhante)' },
]
const layouts = [
  { value: 'auto', label: 'Automático', hint: 'Lista até 4 jogos, grade acima disso' },
  { value: 'list', label: 'Lista', hint: 'Um jogo por linha' },
  { value: 'grid2', label: 'Grade 2 colunas', hint: 'Cartões lado a lado' },
  { value: 'grid3', label: 'Grade 3 colunas', hint: 'Ideal para muitos jogos' },
  { value: 'poster', label: 'Pôster', hint: 'Cartões grandes com ícone enorme' },
]
const radii = [
  { value: 'round', label: 'Redondos' },
  { value: 'soft', label: 'Suaves' },
  { value: 'square', label: 'Retos' },
]
const effects = [
  { key: 'title_glow', label: 'Título brilhando', hint: 'Brilho na cor de destaque em volta do nome do evento' },
  { key: 'fx_float', label: 'Cartões flutuando', hint: 'Os cartões balançam de leve, chamando atenção' },
  { key: 'fx_shine', label: 'Brilho passando', hint: 'Um reflexo de luz atravessa os cartões' },
  { key: 'fx_glow', label: 'Ícones pulsando', hint: 'Anel pulsante no ícone e no botão de jogar' },
]
const particleOptions = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'bubbles', label: '🫧 Bolhas' },
  { value: 'stars', label: '✦ Estrelas' },
  { value: 'confetti', label: '🎉 Confete' },
]

const form = reactive({ ...DEFAULT_APPEARANCE })
const saving = ref(false)
const saved = ref(false)
const savedMessage = ref('')
const replicate = ref(false)
const error = ref('')

function fill() {
  Object.assign(form, DEFAULT_APPEARANCE)
  for (const [key, value] of Object.entries(props.event.appearance || {})) {
    if (value !== null && value !== undefined) form[key] = value
  }
}
fill()

const preview = computed(() => resolveAppearance(form))

watch(
  () => [form.title_font, form.text_font],
  (fonts) => fonts.forEach(loadFont),
  { immediate: true }
)

// ao trocar de fonte, o peso escolhido pode não existir nela: ajusta pro mais próximo
watch(
  () => form.title_font,
  (font) => {
    if (!weightsFor(font).includes(form.title_weight)) form.title_weight = preview.value.title_weight
  }
)
watch(
  () => form.text_font,
  (font) => {
    if (!weightsFor(font).includes(form.text_weight)) form.text_weight = preview.value.text_weight
  }
)

const SAMPLE_GAMES = [
  { id: 's1', title: 'Quiz do evento', config: {}, game: { name: 'Quiz', slug: 'quiz' } },
  { id: 's2', title: 'Roleta de brindes', config: {}, game: { name: 'Roleta', slug: 'roleta-de-brindes' } },
  { id: 's3', title: 'Karaokê', config: {}, game: { name: 'Karaokê', slug: 'karaoke' } },
]
const previewGames = computed(() => (props.games.length ? props.games : SAMPLE_GAMES))

async function save() {
  error.value = ''
  saved.value = false
  saving.value = true
  try {
    await api.put(`/events/${props.event.id}`, { appearance: { ...form } })

    // replicar: mescla a aparência na config de cada jogo (a atualização do jogo
    // substitui o config inteiro, então parte do que ele já tem)
    if (replicate.value && props.instances.length) {
      const patch = gameConfigFromAppearance(form)
      await Promise.all(
        props.instances.map((instance) =>
          api.put(`/game-instances/${instance.id}`, { config: { ...(instance.config || {}), ...patch } })
        )
      )
      savedMessage.value = `Aparência salva e aplicada em ${props.instances.length} ${props.instances.length === 1 ? 'jogo' : 'jogos'}.`
    } else {
      savedMessage.value = 'Aparência salva! O totem já usa o novo visual.'
    }
    saved.value = true
    emit('saved', { replicated: replicate.value })
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível salvar a aparência.'
  } finally {
    saving.value = false
  }
}

function reset() {
  if (!confirm('Voltar a aparência da tela inicial para o padrão?')) return
  Object.assign(form, DEFAULT_APPEARANCE)
  saved.value = false
}

// escala da prévia (a tela é desenhada em 1080x1920 e reduzida pra caber)
const screen = ref(null)
const scale = ref(0)
let observer = null
let frameId = null

function updateScale() {
  cancelAnimationFrame(frameId)
  frameId = requestAnimationFrame(() => {
    if (screen.value) scale.value = screen.value.clientWidth / STAGE_W
  })
}

onMounted(() => {
  updateScale()
  observer = new ResizeObserver(updateScale)
  observer.observe(screen.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frameId)
})
</script>
