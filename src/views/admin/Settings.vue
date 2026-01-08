<template>
  <div class="settings-page">
    <h1>Cài đặt hệ thống</h1>
    <div class="settings-grid">
    <div class="settings-column">
    <!-- Notification Section -->
    <div class="settings-section">
      <h2>📢 Thông báo trang web</h2>
      
      <form @submit.prevent="saveSettings" class="settings-form">
       <div class="form-group">
        <label 
          class="toggle-label"
          style="
            display: flex;
            align-items: center;
            gap: 10px;
          "
        >
          <input 
            type="checkbox" 
            v-model="settings.notification_enabled"
            class="toggle-input"
          />
          <span class="toggle-switch"></span>
          <span style="line-height: 1;">Thông báo</span>
        </label>
      </div>



        <div class="form-group" v-if="settings.notification_enabled">
          <label>Nội dung thông báo</label>
          
          <!-- Formatting Toolbar -->
          <div class="editor-toolbar">
            <button type="button" class="toolbar-btn" @click="insertBold" title="In đậm">
              <strong>B</strong>
            </button>
            <button type="button" class="toolbar-btn" @click="insertItalic" title="In nghiêng">
              <em>I</em>
            </button>
            <button type="button" class="toolbar-btn" @click="insertLink" title="Chèn link">
              🔗
            </button>
            <button type="button" class="toolbar-btn" @click="insertImage" title="Chèn ảnh">
              🖼️
            </button>
            <button type="button" class="toolbar-btn toolbar-btn-rgb" @click="insertRGB" title="Chữ nháy RGB">
              🌈
            </button>
          </div>
          
          <textarea 
            ref="notificationTextarea"
            v-model="settings.notification_text" 
            class="form-input editor-textarea"
            rows="6"
            placeholder="Nhập nội dung thông báo..."
          ></textarea>
          <small>Sử dụng các nút trên để định dạng văn bản. Xem trước bên dưới.</small>
        </div>

        <div v-if="settings.notification_enabled && settings.notification_text" class="notification-preview">
          <h4>Xem trước nội dung:</h4>
          <div class="preview-popup">
            <div class="preview-popup-header">
              <span>📢</span>
              <strong>Thông báo</strong>
            </div>
            <div class="preview-popup-content" v-html="settings.notification_text">
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Đang lưu...' : '💾 Lưu thông báo' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Shop Branding Section -->
    <div class="settings-section">
      <h2>🏪 Thông tin Shop</h2>
      
      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="form-group">
          <label>Tên Shop</label>
          <input 
            type="text" 
            v-model="settings.shop_name" 
            class="form-input"
            placeholder="Nhập tên shop của bạn"
          />
        </div>

        <div class="form-group">
          <label>Logo URL</label>
          <input 
            type="url" 
            v-model="settings.shop_logo" 
            class="form-input"
            placeholder="https://example.com/logo.png"
          />
          <small>Link ảnh logo (khuyến nghị 200x200px)</small>
        </div>

        <div class="form-group">
          <label>Banner URLs (Slider)</label>
          <div class="banner-list">
            <div v-for="(banner, index) in bannerList" :key="index" class="banner-item">
              <input 
                type="url" 
                v-model="bannerList[index]" 
                class="form-input"
                :placeholder="`Banner ${index + 1}: https://example.com/banner.png`"
              />
              <button type="button" class="btn btn-danger btn-sm" @click="removeBanner(index)" v-if="bannerList.length > 1">
                ✕
              </button>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" @click="addBanner" style="margin-top: 8px;">
            + Thêm Banner
          </button>
          <small>Link ảnh banner trang chủ (khuyến nghị 1200x400px). Nhiều ảnh sẽ chạy slider.</small>
        </div>

        <div v-if="settings.shop_logo || bannerList.some(b => b)" class="preview-section">
          <h4>Xem trước:</h4>
          <div class="preview-images">
            <div v-if="settings.shop_logo" class="preview-item">
              <span>Logo:</span>
              <img :src="settings.shop_logo" alt="Logo" class="preview-logo" />
            </div>
            <div v-if="bannerList.some(b => b)" class="preview-item banner-preview-list">
              <span>Banner ({{ bannerList.filter(b => b).length }} ảnh):</span>
              <div class="banner-preview-grid">
                <img v-for="(banner, idx) in bannerList.filter(b => b)" :key="idx" :src="banner" alt="Banner" class="preview-banner-thumb" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Đang lưu...' : '💾 Lưu thông tin Shop' }}
          </button>
        </div>
      </form>
    </div>
    </div>

    <div class="settings-column">
    <div class="settings-section">
      <h2>🏦 Cấu hình SePay / Thanh toán</h2>
      
      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="form-group">
          <label>Merchant ID</label>
          <input 
            type="text" 
            v-model="settings.sepay_merchant_id" 
            class="form-input"
            placeholder="Nhập Merchant ID từ SePay"
          />
        </div>

        <div class="form-group">
          <label>Secret Key</label>
          <input 
            type="password" 
            v-model="settings.sepay_secret_key" 
            class="form-input"
            placeholder="Nhập Secret Key từ SePay"
          />
        </div>

        <div class="form-group">
          <label>Tên ngân hàng</label>
          <select v-model="settings.sepay_bank_name" class="form-input">
            <option value="">-- Chọn ngân hàng --</option>
            <option value="MB">MB Bank</option>
            <option value="VCB">Vietcombank</option>
            <option value="ACB">ACB</option>
            <option value="TCB">Techcombank</option>
            <option value="VPB">VPBank</option>
            <option value="TPB">TPBank</option>
            <option value="BIDV">BIDV</option>
            <option value="VIB">VIB</option>
            <option value="MSB">MSB</option>
            <option value="OCB">OCB</option>
          </select>
        </div>

        <div class="form-group">
          <label>Số tài khoản</label>
          <input 
            type="text" 
            v-model="settings.sepay_bank_account" 
            class="form-input"
            placeholder="Nhập số tài khoản ngân hàng"
          />
        </div>

        <div class="form-group">
          <label>Tên chủ tài khoản</label>
          <input 
            type="text" 
            v-model="settings.sepay_account_name" 
            class="form-input"
            placeholder="Nhập tên chủ tài khoản (viết hoa, không dấu)"
          />
        </div>

        <div class="webhook-info">
          <h3>🔗 Webhook URL</h3>
          <p>Copy URL này và dán vào cài đặt Webhook trên SePay:</p>
          <code>{{ webhookUrl }}</code>
          <button type="button" class="btn btn-secondary btn-sm" @click="copyWebhook">
            📋 Copy
          </button>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Đang lưu...' : '💾 Lưu cài đặt' }}
          </button>
        </div>
      </form>
    </div>

    <div class="settings-section">
      <h2>ℹ️ Hướng dẫn</h2>
      <ol>
        <li>Đăng nhập vào <a href="https://my.sepay.vn" target="_blank">SePay Dashboard</a></li>
        <li>Vào phần <strong>Cài đặt</strong> → <strong>API</strong></li>
        <li>Copy <strong>Merchant ID</strong> và <strong>Secret Key</strong></li>
        <li>Thêm webhook URL ở trên vào cài đặt Webhook của SePay</li>
        <li>Nhập thông tin tài khoản ngân hàng nhận tiền</li>
      </ol>
    </div>
    </div>
    </div>
  
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { useToast } from '../../composables/useToast'
import { useSettingsStore } from '../../stores/settings'

const { toast } = useToast()
const settingsStore = useSettingsStore()

const settings = ref({
  notification_enabled: false,
  notification_type: 'info',
  notification_text: '',
  shop_name: '',
  shop_logo: '',
  shop_banner: '',
  sepay_merchant_id: '',
  sepay_secret_key: '',
  sepay_bank_name: '',
  sepay_bank_account: '',
  sepay_account_name: '',
})

const saving = ref(false)

const webhookUrl = 'https://(web3).onrender.com/api/deposit/webhook'

const bannerList = ref([''])

const loadSettings = async () => {
  try {
    const response = await api.get('/admin/settings')
    const data = response.data
    // Convert notification_enabled from string to boolean
    if (data.notification_enabled !== undefined) {
      data.notification_enabled = data.notification_enabled === 'true' || data.notification_enabled === true
    }
    // Parse shop_banner JSON array
    if (data.shop_banner) {
      try {
        const parsed = JSON.parse(data.shop_banner)
        if (Array.isArray(parsed)) {
          bannerList.value = parsed.length > 0 ? parsed : ['']
        } else {
          bannerList.value = [data.shop_banner]
        }
      } catch {
        bannerList.value = [data.shop_banner]
      }
    }
    settings.value = { ...settings.value, ...data }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const saveSettings = async () => {
  saving.value = true
  
  try {
    // Convert boolean to string for backend
    const dataToSend = { ...settings.value }
    if (dataToSend.notification_enabled !== undefined) {
      dataToSend.notification_enabled = dataToSend.notification_enabled ? 'true' : 'false'
    }
    // Serialize bannerList to JSON
    const validBanners = bannerList.value.filter(b => b && b.trim())
    dataToSend.shop_banner = validBanners.length > 0 ? JSON.stringify(validBanners) : ''
    
    await api.post('/admin/settings', dataToSend)
    
    // Refresh settings store để cập nhật banner ngay lập tức
    await settingsStore.refreshShopInfo()
    
    toast.success('Cài đặt đã được lưu thành công!')
  } catch (error) {
    toast.error('Lỗi khi lưu cài đặt: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

const addBanner = () => {
  bannerList.value.push('')
}

const removeBanner = (index) => {
  bannerList.value.splice(index, 1)
}

const copyWebhook = () => {
  navigator.clipboard.writeText(webhookUrl)
  toast.success('Đã copy Webhook URL!')
}

// Rich text editor functions
const notificationTextarea = ref(null)

const insertAtCursor = (text) => {
  const textarea = notificationTextarea.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = settings.value.notification_text.substring(0, start)
  const after = settings.value.notification_text.substring(end)
  
  settings.value.notification_text = before + text + after
  
  // Focus back and set cursor position
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + text.length, start + text.length)
  }, 0)
}

const insertBold = () => {
  const selectedText = window.getSelection().toString() || 'văn bản đậm'
  insertAtCursor(`<strong>${selectedText}</strong>`)
}

const insertItalic = () => {
  const selectedText = window.getSelection().toString() || 'văn bản nghiêng'
  insertAtCursor(`<em>${selectedText}</em>`)
}

const insertLink = () => {
  const url = prompt('Nhập URL (ví dụ: /products hoặc https://...):', '/products')
  if (!url) return
  
  const text = prompt('Nhập text hiển thị:', 'Xem ngay')
  if (!text) return
  
  insertAtCursor(`<a href="${url}">${text}</a>`)
}

const insertImage = () => {
  const url = prompt('Nhập URL ảnh:', 'https://...')
  if (!url) return
  
  insertAtCursor(`<img src="${url}" style="max-width: 100%; border-radius: 8px;" />`)
}

const insertRGB = () => {
  const selectedText = window.getSelection().toString() || 'chữ RGB'
  insertAtCursor(`<span class="rgb-text">${selectedText}</span>`)
}

onMounted(loadSettings)
</script>

<style scoped>
.settings-page {
  padding: 20px;
}

.settings-grid {
  display: flex;
  justify-content: space-around;
  gap: 24px;
}

.settings-column {
  flex: 1;
  min-width: 0;
}

@media (max-width: 900px) {
  .settings-grid {
    flex-direction: column;
  }
  
  .settings-column {
    width: 100%;
  }
}

.settings-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.settings-section h2 {
  margin-bottom: 20px;
  color: var(--text-primary);
}

.settings-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.webhook-info {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
}

.webhook-info h3 {
  margin-bottom: 8px;
  font-size: 14px;
}

.webhook-info p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.webhook-info code {
  display: block;
  background: var(--card-bg);
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  word-break: break-all;
  margin-bottom: 10px;
}

.form-actions {
  margin-top: 24px;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
}

.message.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

ol {
  padding-left: 20px;
  line-height: 1.8;
}

ol a {
  color: var(--primary-color);
}

.preview-section {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.preview-images {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item span {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-logo {
  max-height: 80px;
  max-width: 200px;
  object-fit: contain;
  border-radius: 8px;
}

.preview-banner {
  max-height: 100px;
  max-width: 400px;
  object-fit: cover;
  border-radius: 8px;
}

small {
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 4px;
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary, #f8fafc);
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  flex-shrink: 0;
  width: 52px;
  height: 28px;
  background: #475569 !important;
  border-radius: 14px;
  position: relative;
  transition: background 0.3s ease;
  display: inline-block;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle-input:checked + .toggle-switch {
  background: #22c55e !important;
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(24px);
}

/* Notification Preview */
.notification-preview {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.notification-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.preview-popup {
  background: var(--bg-secondary, #1a1a2e);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.preview-popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.1));
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  font-size: 14px;
}

.preview-popup-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Editor Toolbar */
.editor-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  width: 100%;
  box-sizing: border-box;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toolbar-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.editor-textarea {
  border-radius: 0 0 8px 8px !important;
  border: 1px solid var(--border) !important;
  border-top: none !important;
  background: var(--bg-tertiary) !important;
  color: var(--text) !important;
  font-family: inherit;
  resize: vertical;
  width: 100% !important;
  box-sizing: border-box;
  padding: 12px;
}

.preview-popup-content a {
  color: #818cf8;
  text-decoration: underline;
}

.preview-popup-content img {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

/* Banner List Styles */
.banner-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.banner-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.banner-item .form-input {
  flex: 1;
}

.banner-preview-list {
  flex-direction: column;
  align-items: flex-start;
}

.banner-preview-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.preview-banner-thumb {
  max-height: 60px;
  max-width: 150px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border);
}

/* RGB Rainbow Text Animation */
.rgb-text {
  background: linear-gradient(
    90deg,
    #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
  );
  background-size: 400% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: rgb-flow 3s linear infinite;
}

@keyframes rgb-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
}
</style>
