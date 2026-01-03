<template>
  <div class="admin-orders">
    <div class="page-header">
      <h1 class="page-title">📋 Quản lý đơn hàng</h1>
    </div>

    <div class="filters mb-3">
      <select v-model="filter.status" class="form-input" style="width: auto" @change="loadOrders">
        <option value="">Tất cả trạng thái</option>
        <option value="pending">Chờ xử lý</option>
        <option value="processing">Đang xử lý</option>
        <option value="completed">Hoàn thành</option>
        <option value="cancelled">Đã hủy</option>
      </select>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Khách hàng</th>
          <th>Sản phẩm</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>#{{ order.id }}</td>
          <td>{{ order.user?.name }}<br><small class="text-muted">{{ order.user?.email }}</small></td>
          <td>
            <div v-for="item in order.items.slice(0, 2)" :key="item.id" class="order-item-row">
              {{ item.product_name }} x{{ item.quantity }}
            </div>
            <small v-if="order.items.length > 2" class="text-muted">
              +{{ order.items.length - 2 }} sản phẩm khác
            </small>
          </td>
          <td>{{ formatPrice(order.total) }}</td>
          <td>
            <select 
              v-model="order.status" 
              class="form-input" 
              style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.85rem"
              @change="updateStatus(order)"
            >
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </td>
          <td>{{ formatDate(order.created_at) }}</td>
          <td>
            <button class="btn btn-secondary btn-sm" @click="viewOrder(order)">Chi tiết</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Detail Modal -->
    <Transition name="modal">
      <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
        <div class="modal" style="max-width: 600px">
          <div class="modal-header">
            <h3 class="modal-title">Chi tiết đơn hàng #{{ selectedOrder.id }}</h3>
            <button class="modal-close" @click="selectedOrder = null">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Khách hàng:</strong> {{ selectedOrder.user?.name }} ({{ selectedOrder.user?.email }})</p>
            <p><strong>Ngày tạo:</strong> {{ formatDate(selectedOrder.created_at) }}</p>
            <p v-if="selectedOrder.note"><strong>Ghi chú:</strong> {{ selectedOrder.note }}</p>
            
            <h4 class="mt-3 mb-2">Sản phẩm</h4>
            <table class="table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrder.items" :key="item.id">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatPrice(item.price) }}</td>
                  <td>{{ formatPrice(item.total) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="order-summary mt-3">
              <div class="summary-row">
                <span>Tạm tính:</span>
                <span>{{ formatPrice(selectedOrder.subtotal) }}</span>
              </div>
              <div v-if="selectedOrder.discount > 0" class="summary-row">
                <span>Giảm giá ({{ selectedOrder.promo_code }}):</span>
                <span class="text-success">-{{ formatPrice(selectedOrder.discount) }}</span>
              </div>
              <div class="summary-row total">
                <span>Tổng cộng:</span>
                <span>{{ formatPrice(selectedOrder.total) }}</span>
              </div>
            </div>
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
const orders = ref([])
const selectedOrder = ref(null)
const filter = reactive({ status: '' })

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'
const formatDate = (date) => new Date(date).toLocaleString('vi-VN')

const loadOrders = async () => {
  loading.value = true
  try {
    const params = { per_page: 50 }
    if (filter.status) params.status = filter.status
    const response = await adminApi.getOrders(params)
    orders.value = response.data.data
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (order) => {
  try {
    await adminApi.updateOrderStatus(order.id, order.status)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    loadOrders()
  }
}

const viewOrder = (order) => {
  selectedOrder.value = order
}

onMounted(loadOrders)
</script>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
}

.order-item-row {
  font-size: 0.9rem;
}

.order-summary {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: var(--radius-sm);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.summary-row.total {
  font-weight: 700;
  font-size: 1.1rem;
  border-top: 1px solid var(--border);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}
</style>
