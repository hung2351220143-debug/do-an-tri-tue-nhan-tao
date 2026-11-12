<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500 text-sm mt-0.5">Tổng quan hệ thống {{ appName }}</p>
      </div>
      <button @click="loadStats"
        class="flex items-center gap-2 text-sm text-gray-500 hover:text-sky-600 bg-white border border-gray-200 rounded-xl px-4 py-2 transition-colors hover:border-sky-300">
        <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" /> Làm mới
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else-if="stats">
      <!-- ── Row 1: Stat cards (4) + Mini chart ngay bên phải ── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="card in statCards" :key="card.label"
          class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center" :class="card.bg">
              <component :is="card.icon" :size="20" :class="card.color" />
            </div>
            <span v-if="card.trend" class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              +{{ card.trend }}
            </span>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ card.value?.toLocaleString() ?? '—' }}</p>
          <p class="text-sm font-medium text-gray-600 mt-0.5">{{ card.label }}</p>
          <p v-if="card.sub" class="text-xs text-gray-400 mt-0.5">{{ card.sub }}</p>
        </div>
      </div>

      <!-- ── Row 2: Line chart (lớn) + Donut ── -->
      <div class="grid lg:grid-cols-3 gap-5">
        <!-- Line chart 7 ngày — chiếm 2 cột -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp :size="18" class="text-sky-600" /> Hoạt động 7 ngày qua
            </h3>
            <!-- Legend -->
            <div class="flex gap-4">
              <div v-for="l in lineLegend" :key="l.label" class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full" :style="{ background: l.color }" />
                <span class="text-xs text-gray-500">{{ l.label }}</span>
              </div>
            </div>
          </div>
          <div style="height:260px; position:relative">
            <Line v-if="lineChartData" :data="lineChartData" :options="lineOptions" />
            <div v-else class="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có dữ liệu</div>
          </div>
        </div>

        <!-- Donut: loại rác — 1 cột -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package :size="18" class="text-blue-600" /> Phân bố loại rác
          </h3>
          <div v-if="donutData" class="flex flex-col items-center">
            <div style="height:160px; width:160px; position:relative">
              <Doughnut :data="donutData" :options="donutOpts" />
            </div>
            <div class="mt-3 space-y-1.5 w-full">
              <div v-for="([cat, count]) in sortedCategories.slice(0, 5)" :key="cat"
                class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    :style="{ background: catInfo(cat).color }" />
                  <span class="text-gray-600 truncate max-w-[90px]">{{ catInfo(cat).label }}</span>
                </div>
                <span class="font-semibold text-gray-700">{{ categoryPct(count) }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="flex items-center justify-center text-gray-400 text-sm" style="height:160px">
            Chưa có dữ liệu
          </div>
        </div>
      </div>

      <!-- ── Row 3: Bar chart loại rác + Recent activity ── -->
      <div class="grid lg:grid-cols-5 gap-5">
        <!-- Bar chart phân bố loại rác -->
        <div class="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package :size="18" class="text-blue-600" /> Số lượng từng loại rác
          </h3>
          <div v-if="barChartData" style="height:220px; position:relative">
            <Bar :data="barChartData" :options="barOptions" />
          </div>
          <div v-else class="flex items-center justify-center text-gray-400 text-sm" style="height:200px">
            Chưa có dữ liệu
          </div>
        </div>

        <!-- Quick stats -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap :size="18" class="text-orange-500" /> Thống kê nhanh
          </h3>
          <div class="space-y-3">
            <div v-for="item in quickStats" :key="item.label"
              class="flex items-center justify-between p-3 rounded-xl"
              :class="item.bg">
              <div class="flex items-center gap-2.5">
                <component :is="item.icon" :size="16" :class="item.color" />
                <span class="text-sm text-gray-700">{{ item.label }}</span>
              </div>
              <span class="font-bold text-gray-900 text-base">{{ item.value?.toLocaleString() ?? '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Row 4: Top 5 loại rác bảng xếp hạng ── -->
      <div class='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
        <h3 class='font-bold text-gray-900 mb-4 flex items-center gap-2'>
          <TrendingUp :size='18' class='text-emerald-600' /> Top 5 loại rác phân loại nhiều nhất
        </h3>
        <table class='w-full text-sm'>
          <thead>
            <tr class='border-b border-gray-100'>
              <th class='text-left py-2 text-xs font-semibold text-gray-500 uppercase w-10'>Hạng</th>
              <th class='text-left py-2 text-xs font-semibold text-gray-500 uppercase'>Loại rác</th>
              <th class='text-right py-2 text-xs font-semibold text-gray-500 uppercase'>Số lần</th>
              <th class='text-right py-2 text-xs font-semibold text-gray-500 uppercase'>Tỉ lệ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for='([cat, count], i) in sortedCategories.slice(0, 5)' :key='cat'
                class='border-b border-gray-50 hover:bg-gray-50 transition-colors'>
              <td class='py-2.5 pr-3'>
                <span class='w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center'
                  :class="i===0?'bg-yellow-100 text-yellow-700':i===1?'bg-gray-100 text-gray-600':i===2?'bg-orange-100 text-orange-600':'bg-gray-50 text-gray-500'">
                  {{ i+1 }}
                </span>
              </td>
              <td class='py-2.5'>
                <div class='flex items-center gap-2'>
                  <span class='w-3 h-3 rounded-full flex-shrink-0' :style="{ background: catInfo(cat).color }" />
                  <span class='font-medium text-gray-800'>{{ catInfo(cat).label }}</span>
                </div>
              </td>
              <td class='py-2.5 text-right font-bold text-gray-900'>{{ count.toLocaleString() }}</td>
              <td class='py-2.5 text-right'>
                <span class='text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium'>{{ categoryPct(count) }}%</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if='!sortedCategories.length' class='text-center py-8 text-gray-400 text-sm'>Chưa có dữ liệu</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js'
import { Line, Doughnut, Bar } from 'vue-chartjs'
import api from '../../config/api'
import { useAppConfig } from '../../stores/appConfig'
import { Users, Camera, MessageCircle, Zap, TrendingUp, Package, RefreshCw, Star, MessageSquare } from 'lucide-vue-next'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler)

const { appName } = useAppConfig()

const CATEGORY_INFO = {
  'organic':            { label: 'Hữu cơ',       color: '#4CAF50' },
  'recyclable-plastic': { label: 'Nhựa',          color: '#2196F3' },
  'recyclable-paper':   { label: 'Giấy',          color: '#03A9F4' },
  'recyclable-metal':   { label: 'Kim loại',      color: '#00BCD4' },
  'recyclable-glass':   { label: 'Thủy tinh',     color: '#009688' },
  'non-recyclable':     { label: 'Không tái chế', color: '#F44336' },
  'hazardous':          { label: 'Nguy hại',      color: '#FFC107' },
  'electronic':         { label: 'Điện tử',       color: '#9C27B0' },
}

const stats   = ref(null)
const loading = ref(true)

// ── Stat cards ──
const statCards = computed(() => [
  { icon: Users,         label: 'Người dùng',  value: stats.value?.tongUser,       sub: 'Đã đăng ký',                                bg: 'bg-blue-50',    color: 'text-blue-600',   trend: stats.value?.phanLoaiHomNay ? null : null },
  { icon: Camera,        label: 'Phân loại',   value: stats.value?.tongPhanLoai,   sub: `Hôm nay: ${stats.value?.phanLoaiHomNay||0}`, bg: 'bg-sky-50',     color: 'text-sky-600' },
  { icon: MessageCircle, label: 'Chat AI',     value: stats.value?.tongChat,       sub: 'Tổng tin nhắn',                             bg: 'bg-purple-50',  color: 'text-purple-600' },
  { icon: Zap,           label: 'API hôm nay', value: stats.value?.apiHomNay,      sub: `Cache hit: ${stats.value?.soLanDungCache||0}`, bg: 'bg-orange-50', color: 'text-orange-600' },
])

const quickStats = computed(() => [
  { icon: Camera,        label: 'Phân loại hôm nay', value: stats.value?.phanLoaiHomNay,  color: 'text-sky-600',    bg: 'bg-sky-50' },
  { icon: Zap,           label: 'Cache hit',          value: stats.value?.soLanDungCache,  color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Users,         label: 'Tổng users',         value: stats.value?.tongUser,        color: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: MessageCircle, label: 'Tổng chat',          value: stats.value?.tongChat,        color: 'text-emerald-600',bg: 'bg-emerald-50' },
])

// ── Line chart: phân loại + chat 7 ngày ──
const lineLegend = [
  { label: 'Phân loại/ngày', color: '#0ea5e9' },
]

const lineChartData = computed(() => {
  const days = stats.value?.thongKeNgay || []
  if (!days.length) return null
  const labels = days.map(d =>
    new Date(d.ngay).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })
  )
  return {
    labels,
    datasets: [
      {
        label: 'Phân loại',
        data: days.map(d => d.so),
        borderColor: '#0ea5e9',
        backgroundColor: '#0ea5e918',
        pointBackgroundColor: '#0ea5e9',
        tension: 0.4, fill: true, pointRadius: 5, pointHoverRadius: 7,
      },
    ]
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}` } }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, stepSize: 1 } }
  }
}

// ── Donut chart ──
const sortedCategories = computed(() =>
  Object.entries(stats.value?.thongKeLoaiRac || {}).sort(([,a],[,b]) => b - a)
)
const catTotal = computed(() =>
  Object.values(stats.value?.thongKeLoaiRac || {}).reduce((a, b) => a + b, 0)
)
const donutData = computed(() => {
  if (!sortedCategories.value.length) return null
  const top5 = sortedCategories.value.slice(0, 5)
  return {
    labels: top5.map(([cat]) => catInfo(cat).label),
    datasets: [{
      data: top5.map(([, v]) => v),
      backgroundColor: top5.map(([cat]) => catInfo(cat).color),
      borderWidth: 2, borderColor: '#fff', hoverOffset: 6,
    }]
  }
})
const donutOpts = {
  responsive: true, maintainAspectRatio: false, cutout: '60%',
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } } }
}

// ── Bar chart ──
const barChartData = computed(() => {
  if (!sortedCategories.value.length) return null
  return {
    labels: sortedCategories.value.map(([cat]) => catInfo(cat).label),
    datasets: [{
      label: 'Số vật phẩm',
      data: sortedCategories.value.map(([, v]) => v),
      backgroundColor: sortedCategories.value.map(([cat]) => catInfo(cat).color + 'cc'),
      borderColor: sortedCategories.value.map(([cat]) => catInfo(cat).color),
      borderWidth: 1, borderRadius: 6,
    }]
  }
})
const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} vật phẩm` } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 30 } },
    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, stepSize: 1 } }
  }
}

function catInfo(cat) { return CATEGORY_INFO[cat] || { label: cat, color: '#999' } }
function categoryPct(count) { return catTotal.value > 0 ? Math.round(count / catTotal.value * 100) : 0 }

async function loadStats() {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/stats')
    if (data.success) stats.value = data.stats
  } catch {}
  finally { loading.value = false }
}

onMounted(loadStats)
</script>
