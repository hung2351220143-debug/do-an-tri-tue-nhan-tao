<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Hỏi AI về Rác Thải</h1>
        <p class="text-gray-500 mt-1">Tư vấn phân loại, tái chế và bảo vệ môi trường</p>
      </div>
      <button v-if="messages.length && chatMode==='ai'" @click="clearChat" class="btn-secondary text-sm py-2 px-3 hover-lift">
        <Trash2 :size="15" /> Xóa chat
      </button>
    </div>

    <!-- Tab chọn AI / Nhân viên -->
    <div class="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-5 w-fit">
      <button @click="chatMode='ai'"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="chatMode==='ai' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        <Bot :size="16" /> Chat với AI
      </button>
      <button @click="chatMode='staff'"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative"
        :class="chatMode==='staff' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        <Headset :size="16" /> Chat với nhân viên
        <span class="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5"
          :class="onlineStaff > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'" />
      </button>
    </div>

    <div v-if="!auth.state.user && chatMode==='ai'" class="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200">
      <Info :size="15" />
      Đăng nhập để lưu lịch sử trò chuyện
    </div>

    <!-- ── STAFF CHAT MODE ── -->
    <div v-if="chatMode==='staff'"
      class="glass rounded-2xl border border-sky-100 shadow-glass flex flex-col" style="height:65vh">

      <!-- Chưa có session chat -->
      <div v-if="!staffChatId" class="flex-1 flex flex-col items-center justify-center p-8 gap-5 overflow-y-auto">
        <div class="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sky-md"
          style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
          <Headset :size="36" class="text-white" />
        </div>
        <div class="text-center">
          <h3 class="font-bold text-gray-900 text-lg mb-1">Chat với nhân viên hỗ trợ</h3>
          <p class="text-gray-500 text-sm max-w-sm">
            {{ onlineStaff > 0 ? `${onlineStaff} nhân viên đang trực tuyến` : 'Để lại tin nhắn, nhân viên sẽ phản hồi sớm nhất' }}
          </p>
        </div>

        <!-- Chọn nhân viên trực tuyến -->
        <div v-if="onlineStaffList.length" class="w-full max-w-sm">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Chọn nhân viên trực tuyến</p>
          <div class="space-y-2">
            <button v-for="s in onlineStaffList" :key="s.id" type="button"
              @click="pickStaff(s)"
              :disabled="!auth.state.user && !guestName.trim()"
              class="w-full flex items-center gap-3 bg-white border border-sky-200 rounded-xl px-3 py-2.5 hover:border-sky-400 hover:bg-sky-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed">
              <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold"
                style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
                <img v-if="s.avatar" :src="s.avatar" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
                <span v-else>{{ (s.full_name||s.username||'?').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ s.full_name || s.username }}</p>
                <span class="inline-flex items-center gap-1 text-xs text-green-600">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Trực tuyến
                </span>
              </div>
              <MessageCircle :size="16" class="text-sky-500 flex-shrink-0" />
            </button>
          </div>
        </div>

        <!-- Lịch sử chat trước (chỉ khi đã đăng nhập) -->
        <div v-if="auth.state.user && pastChats.length" class="w-full max-w-sm">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lịch sử chat với nhân viên</p>
          <div class="space-y-2">
            <div v-for="pc in pastChats" :key="pc.id"
              class="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ pc.staff_name || 'Nhân viên' }}</p>
                  <span class="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                    :class="{
                      'bg-yellow-100 text-yellow-700': pc.status==='waiting',
                      'bg-sky-100 text-sky-700':       pc.status==='active',
                      'bg-gray-100 text-gray-500':     pc.status==='closed'
                    }">
                    {{ { waiting:'Chờ', active:'Đang', closed:'Xong' }[pc.status] || pc.status }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 truncate mt-0.5">{{ pc.last_message || 'Chưa có tin nhắn' }}</p>
              </div>
              <button @click="resumeStaffChat(pc)"
                class="text-xs px-2.5 py-1.5 rounded-lg text-white font-medium flex-shrink-0"
                style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
                Tiếp tục
              </button>
            </div>
          </div>
        </div>

        <div v-if="!auth.state.user" class="w-full max-w-sm space-y-3">
          <input v-model="guestName" type="text" placeholder="Tên của bạn *" class="input-field" />
          <input v-model="guestEmail" type="email" placeholder="Email (tùy chọn)" class="input-field" />
        </div>
        <button v-if="!onlineStaffList.length" @click="startStaffChat" :disabled="!auth.state.user && !guestName.trim()" class="btn-primary px-8 py-3 text-sm disabled:opacity-50">
          <MessageCircle :size="16" /> Bắt đầu trò chuyện
        </button>
      </div>

      <!-- Đang trong phiên chat -->
      <template v-else>
        <!-- Header -->
        <div class="px-5 py-3 border-b border-sky-50 flex items-center gap-2 bg-sky-50/50 flex-shrink-0">
          <span class="w-2.5 h-2.5 rounded-full" :class="staffChatStatus==='active' ? 'bg-green-400 animate-pulse' : staffChatStatus==='waiting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'" />
          <span class="text-sm font-medium text-gray-700 flex-1">
            {{ staffChatStatus==='active' ? 'Nhân viên đang hỗ trợ' : staffChatStatus==='waiting' ? 'Đang chờ nhân viên...' : 'Cuộc trò chuyện đã kết thúc' }}
          </span>
          <span v-if="staffTyping" class="text-xs text-sky-500 italic animate-pulse">Đang nhập...</span>
          <!-- Xóa lịch sử -->
          <button @click="deleteStaffMessages"
            class="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Xóa lịch sử trò chuyện">
            <Trash2 :size="15" />
          </button>
        </div>

        <!-- Search bar -->
        <div v-if="staffMessages.length" class="px-5 py-2 border-b border-sky-50 flex-shrink-0">
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="searchQuery" type="text" placeholder="Tìm kiếm tin nhắn..."
              class="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white" />
            <button v-if="searchQuery" @click="searchQuery=''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X :size="12" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="staffMsgEl" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div v-for="msg in filteredStaffMessages" :key="msg.id">
            <div v-if="msg.sender_type==='system'" class="text-center my-1">
              <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{{ msg.message }}</span>
            </div>
            <div v-else :class="isMyMsg(msg) ? 'flex justify-end' : 'flex justify-start gap-2.5'">
              <div v-if="!isMyMsg(msg)" class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-white mt-0.5" style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
                {{ (msg.full_name||msg.username||'NV').charAt(0).toUpperCase() }}
              </div>
              <div class="max-w-[75%]">
                <p v-if="!isMyMsg(msg)" class="text-xs text-gray-400 mb-0.5">{{ msg.full_name||msg.username||'Nhân viên' }}</p>
                <p v-else class="text-xs text-gray-400 mb-0.5 text-right">{{ auth.state.user?.full_name || auth.state.user?.username || guestName || 'Bạn' }}</p>
                <div v-if="msg.file_url" class="mb-1" :class="isMyMsg(msg) ? 'flex justify-end' : ''">
                  <img v-if="msg.file_type?.startsWith('image/')" :src="msg.file_url" class="max-w-full max-h-48 rounded-xl border cursor-pointer" @click="lightbox=msg.file_url" />
                  <a v-else :href="msg.file_url" target="_blank" class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-sky-700 bg-sky-50 border border-sky-200"><Paperclip :size="14" />{{ msg.file_name||'File' }}</a>
                </div>
                <div v-if="msg.message" class="px-3.5 py-2.5 rounded-2xl text-sm break-words"
                  :class="isMyMsg(msg) ? 'text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'"
                  :style="isMyMsg(msg) ? 'background:linear-gradient(135deg,#0ea5e9,#0284c7)' : ''">{{ msg.message }}</div>
                <p class="text-xs text-gray-400 mt-1" :class="isMyMsg(msg)?'text-right':''">{{ fmtTime(msg.created_at) }}</p>
              </div>
            </div>
          </div>
          <div v-if="staffTyping" class="flex gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">NV</div>
            <div class="bg-gray-100 rounded-2xl px-3 py-2 flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms" />
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms" />
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms" />
            </div>
          </div>
          <div ref="staffMsgEnd" />
        </div>

        <!-- Input -->
        <div v-if="staffChatStatus!=='closed'" class="p-4 border-t border-sky-50 flex-shrink-0">
          <div class="flex items-end gap-2">
            <!-- File upload -->
            <label class="cursor-pointer text-sky-400 hover:text-sky-600 p-2 rounded-xl hover:bg-sky-50">
              <Paperclip :size="18" />
              <input type="file" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xlsx" @change="sendStaffFile" />
            </label>
            <!-- Camera capture -->
            <label class="cursor-pointer text-sky-400 hover:text-sky-600 p-2 rounded-xl hover:bg-sky-50">
              <Camera :size="18" />
              <input type="file" class="hidden" accept="image/*" capture="environment" @change="sendStaffFile" />
            </label>
            <textarea v-model="staffInput" @keydown.enter.exact.prevent="sendStaffMsg" @input="onStaffTyping"
              rows="1" placeholder="Nhắn tin... (Enter gửi)" class="flex-1 input-field resize-none max-h-28 py-2.5" />
            <button @click="sendStaffMsg" :disabled="!staffInput.trim()" class="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 flex-shrink-0" style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)"><Send :size="16" /></button>
          </div>
        </div>
        <div v-else class="p-4 text-center text-sm text-gray-400 border-t border-sky-50">Cuộc hội thoại đã kết thúc</div>
      </template>
    </div>

    <!-- ── AI CHAT MODE ── -->
    <div v-if="chatMode==='ai'" class="glass rounded-2xl border border-gray-100/80 shadow-glass flex flex-col" style="height: 60vh">
      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Empty state -->
        <div v-if="!messages.length" class="h-full flex flex-col items-center justify-center text-center py-8">
          <div class="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 shadow-sm rounded-2xl flex items-center justify-center mb-4">
            <Bot :size="28" class="text-sky-600" />
          </div>
          <h3 class="font-bold text-gray-800 mb-2">Xin chào! Tôi là EcoBot 🌿</h3>
          <p class="text-gray-500 text-sm max-w-sm">Tôi có thể giúp bạn về phân loại rác, tái chế và bảo vệ môi trường. Hãy đặt câu hỏi hoặc chọn gợi ý bên dưới!</p>
          <div class="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
            <button v-for="(s, i) in SUGGESTIONS" :key="i" @click="sendMessage(s)"
              class="px-3 py-1.5 bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 text-sky-700 text-sm rounded-full border border-sky-200/60 transition-all duration-200 hover:-translate-y-0.5">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Messages list -->
        <div v-for="msg in messages" :key="msg.id"
          class="flex items-start gap-3 animate-fade-in-up"
          :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :class="msg.role === 'user'
              ? 'bg-gradient-to-br from-sky-400 to-blue-600'
              : 'bg-gray-100 border border-gray-200'">
            <User v-if="msg.role === 'user'" :size="16" class="text-white" />
            <Bot v-else :size="16" class="text-sky-600" />
          </div>
          <div :class="msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'">
            <div v-if="msg.role === 'assistant'"
              class="text-sm leading-relaxed prose prose-sm max-w-none"
              v-html="formatMessage(msg.content)" />
            <p v-else class="text-sm leading-relaxed">{{ msg.content }}</p>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="loading" class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Bot :size="16" class="text-sky-600" />
          </div>
          <div class="chat-bubble-ai flex items-center gap-1 px-5 py-3">
            <span class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay:0ms" />
            <span class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay:150ms" />
            <span class="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style="animation-delay:300ms" />
          </div>
        </div>

        <div ref="messagesEnd" />
      </div>

      <!-- Quick suggestions when few messages -->
      <div v-if="messages.length > 0 && messages.length < 4" class="px-4 py-2 border-t border-gray-100">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="(s, i) in SUGGESTIONS.slice(0, 3)" :key="i" @click="sendMessage(s)" :disabled="loading"
            class="px-2.5 py-1 bg-gray-50 hover:bg-sky-50 text-gray-600 hover:text-sky-700 text-xs rounded-full border border-gray-200 transition-all duration-200 disabled:opacity-50 hover:-translate-y-0.5">
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Input -->
      <div class="p-4 border-t border-gray-100 bg-gray-50/50">
        <div class="flex gap-3 items-end">
          <textarea
            ref="inputRef"
            v-model="input"
            @keydown="handleKeyDown"
            @input="autoResize"
            placeholder="Nhập câu hỏi về rác thải... (Enter để gửi)"
            rows="1"
            class="flex-1 resize-none input-field py-3 max-h-32"
            style="min-height: 46px"
            :disabled="loading"
          />
          <button @click="sendMessage()" :disabled="!input.trim() || loading"
            class="w-11 h-11 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 shadow-sky-sm hover:shadow-sky-md"
            style="background: linear-gradient(135deg, #22c55e, #16a34a)">
            <Loader2 v-if="loading" :size="18" class="animate-spin" />
            <Send v-else :size="18" />
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-2 text-center">Shift+Enter để xuống dòng • Enter để gửi</p>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightbox" class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" @click="lightbox=null">
        <img :src="lightbox" class="max-w-full max-h-full rounded-xl object-contain" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import api from '../config/api'
import { useToast } from 'vue-toastification'
import { Send, Bot, User, Loader2, Info, Trash2, Headset, MessageCircle, Paperclip, Camera, Search, X } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../stores/socket'

const auth = useAuthStore()
const toast = useToast()
const { state: socketState, connect } = useSocket()

// ── Chat mode ──
const chatMode    = ref('ai')
const onlineStaff = computed(() => socketState.onlineStaff)

// ── Staff chat state ──
const staffChatId     = ref(null)
const staffChatStatus = ref('waiting')
const staffMessages   = ref([])
const staffInput      = ref('')
const staffTyping     = ref(false)
const guestName       = ref('')
const guestEmail      = ref('')
const staffMsgEl      = ref(null)
const staffMsgEnd     = ref(null)
const lightbox        = ref(null)
const searchQuery     = ref('')
const pastChats       = ref([])
let staffTypingTimer  = null
let staffSocket       = null

// Computed: lọc tin nhắn theo search
const filteredStaffMessages = computed(() => {
  if (!searchQuery.value.trim()) return staffMessages.value
  const q = searchQuery.value.toLowerCase()
  return staffMessages.value.filter(m => m.message?.toLowerCase().includes(q))
})

// Khi mo tab nhan vien va chua co chat → tai lai danh sach nhan vien online
watch(chatMode, (m) => {
  if (m === 'staff' && !staffChatId.value) loadOnlineStaff()
})

function isMyMsg(msg) {
  if (auth.state.user) return msg.sender_id === auth.state.user.id
  return msg.sender_type === 'user'
}

function fmtTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function scrollStaff() {
  nextTick(() => { if (staffMsgEnd.value) staffMsgEnd.value.scrollIntoView({ behavior: 'smooth' }) })
}

// Chuẩn hóa field camelCase/snake_case
function normalizeMsg(msg) {
  msg.sender_id   = msg.sender_id ?? msg.senderId ?? null
  msg.sender_type = msg.sender_type || msg.senderType
  msg.file_url    = msg.file_url    || msg.fileUrl
  msg.file_name   = msg.file_name   || msg.fileName
  msg.file_type   = msg.file_type   || msg.fileType
  msg.created_at  = msg.created_at  || msg.createdAt || new Date().toISOString()
  msg.full_name   = msg.full_name   || msg.username || null
}

function _doJoin(sock, { chatId, staffId } = {}) {
  sock.emit('join_chat', {
    chatId:     chatId || undefined,
    staffId:    staffId || undefined,
    guestName:  auth.state.user?.full_name || auth.state.user?.username || guestName.value,
    guestEmail: auth.state.user?.email || guestEmail.value
  })
}

function startStaffChat() {
  if (!staffSocket) staffSocket = connect(localStorage.getItem('token'))
  if (staffSocket.connected) {
    _doJoin(staffSocket)
  } else {
    staffSocket.once('connect', () => _doJoin(staffSocket))
  }
}

function resumeStaffChat(chat) {
  if (!staffSocket) staffSocket = connect(localStorage.getItem('token'))
  const doJoin = () => _doJoin(staffSocket, { chatId: chat.id })
  if (staffSocket.connected) {
    doJoin()
  } else {
    staffSocket.once('connect', doJoin)
  }
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
  if (!staffSocket) staffSocket = connect(localStorage.getItem('token'))
  const doJoin = () => _doJoin(staffSocket, { staffId: staff.id })
  if (staffSocket.connected) doJoin()
  else staffSocket.once('connect', doJoin)
}

function sendStaffMsg() {
  const msg = staffInput.value.trim()
  if (!msg || !staffChatId.value) return
  staffInput.value = ''
  staffSocket.emit('send_message', { chatId: staffChatId.value, message: msg })
}

async function sendStaffFile(e) {
  const file = e.target.files[0]
  if (!file || !staffChatId.value) return
  try {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post('/api/staff-chat/upload', fd)
    if (data.success) staffSocket.emit('send_message', { chatId: staffChatId.value, fileUrl: data.fileUrl, fileName: data.fileName, fileType: data.fileType })
  } catch { toast.error('Upload thất bại') }
  e.target.value = ''
}

function onStaffTyping() {
  if (!staffChatId.value) return
  staffSocket.emit('typing', { chatId: staffChatId.value, isTyping: true })
  clearTimeout(staffTypingTimer)
  staffTypingTimer = setTimeout(() => staffSocket.emit('typing', { chatId: staffChatId.value, isTyping: false }), 1500)
}

async function deleteStaffMessages() {
  if (!staffChatId.value) return
  if (!confirm('Xóa toàn bộ lịch sử trò chuyện này?')) return
  try {
    await api.delete(`/api/staff-chat/${staffChatId.value}/messages`)
    staffMessages.value = []
    toast.success('Đã xóa lịch sử trò chuyện')
  } catch {
    toast.error('Xóa thất bại')
  }
}

async function loadPastChats() {
  if (!auth.state.user) return
  try {
    const { data } = await api.get('/api/staff-chat/my')
    if (data.success) pastChats.value = data.chats || []
  } catch {}
}

onMounted(() => {
  staffSocket = connect(localStorage.getItem('token'))

  staffSocket.on('chat_joined', ({ chatId, messages, status }) => {
    staffChatId.value = chatId
    staffChatStatus.value = status
    staffMessages.value = (messages || []).map(m => { normalizeMsg(m); return m })
    // Lưu chatId vào localStorage
    localStorage.setItem('staffChatId', chatId)
    scrollStaff()
  })
  staffSocket.on('new_message', (msg) => {
    normalizeMsg(msg)
    if (msg.chatId === staffChatId.value) {
      staffMessages.value.push(msg)
      scrollStaff()
    }
  })
  staffSocket.on('user_typing', ({ isTyping, role }) => { if (role === 'staff') staffTyping.value = isTyping })
  staffSocket.on('chat_status_changed', ({ status }) => { staffChatStatus.value = status })
  staffSocket.on('chat_closed', () => {
    staffChatStatus.value = 'closed'
    localStorage.removeItem('staffChatId')
  })

  // Auto-rejoin nếu có chatId đã lưu
  const savedId = localStorage.getItem('staffChatId')
  if (savedId) {
    const doRejoin = () => _doJoin(staffSocket, { chatId: parseInt(savedId) })
    if (staffSocket.connected) {
      doRejoin()
    } else {
      staffSocket.once('connect', doRejoin)
    }
  }

  // Load lịch sử chat cũ
  loadPastChats()
  // Load danh sach nhan vien online
  loadOnlineStaff()
})

onUnmounted(() => {
  if (staffSocket) {
    staffSocket.off('chat_joined')
    staffSocket.off('new_message')
    staffSocket.off('user_typing')
    staffSocket.off('chat_status_changed')
    staffSocket.off('chat_closed')
  }
  clearTimeout(staffTypingTimer)
})

const SUGGESTIONS = [
  'Cách phân loại rác nhựa?', 'Pin cũ vứt ở đâu?', 'Rác hữu cơ là gì?',
  'Cách tái chế giấy?', 'Rác điện tử xử lý thế nào?', 'Túi nilon có tái chế được không?',
]

const sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
})

const messages = ref([])
const input = ref('')
const loading = ref(false)
const messagesEnd = ref(null)
const inputRef = ref(null)

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

async function scrollToBottom() {
  await nextTick()
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
}

async function sendMessage(text) {
  const message = (text || input.value).trim()
  if (!message || loading.value) return
  input.value = ''
  const userMsg = { role: 'user', content: message, id: Date.now() }
  messages.value.push(userMsg)
  loading.value = true
  await scrollToBottom()
  try {
    const history = messages.value.slice(-11, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content
    }))
    const { data } = await api.post('/api/chat', { message, sessionId, history })
    if (data.success) {
      messages.value.push({ role: 'assistant', content: data.response, id: Date.now() })
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Không thể kết nối AI. Vui lòng thử lại.')
    messages.value.push({ role: 'assistant', content: '❌ Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.', id: Date.now(), isError: true })
  } finally {
    loading.value = false
    await scrollToBottom()
    setTimeout(() => inputRef.value?.focus(), 100)
  }
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function autoResize(e) {
  e.target.style.height = 'auto'
  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
}

function clearChat() {
  messages.value = []
  toast.success('Đã xóa lịch sử chat')
}
</script>
