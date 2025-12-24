<script setup lang="ts">
import { computed } from 'vue'
import { Repeat } from 'lucide-vue-next'
import { useSettingsStore, type LoopCount } from '@/stores/settings'
import { useLocaleStore } from '@/stores/locale'
import { messages } from '@/locales/messages'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settingsStore = useSettingsStore()
const localeStore = useLocaleStore()
const t = computed(() => messages[localeStore.locale].settings)

const loopOptions: LoopCount[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'infinite']

const handleSelect = (count: LoopCount) => {
  settingsStore.setLoopCount(count)
  emit('close')
}

const getDisplayValue = (count: LoopCount) => {
  if (count === 'infinite') return '∞'
  return count.toString()
}
</script>

<template>
  <transition name="dropdown">
    <div v-if="show" class="settings-popup">
      <div class="popup-header">
        <Repeat :size="18" class="header-icon" />
        <span>{{ t.videoPlayback }}</span>
      </div>

      <div class="popup-content">
        <div class="loop-label">{{ t.loopCount }}</div>
        <div class="loop-grid">
          <button
            v-for="option in loopOptions"
            :key="option"
            :class="['loop-btn', { active: settingsStore.loopCount === option }]"
            @click="handleSelect(option)"
          >
            {{ getDisplayValue(option) }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.settings-popup {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  min-width: 200px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

:global(.dark) .settings-popup {
  background: rgba(30, 30, 35, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.3);
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-main);
}

.header-icon {
  color: var(--color-primary);
}

.popup-content {
  padding: 1rem 1.25rem;
}

.loop-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.loop-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.loop-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-hover);
  border: 2px solid transparent;
  border-radius: 10px;
  color: var(--color-text-main);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.loop-btn:hover {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.1), rgba(255, 102, 102, 0.1));
  border-color: rgba(153, 51, 255, 0.3);
  transform: translateY(-1px);
}

.loop-btn.active {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.2), rgba(255, 102, 102, 0.2));
  border-color: rgba(153, 51, 255, 0.5);
  color: #9933ff;
  box-shadow: 0 2px 8px rgba(153, 51, 255, 0.25);
}

:global(.dark) .loop-btn {
  background: rgba(255, 255, 255, 0.05);
}

:global(.dark) .loop-btn:hover {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.15), rgba(255, 102, 102, 0.15));
}

:global(.dark) .loop-btn.active {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.25), rgba(255, 102, 102, 0.25));
  color: #cc88ff;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
