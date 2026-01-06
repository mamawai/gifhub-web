import request from '@/utils/request'
import axios from 'axios'
import config from '@/config'
import { getToken, removeToken } from '@/utils/auth'
import type {
  EmailLoginDTO,
  LoginResultVO,
  UserInfoVO,
  EmailRegisterDTO,
  GetUserGifsParams,
  ProxyCheckResponse,
} from '@/api/types'

/**
 * 获取公钥
 */
export function getPublicKey() {
  return request<string>({
    url: '/wechat/public_key',
    method: 'GET',
  })
}

/**
 * 邮箱注册
 */
export function emailRegister(data: EmailRegisterDTO) {
  return request<LoginResultVO>({
    url: '/user/web/register',
    method: 'POST',
    data,
  })
}

/**
 * 邮箱登录 (Web端专用)
 */
export function login(data: EmailLoginDTO) {
  return request<LoginResultVO>({
    url: '/user/web/login',
    method: 'POST',
    data,
  })
}

/**
 * 获取验证码
 */
export function getCode(params: { email: string; turnstileToken: string }) {
  return request<boolean>({
    url: '/user/web/code',
    method: 'POST',
    params,
  })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request<UserInfoVO>({
    url: '/user/checkAndGet',
    method: 'GET',
  })
}

/**
 * 获取用户上传的GIF列表（返回完整响应以获取 message 中的 total）
 */
export function getUserGifs(params: GetUserGifsParams) {
  return axios
    .get<{
      status: number
      message: string
      data: unknown
    }>(`${config.gifUrl}/gif/my`, {
      headers: { satoken: getToken() || '' },
      params,
    })
    .then((res) => {
      const data = res.data
      if (data.status === 401) {
        console.warn('Session expired')
        removeToken()
        window.location.href = '/login'
        return Promise.reject(new Error('Session expired'))
      }
      return data
    })
}

/**
 * 删除用户上传的GIF
 */
export function deleteGif(id: string | number) {
  return request({
    baseUrl: config.gifUrl,
    url: `/gif/${id}`,
    method: 'DELETE',
  })
}

/**
 * 更新用户昵称
 */
export function updateNickname(params: { nickname: string }) {
  return request({
    baseUrl: config.gifUrl,
    url: '/gif/updateNickname',
    method: 'PUT',
    params,
  })
}

/**
 * 注销账号
 */
export function deleteAccount(data: { password: string }) {
  return request({
    url: '/user/delete',
    method: 'POST',
    data,
  })
}

/**
 * 登出
 */
export function logout() {
  return request({
    url: '/user/logout',
    method: 'POST',
  })
}

/**
 * 邮箱是否验证
 */
export function isEmailVerified() {
  return request<boolean>({
    url: '/user/isEmailVerified',
    method: 'GET',
  })
}

/**
 * 发送重置密码验证码
 */
export function sendResetPasswordCode(email: string, turnstileToken: string) {
  return request<boolean>({
    url: '/user/reset-password/code',
    method: 'POST',
    params: { email, turnstileToken },
  })
}

/**
 * 重置密码
 */
export function resetPassword(data: { email: string; verificationCode: string; newPassword: string }) {
  return request<boolean>({
    url: '/user/reset-password',
    method: 'POST',
    data,
  })
}

/**
 * IP预检测（调用后端ProxyCheck）
 */
export function ipPreCheck() {
  return request<ProxyCheckResponse>({
    url: '/user/ipPreCheck',
    method: 'POST',
  })
}

/**
 * LinuxDo OAuth 回调
 */
export function linuxDoCallback(data: { code: string; fingerprint: string }) {
  return request<LoginResultVO>({
    url: '/user/oauth/linuxdo/callback',
    method: 'POST',
    data,
  })
}
