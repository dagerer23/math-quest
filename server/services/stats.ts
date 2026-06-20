/**
 * 统计服务 - 用户学习数据分析
 * 内存模式：返回空数据或基于 FALLBACK 数据伪造简单指标
 * MySQL 模式：真实统计 t_session, t_mistake, t_user 等表
 */
import db from '../db'
import { LEVELS as FALLBACK_LEVELS } from '../../src/data/questionBank'

/** 仪表盘总览 */
export async function getSummary() {
  if (db.useMemory) {
    return {
      totalUsers: 0,
      totalQuestions: FALLBACK_LEVELS.reduce((s, l) => s + l.questions.length, 0),
      totalLevels: FALLBACK_LEVELS.length,
      activeToday: 0,
      avgCorrectRate: 0,
      totalSessions: 0,
    }
  }
  const pool = db.getPool()!
  const [userRows] = await pool.query('SELECT COUNT(*) AS c FROM t_user') as any
  const [qRows] = await pool.query('SELECT COUNT(*) AS c FROM t_question') as any
  const [lvRows] = await pool.query('SELECT COUNT(*) AS c FROM t_level') as any
  const [sRows] = await pool.query('SELECT COUNT(*) AS c FROM t_session') as any
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const [todayRows] = await pool.query(
    'SELECT COUNT(DISTINCT user_id) AS c FROM t_session WHERE completed_at >= ?',
    [todayStart.getTime()],
  ) as any
  const [avgRows] = await pool.query(
    'SELECT AVG(correct_count/NULLIF(total_count,0)) AS rate FROM t_session',
  ) as any
  return {
    totalUsers: Number((userRows as any[])[0]?.c || 0),
    totalQuestions: Number((qRows as any[])[0]?.c || 0),
    totalLevels: Number((lvRows as any[])[0]?.c || 0),
    activeToday: Number((todayRows as any[])[0]?.c || 0),
    avgCorrectRate: Math.round(Number((avgRows as any[])[0]?.rate || 0) * 100),
    totalSessions: Number((sRows as any[])[0]?.c || 0),
  }
}

/** 近 N 天每日答题量 */
export async function getDailyTrend(days = 7) {
  if (db.useMemory) {
    return Array.from({ length: days }).map((_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10),
      count: 0,
    }))
  }
  const pool = db.getPool()!
  const result: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const start = d.getTime()
    const end = start + 86400000
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS c FROM t_session WHERE completed_at >= ? AND completed_at < ?',
      [start, end],
    ) as any
    result.push({
      date: d.toISOString().slice(0, 10),
      count: Number((rows as any[])[0]?.c || 0),
    })
  }
  return result
}

/** 知识点掌握度分析（基于错题率倒序） */
export async function getKnowledgeAnalysis() {
  if (db.useMemory) {
    // 内存模式：从题库聚合知识点
    const map = new Map<string, { total: number; mistakes: number }>()
    FALLBACK_LEVELS.forEach(l => l.questions.forEach(q => {
      const kp = q.knowledgePoint
      const m = map.get(kp) || { total: 0, mistakes: 0 }
      m.total++
      map.set(kp, m)
    }))
    return [...map.entries()].map(([kp, m]) => ({
      knowledgePoint: kp,
      totalAttempts: m.total,
      mistakeRate: 0,
      mastery: 100,
    })).sort((a, b) => a.knowledgePoint.localeCompare(b.knowledgePoint))
  }
  const pool = db.getPool()!
  const [rows] = await pool.query(`
    SELECT q.knowledge_point AS kp,
           COUNT(DISTINCT q.id) AS total,
           COALESCE(SUM(m.cnt), 0) AS mistakes
    FROM t_question q
    LEFT JOIN (
      SELECT question_id, COUNT(*) AS cnt FROM t_mistake GROUP BY question_id
    ) m ON q.id = m.question_id
    GROUP BY q.knowledge_point
    ORDER BY mistakes DESC
    LIMIT 50
  `) as any
  return (rows as any[]).map((r: any) => ({
    knowledgePoint: r.kp,
    totalAttempts: Number(r.total),
    mistakeRate: 0,
    mastery: r.total > 0 ? Math.max(0, Math.round((1 - Number(r.mistakes) / Number(r.total)) * 100)) : 100,
  }))
}

/** 高频错题 Top N */
export async function getTopMistakes(limit = 20) {
  if (db.useMemory) return []
  const pool = db.getPool()!
  const [rows] = await pool.query(`
    SELECT q.id, q.prompt, q.knowledge_point AS knowledgePoint, q.answer,
           q.difficulty, l.chapter, l.grade,
           COUNT(m.id) AS mistakeCount
    FROM t_mistake m
    INNER JOIN t_question q ON q.id = m.question_id
    LEFT JOIN t_level l ON l.id = q.level_id
    GROUP BY q.id
    ORDER BY mistakeCount DESC
    LIMIT ?
  `, [limit]) as any
  return (rows as any[]).map((r: any) => ({
    id: r.id,
    prompt: r.prompt,
    knowledgePoint: r.knowledgePoint,
    answer: r.answer,
    difficulty: r.difficulty,
    chapter: r.chapter,
    grade: r.grade,
    mistakeCount: Number(r.mistakeCount),
  }))
}

/** 用户排行榜（按 XP 累计） */
export async function getUserRanking(limit = 50) {
  if (db.useMemory) return []
  const pool = db.getPool()!
  const [rows] = await pool.query(`
    SELECT u.id, u.nickname, u.avatar, u.target_grade AS targetGrade,
           COALESCE(SUM(s.xp_gained), 0) AS totalXp,
           COUNT(s.id) AS totalSessions,
           COALESCE(AVG(s.correct_count/NULLIF(s.total_count,0)), 0) AS correctRate
    FROM t_user u
    LEFT JOIN t_session s ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY totalXp DESC
    LIMIT ?
  `, [limit]) as any
  return (rows as any[]).map((r: any, idx: number) => ({
    rank: idx + 1,
    userId: r.id,
    nickname: r.nickname || '小先锋',
    avatar: r.avatar || '',
    targetGrade: r.targetGrade,
    totalXp: Number(r.totalXp),
    totalSessions: Number(r.totalSessions),
    correctRate: Math.round(Number(r.correctRate) * 100),
  }))
}

/** 各年级关卡数量分布 */
export async function getGradeDistribution() {
  if (db.useMemory) {
    const map = new Map<number, number>()
    FALLBACK_LEVELS.forEach(l => map.set(l.grade, (map.get(l.grade) || 0) + 1))
    return [...map.entries()].map(([grade, count]) => ({ grade, count })).sort((a, b) => a.grade - b.grade)
  }
  const pool = db.getPool()!
  const [rows] = await pool.query(
    'SELECT grade, COUNT(*) AS count FROM t_level GROUP BY grade ORDER BY grade',
  ) as any
  return (rows as any[]).map((r: any) => ({ grade: Number(r.grade), count: Number(r.count) }))
}
