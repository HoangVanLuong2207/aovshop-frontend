<template>
  <div class="admin-promotions">
    <div class="page-header flex-between">
      <h1 class="page-title">🎁 Quản lý khuyến mãi</h1>
      <button class="btn btn-primary" @click="openModal()">+ Thêm khuyến mãi</button>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Mã</th>
          <th>Tên</th>
          <th>Loại</th>
          <th>Giá trị</th>
          <th>Đơn tối thiểu</th>
          <th>Thời gian</th>
          <th>Đã dùng</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="promo in promotions" :key="promo.id">
          <td><code>{{ promo.code }}</code></td>
          <td>{{ promo.name }}</td>
          <td>{{ promo.type === 'percent' ? 'Phần trăm' : 'Cố định' }}</td>
          <td>{{ promo.type === 'percent' ? promo.value + '%' : formatPrice(promo.value) }}</td>
          <td>{{ formatPrice(promo.min_order) }}</td>
          <td>
            {{ formatDate(promo.start_date) }}<br>
            <small class="text-muted">→ {{ formatDate(promo.end_date) }}</small>
          </td>
          <td>{{ promo.used_count }}/{{ promo.usage_limit || '∞' }}</td>
          <td>
            <button 
              :class="['badge', promo.active ? 'badge-success' : 'badge-danger']"
              style="cursor: pointer"
              @click="toggleActive(promo)"
            >
              {{ promo.active ? 'Đang chạy' : 'Tắt' }}
            </button>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" @click="openModal(promo)">Sửa</button>
            <button class="btn btn-danger btn-sm" @click="deletePromotion(promo)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal" style="max-width: 550px">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi' }}</h3>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="grid grid-2 gap-2">
              <div class="form-group">
                <label class="form-label">Mã khuyến mãi *</label>
                <input v-model="form.code" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Tên *</label>
                <input v-model="form.name" type="text" class="form-input" required />
              </div>
            </div>
            <div class="grid grid-2 gap-2">
              <div class="form-group">
                <label class="form-label">Loại giảm giá</label>
                <select v-model="form.type" class="form-input">
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Giá trị *</label>
                <input v-model.number="form.value" type="number" class="form-input" min="0" required />
              </div>
            </div>
            <div class="grid grid-2 gap-2">
              <div class="form-group">
                <label class="form-label">Đơn tối thiểu</label>
                <input v-model.number="form.min_order" type="number" class="form-input" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Giảm tối đa</label>
                <input v-model.number="form.max_discount" type="number" class="form-input" min="0" />
              </div>
            </div>
            <div class="grid grid-2 gap-2">
              <div class="form-group">
                <label class="form-label">Ngày bắt đầu *</label>
                <input 
                  v-model="form.start_date" 
                  type="datetime-local" 
                  class="form-input" 
                  required 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Ngày kết thúc *</label>
                <input 
                  v-model="form.end_date" 
                  type="datetime-local" 
                  class="form-input" 
                  required 
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Giới hạn lượt dùng</label>
              <input v-model.number="form.usage_limit" type="number" class="form-input" min="1" placeholder="Để trống = không giới hạn" />
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" v-model="form.active" /> Kích hoạt
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Hủy</button>
            <button class="btn btn-primary" @click="savePromotion" :disabled="saving">
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
const promotions = ref([])

const form = reactive({
  code: '',
  name: '',
  type: 'percent',
  value: 0,
  min_order: 0,
  max_discount: null,
  usage_limit: null,
  start_date: '',
  end_date: '',
  active: true,
})

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'
const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN')

const loadPromotions = async () => {
  loading.value = true
  try {
    const response = await adminApi.getPromotions({ per_page: 50 })
    promotions.value = response.data.data
  } catch (error) {
    console.error('Failed to load promotions:', error)
  } finally {
    loading.value = false
  }
}

const openModal = (promo = null) => {
  editing.value = promo
  if (promo) {
    Object.assign(form, {
      code: promo.code,
      name: promo.name,
      type: promo.type,
      value: promo.value,
      min_order: promo.min_order || 0,
      max_discount: promo.max_discount,
      usage_limit: promo.usage_limit,
      start_date: promo.start_date?.slice(0, 16),
      end_date: promo.end_date?.slice(0, 16),
      active: promo.active,
    })
  } else {
    const now = new Date()
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    Object.assign(form, {
      code: '',
      name: '',
      type: 'percent',
      value: 10,
      min_order: 0,
      max_discount: null,
      usage_limit: null,
      start_date: now.toISOString().slice(0, 16),
      end_date: nextMonth.toISOString().slice(0, 16),
      active: true,
    })
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editing.value = null
}

const savePromotion = async () => {
  if (!form.code || !form.name) return
  
  saving.value = true
  try {
    const data = { ...form }
    
    if (editing.value) {
      await adminApi.updatePromotion(editing.value.id, data)
      // Update local state
      const index = promotions.value.findIndex(p => p.id === editing.value.id)
      if (index !== -1) {
        Object.assign(promotions.value[index], data)
      }
    } else {
      await adminApi.createPromotion(data)
      await loadPromotions()
    }
    
    closeModal()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Lưu thất bại')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (promo) => {
  try {
    await adminApi.togglePromotion(promo.id)
    promo.active = !promo.active
  } catch (error) {
    toast.error('Cập nhật thất bại')
  }
}

const deletePromotion = async (promo) => {
  const confirmed = await confirm(`Xóa khuyến mãi "${promo.name}"?`, { type: 'danger', title: 'Xóa khuyến mãi' })
  if (!confirmed) return
  
  try {
    await adminApi.deletePromotion(promo.id)
    // Optimized: Update local state
    promotions.value = promotions.value.filter(p => p.id !== promo.id)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Xóa thất bại')
  }
}

onMounted(loadPromotions)
</script>

<style scoped>
code {
  background: var(--bg-tertiary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
}
</style>
