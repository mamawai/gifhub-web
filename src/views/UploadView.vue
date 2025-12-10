<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, X, FileVideo } from 'lucide-vue-next'
import { uploadGif } from '@/api/gif'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const title = ref('')
const tags = ref('')
const description = ref('')
const isDragging = ref(false)
const uploading = ref(false)

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const droppedFile = e.dataTransfer?.files[0]
  if (droppedFile && droppedFile.type.startsWith('image/')) {
    file.value = droppedFile
  } else {
    appStore.showToast('Please upload an image file (GIF)', 'warning')
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
    appStore.showToast('Max 3 tags allowed', 'warning')
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
    appStore.showToast('Upload successful!', 'success')
    router.push('/profile')
  } catch (error) {
    appStore.showToast('Upload failed', 'error')
    console.error(error)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="upload-view container">
    <div class="upload-card">
      <h1 class="title">Upload GIF</h1>

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
          <h3>Drag & drop your GIF here</h3>
          <p>or click to browse</p>
        </div>

        <div v-else class="file-preview">
          <FileVideo :size="48" class="icon-file" />
          <div class="file-info">
            <span class="filename">{{ file.name }}</span>
            <span class="filesize">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
          </div>
          <button class="remove-btn" @click.stop="removeFile">
            <X :size="20" />
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="form-group">
        <label>Title</label>
        <input v-model="title" type="text" placeholder="Give it a catchy title" />
      </div>

      <div class="form-group">
        <label>Tags <span class="hint">(Comma separated, max 3)</span></label>
        <input v-model="tags" type="text" placeholder="funny, cat, meme" />
      </div>

      <div class="form-group">
        <label>Description (Optional)</label>
        <textarea v-model="description" placeholder="Tell us more about this GIF"></textarea>
      </div>

      <button
        class="upload-btn"
        :disabled="!file || !title || !tags || uploading"
        @click="handleSubmit"
      >
        <span v-if="!uploading">Upload GIF</span>
        <span v-else>Uploading...</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.upload-view {
  padding-top: 120px;
  min-height: 100vh;
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
</style>
