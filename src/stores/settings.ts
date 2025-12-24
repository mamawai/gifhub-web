import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 循环次数类型: 0-9 或 'infinite'
export type LoopCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'infinite'

const STORAGE_KEY = 'gifhub-video-settings'

interface VideoSettings {
  loopCount: LoopCount
}

const defaultSettings: VideoSettings = {
  loopCount: 5,
}

// 从 localStorage 加载设置
const loadSettings = (): VideoSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        loopCount: parsed.loopCount ?? defaultSettings.loopCount,
      }
    }
  } catch (e) {
    console.warn('Failed to load video settings:', e)
  }
  return { ...defaultSettings }
}

// 保存设置到 localStorage
const saveSettings = (settings: VideoSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save video settings:', e)
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const initialSettings = loadSettings()

  const loopCount = ref<LoopCount>(initialSettings.loopCount)

  // 监听变化并持久化
  watch(loopCount, () => {
    saveSettings({ loopCount: loopCount.value })
  })

  const setLoopCount = (count: LoopCount) => {
    loopCount.value = count
  }

  return {
    loopCount,
    setLoopCount,
  }
})
