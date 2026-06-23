/**
 * 双端请求工具 - 小程序用 Taro.request，H5 用 fetch
 */
import Taro from '@tarojs/taro'

/**
 * 后端服务地址 - 根据运行环境自动切换
 *
 * 环境识别策略（基于编译期注入的 host 变量，而非 NODE_ENV）：
 * 1. 阿里云生产部署（PROD_HOST 已注入）→ http://<阿里云公网IP>:<port>
 * 2. 微信开发者工具（PROD_HOST 未注入 + 运行时 platform=devtools）→ http://127.0.0.1:<port>
 * 3. 真机预览本地开发（PROD_HOST 未注入 + 运行时 platform=ios/android）→ http://<本机局域网IP>:<port>
 * 4. H5 端本地开发 → http://127.0.0.1:<port>
 *
 * ⚠️ 不能用 process.env.NODE_ENV === 'production' 判断生产环境：
 *    微信小程序构建时 NODE_ENV 恒为 'production'，会导致 webpack 死代码消除
 *    移除真机预览分支（isDevtools + LAN_HOST），使真机预览降级为 127.0.0.1，
 *    手机访问自身 3001 端口 → ERR_CONNECTION_REFUSED。
 *
 * 说明：
 * - process.env.NODE_ENV / TARO_ENV / MQ_* 由 Taro 编译期通过 DefinePlugin 注入为字面量，
 *   小程序运行时无 process 对象也可正常使用。
 * - 局域网IP（MQ_LAN_HOST）在构建时由 config/index.ts 自动获取本机网卡IP。
 * - 阿里云公网IP（MQ_PROD_HOST）通过构建环境变量注入，例如：
 *   `MQ_PROD_HOST=8.219.x.x npm run build:weapp`
 */
const PORT = process.env.MQ_SERVER_PORT || '3001'
const LAN_HOST = process.env.MQ_LAN_HOST || ''
const PROD_HOST = process.env.MQ_PROD_HOST || ''

/**
 * 判断当前是否运行在微信开发者工具中
 * 真机预览时 platform 为 'ios' / 'android'，开发者工具为 'devtools'
 */
function isDevtools(): boolean {
  try {
    const info = Taro.getSystemInfoSync()
    return (info as any).platform === 'devtools'
  } catch {
    // 获取失败时按真机处理（使用局域网IP），保证真机预览可用
    return false
  }
}

function resolveBaseUrl(): string {
  // 1. H5 端本地开发（编译期判断：小程序构建时此分支会被消除）
  if (process.env.TARO_ENV === 'h5') {
    return `http://127.0.0.1:${PORT}`
  }

  // 2. 小程序端：PROD_HOST 有值 → 阿里云生产部署
  if (PROD_HOST) {
    return `http://${PROD_HOST}:${PORT}`
  }

  // 3. 小程序端：PROD_HOST 无值 → 本地开发
  //    开发者工具可用 127.0.0.1，真机预览必须用局域网IP
  if (isDevtools()) {
    return `http://127.0.0.1:${PORT}`
  }
  return `http://${LAN_HOST}:${PORT}`
}

const BASE_URL = resolveBaseUrl()

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
  // 读类接口（地图/排行榜/目标）失败后端时会走本地降级，无需重试拖慢首屏
  const { retries = 0, retryDelay = 300, timeout = 8000, ...rest } = options

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(rest.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  console.log('[request] 发起请求:', rest.method || 'GET', fullUrl, 'data:', JSON.stringify(rest.data || rest.body))

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (isWeapp()) {
        console.log('[request] 使用 Taro.request, 当前 BASE_URL:', BASE_URL)
        const res = await Taro.request({
          url: fullUrl,
          method: (rest.method || 'GET') as any,
          data: rest.data || rest.body,
          header: headers,
          timeout: timeout,
        })
        console.log('[request] Taro.request 响应:', fullUrl, 'statusCode:', res.statusCode, 'data:', JSON.stringify(res.data))
        if (res.statusCode === 401) {
          Taro.removeStorageSync(TOKEN_KEY)
          Taro.redirectTo({ url: '/pages/login/index' })
          throw new Error('Unauthorized')
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return res.data as T
        }
        // 4xx 错误：解析响应体，保留后端返回的错误信息
        if (res.statusCode >= 400 && res.statusCode < 500 && res.data) {
          const msg = (res.data as any)?.message || `HTTP ${res.statusCode}`
          console.error('[request] 服务端返回 4xx:', fullUrl, 'statusCode:', res.statusCode, 'msg:', msg)
          const err = new Error(msg) as any
          err.response = res.data
          throw err
        }
        console.error('[request] HTTP 错误:', fullUrl, 'statusCode:', res.statusCode)
        throw new Error(`HTTP ${res.statusCode}`)
      } else {
        console.log('[request] 使用 fetch (H5/浏览器环境)')
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
      // 微信小程序 Taro.request 失败时 reject 的是普通对象 { errMsg: "request:fail ..." }，
      // 不是 Error 实例，直接 String(error) 会得到 "[object Object]"，需先提取 errMsg/message
      console.error('[request] 请求异常:', fullUrl, 'attempt:', attempt, 'error:', error)
      lastError = error instanceof Error
        ? error
        : new Error((error as any)?.errMsg || (error as any)?.message || String(error))
      if (lastError.message === 'Unauthorized') throw lastError
      if (lastError.message.includes('HTTP 4')) throw lastError
      if (attempt === retries) throw lastError
      console.warn('[request] 请求失败, 准备重试:', fullUrl, 'attempt:', attempt, 'delay:', retryDelay * (attempt + 1))
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
