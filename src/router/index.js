import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/eventos',
    name: 'eventos',
    component: () => import('@/views/EventsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/eventos/:id',
    name: 'evento',
    component: () => import('@/views/EventDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/totens',
    name: 'totens',
    component: () => import('@/views/TotemsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/jogos',
    name: 'jogos',
    component: () => import('@/views/GamesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/jogos/:slug',
    name: 'jogo',
    component: () => import('@/views/GameDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orcamentos',
    name: 'orcamentos',
    component: () => import('@/views/QuoteRequestsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/preview/:token',
    name: 'preview',
    component: () => import('@/views/PreviewView.vue'),
  },
  {
    path: '/jogar/:token',
    name: 'jogar',
    component: () => import('@/views/PlayView.vue'),
  },
  {
    path: '/totem/:token',
    name: 'totem-publico',
    component: () => import('@/views/TotemView.vue'),
  },
  {
    path: '/recap/:token',
    name: 'recap',
    component: () => import('@/views/RecapView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
