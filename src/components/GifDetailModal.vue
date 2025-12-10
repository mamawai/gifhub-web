<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { X, Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns' // You should npm install date-fns
import type { GifDTO } from '@/api/gif'
import type { CommentVO } from '@/api/types'
import { getRootComments, addComment } from '@/api/comment'
import { getUserInfo } from '@/api/user' // To check if logged in

const props = defineProps<{
  gif: GifDTO | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const comments = ref<CommentVO[]>([])
const newComment = ref('')
const loadingComments = ref(false)
const submitting = ref(false)
const currentUser = ref<any>(null)

// Computed
const isVideo = computed(() => {
  if (!props.gif) return false
  return props.gif.url?.endsWith('.mp4') || props.gif.fileUrl?.endsWith('.mp4')
})

const displayUrl = computed(() => {
  if (!props.gif) return ''
  return props.gif.fileUrl || props.gif.url
})

// Validation
const canPost = computed(() => {
  return newComment.value.trim().length > 0 && currentUser.value
})

// Methods
const fetchComments = async (gifId: number | string) => {
  loadingComments.value = true
  try {
    const res = await getRootComments({ gifId })
    comments.value = res || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingComments.value = false
  }
}

const handlePostComment = async () => {
  if (!canPost.value || !props.gif) return

  submitting.value = true
  try {
    await addComment({
      gifId: props.gif.id,
      content: newComment.value,
    })
    newComment.value = ''
    // Refresh comments
    await fetchComments(props.gif.id)
  } catch (e: any) {
    alert(e.message || 'Failed to post comment')
  } finally {
    submitting.value = false
  }
}

const checkUser = async () => {
  try {
    const res = await getUserInfo()
    currentUser.value = res
  } catch (e) {
    currentUser.value = null
  }
}

// Watchers
watch(
  () => props.gif,
  (newGif) => {
    if (newGif && props.isOpen) {
      fetchComments(newGif.id)
    }
  },
)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      checkUser()
      if (props.gif) fetchComments(props.gif.id)
    } else {
      document.body.style.overflow = ''
    }
  },
)

// Format helpers
const formatDate = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch (e) {
    return dateStr
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-container">
      <button class="close-btn-mobile" @click="emit('close')">
        <X :size="24" />
      </button>

      <div class="media-column">
        <div class="media-wrapper">
          <video
            v-if="isVideo"
            :src="displayUrl"
            autoplay
            loop
            muted
            playsinline
            controls
            class="media-content"
          ></video>
          <img v-else :src="displayUrl" class="media-content" />
        </div>
      </div>

      <div class="info-column">
        <div class="header">
          <h2 class="title">{{ gif?.title || 'Untitled GIF' }}</h2>
          <button class="close-btn-desktop" @click="emit('close')">
            <X :size="24" />
          </button>
        </div>

        <div class="user-info">
          <div class="avatar-placeholder">
            {{ gif?.nickname?.[0]?.toUpperCase() || 'U' }}
          </div>
          <div class="user-details">
            <span class="username">{{
              gif?.nickname || gif?.giphyUsername || 'Unknown User'
            }}</span>
            <span class="source" v-if="gif?.source">via {{ gif?.source }}</span>
          </div>
          <button class="follow-btn">Follow</button>
        </div>

        <div class="actions-bar">
          <button class="action-item">
            <Heart :size="20" />
            <span>{{ gif?.likeCount || 0 }}</span>
          </button>
          <button class="action-item">
            <MessageCircle :size="20" />
            <span>{{ comments.length }}</span>
          </button>
          <button class="action-item ml-auto">
            <MoreHorizontal :size="20" />
          </button>
        </div>

        <div class="comments-section">
          <h3>Comments</h3>

          <div class="comments-list" v-if="!loadingComments && comments.length > 0">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <img
                :src="comment.avatar || 'https://via.placeholder.com/32'"
                class="comment-avatar"
              />
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.nickname }}</span>
                  <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </div>
          </div>

          <div v-else-if="loadingComments" class="empty-state">Loading comments...</div>

          <div v-else class="empty-state">No comments yet. Be the first to verify this GIF!</div>
        </div>

        <div class="comment-input-area">
          <div v-if="!currentUser" class="login-prompt">Please login to comment</div>
          <div v-else class="input-wrapper">
            <input
              v-model="newComment"
              type="text"
              placeholder="Add a comment..."
              @keyup.enter="handlePostComment"
            />
            <button class="send-btn" :disabled="!canPost || submitting" @click="handlePostComment">
              <Send :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-container {
  width: 100%;
  max-width: 1000px;
  height: 90vh; /* Fixed height for consistency */
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  display: flex;
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
  position: relative;
}

.close-btn-mobile {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 20;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  display: none; /* Desktop first logic here, tailored via media query */
  border-radius: 50%;
  padding: 0.5rem;
}

/* 2-Column Layout */
.media-column {
  flex: 1.5; /* Takes more space */
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.media-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.info-column {
  flex: 1; /* Side panel */
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  min-width: 350px;
  border-left: 1px solid var(--color-border);
}

.header {
  padding: 1.5rem;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
}

.close-btn-desktop {
  color: var(--color-text-muted);
  padding: 0.25rem;
}

.close-btn-desktop:hover {
  color: var(--color-text-main);
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
}

.user-info {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  font-size: 0.95rem;
}

.source {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.follow-btn {
  padding: 0.4rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--color-surface-hover);
  color: var(--color-text-main);
  transition: all 0.2s;
}

.follow-btn:hover {
  background: var(--color-border);
}

.actions-bar {
  padding: 0.75rem 1.5rem;
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

.action-item:hover {
  color: var(--color-text-main);
}

.ml-auto {
  margin-left: auto;
}

/* Comments */
.comments-section {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comments-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  display: flex;
  gap: 0.75rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  background: var(--color-surface-hover);
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  border-top-left-radius: 2px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.comment-author {
  font-weight: 600;
  font-size: 0.9rem;
}

.comment-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.comment-text {
  font-size: 0.9rem;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 2rem 0;
  font-style: italic;
}

/* Comment Input */
.comment-input-area {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  height: 44px;
  padding: 0 1rem 0 3rem; /* Space for avatar if added */
  padding-right: 3rem; /* Space for send btn */
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-main);
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.send-btn {
  position: absolute;
  right: 0.5rem;
  padding: 0.5rem;
  color: var(--color-primary);
  border-radius: 50%;
}

.send-btn:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  color: var(--color-primary);
  font-weight: 500;
  cursor: pointer;
}

@media (max-width: 768px) {
  .modal-container {
    flex-direction: column;
    height: 100%;
    border-radius: 0;
  }

  .media-column {
    flex: none;
    height: 40vh;
  }

  .info-column {
    flex: 1;
    overflow: hidden; /* Important for flex child scrolling */
  }

  .close-btn-mobile {
    display: block;
  }

  .close-btn-desktop {
    display: none;
  }
}
</style>
