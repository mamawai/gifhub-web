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
  <div class="detail-view">
    <button class="back-btn" @click="handleBack">
      <ArrowLeft :size="24" />
    </button>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!gif" class="error">GIF not found</div>
    <div v-else class="content-wrapper">
      <!-- Top Section: Image and Info Side by Side -->
      <div class="top-section">
        <!-- Left: Visual Section -->
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

        <!-- Right: Info Section -->
        <div class="info-section">
          <!-- Header with User Info -->
          <div class="info-header">
            <div class="uploader-info">
              <div class="avatar">
                <User :size="20" />
              </div>
              <div class="meta">
                <span class="username">{{ gif.nickname || gif.giphyUsername || 'Anonymous' }}</span>
                <div class="date-source">
                  <span class="date">{{
                    new Date(gif.createdAt || Date.now()).toLocaleDateString()
                  }}</span>
                  <span v-if="gif.userId === '0'" class="giphy-badge">Powered by Giphy</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Title -->
          <div class="title-section">
            <h1 class="title">{{ gif.title || 'Untitled GIF' }}</h1>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              class="action-btn like-btn"
              :class="{ active: (gif as GifDTO & { isLiked?: boolean }).isLiked }"
              @click="handleLike"
            >
              <Heart
                :size="24"
                :fill="(gif as GifDTO & { isLiked?: boolean }).isLiked ? 'currentColor' : 'none'"
              />
              <span class="count">{{ gif.likeCount || 0 }}</span>
            </button>

            <button class="action-btn download-btn" @click="handleDownload">
              <Download :size="24" />
              <span class="count">{{ gif.downloadCount || 0 }}</span>
            </button>

            <button class="action-btn share-btn" @click="handleShare">
              <Share2 :size="24" />
            </button>

            <button class="action-btn collection-btn" @click="handleLike">
              <FolderPlus :size="24" />
            </button>
          </div>

          <!-- Stats Bar -->
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
        </div>
      </div>

      <!-- Bottom Section: Comments (Full Width) -->
      <div class="comments-section">
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
  min-height: 100vh;
  background-color: var(--color-background);
  padding-top: 80px;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
}

/* Top Section: Image and Info Side by Side */
.top-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .top-section {
    flex-direction: row;
    gap: 2rem;
    min-height: 400px;
  }
}

/* Left Section: Visual (50%) */
.visual-section {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--color-background);
  min-height: 400px;
  max-height: 400px;
}

@media (min-width: 1024px) {
  .visual-section {
    flex: 1;
    min-height: 400px;
    max-height: 400px;
  }
}

.gif-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow:
    0 4px 12px -2px rgba(0, 0, 0, 0.1),
    0 2px 6px -1px rgba(0, 0, 0, 0.06);
}

.main-gif {
  width: 100%;
  height: 100%;
  max-height: 400px;
  object-fit: contain;
}

/* Hide video controls */
.no-controls::-webkit-media-controls {
  display: none !important;
}
.no-controls::-webkit-media-controls-enclosure {
  display: none !important;
}

/* Right Section: Info (50%) */
.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow:
    0 4px 12px -2px rgba(0, 0, 0, 0.1),
    0 2px 6px -1px rgba(0, 0, 0, 0.06);
  max-height: 400px;
}

@media (min-width: 1024px) {
  .info-section {
    flex: 1;
    padding: 2rem;
  }
}

/* Header with User Info */
.info-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.uploader-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background: var(--color-surface-hover);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.username {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text-main);
}

.date-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.date {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.giphy-badge {
  font-size: 0.7rem;
  font-weight: 700;
  background: linear-gradient(45deg, #00ff99 0%, #00ccff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Title Section */
.title-section {
  margin-bottom: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text-main);
  word-wrap: break-word;
}

/* Action Buttons - Instagram/Twitter Style */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: var(--radius-md);
}

.action-btn:hover {
  background: var(--color-surface-hover);
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}

.count {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.like-btn.active {
  color: #ef4444;
}

.like-btn.active:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Bottom Section: Comments (Full Width) */
.comments-section {
  width: 100%;
  background: var(--color-background);
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

/* Loading & Error States */
.loading,
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  font-size: 1.25rem;
  color: var(--color-text-muted);
}

.error {
  color: #ef4444;
}

/* Back Button */
.back-btn {
  position: fixed;
  top: 100px;
  left: 1rem;
  z-index: 100;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow:
    0 4px 12px -2px rgba(0, 0, 0, 0.1),
    0 2px 6px -1px rgba(0, 0, 0, 0.06);
}

.back-btn:hover {
  background: var(--color-surface-hover);
  transform: translateX(-4px);
  box-shadow:
    0 6px 16px -2px rgba(0, 0, 0, 0.15),
    0 4px 8px -1px rgba(0, 0, 0, 0.08);
}

@media (min-width: 1024px) {
  .back-btn {
    left: 2rem;
  }
}

/* Dark Mode Adjustments */
:global(.dark) .gif-container {
  background: rgba(30, 30, 30, 0.8);
}

:global(.dark) .comments-section {
  background: rgba(20, 20, 20, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
