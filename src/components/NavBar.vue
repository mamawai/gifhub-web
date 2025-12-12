<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Upload, User, Menu, ChevronDown, Heart, Telescope } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import AnimatedThemeToggler from '@/components/AnimatedThemeToggler.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isScrolled = ref(false)
const isDark = ref(false)
const showNavMenu = ref(false)
const showActionsMenu = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
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
  isDark.value = false
  document.documentElement.classList.remove('dark')
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
          <span class="nav-text">What We Like</span>
        </router-link>
        <router-link to="/giphy" class="nav-item">
          <span class="nav-text">GIPHY</span>
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
            <span>What We Like</span>
          </button>
          <button @click="navigateTo('/giphy')" class="dropdown-item">
            <Telescope :size="16" class="dropdown-icon" />
            <span>GIPHY</span>
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
        <AnimatedThemeToggler :is-dark="isDark" @toggle="toggleTheme" />

        <button class="btn-icon" @click="handleUploadClick">
          <Upload :size="20" />
        </button>

        <button v-if="!userStore.isLoggedIn" class="btn-primary" @click="handleLoginClick">
          Login
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
          <button @click="toggleTheme" class="dropdown-item">
            {{ isDark ? '☀️ 浅色模式' : '🌙 深色模式' }}
          </button>
          <button @click="handleUploadClick" class="dropdown-item">
            <Upload :size="16" class="dropdown-icon" />
            <span>上传</span>
          </button>
          <button v-if="!userStore.isLoggedIn" @click="handleLoginClick" class="dropdown-item">
            <User :size="16" class="dropdown-icon" />
            <span>登录</span>
          </button>
          <button v-else @click="handleProfileClick" class="dropdown-item">
            <User :size="16" class="dropdown-icon" />
            <span>个人信息</span>
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
</style>
