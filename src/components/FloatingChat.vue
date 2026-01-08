<template>
  <div class="floating-chat">
    <Transition name="chat-options">
      <div v-if="isExpanded" class="chat-options">
        <a 
          v-for="option in chatOptions" 
          :key="option.name"
          :href="option.url" 
          target="_blank"
          class="chat-option"
          :style="{ '--option-color': option.color }"
          @click="trackClick(option.name)"
        >
          <span class="chat-option-icon">{{ option.icon }}</span>
          <span class="chat-option-label">{{ option.name }}</span>
        </a>
      </div>
    </Transition>
    
    <button 
      class="chat-toggle"
      :class="{ 'is-expanded': isExpanded }"
      @click="toggleExpand"
    >
      <span class="chat-icon">💬</span>
      <span class="chat-close">✕</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isExpanded = ref(false)

const chatOptions = [
  { 
    name: 'Zalo', 
    icon: '💙', 
    url: 'https://zalo.me/0123456789', 
    color: '#0068ff' 
  },
  { 
    name: 'Messenger', 
    icon: '💜', 
    url: 'https://m.me/yourpage', 
    color: '#0084ff' 
  },
  { 
    name: 'Hotline', 
    icon: '📞', 
    url: 'tel:0123456789', 
    color: '#22c55e' 
  },
]

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const trackClick = (name) => {
  console.log('Chat clicked:', name)
  isExpanded.value = false
}
</script>

<style scoped>
.floating-chat {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.chat-toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
}

.chat-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.6);
}

.chat-icon,
.chat-close {
  position: absolute;
  font-size: 24px;
  transition: all 0.3s ease;
}

.chat-icon {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.chat-close {
  opacity: 0;
  transform: scale(0.5) rotate(-90deg);
  color: white;
  font-size: 20px;
}

.chat-toggle.is-expanded .chat-icon {
  opacity: 0;
  transform: scale(0.5) rotate(90deg);
}

.chat-toggle.is-expanded .chat-close {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.chat-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 8px;
}

.chat-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 50px;
  color: var(--text);
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.chat-option:hover {
  transform: translateX(-10px);
  border-color: var(--option-color);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.chat-option-icon {
  font-size: 20px;
}

.chat-option-label {
  font-weight: 600;
  font-size: 14px;
}

/* Transition */
.chat-options-enter-active,
.chat-options-leave-active {
  transition: all 0.3s ease;
}

.chat-options-enter-from,
.chat-options-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.chat-options-enter-active .chat-option {
  animation: popIn 0.3s ease-out forwards;
}

.chat-options-enter-active .chat-option:nth-child(1) { animation-delay: 0ms; }
.chat-options-enter-active .chat-option:nth-child(2) { animation-delay: 50ms; }
.chat-options-enter-active .chat-option:nth-child(3) { animation-delay: 100ms; }

@keyframes popIn {
  0% {
    opacity: 0;
    transform: translateX(20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@media (max-width: 768px) {
  .floating-chat {
    bottom: 16px;
    right: 16px;
  }
  
  .chat-toggle {
    width: 55px;
    height: 55px;
  }
}
</style>
