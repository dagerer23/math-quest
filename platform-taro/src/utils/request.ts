/**
 * 双端请求工具 - 小程序用 Taro.request，H5 用 fetch
 */
import Taro from '@tarojs/taro'

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

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (isWeapp()) {
        const res = await Taro.request({
          url,
          method: (rest.method || 'GET') as any,
          data: rest.data || rest.body,
          header: rest.headers || {},
          timeout: timeout,
        })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return res.data as T
        }
        throw new Error(`HTTP ${res.statusCode}`)
      } else {
        const response = await fetch(url, {
          method: rest.method || 'GET',
          headers: { 'Content-Type': 'application/json', ...(rest.headers || {}) },
          body: rest.body || rest.data ? JSON.stringify(rest.body || rest.data) : undefined,
          signal: AbortSignal.timeout(timeout),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
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
