<template>
  <div class="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900 overflow-hidden">
    <!-- Floating blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-20 -left-20 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl animate-float" />
      <div class="absolute -bottom-20 -right-20 w-96 h-96 bg-sky-300/15 rounded-full blur-3xl animate-float" style="animation-delay:2s" />
    </div>

    <div class="relative z-10 w-full max-w-md animate-scale-in">
      <div class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lift border border-white/50 p-8">
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-md rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in overflow-hidden">
            <img v-if="appLogo" :src="appLogo" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
            <Leaf v-else :size="26" class="text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p class="text-gray-500 text-sm mt-1">Tham gia {{ appName }} để lưu lịch sử</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tên đăng nhập</label>
            <input v-model="form.username" type="text" class="input-field" placeholder="username" autofocus :disabled="loading" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input v-model="form.email" type="email" class="input-field" placeholder="your@email.com" :disabled="loading" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
            <div class="relative">
              <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="Tối thiểu 6 ký tự" :disabled="loading" />
              <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors">
                <EyeOff v-if="showPass" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
            <!-- Password strength -->
            <div v-if="strength" class="mt-1.5 transition-all duration-300">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium" :class="strength.color">{{ strength.text }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" :class="[strength.bg, strength.w]" />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
            <div class="relative">
              <input v-model="form.confirm" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="Nhập lại mật khẩu" :disabled="loading" />
              <CheckCircle v-if="form.confirm && form.password === form.confirm" :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-sky-500 animate-scale-in" />
            </div>
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full py-3 shadow-sky-sm hover:shadow-sky-md">
            <Loader2 v-if="loading" :size="18" class="animate-spin" />
            <UserPlus v-else :size="18" />
            {{ loading ? 'Đang đăng ký...' : 'Tạo tài khoản' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-500">
            Đã có tài khoản?
            <RouterLink to="/login" class="text-sky-600 font-medium hover:underline">Đăng nhập</RouterLink>
          </p>
        </div>
      </div>

      <p class="text-center text-sm mt-4">
        <RouterLink to="/classify" class="text-sky-200/70 hover:text-sky-100 transition-colors">Tiếp tục không cần đăng nhập →</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '../stores/auth'
import { useAppConfig } from '../stores/appConfig'
import { Leaf, Loader2, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-vue-next'

const { appName, appLogo } = useAppConfig()

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = reactive({ username: '', email: '', password: '', confirm: '' })
const loading = ref(false)
const showPass = ref(false)

const strength = computed(() => {
  const p = form.password
  if (!p) return null
  if (p.length < 6) return { text: 'Yếu',      color: 'text-red-500',    bg: 'bg-red-400',    w: 'w-1/4' }
  if (p.length < 8) return { text: 'Trung bình',color: 'text-yellow-600', bg: 'bg-yellow-400', w: 'w-1/2' }
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(p)) return { text: 'Mạnh', color: 'text-sky-600', bg: 'bg-sky-500', w: 'w-full' }
  return { text: 'Khá', color: 'text-blue-600', bg: 'bg-blue-400', w: 'w-3/4' }
})

function validate() {
  if (!form.username || !form.email || !form.password || !form.confirm) {
    toast.error('Vui lòng điền đầy đủ thông tin'); return false
  }
  if (form.username.length < 3) { toast.error('Tên đăng nhập phải ít nhất 3 ký tự'); return false }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Email không hợp lệ'); return false }
  if (form.password.length < 6) { toast.error('Mật khẩu phải ít nhất 6 ký tự'); return false }
  if (form.password !== form.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return false }
  return true
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    const data = await auth.register(form.username, form.email, form.password)
    if (data.success) {
      toast.success('Đăng ký thành công! Chào mừng bạn 🎉')
      router.push('/')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Đăng ký thất bại')
  } finally {
    loading.value = false
  }
}
</script>
