<script setup lang="ts">
import type { GifDTO } from '@/api/types'
import GifCard from './GifCard.vue'

defineProps<{
  gifs: GifDTO[]
}>()

const emit = defineEmits<{
  (e: 'click', gif: GifDTO): void
}>()
</script>

<template>
  <div class="masonry-grid">
    <GifCard
      v-for="(gif, index) in gifs"
      :key="gif.id || index"
      :gif="gif"
      @click="emit('click', gif)"
    />
  </div>
</template>

<style scoped>
.masonry-grid {
  column-count: 2;
  column-gap: 1rem;
}

@media (min-width: 640px) {
  .masonry-grid {
    column-count: 3;
    column-gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .masonry-grid {
    column-count: 4;
    column-gap: 2rem;
  }
}

@media (min-width: 1280px) {
  .masonry-grid {
    column-count: 5;
  }
}
</style>
