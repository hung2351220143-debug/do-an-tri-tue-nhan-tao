/**
 * appConfig.js - Store tập trung cho cấu hình app
 * Load từ API 1 lần, tất cả component dùng chung
 * app_name, app_logo thay đổi đồng bộ khắp nơi
 */
import { reactive, computed } from 'vue'
import api from '../config/api'

const state = reactive({
  app_name:         'EcoScan',
  app_logo:         '',
  ios_web_url:      '',
  apk_url:          '',
  apk_version:      '1.0.0',
  apk_size:         '',
  download_enabled: '1',
  loaded:           false,
})

let loadPromise = null

export function useAppConfig() {
  // Load config từ API (chỉ gọi 1 lần, cache lại)
  const load = async (force = false) => {
    if (state.loaded && !force) return
    if (loadPromise && !force) return loadPromise

    loadPromise = (async () => {
      try {
        const { data } = await api.get('/api/app-config')
        if (data.success) {
          // Gán từng key riêng lẻ để đảm bảo reactivity rõ ràng và chỉ ghi
          // các config key đã biết (tránh leak key ngoài ý muốn vào state).
          const c = data.config
          state.app_name         = c.app_name         ?? state.app_name
          state.app_logo         = c.app_logo         ?? state.app_logo
          state.ios_web_url      = c.ios_web_url      ?? state.ios_web_url
          state.apk_url          = c.apk_url          ?? state.apk_url
          state.apk_version      = c.apk_version      ?? state.apk_version
          state.apk_size         = c.apk_size         ?? state.apk_size
          state.download_enabled = c.download_enabled ?? state.download_enabled
          // Cập nhật <title> trên tab trình duyệt
          if (state.app_name) {
            document.title = `${state.app_name} – Phân Loại Rác Thải Thông Minh`
          }
        }
      } catch {}
      state.loaded = true
    })()
    return loadPromise
  }

  // Reload sau khi admin thay đổi
  const reload = () => {
    state.loaded = false
    loadPromise = null
    return load(true)
  }

  const appName = computed(() => state.app_name || 'EcoScan')
  const appLogo = computed(() => state.app_logo || '')
  const hasLogo = computed(() => !!state.app_logo)

  return { state, appName, appLogo, hasLogo, load, reload }
}
