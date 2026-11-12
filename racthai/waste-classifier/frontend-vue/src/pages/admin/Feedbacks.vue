<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Phản Hồi Khách Hàng</h1>
        <p class="text-gray-500 text-sm mt-1">Quản lý và trả lời phản hồi từ người dùng</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="chuaDoc > 0" class="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold animate-pulse">
          {{ chuaDoc }} chưa đọc
        </span>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-5 border-b border-gray-200">
      <button v-for="f in FILTERS" :key="f.value"
        @click="filterStatus = f.value; page = 1; loadFeedbacks()"
        class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="filterStatus === f.value
          ? 'border-sky-600 text-sky-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'">
        {{ f.label }}
        <span v-if="f.value === '' && chuaDoc > 0"
          class="ml-1.5 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{{ chuaDoc }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2 class="animate-spin text-sky-500" :size="32" />
    </div>

    <!-- Layout: danh sách trái + chi tiết phải -->
    <div v-else class="grid lg:grid-cols-5 gap-5">

      <!-- Danh sách -->
      <div class="lg:col-span-2 space-y-2">
        <div v-if="!feedbacks.length" class="text-center py-16 bg-white rounded-xl border border-gray-200">
          <MessageSquare :size="36" class="mx-auto text-gray-300 mb-3" />
          <p class="text-gray-500">Không có phản hồi nào</p>
        </div>

        <div v-for="fb in feedbacks" :key="fb.id"
          @click="selectFeedback(fb)"
          class="bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md"
          :class="selected?.id === fb.id ? 'border-sky-500 bg-sky-50' : 'border-gray-200'">
          <div class="flex items-start gap-3">
            <!-- Avatar -->
            <div class="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 flex items-center justify-center">
              <img v-if="fb.avatar" :src="fb.avatar" class="w-full h-full object-cover" @error="e => e.target.style.display='none'" />
              <span v-else class="text-sm font-bold text-gray-600">{{ fb.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ fb.name }}</p>
                <!-- Badge trạng thái -->
                <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                  :class="{
                    'bg-red-100 text-red-600':    fb.status === 'pending',
                    'bg-yellow-100 text-yellow-700': fb.status === 'read',
                    'bg-sky-100 text-sky-700': fb.status === 'replied'
                  }">
                  {{ STATUS_LABEL[fb.status] }}
                </span>
              </div>
              <p class="text-xs text-gray-500 truncate mt-0.5">{{ fb.subject }}</p>
              <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock :size="10" /> {{ formatDate(fb.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center gap-2 pt-2">
          <button @click="page--; loadFeedbacks()" :disabled="page===1" class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
          <span class="px-3 py-1.5 text-sm text-gray-600">{{ page }}/{{ totalPages }}</span>
          <button @click="page++; loadFeedbacks()" :disabled="page===totalPages" class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
        </div>
      </div>

      <!-- Chi tiết + trả lời -->
      <div class="lg:col-span-3 h-[calc(100vh-10rem)] overflow-y-auto">
        <!-- Placeholder -->
        <div v-if="!selected" class="space-y-4">
          <!-- 3 stat cards -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-red-600">{{ chuaDoc }}</p>
              <p class="text-xs text-red-500 mt-0.5">Chưa đọc</p>
            </div>
            <div class="bg-sky-50 border border-sky-100 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-sky-600">{{ feedbacks.filter(f=>f.status==='replied').length }}</p>
              <p class="text-xs text-sky-500 mt-0.5">Đã trả lời</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-gray-700">{{ feedbacks.length }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Tổng (trang này)</p>
            </div>
          </div>
          <!-- Doughnut + Bar row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <p class="text-sm font-semibold text-gray-700 mb-3">Phân bố trạng thái</p>
              <div v-if="fbDoughnutData" style="height:160px; position:relative">
                <Doughnut :data="fbDoughnutData" :options="{ responsive:true, maintainAspectRatio:false, cutout:'60%', plugins:{ legend:{ position:'bottom', labels:{ font:{ size:11 } } } } }" />
              </div>
              <div v-else class="flex items-center justify-center text-gray-400 text-sm" style="height:160px">Chưa có dữ liệu</div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <p class="text-sm font-semibold text-gray-700 mb-3">Số lượng theo trạng thái</p>
              <div style="height:160px; position:relative">
                <Bar :data="fbBarData" :options="{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true, ticks:{ stepSize:1 } } } }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Chi tiết -->
        <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">

          <!-- Header chi tiết -->
          <div class="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-bold text-gray-900">{{ selected.subject }}</h3>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="{
                    'bg-red-100 text-red-600':    selected.status === 'pending',
                    'bg-yellow-100 text-yellow-700': selected.status === 'read',
                    'bg-sky-100 text-sky-700': selected.status === 'replied'
                  }">
                  {{ STATUS_LABEL[selected.status] }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                <span class="flex items-center gap-1"><User :size="11" /> {{ selected.name }}</span>
                <span class="flex items-center gap-1"><Mail :size="11" /> {{ selected.email }}</span>
                <span class="flex items-center gap-1"><Clock :size="11" /> {{ formatDate(selected.created_at) }}</span>
              </div>
            </div>
            <button @click="deleteFeedback(selected.id)"
              class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors flex-shrink-0">
              <Trash2 :size="16" />
            </button>
          </div>

          <!-- Nội dung cuộc hội thoại -->
          <div class="p-5 space-y-4 max-h-[400px] overflow-y-auto">

            <!-- Tin nhắn user -->
            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span class="text-blue-600 text-sm font-bold">{{ selected.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="flex-1">
                <div class="bg-blue-50 rounded-xl rounded-tl-sm p-4">
                  <p class="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{{ selected.message }}</p>
                </div>
                <p class="text-xs text-gray-400 mt-1 ml-1">{{ formatDate(selected.created_at) }}</p>
              </div>
            </div>

            <!-- Phản hồi admin (nếu có) -->
            <div v-if="selected.admin_reply" class="flex gap-3 flex-row-reverse">
              <div class="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                <Shield :size="14" class="text-white" />
              </div>
              <div class="flex-1">
                <div class="bg-sky-50 border border-sky-200 rounded-xl rounded-tr-sm p-4">
                  <p class="text-xs font-semibold text-sky-700 mb-1.5 flex items-center gap-1">
                    <Shield :size="11" /> Admin trả lời
                  </p>
                  <p class="text-sm text-sky-900 whitespace-pre-wrap leading-relaxed">{{ selected.admin_reply }}</p>
                </div>
                <p class="text-xs text-gray-400 mt-1 text-right mr-1">{{ formatDate(selected.replied_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Form trả lời -->
          <div class="px-5 pb-5 border-t border-gray-100 pt-4">
            <p class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Reply :size="15" class="text-sky-600" />
              {{ selected.admin_reply ? 'Chỉnh sửa phản hồi' : 'Trả lời' }}
            </p>
            <textarea v-model="replyText" rows="4"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              :placeholder="`Nhập nội dung trả lời cho ${selected.name}...`" />
            <div class="flex gap-2 mt-3">
              <button @click="sendReply" :disabled="replyLoading || !replyText.trim()"
                class="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
                <Loader2 v-if="replyLoading" :size="15" class="animate-spin" />
                <Send v-else :size="15" />
                {{ replyLoading ? 'Đang gửi...' : 'Gửi phản hồi' }}
              </button>
              <button v-if="replyText" @click="replyText = ''"
                class="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../config/api'
import { useToast } from 'vue-toastification'
import { MessageSquare, Loader2, Clock, User, Mail, Trash2, Send, Shield, Reply } from 'lucide-vue-next'
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale,
  LinearScale, Title, Tooltip, Legend
} from 'chart.js'
import { Doughnut, Bar } from 'vue-chartjs'
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend)

const toast = useToast()

const FILTERS = [
  { label: 'Tất cả',      value: '' },
  { label: 'Chưa đọc',   value: 'pending' },
  { label: 'Đã đọc',     value: 'read' },
  { label: 'Đã trả lời', value: 'replied' },
]
const STATUS_LABEL = { pending: 'Chưa đọc', read: 'Đã đọc', replied: 'Đã trả lời' }

const feedbacks    = ref([])
const selected     = ref(null)
const chuaDoc      = ref(0)
const loading      = ref(false)
const replyLoading = ref(false)
const replyText    = ref('')
const filterStatus = ref('')
const page         = ref(1)
const totalPages   = ref(1)

const fbDoughnutData = computed(() => {
  const pending  = feedbacks.value.filter(f => f.status === 'pending').length
  const read     = feedbacks.value.filter(f => f.status === 'read').length
  const replied  = feedbacks.value.filter(f => f.status === 'replied').length
  if (!pending && !read && !replied) return null
  return {
    labels: ['Chưa đọc', 'Đã đọc', 'Đã trả lời'],
    datasets: [{ data: [pending, read, replied],
      backgroundColor: ['#ef4444', '#f59e0b', '#0ea5e9'],
      borderWidth: 2, borderColor: '#fff', hoverOffset: 4 }]
  }
})

const fbBarData = computed(() => {
  const counts = { pending: 0, read: 0, replied: 0 }
  feedbacks.value.forEach(f => { if (counts[f.status] !== undefined) counts[f.status]++ })
  return {
    labels: ['Chưa đọc', 'Đã đọc', 'Đã trả lời'],
    datasets: [{ label: 'Số phản hồi',
      data: [counts.pending, counts.read, counts.replied],
      backgroundColor: ['#ef444440', '#f59e0b40', '#0ea5e940'],
      borderColor:     ['#ef4444',  '#f59e0b',  '#0ea5e9'],
      borderWidth: 1, borderRadius: 6 }]
  }
})

onMounted(() => loadFeedbacks())

async function loadFeedbacks() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, limit: 15 })
    if (filterStatus.value) params.set('status', filterStatus.value)
    const { data } = await api.get(`/api/admin/feedbacks?${params}`)
    if (data.success) {
      feedbacks.value  = data.feedbacks
      chuaDoc.value    = data.chuaDoc
      totalPages.value = data.pagination.totalPages
    }
  } catch { toast.error('Không thể tải phản hồi') }
  finally { loading.value = false }
}

async function selectFeedback(fb) {
  selected.value  = fb
  replyText.value = fb.admin_reply || ''
  // Gọi API chi tiết để đánh dấu đã đọc
  try {
    const { data } = await api.get(`/api/admin/feedbacks/${fb.id}`)
    if (data.success) {
      selected.value = data.feedback
      replyText.value = data.feedback.admin_reply || ''
      // Cập nhật status trong list
      const idx = feedbacks.value.findIndex(f => f.id === fb.id)
      if (idx !== -1) feedbacks.value[idx].status = data.feedback.status
      if (data.feedback.status !== 'pending') chuaDoc.value = Math.max(0, chuaDoc.value - 1)
    }
  } catch {}
}

async function sendReply() {
  if (!replyText.value.trim()) return
  replyLoading.value = true
  try {
    const { data } = await api.put(`/api/admin/feedbacks/${selected.value.id}/reply`, {
      reply: replyText.value.trim()
    })
    if (data.success) {
      toast.success('Đã gửi phản hồi!')
      selected.value.admin_reply = replyText.value.trim()
      selected.value.status = 'replied'
      selected.value.replied_at = new Date().toISOString()
      const idx = feedbacks.value.findIndex(f => f.id === selected.value.id)
      if (idx !== -1) feedbacks.value[idx].status = 'replied'
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể gửi phản hồi')
  } finally { replyLoading.value = false }
}

async function deleteFeedback(id) {
  if (!confirm('Xóa phản hồi này?')) return
  try {
    await api.delete(`/api/admin/feedbacks/${id}`)
    toast.success('Đã xóa')
    feedbacks.value = feedbacks.value.filter(f => f.id !== id)
    selected.value = null
    replyText.value = ''
  } catch { toast.error('Không thể xóa') }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>
