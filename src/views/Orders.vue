<template>
  <div class="orders-page">
    <div class="container">
      <div class="page-header flex-between">
        <div>
          <h1 class="page-title">📋 Lịch sử đơn hàng</h1>
          <p class="page-subtitle">Xem và xuất lịch sử mua hàng</p>
        </div>
        <button class="btn btn-secondary" @click="exportOrders" :disabled="exporting">
          {{ exporting ? 'Đang xuất...' : '📥 Xuất file' }}
        </button>
      </div>

      <div v-if="loading" class="loading"><div class="spinner"></div></div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3 class="empty-title">Chưa có đơn hàng</h3>
        <p class="empty-text">Hãy mua sắm để tạo đơn hàng đầu tiên</p>
        <router-link to="/products" class="btn btn-primary">Mua sắm ngay</router-link>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <div>
              <h3>Đơn hàng #{{ order.id }}</h3>
              <p class="order-date">{{ formatDate(order.created_at) }}</p>
            </div>
            <span :class="['badge', statusClass(order.status)]">
              {{ statusText(order.status) }}
            </span>
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <span class="item-name">{{ item.product_name }}</span>
              <span class="item-qty">×{{ item.quantity }}</span>
              <span class="item-price">{{ formatPrice(item.total) }}</span>
            </div>
          </div>

          <div v-if="order.accounts && order.accounts.length > 0" class="purchased-accounts">
            <div class="accounts-header">🔑 Tài khoản đã mua:</div>
            <div class="accounts-list">
              <div v-for="acc in order.accounts" :key="acc.id" class="account-line">
                <code>{{ acc.data }}</code>
                <button class="btn btn-sm btn-icon" @click="copyToClipboard(acc.data)" title="Copy">📋</button>
              </div>
            </div>
            <p class="account-tip">Định dạng: <strong>tài khoản|mật khẩu</strong></p>
          </div>

          <div class="order-footer">
            <div class="order-summary">
              <span v-if="order.discount > 0" class="order-discount">
                Giảm giá: -{{ formatPrice(order.discount) }}
              </span>
              <span class="order-total">Tổng: {{ formatPrice(order.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.lastPage > 1" class="pagination">
          <button 
            class="btn btn-secondary btn-sm" 
            :disabled="pagination.currentPage === 1"
            @click="changePage(pagination.currentPage - 1)"
          >
            ← Trước
          </button>
          <span class="pagination-info">
            Trang {{ pagination.currentPage }} / {{ pagination.lastPage }}
          </span>
          <button 
            class="btn btn-secondary btn-sm" 
            :disabled="pagination.currentPage === pagination.lastPage"
            @click="changePage(pagination.currentPage + 1)"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { orderApi } from '../api'
import { useToast } from '../composables/useToast'

const { toast } = useToast()

const loading = ref(true)
const exporting = ref(false)
const orders = ref([])
const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('vi-VN')
}

const statusClass = (status) => {
  const classes = {
    pending: 'badge-warning',
    processing: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-danger',
  }
  return classes[status] || 'badge-primary'
}

const statusText = (status) => {
  const texts = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  }
  return texts[status] || status
}

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await orderApi.getOrders({ page: pagination.currentPage })
    orders.value = response.data.data
    pagination.currentPage = response.data.current_page
    pagination.lastPage = response.data.last_page
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  pagination.currentPage = page
  loadOrders()
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Đã sao chép tài khoản!')
  })
}

const exportOrders = async () => {
  exporting.value = true
  try {
    const response = await orderApi.exportOrders()
    const data = response.data

    // Create CSV content
    let csv = 'ID,Ngày,Trạng thái,Tạm tính,Giảm giá,Tổng,Sản phẩm\n'
    data.orders.forEach(order => {
      const items = order.items.map(i => `${i.name} x${i.quantity}`).join('; ')
      csv += `${order.id},"${order.date}",${order.status},${order.subtotal},${order.discount},${order.total},"${items}"\n`
    })

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    toast.error('Xuất file thất bại')
  } finally {
    exporting.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.orders-page {
  padding: 2rem 0;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border);
}

.order-header h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.order-date {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.order-items {
  padding: 1rem 1.25rem;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
}

.order-item:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
}

.item-qty {
  color: var(--text-muted);
  margin-right: 1rem;
}

.item-price {
  font-weight: 500;
}

.order-footer {
  padding: 1rem 1.25rem;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border);
}

.order-summary {
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
}

.order-discount {
  color: var(--success);
}

.order-total {
  font-weight: 700;
  font-size: 1.1rem;
}

.purchased-accounts {
  margin: 0 1.25rem 1rem;
  padding: 1rem;
  background: rgba(var(--primary-rgb), 0.05);
  border: 1px dashed var(--primary);
  border-radius: var(--radius-sm);
}

.accounts-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--primary);
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.account-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-primary);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
}

.account-line code {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.account-tip {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.75rem;
  text-align: right;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
