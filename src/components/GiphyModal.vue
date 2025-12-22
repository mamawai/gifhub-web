<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useLocaleStore } from '@/stores/locale'
import { messages } from '@/locales/messages'

const props = defineProps<{
  isOpen: boolean
  gif: {
    id: string
    username?: string
    source?: string
    title?: string
    url?: string
    width?: number
    height?: number
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'like'): void
}>()

const localeStore = useLocaleStore()
const t = computed(() => messages[localeStore.locale].giphy)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && gif" class="modal-overlay" @click="emit('close')">
        <div class="modal-card" @click.stop>
          <button class="close-btn" @click="emit('close')">
            <X :size="24" />
          </button>

          <div class="gif-preview">
            <video
              :src="gif.url"
              autoplay
              loop
              muted
              playsinline
              class="gif-video"
            ></video>
          </div>

          <div class="gif-info">
            <h3 v-if="gif.title" class="title">{{ gif.title }}</h3>
            <p v-if="gif.username" class="username">{{ t.by }}: {{ gif.username }}</p>
            <p v-if="gif.source" class="source">{{ t.source }}: {{ gif.source }}</p>
            <p class="powered">{{ t.poweredByGiphy }}</p>
          </div>

          <div class="actions">
            <button class="btn-like" @click="emit('like')">
              {{ t.iLikeIt }} ❤️
            </button>
            <button class="btn-later" @click="emit('close')">
              {{ t.maybeLater }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.gif-preview {
  width: 100%;
  background: #000;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow: hidden;
}

.gif-video {
  width: 100%;
  height: auto;
  display: block;
}

.gif-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-main);
  word-wrap: break-word;
}

.username,
.source {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.powered {
  font-size: 0.85rem;
  font-weight: 700;
  background: linear-gradient(45deg, #00ff99 0%, #00ccff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-top: 0.5rem;
}

.actions {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  gap: 1rem;
}

.btn-like,
.btn-later {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-like {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-like:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.btn-later {
  background: var(--color-surface-hover);
  color: var(--color-text-main);
}

.btn-later:hover {
  background: var(--color-border);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: scale(0.9);
}
</style>
