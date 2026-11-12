<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PackageCheck :size="24" class="text-emerald-600" /> Đơn Thu Mua Rác
        </h1>
        <p class="text-gray-500 text-sm mt-1">Theo dõi trạng thái đơn bán rác tái chế của bạn</p>
      </div>
      <RouterLink to="/classify" class="btn-primary text-sm px-4 py-2">
        <Camera :size="15" /> Quét ảnh mới
      </RouterLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-emerald-500" :size="32" />
    </div>

    <div v-else-if="!orders.length" class="text-center py-16 card">
      <PackageCheck :size="40" class="mx-auto text-gray-300 mb-3" />
      <p class="text-gray-500 font-medium">Chưa có đơn nào</p>
      <RouterLink to="/classify" class="text-emerald-600 text-sm mt-2 inline-block hover:underline">
        Quét ảnh để tạo đơn →
      </RouterLink>
    </div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id"
        class="card border-l-4 hover:shadow-md transition-all cursor-pointer"
        :style="{ borderLeftColor: STATUS_COLOR[order.status] }"
        @click="selected = order">

        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono font-bold text-gray-900">{{ order.order_code }}</span>
              <span class="text-xs px-2.5 py-1 rounded-full font-semibold"
                :style="{ background: STATUS_COLOR[order.status]+'20', color: STATUS_COLOR[order.status] }">
                {{ STATUS_LABEL[order.status] }}
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock :size="11" /> {{ formatDate(order.created_at) }}
            </p>
            <!-- Items preview -->
            <div class="flex flex-wrap gap-1 mt-2">
              <span v-for="(item, i) in parseItems(order.items)" :key="i"
                class="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                {{ item.name_vi }} ×{{ item.quantity }}
              </span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-lg font-bold text-emerald-700">{{ fmt(order.total_amount) }}</p>
            <ChevronRight :size="16" class="text-gray-400 mt-1 ml-auto" />
          </div>
        </div>

        <!-- Timeline mini -->
        <div class="flex items-center gap-1 mt-3 overflow-x-auto">
          <div v-for="(step, i) in STEPS" :key="i" class="flex items-center gap-1 flex-shrink-0">
            <div class="flex flex-col items-center">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                :class="isStepDone(order, step.key) ? 'text-white' : 'bg-gray-100 text-gray-400'"
                :style="isStepDone(order, step.key) ? { background: STATUS_COLOR[step.key] || '#10b981' } : {}">
                {{ i+1 }}
              </div>
              <p class="text-xs mt-0.5 whitespace-nowrap"
                :class="isStepDone(order, step.key) ? 'text-emerald-600 font-medium' : 'text-gray-400'">
                {{ step.label }}
              </p>
            </div>
            <div v-if="i < STEPS.length-1" class="w-6 h-0.5 mt-[-10px]"
              :class="isStepDone(order, STEPS[i+1]?.key) ? 'bg-emerald-400' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal chi tiết -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        @click.self="selected=null">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            style="background:linear-gradient(135deg,#f0fdf4,#e0f2fe)">
            <div>
              <p class="font-bold text-gray-900 font-mono">{{ selected.order_code }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                :style="{ background: STATUS_COLOR[selected.status]+'20', color: STATUS_COLOR[selected.status] }">
                {{ STATUS_LABEL[selected.status] }}
              </span>
            </div>
            <button @click="selected=null"><X :size="20" class="text-gray-400" /></button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Items -->
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-2">Vật phẩm</p>
              <div class="space-y-2">
                <div v-for="(it, i) in parseItems(selected.items)" :key="i"
                  class="flex justify-between text-sm bg-gray-50 rounded-xl px-3 py-2">
                  <span class="text-gray-700">{{ it.name_vi }} × {{ it.quantity }} {{ it.unit||'' }}</span>
                  <span class="font-semibold text-emerald-700">{{ fmt(it.subtotal) }}</span>
                </div>
              </div>
              <div class="flex justify-between font-bold text-base mt-3 pt-3 border-t border-gray-200">
                <span>Tổng:</span>
                <span class="text-emerald-700">{{ fmt(selected.total_amount) }}</span>
              </div>
            </div>

            <!-- QR đã gửi -->
            <div v-if="selected.qr_image_url">
              <p class="text-sm font-semibold text-gray-700 mb-2">QR / TK ngân hàng đã gửi:</p>
              <img :src="selected.qr_image_url" class="max-w-full rounded-xl border cursor-pointer max-h-48 object-contain"
                @click="lightbox=selected.qr_image_url" />
            </div>
            <div v-if="selected.bank_info" class="bg-sky-50 rounded-xl p-3 text-sm text-sky-800 whitespace-pre-wrap">{{ selected.bank_info }}</div>

            <!-- Ghi chú từ staff -->
            <div v-if="selected.staff_note" class="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p class="text-xs font-semibold text-yellow-700 mb-1">Ghi chú từ nhân viên:</p>
              <p class="text-sm text-yellow-800">{{ selected.staff_note }}</p>
            </div>

            <!-- Ảnh xác nhận nhận hàng -->
            <div v-if="selected.received_proof_url">
              <p class="text-sm font-semibold text-gray-700 mb-2">✅ Ảnh xác nhận đã nhận hàng:</p>
              <img :src="selected.received_proof_url" class="max-w-full rounded-xl border max-h-48 object-contain cursor-pointer"
                @click="lightbox=selected.received_proof_url" />
            </div>

            <!-- Ảnh chứng từ thanh toán -->
            <div v-if="selected.payment_proof_url">
              <p class="text-sm font-semibold text-gray-700 mb-2">💳 Chứng từ thanh toán:</p>
              <img :src="selected.payment_proof_url" class="max-w-full rounded-xl border max-h-48 object-contain cursor-pointer"
                @click="lightbox=selected.payment_proof_url" />
            </div>

            <!-- Timeline chi tiết -->
            <div class="border-t border-gray-100 pt-4">
              <p class="text-sm font-semibold text-gray-700 mb-3">Lịch sử trạng thái</p>
              <div class="space-y-2">
                <div v-for="step in STEPS" :key="step.key"
                  class="flex items-center gap-3"
                  :class="isStepDone(selected, step.key) ? 'opacity-100' : 'opacity-30'">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                    :style="{ background: isStepDone(selected, step.key) ? (STATUS_COLOR[step.key]||'#10b981') : '#e5e7eb' }">
                    ✓
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ step.label }}</p>
                    <p v-if="selected[step.timeField]" class="text-xs text-gray-400">{{ formatDate(selected[step.timeField]) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lightbox -->
      <div v-if="lightbox" class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
        @click="lightbox=null">
        <img :src="lightbox" class="max-w-full max-h-full rounded-xl object-contain" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PackageCheck, Camera, Loader2, X, ChevronRight, Clock } from 'lucide-vue-next'
import api from '../config/api'

const orders   = ref([])
const loading  = ref(true)
const selected = ref(null)
const lightbox = ref(null)

const STATUS_LABEL = { pending:'⏳ Chờ xác nhận', confirmed:'✅ Đã xác nhận', received:'📦 Đã nhận hàng', paid:'💳 Đã thanh toán', cancelled:'❌ Đã hủy' }
const STATUS_COLOR = { pending:'#f59e0b', confirmed:'#0ea5e9', received:'#8b5cf6', paid:'#10b981', cancelled:'#ef4444' }
const STEPS = [
  { key:'pending',   label:'Đặt đơn',       timeField:'created_at' },
  { key:'confirmed', label:'Xác nhận',       timeField:'confirmed_at' },
  { key:'received',  label:'Nhận hàng',      timeField:'received_at' },
  { key:'paid',      label:'Thanh toán',     timeField:'paid_at' },
]

function isStepDone(order, key) {
  const idx = STEPS.findIndex(s => s.key === key)
  const cur  = STEPS.findIndex(s => s.key === order.status)
  return order.status !== 'cancelled' && cur >= idx
}

function parseItems(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw||[]) } catch { return [] }
}

function fmt(n) { return Number(n).toLocaleString('vi-VN') + 'đ' }
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

onMounted(async () => {
  try {
    const { data } = await api.get('/api/recycle/orders/my')
    if (data.success) orders.value = data.orders
  } catch {}
  finally { loading.value = false }
})
</script>
