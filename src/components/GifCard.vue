<script setup lang="ts">
import { ref, computed } from 'vue'
import { Heart, Maximize2 } from 'lucide-vue-next'
import type { GifDTO } from '@/api/types'

const props = defineProps<{
  gif: GifDTO
}>()

const emit = defineEmits<{
  (e: 'click', gif: GifDTO): void
}>()

const cardRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)
const isLiked = ref(false)

// Tilt State
const rotateX = ref(0)
const rotateY = ref(0)
const scale = ref(1)

// Calculate aspect ratio
const aspectRatio =
  props.gif.width && props.gif.height ? `${props.gif.width} / ${props.gif.height}` : 'auto'

const isVideo = computed(() => {
  return props.gif.url?.endsWith('.mp4') || props.gif.fileUrl?.endsWith('.mp4')
})

const displayUrl = computed(() => {
  return props.gif.fileUrl || props.gif.url
})

const cardStyle = computed(() => {
  return {
    aspectRatio: aspectRatio,
    transform: `perspective(1000px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) scale3d(${scale.value}, ${scale.value}, ${scale.value})`,
  }
})

const handleMouseMove = (e: MouseEvent) => {
  if (!cardRef.value) return

  const rect = cardRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  // Calculate rotation (max 10 degrees)
  const rotateXValue = ((y - centerY) / centerY) * -10
  const rotateYValue = ((x - centerX) / centerX) * 10

  rotateX.value = rotateXValue
  rotateY.value = rotateYValue
  scale.value = 1.02
}

const handleMouseLeave = () => {
  isHovered.value = false
  rotateX.value = 0
  rotateY.value = 0
  scale.value = 1
}

const handleClick = () => {
  emit('click', props.gif)
}
</script>

<template>
  <div
    ref="cardRef"
    class="gif-card"
    @mouseenter="isHovered = true"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    :style="cardStyle"
  >
    <!-- Video Element: Ensure controls are hidden -->
    <video
      v-if="isVideo"
      :src="displayUrl"
      autoplay
      loop
      muted
      playsinline
      disablePictureInPicture
      class="gif-content no-controls"
      oncontextmenu="return false;"
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
  box-shadow: var(--shadow-md);
  break-inside: avoid; /* Essential for masonry */
  margin-bottom: 1rem;
  cursor: pointer;
  transform-style: preserve-3d;
  will-change: transform;
  transition: box-shadow 0.2s ease;
  /* Remove transition on transform during mousemove for instant response, add it back on mouseleave via JS if needed, or keeping it short */
}

/* Add transition for smooth reset */
.gif-card:not(:hover) {
  transition:
    transform 0.5s cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 0.5s;
}

.gif-card:hover {
  z-index: 10;
  box-shadow: var(--shadow-xl);
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
