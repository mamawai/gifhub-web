<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getGifDetail,
  updateDownloadCount,
  updateViewCount,
  isLikeThis,
  likeOrDislike,
} from '@/api/gif'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { useLocaleStore } from '@/stores/locale'
import { useSettingsStore } from '@/stores/settings'
import { messages } from '@/locales/messages'
import CommentSection from '@/components/CommentSection.vue'
import AddToCollectionModal from '@/components/AddToCollectionModal.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { Heart, Download, Eye, Share2, ArrowLeft } from 'lucide-vue-next'
import type { GifDTO } from '@/api/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const localeStore = useLocaleStore()
const settingsStore = useSettingsStore()
const t = computed(() => messages[localeStore.locale].detail)

const gif = ref<GifDTO | null>(null)
const loading = ref(true)
const showCollectionModal = ref(false)
const isDownloading = ref(false)
const downloadProgress = ref(0)
const isLiked = ref(false)
const detailVideoRef = ref<HTMLVideoElement | null>(null)
const detailLoopCounter = ref(0)
const detailHasCompletedLoops = ref(false)

const isVideo = computed(() => {
  if (!gif.value?.url) return false
  return gif.value.url.toLowerCase().endsWith('.mp4')
})

const handleBack = () => {
  // window.history.state.back 是 Vue Router 4 在浏览器 history API 上注入的标记
  // 如果它存在，说明是在 App 内部发生过跳转
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    // 如果不存在，说明用户是直接打开的这个链接（落地页），直接回首页
    router.replace('/')
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
    // res is likely the raw DTO. Process it.
    if (res) {
      // If res is wrapped in data, unwrap it.
      const rawGif = (res as { data?: GifDTO }).data || res
      gif.value = processGifData(rawGif)

      // 更新浏览次数
      updateViewCount(id)

      // 检查用户是否已喜欢此GIF
      if (userStore.isLoggedIn) {
        await checkIsLiked(id)
      }
    }
  } catch (err) {
    console.error('Failed to load GIF', err)
  } finally {
    loading.value = false
  }
}

// 检查用户是否已喜欢此GIF
const checkIsLiked = async (fileId: string) => {
  try {
    const res = await isLikeThis({ fileId })
    console.log('DEBUG: isLikeThis response:', res, 'type:', typeof res)
    // request 拦截器已经解包了 res.data，所以 res 直接就是布尔值
    isLiked.value = res === true
    console.log('DEBUG: isLiked set to:', isLiked.value)
  } catch (err) {
    console.error('Failed to check like status', err)
  }
}

// 处理点赞/取消点赞
const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    appStore.showToast(t.value.pleaseLogin, 'warning')
    return
  }

  if (!gif.value?.id) return

  // 如果已经喜欢，直接取消点赞
  if (isLiked.value) {
    try {
      await likeOrDislike({ fileId: gif.value.id.toString(), isLike: false })
      isLiked.value = false
      gif.value.likeCount = Math.max((gif.value.likeCount || 0) - 1, 0)
      appStore.showToast(t.value.unliked, 'success')
    } catch (err) {
      console.error('Failed to unlike', err)
      appStore.showToast(t.value.operationFailed, 'error')
    }
  } else {
    // 如果未喜欢，打开收藏夹选择弹窗
    showCollectionModal.value = true
  }
}

const handleCollectionSuccess = () => {
  if (gif.value) {
    isLiked.value = true
    gif.value.likeCount = (gif.value.likeCount || 0) + 1
  }
}

const handleDownload = async () => {
  if (!gif.value) return

  if (isDownloading.value) {
    appStore.showToast(t.value.downloading, 'warning')
    return
  }

  try {
    isDownloading.value = true
    downloadProgress.value = 0

    // Get GIF URL
    let downloadUrl = ''
    if (gif.value.giphyId && gif.value.userId == '0') {
      downloadUrl = `https://i.giphy.com/${gif.value.giphyId}.gif`
    } else {
      downloadUrl = gif.value.url || ''
    }

    const toastId = appStore.showToast(t.value.downloading, 'info', 0)

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest()
    xhr.open('GET', downloadUrl, true)
    xhr.responseType = 'blob'

    let lastUpdate = 0
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        const now = Date.now()
        // Update every 500ms to avoid too many updates
        if (now - lastUpdate > 500 || progress === 100) {
          lastUpdate = now
          downloadProgress.value = progress
          appStore.updateToast(toastId, `下载中 ${progress}%`)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = (gif.value!.title || 'gifhub-download') + '.gif'
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()

        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(blobUrl)
        }, 100)

        updateDownloadCount(gif.value!.id!)
        gif.value!.downloadCount = (gif.value!.downloadCount || 0) + 1

        appStore.updateToast(toastId, t.value.downloadSuccess, 'success')
        setTimeout(() => appStore.removeToast(toastId), 3000)
      } else {
        appStore.updateToast(toastId, t.value.downloadFailed, 'error')
        setTimeout(() => appStore.removeToast(toastId), 3000)
      }
      isDownloading.value = false
      downloadProgress.value = 0
    }

    xhr.onerror = () => {
      appStore.updateToast(toastId, t.value.downloadFailed, 'error')
      setTimeout(() => appStore.removeToast(toastId), 3000)
      isDownloading.value = false
      downloadProgress.value = 0
    }

    xhr.send()
  } catch (error) {
    console.error('Download error', error)
    appStore.showToast(t.value.downloadFailed, 'error')
    isDownloading.value = false
    downloadProgress.value = 0
  }
}

const handleShare = async () => {
  try {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    appStore.showToast(t.value.linkCopied, 'success')
  } catch (error) {
    console.error('Copy error', error)
    appStore.showToast(t.value.copyFailed, 'error')
  }
}

// 详情页视频循环控制
const handleDetailVideoEnded = () => {
  const maxLoops = settingsStore.loopCount

  if (maxLoops === 'infinite') {
    detailVideoRef.value?.play()
  } else if (detailLoopCounter.value < maxLoops - 1) {
    detailLoopCounter.value++
    detailVideoRef.value?.play()
  } else {
    detailHasCompletedLoops.value = true
    detailLoopCounter.value = 0
  }
}

// 监听设置变化
watch(
  () => settingsStore.loopCount,
  () => {
    detailLoopCounter.value = 0
    detailHasCompletedLoops.value = false
    if (detailVideoRef.value) {
      detailVideoRef.value.currentTime = 0
      detailVideoRef.value.play().catch(() => {})
    }
  },
)

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="detail-view">
    <!-- Detail Page Header Bar -->
    <div class="detail-header">
      <div class="header-content">
        <button class="back-btn-inline" @click="handleBack">
          <ArrowLeft :size="20" />
        </button>
        <router-link to="/" class="logo">
          <span class="aurora-text">GifHub</span>
        </router-link>
        <div class="spacer"></div>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t.loading }}</div>
    <div v-else-if="!gif" class="error">{{ t.notFound }}</div>
    <div v-else class="content-wrapper">
      <!-- Top Section: Image and Info Side by Side -->
      <div class="top-section">
        <!-- Left: Visual Section -->
        <div class="visual-section">
          <div class="gif-container">
            <video
              v-if="isVideo"
              ref="detailVideoRef"
              :src="gif.url"
              autoplay
              muted
              playsinline
              disablePictureInPicture
              class="main-gif no-controls"
              oncontextmenu="return false;"
              @ended="handleDetailVideoEnded"
            ></video>
            <img v-else :src="gif.url" :alt="gif.title" class="main-gif" />
          </div>
        </div>

        <!-- Right: Info Section -->
        <div class="info-section">
          <!-- Header with User Info -->
          <div class="info-header">
            <div class="uploader-info">
              <UserAvatar :nickname="gif.nickname || gif.giphyUsername || t.anonymous" :size="40" />
              <div class="meta">
                <span class="username">{{ gif.nickname || gif.giphyUsername || t.anonymous }}</span>
                <div class="date-source">
                  <span class="date">{{
                    new Date(gif.createdAt || Date.now()).toLocaleDateString()
                  }}</span>
                  <span v-if="gif.userId === '0'" class="giphy-badge">{{ t.poweredByGiphy }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Title -->
          <div class="title-section">
            <h1 class="title">{{ gif.title || t.untitled }}</h1>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="action-btn like-btn" :class="{ active: isLiked }" @click="handleLike">
              <Heart :size="24" :fill="isLiked ? 'currentColor' : 'none'" />
              <span class="count">{{ gif.likeCount || 0 }}</span>
            </button>

            <button class="action-btn download-btn" @click="handleDownload">
              <Download :size="24" />
              <span class="count">{{ gif.downloadCount || 0 }}</span>
            </button>

            <button class="action-btn share-btn" @click="handleShare">
              <Share2 :size="24" />
            </button>
          </div>

          <!-- Stats Bar -->
          <div class="stats-bar">
            <div class="stat">
              <Eye :size="18" />
              <span>{{ gif.viewCount || 0 }} {{ t.views }}</span>
            </div>
            <div class="stat">
              <Download :size="18" />
              <span>{{ gif.downloadCount || 0 }} {{ t.downloads }}</span>
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
  padding-top: 72px;
  overflow-x: hidden;
}

/* Detail Page Header */
.detail-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

:global(.dark) .detail-header {
  background: rgba(9, 9, 11, 0.8);
}

.header-content {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

@media (min-width: 768px) {
  .header-content {
    padding: 0 2rem;
  }
}

.back-btn-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn-inline:hover {
  background: var(--color-surface-hover);
  transform: translateX(-2px);
}

.logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-decoration: none;
  transition: transform 0.3s ease;
  z-index: 10;
}

.logo:hover {
  transform: translateX(-50%) scale(1.05);
}

.aurora-text {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  background: linear-gradient(
    90deg,
    #9933ff 0%,
    #ff6666 25%,
    #ffaa00 50%,
    #ff6666 75%,
    #9933ff 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: aurora-flow 4s linear infinite;
  filter: drop-shadow(0 0 20px rgba(153, 51, 255, 0.6));
}

@keyframes aurora-flow {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

.spacer {
  width: 40px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .aurora-text {
    font-size: 1.25rem;
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .content-wrapper {
    padding: 2rem;
    gap: 2rem;
  }
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

@media (min-width: 1024px) {
  .gif-container {
    height: 100%;
  }
}

.main-gif {
  width: 100%;
  height: auto;
  max-width: 100%;
  object-fit: contain;
}

@media (min-width: 1024px) {
  .main-gif {
    height: 100%;
    max-height: 400px;
  }
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
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow:
    0 4px 12px -2px rgba(0, 0, 0, 0.1),
    0 2px 6px -1px rgba(0, 0, 0, 0.06);
}

@media (min-width: 768px) {
  .comments-section {
    padding: 2rem;
  }
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

/* Dark Mode Adjustments */
:global(.dark) .gif-container {
  background: rgba(30, 30, 30, 0.8);
}

:global(.dark) .comments-section {
  background: rgba(20, 20, 20, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
