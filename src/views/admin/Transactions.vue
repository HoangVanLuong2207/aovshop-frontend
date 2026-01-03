<template>
  <div class="admin-transactions">
    <div class="page-header flex-between">
      <h1 class="page-title">💳 Quản lý giao dịch</h1>
      <button class="btn btn-success" @click="showDepositModal = true">+ Nạp tiền thủ công</button>
    </div>

    <div class="filters mb-3">
      <select v-model="filter.type" class="form-input" style="width: auto" @change="loadTransactions">
        <option value="">Tất cả loại</option>
        <option value="deposit">Nạp tiền</option>
        <option value="purchase">Mua hàng</option>
        <option value="refund">Hoàn tiền</option>
      </select>
      <select v-model="filter.status" class="form-input" style="width: auto" @change="loadTransactions">
        <option value="">Tất cả trạng thái</option>
        <option value="pending">Chờ xử lý</option>
        <option value="completed">Hoàn thành</option>
        <option value="failed">Thất bại</option>
      </select>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Người dùng</th>
          <th>Loại</th>
          <th>Số tiền</th>
          <th>Số dư trước</th>
          <th>Số dư sau</th>
          <th>Trạng thái</th>
          <th>Mô tả</th>
          <th>Ngày tạo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tx in transactions" :key="tx.id">
          <td>{{ tx.id }}</td>
          <td>{{ tx.user?.name }}<br><small class="text-muted">{{ tx.user?.email }}</small></td>
          <td>
            <span :class="['badge', typeClass(tx.type)]">{{ typeText(tx.type) }}</span>
          </td>
          <td :class="tx.type === 'deposit' ? 'text-success' : 'text-danger'">
            {{ tx.type === 'deposit' ? '+' : '' }}{{ formatPrice(tx.amount) }}
          </td>
          <td>{{ formatPrice(tx.balanceBefore) }}</td>
          <td>{{ formatPrice(tx.balanceAfter) }}</td>
          <td>
            <span :class="['badge', statusClass(tx.status)]">{{ statusText(tx.status) }}</span>
          </td>
          <td class="text-muted">{{ tx.description || '-' }}</td>
          <td>{{ formatDate(tx.createdAt) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Manual Deposit Modal -->
    <Transition name="modal">
      <div v-if="showDepositModal" class="modal-overlay" @click.self="showDepositModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Nạp tiền thủ công</h3>
            <button class="modal-close" @click="showDepositModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">User ID *</label>
              <input v-model.number="depositForm.user_id" type="number" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Số tiền *</label>
              <input v-model.number="depositForm.amount" type="number" class="form-input" min="1000" required />
            </div>
            <div class="form-group">
              <label class="form-label">Ghi chú</label>
              <input v-model="depositForm.description" type="text" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showDepositModal = false">Hủy</button>
            <button class="btn btn-success" @click="manualDeposit" :disabled="depositing">
              {{ depositing ? 'Đang xử lý...' : 'Nạp tiền' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '../../api'
import { useToast } from '../../composables/useToast'

const { toast } = useToast()

const loading = ref(true)
const depositing = ref(false)
const showDepositModal = ref(false)
const transactions = ref([])
const filter = reactive({ type: '', status: '' })

const depositForm = reactive({
  user_id: '',
  amount: 100000,
  description: '',
})

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'
const formatDate = (date) => new Date(date).toLocaleString('vi-VN')

const typeClass = (type) => ({
  deposit: 'badge-success',
  purchase: 'badge-primary',
  refund: 'badge-warning',
})[type] || 'badge-primary'

const typeText = (type) => ({
  deposit: 'Nạp tiền',
  purchase: 'Mua hàng',
  refund: 'Hoàn tiền',
})[type] || type

const statusClass = (status) => ({
  pending: 'badge-warning',
  completed: 'badge-success',
  failed: 'badge-danger',
})[status] || 'badge-primary'

const statusText = (status) => ({
  pending: 'Chờ xử lý',
  completed: 'Thành công',
  failed: 'Thất bại',
})[status] || status

const loadTransactions = async () => {
  loading.value = true
  try {
    const params = { per_page: 50 }
    if (filter.type) params.type = filter.type
    if (filter.status) params.status = filter.status
    const response = await adminApi.getTransactions(params)
    transactions.value = response.data.data
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    loading.value = false
  }
}

const manualDeposit = async () => {
  if (!depositForm.user_id || !depositForm.amount) return
  
  depositing.value = true
  try {
    await adminApi.manualDeposit(depositForm)
    showDepositModal.value = false
    depositForm.user_id = ''
    depositForm.amount = 100000
    depositForm.description = ''
    loadTransactions()
    toast.success('Nạp tiền thành công!')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Nạp tiền thất bại')
  } finally {
    depositing.value = false
  }
}

onMounted(loadTransactions)
</script>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
}

.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
</style>
