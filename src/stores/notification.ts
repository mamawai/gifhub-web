import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { clearOne, clearUnread, getNotifications, getUnreadCount } from '@/api/notification'
import { getToken } from '@/utils/auth'
import config from '@/config'
import type { NotificationVO } from '@/api/types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationVO[]>([])
  const unreadCount = ref(0)
  // 使用 shallowRef 存储第三方库实例，避免 Vue 深度代理破坏其内部机制
  const stompClient = shallowRef<Client | null>(null)
  const isConnected = ref(false)

  const hasUnread = computed(() => unreadCount.value > 0)

  /**
   * 连接WebSocket
   */
  function connect() {
    if (!getToken() || isConnected.value) return

    const client = new Client({
      // SockJS 不支持 header 传递 token，需要通过 URL 参数传递
      // 每次创建连接时获取最新的 token
      webSocketFactory: () => {
        const token = getToken()
        return new SockJS(`${config.gifUrl}/ws?satoken=${token}`)
      },
      // 配置重连策略
      reconnectDelay: 5000, // 5秒后重连
      heartbeatIncoming: 4000, // 心跳检测
      heartbeatOutgoing: 4000,
      onConnect: () => {
        isConnected.value = true
        console.log('✅ WebSocket连接成功')

        // 订阅通知
        const subscription = client.subscribe('/user/queue/notifications', (message) => {
          console.log('🔔 收到WebSocket消息:', message.body)
          const notification: NotificationVO = JSON.parse(message.body)
          notifications.value.unshift(notification)
          if (!notification.isRead) {
            unreadCount.value++
          }
        })

        console.log('📮 订阅成功，subscription ID:', subscription.id)

        // 每次连接成功都fetch通知（包括首次连接和重连）
        console.log('📥 WebSocket连接成功，加载通知')
        fetchNotifications()
        fetchUnreadCount()
      },

      onDisconnect: () => {
        isConnected.value = false
        console.log('❌ STOMP断开连接')
      },
      onWebSocketClose: () => {
        isConnected.value = false
        console.log('❌ WebSocket底层连接关闭')
      },
      onStompError: (frame) => {
        console.error('⚠️ WebSocket STOMP错误:', frame.headers?.message || frame)
      },
      onWebSocketError: (event) => {
        console.error('⚠️ WebSocket底层错误:', event)
      },
    })

    client.activate()
    stompClient.value = client
  }

  /**
   * 断开WebSocket
   */
  function disconnect() {
    if (stompClient.value) {
      stompClient.value.deactivate()
      stompClient.value = null
      isConnected.value = false
    }
  }

  /**
   * 获取通知列表
   */
  async function fetchNotifications(page = 1, size = 10) {
    console.log('🚀 开始fetchNotifications, page:', page, 'size:', size)
    try {
      notifications.value = await getNotifications(page, size)
      console.log('✅ fetchNotifications 成功，获取到', notifications.value.length, '条通知')
    } catch (error) {
      console.error('❌ 获取通知列表失败:', error)
    }
  }

  /**
   * 获取未读数量
   */
  async function fetchUnreadCount() {
    console.log('🚀 开始fetchUnreadCount')
    try {
      unreadCount.value = await getUnreadCount()
      console.log('✅ fetchUnreadCount 成功，未读数量:', unreadCount.value)
    } catch (error) {
      console.error('❌ 获取未读数量失败:', error)
    }
  }

  /**
   * 清除所有未读
   */
  async function clearAllUnread() {
    try {
      await clearUnread()
      notifications.value.forEach((n) => (n.isRead = true))
      unreadCount.value = 0
    } catch (error) {
      console.error('清除未读失败:', error)
    }
  }

  /**
   * 清除单个通知
   */
  async function clearOneNotification(notificationId: number) {
    try {
      await clearOne(notificationId)
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('清除通知失败:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    hasUnread,
    isConnected,
    connect,
    disconnect,
    clearAllUnread,
    clearOneNotification,
  }
})
