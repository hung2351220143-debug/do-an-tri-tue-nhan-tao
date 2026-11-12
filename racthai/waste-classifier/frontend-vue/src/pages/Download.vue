<template>
  <div class="relative min-h-[calc(100vh-64px)] bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900 overflow-hidden">
    <!-- Floating blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-20 -left-20 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl animate-float" />
      <div class="absolute -bottom-20 -right-20 w-80 h-80 bg-sky-300/10 rounded-full blur-3xl animate-float" style="animation-delay:2s" />
    </div>

    <div class="relative z-10 max-w-3xl mx-auto px-4 py-12">

      <!-- Header -->
      <div class="text-center mb-10">
        <div class="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-lg rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow overflow-hidden">
          <img v-if="appLogo" :src="appLogo" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
          <Leaf v-else :size="36" class="text-white" />
        </div>
        <h1 class="text-3xl font-extrabold text-white mb-2">Tải {{ appName }}</h1>
        <p class="text-sky-200/70">Ứng dụng phân loại rác thải thông minh bằng AI</p>
      </div>

      <!-- Skeleton loading -->
      <div v-if="loading" class="space-y-6">
        <div class="skeleton rounded-3xl h-64 w-full opacity-20" />
        <div class="skeleton rounded-3xl h-64 w-full opacity-20" />
      </div>

      <div v-else class="space-y-6">

        <!-- iOS Card -->
        <div class="rounded-3xl overflow-hidden border border-white/20 shadow-glass" style="background: rgba(255,255,255,0.08); backdrop-filter: blur(12px);">
          <div class="bg-gradient-to-r from-gray-900/90 to-black/80 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 backdrop-blur border border-white/30 rounded-xl flex items-center justify-center">
              <Smartphone :size="22" class="text-white" />
            </div>
            <div>
              <h2 class="font-bold text-white text-lg">iOS – iPhone / iPad</h2>
              <p class="text-white/60 text-xs">Cài qua Safari – Không cần App Store</p>
            </div>
            <span class="ml-auto bg-sky-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold">Free</span>
          </div>

          <div class="p-6 space-y-5">
            <!-- Bước cài đặt -->
            <div>
              <p class="font-semibold text-white/90 mb-3 flex items-center gap-2">
                <BookOpen :size="16" class="text-sky-400" /> Hướng dẫn cài đặt
              </p>
              <div class="space-y-3">
                <div v-for="(step, i) in IOS_STEPS" :key="i" class="flex items-start gap-3">
                  <div class="w-7 h-7 bg-white/10 backdrop-blur border border-white/20 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {{ i + 1 }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white/90">{{ step.title }}</p>
                    <p class="text-xs text-white/60 mt-0.5">{{ step.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nút mở link -->
            <a v-if="config.ios_web_url" :href="config.ios_web_url" target="_blank"
              class="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              <ExternalLink :size="18" />
              Mở {{ appName }} trên Safari
            </a>
            <div v-else class="text-center py-3 bg-white/5 border border-white/10 rounded-xl">
              <p class="text-sm text-white/40">Link iOS chưa được cấu hình</p>
            </div>

            <!-- Copy link -->
            <div v-if="config.ios_web_url" class="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
              <code class="flex-1 text-xs text-white/70 break-all">{{ config.ios_web_url }}</code>
              <button @click="copyLink(config.ios_web_url)"
                class="flex-shrink-0 p-2 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                <Check v-if="copied === 'ios'" :size="14" class="text-sky-400" />
                <Copy v-else :size="14" class="text-white/70" />
              </button>
            </div>
          </div>
        </div>

        <!-- Android Card -->
        <div class="rounded-3xl overflow-hidden border border-white/20 shadow-glass" style="background: rgba(255,255,255,0.08); backdrop-filter: blur(12px);">
          <div class="bg-gradient-to-r from-sky-500 to-blue-600 backdrop-blur px-6 py-4 flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 backdrop-blur border border-white/30 rounded-xl flex items-center justify-center">
              <TabletSmartphone :size="22" class="text-white" />
            </div>
            <div>
              <h2 class="font-bold text-white text-lg">Android</h2>
              <p class="text-sky-100 text-xs">Tải file APK – Cài trực tiếp</p>
            </div>
            <div class="ml-auto text-right">
              <span v-if="config.apk_version" class="bg-white/20 backdrop-blur border border-white/30 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                v{{ config.apk_version }}
              </span>
            </div>
          </div>

          <div class="p-6 space-y-5">
            <!-- Bước cài đặt Android -->
            <div>
              <p class="font-semibold text-white/90 mb-3 flex items-center gap-2">
                <BookOpen :size="16" class="text-sky-400" /> Hướng dẫn cài đặt
              </p>
              <div class="space-y-3">
                <div v-for="(step, i) in ANDROID_STEPS" :key="i" class="flex items-start gap-3">
                  <div class="w-7 h-7 bg-white/20 backdrop-blur border border-white/30 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {{ i + 1 }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white/90">{{ step.title }}</p>
                    <p class="text-xs text-white/60 mt-0.5">{{ step.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nút tải APK -->
            <div v-if="config.apk_url">
              <a :href="config.apk_url" target="_blank"
                class="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-sky-md hover:shadow-sky-lg hover:-translate-y-0.5">
                <Download :size="18" />
                Tải APK{{ config.apk_size ? ` (${config.apk_size})` : '' }}
              </a>
              <p class="text-xs text-center text-white/40 mt-2">
                Phiên bản {{ config.apk_version || '1.0.0' }} • Yêu cầu Android 7.0+
              </p>
            </div>
            <div v-else class="text-center py-4 bg-white/5 rounded-xl border-2 border-dashed border-white/20">
              <Download :size="24" class="mx-auto text-white/30 mb-2" />
              <p class="text-sm text-white/50 font-medium">APK đang được chuẩn bị</p>
              <p class="text-xs text-white/40 mt-1">Vui lòng quay lại sau</p>
            </div>

            <!-- Cảnh báo cài ngoài store -->
            <div class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle :size="15" class="text-amber-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-amber-700 leading-relaxed">
                Khi cài APK ngoài Google Play, Android sẽ hỏi cho phép "Cài từ nguồn không rõ" — hãy bấm <strong>Cho phép</strong> để tiếp tục.
              </p>
            </div>
          </div>
        </div>

        <!-- PWA Option -->
        <div class="rounded-2xl p-5 text-center border border-blue-300/30 bg-blue-500/10" style="backdrop-filter: blur(12px);">
          <Globe :size="28" class="mx-auto text-blue-300 mb-2" />
          <p class="font-semibold text-blue-200 mb-1">Hoặc dùng trực tiếp trên trình duyệt</p>
          <p class="text-sm text-blue-300 mb-3">Không cần tải — truy cập ngay trên bất kỳ thiết bị nào</p>
          <RouterLink to="/classify"
            class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover-lift transition-all">
            <Camera :size="16" /> Dùng ngay trên web
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../config/api'
import { useAppConfig } from '../stores/appConfig'
import {
  Leaf, Smartphone, TabletSmartphone, Download, ExternalLink,
  BookOpen, Copy, Check, AlertTriangle, Globe, Camera, Loader2
} from 'lucide-vue-next'

const { appName, appLogo } = useAppConfig()

const loading = ref(true)
const copied  = ref('')
const config  = reactive({
  ios_web_url: '', apk_url: '', apk_version: '1.0.0',
  apk_size: '', app_name: 'EcoScan', download_enabled: '1'
})

const IOS_STEPS = [
  { title: 'Mở Safari trên iPhone/iPad', desc: 'Bắt buộc dùng Safari, không dùng Chrome hay app khác' },
  { title: 'Nhấn nút "Chia sẻ" ở thanh dưới', desc: 'Icon hình vuông có mũi tên hướng lên' },
  { title: 'Chọn "Thêm vào Màn hình chính"', desc: 'Cuộn xuống trong menu chia sẻ để tìm tùy chọn này' },
  { title: 'Bấm "Thêm" góc phải trên', desc: `App ${appName.value} sẽ xuất hiện trên màn hình chính như app thật` },
  { title: 'Mở app và cho phép camera', desc: 'Vào Cài đặt → Safari → Camera → Cho phép nếu bị từ chối' },
]

const ANDROID_STEPS = [
  { title: 'Tải file APK về điện thoại', desc: 'Nhấn nút "Tải APK" bên dưới' },
  { title: 'Mở file APK vừa tải', desc: 'Tìm trong thư mục Downloads hoặc thông báo' },
  { title: 'Bật "Cài từ nguồn không rõ"', desc: 'Android sẽ hỏi — chọn Cài đặt → bật tùy chọn này' },
  { title: 'Bấm Cài đặt và chờ hoàn tất', desc: 'Quá trình cài đặt mất khoảng 10-30 giây' },
  { title: `Mở ${appName.value} và bắt đầu sử dụng`, desc: 'Cho phép truy cập camera khi ứng dụng yêu cầu' },
]

onMounted(async () => {
  try {
    const { data } = await api.get('/api/app-config')
    if (data.success) Object.assign(config, data.config)
  } catch {}
  finally { loading.value = false }
})

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    copied.value = 'ios'
    setTimeout(() => { copied.value = '' }, 2000)
  } catch {}
}
</script>
