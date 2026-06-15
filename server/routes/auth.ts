/**
 * 认证路由 - MySQL 版本
 */
import { Router, Request, Response } from 'express'
import {
  sendVerificationCode,
  verifyAndLogin,
  tokenLogin,
  getUserInfo,
  updateProfile,
  saveAssessmentResult,
  getAssessment,
  quickLoginByPhone,
} from '../services/auth'

const router = Router()

// 发送验证码
router.post('/send-code', async (req: Request, res: Response) => {
  const { phone } = req.body

  if (!phone) {
    res.status(400).json({ success: false, message: '请输入手机号' })
    return
  }

  const result = await sendVerificationCode(phone)
  res.json(result)
})

// 验证码登录
router.post('/login', async (req: Request, res: Response) => {
  const { phone, code } = req.body

  if (!phone || !code) {
    res.status(400).json({ success: false, message: '请输入手机号和验证码' })
    return
  }

  const result = await verifyAndLogin(phone, code)
  res.json(result)
})

// 退出登录
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: '已退出登录' })
})

// 快捷登录（免验证码一键登录老用户）
// 适用场景：用户曾经成功登录过（localStorage 存了 lastPhone），
// 点击快捷登录时根据手机号查找用户并直接生成 token
router.post('/quick-login', async (req: Request, res: Response) => {
  const { phone } = req.body
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    res.status(400).json({ success: false, message: '请输入正确的手机号' })
    return
  }
  const result = await quickLoginByPhone(phone)
  res.json(result)
})

// Token 自动登录（30天内有效）
router.post('/token-login', async (req: Request, res: Response) => {
  const { token } = req.body
  if (!token) {
    res.status(400).json({ success: false, message: '缺少 token' })
    return
  }
  const result = await tokenLogin(token)
  res.json(result)
})

// 获取用户信息（已存在，继续支持）
router.get('/me', async (req: Request, res: Response) => {
  const userId = req.query.userId as string

  if (!userId) {
    res.status(400).json({ success: false, message: '缺少用户ID' })
    return
  }

  const result = await getUserInfo(userId)
  res.json(result)
})

// 更新用户信息 / 保存个人信息（Onboarding 完成后）
router.post('/profile', async (req: Request, res: Response) => {
  const { userId, nickname, avatar, learningStage, learningGoal, targetGrade } = req.body

  if (!userId) {
    res.status(400).json({ success: false, message: '缺少用户ID' })
    return
  }

  const profile: Partial<{
    learningStage: string
    learningGoal: string
    targetGrade: number
    nickname: string
    avatar: string
  }> = {}

  if (nickname !== undefined) profile.nickname = String(nickname)
  if (avatar !== undefined) profile.avatar = String(avatar)
  if (learningStage !== undefined) profile.learningStage = String(learningStage)
  if (learningGoal !== undefined) profile.learningGoal = String(learningGoal)
  if (targetGrade !== undefined) profile.targetGrade = Number(targetGrade)

  const result = await updateProfile(userId, profile)
  res.json(result)
})

// 保存测评结果
router.post('/assessment', async (req: Request, res: Response) => {
  const { userId, id, completedAt, score, recommendedDifficulty, answers } = req.body

  if (!userId) {
    res.status(400).json({ success: false, message: '缺少用户ID' })
    return
  }

  const safeAnswers = Array.isArray(answers)
    ? answers.map((a: any) => ({
        questionId: String(a.questionId || ''),
        userAnswer: String(a.userAnswer ?? ''),
        isCorrect: !!a.isCorrect,
      }))
    : []

  const result = await saveAssessmentResult(userId, {
    id: id || 'assessment-' + Date.now(),
    completedAt: completedAt ? Number(completedAt) : Date.now(),
    score: Number(score) || 0,
    recommendedDifficulty: Number(recommendedDifficulty) || 1,
    answers: safeAnswers,
  })

  res.json(result)
})

// 获取用户最新测评
router.get('/assessment', async (req: Request, res: Response) => {
  const userId = req.query.userId as string
  if (!userId) {
    res.status(400).json({ success: false, message: '缺少用户ID' })
    return
  }
  const result = await getAssessment(userId)
  res.json(result)
})

export default router
