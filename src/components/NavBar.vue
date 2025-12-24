<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Upload,
  User,
  Menu,
  ChevronDown,
  Heart,
  Telescope,
  Mail,
  Languages,
  Repeat,
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { useLocaleStore } from '@/stores/locale'
import { useSettingsStore, type LoopCount } from '@/stores/settings'
import { messages } from '@/locales/messages'
import AnimatedThemeToggler from '@/components/AnimatedThemeToggler.vue'
import VideoSettingsPopup from '@/components/VideoSettingsPopup.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const localeStore = useLocaleStore()
const t = computed(() => messages[localeStore.locale].navbar)
const isScrolled = ref(false)
const isDark = ref(false)
const showNavMenu = ref(false)
const showActionsMenu = ref(false)
const showNotifications = ref(false)
const showVideoSettings = ref(false)
const notificationRef = ref<HTMLElement | null>(null)
const videoSettingsRef = ref<HTMLElement | null>(null)
// 移动端专用子菜单展开状态
const mobileExpandedSection = ref<'none' | 'notifications' | 'settings'>('none')
const settingsStore = useSettingsStore()

const loopOptions: LoopCount[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'infinite']
const getLoopDisplayValue = (count: LoopCount) => (count === 'infinite' ? '∞' : count.toString())
const handleMobileLoopSelect = (count: LoopCount) => {
  settingsStore.setLoopCount(count)
  mobileExpandedSection.value = 'none'
}
const toggleMobileSection = (section: 'notifications' | 'settings') => {
  mobileExpandedSection.value = mobileExpandedSection.value === section ? 'none' : section
}

const displayCount = computed(() => {
  if (notificationStore.unreadCount > 99) return '99+'
  return notificationStore.unreadCount
})

// 将 actionType 转换为可读文本
const getActionText = (actionType: number, senderNickname: string) => {
  const actions: Record<number, string> = {
    1: '点赞了你的 GIF',
    2: '点赞了你的评论',
    3: '评论了你的 GIF',
    4: '回复了你的评论',
  }
  return `${senderNickname} ${actions[actionType] || '与你互动'}`
}

// 格式化时间显示
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  // 不再在这里fetch通知，通知由WebSocket推送
}

const markAsRead = async (id: number) => {
  const notification = notificationStore.notifications.find((n) => n.id === id)
  if (notification && !notification.isRead) {
    await notificationStore.clearOneNotification(id)
  }
}

const markAllAsRead = async () => {
  await notificationStore.clearAllUnread()
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

const handleClickOutside = (event: MouseEvent) => {
  if (notificationRef.value && !notificationRef.value.contains(event.target as Node)) {
    showNotifications.value = false
  }
  if (videoSettingsRef.value && !videoSettingsRef.value.contains(event.target as Node)) {
    showVideoSettings.value = false
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
  isDark.value = false
  document.documentElement.classList.remove('dark')
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})

const handleLoginClick = () => {
  router.push('/login')
  showActionsMenu.value = false
}

const handleUploadClick = () => {
  if (!userStore.isLoggedIn) return router.push('/login')
  router.push('/upload')
  showActionsMenu.value = false
}

const handleProfileClick = () => {
  router.push('/profile')
  showActionsMenu.value = false
}

const navigateTo = (path: string) => {
  router.push(path)
  showNavMenu.value = false
}
</script>

<template>
  <nav :class="['navbar', { 'is-scrolled': isScrolled }]">
    <div class="container navbar-content">
      <!-- Desktop Navigation -->
      <div class="nav-links desktop-only">
        <router-link to="/" class="nav-item">
          <span class="nav-text">{{ t.whatWeLike }}</span>
        </router-link>
        <router-link to="/giphy" class="nav-item">
          <span class="nav-text">{{ t.giphy }}</span>
        </router-link>
      </div>

      <!-- Mobile Navigation Menu -->
      <div class="mobile-only nav-menu-wrapper">
        <button class="menu-btn nav-menu-btn" @click="showNavMenu = !showNavMenu">
          <Heart v-if="route.path === '/'" :size="18" class="icon-filled" />
          <Telescope v-else :size="18" class="icon-filled" />
          <ChevronDown :size="16" :class="{ rotated: showNavMenu }" />
        </button>
        <div v-if="showNavMenu" class="dropdown-menu">
          <button @click="navigateTo('/')" class="dropdown-item">
            <Heart :size="16" class="dropdown-icon" />
            <span>{{ t.whatWeLike }}</span>
          </button>
          <button @click="navigateTo('/giphy')" class="dropdown-item">
            <Telescope :size="16" class="dropdown-icon" />
            <span>{{ t.giphy }}</span>
          </button>
        </div>
      </div>

      <router-link to="/" class="logo">
        <span class="aurora-text">
          <span class="aurora-text-content">GifHub</span>
        </span>
      </router-link>

      <!-- Desktop Actions -->
      <div class="actions desktop-only">
        <!-- 语言切换按钮 -->
        <button
          class="btn-icon language-btn"
          :class="{ active: localeStore.locale === 'en-US' }"
          @click="localeStore.toggleLocale()"
          :title="localeStore.locale === 'en-US' ? t.switchToChinese : t.switchToEnglish"
        >
          <span class="language-text">{{ localeStore.locale === 'zh-CN' ? '中' : 'EN' }}</span>
        </button>

        <AnimatedThemeToggler :is-dark="isDark" @toggle="toggleTheme" />

        <!-- 视频设置按钮 -->
        <div ref="videoSettingsRef" class="video-settings-wrapper">
          <button
            class="btn-icon"
            @click="showVideoSettings = !showVideoSettings"
            title="Video Settings"
          >
            <Repeat :size="20" />
          </button>
          <VideoSettingsPopup :show="showVideoSettings" @close="showVideoSettings = false" />
        </div>

        <!-- 通知按钮 -->
        <div ref="notificationRef" class="notification-wrapper">
          <button class="btn-icon notification-btn" @click="toggleNotifications">
            <Mail :size="20" />
            <span v-if="notificationStore.hasUnread" class="notification-badge">{{
              displayCount
            }}</span>
          </button>

          <!-- 通知下拉框 -->
          <transition name="dropdown">
            <div v-if="showNotifications" class="notification-dropdown">
              <div class="notification-header">
                <h3>{{ t.notifications }}</h3>
                <button
                  v-if="notificationStore.hasUnread"
                  class="mark-all-read"
                  @click.stop="markAllAsRead"
                >
                  {{ t.markAllRead }}
                </button>
              </div>

              <div class="notification-list">
                <div
                  v-for="notification in notificationStore.notifications"
                  :key="notification.id"
                  :class="['notification-item', { unread: !notification.isRead }]"
                  @click="markAsRead(notification.id)"
                >
                  <div class="notification-content">
                    <h4>
                      {{ getActionText(notification.actionType, notification.senderNickname) }}
                    </h4>
                    <p>{{ notification.contentSnapshot }}</p>
                    <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
                  </div>
                  <div v-if="!notification.isRead" class="unread-dot"></div>
                </div>

                <div
                  v-if="notificationStore.notifications.length === 0"
                  class="empty-notifications"
                >
                  <Mail :size="48" class="empty-icon" />
                  <p>{{ t.noNotifications }}</p>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <button class="btn-icon" @click="handleUploadClick">
          <Upload :size="20" />
        </button>

        <button v-if="!userStore.isLoggedIn" class="btn-primary" @click="handleLoginClick">
          {{ t.login }}
        </button>
        <button v-else class="btn-icon" @click="handleProfileClick">
          <User :size="20" />
        </button>
      </div>

      <!-- Mobile Actions Menu -->
      <div class="mobile-only actions-menu-wrapper">
        <button class="menu-btn actions-menu-btn" @click="showActionsMenu = !showActionsMenu">
          <Menu :size="20" />
        </button>
        <div v-if="showActionsMenu" class="dropdown-menu dropdown-menu-right">
          <button @click="localeStore.toggleLocale()" class="dropdown-item">
            <Languages :size="16" class="dropdown-icon" />
            <span>{{
              localeStore.locale === 'en-US' ? t.switchToChinese : t.switchToEnglish
            }}</span>
          </button>
          <button @click="toggleTheme" class="dropdown-item">
            {{ isDark ? t.lightMode : t.darkMode }}
          </button>
          <!-- 移动端站内信入口 -->
          <button
            @click="toggleMobileSection('notifications')"
            class="dropdown-item notification-mobile-item"
          >
            <Mail :size="16" class="dropdown-icon" />
            <span>{{ t.notifications }}</span>
            <span v-if="notificationStore.hasUnread" class="mobile-notification-badge">{{
              displayCount
            }}</span>
          </button>
          <!-- 移动端站内信展开面板 -->
          <div v-if="mobileExpandedSection === 'notifications'" class="mobile-expanded-panel">
            <div v-if="notificationStore.notifications.length === 0" class="mobile-empty-state">
              <Mail :size="32" class="empty-icon" />
              <p>{{ t.noNotifications }}</p>
            </div>
            <div v-else class="mobile-notification-list">
              <div
                v-for="notification in notificationStore.notifications.slice(0, 5)"
                :key="notification.id"
                :class="['mobile-notification-item', { unread: !notification.isRead }]"
                @click="markAsRead(notification.id)"
              >
                <div class="notification-text">
                  <span class="notification-title">{{
                    getActionText(notification.actionType, notification.senderNickname)
                  }}</span>
                  <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
                </div>
                <div v-if="!notification.isRead" class="unread-dot"></div>
              </div>
              <button
                v-if="notificationStore.hasUnread"
                class="mark-all-btn"
                @click.stop="markAllAsRead"
              >
                {{ t.markAllRead }}
              </button>
            </div>
          </div>
          <!-- 移动端视频设置入口 -->
          <button @click="toggleMobileSection('settings')" class="dropdown-item">
            <Repeat :size="16" class="dropdown-icon" />
            <span>播放设置</span>
          </button>
          <!-- 移动端视频设置展开面板 -->
          <div v-if="mobileExpandedSection === 'settings'" class="mobile-expanded-panel">
            <div class="mobile-loop-label">循环次数</div>
            <div class="mobile-loop-grid">
              <button
                v-for="option in loopOptions"
                :key="option"
                :class="['mobile-loop-btn', { active: settingsStore.loopCount === option }]"
                @click="handleMobileLoopSelect(option)"
              >
                {{ getLoopDisplayValue(option) }}
              </button>
            </div>
          </div>
          <button @click="handleUploadClick" class="dropdown-item">
            <Upload :size="16" class="dropdown-icon" />
            <span>{{ t.upload }}</span>
          </button>
          <button v-if="!userStore.isLoggedIn" @click="handleLoginClick" class="dropdown-item">
            <User :size="16" class="dropdown-icon" />
            <span>{{ t.login }}</span>
          </button>
          <button v-else @click="handleProfileClick" class="dropdown-item">
            <User :size="16" class="dropdown-icon" />
            <span>{{ t.profile }}</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 100;
  transition: all 0.3s ease;
  border-bottom: 1px solid transparent;
  background: transparent;
}

.navbar.is-scrolled {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

/* Dark mode specific override via global selector or relying on transparent bg + var */
:global(.dark) .navbar.is-scrolled {
  background: rgba(9, 9, 11, 0.8);
}

.navbar-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
}

.logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-decoration: none;
  transition: transform 0.3s ease;
  z-index: 10;
  pointer-events: auto;
}

.logo:hover {
  transform: translateX(-50%) scale(1.05);
}

.aurora-text {
  position: relative;
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  user-select: none;
  white-space: nowrap;
}

.aurora-text-content {
  position: relative;
  z-index: 2;
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
  filter: drop-shadow(0 0 20px rgba(153, 51, 255, 0.6)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  display: inline-block;
}

.aurora-text::before {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  background: linear-gradient(
    90deg,
    rgba(153, 51, 255, 0.3) 0%,
    rgba(255, 102, 102, 0.3) 50%,
    rgba(153, 51, 255, 0.3) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: aurora-glow 3s ease-in-out infinite;
  filter: blur(8px);
}

@keyframes aurora-flow {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes aurora-glow {
  0%,
  100% {
    opacity: 0.5;
    filter: blur(8px);
  }
  50% {
    opacity: 1;
    filter: blur(12px);
  }
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  z-index: 1;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 1;
  margin-left: auto;
}

.nav-item {
  text-decoration: none;
  position: relative;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-full);
  transition: all 0.3s ease;
}

.nav-text {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-muted);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.nav-item:hover .nav-text {
  color: var(--color-text-main);
}

.nav-item:hover {
  background: var(--color-surface-hover);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.1), rgba(255, 102, 102, 0.1));
  box-shadow: 0 0 0 1px rgba(153, 51, 255, 0.2);
}

.nav-item.router-link-active .nav-text {
  background: linear-gradient(90deg, #9933ff, #ff6666);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

:global(.dark) .nav-item.router-link-active {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.15), rgba(255, 102, 102, 0.15));
  box-shadow: 0 0 0 1px rgba(153, 51, 255, 0.3);
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-main);
}

.language-btn .language-text {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.language-btn.active .language-text {
  color: var(--color-primary);
}

.btn-primary {
  height: 40px;
  padding: 0 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: white;
  font-weight: 600;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

.nav-menu-wrapper,
.actions-menu-wrapper {
  position: relative;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.1), rgba(255, 102, 102, 0.1));
  border: 1px solid rgba(153, 51, 255, 0.3);
  border-radius: var(--radius-full);
  color: var(--color-text-main);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(153, 51, 255, 0.15);
}

.menu-btn:hover {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.15), rgba(255, 102, 102, 0.15));
  border-color: rgba(153, 51, 255, 0.4);
  box-shadow: 0 4px 12px rgba(153, 51, 255, 0.25);
  transform: translateY(-1px);
}

.nav-menu-btn {
  min-width: 48px;
  justify-content: center;
}

.actions-menu-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  justify-content: center;
}

.icon-filled {
  color: #ff6666;
}

.rotated {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-menu-right {
  left: auto;
  right: 0;
}

.dropdown-item {
  width: 100%;
  padding: 0.85rem 1.25rem;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--color-text-main);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.08), rgba(255, 102, 102, 0.08));
  padding-left: 1.5rem;
}

.dropdown-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

:global(.dark) .menu-btn {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.15), rgba(255, 102, 102, 0.15));
  border-color: rgba(153, 51, 255, 0.4);
}

:global(.dark) .menu-btn:hover {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.2), rgba(255, 102, 102, 0.2));
  border-color: rgba(153, 51, 255, 0.5);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .navbar-content {
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
  }

  .aurora-text {
    font-size: 1.25rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .aurora-text {
    font-size: 1.5rem;
  }

  .nav-links {
    gap: 0.25rem;
  }

  .nav-item {
    padding: 0.5rem 1rem;
  }

  .nav-text {
    font-size: 0.9rem;
  }
}

/* 通知相关样式 */
.notification-wrapper {
  position: relative;
}

.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: 380px;
  max-height: 500px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.notification-header h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.mark-all-read {
  font-size: 0.85rem;
  color: var(--color-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.mark-all-read:hover {
  background: rgba(99, 102, 241, 0.1);
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: var(--color-surface-hover);
}

.notification-item.unread {
  background: rgba(99, 102, 241, 0.05);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-content h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--color-text-main);
}

.notification-content p {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.5rem;
}

.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.empty-icon {
  opacity: 0.3;
  margin-bottom: 1rem;
}

.notification-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.load-more-btn {
  width: 100%;
  padding: 0.6rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-main);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .notification-dropdown {
    width: 320px;
    max-height: 400px;
  }

  .notification-list {
    max-height: 300px;
  }
}

/* 视频设置按钮包装器 */
.video-settings-wrapper {
  position: relative;
}

/* 移动端站内信样式 */
.notification-mobile-item {
  position: relative;
}

.mobile-notification-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 移动端展开面板 */
.mobile-expanded-panel {
  padding: 0.75rem 1rem;
  background: var(--color-surface-hover);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.mobile-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  color: var(--color-text-muted);
}

.mobile-empty-state .empty-icon {
  opacity: 0.3;
  margin-bottom: 0.5rem;
}

.mobile-notification-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-notification-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.mobile-notification-item:hover {
  background: var(--color-background);
}

.mobile-notification-item.unread {
  background: rgba(99, 102, 241, 0.08);
}

.notification-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-notification-item .notification-time {
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.mobile-notification-item .unread-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
}

.mark-all-btn {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mark-all-btn:hover {
  background: rgba(99, 102, 241, 0.1);
}

/* 移动端循环设置 */
.mobile-loop-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.mobile-loop-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.mobile-loop-btn {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 2px solid transparent;
  border-radius: 8px;
  color: var(--color-text-main);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-loop-btn:hover {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.1), rgba(255, 102, 102, 0.1));
  border-color: rgba(153, 51, 255, 0.3);
}

.mobile-loop-btn.active {
  background: linear-gradient(135deg, rgba(153, 51, 255, 0.2), rgba(255, 102, 102, 0.2));
  border-color: rgba(153, 51, 255, 0.5);
  color: #9933ff;
}

:global(.dark) .mobile-loop-btn {
  background: rgba(255, 255, 255, 0.05);
}

:global(.dark) .mobile-loop-btn.active {
  color: #cc88ff;
}
</style>
