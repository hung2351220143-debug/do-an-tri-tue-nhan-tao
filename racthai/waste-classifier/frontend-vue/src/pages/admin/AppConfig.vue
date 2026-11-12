<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Quản Lý Link Tải App</h1>
      <p class="text-gray-500 text-sm mt-1">Cập nhật link iOS (ngrok), link APK Android và thông tin phiên bản</p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="animate-spin text-sky-500" :size="32" />
    </div>

    <div v-else class="grid lg:grid-cols-2 gap-6">

      <!-- Logo ứng dụng -->
    <div class="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-2">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
          <Image :size="20" class="text-white" />
        </div>
        <div>
          <h2 class="font-bold text-gray-900">Logo ứng dụng</h2>
          <p class="text-xs text-gray-400">Hiển thị trên Navbar và trang chủ</p>
        </div>
      </div>
      <div class="flex items-center gap-6 flex-wrap">
        <!-- Preview logo hiện tại -->
        <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 border-sky-200 flex items-center justify-center bg-sky-50 flex-shrink-0">
          <img v-if="currentLogo || logoPreview" :src="logoPreview || currentLogo"
            class="w-full h-full object-contain p-1"
            @error="e => e.target.style.display='none'" />
          <Leaf v-else :size="28" class="text-sky-400" />
        </div>
        <div class="flex-1 space-y-3">
          <p class="text-sm text-gray-600">
            {{ currentLogo ? 'Logo hiện tại đang hiển thị' : 'Chưa có logo. Đang dùng icon mặc định.' }}
          </p>
          <div class="flex gap-2 flex-wrap">
            <label class="btn-primary text-sm px-4 py-2 cursor-pointer">
              <Upload :size="15" /> Chọn logo mới
              <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" class="hidden" @change="onLogoChange" />
            </label>
            <button v-if="logoFile" @click="uploadLogo" :disabled="logoLoading"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
              style="background:linear-gradient(135deg,#22c55e,#16a34a)">
              <Loader2 v-if="logoLoading" :size="14" class="animate-spin" /><Check v-else :size="14" />
              {{ logoLoading ? 'Đang tải...' : 'Lưu logo' }}
            </button>
            <button v-if="currentLogo" @click="deleteLogo"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
              <Trash2 :size="14" /> Xóa logo
            </button>
          </div>
          <p class="text-xs text-gray-400">Hỗ trợ JPG, PNG, WEBP, SVG — tối đa 2MB. Khuyến nghị: 256×256px hoặc hình vuông.</p>
        </div>
      </div>
    </div>

    <!-- iOS -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Smartphone :size="20" class="text-white" />
          </div>
          <div>
            <h2 class="font-bold text-gray-900">iOS (iPhone / iPad)</h2>
            <p class="text-xs text-gray-400">Dùng link ngrok có HTTPS</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Link web iOS (ngrok URL)
            </label>
            <div class="relative">
              <Link :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="form.ios_web_url" type="url" class="input-field pl-9"
                placeholder="https://xxx.ngrok-free.dev" />
            </div>
            <p class="text-xs text-gray-400 mt-1">
              Đây là link ngrok hiện tại. Mỗi lần ngrok thay đổi URL thì cập nhật lại đây.
            </p>
          </div>

          <!-- Preview QR-like card -->
          <div v-if="form.ios_web_url" class="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p class="text-xs font-semibold text-gray-600 mb-2">Preview link iOS:</p>
            <a :href="form.ios_web_url" target="_blank"
              class="text-sm text-blue-600 hover:underline break-all">
              {{ form.ios_web_url }}
            </a>
          </div>
        </div>
      </div>

      <!-- Android APK -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center">
            <TabletSmartphone :size="20" class="text-white" />
          </div>
          <div>
            <h2 class="font-bold text-gray-900">Android (APK)</h2>
            <p class="text-xs text-gray-400">File APK tải trực tiếp</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Link APK</label>
            <div class="relative">
              <Link :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="form.apk_url" type="url" class="input-field pl-9"
                placeholder="https://drive.google.com/... hoặc link GitHub Release" />
            </div>
            <p class="text-xs text-gray-400 mt-1">
              Upload APK lên Google Drive hoặc GitHub rồi paste link vào đây.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Phiên bản</label>
              <input v-model="form.apk_version" type="text" class="input-field"
                placeholder="1.0.0" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Kích thước</label>
              <input v-model="form.apk_size" type="text" class="input-field"
                placeholder="5MB" />
            </div>
          </div>
        </div>
      </div>

      <!-- Cài đặt chung + Tên app -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-2">
        <h2 class="font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Settings :size="18" class="text-sky-600" /> Cài đặt chung
        </h2>
        <div class="grid sm:grid-cols-2 gap-5">
          <!-- Tên app với preview realtime -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs" style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">A</span>
              Tên ứng dụng
            </label>
            <input v-model="form.app_name" type="text" class="input-field" placeholder="EcoScan" maxlength="30" />
            <p class="text-xs text-gray-400 mt-1.5">Tên hiển thị trên Navbar, Footer, tab trình duyệt</p>
            <!-- Preview realtime -->
            <div class="mt-3 flex items-center gap-2 p-3 bg-sky-50 rounded-xl border border-sky-100">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
                <img v-if="currentLogo" :src="currentLogo" class="w-full h-full object-cover"
                  @error="e=>e.target.style.display='none'" />
                <Leaf v-else :size="14" class="text-white" />
              </div>
              <span class="font-bold text-sky-800 text-sm">{{ form.app_name || 'EcoScan' }}</span>
              <span class="text-xs text-sky-400 ml-1">← Preview Navbar</span>
            </div>
          </div>
          <!-- Hiển thị section tải app -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Hiển thị section tải app</label>
            <select v-model="form.download_enabled" class="input-field">
              <option value="1">✅ Hiện</option>
              <option value="0">❌ Ẩn</option>
            </select>
            <p class="text-xs text-gray-400 mt-1.5">Bật/tắt section "Tải ứng dụng" trên trang chủ</p>
          </div>
        </div>
      </div>

      <!-- Hướng dẫn tạo APK -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 lg:col-span-2">
        <h3 class="font-bold text-amber-800 mb-3 flex items-center gap-2">
          <Info :size="18" /> Hướng dẫn tạo APK bằng PWABuilder (Free)
        </h3>
        <ol class="space-y-2 text-sm text-amber-700">
          <li class="flex gap-2">
            <span class="font-bold flex-shrink-0">1.</span>
            Vào <a href="https://www.pwabuilder.com" target="_blank" class="text-blue-600 hover:underline font-medium">pwabuilder.com</a>
          </li>
          <li class="flex gap-2">
            <span class="font-bold flex-shrink-0">2.</span>
            Nhập URL ngrok: <code class="bg-amber-100 px-2 py-0.5 rounded text-xs">{{ form.ios_web_url || 'https://xxx.ngrok-free.dev' }}</code>
          </li>
          <li class="flex gap-2"><span class="font-bold flex-shrink-0">3.</span> Bấm <strong>Start</strong> → chờ phân tích PWA</li>
          <li class="flex gap-2"><span class="font-bold flex-shrink-0">4.</span> Chọn tab <strong>Android</strong> → bấm <strong>Generate Package</strong></li>
          <li class="flex gap-2"><span class="font-bold flex-shrink-0">5.</span> Tải về file <code class="bg-amber-100 px-2 py-0.5 rounded text-xs">.apk</code></li>
          <li class="flex gap-2"><span class="font-bold flex-shrink-0">6.</span> Upload lên Google Drive → lấy link share → paste vào ô Link APK bên trên</li>
        </ol>
        <div class="mt-4 p-3 bg-amber-100 rounded-xl">
          <p class="text-xs text-amber-800">
            💡 <strong>Lưu ý:</strong> Mỗi lần ngrok đổi URL thì cần tạo APK mới và cập nhật link ở đây.
            Để tránh điều này, hãy dùng ngrok static domain (đã có sẵn: <code>squint-salami-idealist.ngrok-free.dev</code>).
          </p>
        </div>
      </div>
    </div>

    <!-- Nút lưu -->
    <div class="mt-6 flex justify-end">
      <button @click="save" :disabled="saving"
        class="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-50">
        <Loader2 v-if="saving" :size="18" class="animate-spin" />
        <Save v-else :size="18" />
        {{ saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../../config/api'
import { useToast } from 'vue-toastification'
import { useAppConfig } from '../../stores/appConfig'
import { Loader2, Smartphone, TabletSmartphone, Link, Settings, Info, Save, Image, Upload, Check, Trash2, Leaf } from 'lucide-vue-next'

const toast   = useToast()
const { state: appCfgState, reload: reloadAppConfig } = useAppConfig()
const loading = ref(true)
const saving  = ref(false)
const logoFile    = ref(null)
const logoPreview = ref('')
const logoLoading = ref(false)
// currentLogo dẫn xuất trực tiếp từ store để đồng bộ realtime với Navbar/Sidebar/Home
const currentLogo = computed(() => appCfgState.app_logo || '')

const form = reactive({
  ios_web_url:       '',
  apk_url:           '',
  apk_version:       '1.0.0',
  apk_size:          '5MB',
  app_name:          'EcoScan',
  download_enabled:  '1',
})

onMounted(async () => {
  try {
    // Lấy cấu hình qua store (single source of truth), chỉ nạp các field
    // nằm trong form — KHÔNG đưa app_logo vào form để tránh ghi đè logo cũ khi Lưu.
    await reloadAppConfig()
    const c = appCfgState
    form.ios_web_url      = c.ios_web_url      ?? ''
    form.apk_url          = c.apk_url          ?? ''
    form.apk_version      = c.apk_version      ?? '1.0.0'
    form.apk_size         = c.apk_size         ?? ''
    form.app_name         = c.app_name         ?? 'EcoScan'
    form.download_enabled = c.download_enabled ?? '1'
  } catch { toast.error('Không thể tải cấu hình') }
  finally { loading.value = false }
})

function onLogoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { toast.error('Logo tối đa 2MB'); return }
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

async function uploadLogo() {
  if (!logoFile.value) return
  logoLoading.value = true
  try {
    const fd = new FormData()
    fd.append('logo', logoFile.value)
    const { data } = await api.post('/api/app-config/logo', fd)
    if (data.success) {
      // Cập nhật store ngay lập tức -> logo mới hiện tức thì trên Navbar/Home/AdminLayout
      appCfgState.app_logo = data.logo_url
      logoFile.value = null
      logoPreview.value = ''
      toast.success('Cập nhật logo thành công!')
      await reloadAppConfig()  // đồng bộ từ DB cho chắc chắn
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Không thể upload logo')
  } finally { logoLoading.value = false }
}

async function deleteLogo() {
  if (!confirm('Xóa logo hiện tại?')) return
  try {
    await api.delete('/api/app-config/logo')
    appCfgState.app_logo = ''   // currentLogo là computed -> cập nhật qua store
    logoPreview.value = ''
    toast.success('Đã xóa logo')
    await reloadAppConfig()  // đồng bộ Navbar/Home/AdminLayout
  } catch { toast.error('Không thể xóa logo') }
}

async function save() {
  saving.value = true
  try {
    // Chỉ gửi đúng 6 field cấu hình — không gửi app_logo để tránh
    // ghi đè logo mới (đã upload) bằng URL cũ còn sót trong form.
    const { data } = await api.put('/api/app-config', {
      ios_web_url:      form.ios_web_url,
      apk_url:          form.apk_url,
      apk_version:      form.apk_version,
      apk_size:         form.apk_size,
      app_name:         form.app_name,
      download_enabled: form.download_enabled,
    })
    if (data.success) {
      toast.success('Đã lưu cấu hình!')
      await reloadAppConfig()  // đồng bộ tên/logo ngay lập tức
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Lỗi lưu cấu hình')
  } finally { saving.value = false }
}
</script>
