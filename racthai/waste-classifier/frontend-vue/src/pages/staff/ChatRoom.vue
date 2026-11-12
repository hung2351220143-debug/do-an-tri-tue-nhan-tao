<template>
  <div class="flex flex-col h-full">
    <!-- Chat Header -->
    <div class="flex items-center gap-4 px-5 py-4 border-b border-sky-50 flex-shrink-0">
      <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
        style="background:linear-gradient(135deg,#bae6fd,#7dd3fc);color:#0369a1">
        {{ (chat.user_name || chat.guest_name || 'K').charAt(0).toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900">{{ chat.user_name || chat.guest_name || 'Khách vãng lai' }}</p>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded-full font-medium"
            :class="{
              'bg-yellow-100 text-yellow-700': localStatus==='waiting',
              'bg-sky-100 text-sky-700':       localStatus==='active',
              'bg-gray-100 text-gray-500':     localStatus==='closed'
            }">
            {{ { waiting:'⏳ Chờ nhân viên', active:'💬 Đang hỗ trợ', closed:'✅ Đã kết thúc' }[localStatus] }}
          </span>
          <span v-if="partnerTyping" class="text-xs text-sky-400 italic animate-pulse">Đang nhập...</span>
        </div>
      </div>
      <!-- Search inline -->
      <div class="relative hidden sm:block">
        <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchQuery" type="text" placeholder="Tìm tin nhắn..."
          class="pl-7 pr-7 py-1.5 text-xs rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 w-40" />
        <button v-if="searchQuery" @click="searchQuery=''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X :size="11" />
        </button>
      </div>
      <div class="flex items-center gap-2">
        <!-- Xem ảnh phân loại của khách -->
        <button v-if="chat.user_id" @click="showUserImages = !showUserImages"
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors">
          <Image :size="14" /> Ảnh phân loại
        </button>
        <!-- Nhận chat nếu waiting -->
        <button v-if="localStatus==='waiting'" @click="joinChat"
          class="text-sm px-4 py-2 rounded-xl text-white font-medium transition-all"
          style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
          Nhận hỗ trợ
        </button>
        <!-- Đóng chat -->
        <button v-if="localStatus==='active'" @click="closeChat"
          class="text-sm px-4 py-2 rounded-xl text-red-600 border border-red-200 hover:bg-red-50 transition-all">
          Kết thúc
        </button>
      </div>
    </div>

    <!-- Mobile search bar -->
    <div class="sm:hidden px-5 py-2 border-b border-sky-50 flex-shrink-0">
      <div class="relative">
        <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm tin nhắn..."
          class="w-full pl-7 pr-7 py-1.5 text-xs rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        <button v-if="searchQuery" @click="searchQuery=''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X :size="11" />
        </button>
      </div>
    </div>

    <!-- User images panel -->
    <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
      <div v-if="showUserImages && userImages.length" class="px-5 py-3 bg-sky-50 border-b border-sky-100">
        <p class="text-xs font-semibold text-sky-700 mb-2">Ảnh phân loại rác của khách:</p>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <div v-for="img in userImages" :key="img.id"
            class="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-sky-200 cursor-pointer hover:opacity-80"
            @click="lightbox = img.image_path">
            <img :src="img.image_path" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      <div v-if="loadingMessages" class="flex justify-center py-8">
        <Loader2 class="animate-spin text-sky-400" :size="24" />
      </div>
      <template v-else>
        <div v-for="msg in filteredMessages" :key="msg.id">
          <!-- System -->
          <div v-if="msg.sender_type==='system'" class="text-center my-2">
            <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{{ msg.message }}</span>
          </div>

          <!-- Staff message (bên PHẢI) -->
          <div v-else-if="msg.sender_type==='staff'" class="flex justify-end gap-2.5">
            <div class="max-w-[65%]">
              <!-- Tên nhân viên -->
              <p class="text-xs text-gray-400 mb-1 text-right">
                {{ msg.full_name || msg.username || 'Nhân viên' }}
              </p>
              <!-- File -->
              <div v-if="msg.file_url" class="mb-1 flex justify-end">
                <img v-if="msg.file_type?.startsWith('image/')"
                  :src="msg.file_url" class="max-w-full max-h-48 rounded-xl border cursor-pointer"
                  @click="lightbox=msg.file_url" />
                <a v-else :href="msg.file_url" target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-sky-100 border border-sky-300 text-sky-800">
                  <Paperclip :size="14" />{{ msg.file_name||'File' }}
                </a>
              </div>
              <!-- Text -->
              <div v-if="msg.message"
                class="px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed break-words text-white"
                style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">
                {{ msg.message }}
              </div>
              <p class="text-xs text-gray-400 mt-1 text-right">
                {{ formatTime(msg.created_at) }}
                <span v-if="msg.is_read" class="ml-1 text-sky-400">✓✓</span>
              </p>
            </div>
            <!-- Avatar nhân viên -->
            <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-white mt-5"
              style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">
              {{ (msg.full_name||msg.username||'NV').charAt(0).toUpperCase() }}
            </div>
          </div>

          <!-- User/Khách message (bên TRÁI) -->
          <div v-else class="flex justify-start gap-2.5">
            <!-- Avatar khách -->
            <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm mt-5"
              style="background:linear-gradient(135deg,#bae6fd,#7dd3fc);color:#0369a1">
              {{ (chat.user_name||chat.guest_name||'K').charAt(0).toUpperCase() }}
            </div>
            <div class="max-w-[65%]">
              <!-- Tên khách -->
              <p class="text-xs text-gray-400 mb-1">
                {{ chat.user_name || chat.guest_name || 'Khách' }}
              </p>
              <!-- File -->
              <div v-if="msg.file_url" class="mb-1">
                <img v-if="msg.file_type?.startsWith('image/')"
                  :src="msg.file_url" class="max-w-full max-h-48 rounded-xl border cursor-pointer"
                  @click="lightbox=msg.file_url" />
                <a v-else :href="msg.file_url" target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white border border-gray-200 text-gray-700">
                  <Paperclip :size="14" />{{ msg.file_name||'File' }}
                </a>
              </div>
              <!-- Text -->
              <div v-if="msg.message"
                class="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed break-words bg-gray-100 text-gray-800">
                {{ msg.message }}
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ formatTime(msg.created_at) }}</p>
            </div>
          </div>
        </div>
        <!-- Typing indicator -->
        <div v-if="partnerTyping" class="flex gap-2.5">
          <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
            style="background:linear-gradient(135deg,#bae6fd,#7dd3fc);color:#0369a1">K</div>
          <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms" />
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms" />
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Input -->
    <div v-if="localStatus !== 'closed'" class="px-5 py-4 border-t border-sky-50 flex-shrink-0">
      <div class="flex items-end gap-3">
        <!-- File upload -->
        <label class="cursor-pointer text-sky-400 hover:text-sky-600 transition-colors p-2 rounded-xl hover:bg-sky-50 flex-shrink-0">
          <Paperclip :size="20" />
          <input type="file" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xlsx" @change="sendFile" />
        </label>
        <!-- Camera capture -->
        <label class="cursor-pointer text-sky-400 hover:text-sky-600 transition-colors p-2 rounded-xl hover:bg-sky-50 flex-shrink-0">
          <Camera :size="20" />
          <input type="file" class="hidden" accept="image/*" capture="environment" @change="sendFile" />
        </label>
        <div class="flex-1 relative">
          <textarea v-model="inputMsg"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.ctrl.enter="inputMsg += '\n'"
            @input="onTyping"
            rows="1"
            placeholder="Nhắn tin cho khách... (Enter gửi, Ctrl+Enter xuống dòng)"
            class="w-full px-4 py-3 rounded-2xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm resize-none max-h-32 overflow-y-auto" />
        </div>
        <button @click="sendMessage" :disabled="!inputMsg.trim()"
          class="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:scale-105 flex-shrink-0"
          style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
          <Send :size="18" />
        </button>
      </div>
      <p class="text-xs text-gray-400 mt-1 ml-14">Enter để gửi · Ctrl+Enter xuống dòng</p>
    </div>
    <div v-else class="px-5 py-4 border-t border-sky-50 text-center text-sm text-gray-400">
      Cuộc hội thoại đã kết thúc
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightbox" class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
        @click="lightbox=null">
        <img :src="lightbox" class="max-w-full max-h-full rounded-xl object-contain" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Send, Paperclip, Image, Loader2, Search, X, Camera } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useSocket } from '../../stores/socket'
import api from '../../config/api'

const props = defineProps({ chat: Object })
const emit  = defineEmits(['closed', 'joined'])

const auth = useAuthStore()
const { on, off, emit: socketEmit, connect } = useSocket()

const messages        = ref([])
const inputMsg        = ref('')
const loadingMessages = ref(true)
const partnerTyping   = ref(false)
const messagesEl      = ref(null)
const localStatus     = ref(props.chat?.status || 'waiting')
const showUserImages  = ref(false)
const userImages      = ref([])
const lightbox        = ref(null)
const searchQuery     = ref('')
let typingTimer = null

// Computed: lọc tin nhắn theo search
const filteredMessages = computed(() => {
  if (!searchQuery.value.trim()) return messages.value
  const q = searchQuery.value.toLowerCase()
  return messages.value.filter(m => m.message?.toLowerCase().includes(q))
})

function scrollBottom() {
  nextTick(() => { if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight })
}

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

async function loadMessages() {
  loadingMessages.value = true
  try {
    const { data } = await api.get(`/api/staff-chat/${props.chat.id}/messages?limit=100`)
    if (data.success) messages.value = data.messages
    scrollBottom()
  } catch {}
  finally { loadingMessages.value = false }
}

async function loadUserImages() {
  if (!props.chat?.user_id) return
  try {
    const { data } = await api.get(`/api/history/classifications?limit=20`)
    if (data.success) userImages.value = data.classifications?.slice(0,10) || []
  } catch {}
}

function joinChat() {
  const socket = connect(localStorage.getItem('token'))
  socket.emit('staff_join_chat', { chatId: props.chat.id })
}

function closeChat() {
  if (!confirm('Kết thúc cuộc hội thoại này?')) return
  socketEmit('close_chat', { chatId: props.chat.id })
}

function sendMessage() {
  const msg = inputMsg.value.trim()
  if (!msg) return
  inputMsg.value = ''
  socketEmit('send_message', { chatId: props.chat.id, message: msg })
  socketEmit('typing', { chatId: props.chat.id, isTyping: false })
}

async function sendFile(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post('/api/staff-chat/upload', fd)
    if (data.success) {
      socketEmit('send_message', {
        chatId: props.chat.id,
        fileUrl: data.fileUrl, fileName: data.fileName, fileType: data.fileType
      })
    }
  } catch { alert('Upload thất bại') }
  e.target.value = ''
}

function onTyping() {
  socketEmit('typing', { chatId: props.chat.id, isTyping: true })
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => socketEmit('typing', { chatId: props.chat.id, isTyping: false }), 1500)
}

onMounted(async () => {
  await loadMessages()
  loadUserImages()

  // Join room
  const socket = connect(localStorage.getItem('token'))
  socket.emit('staff_connect')

  on('new_message', (msg) => {
    if (msg.chatId === props.chat.id) {
      // Chuẩn hóa các field
      msg.sender_id   = msg.sender_id ?? msg.senderId ?? null
      msg.sender_type = msg.sender_type || msg.senderType
      msg.file_url    = msg.file_url    || msg.fileUrl
      msg.file_name   = msg.file_name   || msg.fileName
      msg.file_type   = msg.file_type   || msg.fileType
      msg.created_at  = msg.created_at  || msg.createdAt || new Date().toISOString()
      // Đảm bảo hiển thị đúng tên nhân viên
      if (msg.sender_type === 'staff') {
        msg.full_name = msg.full_name || msg.username
      }
      messages.value.push(msg)
      scrollBottom()
      // Mark read
      socketEmit('mark_read', { chatId: props.chat.id })
    }
  })

  on('user_typing', ({ isTyping, role }) => {
    if (role === 'user') partnerTyping.value = isTyping
  })

  on('chat_status_changed', ({ chatId, status }) => {
    if (chatId === props.chat.id) {
      localStatus.value = status
      emit('joined', chatId)
    }
  })

  on('chat_closed', ({ chatId }) => {
    if (chatId === props.chat.id) {
      localStatus.value = 'closed'
      emit('closed', chatId)
    }
  })
})

onUnmounted(() => {
  off('new_message')
  off('user_typing')
  off('chat_status_changed')
  off('chat_closed')
  clearTimeout(typingTimer)
})
</script>
