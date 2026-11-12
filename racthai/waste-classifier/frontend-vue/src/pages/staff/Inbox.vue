<template>
  <div class="flex gap-5 h-full" style="height:calc(100vh - 7rem)">
    <!-- Danh sách chat trái -->
    <div class="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm">
      <!-- Header + Filter -->
      <div class="p-4 border-b border-sky-50">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-900">Hộp thư</h3>
          <span v-if="totalUnread > 0"
            class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {{ totalUnread }} mới
          </span>
        </div>
        <!-- Search -->
        <div class="relative">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="text" placeholder="Tìm kiếm..."
            class="w-full pl-8 pr-3 py-2 text-sm border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        <!-- Status tabs -->
        <div class="flex gap-1 mt-2">
          <button v-for="s in STATUS_TABS" :key="s.value" @click="statusFilter=s.value"
            class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors"
            :class="statusFilter===s.value ? 'text-white' : 'text-gray-500 hover:bg-gray-50'"
            :style="statusFilter===s.value ? 'background:linear-gradient(135deg,#38bdf8,#0ea5e9)' : ''">
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex justify-center py-8">
          <Loader2 class="animate-spin text-sky-400" :size="24" />
        </div>
        <div v-else-if="!filteredChats.length" class="text-center py-12">
          <MessageSquare :size="32" class="mx-auto text-gray-300 mb-2" />
          <p class="text-gray-400 text-sm">Không có cuộc hội thoại</p>
        </div>
        <div v-else>
          <div v-for="chat in filteredChats" :key="chat.id"
            @click="selectChat(chat)"
            class="flex items-start gap-3 p-4 cursor-pointer transition-all border-b border-gray-50 hover:bg-sky-50"
            :class="selectedChat?.id === chat.id ? 'bg-sky-50 border-l-4 border-l-sky-500' : ''">
            <!-- Avatar -->
            <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
              :style="chat.status==='active' ? 'background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:white' : 'background:#e0f2fe;color:#0284c7'">
              {{ (chat.user_name || chat.guest_name || 'K').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="font-semibold text-gray-900 text-sm truncate">
                  {{ chat.user_name || chat.guest_name || 'Khách vãng lai' }}
                </p>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <span v-if="chat.unread_count > 0"
                    class="bg-sky-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {{ chat.unread_count }}
                  </span>
                  <p class="text-xs text-gray-400">{{ formatTime(chat.last_msg_at || chat.created_at) }}</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 truncate mt-0.5">{{ chat.last_message || chat.subject }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                :class="{
                  'bg-yellow-100 text-yellow-700': chat.status==='waiting',
                  'bg-sky-100 text-sky-700':       chat.status==='active',
                  'bg-gray-100 text-gray-500':     chat.status==='closed'
                }">
                {{ STATUS_LABEL[chat.status] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat area phải -->
    <div class="flex-1 flex flex-col bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm">
      <!-- Placeholder -->
      <div v-if="!selectedChat" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <MessageSquare :size="48" class="mx-auto text-gray-200 mb-3" />
          <p class="text-gray-400 font-medium">Chọn một cuộc hội thoại</p>
          <p class="text-gray-300 text-sm mt-1">để bắt đầu hỗ trợ khách hàng</p>
        </div>
      </div>

      <!-- Chat room -->
      <ChatRoom v-else :chat="selectedChat" :key="selectedChat.id"
        @closed="onChatClosed" @joined="onChatJoined" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, MessageSquare, Loader2 } from 'lucide-vue-next'
import { useSocket } from '../../stores/socket'
import api from '../../config/api'
import ChatRoom from './ChatRoom.vue'

const { on, off } = useSocket()

const STATUS_TABS  = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ',    value: 'waiting' },
  { label: 'Đang',   value: 'active' },
  { label: 'Xong',   value: 'closed' },
]
const STATUS_LABEL = { waiting: '⏳ Chờ', active: '💬 Đang', closed: '✅ Xong' }

const chats        = ref([])
const loading      = ref(true)
const search       = ref('')
const statusFilter = ref('')
const selectedChat = ref(null)
const totalUnread  = ref(0)

const filteredChats = computed(() => {
  let list = chats.value
  if (statusFilter.value) list = list.filter(c => c.status === statusFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      (c.user_name||c.guest_name||'').toLowerCase().includes(q) ||
      (c.last_message||'').toLowerCase().includes(q)
    )
  }
  return list
})

async function loadChats() {
  loading.value = true
  try {
    const { data } = await api.get('/api/staff-chat/staff/inbox')
    if (data.success) {
      chats.value = data.chats
      totalUnread.value = data.total_unread || 0
    }
  } catch {}
  finally { loading.value = false }
}

function selectChat(chat) {
  selectedChat.value = chat
  // Reset unread cho chat nay
  const idx = chats.value.findIndex(c => c.id === chat.id)
  if (idx !== -1) chats.value[idx].unread_count = 0
}

function onChatClosed(chatId) {
  const idx = chats.value.findIndex(c => c.id === chatId)
  if (idx !== -1) chats.value[idx].status = 'closed'
}

function onChatJoined(chatId) {
  const idx = chats.value.findIndex(c => c.id === chatId)
  if (idx !== -1) chats.value[idx].status = 'active'
}

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now  = new Date()
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
  return date.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })
}

onMounted(() => {
  loadChats()
  on('new_chat', (chat) => {
    chats.value.unshift({ ...chat, status: 'waiting', unread_count: 1 })
    totalUnread.value++
  })
  on('chat_updated', ({ chatId, lastMessage, status }) => {
    const idx = chats.value.findIndex(c => c.id === chatId)
    if (idx !== -1) {
      if (lastMessage) chats.value[idx].last_message = lastMessage.message || '📎 File'
      if (status)      chats.value[idx].status = status
      if (lastMessage?.senderType === 'user' && selectedChat.value?.id !== chatId) {
        chats.value[idx].unread_count = (chats.value[idx].unread_count || 0) + 1
        totalUnread.value++
      }
      // Move to top
      const c = chats.value.splice(idx, 1)[0]
      chats.value.unshift(c)
    }
  })
})

onUnmounted(() => {
  off('new_chat')
  off('chat_updated')
})
</script>
