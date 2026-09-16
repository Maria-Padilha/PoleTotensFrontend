<template>
  <div class="card space-y-5">
    <h3 class="text-lg">{{ editing ? 'Editar jogo' : 'Adicionar jogo' }}</h3>
    <form class="space-y-5" @submit.prevent="$emit('save', { close: true })">
      <div v-if="!editing" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="field">
          <label for="instance_totem">Totem</label>
          <select id="instance_totem" v-model="form.totem_id" required>
            <option value="" disabled>Selecione...</option>
            <option v-for="totem in totems" :key="totem.id" :value="totem.id">
              {{ totem.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="instance_game">Jogo (da sua biblioteca)</label>
          <select id="instance_game" v-model="form.user_game_id" required>
            <option value="" disabled>Selecione...</option>
            <option v-for="ug in myGames" :key="ug.id" :value="ug.id">
              {{ ug.game.name }}
            </option>
          </select>
        </div>
      </div>

      <HighlightPicker
        id="instance_title"
        v-model="form.title"
        label="Título"
        placeholder="Quiz de Casamento"
        :color="form.config.primary_color"
        required
      />
      <HighlightPicker
        id="instance_headline"
        v-model="form.config.headline"
        label="Subtítulo (opcional)"
        placeholder="Maria e Lucas"
        :color="form.config.primary_color"
      />
      <HighlightPicker
        id="instance_subtitle"
        v-model="form.config.subtitle"
        label="Subtítulo 2 (opcional)"
        placeholder="Descubra o quanto você conhece os noivos!"
        :color="form.config.primary_color"
      />
      <HighlightPicker
        id="instance_start_button_text"
        v-model="form.config.start_button_text"
        label="Texto do botão de início (opcional)"
        placeholder="Toque para começar"
        :color="form.config.primary_color"
      />
      <HighlightPicker
        id="instance_start_hint"
        v-model="form.config.start_hint"
        label="Texto de ajuda na tela inicial (opcional)"
        placeholder="Responda e veja sua pontuação no final"
        :color="form.config.primary_color"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="field">
          <label for="instance_theme">Tema</label>
          <select id="instance_theme" v-model="form.config.theme">
            <option value="claro">Claro</option>
            <option value="escuro">Escuro</option>
          </select>
        </div>
        <div class="field">
          <label for="instance_color">Cor de destaque</label>
          <input id="instance_color" v-model="form.config.primary_color" type="color" class="h-[42px]" />
        </div>
        <div class="field">
          <label for="instance_timer">Cronômetro (segundos por pergunta)</label>
          <input id="instance_timer" v-model.number="form.config.timer_seconds" type="number" min="0" />
        </div>
        <div class="field">
          <label for="instance_points">Pontos por pergunta</label>
          <input id="instance_points" v-model.number="form.config.points_per_question" type="number" min="1" />
        </div>
        <div class="field">
          <label for="instance_threshold">% de acerto pra "vitória"</label>
          <input
            id="instance_threshold"
            v-model.number="form.config.win_threshold"
            type="number"
            min="0"
            max="100"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ImageUploadField
          v-model="form.config.background_url"
          label="Imagem de fundo"
          :event-id="eventId"
          :game-slug="gameSlug"
          folder="fundo"
        />
        <ImageUploadField
          v-model="form.config.logo_url"
          label="Logo do evento"
          :event-id="eventId"
          :game-slug="gameSlug"
          folder="logo"
        />
      </div>

      <IconPicker
        v-if="!form.config.logo_url"
        v-model="form.config.icon"
        label="Ícone da tela inicial (se não tiver logo)"
      />

      <HighlightPicker
        id="instance_win"
        v-model="form.config.win_message"
        label="Mensagem de vitória"
        placeholder="Mandou muito bem, parabéns!"
        :color="form.config.primary_color"
      />
      <HighlightPicker
        id="instance_lose"
        v-model="form.config.lose_message"
        label="Mensagem de derrota"
        placeholder="Quase lá! Bora tentar de novo?"
        :color="form.config.primary_color"
      />

      <label class="flex items-center gap-2 text-sm font-bold text-ink">
        <input v-model="form.config.sound_enabled" type="checkbox" class="h-4 w-4 accent-primary" />
        Sons ativados (cronômetro, acerto e erro)
      </label>

      <component
        :is="gameDef.editor"
        v-if="gameDef"
        v-model="form.config[gameDef.editorField]"
        :event-id="eventId"
        :color="form.config.primary_color"
      />

      <div v-if="editing" class="field">
        <label>Link de preview</label>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn-outline !px-3.5 !py-1.5 text-xs" @click="$emit('generate-preview')">
            <Link2 :size="13" /> {{ previewLink ? 'Gerar novo link' : 'Gerar link de preview' }}
          </button>
        </div>
        <a
          v-if="previewLink"
          :href="previewLink"
          target="_blank"
          rel="noopener"
          class="mt-1 block break-all rounded-lg bg-primary-50 p-2 text-xs font-semibold text-primary-600
            hover:underline"
        >
          {{ previewLink }}
        </a>
      </div>

      <p v-if="error" class="field-error">{{ error }}</p>

      <div class="flex flex-wrap justify-end gap-3">
        <button type="button" class="btn-outline" @click="$emit('cancel')">Cancelar</button>
        <button
          v-if="editing"
          type="button"
          class="btn-outline"
          :disabled="saving"
          @click="$emit('save', { close: false })"
        >
          {{ saving ? 'Aplicando...' : 'Aplicar alterações' }}
        </button>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Salvando...' : 'Salvar jogo' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { Link2 } from '@lucide/vue'
import HighlightPicker from '@/components/HighlightPicker.vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import IconPicker from '@/components/IconPicker.vue'

defineProps({
  form: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  totems: { type: Array, default: () => [] },
  myGames: { type: Array, default: () => [] },
  gameDef: { type: Object, default: null },
  eventId: { type: [Number, String], required: true },
  gameSlug: { type: String, default: '' },
  error: { type: String, default: '' },
  saving: { type: Boolean, default: false },
  previewLink: { type: String, default: '' },
})

defineEmits(['save', 'cancel', 'generate-preview'])
</script>
