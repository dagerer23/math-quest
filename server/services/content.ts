/**
 * 题库 & 关卡内容管理服务
 * 支持管理后台 CRUD，以及前端拉取关卡/题目数据
 * Redis 缓存：年级聚合 + 关卡详情 + 知识点列表
 */
import db from '../db'
import type { Question, Level } from '../../src/types/models'
import { LEVELS as FALLBACK_LEVELS } from '../../src/data/questionBank'
import { cacheGet, cacheSet, cacheDel } from './cache'

// --- 查询 ---

/** 列出所有关卡（含题目数/年级） */
export async function listLevels(grade?: number) {
  let rows: any[]
  if (db.useMemory) {
    rows = JSON.parse(JSON.stringify(FALLBACK_LEVELS))
    if (grade) rows = rows.filter((l: Level) => l.grade === grade)
    return rows.map((l: Level) => ({
      id: l.id,
      grade: l.grade,
      chapter: l.chapter,
      sortOrder: l.sortOrder ?? 0,
      isBoss: l.isBoss,
      questionCount: l.questions?.length ?? 0,
      knowledgePoints: l.knowledgePoints,
    }))
  }
  const pool = db.getPool()!
  const sql = `
    SELECT l.id, l.grade, l.chapter, l.sort_order AS sortOrder, l.is_boss AS isBoss, l.unit_id AS unitId,
           COUNT(q.id) AS questionCount,
           GROUP_CONCAT(DISTINCT q.knowledge_point ORDER BY q.knowledge_point) AS kps
    FROM t_level l
    LEFT JOIN t_question q ON q.level_id = l.id
    ${grade ? 'WHERE l.grade = ?' : ''}
    GROUP BY l.id
    ORDER BY l.grade ASC, l.sort_order ASC
  `
  const [r] = await pool.query(sql as any, grade ? [grade] : []) as any
  rows = r as any[]
  return rows.map((row: any) => ({
    id: row.id,
    grade: row.grade,
    chapter: row.chapter,
    sortOrder: Number(row.sortOrder || 0),
    isBoss: !!row.isBoss,
    unitId: row.unitId,
    questionCount: Number(row.questionCount || 0),
    knowledgePoints: row.kps ? String(row.kps).split(',') : [],
  }))
}

/** 获取关卡详情（含题目列表） */
export async function getLevelDetail(levelId: string) {
  // 1. Redis 缓存
  const cacheKey = `content:level:${levelId}`
  const cached = await cacheGet(cacheKey)
  if (cached) {
    try { return JSON.parse(cached) as Level } catch { /* fallback */ }
  }

  // 2. 查数据源
  let result: Level | null = null
  if (db.useMemory) {
    const lv = FALLBACK_LEVELS.find(l => l.id === levelId)
    if (lv) result = lv
  } else {
    const pool = db.getPool()!
    const [levelRows] = await pool.query('SELECT * FROM t_level WHERE id = ?', [levelId]) as any
    if (!Array.isArray(levelRows) || levelRows.length === 0) return null
    const row = levelRows[0]
    const [qRows] = await pool.query(
      'SELECT * FROM t_question WHERE level_id = ? ORDER BY id ASC',
      [levelId],
    ) as any
    const questions: Question[] = (qRows as any[]).map(q => ({
      id: q.id,
      type: q.type as Question['type'],
      knowledgePoint: q.knowledge_point,
      difficulty: q.difficulty as 1 | 2 | 3,
      prompt: q.prompt,
      answer: q.answer,
      explanation: q.explanation || '',
      xp: Number(q.xp) || 10,
      options: q.options ? String(q.options).split('||').filter(Boolean) : undefined,
      illustration: q.illustration || undefined,
      difficulty_score: q.difficulty_score != null ? Number(q.difficulty_score) : undefined,
    }))
    result = {
      id: row.id,
      grade: row.grade,
      chapter: row.chapter,
      sortOrder: Number(row.sort_order || 0),
      isBoss: !!row.is_boss,
      unitId: row.unit_id,
      questions,
      knowledgePoints: [...new Set(questions.map(q => q.knowledgePoint))],
      target_mastery: row.target_mastery != null ? Number(row.target_mastery) : undefined,
    } as Level
  }

  // 3. 回写 Redis
  if (result) {
    await cacheSet(cacheKey, JSON.stringify(result), 600)
  }
  return result
}

/** 前端专用：拉取某个年级的全部关卡（含精简题目，答题时再单题拉取答案） */
export async function fetchGradeContent(grade: number) {
  // 1. 查 Redis 缓存
  const cacheKey = `content:grade:${grade}`
  const cached = await cacheGet(cacheKey)
  if (cached) {
    try { return JSON.parse(cached) } catch { /* 解析失败走 MySQL */ }
  }

  // 2. Redis 未命中，查数据源
  let result: { levels: any[] }
  if (db.useMemory) {
    result = {
      levels: FALLBACK_LEVELS.filter(l => l.grade === grade).map(l => ({
        id: l.id,
        grade: l.grade,
        chapter: l.chapter,
        sortOrder: l.sortOrder ?? 0,
        isBoss: l.isBoss,
        unitId: l.unitId,
        knowledgePoints: l.knowledgePoints,
        questionCount: l.questions.length,
      })),
    }
  } else {
    const levels = await listLevels(grade)
    result = { levels }
  }

  // 3. 回写 Redis（10 分钟 TTL）
  await cacheSet(cacheKey, JSON.stringify(result), 600)
  return result
}

/** 列出所有知识点（去重） */
export async function listKnowledgePoints(grade?: number) {
  const cacheKey = `content:kps:${grade ?? 'all'}`
  const cached = await cacheGet(cacheKey)
  if (cached) {
    try { return JSON.parse(cached) as string[] } catch { /* fallback */ }
  }

  let result: string[]
  if (db.useMemory) {
    const s = new Set<string>()
    FALLBACK_LEVELS.forEach(l => {
      if (grade && l.grade !== grade) return
      l.knowledgePoints.forEach(kp => s.add(kp))
    })
    result = [...s].sort()
  } else {
    const pool = db.getPool()!
    const sql = grade
      ? 'SELECT DISTINCT q.knowledge_point AS name FROM t_question q INNER JOIN t_level l ON l.id = q.level_id WHERE l.grade = ? ORDER BY name'
      : 'SELECT DISTINCT knowledge_point AS name FROM t_question ORDER BY name'
    const [rows] = await pool.query(sql as any, grade ? [grade] : []) as any
    result = (rows as any[]).map((r: any) => r.name)
  }

  // 知识点列表 30 分钟 TTL
  await cacheSet(cacheKey, JSON.stringify(result), 1800)
  return result
}

// --- 写入 ---

/** 新增/更新题目 */
export async function upsertQuestion(q: {
  id?: string
  levelId: string
  type: 'choice' | 'input' | 'drag'
  knowledgePoint: string
  difficulty: 1 | 2 | 3
  prompt: string
  answer: string | number
  explanation?: string
  xp?: number
  options?: string[]
  illustration?: string
  difficulty_score?: number
}) {
  const id = q.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  // 如果未提供 difficulty_score，从 difficulty 推导：1→2, 2→5, 3→8
  const difficultyScore = q.difficulty_score ?? ({ 1: 2, 2: 5, 3: 8 }[q.difficulty] ?? 5)
  if (db.useMemory) {
    const level = FALLBACK_LEVELS.find(l => l.id === q.levelId)
    if (level) {
      const existingIdx = level.questions.findIndex(qItem => qItem.id === id)
      const newQuestion: Question = {
        id,
        type: q.type,
        knowledgePoint: q.knowledgePoint,
        difficulty: q.difficulty,
        prompt: q.prompt,
        answer: q.answer,
        explanation: q.explanation || '',
        xp: Number(q.xp) || 10,
        options: q.options && q.options.length > 0 ? q.options.filter(o => String(o).trim()) : undefined,
        illustration: q.illustration,
        difficulty_score: difficultyScore,
      } as Question & { levelId: string }
      ;(newQuestion as any).levelId = q.levelId
      if (existingIdx >= 0) {
        level.questions[existingIdx] = newQuestion
      } else {
        level.questions.push(newQuestion)
      }
      if (!level.knowledgePoints.includes(q.knowledgePoint)) {
        level.knowledgePoints.push(q.knowledgePoint)
      }
    }
    return { success: true, id }
  }
  const pool = db.getPool()!
  const options = q.options && q.options.length > 0 ? q.options.join('||') : null
  await pool.query(
    `INSERT INTO t_question (id, level_id, type, knowledge_point, difficulty, prompt, \`options\`, answer, explanation, xp, illustration, difficulty_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       level_id = VALUES(level_id),
       type = VALUES(type),
       knowledge_point = VALUES(knowledge_point),
       difficulty = VALUES(difficulty),
       prompt = VALUES(prompt),
       \`options\` = VALUES(\`options\`),
       answer = VALUES(answer),
       explanation = VALUES(explanation),
       xp = VALUES(xp),
       illustration = VALUES(illustration),
       difficulty_score = VALUES(difficulty_score)`,
    [
      id, q.levelId, q.type, q.knowledgePoint, q.difficulty,
      q.prompt, options, String(q.answer), q.explanation || '',
      Number(q.xp) || 10, q.illustration || null, difficultyScore,
    ],
  )
  // 清除关卡详情和年级缓存
  await cacheDel(`content:level:${q.levelId}`)
  await cacheDel(`content:kps:all`)
  return { success: true, id }
}

/** 删除题目 */
export async function deleteQuestion(id: string) {
  if (db.useMemory) {
    for (const level of FALLBACK_LEVELS) {
      const idx = level.questions.findIndex(q => q.id === id)
      if (idx >= 0) {
        level.questions.splice(idx, 1)
        await cacheDel(`content:level:${level.id}`)
        break
      }
    }
    await cacheDel(`content:kps:all`)
    return { success: true }
  }
  const pool = db.getPool()!
  // 先查出 level_id 用于缓存失效
  const [rows] = await pool.query('SELECT level_id FROM t_question WHERE id = ?', [id]) as any
  const levelId = (rows as any[])[0]?.level_id
  await pool.query('DELETE FROM t_question WHERE id = ?', [id])
  if (levelId) {
    await cacheDel(`content:level:${levelId}`)
  }
  await cacheDel(`content:kps:all`)
  return { success: true }
}

/** 新增/更新关卡（不含题目） */
export async function upsertLevel(l: {
  id?: string
  grade: number
  chapter: string
  sortOrder?: number
  isBoss?: boolean
  unitId?: string
}) {
  const id = l.id || `g${l.grade}-L${Date.now()}`
  if (db.useMemory) {
    const existingIdx = FALLBACK_LEVELS.findIndex(level => level.id === id)
    const newLevel = {
      id,
      grade: l.grade,
      chapter: l.chapter,
      sortOrder: l.sortOrder ?? 0,
      isBoss: !!l.isBoss,
      unitId: l.unitId || `unit-${l.grade}-default`,
      knowledgePoints: [],
      questions: [],
    } as Level
    if (existingIdx >= 0) {
      FALLBACK_LEVELS[existingIdx] = { ...FALLBACK_LEVELS[existingIdx], ...newLevel }
    } else {
      FALLBACK_LEVELS.push(newLevel)
    }
    await cacheDel(`content:level:${id}`)
    await cacheDel(`content:grade:${l.grade}`)
    return { success: true, id }
  }
  const pool = db.getPool()!
  await pool.query(
    `INSERT INTO t_level (id, grade, chapter, sort_order, is_boss, unit_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       grade = VALUES(grade),
       chapter = VALUES(chapter),
       sort_order = VALUES(sort_order),
       is_boss = VALUES(is_boss),
       unit_id = VALUES(unit_id)`,
    [id, l.grade, l.chapter, l.sortOrder ?? 0, l.isBoss ? 1 : 0, l.unitId || `unit-${l.grade}-default`],
  )
  // 清除关卡详情缓存 + 所属年级聚合缓存（Write-Through 写策略）
  await cacheDel(`content:level:${id}`)
  await cacheDel(`content:grade:${l.grade}`)
  return { success: true, id }
}

/** 删除关卡（连带删除该关卡下的题目） */
export async function deleteLevel(id: string) {
  if (db.useMemory) {
    const levelIdx = FALLBACK_LEVELS.findIndex(l => l.id === id)
    if (levelIdx >= 0) {
      const grade = FALLBACK_LEVELS[levelIdx].grade
      FALLBACK_LEVELS.splice(levelIdx, 1)
      await cacheDel(`content:level:${id}`)
      await cacheDel(`content:grade:${grade}`)
    }
    return { success: true }
  }
  const pool = db.getPool()!
  // 先查出 grade 用于缓存失效
  const [rows] = await pool.query('SELECT grade FROM t_level WHERE id = ?', [id]) as any
  const grade = (rows as any[])[0]?.grade
  await pool.query('DELETE FROM t_question WHERE level_id = ?', [id])
  await pool.query('DELETE FROM t_level WHERE id = ?', [id])
  await cacheDel(`content:level:${id}`)
  if (grade != null) {
    await cacheDel(`content:grade:${grade}`)
  }
  return { success: true }
}

/** 一键导入前端内置关卡数据（作为初始 seed） */
export async function seedFromFallbackIfEmpty() {
  if (db.useMemory) return false
  const pool = db.getPool()!
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM t_level') as any
  if (Number((rows as any[])[0].c) > 0) {
    console.log('[content] 数据库已有关卡，跳过 seed 导入')
    return false
  }
  console.log('[content] 首次启动，从前端数据导入初始题库 & 关卡...')
  let qCount = 0
  for (const lv of FALLBACK_LEVELS) {
    await pool.query(
      'INSERT INTO t_level (id, grade, chapter, sort_order, is_boss, unit_id) VALUES (?, ?, ?, ?, ?, ?)',
      [lv.id, lv.grade, lv.chapter, lv.sortOrder ?? 0, lv.isBoss ? 1 : 0, lv.unitId],
    )
    for (const q of lv.questions) {
      const options = q.options && q.options.length > 0 ? q.options.join('||') : null
      await pool.query(
        `INSERT INTO t_question (id, level_id, type, knowledge_point, difficulty, prompt, \`options\`, answer, explanation, xp, illustration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.id, lv.id, q.type, q.knowledgePoint, q.difficulty,
          q.prompt, options, String(q.answer), q.explanation,
          Number(q.xp) || 10, q.illustration || null,
        ],
      )
      qCount++
    }
  }
  console.log(`[content] 导入完成：${FALLBACK_LEVELS.length} 个关卡，${qCount} 道题`)
  return true
}

// --- 成就 ---

export interface AchievementRow {
  id: string
  name: string
  description: string
  icon: string
  sortOrder: number
}

/** 列出所有成就 */
export async function listAchievements(): Promise<AchievementRow[]> {
  if (db.useMemory) {
    return [
      { id: 'first_blood', name: '初出茅庐', description: '完成第 1 关', icon: 'sword', sortOrder: 1 },
      { id: 'combo_5', name: '连击新星', description: '达成 5 连击', icon: 'lightning', sortOrder: 2 },
      { id: 'combo_10', name: '连击大师', description: '达成 10 连击', icon: 'fire', sortOrder: 3 },
      { id: 'streak_3', name: '坚持不懈', description: '连续打卡 3 天', icon: 'calendar', sortOrder: 4 },
      { id: 'streak_7', name: '一周学霸', description: '连续打卡 7 天', icon: 'trophy', sortOrder: 5 },
      { id: 'coins_500', name: '小富翁', description: '累计获得 500 金币', icon: 'coin', sortOrder: 6 },
      { id: 'no_mistake', name: '完美通关', description: '一关内零失误', icon: 'diamond', sortOrder: 7 },
      { id: 'boss_killer', name: 'BOSS 杀手', description: '击败 1 个 BOSS 关卡', icon: 'ghost', sortOrder: 8 },
      { id: 'xp_1000', name: '经验大亨', description: '累计获得 1000 XP', icon: 'sparkles', sortOrder: 9 },
      { id: 'mistake_master', name: '错题克星', description: '错题本累积 20 题后清空', icon: 'memo', sortOrder: 10 },
    ]
  }
  const pool = db.getPool()!
  const [rows] = await pool.query(`
    SELECT id, name, description, icon, sort_order AS sortOrder
    FROM t_achievement
    ORDER BY sort_order ASC
  `)
  return (rows as any[]).map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    sortOrder: Number(r.sortOrder || 0),
  }))
}

// --- 每日目标模板 ---

export interface DailyGoalTemplateRow {
  id: string
  title: string
  description: string
  icon: string
  type: 'xp' | 'questions' | 'streak'
  target: number
  rewardXp: number
  rewardCoins: number
  sortOrder: number
}

/** 列出所有每日目标模板 */
export async function listDailyGoalTemplates(): Promise<DailyGoalTemplateRow[]> {
  if (db.useMemory) {
    return [
      { id: 'daily-xp', title: '获得50经验值', description: '今天内通过答题获得50点经验值', icon: 'lightning', type: 'xp', target: 50, rewardXp: 30, rewardCoins: 20, sortOrder: 1 },
      { id: 'daily-questions', title: '完成10道题目', description: '今天内完成10道数学题', icon: 'goal', type: 'questions', target: 10, rewardXp: 40, rewardCoins: 30, sortOrder: 2 },
      { id: 'daily-streak', title: '保持签到', description: '今日已经完成签到', icon: 'fire', type: 'streak', target: 1, rewardXp: 20, rewardCoins: 15, sortOrder: 3 },
    ]
  }
  const pool = db.getPool()!
  const [rows] = await pool.query(`
    SELECT id, title, description, icon, type, target, reward_xp AS rewardXp, reward_coins AS rewardCoins, sort_order AS sortOrder
    FROM t_daily_goal_template
    ORDER BY sort_order ASC
  `)
  return (rows as any[]).map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    icon: r.icon,
    type: r.type as 'xp' | 'questions' | 'streak',
    target: Number(r.target || 0),
    rewardXp: Number(r.rewardXp || 0),
    rewardCoins: Number(r.rewardCoins || 0),
    sortOrder: Number(r.sortOrder || 0),
  }))
}

// --- 测评抽题 ---

/** 根据 ID 列表批量查询题目 */
export async function listQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!Array.isArray(ids) || ids.length === 0) return []
  const idSet = new Set(ids.filter(id => typeof id === 'string' && id.length > 0))
  if (idSet.size === 0) return []

  if (db.useMemory) {
    const result: Question[] = []
    const seen = new Set<string>()
    for (const lv of FALLBACK_LEVELS) {
      if (!lv.questions) continue
      for (const q of lv.questions) {
        if (idSet.has(q.id) && !seen.has(q.id)) {
          seen.add(q.id)
          result.push(q)
        }
      }
    }
    return result
  }

  const pool = db.getPool()!
  const placeholders = Array.from(idSet).fill('?').join(',')
  const [rows] = await pool.query(
    `SELECT * FROM t_question WHERE id IN (${placeholders})`,
    Array.from(idSet),
  ) as any

  return (rows as any[]).map(q => ({
    id: q.id,
    type: q.type as Question['type'],
    knowledgePoint: q.knowledge_point,
    difficulty: q.difficulty as 1 | 2 | 3,
    prompt: q.prompt,
    answer: q.answer,
    explanation: q.explanation || '',
    xp: Number(q.xp) || 10,
    options: q.options ? String(q.options).split('||').filter(Boolean) : undefined,
    illustration: q.illustration || undefined,
    difficulty_score: q.difficulty_score != null ? Number(q.difficulty_score) : undefined,
  }))
}

/** 生成测评题目（按难度分层抽取） */
export async function generateAssessmentQuestions(grade: number, count = 10): Promise<Question[]> {
  // 获取该年级所有题目
  let allQuestions: Question[]
  if (db.useMemory) {
    allQuestions = FALLBACK_LEVELS.filter(l => l.grade === grade).flatMap(l => l.questions)
    if (allQuestions.length === 0) {
      allQuestions = FALLBACK_LEVELS.flatMap(l => l.questions)
    }
  } else {
    const pool = db.getPool()!
    const [rows] = await pool.query(`
      SELECT q.* FROM t_question q
      INNER JOIN t_level l ON l.id = q.level_id
      WHERE l.grade = ?
    `, [grade]) as any
    if (!Array.isArray(rows) || rows.length === 0) {
      // 降级：取所有题目
      const [allRows] = await pool.query('SELECT * FROM t_question') as any
      allQuestions = (allRows as any[]).map(q => ({
        id: q.id,
        type: q.type as Question['type'],
        knowledgePoint: q.knowledge_point,
        difficulty: q.difficulty as 1 | 2 | 3,
        prompt: q.prompt,
        answer: q.answer,
        explanation: q.explanation || '',
        xp: Number(q.xp) || 10,
        options: q.options ? String(q.options).split('||').filter(Boolean) : undefined,
        illustration: q.illustration || undefined,
        difficulty_score: q.difficulty_score != null ? Number(q.difficulty_score) : undefined,
      }))
    } else {
      allQuestions = (rows as any[]).map(q => ({
        id: q.id,
        type: q.type as Question['type'],
        knowledgePoint: q.knowledge_point,
        difficulty: q.difficulty as 1 | 2 | 3,
        prompt: q.prompt,
        answer: q.answer,
        explanation: q.explanation || '',
        xp: Number(q.xp) || 10,
        options: q.options ? String(q.options).split('||').filter(Boolean) : undefined,
        illustration: q.illustration || undefined,
        difficulty_score: q.difficulty_score != null ? Number(q.difficulty_score) : undefined,
      }))
    }
  }

  // 按难度分层
  const easy = allQuestions.filter(q => q.difficulty === 1)
  const medium = allQuestions.filter(q => q.difficulty === 2)
  const hard = allQuestions.filter(q => q.difficulty === 3)

  // 随机打乱
  const shuffle = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

  // 按比例抽取：简单 3 题、中等 4 题、困难 3 题
  const selected = [
    ...shuffle(easy).slice(0, 3),
    ...shuffle(medium).slice(0, 4),
    ...shuffle(hard).slice(0, 3),
  ]

  // 打乱顺序
  return shuffle(selected).slice(0, count)
}

// --- 掌握度驱动的动态出题 ---

/** 从 difficulty 推导 difficulty_score（1→2, 2→5, 3→8） */
function deriveDifficultyScore(q: Question): number {
  if (q.difficulty_score != null) return q.difficulty_score
  return ({ 1: 2, 2: 5, 3: 8 } as const)[q.difficulty] ?? 5
}

/** 随机打乱数组 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 根据用户掌握度动态生成题目 */
export async function generateQuestions(
  levelId: string,
  userMastery: Record<string, number>,
  recentQuestionIds: string[] = [],
): Promise<Question[]> {
  // 1. 获取关卡信息
  const level = await getLevelDetail(levelId)
  if (!level) return []

  // 2. 获取该关卡所有题目，并补充 difficulty_score
  let allQuestions: Question[] = level.questions.map(q => ({
    ...q,
    difficulty_score: deriveDifficultyScore(q),
  }))

  // MySQL 模式下，如果关卡详情中没有题目，尝试从 DB 直接查
  if (!db.useMemory && allQuestions.length === 0) {
    const pool = db.getPool()!
    const [qRows] = await pool.query(
      'SELECT * FROM t_question WHERE level_id = ? ORDER BY id ASC',
      [levelId],
    ) as any
    allQuestions = (qRows as any[]).map(q => ({
      id: q.id,
      type: q.type as Question['type'],
      knowledgePoint: q.knowledge_point,
      difficulty: q.difficulty as 1 | 2 | 3,
      prompt: q.prompt,
      answer: q.answer,
      explanation: q.explanation || '',
      xp: Number(q.xp) || 10,
      options: q.options ? String(q.options).split('||').filter(Boolean) : undefined,
      illustration: q.illustration || undefined,
      difficulty_score: q.difficulty_score != null ? Number(q.difficulty_score) : deriveDifficultyScore({
        difficulty: q.difficulty as 1 | 2 | 3,
      } as Question),
    }))
  }

  if (allQuestions.length === 0) return []

  const knowledgePoints = level.knowledgePoints
  const recentSet = new Set(recentQuestionIds)

  // 3. Boss 关卡特殊处理：混合所有知识点，偏好高难度
  if (level.isBoss) {
    // 过滤掉最近做过的题目
    let candidates = allQuestions.filter(q => !recentSet.has(q.id))
    if (candidates.length === 0) candidates = allQuestions // 全部做过则重置

    // 按难度分数降序排序，优先选高难度题
    candidates.sort((a, b) => (b.difficulty_score ?? 5) - (a.difficulty_score ?? 5))

    // 取前 8-10 题（优先高难度，但随机化同难度内的顺序）
    const total = Math.min(Math.max(8, Math.floor(candidates.length * 0.6)), 10, candidates.length)
    const grouped = new Map<number, Question[]>()
    for (const q of candidates) {
      const ds = q.difficulty_score ?? 5
      if (!grouped.has(ds)) grouped.set(ds, [])
      grouped.get(ds)!.push(q)
    }
    // 每个难度组内打乱
    for (const [, qs] of grouped) {
      shuffle(qs)
    }
    // 重新组装（保持高难度优先）
    const shuffled = [...grouped.entries()]
      .sort((a, b) => b[0] - a[0])
      .flatMap(([, qs]) => qs)

    return shuffle(shuffled.slice(0, total))
  }

  // 4. 普通关卡：按知识点权重分配
  // 计算每个知识点的权重
  const kpWeights: Record<string, number> = {}
  for (const kp of knowledgePoints) {
    const mastery = userMastery[kp] ?? 0
    if (mastery < 0.3) {
      kpWeights[kp] = 3  // 未掌握，重点出题
    } else if (mastery < 0.7) {
      kpWeights[kp] = 2  // 学习中
    } else {
      kpWeights[kp] = 1  // 已掌握，复习
    }
  }

  const totalWeight = Object.values(kpWeights).reduce((a, b) => a + b, 0)
  const totalQuestions = Math.min(Math.max(8, allQuestions.length), 10)

  // 按权重分配每个知识点的题目数
  const kpQuestionCounts: Record<string, number> = {}
  let allocated = 0
  for (const kp of knowledgePoints) {
    const count = Math.round((kpWeights[kp] / totalWeight) * totalQuestions)
    kpQuestionCounts[kp] = count
    allocated += count
  }
  // 修正舍入误差
  if (allocated !== totalQuestions && knowledgePoints.length > 0) {
    // 给权重最高的知识点补差
    const maxKp = knowledgePoints.reduce((a, b) => kpWeights[a] >= kpWeights[b] ? a : b)
    kpQuestionCounts[maxKp] += totalQuestions - allocated
  }

  // 5. 每个知识点内，根据掌握度选择合适难度的题目
  const selectedQuestions: Question[] = []
  for (const kp of knowledgePoints) {
    const kpQuestions = allQuestions.filter(q => q.knowledgePoint === kp)
    if (kpQuestions.length === 0) continue

    const mastery = userMastery[kp] ?? 0
    const targetCount = kpQuestionCounts[kp] || 1

    // 过滤掉最近做过的题目
    let candidates = kpQuestions.filter(q => !recentSet.has(q.id))
    if (candidates.length === 0) candidates = kpQuestions

    // 根据掌握度偏好选择难度
    // 低掌握度 → 偏好低难度；高掌握度 → 偏好高难度
    const preferredDifficultyRange = mastery < 0.3
      ? { min: 1, max: 4 }   // 简单题
      : mastery < 0.7
        ? { min: 3, max: 7 } // 中等题
        : { min: 6, max: 10 } // 困难题

    // 按偏好难度排序（距离偏好范围中心越近越优先）
    const center = (preferredDifficultyRange.min + preferredDifficultyRange.max) / 2
    candidates.sort((a, b) => {
      const distA = Math.abs((a.difficulty_score ?? 5) - center)
      const distB = Math.abs((b.difficulty_score ?? 5) - center)
      return distA - distB
    })

    // 取所需数量，但同距离内随机化
    const taken = candidates.slice(0, targetCount)
    selectedQuestions.push(...taken)
  }

  // 6. 打乱最终结果，避免可预测模式
  return shuffle(selectedQuestions)
}

/** 更新知识点掌握度 */
export function updateMastery(
  knowledgePoint: string,
  isCorrect: boolean,
  difficultyScore: number,
  currentMastery: number,
  consecutiveCorrect: number,
): number {
  let delta = 0

  if (isCorrect) {
    // 正确：根据难度加分
    if (difficultyScore <= 3) {
      delta = 0.05   // 简单
    } else if (difficultyScore <= 6) {
      delta = 0.08   // 中等
    } else {
      delta = 0.12   // 困难
    }
    // 连击奖励：同一知识点连续正确 >= 3 次额外 +0.05
    if (consecutiveCorrect >= 3) {
      delta += 0.05
    }
  } else {
    // 错误：扣分
    delta = -0.10
  }

  // 计算新掌握度，限制在 0-1 范围
  const newMastery = Math.max(0, Math.min(1, currentMastery + delta))
  return newMastery
}
