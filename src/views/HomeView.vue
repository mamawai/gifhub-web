<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import NavBar from '@/components/NavBar.vue'
import GifCard from '@/components/GifCard.vue'
import GifDetailModal from '@/components/GifDetailModal.vue'
import { getRandomGifListFirst, getRandomGifList, type GifDTO } from '@/api/gif'
import { getGifsByTagId, tagPrefixSearch } from '@/api/tag'

const gifs = ref<GifDTO[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const noMore = ref(false)

// Detail Modal State
const selectedGif = ref<GifDTO | null>(null)
const isModalOpen = ref(false)

// Search & Sort State
const sortType = ref<'random' | 'hot' | 'time'>('random')
const searchKeyword = ref('')
const selectedTags = ref<{ tagId: string | number; tagName: string }[]>([])

// Logic for creating fileUrl as per miniprogram
const processGifData = (list: any[]) => {
  return list.map((gif) => {
    if (gif.giphyId && gif.userId === '0') {
      return {
        ...gif,
        fileUrl: `https://i.giphy.com/${gif.giphyId}.mp4`,
      }
    }
    return {
      ...gif,
      fileUrl: gif.giphyId,
    }
  })
}

// Fetch Logic
const fetchGifs = async (isLoadMore = false) => {
  if (isLoadMore && (loadingMore.value || noMore.value)) return
  if (!isLoadMore) loading.value = true
  else loadingMore.value = true

  try {
    let res: any

    // Determine which API to call based on state
    if (selectedTags.value.length > 0) {
      // Tag mode
      const tagId = selectedTags.value[0]?.tagId
      if (tagId) {
        res = await getGifsByTagId(tagId, 20)
      }
    } else {
      // Random mode
      if (!isLoadMore) {
        res = await getRandomGifListFirst()
      } else {
        const lastId = gifs.value[gifs.value.length - 1]?.id
        if (lastId) res = await getRandomGifList(lastId)
      }
    }

    const rawList = Array.isArray(res) ? res : res.data || []
    const processed = processGifData(rawList)

    if (!isLoadMore) {
      gifs.value = processed
    } else {
      gifs.value.push(...processed)
    }

    if (processed.length < 5) {
      // noMore.value = true
    }
  } catch (err: any) {
    console.error(err)
    error.value = 'Failed to load GIFs'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Scroll Handler
const handleScroll = () => {
  const bottomOfWindow =
    document.documentElement.scrollTop + window.innerHeight >=
    document.documentElement.offsetHeight - 200
  if (bottomOfWindow) {
    fetchGifs(true)
  }
}

// Interactions
const handleGifClick = (gif: GifDTO) => {
  selectedGif.value = gif
  isModalOpen.value = true
}

const handleCloseModal = () => {
  isModalOpen.value = false
  // Don't clear selectedGif immediately to allow fade out if we add transition
  setTimeout(() => {
    selectedGif.value = null
  }, 200)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  fetchGifs()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="home-view">
    <NavBar />

    <main class="main-content">
      <section class="hero" v-if="gifs.length < 1 && !loading">
        <h1 class="hero-title">Start Exploring</h1>
      </section>

      <section class="feed container">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="error" class="error-state">
          {{ error }}
          <button @click="fetchGifs(false)">Retry</button>
        </div>

        <div v-else class="masonry-grid">
          <GifCard
            v-for="(gif, index) in gifs"
            :key="gif.id || index"
            :gif="gif"
            @click="handleGifClick"
          />
        </div>

        <div v-if="loadingMore" class="loading-more">
          <div class="spinner small"></div>
        </div>
      </section>
    </main>

    <!-- Detail Modal -->
    <GifDetailModal
      v-if="selectedGif"
      :gif="selectedGif"
      :is-open="isModalOpen"
      @close="handleCloseModal"
    />
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-background);
}

.main-content {
  padding-top: 80px;
  min-height: 100vh;
}

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

.loading-state,
.loading-more {
  display: flex;
  justify-content: center;
  padding: 2rem;
  width: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-surface-hover);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
}

.spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  color: #ef4444;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-state button {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
}
</style>
