<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getUserGifs as getUserGifsApi } from '@/api/user' // Correct import
import { getUserLikeList as getUserLikeListApi } from '@/api/gif'
import GifGrid from '@/components/GifGrid.vue'
import type { GifDTO } from '@/api/types'
import { Heart, Image as ImageIcon, Settings } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref<'uploads' | 'likes'>('uploads')
const uploadedGifs = ref<GifDTO[]>([])
const likedGifs = ref<GifDTO[]>([])
const loading = ref(false)

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

const fetchUploads = async () => {
  loading.value = true
  try {
    const res = await getUserGifsApi({ pageNum: 1, pageSize: 50 })
    // Verify response structure again. api/user.ts calls request with baseUrl config.gifUrl, /gif/my.
    // Assuming backend returns { records: [] } or [] logic.
    const list =
      (res as { records?: GifDTO[]; data?: GifDTO[] })?.records ||
      (res as { records?: GifDTO[]; data?: GifDTO[] })?.data ||
      (Array.isArray(res) ? res : [])
    uploadedGifs.value = list
  } catch (err) {
    console.error('Fetch uploads failed', err)
  } finally {
    loading.value = false
  }
}

const fetchLikes = async () => {
  loading.value = true
  try {
    // categoryId 0 usually means "All" or similar in this context? Or strict category requirement?
    // Using 0 as default category if required.
    const res = await getUserLikeListApi({ categoryId: 0, pageNum: 1, pageSize: 50 })
    const list =
      (res as { records?: GifDTO[]; data?: GifDTO[] })?.records ||
      (res as { records?: GifDTO[]; data?: GifDTO[] })?.data ||
      (Array.isArray(res) ? res : [])
    likedGifs.value = list
  } catch (err) {
    console.error('Fetch likes failed', err)
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: 'uploads' | 'likes') => {
  activeTab.value = tab
  if (tab === 'uploads' && uploadedGifs.value.length === 0) fetchUploads()
  if (tab === 'likes' && likedGifs.value.length === 0) fetchLikes()
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchUploads()
  }
})
</script>

<template>
  <div class="profile-view container">
    <!-- Header -->
    <div class="profile-header">
      <div class="avatar-large">
        <span class="avatar-placeholder">{{ userStore.userInfo?.nickname?.charAt(0) || 'U' }}</span>
      </div>
      <div class="user-info">
        <h1 class="nickname">{{ userStore.userInfo?.nickname || 'Guest' }}</h1>
        <p class="email">{{ userStore.userInfo?.email }}</p>
        <div class="stats">
          <!-- Placeholder stats -->
          <div class="stat-item">
            <span class="value">0</span>
            <span class="label">Followers</span>
          </div>
          <div class="stat-item">
            <span class="value">0</span>
            <span class="label">Following</span>
          </div>
        </div>
      </div>
      <button class="settings-btn">
        <Settings :size="20" />
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'uploads' }"
        @click="switchTab('uploads')"
      >
        <ImageIcon :size="18" />
        My Uploads
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'likes' }"
        @click="switchTab('likes')"
      >
        <Heart :size="18" />
        Likes
      </button>
    </div>

    <!-- Content -->
    <div class="content-area">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else>
        <GifGrid v-if="activeTab === 'uploads'" :gifs="uploadedGifs" @click="handleGifClick" />
        <GifGrid v-if="activeTab === 'likes'" :gifs="likedGifs" @click="handleGifClick" />

        <div v-if="activeTab === 'uploads' && uploadedGifs.length === 0" class="empty-state">
          You haven't uploaded any GIFs yet.
        </div>
        <div v-if="activeTab === 'likes' && likedGifs.length === 0" class="empty-state">
          You haven't liked any GIFs yet.
        </div>
      </div>
    </div>

    <!-- Detail Modal Removed -->
  </div>
</template>

<style scoped>
.profile-view {
  padding-top: 100px;
  min-height: 100vh;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: var(--color-surface-glass);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-glass);
  margin-bottom: 2rem;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
  box-shadow: var(--shadow-glow);
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.email {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.stat-item .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.stat-item .label {
  font-size: 0.875rem;
  color: var(--color-text-dim);
}

.settings-btn {
  padding: 0.75rem;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.settings-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-main);
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: var(--color-text-main);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.loading,
.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-muted);
}
</style>
