<template>
  <div
    class="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#d9e8e6_0%,var(--color-cream)_45%,var(--color-cream-alt)_100%)] p-4 sm:p-6"
  >
    <div class="card w-full max-w-[380px] text-center sm:p-8">
      <BrandMark stacked subtitle="Gestão de eventos e totens" class="mx-auto mb-6" />

      <h1 class="mb-1 text-2xl">Acessar o painel</h1>
      <p class="mb-7 text-sm text-ink-muted">
        Entre com sua conta para gerenciar eventos, totens e jogos.
      </p>

      <form class="space-y-4 text-left" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="email">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            required
            placeholder="voce@empresa.com"
          />
        </div>

        <div class="field">
          <label for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" class="field-error">{{ error }}</p>

        <button type="submit" class="btn-primary mt-2 w-full" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BrandMark from '@/components/BrandMark.vue'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await auth.login(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value =
      err.response?.data?.message || 'Não foi possível entrar. Verifique seus dados e tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>
