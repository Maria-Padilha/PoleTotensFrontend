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
    path: '/preview/:token',
    name: 'preview',
    component: () => import('@/views/PreviewView.vue'),
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
