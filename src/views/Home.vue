<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">AOV Shop</h1>
        <p class="hero-subtitle">Mua bán tài khoản, tướng, skin và vật phẩm game</p>
        <router-link to="/products" class="btn btn-primary btn-lg">
          Khám phá ngay →
        </router-link>
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
import { ref, onMounted } from 'vue'
import { shopApi } from '../api'
import ProductCard from '../components/ProductCard.vue'
import { getImageUrl } from '../utils/image'

const loading = ref(true)
const categories = ref([])
const featuredProducts = ref([])
const newProducts = ref([])

onMounted(async () => {
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
})
</script>

<style scoped>
/* ===== HERO SECTION ===== */
.hero {
  position: relative;
  padding: 6rem 0;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(-45deg, #0f0f1a, #1a1a3e, #2d1b4e, #1a2e4a);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
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
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  opacity: 0.9;
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
}

.category-card p {
  color: var(--text-muted);
  font-size: 0.95rem;
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
