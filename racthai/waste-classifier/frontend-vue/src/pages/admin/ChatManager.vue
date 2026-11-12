<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Quản Lý Chat</h1>
      <p class="text-gray-500 text-sm mt-1">Theo dõi tất cả cuộc hội thoại khách-nhân viên</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="s in statsCards" :key="s.label"
        class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <p class="text-2xl font-bold" :class="s.color">{{ s.value }}</p>
        <p class="text-sm text-gray-500 mt-1">{{ s.label }}</p>
      </div>
    </div>

    <!-- All chats table -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3"
        style="background:linear-gradient(to right,#f0f9ff,#e0f2fe)">
        <h3 class="font-bold text-sky-900 flex-1">Tất cả cuộc hội thoại</h3>
        <!-- Search -->
        <div class="relative">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="searchInput" @input="onSearchInput" type="text" placeholder="Tìm kiếm..."
            class="pl-8 pr-3 py-1.5 text-sm border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 w-44" />
        </div>
        <!-- Status filter -->
        <select v-model="statusFilter" @change="onFilterChange" class="text-sm border border-sky-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400">
          <option value="">Tất cả trạng thái</option>
          <option value="waiting">Chờ</option>
          <option value="active">Đang</option>
          <option value="closed">Xong</option>
        </select>
      </div>

      <div v-if="loading" class="flex justify-center py-12"><Loader2 class="animate-spin text-sky-400" :size="28" /></div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Khách</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nhân viên</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tin nhắn cuối</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in chats" :key="c.id"
            class="border-b border-gray-50 hover:bg-sky-50/30 transition-colors cursor-pointer"
            @click="openDetail(c)">
            <td class="px-5 py-3">
              <p class="font-medium text-gray-900">{{ c.user_name || c.guest_name || 'Khách vãng lai' }}</p>
              <p v-if="c.guest_email || c.user_email" class="text-xs text-gray-400">{{ c.guest_email || c.user_email }}</p>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ c.staff_name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ c.last_message || c.subject }}</td>
            <td class="px-4 py-3 text-center">
              <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                :class="{
                  'bg-yellow-100 text-yellow-700': c.status==='waiting',
                  'bg-sky-100 text-sky-700':       c.status==='active',
                  'bg-gray-100 text-gray-500':     c.status==='closed'
                }">
                {{ { waiting:'⏳ Chờ', active:'💬 Đang', closed:'✅ Xong' }[c.status] }}
              </span>
            </td>
            <td class="px-4 py-3 text-right text-xs text-gray-400">
              {{ new Date(c.last_msg_at || c.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }}
            </td>
            <td class="px-4 py-3 text-center" @click.stop>
              <div class="flex items-center justify-center gap-1">
                <button @click="openDetail(c)"
                  class="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors" title="Xem chi tiết">
                  <Eye :size="15" />
                </button>
                <button @click="deleteChat(c.id)"
                  class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Xóa cuộc chat">
                  <Trash2 :size="15" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!chats.length">
            <td colspan="6" class="py-12 text-center text-gray-400 text-sm">Không có cuộc hội thoại nào</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <p class="text-xs text-gray-500">Trang {{ page }} / {{ totalPages }} ({{ total }} cuộc)</p>
        <div class="flex gap-2">
          <button @click="gotoPage(page - 1)" :disabled="page <= 1"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">← Trước</button>
          <button @click="gotoPage(page + 1)" :disabled="page >= totalPages"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Sau →</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="detailChat" class="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4"
        @click.self="closeDetail">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style="max-height:85vh">
          <!-- Modal header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div class="flex-1">
              <p class="font-bold text-gray-900">{{ detailChat.user_name || detailChat.guest_name || 'Khách vãng lai' }}</p>
              <p class="text-xs text-gray-500">
                Nhân viên: {{ detailChat.staff_name || 'Chưa nhận' }} ·
                <span :class="{
                  'text-yellow-600': detailChat.status==='waiting',
                  'text-sky-600':   detailChat.status==='active',
                  'text-gray-500':  detailChat.status==='closed'
                }">{{ { waiting:'Chờ', active:'Đang hỗ trợ', closed:'Đã xong' }[detailChat.status] }}</span>
              </p>
            </div>
            <button @click="closeDetail" class="text-gray-400 hover:text-gray-600 p-1 transition-colors">
              <X :size="20" />
            </button>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div v-if="loadingDetail" class="flex justify-center py-8">
              <Loader2 class="animate-spin text-sky-400" :size="24" />
            </div>
            <template v-else>
              <div v-for="msg in detailMessages" :key="msg.id">
                <div v-if="msg.sender_type==='system'" class="text-center my-1">
                  <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{{ msg.message }}</span>
                </div>
                <div v-else-if="msg.sender_type==='staff'" class="flex justify-end gap-2">
                  <div class="max-w-[70%]">
                    <p class="text-xs text-gray-400 mb-0.5 text-right">{{ msg.full_name || msg.username || 'Nhân viên' }}</p>
                    <div v-if="msg.file_url" class="flex justify-end mb-1">
                      <img v-if="msg.file_type?.startsWith('image/')" :src="msg.file_url"
                        class="max-h-40 rounded-xl border cursor-pointer" @click="lightboxDetail=msg.file_url" />
                      <a v-else :href="msg.file_url" target="_blank"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-sky-100 text-sky-800 border border-sky-200">
                        <Paperclip :size="12" />{{ msg.file_name||'File' }}
                      </a>
                    </div>
                    <div v-if="msg.message"
                      class="px-3 py-2 rounded-2xl rounded-tr-sm text-sm break-words text-white"
                      style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">{{ msg.message }}</div>
                    <p class="text-xs text-gray-400 mt-0.5 text-right">{{ fmtTime(msg.created_at) }}</p>
                  </div>
                  <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-5"
                    style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">
                    {{ (msg.full_name||msg.username||'NV').charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div v-else class="flex justify-start gap-2">
                  <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs mt-5"
                    style="background:linear-gradient(135deg,#bae6fd,#7dd3fc);color:#0369a1">
                    {{ (detailChat.user_name||detailChat.guest_name||'K').charAt(0).toUpperCase() }}
                  </div>
                  <div class="max-w-[70%]">
                    <p class="text-xs text-gray-400 mb-0.5">{{ detailChat.user_name || detailChat.guest_name || 'Khách' }}</p>
                    <div v-if="msg.file_url" class="mb-1">
                      <img v-if="msg.file_type?.startsWith('image/')" :src="msg.file_url"
                        class="max-h-40 rounded-xl border cursor-pointer" @click="lightboxDetail=msg.file_url" />
                      <a v-else :href="msg.file_url" target="_blank"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-white border border-gray-200 text-gray-700">
                        <Paperclip :size="12" />{{ msg.file_name||'File' }}
                      </a>
                    </div>
                    <div v-if="msg.message"
                      class="px-3 py-2 rounded-2xl rounded-tl-sm text-sm break-words bg-gray-100 text-gray-800">{{ msg.message }}</div>
                    <p class="text-xs text-gray-400 mt-0.5">{{ fmtTime(msg.created_at) }}</p>
                  </div>
                </div>
              </div>
              <p v-if="!detailMessages.length" class="text-center text-sm text-gray-400 py-8">Chưa có tin nhắn nào</p>
            </template>
          </div>
        </div>
      </div>

      <!-- Detail lightbox -->
      <div v-if="lightboxDetail" class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
        @click="lightboxDetail=null">
        <img :src="lightboxDetail" class="max-w-full max-h-full rounded-xl object-contain" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Loader2, Trash2, Eye, X, Search, Paperclip } from 'lucide-vue-next'
import api from '../../config/api'

const chats        = ref([])
const loading      = ref(true)
const statusFilter = ref('')
const searchInput  = ref('')
const chatStats    = ref({ total_chats:0, waiting:0, active:0, closed:0 })

// Pagination
const page       = ref(1)
const total      = ref(0)
const totalPages = ref(1)
const LIMIT      = 20

// Detail modal
const detailChat     = ref(null)
const detailMessages = ref([])
const loadingDetail  = ref(false)
const lightboxDetail = ref(null)

let searchTimer = null

const statsCards = computed(() => [
  { label: 'Tổng hội thoại', value: chatStats.value.total_chats,  color: 'text-sky-600' },
  { label: 'Đang chờ',       value: chatStats.value.waiting,       color: 'text-yellow-600' },
  { label: 'Đang hỗ trợ',    value: chatStats.value.active,        color: 'text-blue-600' },
  { label: 'Đã xong',        value: chatStats.value.closed,        color: 'text-green-600' },
])

function fmtTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

async function loadChats() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page:   page.value,
      limit:  LIMIT,
      status: statusFilter.value,
      search: searchInput.value,
    })
    const { data } = await api.get(`/api/admin/staff-chats?${params}`)
    if (data.success) {
      chats.value      = data.chats
      total.value      = data.total
      totalPages.value = data.totalPages
    }
  } catch {}
  finally { loading.value = false }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadChats()
  }, 400)
}

function onFilterChange() {
  page.value = 1
  loadChats()
}

function gotoPage(n) {
  if (n < 1 || n > totalPages.value) return
  page.value = n
  loadChats()
}

async function deleteChat(id) {
  if (!confirm('Xóa cuộc chat này? Hành động không thể hoàn tác.')) return
  try {
    await api.delete(`/api/admin/staff-chats/${id}`)
    chats.value = chats.value.filter(c => c.id !== id)
    total.value = Math.max(0, total.value - 1)
    // refresh stats
    const { data } = await api.get('/api/admin/chat-stats')
    if (data.success) chatStats.value = data.stats
  } catch { alert('Xóa thất bại') }
}

async function openDetail(c) {
  detailChat.value     = c
  detailMessages.value = []
  loadingDetail.value  = true
  try {
    const { data } = await api.get(`/api/admin/staff-chats/${c.id}/messages`)
    if (data.success) detailMessages.value = data.messages
  } catch {}
  finally { loadingDetail.value = false }
}

function closeDetail() {
  detailChat.value     = null
  detailMessages.value = []
  lightboxDetail.value = null
}

onMounted(async () => {
  try {
    const statsRes = await api.get('/api/admin/chat-stats')
    if (statsRes.data.success) chatStats.value = statsRes.data.stats
  } catch {}
  await loadChats()
})
</script>
