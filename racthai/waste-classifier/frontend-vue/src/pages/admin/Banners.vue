<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Quản Lý Banner</h1>
        <p class="text-gray-500 text-sm mt-1">Ảnh chạy carousel trên trang chủ</p>
      </div>
      <label class="btn-primary text-sm px-4 py-2.5 cursor-pointer">
        <Plus :size="16" /> Thêm banner
        <input type="file" accept="image/*" class="hidden" @change="onFileSelect" multiple />
      </label>
    </div>

    <!-- Preview upload -->
    <div v-if="pendingFiles.length" class="bg-sky-50 border border-sky-200 rounded-2xl p-5 mb-6">
      <p class="font-semibold text-sky-800 mb-3">Ảnh chờ upload ({{ pendingFiles.length }})</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        <div v-for="(f, i) in pendingFiles" :key="i" class="relative group">
          <img :src="f.preview" class="w-full h-32 object-cover rounded-xl border border-sky-200" />
          <input v-model="f.title" type="text" placeholder="Tiêu đề..." class="w-full mt-1 text-xs px-2 py-1 rounded-lg border border-sky-200 focus:outline-none" />
          <button @click="pendingFiles.splice(i,1)"
            class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X :size="12" />
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="uploadAll" :disabled="uploading"
          class="btn-primary text-sm px-5 py-2">
          <Loader2 v-if="uploading" :size="14" class="animate-spin" />
          <Upload v-else :size="14" />
          {{ uploading ? 'Đang upload...' : `Upload ${pendingFiles.length} ảnh` }}
        </button>
        <button @click="pendingFiles=[]" class="btn-secondary text-sm px-4 py-2">Hủy</button>
      </div>
    </div>

    <!-- Banner list -->
    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="animate-spin text-sky-400" :size="32" />
    </div>
    <div v-else-if="!banners.length" class="text-center py-16 bg-white rounded-2xl border border-gray-200">
      <Image :size="40" class="mx-auto text-gray-300 mb-3" />
      <p class="text-gray-500">Chưa có banner nào</p>
    </div>
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="b in banners" :key="b.id"
        class="bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:shadow-sky-sm transition-all">
        <!-- Image -->
        <div class="relative h-44 bg-gray-100">
          <img :src="b.image_url" class="w-full h-full object-cover" />
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button @click="toggleActive(b)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="b.is_active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'">
              {{ b.is_active ? 'Ẩn' : 'Hiện' }}
            </button>
            <button @click="deleteBanner(b.id)"
              class="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium">
              Xóa
            </button>
          </div>
          <!-- Status badge -->
          <span class="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium"
            :class="b.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'">
            {{ b.is_active ? '● Đang hiện' : '○ Đã ẩn' }}
          </span>
          <!-- Sort order badge -->
          <span class="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            #{{ b.sort_order || 0 }}
          </span>
        </div>
        <!-- Info + Edit -->
        <div class="p-4">
          <div v-if="editingId !== b.id">
            <p class="font-semibold text-gray-900 text-sm truncate">{{ b.title || '(Chưa có tiêu đề)' }}</p>
            <p v-if="b.subtitle" class="text-xs text-gray-400 truncate mt-0.5">{{ b.subtitle }}</p>
            <div class="flex items-center gap-2 mt-3">
              <button @click="startEdit(b)" class="flex-1 text-xs py-1.5 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50">
                Chỉnh sửa
              </button>
              <input v-model.number="b.sort_order" type="number" min="0" max="99"
                @change="updateOrder(b)"
                class="w-16 text-xs text-center px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-sky-400" />
            </div>
          </div>
          <!-- Edit form -->
          <div v-else class="space-y-2">
            <input v-model="editForm.title" type="text" placeholder="Tiêu đề"
              class="w-full text-sm px-3 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input v-model="editForm.subtitle" type="text" placeholder="Mô tả"
              class="w-full text-sm px-3 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input v-model="editForm.link_url" type="url" placeholder="Link khi click (tùy chọn)"
              class="w-full text-sm px-3 py-2 rounded-xl border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <div class="flex gap-2">
              <button @click="saveEdit(b.id)" class="flex-1 btn-primary text-xs py-1.5">Lưu</button>
              <button @click="editingId=null" class="flex-1 btn-secondary text-xs py-1.5">Hủy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus, X, Upload, Image, Loader2 } from 'lucide-vue-next'
import api from '../../config/api'

const toast = useToast()
const banners      = ref([])
const loading      = ref(true)
const uploading    = ref(false)
const pendingFiles = ref([])
const editingId    = ref(null)
const editForm     = ref({ title: '', subtitle: '', link_url: '' })

async function loadBanners() {
  loading.value = true
  try {
    const { data } = await api.get('/api/banners?all=1')
    if (data.success) banners.value = data.banners
  } catch {}
  finally { loading.value = false }
}

function onFileSelect(e) {
  const files = Array.from(e.target.files)
  files.forEach(file => {
    const preview = URL.createObjectURL(file)
    pendingFiles.value.push({ file, preview, title: '' })
  })
  e.target.value = ''
}

async function uploadAll() {
  uploading.value = true
  let success = 0
  for (const item of pendingFiles.value) {
    try {
      const fd = new FormData()
      fd.append('image', item.file)
      if (item.title) fd.append('title', item.title)
      fd.append('sort_order', banners.value.length + success)
      await api.post('/api/banners', fd)
      success++
    } catch {}
  }
  toast.success(`Upload ${success}/${pendingFiles.value.length} banner thành công!`)
  pendingFiles.value = []
  uploading.value = false
  loadBanners()
}

async function toggleActive(b) {
  try {
    await api.put(`/api/banners/${b.id}`, { is_active: !b.is_active })
    b.is_active = !b.is_active
    toast.success(b.is_active ? 'Đã hiện banner' : 'Đã ẩn banner')
  } catch { toast.error('Thao tác thất bại') }
}

async function deleteBanner(id) {
  if (!confirm('Xóa banner này?')) return
  try {
    await api.delete(`/api/banners/${id}`)
    banners.value = banners.value.filter(b => b.id !== id)
    toast.success('Đã xóa banner')
  } catch { toast.error('Xóa thất bại') }
}

function startEdit(b) {
  editingId.value = b.id
  editForm.value = { title: b.title||'', subtitle: b.subtitle||'', link_url: b.link_url||'' }
}

async function saveEdit(id) {
  try {
    await api.put(`/api/banners/${id}`, editForm.value)
    const b = banners.value.find(x => x.id === id)
    if (b) Object.assign(b, editForm.value)
    editingId.value = null
    toast.success('Đã lưu!')
  } catch { toast.error('Lưu thất bại') }
}

async function updateOrder(b) {
  try { await api.put(`/api/banners/${b.id}`, { sort_order: b.sort_order }) } catch {}
}

onMounted(loadBanners)
</script>
