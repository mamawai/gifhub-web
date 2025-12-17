<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Heart, MessageSquare, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import type { CommentVO } from '@/api/types'

interface Props {
  comment: CommentVO
  isChild?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'reply', data: CommentVO & { _rootSeq: number; _rootSource?: 'new' }): void
  (e: 'like', data: { id: string; _rootSeq: number; isChild: boolean; _rootSource?: 'new' }): void
  (
    e: 'delete',
    data: { commentId: string; _rootSeq: number; _rootSource?: 'new'; isChild: boolean },
  ): void
  (e: 'loadMore', data: { rootCommentId: string; _rootSeq: number }): void
  (e: 'collapse', data: { rootCommentId: string; _rootSeq: number; _rootSource?: 'new' }): void
}>()

const userStore = useUserStore()

// 子评论动画跟踪
const animatedChildIds = ref<string[]>([])
const isLikeAnimating = ref(false)
const isChildrenExpanded = ref(false)

// 过滤已删除的子评论
const visibleChildren = computed(() => {
  if (!props.comment.children) return []
  return props.comment.children.filter((c) => !c._isDeleted)
})

// 是否有子评论（过滤已删除的）
const hasChildren = computed(() => visibleChildren.value.length > 0)

// 是否是自己的评论
const isMyComment = computed(() => {
  return userStore.userInfo?.userId === props.comment.userId
})

// 监听子评论变化，添加动画
watch(
  () => props.comment.children,
  (newChildren, oldChildren) => {
    if (!newChildren || newChildren.length === 0) return

    // 找出新增的子评论
    const oldIds = new Set((oldChildren || []).map((c) => c.id))
    const newIds = newChildren.filter((c) => !oldIds.has(c.id)).map((c) => c.id)

    if (newIds.length === 0) return

    // 为新增的子评论添加动画标记
    animatedChildIds.value = [...animatedChildIds.value, ...newIds]

    // 动画播放完后移除标记（600ms后）
    setTimeout(() => {
      animatedChildIds.value = animatedChildIds.value.filter((id) => !newIds.includes(id))
    }, 600)
  },
  { deep: true },
)

// 判断子评论是否应该播放动画
const shouldAnimate = (childId: string) => {
  return animatedChildIds.value.includes(childId)
}

// 格式化相对时间
const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  // 格式化为 MM-DD HH:mm
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dateNum = String(date.getDate()).padStart(2, '0')
  const hoursNum = String(date.getHours()).padStart(2, '0')
  const minutesNum = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${dateNum} ${hoursNum}:${minutesNum}`
}

// 格式化完整时间（悬浮提示）
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

// 点赞
const handleLike = () => {
  // 触发点赞动画
  isLikeAnimating.value = true

  // 400ms 后重置动画状态
  setTimeout(() => {
    isLikeAnimating.value = false
  }, 400)

  emit('like', {
    id: props.comment.id,
    _rootSeq: props.comment._rootSeq ?? 0,
    _rootSource: props.comment._rootSource,
    isChild: !!props.comment.rootCommentId,
  })
}

// 回复
const handleReply = () => {
  // 确定根评论的ID
  const rootCommentId = props.comment.rootCommentId || props.comment.id

  emit('reply', {
    ...props.comment,
    rootCommentId: rootCommentId,
    _rootSeq: props.comment._rootSeq ?? 0,
    _rootSource: props.comment._rootSource,
  })
}

// 删除
const handleDelete = () => {
  // 传递完整的数据，包括索引信息
  emit('delete', {
    commentId: props.comment.id,
    _rootSeq: props.comment._rootSeq ?? 0,
    _rootSource: props.comment._rootSource,
    isChild: !!props.comment.rootCommentId,
  })
}

// 展开子评论
const handleExpandChildren = () => {
  isChildrenExpanded.value = true
  emit('loadMore', {
    rootCommentId: props.comment.id,
    _rootSeq: props.comment._rootSeq ?? 0,
  })
}

// 收起子评论
const handleCollapseChildren = () => {
  isChildrenExpanded.value = false
  emit('collapse', {
    rootCommentId: props.comment.id,
    _rootSeq: props.comment._rootSeq ?? 0,
    _rootSource: props.comment._rootSource,
  })
}

// 加载更多子评论
const handleLoadMore = () => {
  emit('loadMore', {
    rootCommentId: props.comment.id,
    _rootSeq: props.comment._rootSeq ?? 0,
  })
}

// 子评论回复
const handleChildReply = (data: CommentVO & { _rootSeq: number; _rootSource?: 'new' }) => {
  emit('reply', data)
}

// 子评论点赞
const handleChildLike = (data: {
  id: string
  _rootSeq: number
  isChild: boolean
  _rootSource?: 'new'
}) => {
  emit('like', data)
}

// 子评论删除
const handleChildDelete = (data: {
  commentId: string
  _rootSeq: number
  _rootSource?: 'new'
  isChild: boolean
}) => {
  emit('delete', data)
}
</script>

<template>
  <div class="comment-item" :class="{ 'is-child': isChild }">
    <div class="comment-main">
      <!-- 用户头像 -->
      <div class="avatar-wrapper">
        <div class="avatar">
          <img :src="comment.avatar || '/placeholder.png'" alt="avatar" />
        </div>
      </div>

      <!-- 评论内容区 -->
      <div class="comment-content">
        <!-- 用户信息 -->
        <div class="header">
          <span class="nickname">{{ comment.nickname || '匿名用户' }}</span>
          <span v-if="comment.parentNickname" class="reply-tag">
            <span class="arrow">▸</span>
            {{ comment.parentNickname }}
          </span>
          <span class="date" :title="formatDate(comment.createdAt)">
            · {{ formatRelativeTime(comment.createdAt) }}
          </span>
        </div>

        <!-- 评论主体区域（文本 + 操作按钮） -->
        <div class="content-with-actions">
          <!-- 评论文本 -->
          <div class="text">
            <span>{{ comment.content }}</span>
          </div>

          <!-- 操作栏 -->
          <div class="actions">
            <button
              class="action-btn like-btn"
              :class="{ active: comment.isLiked }"
              @click="handleLike"
            >
              <div
                class="like-icon-wrapper"
                :class="{
                  'like-animation': isLikeAnimating,
                  liked: comment.isLiked,
                }"
              >
                <Heart :size="16" :fill="comment.isLiked ? 'currentColor' : 'none'" />
              </div>
              <span class="like-count">{{ comment.likeCount || 0 }}</span>
            </button>

            <button class="action-btn reply-btn" @click="handleReply">
              <MessageSquare :size="16" />
              <span>回复</span>
            </button>

            <button v-if="isMyComment" class="action-btn delete-btn" @click="handleDelete">
              <Trash2 :size="16" />
              <span>删除</span>
            </button>
          </div>
        </div>

        <!-- 展开子评论按钮 -->
        <div
          v-if="!hasChildren && comment.childCount > 0 && !isChild"
          class="expand-children-btn"
          @click="handleExpandChildren"
        >
          <span class="expand-text"> 点击展开剩余 {{ comment.childCount }} 条回复 </span>
          <ChevronDown :size="14" />
        </div>

        <!-- 子评论列表 -->
        <div v-if="hasChildren" class="children-comments">
          <div
            v-for="child in visibleChildren"
            :key="child.id"
            class="child-comment"
            :class="{ 'child-enter': shouldAnimate(child.id) }"
          >
            <CommentItem
              :comment="child"
              :is-child="true"
              @reply="handleChildReply"
              @like="handleChildLike"
              @delete="handleChildDelete"
            />
          </div>

          <!-- 加载更多子评论 -->
          <div
            v-if="comment.childCount > visibleChildren.length"
            class="load-more-children"
            @click="handleLoadMore"
          >
            <span class="load-more-text">
              查看更多回复 ({{ comment.childCount - visibleChildren.length }})
            </span>
            <ChevronDown :size="12" />
          </div>

          <!-- 收起子评论按钮 -->
          <div class="collapse-children-btn" @click="handleCollapseChildren">
            <span class="collapse-text">收起回复</span>
            <ChevronUp :size="14" />
          </div>
        </div>
      </div>
    </div>

    <!-- 分割线（子评论不显示分割线） -->
    <div v-if="!isChild" class="comment-divider"></div>
  </div>
</template>

<style scoped>
/* ===== 评论项 ===== */
.comment-item {
  display: flex;
  gap: 0.875rem;
  padding: 1.125rem;
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: all 0.3s;
  animation: fadeInUp 0.4s ease-out;
  animation-fill-mode: both;
}

.comment-main {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 0;
  flex: 1;
  width: 100%;
  min-width: 0;
}

.child-comment-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* 子评论样式 */
.comment-item.is-child .comment-main {
  padding: 0.5rem 0;
}

.comment-item.is-child .avatar {
  width: 28px;
  height: 28px;
}

/* 分割线 */
.comment-divider {
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.1) 10%,
    rgba(0, 0, 0, 0.1) 90%,
    rgba(0, 0, 0, 0) 100%
  );
}

/* ===== 头像 ===== */
.avatar-wrapper {
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-hover);
  border: 2px solid var(--color-border);
  transition: all 0.3s;
}

.avatar:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ===== 评论内容 ===== */
.comment-content {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.5rem;
}

.nickname {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-main);
}

.date {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

/* 评论主体区域(文本+操作按钮) */
.content-with-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.text {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--color-text-main);
  line-height: 1.6;
  word-wrap: break-word;
  min-width: 0;
  max-width: 100%;
}

.reply-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 400;
}

.arrow {
  color: var(--color-primary);
  font-weight: 600;
}

/* ===== 操作按钮 ===== */
.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.25s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

.action-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

/* 点赞按钮 */
.like-btn.active {
  color: #ef4444;
}

/* 点赞图标包装器 */
.like-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s ease;
}

/* 已点赞状态的持续效果 */
.like-icon-wrapper.liked {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.4));
}

/* 点赞动画 - 点赞时 */
.like-animation.liked {
  animation: likeHeartBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 添加脉冲扩散效果 */
.like-animation.liked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%);
  animation: likePulse 0.4s ease-out;
  pointer-events: none;
}

/* 取消点赞动画 - 取消点赞时 */
.like-animation:not(.liked) {
  animation: unlikeHeartShrink 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 点赞弹跳动画 */
@keyframes likeHeartBounce {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.35) rotate(-8deg);
  }
  50% {
    transform: scale(0.95) rotate(4deg);
  }
  75% {
    transform: scale(1.15) rotate(-2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* 取消点赞缩小动画 */
@keyframes unlikeHeartShrink {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1);
  }
}

/* 点赞脉冲扩散动画 */
@keyframes likePulse {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.8);
    opacity: 0;
  }
}

.like-count {
  min-width: 1.25rem;
  text-align: center;
}

.reply-btn:hover {
  color: var(--color-primary);
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* ===== 展开子评论按钮 ===== */
.expand-children-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.12) 100%);
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: var(--color-primary);
}

.expand-children-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.2) 100%);
  transform: translateY(-1px);
}

.expand-children-btn:active {
  transform: scale(0.98);
}

.expand-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* ===== 子评论列表 ===== */
.children-comments {
  margin-top: 0.75rem;
  padding: 0.75rem 0 0 0.875rem;
  background: rgba(99, 102, 241, 0.02);
  border-radius: 10px;
  border-left: 2px solid rgba(99, 102, 241, 0.2);
  animation: slideIn 0.3s ease-out;
}

/* 手机端子评论优化 */
@media (max-width: 640px) {
  .children-comments {
    padding: 0.5rem 0 0 0.375rem;
    margin-top: 0.5rem;
    margin-left: -2rem;
    margin-right: -1rem;
  }
}

/* 小屏手机子评论优化 (≤375px) */
@media (max-width: 375px) {
  .children-comments {
    margin-left: -3rem;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.child-comment {
  position: relative;
  margin-bottom: 0.75rem;
}

.child-comment:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
}

/* 子评论弹动动画 */
.child-enter {
  animation: spring-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes spring-bounce {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: translateY(2px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 加载更多子评论 */
.load-more-children {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  cursor: pointer;
  color: var(--color-primary);
  transition: all 0.2s;
}

.load-more-children:hover {
  opacity: 0.7;
  transform: translateX(2px);
}

.load-more-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* 收起子评论按钮 */
.collapse-children-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  margin-top: 0.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.08) 100%);
  border-radius: 10px;
}

.collapse-children-btn:hover {
  color: var(--color-primary);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.15) 100%);
  transform: translateY(-1px);
}

.collapse-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* ===== 移动端优化 ===== */
@media (max-width: 640px) {
  .comment-item {
    padding: 0.75rem 0.5rem;
  }

  .comment-main {
    padding: 0.5rem 0;
    gap: 0.5rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
  }

  .comment-item.is-child .avatar {
    width: 24px;
    height: 24px;
  }

  .nickname {
    font-size: 0.9rem;
  }

  .text {
    font-size: 0.9rem;
  }

  .action-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }

  .actions {
    gap: 0.5rem;
  }

  /* 手机端评论文本和操作按钮垂直排列 */
  .content-with-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .actions {
    margin-left: 0;
  }
}

/* 小屏手机优化 (≤375px) */
@media (max-width: 375px) {
  .nickname {
    font-size: 0.8rem;
  }

  .date {
    font-size: 0.65rem;
  }

  .text {
    font-size: 0.8rem;
  }

  .action-btn {
    padding: 0.3rem 0.55rem;
    font-size: 0.7rem;
  }

  .actions {
    gap: 0.35rem;
  }
}
</style>
