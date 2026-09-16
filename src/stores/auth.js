import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('pole_token') || null,
    user: JSON.parse(localStorage.getItem('pole_user') || 'null'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(email, password) {
      const { data } = await api.post('/login', { email, password })

      this.token = data.token
      this.user = data.user
      localStorage.setItem('pole_token', data.token)
      localStorage.setItem('pole_user', JSON.stringify(data.user))
    },

    async fetchMe() {
      const { data } = await api.get('/me')
      this.user = data
      localStorage.setItem('pole_user', JSON.stringify(data))
    },

    async logout() {
      try {
        await api.post('/logout')
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('pole_token')
        localStorage.removeItem('pole_user')
      }
    },
  },
})
