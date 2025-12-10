import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import config from '@/config'
import { getToken, removeToken } from '@/utils/auth'

// Define interfaces for response
interface ApiResponse<T = any> {
  status: number
  message: string
  data: T
}

// Create axios instance
const service: AxiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// Request interceptor
service.interceptors.request.use(
  (config: any) => {
    // Add token if available
    const token = getToken()
    const isSkipToken = config.headers?.isToken === false

    if (token && !isSkipToken) {
      config.headers['satoken'] = token
    }

    return config
  },
  (error: any) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  },
)

// Response interceptor
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    const code = res.status || 200

    // Success
    if (code === 200) {
      return res.data // Return the actual data directly to match miniprogram behavior
    }

    // Auth error
    if (code === 401) {
      // Handle logout / redirect logic here
      console.warn('Session expired')
      removeToken()
      window.location.href = '/login'
      return Promise.reject(new Error('Session expired'))
    }

    // Other errors
    console.error(`API Error ${code}: ${res.message}`)
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error: any) => {
    console.error('Network Error:', error)
    return Promise.reject(error)
  },
)

/**
 * Generic request wrapper to match the miniprogram's usage
 * @param options Request options
 */
const request = <T = any>(options: {
  url: string
  method?: string
  data?: any
  params?: any
  baseUrl?: string
  headers?: any
}) => {
  const { url, method = 'GET', baseUrl = config.baseUrl, ...rest } = options

  return service.request<any, T>({
    url: (baseUrl ? baseUrl : config.baseUrl) + url,
    method,
    ...rest,
  })
}

export default request
