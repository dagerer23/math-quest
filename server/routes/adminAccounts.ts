/**
 * 管理员账号管理路由
 */
import { Router } from 'express'
import {
  adminLogin,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listLoginLog,
} from '../services/adminAccount'
import { requireAdminAuth } from '../middleware/adminAuth'

const router = Router()

// 登录 - 不需要认证
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ success: false, message: '用户名和密码必填' })
    return
  }
  const ip = req.ip || req.headers['x-forwarded-for'] || ''
  const result = await adminLogin(username, password, String(ip))
  res.json(result)
})

// 以下接口需要认证
router.get('/', requireAdminAuth, async (_req, res) => {
  const data = await listAdmins()
  res.json({ success: true, data })
})

router.post('/', requireAdminAuth, async (req, res) => {
  const { username, password, nickname, role } = req.body
  if (!username || !password || !role) {
    res.status(400).json({ success: false, message: '用户名、密码、角色必填' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, message: '密码长度不能少于 6 位' })
    return
  }
  const result = await createAdmin({ username, password, nickname, role })
  res.json(result)
})

router.put('/:id', requireAdminAuth, async (req, res) => {
  const result = await updateAdmin(req.params.id, req.body || {})
  res.json(result)
})

router.delete('/:id', requireAdminAuth, async (req, res) => {
  const result = await deleteAdmin(req.params.id)
  res.json(result)
})

router.get('/login-log', requireAdminAuth, async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30))
  const data = await listLoginLog(limit)
  res.json({ success: true, data })
})

export default router
