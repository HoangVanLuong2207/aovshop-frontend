<template>
  <div class="admin-products">
    <div class="page-header flex-between">
      <h1 class="page-title">📦 Quản lý sản phẩm</h1>
      <button class="btn btn-primary" @click="openModal()">+ Thêm sản phẩm</button>
    </div>

    <div class="filters mb-3">
      <select v-model="filter.category_id" class="form-input" style="width: auto" @change="loadProducts">
        <option value="">Tất cả danh mục</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <input v-model="filter.search" type="text" class="form-input" placeholder="Tìm kiếm..." @input="debouncedSearch" style="width: 200px" />
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên</th>
          <th>Danh mục</th>
          <th>Giá</th>
          <th>Giá KM</th>
          <th>Tồn kho</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.id }}</td>
          <td>{{ product.name }}</td>
          <td>{{ product.category?.name }}</td>
          <td>{{ formatPrice(product.price) }}</td>
          <td>{{ product.sale_price ? formatPrice(product.sale_price) : '-' }}</td>
          <td>{{ product.stock }}</td>
          <td>
            <span :class="['badge', product.active ? 'badge-success' : 'badge-danger']">
              {{ product.active ? 'Đang bán' : 'Ẩn' }}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" @click="openModal(product)">Sửa</button>
            <button class="btn btn-info btn-sm" @click="openAccountModal(product)">Quản lý kho</button>
            <button class="btn btn-danger btn-sm" @click="deleteProduct(product)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Product Modal -->
    <!-- ... as is ... -->

    <!-- Account Management Modal -->
    <Transition name="modal">
      <div v-if="showAccountModal" class="modal-overlay" @click.self="closeAccountModal">
      <div class="modal" style="max-width: 800px">
        <div class="modal-header">
          <h3 class="modal-title">Quản lý kho: {{ selectedProduct?.name }}</h3>
          <button class="modal-close" @click="closeAccountModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="account-actions mb-3">
            <label class="form-label">Thêm tài khoản hàng loạt (mỗi dòng 1 tài khoản, định dạng user|pass)</label>
            <textarea v-model="bulkAccounts" class="form-input" rows="5" placeholder="user1|pass1&#10;user2|pass2"></textarea>
            <button class="btn btn-primary mt-2" @click="addAccounts" :disabled="!bulkAccounts.trim() || addingAccounts">
              {{ addingAccounts ? 'Đang thêm...' : 'Thêm tài khoản' }}
            </button>
            <button class="btn btn-outline-danger mt-2 ml-2" @click="clearAccounts" :disabled="loadingAccounts">
              Xóa tất cả kho chưa bán
            </button>
          </div>

          <div class="account-list">
            <h4>Danh sách tài khoản ({{ accounts.length }})</h4>
            <div v-if="loadingAccounts" class="text-center py-3"><div class="spinner"></div></div>
            <table v-else class="table table-sm">
              <thead>
                <tr>
                  <th>Dữ liệu</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="acc in accounts" :key="acc.id">
                  <td><code>{{ acc.data }}</code></td>
                  <td>
                    <span :class="['badge', acc.status === 'available' ? 'badge-success' : 'badge-secondary']">
                      {{ acc.status === 'available' ? 'Sẵn sàng' : 'Đã bán' }}
                    </span>
                  </td>
                  <td>{{ new Date(acc.createdAt).toLocaleDateString() }}</td>
                  <td>
                    <button class="btn btn-danger btn-sm" @click="deleteAccount(acc)" v-if="acc.status === 'available'">Xóa</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal" style="max-width: 600px">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Danh mục *</label>
            <select v-model="form.category_id" class="form-input" required>
              <option value="">Chọn danh mục</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tên sản phẩm *</label>
            <input v-model="form.name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea v-model="form.description" class="form-input" rows="3"></textarea>
          </div>
          <div class="grid grid-2 gap-2">
            <div class="form-group">
              <label class="form-label">Giá *</label>
              <input v-model.number="form.price" type="number" class="form-input" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Giá khuyến mãi</label>
              <input v-model.number="form.sale_price" type="number" class="form-input" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Tồn kho</label>
            <input 
              v-model.number="form.stock" 
              type="number" 
              class="form-input bg-gray-100 cursor-not-allowed" 
              disabled
            />
            <small class="text-muted d-block mt-1">
              * Số lượng tồn kho sẽ tự động tăng khi bạn thêm tài khoản ở mục "Quản lý kho" sau khi tạo sản phẩm.
            </small>
          </div>
          <div class="form-group">
            <label class="form-label">URL hình ảnh sản phẩm</label>
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
              <input type="checkbox" v-model="form.active" /> Đang bán
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Hủy</button>
          <button class="btn btn-primary" @click="saveProduct" :disabled="saving">
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

const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref(null)
const products = ref([])
const categories = ref([])


const filter = reactive({ category_id: '', search: '' })

const form = reactive({
  category_id: '',
  name: '',
  description: '',
  price: 0,
  sale_price: null,
  stock: 0,
  image: '',
  active: true,
})

// Account management state
const showAccountModal = ref(false)
const selectedProduct = ref(null)
const accounts = ref([])
const loadingAccounts = ref(false)
const addingAccounts = ref(false)
const bulkAccounts = ref('')

const openAccountModal = async (product) => {
  selectedProduct.value = product
  showAccountModal.value = true
  bulkAccounts.value = ''
  loadAccounts()
}

const closeAccountModal = () => {
  showAccountModal.value = false
  selectedProduct.value = null
  accounts.value = []
}

const loadAccounts = async () => {
  if (!selectedProduct.value) return
  loadingAccounts.value = true
  try {
    const response = await adminApi.getAccounts(selectedProduct.value.id)
    accounts.value = response.data.data
  } catch (error) {
    console.error('Failed to load accounts:', error)
  } finally {
    loadingAccounts.value = false
  }
}

const addAccounts = async () => {
  if (!selectedProduct.value || !bulkAccounts.value.trim()) return
  
  addingAccounts.value = true
  try {
    const response = await adminApi.addAccounts(selectedProduct.value.id, { accounts: bulkAccounts.value })
    bulkAccounts.value = ''
    
    // Optimized: Update local state
    accounts.value = response.data.accounts
    const product = products.value.find(p => p.id === selectedProduct.value.id)
    if (product) product.stock = response.data.stock
    
  } catch (error) {
    alert(error.response?.data?.message || 'Thêm tài accounts thất bại')
  } finally {
    addingAccounts.value = false
  }
}

const deleteAccount = async (account) => {
  if (!confirm('Xóa tài khoản này?')) return
  try {
    const response = await adminApi.deleteAccount(selectedProduct.value.id, account.id)
    
    // Optimized: Update local state
    accounts.value = accounts.value.filter(a => a.id !== account.id)
    const product = products.value.find(p => p.id === selectedProduct.value.id)
    if (product) product.stock = response.data.stock
    
  } catch (error) {
    alert(error.response?.data?.message || 'Xóa thất bại')
  }
}

const clearAccounts = async () => {
  if (!confirm('Xóa tất cả tài khoản chưa bán của sản phẩm này?')) return
  try {
    const response = await adminApi.clearAccounts(selectedProduct.value.id)
    
    // Optimized: Update local state
    accounts.value = accounts.value.filter(a => a.status === 'sold')
    const product = products.value.find(p => p.id === selectedProduct.value.id)
    if (product) product.stock = response.data.stock
    
  } catch (error) {
    alert(error.response?.data?.message || 'Xóa thất bại')
  }
}


const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'

let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadProducts, 300)
}

const loadProducts = async () => {
  loading.value = true
  try {
    const params = { per_page: 50 }
    if (filter.category_id) params.category_id = filter.category_id
    if (filter.search) params.search = filter.search
    const response = await adminApi.getProducts(params)
    products.value = response.data.data
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await adminApi.getAllCategories()
    categories.value = response.data
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/200x150?text=Invalid+URL'
}

const isDirectLink = (url) => {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url.split('?')[0])
}

const openModal = (product = null) => {
  editing.value = product
  if (product) {
    Object.assign(form, {
      category_id: product.categoryId || product.category_id || '',
      name: product.name,
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price,
      stock: product.stock,
      image: product.image || '',
      active: product.active,
    })
  } else {
    Object.assign(form, {
      category_id: '',
      name: '',
      description: '',
      price: 0,
      sale_price: null,
      stock: 0,
      image: '',
      active: true,
    })
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editing.value = null
}

const saveProduct = async () => {
  console.log('Attempting to save product:', form)
  if (!form.name || !form.category_id) {
    console.warn('Save blocked: Missing name or category_id')
    return
  }
  
  saving.value = true
  try {
    const data = {
      category_id: form.category_id,
      name: form.name,
      description: form.description,
      price: form.price,
      sale_price: form.sale_price,
      stock: form.stock,
      image: form.image,
      active: form.active
    }

    if (editing.value) {
      await adminApi.updateProduct(editing.value.id, data)
      const index = products.value.findIndex(p => p.id === editing.value.id)
      if (index !== -1) {
        Object.assign(products.value[index], form)
      }
    } else {
      await adminApi.createProduct(data)
      await loadProducts()
    }
    closeModal()
  } catch (error) {
    alert(error.response?.data?.message || 'Lưu thất bại')
  } finally {
    saving.value = false
  }
}

const deleteProduct = async (product) => {
  if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return
  
  try {
    await adminApi.deleteProduct(product.id)
    // Optimized: Update local state
    products.value = products.value.filter(p => p.id !== product.id)
  } catch (error) {
    alert(error.response?.data?.message || 'Xóa thất bại')
  }
}

onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
}

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
