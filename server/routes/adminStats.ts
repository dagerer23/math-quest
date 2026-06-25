/**
 * 管理员统计路由
 */
import { Router, Request, Response } from 'express'
import {
  getSummary,
  getDailyTrend,
  getKnowledgeAnalysis,
  getTopMistakes,
  getUserRanking,
  getGradeDistribution,
} from '../services/stats'

const router = Router()

function safe(fn: (req: Request, res: Response) => Promise<any>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res)
    } catch (e: any) {
      console.error('[adminStats] 路由错误:', e?.message || e)
      res.status(500).json({ success: false, message: e?.message || '服务器内部错误' })
    }
  }
}

router.get('/summary', safe(async (_req, res) => {
  const data = await getSummary()
  res.json({ success: true, data })
}))

router.get('/daily-trend', safe(async (req, res) => {
  const rawDays = Number(req.query.days)
  if (!req.query.days || !Number.isInteger(rawDays) || rawDays < 1 || rawDays > 30) {
    res.status(400).json({ success: false, message: 'days 参数必须是 1-30 的整数' })
    return
  }
  const data = await getDailyTrend(rawDays)
  res.json({ success: true, data })
}))

router.get('/knowledge-points', safe(async (_req, res) => {
  const data = await getKnowledgeAnalysis()
  res.json({ success: true, data })
}))

router.get('/top-mistakes', safe(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const data = await getTopMistakes(limit)
  res.json({ success: true, data })
}))

router.get('/user-ranking', safe(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
  const data = await getUserRanking(limit)
  res.json({ success: true, data })
}))

router.get('/grade-distribution', safe(async (_req, res) => {
  const data = await getGradeDistribution()
  res.json({ success: true, data })
}))

export default router
