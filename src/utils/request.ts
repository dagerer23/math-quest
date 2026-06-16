/**
 * 通用请求工具 - 支持重试、超时、错误处理
 */

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 带重试的请求
 */
export async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const text = await response.text()
      if (!text) {
        throw new Error('Empty response')
      }

      return JSON.parse(text) as T
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 不重试的情况：4xx 错误（客户端错误）
      if (lastError.message.includes('HTTP 4')) {
        throw lastError
      }

      // 最后一次尝试，不再重试
      if (attempt === retries) {
        throw lastError
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
    }
  }

  throw lastError || new Error('Request failed')
}

/**
 * GET 请求
 */
export function get<T>(url: string, options?: RequestOptions): Promise<T> {
  return request<T>(url, { ...options, method: 'GET' })
}

/**
 * POST 请求
 */
export function post<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(body),
  })
}

/**
 * 安全的 JSON 解析
 */
export async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    throw new Error('Empty response')
  }
  return JSON.parse(text)
}
