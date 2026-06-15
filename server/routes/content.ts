/**
 * 内容管理路由（题目/关卡 CRUD + 前端拉取 + 排行榜）
 */
import { Router, Request, Response } from 'express'
import {
  listLevels,
  getLevelDetail,
  fetchGradeContent,
  listKnowledgePoints,
  upsertQuestion,
  deleteQuestion,
  upsertLevel,
  deleteLevel,
  seedFromFallbackIfEmpty,
  listAchievements,
  listDailyGoalTemplates,
  generateAssessmentQuestions,
  listQuestionsByIds,
  generateQuestions,
  updateMastery,
} from '../services/content'
import { getUserRanking } from '../services/stats'
import { getAllConfigs } from '../services/config'
import { requireAdminAuth } from '../middleware/adminAuth'

const router = Router()

// ===== 前端接口（拉取数据）=====

// 根据年级拉取关卡列表
router.get('/grade/:grade', async (req: Request, res: Response) => {
  const grade = Number(req.params.grade)
  if (!grade || grade < 1 || grade > 9) {
    res.status(400).json({ success: false, message: '年级参数无效 (1-9)' })
    return
  }
  const data = await fetchGradeContent(grade)
  res.json({ success: true, ...data })
})

// 拉取关卡详情（含题目）- 用于进入战斗时一次性拉取
router.get('/level/:levelId', async (req: Request, res: Response) => {
  const data = await getLevelDetail(req.params.levelId)
  if (!data) {
    res.status(404).json({ success: false, message: '关卡不存在' })
    return
  }
  res.json({ success: true, level: data, target_mastery: data.target_mastery ?? 0.4 })
})

// 列出所有知识点（可选按年级过滤）
router.get('/knowledge-points', async (req: Request, res: Response) => {
  const grade = req.query.grade ? Number(req.query.grade) : undefined
  const data = await listKnowledgePoints(grade)
  res.json({ success: true, knowledgePoints: data })
})

// 列出所有成就
router.get('/achievements', async (_req: Request, res: Response) => {
  const data = await listAchievements()
  res.json({ success: true, achievements: data })
})

// 列出所有每日目标模板
router.get('/daily-goals', async (_req: Request, res: Response) => {
  const data = await listDailyGoalTemplates()
  res.json({ success: true, templates: data })
})

// 列出所有系统配置（公开）
router.get('/configs', async (_req: Request, res: Response) => {
  const data = await getAllConfigs()
  // 转换为 key-value 对象格式，方便前端使用
  const configs: Record<string, string> = {}
  for (const c of data) {
    configs[c.key] = c.value
  }
  res.json({ success: true, configs })
})

// 测评抽题
router.get('/assessment-questions', async (req: Request, res: Response) => {
  const grade = Number(req.query.grade) || 2
  const count = Number(req.query.count) || 10
  const questions = await generateAssessmentQuestions(grade, count)
  res.json({ success: true, questions })
})

// 根据 ID 批量拉取题目
router.post('/questions-by-ids', async (req: Request, res: Response) => {
  const { ids } = req.body
  if (!Array.isArray(ids)) {
    res.status(400).json({ success: false, message: 'ids 必须为数组' })
    return
  }
  const questions = await listQuestionsByIds(ids as string[])
  res.json({ success: true, questions })
})

// 根据掌握度动态生成题目
router.post('/generate-questions', async (req: Request, res: Response) => {
  const { levelId, userMastery, recentQuestionIds } = req.body
  if (!levelId || typeof levelId !== 'string') {
    res.status(400).json({ success: false, message: 'levelId 必填' })
    return
  }
  if (!userMastery || typeof userMastery !== 'object') {
    res.status(400).json({ success: false, message: 'userMastery 必填且为对象' })
    return
  }
  const questions = await generateQuestions(
    levelId,
    userMastery as Record<string, number>,
    Array.isArray(recentQuestionIds) ? recentQuestionIds : [],
  )
  res.json({ success: true, questions })
})

// 更新知识点掌握度
router.post('/update-mastery', async (req: Request, res: Response) => {
  const { knowledgePoint, isCorrect, difficultyScore, currentMastery, consecutiveCorrect } = req.body
  if (!knowledgePoint || typeof knowledgePoint !== 'string') {
    res.status(400).json({ success: false, message: 'knowledgePoint 必填' })
    return
  }
  if (typeof isCorrect !== 'boolean') {
    res.status(400).json({ success: false, message: 'isCorrect 必填且为布尔值' })
    return
  }
  if (typeof difficultyScore !== 'number' || typeof currentMastery !== 'number') {
    res.status(400).json({ success: false, message: 'difficultyScore 和 currentMastery 必填且为数字' })
    return
  }
  const newMastery = updateMastery(
    knowledgePoint,
    isCorrect,
    Number(difficultyScore),
    Number(currentMastery),
    Number(consecutiveCorrect) || 0,
  )
  res.json({ success: true, newMastery })
})

// ===== 排行榜（C 端）=====
router.get('/leaderboard', async (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
  const grade = req.query.grade ? Number(req.query.grade) : undefined
  const data = await getUserRanking(limit)
  const users = grade !== undefined
    ? data.filter((u: any) => u.targetGrade === grade)
    : data
  res.json({ success: true, users })
})

// ===== 管理后台接口（CRUD，需认证）=====

// 列出所有关卡（管理后台用）
router.get('/admin/levels', requireAdminAuth, async (req: Request, res: Response) => {
  const grade = req.query.grade ? Number(req.query.grade) : undefined
  const data = await listLevels(grade)
  res.json({ success: true, levels: data })
})

// 新增/更新关卡
router.post('/admin/levels', requireAdminAuth, async (req: Request, res: Response) => {
  const { id, grade, chapter, sortOrder, isBoss, unitId } = req.body
  if (!grade || !chapter) {
    res.status(400).json({ success: false, message: '年级和章节必填' })
    return
  }
  const result = await upsertLevel({ id, grade: Number(grade), chapter, sortOrder: sortOrder != null ? Number(sortOrder) : undefined, isBoss: !!isBoss, unitId })
  res.json({ success: true, ...result })
})

// 删除关卡
router.delete('/admin/levels/:id', requireAdminAuth, async (req: Request, res: Response) => {
  await deleteLevel(req.params.id)
  res.json({ success: true })
})

// 列出某关卡的题目
router.get('/admin/levels/:levelId/questions', requireAdminAuth, async (req: Request, res: Response) => {
  const data = await getLevelDetail(req.params.levelId)
  if (!data) {
    res.status(404).json({ success: false, message: '关卡不存在' })
    return
  }
  res.json({ success: true, questions: data.questions, grade: data.grade, chapter: data.chapter })
})

// 新增/更新题目
router.post('/admin/questions', requireAdminAuth, async (req: Request, res: Response) => {
  const { id, levelId, type, knowledgePoint, difficulty, prompt, answer, explanation, xp, options, illustration, difficulty_score } = req.body
  if (!levelId || !type || !prompt || answer === undefined) {
    res.status(400).json({ success: false, message: 'levelId, type, prompt, answer 必填' })
    return
  }
  const result = await upsertQuestion({
    id,
    levelId,
    type,
    knowledgePoint: knowledgePoint || '未分类',
    difficulty: Number(difficulty) as 1 | 2 | 3,
    prompt,
    answer,
    explanation: explanation || '',
    xp: Number(xp) || 10,
    options: Array.isArray(options) ? options.map((o: any) => String(o)) : undefined,
    illustration: illustration || undefined,
    difficulty_score: difficulty_score != null ? Number(difficulty_score) : undefined,
  })
  res.json({ success: true, ...result })
})

// 删除题目
router.delete('/admin/questions/:id', requireAdminAuth, async (req: Request, res: Response) => {
  await deleteQuestion(req.params.id)
  res.json({ success: true })
})

// 触发 seed（首次启动自动调用）
router.post('/admin/seed', requireAdminAuth, async (_req: Request, res: Response) => {
  const seeded = await seedFromFallbackIfEmpty()
  res.json({ success: true, seeded })
})

export default router
