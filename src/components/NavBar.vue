<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Upload, User, Menu, Sun, Moon } from 'lucide-vue-next'
import { getToken } from '@/utils/auth'

const router = useRouter()
const isScrolled = ref(false)
const isDark = ref(false) // Toggle state

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

// Check initial theme preference
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleLoginClick = () => {
  router.push('/login')
}

const isLoggedIn = computed(() => !!getToken())

const handleUploadClick = () => {
  if (!isLoggedIn.value) return router.push('/login')
  router.push('/upload') // Will implement later
}
</script>

<template>
  <nav :class="['navbar', { 'is-scrolled': isScrolled }]">
    <div class="container navbar-content">
      <router-link to="/" class="logo">
        <span class="logo-text">Gif<span class="logo-highlight">Hub</span></span>
      </router-link>

      <div class="search-bar">
        <Search class="search-icon" :size="18" />
        <input type="text" placeholder="Search for GIFs, Stickers..." />
      </div>

      <div class="actions">
        <!-- Theme Toggle -->
        <button class="btn-icon" @click="toggleTheme" title="Toggle Theme">
          <Sun v-if="!isDark" :size="20" />
          <Moon v-else :size="20" />
        </button>

        <button class="btn-icon" @click="handleUploadClick">
          <Upload :size="20" />
        </button>

        <button v-if="!isLoggedIn" class="btn-primary" @click="handleLoginClick">Login</button>
        <button v-else class="btn-icon">
          <User :size="20" />
        </button>

        <button class="btn-icon mobile-menu">
          <Menu :size="20" />
        </button>
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
  gap: 2rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: var(--color-text-main);
  user-select: none;
}

.logo-highlight {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-bar {
  flex: 1;
  max-width: 500px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-bar input {
  width: 100%;
  height: 44px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0 1rem 0 3rem;
  color: var(--color-text-main);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.search-bar input:focus {
  outline: none;
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.mobile-menu {
  display: none;
}

@media (max-width: 768px) {
  .search-bar {
    display: none; /* Hide search on mobile for simplicity initially */
  }
  .mobile-menu {
    display: flex;
  }
}
</style>
