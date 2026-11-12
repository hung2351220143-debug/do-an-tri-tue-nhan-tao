<template>
  <div>
    <!-- Hero Section (chứa banner carousel bên phải) -->
    <section class="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900 py-20 px-4">
      <!-- Floating decorative blobs -->
      <div class="absolute top-10 left-10 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl animate-float pointer-events-none" />
      <div class="absolute bottom-10 right-10 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl animate-float pointer-events-none" style="animation-delay:1.5s" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div class="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <!-- Cột trái: tiêu đề + mô tả + nút -->
        <div class="flex-1 text-center lg:text-left">
          <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-sky-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-fade-in-up">
            <Zap :size="14" />
            Được hỗ trợ bởi Google Gemini AI
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up" style="animation-delay:0.1s">
            Phân Loại Rác Thải
            <span class="block gradient-text">Thông Minh</span>
          </h1>
          <p class="text-lg text-sky-100/80 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style="animation-delay:0.2s">
            Chụp hoặc tải ảnh rác lên, AI sẽ nhận diện và phân loại từng vật phẩm,
            đồng thời hướng dẫn cách tái chế đúng cách để bảo vệ môi trường.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style="animation-delay:0.3s">
            <RouterLink to="/classify" class="btn-primary text-base px-8 py-3 shadow-sky-md hover:shadow-sky-lg">
              <Camera :size="20" />
              Bắt đầu phân loại
            </RouterLink>
            <RouterLink to="/chat"
              class="flex items-center gap-2 justify-center text-base px-8 py-3 rounded-lg font-semibold bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-200">
              <MessageCircle :size="20" />
              Hỏi AI về rác thải
            </RouterLink>
          </div>
          <p class="text-sm text-sky-200/70 mt-4 animate-fade-in-up" style="animation-delay:0.4s">
            ✓ Không cần đăng nhập &nbsp;|&nbsp; ✓ Miễn phí &nbsp;|&nbsp; ✓ Hỗ trợ tiếng Việt
          </p>
        </div>

        <!-- Cột phải: banner carousel (chỉ hiện khi có banner) -->
        <div v-if="banners.length" class="w-full lg:w-2/5 flex-shrink-0">
          <div class="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white/5 h-[200px] lg:h-[240px]">
            <!-- Slides -->
            <TransitionGroup name="banner-fade">
              <div v-for="(b, i) in banners" :key="b.id" v-show="currentBanner===i"
                class="absolute inset-0">
                <img :src="b.image_url" class="w-full h-full object-cover" />
                <!-- Overlay text -->
                <div v-if="b.title || b.subtitle"
                  class="absolute inset-0 flex flex-col justify-end p-6"
                  style="background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 60%)">
                  <h3 v-if="b.title" class="text-white text-xl font-bold mb-1">{{ b.title }}</h3>
                  <p v-if="b.subtitle" class="text-white/80 text-sm">{{ b.subtitle }}</p>
                  <a v-if="b.link_url" :href="b.link_url"
                    class="mt-2 inline-flex items-center gap-1.5 bg-white text-sky-700 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit hover:bg-sky-50 transition-colors">
                    Xem thêm <ChevronRight :size="14" />
                  </a>
                </div>
              </div>
            </TransitionGroup>
            <!-- Dots -->
            <div v-if="banners.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              <button v-for="(_, i) in banners" :key="i" @click="currentBanner=i;resetBannerTimer()"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="currentBanner===i ? 'bg-white w-6' : 'bg-white/50'" />
            </div>
            <!-- Prev/Next -->
            <button v-if="banners.length > 1" @click="prevBanner"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors z-10">
              <ChevronLeft :size="16" />
            </button>
            <button v-if="banners.length > 1" @click="nextBanner"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors z-10">
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Waste Types -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12 animate-fade-in-up">
          <h2 class="text-3xl font-bold text-gray-900 mb-3">Các Loại Rác Được Nhận Diện</h2>
          <p class="text-gray-500">AI phân biệt 8 loại rác với màu sắc đặc trưng riêng</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="(type, i) in WASTE_TYPES" :key="i"
            class="card hover-lift p-4 text-center"
            :style="{ animationDelay: i * 0.05 + 's' }"
          >
            <div
              class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm"
              :style="{ backgroundColor: type.color + '20' }"
            >{{ type.icon }}</div>
            <div class="flex items-center justify-center gap-1.5 mb-1">
              <span class="w-3 h-3 rounded-full ring-1 ring-white/80" :style="{ backgroundColor: type.color }" />
              <span class="font-semibold text-gray-800 text-sm">{{ type.label }}</span>
            </div>
            <p class="text-xs text-gray-500">{{ type.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12 animate-fade-in-up">
          <h2 class="text-3xl font-bold text-gray-900 mb-3">Tính Năng Nổi Bật</h2>
          <p class="text-gray-500">Đầy đủ công cụ để phân loại và tìm hiểu về rác thải</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(f, i) in FEATURES" :key="i"
            class="card hover-lift animate-fade-in-up"
            :style="{ animationDelay: i * 0.1 + 's' }"
          >
            <div :class="`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm ${colorMap[f.color]}`">
              <component :is="f.icon" :size="24" />
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ f.title }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12 animate-fade-in-up">
          <h2 class="text-3xl font-bold text-gray-900 mb-3">Cách Sử Dụng</h2>
          <p class="text-gray-500">Chỉ 3 bước đơn giản</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(step, i) in STEPS" :key="i" class="text-center animate-fade-in-up" :style="{ animationDelay: i * 0.1 + 's' }">
            <div class="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
              <component :is="step.icon" :size="28" />
            </div>
            <div class="text-5xl font-bold text-sky-500/20 -mt-2 mb-2">{{ step.step }}</div>
            <h3 class="font-bold text-gray-900 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-gray-500">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download App Section -->
    <section v-if="appConfig.download_enabled === '1'" class="py-16 px-4 bg-gradient-to-br from-gray-900 to-gray-800">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-white mb-3">Tải Ứng Dụng {{ appName }}</h2>
          <p class="text-gray-400">Cài ngay lên điện thoại để phân loại rác mọi lúc mọi nơi</p>
        </div>
        <div class="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <!-- iOS -->
          <div class="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 hover-lift transition-all duration-300">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Smartphone :size="22" class="text-gray-900" />
              </div>
              <div>
                <p class="font-bold text-white">iPhone / iPad</p>
                <p class="text-xs text-gray-400">iOS – Qua Safari</p>
              </div>
            </div>
            <p class="text-sm text-gray-300 mb-4 leading-relaxed">
              Mở Safari → bấm nút Chia sẻ → chọn "Thêm vào Màn hình chính"
            </p>
            <a v-if="appConfig.ios_web_url" :href="appConfig.ios_web_url" target="_blank"
              class="flex items-center justify-center gap-2 w-full bg-white text-gray-900 font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-all text-sm hover:-translate-y-0.5">
              <ExternalLink :size="16" /> Mở trên Safari
            </a>
            <RouterLink v-else to="/download"
              class="flex items-center justify-center gap-2 w-full bg-white text-gray-900 font-semibold py-2.5 rounded-xl text-sm">
              <Info :size="16" /> Xem hướng dẫn
            </RouterLink>
          </div>

          <!-- Android -->
          <div class="bg-sky-600/80 backdrop-blur rounded-2xl p-6 border border-sky-500/50 hover-lift transition-all duration-300">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <TabletSmartphone :size="22" class="text-sky-600" />
              </div>
              <div>
                <p class="font-bold text-white">Android</p>
                <p class="text-xs text-sky-200">Tải file APK</p>
              </div>
            </div>
            <p class="text-sm text-sky-100 mb-4 leading-relaxed">
              Tải file APK → cài đặt → mở app và bắt đầu phân loại rác
            </p>
            <a v-if="appConfig.apk_url" :href="appConfig.apk_url" target="_blank"
              class="flex items-center justify-center gap-2 w-full bg-white text-sky-700 font-semibold py-2.5 rounded-xl hover:bg-sky-50 transition-all text-sm hover:-translate-y-0.5">
              <Download :size="16" /> Tải APK{{ appConfig.apk_size ? ` (${appConfig.apk_size})` : '' }}
            </a>
            <RouterLink v-else to="/download"
              class="flex items-center justify-center gap-2 w-full bg-white text-sky-700 font-semibold py-2.5 rounded-xl text-sm">
              <Info :size="16" /> Xem hướng dẫn
            </RouterLink>
          </div>
        </div>

        <div class="text-center mt-6">
          <RouterLink to="/download" class="text-gray-400 hover:text-white text-sm underline transition-colors">
            Xem hướng dẫn cài đặt chi tiết →
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Ratings Section -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-10 animate-fade-in-up">
          <h2 class="text-3xl font-bold text-gray-900 mb-3">Đánh Giá Từ Người Dùng</h2>
          <p class="text-gray-500">Phản hồi thực tế từ cộng đồng {{ appName }}</p>
        </div>

        <div v-if="ratingsLoading" class="flex justify-center py-8">
          <Loader2 class="animate-spin text-yellow-400" :size="32" />
        </div>

        <template v-else-if="ratingsSummary.tong > 0">
          <!-- Tổng quan đánh giá -->
          <div class="grid md:grid-cols-3 gap-6 mb-10">
            <!-- Sao trung bình -->
            <div class="card hover-lift text-center py-8 flex flex-col items-center bg-gradient-to-br from-yellow-50 to-amber-50">
              <p class="text-6xl font-bold text-yellow-500 mb-2">{{ ratingsSummary.trung_binh }}</p>
              <div class="flex gap-1 mb-3">
                <Star v-for="s in 5" :key="s" :size="22"
                  :class="s <= Math.round(ratingsSummary.trung_binh) ? 'text-yellow-400' : 'text-gray-200'"
                  :fill="s <= Math.round(ratingsSummary.trung_binh) ? 'currentColor' : 'none'" />
              </div>
              <p class="text-gray-500 text-sm">{{ ratingsSummary.tong }} đánh giá</p>
            </div>

            <!-- Phân bổ theo sao -->
            <div class="card py-6 col-span-2">
              <div class="space-y-2.5">
                <div v-for="item in starBars" :key="item.star" class="flex items-center gap-3">
                  <div class="flex items-center gap-1 w-16 flex-shrink-0">
                    <span class="text-sm font-medium text-gray-700">{{ item.star }}</span>
                    <Star :size="13" class="text-yellow-400" fill="currentColor" />
                  </div>
                  <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700"
                      :class="item.color"
                      :style="{ width: ratingsSummary.tong > 0 ? (item.count / ratingsSummary.tong * 100) + '%' : '0%' }" />
                  </div>
                  <span class="text-sm text-gray-500 w-8 text-right flex-shrink-0">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Reviews gần đây -->
          <div v-if="recentReviews.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="review in recentReviews" :key="review.id"
              class="card hover-lift flex flex-col">
              <!-- User + sao -->
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <img v-if="review.avatar" :src="review.avatar"
                    class="w-full h-full object-cover"
                    @error="e => e.target.style.display='none'" />
                  <span v-else class="text-sky-600 font-bold text-sm">
                    {{ (review.full_name || review.username || 'K').charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 text-sm truncate">
                    {{ review.full_name || review.username || 'Người dùng ẩn danh' }}
                  </p>
                  <div class="flex gap-0.5 mt-0.5">
                    <Star v-for="s in 5" :key="s" :size="12"
                      :class="s <= review.stars ? 'text-yellow-400' : 'text-gray-200'"
                      :fill="s <= review.stars ? 'currentColor' : 'none'" />
                  </div>
                </div>
                <span class="text-xs text-gray-400 flex-shrink-0">{{ formatReviewDate(review.created_at) }}</span>
              </div>

              <!-- Comment -->
              <p class="text-sm text-gray-600 leading-relaxed flex-1 line-clamp-3">
                "{{ review.comment }}"
              </p>

              <!-- Thumbnail ảnh -->
              <div v-if="review.image_path" class="mt-3 rounded-xl overflow-hidden h-28 bg-gray-100">
                <img :src="review.image_path" class="w-full h-full object-cover"
                  @error="e => e.target.parentElement.style.display='none'" />
              </div>

              <!-- Admin reply -->
              <div v-if="review.admin_reply" class="mt-3 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
                <p class="text-xs font-semibold text-sky-700 mb-1 flex items-center gap-1">
                  <Shield :size="10" /> {{ appName }} phản hồi
                </p>
                <p class="text-xs text-sky-800 line-clamp-2">{{ review.admin_reply }}</p>
              </div>
            </div>
          </div>

          <!-- CTA đánh giá -->
          <div class="text-center mt-8">
            <RouterLink to="/classify"
              class="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg">
              <Star :size="18" fill="currentColor" />
              Phân loại & đánh giá ngay
            </RouterLink>
          </div>
        </template>

        <!-- Chưa có đánh giá -->
        <div v-else class="text-center py-10">
          <Star :size="40" class="mx-auto text-gray-300 mb-3" />
          <p class="text-gray-500">Hãy là người đầu tiên đánh giá {{ appName }}!</p>
          <RouterLink to="/classify" class="text-sky-600 text-sm mt-2 inline-block hover:underline">
            Thử phân loại ngay →
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 animate-gradient-shift" style="background-size: 200% 200%">
      <div class="max-w-3xl mx-auto text-center text-white">
        <Leaf :size="48" class="mx-auto mb-4 opacity-80 animate-float" />
        <h2 class="text-3xl font-bold mb-4">Bắt đầu phân loại rác ngay hôm nay</h2>
        <p class="text-sky-100 mb-8">Cùng bảo vệ môi trường với công nghệ AI hiện đại</p>
        <RouterLink to="/classify"
          class="inline-flex items-center gap-2 bg-white text-sky-700 font-bold px-8 py-3 rounded-xl shadow-lift hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
          <Camera :size="20" />
          Thử ngay - Miễn phí
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { Camera, MessageCircle, History, Shield, Recycle, Leaf, Zap, Star, Loader2, Smartphone, TabletSmartphone, Download, ExternalLink, Info, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import api from '../config/api'
import { useAppConfig } from '../stores/appConfig'

const { appName, appLogo, state: cfgState } = useAppConfig()

// ── Banner carousel ──
const banners       = ref([])
const currentBanner = ref(0)
let bannerTimer     = null

function nextBanner() {
  currentBanner.value = (currentBanner.value + 1) % banners.value.length
}
function prevBanner() {
  currentBanner.value = (currentBanner.value - 1 + banners.value.length) % banners.value.length
}
function resetBannerTimer() {
  clearInterval(bannerTimer)
  if (banners.value.length > 1) bannerTimer = setInterval(nextBanner, 4000)
}

onUnmounted(() => clearInterval(bannerTimer))

// ── App config (link tải app) ──
const appConfig = reactive({
  ios_web_url: '', apk_url: '', apk_size: '',
  app_name: 'EcoScan', download_enabled: '1'
})

// ── Ratings data ──
const ratingsLoading  = ref(false)
const ratingsSummary  = ref({ tong: 0, trung_binh: 0, nam_sao: 0, bon_sao: 0, ba_sao: 0, hai_sao: 0, mot_sao: 0 })
const recentReviews   = ref([])

const starBars = computed(() => [
  { star: 5, count: ratingsSummary.value.nam_sao || 0, color: 'bg-yellow-400' },
  { star: 4, count: ratingsSummary.value.bon_sao || 0, color: 'bg-yellow-300' },
  { star: 3, count: ratingsSummary.value.ba_sao  || 0, color: 'bg-yellow-200' },
  { star: 2, count: ratingsSummary.value.hai_sao || 0, color: 'bg-orange-300' },
  { star: 1, count: ratingsSummary.value.mot_sao || 0, color: 'bg-red-300' },
])

onMounted(async () => {
  // Load ratings + app config + banners song song
  const [ratRes, cfgRes, banRes] = await Promise.allSettled([
    api.get('/api/ratings/summary?limit=6'),
    api.get('/api/app-config'),
    api.get('/api/banners')
  ])
  if (ratRes.status === 'fulfilled' && ratRes.value.data.success) {
    ratingsSummary.value = ratRes.value.data.summary
    recentReviews.value  = ratRes.value.data.reviews
  }
  if (cfgRes.status === 'fulfilled' && cfgRes.value.data.success) {
    Object.assign(appConfig, cfgRes.value.data.config)
  }
  if (banRes.status === 'fulfilled' && banRes.value.data.success) {
    banners.value = banRes.value.data.banners
    resetBannerTimer()
  }
  ratingsLoading.value = false
})

function formatReviewDate(d) {
  if (!d) return ''
  const now  = new Date()
  const date = new Date(d)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60)     return 'Vừa xong'
  if (diff < 3600)   return `${Math.floor(diff/60)} phút trước`
  if (diff < 86400)  return `${Math.floor(diff/3600)} giờ trước`
  if (diff < 604800) return `${Math.floor(diff/86400)} ngày trước`
  return date.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })
}

const WASTE_TYPES = [
  { color: '#4CAF50', label: 'Rác hữu cơ',    desc: 'Thức ăn thừa, lá cây...',   icon: '🌿' },
  { color: '#2196F3', label: 'Nhựa tái chế',  desc: 'Chai nhựa, túi nilon...',   icon: '♻️' },
  { color: '#03A9F4', label: 'Giấy tái chế',  desc: 'Hộp giấy, báo cũ...',       icon: '📄' },
  { color: '#00BCD4', label: 'Kim loại',       desc: 'Lon nước, hộp thiếc...',    icon: '🔩' },
  { color: '#009688', label: 'Thủy tinh',      desc: 'Chai lọ thủy tinh...',      icon: '🫙' },
  { color: '#F44336', label: 'Không tái chế', desc: 'Rác sinh hoạt khác...',     icon: '🚫' },
  { color: '#FFC107', label: 'Rác nguy hại',  desc: 'Pin, thuốc, hóa chất...',   icon: '⚠️' },
  { color: '#9C27B0', label: 'Rác điện tử',   desc: 'Điện thoại, máy tính...',   icon: '🔌' },
]

const FEATURES = [
  { icon: Camera,        title: 'Phân tích ảnh AI',    desc: 'Upload hoặc chụp ảnh rác, AI sẽ tự động nhận diện và phân loại từng vật phẩm với màu sắc riêng biệt.', color: 'green' },
  { icon: MessageCircle, title: 'Chat với AI',          desc: 'Hỏi AI về cách phân loại, tái chế, và bảo vệ môi trường bằng tiếng Việt tự nhiên.',                   color: 'blue' },
  { icon: History,       title: 'Lịch sử sử dụng',     desc: 'Lưu lại toàn bộ lịch sử phân loại và chat khi đăng nhập tài khoản.',                                   color: 'purple' },
  { icon: Shield,        title: 'Quản trị hệ thống',   desc: 'Admin có thể quản lý tài khoản, xem ảnh đã upload và thống kê sử dụng AI.',                            color: 'orange' },
]

const colorMap = {
  green:  'bg-sky-100 text-sky-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

const STEPS = [
  { step: '1', icon: Camera,  title: 'Tải ảnh lên',   desc: 'Chụp ảnh hoặc tải ảnh rác thải từ thiết bị của bạn' },
  { step: '2', icon: Zap,     title: 'AI phân tích',   desc: 'Gemini AI nhận diện và phân loại từng loại rác trong ảnh' },
  { step: '3', icon: Recycle, title: 'Nhận kết quả',  desc: 'Xem kết quả với màu sắc đánh dấu và hướng dẫn tái chế' },
]
</script>

<style scoped>
.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.6s ease;
}
.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}
</style>
