<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ToastNotification from '@/components/ToastNotification.vue'
import { ref, watch, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const transitionName = ref('fade')

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
  },
)

// 监听用户登录状态，初始化通知
watch(
  () => userStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      notificationStore.connect()
    } else {
      notificationStore.disconnect()
    }
  },
  { immediate: true }, // 立即执行，无需在 onMounted 中重复调用
)

onUnmounted(() => {
  notificationStore.disconnect()
})
</script>

<template>
  <ToastNotification />
  <div class="router-view-container">
    <RouterView v-slot="{ Component, route }">
      <Transition :name="transitionName" mode="default">
        <!-- mode="default" is important for simultaneous transitions -->
        <KeepAlive :include="['HomeView']">
          <component :is="Component" :key="route.path" class="view-content" />
        </KeepAlive>
      </Transition>
    </RouterView>
  </div>
</template>

<style>
.router-view-container {
  display: grid;
  grid-template-areas: 'content';
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.view-content {
  grid-area: content;
  width: 100%;
  backface-visibility: hidden; /* Reduce flickering */
}

/* Base Transition Settings */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Slide Left (Go Deeper) - New comes from Right, Old goes Left */
.slide-left-enter-from {
  opacity: 0;
  transform: translate3d(50px, 0, 0) scale(0.95);
  filter: blur(10px);
  z-index: 2;
}
.slide-left-enter-to {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: blur(0);
  z-index: 2;
}

.slide-left-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  z-index: 1;
}
.slide-left-leave-to {
  opacity: 0;
  transform: translate3d(-50px, 0, 0) scale(0.95);
  filter: blur(10px);
  z-index: 1;
}

/* Slide Right (Go Back) - New comes from Left, Old goes Right */
.slide-right-enter-from {
  opacity: 0;
  transform: translate3d(-50px, 0, 0) scale(0.95);
  filter: blur(10px);
  z-index: 2;
}
.slide-right-enter-to {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: blur(0);
  z-index: 2;
}

.slide-right-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  z-index: 1;
}
.slide-right-leave-to {
  opacity: 0;
  transform: translate3d(50px, 0, 0) scale(0.95);
  filter: blur(10px);
  z-index: 1;
}

/* Fade Fallback */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
