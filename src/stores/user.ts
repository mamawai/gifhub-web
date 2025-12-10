import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo as getUserInfoApi } from '@/api/user'
import { getToken, setToken as setAuthToken, removeToken as removeAuthToken } from '@/utils/auth'
import type { EmailLoginDTO, UserInfoVO } from '@/api/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken() || '')
  const userInfo = ref<UserInfoVO | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    setAuthToken(newToken)
  }

  function clearToken() {
    token.value = ''
    removeAuthToken()
  }

  async function login(data: EmailLoginDTO) {
    try {
      const res = await loginApi(data)
      if (res?.token) {
        setToken(res.token)
        await fetchUserInfo()
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed', error)
      throw error
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      clearToken()
      userInfo.value = null
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try {
      const res = await getUserInfoApi()
      if (res) {
        userInfo.value = res
      }
    } catch (error) {
      console.error('Fetch user info failed', error)
    }
  }

  // Initialize
  if (token.value) {
    fetchUserInfo()
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    fetchUserInfo,
  }
})
