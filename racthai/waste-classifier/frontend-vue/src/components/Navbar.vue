<template>
  <nav class="sticky top-0 z-50 transition-all duration-300"
    :class="scrolled
      ? 'bg-white/80 backdrop-blur-xl shadow-md border-b border-sky-100'
      : 'bg-white/95 backdrop-blur-sm border-b border-sky-50'">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-sky-sm transition-transform duration-300 group-hover:scale-110"
            style="background: linear-gradient(135deg,#38bdf8,#0ea5e9,#0284c7)">
            <img v-if="appLogo" :src="appLogo" class="w-full h-full object-cover" @error="e => e.target.style.display='none'" />
            <Leaf v-else class="text-white" :size="19" />
          </div>
          <span class="font-bold text-xl gradient-text-static">{{ appName }}</span>
        </RouterLink>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-1">
          <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to"
            class="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            :class="isActive(link.to, link.exact)
              ? 'bg-sky-50 text-sky-700'
              : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'">
            <component :is="link.icon" :size="15" v-if="link.icon" />
            {{ link.label }}
            <!-- Active indicator -->
            <span v-if="isActive(link.to, link.exact)"
              class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
              style="background:linear-gradient(90deg,#38bdf8,#0ea5e9)" />
          </RouterLink>

          <RouterLink v-if="auth.state.user" to="/history"
            class="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            :class="isActive('/history') ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'">
            <History :size="15" /> Lịch sử
            <span v-if="isActive('/history')"
              class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
              style="background:linear-gradient(90deg,#38bdf8,#0ea5e9)" />
          </RouterLink>
        </div>

        <!-- Desktop auth -->
        <div class="hidden md:flex items-center gap-2">
          <template v-if="auth.state.user">
            <div class="relative">
              <button @click="dropdownOpen = !dropdownOpen"
                class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sky-50 transition-all duration-200 group">
                <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-sky-200 group-hover:ring-sky-400 transition-all"
                  style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
                  <img v-if="auth.state.user.avatar" :src="auth.state.user.avatar"
                    class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
                  <span v-else class="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                    {{ initials }}
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {{ auth.state.user.full_name || auth.state.user.username }}
                </span>
                <ChevronDown :size="14" class="text-gray-400 transition-transform duration-200"
                  :class="dropdownOpen ? 'rotate-180' : ''" />
              </button>

              <!-- Dropdown -->
              <Transition enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 scale-95 translate-y-1"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 translate-y-1">
                <div v-if="dropdownOpen"
                  class="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lift border border-sky-100 py-1.5 z-50 overflow-hidden">
                  <div class="px-4 py-3 border-b border-sky-50"
                    style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe)">
                    <p class="text-sm font-semibold text-sky-900 truncate">
                      {{ auth.state.user.full_name || auth.state.user.username }}
                    </p>
                    <p class="text-xs text-sky-500 truncate">{{ auth.state.user.email }}</p>
                  </div>
                  <RouterLink to="/profile" @click="dropdownOpen=false"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors">
                    <UserCog :size="15" class="text-sky-500" /> Tài khoản của tôi
                  </RouterLink>
                  <RouterLink to="/history" @click="dropdownOpen=false"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors">
                    <History :size="15" class="text-blue-500" /> Lịch sử phân loại
                  </RouterLink>
                  <RouterLink v-if="auth.isAdmin.value" to="/admin/dashboard" @click="dropdownOpen=false"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">
                    <Shield :size="15" /> Quản trị Admin
                  </RouterLink>
                  <div class="border-t border-sky-50 my-1" />
                  <button @click="handleLogout"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                    <LogOut :size="15" /> Đăng xuất
                  </button>
                </div>
              </Transition>
            </div>
          </template>

          <template v-else>
            <RouterLink to="/login"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-700 transition-colors rounded-xl hover:bg-sky-50">
              <LogIn :size="15" /> Đăng nhập
            </RouterLink>
            <RouterLink to="/register"
              class="flex items-center gap-1.5 btn-primary text-sm px-4 py-2">
              <UserPlus :size="15" /> Đăng ký
            </RouterLink>
          </template>
        </div>

        <!-- Mobile button -->
        <button @click="menuOpen = !menuOpen"
          class="md:hidden p-2 rounded-xl hover:bg-sky-50 transition-colors">
          <X v-if="menuOpen" :size="20" class="text-sky-600" />
          <Menu v-else :size="20" class="text-gray-600" />
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2">
      <div v-if="menuOpen" class="md:hidden border-t border-sky-100 bg-white/95 backdrop-blur-xl px-4 py-3 space-y-1">
        <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to"
          @click="menuOpen=false"
          class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="isActive(link.to, link.exact) ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-sky-50'">
          <component :is="link.icon" :size="16" v-if="link.icon" />{{ link.label }}
        </RouterLink>

        <template v-if="auth.state.user">
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50">
            <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-sky-200"
              style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
              <img v-if="auth.state.user.avatar" :src="auth.state.user.avatar"
                class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
              <span v-else class="w-full h-full flex items-center justify-center text-white text-sm font-bold">{{ initials }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ auth.state.user.full_name || auth.state.user.username }}</p>
              <p class="text-xs text-sky-500 truncate">{{ auth.state.user.email }}</p>
            </div>
          </div>
          <RouterLink to="/profile" @click="menuOpen=false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-sky-50"
            :class="isActive('/profile') ? 'bg-sky-50 text-sky-700' : ''">
            <UserCog :size="16" class="text-sky-500" /> Tài khoản của tôi
          </RouterLink>
          <RouterLink to="/history" @click="menuOpen=false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
            :class="isActive('/history') ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-sky-50'">
            <History :size="16" /> Lịch sử
          </RouterLink>
          <RouterLink v-if="auth.isAdmin.value" to="/admin/dashboard" @click="menuOpen=false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50">
            <Shield :size="16" /> Quản trị Admin
          </RouterLink>
          <button @click="handleLogout"
            class="flex items-center gap-2 px-3 py-2.5 text-red-600 text-sm font-medium w-full rounded-xl hover:bg-red-50">
            <LogOut :size="16" /> Đăng xuất
          </button>
        </template>
        <template v-else>
          <div class="flex gap-2 pt-2 border-t border-sky-100">
            <RouterLink to="/login" @click="menuOpen=false"
              class="flex-1 text-center py-2.5 text-sm font-medium text-sky-700 border border-sky-200 rounded-xl hover:bg-sky-50">
              Đăng nhập
            </RouterLink>
            <RouterLink to="/register" @click="menuOpen=false"
              class="flex-1 text-center py-2.5 text-sm font-medium text-white rounded-xl"
              style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
              Đăng ký
            </RouterLink>
          </div>
        </template>
      </div>
    </Transition>

    <div v-if="dropdownOpen" class="fixed inset-0 z-40" @click="dropdownOpen=false" />
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppConfig } from '../stores/appConfig'
import {
  Leaf, Camera, MessageCircle, History, LogIn, LogOut,
  UserPlus, Menu, X, Shield, ChevronDown, UserCog, Download
} from 'lucide-vue-next'

const auth       = useAuthStore()
const router     = useRouter()
const route      = useRoute()
const { appName, appLogo, load } = useAppConfig()

const menuOpen    = ref(false)
const dropdownOpen = ref(false)
const scrolled    = ref(false)

const navLinks = [
  { to: '/',         label: 'Trang chủ',    icon: null,          exact: true },
  { to: '/classify', label: 'Phân loại rác', icon: Camera },
  { to: '/chat',     label: 'Hỏi AI',        icon: MessageCircle },
  { to: '/download', label: 'Tải app',       icon: Download },
]

const initials = computed(() => {
  const name = auth.state.user?.full_name || auth.state.user?.username || '?'
  return name.charAt(0).toUpperCase()
})

function isActive(path, exact = false) {
  return exact ? route.path === path : route.path.startsWith(path)
}

function handleScroll() {
  scrolled.value = window.scrollY > 20
}

function handleLogout() {
  auth.logout()
  dropdownOpen.value = false
  menuOpen.value = false
  router.push('/')
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  load()
})
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>
