/**
 * API 限流中间件
 * 使用 express-rate-limit
 */
import rateLimit from 'express-rate-limit'

/** 通用 API 限流：每个 IP 15 分钟 100 次 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
  },
})

/** 登录/验证码限流：每个 IP 1 分钟 5 次 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '操作过于频繁，请 1 分钟后再试',
  },
})

/** 管理后台限流：每个 IP 15 分钟 300 次（更宽松） */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
  },
})