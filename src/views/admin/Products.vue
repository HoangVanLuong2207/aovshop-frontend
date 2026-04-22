<template>
  <div class="admin-products">
    <div class="page-header flex-between">
      <h1 class="page-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
        Quản lý sản phẩm
      </h1>
      <button class="btn btn-primary" @click="openModal()">+ Thêm sản phẩm</button>
    </div>

    <div class="filters mb-3">
      <select v-model="filter.category_id" class="form-input" style="width: auto">
        <option value="">Tất cả danh mục</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <input v-model="filter.search" type="text" class="form-input" placeholder="Tìm sản phẩm..." style="width: 200px" />
      <div class="account-search-wrapper">
        <input 
          v-model="accountSearch" 
          type="text" 
          class="form-input" 
          placeholder="Tìm tài khoản..." 
          @keyup.enter="searchAccount"
          style="width: 250px" 
        />
        <button class="btn btn-secondary btn-sm" @click="searchAccount" :disabled="searchingAccount || !accountSearch.trim()">
          {{ searchingAccount ? '...' : 'Tìm' }}
        </button>
      </div>
    </div>

    <!-- Kết quả tìm kiếm tài khoản -->
    <div v-if="accountSearchResult" class="account-search-result mb-3">
      <div class="alert" :class="accountSearchResult.found ? 'alert-success' : 'alert-warning'">
        <strong v-if="accountSearchResult.found">
          Tài khoản "{{ accountSearchResult.query }}" thuộc sản phẩm: 
          <router-link :to="`/admin/products`" @click="highlightProduct(accountSearchResult.product.id)">
            {{ accountSearchResult.product.name }}
          </router-link>
          <span v-if="accountSearchResult.product.category">
            (Danh mục: <span style="color: var(--primary); font-weight: 600;">{{ accountSearchResult.product.category.name }}</span>)
          </span>
          ({{ accountSearchResult.status === 'available' ? 'Chưa bán' : 'Đã bán' }})
        </strong>
        <span v-else>❌ Không tìm thấy tài khoản "{{ accountSearchResult.query }}"</span>
        <button class="btn-close" @click="accountSearchResult = null">✕</button>
      </div>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên</th>
          <th>Loại</th>
          <th>Danh mục</th>
          <th>Giá</th>
          <th>Giá KM</th>
          <th>Tồn kho</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in activeProducts" :key="product.id" :data-product-id="product.id">
          <td>{{ product.id }}</td>
          <td>{{ product.name }}</td>
          <td>
            <span v-if="product.isPreorder" class="badge badge-preorder-sm">📦 Pre-order</span>
            <span v-else class="badge badge-instant-sm">⚡ Thường</span>
          </td>
          <td>{{ product.category?.name }}</td>
          <td>{{ formatPrice(product.price) }}</td>
          <td>{{ (product.sale_price !== undefined && product.sale_price !== null) ? formatPrice(product.sale_price) : (product.salePrice ? formatPrice(product.salePrice) : '-') }}</td>
          <td>{{ product.stock }}</td>
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
            <button class="btn btn-outline-info mt-2 ml-2" @click="exportAccounts" :disabled="loadingAccounts">
              Xuất file .txt (tất cả kho)
            </button>
            <button class="btn btn-outline-success mt-2 ml-2" @click="exportSelectedExcel" :disabled="selectedAccountIds.length === 0">
              Xuất Excel (đã chọn: {{ selectedAccountIds.length }})
            </button>
            <button class="btn btn-danger mt-2 ml-2" @click="deleteSelectedAccounts" :disabled="selectedAccountIds.length === 0">
              Xóa mục đã chọn
            </button>
          </div>

          <div class="account-list">
            <div class="flex-between mb-2">
              <h4>Danh sách tài khoản ({{ accountPagination.total }})</h4>
              <div class="flex-center gap-2">
                <select v-model="accountPagination.limit" class="form-input form-input-sm" style="width: 110px" @change="loadAccounts(1)">
                  <option :value="20">20 / dòng</option>
                  <option :value="50">50 / dòng</option>
                  <option :value="100">100 / dòng</option>
                </select>
                <div class="search-box">
                  <input 
                    v-model="accountListSearch" 
                    type="text" 
                    class="form-input form-input-sm" 
                    placeholder="Lọc trang này..." 
                    style="width: 150px"
                  />
                </div>
              </div>
            </div>
            <div v-if="loadingAccounts" class="text-center py-3"><div class="spinner"></div></div>
            <div v-else-if="filteredAccounts.length === 0" class="text-center py-4 text-muted">
              Không tìm thấy tài khoản nào khớp với từ khóa.
            </div>
            <table v-else class="table table-sm">
              <thead>
                <tr>
                  <th style="width: 40px">
                    <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
                  </th>
                  <th>Dữ liệu</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="acc in filteredAccounts" :key="acc.id">
                  <td>
                    <input type="checkbox" v-model="selectedAccountIds" :value="acc.id" />
                  </td>
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

            <!-- Account Pagination -->
            <div v-if="accountPagination.totalPages > 1" class="flex-center gap-3 mt-3">
              <button 
                class="btn btn-secondary btn-sm" 
                :disabled="accountPagination.page === 1" 
                @click="loadAccounts(accountPagination.page - 1)"
              >
                &laquo; Trước
              </button>
              <span class="text-muted small">Trang {{ accountPagination.page }} / {{ accountPagination.totalPages }}</span>
              <button 
                class="btn btn-secondary btn-sm" 
                :disabled="accountPagination.page === accountPagination.totalPages" 
                @click="loadAccounts(accountPagination.page + 1)"
              >
                Sau &raquo;
              </button>
            </div>
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
            <label class="form-label">URL hình ảnh sản phẩm (ảnh chính)</label>
            <input v-model="form.image" type="text" class="form-input" placeholder="https://example.com/image.jpg" />
            <small v-if="form.image && !isDirectLink(form.image)" class="text-warning d-block mt-1">
              ⚠️ Có vẻ bạn đang dùng link trang web thay vì link ảnh trực tiếp. Hãy dùng "Direct link" (kết thúc bằng .jpg, .png, ...).
            </small>
            <div v-if="form.image" class="image-preview">
              <img :src="form.image" alt="Preview" @error="handleImageError" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ảnh mô tả sản phẩm (gallery)</label>
            <div class="gallery-input-row">
              <input 
                v-model="newImageUrl" 
                type="text" 
                class="form-input" 
                placeholder="Dán URL ảnh rồi nhấn Thêm..." 
                @keyup.enter="addGalleryImage"
              />
              <button type="button" class="btn btn-secondary btn-sm" @click="addGalleryImage" :disabled="!newImageUrl.trim()">
                + Thêm
              </button>
            </div>
            <div v-if="form.images.length > 0" class="gallery-list">
              <div v-for="(img, index) in form.images" :key="index" class="gallery-item">
                <img :src="img" alt="Gallery" class="gallery-thumb" @error="handleImageError" />
                <div class="gallery-item-actions">
                  <button type="button" class="btn-icon" @click="moveGalleryImage(index, -1)" :disabled="index === 0" title="Di chuyển lên">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </button>
                  <button type="button" class="btn-icon" @click="moveGalleryImage(index, 1)" :disabled="index === form.images.length - 1" title="Di chuyển xuống">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <button type="button" class="btn-icon btn-icon-danger" @click="removeGalleryImage(index)" title="Xóa">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            </div>
            <small class="text-muted d-block mt-1">Thêm nhiều ảnh để mô tả chi tiết sản phẩm. Ảnh sẽ hiển thị ở trang chi tiết.</small>
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="form.active" /> Đang bán
            </label>
          </div>
          <div class="form-group">
            <label class="form-label preorder-toggle">
              <input type="checkbox" v-model="form.is_preorder" />
              <span>
                📦 Sản phẩm Pre-order (hàng đặt trước, chưa có sẵn)
              </span>
            </label>
            <small class="text-muted d-block mt-1">
              Kích hoạt nếu hàng chưa về. User sẽ đặt điền thông tin đặt và chờ admin giao thủ công khi hàng về.
            </small>
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { adminApi } from '../../api'
import { useToast } from '../../composables/useToast'
import { isDirectLink, convertDriveLink } from '../../utils/image'

const { toast, confirm } = useToast()

const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref(null)
const products = ref([])
const categories = ref([])

// Filter sản phẩm theo: active, category, search (tên hoặc tài khoản)
const activeProducts = computed(() => {
  let result = products.value.filter(p => p.active !== false)
  
  // Filter theo danh mục
  if (filter.category_id) {
    result = result.filter(p => p.categoryId == filter.category_id || p.category_id == filter.category_id)
  }
  
  // Filter theo tên sản phẩm
  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(searchLower))
  }
  
  return result
})

// Tìm kiếm tài khoản
const accountSearch = ref('')
const accountSearchResult = ref(null)
const searchingAccount = ref(false)


const filter = reactive({ category_id: '', search: '' })

const form = reactive({
  category_id: '',
  name: '',
  description: '',
  price: 0,
  sale_price: null,
  stock: 0,
  image: '',
  images: [],
  active: true,
  is_preorder: false,
})

// Gallery image management
const newImageUrl = ref('')

const addGalleryImage = () => {
  const url = convertDriveLink(newImageUrl.value.trim())
  if (!url) return
  form.images.push(url)
  newImageUrl.value = ''
}

// Tự động chuyển đổi link Google Drive
watch(() => form.image, (newVal) => {
  if (newVal) {
    const converted = convertDriveLink(newVal)
    if (converted !== newVal) {
      form.image = converted
    }
  }
})

watch(newImageUrl, (newVal) => {
  if (newVal) {
    const converted = convertDriveLink(newVal)
    if (converted !== newVal) {
      newImageUrl.value = converted
    }
  }
})

const removeGalleryImage = (index) => {
  form.images.splice(index, 1)
}

const moveGalleryImage = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.images.length) return
  const temp = form.images[index]
  form.images[index] = form.images[newIndex]
  form.images[newIndex] = temp
}

// Account management state
const showAccountModal = ref(false)
const selectedProduct = ref(null)
const accounts = ref([])
const loadingAccounts = ref(false)
const addingAccounts = ref(false)
const bulkAccounts = ref('')
const accountListSearch = ref('')
const selectedAccountIds = ref([])

const isAllSelected = computed(() => {
  if (filteredAccounts.value.length === 0) return false
  return filteredAccounts.value.every(acc => selectedAccountIds.value.includes(acc.id))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Deselect all in current view
    const currentIds = filteredAccounts.value.map(acc => acc.id)
    selectedAccountIds.value = selectedAccountIds.value.filter(id => !currentIds.includes(id))
  } else {
    // Select all in current view
    filteredAccounts.value.forEach(acc => {
      if (!selectedAccountIds.value.includes(acc.id)) {
        selectedAccountIds.value.push(acc.id)
      }
    })
  }
}

const accountPagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const filteredAccounts = computed(() => {
  if (!accountListSearch.value.trim()) return accounts.value
  const searchLower = accountListSearch.value.toLowerCase()
  return accounts.value.filter(acc => acc.data.toLowerCase().includes(searchLower))
})

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
  accountListSearch.value = ''
  selectedAccountIds.value = []
}

const loadAccounts = async (page = 1) => {
  if (!selectedProduct.value) return
  loadingAccounts.value = true
  accountPagination.page = page
  try {
    const response = await adminApi.getAccounts(selectedProduct.value.id, {
      page: accountPagination.page,
      limit: accountPagination.limit
    })
    accounts.value = response.data.data
    accountPagination.total = response.data.pagination.total
    accountPagination.totalPages = response.data.pagination.totalPages
  } catch (error) {
    console.error('Failed to load accounts:', error)
  } finally {
    loadingAccounts.value = false
  }
}

const exportAccounts = async () => {
  if (!selectedProduct.value) return
  try {
    const response = await adminApi.exportUnsoldAccounts(selectedProduct.value.id)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `unsold_accounts_${selectedProduct.value.id}.txt`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Xuất file thành công!')
  } catch (error) {
    toast.error('Xuất file thất bại')
  }
}

const addAccounts = async () => {
  if (!selectedProduct.value || !bulkAccounts.value.trim()) return
  
  addingAccounts.value = true
  try {
    const response = await adminApi.addAccounts(selectedProduct.value.id, { accounts: bulkAccounts.value })
    bulkAccounts.value = ''
    
    // Refresh to page 1 to see new accounts
    await loadAccounts(1)
    
    const product = products.value.find(p => p.id === selectedProduct.value.id)
    if (product) product.stock = response.data.stock
    toast.success(`Thêm ${response.data.added || 'các'} tài khoản thành công!`)
    
  } catch (error) {
    toast.error(error.response?.data?.message || 'Thêm tài accounts thất bại')
  } finally {
    addingAccounts.value = false
  }
}

const deleteAccount = async (account) => {
  const confirmed = await confirm('Xóa tài khoản này?', { type: 'danger' })
  if (!confirmed) return
  try {
    const response = await adminApi.deleteAccount(selectedProduct.value.id, account.id)
    
    // Refresh current page to keep pagination consistent
    await loadAccounts(accountPagination.page)
    
    const product = products.value.find(p => p.id === selectedProduct.value.id)
    if (product) product.stock = response.data.stock
    
  } catch (error) {
    toast.error(error.response?.data?.message || 'Xóa thất bại')
  }
}

const clearAccounts = async () => {
  const confirmed = await confirm('Xóa tất cả tài khoản chưa bán của sản phẩm này?', { type: 'danger', title: 'Xóa kho' })
  if (!confirmed) return
  try {
    const response = await adminApi.clearAccounts(selectedProduct.value.id)
    
    // Refresh to page 1
    await loadAccounts(1)
    selectedAccountIds.value = []
    
    const product = products.value.find(p => p.id === selectedProduct.value.id)
    if (product) product.stock = response.data.stock
    
  } catch (error) {
    toast.error(error.response?.data?.message || 'Xóa thất bại')
  }
}

const deleteSelectedAccounts = async () => {
  if (selectedAccountIds.value.length === 0) return
  const count = selectedAccountIds.value.length
  const confirmed = await confirm(`Bạn có chắc chắn muốn xóa ${count} tài khoản đã chọn?`, { type: 'danger' })
  if (!confirmed) return
  
  try {
    const response = await adminApi.deleteAccountsBulk(selectedProduct.value.id, selectedAccountIds.value)
    selectedAccountIds.value = []
    
    // Refresh current page
    await loadAccounts(accountPagination.page)
    
    const product = products.value.find(p => p.id === selectedProduct.value.id)
    if (product) product.stock = response.data.stock
    toast.success(`Đã xóa ${count} tài khoản thành công!`)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Xóa hàng loạt thất bại')
  }
}

const exportSelectedExcel = () => {
  if (selectedAccountIds.value.length === 0) return
  
  const selectedData = accounts.value.filter(acc => selectedAccountIds.value.includes(acc.id))
  if (selectedData.length === 0) {
     toast.error('Không tìm thấy dữ liệu đã chọn trong trang này.')
     return
  }

  // Generate CSV with BOM for Vietnamese support in Excel
  const headers = ['ID', 'Dữ liệu', 'Trạng thái', 'Ngày tạo']
  const rows = selectedData.map(acc => [
    acc.id,
    acc.data,
    acc.status === 'available' ? 'Sẵn sàng' : 'Đã bán',
    new Date(acc.createdAt || acc.created_at).toLocaleString()
  ])

  let csvContent = "\uFEFF" // UTF-8 BOM
  csvContent += headers.join(',') + '\n'
  rows.forEach(row => {
    // Double quote and escape columns to handle potential commas in account data
    const formattedRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
    csvContent += formattedRow.join(',') + '\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `export_accounts_${selectedProduct.value.id}_${new Date().getTime()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.success(`Đã xuất Excel cho ${selectedData.length} tài khoản thành công!`)
}

// Tìm kiếm tài khoản
const searchAccount = async () => {
  if (!accountSearch.value.trim()) return
  
  searchingAccount.value = true
  accountSearchResult.value = null
  
  try {
    const response = await adminApi.searchAccount(accountSearch.value.trim())
    accountSearchResult.value = {
      query: accountSearch.value.trim(),
      found: response.data.found,
      product: response.data.product,
      status: response.data.status
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lỗi tìm kiếm')
  } finally {
    searchingAccount.value = false
  }
}

const highlightProduct = (productId) => {
  // Clear search result and scroll to product
  accountSearchResult.value = null
  filter.category_id = ''
  filter.search = ''
  
  setTimeout(() => {
    const row = document.querySelector(`tr[data-product-id="${productId}"]`)
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      row.classList.add('highlight')
      setTimeout(() => row.classList.remove('highlight'), 2000)
    }
  }, 100)
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


const openModal = (product = null) => {
  editing.value = product
  if (product) {
    Object.assign(form, {
      category_id: product.categoryId || product.category_id || '',
      name: product.name,
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price || product.salePrice,
      stock: product.stock,
      image: product.image || '',
      images: (product.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.url),
      active: product.active,
      is_preorder: product.isPreorder || false,
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
      images: [],
      active: true,
      is_preorder: false,
    })
  }
  newImageUrl.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editing.value = null
}

const saveProduct = async () => {
  if (!form.name) {
    toast.error('Vui lòng nhập tên sản phẩm')
    return
  }
  if (!form.category_id) {
    toast.error('Vui lòng chọn danh mục')
    return
  }
  if (!form.price || form.price <= 0) {
    toast.error('Vui lòng nhập giá hợp lệ')
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
      images: form.images,
      active: form.active,
      is_preorder: form.is_preorder,
    }

    if (editing.value) {
      const response = await adminApi.updateProduct(editing.value.id, data)
      const index = products.value.findIndex(p => p.id === editing.value.id)
      if (index !== -1) {
        // Sử dụng dữ liệu từ server trả về để đảm bảo cấu trúc (ví dụ: gallery images là objects)
        Object.assign(products.value[index], response.data)
      }
      toast.success('Cập nhật sản phẩm thành công!')
    } else {
      await adminApi.createProduct(data)
      await loadProducts()
      toast.success('Thêm sản phẩm thành công!')
    }
    closeModal()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lưu thất bại')
  } finally {
    saving.value = false
  }
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  toast.success('Đã sao chép vào bộ nhớ tạm!')
}

const getApiUrl = (id) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/api/admin/products/${id}/accounts`
}

const getApiJson = () => {
  return JSON.stringify({
    accounts: "user1|pass1|mail1\nuser2|pass2|mail2"
  }, null, 2)
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

.badge-preorder-sm {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  padding: 0.12rem 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-instant-sm {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 4px;
  padding: 0.12rem 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.preorder-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.preorder-toggle input[type="checkbox"] {
  margin-top: 2px;
  flex-shrink: 0;
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

/* Gallery styles */
.gallery-input-row {
  display: flex;
  gap: 0.5rem;
}

.gallery-input-row .form-input {
  flex: 1;
}

.gallery-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.gallery-item {
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
  background: var(--bg-secondary);
}

.gallery-thumb {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  display: block;
}

.gallery-item-actions {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.btn-icon {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--primary);
  color: white;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-icon-danger:hover {
  background: var(--danger);
  color: white;
}

/* Mobile responsive table */
@media (max-width: 768px) {
  .table th:nth-child(1),
  .table td:nth-child(1),
  .table th:nth-child(3),
  .table td:nth-child(3),
  .table th:nth-child(5),
  .table td:nth-child(5),
  .table th:nth-child(7),
  .table td:nth-child(7) {
    display: none;
  }
  
  .table th, .table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.85rem;
  }
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .filters {
    flex-wrap: wrap;
  }
  
  .filters .form-input {
    width: 100% !important;
  }
  
  .account-search-wrapper {
    width: 100%;
    margin-top: 0.5rem;
  }
}

/* Account search styles */
.filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.account-search-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.account-search-result .alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: var(--radius);
}

.alert-success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid var(--success);
  color: var(--success);
}

.alert-warning {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid var(--warning);
  color: var(--warning);
}

.alert a {
  color: var(--primary);
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
}

.btn-close:hover {
  opacity: 1;
}

/* API Export Styles */
.api-export-section {
  border-top: 1px solid var(--border);
}

.code-block-wrapper {
  position: relative;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px;
  padding-right: 60px;
}

.code-content {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  color: var(--primary);
  word-break: break-all;
}

.copy-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 4px 8px;
  font-size: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
}

.copy-btn:hover {
  background: var(--primary);
  color: white;
}

.flex-items-center {
  display: flex;
  align-items: center;
}

.mt-4 { margin-top: 1.5rem; }
.pt-3 { padding-top: 1rem; }
.mb-3 { margin-bottom: 1rem; }
.border-top { border-top: 1px solid var(--border); }

/* Highlight animation */
tr.highlight {
  animation: highlight-pulse 0.5s ease-in-out 3;
}

@keyframes highlight-pulse {
  0%, 100% { background: transparent; }
  50% { background: rgba(99, 102, 241, 0.3); }
}
</style>
