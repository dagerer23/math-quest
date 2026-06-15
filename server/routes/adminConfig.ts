/**
 * 管理员系统配置路由
 */
import { Router } from 'express'
import { getAllConfigs, getConfig, updateConfigs } from '../services/config'

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
  res.json(result)
})

export default router
