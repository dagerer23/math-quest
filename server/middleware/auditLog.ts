/**
 * 管理后台操作审计日志中间件
 * 记录所有写操作（POST/PUT/DELETE）到日志
 */
import { Request, Response, NextFunction } from 'express'

interface AuditEntry {
  timestamp: number
  adminId: string
  username: string
  role: string
  method: string
  path: string
  body?: Record<string, unknown>
  ip: string
}

// 内存审计日志（最多保留 500 条）
const auditLog: AuditEntry[] = []
const MAX_AUDIT_ENTRIES = 500

/** 记录审计日志 */
export function logAudit(entry: AuditEntry): void {
  auditLog.push(entry)
  if (auditLog.length > MAX_AUDIT_ENTRIES) {
    auditLog.shift()
  }
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Audit] ${entry.method} ${entry.path} by ${entry.username}(${entry.role}) from ${entry.ip}`)
  }
}

/** 获取审计日志 */
export function getAuditLog(limit = 100): AuditEntry[] {
  return auditLog.slice(-limit)
}

/** Express 中间件：自动记录管理后台写操作 */
export function auditLogger(req: Request, _res: Response, next: NextFunction) {
  const admin = (req as any).admin
  if (!admin) {
    next()
    return
  }

  // 仅记录写操作
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    // 过滤敏感字段
    const safeBody = { ...req.body }
    if (safeBody.password) safeBody.password = '***'
    if (safeBody.oldPassword) safeBody.oldPassword = '***'

    logAudit({
      timestamp: Date.now(),
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      method: req.method,
      path: req.path,
      body: safeBody,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
    })
  }

  next()
}
