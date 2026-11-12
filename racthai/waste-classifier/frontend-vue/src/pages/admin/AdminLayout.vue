<template>
  <div class="min-h-screen flex bg-slate-100">

    <!-- Sidebar -->
    <aside class="flex flex-col transition-all duration-300 flex-shrink-0 relative"
      :class="collapsed ? 'w-16' : 'w-64'"
      style="background:linear-gradient(180deg,#0c4a6e 0%,#075985 50%,#0c4a6e 100%)">

      <!-- Glow top -->
      <div class="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style="background:radial-gradient(ellipse at top,rgba(56,189,248,0.15),transparent)"></div>

      <!-- Logo -->
      <div class="h-16 flex items-center px-4 border-b border-white/10 relative z-10">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg"
          style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
          <img v-if="appCfg.app_logo" :src="appCfg.app_logo" class="w-full h-full object-cover" @error="appLogo=''" />
          <Leaf v-else :size="18" class="text-white" />
        </div>
        <div v-if="!collapsed" class="ml-3 overflow-hidden">
          <p class="font-bold text-sm text-white whitespace-nowrap">{{ appCfg.app_name || 'EcoScan' }} Admin</p>
          <p class="text-xs text-sky-300 truncate">{{ auth.state.user?.email }}</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto relative z-10">
        <RouterLink v-for="item in NAV_ITEMS" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group"
          :class="$route.path.startsWith(item.to)
            ? 'text-white'
            : 'text-sky-300 hover:text-white hover:bg-white/10'"
          :style="$route.path.startsWith(item.to) ? 'background:rgba(56,189,248,0.2);box-shadow:inset 0 0 0 1px rgba(56,189,248,0.3)' : ''">
          <!-- Active left bar -->
          <span v-if="$route.path.startsWith(item.to)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
            style="background:linear-gradient(180deg,#38bdf8,#0ea5e9)"></span>
          <component :is="item.icon" :size="18" class="flex-shrink-0 transition-transform group-hover:scale-110" />
          <span v-if="!collapsed" class="text-sm font-medium flex-1">{{ item.label }}</span>
          <!-- Badge -->
          <span v-if="item.badge && chuaDoc > 0" class="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
            :style="$route.path.startsWith(item.to) ? 'background:#38bdf8;color:#0c4a6e' : 'background:#ef4444;color:white'">
            {{ chuaDoc > 99 ? '99+' : chuaDoc }}
          </span>
          <span v-if="item.badge && chuaDoc > 0 && collapsed"
            class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2"
            style="border-color:#075985"></span>
        </RouterLink>
      </nav>

      <!-- Bottom -->
      <div class="px-2 py-4 border-t border-white/10 space-y-0.5 relative z-10">
        <RouterLink to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-300 hover:text-white hover:bg-white/10 transition-all">
          <Home :size="18" class="flex-shrink-0" />
          <span v-if="!collapsed" class="text-sm">Về trang chủ</span>
        </RouterLink>
        <button @click="handleLogout"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-300 hover:text-red-300 hover:bg-red-500/10 transition-all w-full">
          <LogOut :size="18" class="flex-shrink-0" />
          <span v-if="!collapsed" class="text-sm">Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Topbar -->
      <header class="h-16 bg-white/90 backdrop-blur-xl border-b border-sky-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
        <button @click="collapsed = !collapsed"
          class="p-2 rounded-xl hover:bg-sky-50 text-gray-500 hover:text-sky-600 transition-all">
          <ChevronRight v-if="collapsed" :size="18" />
          <Menu v-else :size="18" />
        </button>

        <div class="flex items-center gap-3">
          <!-- Bell -->
          <RouterLink to="/admin/feedbacks"
            class="relative p-2 rounded-xl hover:bg-sky-50 transition-colors">
            <Bell :size="18" class="text-gray-500" />
            <span v-if="chuaDoc > 0"
              class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold leading-none"
              style="background:linear-gradient(135deg,#ef4444,#dc2626)">
              {{ chuaDoc > 9 ? '9+' : chuaDoc }}
            </span>
          </RouterLink>

          <!-- Admin avatar -->
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-sky-200"
              style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
              <img v-if="auth.state.user?.avatar" :src="auth.state.user.avatar"
                class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
              <span v-else class="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                {{ auth.state.user?.username?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="hidden sm:block text-sm">
              <p class="font-semibold text-gray-800">{{ auth.state.user?.full_name || auth.state.user?.username }}</p>
              <p class="text-xs text-sky-500">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppConfig } from '../../stores/appConfig'
import api from '../../config/api'
import {
  LayoutDashboard, Users, Images, BarChart2, Leaf, LogOut,
  Menu, ChevronRight, Home, MessageSquare, Bell, Star, Download,
  Headset, MessageCircle, Image as ImageIcon, PackageCheck, DollarSign
} from 'lucide-vue-next'

const auth      = useAuthStore()
const router    = useRouter()
const collapsed = ref(false)
const chuaDoc   = ref(0)
const { appName, appLogo, load: loadConfig } = useAppConfig()
// Dùng state reactive trực tiếp để đảm bảo sync
const { state: appCfg } = useAppConfig()

const NAV_ITEMS = [
  { to: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',          icon: Users,           label: 'Người dùng' },
  { to: '/admin/staff',          icon: Headset,         label: 'Nhân viên' },
  { to: '/admin/chat',           icon: MessageCircle,   label: 'Quản lý Chat' },
  { to: '/admin/images',         icon: Images,          label: 'Ảnh đã tải' },
  { to: '/admin/banners',        icon: ImageIcon,       label: 'Banner' },
  { to: '/admin/ai-stats',       icon: BarChart2,       label: 'Thống kê AI' },
  { to: '/admin/ratings',        icon: Star,            label: 'Đánh giá' },
  { to: '/admin/recycle-orders', icon: PackageCheck,    label: 'Đơn thu mua' },
  { to: '/admin/recycle-prices', icon: DollarSign,      label: 'Giá thu mua' },
  { to: '/admin/app-config',     icon: Download,        label: 'Cài đặt app' },
  { to: '/admin/feedbacks',      icon: MessageSquare,   label: 'Phản hồi', badge: true },
]

onMounted(async () => {
  try {
    const { data } = await api.get('/api/admin/feedbacks?limit=1')
    if (data.success) chuaDoc.value = data.chuaDoc || 0
  } catch {}
  loadConfig()
})

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>
