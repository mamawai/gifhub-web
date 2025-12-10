<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getRootComments, addComment, toggleCommentLike } from '@/api/comment'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { Heart, Send, MessageSquare } from 'lucide-vue-next'
import type { CommentVO } from '@/api/types'

import { useRouter } from 'vue-router'

const props = defineProps<{
  gifId: string | number
}>()

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const comments = ref<CommentVO[]>([])
const loading = ref(false)
const newComment = ref('')
const submitting = ref(false)
const cursor = ref('1970-01-01T00:00:00')
const hasMore = ref(true)

const handleLoginRedirect = () => {
  router.push('/login')
}

const fetchComments = async (isLoadMore = false) => {
  if (loading.value) return
  loading.value = true

  try {
    const currentCursor = isLoadMore ? cursor.value : '1970-01-01T00:00:00'
    const res = await getRootComments({
      gifId: props.gifId,
      cursor: currentCursor,
      page: 1, // API seems to require page but relies on cursor? User said "createdAt cursor + page". Let's send page 1 always if cursor drives it? Or increment page? Usually cursor replaces page. User said "cursor + page". I will keep page=1 for safety or maybe I shouldn't send page if cursor is used? The strict signature usually needs it. I'll send 1.
      limit: 10,
    })

    let list: CommentVO[] = []
    if (Array.isArray(res)) {
      list = res
    } else {
      list =
        (res as { records?: CommentVO[]; data?: CommentVO[] })?.records ||
        (res as { records?: CommentVO[]; data?: CommentVO[] })?.data ||
        []
    }

    if (!isLoadMore) {
      comments.value = list
    } else {
      comments.value.push(...list)
    }

    if (list.length > 0) {
      const lastItem = list[list.length - 1]
      if (lastItem) {
        cursor.value = lastItem.createdAt
      }
    } else {
      hasMore.value = false
    }
  } catch (err) {
    console.error('Failed to load comments', err)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!newComment.value.trim()) return
  if (!userStore.isLoggedIn) {
    appStore.showToast('Please login first', 'warning')
    return
  }

  submitting.value = true
  try {
    await addComment({
      gifId: props.gifId,
      content: newComment.value,
    })
    appStore.showToast('Comment added', 'success')
    newComment.value = ''
    fetchComments() // Refresh
  } catch {
    appStore.showToast('Failed to add comment', 'error')
  } finally {
    submitting.value = false
  }
}

const handleLike = async (comment: CommentVO) => {
  if (!userStore.isLoggedIn) return
  try {
    const newStatus = !comment.isLiked
    await toggleCommentLike({ commentId: comment.id, isLike: newStatus })
    comment.isLiked = newStatus
    comment.likeCount += newStatus ? 1 : -1
  } catch (error) {
    console.error('Like failed', error)
  }
}

// Simple time formatter
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

onMounted(() => {
  if (props.gifId) {
    fetchComments()
  }
})
</script>

<template>
  <div class="comment-section">
    <h3 class="section-title">
      <MessageSquare :size="20" />
      Comments ({{ comments.length }})
    </h3>

    <!-- Input -->
    <div class="comment-input-area">
      <div class="input-wrapper-overlay" v-if="!userStore.isLoggedIn" @click="handleLoginRedirect">
        <div class="login-prompt">
          <span>Please login to comment</span>
        </div>
      </div>
      <textarea
        v-model="newComment"
        placeholder="Say something nice..."
        :disabled="submitting || !userStore.isLoggedIn"
      ></textarea>
      <div class="input-actions">
        <button
          class="submit-btn"
          @click="handleSubmit"
          :disabled="!newComment.trim() || submitting"
        >
          <Send :size="16" />
          {{ submitting ? 'Posting...' : 'Post' }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="loading" class="loading">Loading comments...</div>
    <div v-else-if="comments.length === 0" class="empty">No comments yet. Be the first!</div>
    <div v-else class="comment-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="avatar">
          <img :src="comment.avatar || '/placeholder.png'" alt="avatar" />
        </div>
        <div class="comment-content">
          <div class="header">
            <span class="nickname">{{ comment.nickname }}</span>
            <span class="date">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <p class="text">{{ comment.content }}</p>
          <div class="actions">
            <button
              class="action-btn"
              :class="{ active: comment.isLiked }"
              @click="handleLike(comment)"
            >
              <Heart :size="14" :fill="comment.isLiked ? 'currentColor' : 'none'" />
              {{ comment.likeCount }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--color-surface-glass);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-glass);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.comment-input-area {
  margin-bottom: 2rem;
}

textarea {
  width: 100%;
  min-height: 80px;
  padding: 1rem;
  border-radius: var(--radius-md);
  background: var(--color-background); /* Darker than surface */
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  resize: vertical;
  transition: all 0.2s;
}

textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  font-weight: 500;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-hover);
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.nickname {
  font-weight: 600;
  color: var(--color-text-main);
}

.date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.text {
  color: var(--color-text-dim);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  transition: color 0.2s;
}

.action-btn:hover {
  color: var(--color-text-main);
}

.action-btn.active {
  color: var(--color-accent-pink);
}

.loading,
.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 2rem;
}

.comment-input-area {
  margin-bottom: 2rem;
  position: relative;
}

.input-wrapper-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(2px);
  transition: all 0.2s;
}

.input-wrapper-overlay:hover {
  background: rgba(0, 0, 0, 0.4);
}

.login-prompt {
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
