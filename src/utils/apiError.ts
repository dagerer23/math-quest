/**
 * 统一 API 错误处理工具
 * - 开发环境打印错误详情
 * - 返回用户友好的错误消息
 */
import { toast } from 'sonner'

/** 从未知错误中提取用户友好消息 */
export function getErrorMessage(err: unknown, fallback = '操作失败，请稍后重试'): string {
  if (err instanceof Error) {
    // HTTP 错误：提取简短描述
    const httpMatch = err.message.match(/^HTTP (\d+):/)
    if (httpMatch) {
      const status = Number(httpMatch[1])
      if (status === 401) return '登录已过期，请重新登录'
      if (status === 403) return '没有权限执行此操作'
      if (status === 404) return '请求的资源不存在'
      if (status === 429) return '操作过于频繁，请稍后再试'
      if (status >= 500) return '服务器异常，请稍后重试'
    }
    return err.message || fallback
  }
  if (typeof err === 'string') return err
  return fallback
}

/** 处理 API 错误：开发环境日志 + toast 提示 */
export function handleApiError(err: unknown, fallbackMsg?: string): void {
  if (import.meta.env.DEV) {
    console.error('[API Error]', err)
  }
  toast.error(getErrorMessage(err, fallbackMsg))
}

/** 静默处理 API 错误：仅开发环境日志，不弹 toast */
export function silentApiError(err: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[API Error${context ? ` - ${context}` : ''}]`, err)
  }
}
