/**
 * 双端请求工具 - 小程序用 Taro.request，H5 用 fetch
 */
import Taro from '@tarojs/taro'

// 后端服务地址
// 小程序运行时无 process 对象，直接硬编码；生产部署时修改此处
// 注意：必须用 127.0.0.1 而非 localhost，否则微信小程序中 localhost 可能解析到
// IPv6(::1) 导致连接失败，触发 "Error: timeout"
const BASE_URL = 'http://127.0.0.1:3001'

export const TOKEN_KEY = 'mq_token'

function getToken(): string {
  try {
    return Taro.getStorageSync(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

interface RequestOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  body?: any
}

function isWeapp(): boolean {
  return typeof Taro !== 'undefined' && typeof wx !== 'undefined'
}

export async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, timeout = 10000, ...rest } = options

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(rest.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (isWeapp()) {
        const res = await Taro.request({
          url: fullUrl,
          method: (rest.method || 'GET') as any,
          data: rest.data || rest.body,
          header: headers,
          timeout: timeout,
        })
        if (res.statusCode === 401) {
          Taro.removeStorageSync(TOKEN_KEY)
          Taro.redirectTo({ url: '/pages/login/index' })
          throw new Error('Unauthorized')
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return res.data as T
        }
        throw new Error(`HTTP ${res.statusCode}`)
      } else {
        const response = await fetch(fullUrl, {
          method: rest.method || 'GET',
          headers,
          body: rest.body || rest.data ? JSON.stringify(rest.body || rest.data) : undefined,
          signal: AbortSignal.timeout(timeout),
        })
        if (response.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          window.location.href = '/pages/login/index'
          throw new Error('Unauthorized')
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (lastError.message === 'Unauthorized') throw lastError
      if (lastError.message.includes('HTTP 4')) throw lastError
      if (attempt === retries) throw lastError
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
    }
  }
  throw lastError || new Error('Request failed')
}

export function get<T>(url: string, options?: RequestOptions): Promise<T> {
  return request<T>(url, { ...options, method: 'GET' })
}

export function post<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(url, { ...options, method: 'POST', body })
}

export function put<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(url, { ...options, method: 'PUT', body })
}

export function del<T>(url: string, options?: RequestOptions): Promise<T> {
  return request<T>(url, { ...options, method: 'DELETE' })
}
