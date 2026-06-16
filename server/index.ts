/**
 * 算力先锋 MathQuest - 后端服务
 * 提供用户认证 API - MySQL 版本
 */
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import contentRoutes from './routes/content'
import classRoutes from './routes/class'
import adminStatsRoutes from './routes/adminStats'
import adminImportRoutes from './routes/adminImport'
import adminConfigRoutes from './routes/adminConfig'
import adminAccountsRoutes from './routes/adminAccounts'
import { initDB, isMemoryMode } from './db'
import { seedFromFallbackIfEmpty } from './services/content'
import { initDefaultConfigs } from './services/config'
import { initDefaultAdmin } from './services/adminAccount'
import { apiLimiter, authLimiter } from './middleware/rateLimit'
import { requireAdminAuth, requireWriteAccess } from './middleware/adminAuth'
import { auditLogger, getAuditLog } from './middleware/auditLog'
import { cacheSet } from './services/cache'
import { fetchGradeContent } from './services/content'

const app = express()
const PORT = process.env.PORT || 3002
const NODE_ENV = process.env.NODE_ENV || 'development'
const IS_PRODUCTION = NODE_ENV === 'production'

// 防止未处理的 Promise 拒绝导致进程崩溃
process.on('unhandledRejection', (err) => {
  console.error('[Server] 未处理的 Promise 拒绝:', err)
})

// 中间件
app.use(cors({
  origin: IS_PRODUCTION
    ? process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// 请求日志
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// 全局限流
app.use('/api', apiLimiter)

// 路由
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/class', classRoutes)
app.use('/api/content', contentRoutes)
// 管理后台路由：login 不需要认证，其他需要
app.use('/api/admin/stats', requireAdminAuth, adminStatsRoutes)
app.use('/api/admin/import', requireAdminAuth, auditLogger, requireWriteAccess, adminImportRoutes)
app.use('/api/admin/config', requireAdminAuth, auditLogger, requireWriteAccess, adminConfigRoutes)
app.use('/api/admin/accounts', adminAccountsRoutes) // login 在此路由内，单独处理

// 审计日志查看（仅 super 角色）
app.get('/api/admin/audit-log', requireAdminAuth, (req, res) => {
  const admin = (req as any).admin
  if (admin.role !== 'super') {
    res.status(403).json({ success: false, message: '仅超级管理员可查看审计日志' })
    return
  }
  const limit = Number(req.query.limit) || 100
  res.json({ success: true, data: getAuditLog(limit) })
})

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', storage: isMemoryMode() ? 'memory' : 'mysql', timestamp: Date.now() })
})

// 全局错误处理 - 防止未捕获异常导致进程崩溃
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] 未捕获错误:', err?.message || err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' })
})

// 先初始化数据库，再启动服务
initDB().then(async () => {
  try { await seedFromFallbackIfEmpty() } catch (e: any) {
    console.log('[seed] 初始化数据失败:', e?.message || e)
  }
  try { await initDefaultConfigs() } catch (e: any) {
    console.log('[config] 初始化配置失败:', e?.message || e)
  }
  try { await initDefaultAdmin() } catch (e: any) {
    console.log('[admin] 初始化管理员失败:', e?.message || e)
  }

  app.listen(PORT, () => {
    console.log(`\n  🚀 MathQuest API 服务已启动`)
    console.log(`  📡 地址: http://localhost:${PORT}`)
    if (!IS_PRODUCTION) {
      console.log(`  📋 测试验证码: 123456`)
      console.log(`  🔐 后台账号: admin / admin123`)
    }
    console.log(`  💾 存储模式: ${isMemoryMode() ? '内存 (降级)' : 'MySQL'}`)
    console.log(`  🌐 CORS: 已启用`)
    console.log(`  🛡️  限流: 已启用`)
    console.log(`  🔧 环境: ${NODE_ENV}`)
    console.log()
  })

  // Redis 缓存预热：异步加载全年级内容到 Redis
  const GRADES = [1, 2, 3, 4, 5, 6, 7]
  for (const grade of GRADES) {
    try {
      const data = await fetchGradeContent(grade)
      await cacheSet(`content:grade:${grade}`, JSON.stringify(data), 600)
    } catch {
      // 预热失败不阻塞启动
    }
  }
  console.log('[cache] 缓存预热完成')
})
