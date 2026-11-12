<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Quản Lý Đánh Giá</h1>
        <p class="text-gray-500 text-sm mt-1">Xem, sửa, xóa và trả lời đánh giá của người dùng</p>
      </div>
      <!-- Thống kê nhanh -->
      <div class="hidden md:flex items-center gap-3">
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-center">
          <p class="text-xl font-bold text-yellow-600">{{ summary.trung_binh || '–' }}</p>
          <p class="text-xs text-yellow-500">Sao TB</p>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
          <p class="text-xl font-bold text-blue-600">{{ summary.tong || 0 }}</p>
          <p class="text-xs text-blue-500">Tổng</p>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex gap-2 mb-5 flex-wrap">
      <button v-for="f in STAR_FILTERS" :key="f.value"
        @click="filterStars = f.value; page = 1; loadRatings()"
        class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
        :class="filterStars === f.value
          ? 'bg-yellow-500 text-white border-yellow-500'
          : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-300'">
        {{ f.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="animate-spin text-yellow-500" :size="32" />
    </div>

    <div v-else class="grid lg:grid-cols-5 gap-5">
      <!-- Danh sách trái -->
      <div class="lg:col-span-2 space-y-2">
        <div v-if="!ratings.length" class="bg-white rounded-xl border border-gray-200 text-center py-16">
          <Star :size="36" class="mx-auto text-gray-300 mb-3" />
          <p class="text-gray-500 text-sm">Chưa có đánh giá nào</p>
        </div>

        <div v-for="r in ratings" :key="r.id"
          @click="select(r)"
          class="bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md"
          :class="selected?.id === r.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
              <img v-if="r.avatar" :src="r.avatar" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
              <span v-else class="text-sm font-bold text-gray-600">{{ (r.full_name||r.username||'?').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ r.full_name || r.username || 'Khách' }}</p>
                <div class="flex flex-shrink-0">
                  <Star v-for="s in 5" :key="s" :size="12"
                    :class="s <= r.stars ? 'text-yellow-400' : 'text-gray-200'"
                    :fill="s <= r.stars ? 'currentColor' : 'none'" />
                </div>
              </div>
              <p v-if="r.comment" class="text-xs text-gray-500 truncate mt-0.5">{{ r.comment }}</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-xs text-gray-400 flex items-center gap-1"><Clock :size="10" />{{ formatDate(r.created_at) }}</p>
                <span v-if="r.admin_reply" class="text-xs bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">Đã trả lời</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center gap-2 pt-2">
          <button @click="page--; loadRatings()" :disabled="page===1" class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
          <span class="px-3 py-1.5 text-sm text-gray-600">{{ page }}/{{ totalPages }}</span>
          <button @click="page++; loadRatings()" :disabled="page===totalPages" class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
        </div>
      </div>

      <!-- Chi tiết phải -->
      <div class="lg:col-span-3">
        <div v-if="!selected" class="space-y-4">
          <!-- Average star display -->
          <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
            <div class="text-center">
              <p class="text-5xl font-bold text-yellow-500">{{ summary.trung_binh || '–' }}</p>
              <div class="flex justify-center gap-0.5 mt-1">
                <Star v-for="s in 5" :key="s" :size="18"
                  :class="s <= Math.round(summary.trung_binh) ? 'text-yellow-400' : 'text-gray-200'"
                  :fill="s <= Math.round(summary.trung_binh) ? 'currentColor' : 'none'" />
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ summary.tong }} đánh giá</p>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-700 mb-2">Phân bố số sao</p>
              <div v-if="starBarData" style="height:130px; position:relative">
                <Bar :data="starBarData" :options="{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ beginAtZero:true, grid:{ display:false }, ticks:{ font:{ size:10 } } }, y:{ grid:{ display:false }, ticks:{ font:{ size:11 } } } } }" />
              </div>
              <div v-else class="flex items-center justify-center text-gray-400 text-sm" style="height:130px">Chưa có dữ liệu</div>
            </div>
          </div>
          <!-- 30-day trend -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <p class="text-sm font-semibold text-gray-700 mb-3">Xu hướng 30 ngày</p>
            <div v-if="trendLineData" style="height:150px; position:relative">
              <Line :data="trendLineData" :options="{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:10 } } }, y:{ min:1, max:5, grid:{ color:'#f1f5f9' }, ticks:{ stepSize:1, font:{ size:10 } } } } }" />
            </div>
            <div v-else class="flex items-center justify-center text-gray-400 text-sm" style="height:150px">Chưa có dữ liệu</div>
          </div>
          <!-- 5 recent comments -->
          <div v-if="chartData?.recent?.length" class="bg-white rounded-xl border border-gray-200 p-5">
            <p class="text-sm font-semibold text-gray-700 mb-3">Bình luận gần đây</p>
            <div class="space-y-3">
              <div v-for="r in chartData.recent" :key="r.created_at + r.username" class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-yellow-700 text-xs font-bold">{{ (r.full_name||r.username||'?').charAt(0).toUpperCase() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-800">{{ r.full_name || r.username }}</span>
                    <div class="flex">
                      <Star v-for="s in 5" :key="s" :size="11"
                        :class="s <= r.stars ? 'text-yellow-400' : 'text-gray-200'"
                        :fill="s <= r.stars ? 'currentColor' : 'none'" />
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 truncate">{{ r.comment }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <img v-if="selected.avatar" :src="selected.avatar" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
                <span v-else class="text-sm font-bold text-gray-600">{{ (selected.full_name||selected.username||'?').charAt(0).toUpperCase() }}</span>
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ selected.full_name || selected.username || 'Khách' }}</p>
                <p class="text-xs text-gray-400">{{ selected.email }}</p>
              </div>
            </div>
            <button @click="deleteRating(selected.id)" class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors">
              <Trash2 :size="16" />
            </button>
          </div>

          <div class="p-5 space-y-4">
            <!-- Ảnh phân loại -->
            <div v-if="selected.image_path" class="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <img :src="selected.image_path" class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                @error="e=>e.target.style.display='none'" />
              <div>
                <p class="text-xs text-gray-500">Ảnh phân loại</p>
                <p class="text-sm font-medium text-gray-700 truncate">{{ selected.original_filename || 'Ảnh chụp' }}</p>
              </div>
            </div>

            <!-- Sao + Form sửa sao/comment -->
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-2">Số sao (Admin sửa):</p>
              <div class="flex gap-1 mb-3">
                <button v-for="s in 5" :key="s" @click="editForm.stars = s" class="transition-transform hover:scale-110">
                  <Star :size="28" :class="s <= editForm.stars ? 'text-yellow-400' : 'text-gray-200'"
                    :fill="s <= editForm.stars ? 'currentColor' : 'none'" />
                </button>
              </div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Nội dung đánh giá (Admin sửa):</label>
              <textarea v-model="editForm.comment" rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Nội dung đánh giá..." />
              <button @click="saveEdit" :disabled="editLoading"
                class="mt-2 flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                <Loader2 v-if="editLoading" :size="14" class="animate-spin" />
                <Pencil v-else :size="14" />
                {{ editLoading ? 'Đang lưu...' : 'Lưu chỉnh sửa' }}
              </button>
            </div>

            <!-- Cuộc hội thoại -->
            <div class="border-t border-gray-100 pt-4 space-y-3">
              <!-- Đánh giá gốc của user -->
              <div class="flex gap-2.5">
                <div class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {{ (selected.full_name||selected.username||'?').charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1">
                  <div class="bg-blue-50 rounded-xl rounded-tl-sm px-3 py-2.5">
                    <div class="flex gap-0.5 mb-1.5">
                      <Star v-for="s in 5" :key="s" :size="14"
                        :class="s <= selected.stars ? 'text-yellow-400' : 'text-gray-300'"
                        :fill="s <= selected.stars ? 'currentColor' : 'none'" />
                    </div>
                    <p v-if="selected.comment" class="text-sm text-gray-800 whitespace-pre-wrap">{{ selected.comment }}</p>
                    <p v-else class="text-sm text-gray-400 italic">Không có nhận xét</p>
                  </div>
                  <p class="text-xs text-gray-400 mt-1 ml-1">{{ formatDate(selected.created_at) }}</p>
                </div>
              </div>

              <!-- Reply admin hiện tại -->
              <div v-if="selected.admin_reply" class="flex gap-2.5 flex-row-reverse">
                <div class="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                  <Shield :size="13" class="text-white" />
                </div>
                <div class="flex-1">
                  <div class="bg-sky-50 border border-sky-200 rounded-xl rounded-tr-sm px-3 py-2.5">
                    <p class="text-xs font-semibold text-sky-700 mb-1">Admin trả lời</p>
                    <p class="text-sm text-sky-900 whitespace-pre-wrap">{{ selected.admin_reply }}</p>
                  </div>
                  <p class="text-xs text-gray-400 mt-1 text-right mr-1">{{ formatDate(selected.replied_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Form trả lời -->
            <div class="border-t border-gray-100 pt-4">
              <p class="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Reply :size="15" class="text-sky-600" />
                {{ selected.admin_reply ? 'Sửa phản hồi' : 'Trả lời đánh giá' }}
              </p>
              <textarea v-model="replyText" rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                :placeholder="`Nhập phản hồi cho ${selected.full_name||selected.username||'người dùng'}...`" />
              <button @click="sendReply" :disabled="replyLoading || !replyText.trim()"
                class="mt-2 w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
                <Loader2 v-if="replyLoading" :size="14" class="animate-spin" />
                <Send v-else :size="14" />
                {{ replyLoading ? 'Đang gửi...' : 'Gửi phản hồi' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../config/api'
import { useToast } from 'vue-toastification'
import { Star, Loader2, Clock, Trash2, Send, Shield, Reply, Pencil } from 'lucide-vue-next'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Filler, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Title, Tooltip, Legend)

const toast = useToast()

const STAR_FILTERS = [
  { label: 'Tất cả', value: null },
  { label: '⭐⭐⭐⭐⭐ 5 sao', value: 5 },
  { label: '⭐⭐⭐⭐ 4 sao', value: 4 },
  { label: '⭐⭐⭐ 3 sao',   value: 3 },
  { label: '⭐⭐ 2 sao',    value: 2 },
  { label: '⭐ 1 sao',      value: 1 },
]

const ratings    = ref([])
const selected   = ref(null)
const summary    = reactive({ tong: 0, trung_binh: 0 })
const loading    = ref(false)
const editLoading = ref(false)
const replyLoading = ref(false)
const replyText  = ref('')
const filterStars = ref(null)
const page       = ref(1)
const totalPages = ref(1)
const editForm   = reactive({ stars: 0, comment: '' })

const chartData = ref(null)

async function loadChartData() {
  try {
    const { data } = await api.get('/api/ratings/chart')
    if (data.success) chartData.value = data
  } catch {}
}

const starBarData = computed(() => {
  if (!chartData.value?.byStar?.length) return null
  const map = {}
  chartData.value.byStar.forEach(s => { map[s.stars] = s.count })
  return {
    labels: ['5 ★', '4 ★', '3 ★', '2 ★', '1 ★'],
    datasets: [{
      label: 'Đánh giá',
      data: [5,4,3,2,1].map(s => map[s] || 0),
      backgroundColor: ['#22c55e80','#84cc1680','#facc1580','#fb923c80','#ef444480'],
      borderColor:     ['#22c55e',  '#84cc16',  '#facc15',  '#fb923c',  '#ef4444'],
      borderWidth: 1, borderRadius: 6,
    }]
  }
})

const trendLineData = computed(() => {
  const days = chartData.value?.byDay || []
  if (!days.length) return null
  return {
    labels: days.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })),
    datasets: [{
      label: 'Sao TB',
      data: days.map(d => Number(d.avg_stars).toFixed(1)),
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b18',
      pointBackgroundColor: '#f59e0b',
      tension: 0.4, fill: true, pointRadius: 4,
    }]
  }
})

onMounted(() => {
  loadRatings()
  loadSummary()
  loadChartData()
})

async function loadSummary() {
  try {
    const { data } = await api.get('/api/ratings/summary')
    if (data.success) {
      summary.tong = data.summary.tong
      summary.trung_binh = data.summary.trung_binh
    }
  } catch {}
}

async function loadRatings() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, limit: 15 })
    if (filterStars.value) params.set('stars', filterStars.value)
    const { data } = await api.get(`/api/ratings/admin/all?${params}`)
    if (data.success) {
      ratings.value    = data.ratings
      totalPages.value = data.pagination.totalPages
    }
  } catch { toast.error('Không thể tải danh sách đánh giá') }
  finally { loading.value = false }
}

function select(r) {
  selected.value   = { ...r }
  editForm.stars   = r.stars
  editForm.comment = r.comment || ''
  replyText.value  = r.admin_reply || ''
}

async function saveEdit() {
  editLoading.value = true
  try {
    const { data } = await api.put(`/api/ratings/admin/${selected.value.id}`, {
      stars:   editForm.stars,
      comment: editForm.comment
    })
    if (data.success) {
      toast.success('Đã cập nhật đánh giá!')
      selected.value.stars   = editForm.stars
      selected.value.comment = editForm.comment
      const idx = ratings.value.findIndex(r => r.id === selected.value.id)
      if (idx !== -1) { ratings.value[idx].stars = editForm.stars; ratings.value[idx].comment = editForm.comment }
    }
  } catch (e) { toast.error(e.response?.data?.message || 'Lỗi cập nhật') }
  finally { editLoading.value = false }
}

async function sendReply() {
  if (!replyText.value.trim()) return
  replyLoading.value = true
  try {
    const { data } = await api.put(`/api/ratings/admin/${selected.value.id}/reply`, { reply: replyText.value.trim() })
    if (data.success) {
      toast.success('Đã gửi phản hồi!')
      selected.value.admin_reply = replyText.value.trim()
      selected.value.replied_at  = new Date().toISOString()
      const idx = ratings.value.findIndex(r => r.id === selected.value.id)
      if (idx !== -1) ratings.value[idx].admin_reply = replyText.value.trim()
    }
  } catch (e) { toast.error(e.response?.data?.message || 'Lỗi gửi phản hồi') }
  finally { replyLoading.value = false }
}

async function deleteRating(id) {
  if (!confirm('Xóa đánh giá này?')) return
  try {
    await api.delete(`/api/ratings/${id}`)
    toast.success('Đã xóa')
    ratings.value = ratings.value.filter(r => r.id !== id)
    selected.value = null
    replyText.value = ''
    summary.tong = Math.max(0, summary.tong - 1)
  } catch { toast.error('Không thể xóa') }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
</script>
