<template>
  <div id="app">
    <!-- Announcement Popup Modal -->
    <div v-if="showNotification && notification.enabled" class="popup-overlay" @click.self="closeNotification">
      <div class="popup-modal">
        <div class="popup-header">
          <span class="popup-icon">📢</span>
          <h3 class="popup-title">Thông báo</h3>
          <button class="popup-close" @click="closeNotification">✕</button>
        </div>
        <div class="popup-content" v-html="notification.text">
        </div>
        <div class="popup-footer">
          <button class="btn btn-secondary" @click="closeNotification">Đã hiểu</button>
          <button class="btn btn-primary" @click="dismissFor3Hours">Đóng trong 3 giờ</button>
        </div>
      </div>
    </div>

    <Navbar v-if="!isAdminRoute" />
    <router-view />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import api from './api'

const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const notification = ref({ enabled: false, text: '' })
const showNotification = ref(true)

const DISMISS_DURATION = 3 * 60 * 60 * 1000 // 3 hours in ms

const checkDismissed = () => {
  const dismissedAt = localStorage.getItem('notification_dismissed_at')
  if (dismissedAt) {
    const elapsed = Date.now() - parseInt(dismissedAt)
    if (elapsed < DISMISS_DURATION) {
      showNotification.value = false
    } else {
      localStorage.removeItem('notification_dismissed_at')
    }
  }
}

// Just close popup (will show again on next visit/refresh)
const closeNotification = () => {
  showNotification.value = false
}

// Close and don't show for 3 hours
const dismissFor3Hours = () => {
  showNotification.value = false
  localStorage.setItem('notification_dismissed_at', Date.now().toString())
}

const fetchNotification = async () => {
  try {
    const response = await api.get('/shop/notification')
    notification.value = response.data
  } catch (error) {
    console.error('Failed to fetch notification:', error)
  }
}

onMounted(() => {
  checkDismissed()
  fetchNotification()
  settingsStore.fetchShopInfo()
  
  if (authStore.isAuthenticated) {
    authStore.fetchProfile()
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* Popup Overlay */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Popup Modal */
.popup-modal {
  background: linear-gradient(135deg, var(--bg-secondary, #1a1a2e), var(--bg-tertiary, #252540));
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.2);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.1));
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.popup-icon {
  font-size: 1.75rem;
}

.popup-title {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text, #f8fafc);
  margin: 0;
}

.popup-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: var(--text-secondary, #94a3b8);
  font-size: 1.25rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.popup-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.popup-content {
  padding: 1.5rem;
  color: var(--text, #f8fafc);
  font-size: 1rem;
  line-height: 1.7;
}

.popup-content p {
  margin: 0;
  white-space: pre-wrap;
}

.popup-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  justify-content: center;
}

.popup-footer .btn {
  padding: 0.875rem 2.5rem;
  font-size: 1rem;
}
</style>

