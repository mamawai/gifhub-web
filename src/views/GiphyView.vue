<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import GifCard from '@/components/GifCard.vue'
import { getTrending, search } from '@/api/giphy'
import type { GiphyGifVO } from '@/api/giphy-types'
import type { GifDTO } from '@/api/types'
import { Search } from 'lucide-vue-next'

const gifs = ref<GifDTO[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const offset = ref(0)
const limit = 20
const hasMore = ref(true)

const mode = ref<'trending' | 'search'>('trending')
const searchQuery = ref('')
const activeQuery = ref('') // The query currently being displayed

// Mapper function
const mapGiphyToGifDTO = (giphyGif: GiphyGifVO): GifDTO => {
  return {
    id: giphyGif.id, // using giphy id as id
    giphyId: giphyGif.id,
    title: giphyGif.title,
    width: parseInt(giphyGif.images.original.width),
    height: parseInt(giphyGif.images.original.height),
    fileUrl: `https://i.giphy.com/${giphyGif.id}.mp4`,
    giphyUsername: giphyGif.username,
    source: giphyGif.source,
    userId: '0', // Indicate it's external/giphy
  }
}

const fetchGifs = async (isLoadMore = false) => {
  if (loadingMore.value) return
  if (!isLoadMore) {
    loading.value = true
    error.value = ''
    offset.value = 0 // Reset offset on new fetch
  } else {
    loadingMore.value = true
  }

  try {
    let res
    if (mode.value === 'trending') {
      res = await getTrending(limit, offset.value)
    } else {
      if (!activeQuery.value) {
        loading.value = false
        return
      }
      res = await search(activeQuery.value, limit, offset.value)
    }

    const newGifs = (res.data || []).map(mapGiphyToGifDTO)

    if (!isLoadMore) {
      gifs.value = newGifs
    } else {
      gifs.value.push(...newGifs)
    }

    // Check if we have more
    if (res.pagination) {
      hasMore.value = offset.value + res.pagination.count < res.pagination.total_count
      offset.value += res.pagination.count
    } else {
      // Fallback if pagination missing, assume valid if full limit returned
      hasMore.value = newGifs.length === limit
      offset.value += limit
    }
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load GIFs'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) {
    mode.value = 'trending'
    activeQuery.value = ''
    fetchGifs()
    return
  }

  mode.value = 'search'
  activeQuery.value = query
  fetchGifs()
}

const handleScroll = () => {
  const bottomOfWindow =
    document.documentElement.scrollTop + window.innerHeight >=
    document.documentElement.offsetHeight - 200

  if (bottomOfWindow && hasMore.value && !loading.value && !loadingMore.value) {
    fetchGifs(true)
  }
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
  <div class="giphy-view">
    <NavBar />

    <main class="main-content">
      <div class="giphy-header container">
        <h1 class="page-title">
          {{ mode === 'trending' ? 'Trending on GIPHY' : `Results for "${activeQuery}"` }}
        </h1>

        <div class="search-container">
          <div class="input-wrapper">
            <Search class="search-icon" :size="20" />
            <input
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Search GIPHY..."
              type="text"
            />
          </div>
        </div>
      </div>

      <section class="feed container">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="error" class="error-state">
          {{ error }}
          <button @click="fetchGifs(false)">Retry</button>
        </div>

        <div v-else-if="gifs.length === 0" class="empty-state">No GIFs found.</div>

        <div v-else class="masonry-grid">
          <GifCard v-for="gif in gifs" :key="gif.id" :gif="gif" />
        </div>

        <div v-if="loadingMore" class="loading-more">
          <div class="spinner small"></div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.giphy-view {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-background);
}

.main-content {
  padding-top: 80px;
  min-height: 100vh;
}

.giphy-header {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  text-align: center;
  background: linear-gradient(135deg, #00ff99 0%, #00ccff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  /* Add a subtle glow/shadow if needed for "cool" factor */
}

/* Custom Search Bar for Giphy Page */
.search-container {
  width: 100%;
  max-width: 600px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  height: 50px;
  background: var(--color-surface);
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  padding: 0 1rem 0 3rem;
  color: var(--color-text-main);
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.input-wrapper input:focus {
  outline: none;
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

/* Reuse Grid Styles */
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
.loading-more,
.empty-state {
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
