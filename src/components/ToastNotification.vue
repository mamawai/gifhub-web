<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next'

const appStore = useAppStore()
const { toasts } = storeToRefs(appStore)

const remove = (id: number) => {
  appStore.removeToast(id)
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        <div class="icon">
          <CheckCircle v-if="toast.type === 'success'" :size="20" />
          <AlertCircle v-else-if="toast.type === 'error'" :size="20" />
          <AlertTriangle v-else-if="toast.type === 'warning'" :size="20" />
          <Info v-else :size="20" />
        </div>
        <div class="message">{{ toast.message }}</div>
        <button class="close" @click="remove(toast.id)">
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* Let clicks pass through container */
}

.toast {
  pointer-events: auto;
  min-width: 300px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-main);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.close {
  margin-left: auto;
  color: var(--color-text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
}

.close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-main);
}

/* Types */
.toast.success {
  border-color: rgba(16, 185, 129, 0.2);
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
.toast-container :global(.dark) .toast.success {
  background: rgba(6, 78, 59, 0.4);
}

.toast.error {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.toast.warning {
  border-color: rgba(245, 158, 11, 0.2);
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.toast.info {
  border-color: rgba(59, 130, 246, 0.2);
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
