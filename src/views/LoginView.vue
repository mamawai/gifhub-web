<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Mail, Lock, MessageSquare, ArrowRight, Sparkles } from 'lucide-vue-next'
import { login, getCode, emailRegister, getPublicKey, getUserInfo } from '@/api/user'
import { setToken } from '@/utils/auth'
import rsaEncrypt from '@/utils/encrypt'

const router = useRouter()
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
const codeText = ref('Send Code')

// Register Modal
const showRegisterModal = ref(false)
const registerPassword = ref('')
const registerConfirmPassword = ref('')
const registerCode = ref('')

// Validation
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Actions
const switchTab = (tab: 'password' | 'code') => {
  activeTab.value = tab
}

const handleGetCode = async () => {
  if (countdown.value > 0 || codeLoading.value) return
  if (!validateEmail(email.value)) {
    // Ideally use a toast here
    alert('Please enter a valid email address')
    return
  }

  codeLoading.value = true
  try {
    const res = await getCode({ email: email.value })
    if (res === true) {
      startCountdown()
    } else {
      alert('Failed to send verification code')
    }
  } catch (err: unknown) {
    const error = err as any
    alert(error.message || 'Error sending code')
  } finally {
    codeLoading.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    codeText.value = `${countdown.value}s`
    if (countdown.value <= 0) {
      clearInterval(timer)
      codeText.value = 'Resend'
    }
  }, 1000)
}

const handleLogin = async () => {
  if (!validateEmail(email.value)) {
    alert('Invalid email format')
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

    const res = await login({
      loginType: activeTab.value === 'password' ? 1 : 2,
      email: email.value,
      password: finalPassword,
      verificationCode: code.value,
    })

    if (res && res.token) {
      setToken(res.token)
      await getUserInfo()
      router.push('/')
    }
  } catch (err: unknown) {
    const error = err as any
    console.error(error)
    if (error.code === 1001 && activeTab.value === 'code') {
      // Need registration
      registerCode.value = code.value
      showRegisterModal.value = true
    } else {
      alert(error.message || 'Login failed')
    }
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!registerPassword.value || registerPassword.value.length < 6) {
    alert('Password must be at least 6 characters')
    return
  }
  if (registerPassword.value !== registerConfirmPassword.value) {
    alert('Passwords do not match')
    return
  }

  try {
    const pubKeyRes = await getPublicKey()
    if (pubKeyRes) {
      rsaEncrypt.setPublicKey(pubKeyRes)
      const encrypted = rsaEncrypt.encryptPassword(registerPassword.value)

      if (encrypted) {
        await emailRegister({
          email: email.value,
          password: encrypted,
          verificationCode: registerCode.value,
        })

        alert('Account created successfully! Logging you in...')
        showRegisterModal.value = false
        activeTab.value = 'password'
        password.value = registerPassword.value
        handleLogin() // Try auto login
      }
    }
  } catch (err: unknown) {
    const error = err as any
    alert(error.message || 'Registration failed')
  }
}
</script>

<template>
  <div class="login-view">
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

    <div class="login-wrapper">
      <div class="brand-section">
        <div class="logo-container">
          <Sparkles class="logo-icon" :size="32" />
          <h1>Gif<span class="highlight">Hub</span></h1>
        </div>
        <p class="tagline">Explore the infinite universe of motion.</p>
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
            Password
          </button>
          <button :class="['tab-btn', { active: activeTab === 'code' }]" @click="switchTab('code')">
            OTP Code
          </button>
        </div>

        <div class="form-content">
          <transition name="fade-slide" mode="out-in">
            <div :key="activeTab" class="input-group-container">
              <!-- Shared Email Input -->
              <div class="input-group">
                <label>Email Address</label>
                <div class="input-wrapper">
                  <Mail class="field-icon" :size="20" />
                  <input v-model="email" type="email" placeholder="hello@example.com" />
                </div>
              </div>

              <!-- Password Input -->
              <div v-if="activeTab === 'password'" class="input-group">
                <label>Password</label>
                <div class="input-wrapper">
                  <Lock class="field-icon" :size="20" />
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                  />
                  <button class="eye-btn" @click="showPassword = !showPassword">
                    <Eye v-if="!showPassword" :size="20" />
                    <EyeOff v-else :size="20" />
                  </button>
                </div>
                <div class="forgot-link">Forgot password?</div>
              </div>

              <!-- OTP Input -->
              <div v-if="activeTab === 'code'" class="input-group">
                <label>Verification Code</label>
                <div class="input-wrapper">
                  <MessageSquare class="field-icon" :size="20" />
                  <input v-model="code" type="text" placeholder="Enter 6-digit code" />
                  <button
                    class="otp-btn"
                    :disabled="countdown > 0 || codeLoading"
                    @click="handleGetCode"
                  >
                    {{ codeText }}
                  </button>
                </div>
              </div>
            </div>
          </transition>

          <button class="submit-btn" :disabled="loading" @click="handleLogin">
            <span v-if="!loading">Continue</span>
            <span v-else class="spinner-sm"></span>
            <ArrowRight v-if="!loading" :size="20" />
          </button>
        </div>
      </div>
    </div>

    <!-- Register Modal (Glassmorphism) -->
    <div v-if="showRegisterModal" class="modal-overlay">
      <div class="modal glass-effect">
        <h3>Welcome Aboard 🚀</h3>
        <p>Set a secure password to complete your account.</p>

        <div class="input-group">
          <div class="input-wrapper">
            <input v-model="registerPassword" type="password" placeholder="New Password" />
          </div>
        </div>
        <div class="input-group">
          <div class="input-wrapper">
            <input
              v-model="registerConfirmPassword"
              type="password"
              placeholder="Confirm Password"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-text" @click="showRegisterModal = false">Cancel</button>
          <button class="btn-primary" @click="handleRegister">Create Account</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  padding: 4px;
  margin-bottom: 2rem;
}

.tabs-bg {
  position: absolute;
  width: 50%;
  height: calc(100% - 8px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

.forgot-link {
  align-self: flex-end;
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
