<template>
  <div class="admin-orders">
    <div class="page-header">
      <h1 class="page-title">📋 Quản lý đơn hàng</h1>
    </div>

    <div class="filters mb-3">
      <div class="filter-group">
        <select v-model="filter.status" class="form-input" @change="loadOrders">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="waiting">⏳ Chờ hàng về (Pre-order)</option>
          <option value="processing">Đang xử lý</option>
          <option value="delivered">✅ Đã giao hàng</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select v-model="filter.type" class="form-input" @change="loadOrders">
          <option value="">Tất cả loại</option>
          <option value="instant">Thường</option>
          <option value="preorder">Pre-order</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Loại</th>
          <th>Khách hàng</th>
          <th>Sản phẩm</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredOrders" :key="order.id" :class="{ 'row-preorder': order.orderType === 'preorder' }">
          <td data-label="ID">#{{ order.id }}</td>
          <td data-label="Loại">
            <span v-if="order.orderType === 'preorder'" class="badge badge-preorder">📦 Pre-order</span>
            <span v-else class="badge badge-instant">⚡ Thường</span>
          </td>
          <td data-label="Khách hàng">{{ order.user?.name }}<br><small class="text-muted">{{ order.user?.email }}</small></td>
          <td data-label="Sản phẩm">
            <div v-for="item in order.items.slice(0, 2)" :key="item.id" class="order-item-row">
              {{ item.productName }} x{{ item.quantity }}
            </div>
            <small v-if="order.items.length > 2" class="text-muted">
              +{{ order.items.length - 2 }} sản phẩm khác
            </small>
          </td>
          <td data-label="Tổng tiền">{{ formatPrice(order.total) }}</td>
          <td data-label="Trạng thái">
            <select 
              v-model="order.status" 
              class="form-input" 
              style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.85rem"
              @change="updateStatus(order)"
            >
              <option value="pending">Chờ xử lý</option>
              <option value="waiting">⏳ Chờ hàng về</option>
              <option value="processing">Đang xử lý</option>
              <option value="delivered">✅ Đã giao</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </td>
          <td data-label="Ngày tạo">{{ formatDate(order.createdAt) }}</td>
          <td>
            <button class="btn btn-secondary btn-sm" @click="viewOrder(order)">Chi tiết</button>
            <button 
              v-if="order.orderType === 'preorder' && order.status === 'waiting'"
              class="btn btn-success btn-sm ml-1" 
              @click="openDeliverModal(order)"
            >
              📦 Giao hàng
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Detail Modal -->
    <Transition name="modal">
      <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
        <div class="modal" style="max-width: 640px">
          <div class="modal-header">
            <h3 class="modal-title">
              Chi tiết đơn hàng #{{ selectedOrder.id }}
              <span v-if="selectedOrder.orderType === 'preorder'" class="badge badge-preorder ml-2">📦 Pre-order</span>
            </h3>
            <button class="modal-close" @click="selectedOrder = null">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Khách hàng:</strong> {{ selectedOrder.user?.name }} ({{ selectedOrder.user?.email }})</p>
            <p><strong>Ngày tạo:</strong> {{ formatDate(selectedOrder.createdAt) }}</p>
            <p v-if="selectedOrder.note"><strong>📞 Thông tin liên hệ:</strong> {{ selectedOrder.note }}</p>

            <!-- Customer note for pre-orders -->
            <div v-if="selectedOrder.customerNote" class="customer-note-admin">
              <div class="cnote-label">📝 Thông tin liên hệ / yêu cầu đặt hàng:</div>
              <pre class="cnote-text">{{ selectedOrder.customerNote }}</pre>
            </div>

            <!-- Delivery data if already delivered -->
            <div v-if="selectedOrder.deliveryData" class="delivery-done-admin">
              <div class="dlabel">✅ Đã giao lúc {{ formatDate(selectedOrder.deliveredAt) }}:</div>
              <pre class="dtext">{{ selectedOrder.deliveryData }}</pre>
            </div>

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
                  <td>{{ item.productName }}</td>
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
                <span>Giảm giá ({{ selectedOrder.promoCode }}):</span>
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

    <!-- Deliver Modal -->
    <Transition name="modal">
      <div v-if="deliverOrder" class="modal-overlay" @click.self="deliverOrder = null">
        <div class="modal" style="max-width: 560px">
          <div class="modal-header">
            <h3 class="modal-title">📦 Giao hàng — Đơn #{{ deliverOrder.id }}</h3>
            <button class="modal-close" @click="deliverOrder = null">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="deliverOrder.customerNote" class="customer-note-admin mb-3">
              <div class="cnote-label">📝 Thông tin user yêu cầu:</div>
              <pre class="cnote-text">{{ deliverOrder.customerNote }}</pre>
            </div>

            <div class="form-group">
              <label class="form-label">Nội dung giao hàng <span class="text-danger">*</span></label>
              <textarea 
                v-model="deliveryData"
                class="form-input"
                rows="6"
                placeholder="Nhập thông tin giao cho user: tài khoản, mật khẩu, link, hướng dẫn..."
              ></textarea>
              <small class="text-muted">User sẽ thấy nội dung này trong đơn hàng của họ</small>
            </div>

            <div class="modal-actions mt-3">
              <button class="btn btn-secondary" @click="deliverOrder = null">Hủy</button>
              <button 
                class="btn btn-success"
                @click="confirmDeliver"
                :disabled="delivering || !deliveryData.trim()"
              >
                {{ delivering ? 'Đang giao...' : '✅ Xác nhận giao hàng' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { adminApi } from '../../api'
import { useToast } from '../../composables/useToast'

const { toast } = useToast()

const loading = ref(true)
const orders = ref([])
const selectedOrder = ref(null)
const deliverOrder = ref(null)
const deliveryData = ref('')
const delivering = ref(false)
const filter = reactive({ status: '', type: '' })

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'
const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString('vi-VN')
}

const filteredOrders = computed(() => {
  let list = orders.value
  if (filter.type) {
    list = list.filter(o => o.orderType === filter.type)
  }
  return list
})

const loadOrders = async () => {
  loading.value = true
  try {
    const params = { per_page: 100 }
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
    toast.success('Đã cập nhật trạng thái')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    loadOrders()
  }
}

const viewOrder = (order) => {
  selectedOrder.value = order
}

const openDeliverModal = (order) => {
  deliverOrder.value = order
  deliveryData.value = ''
}

const confirmDeliver = async () => {
  if (!deliveryData.value.trim()) return
  delivering.value = true
  try {
    await adminApi.deliverOrder(deliverOrder.value.id, deliveryData.value)
    toast.success('Giao hàng thành công! User đã nhận được thông tin.')
    deliverOrder.value = null
    deliveryData.value = ''
    await loadOrders()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Giao hàng thất bại')
  } finally {
    delivering.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
  width: 100%;
}

@media (max-width: 600px) {
  .filter-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  .filter-group .form-input {
    width: 100% !important;
  }
}

.ml-1 { margin-left: 0.4rem; }
.ml-2 { margin-left: 0.5rem; }
.mb-3 { margin-bottom: 1rem; }

.order-item-row {
  font-size: 0.9rem;
}

.row-preorder {
  background: rgba(245, 158, 11, 0.04);
}

.badge-preorder {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.badge-instant {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.customer-note-admin {
  background: rgba(245, 158, 11, 0.06);
  border: 1px dashed rgba(245, 158, 11, 0.4);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.cnote-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #d97706;
  margin-bottom: 0.4rem;
}

.cnote-text {
  font-family: inherit;
  font-size: 0.88rem;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: var(--text-primary);
}

.delivery-done-admin {
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.dlabel {
  font-size: 0.82rem;
  font-weight: 600;
  color: #059669;
  margin-bottom: 0.4rem;
}

.dtext {
  font-family: monospace;
  font-size: 0.88rem;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: var(--text-primary);
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  /* Biến bảng thành Card trên mobile */
  .table thead {
    display: none; /* Ẩn tiêu đề bảng */
  }

  .table tbody tr {
    display: block;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    margin-bottom: 1rem;
    position: relative;
  }

  .table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 0.75rem 0 !important;
    text-align: right !important;
  }

  .table td:last-child {
    border-bottom: none;
    justify-content: center;
    gap: 0.5rem;
    padding-top: 1rem !important;
  }

  /* Thêm nhãn cho dữ liệu */
  .table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-secondary);
    text-align: left;
    font-size: 0.85rem;
  }

  .order-item-row {
    text-align: right;
  }
}
</style>
