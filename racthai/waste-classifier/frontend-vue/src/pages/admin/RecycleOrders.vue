<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Đơn Thu Mua Rác</h1>
        <p class="text-gray-500 text-sm mt-1">Quản lý và xử lý đơn bán rác từ khách hàng</p>
      </div>
      <!-- Stats -->
      <div class="flex gap-3">
        <div v-for="s in statsCards" :key="s.label" class="text-center bg-white rounded-xl px-4 py-2 border border-gray-200">
          <p class="text-xl font-bold" :class="s.color">{{ s.value }}</p>
          <p class="text-xs text-gray-400">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex gap-3 mb-5 flex-wrap">
      <input v-model="search" @input="debouncedLoad" type="text" placeholder="Tìm mã đơn, tên khách..."
        class="input-field max-w-xs text-sm" />
      <select v-model="filterStatus" @change="loadOrders" class="input-field w-auto text-sm">
        <option value="">Tất cả trạng thái</option>
        <option value="pending">⏳ Chờ xác nhận</option>
        <option value="confirmed">✅ Đã xác nhận</option>
        <option value="received">📦 Đã nhận hàng</option>
        <option value="paid">💳 Đã thanh toán</option>
        <option value="cancelled">❌ Đã hủy</option>
      </select>
    </div>

    <!-- Charts row -->
    <div class='grid lg:grid-cols-3 gap-5 mb-5'>
      <div class='lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm'>
        <h3 class='font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm'>
          <TrendingUp :size='16' class='text-emerald-600' /> Đơn thu mua 30 ngày qua
        </h3>
        <div v-if='lineData' style='height:220px; position:relative'>
          <Line :data='lineData' :options='{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:10 } } }, y:{ beginAtZero:true, grid:{ color:"#f1f5f9" }, ticks:{ stepSize:1 } } } }' />
        </div>
        <div v-else class='flex items-center justify-center text-gray-400 text-sm' style='height:220px'>Chưa có dữ liệu</div>
      </div>
      <div class='bg-white rounded-2xl border border-gray-200 p-5 shadow-sm'>
        <h3 class='font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm'>
          <PackageCheck :size='16' class='text-sky-600' /> Phân bố trạng thái
        </h3>
        <div v-if='statusDoughnut' style='height:220px; position:relative'>
          <Doughnut :data='statusDoughnut' :options='{ responsive:true, maintainAspectRatio:false, cutout:"55%", plugins:{ legend:{ position:"bottom", labels:{ font:{ size:10 }, padding:8 } } } }' />
        </div>
        <div v-else class='flex items-center justify-center text-gray-400 text-sm' style='height:220px'>Chưa có dữ liệu</div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12"><Loader2 class="animate-spin text-emerald-500" :size="28" /></div>
      <div v-else-if="!orders.length" class="text-center py-16">
        <PackageCheck :size="36" class="mx-auto text-gray-300 mb-2" />
        <p class="text-gray-400 text-sm">Không có đơn nào</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mã đơn / Khách</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tổng tiền</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày tạo</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Xử lý</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id" class="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
            <td class="px-4 py-3">
              <p class="font-mono font-bold text-gray-900">{{ o.order_code }}</p>
              <p class="text-xs text-gray-400">{{ o.guest_name || o.username || 'Khách đăng nhập' }}</p>
            </td>
            <td class="px-4 py-3 text-right font-bold text-emerald-700">{{ fmt(o.total_amount) }}</td>
            <td class="px-4 py-3 text-center">
              <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                :style="{ background: STATUS_COLOR[o.status]+'20', color: STATUS_COLOR[o.status] }">
                {{ STATUS_LABEL[o.status] }}
              </span>
            </td>
            <td class="px-4 py-3 text-right text-xs text-gray-400">{{ fmtDate(o.created_at) }}</td>
            <td class="px-4 py-3 text-center">
              <button @click="openDetail(o)"
                class="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 mx-auto transition-colors">
                <Eye :size="13" /> Xử lý
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 p-4">
        <button @click="page--; loadOrders()" :disabled="page===1" class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
        <span class="px-3 py-1.5 text-sm text-gray-600">{{ page }}/{{ totalPages }}</span>
        <button @click="page++; loadOrders()" :disabled="page===totalPages" class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
      </div>
    </div>

    <!-- Modal xử lý đơn -->
    <Teleport to="body">
      <div v-if="detail" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        @click.self="detail=null">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            style="background:linear-gradient(to right,#f0fdf4,#e0f2fe)">
            <div>
              <p class="font-bold text-gray-900 font-mono text-lg">{{ detail.order_code }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :style="{ background: STATUS_COLOR[detail.status]+'20', color: STATUS_COLOR[detail.status] }">
                {{ STATUS_LABEL[detail.status] }}
              </span>
            </div>
            <button @click="detail=null"><X :size="20" class="text-gray-400" /></button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Thông tin khách -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-500 mb-1">Khách hàng</p>
                <p class="font-semibold">{{ detail.guest_name || detail.username || 'Đã đăng nhập' }}</p>
                <p v-if="detail.guest_phone" class="text-gray-400 text-xs">{{ detail.guest_phone }}</p>
              </div>
              <div class="bg-emerald-50 rounded-xl p-3">
                <p class="text-xs text-gray-500 mb-1">Tổng tiền</p>
                <p class="text-xl font-bold text-emerald-700">{{ fmt(detail.total_amount) }}</p>
              </div>
            </div>

            <!-- Items -->
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-2">Vật phẩm</p>
              <div class="space-y-1.5">
                <div v-for="(it, i) in parseItems(detail.items)" :key="i"
                  class="flex justify-between text-sm bg-gray-50 rounded-xl px-3 py-2">
                  <span>{{ it.name_vi }} × {{ it.quantity }} {{ it.unit||'' }}</span>
                  <span class="font-semibold text-emerald-700">{{ fmt(it.subtotal) }}</span>
                </div>
              </div>
            </div>

            <!-- QR khách gửi -->
            <div v-if="detail.qr_image_url || detail.bank_info">
              <p class="text-sm font-semibold text-gray-700 mb-2">💳 Thông tin thanh toán của khách</p>
              <img v-if="detail.qr_image_url" :src="detail.qr_image_url"
                class="max-h-48 rounded-xl border object-contain cursor-pointer mb-2"
                @click="lightbox=detail.qr_image_url" />
              <div v-if="detail.bank_info" class="bg-sky-50 rounded-xl p-3 text-sm text-sky-800 whitespace-pre-wrap">{{ detail.bank_info }}</div>
            </div>

            <!-- Proof images -->
            <div v-if="detail.received_proof_url || detail.payment_proof_url" class="grid grid-cols-2 gap-3">
              <div v-if="detail.received_proof_url">
                <p class="text-xs text-gray-500 mb-1">Ảnh nhận hàng</p>
                <img :src="detail.received_proof_url" class="w-full rounded-xl border object-cover h-32 cursor-pointer" @click="lightbox=detail.received_proof_url" />
              </div>
              <div v-if="detail.payment_proof_url">
                <p class="text-xs text-gray-500 mb-1">Chứng từ thanh toán</p>
                <img :src="detail.payment_proof_url" class="w-full rounded-xl border object-cover h-32 cursor-pointer" @click="lightbox=detail.payment_proof_url" />
              </div>
            </div>

            <!-- Ghi chú staff -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
              <textarea v-model="staffNote" rows="2" class="input-field resize-none text-sm" placeholder="Ghi chú cho khách..." />
            </div>

            <!-- Upload proof -->
            <div class="grid grid-cols-2 gap-3">
              <label class="cursor-pointer">
                <div class="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-emerald-400 transition-colors">
                  <Camera :size="20" class="mx-auto text-gray-400 mb-1" />
                  <p class="text-xs text-gray-500">Upload ảnh nhận hàng</p>
                  <p v-if="proofFiles.received" class="text-xs text-emerald-600 mt-0.5 truncate">{{ proofFiles.received.name }}</p>
                </div>
                <input type="file" class="hidden" accept="image/*" @change="e => proofFiles.received = e.target.files[0]" />
              </label>
              <label class="cursor-pointer">
                <div class="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-sky-400 transition-colors">
                  <DollarSign :size="20" class="mx-auto text-gray-400 mb-1" />
                  <p class="text-xs text-gray-500">Upload chứng từ TT</p>
                  <p v-if="proofFiles.payment" class="text-xs text-sky-600 mt-0.5 truncate">{{ proofFiles.payment.name }}</p>
                </div>
                <input type="file" class="hidden" accept="image/*" @change="e => proofFiles.payment = e.target.files[0]" />
              </label>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button v-if="detail.status==='pending'" @click="doAction('confirm')" :disabled="acting"
                class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style="background:linear-gradient(135deg,#0ea5e9,#0284c7)">
                ✅ Xác nhận đơn
              </button>
              <button v-if="detail.status==='confirmed'" @click="doAction('received')" :disabled="acting"
                class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
                📦 Xác nhận nhận hàng
              </button>
              <button v-if="detail.status==='received'" @click="doAction('paid')" :disabled="acting"
                class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style="background:linear-gradient(135deg,#10b981,#059669)">
                💳 Xác nhận đã TT
              </button>
              <button v-if="['pending','confirmed'].includes(detail.status)" @click="doAction('cancel')" :disabled="acting"
                class="px-4 py-2.5 rounded-xl text-red-600 border border-red-200 text-sm hover:bg-red-50">
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Lightbox -->
      <div v-if="lightbox" class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" @click="lightbox=null">
        <img :src="lightbox" class="max-w-full max-h-full rounded-xl object-contain" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { PackageCheck, Loader2, Eye, X, Camera, DollarSign, TrendingUp } from 'lucide-vue-next'
import api from '../../config/api'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Filler, Title, Tooltip, Legend
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Title, Tooltip, Legend)

const toast = useToast()
const orders      = ref([])
const loading     = ref(true)
const detail      = ref(null)
const lightbox    = ref(null)
const search      = ref('')
const filterStatus = ref('')
const page        = ref(1)
const totalPages  = ref(1)
const staffNote   = ref('')
const acting      = ref(false)
const proofFiles  = reactive({ received: null, payment: null })
const statsData   = ref({ pending:0, confirmed:0, received:0, paid:0 })

const STATUS_LABEL = { pending:'⏳ Chờ', confirmed:'✅ Đã xác nhận', received:'📦 Nhận hàng', paid:'💳 Đã TT', cancelled:'❌ Hủy' }
const STATUS_COLOR = { pending:'#f59e0b', confirmed:'#0ea5e9', received:'#8b5cf6', paid:'#10b981', cancelled:'#ef4444' }

const chartRaw = ref({ byDay: [], byStatus: [] })
const chartLoading = ref(false)

async function loadChart() {
  chartLoading.value = true
  try {
    const { data } = await api.get('/api/recycle/orders/chart')
    if (data.success) chartRaw.value = data
  } catch {}
  finally { chartLoading.value = false }
}

const lineData = computed(() => {
  const days = chartRaw.value.byDay || []
  if (!days.length) return null
  return {
    labels: days.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })),
    datasets: [{
      label: 'Đơn thu mua',
      data: days.map(d => d.count),
      borderColor: '#10b981',
      backgroundColor: '#10b98118',
      pointBackgroundColor: '#10b981',
      tension: 0.4, fill: true, pointRadius: 4,
    }]
  }
})

const statusDoughnut = computed(() => {
  const stat = chartRaw.value.byStatus || []
  if (!stat.length) return null
  return {
    labels: stat.map(s => STATUS_LABEL[s.status] || s.status),
    datasets: [{
      data: stat.map(s => s.count),
      backgroundColor: stat.map(s => (STATUS_COLOR[s.status] || '#999') + '55'),
      borderColor:     stat.map(s => STATUS_COLOR[s.status] || '#999'),
      borderWidth: 2, hoverOffset: 6,
    }]
  }
})

const statsCards = computed(() => [
  { label: 'Chờ xác nhận', value: statsData.value.pending||0,   color: 'text-yellow-600' },
  { label: 'Đã xác nhận',  value: statsData.value.confirmed||0, color: 'text-sky-600' },
  { label: 'Đã nhận hàng', value: statsData.value.received||0,  color: 'text-purple-600' },
  { label: 'Đã thanh toán',value: statsData.value.paid||0,      color: 'text-emerald-600' },
])

let searchTimer = null
function debouncedLoad() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value=1; loadOrders() }, 400)
}

async function loadOrders() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, limit: 15 })
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (search.value) params.set('search', search.value)
    const { data } = await api.get(`/api/recycle/orders?${params}`)
    if (data.success) {
      orders.value    = data.orders
      totalPages.value = data.pagination?.totalPages || 1
      // Dùng byStatus từ chart endpoint (đã load trong loadChart()) thay vì gọi API thêm
      if (chartRaw.value.byStatus?.length) {
        const byS = {}
        chartRaw.value.byStatus.forEach(s => { byS[s.status] = s.count })
        statsData.value = {
          pending:   byS['pending']   || 0,
          confirmed: byS['confirmed'] || 0,
          received:  byS['received']  || 0,
          paid:      byS['paid']      || 0,
        }
      }
    }
  } catch {}
  finally { loading.value = false }
}

function openDetail(o) {
  detail.value   = { ...o }
  staffNote.value = o.staff_note || ''
  proofFiles.received = null
  proofFiles.payment  = null
}

async function doAction(action) {
  acting.value = true
  try {
    // Upload proofs nếu có
    if (proofFiles.received) {
      const fd = new FormData(); fd.append('proof', proofFiles.received); fd.append('type', 'received')
      const { data } = await api.post(`/api/recycle/orders/${detail.value.id}/upload-proof`, fd)
      if (data.success) detail.value.received_proof_url = data.url
    }
    if (proofFiles.payment) {
      const fd = new FormData(); fd.append('proof', proofFiles.payment); fd.append('type', 'payment')
      const { data } = await api.post(`/api/recycle/orders/${detail.value.id}/upload-proof`, fd)
      if (data.success) detail.value.payment_proof_url = data.url
    }
    // Thực hiện action
    const body = { staff_note: staffNote.value }
    const { data } = await api.put(`/api/recycle/orders/${detail.value.id}/${action}`, body)
    if (data.success) {
      toast.success(data.message || 'Thành công!')
      detail.value.status = action === 'confirm' ? 'confirmed' : action === 'received' ? 'received' : action === 'paid' ? 'paid' : 'cancelled'
      loadOrders()
    }
  } catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
  finally { acting.value = false }
}

function parseItems(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw||[]) } catch { return [] }
}
function fmt(n) { return Number(n).toLocaleString('vi-VN') + 'đ' }
function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
}

onMounted(async () => { await loadChart(); loadOrders() })
</script>
