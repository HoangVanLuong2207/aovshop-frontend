<template>
  <div class="cart-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">🛒 Giỏ hàng</h1>
      </div>

      <div v-if="cartStore.isEmpty" class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3 class="empty-title">Giỏ hàng trống</h3>
        <p class="empty-text">Hãy thêm sản phẩm vào giỏ hàng</p>
        <router-link to="/products" class="btn btn-primary">Mua sắm ngay</router-link>
      </div>

      <div v-else class="cart-content">
        <div class="cart-items">
          <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
            <img 
              :src="getImageUrl(item.image)" 
              :alt="item.name"
              class="cart-item-image"
            />
            <div class="cart-item-info">
              <h3>{{ item.name }}</h3>
              <p class="cart-item-price">{{ formatPrice(item.sale_price || item.price) }}</p>
            </div>
            <div class="cart-item-quantity">
              <button @click="updateQuantity(item.id, item.quantity - 1, item.stock)">-</button>
              <span>{{ item.quantity }}</span>
              <button 
                @click="updateQuantity(item.id, item.quantity + 1, item.stock)"
                :disabled="item.quantity >= item.stock"
                :title="item.quantity >= item.stock ? 'Đã đạt giới hạn kho' : ''"
              >+</button>
            </div>
            <div class="cart-item-total">
              {{ formatPrice((item.sale_price || item.price) * item.quantity) }}
            </div>
            <button class="cart-item-remove" @click="removeItem(item.id)">✕</button>
          </div>
        </div>

        <div class="cart-summary">
          <h3>Tổng cộng</h3>
          <div class="summary-row">
            <span>Tạm tính</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div class="summary-total">
            <span>Tổng tiền</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <router-link to="/checkout" class="btn btn-primary btn-lg" style="width: 100%">
            Thanh toán →
          </router-link>
          <button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem" @click="clearCart">
            Xóa giỏ hàng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '../stores/cart'
import { getImageUrl } from '../utils/image'

const cartStore = useCartStore()

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const updateQuantity = (productId, quantity, stock) => {
  if (quantity < 1) {
    removeItem(productId)
  } else {
    cartStore.updateQuantity(productId, quantity, stock)
  }
}

const removeItem = (productId) => {
  cartStore.removeItem(productId)
}

const clearCart = () => {
  if (confirm('Bạn có chắc muốn xóa giỏ hàng?')) {
    cartStore.clearCart()
  }
}
</script>

<style scoped>
.cart-page {
  padding: 2rem 0;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

@media (max-width: 900px) {
  .cart-content {
    grid-template-columns: 1fr;
  }
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
}

.cart-item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.cart-item-info {
  flex: 1;
}

.cart-item-info h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.cart-item-price {
  color: var(--secondary);
  font-weight: 600;
}

.cart-item-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
}

.cart-item-quantity button {
  width: 30px;
  height: 30px;
  border: none;
  background: none;
  color: var(--text);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.cart-item-quantity button:hover {
  background: var(--bg-secondary);
}

.cart-item-quantity span {
  min-width: 30px;
  text-align: center;
}

.cart-item-total {
  font-weight: 600;
  min-width: 100px;
  text-align: right;
}

.cart-item-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
}

.cart-item-remove:hover {
  color: var(--danger);
}

.cart-summary {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.cart-summary h3 {
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
</style>
