/**
 * 管理员系统配置路由
 */
import { Router } from 'express'
import { getAllConfigs, getConfig, updateConfigs } from '../services/config'
import { reloadRateLimiters } from '../middleware/rateLimit'

const router = Router()

router.get('/', async (_req, res) => {
  const data = await getAllConfigs()
  res.json({ success: true, data })
})

router.get('/:key', async (req, res) => {
  const value = await getConfig(req.params.key)
  if (value === null) {
    res.status(404).json({ success: false, message: '配置项不存在' })
    return
  }
  res.json({ success: true, key: req.params.key, value })
})

router.put('/', async (req, res) => {
  const { updates, adminId } = req.body
  if (!Array.isArray(updates)) {
    res.status(400).json({ success: false, message: 'updates 必须是数组' })
    return
  }
  const result = await updateConfigs(updates, adminId)
  // 若更新了限流配置，重新加载限流器使其立即生效
  if (updates.some(u => u.key.startsWith('rate_limit.'))) {
    try { await reloadRateLimiters() } catch (e) { /* 配置已保存，限流重建失败不影响写入结果 */ }
  }
  res.json(result)
})

export default router
