<script setup lang="ts">
import { ref, computed } from 'vue'
import { Heart, Maximize2 } from 'lucide-vue-next'
import type { GifDTO } from '@/api/gif'

const props = defineProps<{
  gif: GifDTO
}>()

const emit = defineEmits<{
  (e: 'click', gif: GifDTO): void
}>()

const isHovered = ref(false)
const isPressed = ref(false)
const isLiked = ref(false)

// Calculate aspect ratio
const aspectRatio =
  props.gif.width && props.gif.height ? `${props.gif.width} / ${props.gif.height}` : 'auto'

const isVideo = computed(() => {
  return props.gif.url?.endsWith('.mp4') || props.gif.fileUrl?.endsWith('.mp4')
})

const displayUrl = computed(() => {
  return props.gif.fileUrl || props.gif.url
})

const handlePress = () => {
  isPressed.value = true
}

const handleRelease = () => {
  isPressed.value = false
}

const handleClick = () => {
  emit('click', props.gif)
}
</script>

<template>
  <div
    class="gif-card"
    :class="{ 'is-pressed': isPressed }"
    @mouseenter="isHovered = true"
    @mouseleave="
      () => {
        isHovered = false
        isPressed = false
      }
    "
    @mousedown="handlePress"
    @mouseup="handleRelease"
    @click="handleClick"
    :style="{ aspectRatio }"
  >
    <!-- Video Element: Hide controls explicitly via CSS/Attributes -->
    <video
      v-if="isVideo"
      :src="displayUrl"
      autoplay
      loop
      muted
      playsinline
      disablePictureInPicture
      class="gif-content no-controls"
    ></video>
    <img v-else :src="displayUrl" loading="lazy" :alt="gif.title || 'GIF'" class="gif-content" />

    <div class="overlay" :class="{ visible: isHovered }">
      <div class="overlay-content">
        <div class="actions">
          <button class="action-btn" @click.stop="isLiked = !isLiked" :class="{ active: isLiked }">
            <Heart :size="18" :fill="isLiked ? 'currentColor' : 'none'" />
          </button>
          <button class="action-btn" @click.stop="handleClick">
            <Maximize2 :size="18" />
          </button>
        </div>

        <div class="info" v-if="gif.title">
          <p class="title">{{ gif.title }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gif-card {
  position: relative;
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  transition:
    transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.2s;
  break-inside: avoid; /* Essential for masonry */
  margin-bottom: 1rem;
  cursor: pointer;
  display: block;
  transform-style: preserve-3d;
  will-change: transform;
}

.gif-card:hover {
  transform: translateY(-4px);
  z-index: 10;
  box-shadow: var(--shadow-lg);
}

.gif-card.is-pressed {
  /* Press/Tilt Effect */
  transform: scale(0.98) rotateX(2deg);
  box-shadow: var(--shadow-sm);
}

.gif-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none; /* Prevent video interaction blocking click */
}

/* Hide video controls fallback */
.no-controls::-webkit-media-controls {
  display: none !important;
}
.no-controls::-webkit-media-controls-enclosure {
  display: none !important;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1rem;
  pointer-events: none; /* Let clicks pass through unless on button */
}

.overlay.visible {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  position: absolute;
  top: 1rem;
  right: 1rem;
  pointer-events: auto; /* Enable button clicks */
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
}

.action-btn:hover {
  background: white;
  color: black;
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.active {
  background: #ef4444; /* Red 500 */
  color: white;
}

.info {
  margin-top: auto;
}

.title {
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
