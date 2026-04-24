<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>👥 Quản lý người dùng</h1>
      <span class="badge badge-primary">{{ users.length }} người dùng</span>
    </div>

    <div class="card">
      <div class="card-header search-container">
        <input 
          v-model="search" 
          type="text" 
          class="form-input" 
          placeholder="Tìm kiếm..."
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
              <td data-label="ID"><strong>{{ user.id }}</strong></td>
              <td data-label="Tên">{{ user.name }}</td>
              <td data-label="Email">{{ user.email }}</td>
              <td data-label="Role">
                <span :class="['badge', user.role === 'admin' ? 'badge-danger' : 'badge-secondary']">
                  {{ user.role }}
                </span>
              </td>
              <td data-label="Số dư" class="text-success-val">{{ formatPrice(user.balance) }}</td>
              <td data-label="Ngày tạo">{{ formatDate(user.createdAt) }}</td>
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
              <input v-model="editForm.email" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select v-model="editForm.role" class="form-input">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Cộng số dư (nhập số dương để cộng, âm để trừ)</label>
              <input v-model.number="editForm.addBalance" type="number" class="form-input" placeholder="0" />
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
import { useToast } from '../../composables/useToast'

const { toast, confirm } = useToast()

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
  editForm.value = { 
    name: user.name,
    email: user.email,
    role: user.role,
    addBalance: 0  // Default to 0 for adding balance
  }
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
    toast.success('Cập nhật người dùng thành công!')
    closeModal()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi lưu')
  } finally {
    saving.value = false
  }
}

const deleteUser = async (user) => {
  const confirmed = await confirm(`Xóa người dùng "${user.name}"?`, { type: 'danger', title: 'Xóa người dùng' })
  if (!confirmed) return
  
  try {
    await api.delete(`/admin/users/${user.id}`)
    await loadUsers()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi khi xóa')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-users {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
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

.text-success-val {
  color: var(--success);
}

.search-container {
  padding: 1rem;
}

@media (max-width: 480px) {
  .search-container .form-input {
    max-width: 100% !important;
  }
}

@media (max-width: 768px) {
  .admin-users {
    padding: 0.75rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  /* Table to Cards */
  .table thead {
    display: none;
  }

  .table tbody tr {
    display: block;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--bg-secondary);
  }

  .table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    text-align: right;
    gap: 1rem;
    min-width: 0;
  }

  .table td:last-child {
    border-bottom: none;
    justify-content: center;
    gap: 0.5rem;
    padding-top: 1rem !important;
  }

  .table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-align: left;
    flex-shrink: 0;
  }

  /* Chống lẹm nội dung text */
  .table td {
    word-break: break-word;
  }

  .modal {
    width: 95%;
    margin: 0 auto;
    max-height: 85vh;
  }
}
</style>
