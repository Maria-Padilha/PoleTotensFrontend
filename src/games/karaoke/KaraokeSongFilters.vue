<template>
  <div class="flex flex-wrap items-center gap-2">
    <div class="relative min-w-[12rem] flex-1">
      <Search :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
      <input v-model="query" type="text" placeholder="Buscar por título, artista ou gênero" class="w-full !pl-10" />
    </div>
    <select v-if="filters.artists.value.length" v-model="artist" class="w-full sm:w-auto sm:max-w-[13rem]" aria-label="Filtrar por artista">
      <option value="">Todos os artistas</option>
      <option v-for="name in filters.artists.value" :key="name" :value="name">{{ name }}</option>
    </select>
    <select v-if="filters.genres.value.length" v-model="genre" class="w-full sm:w-auto sm:max-w-[12rem]" aria-label="Filtrar por gênero">
      <option value="">Todos os gêneros</option>
      <option v-for="g in filters.genres.value" :key="g" :value="g">{{ g }}</option>
    </select>
    <button v-if="filters.active.value" type="button" class="btn-outline !px-3.5 !py-2 text-xs" @click="filters.clear()">
      <X :size="13" /> Limpar
    </button>
  </div>
</template>

<script setup>
import { Search, X } from '@lucide/vue'

// `filters` é o retorno de useSongFilters (genres.js)
const props = defineProps({
  filters: { type: Object, required: true },
})

// refs do composable: no template viram valores e o v-model escreve neles direto
const { query, artist, genre } = props.filters
</script>
