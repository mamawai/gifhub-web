import request from '@/utils/request'
import config from '@/config'
import type { EmailLoginDTO, LoginResultVO, UserInfoVO } from '@/api/types'

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
export function emailRegister(data: any) {
  return request({
    url: '/user/register/email',
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
export function getCode(params: { email: string }) {
  return request<boolean>({
    url: '/user/web/code',
    method: 'GET',
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
