<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Thống kê AI</h1>
      <p class="text-gray-500 text-sm mt-0.5">Theo dõi việc sử dụng Gemini API</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-40">
      <Loader2 class="animate-spin text-sky-500" :size="28" />
    </div>

    <template v-else-if="usage">
      <!-- Row 1: Stats cards + Line chart -->
      <div class="grid lg:grid-cols-5 gap-5 mb-6">
        <!-- Stats cards (2 cột) -->
        <div class="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
          <div v-for="card in summaryCards" :key="card.label"
            class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" :class="[card.bg, card.color]">
              <component :is="card.icon" :size="20" />
            </div>
            <p class="text-2xl font-bold text-gray-900">{{ card.value?.toLocaleString() }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ card.label }}</p>
          </div>
        </div>

        <!-- Line chart (3 cột) -->
        <div class="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp :size="18" class="text-sky-600" /> API calls 14 ngày qua
            </h3>
            <!-- Legend -->
            <div class="flex gap-3">
              <div v-for="leg in chartLegend" :key="leg.label" class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full" :style="{ background: leg.color }" />
                <span class="text-xs text-gray-500">{{ leg.label }}</span>
              </div>
            </div>
          </div>
          <div v-if="dailyChartData" style="height:220px; position:relative">
            <Line :data="dailyChartData" :options="lineOptions" />
          </div>
          <div v-else class="flex items-center justify-center text-gray-400 text-sm" style="height:220px">
            Chưa có dữ liệu
          </div>
        </div>
      </div>

      <!-- Row 2: Endpoint + Users + Donut -->
      <div class="grid lg:grid-cols-3 gap-5">
        <!-- Endpoint breakdown -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap :size="18" class="text-sky-600" /> Theo endpoint
          </h3>
          <div v-if="usage.byEndpoint?.length" class="space-y-3">
            <div v-for="(row, i) in usage.byEndpoint" :key="i">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="font-medium text-gray-700 capitalize flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ background: statusColors[row.status] }" />
                  {{ row.endpoint }}
                  <span class="text-xs text-gray-400">({{ statusLabels[row.status] }})</span>
                </span>
                <span class="font-bold text-gray-800">{{ row.count?.toLocaleString() }}</span>
              </div>
              <!-- Progress bar -->
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700"
                  :style="{ width: grandTotal > 0 ? (row.count / grandTotal * 100)+'%' : '0%', background: statusColors[row.status] }" />
              </div>
            </div>
          </div>
          <p v-else class="text-gray-400 text-sm text-center py-6">Chưa có dữ liệu</p>
        </div>

        <!-- Top users -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users :size="18" class="text-blue-600" /> Top người dùng
          </h3>
          <div v-if="usage.topUsers?.length" class="space-y-3">
            <div v-for="(u, i) in usage.topUsers" :key="i"
              class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                :style="{ background: ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444'][i] || '#6b7280' }">
                {{ i + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ u.username }}</p>
                <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-bold text-gray-800">{{ u.api_calls }}</p>
                <p class="text-xs text-gray-400">calls</p>
              </div>
            </div>
          </div>
          <p v-else class="text-gray-400 text-sm text-center py-6">Chưa có dữ liệu</p>
        </div>

        <!-- Donut chart: status breakdown -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Archive :size="18" class="text-purple-600" /> Tỷ lệ kết quả
          </h3>
          <div v-if="donutData" class="flex flex-col items-center">
            <div style="height:180px; width:180px; position:relative">
              <Doughnut :data="donutData" :options="donutOptions" />
            </div>
            <div class="mt-4 space-y-1.5 w-full">
              <div v-for="item in donutLegend" :key="item.label"
                class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: item.color }" />
                  <span class="text-gray-600">{{ item.label }}</span>
                </div>
                <span class="font-bold text-gray-800">{{ item.value?.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <div v-else class="flex items-center justify-center text-gray-400 text-sm" style="height:180px">
            Chưa có dữ liệu
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
import api from '../../config/api'
import { Zap, CheckCircle, XCircle, Archive, TrendingUp, Users, Loader2 } from 'lucide-vue-next'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler)

const usage   = ref(null)
const loading = ref(true)

const statusColors = { success: '#0ea5e9', error: '#ef4444', cached: '#8b5cf6' }
const statusLabels = { success: 'Thành công', error: 'Lỗi', cached: 'Cache' }

// ── Totals ──
const totals = computed(() => {
  const t = { success: 0, error: 0, cached: 0 }
  ;(usage.value?.byEndpoint || usage.value?.theoEndpoint || []).forEach(row => {
    t[row.status] = (t[row.status] || 0) + (row.count || row.so_lan || 0)
  })
  return t
})
const grandTotal = computed(() => totals.value.success + totals.value.error + totals.value.cached)

const summaryCards = computed(() => [
  { icon: Zap,         label: 'Tổng API calls', value: grandTotal.value,      color: 'text-blue-600',    bg: 'bg-blue-50' },
  { icon: CheckCircle, label: 'Thành công',      value: totals.value.success, color: 'text-sky-600',     bg: 'bg-sky-50' },
  { icon: Archive,     label: 'Từ cache',         value: totals.value.cached,  color: 'text-purple-600',  bg: 'bg-purple-50' },
  { icon: XCircle,     label: 'Lỗi',              value: totals.value.error,   color: 'text-red-600',     bg: 'bg-red-50' },
])

// ── Daily line chart (3 đường: success / error / cached) ──
const dailyEntries = computed(() => {
  const daily = usage.value?.daily || usage.value?.theoNgay || []
  if (!daily.length) return []
  // Build map ngay -> { success, error, cached }
  const map = {}
  daily.forEach(row => {
    const d = row.date || row.ngay
    if (!map[d]) map[d] = { success:0, error:0, cached:0 }
    const ep = row.endpoint || ''
    const st = row.status || row.trang_thai || 'success'
    map[d][st] = (map[d][st] || 0) + (row.count || row.so_lan || 0)
  })
  return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).slice(-14)
})

const chartLegend = [
  { label: 'Thành công', color: '#0ea5e9' },
  { label: 'Cache',      color: '#8b5cf6' },
  { label: 'Lỗi',        color: '#ef4444' },
]

const dailyChartData = computed(() => {
  if (!dailyEntries.value.length) return null
  const labels = dailyEntries.value.map(([d]) =>
    new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })
  )
  const mk = (key, color, label) => ({
    label,
    data: dailyEntries.value.map(([, v]) => v[key] || 0),
    borderColor: color,
    backgroundColor: color + '18',
    pointBackgroundColor: color,
    pointRadius: 4,
    pointHoverRadius: 6,
    tension: 0.4,
    fill: true,
  })
  return {
    labels,
    datasets: [
      mk('success', '#0ea5e9', 'Thành công'),
      mk('cached',  '#8b5cf6', 'Cache'),
      mk('error',   '#ef4444', 'Lỗi'),
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
const donutData = computed(() => {
  if (!grandTotal.value) return null
  return {
    labels: ['Thành công', 'Cache', 'Lỗi'],
    datasets: [{
      data: [totals.value.success, totals.value.cached, totals.value.error],
      backgroundColor: ['#0ea5e9', '#8b5cf6', '#ef4444'],
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6,
    }]
  }
})
const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } } }
}
const donutLegend = computed(() => [
  { label: 'Thành công', color: '#0ea5e9', value: totals.value.success },
  { label: 'Cache',      color: '#8b5cf6', value: totals.value.cached },
  { label: 'Lỗi',        color: '#ef4444', value: totals.value.error },
])

onMounted(async () => {
  try {
    const { data } = await api.get('/api/admin/api-usage')
    if (data.success) {
      const u = data.usage
      // Chuẩn hóa field names
      usage.value = {
        byEndpoint: u.theoEndpoint?.map(r => ({ ...r, count: r.so_lan, total_tokens: r.tong_token })) || [],
        topUsers:   u.topUser?.map(r => ({ ...r, api_calls: r.so_lan_goi })) || [],
        daily:      u.theoNgay?.map(r => ({ date: r.ngay, endpoint: r.endpoint, count: r.so_lan, status: 'success' })) || [],
      }
    }
  } catch {}
  finally { loading.value = false }
})
</script>
