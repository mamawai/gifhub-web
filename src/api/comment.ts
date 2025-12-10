import request from '@/utils/request'
import config from '@/config'
import type { CommentVO } from '@/api/types'

/**
 * Add Comment
 */
export function addComment(data: { gifId: string | number; content: string; parentId?: string }) {
  return request<{ id: string }>({
    baseUrl: config.gifUrl,
    url: '/comment/add',
    method: 'POST',
    data,
  })
}

/**
 * Get Root Comments
 */
export function getRootComments(params: {
  gifId: string | number
  cursor?: string
  page?: number
  limit?: number
}) {
  return request<CommentVO[]>({
    baseUrl: config.gifUrl,
    url: `/comment/root/${params.gifId}`,
    method: 'GET',
    params: {
      cursor: params.cursor,
      page: params.page || 1,
      limit: params.limit || 10,
    },
  })
}

/**
 * Get Child Comments
 */
export function getChildComments(params: {
  rootCommentId: string
  cursor?: string
  page?: number
  limit?: number
}) {
  return request<CommentVO[]>({
    baseUrl: config.gifUrl,
    url: `/comment/children/${params.rootCommentId}`,
    method: 'GET',
    params: {
      cursor: params.cursor,
      page: params.page || 1,
      limit: params.limit || 10,
    },
  })
}

/**
 * Get Hot Comments (Root)
 */
export function getHotComments(gifId: string | number) {
  return request<CommentVO[]>({
    baseUrl: config.gifUrl,
    url: `/comment/hot/${gifId}`,
    method: 'GET',
  })
}

/**
 * Toggle Like on Comment
 */
export function toggleCommentLike(data: { commentId: string; isLike: boolean }) {
  return request({
    baseUrl: config.gifUrl,
    url: '/comment/like',
    method: 'POST',
    params: data,
  })
}

/**
 * Delete Comment
 */
export function deleteComment(commentId: string) {
  return request({
    baseUrl: config.gifUrl,
    url: `/comment/${commentId}`,
    method: 'DELETE',
  })
}

/**
 * 获取用户点赞的评论历史
 */
export function getLikeHistory(params: { pageNum?: number; pageSize?: number }) {
  return request({
    baseUrl: config.gifUrl,
    url: '/comment/likeHistory',
    method: 'GET',
    params: {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
    },
  })
}
