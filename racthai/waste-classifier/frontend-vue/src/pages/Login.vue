<template>
  <div class="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900 overflow-hidden">
    <!-- Floating blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-20 -left-20 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl animate-float" />
      <div class="absolute -bottom-20 -right-20 w-96 h-96 bg-sky-300/15 rounded-full blur-3xl animate-float" style="animation-delay:2s" />
    </div>

    <div class="relative z-10 w-full max-w-md animate-scale-in">
      <div class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lift border border-white/50 p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-md rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in overflow-hidden">
            <img v-if="appLogo" :src="appLogo" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
            <Leaf v-else :size="26" class="text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p class="text-gray-500 text-sm mt-1">Chào mừng bạn quay lại {{ appName }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input v-model="form.email" type="email" class="input-field" placeholder="your@email.com" autofocus :disabled="loading" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
            <div class="relative">
              <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" :disabled="loading" />
              <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors">
                <EyeOff v-if="showPass" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full py-3 shadow-sky-sm hover:shadow-sky-md">
            <Loader2 v-if="loading" :size="18" class="animate-spin" />
            <LogIn v-else :size="18" />
            {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-500">
            Chưa có tài khoản?
            <RouterLink to="/register" class="text-sky-600 font-medium hover:underline">Đăng ký ngay</RouterLink>
          </p>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100 text-center">
          <p class="text-xs text-gray-400 mb-2">Tài khoản demo Admin:</p>
          <code class="text-xs bg-gray-900/60 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">admin@waste.com / Admin@123</code>
        </div>
      </div>

      <p class="text-center text-sm mt-4">
        <RouterLink to="/classify" class="text-sky-200/70 hover:text-sky-100 transition-colors">Tiếp tục không cần đăng nhập →</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '../stores/auth'
import { useAppConfig } from '../stores/appConfig'
import { Leaf, Loader2, Eye, EyeOff, LogIn } from 'lucide-vue-next'

const { appName, appLogo } = useAppConfig()

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const showPass = ref(false)

async function handleSubmit() {
  if (!form.email || !form.password) {
    toast.error('Vui lòng điền đầy đủ thông tin')
    return
  }
  loading.value = true
  try {
    const data = await auth.login(form.email, form.password)
    if (data.success) {
      toast.success(`Chào mừng ${data.user.username}! 👋`)
      router.push('/')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Đăng nhập thất bại')
  } finally {
    loading.value = false
  }
}
</script>
