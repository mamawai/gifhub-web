<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { MessageSquare } from 'lucide-vue-next'
import {
  getRootComments,
  addComment,
  toggleCommentLike,
  getHotComments,
  deleteComment,
  getChildComments,
} from '@/api/comment'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { Send } from 'lucide-vue-next'
import type { CommentVO, CommentDTO } from '@/api/types'
import CommentItem from './CommentItem.vue'

const props = defineProps<{
  gifId: string | number
}>()

const userStore = useUserStore()
const appStore = useAppStore()

// 评论数据分类（参考小程序逻辑）
const newRootComments = ref<CommentVO[]>([]) // 用户新增的根评论
const allComments = ref<CommentVO[]>([]) // 后端加载的评论（热门+普通）
const hotCommentCount = ref(0) // 热门评论数量

const loading = ref(false)
const newComment = ref('')
const submitting = ref(false)
const submitSuccess = ref(false)
const cursor = ref('1970-01-01T00:00:00')
const hasMore = ref(true)
const maxCommentLength = 100

// 回复状态
const replyTo = ref<{
  id: string
  nickname: string
  content: string
  rootCommentId: string
  _rootSeq: number
  _rootSource?: 'new'
} | null>(null)

// 字符计数和状态
const commentLength = computed(() => newComment.value.length)
const isCommentTooLong = computed(() => commentLength.value > maxCommentLength)

// 过滤已删除的评论
const visibleNewComments = computed(() => newRootComments.value.filter((c) => !c._isDeleted))

const visibleAllComments = computed(() => allComments.value.filter((c) => !c._isDeleted))

// 可见的热门评论数量
const visibleHotCommentCount = computed(
  () => allComments.value.slice(0, hotCommentCount.value).filter((c) => !c._isDeleted).length,
)

// 评论总数
const totalCommentCount = computed(
  () => visibleNewComments.value.length + visibleAllComments.value.length,
)

// 加载热门评论和全部评论（并行加载、去重、合并）
const fetchComments = async (isLoadMore = false) => {
  if (loading.value) return
  loading.value = true

  try {
    if (!isLoadMore) {
      // 首次加载：并行获取热门评论和普通评论
      const [hotResponse, allResponse] = await Promise.all([
        getHotComments(props.gifId),
        getRootComments({
          gifId: props.gifId,
          cursor: '1970-01-01T00:00:00',
          page: 1,
          limit: 10,
        }),
      ])

      // 解析热门评论
      let hotComments: CommentVO[] = []
      if (Array.isArray(hotResponse)) {
        hotComments = hotResponse
      } else {
        hotComments =
          (hotResponse as { records?: CommentVO[]; data?: CommentVO[] })?.records ||
          (hotResponse as { records?: CommentVO[]; data?: CommentVO[] })?.data ||
          []
      }

      // 解析普通评论
      let normalComments: CommentVO[] = []
      if (Array.isArray(allResponse)) {
        normalComments = allResponse
      } else {
        normalComments =
          (allResponse as { records?: CommentVO[]; data?: CommentVO[] })?.records ||
          (allResponse as { records?: CommentVO[]; data?: CommentVO[] })?.data ||
          []
      }

      // 标记热门评论
      hotComments.forEach((comment) => {
        comment._isHot = true
      })

      // 去重：移除普通评论中已经在热门评论里的
      const hotIds = new Set(hotComments.map((c) => c.id))
      const uniqueNormalComments = normalComments.filter((c) => !hotIds.has(c.id))

      // 合并：热门评论在前，普通评论在后
      allComments.value = [...hotComments, ...uniqueNormalComments]
      hotCommentCount.value = hotComments.length

      // 给根评论赋值索引
      allComments.value.forEach((comment, index) => {
        comment._rootSeq = index
      })

      // 更新游标
      if (normalComments.length > 0) {
        const lastComment = normalComments[normalComments.length - 1]
        if (lastComment) {
          cursor.value = lastComment.createdAt
        }
      }

      // 判断是否还有更多
      hasMore.value = normalComments.length >= 10
    } else {
      // 加载更多：只加载普通评论
      const response = await getRootComments({
        gifId: props.gifId,
        cursor: cursor.value,
        page: 1,
        limit: 10,
      })

      let newComments: CommentVO[] = []
      if (Array.isArray(response)) {
        newComments = response
      } else {
        newComments =
          (response as { records?: CommentVO[]; data?: CommentVO[] })?.records ||
          (response as { records?: CommentVO[]; data?: CommentVO[] })?.data ||
          []
      }

      // 去重：只需要移除在热门评论里的评论
      const hotCommentIds =
        hotCommentCount.value > 0
          ? new Set(allComments.value.slice(0, hotCommentCount.value).map((c) => c.id))
          : new Set()
      const uniqueNewComments = newComments.filter((c) => !hotCommentIds.has(c.id))

      // 给新加载的根评论赋值索引（从当前列表长度开始）
      const startIndex = allComments.value.length
      uniqueNewComments.forEach((comment, index) => {
        comment._rootSeq = startIndex + index
        comment._rootSource = undefined
      })

      // 追加到列表末尾
      allComments.value.push(...uniqueNewComments)

      // 更新游标
      if (newComments.length > 0) {
        const lastComment = newComments[newComments.length - 1]
        if (lastComment) {
          cursor.value = lastComment.createdAt
        }
      }

      // 判断是否还有更多
      hasMore.value = newComments.length >= 10
    }
  } catch (err) {
    console.error('Failed to load comments', err)
    appStore.showToast('加载评论失败', 'error')
  } finally {
    loading.value = false
  }
}

// 发送评论/回复
const handleSubmit = async () => {
  if (!newComment.value.trim() || isCommentTooLong.value) return
  if (!userStore.isLoggedIn) {
    appStore.showToast('请先登录', 'warning')
    return
  }

  const content = newComment.value.trim()
  const isReply = !!replyTo.value
  const replyToInfo = replyTo.value ? { ...replyTo.value } : null

  submitting.value = true
  submitSuccess.value = false
  try {
    const data: CommentDTO = {
      gifId: typeof props.gifId === 'number' ? props.gifId : parseInt(props.gifId as string),
      content: content,
    }

    // 如果是回复评论，需要传 parentId
    if (isReply && replyToInfo) {
      data.parentId = replyToInfo.id
    }

    const response = await addComment(data)

    if (response && response.id) {
      // 构建新评论对象
      const newCommentObj: CommentVO = {
        id: response.id,
        gifId: typeof props.gifId === 'number' ? props.gifId : parseInt(props.gifId as string),
        userId: userStore.userInfo?.userId || 0,
        nickname: userStore.userInfo?.nickname || '匿名用户',
        avatar: userStore.userInfo?.avatar || '',
        content: content,
        likeCount: 0,
        childCount: 0,
        isLiked: false,
        children: [],
        createdAt: new Date().toISOString(),
        parentId: '',
        rootCommentId: '',
        parentUserId: 0,
        parentNickname: '',
      }

      // 根据评论类型插入到列表
      if (isReply && replyToInfo) {
        // 回复评论：添加到对应根评论的子评论列表
        newCommentObj.parentId = replyToInfo.id
        newCommentObj.parentNickname = replyToInfo.nickname
        newCommentObj.rootCommentId = replyToInfo.rootCommentId
        newCommentObj._rootSeq = replyToInfo._rootSeq
        newCommentObj._rootSource = replyToInfo._rootSource

        // 使用索引直接访问根评论
        addReplyToCommentByIndex(replyToInfo._rootSeq, replyToInfo._rootSource, newCommentObj)
      } else {
        // 根评论：添加到用户新增评论列表
        newCommentObj._rootSource = 'new'
        newRootComments.value.unshift(newCommentObj)

        // 更新索引
        newRootComments.value.forEach((comment, index) => {
          comment._rootSeq = index
        })
      }

      // 标记发送成功，触发进度条到100%
      submitSuccess.value = true

      // 等待进度条走到100%后再清空（800ms到80% + 300ms到100% + 200ms停留）
      setTimeout(() => {
        appStore.showToast('评论成功', 'success')
        newComment.value = ''
        replyTo.value = null
        submitSuccess.value = false
        submitting.value = false
        showCommentBox.value = false
      }, 1300)
    }
  } catch (error: unknown) {
    console.error('发送评论失败:', error)
    appStore.showToast(error instanceof Error ? error.message : '发送失败', 'error')
    submitting.value = false
  }
}

// 使用索引直接访问根评论并添加回复（O(1)性能优化）
const addReplyToCommentByIndex = (
  _rootSeq: number,
  _rootSource: string | undefined,
  newReply: CommentVO,
) => {
  // 索引无效，降级处理
  if (_rootSeq === undefined || _rootSeq === -1) {
    console.warn('索引无效')
    return
  }

  // 根据来源获取根评论
  const rootComment =
    _rootSource === 'new' ? newRootComments.value[_rootSeq] : allComments.value[_rootSeq]

  if (rootComment) {
    // 初始化 children 数组
    if (!rootComment.children) {
      rootComment.children = []
    }

    // 添加到子评论列表顶部
    rootComment.children.unshift(newReply)

    // 更新子评论数量
    rootComment.childCount = (rootComment.childCount || 0) + 1
  } else {
    console.warn('根评论不存在，索引:', _rootSeq, '来源:', _rootSource)
  }
}

// 回复输入框引用
const commentInput = ref<HTMLTextAreaElement | null>(null)

// 评论框显示状态
const showCommentBox = ref(false)

// 打开评论框
const openCommentBox = () => {
  showCommentBox.value = true
  // 聚焦到输入框
  setTimeout(() => {
    commentInput.value?.focus()
  }, 300)
}

// 关闭评论框
const closeCommentBox = () => {
  showCommentBox.value = false
  replyTo.value = null
  newComment.value = ''
}

// 回复评论
const handleReply = (data: CommentVO & { _rootSeq: number; _rootSource?: 'new' }) => {
  replyTo.value = {
    id: data.id,
    nickname: data.nickname,
    content: data.content,
    rootCommentId: data.rootCommentId || data.id,
    _rootSeq: data._rootSeq !== undefined ? data._rootSeq : -1,
    _rootSource: data._rootSource,
  }

  // 清空输入内容并打开评论框
  newComment.value = ''
  openCommentBox()
}

// 截断文本
const truncateContent = (content: string, maxLength: number) => {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

// 点赞评论（使用索引直接访问）
const handleLike = async (data: {
  id: string
  _rootSeq: number
  isChild: boolean
  _rootSource?: 'new'
}) => {
  if (!userStore.isLoggedIn) {
    appStore.showToast('请先登录', 'warning')
    return
  }

  const commentId = data.id
  const _rootSeq = data._rootSeq
  const isChild = data.isChild
  const _rootSource = data._rootSource

  try {
    let comment = null

    // 只有用户新增的评论才有 _rootSource='new'，其他都是后端加载的
    if (!isChild) {
      // 根评论
      comment =
        _rootSource === 'new' ? newRootComments.value[_rootSeq] : allComments.value[_rootSeq]
    } else {
      // 子评论
      const rootComment =
        _rootSource === 'new' ? newRootComments.value[_rootSeq] : allComments.value[_rootSeq]
      if (rootComment && rootComment.children) {
        comment = rootComment.children.find((c) => c.id === commentId)
      }
    }

    // 降级：如果索引访问失败，使用 find 查找
    if (!comment) {
      console.warn('索引访问失败，使用降级方案查找评论')
      comment = findCommentById(commentId, [...newRootComments.value, ...allComments.value])
    }

    if (!comment) {
      console.error('评论不存在:', commentId)
      return
    }

    // 检查评论是否已删除
    if (comment._isDeleted) {
      appStore.showToast('该评论已被删除', 'warning')
      return
    }

    // 切换点赞状态
    const isLike = !comment.isLiked

    await toggleCommentLike({
      commentId: commentId,
      isLike: isLike,
    })

    // 更新本地状态
    comment.isLiked = isLike
    comment.likeCount = isLike
      ? (comment.likeCount || 0) + 1
      : Math.max((comment.likeCount || 0) - 1, 0)
  } catch (error) {
    console.error('点赞失败:', error)
    appStore.showToast('操作失败', 'error')
  }
}

// 根据ID查找评论（包括子评论）
const findCommentById = (commentId: string, commentList: CommentVO[]): CommentVO | null => {
  for (const comment of commentList) {
    if (comment.id === commentId) {
      return comment
    }
    // 查找子评论
    if (comment.children && comment.children.length > 0) {
      const found = findCommentById(commentId, comment.children)
      if (found) return found
    }
  }
  return null
}

// 删除评论（使用占位标记方案，保持索引不变）
const handleDelete = async (data: {
  commentId: string
  _rootSeq: number
  _rootSource?: 'new'
  isChild: boolean
}) => {
  if (!confirm('确定要删除这条评论吗？')) return

  const commentId = typeof data === 'string' ? data : data.commentId
  const _rootSeq = data._rootSeq
  const _rootSource = data._rootSource
  const isChild = data.isChild

  try {
    // 调用删除API
    await deleteComment(commentId)

    // 查找并标记评论为已删除
    let deleted = false

    if (!isChild) {
      // 删除根评论
      let comment = null
      if (_rootSource === 'new') {
        // 用户新增的评论
        comment = newRootComments.value[_rootSeq]
      } else {
        // 后端加载的评论
        comment = allComments.value[_rootSeq]
      }

      if (comment && comment.id === commentId) {
        // 标记为已删除（占位，不移除）
        comment._isDeleted = true
        deleted = true
      }

      // 降级方案：如果索引访问失败，使用 find 查找
      if (!deleted) {
        comment = findCommentById(commentId, [...newRootComments.value, ...allComments.value])
        if (comment) {
          comment._isDeleted = true
          deleted = true
        }
      }
    } else {
      // 删除子评论
      const rootComment =
        _rootSource === 'new' ? newRootComments.value[_rootSeq] : allComments.value[_rootSeq]

      if (rootComment && rootComment.children) {
        const childComment = rootComment.children.find((c) => c.id === commentId)

        if (childComment) {
          // 标记子评论为已删除
          childComment._isDeleted = true
          // 更新子评论数量
          rootComment.childCount = Math.max(0, (rootComment.childCount || 0) - 1)
          deleted = true
        }
      }

      // 降级方案：遍历所有根评论的子评论
      if (!deleted) {
        const allRootComments = [...newRootComments.value, ...allComments.value]
        for (const root of allRootComments) {
          if (root.children) {
            const child = root.children.find((c) => c.id === commentId)
            if (child) {
              child._isDeleted = true
              root.childCount = Math.max(0, (root.childCount || 0) - 1)
              deleted = true
              break
            }
          }
        }
      }
    }

    if (deleted) {
      appStore.showToast('删除成功', 'success')
    } else {
      appStore.showToast('删除失败：未找到评论', 'error')
    }
  } catch (error: unknown) {
    console.error('删除评论失败:', error)
    appStore.showToast(error instanceof Error ? error.message : '删除失败', 'error')
  }
}

// 加载更多子评论
const handleLoadMoreChildren = async (data: { rootCommentId: string; _rootSeq: number }) => {
  const rootCommentId = data.rootCommentId
  const _rootSeq = data._rootSeq

  try {
    // 判断当前是否有子评论来获取游标
    const rootComment = allComments.value[_rootSeq]
    if (!rootComment) return

    const cursor =
      rootComment.children && rootComment.children.length > 0
        ? rootComment.children[rootComment.children.length - 1]?.createdAt || '1970-01-01T00:00:00'
        : '1970-01-01T00:00:00'

    const response = await getChildComments({
      rootCommentId: rootCommentId,
      cursor: cursor,
      page: 1,
      limit: 10,
    })

    let children: CommentVO[] = []
    if (Array.isArray(response)) {
      children = response
    } else {
      children =
        (response as { records?: CommentVO[]; data?: CommentVO[] })?.records ||
        (response as { records?: CommentVO[]; data?: CommentVO[] })?.data ||
        []
    }

    // 更新评论列表中的子评论
    updateCommentChildren(_rootSeq, children)

    appStore.showToast(`已加载${children.length}条回复`, 'success')
  } catch (error) {
    console.error('加载子评论失败:', error)
    appStore.showToast('加载失败', 'error')
  }
}

// 更新评论的子评论列表
const updateCommentChildren = (_rootSeq: number, children: CommentVO[]) => {
  // 给子评论赋值根评论索引
  children.forEach((child) => {
    child._rootSeq = _rootSeq
  })

  const rootComment = allComments.value[_rootSeq]
  if (!rootComment) return

  if (rootComment.children && rootComment.children.length > 0) {
    // 去重：过滤掉已经存在的评论ID
    const existingIds = new Set(rootComment.children.map((c) => c.id))
    const uniqueChildren = children.filter((c) => !existingIds.has(c.id))
    // 追加到末尾
    rootComment.children.push(...uniqueChildren)
  } else {
    // 初始化
    rootComment.children = children
  }
}

// 收起子评论
const handleCollapseChildren = (data: { _rootSeq: number; _rootSource?: 'new' }) => {
  const _rootSeq = data._rootSeq
  const _rootSource = data._rootSource

  // 根据来源获取根评论
  const rootComment =
    _rootSource === 'new' ? newRootComments.value[_rootSeq] : allComments.value[_rootSeq]

  if (rootComment && rootComment.children) {
    rootComment.children = []
  }
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
      <MessageSquare :size="22" class="title-icon" />
      <span>评论</span>
      <span class="comment-count">({{ totalCommentCount }})</span>
    </h3>

    <!-- 评论列表 -->
    <div v-if="loading && allComments.length === 0" class="loading">
      <div class="loading-spinner"></div>
      <span>加载评论中...</span>
    </div>
    <div v-else-if="totalCommentCount === 0" class="empty">
      <MessageSquare :size="48" class="empty-icon" />
      <p>还没有评论，来抢沙发吧！</p>
    </div>
    <div v-else class="comment-list">
      <!-- 用户新增的评论（在最前面） -->
      <CommentItem
        v-for="(comment, index) in visibleNewComments"
        :key="'new-' + comment.id"
        :comment="comment"
        :style="{ animationDelay: `${index * 0.05}s` }"
        @reply="handleReply"
        @like="handleLike"
        @delete="handleDelete"
        @loadMore="handleLoadMoreChildren"
        @collapse="handleCollapseChildren"
      />

      <!-- 热门评论区（如果有） -->
      <div v-if="visibleHotCommentCount > 0" class="hot-section">
        <h4 class="hot-title">
          <span class="hot-icon">🔥</span>
          热门评论
        </h4>
        <CommentItem
          v-for="(comment, index) in visibleAllComments.slice(0, visibleHotCommentCount)"
          :key="'hot-' + comment.id"
          :comment="comment"
          :is-hot="true"
          :style="{ animationDelay: `${(visibleNewComments.length + index) * 0.05}s` }"
          @reply="handleReply"
          @like="handleLike"
          @delete="handleDelete"
          @loadMore="handleLoadMoreChildren"
          @collapse="handleCollapseChildren"
        />
      </div>

      <!-- 普通评论 -->
      <CommentItem
        v-for="(comment, index) in visibleAllComments.slice(visibleHotCommentCount)"
        :key="'normal-' + comment.id"
        :comment="comment"
        :style="{
          animationDelay: `${(visibleNewComments.length + visibleHotCommentCount + index) * 0.05}s`,
        }"
        @reply="handleReply"
        @like="handleLike"
        @delete="handleDelete"
        @loadMore="handleLoadMoreChildren"
        @collapse="handleCollapseChildren"
      />

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="load-more">
        <button class="load-more-btn" @click="() => fetchComments(true)">加载更多评论</button>
      </div>
      <div v-if="loading && allComments.length > 0" class="loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    </div>

    <!-- 底部浮动评论触发按钮 -->
    <div class="floating-comment-trigger" @click="openCommentBox">
      <MessageSquare :size="20" class="trigger-icon" />
      <span class="trigger-text">{{ replyTo ? '正在回复...' : '写评论...' }}</span>
    </div>

    <!-- 全浮动评论框 -->
    <Transition name="fade-scale">
      <div v-if="showCommentBox" class="floating-comment-modal">
        <div class="modal-backdrop" @click="closeCommentBox"></div>
        <div class="comment-bubble">
          <!-- 评论框头部 -->
          <div class="comment-header">
            <div class="comment-title-info">
              <MessageSquare :size="18" class="comment-icon" />
              <span class="comment-title">{{
                replyTo ? `回复 ${replyTo.nickname}` : '发表评论'
              }}</span>
            </div>
            <button class="close-btn" @click="closeCommentBox" type="button">
              <span class="close-icon">×</span>
            </button>
          </div>

          <!-- 回复内容预览 -->
          <div v-if="replyTo" class="original-content">
            <p>{{ truncateContent(replyTo.content, 60) }}</p>
          </div>

          <!-- 输入框 -->
          <div class="comment-input-wrapper">
            <textarea
              ref="commentInput"
              v-model="newComment"
              :placeholder="replyTo ? '输入回复内容...' : '分享你的想法...'"
              :disabled="submitting"
              :class="{ error: isCommentTooLong }"
              @keydown.ctrl.enter="handleSubmit"
            ></textarea>

            <!-- 发送进度条 -->
            <div v-if="submitting" class="sending-progress">
              <div class="progress-fill" :class="{ success: submitSuccess }"></div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="comment-footer">
            <div
              class="char-counter"
              :class="{ warning: commentLength > maxCommentLength * 0.8, error: isCommentTooLong }"
            >
              <span>{{ commentLength }}</span>
              <span class="separator">/</span>
              <span>{{ maxCommentLength }}</span>
            </div>
            <button
              class="comment-submit-btn"
              @click="handleSubmit"
              :disabled="!newComment.trim() || submitting || isCommentTooLong"
            >
              <Send :size="16" class="btn-icon" />
              <span>{{ submitting ? '发送中...' : replyTo ? '发送回复' : '发表评论' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== 主容器 ===== */
.comment-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--color-surface-glass);
  border-radius: 16px;
  border: 1px solid var(--color-border-glass);
  position: relative;
  overflow: hidden;
}

.comment-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-primary) 20%,
    var(--color-accent-pink) 50%,
    var(--color-primary) 80%,
    transparent 100%
  );
  opacity: 0.6;
}

/* ===== 标题区域 ===== */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-main);
  position: relative;
}

.title-icon {
  color: var(--color-primary);
  animation: float 3s ease-in-out infinite;
}

.comment-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-left: -0.25rem;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
}

/* ===== 底部浮动评论触发按钮 ===== */
.floating-comment-trigger {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
  color: white;
  border-radius: 50px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 998;
  font-weight: 600;
  font-size: 0.95rem;
}

.floating-comment-trigger:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5);
}

.floating-comment-trigger:active {
  transform: translateY(0) scale(1);
}

.trigger-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.trigger-text {
  white-space: nowrap;
}

/* ===== 全浮动评论框 ===== */
.floating-comment-modal {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 1rem 2rem;
  pointer-events: none;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  pointer-events: none;
}

.comment-bubble {
  position: relative;
  background: var(--color-surface);
  border-radius: 24px;
  box-shadow:
    0 -4px 40px rgba(0, 0, 0, 0.15),
    0 12px 60px rgba(0, 0, 0, 0.25);
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  border: 1px solid var(--color-border-glass);
  transform-origin: bottom center;
  pointer-events: all;
}

/* 评论框头部 */
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.comment-title-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.comment-icon {
  color: var(--color-primary);
}

.comment-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-text-secondary);
}

.close-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-main);
  transform: rotate(90deg);
}

.close-icon {
  font-size: 1.75rem;
  line-height: 1;
}

/* 原始内容预览 */
.original-content {
  background: var(--color-surface-hover);
  border-left: 3px solid var(--color-primary);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.original-content p {
  margin: 0;
  font-size: 0.925rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* 评论输入框 */
.comment-input-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.comment-input-wrapper textarea {
  width: 100%;
  min-height: 140px;
  padding: 1.25rem;
  border-radius: 16px;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  color: var(--color-text-main);
  font-size: 1rem;
  line-height: 1.7;
  resize: vertical;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.comment-input-wrapper textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 4px rgba(99, 102, 241, 0.1),
    0 4px 20px rgba(99, 102, 241, 0.2);
}

.comment-input-wrapper textarea.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.comment-input-wrapper textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 0.7;
}

/* 发送进度条 */
.sending-progress {
  position: relative;
  height: 3px;
  margin-top: 1rem;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent-pink));
  border-radius: 3px;
  width: 0%;
  animation: progressToWait 0.8s ease-out forwards;
}

.progress-fill.success {
  animation: progressToComplete 0.3s ease-out forwards;
}

/* 进度条先到80%等待 */
@keyframes progressToWait {
  0% {
    width: 0%;
  }
  100% {
    width: 80%;
  }
}

/* 发送成功后到100% */
@keyframes progressToComplete {
  0% {
    width: 80%;
  }
  100% {
    width: 100%;
  }
}

/* 评论底部操作栏 */
.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

/* 字符计数器 */
.char-counter {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
  transition: all 0.3s;
}

.char-counter .separator {
  opacity: 0.5;
  margin: 0 2px;
}

.char-counter.warning {
  color: #f59e0b;
  transform: scale(1.05);
}

.char-counter.error {
  color: #ef4444;
  transform: scale(1.1);
  animation: shake 0.4s;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0) scale(1.1);
  }
  25% {
    transform: translateX(-4px) scale(1.1);
  }
  75% {
    transform: translateX(4px) scale(1.1);
  }
}

/* 发送按钮 */
.comment-submit-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
  color: white;
  border-radius: 14px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  border: none;
  cursor: pointer;
}

.comment-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(99, 102, 241, 0.45);
}

.comment-submit-btn:active:not(:disabled) {
  transform: translateY(0px) scale(0.98);
}

.comment-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-icon {
  transition: transform 0.3s;
}

.comment-submit-btn:hover:not(:disabled) .btn-icon {
  transform: translateX(3px);
}

/* 底部滑入动画 */
.fade-scale-enter-active {
  animation: slideUpFromBottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-leave-active {
  animation: slideDownToBottom 0.25s ease-out;
}

@keyframes slideUpFromBottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDownToBottom {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .floating-comment-trigger {
    bottom: 1.5rem;
    right: 1.5rem;
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }

  .comment-bubble {
    padding: 1.5rem;
    border-radius: 20px;
    max-width: 100%;
  }

  .comment-input-wrapper textarea {
    min-height: 120px;
    font-size: 0.95rem;
    padding: 1rem;
  }

  .comment-submit-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }
}

/* ===== 加载状态 ===== */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--color-text-muted);
  padding: 2rem;
  font-size: 0.9rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 空状态 ===== */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--color-text-muted);
  padding: 2.5rem 1.5rem;
}

.empty-icon {
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

.empty p {
  font-size: 1rem;
  margin: 0;
}

/* ===== 评论列表 ===== */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* ===== 评论项卡片 ===== */
.comment-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-background);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  animation: fadeInUp 0.5s ease-out backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.comment-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, transparent 0%, var(--color-primary) 50%, transparent 100%);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.comment-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  border-color: var(--color-primary);
}

.comment-item:hover::before {
  opacity: 0.5;
}

/* ===== 头像区域 ===== */
.avatar-wrapper {
  flex-shrink: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-hover);
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 0 3px transparent;
}

.avatar::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent-pink));
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}

.avatar:hover {
  transform: rotate(5deg) scale(1.1);
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
}

.avatar:hover::before {
  opacity: 0.6;
}

.avatar:active {
  transform: rotate(5deg) scale(1.05);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ===== 评论内容 ===== */
.comment-content {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.nickname {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.3s;
  background: linear-gradient(135deg, var(--color-text-main), var(--color-primary));
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: var(--color-text-main);
}

.nickname:hover {
  -webkit-text-fill-color: transparent;
  background-position: right center;
}

.date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  cursor: help;
  transition: color 0.3s;
}

.date:hover {
  color: var(--color-text-dim);
}

.text {
  color: var(--color-text-dim);
  line-height: 1.7;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  word-wrap: break-word;
}

/* ===== 操作按钮 ===== */
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  /* 移动端触控优化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

.action-btn:hover {
  color: var(--color-text-main);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.action-btn:active {
  transform: translateY(0) scale(0.95);
}

/* 点赞按钮特效 */
.like-btn.active {
  color: var(--color-accent-pink);
  border-color: var(--color-accent-pink);
  background: rgba(236, 72, 153, 0.1);
}

.like-btn:hover svg {
  animation: heartbeat 0.6s ease-in-out;
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.15);
  }
}

.like-count {
  font-weight: 600;
  min-width: 1.5ch;
  text-align: center;
  transition: transform 0.3s;
}

.like-btn.active .like-count {
  animation: bounce 0.5s;
}

@keyframes bounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

/* ===== 涟漪效果 ===== */
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
  transform: scale(0);
  animation: ripple 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(2.5);
    opacity: 0;
  }
}

/* ===== 响应式设计 ===== */

/* 平板设备 (641px - 1024px) */
@media (max-width: 1024px) and (min-width: 641px) {
  .comment-section {
    padding: 1.75rem;
  }

  .section-title {
    font-size: 1.4rem;
  }

  textarea {
    min-height: 90px;
    font-size: 0.9rem;
  }
}

/* 手机设备 (≤640px) */
@media (max-width: 640px) {
  /* 主容器优化 */
  .comment-section {
    padding: 0rem 0rem;
    border-radius: 16px;
    margin-top: 1.5rem;
  }

  .comment-section::before {
    height: 3px; /* 更明显的顶部装饰线 */
  }

  /* 标题区域 */
  .section-title {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    gap: 0.6rem;
  }

  .title-icon {
    width: 20px;
    height: 20px;
  }

  .comment-count {
    font-size: 0.85rem;
  }

  /* 输入区域 */
  .comment-input-area {
    margin-bottom: 2rem;
  }

  textarea {
    min-height: 110px;
    padding: 1rem;
    font-size: 1rem; /* 移动端使用16px避免自动缩放 */
    border-radius: 14px;
    line-height: 1.6;
  }

  /* 输入框底部操作栏 - 垂直布局 */
  .input-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    margin-top: 0.875rem;
  }

  /* 字符计数器 */
  .char-counter {
    order: 2; /* 移到按钮下方 */
    justify-content: center;
    font-size: 0.8rem;
    padding: 0.5rem;
  }

  /* 发送按钮 - 全宽 */
  .submit-btn {
    order: 1;
    width: 100%;
    justify-content: center;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    min-height: 48px; /* 符合触控标准 */
    border-radius: 14px;
  }

  /* 登录提示 */
  .login-prompt {
    font-size: 0.95rem;
    padding: 0.75rem 1.5rem;
  }

  /* 加载状态 */
  .loading {
    padding: 2.5rem 1.5rem;
    font-size: 0.9rem;
  }

  .loading-spinner {
    width: 36px;
    height: 36px;
  }

  /* 空状态 */
  .empty {
    padding: 3rem 1.5rem;
  }

  .empty-icon {
    width: 42px;
    height: 42px;
  }

  .empty p {
    font-size: 0.95rem;
  }

  /* 评论列表 */
  .comment-list {
    gap: 1rem;
  }

  /* 评论卡片 */
  .comment-item {
    padding: 1rem;
    gap: 0.875rem;
    border-radius: 14px;
  }

  /* 简化悬浮效果（触摸设备不需要过度动画） */
  .comment-item:hover {
    transform: none;
  }

  /* 头像 */
  .avatar-wrapper {
    flex-shrink: 0;
  }

  .avatar {
    width: 44px;
    height: 44px;
  }

  /* 简化头像悬浮效果 */
  .avatar:hover {
    transform: scale(1.05); /* 减少旋转，只保留缩放 */
  }

  /* 评论内容 */
  .header {
    gap: 0.6rem;
    margin-bottom: 0.5rem;
  }

  .nickname {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .date {
    font-size: 0.75rem;
  }

  .text {
    font-size: 0.9rem;
    line-height: 1.65;
    margin-bottom: 0.75rem;
  }

  /* 操作按钮 */
  .actions {
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .action-btn {
    padding: 0.625rem 1rem;
    font-size: 0.85rem;
    min-height: 36px; /* 适合触控的高度 */
    border-radius: 10px;
  }

  /* 简化按钮悬浮效果 */
  .action-btn:hover {
    transform: none;
  }

  /* 点赞数字 */
  .like-count {
    font-size: 0.85rem;
  }
}

/* 小屏手机 (≤375px) */
@media (max-width: 375px) {
  .comment-section {
    padding: 0rem 0rem;
    border-radius: 14px;
  }

  .section-title {
    font-size: 1.2rem;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  textarea {
    min-height: 100px;
    padding: 0.875rem;
    font-size: 1rem;
  }

  .submit-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
  }

  .comment-item {
    padding: 0.875rem;
    gap: 0.75rem;
  }

  .avatar {
    width: 40px;
    height: 40px;
  }

  .nickname {
    font-size: 0.9rem;
  }

  .text {
    font-size: 0.875rem;
  }

  .action-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
    min-height: 34px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 触摸设备 - 移除所有悬浮动画 */
  .comment-item:hover::before {
    opacity: 0;
  }

  .avatar:hover::before {
    opacity: 0;
  }

  /* 增强点击反馈 */
  .action-btn:active {
    transform: scale(0.95);
    background: var(--color-surface-hover);
  }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  /* 头像点击反馈 */
  .avatar:active {
    transform: scale(0.95);
  }

  /* 减少动画以提升性能 */
  .comment-item {
    animation-duration: 0.3s;
  }

  /* 简化过渡效果 */
  * {
    transition-duration: 0.2s !important;
  }
}

/* 横屏手机优化 */
@media (max-width: 896px) and (orientation: landscape) {
  .comment-section {
    padding: 1rem 1.5rem;
  }

  textarea {
    min-height: 80px;
  }

  .loading,
  .empty {
    padding: 2rem 1rem;
  }

  .comment-item {
    padding: 0.875rem 1rem;
  }
}

/* ===== 回复预览卡片 ===== */
.reply-preview {
  margin-bottom: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08));
  border-left: 3px solid var(--color-primary);
  border-radius: 12px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reply-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reply-preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
}

.cancel-reply-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-reply-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--color-text-main);
  transform: rotate(90deg);
}

.reply-preview-content {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* ===== 热门评论区 ===== */
.hot-section {
  margin: 1rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.03), rgba(255, 193, 7, 0.03));
  border-radius: 12px;
  border-left: 3px solid #ff6b00;
}

.hot-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ff6b00;
}

.hot-icon {
  font-size: 1.25rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

.comment-item.is-hot {
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.05), rgba(255, 193, 7, 0.05));
  border-left: 3px solid #ff6b00;
}

/* ===== 回复按钮 ===== */
.reply-btn {
  color: var(--color-text-secondary);
}

.reply-btn:hover {
  color: var(--color-primary);
  background: var(--color-surface-hover);
}

/* ===== 加载更多 ===== */
.load-more {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem 0;
}

.load-more-btn {
  padding: 0.75rem 2rem;
  background: var(--color-surface-hover);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text-main);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.load-more-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.load-more-btn:active {
  transform: translateY(0);
}

/* ===== 查看回复按钮 ===== */
.view-replies {
  margin-top: 0.75rem;
}

.view-replies-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-replies-btn:hover {
  color: var(--color-accent-pink);
  transform: translateX(2px);
}

.view-replies-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ===== 子评论列表 ===== */
.child-comments {
  margin-top: 1rem;
  padding-left: 1rem;
  border-left: 2px solid var(--color-border);
  animation: slideIn 0.3s ease-out;
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

.child-comment-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.child-comment-item:last-child {
  border-bottom: none;
}

.child-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-hover);
}

.child-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.child-content {
  flex: 1;
  min-width: 0;
}

.child-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.child-nickname {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-main);
}

.reply-to {
  font-size: 0.75rem;
  color: var(--color-primary);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-weight: 500;
}

.child-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-left: auto;
}

.child-text {
  font-size: 0.875rem;
  color: var(--color-text-main);
  line-height: 1.6;
  margin: 0 0 0.5rem 0;
  word-wrap: break-word;
}

.child-actions {
  display: flex;
  gap: 0.5rem;
}

.child-actions .action-btn {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.child-actions .action-btn svg {
  width: 14px;
  height: 14px;
}
</style>
