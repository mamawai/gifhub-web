import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import config from '@/config'
import { getToken, removeToken } from '@/utils/auth'

// Define interfaces for response
interface ApiResponse<T = unknown> {
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
  (config) => {
    // Add token if available
    const token = getToken()
    const isSkipToken = config.headers?.isToken === false

    if (token && !isSkipToken) {
      config.headers['satoken'] = token
    }

    return config
  },
  (error: unknown) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res.data as any // Return the actual data directly to match miniprogram behavior
    }

    // Auth error
    if (code === 401) {
      // Handle logout / redirect logic here
      console.warn('Session expired')
      removeToken()
      window.location.href = '/login'
      return Promise.reject(new Error('Session expired'))
    }

    // Other errors - include full response in error
    console.error(`API Error ${code}: ${res.message}`)
    const error = new Error(res.message || 'Error') as Error & { response: ApiResponse }
    error.response = res
    return Promise.reject(error)
  },
  (error: unknown) => {
    console.error('Network Error:', error)
    return Promise.reject(error)
  },
)

/**
 * Generic request wrapper to match the miniprogram's usage
 * @param options Request options
 */
const request = <T = unknown>(options: {
  url: string
  method?: string
  data?: unknown
  params?: unknown
  baseUrl?: string
  headers?: Record<string, string>
}) => {
  const { url, method = 'GET', baseUrl = config.baseUrl, ...rest } = options

  return service.request<unknown, T>({
    url: (baseUrl ? baseUrl : config.baseUrl) + url,
    method,
    ...rest,
  })
}

export default request
