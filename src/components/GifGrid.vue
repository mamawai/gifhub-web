<script setup lang="ts">
import type { GifDTO } from '@/api/types'
import VirtualMasonry from './VirtualMasonry.vue'

defineProps<{
  gifs: GifDTO[]
}>()

const emit = defineEmits<{
  (e: 'click', gif: GifDTO): void
}>()

const handleClick = (gif: GifDTO) => {
  emit('click', gif)
}
</script>

<template>
  <VirtualMasonry
    :items="gifs"
    :gap="16"
    :loading="false"
    :loading-more="false"
    @click="handleClick"
  />
</template>
