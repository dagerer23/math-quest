/**
 * 管理后台认证中间件
 * 使用 HMAC-SHA256 签名 token（无需额外依赖）
 */
import { Request, Response, NextFunction } from 'express'
import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.ADMIN_JWT_SECRET || 'mathquest-admin-secret-2025'
const TOKEN_PREFIX = 'mq_admin_'

/** 生成 admin token */
export function generateAdminToken(adminId: string, username: string, role: string): string {
  const payload = `${adminId}:${username}:${role}:${Math.floor(Date.now() / 1000)}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${TOKEN_PREFIX}${Buffer.from(payload).toString('base64url')}.${sig}`
}

/** 验证 admin token，返回解析后的 admin 信息或 null */
export function verifyAdminToken(token: string): { id: string; username: string; role: string } | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null
  const body = token.slice(TOKEN_PREFIX.length)
  const [payloadB64, sig] = body.split('.')
  if (!payloadB64 || !sig) return null

  let payload: string
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
  } catch {
    return null
  }

  // 验证签名
  const expectedSig = createHmac('sha256', SECRET).update(payload).digest('hex')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null
  } catch {
    return null
  }

  const [id, username, role, timestampStr] = payload.split(':')
  if (!id || !username || !role) return null

  // token 有效期 24 小时
  const timestamp = Number(timestampStr)
  if (isNaN(timestamp) || Date.now() / 1000 - timestamp > 86400) return null

  return { id, username, role }
}

/** Express 中间件：验证 admin token */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  let token = ''

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token'])
  }

  if (!token) {
    res.status(401).json({ success: false, message: '未登录或登录已过期' })
    return
  }

  const admin = verifyAdminToken(token)
  if (!admin) {
    res.status(401).json({ success: false, message: '登录已过期，请重新登录' })
    return
  }

  // 将 admin 信息挂载到 req 上，供后续路由使用
  ;(req as any).admin = admin
  next()
}
