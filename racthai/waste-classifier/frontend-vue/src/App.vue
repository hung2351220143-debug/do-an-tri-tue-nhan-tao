<template>
  <div class="h-screen flex overflow-hidden bg-slate-50">
    <!-- Admin/Staff dùng layout riêng của chính chúng -->
    <template v-if="isAdminRoute || isStaffRoute">
      <RouterView />
    </template>

    <!-- Main app: sidebar + content -->
    <template v-else>
      <!-- Sidebar trái -->
      <Sidebar />

      <!-- Content area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <main class="flex-1 overflow-y-auto">
          <RouterView />
        </main>
      </div>

      <!-- Chat widget (nổi) -->
      <ChatWidget v-if="!isChatPage && !isLoginPage" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useAppConfig } from './stores/appConfig'
import { useSocket } from './stores/socket'
import Sidebar from './components/Sidebar.vue'
import ChatWidget from './components/ChatWidget.vue'

const route      = useRoute()
const auth       = useAuthStore()
const { load }   = useAppConfig()
const { connect } = useSocket()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isStaffRoute = computed(() => route.path.startsWith('/staff'))
const isChatPage   = computed(() => route.path.startsWith('/staff') || route.path.startsWith('/admin'))
const isLoginPage  = computed(() => ['/login','/register'].includes(route.path))

onMounted(async () => {
  await auth.init()
  load()
  // Ket noi Socket.io voi token neu da dang nhap
  const token = localStorage.getItem('token')
  connect(token)
})
</script>
