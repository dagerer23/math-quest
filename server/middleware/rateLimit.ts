/**
 * API 限流中间件
 * 使用 express-rate-limit，参数从 t_system_config 动态读取，可在后台管理实时调整
 */
import rateLimit from 'express-rate-limit'
import type { RequestHandler } from 'express'
import { getConfig } from '../services/config'

let apiHandler: RequestHandler | null = null
let authHandler: RequestHandler | null = null

function buildLimiter(windowMs: number, max: number, message: string): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  }) as unknown as RequestHandler
}

async function readInt(key: string, fallback: number): Promise<number> {
  const v = await getConfig(key)
  if (v === null || v === undefined) return fallback
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * 从数据库重新加载限流配置并重建限流器实例。
 * 配置变更后调用此方法可立即生效（重建会重置当前窗口内的计数）。
 */
export async function reloadRateLimiters() {
  const apiWindowMs = await readInt('rate_limit.api.window_ms', 1000)
  const apiMax = await readInt('rate_limit.api.max', 50)
  const authWindowMs = await readInt('rate_limit.auth.window_ms', 60000)
  const authMax = await readInt('rate_limit.auth.max', 5)
  apiHandler = buildLimiter(apiWindowMs, apiMax, '请求过于频繁，请稍后再试')
  authHandler = buildLimiter(authWindowMs, authMax, '操作过于频繁，请稍后再试')
  console.log(
    `[rate-limit] 已加载限流配置: API ${apiMax}次/${apiWindowMs}ms, 认证 ${authMax}次/${authWindowMs}ms`,
  )
}

/** 通用 API 限流中间件（配置可动态更新） */
export const apiLimiter: RequestHandler = (req, res, next) => {
  if (apiHandler) apiHandler(req, res, next)
  else next()
}

/** 认证接口限流中间件（配置可动态更新） */
export const authLimiter: RequestHandler = (req, res, next) => {
  if (authHandler) authHandler(req, res, next)
  else next()
}
