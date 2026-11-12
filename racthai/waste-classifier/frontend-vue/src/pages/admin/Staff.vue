<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Quản Lý Nhân Viên</h1>
        <p class="text-gray-500 text-sm mt-1">Tạo và quản lý tài khoản nhân viên hỗ trợ</p>
      </div>
      <button @click="showCreate = true" class="btn-primary text-sm px-4 py-2.5">
        <Plus :size="16" /> Thêm nhân viên
      </button>
    </div>

    <!-- Staff list -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="animate-spin text-sky-400" :size="28" />
      </div>
      <div v-else-if="!staff.length" class="text-center py-16">
        <Users :size="40" class="mx-auto text-gray-300 mb-3" />
        <p class="text-gray-500">Chưa có nhân viên nào</p>
      </div>
      <table v-else class="w-full">
        <thead class="border-b border-gray-100" style="background:linear-gradient(to right,#f0f9ff,#e0f2fe)">
          <tr>
            <th class="text-left px-5 py-3.5 text-xs font-semibold text-sky-800 uppercase tracking-wider">Nhân viên</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-sky-800 uppercase tracking-wider">Liên hệ</th>
            <th class="text-center px-4 py-3.5 text-xs font-semibold text-sky-800 uppercase tracking-wider">Trạng thái</th>
            <th class="text-center px-4 py-3.5 text-xs font-semibold text-sky-800 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in staff" :key="s.id" class="border-b border-gray-50 hover:bg-sky-50/50 transition-colors">
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm"
                  style="background:linear-gradient(135deg,#38bdf8,#0ea5e9);color:white">
                  <img v-if="s.avatar" :src="s.avatar" class="w-full h-full object-cover" @error="e=>e.target.style.display='none'" />
                  <span v-else>{{ (s.full_name||s.username||'?').charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <p class="font-semibold text-gray-900 text-sm">{{ s.full_name || s.username }}</p>
                  <p class="text-xs text-gray-400">@{{ s.username }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-4">
              <p class="text-sm text-gray-700">{{ s.email }}</p>
              <p v-if="s.phone" class="text-xs text-gray-400">{{ s.phone }}</p>
            </td>
            <td class="px-4 py-4 text-center">
              <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                :class="s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                {{ s.is_active ? '● Hoạt động' : '○ Bị khóa' }}
              </span>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center justify-center gap-2">
                <button @click="toggleActive(s)"
                  class="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  :class="s.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'">
                  {{ s.is_active ? 'Khóa' : 'Mở' }}
                </button>
                <button @click="editStaff(s)"
                  class="text-xs px-3 py-1.5 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50">
                  Sửa
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal tạo nhân viên -->
    <Teleport to="body">
      <div v-if="showCreate" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        @click.self="showCreate=false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
            style="background:linear-gradient(to right,#f0f9ff,#e0f2fe)">
            <h3 class="font-bold text-sky-900">{{ editMode ? 'Sửa nhân viên' : 'Thêm nhân viên mới' }}</h3>
            <button @click="showCreate=false; editMode=null" class="text-gray-400 hover:text-gray-600">
              <X :size="18" />
            </button>
          </div>
          <form @submit.prevent="submitStaff" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập *</label>
                <input v-model="form.username" type="text" class="input-field" :disabled="!!editMode" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                <input v-model="form.full_name" type="text" class="input-field" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input v-model="form.email" type="email" class="input-field" :disabled="!!editMode" required />
            </div>
            <div v-if="!editMode">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu *</label>
              <input v-model="form.password" type="password" class="input-field" required minlength="6" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input v-model="form.phone" type="tel" class="input-field" />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" :disabled="saving" class="flex-1 btn-primary py-2.5">
                <Loader2 v-if="saving" :size="16" class="animate-spin" />
                {{ saving ? 'Đang lưu...' : (editMode ? 'Lưu thay đổi' : 'Tạo nhân viên') }}
              </button>
              <button type="button" @click="showCreate=false; editMode=null" class="btn-secondary px-5 py-2.5">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import { Plus, X, Users, Loader2 } from 'lucide-vue-next'
import api from '../../config/api'

const toast      = useToast()
const staff      = ref([])
const loading    = ref(true)
const showCreate = ref(false)
const saving     = ref(false)
const editMode   = ref(null)
const form       = reactive({ username:'', email:'', password:'', full_name:'', phone:'' })

async function loadStaff() {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/staff')
    if (data.success) staff.value = data.staff
  } catch {}
  finally { loading.value = false }
}

async function submitStaff() {
  saving.value = true
  try {
    if (editMode.value) {
      await api.put(`/api/admin/staff/${editMode.value}`, { full_name: form.full_name, phone: form.phone })
      const s = staff.value.find(x => x.id === editMode.value)
      if (s) { s.full_name = form.full_name; s.phone = form.phone }
      toast.success('Đã cập nhật!')
    } else {
      const { data } = await api.post('/api/admin/staff', form)
      toast.success('Tạo nhân viên thành công!')
      loadStaff()
    }
    showCreate.value = false
    editMode.value = null
  } catch (e) {
    toast.error(e.response?.data?.message || 'Thao tác thất bại')
  } finally { saving.value = false }
}

function editStaff(s) {
  editMode.value = s.id
  Object.assign(form, { username: s.username, email: s.email, full_name: s.full_name||'', phone: s.phone||'', password: '' })
  showCreate.value = true
}

async function toggleActive(s) {
  try {
    await api.put(`/api/admin/staff/${s.id}`, { is_active: !s.is_active })
    s.is_active = !s.is_active
    toast.success(s.is_active ? 'Đã mở tài khoản' : 'Đã khóa tài khoản')
  } catch { toast.error('Thao tác thất bại') }
}

onMounted(loadStaff)
</script>
