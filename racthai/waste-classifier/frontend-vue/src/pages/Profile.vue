<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">Tài khoản của tôi</h1>

    <!-- Avatar + tên -->
    <div class="card mb-6 relative overflow-hidden">
      <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-t-2xl" />
      <div class="flex items-center gap-5 pt-1">
        <div class="relative flex-shrink-0">
          <div class="w-20 h-20 rounded-full overflow-hidden bg-sky-100 ring-4 ring-sky-100 ring-offset-2">
            <img v-if="avatarPreview || form.avatar" :src="avatarPreview || form.avatar"
              class="w-full h-full object-cover" @error="e => e.target.style.display='none'" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-2xl font-bold text-sky-600">{{ initials }}</span>
            </div>
          </div>
          <label class="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-sm rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow">
            <Camera :size="14" class="text-white" />
            <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarChange" />
          </label>
        </div>
        <div class="flex-1">
          <p class="font-semibold text-gray-900 text-lg">{{ auth.state.user?.full_name || auth.state.user?.username }}</p>
          <p class="text-sm text-gray-500">{{ auth.state.user?.email }}</p>
          <span class="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium animate-scale-in"
            :class="auth.state.user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'">
            <Shield v-if="auth.state.user?.role === 'admin'" :size="11" /><User v-else :size="11" />
            {{ auth.state.user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng' }}
          </span>
        </div>
        <button v-if="avatarFile" @click="uploadAvatar" :disabled="avatarLoading" class="btn-primary text-sm px-3 py-2 flex-shrink-0">
          <Loader2 v-if="avatarLoading" :size="14" class="animate-spin" /><Check v-else :size="14" />
          {{ avatarLoading ? 'Đang lưu...' : 'Lưu ảnh' }}
        </button>
      </div>
    </div>

    <!-- Tabs điều hướng -->
    <div class="flex gap-1 mb-6 bg-gray-100 shadow-inner p-1 rounded-xl">
      <button v-for="t in TABS" :key="t.key" @click="activeTab = t.key"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative"
        :class="activeTab === t.key
          ? 'bg-gradient-to-r from-white to-sky-50/50 text-sky-700 shadow-md font-semibold'
          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'">
        <component :is="t.icon" :size="15" />
        <span class="hidden sm:inline">{{ t.label }}</span>
        <!-- Badge phản hồi chưa đọc -->
        <span v-if="t.key === 'feedbacks' && unrepliedCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {{ unrepliedCount }}
        </span>
      </button>
    </div>

    <!-- ── TAB: THÔNG TIN ── -->
    <template v-if="activeTab === 'info'">
      <div class="card mb-6">
        <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCog :size="18" class="text-sky-600" /> Thông tin cá nhân
        </h2>
        <form @submit.prevent="saveProfile" class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
              <input v-model="form.full_name" type="text" class="input-field" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
              <input v-model="form.username" type="text" class="input-field" placeholder="username" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div class="relative">
              <Mail :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="form.email" type="email" class="input-field pl-9" placeholder="your@email.com" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
            <div class="relative">
              <Phone :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="form.phone" type="tel" class="input-field pl-9" placeholder="0901234567" />
            </div>
          </div>
          <button type="submit" :disabled="profileLoading" class="btn-primary w-full py-2.5">
            <Loader2 v-if="profileLoading" :size="16" class="animate-spin" /><Save v-else :size="16" />
            {{ profileLoading ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </form>
      </div>

      <!-- Thống kê -->
      <div class="card">
        <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 :size="18" class="text-sky-600" /> Thống kê của tôi
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-sky-700 tabular-nums">{{ stats.totalClassify }}</p>
            <p class="text-xs text-sky-600 mt-1">Lần phân loại</p>
          </div>
          <div class="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-blue-700 tabular-nums">{{ stats.totalChat }}</p>
            <p class="text-xs text-blue-600 mt-1">Câu hỏi AI</p>
          </div>
          <div class="bg-purple-50 rounded-xl p-4 text-center col-span-2">
            <p class="text-sm text-gray-600">Tham gia từ</p>
            <p class="font-semibold text-gray-800 mt-0.5">{{ formatDate(auth.state.user?.created_at) }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ── TAB: BẢO MẬT ── -->
    <template v-if="activeTab === 'security'">
      <div class="card">
        <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock :size="18" class="text-sky-600" /> Đổi mật khẩu
        </h2>
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <div class="relative">
              <input v-model="pwForm.current" :type="showPw.current ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" />
              <button type="button" @click="showPw.current = !showPw.current" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:bg-gray-100 rounded-full p-0.5 transition-colors">
                <EyeOff v-if="showPw.current" :size="16" /><Eye v-else :size="16" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <div class="relative">
              <input v-model="pwForm.newPw" :type="showPw.newPw ? 'text' : 'password'" class="input-field pr-10" placeholder="Ít nhất 6 ký tự" />
              <button type="button" @click="showPw.newPw = !showPw.newPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:bg-gray-100 rounded-full p-0.5 transition-colors">
                <EyeOff v-if="showPw.newPw" :size="16" /><Eye v-else :size="16" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <div class="relative">
              <input v-model="pwForm.confirm" :type="showPw.confirm ? 'text' : 'password'" class="input-field pr-10" placeholder="Nhập lại mật khẩu mới" />
              <button type="button" @click="showPw.confirm = !showPw.confirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:bg-gray-100 rounded-full p-0.5 transition-colors">
                <EyeOff v-if="showPw.confirm" :size="16" /><Eye v-else :size="16" />
              </button>
            </div>
          </div>
          <button type="submit" :disabled="pwLoading" class="btn-primary w-full py-2.5">
            <Loader2 v-if="pwLoading" :size="16" class="animate-spin" /><KeyRound v-else :size="16" />
            {{ pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}
          </button>
        </form>
      </div>
    </template>

    <!-- ── TAB: ĐÁNH GIÁ ── -->
    <template v-if="activeTab === 'ratings'">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2">
            <Star :size="18" class="text-yellow-500" fill="currentColor" /> Lịch sử đánh giá
          </h2>
          <button @click="loadMyRatings" class="text-xs text-sky-600 hover:underline flex items-center gap-1">
            <RefreshCw :size="12" /> Làm mới
          </button>
        </div>

        <div v-if="ratLoading" class="flex justify-center py-8">
          <Loader2 class="animate-spin text-yellow-400" :size="28" />
        </div>

        <div v-else-if="!myRatings.length" class="text-center py-10">
          <Star :size="32" class="mx-auto text-gray-300 mb-2" />
          <p class="text-gray-400 text-sm">Bạn chưa có đánh giá nào</p>
          <RouterLink to="/classify" class="text-sky-600 text-sm mt-1 inline-block hover:underline">
            Phân loại ảnh để đánh giá →
          </RouterLink>
        </div>

        <div v-else class="space-y-4">
          <div v-for="r in myRatings" :key="r.id"
            class="border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            :class="r.admin_reply ? 'border-sky-200' : 'border-gray-200'">

            <!-- Header: ảnh + sao -->
            <div class="flex items-start gap-3 p-4">
              <!-- Thumbnail ảnh -->
              <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img v-if="r.image_path" :src="r.image_path"
                  class="w-full h-full object-cover"
                  @error="e => e.target.style.display='none'" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Image :size="20" class="text-gray-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-700 truncate mb-1">
                  {{ r.original_filename || 'Ảnh chụp' }}
                </p>
                <!-- Sao hiển thị / sửa -->
                <div v-if="editingRating !== r.id">
                  <div class="flex gap-0.5 mb-1">
                    <Star v-for="s in 5" :key="s" :size="16"
                      :class="s <= r.stars ? 'text-yellow-400' : 'text-gray-300'"
                      :fill="s <= r.stars ? 'currentColor' : 'none'" />
                  </div>
                  <p v-if="r.comment" class="text-xs text-gray-500 line-clamp-2">{{ r.comment }}</p>
                  <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock :size="10" /> {{ formatDate(r.created_at) }}
                  </p>
                </div>
                <!-- Form sửa inline -->
                <div v-else class="mt-1 space-y-2">
                  <div class="flex gap-1">
                    <button v-for="s in 5" :key="s" @click="editRatingForm.stars = s"
                      class="transition-transform hover:scale-110">
                      <Star :size="22"
                        :class="s <= editRatingForm.stars ? 'text-yellow-400' : 'text-gray-300'"
                        :fill="s <= editRatingForm.stars ? 'currentColor' : 'none'" />
                    </button>
                  </div>
                  <textarea v-model="editRatingForm.comment" rows="2"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Nhận xét..." />
                  <div class="flex gap-2">
                    <button @click="saveEditRating(r)" :disabled="editRatLoading"
                      class="flex-1 flex items-center justify-center gap-1 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg disabled:opacity-50">
                      <Loader2 v-if="editRatLoading" :size="12" class="animate-spin" />
                      <Check v-else :size="12" /> Lưu
                    </button>
                    <button @click="cancelEditRating"
                      class="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 rounded-lg hover:bg-gray-50">
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
              <!-- Nút sửa / xóa -->
              <div v-if="editingRating !== r.id" class="flex gap-1 flex-shrink-0">
                <button @click="startEditRating(r)"
                  class="p-1.5 hover:bg-yellow-50 text-yellow-500 hover:text-yellow-600 rounded-lg transition-colors">
                  <Pencil :size="14" />
                </button>
                <button @click="deleteRating(r.id)"
                  class="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Reply của admin -->
            <div v-if="r.admin_reply"
              class="px-4 pb-4 flex gap-2.5">
              <div class="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield :size="11" class="text-white" />
              </div>
              <div class="flex-1 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 shadow-sm">
                <p class="text-xs font-semibold text-sky-700 mb-1">Admin phản hồi</p>
                <p class="text-sm text-sky-900 whitespace-pre-wrap">{{ r.admin_reply }}</p>
                <p class="text-xs text-sky-500 mt-1">{{ formatDate(r.replied_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── TAB: PHẢN HỒI ── -->
    <template v-if="activeTab === 'feedbacks'">
      <!-- Form gửi phản hồi mới -->
      <div class="card mb-6 relative overflow-hidden">
        <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-t-2xl" />
        <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2 pt-1">
          <Send :size="18" class="text-sky-600" /> Gửi phản hồi cho Admin
        </h2>
        <form @submit.prevent="sendFeedback" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề</label>
            <input v-model="feedbackForm.subject" type="text" class="input-field"
              placeholder="Vd: Góp ý tính năng, Báo lỗi..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nội dung</label>
            <textarea v-model="feedbackForm.message" rows="4" class="input-field resize-none"
              placeholder="Nhập nội dung phản hồi của bạn..."></textarea>
          </div>
          <button type="submit" :disabled="feedbackLoading" class="btn-primary w-full py-2.5">
            <Loader2 v-if="feedbackLoading" :size="16" class="animate-spin" /><Send v-else :size="16" />
            {{ feedbackLoading ? 'Đang gửi...' : 'Gửi phản hồi' }}
          </button>
        </form>
      </div>

      <!-- Lịch sử phản hồi -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2">
            <History :size="18" class="text-sky-600" /> Lịch sử phản hồi
          </h2>
          <button @click="loadMyFeedbacks" class="text-xs text-sky-600 hover:underline flex items-center gap-1">
            <RefreshCw :size="12" /> Làm mới
          </button>
        </div>

        <div v-if="fbLoading" class="flex justify-center py-8">
          <Loader2 class="animate-spin text-sky-500" :size="28" />
        </div>

        <div v-else-if="!myFeedbacks.length" class="text-center py-10">
          <MessageSquare :size="32" class="mx-auto text-gray-300 mb-2" />
          <p class="text-gray-400 text-sm">Bạn chưa gửi phản hồi nào</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="fb in myFeedbacks" :key="fb.id"
            class="border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            :class="{
              'border-red-200 bg-red-50/30':    fb.status === 'pending',
              'border-yellow-200 bg-yellow-50/30': fb.status === 'read',
              'border-sky-200 bg-sky-50/30':  fb.status === 'replied'
            }">
            <!-- Header feedback -->
            <div class="px-4 py-3 flex items-start justify-between gap-2 border-b border-current/10">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm truncate">{{ fb.subject }}</p>
                <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock :size="10" /> {{ formatDate(fb.created_at) }}
                </p>
              </div>
              <span class="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                :class="{
                  'bg-red-100 text-red-600':      fb.status === 'pending',
                  'bg-yellow-100 text-yellow-700': fb.status === 'read',
                  'bg-sky-100 text-sky-700':   fb.status === 'replied'
                }">
                {{ STATUS_MAP[fb.status] }}
              </span>
            </div>

            <!-- Cuộc hội thoại -->
            <div class="p-4 space-y-3">
              <!-- Tin nhắn của mình -->
              <div class="flex gap-2.5">
                <div class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <User :size="13" class="text-white" />
                </div>
                <div class="flex-1">
                  <div class="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                    <p class="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{{ fb.message }}</p>
                  </div>
                </div>
              </div>

              <!-- Phản hồi của Admin -->
              <div v-if="fb.admin_reply" class="flex gap-2.5 flex-row-reverse">
                <div class="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                  <Shield :size="13" class="text-white" />
                </div>
                <div class="flex-1">
                  <div class="bg-sky-50 border border-sky-200 rounded-xl rounded-tr-sm px-3 py-2.5">
                    <p class="text-xs font-semibold text-sky-700 mb-1 flex items-center gap-1">
                      <Shield :size="10" /> Admin trả lời
                    </p>
                    <p class="text-sm text-sky-900 whitespace-pre-wrap leading-relaxed">{{ fb.admin_reply }}</p>
                    <p class="text-xs text-sky-500 mt-1 text-right">{{ formatDate(fb.replied_at) }}</p>
                  </div>
                </div>
              </div>

              <!-- Chờ phản hồi -->
              <div v-else class="flex items-center gap-2 text-xs text-gray-400 ml-9">
                <div class="flex gap-1">
                  <span class="w-1.5 h-1.5 bg-sky-300 rounded-full animate-bounce" style="animation-delay:0ms" />
                  <span class="w-1.5 h-1.5 bg-sky-300 rounded-full animate-bounce" style="animation-delay:150ms" />
                  <span class="w-1.5 h-1.5 bg-sky-300 rounded-full animate-bounce" style="animation-delay:300ms" />
                </div>
                Đang chờ Admin phản hồi...
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import api from '../config/api'
import { useAuthStore } from '../stores/auth'
import {
  Camera, User, Shield, Mail, Phone, Save, Lock, Eye, EyeOff,
  Loader2, Check, UserCog, KeyRound, BarChart2, MessageSquare,
  Send, History, RefreshCw, Clock, Star, Pencil, Trash2, Image
} from 'lucide-vue-next'

const auth  = useAuthStore()
const toast = useToast()

const TABS = [
  { key: 'info',      label: 'Thông tin',  icon: UserCog },
  { key: 'security',  label: 'Bảo mật',   icon: Lock },
  { key: 'ratings',   label: 'Đánh giá',  icon: Star },
  { key: 'feedbacks', label: 'Phản hồi',  icon: MessageSquare },
]
const STATUS_MAP = { pending: '⏳ Chờ phản hồi', read: '👁 Đã xem', replied: '✅ Đã trả lời' }

const activeTab = ref('info')

// ── Form state ──
const form       = reactive({ full_name: '', username: '', email: '', phone: '', avatar: '' })
const pwForm     = reactive({ current: '', newPw: '', confirm: '' })
const showPw     = reactive({ current: false, newPw: false, confirm: false })
const feedbackForm = reactive({ subject: '', message: '' })

// ── Loading ──
const avatarFile      = ref(null)
const avatarPreview   = ref(null)
const avatarLoading   = ref(false)
const profileLoading  = ref(false)
const pwLoading       = ref(false)
const feedbackLoading = ref(false)
const fbLoading       = ref(false)

// ── Ratings state ──
const myRatings      = ref([])
const ratLoading     = ref(false)
const editingRating  = ref(null)   // id đang sửa
const editRatingForm = reactive({ stars: 0, comment: '' })
const editRatLoading = ref(false)

// ── Data ──
const stats       = reactive({ totalClassify: 0, totalChat: 0 })
const myFeedbacks = ref([])
const unrepliedCount = computed(() =>
  myFeedbacks.value.filter(f => f.status !== 'replied').length
)

const initials = computed(() => {
  const name = auth.state.user?.full_name || auth.state.user?.username || '?'
  return name.charAt(0).toUpperCase()
})

onMounted(async () => {
  const u = auth.state.user
  if (u) {
    form.full_name = u.full_name || ''
    form.username  = u.username  || ''
    form.email     = u.email     || ''
    form.phone     = u.phone     || ''
    form.avatar    = u.avatar    || ''
  }
  try {
    const [c, ch] = await Promise.all([
      api.get('/api/history/classifications?limit=1'),
      api.get('/api/history/chats?limit=1')
    ])
    stats.totalClassify = c.data.pagination?.total || 0
    stats.totalChat     = ch.data.chats?.length    || 0
  } catch {}
  // Load feedback ngay lần đầu
  await loadMyFeedbacks()
})

// Khi chuyển sang tab feedbacks thì refresh
watch(activeTab, (val) => {
  if (val === 'feedbacks') loadMyFeedbacks()
  if (val === 'ratings')   loadMyRatings()
})

// ── Handlers ──
function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return }
  avatarFile.value    = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function uploadAvatar() {
  if (!avatarFile.value) return
  avatarLoading.value = true
  try {
    const fd = new FormData()
    fd.append('avatar', avatarFile.value)
    const { data } = await api.post('/api/auth/avatar', fd)
    if (data.success) {
      auth.state.user.avatar = data.avatar
      form.avatar = data.avatar
      avatarFile.value = null
      toast.success('Cập nhật ảnh đại diện thành công!')
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể tải ảnh lên')
  } finally { avatarLoading.value = false }
}

async function saveProfile() {
  profileLoading.value = true
  try {
    const { data } = await api.put('/api/auth/profile', {
      username: form.username || undefined,
      email:    form.email    || undefined,
      phone:    form.phone,
      full_name: form.full_name
    })
    if (data.success) {
      Object.assign(auth.state.user, data.user)
      toast.success('Cập nhật thông tin thành công!')
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể cập nhật')
  } finally { profileLoading.value = false }
}

async function changePassword() {
  if (pwForm.newPw !== pwForm.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return }
  if (pwForm.newPw.length < 6) { toast.error('Mật khẩu mới phải ít nhất 6 ký tự'); return }
  pwLoading.value = true
  try {
    const { data } = await api.put('/api/auth/change-password', {
      currentPassword: pwForm.current,
      newPassword: pwForm.newPw
    })
    if (data.success) {
      pwForm.current = ''; pwForm.newPw = ''; pwForm.confirm = ''
      toast.success('Đổi mật khẩu thành công!')
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể đổi mật khẩu')
  } finally { pwLoading.value = false }
}

async function sendFeedback() {
  if (!feedbackForm.subject || !feedbackForm.message) { toast.error('Vui lòng điền đầy đủ'); return }
  feedbackLoading.value = true
  try {
    const u = auth.state.user
    const { data } = await api.post('/api/auth/feedback', {
      name:    u?.full_name || u?.username || 'Người dùng',
      email:   u?.email || '',
      subject: feedbackForm.subject,
      message: feedbackForm.message
    })
    if (data.success) {
      feedbackForm.subject = ''; feedbackForm.message = ''
      toast.success('Gửi phản hồi thành công! Admin sẽ trả lời sớm.')
      await loadMyFeedbacks()
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể gửi phản hồi')
  } finally { feedbackLoading.value = false }
}

async function loadMyRatings() {
  ratLoading.value = true
  try {
    const { data } = await api.get('/api/ratings/my')
    if (data.success) myRatings.value = data.ratings
  } catch {}
  finally { ratLoading.value = false }
}

function startEditRating(r) {
  editingRating.value    = r.id
  editRatingForm.stars   = r.stars
  editRatingForm.comment = r.comment || ''
}

function cancelEditRating() {
  editingRating.value    = null
  editRatingForm.stars   = 0
  editRatingForm.comment = ''
}

async function saveEditRating(r) {
  if (!editRatingForm.stars) { toast.error('Vui lòng chọn số sao'); return }
  editRatLoading.value = true
  try {
    const { data } = await api.put(`/api/ratings/${r.id}`, {
      stars:   editRatingForm.stars,
      comment: editRatingForm.comment || null
    })
    if (data.success) {
      const idx = myRatings.value.findIndex(x => x.id === r.id)
      if (idx !== -1) {
        myRatings.value[idx].stars   = editRatingForm.stars
        myRatings.value[idx].comment = editRatingForm.comment
        myRatings.value[idx].admin_reply = null
        myRatings.value[idx].replied_at  = null
      }
      cancelEditRating()
      toast.success('Đã cập nhật đánh giá!')
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể cập nhật')
  } finally { editRatLoading.value = false }
}

async function deleteRating(id) {
  if (!confirm('Xóa đánh giá này?')) return
  try {
    await api.delete(`/api/ratings/${id}`)
    myRatings.value = myRatings.value.filter(r => r.id !== id)
    toast.success('Đã xóa đánh giá')
  } catch { toast.error('Không thể xóa') }
}

async function loadMyFeedbacks() {
  fbLoading.value = true
  try {
    const { data } = await api.get('/api/auth/my-feedbacks')
    if (data.success) myFeedbacks.value = data.feedbacks
  } catch { /* không hiện lỗi nếu chưa login */ }
  finally { fbLoading.value = false }
}

function formatDate(d) {
  if (!d) return '---'
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>
