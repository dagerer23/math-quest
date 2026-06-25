/**
 * 管理员登录路由（独立，无需认证）
 */
import { Router } from 'express'
import { adminLogin } from '../services/adminAccount'

const router = Router()

router.post('/', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ success: false, message: '用户名和密码必填' })
    return
  }
  const ip = req.ip || req.headers['x-forwarded-for'] || ''
  const result = await adminLogin(username, password, String(ip))
  if (!result.success) {
    res.status(401).json(result)
    return
  }
  res.json(result)
})

export default router
