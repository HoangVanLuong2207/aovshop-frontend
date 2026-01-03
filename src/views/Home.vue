<template>
  <div class="home">
    <!-- Hero Section with Banner Slider -->
    <section class="hero">
      <!-- Slider Container -->
      <div class="slider-container" v-if="bannerImages.length > 0">
        <div class="slider-track" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
          <div 
            v-for="(banner, idx) in bannerImages" 
            :key="idx" 
            class="slider-slide"
            :style="{ backgroundImage: `linear-gradient(rgba(15, 15, 26, 0.8), rgba(15, 15, 26, 0.9)), url(${banner})` }"
          ></div>
        </div>
      </div>
      <!-- Fallback gradient khi không có banner -->
      <div v-else class="slider-fallback"></div>
      
      <!-- Content overlay -->
      <div class="hero-content">
        <div class="container">
          <h1 class="hero-title">{{ settingsStore.shopName }}</h1>
          <p class="hero-subtitle">Mua bán tài khoản, tướng, skin và vật phẩm game</p>
          <router-link to="/products" class="btn btn-primary btn-lg">
            Khám phá ngay →
          </router-link>
        </div>
      </div>
      
      <!-- Slider Navigation (nếu có nhiều banner) -->
      <div v-if="bannerImages.length > 1" class="slider-dots">
        <button 
          v-for="(_, idx) in bannerImages" 
          :key="idx" 
          class="slider-dot" 
          :class="{ active: currentSlide === idx }"
          @click="goToSlide(idx)"
        ></button>
      </div>
    </section>

    <!-- Categories -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">Danh mục sản phẩm</h2>
        <div v-if="loading" class="loading"><div class="spinner"></div></div>
        <div v-else class="grid grid-3">
          <router-link 
            v-for="category in categories" 
            :key="category.id"
            :to="`/products?category=${category.id}`"
            class="category-card"
            :style="category.image ? { backgroundImage: `linear-gradient(rgba(15, 15, 26, 0.7), rgba(15, 15, 26, 0.85)), url(${getImageUrl(category.image)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
          >
            <div class="category-icon">
              <img 
                v-if="category.image" 
                :src="getImageUrl(category.image)" 
                :alt="category.name"
                class="category-img"
              />
              <span v-else>📁</span>
            </div>
            <h3>{{ category.name }}</h3>
            <p>{{ category.products_count }} sản phẩm</p>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="section" v-if="featuredProducts.length">
      <div class="container">
        <h2 class="section-title">🔥 Đang giảm giá</h2>
        <div class="grid grid-4">
          <ProductCard 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :product="product"
          />
        </div>
      </div>
    </section>

    <!-- New Products -->
    <section class="section" v-if="newProducts.length">
      <div class="container">
        <h2 class="section-title">✨ Sản phẩm mới</h2>
        <div class="grid grid-4">
          <ProductCard 
            v-for="product in newProducts" 
            :key="product.id" 
            :product="product"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { shopApi } from '../api'
import ProductCard from '../components/ProductCard.vue'
import { getImageUrl } from '../utils/image'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

const loading = ref(true)
const categories = ref([])
const featuredProducts = ref([])
const newProducts = ref([])

// Banner Slider Logic
const currentSlide = ref(0)
let slideInterval = null

const bannerImages = computed(() => {
  const banner = settingsStore.shopBanner
  if (!banner) return []
  
  try {
    const parsed = JSON.parse(banner)
    if (Array.isArray(parsed)) {
      return parsed.filter(b => b && b.trim())
    }
  } catch {
    // Not JSON, treat as single URL
  }
  return banner.trim() ? [banner] : []
})

const goToSlide = (index) => {
  currentSlide.value = index
  resetAutoSlide()
}

const nextSlide = () => {
  if (bannerImages.value.length > 1) {
    currentSlide.value = (currentSlide.value + 1) % bannerImages.value.length
  }
}

const stopAutoSlide = () => {
  if (slideInterval) {
    clearInterval(slideInterval)
    slideInterval = null
  }
}

const startAutoSlide = () => {
  stopAutoSlide() // Luôn clear trước khi start mới
  if (bannerImages.value.length > 1) {
    slideInterval = setInterval(nextSlide, 5000)
  }
}

const resetAutoSlide = () => {
  startAutoSlide()
}

// Chỉ reset khi bannerImages thay đổi thực sự
watch(bannerImages, (newVal, oldVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
    currentSlide.value = 0
    resetAutoSlide()
  }
})

onMounted(async () => {
  // Luôn refresh settings để lấy banner mới nhất
  await settingsStore.refreshShopInfo()
  
  try {
    const [catRes, featuredRes, newRes] = await Promise.all([
      shopApi.getCategories(),
      shopApi.getFeaturedProducts(),
      shopApi.getNewProducts(),
    ])
    categories.value = catRes.data
    featuredProducts.value = featuredRes.data
    newProducts.value = newRes.data
  } catch (error) {
    console.error('Failed to load home data:', error)
  } finally {
    loading.value = false
  }
  
  startAutoSlide()
})

onUnmounted(() => {
  stopAutoSlide()
})
</script>

<style scoped>
/* ===== HERO SECTION ===== */
.hero {
  position: relative;
  min-height: 400px;
  text-align: center;
  overflow: hidden;
}

/* Slider Container */
.slider-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slider-track {
  display: flex;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider-slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.slider-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(-45deg, #0f0f1a, #1a1a3e, #2d1b4e, #1a2e4a);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

/* Hero Content Overlay */
.hero-content {
  position: relative;
  z-index: 5;
  padding: 6rem 0;
}

/* Banner Slider Dots */
.slider-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
}

.slider-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.slider-dot:hover {
  border-color: white;
  background: rgba(255, 255, 255, 0.3);
}

.slider-dot.active {
  background: white;
  border-color: white;
  transform: scale(1.2);
}

.hero::before,
.hero::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: float 6s ease-in-out infinite;
}

.hero::before {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
  top: -50px;
  left: -50px;
}

.hero::after {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
  bottom: -100px;
  right: -100px;
  animation-delay: -3s;
}

.hero .container {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, var(--primary-light) 50%, var(--secondary) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  animation: shimmer 3s linear infinite;
  text-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
}

.hero-subtitle {
  font-size: 1.35rem;
  font-weight: 500;
  background: linear-gradient(90deg, 
    #ff6b6b, #ffa94d, #ffd43b, #69db7c, #74c0fc, #b197fc, #f783ac, #ff6b6b);
  background-size: 300% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2.5rem;
  animation: rgb-shift 4s linear infinite;
}

@keyframes rgb-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

.hero .btn-primary {
  padding: 1.25rem 2.5rem;
  font-size: 1.15rem;
  animation: pulse-glow 2s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.hero .btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 2s linear infinite;
}

/* ===== SECTIONS ===== */
.section {
  padding: 5rem 0;
  animation: fadeInUp 0.6s ease-out;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2.5rem;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 2px;
}

/* ===== CATEGORY CARDS ===== */
.category-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: var(--text);
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, transparent 0%, var(--primary) 50%, var(--secondary) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s;
}

.category-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2), var(--glow-primary);
}

.category-card:hover::before {
  opacity: 1;
}

.category-icon {
  margin-bottom: 1.25rem;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  transition: transform 0.3s;
}

.category-card:hover .category-icon {
  animation: bounce-subtle 0.6s ease;
}

.category-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.category-card h3 {
  font-size: 1.35rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.category-card p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero {
    padding: 4rem 0;
  }

  .hero::before,
  .hero::after {
    opacity: 0.3;
    filter: blur(40px);
  }

  .hero::before {
    width: 200px;
    height: 200px;
  }

  .hero::after {
    width: 250px;
    height: 250px;
  }

  .hero-title {
    font-size: 2.5rem;
    word-break: break-word;
  }

  .hero-subtitle {
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }

  .hero .btn-primary {
    padding: 1rem 2rem;
    font-size: 1rem;
  }

  .section {
    padding: 3rem 0;
  }

  .section-title {
    font-size: 1.5rem;
    margin-bottom: 2rem;
  }

  .category-card {
    padding: 1.5rem 1rem;
  }

  .category-card:hover {
    transform: translateY(-4px) scale(1.01);
  }

  .category-icon {
    height: 60px;
    font-size: 2.5rem;
  }

  .category-img {
    width: 60px;
    height: 60px;
  }

  .category-card h3 {
    font-size: 1.1rem;
  }

  .category-card p {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 2rem 0;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .section {
    padding: 1.5rem 0;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .category-card {
    padding: 0.75rem;
  }

  .category-icon {
    height: 40px;
    font-size: 1.5rem;
  }

  .category-img {
    width: 40px;
    height: 40px;
  }

  .category-card h3 {
    font-size: 0.9rem;
  }
}
</style>
