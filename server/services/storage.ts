/**
 * 数据存储服务 - 支持 MySQL / 内存降级 / Redis 缓存
 */
import { getPool, isMemoryMode } from '../db'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import type { User, VerificationRecord } from '../types'
import { cacheGet, cacheSet, cacheDel } from './cache'

// ===== 内存存储数据 =====

const memoryUsers = new Map<string, User>()
const memoryCodes = new Map<string, VerificationRecord>()

// ===== 用户存储 =====

export async function findUserByPhone(phone: string): Promise<User | null> {
  if (isMemoryMode()) {
    for (const user of memoryUsers.values()) {
      if (user.phone === phone) return user
    }
    return null
  }

  const pool = getPool()
  if (!pool) return null

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, phone, nickname, avatar, learning_stage, learning_goal, target_grade, created_at, last_login_at FROM t_user WHERE phone = ?',
    [phone]
  )
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar,
    learningStage: row.learning_stage,
    learningGoal: row.learning_goal,
    targetGrade: row.target_grade,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

export async function findUserById(id: string): Promise<User | null> {
  if (isMemoryMode()) {
    return memoryUsers.get(id) || null
  }

  const pool = getPool()
  if (!pool) return null

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, phone, nickname, avatar, learning_stage, learning_goal, target_grade, created_at, last_login_at FROM t_user WHERE id = ?',
    [id]
  )
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar,
    learningStage: row.learning_stage,
    learningGoal: row.learning_goal,
    targetGrade: row.target_grade,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

export async function createUser(phone: string, profile?: Partial<User>): Promise<User> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  const now = Date.now()
  // 新用户不设置默认昵称/年级，让前端走 onboarding + 测评流程
  // 只有显式传入 profile 时才覆盖（例如用户手动注册时）
  const user: User = {
    id,
    phone,
    nickname: profile?.nickname ?? null,
    avatar: profile?.avatar ?? null,
    learningStage: profile?.learningStage ?? null,
    learningGoal: profile?.learningGoal ?? null,
    targetGrade: profile?.targetGrade ?? null,
    createdAt: now,
    lastLoginAt: now,
  }

  if (isMemoryMode()) {
    memoryUsers.set(id, user)
    console.log(`[Memory] 新用户注册: phone=${phone}, id=${id}`)
    return user
  }

  const pool = getPool()
  if (!pool) return user

  await pool.query<ResultSetHeader>(
    `INSERT INTO t_user (id, phone, nickname, avatar, learning_stage, learning_goal, target_grade, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      phone,
      user.nickname,
      user.avatar,
      user.learningStage,
      user.learningGoal,
      user.targetGrade,
      now,
      now,
    ]
  )
  console.log(`[MySQL] 新用户注册: phone=${phone}, id=${id}`)
  return user
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  if (isMemoryMode()) {
    const existing = memoryUsers.get(userId)
    if (!existing) return null
    const updated = { ...existing, ...updates }
    memoryUsers.set(userId, updated)
    return updated
  }

  const pool = getPool()
  if (!pool) return null

  const fields: string[] = []
  const values: any[] = []

  if (updates.nickname !== undefined) { fields.push('nickname = ?'); values.push(updates.nickname) }
  if (updates.avatar !== undefined) { fields.push('avatar = ?'); values.push(updates.avatar) }
  if (updates.learningStage !== undefined) { fields.push('learning_stage = ?'); values.push(updates.learningStage) }
  if (updates.learningGoal !== undefined) { fields.push('learning_goal = ?'); values.push(updates.learningGoal) }
  if (updates.targetGrade !== undefined) { fields.push('target_grade = ?'); values.push(updates.targetGrade) }
  if (updates.lastLoginAt !== undefined) { fields.push('last_login_at = ?'); values.push(updates.lastLoginAt) }

  if (fields.length === 0) return findUserById(userId)

  values.push(userId)
  await pool.query<ResultSetHeader>(
    `UPDATE t_user SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
  return findUserById(userId)
}

// ===== 测评记录存储 =====

export interface AssessmentRecord {
  id: string
  userId: string
  completedAt: number
  score: number
  recommendedDifficulty: number
  answers: Array<{ questionId: string; userAnswer: string; isCorrect: boolean }>
}

const memoryAssessments: AssessmentRecord[] = []

export async function saveAssessment(record: AssessmentRecord): Promise<AssessmentRecord> {
  if (isMemoryMode()) {
    memoryAssessments.push(record)
    console.log(`[Memory] 测评保存: userId=${record.userId}, score=${record.score}`)
    return record
  }

  const pool = getPool()
  if (!pool) return record

  // 主表
  await pool.query(
    `INSERT INTO t_assessment (id, user_id, completed_at, score, recommended_difficulty) VALUES (?, ?, ?, ?, ?)`,
    [record.id, record.userId, record.completedAt, record.score, record.recommendedDifficulty]
  )
  // 答案明细表
  if (record.answers.length > 0) {
    const rows = record.answers.map(a => [
      record.id + '-' + a.questionId,
      record.id,
      a.questionId,
      a.userAnswer,
      a.isCorrect ? 1 : 0,
    ])
    await pool.query(
      `INSERT INTO t_assessment_answer (id, assessment_id, question_id, user_answer, is_correct) VALUES ?`,
      [rows]
    )
  }
  console.log(`[MySQL] 测评保存: userId=${record.userId}, score=${record.score}`)
  return record
}

export async function getLatestAssessment(userId: string): Promise<AssessmentRecord | null> {
  if (isMemoryMode()) {
    const sorted = memoryAssessments.filter(a => a.userId === userId).sort((a, b) => b.completedAt - a.completedAt)
    return sorted[0] || null
  }

  const pool = getPool()
  if (!pool) return null

  const [rows] = await pool.query<any[]>(
    `SELECT id, user_id, completed_at, score, recommended_difficulty FROM t_assessment WHERE user_id = ? ORDER BY completed_at DESC LIMIT 1`,
    [userId]
  )
  if (rows.length === 0) return null
  const main = rows[0]
  const [ans] = await pool.query<any[]>(
    `SELECT question_id, user_answer, is_correct FROM t_assessment_answer WHERE assessment_id = ?`,
    [main.id]
  )
  return {
    id: main.id,
    userId: main.user_id,
    completedAt: main.completed_at,
    score: main.score,
    recommendedDifficulty: main.recommended_difficulty,
    answers: ans.map((a: any) => ({
      questionId: a.question_id,
      userAnswer: a.user_answer,
      isCorrect: !!a.is_correct,
    })),
  }
}

// ===== Token 存储 (30天有效期) =====

export interface TokenRecord {
  token: string
  userId: string
  phone: string
  expiresAt: number // 时间戳 ms
  createdAt: number
}

const memoryTokens = new Map<string, TokenRecord>()
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30天

export async function generateToken(userId: string, phone: string): Promise<string> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`
  const record: TokenRecord = { token, userId, phone, expiresAt: Date.now() + TOKEN_EXPIRY_MS, createdAt: Date.now() }
  if (isMemoryMode()) { memoryTokens.set(token, record); return token }
  const pool = getPool()
  if (!pool) { memoryTokens.set(token, record); return token }
  try {
    await pool.query(
      `INSERT INTO t_token (token, user_id, phone, expires_at, created_at) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE token=VALUES(token), expires_at=VALUES(expires_at)`,
      [token, userId, phone, record.expiresAt, record.createdAt],
    )
    console.log(`[MySQL] Token 已保存: userId=${userId}`)
  } catch (e: any) {
    console.error('[MySQL] Token 保存失败，降级内存:', e?.message)
    memoryTokens.set(token, record)
  }
  // Redis 缓存 Token（30 天 TTL）
  cacheSet(`token:${token}`, JSON.stringify({ userId, phone }), 30 * 24 * 3600).catch(() => {})
  return token
}

export async function validateToken(token: string): Promise<TokenRecord | null> {
  if (isMemoryMode()) {
    const r = memoryTokens.get(token)
    if (!r || r.expiresAt <= Date.now()) { if (r) memoryTokens.delete(token); return null }
    return r
  }
  // 1. Redis 缓存
  const cached = await cacheGet(`token:${token}`)
  if (cached) {
    try {
      const { userId, phone } = JSON.parse(cached)
      return { token, userId, phone, expiresAt: 0, createdAt: 0 }
    } catch { /* fallback */ }
  }
  // 2. MySQL
  const pool = getPool()
  if (!pool) {
    const r = memoryTokens.get(token)
    if (!r || r.expiresAt <= Date.now()) return null
    return r
  }
  try {
    const [rows] = await pool.query<any[]>('SELECT token, user_id, phone, expires_at FROM t_token WHERE token = ?', [token])
    if (!rows.length) return null
    const row = rows[0]
    if (row.expires_at <= Date.now()) { await pool.query('DELETE FROM t_token WHERE token = ?', [token]); await cacheDel(`token:${token}`).catch(() => {}); return null }
    // 回写 Redis
    cacheSet(`token:${token}`, JSON.stringify({ userId: row.user_id, phone: row.phone }), 30 * 24 * 3600).catch(() => {})
    return { token: row.token, userId: row.user_id, phone: row.phone, expiresAt: row.expires_at, createdAt: row.created_at }
  } catch { return null }
}

// ===== 验证码存储 =====

export async function getVerificationRecord(phone: string): Promise<VerificationRecord | null> {
  if (isMemoryMode()) {
    const rec = memoryCodes.get(phone)
    if (!rec) return null
    return { ...rec }
  }

  // 1. Redis 缓存
  const cached = await cacheGet(`code:${phone}`)
  if (cached) {
    try { return JSON.parse(cached) as VerificationRecord } catch { /* fallback */ }
  }

  // 2. MySQL
  const pool = getPool()
  if (!pool) return null

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT phone, code, expires_at, attempts FROM t_verification_code WHERE phone = ?',
    [phone]
  )
  if (rows.length === 0) return null
  const row = rows[0]
  const record: VerificationRecord = {
    phone: row.phone,
    code: row.code,
    expiresAt: row.expires_at,
    attempts: row.attempts,
  }
  // 回写 Redis
  const ttl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000))
  cacheSet(`code:${phone}`, JSON.stringify(record), ttl).catch(() => {})
  return record
}

export async function saveVerificationRecord(record: VerificationRecord): Promise<void> {
  if (isMemoryMode()) {
    memoryCodes.set(record.phone, { ...record })
    return
  }

  const pool = getPool()
  if (!pool) return

  await pool.query<ResultSetHeader>(
    `INSERT INTO t_verification_code (phone, code, expires_at, attempts, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at), attempts = VALUES(attempts), created_at = VALUES(created_at)`,
    [record.phone, record.code, record.expiresAt, record.attempts, Date.now()]
  )
  // Redis 缓存验证码（5 分钟 TTL，与验证码过期时间一致）
  const ttl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000))
  cacheSet(`code:${record.phone}`, JSON.stringify(record), ttl).catch(() => {})
}

export async function deleteVerificationRecord(phone: string): Promise<void> {
  if (isMemoryMode()) {
    memoryCodes.delete(phone)
    return
  }

  const pool = getPool()
  if (!pool) return

  await pool.query<ResultSetHeader>(
    'DELETE FROM t_verification_code WHERE phone = ?',
    [phone]
  )
  // 删除 Redis 缓存
  cacheDel(`code:${phone}`).catch(() => {})
}

export async function cleanExpiredCodes(): Promise<void> {
  if (isMemoryMode()) {
    const now = Date.now()
    for (const [phone, rec] of memoryCodes) {
      if (rec.expiresAt <= now) memoryCodes.delete(phone)
    }
    return
  }

  const pool = getPool()
  if (!pool) return

  const now = Date.now()
  await pool.query<ResultSetHeader>(
    'DELETE FROM t_verification_code WHERE expires_at < ?',
    [now]
  )
}
