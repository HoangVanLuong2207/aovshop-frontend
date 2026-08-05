<template>
  <div class="google-sign-in" ref="container">
    <div v-if="clientId" ref="button" class="google-button"></div>
    <p v-else-if="loading" class="google-unavailable">Đang tải Google Sign-In...</p>
    <p v-else-if="!clientId && !loading" class="google-unavailable">Google Sign-In chưa được cấu hình.</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { authApi } from '../api'

const emit = defineEmits(['credential', 'error'])
const button = ref(null)
const container = ref(null)
const clientId = ref(null)
const loading = ref(true)
let script

const renderButton = () => {
  if (!window.google?.accounts?.id || !button.value) return
  // Calculate width based on container, capped at reasonable bounds
  const containerWidth = container.value?.offsetWidth || 300
  const btnWidth = Math.min(containerWidth, 400)

  window.google.accounts.id.initialize({
    client_id: clientId.value,
    callback: (response) => emit('credential', response.credential),
    auto_select: false,
  })
  window.google.accounts.id.renderButton(button.value, {
    type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', width: btnWidth,
  })
}

const loadGsiScript = () => {
  if (window.google?.accounts?.id) return renderButton()
  script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.onload = renderButton
  script.onerror = () => emit('error', 'Không tải được Google Sign-In. Vui lòng thử lại.')
  document.head.appendChild(script)
}

onMounted(async () => {
  try {
    const { data } = await authApi.googleConfig()
    clientId.value = data.clientId || null
  } catch {
    clientId.value = null
  } finally {
    loading.value = false
  }

  if (clientId.value) {
    await nextTick()
    loadGsiScript()
  }
})

onBeforeUnmount(() => script?.remove())
</script>

<style scoped>
.google-sign-in { margin-top: 1rem; }
.google-button { display: flex; justify-content: center; overflow: hidden; }
.google-unavailable { color: var(--text-secondary); font-size: .85rem; text-align: center; }
</style>
