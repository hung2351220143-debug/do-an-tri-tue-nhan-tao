<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Ảnh Đã Tải Lên</h1>
        <p class="text-gray-500 text-sm mt-0.5">Tổng: {{ total }} ảnh</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-40">
      <Loader2 class="animate-spin text-sky-500" :size="28" />
    </div>
    <div v-else-if="!images.length" class="bg-white rounded-2xl border p-12 text-center text-gray-400">
      <ImagesIcon :size="40" class="mx-auto mb-3 opacity-40" />
      <p>Chưa có ảnh nào được tải lên</p>
    </div>
    <template v-else>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="img in images" :key="img.id" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div class="relative cursor-pointer bg-gray-100" style="height:160px" @click="preview = img">
            <img :src="img.image_path" alt="waste" class="w-full h-full object-cover"
              @error="e => e.target.src = 'https://via.placeholder.com/300x160?text=N/A'" />
            <div class="absolute top-2 right-2">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusColor[img.status]">{{ statusLabel[img.status] }}</span>
            </div>
          </div>
          <div class="p-3 space-y-1.5">
            <p class="text-xs font-medium text-gray-700 truncate">{{ img.original_filename || 'Không tên' }}</p>
            <div class="flex items-center gap-1.5 text-xs text-gray-400"><User :size="11" /><span>{{ img.username || 'Khách' }}</span></div>
            <div class="flex items-center gap-1.5 text-xs text-gray-400"><Calendar :size="11" /><span>{{ formatDate(img.created_at) }}</span></div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-6">
        <button @click="page--" :disabled="page === 1" class="btn-secondary px-4 py-2 text-sm disabled:opacity-50">← Trước</button>
        <span class="text-sm text-gray-600">Trang {{ page }} / {{ totalPages }}</span>
        <button @click="page++" :disabled="page === totalPages" class="btn-secondary px-4 py-2 text-sm disabled:opacity-50">Sau →</button>
      </div>
    </template>

    <!-- Image preview modal -->
    <div v-if="preview" class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" @click="preview = null">
      <div class="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl" @click.stop>
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="font-bold text-gray-900">{{ preview.original_filename || 'Ảnh phân loại' }}</h3>
          <button @click="preview = null" class="p-1.5 rounded-lg hover:bg-gray-100"><X :size="18" /></button>
        </div>
        <img :src="preview.image_path" alt="preview" class="w-full max-h-96 object-contain bg-gray-100" />
        <div class="p-4 text-sm text-gray-600 space-y-1">
          <p><strong>Người dùng:</strong> {{ preview.username || 'Khách' }}</p>
          <p><strong>Email:</strong> {{ preview.email || '—' }}</p>
          <p><strong>Thời gian:</strong> {{ new Date(preview.created_at).toLocaleString('vi-VN') }}</p>
          <p><strong>Trạng thái:</strong> {{ preview.status }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '../../config/api'
import { useToast } from 'vue-toastification'
import { Calendar, User, Loader2, Images as ImagesIcon, X } from 'lucide-vue-next'

const toast = useToast()
const images = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
const preview = ref(null)

const statusColor = { completed: 'bg-sky-100 text-sky-700', failed: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700' }
const statusLabel = { completed: 'Hoàn thành', failed: 'Thất bại', pending: 'Chờ' }

watch(page, loadImages)
onMounted(loadImages)

async function loadImages() {
  loading.value = true
  try {
    const { data } = await api.get(`/api/admin/images?page=${page.value}&limit=12`)
    if (data.success) { images.value = data.images; totalPages.value = data.pagination.totalPages; total.value = data.pagination.total }
  } catch { toast.error('Không thể tải danh sách ảnh') }
  finally { loading.value = false }
}

function formatDate(d) {
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>
