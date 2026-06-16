/**
 * 班级相关 API 路由
 */
import { Router, Request, Response } from 'express'
import {
  createClass,
  joinClassByCode,
  leaveClass,
  getMyClass,
  getClassMembers,
  sendEncouragement,
  getReceivedEncouragements,
} from '../services/class'

const router = Router()

/** 创建班级 */
router.post('/create', async (req: Request, res: Response) => {
  const { userId, name } = req.body
  if (!userId) return res.status(400).json({ success: false, message: '缺少用户ID' })
  if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: '请输入班级名称' })
  const result = await createClass(String(userId), String(name).trim())
  res.json(result)
})

/** 加入班级 */
router.post('/join', async (req: Request, res: Response) => {
  const { userId, code } = req.body
  if (!userId) return res.status(400).json({ success: false, message: '缺少用户ID' })
  if (!code) return res.status(400).json({ success: false, message: '请输入班级码' })
  const result = await joinClassByCode(String(userId), String(code).trim())
  res.json(result)
})

/** 退出当前班级 */
router.post('/leave', async (req: Request, res: Response) => {
  const { userId, classId } = req.body
  if (!userId || !classId) return res.status(400).json({ success: false, message: '缺少参数' })
  const result = await leaveClass(String(userId), String(classId))
  res.json(result)
})

/** 获取当前班级信息 */
router.get('/me', async (req: Request, res: Response) => {
  const userId = req.query.userId as string
  if (!userId) return res.status(400).json({ success: false, message: '缺少用户ID' })
  const result = await getMyClass(userId)
  res.json(result)
})

/** 获取同班同学列表 */
router.get('/members', async (req: Request, res: Response) => {
  const userId = req.query.userId as string
  if (!userId) return res.status(400).json({ success: false, message: '缺少用户ID' })

  const myClassResult = await getMyClass(userId)
  if (!myClassResult.class) {
    return res.json({ success: true, message: '未加入班级', members: [] })
  }

  const members = await getClassMembers(myClassResult.class.id)
  res.json({ success: true, members, className: myClassResult.class.name, code: myClassResult.class.code })
})

/** 送花鼓励同学 */
router.post('/encourage', async (req: Request, res: Response) => {
  const { fromUserId, toUserId, context } = req.body
  if (!fromUserId || !toUserId) return res.status(400).json({ success: false, message: '缺少参数' })
  const result = await sendEncouragement(String(fromUserId), String(toUserId), context ? String(context) : undefined)
  res.json(result)
})

/** 获取收到的鼓励列表 */
router.get('/encouragements', async (req: Request, res: Response) => {
  const userId = req.query.userId as string
  if (!userId) return res.status(400).json({ success: false, message: '缺少用户ID' })
  const result = await getReceivedEncouragements(userId)
  res.json(result)
})

export default router
