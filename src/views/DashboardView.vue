<template>
  <AppShell>
    <section class="max-w-4xl">
      <h1 class="text-2xl sm:text-3xl">Visão geral</h1>
      <p class="mt-1 text-sm text-ink-muted sm:text-base">
        Olá, {{ auth.user?.name }}. Aqui está um resumo rápido da sua operação.
      </p>

      <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <div class="card flex flex-col gap-1.5">
          <span class="font-heading text-4xl font-bold text-primary">{{ eventsTotal ?? '—' }}</span>
          <span class="text-sm text-ink-muted">Eventos cadastrados</span>
        </div>
        <div class="card flex flex-col gap-1.5">
          <span class="font-heading text-4xl font-bold text-primary">{{ totemsTotal ?? '—' }}</span>
          <span class="text-sm text-ink-muted">Totens cadastrados</span>
        </div>
        <div class="card flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <span class="font-heading text-4xl font-bold text-primary">
            {{ auth.isAdmin ? 'Admin' : 'Usuário' }}
          </span>
          <span class="text-sm text-ink-muted">Seu nível de acesso</span>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import AppShell from '@/layouts/AppShell.vue'

const auth = useAuthStore()
const eventsTotal = ref(null)
const totemsTotal = ref(null)

onMounted(async () => {
  try {
    const [events, totems] = await Promise.all([api.get('/events'), api.get('/totems')])
    eventsTotal.value = events.data.meta?.total ?? events.data.data.length
    totemsTotal.value = totems.data.meta?.total ?? totems.data.data.length
  } catch {
    // silencioso: dashboard funciona mesmo sem os totais
  }
})
</script>
