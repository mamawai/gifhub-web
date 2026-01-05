<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ToastNotification from '@/components/ToastNotification.vue'
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const settingsStore = useSettingsStore()
const transitionName = ref('fade')

// 需要连接通知的页面
const pagesWithNotification = ['/', '/giphy']

watch(
  () => route.path,
  (to, from) => {
    // Define route depth/order
    const getDepth = (path: string) => {
      if (path === '/') return 0
      if (path === '/giphy') return 1
      if (path.startsWith('/gif/')) return 2 // Detail pages deeper
      return 0 // Default
    }

    const toDepth = getDepth(to)
    const fromDepth = getDepth(from || '/') // handle initial load 'from' undefined

    if (toDepth > fromDepth) {
      transitionName.value = 'slide-left'
    } else if (toDepth < fromDepth) {
      transitionName.value = 'slide-right'
    } else {
      transitionName.value = 'fade'
    }

    // 只在 HomeView 和 GiphyView 连接通知
    if (userStore.isLoggedIn && pagesWithNotification.includes(to)) {
      if (!notificationStore.isConnected) {
        notificationStore.connect()
      }
    }
  },
  { immediate: true },
)

// 页面加载时确保主题正确应用
onMounted(() => {
  if (settingsStore.isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <ToastNotification />
  <div class="router-view-container">
    <RouterView v-slot="{ Component, route }">
      <Transition :name="transitionName" mode="out-in">
        <KeepAlive :include="['HomeView', 'GiphyView']">
          <component :is="Component" :key="route.path" class="view-content" />
        </KeepAlive>
      </Transition>
    </RouterView>
  </div>
</template>

<style>
.router-view-container {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.view-content {
  width: 100%;
  will-change: opacity, transform;
}

/* Base Transition Settings */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

/* Slide Left (Go Deeper) */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Slide Right (Go Back) */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Fade Fallback */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
