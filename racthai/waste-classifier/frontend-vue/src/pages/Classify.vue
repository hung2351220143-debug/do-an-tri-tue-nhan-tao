<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Phân Loại Rác Thải</h1>
      <p class="text-gray-500 mt-1">Upload hoặc chụp ảnh, AI sẽ tự động nhận diện và phân loại rác</p>
      <div v-if="!auth.state.user" class="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 w-fit">
        <Info :size="15" />
        Đăng nhập để lưu lịch sử phân loại
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Left: Upload -->
      <div class="space-y-4">
        <template v-if="!image">
          <!-- Camera modal -->
          <div v-if="showCamera" class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <video ref="videoRef" autoplay playsinline class="w-full max-w-lg rounded-xl" />
            <div class="flex gap-4 mt-6">
              <button @click="capturePhoto" class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition">
                <Camera :size="28" class="text-gray-800" />
              </button>
              <button @click="stopCamera" class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition">
                <X :size="28" class="text-white" />
              </button>
            </div>
          </div>

          <!-- Drop zone -->
          <div
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef.click()"
            class="group border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200"
            :class="dragOver
              ? 'scale-[1.02] border-sky-400 bg-gradient-to-br from-sky-50 to-blue-50 shadow-sky-sm'
              : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50/80'"
          >
            <div class="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload class="text-sky-600 group-hover:scale-110 transition-transform duration-200" :size="28" />
            </div>
            <p class="font-bold text-gray-800 mb-1">Kéo thả ảnh vào đây</p>
            <p class="text-gray-400 text-sm">hoặc click để chọn file</p>
            <p class="text-xs text-gray-400 mt-2">JPG, PNG, WEBP - Tối đa 10MB</p>
          </div>

          <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="e => handleFileSelect(e.target.files[0])" />

          <button @click="startCamera" class="btn-secondary w-full py-3 hover-lift">
            <Camera :size="18" />
            Chụp ảnh từ camera
          </button>
        </template>

        <template v-else>
          <!-- Preview / Canvas -->
          <div class="relative rounded-2xl overflow-hidden bg-gray-900 shadow-xl ring-1 ring-white/10">
            <img ref="imgRef" :src="image" alt="Original" class="hidden" crossorigin="anonymous" />
            <canvas v-if="result?.detections?.length" ref="canvasRef" class="w-full h-auto max-h-96 object-contain block" />
            <img v-else :src="image" alt="Preview" class="w-full h-auto max-h-96 object-contain" />
            <button @click="reset" class="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all hover:scale-110">
              <X :size="16" />
            </button>
            <div v-if="result?.cached" class="absolute top-3 left-3 bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full">
              ⚡ Từ cache
            </div>
          </div>

          <button v-if="!result" @click="handleClassify" :disabled="loading" class="btn-primary w-full py-3 text-base">
            <Loader2 v-if="loading" :size="20" class="animate-spin" />
            <Recycle v-else :size="20" />
            {{ loading ? 'AI đang phân tích...' : 'Phân tích ngay' }}
          </button>

          <button v-if="result" @click="reset" class="btn-secondary w-full py-2.5">
            Phân loại ảnh khác
          </button>
        </template>
      </div>

      <!-- Right: Results -->
      <div>
        <!-- Skeleton loading state -->
        <div v-if="loading" class="card h-full p-6 space-y-4">
          <div class="skeleton h-6 w-3/4 rounded-xl" />
          <div class="skeleton h-4 w-full rounded-xl" />
          <div class="skeleton h-4 w-5/6 rounded-xl" />
          <div class="skeleton h-32 w-full rounded-xl mt-4" />
          <div class="skeleton h-6 w-1/2 rounded-xl" />
          <div class="skeleton h-16 w-full rounded-xl" />
          <div class="skeleton h-16 w-full rounded-xl" />
        </div>

        <div v-else-if="!result" class="card h-full flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Recycle :size="28" class="text-gray-400" />
            </div>
            <p class="text-gray-500 font-medium">Kết quả sẽ hiển thị ở đây</p>
            <p class="text-sm text-gray-400 mt-1">Upload ảnh và nhấn "Phân tích ngay"</p>
          </div>
        </div>

        <div v-else class="space-y-4 animate-fade-in-up">
          <!-- Summary -->
          <div class="card border-l-4 border-sky-500 bg-gradient-to-r from-sky-50/50 to-transparent">
            <h3 class="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Info :size="16" class="text-sky-600" /> Tổng quan
            </h3>
            <p class="text-gray-700 text-sm leading-relaxed">{{ result.summary || 'Phân tích hoàn tất.' }}</p>
            <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>🗑️ Phát hiện: <strong class="text-gray-800">{{ result.totalItems || result.detections?.length || 0 }}</strong> vật phẩm</span>
            </div>
          </div>

          <!-- Legend -->
          <div v-if="result.detections?.length" class="card">
            <h3 class="font-bold text-gray-900 mb-3">Chú thích màu sắc</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="cat in uniqueCategories" :key="cat"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                :style="{ backgroundColor: catInfo(cat).bg, borderColor: catInfo(cat).color + '40', color: catInfo(cat).color }"
              >
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: catInfo(cat).color }" />
                {{ catInfo(cat).icon }} {{ catInfo(cat).label }}
              </span>
            </div>
          </div>

          <!-- Detected items -->
          <div v-if="result.detections?.length" class="space-y-3">
            <h3 class="font-bold text-gray-900">Chi tiết từng vật phẩm</h3>
            <div
              v-for="(item, i) in result.detections" :key="i"
              @click="selectedItem = selectedItem === i ? null : i"
              class="card cursor-pointer hover-lift transition-all p-4 border-l-4 animate-fade-in-up"
              :style="{ borderLeftColor: catInfo(item.category).color, animationDelay: i * 0.05 + 's' }"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    :style="{ backgroundColor: catInfo(item.category).color }">
                    {{ i + 1 }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{{ item.label }}</p>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      :style="{ backgroundColor: catInfo(item.category).bg, color: catInfo(item.category).color }">
                      {{ catInfo(item.category).icon }} {{ catInfo(item.category).label }}
                    </span>
                  </div>
                </div>
                <span v-if="item.confidence" class="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {{ Math.round(item.confidence * 100) }}%
                </span>
              </div>

              <div v-if="selectedItem === i" class="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in-up">
                <p v-if="item.description" class="text-sm text-gray-600">{{ item.description }}</p>
                <div v-if="item.recyclingMethod" class="flex items-start gap-2 bg-sky-50 rounded-lg p-3">
                  <Recycle :size="15" class="text-sky-600 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-sky-800">{{ item.recyclingMethod }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="card text-center py-8">
            <AlertTriangle :size="32" class="text-amber-400 mx-auto mb-3" />
            <p class="font-medium text-gray-700">Không phát hiện rác thải trong ảnh</p>
            <p class="text-sm text-gray-400 mt-1">Thử upload ảnh khác có chứa rác thải</p>
          </div>

          <!-- ── WIDGET ĐÁNH GIÁ ── -->
          <div v-if="result && classificationId" class="card mt-4 border-2 animate-scale-in"
            :class="ratingDone ? 'border-sky-200 bg-sky-50' : 'border-yellow-200 bg-yellow-50'">
            <div v-if="!ratingDone">
              <p class="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-sm">
                <Star :size="16" class="text-yellow-500" fill="currentColor" />
                Kết quả này có hữu ích không?
              </p>
              <p class="text-xs text-gray-500 mb-3">Đánh giá giúp chúng tôi cải thiện AI</p>
              <!-- Sao -->
              <div class="flex gap-1 mb-3">
                <button v-for="s in 5" :key="s"
                  @click="ratingForm.stars = s"
                  class="transition-transform hover:scale-125 active:scale-110">
                  <Star :size="32"
                    :class="s <= ratingForm.stars ? 'text-yellow-400' : 'text-gray-300'"
                    :fill="s <= ratingForm.stars ? 'currentColor' : 'none'" />
                </button>
              </div>
              <!-- Label gợi ý -->
              <p v-if="ratingForm.stars" class="text-xs font-medium mb-2"
                :class="['','text-red-500','text-orange-500','text-yellow-600','text-blue-600','text-sky-600'][ratingForm.stars]">
                {{ ['','😞 Rất tệ','😕 Tệ','😐 Bình thường','😊 Tốt','🤩 Rất tốt!'][ratingForm.stars] }}
              </p>
              <!-- Comment -->
              <textarea v-model="ratingForm.comment" rows="2"
                class="w-full px-3 py-2 text-sm border border-yellow-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                placeholder="Nhận xét thêm (tùy chọn)..." />
              <button @click="submitRating"
                :disabled="ratingLoading || !ratingForm.stars"
                class="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                :class="ratingForm.stars ? 'bg-yellow-500 hover:bg-yellow-600 text-white hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400'">
                <Loader2 v-if="ratingLoading" :size="14" class="animate-spin" />
                <Star v-else :size="14" />
                {{ ratingLoading ? 'Đang gửi...' : 'Gửi đánh giá' }}
              </button>
            </div>
            <!-- Đã đánh giá -->
            <div v-else class="text-center py-2">
              <div class="flex justify-center gap-0.5 mb-2">
                <Star v-for="s in 5" :key="s" :size="20"
                  :class="s <= ratingDone ? 'text-yellow-400' : 'text-gray-300'"
                  :fill="s <= ratingDone ? 'currentColor' : 'none'" />
              </div>
              <p class="text-sm font-medium text-sky-700">✅ Cảm ơn bạn đã đánh giá!</p>
              <button @click="ratingDone = 0" class="text-xs text-gray-400 hover:underline mt-1">Sửa đánh giá</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── PANEL THU MUA RÁC TÁI CHẾ ── -->
    <div v-if="result && recyclablePrices.length" class="card mt-4 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-sky-50">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white" style="background:linear-gradient(135deg,#10b981,#0ea5e9)">
          <DollarSign :size="16" />
        </div>
        <div>
          <p class="font-bold text-gray-900 text-sm">♻️ Thu Mua Rác Tái Chế</p>
          <p class="text-xs text-gray-500">Các vật phẩm đủ điều kiện thu mua từ kết quả phân loại</p>
        </div>
      </div>

      <!-- Danh sách vật phẩm đủ điều kiện -->
      <div class="space-y-3 mb-4">
        <div v-for="item in recyclablePrices" :key="item.priceId"
          class="flex items-center gap-3 bg-white rounded-xl p-3 border border-emerald-100">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 text-sm">{{ item.label }}</p>
            <p class="text-xs text-emerald-600 font-medium">{{ formatMoney(item.price_per_unit) }}/{{ item.unit }}</p>
            <p v-if="item.quality_note" class="text-xs text-gray-400 mt-0.5 truncate">{{ item.quality_note }}</p>
          </div>
          <!-- Số lượng -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button @click="item.qty = Math.max(item.min_quantity, item.qty - 1)"
              class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors">-</button>
            <input v-model.number="item.qty" type="number" :min="item.min_quantity"
              class="w-14 text-center text-sm border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              @change="item.qty = Math.max(item.min_quantity, item.qty||item.min_quantity)" />
            <button @click="item.qty++"
              class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors">+</button>
          </div>
          <!-- Thành tiền -->
          <div class="text-right flex-shrink-0 w-24">
            <p class="font-bold text-emerald-700 text-sm">{{ formatMoney(item.price_per_unit * item.qty) }}</p>
          </div>
        </div>
      </div>

      <!-- Tổng tiền -->
      <div class="flex items-center justify-between bg-emerald-100 rounded-xl px-4 py-3 mb-4">
        <p class="font-semibold text-gray-700">Tổng ước tính:</p>
        <p class="text-xl font-bold text-emerald-700">{{ formatMoney(totalRecycle) }}</p>
      </div>

      <button @click="showOrderModal = true"
        class="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
        style="background:linear-gradient(135deg,#10b981,#0ea5e9)">
        <PackageCheck :size="18" />
        Bán rác ngay
      </button>
    </div>

    <!-- Modal tạo đơn bán rác -->
    <Teleport to="body">
      <div v-if="showOrderModal" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        @click.self="showOrderModal=false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            style="background:linear-gradient(135deg,#f0fdf4,#e0f2fe)">
            <h3 class="font-bold text-gray-900 flex items-center gap-2"><PackageCheck :size="18" class="text-emerald-600" /> Tạo đơn bán rác</h3>
            <button @click="showOrderModal=false" class="text-gray-400 hover:text-gray-600"><X :size="20" /></button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Thông tin khách nếu chưa đăng nhập -->
            <div v-if="!auth.state.user" class="space-y-3">
              <p class="text-sm font-semibold text-gray-700">Thông tin của bạn</p>
              <input v-model="orderForm.guest_name" type="text" placeholder="Họ và tên *" class="input-field text-sm" />
              <input v-model="orderForm.guest_phone" type="tel" placeholder="Số điện thoại *" class="input-field text-sm" />
            </div>

            <!-- Danh sách items -->
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-2">Vật phẩm bán</p>
              <div class="space-y-2">
                <div v-for="item in recyclablePrices" :key="item.priceId"
                  class="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                  <span class="text-gray-800">{{ item.label }} × {{ item.qty }} {{ item.unit }}</span>
                  <span class="font-semibold text-emerald-700">{{ formatMoney(item.price_per_unit * item.qty) }}</span>
                </div>
              </div>
              <div class="flex justify-between font-bold text-base mt-3 pt-3 border-t border-gray-200">
                <span>Tổng cộng:</span>
                <span class="text-emerald-700">{{ formatMoney(totalRecycle) }}</span>
              </div>
            </div>

            <!-- Thông tin tài khoản NH / QR -->
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-2">Thông tin nhận thanh toán</p>
              <textarea v-model="orderForm.bank_info" rows="2"
                class="input-field text-sm resize-none"
                placeholder="Ngân hàng: Vietcombank&#10;STK: 1234567890&#10;Tên: Nguyễn Văn A" />
              <div class="mt-2">
                <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-sky-600">
                  <div class="flex items-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-xl hover:border-sky-400 transition-colors w-full">
                    <QrCode :size="16" class="text-gray-400" />
                    <span>{{ qrFile ? qrFile.name : 'Tải ảnh QR tài khoản (tùy chọn)' }}</span>
                  </div>
                  <input type="file" class="hidden" accept="image/*" @change="onQrFile" />
                </label>
              </div>
            </div>

            <button @click="submitOrder" :disabled="orderLoading || (!auth.state.user && (!orderForm.guest_name || !orderForm.guest_phone))"
              class="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style="background:linear-gradient(135deg,#10b981,#0ea5e9)">
              <Loader2 v-if="orderLoading" :size="16" class="animate-spin" />
              <PackageCheck v-else :size="16" />
              {{ orderLoading ? 'Đang gửi...' : 'Xác nhận gửi đơn' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal xác nhận đơn thành công -->
    <Teleport to="body">
      <div v-if="orderSuccess" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        @click.self="orderSuccess=null">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageCheck :size="32" class="text-emerald-600" />
          </div>
          <h3 class="font-bold text-gray-900 text-lg mb-1">Đặt đơn thành công!</h3>
          <p class="text-emerald-700 font-mono font-bold text-xl mb-4">{{ orderSuccess.order_code }}</p>
          <!-- Hướng dẫn giao hàng -->
          <div class="bg-sky-50 rounded-xl p-4 text-left text-sm space-y-2 mb-4">
            <p class="font-semibold text-sky-800">📦 Hướng dẫn gửi hàng:</p>
            <p class="text-sky-700"><strong>Địa chỉ:</strong> {{ orderSuccess.shop_info?.shop_address }}</p>
            <p class="text-sky-700"><strong>SĐT:</strong> {{ orderSuccess.shop_info?.shop_phone }}</p>
            <p class="text-gray-600 whitespace-pre-line">{{ orderSuccess.shop_info?.ship_guide }}</p>
          </div>
          <p class="text-xs text-gray-400 mb-4">{{ orderSuccess.shop_info?.payment_note }}</p>
          <div class="flex gap-2">
            <RouterLink to="/recycle-orders" @click="orderSuccess=null"
              class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style="background:linear-gradient(135deg,#10b981,#0ea5e9)">
              Xem đơn của tôi
            </RouterLink>
            <button @click="orderSuccess=null" class="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, reactive, onMounted } from 'vue'
import api from '../config/api'
import { useToast } from 'vue-toastification'
import { Upload, Camera, X, Loader2, Info, Recycle, AlertTriangle, Star, DollarSign, PackageCheck, QrCode } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const toast = useToast()

const CATEGORY_INFO = {
  'organic':            { label: 'Rác hữu cơ',    color: '#4CAF50', bg: '#E8F5E9', icon: '🌿' },
  'recyclable-plastic': { label: 'Nhựa tái chế',  color: '#2196F3', bg: '#E3F2FD', icon: '♻️' },
  'recyclable-paper':   { label: 'Giấy tái chế',  color: '#03A9F4', bg: '#E1F5FE', icon: '📄' },
  'recyclable-metal':   { label: 'Kim loại',       color: '#00BCD4', bg: '#E0F7FA', icon: '🔩' },
  'recyclable-glass':   { label: 'Thủy tinh',      color: '#009688', bg: '#E0F2F1', icon: '🫙' },
  'non-recyclable':     { label: 'Không tái chế',  color: '#F44336', bg: '#FFEBEE', icon: '🚫' },
  'hazardous':          { label: 'Rác nguy hại',   color: '#FFC107', bg: '#FFFDE7', icon: '⚠️' },
  'electronic':         { label: 'Rác điện tử',    color: '#9C27B0', bg: '#F3E5F5', icon: '🔌' },
}

const image = ref(null)
const imageFile = ref(null)
const result = ref(null)
const loading = ref(false)
const dragOver = ref(false)
const showCamera = ref(false)
const selectedItem = ref(null)

// Rating state
const classificationId = ref(null)
const ratingForm  = reactive({ stars: 0, comment: '' })
const ratingLoading = ref(false)
const ratingDone  = ref(0)

// ── Thu mua rác ──
const allPrices      = ref([])
const recyclablePrices = computed(() => {
  if (!result.value?.detections?.length) return []
  const cats = [...new Set(result.value.detections.map(d => d.category))]
  return allPrices.value
    .filter(p => cats.includes(p.category) && p.is_active)
    .map(p => ({
      ...p,
      priceId: p.id,
      label: result.value.detections.find(d => d.category === p.category)?.label || p.name_vi,
      qty: p.min_quantity
    }))
})
const totalRecycle = computed(() =>
  recyclablePrices.value.reduce((s, i) => s + i.price_per_unit * (i.qty||i.min_quantity), 0)
)
const showOrderModal = ref(false)
const orderSuccess   = ref(null)
const orderLoading   = ref(false)
const qrFile         = ref(null)
const orderForm      = reactive({ guest_name: '', guest_phone: '', bank_info: '' })

function formatMoney(n) {
  return Number(n).toLocaleString('vi-VN') + 'đ'
}

function onQrFile(e) { qrFile.value = e.target.files[0] }

async function submitOrder() {
  if (!auth.state.user && (!orderForm.guest_name || !orderForm.guest_phone)) return
  orderLoading.value = true
  try {
    const items = recyclablePrices.value.map(i => ({
      category: i.category, name_vi: i.name_vi,
      quantity: i.qty, price_per_unit: i.price_per_unit,
      subtotal: i.price_per_unit * i.qty
    }))
    const payload = { items, total_amount: totalRecycle.value, bank_info: orderForm.bank_info }
    if (!auth.state.user) { payload.guest_name = orderForm.guest_name; payload.guest_phone = orderForm.guest_phone }

    const { data } = await api.post('/api/recycle/orders', payload)
    if (!data.success) throw new Error(data.message)

    // Upload QR nếu có
    if (qrFile.value) {
      const fd = new FormData(); fd.append('qr', qrFile.value)
      await api.post(`/api/recycle/orders/${data.order.id}/upload-qr`, fd)
    }
    orderSuccess.value = { ...data.order, shop_info: data.shop_info }
    showOrderModal.value = false
    qrFile.value = null
    toast.success('Đặt đơn thành công!')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể tạo đơn')
  } finally { orderLoading.value = false }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/api/recycle/prices')
    if (data.success) allPrices.value = data.prices
  } catch {}
}) // 0 = chưa, n = số sao đã đánh giá

const fileInputRef = ref(null)
const canvasRef = ref(null)
const imgRef = ref(null)
const videoRef = ref(null)
const streamRef = ref(null)

const uniqueCategories = computed(() =>
  [...new Set((result.value?.detections || []).map(d => d.category))]
)

function catInfo(cat) {
  return CATEGORY_INFO[cat] || CATEGORY_INFO['non-recyclable']
}

function handleFileSelect(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) { toast.error('Chỉ chấp nhận file ảnh!'); return }
  if (file.size > 10 * 1024 * 1024) { toast.error('File ảnh không được vượt quá 10MB!'); return }
  imageFile.value = file
  image.value = URL.createObjectURL(file)
  result.value = null
  selectedItem.value = null
}

function handleDrop(e) {
  dragOver.value = false
  handleFileSelect(e.dataTransfer.files[0])
}

async function startCamera() {
  try {
    // iOS Safari yêu cầu HTTPS và constraints cụ thể
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' }, // camera sau
        width:  { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    streamRef.value = stream
    showCamera.value = true
    // iOS cần gán srcObject sau khi DOM render
    setTimeout(() => {
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        videoRef.value.setAttribute('playsinline', true)  // iOS bắt buộc
        videoRef.value.setAttribute('muted', true)
        videoRef.value.play().catch(() => {})
      }
    }, 150)
  } catch (err) {
    console.error('Camera error:', err)
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      toast.error('⛔ Camera bị từ chối. Vào Cài đặt → Safari → Camera → Cho phép.')
    } else if (err.name === 'NotFoundError') {
      toast.error('Không tìm thấy camera trên thiết bị.')
    } else if (location.protocol !== 'https:') {
      toast.error('📵 Camera yêu cầu HTTPS. Vui lòng dùng link ngrok (https://).')
    } else {
      toast.error('Không thể truy cập camera: ' + err.message)
    }
  }
}

function capturePhoto() {
  const video = videoRef.value
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  canvas.toBlob(blob => {
    handleFileSelect(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
    stopCamera()
  }, 'image/jpeg', 0.9)
}

function stopCamera() {
  if (streamRef.value) { streamRef.value.getTracks().forEach(t => t.stop()); streamRef.value = null }
  showCamera.value = false
}

function drawBoundingBoxes(detections) {
  const canvas = canvasRef.value
  const img = imgRef.value
  if (!canvas || !img || !detections?.length) return
  const ctx = canvas.getContext('2d')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0)
  detections.forEach((item, index) => {
    const { boundingBox, color, label } = item
    if (!boundingBox) return
    const x = (boundingBox.xPercent / 100) * canvas.width
    const y = (boundingBox.yPercent / 100) * canvas.height
    const w = (boundingBox.widthPercent / 100) * canvas.width
    const h = (boundingBox.heightPercent / 100) * canvas.height
    const c = color || CATEGORY_INFO[item.category]?.color || '#4CAF50'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4
    ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, canvas.width / 300)
    ctx.strokeRect(x, y, w, h)
    const fontSize = Math.max(12, canvas.width / 60)
    ctx.font = `bold ${fontSize}px Arial`
    const textW = ctx.measureText(label).width + 16
    const labelH = fontSize + 12
    ctx.shadowBlur = 0; ctx.fillStyle = c
    ctx.beginPath(); ctx.roundRect(x, Math.max(0, y - labelH), textW, labelH, 4); ctx.fill()
    ctx.fillStyle = 'white'; ctx.fillText(label, x + 8, Math.max(labelH - 6, y - 6))
    const circleR = Math.max(10, canvas.width / 80)
    ctx.fillStyle = c; ctx.beginPath()
    ctx.arc(x + w - circleR - 4, y + circleR + 4, circleR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'white'; ctx.font = `bold ${circleR}px Arial`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(index + 1, x + w - circleR - 4, y + circleR + 4)
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  })
}

async function handleClassify() {
  if (!imageFile.value) return
  loading.value = true; result.value = null
  const formData = new FormData()
  formData.append('image', imageFile.value)
  try {
    const { data } = await api.post('/api/classify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data.success) {
      result.value = data.result
      classificationId.value = data.classificationId
      ratingForm.stars   = 0
      ratingForm.comment = ''
      ratingDone.value   = 0
      if (data.result.cached) toast.success('Kết quả từ cache! ⚡')
      else toast.success('Phân loại thành công! 🎉')
      setTimeout(() => {
        if (imgRef.value?.complete) drawBoundingBoxes(data.result.detections)
        else if (imgRef.value) imgRef.value.onload = () => drawBoundingBoxes(data.result.detections)
      }, 100)
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Không thể phân tích ảnh. Vui lòng thử lại.')
  } finally {
    loading.value = false
  }
}

function reset() {
  image.value = null; imageFile.value = null; result.value = null
  selectedItem.value = null; classificationId.value = null
  ratingForm.stars = 0; ratingForm.comment = ''; ratingDone.value = 0
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function submitRating() {
  if (!ratingForm.stars || !classificationId.value) return
  ratingLoading.value = true
  try {
    const { data } = await api.post('/api/ratings', {
      classification_id: classificationId.value,
      stars:   ratingForm.stars,
      comment: ratingForm.comment || null
    })
    if (data.success) {
      ratingDone.value = ratingForm.stars
      toast.success('Cảm ơn bạn đã đánh giá! ⭐')
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể gửi đánh giá')
  } finally {
    ratingLoading.value = false
  }
}

onUnmounted(() => { if (streamRef.value) streamRef.value.getTracks().forEach(t => t.stop()) })
</script>
