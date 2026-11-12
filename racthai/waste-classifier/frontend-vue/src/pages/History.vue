<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Lịch Sử Sử Dụng</h1>
      <p class="text-gray-500 mt-1">Xem lại các lần phân loại và câu hỏi AI của bạn</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-gray-50/80 px-1 py-1 rounded-2xl border border-gray-100 w-fit">
      <button @click="switchTab('classify')"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200"
        :class="tab === 'classify' ? 'bg-white shadow-sm text-sky-700 font-semibold' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'">
        <Camera :size="16" /> Lịch sử phân loại
      </button>
      <button @click="switchTab('chat')"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200"
        :class="tab === 'chat' ? 'bg-white shadow-sm text-sky-700 font-semibold' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'">
        <MessageCircle :size="16" /> Lịch sử chat
      </button>
    </div>

    <!-- Skeleton loading state -->
    <div v-if="loading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="card p-0 overflow-hidden">
        <div class="skeleton h-40 w-full" />
        <div class="p-4 space-y-2">
          <div class="skeleton h-4 w-3/4 rounded" />
          <div class="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>

    <!-- ── PHÂN LOẠI ── -->
    <template v-if="!loading && tab === 'classify'">
      <div v-if="!classifications.length" class="text-center py-16">
        <Camera :size="40" class="mx-auto text-gray-300 mb-3" />
        <p class="text-gray-500 font-medium">Chưa có lịch sử phân loại</p>
        <RouterLink to="/classify" class="text-sky-600 text-sm mt-2 inline-block hover:underline">Phân loại ảnh ngay →</RouterLink>
      </div>
      <div v-else>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in classifications" :key="item.id"
            @click="openDetail(item)"
            class="card hover-lift cursor-pointer group border border-transparent hover:border-sky-200 p-0 overflow-hidden animate-fade-in-up"
          >
            <!-- Thumbnail -->
            <div class="relative overflow-hidden bg-gray-100" style="height:160px">
              <img :src="item.image_path" alt="Waste" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                @error="e => e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22160%22><rect fill=%22%23f3f4f6%22 width=%22300%22 height=%22160%22/><text x=%22150%22 y=%2285%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2214%22>Ảnh không tải được</text></svg>'" />
              <!-- Overlay khi hover -->
              <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                <div class="bg-white/90 backdrop-blur-sm text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow animate-scale-in">
                  <Eye :size="13" /> Xem chi tiết
                </div>
              </div>
              <div v-if="item.status === 'completed'" class="absolute bottom-2 left-2 bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full">✓ Hoàn thành</div>
              <!-- Xóa -->
              <button @click.stop="deleteClassification(item.id)"
                class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow">
                <Trash2 :size="12" />
              </button>
            </div>
            <div class="p-4">
              <p class="text-sm font-medium text-gray-700 truncate mb-1">{{ item.original_filename || 'Ảnh chụp' }}</p>
              <p class="text-xs text-gray-400 flex items-center gap-1 mb-2">
                <Calendar :size="11" /> {{ formatDate(item.created_at) }}
              </p>
              <div v-if="getCategories(item).length" class="flex items-center gap-1.5 flex-wrap mb-2">
                <span v-for="cat in getCategories(item)" :key="cat"
                  class="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white"
                  :style="{ backgroundColor: CATEGORY_COLORS[cat] || '#999' }" :title="cat" />
                <span class="text-xs text-gray-400">{{ item.result_json?.detections?.length || 0 }} vật phẩm</span>
              </div>
              <p v-if="item.result_json?.summary" class="text-xs text-gray-500 line-clamp-2">{{ item.result_json.summary }}</p>
            </div>
          </div>
        </div>
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
          <button @click="page--" :disabled="page===1" class="btn-secondary px-3 py-2 text-sm disabled:opacity-50 hover-lift">←</button>
          <span class="text-sm text-gray-600 px-3 py-2 bg-white rounded-lg border border-gray-200">Trang {{ page }} / {{ totalPages }}</span>
          <button @click="page++" :disabled="page===totalPages" class="btn-secondary px-3 py-2 text-sm disabled:opacity-50 hover-lift">→</button>
        </div>
      </div>
    </template>

    <!-- ── CHAT ── -->
    <template v-if="!loading && tab === 'chat'">
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-2">
          <div v-if="!chatSessions.length" class="text-center py-16">
            <MessageCircle :size="40" class="mx-auto text-gray-300 mb-3" />
            <p class="text-gray-500 font-medium">Chưa có lịch sử chat</p>
            <RouterLink to="/chat" class="text-sky-600 text-sm mt-2 inline-block hover:underline">Chat với AI ngay →</RouterLink>
          </div>
          <div v-for="session in chatSessions" :key="session.session_id"
            @click="loadSessionMessages(session.session_id)"
            class="card hover-lift cursor-pointer transition-all p-4"
            :class="selectedSession === session.session_id
              ? 'border-sky-500 bg-gradient-to-r from-sky-50/80 to-blue-50/50'
              : ''">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ session.tin_nhan_dau || 'Cuộc trò chuyện' }}</p>
                <p class="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar :size="11" /> {{ formatDate(session.tin_nhan_cuoi) }}</p>
                <p class="text-xs text-gray-400">{{ session.so_tin_nhan }} tin nhắn</p>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button @click.stop="deleteSession(session.session_id)" class="text-red-400 hover:text-red-600 p-1 transition-colors"><Trash2 :size="13" /></button>
                <ChevronRight :size="14" class="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        <div class="lg:col-span-2">
          <div v-if="!selectedSession" class="card h-64 flex items-center justify-center">
            <div class="text-center">
              <MessageCircle :size="32" class="mx-auto text-gray-300 mb-2" />
              <p class="text-gray-400 text-sm">Chọn một cuộc trò chuyện để xem</p>
            </div>
          </div>
          <div v-else class="card space-y-4 max-h-[500px] overflow-y-auto">
            <div v-for="msg in sessionMessages" :key="msg.id" class="space-y-3">
              <div class="flex items-start gap-2">
                <div class="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-xs">U</span>
                </div>
                <div class="bg-gradient-to-r from-sky-50 to-blue-50 text-sky-900 rounded-xl rounded-tl-sm px-3 py-2 text-sm max-w-md border border-sky-100">{{ msg.message }}</div>
              </div>
              <div class="flex items-start gap-2">
                <div class="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border">
                  <span class="text-sky-600 text-xs">AI</span>
                </div>
                <div class="bg-white border rounded-xl rounded-tl-sm px-3 py-2 text-sm max-w-md whitespace-pre-wrap shadow-sm">{{ msg.response }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════
         MODAL CHI TIẾT PHÂN LOẠI
    ══════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="detailItem" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        @click.self="closeDetail">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">

          <!-- Header modal -->
          <div class="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 class="font-bold text-gray-900 text-lg">Kết quả phân loại</h2>
              <p class="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Calendar :size="11" /> {{ formatDate(detailItem.created_at) }}
                <span class="mx-1">·</span>
                {{ detailItem.original_filename || 'Ảnh chụp' }}
              </p>
            </div>
            <button @click="closeDetail" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X :size="20" class="text-gray-500" />
            </button>
          </div>

          <div class="p-5 space-y-5">
            <!-- Ảnh -->
            <img :src="detailItem.image_path" alt="Waste"
              class="w-full rounded-xl object-contain max-h-64 bg-gray-50"
              @error="e => e.target.style.display='none'" />

            <!-- Tổng quan -->
            <div v-if="detailItem.result_json?.summary" class="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <p class="text-sm font-semibold text-sky-800 mb-1 flex items-center gap-2">
                <Info :size="15" /> Tổng quan
              </p>
              <p class="text-sm text-sky-700 leading-relaxed">{{ detailItem.result_json.summary }}</p>
              <p class="text-xs text-sky-600 mt-2 flex items-center gap-1">
                🗑️ Phát hiện <strong>{{ detailItem.result_json.totalItems || detailItem.result_json.detections?.length || 0 }}</strong> vật phẩm
              </p>
            </div>

            <!-- Chú thích màu -->
            <div v-if="uniqueCats.length" class="flex flex-wrap gap-2">
              <span v-for="cat in uniqueCats" :key="cat"
                class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium"
                :style="{ backgroundColor: hexToRgba(CATEGORY_COLORS[cat], 0.12), borderColor: CATEGORY_COLORS[cat] + '40', color: CATEGORY_COLORS[cat] }">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: CATEGORY_COLORS[cat] }" />
                {{ CATEGORY_LABELS[cat] || cat }}
              </span>
            </div>

            <!-- Chi tiết từng vật phẩm -->
            <div v-if="detailItem.result_json?.detections?.length" class="space-y-3">
              <h3 class="font-semibold text-gray-900 text-sm">Chi tiết từng vật phẩm</h3>
              <div v-for="(det, i) in detailItem.result_json.detections" :key="i"
                class="border rounded-xl p-4 border-l-4 hover-lift transition-all duration-200"
                :style="{ borderLeftColor: CATEGORY_COLORS[det.category] || '#ccc' }">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      :style="{ backgroundColor: CATEGORY_COLORS[det.category] || '#ccc' }">{{ i + 1 }}</div>
                    <div>
                      <p class="font-semibold text-gray-900 text-sm">{{ det.label }}</p>
                      <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                        :style="{ backgroundColor: hexToRgba(CATEGORY_COLORS[det.category], 0.12), color: CATEGORY_COLORS[det.category] }">
                        {{ CATEGORY_LABELS[det.category] || det.category }}
                      </span>
                    </div>
                  </div>
                  <span v-if="det.confidence" class="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg flex-shrink-0">
                    {{ Math.round(det.confidence * 100) }}%
                  </span>
                </div>
                <!-- Mô tả -->
                <p v-if="det.description" class="text-sm text-gray-600 mb-2 ml-11">{{ det.description }}</p>
                <!-- Hướng dẫn tái chế -->
                <div v-if="det.recyclingMethod" class="ml-11 bg-sky-50 rounded-lg p-3 flex items-start gap-2">
                  <Recycle :size="14" class="text-sky-600 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-sky-800 leading-relaxed">{{ det.recyclingMethod }}</p>
                </div>
              </div>
            </div>

            <!-- Tác động môi trường -->
            <div v-if="detailItem.result_json?.environmentalImpact"
              class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p class="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                🌍 Tác động môi trường
              </p>
              <p class="text-sm text-amber-700 leading-relaxed">{{ detailItem.result_json.environmentalImpact }}</p>
            </div>

            <!-- Đánh giá -->
            <div class="border-t border-gray-100 pt-4">
              <p class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Star :size="16" class="text-yellow-500" /> Đánh giá kết quả này
              </p>
              <div class="flex gap-1 mb-3">
                <button v-for="s in 5" :key="s"
                  @click="ratingForm.stars = s"
                  class="transition-transform hover:scale-110"
                  :class="s <= ratingForm.stars ? 'text-yellow-400' : 'text-gray-300'">
                  <Star :size="28" :fill="s <= ratingForm.stars ? 'currentColor' : 'none'" />
                </button>
              </div>
              <textarea v-model="ratingForm.comment" rows="2"
                class="input-field resize-none text-sm mb-3"
                placeholder="Nhận xét của bạn (tùy chọn)..." />
              <button @click="submitRating" :disabled="ratingLoading || !ratingForm.stars"
                class="btn-primary w-full py-2.5 text-sm">
                <Loader2 v-if="ratingLoading" :size="14" class="animate-spin" />
                <Send v-else :size="14" />
                {{ ratingLoading ? 'Đang gửi...' : 'Gửi đánh giá' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import api from '../config/api'
import { useToast } from 'vue-toastification'
import {
  Camera, MessageCircle, Trash2, ChevronRight, Calendar,
  Loader2, X, Eye, Info, Recycle, Star, Send
} from 'lucide-vue-next'

const toast = useToast()

const CATEGORY_COLORS = {
  'organic': '#4CAF50', 'recyclable-plastic': '#2196F3', 'recyclable-paper': '#03A9F4',
  'recyclable-metal': '#00BCD4', 'recyclable-glass': '#009688', 'non-recyclable': '#F44336',
  'hazardous': '#FFC107', 'electronic': '#9C27B0'
}
const CATEGORY_LABELS = {
  'organic': '🌿 Rác hữu cơ', 'recyclable-plastic': '♻️ Nhựa tái chế',
  'recyclable-paper': '📄 Giấy tái chế', 'recyclable-metal': '🔩 Kim loại',
  'recyclable-glass': '🫙 Thủy tinh', 'non-recyclable': '🚫 Không tái chế',
  'hazardous': '⚠️ Rác nguy hại', 'electronic': '🔌 Rác điện tử'
}

// ── State ──
const tab             = ref('classify')
const classifications = ref([])
const chatSessions    = ref([])
const selectedSession = ref(null)
const sessionMessages = ref([])
const loading         = ref(false)
const page            = ref(1)
const totalPages      = ref(1)

// Modal
const detailItem  = ref(null)
const ratingForm  = reactive({ stars: 0, comment: '' })
const ratingLoading = ref(false)

// Computed categories cho modal
const uniqueCats = computed(() =>
  [...new Set((detailItem.value?.result_json?.detections || []).map(d => d.category))]
)

// ── Tab ──
function switchTab(t) { tab.value = t; page.value = 1 }

watch([tab, page], () => {
  if (tab.value === 'classify') loadClassifications()
  else loadChatSessions()
}, { immediate: true })

// ── Load data ──
async function loadClassifications() {
  loading.value = true
  try {
    const { data } = await api.get(`/api/history/classifications?page=${page.value}&limit=9`)
    if (data.success) {
      classifications.value = data.classifications
      totalPages.value = data.pagination?.totalPages || 1
    }
  } catch (err) {
    if (err.response?.status === 401) toast.error('Vui lòng đăng nhập để xem lịch sử')
    else toast.error('Không thể tải lịch sử')
  } finally { loading.value = false }
}

async function loadChatSessions() {
  loading.value = true
  try {
    const { data } = await api.get('/api/history/chats')
    if (data.success) chatSessions.value = data.chats
  } catch (err) {
    if (err.response?.status === 401) toast.error('Vui lòng đăng nhập')
    else toast.error('Không thể tải lịch sử chat')
  } finally { loading.value = false }
}

async function loadSessionMessages(sid) {
  try {
    const { data } = await api.get(`/api/history/chats?sessionId=${sid}`)
    if (data.success) { sessionMessages.value = data.chats; selectedSession.value = sid }
  } catch { toast.error('Không thể tải tin nhắn') }
}

// ── Delete ──
async function deleteClassification(id) {
  if (!confirm('Xóa bản ghi này?')) return
  try {
    await api.delete(`/api/history/classifications/${id}`)
    toast.success('Đã xóa')
    loadClassifications()
    if (detailItem.value?.id === id) closeDetail()
  } catch { toast.error('Không thể xóa') }
}

async function deleteSession(sid) {
  if (!confirm('Xóa cuộc trò chuyện này?')) return
  try {
    await api.delete(`/api/history/chats/${sid}`)
    toast.success('Đã xóa')
    loadChatSessions()
    if (selectedSession.value === sid) selectedSession.value = null
  } catch { toast.error('Không thể xóa') }
}

// ── Modal ──
function openDetail(item) {
  detailItem.value = item
  ratingForm.stars   = 0
  ratingForm.comment = ''
  document.body.style.overflow = 'hidden'
}

function closeDetail() {
  detailItem.value = null
  document.body.style.overflow = ''
}

// ── Rating ──
async function submitRating() {
  if (!ratingForm.stars) { toast.error('Vui lòng chọn số sao'); return }
  ratingLoading.value = true
  try {
    const { data } = await api.post('/api/auth/ratings', {
      classification_id: detailItem.value.id,
      stars:   ratingForm.stars,
      comment: ratingForm.comment || null
    })
    if (data.success) {
      toast.success('Cảm ơn bạn đã đánh giá! ⭐')
      ratingForm.stars = 0; ratingForm.comment = ''
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể gửi đánh giá')
  } finally { ratingLoading.value = false }
}

// ── Utils ──
function getCategories(item) {
  return [...new Set((item.result_json?.detections || []).map(d => d.category))]
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(150,150,150,${alpha})`
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}
</script>
