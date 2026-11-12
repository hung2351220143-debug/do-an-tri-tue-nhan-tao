import { createApp } from 'vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAppConfig } from './stores/appConfig'

const app = createApp(App)

app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  toastClassName: 'custom-toast',
})

app.mount('#app')

// Load app config ngay sau khi mount (không block render)
const { load } = useAppConfig()
load()
