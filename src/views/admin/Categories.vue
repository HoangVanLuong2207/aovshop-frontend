<template>
  <div class="admin-categories">
    <div class="page-header flex-between">
      <h1 class="page-title">📁 Quản lý danh mục</h1>
      <button class="btn btn-primary" @click="openModal()">+ Thêm danh mục</button>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <div v-else>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên danh mục</th>
            <th>Mô tả</th>
            <th>Sản phẩm</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td>{{ cat.id }}</td>
            <td>{{ cat.name }}</td>
            <td class="text-muted">{{ cat.description || '-' }}</td>
            <td>{{ cat.products_count }}</td>
            <td>
              <span :class="['badge', cat.active ? 'badge-success' : 'badge-danger']">
                {{ cat.active ? 'Hoạt động' : 'Ẩn' }}
              </span>
            </td>
            <td>
              <button class="btn btn-secondary btn-sm" @click="openModal(cat)">Sửa</button>
              <button class="btn btn-danger btn-sm" @click="deleteCategory(cat)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing ? 'Sửa danh mục' : 'Thêm danh mục' }}</h3>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Tên danh mục *</label>
              <input v-model="form.name" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Mô tả</label>
              <textarea v-model="form.description" class="form-input" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">URL hình ảnh</label>
              <input v-model="form.image" type="text" class="form-input" placeholder="https://example.com/image.jpg" />
              <small v-if="form.image && !isDirectLink(form.image)" class="text-warning d-block mt-1">
                ⚠️ Có vẻ bạn đang dùng link trang web thay vì link ảnh trực tiếp. Hãy dùng "Direct link" (kết thúc bằng .jpg, .png, ...).
              </small>
              <div v-if="form.image" class="image-preview">
                <img :src="form.image" alt="Preview" @error="handleImageError" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" v-model="form.active" /> Hoạt động
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Hủy</button>
            <button class="btn btn-primary" @click="saveCategory" :disabled="saving">
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
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

const { toast, confirm } = useToast()

const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref(null)
const categories = ref([])


const form = reactive({
  name: '',
  description: '',
  image: '',
  active: true,
})

const loadCategories = async () => {
  loading.value = true
  try {
    const response = await adminApi.getCategories({ per_page: 100 })
    categories.value = response.data.data
  } catch (error) {
    console.error('Failed to load categories:', error)
  } finally {
    loading.value = false
  }
}

const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/200x150?text=Invalid+URL'
}

const isDirectLink = (url) => {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url.split('?')[0])
}

const openModal = (cat = null) => {
  editing.value = cat
  if (cat) {
    form.name = cat.name
    form.description = cat.description || ''
    form.image = cat.image || ''
    form.active = cat.active
  } else {
    form.name = ''
    form.description = ''
    form.image = ''
    form.active = true
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editing.value = null
}

const saveCategory = async () => {
  if (!form.name) return
  
  saving.value = true
  try {
    const data = {
      name: form.name,
      description: form.description,
      image: form.image,
      active: form.active
    }

    if (editing.value) {
      await adminApi.updateCategory(editing.value.id, data)
      const index = categories.value.findIndex(c => c.id === editing.value.id)
      if (index !== -1) {
        categories.value[index].name = form.name
        categories.value[index].description = form.description
        categories.value[index].image = form.image
        categories.value[index].active = form.active
      }
    } else {
      await adminApi.createCategory(data)
      await loadCategories()
    }
    
    closeModal()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lưu thất bại')
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (cat) => {
  const confirmed = await confirm(`Xóa danh mục "${cat.name}"?`, { type: 'danger', title: 'Xóa danh mục' })
  if (!confirmed) return
  
  try {
    await adminApi.deleteCategory(cat.id)
    // Optimized: Update local state
    categories.value = categories.value.filter(c => c.id !== cat.id)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Xóa thất bại')
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.image-preview {
  margin-top: 0.75rem;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
</style>

