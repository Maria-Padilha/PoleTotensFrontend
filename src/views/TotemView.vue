<template>
  <div class="relative min-h-screen overflow-hidden" :style="rootBgStyle" @pointerdown="handleRootTap">
    <!-- botão invisível: 6 toques seguidos aqui voltam pra escolha de evento
         (saída de emergência caso o totem tenha ficado preso num evento errado) -->
    <button
      type="button"
      class="fixed left-0 top-0 z-[60] h-16 w-16 opacity-0 cursor-pointer"
      aria-hidden="true"
      tabindex="-1"
      @click="handleSecretTap"
    />

    <div v-if="loading" class="flex min-h-screen items-center justify-center text-ink-muted">Carregando...</div>

    <div v-else-if="errorMsg" class="flex min-h-screen items-center justify-center p-6 text-center">
      <div class="card max-w-sm">
        <h1 class="font-elegant text-3xl font-bold">Ops</h1>
        <p class="mt-2 text-ink-muted">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- modo atração/ranking manual: fotos e ranking em tela cheia -->
    <div v-else-if="attractMode" class="fixed inset-0 z-10 overflow-hidden bg-ink">
      <button
        v-if="manualRankingView"
        type="button"
        class="fixed right-6 top-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-black/40
          text-white backdrop-blur transition-colors hover:bg-black/60"
        @click="exitAttract"
      >
        <X :size="26" />
      </button>

      <template v-if="currentAttractSlide">
        <!-- tem foto salva: ocupa a tela quase inteira, com o nome/ranking por cima -->
        <div v-if="currentAttractSlide.photoUrl" class="relative flex h-full w-full items-end justify-center">
          <img :src="currentAttractSlide.photoUrl" alt="" class="absolute inset-0 h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />
          <div class="relative z-10 flex w-full flex-col items-center px-6 pb-24 pt-10 text-center">
            <span
              v-if="currentAttractSlide.position"
              class="mb-5 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white
                shadow-xl sm:h-24 sm:w-24 sm:text-4xl"
              :style="{ backgroundColor: attractPositionColor(currentAttractSlide.position) }"
            >
              {{ currentAttractSlide.position }}º
            </span>
            <p class="font-elegant text-6xl font-bold leading-none text-white drop-shadow-lg sm:text-8xl">
              {{ currentAttractSlide.name }}
            </p>
            <p class="mt-5 text-2xl font-bold uppercase tracking-[0.25em] text-white/85 sm:text-3xl">
              {{ currentAttractSlide.label }}
              <template v-if="currentAttractSlide.score != null"> · {{ currentAttractSlide.score }} pts</template>
            </p>
          </div>
        </div>

        <!-- sem foto: ranking bem grande em tela cheia -->
        <div v-else class="relative flex h-full w-full flex-col items-center justify-center px-6 text-center" :style="attractRankBg">
          <p class="text-xl font-bold uppercase tracking-[0.4em] text-white/70 sm:text-3xl">Ranking {{ currentAttractSlide.label }}</p>
          <span
            class="font-elegant mt-8 flex h-56 w-56 items-center justify-center rounded-full text-8xl font-bold
              text-white shadow-2xl sm:h-72 sm:w-72 sm:text-9xl"
            :style="{ backgroundColor: attractPositionColor(currentAttractSlide.position) }"
          >
            {{ currentAttractSlide.position }}º
          </span>
          <p class="font-elegant mt-10 text-6xl font-bold text-white sm:text-9xl">{{ currentAttractSlide.name }}</p>
          <p class="mt-4 text-3xl font-bold text-white/85 sm:text-5xl">{{ currentAttractSlide.score }} pontos</p>
        </div>
      </template>

      <p class="fixed inset-x-0 bottom-10 z-20 flex items-center justify-center gap-3 text-lg font-bold uppercase
        tracking-[0.3em] text-white/80 sm:text-xl">
        <Sparkles :size="24" /> Toque na tela pra jogar
      </p>
    </div>

    <template v-else>
      <!-- etapa 1: senha do totem -->
      <div v-if="stage === 'totem-password'" class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span class="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white shadow-lg sm:h-28 sm:w-28">
          <Lock :size="40" />
        </span>
        <h1 class="font-elegant mt-8 text-5xl font-bold sm:text-7xl">{{ totemName }}</h1>
        <p class="mt-4 text-2xl text-ink-muted">Digite a senha do totem</p>
        <form class="mt-10 flex w-full max-w-md flex-col items-center gap-5" @submit.prevent="submitTotemPassword">
          <input
            v-model="totemPasswordInput"
            type="password"
            placeholder="Senha do totem"
            required
            autofocus
            class="w-full rounded-2xl border-2 border-ink/10 bg-white px-8 py-6 text-center text-2xl font-bold
              text-ink shadow-sm outline-none transition-colors focus:border-primary"
          />
          <p v-if="totemPasswordError" class="text-base font-bold text-danger">{{ totemPasswordError }}</p>
          <button
            type="submit"
            class="rounded-2xl bg-primary px-16 py-6 text-2xl font-bold text-white shadow-xl transition-transform
              active:scale-95"
          >
            Entrar
          </button>
        </form>
      </div>

      <!-- etapa 3: senha do evento escolhido -->
      <div v-else-if="stage === 'event-password'" class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span class="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white shadow-lg sm:h-28 sm:w-28">
          <Lock :size="40" />
        </span>
        <h1 class="font-elegant mt-8 text-5xl font-bold sm:text-7xl">{{ selectedEvent?.event_name }}</h1>
        <p class="mt-4 text-2xl text-ink-muted">Digite a senha deste evento</p>
        <form class="mt-10 flex w-full max-w-md flex-col items-center gap-5" @submit.prevent="submitEventPassword">
          <input
            v-model="eventPasswordInput"
            type="password"
            placeholder="Senha do evento"
            required
            autofocus
            class="w-full rounded-2xl border-2 border-ink/10 bg-white px-8 py-6 text-center text-2xl font-bold
              text-ink shadow-sm outline-none transition-colors focus:border-primary"
          />
          <p v-if="eventPasswordError" class="text-base font-bold text-danger">{{ eventPasswordError }}</p>
          <button
            type="submit"
            class="rounded-2xl bg-primary px-16 py-6 text-2xl font-bold text-white shadow-xl transition-transform
              active:scale-95"
          >
            Entrar
          </button>
        </form>
        <button
          v-if="events.length > 1"
          type="button"
          class="mt-8 text-base font-bold uppercase tracking-[0.2em] text-ink-soft hover:text-ink"
          @click="stage = 'choose-event'"
        >
          ← Escolher outro evento
        </button>
      </div>

      <!-- escolher evento (só aparece se o totem tiver mais de um vinculado) -->
      <div v-else-if="stage === 'choose-event'" class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <span class="flex h-28 w-28 items-center justify-center rounded-full bg-white text-primary shadow-lg sm:h-36 sm:w-36">
          <CalendarClock :size="52" />
        </span>
        <h1 class="font-elegant mt-8 text-6xl font-bold leading-[0.95] sm:text-8xl">{{ totemName }}</h1>
        <p class="mt-4 text-2xl text-ink-muted sm:text-3xl">Qual evento vamos rodar agora?</p>
        <div class="mt-6 flex items-center gap-4">
          <span class="h-px w-24 bg-gradient-to-r from-transparent to-ink/20" />
          <span class="h-3 w-3 rotate-45 bg-primary" />
          <span class="h-px w-24 bg-gradient-to-l from-transparent to-ink/20" />
        </div>

        <div class="mt-12 flex w-full max-w-2xl flex-col gap-5">
          <button
            v-for="ev in events"
            :key="ev.event_id"
            class="flex items-center gap-5 rounded-3xl border border-ink/10 bg-white px-10 py-8 text-left shadow-lg
              transition-all hover:border-primary hover:shadow-xl active:scale-[0.98]"
            @click="selectEvent(ev)"
          >
            <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <CalendarClock :size="30" />
            </span>
            <span class="flex-1 text-3xl font-bold text-ink">{{ ev.event_name }}</span>
            <ChevronRight :size="30" class="text-ink-soft" />
          </button>
        </div>
      </div>

      <!-- painel de boas-vindas: todos os jogos do evento -->
      <div v-else-if="stage === 'welcome'" class="relative z-10 flex min-h-screen flex-col items-center px-6 py-16 text-center">
        <h1 class="font-elegant text-7xl font-bold leading-[0.95] sm:text-9xl mt-5">{{ selectedEvent?.event_name }}</h1>
        <p class="mt-10 text-3xl text-ink-muted sm:text-5xl">Escolha um jogo pra começar</p>
        <div class="mt-8 flex items-center gap-4">
          <span class="h-px w-28 bg-gradient-to-r from-transparent to-ink/20" />
          <span class="h-3.5 w-3.5 rotate-45 bg-primary" />
          <span class="h-px w-28 bg-gradient-to-l from-transparent to-ink/20" />
        </div>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-6 py-3 text-base
              font-bold text-ink shadow-sm transition-colors hover:border-primary sm:text-lg"
            @click="openManualRanking('overall')"
          >
            <Trophy :size="20" /> Ranking geral
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-6 py-3 text-base
              font-bold text-ink shadow-sm transition-colors hover:border-primary sm:text-lg"
            @click="openManualRanking('games')"
          >
            <Medal :size="20" /> Ranking por jogo
          </button>
        </div>

        <p v-if="!selectedEvent?.games?.length" class="mt-16 text-3xl text-ink-soft">
          Nenhum jogo disponível neste evento ainda.
        </p>
        <div v-else class="mt-16 flex w-full max-w-4xl flex-col gap-7">
          <button
            v-for="game in selectedEvent.games"
            :key="game.id"
            class="flex items-center gap-8 rounded-[2.5rem] border border-ink/10 bg-white px-10 py-9 text-left
              shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] sm:px-14 sm:py-11"
            @click="pickGame(game)"
          >
            <span
              class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-white shadow-md
                sm:h-32 sm:w-32"
              :style="{ backgroundColor: game.config?.primary_color || '#10939b' }"
            >
              <Gamepad2 :size="52" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-elegant truncate text-4xl font-bold text-ink sm:text-6xl">{{ game.title }}</p>
              <span class="badge mt-3 !px-4 !py-1.5 !text-sm sm:!text-base">{{ game.game.name }}</span>
            </div>
            <ChevronRight :size="40" class="shrink-0 text-ink-soft" />
          </button>
        </div>
      </div>

      <!-- quem vai jogar agora — segue a personalização do jogo escolhido -->
      <div v-else-if="stage === 'name'" class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div
          class="flex h-24 w-24 items-center justify-center rounded-full shadow-lg"
          :class="gameIsDarkTheme ? 'border border-white/10 bg-primary-900/70' : 'bg-white/90'"
        >
          <User :size="40" :style="{ color: gameAccentColor }" />
        </div>
        <h1 class="font-elegant mt-8 text-5xl font-bold sm:text-7xl" :style="gameHudTextStyle">{{ selectedGame?.title }}</h1>
        <p class="mt-5 text-2xl sm:text-3xl" :style="gameHudSubTextStyle">Quem vai jogar agora?</p>

        <div v-if="knownNames.length" class="mt-10 flex w-full max-w-3xl flex-wrap items-center justify-center gap-4">
          <button
            v-for="name in knownNames"
            :key="name"
            class="rounded-full border-2 px-8 py-4 text-2xl font-bold shadow-sm backdrop-blur transition-all
              active:scale-95"
            :class="gameIsDarkTheme
              ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
              : 'border-ink/10 bg-white text-ink hover:border-primary'"
            @click="pickName(name)"
          >
            {{ name }}
          </button>
        </div>

        <form class="mt-12 flex w-full max-w-xl flex-col items-center gap-5" @submit.prevent="submitNewName">
          <input
            v-model="playerName"
            type="text"
            placeholder="Ou digite um nome novo"
            maxlength="60"
            required
            class="w-full rounded-2xl border-2 px-8 py-7 text-center text-3xl font-bold shadow-sm outline-none
              transition-colors"
            :class="gameIsDarkTheme
              ? 'border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/50'
              : 'border-ink/10 bg-white text-ink focus:border-primary'"
          />
          <button
            type="submit"
            class="rounded-2xl px-20 py-8 text-3xl font-bold text-white shadow-xl transition-transform
              active:scale-95"
            :style="gameButtonStyle"
          >
            Jogar
          </button>
        </form>

        <button
          type="button"
          class="mt-10 text-base font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
          :style="{ color: gameHudSubTextStyle.color }"
          @click="backToWelcome"
        >
          ← Voltar
        </button>
      </div>

    </template>

    <!-- jogo de verdade: fica montado tanto jogando quanto com o ranking em
         cima — a própria tela final do jogo (com "Jogar novamente"/"Voltar
         ao início") é a mesma sempre usada, sem tela genérica substituindo -->
    <component
      :is="gameDef.player"
      v-if="(stage === 'playing' || stage === 'post-game' || stage === 'history') && gameDef"
      :key="roundKey"
      :title="selectedGame.title"
      :config="selectedGame.config"
      :top-inset="0"
      @finished="handleFinished"
      @restarted="handleGameRestarted"
      @back-to-start="handleBackToStart"
    />

    <!-- barra flutuante com as ações extra do totem: só aparece por cima da
         própria tela final do jogo, sem substituir nada dela -->
    <div
      v-if="showPostPlayActions && stage === 'playing' && finishResult"
      class="fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 sm:p-6"
    >
      <div class="flex w-full max-w-xl flex-col gap-3 rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-xl
            font-bold text-white shadow-lg transition-transform active:scale-95"
          @click="finishResult?.label ? showHistory() : showRanking()"
        >
          <Trophy :size="22" /> {{ finishResult?.label ? 'Ver histórico' : 'Ver ranking' }}
        </button>
        <template v-if="!photoQr">
          <button
            v-if="finishResult?.playId"
            type="button"
            class="inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-ink/15 px-8 py-4
              text-xl font-bold text-ink transition-transform active:scale-95"
            @click="requestPhoto"
          >
            <Camera :size="22" /> Salvar foto pra o recap
          </button>
        </template>
        <div v-else class="rounded-2xl border border-ink/10 p-4 text-center">
          <img :src="photoQr" alt="QR code" class="mx-auto h-40 w-40" />
          <p class="mt-2 text-sm font-bold text-ink">Escaneie com a câmera do celular pra tirar sua foto</p>
        </div>
      </div>
    </div>

    <!-- ranking geral: overlay cheio por cima do jogo (que continua montado
         atrás), com animação de pontos subindo estilo Kahoot -->
    <div
      v-if="stage === 'post-game'"
      class="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center overflow-y-auto px-6 py-12 text-center"
      :style="gameContainerStyle"
    >
        <div class="relative w-full max-w-2xl rounded-[3rem] p-12 pt-16 shadow-2xl" :class="gameCardSurfaceClass">
          <span
            class="absolute -top-10 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center
              rounded-full shadow-md sm:-top-11 sm:h-24 sm:w-24"
            :class="gameCardSurfaceClass"
          >
            <Trophy :size="40" :style="{ color: gameAccentColor }" />
          </span>

          <p class="text-sm font-bold uppercase tracking-[0.3em] sm:text-base" :class="gameCardMutedClass">
            {{ finishResult?.playerName }}
            <template v-if="currentPlayerPlays > 1"> · {{ currentPlayerPlays }}ª vez jogando</template>
          </p>
          <p class="font-elegant mt-3 text-6xl font-bold sm:text-7xl" :style="{ color: gameAccentColor }">
            {{ animatedScore }} pts
          </p>
          <p v-if="finishResult?.position" class="font-elegant mt-2 text-3xl font-bold sm:text-4xl" :class="gameCardTextClass">
            {{ finishResult.position }}º lugar
          </p>

          <div v-if="displayRanking.length" class="mt-9 w-full">
            <p class="mb-4 text-sm font-bold uppercase tracking-[0.3em]" :class="gameCardMutedClass">Ranking do jogo</p>
            <TransitionGroup tag="div" name="rank" class="flex flex-col gap-3">
              <div
                v-for="(entry, i) in displayRanking"
                :key="entry.name.toLowerCase()"
                class="flex items-center gap-5 rounded-2xl px-6 py-5 text-left"
                :class="isCurrentPlayer(entry.name) ? 'text-white shadow-md' : gameIsDarkTheme ? 'bg-white/5' : 'bg-cream'"
                :style="isCurrentPlayer(entry.name) ? { backgroundColor: gameAccentColor } : {}"
              >
                <span
                  class="font-elegant text-3xl font-bold"
                  :class="isCurrentPlayer(entry.name) ? 'text-white/80' : gameCardMutedClass"
                >
                  {{ i + 1 }}
                </span>
                <span class="flex-1 text-xl font-bold sm:text-2xl" :class="isCurrentPlayer(entry.name) ? '' : gameCardTextClass">
                  {{ entry.name }}
                  <span v-if="entry.plays > 1" class="text-sm font-bold opacity-70">({{ entry.plays }}x)</span>
                  <span v-if="isCurrentPlayer(entry.name) && showGainedBadge" class="ml-1 animate-bounce text-sm font-bold text-green-400">
                    +{{ finishResult?.score ?? 0 }}
                  </span>
                </span>
                <span class="text-xl font-bold sm:text-2xl" :class="isCurrentPlayer(entry.name) ? '' : gameCardTextClass">
                  {{ isCurrentPlayer(entry.name) ? currentPlayerAnimatedTotal : entry.score }} pts
                </span>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <div class="mt-10 flex w-full max-w-2xl flex-col gap-4">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-3 rounded-2xl border-2 px-12 py-7 text-2xl
              font-bold transition-transform active:scale-95"
            :style="gameOutlineButtonStyle"
            @click="closeOverlay"
          >
            ← Voltar
          </button>
        </div>
    </div>

    <!-- histórico da roleta: cada giro aparece uma vez (mesma pessoa pode
         repetir), com horário e o que ganhou naquela vez — sem agrupar -->
    <div
      v-if="stage === 'history'"
      class="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center overflow-y-auto px-6 py-12 text-center"
      :style="gameContainerStyle"
    >
      <div class="relative w-full max-w-2xl rounded-[3rem] p-12 pt-16 shadow-2xl" :class="gameCardSurfaceClass">
        <span
          class="absolute -top-10 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center
            rounded-full shadow-md sm:-top-11 sm:h-24 sm:w-24"
          :class="gameCardSurfaceClass"
        >
          <Sparkles :size="40" :style="{ color: gameAccentColor }" />
        </span>

        <p class="text-sm font-bold uppercase tracking-[0.3em] sm:text-base" :class="gameCardMutedClass">
          Histórico da roleta
        </p>
        <p class="mt-2 text-lg sm:text-xl" :class="gameCardTextClass">Todo mundo que já girou</p>

        <div v-if="history.length" class="mt-9 flex max-h-[55vh] w-full flex-col gap-3 overflow-y-auto pr-1">
          <div
            v-for="(entry, i) in history"
            :key="i"
            class="flex items-center gap-4 rounded-2xl px-6 py-4 text-left"
            :class="gameIsDarkTheme ? 'bg-white/5' : 'bg-cream'"
          >
            <span class="w-16 shrink-0 text-sm font-bold" :class="gameCardMutedClass">
              {{ formatTime(entry.played_at) }}
            </span>
            <span class="flex-1 text-lg font-bold sm:text-xl" :class="gameCardTextClass">{{ entry.player_name }}</span>
            <span class="text-lg font-bold sm:text-xl" :style="{ color: historyOutcomeColor(entry) }">
              {{ entry.prize }}
            </span>
          </div>
        </div>
        <p v-else class="mt-9 text-lg" :class="gameCardMutedClass">Ninguém girou ainda.</p>
      </div>

      <div class="mt-10 flex w-full max-w-2xl flex-col gap-4">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-3 rounded-2xl border-2 px-12 py-7 text-2xl
            font-bold transition-transform active:scale-95"
          :style="gameOutlineButtonStyle"
          @click="closeOverlay"
        >
          ← Voltar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { Gamepad2, Camera, CalendarClock, ChevronRight, User, Trophy, Sparkles, Lock, Medal, X } from '@lucide/vue'
import api from '@/services/api'
import { getGameDefinition } from '@/games/registry'
import { useGameTheme } from '@/composables/useGameTheme'
import { useGameSounds } from '@/composables/useGameSounds'

const IDLE_MS = 45000
const HARD_RESET_MS = 90000
const ATTRACT_CYCLE_MS = 5000

const route = useRoute()
const loading = ref(true)
const errorMsg = ref('')
const totemName = ref('')
const events = ref([])
const selectedEvent = ref(null)
const stage = ref('welcome')
const selectedGame = ref(null)
const totemPasswordInput = ref('')
const totemPasswordError = ref('')
const eventPasswordInput = ref('')
const eventPasswordError = ref('')
const playerName = ref('')
const knownNames = ref([])
const roundKey = ref(0)
const finishResult = ref(null)
const photoQr = ref('')

const attractMode = ref(false)
const attractSlides = ref([])
const attractIndex = ref(0)
const manualRankingView = ref(null) // null | 'overall' | 'games' — ranking aberto pelo botão do painel, não pela inatividade
let idleTimer = null
let attractCycleTimer = null

const attractRankBg = {
  background: 'radial-gradient(circle at 30% 20%, #17a6ae 0%, #0b3a3e 55%, #05181a 100%)',
}

// 1º/2º/3º ganham a cor de medalha; do resto pra baixo usa a cor da marca.
function attractPositionColor(position) {
  if (position === 1) return '#f4b400'
  if (position === 2) return '#9ca3af'
  if (position === 3) return '#b45309'
  return '#10939b'
}

const gameDef = computed(() => (selectedGame.value ? getGameDefinition(selectedGame.value.game.slug) : null))
const currentAttractSlide = computed(() => attractSlides.value[attractIndex.value] || null)

// As telas de "quem vai jogar" e "pós-jogo" pertencem à experiência daquele
// jogo específico, então seguem a MESMA personalização (fundo, cor, tema)
// que o admin configurou pra ele — reaproveita o composable usado dentro do
// próprio jogo. O getter mantém a leitura reativa a `selectedGame` mesmo o
// composable rodando fora de um componente de jogo de verdade.
const gameThemeSource = {
  get config() {
    return selectedGame.value?.config || {}
  },
}
const {
  accentColor: gameAccentColor,
  isDarkTheme: gameIsDarkTheme,
  soundEnabled: gameSoundEnabled,
  hudTextStyle: gameHudTextStyle,
  hudSubTextStyle: gameHudSubTextStyle,
  cardSurfaceClass: gameCardSurfaceClass,
  cardTextClass: gameCardTextClass,
  cardMutedClass: gameCardMutedClass,
  containerStyle: gameContainerStyle,
  buttonStyle: gameButtonStyle,
  outlineButtonStyle: gameOutlineButtonStyle,
} = useGameTheme(gameThemeSource)

const { playCorrect } = useGameSounds(gameSoundEnabled)

// Quantas vezes essa pessoa já jogou (soma de partidas com pontuação, vindo
// do próprio ranking retornado pelo backend) — só aparece se > 1.
const currentPlayerPlays = computed(() => {
  const name = finishResult.value?.playerName?.trim().toLowerCase()
  if (!name) return 1
  const entry = (finishResult.value?.ranking || []).find((e) => e.name.trim().toLowerCase() === name)
  return entry?.plays || 1
})

const TOTEM_BG = {
  background: 'radial-gradient(circle at 20% 20%, #d9e8e6 0%, #fcf8f5 45%, #f6f2e9 100%)',
}
// Fora da tela de nome, o totem usa seu próprio visual neutro (escolher
// evento, painel de jogos, atração) — não faz sentido herdar o tema de um
// jogo específico aí, ainda mais com vários jogos disponíveis. Durante o
// jogo/ranking, o próprio jogo (ou o overlay do ranking) já cobre a tela
// inteira com o fundo dele, então o root nem aparece.
const rootBgStyle = computed(() => {
  if (stage.value === 'name' && selectedGame.value) {
    return gameContainerStyle.value
  }
  return TOTEM_BG
})

function isCurrentPlayer(name) {
  return name.trim().toLowerCase() === finishResult.value?.playerName?.trim().toLowerCase()
}

// Guarda a senha do totem/evento e o evento escolhido no localStorage (por
// token) — assim um F5/reboot do totem não obriga digitar tudo de novo nem
// perde qual evento estava selecionado (era exatamente o bug reportado).
function storageKey(suffix) {
  return `totem:${route.params.token}:${suffix}`
}
function getStored(suffix) {
  try {
    return localStorage.getItem(storageKey(suffix))
  } catch (err) {
    return null
  }
}
function setStored(suffix, value) {
  try {
    if (value === null) localStorage.removeItem(storageKey(suffix))
    else localStorage.setItem(storageKey(suffix), value)
  } catch (err) {
    // localStorage indisponível (modo privado, etc.) — só não persiste
  }
}

async function load() {
  try {
    const { data } = await api.get(`/totem/${route.params.token}`)
    totemName.value = data.totem.name

    if (!data.totem.has_password) {
      events.value = data.events || []
      await afterTotemUnlocked()
      return
    }

    const storedPassword = getStored('totem_password')
    if (storedPassword && (await tryUnlockTotem(storedPassword, true))) {
      return
    }
    stage.value = 'totem-password'
  } catch (err) {
    errorMsg.value = 'Link inválido. Peça um novo link ao organizador.'
  } finally {
    loading.value = false
  }
}

async function tryUnlockTotem(password, silent = false) {
  try {
    const { data } = await api.post(`/totem/${route.params.token}/unlock`, { password })
    events.value = data.events || []
    setStored('totem_password', password)
    await afterTotemUnlocked()
    return true
  } catch (err) {
    if (silent) setStored('totem_password', null)
    else totemPasswordError.value = 'Senha incorreta.'
    return false
  }
}

function submitTotemPassword() {
  totemPasswordError.value = ''
  tryUnlockTotem(totemPasswordInput.value)
}

async function afterTotemUnlocked() {
  if (!events.value.length) {
    errorMsg.value = 'Nenhum evento ativo vinculado a este totem no momento.'
    return
  }
  if (events.value.length === 1) {
    await selectEvent(events.value[0])
    return
  }

  const storedEventId = getStored('selected_event_id')
  const match = storedEventId && events.value.find((ev) => String(ev.event_id) === storedEventId)
  if (match) {
    await selectEvent(match)
  } else {
    stage.value = 'choose-event'
    registerActivity()
  }
}

// Cache independente de qualquer referência de objeto do array `events` —
// guarda os jogos já liberados por id do evento. Reselecionar o mesmo
// evento na mesma sessão (inclusive via botão secreto) nunca deveria pedir
// a senha de novo; isso garante isso sem depender de mutar o item certo.
const unlockedGamesByEvent = reactive({})

async function selectEvent(ev) {
  selectedEvent.value = ev
  setStored('selected_event_id', String(ev.event_id))

  const games = ev.games || unlockedGamesByEvent[ev.event_id]
  if (games) {
    ev.games = games
    stage.value = 'welcome'
    loadNames()
    registerActivity()
    return
  }

  const storedEventPassword = ev.has_password ? getStored(`event_password_${ev.event_id}`) : null
  if (storedEventPassword && (await tryUnlockEvent(ev, storedEventPassword, true))) {
    return
  }

  eventPasswordError.value = ''
  stage.value = 'event-password'
}

async function tryUnlockEvent(ev, password, silent = false) {
  try {
    const { data } = await api.post(`/totem/${route.params.token}/events/${ev.event_id}/unlock`, { password })
    const games = data.games || []
    ev.games = games
    unlockedGamesByEvent[ev.event_id] = games
    setStored(`event_password_${ev.event_id}`, password)
    stage.value = 'welcome'
    loadNames()
    registerActivity()
    return true
  } catch (err) {
    if (silent) setStored(`event_password_${ev.event_id}`, null)
    else eventPasswordError.value = 'Senha incorreta.'
    return false
  }
}

function submitEventPassword() {
  eventPasswordError.value = ''
  tryUnlockEvent(selectedEvent.value, eventPasswordInput.value)
}

async function loadNames() {
  if (!selectedEvent.value) return
  try {
    const { data } = await api.get(`/totem/${route.params.token}/events/${selectedEvent.value.event_id}/names`)
    knownNames.value = data.names
  } catch (err) {
    knownNames.value = []
  }
}

function pickGame(game) {
  selectedGame.value = game
  playerName.value = ''
  stage.value = 'name'
  registerActivity()
}

function pickName(name) {
  playerName.value = name
  beginPlay()
}

// Mesma capitalização feita no backend (GamePlay::playerName) — deixa a tela
// já mostrando certo antes mesmo da resposta do servidor voltar.
function capitalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())
}

function submitNewName() {
  const trimmed = playerName.value.trim()
  if (!trimmed) return
  playerName.value = capitalizeName(trimmed)
  beginPlay()
}

function beginPlay() {
  roundKey.value += 1
  stage.value = 'playing'
  registerActivity()
}

// O jogo (dentro do próprio "Jogar novamente"/"Voltar ao início" nativo dele)
// avisa quando sai da tela final — sem isso, a barrinha de ações e qualquer
// overlay aberto (ranking/histórico) ficavam presos em cima da tela inicial
// do jogo depois de reiniciar, mostrando dados da partida anterior.
function handleGameRestarted() {
  stopRankingPoll()
  stopHistoryPoll()
  stopRankingAnimations()
  clearTimeout(postPlayActionsTimer)
  showPostPlayActions.value = false
  finishResult.value = null
  photoQr.value = ''
  if (stage.value !== 'playing') stage.value = 'playing'
}

// "Voltar ao início" (o botão nativo do jogo) não fica só na marca do jogo —
// no totem, isso significa devolver o totem pra escolha de quem vai jogar,
// já que a pessoa provavelmente está entregando pro próximo convidado.
function handleBackToStart() {
  stopRankingPoll()
  stopHistoryPoll()
  stopRankingAnimations()
  clearTimeout(postPlayActionsTimer)
  showPostPlayActions.value = false
  finishResult.value = null
  photoQr.value = ''
  playerName.value = ''
  stage.value = 'name'
  registerActivity()
}

async function handleFinished(payload) {
  let response = null
  try {
    const metadata = payload?.label
      ? { prize: payload.label, outcome_type: payload.outcomeType }
      : payload?.won !== null && payload?.won !== undefined
        ? { won: payload.won }
        : null

    const { data } = await api.post(`/play/${selectedGame.value.public_token}/plays`, {
      player_name: playerName.value.trim(),
      score: payload?.score ?? null,
      metadata,
      client_uuid: crypto.randomUUID(),
    })
    response = data
  } catch (err) {
    response = null
  }

  finishResult.value = {
    ...payload,
    playerName: playerName.value.trim(),
    playId: response?.id ?? null,
    position: response?.ranking_position ?? null,
    ranking: response?.ranking ?? [],
  }
  photoQr.value = ''

  // o jogo continua montado mostrando a própria tela final dele (a mesma de
  // sempre); só depois de um respiro aparece a barrinha com "salvar
  // foto"/"ver ranking" flutuando por cima, sem competir com a mensagem.
  showPostPlayActions.value = false
  clearTimeout(postPlayActionsTimer)
  postPlayActionsTimer = setTimeout(() => {
    showPostPlayActions.value = true
  }, 1500)
  registerActivity()
}

const showPostPlayActions = ref(false)
let postPlayActionsTimer = null

const displayRanking = ref([])
const animatedScore = ref(0)
const currentPlayerAnimatedTotal = ref(0)
const showGainedBadge = ref(false)
let scoreAnimFrameId = null
let totalAnimFrameId = null
let reorderTimer = null
let badgeTimer = null

function normalizeName(name) {
  return (name || '').trim().toLowerCase()
}

function animateValue(setter, from, to, duration) {
  const startTime = performance.now()
  function tick(now) {
    const progress = Math.min(1, (now - startTime) / duration)
    setter(Math.round(from + (to - from) * progress))
    if (progress < 1) return requestAnimationFrame(tick)
    setter(to)
  }
  return requestAnimationFrame(tick)
}

function stopRankingAnimations() {
  if (scoreAnimFrameId) cancelAnimationFrame(scoreAnimFrameId)
  if (totalAnimFrameId) cancelAnimationFrame(totalAnimFrameId)
  clearTimeout(reorderTimer)
  clearTimeout(badgeTimer)
  scoreAnimFrameId = null
  totalAnimFrameId = null
  showGainedBadge.value = false
}

let rankingPollTimer = null

// Enquanto o ranking está na tela, atualiza sozinho de tempos em tempos —
// se outra pessoa (em outro totem) ultrapassar, o card dela sobe de posição
// com a mesma animação de reordenação (TransitionGroup + .rank-move).
function startRankingPoll() {
  stopRankingPoll()
  rankingPollTimer = setInterval(async () => {
    if (!selectedGame.value || stage.value !== 'post-game') return
    try {
      const { data } = await api.get(`/play/${selectedGame.value.public_token}/ranking`)
      const fresh = (data.ranking || []).slice(0, 10)
      if (finishResult.value) finishResult.value.ranking = fresh
      displayRanking.value = fresh
    } catch (err) {
      // silencioso
    }
  }, 4000)
}

function stopRankingPoll() {
  if (rankingPollTimer) clearInterval(rankingPollTimer)
  rankingPollTimer = null
}

// Efeito "estilo Kahoot": entra mostrando a posição de ANTES dessa partida
// (subtraindo os pontos que acabou de ganhar do total do jogador atual),
// espera meio segundo e só então reordena pra posição real — quem foi
// ultrapassado sobe/desce com a animação de reordenação, e o total do
// jogador atual conta ao vivo junto com o "+N" que aparece e some.
function showRanking() {
  clearTimeout(postPlayActionsTimer)
  showPostPlayActions.value = false
  stage.value = 'post-game'
  registerActivity()
  stopRankingAnimations()

  const finalRanking = (finishResult.value?.ranking || []).map((entry) => ({ ...entry }))
  const gained = finishResult.value?.score ?? 0
  const name = normalizeName(finishResult.value?.playerName)

  const before = finalRanking.map((entry) => ({ ...entry }))
  const me = before.find((entry) => normalizeName(entry.name) === name)
  const totalAfter = me ? me.score : gained
  const totalBefore = Math.max(0, totalAfter - gained)
  if (me) me.score = totalBefore
  before.sort((a, b) => b.score - a.score)

  displayRanking.value = before
  currentPlayerAnimatedTotal.value = totalBefore
  animatedScore.value = 0
  playCorrect()
  scoreAnimFrameId = animateValue((v) => (animatedScore.value = v), 0, gained, 900)

  reorderTimer = setTimeout(() => {
    showGainedBadge.value = true
    displayRanking.value = finalRanking
    totalAnimFrameId = animateValue((v) => (currentPlayerAnimatedTotal.value = v), totalBefore, totalAfter, 700)
    badgeTimer = setTimeout(() => {
      showGainedBadge.value = false
    }, 1800)
  }, 600)

  startRankingPoll()
}

// Histórico da roleta: sem pontuação pra ranquear, então em vez de somar por
// jogador, lista cada giro como uma linha própria (a mesma pessoa aparece
// quantas vezes tiver girado, cada uma com o que ganhou naquela vez).
const history = ref([])
let historyPollTimer = null

async function loadHistory() {
  if (!selectedGame.value) return
  try {
    const { data } = await api.get(`/play/${selectedGame.value.public_token}/history`)
    history.value = data.history || []
  } catch (err) {
    history.value = []
  }
}

function startHistoryPoll() {
  stopHistoryPoll()
  loadHistory()
  historyPollTimer = setInterval(loadHistory, 5000)
}

function stopHistoryPoll() {
  if (historyPollTimer) clearInterval(historyPollTimer)
  historyPollTimer = null
}

function showHistory() {
  clearTimeout(postPlayActionsTimer)
  showPostPlayActions.value = false
  stage.value = 'history'
  registerActivity()
  startHistoryPoll()
}

function historyOutcomeColor(entry) {
  if (entry.outcome_type === 'positive') return '#22c55e'
  if (entry.outcome_type === 'negative') return '#ef4444'
  return '#f59e0b'
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Fecha o overlay (ranking ou histórico) e volta a mostrar o jogo (que nunca
// desmontou) com a barrinha de ações de novo — nada do estado do jogo se perde.
function closeOverlay() {
  stopRankingPoll()
  stopRankingAnimations()
  stopHistoryPoll()
  stage.value = 'playing'
  showPostPlayActions.value = true
  registerActivity()
}

async function requestPhoto() {
  if (!finishResult.value?.playId) return
  try {
    const { data } = await api.post(`/plays/${finishResult.value.playId}/photo-token`)
    const url = `${window.location.origin}${data.photo_path}`
    photoQr.value = await QRCode.toDataURL(url, { margin: 1, width: 320 })
  } catch (err) {
    // silencioso
  }
}

function backToWelcome() {
  stopRankingPoll()
  stopHistoryPoll()
  clearTimeout(postPlayActionsTimer)
  showPostPlayActions.value = false
  stopRankingAnimations()
  finishResult.value = null
  selectedGame.value = null
  playerName.value = ''
  photoQr.value = ''
  stage.value = 'welcome'
  loadNames()
  registerActivity()
}

// Único timer de inatividade pro totem inteiro: parado na tela de boas-vindas
// vira modo atração; abandonado em qualquer outra tela (nome, meio de um
// jogo, pós-jogo) volta sozinho pro painel depois de um tempo maior — o
// totem não pode ficar travado esperando alguém que já foi embora.
function registerActivity() {
  clearIdleTimer()
  if (attractMode.value) return
  if (stage.value === 'totem-password' || stage.value === 'event-password') return

  if (stage.value === 'welcome' || stage.value === 'choose-event') {
    idleTimer = setTimeout(enterAttract, IDLE_MS)
  } else {
    idleTimer = setTimeout(backToWelcome, HARD_RESET_MS)
  }
}

function clearIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = null
}

// Ranking geral primeiro, depois o de cada jogo separado — quando o jogador
// tem foto salva (do jogo daquela posição, ou de qualquer jogo pro geral),
// ela entra junto no mesmo slide. O que sobrar de foto (jogos sem pontuação,
// como a roleta) vira slide só de foto no final.
function buildAttractSlides(data) {
  const photos = data.photos || []
  const usedPhotoUrls = new Set()

  const photoFor = (name, gameName) => {
    const target = (name || '').trim().toLowerCase()
    const photo = photos.find((p) => {
      if (usedPhotoUrls.has(p.photo_url)) return false
      const sameName = (p.player_name || '').trim().toLowerCase() === target
      const sameGame = !gameName || p.game_name === gameName
      return sameName && sameGame
    })
    if (photo) usedPhotoUrls.add(photo.photo_url)
    return photo
  }

  const overallSlides = (data.overall_ranking || []).slice(0, 5).map((r, i) => ({
    label: 'Geral',
    name: r.name,
    score: r.score,
    position: i + 1,
    photoUrl: photoFor(r.name)?.photo_url || null,
  }))

  const gameSlides = (data.rankings_by_game || []).flatMap((game) =>
    (game.ranking || []).slice(0, 5).map((r, i) => ({
      label: game.game_name,
      name: r.name,
      score: r.score,
      position: i + 1,
      photoUrl: photoFor(r.name, game.game_name)?.photo_url || null,
    }))
  )

  const leftoverPhotoSlides = photos
    .filter((p) => !usedPhotoUrls.has(p.photo_url))
    .map((p) => ({
      label: p.game_name,
      name: p.player_name,
      score: null,
      position: p.ranking_position || null,
      photoUrl: p.photo_url,
    }))

  return [...overallSlides, ...gameSlides, ...leftoverPhotoSlides]
}

function startAttractCycle(slides) {
  attractSlides.value = slides
  attractIndex.value = 0
  attractMode.value = true
  attractCycleTimer = setInterval(() => {
    attractIndex.value = (attractIndex.value + 1) % attractSlides.value.length
  }, ATTRACT_CYCLE_MS)
}

async function enterAttract() {
  if (!selectedEvent.value) return
  try {
    const { data } = await api.get(`/totem/${route.params.token}/events/${selectedEvent.value.event_id}/attract`)
    const slides = buildAttractSlides(data)
    if (!slides.length) return
    startAttractCycle(slides)
  } catch (err) {
    // silencioso
  }
}

// Mesma visualização do modo atração, só que aberta na hora pelos botões
// "Ranking geral" / "Ranking por jogo" do painel de boas-vindas.
async function openManualRanking(kind) {
  if (!selectedEvent.value) return
  clearIdleTimer()
  try {
    const { data } = await api.get(`/totem/${route.params.token}/events/${selectedEvent.value.event_id}/attract`)
    const slides = buildAttractSlides(data).filter((s) => (kind === 'overall' ? s.label === 'Geral' : s.label !== 'Geral'))
    if (!slides.length) {
      registerActivity()
      return
    }
    manualRankingView.value = kind
    startAttractCycle(slides)
  } catch (err) {
    registerActivity()
  }
}

function exitAttract() {
  attractMode.value = false
  manualRankingView.value = null
  if (attractCycleTimer) clearInterval(attractCycleTimer)
  attractCycleTimer = null
  registerActivity()
}

function handleRootTap() {
  if (attractMode.value) {
    exitAttract()
    return
  }
  registerActivity()
}

const SECRET_TAP_TARGET = 6
const SECRET_TAP_WINDOW_MS = 3000
const secretTapCount = ref(0)
let secretTapTimer = null

function handleSecretTap() {
  secretTapCount.value += 1
  clearTimeout(secretTapTimer)

  if (secretTapCount.value >= SECRET_TAP_TARGET) {
    secretTapCount.value = 0
    resetToChooseEvent()
    return
  }

  secretTapTimer = setTimeout(() => {
    secretTapCount.value = 0
  }, SECRET_TAP_WINDOW_MS)
}

// Saída de emergência: aborta qualquer coisa em andamento (jogo, tela de
// nome, modo atração) e volta pra escolha de evento — não mexe na senha do
// totem já validada, só esquece qual evento estava selecionado.
function resetToChooseEvent() {
  clearIdleTimer()
  if (attractCycleTimer) clearInterval(attractCycleTimer)
  attractCycleTimer = null
  attractMode.value = false
  stopRankingPoll()
  stopHistoryPoll()
  clearTimeout(postPlayActionsTimer)
  showPostPlayActions.value = false
  stopRankingAnimations()

  finishResult.value = null
  selectedGame.value = null
  playerName.value = ''
  photoQr.value = ''
  eventPasswordInput.value = ''
  eventPasswordError.value = ''
  setStored('selected_event_id', null)
  selectedEvent.value = null

  if (events.value.length <= 1) {
    afterTotemUnlocked()
  } else {
    stage.value = 'choose-event'
    registerActivity()
  }
}

onMounted(load)
onUnmounted(() => {
  clearIdleTimer()
  clearTimeout(secretTapTimer)
  clearTimeout(postPlayActionsTimer)
  if (attractCycleTimer) clearInterval(attractCycleTimer)
  stopRankingAnimations()
  stopRankingPoll()
  stopHistoryPoll()
})
</script>

<style scoped>
.rank-move {
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
</style>
