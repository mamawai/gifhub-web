import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Locale = 'zh-CN' | 'en-US'

export const useLocaleStore = defineStore('locale', () => {
  // 从localStorage读取保存的语言，默认中文
  const locale = ref<Locale>((localStorage.getItem('locale') as Locale) || 'zh-CN')

  // 切换语言
  function toggleLocale() {
    locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  }

  // 设置语言
  function setLocale(newLocale: Locale) {
    locale.value = newLocale
  }

  // 监听语言变化，保存到localStorage
  watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale)
  })

  return {
    locale,
    toggleLocale,
    setLocale,
  }
})
