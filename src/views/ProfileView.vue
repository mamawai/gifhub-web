<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { useLocaleStore } from '@/stores/locale'
import { messages } from '@/locales/messages'
import {
  getUserGifs as getUserGifsApi,
  updateNickname as updateNicknameApi,
  deleteAccount as deleteAccountApi,
  getPublicKey,
} from '@/api/user'
import { getUserLikeList as getUserLikeListApi, getCategoryGifCount } from '@/api/gif'
import { getCategoryList } from '@/api/category'
import GifGrid from '@/components/GifGrid.vue'
import type { GifDTO, UserLikeVO } from '@/api/types'
import {
  Heart,
  Image as ImageIcon,
  Settings,
  Folder,
  Edit2,
  ArrowLeft,
  LogOut,
  Trash2,
} from 'lucide-vue-next'
import rsaEncrypt from '@/utils/encrypt'

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

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const localeStore = useLocaleStore()
const t = computed(() => messages[localeStore.locale].profile)
const activeTab = ref<'uploads' | 'likes'>('uploads')
const uploadedGifs = ref<GifDTO[]>([])
const uploadedGifsTotal = ref(0)
const likedGifs = ref<UserLikeVO[]>([])
const categories = ref<{ id: number; categoryName: string; count: number }[]>([])
const selectedCategoryId = ref<number | null>(null)
const loading = ref(false)
const loadingCategories = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const hasMore = ref(true)
const isEditingNickname = ref(false)
const newNickname = ref('')
const showSettingsMenu = ref(false)
const showDeleteAccountModal = ref(false)
const deletePassword = ref('')
const isDeleting = ref(false)
const totalLikedCount = ref(0)
const loadingLikedCount = ref(false)

// Detail Modal State REMOVED
// const selectedGif = ref<GifDTO | null>(null)
// const isModalOpen = ref(false)

const handleGifClick = (gif: GifDTO) => {
  // selectedGif.value = gif
  // isModalOpen.value = true
  router.push(`/gif/${gif.id}`)
}

// const handleCloseModal = () => {
//   isModalOpen.value = false
//   setTimeout(() => {
//     selectedGif.value = null
//   }, 200)
// }

// 处理 GIF 数据，确保 URL 正确
const processGifData = (gif: GifDTO) => {
  // Giphy GIF 处理
  if (gif.giphyId && gif.userId == '0') {
    return {
      ...gif,
      url: `https://i.giphy.com/${gif.giphyId}.mp4`,
      fileUrl: `https://i.giphy.com/${gif.giphyId}.mp4`,
    }
  }
  return {
    ...gif,
    url: gif.fileUrl || gif.url || gif.giphyId,
  }
}

const fetchUploads = async () => {
  loading.value = true
  try {
    const res = await getUserGifsApi({ pageNum: 1, pageSize: 50 })
    const list =
      (res as { data?: GifDTO[] })?.data ||
      (Array.isArray(res) ? res : [])
    uploadedGifs.value = list.map(processGifData)

    // 从 message 中解析 total（格式：success:123）
    const message = (res as { message?: string })?.message || ''
    const match = message.match(/success:(\d+)/)
    if (match) {
      uploadedGifsTotal.value = parseInt(match[1], 10)
    } else {
      uploadedGifsTotal.value = list.length
    }
  } catch (err) {
    console.error('Fetch uploads failed', err)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const res = await getCategoryList()
    categories.value =
      (res as { records?: typeof categories.value })?.records || (Array.isArray(res) ? res : [])

    // 批量查询收藏数量（每次5个）
    if (categories.value.length > 0) {
      fetchTotalLikedCount()
    }
  } catch (err) {
    console.error('Fetch categories failed', err)
  } finally {
    loadingCategories.value = false
  }
}

// 批量查询收藏总数（每次5个分类）
const fetchTotalLikedCount = async () => {
  const categoryIds = categories.value.map((c) => c.id)
  const batchSize = 5
  let total = 0

  loadingLikedCount.value = true
  try {
    for (let i = 0; i < categoryIds.length; i += batchSize) {
      const batch = categoryIds.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map((id) =>
          getCategoryGifCount(id)
            .then((count) => ({ id, count: Number(count) || 0 }))
            .catch(() => ({ id, count: 0 }))
        )
      )
      // 更新每个分类的 count
      results.forEach(({ id, count }) => {
        const cat = categories.value.find((c) => c.id === id)
        if (cat) {
          cat.count = count
        }
        total += count
      })
    }
    totalLikedCount.value = total
  } finally {
    loadingLikedCount.value = false
  }
}

const fetchLikesByCategory = async (categoryId: number, isLoadMore = false) => {
  loading.value = true
  if (!isLoadMore) {
    selectedCategoryId.value = categoryId
    currentPage.value = 1
    likedGifs.value = []
    hasMore.value = true
  }

  try {
    const res = await getUserLikeListApi({
      categoryId,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })
    const list =
      (res as { records?: UserLikeVO[]; data?: UserLikeVO[] })?.records ||
      (res as { records?: UserLikeVO[]; data?: UserLikeVO[] })?.data ||
      (Array.isArray(res) ? res : [])

    const processedList = list.map((item) => {
      const processed = processGifData(item)
      return {
        ...processed,
        userLikeTime: item.userLikeTime,
      } as unknown as UserLikeVO
    })

    if (isLoadMore) {
      likedGifs.value = [...likedGifs.value, ...processedList]
    } else {
      likedGifs.value = processedList
    }

    // 判断是否还有更多数据
    hasMore.value = list.length === pageSize.value
    if (hasMore.value) {
      currentPage.value++
    }
  } catch (err) {
    console.error('Fetch likes failed', err)
  } finally {
    loading.value = false
  }
}

// 加载更多点赞的 GIF
const loadMoreLikes = () => {
  if (selectedCategoryId.value && hasMore.value && !loading.value) {
    fetchLikesByCategory(selectedCategoryId.value, true)
  }
}

// 按日期分组点赞的 GIF
const groupedLikedGifs = computed(() => {
  const groups: { date: string; gifs: UserLikeVO[] }[] = []
  const dateMap = new Map<string, UserLikeVO[]>()

  likedGifs.value.forEach((gif) => {
    // 提取日期部分（只到天）
    const dateStr =
      gif.userLikeTime.split('T')[0] || gif.userLikeTime.split(' ')[0] || gif.userLikeTime
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, [])
    }
    dateMap.get(dateStr)!.push(gif)
  })

  // 转换为数组并按日期降序排序
  dateMap.forEach((gifs, date) => {
    groups.push({ date, gifs })
  })

  groups.sort((a, b) => b.date.localeCompare(a.date))

  return groups
})

// 格式化日期显示
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

const switchTab = (tab: 'uploads' | 'likes') => {
  activeTab.value = tab
  if (tab === 'uploads' && uploadedGifs.value.length === 0) fetchUploads()
  if (tab === 'likes' && categories.value.length === 0) fetchCategories()
}

const startEditNickname = () => {
  newNickname.value = userStore.userInfo?.nickname || ''
  isEditingNickname.value = true
}

const cancelEditNickname = () => {
  isEditingNickname.value = false
  newNickname.value = ''
}

const saveNickname = async () => {
  if (!newNickname.value.trim()) return
  try {
    await updateNicknameApi({ nickname: newNickname.value.trim() })
    await userStore.fetchUserInfo()
    isEditingNickname.value = false
    appStore.showToast(t.value.nicknameUpdated, 'success')
  } catch (err) {
    const error = err as { response?: { message?: string }; message?: string }
    const message = error?.response?.message || error?.message || t.value.updateNicknameFailed
    appStore.showToast(message, 'error')
    console.error('Update nickname failed', err)
  }
}

// 计算入驻天数
const daysJoined = computed(() => {
  if (!userStore.userInfo?.createTime) return 0
  const start = new Date(userStore.userInfo.createTime)
  const today = new Date()
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
})

// 格式化加入日期
const joinDate = computed(() => {
  if (!userStore.userInfo?.createTime) return ''
  const date = new Date(userStore.userInfo.createTime)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const handleLogout = async () => {
  try {
    await userStore.logout()
    appStore.showToast(t.value.loggedOut, 'success')
    router.push('/login')
  } catch (err) {
    const error = err as { response?: { message?: string }; message?: string }
    const message = error?.response?.message || error?.message || t.value.logoutFailed
    appStore.showToast(message, 'error')
  }
  showSettingsMenu.value = false
}

const openDeleteAccountModal = () => {
  showSettingsMenu.value = false
  showDeleteAccountModal.value = true
}

const closeDeleteAccountModal = () => {
  showDeleteAccountModal.value = false
  deletePassword.value = ''
}

const confirmDeleteAccount = async () => {
  if (!deletePassword.value.trim()) {
    appStore.showToast(t.value.enterPassword, 'warning')
    return
  }

  isDeleting.value = true
  try {
    // 获取公钥并加密密码
    if (!rsaEncrypt.hasPublicKey()) {
      const publicKey = await getPublicKey()
      rsaEncrypt.setPublicKey(publicKey)
    }
    const encryptedPassword = rsaEncrypt.encryptPassword(deletePassword.value)
    if (!encryptedPassword) {
      throw new Error('密码加密失败')
    }

    await deleteAccountApi({ password: encryptedPassword as string })
    appStore.showToast(t.value.accountDeleted, 'success')
    await userStore.logout()
    router.push('/login')
  } catch (err) {
    const error = err as { response?: { message?: string }; message?: string }
    const message = error?.response?.message || error?.message || t.value.deleteAccountFailed
    appStore.showToast(message, 'error')
  } finally {
    isDeleting.value = false
    closeDeleteAccountModal()
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchUploads()
    fetchCategories()
  }
})
</script>

<template>
  <div class="profile-view">
    <!-- Profile Page Header -->
    <div class="profile-header-bar">
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

    <!-- Hero Banner -->
    <div class="profile-hero">
      <div class="hero-overlay"></div>
      <div class="hero-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
      </div>
    </div>

    <div class="container profile-content">
      <!-- Identity Card -->
      <div class="identity-card glass-panel">
        <div class="profile-header">
          <div class="avatar-large">
            <span class="avatar-placeholder">{{
              userStore.userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U'
            }}</span>
            <div class="avatar-glow"></div>
          </div>

          <div class="user-info">
            <div class="nickname-container">
              <h1 v-if="!isEditingNickname" class="nickname">
                {{ userStore.userInfo?.nickname || 'Guest' }}
              </h1>
              <input
                v-else
                v-model="newNickname"
                class="nickname-input"
                type="text"
                maxlength="20"
                @keyup.enter="saveNickname"
                @keyup.esc="cancelEditNickname"
              />
              <button
                v-if="!isEditingNickname"
                class="edit-nickname-btn"
                @click="startEditNickname"
              >
                <Edit2 :size="16" />
              </button>
              <div v-else class="edit-actions">
                <button class="save-btn" @click="saveNickname">{{ t.save }}</button>
                <button class="cancel-btn" @click="cancelEditNickname">{{ t.cancel }}</button>
              </div>
            </div>
            <p class="email">{{ userStore.userInfo?.email }}</p>
          </div>

          <div class="settings-wrapper">
            <button class="settings-btn glass-button" @click="showSettingsMenu = !showSettingsMenu">
              <Settings :size="20" />
            </button>
            <transition name="fade">
              <div v-if="showSettingsMenu" class="settings-menu glass-panel">
                <button class="menu-item" @click="handleLogout">
                  <LogOut :size="18" />
                  <span>{{ t.logout }}</span>
                </button>
                <button class="menu-item danger" @click="openDeleteAccountModal">
                  <Trash2 :size="18" />
                  <span>{{ t.deleteAccount }}</span>
                </button>
              </div>
            </transition>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value">{{ uploadedGifsTotal }}</div>
            <div class="stat-label">{{ t.myMasterpieces }}</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">
              <span v-if="loadingLikedCount" class="stat-spinner"></span>
              <span v-else>{{ totalLikedCount }}</span>
            </div>
            <div class="stat-label">{{ t.collections }}</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">{{ daysJoined }}</div>
            <div class="stat-label">{{ t.daysJoined }}</div>
            <div v-if="joinDate" class="stat-date">{{ joinDate }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="profile-tabs-wrapper">
        <div class="tabs-slider glass-panel">
          <div
            class="tab-active-indicator"
            :style="{
              transform: activeTab === 'uploads' ? 'translateX(0)' : 'translateX(100%)',
            }"
          ></div>
          <button
            class="tab-trigger"
            :class="{ active: activeTab === 'uploads' }"
            @click="switchTab('uploads')"
          >
            <ImageIcon :size="18" />
            <span>{{ t.myUploads }}</span>
          </button>
          <button
            class="tab-trigger"
            :class="{ active: activeTab === 'likes' }"
            @click="switchTab('likes')"
          >
            <Heart :size="18" />
            <span>{{ t.likes }}</span>
          </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <transition name="fade-up" mode="out-in">
        <div :key="activeTab" class="content-area">
          <!-- Uploads Tab -->
          <div v-if="activeTab === 'uploads'">
            <div v-if="loading" class="loading-container">
              <div class="spinner"></div>
            </div>
            <GifGrid
              v-else-if="uploadedGifs.length > 0"
              :gifs="uploadedGifs"
              @click="handleGifClick"
            />
            <div v-else class="empty-state glass-panel">
              <div class="empty-icon">🚀</div>
              <h3>{{ t.emptyUploads }}</h3>
              <p>{{ t.emptyUploadsDesc }}</p>
              <button class="btn-primary" @click="router.push('/')">{{ t.goToHome }}</button>
            </div>
          </div>

          <!-- Likes Tab -->
          <div v-if="activeTab === 'likes'">
            <!-- Category List -->
            <div v-if="!selectedCategoryId" class="category-section">
              <div v-if="loadingCategories" class="loading-container">
                <div class="spinner"></div>
              </div>
              <div v-else-if="categories.length === 0" class="empty-state glass-panel">
                <div class="empty-icon">✨</div>
                <h3>{{ t.noCollections }}</h3>
                <p>{{ t.noCollectionsDesc }}</p>
              </div>
              <div v-else class="category-grid">
                <div
                  v-for="cat in categories"
                  :key="cat.id"
                  class="category-card glass-panel"
                  @click="fetchLikesByCategory(cat.id)"
                >
                  <div class="cat-icon-wrapper">
                    <Folder :size="32" class="category-icon" />
                  </div>
                  <h3 class="category-name">{{ cat.categoryName }}</h3>
                  <p class="category-count">{{ cat.count || 0 }}</p>
                </div>
              </div>
            </div>

            <!-- GIF List for Selected Category -->
            <div v-else>
              <div class="category-header">
                <button class="back-link" @click="selectedCategoryId = null">
                  <ArrowLeft :size="18" />
                  {{ t.backToCollections }}
                </button>
                <h2 class="selected-category-title">
                  {{ categories.find((c) => c.id === selectedCategoryId)?.categoryName }}
                </h2>
              </div>
              <div v-if="loading && currentPage === 1" class="loading-container">
                <div class="spinner"></div>
              </div>
              <div v-else-if="groupedLikedGifs.length > 0" class="grouped-gifs-container">
                <div v-for="group in groupedLikedGifs" :key="group.date" class="date-group">
                  <h3 class="date-header">{{ formatDate(group.date) }}</h3>
                  <GifGrid :gifs="group.gifs as unknown as GifDTO[]" @click="handleGifClick" />
                </div>
                <div v-if="hasMore" class="load-more-container">
                  <button v-if="!loading" class="btn-load-more glass-button" @click="loadMoreLikes">
                    {{ t.loadMore }}
                  </button>
                  <div v-else class="loading-container">
                    <div class="spinner"></div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state glass-panel">
                <p>{{ t.emptyCategory }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Delete Account Modal -->
    <transition name="modal">
      <div v-if="showDeleteAccountModal" class="modal-overlay" @click="closeDeleteAccountModal">
        <div class="modal-content glass-panel" @click.stop>
          <h2 class="modal-title">{{ t.deleteAccountTitle }}</h2>
          <p class="modal-warning">
            {{ t.deleteAccountWarning }}
          </p>
          <div class="modal-form">
            <label class="form-label">{{ t.enterPassword }}</label>
            <input
              v-model="deletePassword"
              type="password"
              class="form-input"
              :placeholder="t.enterPassword"
              @keyup.enter="confirmDeleteAccount"
            />
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeDeleteAccountModal" :disabled="isDeleting">
              {{ t.cancel }}
            </button>
            <button class="btn-danger" @click="confirmDeleteAccount" :disabled="isDeleting">
              {{ isDeleting ? t.deleting : t.confirmDelete }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100vh;
  background: var(--color-background);
  padding-top: 72px;
  padding-bottom: 4rem;
}

/* Profile Page Header */
.profile-header-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--color-border);
}

:global(.dark) .profile-header-bar {
  background: rgba(26, 26, 30, 0.95);
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
    #ff6666 50%,
    #9933ff 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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

/* Hero Section */
.profile-hero {
  height: 320px;
  width: 100%;
  position: relative;
  background: var(--gradient-primary);
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, var(--color-background));
  z-index: 1;
}

.hero-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: var(--color-accent);
  top: -100px;
  left: -50px;
  filter: blur(60px);
}

.shape-2 {
  width: 400px;
  height: 400px;
  background: var(--color-primary);
  bottom: -150px;
  right: -100px;
  filter: blur(60px);
}

/* Content Container & Cards */
.profile-content {
  margin-top: -120px;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.identity-card {
  padding: 2.5rem 2.5rem 1.5rem;
  border-radius: var(--radius-xl);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  margin-bottom: 2.5rem;
}

.avatar-large {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--color-primary);
  position: relative;
  box-shadow: var(--shadow-lg);
  flex-shrink: 0;
}

.avatar-glow {
  position: absolute;
  inset: -5px;
  background: var(--gradient-primary);
  border-radius: calc(var(--radius-xl) + 5px);
  z-index: -1;
  opacity: 0.3;
  filter: blur(10px);
}

.user-info {
  flex: 1;
}

.nickname-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.nickname {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0;
}

.nickname-input {
  font-size: 2rem;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-main);
  outline: none;
  max-width: 300px;
}

.edit-nickname-btn {
  padding: 0.5rem;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-muted);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-nickname-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-primary);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.save-btn {
  background: var(--color-primary);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  background: var(--color-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}

.cancel-btn:hover {
  background: var(--color-surface-hover);
}

.email {
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.settings-wrapper {
  position: relative;
}

.settings-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.settings-btn:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.settings-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.settings-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 180px;
  padding: 0.5rem;
  border-radius: var(--radius-lg);
  z-index: 100;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  color: var(--color-text-main);
  font-weight: 500;
  transition: all 0.2s;
  text-align: left;
}

.menu-item:hover {
  background: var(--color-surface-hover);
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  max-width: 450px;
  width: 100%;
  padding: 2rem;
  border-radius: var(--radius-xl);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.modal-warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.modal-form {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text-main);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-main);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary,
.btn-danger {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* Stats */
.stats-row {
  display: flex;
  align-items: flex-start;
  gap: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border-glass);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.2rem;
}

.stat-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-surface-hover);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-date {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-top: 0.25rem;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border-glass);
}

/* Tabs Redesign */
.profile-tabs-wrapper {
  display: flex;
  justify-content: center;
}

.tabs-slider {
  display: flex;
  padding: 4px;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  position: relative;
  overflow: hidden;
}

.tab-active-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  width: calc(50% - 4px);
  background: var(--color-surface);
  border-radius: 12px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-sm);
}

.tab-trigger {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.8rem;
  font-weight: 700;
  color: var(--color-text-muted);
  z-index: 1;
  transition: color 0.3s;
}

.tab-trigger.active {
  color: var(--color-primary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  border-radius: var(--radius-xl);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  box-shadow: var(--shadow-glow);
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

/* Category Grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.category-card {
  padding: 2.5rem 1.5rem;
  border-radius: var(--radius-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.category-card:hover {
  transform: translateY(-8px);
  background: var(--color-surface);
  border-color: var(--color-primary);
}

.cat-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--color-surface);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: var(--color-primary);
  transition: transform 0.3s;
}

.category-card:hover .cat-icon-wrapper {
  transform: rotate(10deg) scale(1.1);
}

.category-name {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

/* Date Group Styles */
.grouped-gifs-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.date-header {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-main);
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border);
  margin: 0;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.btn-load-more {
  padding: 0.75rem 2rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  color: var(--color-primary);
  transition: all 0.2s;
  cursor: pointer;
}

.btn-load-more:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.category-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  width: fit-content;
}

.back-link:hover {
  color: var(--color-primary);
}

.selected-category-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}

/* Transitions */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.4s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-surface);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .profile-hero {
    height: 200px;
  }

  .profile-content {
    margin-top: -80px;
  }

  .identity-card {
    padding: 1.5rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .avatar-large {
    width: 90px;
    height: 90px;
    font-size: 2.5rem;
  }

  .settings-wrapper {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .settings-btn {
    position: static;
  }

  .nickname-container {
    justify-content: center;
    flex-wrap: wrap;
  }

  .nickname {
    font-size: 1.8rem;
  }

  .nickname-input {
    font-size: 1.5rem;
    max-width: 200px;
  }

  .edit-nickname-btn {
    order: 1;
  }

  .email {
    font-size: 0.95rem;
  }

  .stats-row {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    padding-top: 1.5rem;
  }

  .stat-divider {
    display: none;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-date {
    font-size: 0.7rem;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .category-card {
    padding: 1.5rem 1rem;
  }

  .cat-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .category-name {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .identity-card {
    padding: 1rem;
  }

  .avatar-large {
    width: 70px;
    height: 70px;
    font-size: 2rem;
  }

  .nickname {
    font-size: 1.5rem;
  }

  .nickname-input {
    font-size: 1.25rem;
    max-width: 150px;
  }

  .edit-actions {
    width: 100%;
    margin-top: 0.5rem;
  }

  .save-btn,
  .cancel-btn {
    flex: 1;
  }

  .email {
    font-size: 0.85rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}
</style>
