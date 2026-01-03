<template>
  <div class="categories-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Danh mục sản phẩm</h1>
        <p class="page-subtitle">Khám phá các danh mục sản phẩm của chúng tôi</p>
      </div>

      <div v-if="loading" class="loading"><div class="spinner"></div></div>
      
      <div v-else-if="categories.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h3 class="empty-title">Chưa có danh mục nào</h3>
        <p class="empty-text">Các danh mục sẽ được hiển thị ở đây</p>
      </div>

      <div v-else class="categories-grid">
        <router-link 
          v-for="cat in categories" 
          :key="cat.id" 
          :to="`/products?category=${cat.id}`"
          class="category-card"
        >
          <div class="category-image-wrapper">
            <img 
              v-if="cat.image" 
              :src="cat.image" 
              :alt="cat.name" 
              class="category-image"
            />
            <div v-else class="category-image-placeholder">📁</div>
          </div>
          <div class="category-info">
            <h3 class="category-name">{{ cat.name }}</h3>
            <p class="category-count">{{ cat.products_count || 0 }} sản phẩm</p>
          </div>
          <div class="category-arrow">→</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { shopApi } from '../api'

const loading = ref(true)
const categories = ref([])

const loadCategories = async () => {
  loading.value = true
  try {
    const response = await shopApi.getCategories()
    categories.value = response.data
  } catch (error) {
    console.error('Failed to load categories:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.categories-page {
  padding: 2rem 0;
  min-height: 60vh;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.category-image-wrapper {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-tertiary);
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: var(--text-muted);
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text);
}

.category-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.category-arrow {
  font-size: 1.25rem;
  color: var(--text-muted);
  transition: all 0.2s;
}

.category-card:hover .category-arrow {
  color: var(--primary);
  transform: translateX(4px);
}

@media (max-width: 480px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .category-card {
    padding: 1rem;
  }
  
  .category-image-wrapper {
    width: 52px;
    height: 52px;
  }
}
</style>
