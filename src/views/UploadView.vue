<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, X, FileVideo, ArrowLeft } from 'lucide-vue-next'
import { uploadGif } from '@/api/gif'
import { useAppStore } from '@/stores/app'
import { useLocaleStore } from '@/stores/locale'
import { messages } from '@/locales/messages'

const router = useRouter()
const appStore = useAppStore()
const localeStore = useLocaleStore()
const t = computed(() => messages[localeStore.locale].upload)

const handleBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const title = ref('')
const tags = ref('')
const description = ref('')
const isDragging = ref(false)
const uploading = ref(false)

// 格式化文件名显示：文件名部分超过10个字符时显示为 ...xxxxxxxxxx.gif
const displayFileName = computed(() => {
  if (!file.value) return ''
  const fileName = file.value.name

  // 获取文件扩展名
  const lastDotIndex = fileName.lastIndexOf('.')
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : ''
  const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName

  // 如果文件名部分长度 <= 10，完整显示
  if (nameWithoutExt.length <= 10) return fileName

  // 文件名部分超过10个字符，取最后10个字符
  const truncatedName = nameWithoutExt.slice(-10)
  return `...${truncatedName}${extension}`
})

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const droppedFile = e.dataTransfer?.files[0]
  if (droppedFile && droppedFile.type.startsWith('image/')) {
    file.value = droppedFile
  } else {
    appStore.showToast(t.value.pleaseUploadImage, 'warning')
  }
}

const handleFileSelect = (e: Event) => {
  const selectedFile = (e.target as HTMLInputElement).files?.[0]
  if (selectedFile) {
    file.value = selectedFile
  }
}

const removeFile = () => {
  file.value = null
}

const handleSubmit = async () => {
  if (!file.value || !title.value || !tags.value) return

  // Validate tags
  const tagList = tags.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (tagList.length > 3) {
    appStore.showToast(t.value.maxTagsWarning, 'warning')
    return
  }

  uploading.value = true
  try {
    await uploadGif({
      file: file.value,
      title: title.value,
      tags: tags.value, // Pass as string per DTO
      description: description.value,
    })
    appStore.showToast(t.value.uploadSuccess, 'success')
    router.push('/profile')
  } catch (error) {
    appStore.showToast(t.value.uploadFailed, 'error')
    console.error(error)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="upload-view">
    <!-- Upload Page Header -->
    <div class="upload-header-bar">
      <div class="header-content">
        <button class="back-btn-inline" @click="handleBack">
          <ArrowLeft :size="20" />
        </button>
        <router-link to="/" class="logo">
          <span class="aurora-text">GifHub</span>
        </router-link>
        <div class="spacer"></div>
      </div>
    </div>

    <!-- Hero Banner -->
    <div class="upload-hero">
      <div class="hero-overlay"></div>
      <div class="hero-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
      </div>
    </div>

    <div class="container upload-content">
      <div class="upload-card">
        <!-- Admin Review Warning -->
        <div class="admin-review-warning">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">{{ t.adminReviewWarning }}</span>
        </div>

        <h1 class="title">{{ t.title }}</h1>

        <!-- Drag Drop Area -->
        <div
          class="drop-zone"
          :class="{ active: isDragging, 'has-file': file }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="!file && fileInput?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/gif,video/mp4,image/webp"
            class="hidden-input"
            @change="handleFileSelect"
          />

          <div v-if="!file" class="upload-placeholder">
            <Upload :size="48" class="icon" />
            <h3>{{ t.dragDropHere }}</h3>
            <p>{{ t.orClickToBrowse }}</p>
          </div>

          <div v-else class="file-preview">
            <FileVideo :size="48" class="icon-file" />
            <div class="file-info">
              <span class="filename" :title="file.name">{{ displayFileName }}</span>
              <span class="filesize">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
            </div>
            <button class="remove-btn" @click.stop="removeFile">
              <X :size="20" />
            </button>
          </div>
        </div>

        <!-- Form -->
        <div class="form-group">
          <label>{{ t.titleLabel }}</label>
          <input v-model="title" type="text" :placeholder="t.titlePlaceholder" />
        </div>

        <div class="form-group">
          <label>{{ t.tagsLabel }} <span class="hint">{{ t.tagsHint }}</span></label>
          <input v-model="tags" type="text" :placeholder="t.tagsPlaceholder" />
        </div>

        <div class="form-group">
          <label>{{ t.descriptionLabel }}</label>
          <textarea v-model="description" :placeholder="t.descriptionPlaceholder"></textarea>
        </div>

        <button
          class="upload-btn"
          :disabled="!file || !title || !tags || uploading"
          @click="handleSubmit"
        >
          <span v-if="!uploading">{{ t.uploadButton }}</span>
          <span v-else>{{ t.uploading }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-view {
  min-height: 100vh;
  background: var(--color-background);
  padding-top: 72px;
  padding-bottom: 4rem;
}

/* Upload Page Header */
.upload-header-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

:global(.dark) .upload-header-bar {
  background: rgba(9, 9, 11, 0.8);
}

.header-content {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

@media (min-width: 768px) {
  .header-content {
    padding: 0 2rem;
  }
}

.back-btn-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn-inline:hover {
  background: var(--color-surface-hover);
  transform: translateX(-2px);
}

.logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-decoration: none;
  transition: transform 0.3s ease;
  z-index: 10;
}

.logo:hover {
  transform: translateX(-50%) scale(1.05);
}

.aurora-text {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
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
  filter: drop-shadow(0 0 20px rgba(153, 51, 255, 0.6));
}

@keyframes aurora-flow {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

.spacer {
  width: 40px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .aurora-text {
    font-size: 1.25rem;
  }
}

/* Hero Section */
.upload-hero {
  height: 320px;
  width: 100%;
  position: relative;
  background: var(--gradient-primary);
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, var(--color-background));
  z-index: 1;
}

.hero-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: var(--color-accent);
  top: -100px;
  left: -50px;
  animation: float 20s infinite alternate;
}

.shape-2 {
  width: 400px;
  height: 400px;
  background: var(--color-primary);
  bottom: -150px;
  right: -100px;
  animation: float 25s infinite alternate-reverse;
}

@keyframes float {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(100px, 50px) scale(1.2);
  }
}

/* Content Container */
.upload-content {
  margin-top: -220px;
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
}

.upload-card {
  width: 100%;
  max-width: 600px;
  background: var(--color-surface-glass);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-glass);
  padding: 2.5rem;
  box-shadow: var(--shadow-glass);
}

/* Admin Review Warning */
.admin-review-warning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
  backdrop-filter: blur(8px);
}

.warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning-text {
  color: #f59e0b;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
}

.title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 2rem;
  text-align: center;
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3rem;
  text-align: center;
  margin-bottom: 2rem;
  transition: all 0.2s;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
}

.drop-zone.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.05);
}

.drop-zone:hover {
  border-color: var(--color-primary-hover);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: var(--color-border);
  cursor: default;
}

.hidden-input {
  display: none;
}

.upload-placeholder .icon {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.upload-placeholder h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.upload-placeholder p {
  color: var(--color-text-dim);
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-file {
  color: var(--color-primary);
}

.file-info {
  flex: 1;
  text-align: left;
}

.filename {
  display: block;
  font-weight: 600;
}

.filesize {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.remove-btn {
  color: var(--color-text-muted);
  padding: 0.5rem;
  border-radius: 50%;
}

.remove-btn:hover {
  background: var(--color-surface-hover);
  color: #ef4444;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: normal;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  transition: all 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.upload-btn {
  width: 100%;
  padding: 1rem;
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  border-radius: var(--radius-lg);
  margin-top: 1rem;
  transition: all 0.2s;
}

.upload-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .upload-hero {
    height: 200px;
  }

  .upload-content {
    margin-top: -140px;
  }

  .upload-card {
    padding: 1.5rem;
  }

  .admin-review-warning {
    padding: 0.875rem 1rem;
    gap: 0.5rem;
  }

  .warning-icon {
    font-size: 1.1rem;
  }

  .warning-text {
    font-size: 0.875rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .drop-zone {
    padding: 2rem;
  }
}
</style>
