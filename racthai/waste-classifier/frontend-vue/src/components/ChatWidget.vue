<template>
  <!-- Nút mở chat -->
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
    <!-- Chat bubble khi mở -->
    <Transition enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-90 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-4">
      <div v-if="open"
        class="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col"
        style="height:480px">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style="background:linear-gradient(135deg,#0c4a6e,#075985)">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
            style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
            <img v-if="appLogo" :src="appLogo" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
            <Headset v-else :size="18" class="text-white" />
          </div>
          <div class="flex-1">
            <p class="text-white font-semibold text-sm">Hỗ trợ {{ appName }}</p>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="onlineStaff > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'" />
              <p class="text-sky-200 text-xs">{{ onlineStaff > 0 ? `${onlineStaff} nhân viên online` : 'Đang ngoại tuyến' }}</p>
            </div>
          </div>
          <!-- Tab switch AI / Staff -->
          <div class="flex gap-1">
            <button @click="mode='ai'"
              class="text-xs px-2 py-1 rounded-lg transition-colors font-medium"
              :class="mode==='ai' ? 'bg-white text-sky-700' : 'text-sky-200 hover:text-white'">AI</button>
            <button @click="switchToStaff"
              class="text-xs px-2 py-1 rounded-lg transition-colors font-medium relative"
              :class="mode==='staff' ? 'bg-white text-sky-700' : 'text-sky-200 hover:text-white'">
              Nhân viên
              <span v-if="unread > 0 && mode !== 'staff'"
                class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white leading-none">
                {{ unread > 9 ? '9+' : unread }}
              </span>
            </button>
          </div>
          <button @click="open=false" class="text-sky-300 hover:text-white transition-colors">
            <X :size="18" />
          </button>
        </div>

        <!-- AI Chat mode -->
        <div v-if="mode==='ai'" class="flex-1 flex flex-col overflow-hidden">
          <div ref="aiMessagesEl" class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="!aiMessages.length" class="text-center py-8">
              <Bot :size="32" class="mx-auto text-sky-300 mb-2" />
              <p class="text-gray-500 text-sm">Xin chào! Tôi là AI trợ lý.<br>Hỏi tôi về phân loại rác nhé!</p>
            </div>
            <div v-for="msg in aiMessages" :key="msg.id"
              :class="msg.role==='user' ? 'flex justify-end' : 'flex justify-start'">
              <div class="max-w-[80%] px-3 py-2 rounded-2xl text-sm"
                :class="msg.role==='user'
                  ? 'rounded-tr-sm text-white'
                  : 'rounded-tl-sm bg-white border border-sky-100 text-gray-800'"
                :style="msg.role==='user' ? 'background:linear-gradient(135deg,#38bdf8,#0ea5e9)' : ''">
                {{ msg.content }}
              </div>
            </div>
            <div v-if="aiTyping" class="flex justify-start">
              <div class="bg-white border border-sky-100 rounded-2xl rounded-tl-sm px-3 py-2">
                <div class="flex gap-1">
                  <span class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay:0ms" />
                  <span class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay:150ms" />
                  <span class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay:300ms" />
                </div>
              </div>
            </div>
          </div>
          <!-- Input AI -->
          <div class="p-3 border-t border-sky-50 flex gap-2">
            <input v-model="aiInput" @keydown.enter.prevent="sendAiMessage"
              type="text" placeholder="Hỏi về phân loại rác..."
              class="flex-1 text-sm px-3 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button @click="sendAiMessage" :disabled="!aiInput.trim() || aiTyping"
              class="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all"
              style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
              <Send :size="16" />
            </button>
          </div>
        </div>

        <!-- Staff Chat mode -->
        <div v-else class="flex-1 flex flex-col overflow-hidden">
          <!-- Chua co chat session -->
          <div v-if="!chatId" class="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <Headset :size="40" class="text-sky-300" />
            <div class="text-center">
              <p class="font-semibold text-gray-800 mb-1">Chat với nhân viên hỗ trợ</p>
              <p class="text-sm text-gray-500">Nhân viên sẽ phản hồi sớm nhất có thể</p>
            </div>

            <!-- Chọn nhân viên trực tuyến -->
            <div v-if="onlineStaffList.length" class="w-full space-y-2">
              <p class="text-xs font-semibold text-gray-500 text-center">Chọn nhân viên trực tuyến</p>
              <button v-for="s in onlineStaffList" :key="s.id" type="button"
                @click="pickStaff(s)"
                :disabled="!auth.state.user && !guestName.trim()"
                class="w-full flex items-center gap-2.5 bg-white border border-sky-200 rounded-xl px-2.5 py-2 hover:border-sky-400 hover:bg-sky-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed">
                <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
                  <img v-if="s.avatar" :src="s.avatar" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
                  <span v-else>{{ (s.full_name||s.username||'?').charAt(0).toUpperCase() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-gray-800 truncate">{{ s.full_name || s.username }}</p>
                  <span class="inline-flex items-center gap-1 text-[10px] text-green-600">
                    <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Trực tuyến
                  </span>
                </div>
              </button>
            </div>

            <div v-if="!auth.state.user" class="w-full space-y-2">
              <input v-model="guestName" type="text" placeholder="Tên của bạn *"
                class="w-full text-sm px-3 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <input v-model="guestEmail" type="email" placeholder="Email (tùy chọn)"
                class="w-full text-sm px-3 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <button v-if="!onlineStaffList.length" @click="startStaffChat" :disabled="!auth.state.user && !guestName.trim()"
              class="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
              Bắt đầu trò chuyện
            </button>
          </div>

          <!-- Đang chat -->
          <template v-else>
            <!-- Status bar -->
            <div class="px-4 py-2 bg-sky-50 border-b border-sky-100 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="chatStatus==='active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'" />
              <span class="text-xs text-sky-700 font-medium flex-1">
                {{ chatStatus==='active' ? 'Nhân viên đang hỗ trợ' : chatStatus==='waiting' ? 'Đang chờ nhân viên...' : 'Đã kết thúc' }}
              </span>
              <span v-if="staffTyping" class="text-xs text-sky-400 italic">Đang nhập...</span>
            </div>

            <!-- Messages -->
            <div ref="staffMessagesEl" class="flex-1 overflow-y-auto p-4 space-y-3">
              <div v-for="msg in staffMessages" :key="msg.id">
                <!-- System message -->
                <div v-if="msg.sender_type==='system'" class="text-center">
                  <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{{ msg.message }}</span>
                </div>

                <!-- Staff message (bên PHẢI) -->
                <div v-else-if="msg.sender_type==='staff'" class="flex justify-end gap-1.5">
                  <div class="max-w-[80%]">
                    <p class="text-xs text-gray-400 mb-0.5 text-right">{{ msg.full_name||msg.username||'Nhân viên' }}</p>
                    <div v-if="msg.file_url" class="flex justify-end mb-1">
                      <img v-if="msg.file_type?.startsWith('image/')" :src="msg.file_url"
                        class="max-w-full rounded-xl border cursor-pointer" @click="openImage(msg.file_url)" />
                      <a v-else :href="msg.file_url" target="_blank"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-sky-100 text-sky-800 border border-sky-200">
                        <Paperclip :size="12" />{{ msg.file_name||'File' }}
                      </a>
                    </div>
                    <div v-if="msg.message" class="px-3 py-2 rounded-2xl rounded-tr-sm text-sm break-words text-white"
                      style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">
                      {{ msg.message }}
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5 text-right">{{ formatTime(msg.created_at) }}</p>
                  </div>
                  <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-5"
                    style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">
                    {{ (msg.full_name||msg.username||'NV').charAt(0).toUpperCase() }}
                  </div>
                </div>

                <!-- User/Khách message (bên TRÁI) -->
                <div v-else class="flex justify-start gap-1.5">
                  <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-5"
                    style="background:#e0f2fe;color:#0284c7">
                    {{ (msg.full_name||msg.username||'K').charAt(0).toUpperCase() }}
                  </div>
                  <div class="max-w-[80%]">
                    <div v-if="msg.file_url" class="mb-1">
                      <img v-if="msg.file_type?.startsWith('image/')" :src="msg.file_url"
                        class="max-w-full rounded-xl border cursor-pointer" @click="openImage(msg.file_url)" />
                      <a v-else :href="msg.file_url" target="_blank"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-white border border-sky-100 text-sky-700">
                        <Paperclip :size="12" />{{ msg.file_name||'File' }}
                      </a>
                    </div>
                    <div v-if="msg.message"
                      class="px-3 py-2 rounded-2xl rounded-tl-sm text-sm break-words bg-white border border-sky-100 text-gray-800">
                      {{ msg.message }}
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(msg.created_at) }}</p>
                  </div>
                </div>
              </div>
              <div v-if="staffTyping" class="flex gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">NV</div>
                <div class="bg-white border border-sky-100 rounded-2xl px-3 py-2">
                  <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style="animation-delay:0ms" />
                    <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style="animation-delay:150ms" />
                    <span class="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style="animation-delay:300ms" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Input staff chat -->
            <div v-if="chatStatus !== 'closed'" class="p-3 border-t border-sky-50">
              <div class="flex gap-2 items-end">
                <!-- File upload -->
                <label class="cursor-pointer text-sky-400 hover:text-sky-600 transition-colors p-1.5 flex-shrink-0">
                  <Paperclip :size="18" />
                  <input type="file" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xlsx" @change="sendFile" ref="fileInputRef" />
                </label>
                <!-- Camera capture -->
                <label class="cursor-pointer text-sky-400 hover:text-sky-600 transition-colors p-1.5 flex-shrink-0">
                  <Camera :size="18" />
                  <input type="file" class="hidden" accept="image/*" capture="environment" @change="sendFile" />
                </label>
                <textarea v-model="staffInput"
                  @keydown.enter.exact.prevent="sendStaffMessage"
                  @input="onTyping"
                  rows="1"
                  placeholder="Nhắn tin..."
                  class="flex-1 text-sm px-3 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none max-h-24 overflow-y-auto" />
                <button @click="sendStaffMessage" :disabled="!staffInput.trim()"
                  class="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0"
                  style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
                  <Send :size="16" />
                </button>
              </div>
            </div>
            <div v-else class="p-3 border-t border-sky-50 text-center text-xs text-gray-400">
              Cuộc hội thoại đã kết thúc
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- FAB button -->
    <button @click="open = !open"
      class="w-14 h-14 rounded-full shadow-sky-lg flex items-center justify-center text-white relative transition-transform hover:scale-110 active:scale-95"
      style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
      <MessageCircle v-if="!open" :size="24" />
      <X v-else :size="22" />
      <span v-if="unread > 0 && !open"
        class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center">
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>
  </div>

  <!-- Image lightbox -->
  <Teleport to="body">
    <div v-if="lightboxSrc" class="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      @click="lightboxSrc=null">
      <img :src="lightboxSrc" class="max-w-full max-h-full rounded-xl object-contain" />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useAppConfig } from '../stores/appConfig'
import { useSocket } from '../stores/socket'
import api from '../config/api'
import { X, MessageCircle, Send, Bot, Headset, Paperclip, Camera } from 'lucide-vue-next'

const auth = useAuthStore()
const { appName, appLogo } = useAppConfig()
const { state: socketState, connect } = useSocket()

const open        = ref(false)
const mode        = ref('ai')
const unread      = ref(0)

// AI chat
const aiMessages   = ref([])
const aiInput      = ref('')
const aiTyping     = ref(false)
const aiMessagesEl = ref(null)

// Staff chat — dùng 1 socket instance duy nhất
let _sock = null  // socket instance cố định
const chatId          = ref(null)
const chatStatus      = ref('waiting')
const staffMessages   = ref([])
const staffInput      = ref('')
const staffTyping     = ref(false)
const guestName       = ref('')
const guestEmail      = ref('')
const staffMessagesEl = ref(null)
const lightboxSrc     = ref(null)
const fileInputRef    = ref(null)

const onlineStaff = computed(() => socketState.onlineStaff)
let typingTimer = null

function scrollBottom(el) {
  nextTick(() => { if (el?.value) el.value.scrollTop = el.value.scrollHeight })
}

// Lấy/tạo socket và bind listeners 1 lần duy nhất
function getSocket() {
  if (_sock) return _sock
  _sock = connect(localStorage.getItem('token'))

  _sock.on('chat_joined', ({ chatId: id, messages, status }) => {
    chatId.value     = id
    chatStatus.value = status
    staffMessages.value = messages || []
    // Chuẩn hóa các tin nhắn từ lịch sử
    staffMessages.value.forEach(normalizeMsg)
    // Lưu vào localStorage để auto-rejoin khi reload
    localStorage.setItem('staffChatId', id)
    scrollBottom(staffMessagesEl)
  })
  _sock.on('new_message', (msg) => {
    normalizeMsg(msg)
    if (msg.chatId === chatId.value) {
      staffMessages.value.push(msg)
      scrollBottom(staffMessagesEl)
      if (!open.value || mode.value !== 'staff') unread.value++
    }
  })
  _sock.on('user_typing', ({ isTyping, role }) => {
    if (role === 'staff') staffTyping.value = isTyping
  })
  _sock.on('chat_status_changed', ({ status }) => { chatStatus.value = status })
  _sock.on('chat_closed', () => {
    chatStatus.value = 'closed'
    localStorage.removeItem('staffChatId')
  })

  return _sock
}

// Chuẩn hóa field camelCase/snake_case từ socket
function normalizeMsg(msg) {
  msg.sender_id   = msg.sender_id ?? msg.senderId ?? null
  msg.sender_type = msg.sender_type || msg.senderType
  msg.file_url    = msg.file_url    || msg.fileUrl
  msg.file_name   = msg.file_name   || msg.fileName
  msg.file_type   = msg.file_type   || msg.fileType
  msg.created_at  = msg.created_at  || msg.createdAt || new Date().toISOString()
}

// AI chat
async function sendAiMessage() {
  const msg = aiInput.value.trim()
  if (!msg || aiTyping.value) return
  aiInput.value = ''
  aiMessages.value.push({ id: Date.now(), role: 'user', content: msg })
  scrollBottom(aiMessagesEl)
  aiTyping.value = true
  try {
    const history = aiMessages.value.slice(-10).map(m => ({ role: m.role, content: m.content }))
    const { data } = await api.post('/api/chat', { message: msg, history: history.slice(0, -1) })
    aiMessages.value.push({ id: Date.now()+1, role: 'assistant', content: data.response || data.phanHoi })
  } catch {
    aiMessages.value.push({ id: Date.now()+1, role: 'assistant', content: 'Có lỗi xảy ra. Vui lòng thử lại.' })
  } finally {
    aiTyping.value = false
    scrollBottom(aiMessagesEl)
  }
}

// Staff chat — khởi động kết nối với kiểm tra connected state
function startStaffChat() {
  const sock = getSocket()
  if (sock.connected) {
    _doJoin(sock)
  } else {
    sock.once('connect', () => _doJoin(sock))
  }
}

function _doJoin(sock, { chatId, staffId } = {}) {
  sock.emit('join_chat', {
    chatId:     chatId || undefined,
    staffId:    staffId || undefined,
    guestName:  auth.state.user?.full_name || auth.state.user?.username || guestName.value || 'Khách',
    guestEmail: auth.state.user?.email || guestEmail.value || null
  })
}

function switchToStaff() {
  mode.value = 'staff'
  unread.value = 0
  // Khởi tạo socket sớm khi chuyển tab
  getSocket()
  if (!chatId.value) loadOnlineStaff()
}

// Danh sach nhan vien online de khach chon
const onlineStaffList = ref([])
async function loadOnlineStaff() {
  try {
    const { data } = await api.get('/api/staff-chat/online-staff')
    if (data.success) onlineStaffList.value = (data.staff || []).filter(s => s.online)
  } catch {}
}
function pickStaff(staff) {
  const sock = getSocket()
  const doJoin = () => _doJoin(sock, { staffId: staff.id })
  if (sock.connected) doJoin()
  else sock.once('connect', doJoin)
}

function sendStaffMessage() {
  const msg = staffInput.value.trim()
  if (!msg || !chatId.value) return
  staffInput.value = ''
  const sock = getSocket()
  sock.emit('send_message', { chatId: chatId.value, message: msg })
}

async function sendFile(e) {
  const file = e.target.files[0]
  if (!file || !chatId.value) return
  try {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post('/api/staff-chat/upload', fd)
    if (data.success) {
      const sock = getSocket()
      sock.emit('send_message', { chatId: chatId.value, fileUrl: data.fileUrl, fileName: data.fileName, fileType: data.fileType })
    }
  } catch { alert('Upload thất bại') }
  e.target.value = ''
}

function onTyping() {
  if (!chatId.value) return
  const sock = getSocket()
  sock.emit('typing', { chatId: chatId.value, isTyping: true })
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => sock.emit('typing', { chatId: chatId.value, isTyping: false }), 1500)
}

function openImage(src) { lightboxSrc.value = src }

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  // Khởi tạo socket ngay khi mount
  const sock = getSocket()

  // Auto-rejoin nếu có chatId trong localStorage
  const savedId = localStorage.getItem('staffChatId')
  if (savedId) {
    const doRejoin = () => {
      _doJoin(sock, { chatId: parseInt(savedId) })
    }
    if (sock.connected) {
      doRejoin()
    } else {
      sock.once('connect', doRejoin)
    }
  }
  // Load danh sach nhan vien online
  loadOnlineStaff()
})

onUnmounted(() => {
  if (_sock) {
    _sock.off('chat_joined')
    _sock.off('new_message')
    _sock.off('user_typing')
    _sock.off('chat_status_changed')
    _sock.off('chat_closed')
  }
  clearTimeout(typingTimer)
})

watch(open, (v) => { if (v && mode.value === 'staff') unread.value = 0 })
</script>
