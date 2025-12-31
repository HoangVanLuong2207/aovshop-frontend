<template>
  <div class="checkout-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">💳 Thanh toán</h1>
      </div>

      <div v-if="cartStore.isEmpty" class="empty-state">
        <h3>Giỏ hàng trống</h3>
        <router-link to="/products" class="btn btn-primary">Mua sắm ngay</router-link>
      </div>

      <div v-else class="checkout-content">
        <!-- Order Items -->
        <div class="checkout-items">
          <h3>Sản phẩm ({{ cartStore.itemCount }})</h3>
          <div v-for="item in cartStore.items" :key="item.id" class="checkout-item">
            <img 
              :src="getImageUrl(item.image)" 
              :alt="item.name"
            />
            <div class="item-info">
              <h4>{{ item.name }}</h4>
              <p>{{ formatPrice(item.sale_price || item.price) }} × {{ item.quantity }}</p>
            </div>
            <div class="item-total">
              {{ formatPrice((item.sale_price || item.price) * item.quantity) }}
            </div>
          </div>

          <!-- Promo Code -->
          <div class="promo-section">
            <h3>Mã khuyến mãi</h3>
            <div class="promo-input">
              <input 
                v-model="promoCode" 
                type="text" 
                class="form-input" 
                placeholder="Nhập mã giảm giá"
                :disabled="appliedPromo"
              />
              <button 
                v-if="!appliedPromo"
                class="btn btn-secondary" 
                @click="applyPromo"
                :disabled="!promoCode || applyingPromo"
              >
                {{ applyingPromo ? '...' : 'Áp dụng' }}
              </button>
              <button v-else class="btn btn-danger btn-sm" @click="removePromo">Hủy</button>
            </div>
            <p v-if="promoError" class="text-danger" style="margin-top: 0.5rem">{{ promoError }}</p>
            <p v-if="appliedPromo" class="text-success" style="margin-top: 0.5rem">
              ✓ {{ appliedPromo.name }} - Giảm {{ formatPrice(discount) }}
            </p>
          </div>

          <!-- Note -->
          <div class="note-section">
            <h3>Ghi chú</h3>
            <textarea 
              v-model="note" 
              class="form-input" 
              rows="3" 
              placeholder="Ghi chú cho đơn hàng (tùy chọn)"
            ></textarea>
          </div>
        </div>

        <!-- Summary -->
        <div class="checkout-summary">
          <h3>Tổng thanh toán</h3>
          <div class="summary-row">
            <span>Tạm tính</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div v-if="discount > 0" class="summary-row discount">
            <span>Giảm giá</span>
            <span>-{{ formatPrice(discount) }}</span>
          </div>
          <div class="summary-total">
            <span>Tổng cộng</span>
            <span>{{ formatPrice(total) }}</span>
          </div>

          <div class="balance-check">
            <p>Số dư hiện tại: <strong>{{ formatPrice(authStore.balance) }}</strong></p>
            <p v-if="authStore.balance < total" class="text-danger">
              ⚠️ Số dư không đủ. Vui lòng nạp thêm tiền.
            </p>
          </div>

          <button 
            class="btn btn-primary btn-lg" 
            style="width: 100%"
            @click="placeOrder"
            :disabled="processing || authStore.balance < total"
          >
            {{ processing ? 'Đang xử lý...' : 'Thanh toán' }}
          </button>

          <router-link 
            v-if="authStore.balance < total" 
            to="/deposit" 
            class="btn btn-success" 
            style="width: 100%; margin-top: 0.5rem"
          >
            Nạp tiền →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { orderApi } from '../api'
import { getImageUrl } from '../utils/image'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const promoCode = ref('')
const appliedPromo = ref(null)
const discount = ref(0)
const promoError = ref('')
const applyingPromo = ref(false)
const note = ref('')
const processing = ref(false)

const total = computed(() => cartStore.subtotal - discount.value)

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const applyPromo = async () => {
  if (!promoCode.value) return
  
  applyingPromo.value = true
  promoError.value = ''
  
  try {
    const response = await orderApi.applyPromotion({
      code: promoCode.value,
      subtotal: cartStore.subtotal,
    })
    appliedPromo.value = response.data.promotion
    discount.value = response.data.discount
  } catch (error) {
    promoError.value = error.response?.data?.message || 'Mã không hợp lệ'
  } finally {
    applyingPromo.value = false
  }
}

const removePromo = () => {
  appliedPromo.value = null
  discount.value = 0
  promoCode.value = ''
  promoError.value = ''
}

const placeOrder = async () => {
  processing.value = true
  
  try {
    const response = await orderApi.checkout({
      items: cartStore.getCheckoutItems(),
      promo_code: appliedPromo.value?.code || null,
      note: note.value || null,
    })
    
    await authStore.fetchProfile()
    cartStore.clearCart()
    
    alert('Thanh toán thành công!')
    router.push('/orders')
  } catch (error) {
    console.error('Checkout error:', error)
    alert(error.response?.data?.message || 'Thanh toán thất bại: ' + error.message)
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.checkout-page {
  padding: 2rem 0;
}

.checkout-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
}

@media (max-width: 900px) {
  .checkout-content {
    grid-template-columns: 1fr;
  }
}

.checkout-items {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.checkout-items h3 {
  margin-bottom: 0.5rem;
}

.checkout-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 1rem;
}

.checkout-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.checkout-item .item-info {
  flex: 1;
}

.checkout-item .item-info h4 {
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.checkout-item .item-info p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.checkout-item .item-total {
  font-weight: 600;
}

.promo-section, .note-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
}

.promo-input {
  display: flex;
  gap: 0.5rem;
}

.promo-input .form-input {
  flex: 1;
}

.checkout-summary {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.checkout-summary h3 {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
}

.summary-row.discount {
  color: var(--success);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 700;
  padding-top: 1rem;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  border-top: 1px solid var(--border);
}

.balance-check {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.balance-check p {
  font-size: 0.9rem;
}

.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
</style>
