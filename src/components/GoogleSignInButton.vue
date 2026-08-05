<template>
  <div class="google-sign-in">
    <div v-if="clientId" ref="button" class="google-button"></div>
    <p v-else-if="!loading" class="google-unavailable">Google Sign-In chưa được cấu hình.</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import api from '../api'

const emit = defineEmits(['credential', 'error'])
const button = ref(null)
const clientId = ref('')
const loading = ref(true)
let script

const renderButton = () => {
  if (!window.google?.accounts?.id || !button.value) return
  window.google.accounts.id.initialize({
    client_id: clientId.value,
    callback: (response) => emit('credential', response.credential),
    auto_select: false,
  })
  window.google.accounts.id.renderButton(button.value, {
    type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', width: 370,
  })
}

onMounted(() => {
  api.get('/auth/google-config')
    .then(({ data }) => {
      clientId.value = data.clientId || ''
      if (!clientId.value) return
      if (window.google?.accounts?.id) return renderButton()
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = renderButton
      script.onerror = () => emit('error', 'Không tải được Google Sign-In. Vui lòng thử lại.')
      document.head.appendChild(script)
    })
    .catch(() => emit('error', 'Không tải được cấu hình Google Sign-In.'))
    .finally(() => { loading.value = false })
})

onBeforeUnmount(() => script?.remove())
</script>

<style scoped>
.google-sign-in { margin-top: 1rem; }
.google-button { display: flex; justify-content: center; }
.google-unavailable { color: var(--text-secondary); font-size: .85rem; text-align: center; }
</style>
