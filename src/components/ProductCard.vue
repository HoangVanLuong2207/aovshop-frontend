<template>
  <router-link :to="`/products/${product.id}`" class="product-card" ref="cardRef">
    <div class="product-image-wrapper">
      <img 
        :src="getImageUrl(product.image)" 
        :alt="product.name"
        class="product-image"
        loading="lazy"
      />
      <!-- Quick View Overlay -->
      <div class="product-overlay" @click.prevent="openQuickView">
        <span class="quick-view-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Xem nhanh
        </span>
      </div>
    </div>
    
    <div class="product-info">
      <div class="product-category" v-if="product.category">
        {{ product.category.name }}
      </div>
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="product-pricing">
        <span class="product-price">{{ formatPrice(currentPrice) }}</span>
        <span v-if="isOnSale" class="product-price-old">{{ formatPrice(product.price) }}</span>
        <span v-if="isOnSale" class="discount-badge">-{{ discountPercent }}%</span>
      </div>
      <div class="product-meta">
        <div class="product-stock" :class="stockClass">
          <span class="stock-dot"></span>
          {{ stockText }}
        </div>
        <div class="product-sold">
          🔥 {{ product.sold_count || 0 }}
        </div>
      </div>
      <!-- Stock Progress Bar -->
      <div v-if="product.stock > 0 && product.stock <= 20" class="stock-bar-wrapper">
        <div class="stock-bar" :style="{ width: stockPercent + '%' }"></div>
        <span class="stock-text">Còn {{ product.stock }} sản phẩm</span>
      </div>
    </div>
    
    <!-- Badges -->
    <div v-if="isOnSale" class="sale-badge">
      <span class="sale-text">SALE</span>
    </div>
    <div v-if="isNew" class="new-badge">NEW</div>
    
    <!-- Quick View Modal -->
    <QuickViewModal 
      :show="showQuickView" 
      :product="product" 
      @close="showQuickView = false" 
    />
  </router-link>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getImageUrl } from '../utils/image'
import QuickViewModal from './QuickViewModal.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cardRef = ref(null)
const showQuickView = ref(false)

const openQuickView = (e) => {
  e.preventDefault()
  showQuickView.value = true
}

const currentPrice = computed(() => props.product.sale_price || props.product.price)
const isOnSale = computed(() => props.product.sale_price && props.product.sale_price < props.product.price)
const isNew = computed(() => {
  if (!props.product.created_at) return false
  const createdDate = new Date(props.product.created_at)
  const now = new Date()
  const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
})

const discountPercent = computed(() => {
  if (!isOnSale.value) return 0
  return Math.round((1 - props.product.sale_price / props.product.price) * 100)
})

const stockPercent = computed(() => {
  const maxStock = 50 // Assume max stock for progress bar
  return Math.min((props.product.stock / maxStock) * 100, 100)
})

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

// 3D Tilt Effect
const handleMouseMove = (e) => {
  if (!cardRef.value?.$el) return
  const card = cardRef.value.$el
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = (y - centerY) / 20
  const rotateY = (centerX - x) / 20
  
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`
}

const handleMouseLeave = () => {
  if (!cardRef.value?.$el) return
  cardRef.value.$el.style.transform = ''
}

onMounted(() => {
  if (cardRef.value?.$el) {
    cardRef.value.$el.addEventListener('mousemove', handleMouseMove)
    cardRef.value.$el.addEventListener('mouseleave', handleMouseLeave)
  }
})

onUnmounted(() => {
  if (cardRef.value?.$el) {
    cardRef.value.$el.removeEventListener('mousemove', handleMouseMove)
    cardRef.value.$el.removeEventListener('mouseleave', handleMouseLeave)
  }
})
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
  transform-style: preserve-3d;
}

.product-card:hover {
  border-color: var(--primary);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3), 
    0 0 30px rgba(99, 102, 241, 0.2),
    0 0 60px rgba(99, 102, 241, 0.1);
}

/* Image Wrapper */
.product-image-wrapper {
  position: relative;
  overflow: hidden;
  height: 200px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--bg-tertiary);
  transition: transform 0.5s ease;
}

.product-card:hover .product-image {
  transform: scale(1.1);
}

/* Overlay */
.product-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 30%, rgba(0, 0, 0, 0.7));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.quick-view-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.product-card:hover .quick-view-btn {
  transform: translateY(0);
}

.quick-view-btn:hover {
  background: var(--primary);
}

/* Product Info */
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Pricing */
.product-pricing {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
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

.discount-badge {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Meta */
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.product-stock {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.stock-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

.product-sold {
  color: var(--text-muted);
  font-weight: 500;
}

/* Stock Progress Bar */
.stock-bar-wrapper {
  margin-top: 12px;
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.stock-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--danger), var(--warning));
  border-radius: 3px;
  transition: width 0.5s ease;
}

.stock-text {
  position: absolute;
  right: 0;
  top: -20px;
  font-size: 11px;
  color: var(--text-muted);
}

/* Badges */
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

.sale-text {
  position: relative;
}

.new-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  z-index: 2;
  animation: bounce-subtle 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 4px 25px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3);
  }
}

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }

/* Responsive */
@media (max-width: 640px) {
  .product-image-wrapper {
    height: 160px;
  }
  
  .product-info {
    padding: 1rem;
  }
  
  .product-name {
    font-size: 0.95rem;
  }
  
  .product-price {
    font-size: 1.15rem;
  }
}
</style>
