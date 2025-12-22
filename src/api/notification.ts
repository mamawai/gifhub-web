import request from '@/utils/request'
import config from '@/config'
import type { NotificationVO } from './types'

/**
 * 获取通知列表
 */
export const getNotifications = (page = 1, size = 10) => {
  return request<NotificationVO[]>({
    baseUrl: config.gifUrl,
    url: '/notification/list',
    method: 'GET',
    params: { page, size },
  })
}

/**
 * 获取未读通知数量
 */
export const getUnreadCount = () => {
  return request<number>({
    baseUrl: config.gifUrl,
    url: '/notification/unread-count',
    method: 'GET',
  })
}

/**
 * 清除所有未读通知
 */
export const clearUnread = () => {
  return request<boolean>({
    baseUrl: config.gifUrl,
    url: '/notification/clear-unread',
    method: 'POST',
  })
}

/**
 * 清除单个通知（标记为已读）
 */
export const clearOne = (notificationId: number) => {
  return request<boolean>({
    baseUrl: config.gifUrl,
    url: `/notification/clear-one/${notificationId}`,
    method: 'POST',
  })
}
