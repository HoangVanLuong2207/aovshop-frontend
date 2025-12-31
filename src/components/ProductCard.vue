<template>
  <router-link :to="`/products/${product.id}`" class="product-card">
    <img 
      :src="getImageUrl(product.image)" 
      :alt="product.name"
      class="product-image"
    />
    <div class="product-info">
      <div class="product-category" v-if="product.category">
        {{ product.category.name }}
      </div>
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="product-pricing">
        <span class="product-price">{{ formatPrice(currentPrice) }}</span>
        <span v-if="isOnSale" class="product-price-old">{{ formatPrice(product.price) }}</span>
      </div>
      <div class="product-meta">
        <div class="product-stock" :class="stockClass">
          {{ stockText }}
        </div>
        <div class="product-sold">
          Đã bán: {{ product.sold_count || 0 }}
        </div>
      </div>
    </div>
    <div v-if="isOnSale" class="sale-badge">SALE</div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { getImageUrl } from '../utils/image'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const currentPrice = computed(() => props.product.sale_price || props.product.price)
const isOnSale = computed(() => props.product.sale_price && props.product.sale_price < props.product.price)

const stockClass = computed(() => ({
  'text-success': props.product.stock > 10,
  'text-warning': props.product.stock > 0 && props.product.stock <= 10,
  'text-danger': props.product.stock === 0,
}))

const stockText = computed(() => {
  if (props.product.stock === 0) return 'Hết hàng'
  if (props.product.stock <= 10) return `Còn ${props.product.stock}`
  return 'Còn hàng'
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}
</script>

<style scoped>
.product-card {
  position: relative;
  display: block;
  color: var(--text);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.product-card:hover {
  transform: translateY(-8px);
  border-color: var(--primary);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(99, 102, 241, 0.2);
}

.product-card .product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: var(--bg-tertiary);
  transition: transform 0.5s ease;
}

.product-card:hover .product-image {
  transform: scale(1.08);
}

.product-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.4));
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.product-card:hover::after {
  opacity: 1;
}

.product-info {
  padding: 1.25rem;
  position: relative;
  z-index: 1;
  background: var(--bg-secondary);
}

.product-category {
  font-size: 0.75rem;
  color: var(--primary-light);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.product-name {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text);
  font-size: 1.05rem;
  line-height: 1.4;
}

.product-pricing {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.product-price {
  font-size: 1.35rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--secondary), var(--secondary-dark));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.product-price-old {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.product-sold {
  color: var(--text-muted);
  font-weight: 500;
}

.sale-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, var(--danger), #ff6b6b);
  color: white;
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: pulse-glow 2s ease-in-out infinite;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  z-index: 2;
}

.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }
</style>
