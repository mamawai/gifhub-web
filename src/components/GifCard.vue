<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GifDTO } from '@/api/types'

const props = defineProps<{
  gif: GifDTO
}>()

const emit = defineEmits<{
  (e: 'click', gif: GifDTO): void
}>()

const cardRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)

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
  /* 增强的默认阴影 */
  box-shadow:
    0 4px 12px -2px rgba(0, 0, 0, 0.15),
    0 2px 6px -1px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.08);
  break-inside: avoid; /* Essential for masonry */
  margin-bottom: 1rem;
  cursor: pointer;
  transform-style: preserve-3d;
  will-change: transform;
  transition: box-shadow 0.3s ease;
}

/* Add transition for smooth reset */
.gif-card:not(:hover) {
  transition:
    transform 0.5s cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.gif-card:hover {
  z-index: 10;
  /* 浅绿色霓虹发光阴影 - 多层渐变光晕效果 */
  box-shadow:
    0 0 20px rgba(52, 211, 153, 0.6),
    /* 翡翠绿内层光晕 */ 0 0 40px rgba(16, 185, 129, 0.4),
    /* 深翠绿中层光晕 */ 0 0 60px rgba(110, 231, 183, 0.3),
    /* 薄荷绿外层光晕 */ 0 0 80px rgba(52, 211, 153, 0.2),
    /* 翡翠绿最外层 */ 0 8px 16px -2px rgba(0, 0, 0, 0.2),
    /* 底部阴影增强深度 */ 0 0 0 1px rgba(52, 211, 153, 0.2); /* 边框光晕 */
  animation: neonPulse 2s ease-in-out infinite;
}

/* 霓虹脉动动画 */
@keyframes neonPulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.1);
  }
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
  height: 100%;
}

/* 底部栏：标题和爱心在同一行 */
.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
  width: 100%;
}

/* 爱心按钮 */
.like-btn {
  flex-shrink: 0; /* 防止按钮被压缩 */
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
  flex: 1; /* 让标题占据剩余空间 */
  min-width: 0; /* 允许文字溢出省略 */
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
