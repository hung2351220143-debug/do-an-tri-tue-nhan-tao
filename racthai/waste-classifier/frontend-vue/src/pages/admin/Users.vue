<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
        <p class="text-gray-500 text-sm mt-0.5">Tổng: {{ total }} tài khoản</p>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
      <div class="relative">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="text" placeholder="Tìm theo tên hoặc email..."
          class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-40">
        <Loader2 class="animate-spin text-sky-500" :size="28" />
      </div>
      <div v-else-if="!users.length" class="text-center py-12 text-gray-400">
        <UsersIcon :size="36" class="mx-auto mb-2 opacity-40" />
        <p>Không tìm thấy người dùng</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Người dùng</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Vai trò</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Đăng ký</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Lần cuối</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50 transition-colors" :class="u.id === auth.state.user?.id ? 'bg-sky-50/30' : ''">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" :class="u.role === 'admin' ? 'bg-purple-600' : 'bg-sky-600'">
                    {{ u.username.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-800">{{ u.username }}</p>
                    <span v-if="u.id === auth.state.user?.id" class="text-xs text-sky-600">(Bạn)</span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ u.email }}</td>
              <td class="px-4 py-3">
                <span class="badge" :class="u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                  <Shield v-if="u.role === 'admin'" :size="11" /> {{ u.role === 'admin' ? 'Admin' : 'User' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="badge" :class="u.is_active ? 'bg-sky-100 text-sky-700' : 'bg-red-100 text-red-700'">
                  {{ u.is_active ? '● Hoạt động' : '● Đã khóa' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(u.created_at) }}</td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(u.last_login) }}</td>
              <td class="px-4 py-3">
                <div v-if="u.id !== auth.state.user?.id" class="flex items-center justify-end gap-1">
                  <button @click="updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })" :title="u.role === 'admin' ? 'Hạ xuống User' : 'Nâng lên Admin'" class="p-1.5 rounded-lg hover:bg-purple-100 text-purple-600 transition-colors">
                    <Shield :size="15" />
                  </button>
                  <button @click="updateUser(u.id, { is_active: !u.is_active })" :title="u.is_active ? 'Khóa tài khoản' : 'Mở tài khoản'" class="p-1.5 rounded-lg transition-colors" :class="u.is_active ? 'hover:bg-red-100 text-red-500' : 'hover:bg-sky-100 text-sky-500'">
                    <UserX v-if="u.is_active" :size="15" />
                    <UserCheck v-else :size="15" />
                  </button>
                  <button v-if="u.role !== 'admin'" @click="deleteUser(u.id, u.username)" title="Xóa tài khoản" class="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">Trang {{ page }} / {{ totalPages }}</p>
        <div class="flex gap-2">
          <button @click="page--" :disabled="page === 1" class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50">← Trước</button>
          <button @click="page++" :disabled="page === totalPages" class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50">Sau →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../../config/api'
import { useToast } from 'vue-toastification'
import { Search, Shield, UserX, UserCheck, Trash2, Loader2, Users as UsersIcon } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const toast = useToast()

const users = ref([])
const loading = ref(true)
const search = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

let searchTimer = null
watch(search, () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page.value = 1; loadUsers() }, 300) })
watch(page, loadUsers)

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await api.get(`/api/admin/users?page=${page.value}&limit=15&search=${search.value}`)
    if (data.success) { users.value = data.users; totalPages.value = data.pagination.totalPages; total.value = data.pagination.total }
  } catch { toast.error('Không thể tải danh sách') }
  finally { loading.value = false }
}

async function updateUser(id, updates) {
  try {
    await api.put(`/api/admin/users/${id}`, updates)
    toast.success('Cập nhật thành công')
    loadUsers()
  } catch (error) { toast.error(error.response?.data?.message || 'Không thể cập nhật') }
}

async function deleteUser(id, username) {
  if (!confirm(`Xóa tài khoản "${username}"? Hành động này không thể hoàn tác!`)) return
  try {
    await api.delete(`/api/admin/users/${id}`)
    toast.success('Đã xóa người dùng')
    loadUsers()
  } catch (error) { toast.error(error.response?.data?.message || 'Không thể xóa') }
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : 'Chưa đăng nhập' }

loadUsers()
</script>
