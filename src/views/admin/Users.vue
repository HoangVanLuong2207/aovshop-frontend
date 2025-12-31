<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>👥 Quản lý người dùng</h1>
      <span class="badge badge-primary">{{ users.length }} người dùng</span>
    </div>

    <div class="card">
      <div class="card-header">
        <input 
          v-model="search" 
          type="text" 
          class="form-input" 
          placeholder="Tìm kiếm theo tên hoặc email..."
          style="max-width: 300px"
        />
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading"><div class="spinner"></div></div>
        
        <table v-else class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>Số dư</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td><strong>{{ user.id }}</strong></td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="['badge', user.role === 'admin' ? 'badge-danger' : 'badge-secondary']">
                  {{ user.role }}
                </span>
              </td>
              <td class="text-success">{{ formatPrice(user.balance) }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="editUser(user)">✏️</button>
                <button 
                  class="btn btn-sm btn-danger" 
                  @click="deleteUser(user)"
                  :disabled="user.role === 'admin'"
                >🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>Chỉnh sửa người dùng #{{ editingUser.id }}</h3>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Tên</label>
              <input v-model="editForm.name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="editForm.email" type="email" class="form-input" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select v-model="editForm.role" class="form-input">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Số dư</label>
              <input v-model.number="editForm.balance" type="number" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Hủy</button>
            <button class="btn btn-primary" @click="saveUser" :disabled="saving">
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api'

const users = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const editingUser = ref(null)
const editForm = ref({})
const saving = ref(false)

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const s = search.value.toLowerCase()
  return users.value.filter(u => 
    u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
  )
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await api.get('/admin/users')
    users.value = response.data.data
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  editingUser.value = user
  editForm.value = { ...user }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
  editForm.value = {}
}

const saveUser = async () => {
  saving.value = true
  try {
    await api.put(`/admin/users/${editingUser.value.id}`, editForm.value)
    await loadUsers()
    closeModal()
  } catch (error) {
    alert(error.response?.data?.message || 'Lỗi khi lưu')
  } finally {
    saving.value = false
  }
}

const deleteUser = async (user) => {
  if (!confirm(`Xóa người dùng "${user.name}"?`)) return
  
  try {
    await api.delete(`/admin/users/${user.id}`)
    await loadUsers()
  } catch (error) {
    alert(error.response?.data?.message || 'Lỗi khi xóa')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-users {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.table th {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg);
  border-radius: 12px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.text-success {
  color: var(--success);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}
</style>
