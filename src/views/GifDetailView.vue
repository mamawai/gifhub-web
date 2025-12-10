<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGifDetail, updateDownloadCount } from '@/api/gif'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import CommentSection from '@/components/CommentSection.vue'
import AddToCollectionModal from '@/components/AddToCollectionModal.vue'
import { Heart, Download, Eye, Share2, User, ArrowLeft, FolderPlus } from 'lucide-vue-next'
import type { GifDTO } from '@/api/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const gif = ref<GifDTO | null>(null)
const loading = ref(true)
const showCollectionModal = ref(false)

const isVideo = computed(() => {
  if (!gif.value?.url) return false
  return gif.value.url.toLowerCase().endsWith('.mp4')
})

const handleBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

// Logic for creating fileUrl as per miniprogram
const processGifData = (gif: GifDTO) => {
  // Use loose equality to match both string '0' and number 0
  if (gif.giphyId && gif.userId == '0') {
    return {
      ...gif,
      url: `https://i.giphy.com/${gif.giphyId}.mp4`, // Use 'url' as main display property
      fileUrl: `https://i.giphy.com/${gif.giphyId}.mp4`,
    }
  }
  return {
    ...gif,
    // Ensure url is set if missing, using fileUrl or previous url
    url: gif.fileUrl || gif.url || gif.giphyId,
  }
}

const fetchDetail = async () => {
  const id = route.params.id as string
  if (!id) return

  loading.value = true
  try {
    const res = await getGifDetail(id)
    console.log('DEBUG: getGifDetail raw response:', res) // Debug log
    // res is likely the raw DTO. Process it.
    if (res) {
      // If res is wrapped in data, unwrap it.
      const rawGif = (res as { data?: GifDTO }).data || res
      gif.value = processGifData(rawGif)
    }
  } catch (err) {
    console.error('Failed to load GIF', err)
  } finally {
    loading.value = false
  }
}

// Open Collection Modal
const handleLike = () => {
  if (!userStore.isLoggedIn) {
    appStore.showToast('Please login to collect', 'warning')
    return
  }
  showCollectionModal.value = true
}

const handleCollectionSuccess = () => {
  if (gif.value) {
    ;(gif.value as GifDTO & { isLiked?: boolean }).isLiked = true // Visually mark as liked/collected
    gif.value.likeCount = (gif.value.likeCount || 0) + 1
  }
}

const handleDownload = async () => {
  if (!gif.value?.url) return

  try {
    // Trigger download
    const link = document.createElement('a')
    link.href = gif.value.url
    link.download = gif.value.title || 'gifhub-download.gif'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Update count
    await updateDownloadCount(gif.value.id!)
    gif.value.downloadCount = (gif.value.downloadCount || 0) + 1
  } catch (error) {
    console.error('Download error', error)
  }
}

const handleShare = async () => {
  try {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    appStore.showToast('链接已复制', 'success')
  } catch (error) {
    console.error('Copy error', error)
    appStore.showToast('复制失败，请重试', 'error')
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="detail-view container">
    <button class="back-btn" @click="handleBack">
      <ArrowLeft :size="24" />
    </button>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!gif" class="error">GIF not found</div>
    <div v-else class="content-wrapper">
      <!-- Left/Top: Visual -->
      <div class="visual-section">
        <div class="gif-container">
          <video
            v-if="isVideo"
            :src="gif.url"
            autoplay
            loop
            muted
            playsinline
            disablePictureInPicture
            class="main-gif no-controls"
            oncontextmenu="return false;"
          ></video>
          <img v-else :src="gif.url" :alt="gif.title" class="main-gif" />
        </div>
      </div>

      <!-- Right/Bottom: Info & Comments -->
      <div class="info-section">
        <h1 class="title">{{ gif.title || 'Untitled GIF' }}</h1>

        <div class="uploader-info">
          <div class="avatar">
            <User :size="20" />
          </div>
          <div class="meta">
            <span class="username">{{ gif.nickname || gif.giphyUsername || 'Anonymous' }}</span>
            <div class="date-source">
              <span class="date"
                >Posted on {{ new Date(gif.createdAt || Date.now()).toLocaleDateString() }}</span
              >
              <span v-if="gif.userId === '0'" class="giphy-badge">Powered by Giphy</span>
            </div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat">
            <Eye :size="18" />
            <span>{{ gif.viewCount || 0 }} views</span>
          </div>
          <div class="stat">
            <Download :size="18" />
            <span>{{ gif.downloadCount || 0 }} downloads</span>
          </div>
        </div>

        <div class="action-buttons">
          <button
            class="action-btn like-btn"
            :class="{ active: (gif as GifDTO & { isLiked?: boolean }).isLiked }"
            @click="handleLike"
          >
            <!-- Change Icon to Folder or Heart depending on preference, logic is 'Collect' now -->
            <FolderPlus :size="24" v-if="!(gif as GifDTO & { isLiked?: boolean }).isLiked" />
            <Heart :size="24" :fill="'currentColor'" v-else />
            <span>{{
              (gif as GifDTO & { isLiked?: boolean }).isLiked ? 'Collected' : 'Save to Collection'
            }}</span>
            <span class="count">{{ gif.likeCount || 0 }}</span>
          </button>

          <button class="action-btn download-btn" @click="handleDownload">
            <Download :size="24" />
            <span>Download</span>
          </button>

          <button class="action-btn share-btn" @click="handleShare">
            <Share2 :size="24" />
            <span>Share</span>
          </button>
        </div>

        <CommentSection :gif-id="gif.id!" />
      </div>
    </div>

    <AddToCollectionModal
      :is-open="showCollectionModal"
      :gif-id="gif?.id!"
      @close="showCollectionModal = false"
      @success="handleCollectionSuccess"
    />
  </div>
</template>

<style scoped>
.detail-view {
  padding-top: 100px;
  min-height: 100vh;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1.5fr 1fr;
    gap: 4rem;
  }
}

.visual-section {
  position: sticky;
  top: 100px;
}

.gif-container {
  background: var(--color-surface-glass);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-border-glass);
  box-shadow: var(--shadow-glass);
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-gif {
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
}

.uploader-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  background: var(--color-surface-hover);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 700;
  font-size: 1.1rem;
}

.date {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.stats-bar {
  display: flex;
  gap: 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  transition: all 0.2s;
  background: var(--color-surface-hover);
  color: var(--color-text-main);
}

.action-btn:hover {
  transform: translateY(-2px);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.like-btn.active {
  background: rgba(236, 72, 153, 0.15);
  color: var(--color-accent-pink);
}

.download-btn {
  background: var(--color-primary);
  color: white;
}

.download-btn:hover {
  background: var(--color-primary-hover);
}

.loading {
  text-align: center;
  padding: 4rem;
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

.date-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.giphy-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: white; /* Or brand color */
  background: linear-gradient(45deg, #00ff99 0%, #00ccff 100%);
  -webkit-background-clip: text;
  background-clip: text; /* Standard property */
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.back-btn {
  position: absolute;
  top: 80px;
  left: 1rem;
  z-index: 10;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--color-surface-hover);
  transform: translateX(-2px);
}

@media (min-width: 1024px) {
  .back-btn {
    left: 2rem;
  }
}
</style>
