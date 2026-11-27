<template>
  <div class="game-typo relative min-h-screen overflow-hidden" :style="containerStyle">
    <img
      v-if="config.logo_url"
      :src="config.logo_url"
      alt="Logo"
      class="absolute left-6 top-6 z-10 h-14 object-contain sm:left-10 sm:top-10 sm:h-20"
    />

    <!-- tela inicial -->
    <div
      v-if="phase === 'start'"
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      :style="phasePadding"
    >
      <div
        v-if="!config.logo_url && startIconComponent"
        class="mb-10 flex h-36 w-36 items-center justify-center rounded-full shadow-lg sm:h-48 sm:w-48"
        :class="isDarkTheme ? 'border border-white/10 bg-primary-900/70' : 'bg-white/90'"
      >
        <component :is="startIconComponent" :size="100" :style="{ color: accentColor }" />
      </div>
      <div
        v-else-if="!config.logo_url"
        class="mb-10 flex h-36 w-36 items-center justify-center rounded-full shadow-lg sm:h-48 sm:w-48"
        :class="isDarkTheme ? 'border border-white/10 bg-primary-900/70' : 'bg-white/90'"
      >
        <Mic :size="100" :style="{ color: accentColor }" />
      </div>

      <h1 class="font-elegant text-7xl font-bold leading-[1.05] tracking-tight sm:text-9xl" :style="hudTextStyle">
        <HighlightedText :text="title" :color="accentColor" />
      </h1>
      <h2
        v-if="config.headline"
        class="font-elegant mt-2 text-6xl font-bold leading-[1.05] tracking-tight sm:text-8xl"
        :style="hudTextStyle"
      >
        <HighlightedText :text="config.headline" :color="accentColor" />
      </h2>
      <p v-if="config.subtitle" class="font-elegant mt-5 text-3xl italic tracking-wide sm:text-5xl" :style="hudSubTextStyle">
        <HighlightedText :text="config.subtitle" :color="accentColor" />
      </p>

      <template v-if="songs.length">
        <button
          class="mt-9 rounded-2xl border px-16 py-8 text-3xl font-bold tracking-wide text-white
            transition-transform active:scale-95 sm:text-4xl"
          :style="buttonStyle"
          @click="phase = 'songs'"
        >
          <HighlightedText :text="startButtonText" variant="underline" />
        </button>
        <p class="mt-5 flex items-center gap-2 text-base opacity-80 sm:text-lg" :style="hudSubTextStyle">
          <MousePointerClick :size="18" class="shrink-0" />
          <HighlightedText :text="startHintText" :color="accentColor" />
        </p>
      </template>
      <p v-else class="mt-6 text-2xl" :style="hudSubTextStyle">Este karaokê ainda não tem músicas cadastradas.</p>
      <button
        v-if="publicToken"
        class="mt-8 inline-flex items-center gap-3 rounded-2xl border-2 px-10 py-5 text-2xl font-bold
          transition-transform active:scale-95 sm:text-3xl"
        :style="outlineButtonStyle"
        @click="openRanking"
      >
        <Trophy :size="28" /> Ver ranking
      </button>
    </div>

    <!-- escolha da música -->
    <div
      v-else-if="phase === 'songs'"
      class="relative z-10 flex min-h-screen flex-col items-center px-6 pb-20 text-center"
      :style="phasePadding"
    >
      <!-- o respiro de cima fica aqui (e não no padding) porque o padding do topo é controlado pelo totem -->
      <div class="h-14 shrink-0 sm:h-20" aria-hidden="true" />
      <span
        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-white shadow-xl sm:h-24 sm:w-24"
        :style="{ backgroundColor: accentColor }"
      >
        <Mic :size="40" />
      </span>
      <h1 class="font-elegant mt-7 text-5xl font-bold sm:text-7xl" :style="hudTextStyle">Escolha a música</h1>
      <p class="mt-4 text-lg sm:text-2xl" :style="hudSubTextStyle">Toque em <strong>Cantar</strong> na música que você quer</p>

      <!-- busca e filtros: aparecem quando há músicas suficientes pra valer a pena -->
      <div v-if="showFilters" class="mt-8 flex w-full max-w-5xl flex-col items-center gap-3">
        <div class="relative w-full max-w-xl">
          <Search :size="22" class="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 opacity-60" :style="hudSubTextStyle" />
          <input
            v-model="filters.query.value"
            type="text"
            placeholder="Buscar música, artista ou gênero"
            class="w-full rounded-full border-2 py-3.5 pl-14 pr-5 text-lg shadow-sm backdrop-blur"
            :style="searchInputStyle"
          />
        </div>
        <!-- dois botões de filtro; as opções só aparecem ao tocar neles -->
        <div v-if="filters.genres.value.length > 1 || filters.artists.value.length > 1" class="flex flex-wrap justify-center gap-3">
          <button
            v-if="filters.genres.value.length > 1"
            type="button"
            class="flex max-w-[18rem] items-center gap-2 rounded-full border-2 px-5 py-2.5 text-lg font-bold transition-transform active:scale-95"
            :style="chipStyle(!!filters.genre.value)"
            @click="filterPicker = 'genre'"
          >
            <Filter :size="18" class="shrink-0" />
            <span class="truncate">{{ filters.genre.value || 'Gênero' }}</span>
            <ChevronDown :size="18" class="shrink-0" />
          </button>
          <button
            v-if="filters.artists.value.length > 1"
            type="button"
            class="flex max-w-[18rem] items-center gap-2 rounded-full border-2 px-5 py-2.5 text-lg font-bold transition-transform active:scale-95"
            :style="chipStyle(!!filters.artist.value)"
            @click="filterPicker = 'artist'"
          >
            <Filter :size="18" class="shrink-0" />
            <span class="truncate">{{ filters.artist.value || 'Artista' }}</span>
            <ChevronDown :size="18" class="shrink-0" />
          </button>
          <button
            v-if="filters.active.value"
            type="button"
            class="flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-lg font-bold transition-transform active:scale-95"
            :style="chipStyle(false)"
            @click="filters.clear()"
          >
            <X :size="18" /> Limpar
          </button>
        </div>
      </div>

      <!-- escolha do gênero / artista -->
      <div
        v-if="filterPicker"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
        @click.self="filterPicker = null"
      >
        <div
          class="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[2rem] border-2 p-6 text-center shadow-2xl sm:p-8"
          :style="pickerStyle"
        >
          <p class="text-sm font-bold uppercase tracking-[0.25em]" :class="cardMutedClass">
            {{ filterPicker === 'genre' ? 'Filtrar por gênero' : 'Filtrar por artista' }}
          </p>
          <div class="mt-5 flex min-h-0 flex-1 flex-wrap content-start justify-center gap-3 overflow-y-auto overscroll-contain px-1 py-1">
            <button
              v-for="option in pickerOptions"
              :key="option"
              type="button"
              class="max-w-full truncate rounded-full border-2 px-5 py-2.5 text-lg font-bold transition-transform active:scale-95"
              :style="chipStyle(pickerValue === option)"
              @click="pickFilter(option)"
            >
              {{ option || (filterPicker === 'genre' ? 'Todos os gêneros' : 'Todos os artistas') }}
            </button>
          </div>
          <button
            type="button"
            class="mt-6 rounded-2xl border-2 py-3.5 text-lg font-bold transition-transform active:scale-95"
            :class="isDarkTheme ? 'border-white/30 text-white' : 'border-ink/15 text-ink'"
            @click="filterPicker = null"
          >
            Fechar
          </button>
        </div>
      </div>

      <p v-if="!visibleSongs.length" class="mt-12 text-xl" :style="hudSubTextStyle">
        Nenhuma música encontrada.
        <button type="button" class="ml-1 font-extrabold underline" @click="filters.clear()">Limpar filtros</button>
      </p>

      <!-- só o botão "Cantar" é clicável (o cartão não): evita escolher sem querer ao rolar a tela -->
      <div class="mt-10 flex w-full max-w-5xl flex-wrap justify-center gap-5 sm:gap-6">
        <div
          v-for="{ song, index } in visibleSongs"
          :key="song.id"
          class="flex min-h-[12rem] basis-[calc(50%-0.75rem)] flex-col items-start justify-between gap-4 rounded-3xl border-2 p-4
            text-left shadow-lg sm:min-h-[14rem] sm:basis-[calc(33.333%-1.1rem)] sm:p-5"
          :style="songCardStyle(song, index)"
        >
          <span class="block w-full min-w-0">
            <span class="mb-3 flex items-center justify-between gap-2">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white shadow-md sm:h-11 sm:w-11"
                :style="{ backgroundColor: songColor(song, index) }"
              >
                {{ index + 1 }}
              </span>
              <span
                v-if="durations[song.id]"
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-bold sm:text-lg"
                :class="isDarkTheme ? 'bg-white/15 text-white' : 'bg-white/80 text-ink'"
              >
                <Clock :size="15" /> {{ formatDuration(durations[song.id]) }}
              </span>
            </span>
            <span class="block break-words text-xl font-bold leading-tight sm:text-2xl" :class="cardTextClass">{{ song.title }}</span>
            <span v-if="song.artist" class="mt-1 block break-words text-base leading-snug sm:text-lg" :class="cardMutedClass">
              {{ song.artist }}
            </span>
          </span>
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-full py-3 text-lg font-extrabold text-white shadow-md
              transition-transform active:scale-95 sm:py-3.5 sm:text-xl"
            :style="{ backgroundColor: songColor(song, index) }"
            @click="confirmSong = song"
          >
            <Play :size="20" class="fill-current" /> Cantar
          </button>
        </div>
      </div>
      <button
        type="button"
        class="mt-14 text-lg font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
        :style="hudSubTextStyle"
        @click="backToStart"
      >
        ← Voltar
      </button>

      <!-- confirmação: só começa depois de confirmar -->
      <div
        v-if="confirmSong"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-6"
        @click.self="confirmSong = null"
      >
        <div
          class="w-full max-w-lg rounded-[2rem] border-2 p-8 text-center shadow-2xl sm:p-10"
          :style="songCardStyle(confirmSong, confirmIndex)"
        >
          <span
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-extrabold text-white shadow-md"
            :style="{ backgroundColor: songColor(confirmSong, confirmIndex) }"
          >
            {{ confirmIndex + 1 }}
          </span>
          <p class="mt-5 text-sm font-bold uppercase tracking-[0.25em]" :class="cardMutedClass">Cantar esta música?</p>
          <p class="mt-3 break-words text-3xl font-bold leading-tight sm:text-4xl" :class="cardTextClass">{{ confirmSong.title }}</p>
          <p v-if="confirmSong.artist" class="mt-2 break-words text-xl sm:text-2xl" :class="cardMutedClass">{{ confirmSong.artist }}</p>
          <p v-if="durations[confirmSong.id]" class="mt-3 inline-flex items-center gap-1.5 text-lg font-bold" :class="cardMutedClass">
            <Clock :size="16" /> {{ formatDuration(durations[confirmSong.id]) }}
          </p>
          <div class="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              class="rounded-2xl border-2 py-5 text-xl font-bold transition-transform active:scale-95"
              :class="isDarkTheme ? 'border-white/30 text-white' : 'border-ink/15 text-ink'"
              @click="confirmSong = null"
            >
              Voltar
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-2xl py-5 text-xl font-extrabold text-white shadow-lg transition-transform active:scale-95"
              :style="{ backgroundColor: songColor(confirmSong, confirmIndex) }"
              @click="confirmAndSing"
            >
              <Play :size="22" class="fill-current" /> Cantar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- microfone / calibração / contagem -->
    <div
      v-else-if="phase === 'prepare'"
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      :style="phasePadding"
    >
      <p class="text-lg font-bold uppercase tracking-[0.3em] sm:text-2xl" :style="hudSubTextStyle">
        {{ currentSong?.title }}
      </p>

      <template v-if="prepareError">
        <div class="mt-8 max-w-xl rounded-3xl p-8 shadow-xl backdrop-blur" :class="cardSurfaceClass">
          <MicOff :size="56" class="mx-auto" :style="{ color: currentColor }" />
          <p class="mt-4 text-xl font-bold sm:text-2xl" :class="cardTextClass">{{ prepareError }}</p>
        </div>
        <div class="mt-8 flex w-full max-w-xl flex-col gap-4">
          <button
            class="rounded-2xl px-10 py-6 text-2xl font-bold text-white shadow-xl active:scale-95"
            :style="{ backgroundColor: currentColor }"
            @click="beginPerformance(true)"
          >
            Tentar de novo
          </button>
          <button
            class="rounded-2xl border-2 px-10 py-6 text-2xl font-bold active:scale-95"
            :style="outlineButtonStyle"
            @click="beginPerformance(false, true)"
          >
            Cantar sem pontuação
          </button>
          <button class="text-base font-bold uppercase tracking-[0.2em]" :style="hudSubTextStyle" @click="goToSongs">
            ← Escolher outra música
          </button>
        </div>
      </template>

      <template v-else>
        <p v-if="countdown === null" class="font-elegant mt-10 text-4xl font-bold sm:text-6xl" :style="hudTextStyle">
          {{ prepareMessage }}
        </p>
        <p v-else class="font-elegant mt-6 text-[12rem] font-bold leading-none sm:text-[16rem]" :style="{ color: currentColor }">
          {{ countdown }}
        </p>
        <div class="mt-8 h-3 w-64 overflow-hidden rounded-full bg-black/15">
          <div class="h-full rounded-full transition-all duration-100" :style="{ width: `${voiceLevel * 100}%`, backgroundColor: currentColor }" />
        </div>
      </template>
    </div>

    <!-- cantando: palco de karaokê (letra em duas linhas, preenchendo palavra por palavra) -->
    <div v-else-if="phase === 'singing'" class="relative z-10 flex min-h-screen flex-col overflow-hidden" :style="phasePadding">
      <div class="kstage-bg absolute inset-0" :style="stageBackground(currentColor)" aria-hidden="true" />

      <!-- progresso da música -->
      <div class="relative h-2 w-full bg-white/10" aria-hidden="true">
        <div class="h-full" :style="{ width: `${songProgress}%`, backgroundColor: lyricAccent }" />
      </div>

      <div class="relative px-6 sm:px-12">
        <GameHud :icon="Mic" :label="currentSong?.title || 'Karaokê'" :accent-color="lyricAccent" dark>
          <button
            type="button"
            class="rounded-full border-2 border-white/40 bg-white/10 px-7 py-3 text-lg font-bold text-white backdrop-blur transition-transform active:scale-95 sm:text-xl"
            @click="cancelSinging"
          >
            Parar
          </button>
        </GameHud>
      </div>

      <div class="relative flex flex-1 flex-col items-center justify-center px-5 sm:px-12">
        <KaraokeLyrics :lines="lines" :time="currentTime" :accent="lyricAccent" />
      </div>

      <!-- equalizador: reage à sua voz -->
      <div class="relative flex h-44 items-end justify-center gap-1.5 px-8 pb-12 sm:gap-2" aria-hidden="true">
        <span
          v-for="n in BAR_COUNT"
          :key="n"
          class="w-2 rounded-full sm:w-3"
          :style="{ height: `${barHeight(n)}px`, backgroundColor: lyricAccent, opacity: 0.35 + voiceLevel * 0.65 }"
        />
      </div>
    </div>

    <!-- resultado -->
    <div
      v-else-if="phase === 'result'"
      class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      :style="phasePadding"
    >
      <div class="w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl backdrop-blur sm:p-14" :class="cardSurfaceClass">
        <p class="text-sm font-bold uppercase tracking-[0.3em] sm:text-lg" :class="cardMutedClass">
          {{ currentSong?.title }}
        </p>
        <template v-if="result.score !== null">
          <p class="font-elegant mt-4 flex items-baseline justify-center gap-2 text-8xl font-bold sm:text-9xl">
            <span :style="{ color: currentColor }">{{ shownScore }}</span>
            <span class="text-3xl" :class="cardMutedClass">/1000</span>
          </p>
          <p class="mt-4 text-base sm:text-lg" :class="cardMuted2Class">
            Nota pela sua voz e pela sincronia com a letra.
          </p>
        </template>
        <p v-else class="mt-6 text-2xl font-bold" :class="cardTextClass">Apresentação sem pontuação.</p>
      </div>

      <p class="font-elegant mt-10 text-4xl font-bold sm:text-6xl" :style="hudTextStyle">
        <HighlightedText :text="resultMessage" :color="currentColor" />
      </p>

      <div class="mt-10 flex w-full max-w-xl flex-col items-stretch gap-5">
        <button
          v-if="result.score !== null"
          class="inline-flex items-center justify-center gap-4 rounded-2xl px-14 py-8 text-3xl font-extrabold
            text-white shadow-xl transition-transform active:scale-[0.98] sm:text-4xl"
          :style="{ backgroundColor: currentColor }"
          @click="openRanking"
        >
          <Trophy :size="36" /> Ver ranking
        </button>
        <button
          class="inline-flex items-center justify-center gap-4 rounded-2xl border-2 px-14 py-8 text-3xl font-extrabold
            shadow-lg transition-transform active:scale-[0.98] sm:text-4xl"
          :style="outlineButtonStyle"
          @click="restart"
        >
          <RotateCcw :size="36" /> Cantar de novo
        </button>
        <button
          class="inline-flex items-center justify-center gap-4 rounded-2xl border-2 px-14 py-8 text-3xl font-extrabold
            shadow-lg transition-transform active:scale-[0.98] sm:text-4xl"
          :style="outlineButtonStyle"
          @click="backToStart"
        >
          <Home :size="36" /> Voltar ao início
        </button>
      </div>
    </div>

    <!-- ranking de apresentações -->
    <div
      v-else-if="phase === 'ranking'"
      class="relative z-10 flex min-h-screen flex-col items-center px-6 pb-20 text-center"
      :style="phasePadding"
    >
      <!-- o respiro de cima fica aqui (e não no padding) porque o padding do topo é controlado pelo totem -->
      <div class="h-16 shrink-0 sm:h-24" aria-hidden="true" />
      <span
        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-white shadow-xl sm:h-24 sm:w-24"
        :style="{ backgroundColor: accentColor }"
      >
        <Trophy :size="40" />
      </span>
      <h1 class="font-elegant mt-7 text-5xl font-bold sm:text-7xl" :style="hudTextStyle">Ranking do karaokê</h1>

      <p v-if="rankingLoading && !ranking.length" class="mt-10 text-2xl" :style="hudSubTextStyle">Carregando...</p>
      <p v-else-if="!ranking.length" class="mt-10 text-2xl" :style="hudSubTextStyle">
        {{ publicToken ? 'Ninguém pontuou ainda.' : 'O ranking só aparece no jogo de verdade (não no preview).' }}
      </p>

      <div v-else class="mt-12 flex w-full max-w-4xl flex-col gap-4">
        <div
          v-for="(row, i) in ranking"
          :key="row.id"
          class="flex items-center gap-4 rounded-2xl px-5 py-4 text-left shadow-lg backdrop-blur sm:gap-6 sm:px-8 sm:py-5"
          :class="cardSurfaceClass"
        >
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white sm:h-14 sm:w-14 sm:text-2xl"
            :style="{ backgroundColor: positionColor(i + 1) }"
          >
            {{ i + 1 }}º
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-2xl font-bold sm:text-3xl" :class="cardTextClass">{{ row.player_name }}</span>
            <span class="block truncate text-base sm:text-lg" :class="cardMutedClass">
              <Music :size="14" class="mr-1 inline" />{{ row.song || 'Música' }}
            </span>
          </span>
          <span class="font-elegant text-3xl font-bold sm:text-5xl" :style="{ color: rowColor(row) }">{{ row.score }}</span>
          <button
            v-if="row.recording_url"
            type="button"
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md
              transition-transform active:scale-90 sm:h-16 sm:w-16"
            :style="{ backgroundColor: rowColor(row) }"
            :title="playingId === row.id ? 'Parar' : 'Ouvir apresentação'"
            @click="togglePlayback(row)"
          >
            <component :is="playingId === row.id ? Square : Play" :size="26" />
          </button>
          <span v-else class="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
        </div>
      </div>

      <div class="mt-10 flex flex-wrap justify-center gap-4">
        <button
          class="rounded-2xl border-2 px-10 py-5 text-2xl font-bold active:scale-95"
          :style="outlineButtonStyle"
          @click="closeRanking"
        >
          ← Voltar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { Search, Filter, ChevronDown, X, Mic, MicOff, Music, Play, Square, Trophy, RotateCcw, Home, ChevronRight, MousePointerClick, Clock } from '@lucide/vue'
import HighlightedText from '@/components/HighlightedText.vue'
import GameHud from '@/components/GameHud.vue'
import api from '@/services/api'
import { useGameTheme } from '@/composables/useGameTheme'
import { buildPlayableLines } from './lrc'
import KaraokeLyrics from './KaraokeLyrics.vue'
import { songColor, stageBackground, lyricFill } from './songColors'
import { useSongFilters } from './genres'
import { useKaraokeVoice } from './useKaraokeVoice'

const props = defineProps({
  title: { type: String, default: 'Karaokê' },
  config: { type: Object, default: () => ({}) },
  topInset: { type: Number, default: 0 },
  // sem token (preview do painel) o ranking não existe — só o jogo em si.
  publicToken: { type: String, default: '' },
})

const emit = defineEmits(['finished', 'restarted', 'back-to-start', 'busy'])

const phasePadding = computed(() => ({ paddingTop: `${props.topInset}px` }))

const {
  accentColor,
  isDarkTheme,
  hudTextStyle,
  hudSubTextStyle,
  cardSurfaceClass,
  cardTextClass,
  cardMutedClass,
  cardMuted2Class,
  containerStyle,
  startButtonText,
  startHintText,
  startIconComponent,
  buttonStyle,
  outlineButtonStyle,
} = useGameTheme(props)

const voice = useKaraokeVoice()
const voiceLevel = voice.level

const songs = computed(() => (props.config?.songs || []).filter((s) => s.audio_url))

// busca/filtros do seletor de músicas. `visibleSongs` guarda o índice original de cada música:
// a cor e o número do cartão não mudam quando a lista é filtrada.
const filters = useSongFilters(songs)
const showFilters = computed(() => songs.value.length > 6)
const visibleSongs = computed(() => {
  const ids = new Set(filters.filtered.value.map((song) => song.id))
  return songs.value.map((song, index) => ({ song, index })).filter(({ song }) => ids.has(song.id))
})
// filtro aberto no momento: 'genre' | 'artist' | null
const filterPicker = ref(null)
const pickerOptions = computed(() => ['', ...(filterPicker.value === 'genre' ? filters.genres.value : filters.artists.value)])
const pickerValue = computed(() => (filterPicker.value === 'genre' ? filters.genre.value : filters.artist.value))
const pickerStyle = computed(() => ({
  backgroundColor: isDarkTheme.value ? '#0b1f23' : '#ffffff',
  borderColor: accentColor.value,
}))
function pickFilter(option) {
  if (filterPicker.value === 'genre') filters.genre.value = option
  else filters.artist.value = option
  filterPicker.value = null
}
const searchInputStyle = computed(() => ({
  backgroundColor: isDarkTheme.value ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
  borderColor: isDarkTheme.value ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)',
  color: isDarkTheme.value ? '#fff' : '#1a2e33',
}))
function chipStyle(selected) {
  return selected
    ? { backgroundColor: accentColor.value, borderColor: accentColor.value, color: '#fff' }
    : {
        backgroundColor: isDarkTheme.value ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
        borderColor: isDarkTheme.value ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)',
        color: isDarkTheme.value ? '#fff' : '#1a2e33',
      }
}

const phase = ref('start')
const currentSong = ref(null)
const lines = ref([])
const currentTime = ref(0)
const countdown = ref(null)
const prepareMessage = ref('')
const prepareError = ref('')
const result = ref({ score: null })
const shownScore = ref(0)

// volume da música durante a apresentação (1 = máximo): um pouco abaixo pra voz do cantor aparecer
const PERFORMANCE_VOLUME = 0.7
let audio = null
let musicStartedAt = null // performance.now() em que a música realmente começou a tocar
let rafId = null
let runId = 0

// ---- cores das músicas ------------------------------------------------------

// Cada música tem a sua cor (escolhida no cadastro, ou da paleta em ordem): o cartão leva um
// tom dela e o número/botão usam a cor forte, pra ligar visualmente um ao outro.
function songCardStyle(song, index) {
  const color = songColor(song, index)
  return {
    backgroundColor: isDarkTheme.value
      ? `color-mix(in srgb, ${color} 34%, #0b1f23)`
      : `color-mix(in srgb, ${color} 17%, #ffffff)`,
    borderColor: color,
    boxShadow: `0 18px 40px -22px ${color}`,
  }
}

// ---- palco -------------------------------------------------------------------

const songDuration = ref(0)
const songProgress = computed(() => (songDuration.value > 0 ? Math.min(100, (currentTime.value / songDuration.value) * 100) : 0))

// cor da música em apresentação (a mesma do cartão e do número na lista) — vale pra contagem,
// palco, letra, equalizador e resultado
const currentColor = computed(() => {
  const song = currentSong.value
  return song ? songColor(song, Math.max(0, songs.value.indexOf(song))) : accentColor.value
})
const lyricAccent = computed(() => lyricFill(currentColor.value))

// no ranking, cada apresentação leva a cor da música cantada
function rowColor(row) {
  const index = songs.value.findIndex((s) => s.id === row.song_id || s.title === row.song)
  return index >= 0 ? songColor(songs.value[index], index) : accentColor.value
}

const BAR_COUNT = 28
function barHeight(n) {
  const wave = Math.sin(n * 0.85 + currentTime.value * 9) * 0.5 + 0.5
  return Math.round(10 + voiceLevel.value * 150 * (0.3 + 0.7 * wave))
}

// ---- fluxo -----------------------------------------------------------------

// ---- duração das músicas (mostrada nos cartões) -----------------------------------
// Não fica salva no jogo: lê dos próprios arquivos (só os metadados, poucos KB cada) ao abrir a
// escolha de música, e guarda por link pra não pedir de novo.
const durations = reactive({})
const durationCache = new Map()

function formatDuration(seconds) {
  const total = Math.round(Number(seconds) || 0)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function loadDurations() {
  for (const song of songs.value) {
    if (durations[song.id]) continue
    if (durationCache.has(song.audio_url)) {
      durations[song.id] = durationCache.get(song.audio_url)
      continue
    }
    const el = new Audio()
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        durationCache.set(song.audio_url, el.duration)
        durations[song.id] = el.duration
      }
      el.removeAttribute('src')
      el.load()
    }
    el.onerror = () => el.removeAttribute('src')
    el.src = song.audio_url
  }
}

watch(
  () => phase.value,
  (value) => {
    if (value === 'songs') loadDurations()
  },
  { immediate: true }
)

// música aguardando confirmação (modal "Cantar esta música?")
const confirmSong = ref(null)
const confirmIndex = computed(() => Math.max(0, songs.value.findIndex((item) => item.id === confirmSong.value?.id)))

function confirmAndSing() {
  const song = confirmSong.value
  confirmSong.value = null
  if (song) selectSong(song)
}

function selectSong(song) {
  currentSong.value = song
  // Destrava o áudio dentro do toque do usuário (Safari/iOS bloqueia play()
  // fora de um gesto) — toca mudo por um instante e já pausa.
  audio = new Audio(song.audio_url)
  audio.preload = 'auto'
  audio.volume = 0
  audio.play().then(() => {
    audio.pause()
    audio.currentTime = 0
    audio.volume = PERFORMANCE_VOLUME
  }).catch(() => {
    audio.volume = PERFORMANCE_VOLUME
  })
  beginPerformance(true)
}

async function beginPerformance(askMic, withoutScore = false) {
  const myRun = ++runId
  prepareError.value = ''
  countdown.value = null
  phase.value = 'prepare'
  const song = currentSong.value
  voice.close()

  if (!withoutScore && askMic) {
    prepareMessage.value = 'Permita o uso do microfone...'
    const ok = await voice.openMic()
    if (myRun !== runId) return
    if (!ok) {
      prepareError.value = voice.micError.value
      return
    }
    prepareMessage.value = 'Silêncio por um instante...'
    await voice.calibrate(1500)
    if (myRun !== runId) return
  }

  for (const n of [3, 2, 1]) {
    countdown.value = n
    await new Promise((resolve) => setTimeout(resolve, 900))
    if (myRun !== runId) return
  }
  countdown.value = null

  lines.value = []
  currentTime.value = 0
  if (!audio || audio.src !== new URL(song.audio_url, window.location.href).href) {
    audio = new Audio(song.audio_url)
  }
  audio.volume = PERFORMANCE_VOLUME
  audio.currentTime = 0

  await new Promise((resolve) => {
    if (audio.readyState >= 1) resolve()
    else audio.addEventListener('loadedmetadata', resolve, { once: true })
    audio.addEventListener('error', resolve, { once: true })
  })
  if (myRun !== runId) return

  // ajuste fino do organizador (segundos) pra compensar sincronia que ficou
  // sempre adiantada/atrasada na música inteira.
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0
  songDuration.value = duration
  lines.value = buildPlayableLines(song.lyrics, duration, song.offset)

  const scoring = !withoutScore
  if (scoring) voice.start(() => audio.currentTime)

  audio.onended = () => finishPerformance(scoring)
  musicStartedAt = null
  audio.addEventListener('playing', () => { if (musicStartedAt === null) musicStartedAt = performance.now() }, { once: true })
  try {
    await audio.play()
  } catch (err) {
    prepareError.value = 'Não foi possível tocar a música. Toque na tela e tente de novo.'
    if (scoring) await voice.finish(lines.value)
    voice.close()
    phase.value = 'prepare'
    return
  }

  phase.value = 'singing'
  tick()
}

function tick() {
  currentTime.value = audio ? audio.currentTime : 0
  rafId = requestAnimationFrame(tick)
}

function stopLoops() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
}

async function finishPerformance(scoring) {
  stopLoops()
  const song = currentSong.value
  let outcome = { score: null, recording: null }
  let recordingOffsetMs = null
  if (scoring) {
    recordingOffsetMs = voice.recordingOffsetMs(musicStartedAt)
    outcome = await voice.finish(lines.value)
  }
  voice.close()

  result.value = outcome
  phase.value = 'result'
  animateScore(outcome.score)

  emit('finished', {
    score: outcome.score,
    maxScore: 1000,
    song: { id: song.id, title: song.title },
    recording: outcome.recording,
    recordingOffsetMs,
  })
}

function cancelSinging() {
  runId += 1
  stopLoops()
  if (audio) {
    audio.onended = null
    audio.pause()
  }
  voice.close()
  goToSongs()
}

function animateScore(target) {
  shownScore.value = 0
  if (target === null) return
  const started = performance.now()
  const step = (now) => {
    const ratio = Math.min(1, (now - started) / 1500)
    shownScore.value = Math.round(target * (1 - Math.pow(1 - ratio, 3)))
    if (ratio < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const resultMessage = computed(() => {
  const score = result.value.score
  if (score === null) return 'Valeu por cantar!'
  if (score >= 850) return props.config?.win_message || 'Que show! Você arrasou!'
  if (score >= 500) return 'Mandou bem! Que voz!'
  if (score >= 250) return props.config?.neutral_message || 'Foi bem! Que tal tentar de novo?'
  return props.config?.lose_message || 'Quase lá! Bora tentar de novo?'
})

function goToSongs() {
  runId += 1
  stopPlayback()
  phase.value = 'songs'
}

function restart() {
  stopPlayback()
  phase.value = 'songs'
  emit('restarted')
}

function backToStart() {
  runId += 1
  stopPlayback()
  phase.value = 'start'
  emit('back-to-start')
}

// ---- ranking ---------------------------------------------------------------

const ranking = ref([])
const rankingLoading = ref(false)
const playingId = ref(null)

// Enquanto prepara/canta ou ouve uma gravação do ranking o totem não deve
// resetar por inatividade — avisa o pai pra suspender o contador dele.
const isBusy = computed(() => phase.value === 'prepare' || phase.value === 'singing' || playingId.value !== null)
watch(isBusy, (busy) => emit('busy', busy))
let voiceAudio = null
let musicAudio = null
let refetchTimer = null
let rankingOrigin = 'result'

async function loadRanking() {
  if (!props.publicToken) return
  rankingLoading.value = true
  try {
    const { data } = await api.get(`/play/${props.publicToken}/karaoke-ranking`)
    ranking.value = data.ranking
  } catch (err) {
    // mantém o que já tinha
  } finally {
    rankingLoading.value = false
  }
}

function openRanking() {
  rankingOrigin = phase.value === 'start' ? 'start' : 'result'
  phase.value = 'ranking'
  loadRanking()
  // a gravação da apresentação que acabou de terminar ainda pode estar
  // subindo — busca de novo logo em seguida pro botão de ouvir aparecer.
  clearTimeout(refetchTimer)
  refetchTimer = setTimeout(loadRanking, 5000)
}

function closeRanking() {
  stopPlayback()
  clearTimeout(refetchTimer)
  phase.value = rankingOrigin
}

function stopPlayback() {
  for (const el of [voiceAudio, musicAudio]) {
    if (el) {
      el.onended = null
      el.pause()
    }
  }
  voiceAudio = null
  musicAudio = null
  clearTimeout(replayTimer)
  playingId.value = null
}

// Replay: a voz gravada toca junto com a música original. Na gravação, a voz sempre chega um pouco
// atrasada em relação à música (o gravador começa antes dela e o microfone tem atraso de captura);
// no canto o atraso foi medido e guardado em `recording_offset_ms`. Aqui a música é atrasada nessa
// medida, e as duas faixas só começam depois de carregadas, senão a mais lenta de baixar sai depois.
// Gravações antigas (sem a medida) usam um valor médio.
const DEFAULT_RECORDING_OFFSET_MS = 300
const REPLAY_LOAD_TIMEOUT_MS = 10000
let replayTimer = null

function whenReady(el) {
  return new Promise((resolve) => {
    if (el.readyState >= 4) return resolve()
    const done = () => {
      el.removeEventListener('canplaythrough', done)
      el.removeEventListener('error', done)
      clearTimeout(timeout)
      resolve()
    }
    const timeout = setTimeout(done, REPLAY_LOAD_TIMEOUT_MS)
    el.addEventListener('canplaythrough', done)
    el.addEventListener('error', done)
  })
}

async function togglePlayback(row) {
  if (playingId.value === row.id) {
    stopPlayback()
    return
  }
  stopPlayback()

  const song = songs.value.find((s) => s.id === row.song_id) || songs.value.find((s) => s.title === row.song)
  const voiceEl = new Audio(row.recording_url)
  const musicEl = song ? new Audio(song.audio_url) : null
  voiceEl.preload = 'auto'
  voiceEl.volume = 1
  voiceAudio = voiceEl
  if (musicEl) {
    musicEl.preload = 'auto'
    musicEl.volume = 0.1
  }
  musicAudio = musicEl

  playingId.value = row.id
  voiceEl.onended = stopPlayback

  const offsetMs = Number.isFinite(row.recording_offset_ms) ? row.recording_offset_ms : DEFAULT_RECORDING_OFFSET_MS
  const myPlayingId = row.id

  try {
    await Promise.all([whenReady(voiceEl), musicEl ? whenReady(musicEl) : Promise.resolve()])
    if (playingId.value !== myPlayingId) return // parou/trocou enquanto carregava

    if (!musicEl) {
      await voiceEl.play()
      return
    }

    // offset > 0: a música entra depois da voz; offset < 0: a voz entra depois da música.
    const [first, second] = offsetMs >= 0 ? [voiceEl, musicEl] : [musicEl, voiceEl]
    const gap = Math.abs(offsetMs)
    const t0 = performance.now()
    await first.play()
    // o próprio play() leva alguns ms pra começar: desconta pra a segunda faixa não sair atrasada
    const wait = Math.max(0, gap - (performance.now() - t0))
    replayTimer = setTimeout(() => {
      if (playingId.value === myPlayingId) second.play().catch(() => stopPlayback())
    }, wait)
  } catch (err) {
    stopPlayback()
  }
}

function positionColor(position) {
  if (position === 1) return '#e0b000'
  if (position === 2) return '#9aa0a6'
  if (position === 3) return '#b8733a'
  return accentColor.value
}

onUnmounted(() => {
  runId += 1
  stopLoops()
  stopPlayback()
  clearTimeout(refetchTimer)
  if (audio) {
    audio.onended = null
    audio.pause()
  }
  voice.close()
})
</script>

