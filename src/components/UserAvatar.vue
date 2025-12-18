<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  nickname?: string
  avatar?: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  nickname: '',
  avatar: '',
  size: 40,
})

const firstChar = computed(() => {
  return props.nickname?.charAt(0)?.toUpperCase() || 'U'
})

const showPlaceholder = computed(() => {
  return !props.avatar || props.avatar === '/placeholder.png'
})
</script>

<template>
  <div class="user-avatar" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="!showPlaceholder" :src="avatar" alt="avatar" />
    <span v-else class="avatar-placeholder">{{ firstChar }}</span>
  </div>
</template>

<style scoped>
.user-avatar {
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  color: var(--color-primary);
  position: relative;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  font-size: calc(var(--size, 40px) * 0.45);
  user-select: none;
}
</style>
