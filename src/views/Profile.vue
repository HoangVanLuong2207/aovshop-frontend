<template>
  <div class="profile-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">👤 Tài khoản</h1>
      </div>

      <div class="profile-content">
        <div class="card">
          <div class="card-header">Thông tin cá nhân</div>
          <div class="card-body">
            <form @submit.prevent="updateProfile">
              <div class="form-group">
                <label class="form-label">Họ tên</label>
                <input v-model="profile.name" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input v-model="profile.email" type="email" class="form-input" required />
              </div>
              <button type="submit" class="btn btn-primary" :disabled="updating">
                {{ updating ? 'Đang lưu...' : 'Cập nhật' }}
              </button>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-header">Đổi mật khẩu</div>
          <div class="card-body">
            <form @submit.prevent="changePassword">
              <div class="form-group">
                <label class="form-label">Mật khẩu hiện tại</label>
                <input v-model="password.current_password" type="password" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Mật khẩu mới</label>
                <input v-model="password.password" type="password" class="form-input" required minlength="6" />
              </div>
              <div class="form-group">
                <label class="form-label">Xác nhận mật khẩu</label>
                <input v-model="password.password_confirmation" type="password" class="form-input" required />
              </div>
              <button type="submit" class="btn btn-primary" :disabled="changingPassword">
                {{ changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../api'
import { useToast } from '../composables/useToast'

const { toast } = useToast()

const authStore = useAuthStore()

const profile = reactive({
  name: '',
  email: '',
})

const password = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const updating = ref(false)
const changingPassword = ref(false)

onMounted(() => {
  if (authStore.user) {
    profile.name = authStore.user.name
    profile.email = authStore.user.email
  }
})

const updateProfile = async () => {
  updating.value = true
  try {
    const response = await authApi.updateProfile(profile)
    authStore.user = response.data.user
    localStorage.setItem('user', JSON.stringify(response.data.user))
    toast.success('Cập nhật thành công!')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Cập nhật thất bại')
  } finally {
    updating.value = false
  }
}

const changePassword = async () => {
  if (password.password !== password.password_confirmation) {
    toast.error('Mật khẩu xác nhận không khớp')
    return
  }

  changingPassword.value = true
  try {
    await authApi.changePassword(password)
    password.current_password = ''
    password.password = ''
    password.password_confirmation = ''
    toast.success('Đổi mật khẩu thành công!')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại')
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped>
.profile-page {
  padding: 2rem 0;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 500px;
}
</style>
