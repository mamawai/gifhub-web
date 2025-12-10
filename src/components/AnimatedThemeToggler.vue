<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isDark?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const localIsDark = ref(props.isDark ?? false)

watch(
  () => props.isDark,
  (newVal) => {
    if (newVal !== undefined) {
      localIsDark.value = newVal
    }
  },
)

const handleToggle = () => {
  localIsDark.value = !localIsDark.value
  emit('toggle')
}
</script>

<template>
  <button
    class="theme-toggle"
    @click="handleToggle"
    :aria-label="localIsDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <div class="toggle-track" :class="{ 'is-dark': localIsDark }">
      <div class="toggle-thumb">
        <svg
          v-if="!localIsDark"
          class="icon sun-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg
          v-else
          class="icon moon-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </div>
  </button>
</template>

<style scoped>
.theme-toggle {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-track {
  position: relative;
  width: 60px;
  height: 32px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 9999px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(251, 191, 36, 0.3);
}

.toggle-track.is-dark {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(59, 130, 246, 0.3);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toggle-track.is-dark .toggle-thumb {
  transform: translateX(28px);
}

.icon {
  transition: all 0.3s ease;
}

.sun-icon {
  color: #f59e0b;
  animation: rotate 20s linear infinite;
}

.moon-icon {
  color: #3b82f6;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.theme-toggle:hover .toggle-track {
  transform: scale(1.05);
}

.theme-toggle:active .toggle-track {
  transform: scale(0.98);
}

/* 添加星星效果 */
.toggle-track::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.toggle-track.is-dark::before {
  opacity: 1;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 30%;
  left: 14px;
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.toggle-track.is-dark::after {
  opacity: 1;
}
</style>
