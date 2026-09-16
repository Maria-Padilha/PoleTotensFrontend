<template>
  <div class="flex h-screen overflow-hidden bg-app-bg">
    <!-- Overlay (mobile only) -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[1px] md:hidden"
      @click="mobileOpen = false"
    />

    <!-- Sidebar: fixed overlay on mobile, static column on desktop (never scrolls) -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 -translate-x-full flex-col gap-8 overflow-y-auto
        border-r border-ink/[0.06] bg-white p-5 transition-transform duration-200 md:static
        md:w-60 md:translate-x-0"
      :class="mobileOpen ? 'translate-x-0' : ''"
    >
      <div class="flex items-center justify-between">
        <BrandMark class="px-1" />
        <button
          aria-label="Fechar menu"
          class="rounded-full p-1.5 text-ink-muted hover:bg-ink/5 md:hidden"
          @click="mobileOpen = false"
        >
          <X :size="18" />
        </button>
      </div>

      <nav class="flex flex-col gap-1">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-muted
            transition-colors hover:bg-ink/5 hover:text-ink"
          :class="isActive(item.name) ? '!bg-primary-50 !text-primary-600' : ''"
          @click="mobileOpen = false"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main column: header stays put, only <main> below scrolls -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header
        class="flex shrink-0 items-center justify-between gap-3 border-b border-ink/[0.06]
          bg-white px-4 py-3 sm:px-6"
      >
        <button
          aria-label="Abrir menu"
          class="rounded-full p-2 text-ink-muted hover:bg-ink/5 md:hidden"
          @click="mobileOpen = true"
        >
          <Menu :size="20" />
        </button>

        <div class="hidden md:block" />

        <div class="flex items-center gap-3">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50
              font-heading font-bold text-primary-600"
          >
            {{ initial }}
          </span>
          <div class="hidden flex-col leading-tight sm:flex">
            <strong class="text-sm text-ink">{{ auth.user?.name }}</strong>
            <small class="text-xs text-ink-muted">{{ auth.user?.email }}</small>
          </div>
          <button
            title="Sair"
            aria-label="Sair"
            class="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors
              hover:bg-danger-tint hover:text-danger disabled:opacity-60"
            :disabled="loading"
            @click="handleLogout"
          >
            <LogOut :size="18" />
          </button>
        </div>
      </header>

      <main class="w-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutGrid, Ticket, Monitor, Gamepad2, LogOut, Menu, X } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import BrandMark from '@/components/BrandMark.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const mobileOpen = ref(false)

const navItems = [
  { name: 'dashboard', label: 'Visão geral', icon: LayoutGrid },
  { name: 'eventos', label: 'Eventos', icon: Ticket },
  { name: 'totens', label: 'Totens', icon: Monitor },
  { name: 'jogos', label: 'Jogos', icon: Gamepad2 },
]

function isActive(name) {
  if (name === 'eventos') return route.name === 'eventos' || route.name === 'evento'
  return route.name === name
}

const initial = computed(() => auth.user?.name?.charAt(0).toUpperCase() || '?')

async function handleLogout() {
  loading.value = true
  try {
    await auth.logout()
  } finally {
    loading.value = false
    router.push({ name: 'login' })
  }
}
</script>
