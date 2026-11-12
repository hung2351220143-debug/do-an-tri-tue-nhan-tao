/**
 * api.js - Tự động chọn baseURL đúng cho mọi môi trường:
 *   - Dev trên máy (localhost)    → proxy Vite → localhost:5000
 *   - Điện thoại qua WiFi/ngrok  → cùng origin hoặc VITE_API_URL
 */
import axios from 'axios'

// Nếu có biến môi trường VITE_API_URL (set khi build cho ngrok) thì dùng
// Ngược lại dùng relative path (đi qua Vite proxy khi dev, hoặc cùng origin khi serve)
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: false,
})

// Tự động gắn JWT token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Tự động xử lý lỗi 401 (hết hạn token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      // Reload về trang login nếu không phải đang ở trang login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
