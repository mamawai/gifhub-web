<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Mail, Lock, MessageSquare, ArrowRight, Languages } from 'lucide-vue-next'
import { getCode, emailRegister, getPublicKey, sendResetPasswordCode, resetPassword, ipPreCheck } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { useLocaleStore } from '@/stores/locale'
import { messages } from '@/locales/messages'
import rsaEncrypt from '@/utils/encrypt'
import { generateFingerprint } from '@/utils/fingerprint'
import type { ProxyCheckResponse } from '@/api/types'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const localeStore = useLocaleStore()
const t = computed(() => messages[localeStore.locale].login)

const activeTab = ref<'password' | 'code'>('password')
const showPassword = ref(false)

// Forms
const email = ref('')
const password = ref('')
const code = ref('')

// Loading states
const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)
const codeText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}s`
  }
  if (codeLoading.value) {
    return t.value.sendCode
  }
  return t.value.sendCode
})

// Register Modal
const showRegisterModal = ref(false)
const registerPassword = ref('')
const registerConfirmPassword = ref('')
const registerCode = ref('')

// Reset Password Modal
const showResetPasswordModal = ref(false)
const resetEmail = ref('')
const resetCode = ref('')
const resetNewPassword = ref('')
const resetConfirmPassword = ref('')
const resetCodeLoading = ref(false)
const resetCountdown = ref(0)
const resetCodeText = computed(() => {
  if (resetCountdown.value > 0) {
    return `${resetCountdown.value}s`
  }
  if (resetCodeLoading.value) {
    return t.value.sendCode
  }
  return t.value.sendCode
})

// ProxyCheck检测
const proxyCheckData = ref<ProxyCheckResponse | null>(null)
const ipCheckLoading = ref(false)

// 浏览器指纹
const browserFingerprint = ref('')

// Validation
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// 初始化ProxyCheck检测和指纹
const initSecurityCheck = async () => {
  ipCheckLoading.value = true
  try {
    const ipData = await ipPreCheck()
    proxyCheckData.value = ipData
  } catch (error) {
    console.error('ProxyCheck检测失败:', error)
  } finally {
    ipCheckLoading.value = false
  }

  // 生成浏览器指纹
  try {
    browserFingerprint.value = await generateFingerprint()
  } catch (error) {
    console.error('指纹生成失败:', error)
  }
}

// Actions
const switchTab = (tab: 'password' | 'code') => {
  activeTab.value = tab
}

// 组件挂载时初始化
onMounted(() => {
  initSecurityCheck()
})

const handleGetCode = async () => {
  if (countdown.value > 0 || codeLoading.value) return
  if (!validateEmail(email.value)) {
    alert(t.value.invalidEmail)
    return
  }

  codeLoading.value = true
  try {
    const res = await getCode({ email: email.value })
    if (res === true) {
      startCountdown()
    } else {
      alert(t.value.sendCodeFailed)
    }
  } catch (err: unknown) {
    const error = err as Error
    alert(error.message || t.value.errorSendingCode)
  } finally {
    codeLoading.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleLogin = async () => {
  if (!validateEmail(email.value)) {
    appStore.showToast(t.value.invalidEmailFormat, 'warning')
    return
  }

  loading.value = true

  try {
    let finalPassword = password.value

    // Encrypt password if in password mode
    if (activeTab.value === 'password') {
      const pubKeyRes = await getPublicKey()
      if (pubKeyRes) {
        rsaEncrypt.setPublicKey(pubKeyRes)
        const encrypted = rsaEncrypt.encryptPassword(finalPassword)
        if (encrypted) finalPassword = encrypted
      }
    }

    await userStore.login({
      loginType: activeTab.value === 'password' ? 1 : 2,
      email: email.value,
      password: finalPassword,
      verificationCode: code.value,
    })

    appStore.showToast(t.value.welcomeBack, 'success')
    router.push('/')
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; message?: string }; message?: string }
    console.error(error)

    // 1001错误：用户不存在，需要注册（仅验证码模式）
    if (error.response?.status === 1001 && activeTab.value === 'code') {
      registerCode.value = code.value
      showRegisterModal.value = true
      appStore.showToast(t.value.completeRegistration, 'info')
    } else {
      appStore.showToast(error.response?.message || error.message || t.value.loginFailed, 'error')
    }
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  // 验证密码
  if (!registerPassword.value || registerPassword.value.length < 6) {
    appStore.showToast(t.value.passwordMinLength, 'warning')
    return
  }
  if (registerPassword.value !== registerConfirmPassword.value) {
    appStore.showToast(t.value.passwordsNotMatch, 'warning')
    return
  }

  try {
    // 获取公钥并加密密码
    const pubKeyRes = await getPublicKey()
    if (!pubKeyRes) {
      appStore.showToast('获取公钥失败', 'error')
      return
    }

    rsaEncrypt.setPublicKey(pubKeyRes)
    const encrypted = rsaEncrypt.encryptPassword(registerPassword.value)

    if (!encrypted) {
      appStore.showToast('密码加密失败', 'error')
      return
    }

    // 调用注册接口，返回 LoginResultVO
    const result = await emailRegister({
      email: email.value,
      password: encrypted,
      verificationCode: registerCode.value,
      fingerprint: browserFingerprint.value
    })

    // 注册成功，使用返回的 token 设置登录状态
    if (result && result.token) {
      userStore.setToken(result.token)
      await userStore.fetchUserInfo()
      appStore.showToast(t.value.accountCreated, 'success')

      // 关闭弹窗并跳转
      showRegisterModal.value = false
      router.push('/')
    } else {
      appStore.showToast('注册成功但未获取到令牌', 'error')
    }
  } catch (err: unknown) {
    const error = err as Error
    appStore.showToast(error.message || t.value.registrationFailed, 'error')
  }
}

// Reset Password Functions
const openResetPasswordModal = () => {
  resetEmail.value = email.value
  showResetPasswordModal.value = true
}

const handleGetResetCode = async () => {
  if (resetCountdown.value > 0 || resetCodeLoading.value) return
  if (!validateEmail(resetEmail.value)) {
    appStore.showToast(t.value.invalidEmail, 'warning')
    return
  }

  resetCodeLoading.value = true
  try {
    const res = await sendResetPasswordCode(resetEmail.value)
    if (res === true) {
      startResetCountdown()
      appStore.showToast(t.value.resetCodeSent, 'success')
    } else {
      appStore.showToast(t.value.sendCodeFailed, 'error')
    }
  } catch (err: unknown) {
    const error = err as Error
    appStore.showToast(error.message || t.value.errorSendingCode, 'error')
  } finally {
    resetCodeLoading.value = false
  }
}

const startResetCountdown = () => {
  resetCountdown.value = 60
  const timer = setInterval(() => {
    resetCountdown.value--
    if (resetCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleResetPassword = async () => {
  if (!resetCode.value) {
    appStore.showToast(t.value.pleaseEnterCode, 'warning')
    return
  }
  if (!resetNewPassword.value || resetNewPassword.value.length < 6) {
    appStore.showToast(t.value.passwordMinLength, 'warning')
    return
  }
  if (resetNewPassword.value !== resetConfirmPassword.value) {
    appStore.showToast(t.value.passwordsNotMatch, 'warning')
    return
  }

  try {
    const pubKeyRes = await getPublicKey()
    if (pubKeyRes) {
      rsaEncrypt.setPublicKey(pubKeyRes)
      const encrypted = rsaEncrypt.encryptPassword(resetNewPassword.value)

      if (encrypted) {
        const result = await resetPassword({
          email: resetEmail.value,
          verificationCode: resetCode.value,
          newPassword: encrypted,
        })

        if (result) {
          appStore.showToast(t.value.resetPasswordSuccess, 'success')
          showResetPasswordModal.value = false
          // Switch to password tab and set the email
          activeTab.value = 'password'
          email.value = resetEmail.value
          // Clear reset form
          resetEmail.value = ''
          resetCode.value = ''
          resetNewPassword.value = ''
          resetConfirmPassword.value = ''
          resetCountdown.value = 0
        } else {
          appStore.showToast(t.value.resetPasswordFailed, 'error')
        }
      }
    }
  } catch (err: unknown) {
    const error = err as Error
    appStore.showToast(error.message || t.value.resetPasswordFailed, 'error')
  }
}
</script>

<template>
  <div class="login-view">
    <!-- Language Switcher -->
    <button
      class="language-switcher"
      @click="localeStore.toggleLocale()"
      title="切换语言 / Switch Language"
    >
      <Languages :size="20" />
      <span>{{ localeStore.locale === 'zh-CN' ? '中文' : 'EN' }}</span>
    </button>
    <!-- Rainbow Stack Background (Horizontal Stripes arranged Vertically) -->
    <div class="rainbow-stack">
      <!-- Loop 1 -->
      <div class="h-bar c-1"></div>
      <div class="h-bar c-2"></div>
      <div class="h-bar c-3"></div>
      <div class="h-bar c-4"></div>
      <div class="h-bar c-5"></div>
      <div class="h-bar c-6"></div>
      <div class="h-bar c-7"></div>
      <!-- Loop 2 -->
      <div class="h-bar c-1"></div>
      <div class="h-bar c-2"></div>
      <div class="h-bar c-3"></div>
      <div class="h-bar c-4"></div>
      <div class="h-bar c-5"></div>
      <div class="h-bar c-6"></div>
      <div class="h-bar c-7"></div>

      <!-- Floating Emojis -->
      <div class="floater f-1">🚀</div>
      <div class="floater f-2">👾</div>
      <div class="floater f-3">✨</div>
    </div>

    <div class="login-wrapper animate-entrance">
      <div class="brand-section">
        <div class="logo-container">
          <h1>Gif<span class="highlight">Hub</span></h1>
        </div>
        <p class="tagline">{{ t.tagline }}</p>
      </div>

      <div class="card glass-effect">
        <!-- Laser Border -->
        <div class="laser-border"></div>

        <div class="tabs-container">
          <div
            class="tabs-bg"
            :style="{ transform: activeTab === 'password' ? 'translateX(0)' : 'translateX(100%)' }"
          ></div>
          <button
            :class="['tab-btn', { active: activeTab === 'password' }]"
            @click="switchTab('password')"
          >
            {{ t.password }}
          </button>
          <button :class="['tab-btn', { active: activeTab === 'code' }]" @click="switchTab('code')">
            {{ t.otpCode }}
          </button>
        </div>

        <div class="form-content">
          <transition name="fade-slide" mode="out-in">
            <div :key="activeTab" class="input-group-container">
              <!-- Shared Email Input -->
              <div class="input-group">
                <label>{{ t.emailAddress }}</label>
                <div class="input-wrapper">
                  <Mail class="field-icon" :size="20" />
                  <input v-model="email" type="email" :placeholder="t.emailPlaceholder" />
                </div>
              </div>

              <!-- Password Input -->
              <div v-if="activeTab === 'password'" class="input-group">
                <label>{{ t.passwordLabel }}</label>
                <div class="input-wrapper">
                  <Lock class="field-icon" :size="20" />
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="t.passwordPlaceholder"
                  />
                  <button class="eye-btn" @click="showPassword = !showPassword">
                    <Eye v-if="!showPassword" :size="20" />
                    <EyeOff v-else :size="20" />
                  </button>
                </div>
                <div class="input-footer">
                  <div class="forgot-link" @click="openResetPasswordModal">{{ t.forgotPassword }}</div>
                </div>
              </div>

              <!-- OTP Input -->
              <div v-if="activeTab === 'code'" class="input-group">
                <label>{{ t.verificationCode }}</label>
                <div class="input-wrapper">
                  <MessageSquare class="field-icon" :size="20" />
                  <input v-model="code" type="text" :placeholder="t.verificationPlaceholder" />
                  <button
                    class="otp-btn"
                    :disabled="countdown > 0 || codeLoading"
                    @click="handleGetCode"
                  >
                    {{ codeText }}
                  </button>
                </div>
                <div class="input-footer">
                  <!-- Reserved space to keep height stable -->
                </div>
              </div>
            </div>
          </transition>

          <button class="submit-btn" :disabled="loading" @click="handleLogin">
            <span v-if="!loading">{{ t.continue }}</span>
            <span v-else class="spinner-sm"></span>
            <ArrowRight v-if="!loading" :size="20" />
          </button>

          <!-- ProxyCheck 风险显示 -->
          <div v-if="proxyCheckData" class="risk-display">
            <div class="risk-item">
              <span class="risk-label">风险分数:</span>
              <span
                class="risk-value"
                :class="{
                  'safe': proxyCheckData.risk < 30,
                  'warning': proxyCheckData.risk >= 30 && proxyCheckData.risk < 60,
                  'danger': proxyCheckData.risk >= 60
                }"
              >
                {{ proxyCheckData.risk }}/100
              </span>
            </div>
            <div class="risk-item">
              <span class="risk-label">代理状态:</span>
              <span :class="proxyCheckData.proxy ? 'proxy-on' : 'proxy-off'">
                {{ proxyCheckData.proxy ? '已开启' : '未开启' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Register Modal (Glassmorphism) -->
    <div v-if="showRegisterModal" class="modal-overlay">
      <div class="modal glass-effect">
        <h3>{{ t.welcomeAboard }}</h3>
        <p>{{ t.setPassword }}</p>

        <div class="input-group">
          <div class="input-wrapper">
            <input v-model="registerPassword" type="password" :placeholder="t.newPassword" />
          </div>
        </div>
        <div class="input-group">
          <div class="input-wrapper">
            <input
              v-model="registerConfirmPassword"
              type="password"
              :placeholder="t.confirmPassword"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-text" @click="showRegisterModal = false">{{ t.cancel }}</button>
          <button class="btn-primary" @click="handleRegister">{{ t.createAccount }}</button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetPasswordModal" class="modal-overlay">
      <div class="modal glass-effect">
        <h3>{{ t.resetPasswordTitle }}</h3>
        <p>{{ t.resetPasswordDesc }}</p>

        <div class="input-group">
          <label>{{ t.emailAddress }}</label>
          <div class="input-wrapper">
            <Mail class="field-icon" :size="20" />
            <input v-model="resetEmail" type="email" :placeholder="t.emailPlaceholder" />
          </div>
        </div>

        <div class="input-group">
          <label>{{ t.verificationCode }}</label>
          <div class="input-wrapper">
            <MessageSquare class="field-icon" :size="20" />
            <input v-model="resetCode" type="text" :placeholder="t.verificationPlaceholder" />
            <button
              class="otp-btn"
              :disabled="resetCountdown > 0 || resetCodeLoading"
              @click="handleGetResetCode"
            >
              {{ resetCodeText }}
            </button>
          </div>
        </div>

        <div class="input-group">
          <label>{{ t.newPassword }}</label>
          <div class="input-wrapper">
            <input v-model="resetNewPassword" type="password" :placeholder="t.newPassword" />
          </div>
        </div>

        <div class="input-group">
          <label>{{ t.confirmPassword }}</label>
          <div class="input-wrapper">
            <input
              v-model="resetConfirmPassword"
              type="password"
              :placeholder="t.confirmPassword"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-text" @click="showResetPasswordModal = false">{{ t.cancel }}</button>
          <button class="btn-primary" @click="handleResetPassword">{{ t.resetPassword }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Language Switcher */
.language-switcher {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.language-switcher:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .language-switcher {
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
}

/* Core Layout */
.login-view {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
  color: white;
  font-family: 'Inter', sans-serif;
}

/* Rainbow Stack Container */
.rainbow-stack {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column; /* Vertically arranged stripes */
  z-index: 0;
}

.h-bar {
  flex: 1; /* Distribute height equally */
  width: 100%;
  min-height: 2vh; /* Ensure some height */
  animation: stack-wave 3s ease-in-out infinite;
  will-change: transform;
  transform-origin: center;
  position: relative;
  z-index: 1;
}

/* Colors - Darker Rainbow Spectrum */
.c-1 {
  background: #7f1d1d;
} /* Red 900 */
.c-2 {
  background: #9a3412;
} /* Orange 800 */
.c-3 {
  background: #854d0e;
} /* Yellow 800 */
.c-4 {
  background: #14532d;
} /* Green 900 */
.c-5 {
  background: #0e7490;
} /* Cyan 700 */
.c-6 {
  background: #1e3a8a;
} /* Blue 900 */
.c-7 {
  background: #581c87;
} /* Purple 900 */
/* Reuse colors for loops, but we need delays to ripple across whole screen?
   Actually if we reuse classes c-1...c-7, the delay resets.
   To create a continuous wave down the WHOLE screen, we can use CSS nth-child */

.h-bar:nth-child(1) {
  animation-delay: 0s;
}
.h-bar:nth-child(2) {
  animation-delay: 0.1s;
}
.h-bar:nth-child(3) {
  animation-delay: 0.2s;
}
.h-bar:nth-child(4) {
  animation-delay: 0.3s;
}
.h-bar:nth-child(5) {
  animation-delay: 0.4s;
}
.h-bar:nth-child(6) {
  animation-delay: 0.5s;
}
.h-bar:nth-child(7) {
  animation-delay: 0.6s;
}
.h-bar:nth-child(8) {
  animation-delay: 0.7s;
}
.h-bar:nth-child(9) {
  animation-delay: 0.8s;
}
.h-bar:nth-child(10) {
  animation-delay: 0.9s;
}
.h-bar:nth-child(11) {
  animation-delay: 1s;
}
.h-bar:nth-child(12) {
  animation-delay: 1.1s;
}
.h-bar:nth-child(13) {
  animation-delay: 1.2s;
}
.h-bar:nth-child(14) {
  animation-delay: 1.3s;
}

@keyframes stack-wave {
  0%,
  100% {
    transform: scaleY(1);
    filter: brightness(1);
  }
  50% {
    transform: scaleY(1.5); /* Squeeze vertically / expand height */
    filter: brightness(1.3);
    z-index: 2; /* Pop over */
  }
}

/* Floating Emojis Redux */
.floater {
  position: absolute;
  font-size: 3rem;
  top: 50%;
  left: 50%;
  animation: float-around 15s infinite linear;
  opacity: 0.9;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  pointer-events: none;
  z-index: 10;
}

.f-1 {
  animation-duration: 25s;
  animation-delay: 0s;
}
.f-2 {
  animation-duration: 30s;
  animation-delay: -5s;
  font-size: 4rem;
}
.f-3 {
  animation-duration: 20s;
  animation-delay: -10s;
}

@keyframes float-around {
  0% {
    transform: translate(-50vw, -50vh) rotate(0deg);
  }
  25% {
    transform: translate(40vw, -20vh) rotate(90deg);
  }
  50% {
    transform: translate(20vw, 40vh) rotate(180deg);
  }
  75% {
    transform: translate(-30vw, 20vh) rotate(270deg);
  }
  100% {
    transform: translate(-50vw, -50vh) rotate(360deg);
  }
}

/* Wrapper */
.login-wrapper {
  position: relative;
  z-index: 20; /* Ensure above background */
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  flex-direction: column;
  gap: 2rem;
}

.brand-section {
  text-align: center;
  margin-bottom: 1rem;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.logo-icon {
  color: #6366f1;
}

.brand-section h1 {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.highlight {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tagline {
  color: #a1a1aa;
  font-size: 1rem;
}

/* Glass Card */
.glass-effect {
  background: rgba(24, 24, 27, 0.6);
  backdrop-filter: blur(20px);
  /* border: 1px solid rgba(255, 255, 255, 0.08); Remove border, laser takes over */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}

.card {
  border-radius: 24px;
  padding: 2.5rem;
  /* overflow: hidden; Remove overflow to prevent clipping of glow if we wanted outer glow */
  /* But for border mask we need internal clipping usually */
}

/* Laser Border Animation */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@property --beam-width {
  syntax: '<percentage>';
  initial-value: 20%;
  inherits: false;
}

.laser-border {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1.5px; /* Border thickness */
  background: conic-gradient(
    from var(--angle),
    transparent calc(100% - var(--beam-width)),
    white 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  animation: laser-spin 4s infinite linear;
  z-index: 2; /* On top of glass background */
}

@keyframes laser-spin {
  /* --- Top Half (0 -> 180) --- */
  0% {
    --angle: 0deg;
    --beam-width: 5%;
  }
  12% {
    --angle: 100deg; /* Head shoots forward significantly */
    --beam-width: 30%; /* Expand width (Tail moves forward) */
  }
  25% {
    --angle: 170deg;
    --beam-width: 30%;
  }
  30% {
    --angle: 180deg; /* Arrive */
    --beam-width: 5%; /* Compress */
  }
  50% {
    --angle: 195deg; /* Creep/Wait */
    --beam-width: 5%;
  }

  /* --- Bottom Half (180 -> 360) --- */
  62% {
    --angle: 295deg; /* Head shoots forward (195 + 100) */
    --beam-width: 30%; /* Expand width */
  }
  75% {
    --angle: 350deg;
    --beam-width: 30%;
  }
  80% {
    --angle: 360deg; /* Arrive */
    --beam-width: 5%; /* Compress */
  }
  100% {
    --angle: 375deg; /* Creep/Wait */
    --beam-width: 5%;
  }
}

/* Tabs */
.tabs-container {
  position: relative;
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 2px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.tabs-bg {
  position: absolute;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  left: 2px;
  top: 2px;
}

.tab-btn {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 0.6rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #71717a;
  transition: color 0.3s;
}

.tab-btn.active {
  color: white;
}

/* Inputs */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group-container {
  display: flex;
  flex-direction: column;
}

.input-footer {
  height: 20px; /* Fixed height for the action area */
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.input-group label {
  font-size: 0.85rem;
  color: #a1a1aa;
  margin-left: 0.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 1rem;
  color: #52525b;
  pointer-events: none;
  transition: color 0.2s;
}

input {
  width: 100%;
  height: 52px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 0 1rem 0 3rem;
  color: white;
  font-size: 1rem;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

input:focus + .field-icon,
.input-wrapper:focus-within .field-icon {
  color: #6366f1;
}

/* Buttons inside inputs */
.eye-btn {
  position: absolute;
  right: 1rem;
  color: #52525b;
}

.eye-btn:hover {
  color: white;
}

.otp-btn {
  position: absolute;
  right: 0.5rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-weight: 500;
}

.otp-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.otp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Submit */
.submit-btn {
  width: 100%;
  height: 56px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 16px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
}

.submit-btn:active {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* 风险显示 */
.risk-display {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.risk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.risk-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.risk-value {
  font-weight: 700;
  font-size: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.risk-value.safe {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.risk-value.warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.risk-value.danger {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.proxy-on {
  color: #f59e0b;
  font-weight: 600;
}

.proxy-off {
  color: #10b981;
  font-weight: 600;
}

.forgot-link {
  font-size: 0.85rem;
  color: #6366f1;
  cursor: pointer;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 380px;
  padding: 2rem;
  border-radius: 24px;
  text-align: center;
}

.modal h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.modal p {
  color: #a1a1aa;
  margin-bottom: 2rem;
}

/* Entrance Animation */
.animate-entrance {
  animation: slide-up-fade 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes slide-up-fade {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Updated Transition for Tab Content */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  flex: 2;
  height: 48px;
  background: #6366f1;
  border-radius: 14px;
  color: white;
  font-weight: 600;
}

.btn-text {
  flex: 1;
  height: 48px;
  color: #a1a1aa;
}

.btn-text:hover {
  color: white;
}

/* Animation Utilities */
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
