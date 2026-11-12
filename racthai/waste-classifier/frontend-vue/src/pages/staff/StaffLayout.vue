<template>
  <div class="h-screen flex overflow-hidden bg-slate-100">

    <!-- Sidebar nhân viên -->
    <aside class="flex flex-col w-60 flex-shrink-0 h-screen"
      style="background:linear-gradient(180deg,#0c4a6e 0%,#075985 60%,#0369a1 100%)">

      <!-- Logo -->
      <div class="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg"
          style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
          <img v-if="appLogo" :src="appLogo" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
          <Headset v-else :size="18" class="text-white" />
        </div>
        <div>
          <p class="text-white font-bold text-sm">{{ appName }} Staff</p>
          <p class="text-sky-300 text-xs">Hỗ trợ khách hàng</p>
        </div>
      </div>

      <!-- Staff info -->
      <div class="mx-3 mt-3 p-3 rounded-xl" style="background:rgba(255,255,255,0.08)">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-400/50"
            style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
            <img v-if="auth.state.user?.avatar" :src="auth.state.user.avatar"
              class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
            <span v-else class="w-full h-full flex items-center justify-center text-white text-xs font-bold">
              {{ (auth.state.user?.full_name || auth.state.user?.username || '?').charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="min-w-0">
            <p class="text-white text-xs font-semibold truncate">{{ auth.state.user?.full_name || auth.state.user?.username }}</p>
            <div class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span class="text-green-300 text-xs">Đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <RouterLink v-for="item in NAV" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
          :class="$route.path.startsWith(item.to)
            ? 'text-white'
            : 'text-sky-300 hover:text-white hover:bg-white/10'"
          :style="$route.path.startsWith(item.to) ? 'background:rgba(56,189,248,0.2);box-shadow:inset 0 0 0 1px rgba(56,189,248,0.3)' : ''">
          <span v-if="$route.path.startsWith(item.to)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-sky-400" />
          <component :is="item.icon" :size="18" class="flex-shrink-0" />
          <span class="text-sm font-medium flex-1">{{ item.label }}</span>
          <span v-if="item.badge && item.badge > 0"
            class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
        </RouterLink>
      </nav>

      <!-- Bottom -->
      <div class="px-2 py-3 border-t border-white/10 space-y-0.5">
        <RouterLink to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-300 hover:text-white hover:bg-white/10 transition-all">
          <Home :size="18" />
          <span class="text-sm">Về trang chủ</span>
        </RouterLink>
        <button @click="handleLogout"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-300 hover:text-red-300 hover:bg-red-500/10 transition-all w-full">
          <LogOut :size="18" />
          <span class="text-sm">Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white/90 backdrop-blur-xl border-b border-sky-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
        <div>
          <h2 class="font-semibold text-gray-800 text-sm">{{ pageTitle }}</h2>
          <p class="text-xs text-gray-400">{{ new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }) }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Socket: {{ socketState.connected ? 'Online' : 'Offline' }}
          </span>
        </div>
      </header>
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppConfig } from '../../stores/appConfig'
import { useSocket } from '../../stores/socket'
import { MessageSquare, Image, Home, LogOut, Headset } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()
const route  = useRoute()
const { appName, appLogo } = useAppConfig()
const { state: socketState, connect, emit } = useSocket()

const unreadCount = ref(0)

// Tai lai tong so chua doc tu server
async function loadUnread() {
  try {
    const api = (await import('../../config/api')).default
    const { data } = await api.get('/api/staff-chat/staff/inbox')
    if (data.success) unreadCount.value = data.total_unread || 0
  } catch {}
}

const NAV = computed(() => [
  { to: '/staff/inbox',   label: 'Hộp thư hỗ trợ', icon: MessageSquare, badge: unreadCount.value },
  { to: '/staff/banners', label: 'Quản lý Banner',  icon: Image },
])

const pageTitle = computed(() => {
  if (route.path.includes('/staff/inbox')) return 'Hộp thư hỗ trợ'
  if (route.path.includes('/staff/chat'))  return 'Chat với khách hàng'
  if (route.path.includes('/staff/banners')) return 'Quản lý Banner'
  return 'Trang nhân viên'
})

// Mo trang inbox → xoa badge va tai lai so chua doc
watch(() => route.path, (p) => {
  if (p.startsWith('/staff/inbox')) {
    unreadCount.value = 0
    loadUnread()
  }
})

onMounted(async () => {
  const token = localStorage.getItem('token')
  const socket = connect(token)
  socket.emit('staff_connect')

  socket.on('new_chat', () => { unreadCount.value++ })
  socket.on('chat_updated', ({ chatId, lastMessage }) => {
    // Chi dem khi khach gui va nhan vien khong dang xem cuoc chat do
    if (lastMessage?.senderType === 'user' && !route.path.startsWith('/staff/chat/' + chatId)) {
      unreadCount.value++
    }
  })

  // Load unread count
  loadUnread()
})

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>
