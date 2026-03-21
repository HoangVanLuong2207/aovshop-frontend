<template>
  <div class="product-detail-page">
    <div class="container">
      <div v-if="loading" class="loading"><div class="spinner"></div></div>
      
      <div v-else-if="product" class="product-detail">
        <div class="product-gallery">
          <div class="main-image-wrapper">
            <img 
              :src="getImageUrl(activeImage)" 
              :alt="product.name"
              class="product-main-image"
              :key="activeImage"
            />
            <div v-if="isOnSale" class="sale-badge-lg">GIẢM GIÁ</div>
            <!-- Navigation arrows for gallery -->
            <template v-if="allImages.length > 1">
              <button class="gallery-nav gallery-nav-prev" @click="prevImage">‹</button>
              <button class="gallery-nav gallery-nav-next" @click="nextImage">›</button>
            </template>
          </div>
          <!-- Thumbnails -->
          <div v-if="allImages.length > 1" class="gallery-thumbnails">
            <button
              v-for="(img, index) in allImages"
              :key="index"
              class="gallery-thumb-btn"
              :class="{ active: activeImageIndex === index }"
              @click="activeImageIndex = index"
            >
              <img :src="getImageUrl(img)" :alt="`Ảnh ${index + 1}`" />
            </button>
          </div>
        </div>

        <div class="product-content">
          <div class="product-category-badge" v-if="product.category">
            {{ product.category.name }}
          </div>
          
          <h1 class="product-title">{{ product.name }}</h1>
          
          <div class="product-pricing-lg">
            <span class="product-price-lg">{{ formatPrice(currentPrice) }}</span>
            <span v-if="isOnSale" class="product-price-old-lg">{{ formatPrice(product.price) }}</span>
            <span v-if="isOnSale" class="discount-percent">
              -{{ Math.round((1 - product.sale_price / product.price) * 100) }}%
            </span>
          </div>

          <div class="product-meta-lg">
            <div class="product-stock-status" :class="stockClass">
              {{ stockText }}
            </div>
            <div class="product-sold-lg">
              🔥 Đã bán: {{ product.sold_count || 0 }}
            </div>
          </div>

          <div class="product-description" v-if="product.description">
            <h3>Mô tả</h3>
            <p>{{ product.description }}</p>
          </div>

          <div class="product-actions">
            <div class="quantity-control">
              <button @click="quantity = Math.max(1, quantity - 1)">-</button>
              <input type="number" v-model.number="quantity" min="1" :max="product.stock" />
              <button @click="quantity = Math.min(product.stock, quantity + 1)">+</button>
            </div>
            
            <button 
              class="btn btn-secondary btn-lg" 
              @click="addToCart"
              :disabled="product.stock === 0"
            >
              🛒 Thêm vào giỏ
            </button>

            <button 
              class="btn btn-primary btn-lg" 
              @click="buyNow"
              :disabled="product.stock === 0"
            >
              ⚡ Mua ngay
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <h3>Không tìm thấy sản phẩm</h3>
        <router-link to="/products" class="btn btn-primary">Quay lại</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { shopApi } from '../api'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { getImageUrl } from '../utils/image'
import { useToast } from '../composables/useToast'

const { toast } = useToast()

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const loading = ref(true)
const product = ref(null)
const quantity = ref(1)
const activeImageIndex = ref(0)

// Combine main image + gallery images
const allImages = computed(() => {
  if (!product.value) return []
  const imgs = []
  if (product.value.image) imgs.push(product.value.image)
  if (product.value.images && product.value.images.length > 0) {
    const sortedGallery = [...product.value.images]
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(img => img.url)
    imgs.push(...sortedGallery)
  }
  return imgs
})

const activeImage = computed(() => {
  if (allImages.value.length === 0) return null
  return allImages.value[activeImageIndex.value] || allImages.value[0]
})

const prevImage = () => {
  activeImageIndex.value = activeImageIndex.value > 0
    ? activeImageIndex.value - 1
    : allImages.value.length - 1
}

const nextImage = () => {
  activeImageIndex.value = activeImageIndex.value < allImages.value.length - 1
    ? activeImageIndex.value + 1
    : 0
}

const currentPrice = computed(() => product.value?.sale_price || product.value?.price)
const isOnSale = computed(() => product.value?.sale_price && product.value.sale_price < product.value.price)

const stockClass = computed(() => ({
  'text-success': product.value?.stock > 10,
  'text-warning': product.value?.stock > 0 && product.value?.stock <= 10,
  'text-danger': product.value?.stock === 0,
}))

const stockText = computed(() => {
  if (!product.value) return ''
  if (product.value.stock === 0) return '❌ Hết hàng'
  if (product.value.stock <= 10) return `⚠️ Chỉ còn ${product.value.stock} sản phẩm`
  return `✓ Còn hàng (${product.value.stock})`
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const addToCart = () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  cartStore.addItem(product.value, quantity.value)
  toast.success('Đã thêm vào giỏ hàng!')
}

const buyNow = () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  cartStore.addItem(product.value, quantity.value)
  router.push({ name: 'checkout' })
}

onMounted(async () => {
  try {
    const response = await shopApi.getProduct(route.params.id)
    product.value = response.data
  } catch (error) {
    console.error('Failed to load product:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.product-detail-page {
  padding: 2rem 0;
}

.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

@media (max-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr;
  }
}

.product-gallery {
  position: relative;
}

.main-image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.product-main-image {
  width: 100%;
  display: block;
  transition: opacity 0.3s ease;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 1.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 2;
}

.main-image-wrapper:hover .gallery-nav {
  opacity: 1;
}

.gallery-nav:hover {
  background: rgba(0, 0, 0, 0.75);
}

.gallery-nav-prev {
  left: 10px;
}

.gallery-nav-next {
  right: 10px;
}

.gallery-thumbnails {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.gallery-thumb-btn {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.gallery-thumb-btn.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
}

.gallery-thumb-btn:hover {
  border-color: var(--primary);
}

.gallery-thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.sale-badge-lg {
  position: absolute;
  top: 20px;
  left: 20px;
  background: var(--danger);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 700;
  z-index: 1;
}

.product-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-category-badge {
  display: inline-block;
  background: var(--bg-tertiary);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  width: fit-content;
}

.product-title {
  font-size: 2rem;
  font-weight: 700;
}

.product-pricing-lg {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-price-lg {
  font-size: 2rem;
  font-weight: 700;
  color: var(--secondary);
}

.product-price-old-lg {
  font-size: 1.25rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.discount-percent {
  background: var(--danger);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
}

.product-meta-lg {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
}

.product-sold-lg {
  font-weight: 600;
  color: var(--secondary);
}

.product-stock-status {
  font-size: 1rem;
}

.product-description h3 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.product-description p {
  color: var(--text-secondary);
}

.product-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.quantity-control button {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: var(--text);
  font-size: 1.25rem;
  cursor: pointer;
}

.quantity-control button:hover {
  background: var(--bg-tertiary);
}

.quantity-control input {
  width: 60px;
  height: 40px;
  border: none;
  background: none;
  text-align: center;
  color: var(--text);
  font-size: 1rem;
}

.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }
</style>
