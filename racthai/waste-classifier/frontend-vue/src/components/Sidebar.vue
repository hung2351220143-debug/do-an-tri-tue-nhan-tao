<template>
  <aside class="flex flex-col flex-shrink-0 transition-all duration-300 h-screen sticky top-0 z-40"
    :class="collapsed ? 'w-16' : 'w-60'"
    style="background:linear-gradient(180deg,#0c4a6e 0%,#075985 60%,#0369a1 100%)">

    <!-- Logo -->
    <div class="h-16 flex items-center gap-3 px-4 border-b border-white/10 flex-shrink-0">
      <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg cursor-pointer"
        style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)"
        @click="collapsed = !collapsed">
        <img v-if="appCfg.app_logo" :src="appCfg.app_logo" class="w-full h-full object-cover"
          @error="e=>e.target.style.display='none'" />
        <Leaf v-else :size="19" class="text-white" />
      </div>
      <Transition enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-x-2" enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="!collapsed" class="overflow-hidden">
          <span class="font-bold text-white text-sm leading-tight">{{ appCfg.app_name || 'EcoScan' }}</span>
          <p class="text-sky-300 text-xs">Phân loại rác thải AI</p>
        </div>
      </Transition>
    </div>

    <!-- User mini card -->
    <div v-if="auth.state.user && !collapsed"
      class="mx-3 mt-3 p-3 rounded-xl flex items-center gap-2.5"
      style="background:rgba(255,255,255,0.08)">
      <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-sky-400/50"
        style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
        <img v-if="auth.state.user.avatar" :src="auth.state.user.avatar"
          class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
        <span v-else class="w-full h-full flex items-center justify-center text-white text-xs font-bold">
          {{ (auth.state.user.full_name || auth.state.user.username || '?').charAt(0).toUpperCase() }}
        </span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-white text-xs font-semibold truncate">{{ auth.state.user.full_name || auth.state.user.username }}</p>
        <span class="text-xs px-1.5 py-0.5 rounded-full font-medium"
          :class="{
            'bg-purple-400/30 text-purple-200': auth.state.user.role==='admin',
            'bg-blue-400/30 text-blue-200':    auth.state.user.role==='staff',
            'bg-sky-400/30 text-sky-200':       auth.state.user.role==='user'
          }">
          {{ roleLabel }}
        </span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      <template v-for="item in navItems" :key="item.to || item.label">
        <!-- Divider -->
        <div v-if="item.divider" class="my-2 border-t border-white/10" />
        <!-- Label group (chỉ hiện khi mở) -->
        <p v-else-if="item.label && !item.to && !collapsed"
          class="text-sky-400 text-xs font-semibold px-3 pt-2 pb-1 uppercase tracking-wider">
          {{ item.label }}
        </p>
        <!-- Nav link -->
        <RouterLink v-else-if="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
          :class="isActive(item.to, item.exact)
            ? 'text-white'
            : 'text-sky-300 hover:text-white hover:bg-white/10'"
          :style="isActive(item.to, item.exact) ? 'background:rgba(56,189,248,0.2);box-shadow:inset 0 0 0 1px rgba(56,189,248,0.3)' : ''">
          <!-- Active bar -->
          <span v-if="isActive(item.to, item.exact)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-sky-400" />
          <component :is="item.icon" :size="18" class="flex-shrink-0 transition-transform group-hover:scale-110" />
          <span v-if="!collapsed" class="text-sm font-medium flex-1">{{ item.label }}</span>
          <!-- Badge -->
          <span v-if="!collapsed && item.badge && item.badge > 0"
            class="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
          <!-- Tooltip khi collapsed -->
          <div v-if="collapsed"
            class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {{ item.label }}
          </div>
        </RouterLink>
      </template>
    </nav>

    <!-- Bottom actions -->
    <div class="px-2 py-3 border-t border-white/10 space-y-0.5 flex-shrink-0">
      <!-- Staff/Admin portals -->
      <button v-if="auth.state.user?.role === 'staff'"
        @click="router.push('/staff/inbox')"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-300 hover:text-white hover:bg-white/10 transition-all w-full">
        <Headset :size="18" class="flex-shrink-0" />
        <span v-if="!collapsed" class="text-sm font-medium">Trang nhân viên</span>
      </button>
      <button v-if="auth.state.user?.role === 'admin'"
        @click="router.push('/admin/dashboard')"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/20 transition-all w-full">
        <Shield :size="18" class="flex-shrink-0" />
        <span v-if="!collapsed" class="text-sm font-medium">Quản trị Admin</span>
      </button>
      <!-- Logout -->
      <button v-if="auth.state.user" @click="handleLogout"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-300 hover:text-red-300 hover:bg-red-500/10 transition-all w-full">
        <LogOut :size="18" class="flex-shrink-0" />
        <span v-if="!collapsed" class="text-sm font-medium">Đăng xuất</span>
      </button>
      <RouterLink v-else to="/login"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-white"
        style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
        <LogIn :size="18" class="flex-shrink-0" />
        <span v-if="!collapsed" class="text-sm font-semibold">Đăng nhập</span>
      </RouterLink>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppConfig } from '../stores/appConfig'
import { useSocket } from '../stores/socket'
import {
  Leaf, Home, Camera, MessageCircle, History, Download,
  User, LogIn, LogOut, Shield, Headset, Star, Bell, PackageCheck
} from 'lucide-vue-next'

const auth     = useAuthStore()
const route    = useRoute()
const router   = useRouter()
const { appName, appLogo } = useAppConfig()
const { state: appCfg }   = useAppConfig()
const { connect } = useSocket()
const collapsed   = ref(false)
const chatUnread  = ref(0)  // Badge tin nhắn nhân viên chưa đọc

const roleLabel = computed(() => {
  const r = auth.state.user?.role
  return r === 'admin' ? 'Admin' : r === 'staff' ? 'Nhân viên' : 'Người dùng'
})

const navItems = computed(() => {
  const items = [
    { to: '/',         label: 'Trang chủ',     icon: Home,          exact: true },
    { to: '/classify', label: 'Phân loại rác',  icon: Camera },
    { to: '/chat',     label: 'Hỏi AI',          icon: MessageCircle, badge: chatUnread.value },
    { to: '/download', label: 'Tải app',          icon: Download },
    { divider: true },
  ]
  if (auth.state.user) {
    items.push(
      { to: '/history',        label: 'Lịch sử',       icon: History },
      { to: '/recycle-orders', label: 'Đơn thu mua',   icon: PackageCheck },
      { to: '/profile',        label: 'Tài khoản',     icon: User },
    )
  } else {
    items.push(
      { to: '/register', label: 'Đăng ký',    icon: User },
    )
  }
  return items
})

function isActive(path, exact = false) {
  return exact ? route.path === path : route.path.startsWith(path)
}

function handleLogout() {
  auth.logout()
  router.push('/')
}

// Lắng nghe tin nhắn mới từ nhân viên → badge đỏ
onMounted(() => {
  const sock = connect(localStorage.getItem('token'))
  sock.on('new_message', (msg) => {
    // Chỉ báo khi nhân viên nhắn, người dùng không đang ở trang chat
    const t = msg.sender_type || msg.senderType
    if (t === 'staff' && !route.path.startsWith('/chat')) {
      chatUnread.value++
    }
  })
})

// Xóa badge khi vào trang chat
import { watch } from 'vue'
watch(() => route.path, (p) => {
  if (p.startsWith('/chat')) chatUnread.value = 0
})
</script>
