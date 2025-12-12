<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, watch } from 'vue'

defineOptions({
  name: 'HomeView',
})

import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'
import GifCard from '@/components/GifCard.vue'
import { getRandomGifListFirst, getRandomGifList, hotGifs, latestGifs } from '@/api/gif'
import { getGifsByTagId } from '@/api/tag'
import type { GifDTO } from '@/api/types'

const router = useRouter()
const gifs = ref<GifDTO[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const noMore = ref(false)
const searchQuery = ref('')
const sortType = ref<'random' | 'hot' | 'time'>('random')
const isSearchDisabled = ref(true) // 搜索栏是否禁用
const totalGifCount = ref<number>(0) // 随机模式下的总GIF数量

// Detail Modal State - REMOVED
// const selectedGif = ref<GifDTO | null>(null)
// const isModalOpen = ref(false)

// Search & Sort State
const selectedTags = ref<{ tagId: string | number; tagName: string }[]>([])

// Logic for creating fileUrl as per miniprogram
const processGifData = (list: GifDTO[]) => {
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
    let res: unknown

    // Determine which API to call based on state
    if (selectedTags.value.length > 0) {
      // Tag mode
      const tagId = selectedTags.value[0]?.tagId
      if (tagId) {
        res = await getGifsByTagId(tagId, 20)
      }
    } else {
      // 根据排序类型调用不同的接口
      switch (sortType.value) {
        case 'random':
          // 随机模式
          if (!isLoadMore) {
            res = await getRandomGifListFirst()
          } else {
            const lastId = gifs.value[gifs.value.length - 1]?.id
            if (lastId) res = await getRandomGifList(lastId)
          }
          break

        case 'hot':
          // 热度模式
          if (!isLoadMore) {
            res = await hotGifs({ pageSize: 20 })
          } else {
            const lastGif = gifs.value[gifs.value.length - 1]
            res = await hotGifs({
              pageSize: 20,
              lastViewCount: lastGif?.viewCount,
              lastId: lastGif?.id as number,
            })
          }
          break

        case 'time':
          // 时间模式
          if (!isLoadMore) {
            res = await latestGifs({ pageSize: 20 })
          } else {
            const lastId = gifs.value[gifs.value.length - 1]?.id
            res = await latestGifs({
              pageSize: 20,
              lastId: lastId as number,
            })
          }
          break
      }
    }

    let rawList: GifDTO[]
    if (sortType.value === 'random' && res && typeof res === 'object' && 'data' in res) {
      const fullRes = res as { status: number; message: string; data: GifDTO[] }
      rawList = fullRes.data || []

      const match = fullRes.message?.match(/success:(\d+)/)
      if (match?.[1]) {
        totalGifCount.value = parseInt(match[1], 10)
      }
    } else {
      rawList = Array.isArray(res) ? res : (res as { data?: GifDTO[] })?.data || []
    }

    const processed = processGifData(rawList)

    if (!isLoadMore) {
      gifs.value = processed
    } else {
      gifs.value.push(...processed)
    }

    if (sortType.value === 'random') {
      if (totalGifCount.value > 0 && gifs.value.length > totalGifCount.value) {
        gifs.value = gifs.value.slice(0, totalGifCount.value)
      }
      if (totalGifCount.value > 0 && gifs.value.length >= totalGifCount.value) {
        noMore.value = true
      }
    } else {
      if (processed.length < 20) {
        noMore.value = true
      }
    }
  } catch (err: unknown) {
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
  // selectedGif.value = gif
  // isModalOpen.value = true
  router.push(`/gif/${gif.id}`)
}

// const handleCloseModal = () => {
//   isModalOpen.value = false
//   // Don't clear selectedGif immediately to allow fade out if we add transition
//   setTimeout(() => {
//     selectedGif.value = null
//   }, 200)
// }

const handleSearch = () => {
  // TODO: 实现搜索逻辑
  console.log('Search query:', searchQuery.value)
}

const handleSortChange = (type: 'random' | 'hot' | 'time') => {
  sortType.value = type

  // 根据排序类型设置搜索栏状态
  if (type === 'random') {
    isSearchDisabled.value = true
    searchQuery.value = '' // 切换到随机模式时清空搜索内容
  } else {
    isSearchDisabled.value = false
  }

  // 重新加载数据
  noMore.value = false // 重置加载更多状态
  fetchGifs(false)
}

// Sort Animation Logic
const sortBtnRefs = ref<HTMLElement[]>([])
const gliderStyle = ref({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: '0',
})

const updateGlider = async () => {
  await nextTick()
  const activeIndex = ['random', 'hot', 'time'].indexOf(sortType.value)
  const activeBtn = sortBtnRefs.value[activeIndex]

  if (activeBtn) {
    gliderStyle.value = {
      width: `${activeBtn.offsetWidth}px`,
      transform: `translateX(${activeBtn.offsetLeft}px)`,
      opacity: '1',
    }
  }
}

watch(sortType, () => {
  updateGlider()
})

// 合并所有 onMounted 逻辑到一个钩子中
onMounted(() => {
  // 初始化滑块位置
  updateGlider()
  // 添加滚动监听器
  window.addEventListener('scroll', handleScroll)
  // 加载数据（只调用一次）
  fetchGifs()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// KeepAlive 生命周期钩子
onActivated(() => {
  // 组件被激活时重新添加滚动监听器
  window.addEventListener('scroll', handleScroll)

  // 恢复所有视频的播放
  nextTick(() => {
    const videos = document.querySelectorAll('.home-view video')
    videos.forEach((video) => {
      const videoElement = video as HTMLVideoElement
      if (videoElement.paused) {
        videoElement.play().catch((err) => {
          console.log('Video play failed:', err)
        })
      }
    })
  })
})

onDeactivated(() => {
  // 组件被停用时移除滚动监听器
  window.removeEventListener('scroll', handleScroll)

  // 暂停所有视频以节省资源
  const videos = document.querySelectorAll('.home-view video')
  videos.forEach((video) => {
    const videoElement = video as HTMLVideoElement
    videoElement.pause()
  })
})
</script>

<template>
  <div class="home-view">
    <NavBar />

    <main class="main-content">
      <!-- Search Bar Section -->
      <section class="search-section container">
        <!-- Sort Options -->
        <!-- Sort Options (Gliding Segmented Control) -->
        <div class="sort-container-wrapper">
          <div class="sort-options">
            <div class="glider" :style="gliderStyle"></div>
            <button
              v-for="(type, index) in ['random', 'hot', 'time']"
              :key="type"
              :ref="
                (el) => {
                  if (el) sortBtnRefs[index] = el as HTMLElement
                }
              "
              :class="['sort-btn', { active: sortType === type }]"
              @click="handleSortChange(type as 'random' | 'hot' | 'time')"
            >
              <span class="btn-text">
                {{ type === 'random' ? '随机' : type === 'hot' ? '热度' : '时间' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Search Bar (隐藏在随机模式下) -->
        <div
          v-show="sortType !== 'random'"
          class="search-bar"
          :class="{ disabled: isSearchDisabled }"
        >
          <Search class="search-icon" :size="20" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for GIFs, Stickers..."
            :disabled="isSearchDisabled"
            @keyup.enter="handleSearch"
          />
        </div>
      </section>

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

    <!-- Detail Modal Removed -->
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

.search-section {
  padding: 2rem 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Modern Gliding Segmented Control */
.sort-container-wrapper {
  padding: 4px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 9999px;
  border: 1px solid rgba(255, 220, 120, 0.4);
  box-shadow:
    0 0 10px rgba(255, 220, 120, 0.3),
    0 0 20px rgba(255, 220, 120, 0.2),
    0 0 30px rgba(255, 220, 120, 0.1),
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  transition: box-shadow 0.3s ease;
}

.sort-container-wrapper:hover {
  box-shadow:
    0 0 15px rgba(255, 220, 120, 0.4),
    0 0 30px rgba(255, 220, 120, 0.3),
    0 0 45px rgba(255, 220, 120, 0.15),
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

:global(.dark) .sort-container-wrapper {
  background: rgba(20, 20, 20, 0.6);
  border-color: rgba(255, 220, 120, 0.3);
  box-shadow:
    0 0 10px rgba(255, 220, 120, 0.25),
    0 0 20px rgba(255, 220, 120, 0.15),
    0 0 30px rgba(255, 220, 120, 0.08),
    0 4px 20px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: box-shadow 0.3s ease;
}

:global(.dark) .sort-container-wrapper:hover {
  box-shadow:
    0 0 15px rgba(255, 220, 120, 0.35),
    0 0 30px rgba(255, 220, 120, 0.25),
    0 0 45px rgba(255, 220, 120, 0.12),
    0 4px 20px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.sort-options {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 9999px;
  padding: 4px; /* Space for the glider to move freely */
}

/* The Gliding Pill - Liquid Glass Effect */
.glider {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  background: linear-gradient(
    135deg,
    rgba(255, 220, 120, 0.25) 0%,
    rgba(255, 235, 170, 0.15) 50%,
    rgba(255, 220, 120, 0.25) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 9999px;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow:
    inset 0 1px 3px rgba(255, 220, 120, 0.3),
    inset 0 -1px 2px rgba(255, 235, 170, 0.2),
    0 2px 8px rgba(255, 220, 120, 0.15),
    0 0 0 1px rgba(255, 220, 120, 0.1);
  z-index: 1;
  pointer-events: none;
  animation: liquidFlow 3s ease-in-out infinite;
  overflow: hidden;
}

.glider::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 235, 170, 0.2) 50%,
    transparent 70%
  );
  animation: liquidShine 4s ease-in-out infinite;
  pointer-events: none;
}

:global(.dark) .glider {
  background: linear-gradient(
    135deg,
    rgba(255, 220, 120, 0.2) 0%,
    rgba(255, 235, 170, 0.1) 50%,
    rgba(255, 220, 120, 0.2) 100%
  );
  box-shadow:
    inset 0 1px 3px rgba(255, 220, 120, 0.4),
    inset 0 -1px 2px rgba(255, 235, 170, 0.3),
    0 2px 12px rgba(255, 220, 120, 0.25),
    0 0 0 1px rgba(255, 220, 120, 0.15);
}

@keyframes liquidFlow {
  0%,
  100% {
    background-position: 0% 50%;
    filter: hue-rotate(0deg);
  }
  50% {
    background-position: 100% 50%;
    filter: hue-rotate(5deg);
  }
}

@keyframes liquidShine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

/* Sort Buttons - No Background, Only Text Style */
.sort-btn {
  position: relative;
  z-index: 2;
  padding: 0.6rem 1.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;
  user-select: none;
  border-radius: 9999px;
  white-space: nowrap;
}

.sort-btn:hover {
  color: var(--color-text-main);
}

.sort-btn.active {
  color: #8b6914;
  font-weight: 700;
}

:global(.dark) .sort-btn.active {
  color: #ffd678;
}

.btn-text {
  position: relative;
  z-index: 2;
}

.search-bar {
  width: 100%;
  max-width: 600px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-bar input {
  width: 100%;
  height: 52px;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0 1.5rem 0 3.5rem;
  color: var(--color-text-main);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-bar input:focus {
  outline: none;
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.search-bar input::placeholder {
  color: var(--color-text-muted);
}

.search-bar.disabled input {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-surface);
}

.search-bar.disabled input:focus {
  border-color: var(--color-border);
  box-shadow: none;
}

.search-bar.disabled .search-icon {
  opacity: 0.5;
}

.feed {
  margin-top: 2rem;
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
