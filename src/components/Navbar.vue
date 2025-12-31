<template>
  <nav class="navbar">
    <div class="container navbar-content">
      <router-link to="/" class="navbar-logo">
        <img v-if="settingsStore.shopLogo" :src="settingsStore.shopLogo" :alt="settingsStore.shopName" class="shop-logo-img" />
        <span>{{ settingsStore.shopName }}</span>
      </router-link>
      
      <!-- Desktop Nav -->
      <ul class="navbar-nav desktop-nav">
        <li><router-link to="/">Trang chủ</router-link></li>
        <li><router-link to="/products">Sản phẩm</router-link></li>
      </ul>

      <!-- Desktop Actions -->
      <div class="navbar-actions desktop-actions">
        <!-- Theme Toggle -->
        <button class="theme-toggle btn btn-secondary btn-sm" @click="themeStore.toggle" :title="themeStore.isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'">
          {{ themeStore.isDark ? '☀️' : '🌙' }}
        </button>

        <template v-if="authStore.isAuthenticated">
          <router-link to="/deposit" class="balance-badge">
            {{ formatPrice(authStore.balance) }}
          </router-link>
          
          <router-link to="/cart" class="cart-badge btn btn-secondary btn-sm">
            🛒 Giỏ hàng
            <span v-if="cartStore.itemCount" class="cart-count">{{ cartStore.itemCount }}</span>
          </router-link>

          <div class="dropdown">
            <button class="btn btn-secondary btn-sm" @click="showDropdown = !showDropdown">
              {{ authStore.user?.name }} ▾
            </button>
            <div v-if="showDropdown" class="dropdown-menu">
              <router-link to="/orders" @click="showDropdown = false">Đơn hàng</router-link>
              <router-link to="/profile" @click="showDropdown = false">Tài khoản</router-link>
              <router-link v-if="authStore.isAdmin" to="/admin" @click="showDropdown = false">
                Admin
              </router-link>
              <button @click="logout">Đăng xuất</button>
            </div>
          </div>
        </template>

        <template v-else>
          <router-link to="/login" class="btn btn-secondary btn-sm">Đăng nhập</router-link>
          <router-link to="/register" class="btn btn-primary btn-sm">Đăng ký</router-link>
        </template>
      </div>

      <!-- Mobile Hamburger Button -->
      <button class="hamburger-btn" @click="toggleMobileMenu">
        <span :class="{ open: isMobileMenuOpen }"></span>
        <span :class="{ open: isMobileMenuOpen }"></span>
        <span :class="{ open: isMobileMenuOpen }"></span>
      </button>
    </div>

    <!-- Mobile Menu Overlay -->
    <div 
      class="mobile-overlay" 
      :class="{ active: isMobileMenuOpen }" 
      @click="closeMobileMenu"
    ></div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ open: isMobileMenuOpen }">
      <div class="mobile-menu-header">
        <span class="mobile-menu-title">Menu</span>
        <button class="close-menu-btn" @click="closeMobileMenu">✕</button>
      </div>

      <div class="mobile-menu-content">
        <!-- Nav Links -->
        <div class="mobile-nav-section">
          <router-link to="/" class="mobile-nav-item" @click="closeMobileMenu">
            🏠 Trang chủ
          </router-link>
          <router-link to="/products" class="mobile-nav-item" @click="closeMobileMenu">
            📁 Danh mục
          </router-link>
          <router-link to="/products" class="mobile-nav-item" @click="closeMobileMenu">
            📦 Sản phẩm
          </router-link>
        </div>

        <template v-if="authStore.isAuthenticated">
          <div class="mobile-nav-section">
            <router-link to="/deposit" class="mobile-nav-item balance-item" @click="closeMobileMenu">
              💰 Số dư: {{ formatPrice(authStore.balance) }}
            </router-link>
            <router-link to="/cart" class="mobile-nav-item" @click="closeMobileMenu">
              🛒 Giỏ hàng
              <span v-if="cartStore.itemCount" class="mobile-cart-count">{{ cartStore.itemCount }}</span>
            </router-link>
            <router-link to="/orders" class="mobile-nav-item" @click="closeMobileMenu">
              📋 Đơn hàng
            </router-link>
            <router-link to="/profile" class="mobile-nav-item" @click="closeMobileMenu">
              👤 Tài khoản
            </router-link>
            <router-link v-if="authStore.isAdmin" to="/admin" class="mobile-nav-item admin-item" @click="closeMobileMenu">
              ⚙️ Admin
            </router-link>
          </div>

          <div class="mobile-nav-section">
            <button class="mobile-nav-item theme-item" @click="themeStore.toggle">
              {{ themeStore.isDark ? '☀️ Chế độ sáng' : '🌙 Chế độ tối' }}
            </button>
            <button class="mobile-nav-item logout-item" @click="logout">
              🚪 Đăng xuất
            </button>
          </div>
        </template>

        <template v-else>
          <div class="mobile-nav-section">
            <button class="mobile-nav-item theme-item" @click="themeStore.toggle">
              {{ themeStore.isDark ? '☀️ Chế độ sáng' : '🌙 Chế độ tối' }}
            </button>
          </div>
          <div class="mobile-auth-buttons">
            <router-link to="/login" class="btn btn-secondary" @click="closeMobileMenu">Đăng nhập</router-link>
            <router-link to="/register" class="btn btn-primary" @click="closeMobileMenu">Đăng ký</router-link>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useThemeStore } from '../stores/theme'
import { useSettingsStore } from '../stores/settings'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const themeStore = useThemeStore()
const settingsStore = useSettingsStore()
const showDropdown = ref(false)
const isMobileMenuOpen = ref(false)

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const logout = async () => {
  await authStore.logout()
  showDropdown.value = false
  closeMobileMenu()
  router.push('/')
}
</script>

<style scoped>
/* Shop Logo */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.shop-logo-img {
  height: 32px;
  width: auto;
  border-radius: 4px;
}

/* Desktop Dropdown */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  min-width: 160px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.dropdown-menu a,
.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  border: none;
  background: none;
  color: var(--text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-menu a:hover,
.dropdown-menu button:hover {
  background: var(--bg-tertiary);
}

.theme-toggle {
  font-size: 1.1rem;
  padding: 0.5rem 0.75rem;
}

/* Hamburger Button */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  gap: 5px;
  padding: 10px;
}

.hamburger-btn span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
  transition: all 0.3s;
}

.hamburger-btn span.open:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger-btn span.open:nth-child(2) {
  opacity: 0;
}

.hamburger-btn span.open:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Mobile Overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 998;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.mobile-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

/* Mobile Menu */
.mobile-menu {
  display: none;
  position: fixed;
  top: 0;
  right: -300px;
  width: 280px;
  height: 100vh;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  z-index: 999;
  transition: right 0.3s ease;
  overflow-y: auto;
}

.mobile-menu.open {
  right: 0;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.mobile-menu-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.close-menu-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1rem;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.close-menu-btn:hover {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.mobile-menu-content {
  padding: 1rem;
}

.mobile-nav-section {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.mobile-nav-section:last-child {
  border-bottom: none;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  color: var(--text);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
}

.mobile-nav-item:hover {
  background: var(--bg-tertiary);
}

.balance-item {
  background: linear-gradient(135deg, var(--secondary), var(--secondary-dark));
  color: white;
}

.balance-item:hover {
  opacity: 0.9;
  background: linear-gradient(135deg, var(--secondary), var(--secondary-dark));
}

.admin-item {
  color: var(--primary-light);
}

.logout-item {
  color: var(--danger);
}

.mobile-cart-count {
  background: var(--danger);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}

.mobile-auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.mobile-auth-buttons .btn {
  width: 100%;
  justify-content: center;
  padding: 1rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .desktop-nav,
  .desktop-actions {
    display: none !important;
  }

  .hamburger-btn {
    display: flex;
  }

  .mobile-overlay,
  .mobile-menu {
    display: block;
  }
}
</style>
