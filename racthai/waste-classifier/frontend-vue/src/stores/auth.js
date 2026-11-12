import { reactive, computed } from 'vue'
import api from '../config/api'

const state = reactive({
  user: null,
  loading: true,
})
let initPromise = null

export function useAuthStore() {
  const isAdmin = computed(() => state.user?.role === 'admin')

  const init = async () => {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const token = localStorage.getItem('token')
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const { data } = await api.get('/api/auth/me')
          if (data.success) state.user = data.user
        } catch {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
        }
      }
      state.loading = false
    })()
    return initPromise
  }

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    if (data.success) {
      localStorage.setItem('token', data.token)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      state.user = data.user  // bao gồm avatar, phone, full_name
    }
    return data
  }

  const register = async (username, email, password) => {
    const { data } = await api.post('/api/auth/register', { username, email, password })
    if (data.success) {
      localStorage.setItem('token', data.token)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      state.user = data.user
    }
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    state.user = null
  }

  return { state, isAdmin, init, login, register, logout }
}
