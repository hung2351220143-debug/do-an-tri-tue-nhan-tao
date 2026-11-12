<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Giá Thu Mua Rác</h1>
        <p class="text-gray-500 text-sm mt-1">Quản lý bảng giá và cài đặt shop</p>
      </div>
      <button @click="openAdd" class="btn-primary text-sm px-4 py-2.5"><Plus :size="16" /> Thêm loại</button>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Bảng giá -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100" style="background:linear-gradient(to right,#f0fdf4,#e0f2fe)">
            <h3 class="font-bold text-gray-900">Bảng giá thu mua</h3>
          </div>
          <div v-if="loading" class="flex justify-center py-10"><Loader2 class="animate-spin text-emerald-500" :size="28" /></div>
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Loại rác</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Giá/đơn vị</th>
                <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sl tối thiểu</th>
                <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in prices" :key="p.id" class="border-b border-gray-50 hover:bg-gray-50/50">
                <td class="px-4 py-3">
                  <p class="font-semibold text-gray-900">{{ p.name_vi }}</p>
                  <p class="text-xs text-gray-400">{{ p.category }}</p>
                </td>
                <td class="px-4 py-3 text-right font-semibold text-emerald-700">
                  {{ Number(p.price_per_unit).toLocaleString('vi-VN') }}đ/{{ p.unit }}
                </td>
                <td class="px-4 py-3 text-center text-gray-600">{{ p.min_quantity }} {{ p.unit }}</td>
                <td class="px-4 py-3 text-center">
                  <button @click="toggleActive(p)"
                    class="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                    :class="p.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
                    {{ p.is_active ? '● Đang thu' : '○ Tạm dừng' }}
                  </button>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button @click="editPrice(p)" class="p-1.5 text-sky-500 hover:bg-sky-50 rounded-lg"><Pencil :size="14" /></button>
                    <button @click="deletePrice(p.id)" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 :size="14" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cài đặt shop -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings :size="16" class="text-sky-600" /> Cài đặt shop</h3>
        <form @submit.prevent="saveSettings" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Địa chỉ nhận hàng</label>
            <textarea v-model="settings.shop_address" rows="2" class="input-field text-sm resize-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
            <input v-model="settings.shop_phone" type="tel" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Hướng dẫn gửi hàng</label>
            <textarea v-model="settings.ship_guide" rows="3" class="input-field text-sm resize-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Ghi chú thanh toán</label>
            <textarea v-model="settings.payment_note" rows="2" class="input-field text-sm resize-none" />
          </div>
          <button type="submit" :disabled="savingSettings" class="btn-primary w-full py-2.5 text-sm">
            <Loader2 v-if="savingSettings" :size="14" class="animate-spin" /><Save v-else :size="14" />
            {{ savingSettings ? 'Đang lưu...' : 'Lưu cài đặt' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Modal thêm/sửa giá -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        @click.self="showForm=false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style="background:linear-gradient(to right,#f0fdf4,#e0f2fe)">
            <h3 class="font-bold text-gray-900">{{ editId ? 'Sửa giá' : 'Thêm loại rác thu mua' }}</h3>
            <button @click="showForm=false"><X :size="18" class="text-gray-400" /></button>
          </div>
          <form @submit.prevent="savePrice" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Tên tiếng Việt *</label>
                <input v-model="form.name_vi" type="text" class="input-field" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Category (code) *</label>
                <select v-model="form.category" class="input-field" :disabled="!!editId">
                  <option value="recyclable-plastic">Nhựa tái chế</option>
                  <option value="recyclable-paper">Giấy tái chế</option>
                  <option value="recyclable-metal">Kim loại</option>
                  <option value="recyclable-glass">Thủy tinh</option>
                  <option value="electronic">Rác điện tử</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Đơn vị</label>
                <input v-model="form.unit" type="text" class="input-field" placeholder="cái/chai/kg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Giá/đơn vị (VNĐ) *</label>
                <input v-model.number="form.price_per_unit" type="number" min="0" class="input-field" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Số lượng tối thiểu</label>
                <input v-model.number="form.min_quantity" type="number" min="1" class="input-field" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Tiêu chuẩn chất lượng</label>
              <textarea v-model="form.quality_note" rows="2" class="input-field resize-none" placeholder="Yêu cầu chất lượng..." />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" :disabled="saving" class="flex-1 btn-primary py-2.5">
                <Loader2 v-if="saving" :size="14" class="animate-spin" />
                {{ saving ? 'Đang lưu...' : (editId ? 'Lưu thay đổi' : 'Thêm') }}
              </button>
              <button type="button" @click="showForm=false" class="btn-secondary px-5 py-2.5">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus, Loader2, Pencil, Trash2, X, Settings, Save } from 'lucide-vue-next'
import api from '../../config/api'

const toast = useToast()
const prices  = ref([])
const loading = ref(true)
const showForm = ref(false)
const saving  = ref(false)
const savingSettings = ref(false)
const editId  = ref(null)
const form    = reactive({ name_vi:'', category:'recyclable-plastic', unit:'cái', price_per_unit:0, min_quantity:1, quality_note:'' })
const settings = reactive({ shop_address:'', shop_phone:'', ship_guide:'', payment_note:'' })

async function loadPrices() {
  loading.value = true
  try {
    const { data } = await api.get('/api/recycle/prices/admin')
    if (data.success) prices.value = data.prices
  } catch {}
  finally { loading.value = false }
}

async function loadSettings() {
  try {
    const { data } = await api.get('/api/recycle/settings')
    if (data.success) {
      data.settings.forEach(s => { if (s.setting_key in settings) settings[s.setting_key] = s.setting_value||'' })
    }
  } catch {}
}

function openAdd() {
  editId.value = null
  Object.assign(form, { name_vi:'', category:'recyclable-plastic', unit:'cái', price_per_unit:0, min_quantity:1, quality_note:'' })
  showForm.value = true
}

function editPrice(p) {
  editId.value = p.id
  Object.assign(form, { name_vi: p.name_vi, category: p.category, unit: p.unit||'cái', price_per_unit: Number(p.price_per_unit), min_quantity: p.min_quantity||1, quality_note: p.quality_note||'' })
  showForm.value = true
}

async function savePrice() {
  saving.value = true
  try {
    const payload = { ...form }
    if (editId.value) {
      await api.put(`/api/recycle/prices/${editId.value}`, payload)
      toast.success('Đã cập nhật!')
    } else {
      await api.post('/api/recycle/prices', payload)
      toast.success('Đã thêm!')
    }
    showForm.value = false
    loadPrices()
  } catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
  finally { saving.value = false }
}

async function toggleActive(p) {
  try {
    await api.put(`/api/recycle/prices/${p.id}`, { is_active: !p.is_active })
    p.is_active = !p.is_active
  } catch { toast.error('Lỗi') }
}

async function deletePrice(id) {
  if (!confirm('Xóa giá này?')) return
  try { await api.delete(`/api/recycle/prices/${id}`); prices.value = prices.value.filter(p => p.id !== id); toast.success('Đã xóa') }
  catch { toast.error('Lỗi') }
}

async function saveSettings() {
  savingSettings.value = true
  try {
    await api.put('/api/recycle/settings', { settings })
    toast.success('Đã lưu cài đặt!')
  } catch { toast.error('Lỗi lưu cài đặt') }
  finally { savingSettings.value = false }
}

onMounted(() => { loadPrices(); loadSettings() })
</script>
