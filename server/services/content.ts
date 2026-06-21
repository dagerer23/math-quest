/**
 * 题库 & 关卡内容管理服务
 * 支持管理后台 CRUD，以及前端拉取关卡/题目数据
 * Redis 缓存：年级聚合 + 关卡详情 + 知识点列表
 */
import db from '../db'
import type { Question, Level } from '../../src/types/models'
import { LEVELS as FALLBACK_LEVELS } from '../../src/data/questionBank'
import { cacheGet, cacheSet, cacheDel } from './cache'
import { getConfig } from './config'

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

/**
 * 关卡自动同步：按题库中 (grade, knowledge_point) 动态生成关卡
 * 每个知识点一关 + 每年级一个 BOSS 关
 * 触发时机：后端启动时 / 管理后台新增导入题目后 / 手动调接口
 */
export async function syncLevelsFromQuestions(): Promise<{ synced: number; bosses: number }> {
  if (db.useMemory) return { synced: 0, bosses: 0 }
  const pool = db.getPool()!

  // 1. 扫描 t_question，按 (grade, knowledge_point) 分组，算 avg(difficulty_score)
  // grade 从 level_id 前缀提取（如 g1-L1 → 1）
  const [groups] = await pool.query(`
    SELECT
      CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(level_id, '-', 1), 'g', -1) AS UNSIGNED) AS grade,
      knowledge_point,
      AVG(COALESCE(difficulty_score, CASE difficulty WHEN 1 THEN 2 WHEN 2 THEN 5 WHEN 3 THEN 8 ELSE 5 END)) AS avg_ds,
      COUNT(*) AS qcnt
    FROM t_question
    WHERE level_id REGEXP '^g[0-9]+-'
    GROUP BY grade, knowledge_point
    ORDER BY grade ASC, avg_ds ASC, knowledge_point ASC
  `) as any

  const grouped = groups as any[]
  if (grouped.length === 0) {
    console.log('[content] syncLevels: 题库无数据，跳过')
    return { synced: 0, bosses: 0 }
  }

  // 2. 按年级分组，赋 sort_order
  const byGrade = new Map<number, any[]>()
  for (const row of grouped) {
    const g = Number(row.grade)
    if (!byGrade.has(g)) byGrade.set(g, [])
    byGrade.get(g)!.push(row)
  }

  let synced = 0
  let bosses = 0
  const now = Date.now()

  for (const [grade, kps] of byGrade) {
    // 3. 为每个知识点 upsert t_level，更新 t_question.level_id
    kps.forEach((kp, idx) => {
      kp.sortOrder = idx + 1
      kp.newLevelId = `g${grade}-L${idx + 1}`
    })

    for (const kp of kps) {
      // upsert 关卡
      await pool.query(
        `INSERT INTO t_level (id, grade, chapter, sort_order, is_boss, unit_id, created_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)
         ON DUPLICATE KEY UPDATE chapter=VALUES(chapter), sort_order=VALUES(sort_order), is_boss=0`,
        [kp.newLevelId, grade, kp.knowledge_point, kp.sortOrder, `unit-${grade}-default`, now],
      )
      // 更新该知识点的题目 level_id
      await pool.query(
        `UPDATE t_question SET level_id = ? WHERE knowledge_point = ? AND level_id REGEXP ?`,
        [kp.newLevelId, kp.knowledge_point, `^g${grade}-`],
      )
      synced++
    }

    // 4. upsert BOSS 关
    const bossId = `g${grade}-BOSS`
    await pool.query(
      `INSERT INTO t_level (id, grade, chapter, sort_order, is_boss, unit_id, created_at)
       VALUES (?, ?, ?, 999, 1, ?, ?)
       ON DUPLICATE KEY UPDATE is_boss=1, sort_order=999`,
      [bossId, grade, '综合BOSS', `unit-${grade}-default`, now],
    )
    // 迁移旧 BOSS 关（g{grade}-L6_BOSS）的题目到新 BOSS 关
    await pool.query(
      `UPDATE t_question SET level_id = ? WHERE level_id = ?`,
      [bossId, `g${grade}-L6_BOSS`],
    )
    // 删除旧 BOSS 关
    await pool.query(
      `DELETE FROM t_level WHERE id = ?`,
      [`g${grade}-L6_BOSS`],
    )
    bosses++
  }

  // 5. 清除旧的无题关卡（sort_order 已被新关卡覆盖的旧 id）
  await pool.query(`
    DELETE FROM t_level
    WHERE id REGEXP '^g[0-9]+-L[0-9]+$'
      AND id NOT IN (
        SELECT DISTINCT level_id FROM t_question WHERE level_id REGEXP '^g[0-9]+-L[0-9]+$'
      )
      AND is_boss = 0
  `)

  // 6. 清 Redis 缓存
  for (const grade of byGrade.keys()) {
    await cacheDel(`content:grade:${grade}`)
  }

  console.log(`[content] syncLevels: 同步 ${synced} 个知识点关 + ${bosses} 个 BOSS 关`)
  return { synced, bosses }
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

/** 读取配置数值（带默认值） */
async function cfgNum(key: string, def: number): Promise<number> {
  const v = await getConfig(key)
  const n = Number(v)
  return isNaN(n) ? def : n
}

/** 判定出题档位：长期掌握度 + 上一关连击即时信号 */
function determineTier(mastery: number, lastCombo: number): 'struggle' | 'normal' | 'master' {
  // 长期信号
  const longTier = mastery < 0.3 ? 'struggle' : mastery < 0.7 ? 'normal' : 'master'
  // 即时信号（上一关连击）
  let instantTier: 'struggle' | 'normal' | 'master' = longTier
  if (lastCombo >= 5) instantTier = 'master'
  else if (lastCombo <= 1 && mastery < 0.7) instantTier = 'struggle'
  return instantTier
}

/** 从数组中按数量随机抽取 */
function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/** 查询到期错题并追加到已选题目 */
async function insertDueMistakes(
  selected: Question[],
  userId: string | undefined,
  currentSortOrder: number,
): Promise<Question[]> {
  if (!userId || db.useMemory) return selected
  const pool = db.getPool()!
  const maxInsert = await cfgNum('mistake.max_per_level', 2)
  if (maxInsert <= 0) return selected

  const selectedIds = selected.map(q => q.id)
  const [dueRows] = await pool.query(
    `SELECT m.question_id AS id FROM t_mistake m
     WHERE m.user_id = ? AND m.due_level_offset <= ?
       AND m.question_id NOT IN (?)
     ORDER BY m.due_level_offset ASC
     LIMIT ?`,
    [userId, currentSortOrder, selectedIds.length > 0 ? selectedIds : ['__none__'], maxInsert],
  ) as any

  const dueIds = (dueRows as any[]).map(r => r.id)
  if (dueIds.length === 0) return selected

  // 拉取到期错题的完整数据
  const [qRows] = await pool.query(
    `SELECT * FROM t_question WHERE id IN (?)`,
    [dueIds],
  ) as any
  const dueQuestions: Question[] = (qRows as any[]).map(q => ({
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

  return [...selected, ...dueQuestions]
}

/** 根据用户掌握度 + 上一关连击动态生成题目（三档加权 + 错题插入） */
export async function generateQuestions(
  levelId: string,
  userMastery: Record<string, number>,
  recentQuestionIds: string[] = [],
  lastCombo: number = 0,
  userId?: string,
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

  const recentSet = new Set(recentQuestionIds)

  // 3. Boss 关卡特殊处理：混合所有知识点，偏好高难度（逻辑不变）
  if (level.isBoss) {
    let candidates = allQuestions.filter(q => !recentSet.has(q.id))
    if (candidates.length === 0) candidates = allQuestions

    candidates.sort((a, b) => (b.difficulty_score ?? 5) - (a.difficulty_score ?? 5))

    const total = Math.min(Math.max(8, Math.floor(candidates.length * 0.6)), 10, candidates.length)
    const grouped = new Map<number, Question[]>()
    for (const q of candidates) {
      const ds = q.difficulty_score ?? 5
      if (!grouped.has(ds)) grouped.set(ds, [])
      grouped.get(ds)!.push(q)
    }
    for (const [, qs] of grouped) shuffle(qs)
    const shuffled = [...grouped.entries()]
      .sort((a, b) => b[0] - a[0])
      .flatMap(([, qs]) => qs)

    const bossSelected = shuffle(shuffled.slice(0, total))
    // BOSS 关也插入到期错题
    return insertDueMistakes(bossSelected, userId, level.sortOrder ?? 999)
  }

  // 4. 普通关卡（单知识点）：三档加权出题
  const kp = level.knowledgePoints[0] || allQuestions[0]?.knowledgePoint || ''
  const mastery = userMastery[kp] ?? 0
  const tier = determineTier(mastery, lastCombo)

  // 读取权重配置
  const wEasy = await cfgNum(`question.weight.${tier}.easy`, tier === 'struggle' ? 5 : tier === 'normal' ? 2 : 1)
  const wMid = await cfgNum(`question.weight.${tier}.mid`, tier === 'struggle' ? 3 : tier === 'normal' ? 5 : 3)
  const wHard = await cfgNum(`question.weight.${tier}.hard`, tier === 'struggle' ? 1 : tier === 'normal' ? 3 : 5)
  const minQ = await cfgNum('question.total.min', 8)
  const maxQ = await cfgNum('question.total.max', 10)

  // 按难度分桶
  const easy = allQuestions.filter(q => (q.difficulty_score ?? 5) <= 3)
  const mid = allQuestions.filter(q => {
    const ds = q.difficulty_score ?? 5
    return ds >= 4 && ds <= 7
  })
  const hard = allQuestions.filter(q => (q.difficulty_score ?? 5) >= 8)

  // 总题数
  const total = Math.min(Math.max(minQ, Math.min(allQuestions.length, maxQ)), maxQ)
  const sumW = wEasy + wMid + wHard

  // 按权重分配题数
  let nEasy = Math.round((total * wEasy) / sumW)
  let nMid = Math.round((total * wMid) / sumW)
  let nHard = total - nEasy - nMid
  // 确保不超过各桶实际题数
  nEasy = Math.min(nEasy, easy.length)
  nMid = Math.min(nMid, mid.length)
  nHard = Math.min(nHard, hard.length)
  // 如果某桶不足，剩余配额分给其他桶
  let allocated = nEasy + nMid + nHard
  if (allocated < total) {
    const deficit = total - allocated
    // 优先补给题最多的桶
    const buckets = [
      { name: 'easy', arr: easy, n: nEasy },
      { name: 'mid', arr: mid, n: nMid },
      { name: 'hard', arr: hard, n: nHard },
    ].sort((a, b) => b.arr.length - b.n - (a.arr.length - a.n))
    let remaining = deficit
    for (const b of buckets) {
      if (remaining <= 0) break
      const avail = b.arr.length - b.n
      const add = Math.min(avail, remaining)
      if (b.name === 'easy') nEasy += add
      else if (b.name === 'mid') nMid += add
      else nHard += add
      remaining -= add
    }
  }

  // 各桶内过滤 recentQuestionIds 后随机抽取
  const selected: Question[] = []
  const easyCandidates = easy.filter(q => !recentSet.has(q.id))
  const midCandidates = mid.filter(q => !recentSet.has(q.id))
  const hardCandidates = hard.filter(q => !recentSet.has(q.id))
  // 如果过滤后不足，回退到不过滤
  selected.push(...sample(easyCandidates.length >= nEasy ? easyCandidates : easy, nEasy))
  selected.push(...sample(midCandidates.length >= nMid ? midCandidates : mid, nMid))
  selected.push(...sample(hardCandidates.length >= nHard ? hardCandidates : hard, nHard))

  // 5. 插入到期错题
  const withMistakes = await insertDueMistakes(selected, userId, level.sortOrder ?? 0)

  // 6. 打乱最终结果
  return shuffle(withMistakes)
}

/** 记录错题（做错时调用）：计算递增间隔到期偏移 */
export async function recordMistake(
  userId: string,
  questionId: string,
  userAnswer: string,
  correctAnswer: string,
  currentLevelSortOrder: number,
): Promise<void> {
  if (db.useMemory) return
  const pool = db.getPool()!

  // 查是否已有错题记录
  const [existing] = await pool.query(
    'SELECT id, repetition FROM t_mistake WHERE user_id = ? AND question_id = ?',
    [userId, questionId],
  ) as any
  const existingRow = (existing as any[])[0]

  const repetition = existingRow ? Number(existingRow.repetition) + 1 : 0
  const intervalKey = `mistake.interval.r${Math.min(repetition, 3)}`
  const interval = await cfgNum(intervalKey, repetition === 0 ? 2 : repetition === 1 ? 5 : repetition === 2 ? 10 : 15)
  const dueLevelOffset = currentLevelSortOrder + interval
  const now = Date.now()

  if (existingRow) {
    await pool.query(
      `UPDATE t_mistake SET repetition = ?, due_level_offset = ?, last_level_sort = ?, correct_count = 0, user_answer = ?, created_at = ?
       WHERE id = ?`,
      [repetition, dueLevelOffset, currentLevelSortOrder, userAnswer, now, existingRow.id],
    )
  } else {
    const id = `m_${userId}_${questionId}_${now}`
    await pool.query(
      `INSERT INTO t_mistake (id, user_id, question_id, user_answer, correct_answer, created_at, due_level_offset, repetition, last_level_sort, correct_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, userId, questionId, userAnswer, correctAnswer, now, dueLevelOffset, repetition, currentLevelSortOrder],
    )
  }
}

/** 答对错题时调用：累计答对次数，达阈值移出错题本 */
export async function correctMistake(
  userId: string,
  questionId: string,
): Promise<{ removed: boolean; correctCount: number }> {
  if (db.useMemory) return { removed: false, correctCount: 0 }
  const pool = db.getPool()!

  const [rows] = await pool.query(
    'SELECT id, correct_count FROM t_mistake WHERE user_id = ? AND question_id = ?',
    [userId, questionId],
  ) as any
  const row = (rows as any[])[0]
  if (!row) return { removed: false, correctCount: 0 }

  const correctCount = Number(row.correct_count) + 1
  const threshold = await cfgNum('mistake.correct_to_remove', 2)

  if (correctCount >= threshold) {
    await pool.query('DELETE FROM t_mistake WHERE id = ?', [row.id])
    return { removed: true, correctCount }
  } else {
    await pool.query('UPDATE t_mistake SET correct_count = ? WHERE id = ?', [correctCount, row.id])
    return { removed: false, correctCount }
  }
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
