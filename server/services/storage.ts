/**
 * 数据存储服务 - 支持 MySQL / 内存降级 / Redis 缓存
 */
import { getPool, isMemoryMode } from '../db'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import type { User, VerificationRecord, ClassEntity, Encouragement } from '../types'
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
    'SELECT id, phone, openid, nickname, avatar, learning_stage, learning_goal, target_grade, created_at, last_login_at FROM t_user WHERE phone = ?',
    [phone]
  )
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    phone: row.phone,
    openid: row.openid,
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
    'SELECT id, phone, openid, nickname, avatar, learning_stage, learning_goal, target_grade, created_at, last_login_at FROM t_user WHERE id = ?',
    [id]
  )
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    phone: row.phone,
    openid: row.openid,
    nickname: row.nickname,
    avatar: row.avatar,
    learningStage: row.learning_stage,
    learningGoal: row.learning_goal,
    targetGrade: row.target_grade,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

export async function findUserByOpenid(openid: string): Promise<User | null> {
  if (isMemoryMode()) {
    for (const user of memoryUsers.values()) {
      if (user.openid === openid) return user
    }
    return null
  }

  const pool = getPool()
  if (!pool) return null

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, phone, openid, nickname, avatar, learning_stage, learning_goal, target_grade, created_at, last_login_at FROM t_user WHERE openid = ?',
    [openid]
  )
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    phone: row.phone,
    openid: row.openid,
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
  // 微信登录用户：phone 可为空字符串，openid 由 profile 传入
  const user: User = {
    id,
    phone,
    openid: profile?.openid ?? null,
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
    console.log(`[Memory] 新用户注册: phone=${phone || '(空)'}, openid=${user.openid || '(空)'}, id=${id}`)
    return user
  }

  const pool = getPool()
  if (!pool) return user

  await pool.query<ResultSetHeader>(
    `INSERT INTO t_user (id, phone, openid, nickname, avatar, learning_stage, learning_goal, target_grade, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      phone || null,
      user.openid || null,
      user.nickname,
      user.avatar,
      user.learningStage,
      user.learningGoal,
      user.targetGrade,
      now,
      now,
    ]
  )
  console.log(`[MySQL] 新用户注册: phone=${phone || '(空)'}, openid=${user.openid || '(空)'}, id=${id}`)
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

// ===== 班级和成员存储 =====

const memoryClasses = new Map<string, ClassEntity>()
const memoryClassMembers = new Map<string, Set<string>>() // classId -> Set<userId>

export async function createClass(code: string, name: string, createdBy: string): Promise<ClassEntity> {
  const cls: ClassEntity = {
    id: 'class-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    code,
    name,
    createdBy,
    createdAt: Date.now(),
  }
  if (isMemoryMode()) {
    memoryClasses.set(cls.id, cls)
    memoryClassMembers.set(cls.id, new Set([createdBy]))
    return cls
  }
  const pool = getPool()
  if (pool) {
    try {
      await pool.query<ResultSetHeader>(
        'INSERT INTO t_class (id, code, name, created_by, created_at) VALUES (?, ?, ?, ?, ?)',
        [cls.id, cls.code, cls.name, cls.createdBy, cls.createdAt]
      )
      await pool.query<ResultSetHeader>(
        'INSERT INTO t_class_member (class_id, user_id, created_at) VALUES (?, ?, ?)',
        [cls.id, createdBy, cls.createdAt]
      )
    } catch { /* ignore */ }
  }
  return cls
}

export async function findClassByCode(code: string): Promise<ClassEntity | null> {
  if (isMemoryMode()) {
    for (const cls of memoryClasses.values()) {
      if (cls.code === code) return cls
    }
    return null
  }
  const pool = getPool()
  if (!pool) return null
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, code, name, created_by, created_at FROM t_class WHERE code = ? LIMIT 1',
    [code]
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return { id: r.id, code: r.code, name: r.name, createdBy: r.created_by, createdAt: r.created_at }
}

export async function findClassById(classId: string): Promise<ClassEntity | null> {
  if (isMemoryMode()) return memoryClasses.get(classId) || null
  const pool = getPool()
  if (!pool) return null
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, code, name, created_by, created_at FROM t_class WHERE id = ? LIMIT 1',
    [classId]
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return { id: r.id, code: r.code, name: r.name, createdBy: r.created_by, createdAt: r.created_at }
}

export async function joinClass(userId: string, classId: string): Promise<void> {
  if (isMemoryMode()) {
    const members = memoryClassMembers.get(classId) || new Set<string>()
    members.add(userId)
    memoryClassMembers.set(classId, members)
    return
  }
  const pool = getPool()
  if (!pool) return
  try {
    await pool.query<ResultSetHeader>(
      'INSERT INTO t_class_member (class_id, user_id, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)',
      [classId, userId, Date.now()]
    )
  } catch { /* ignore */ }
}

export async function leaveClass(userId: string, classId: string): Promise<void> {
  if (isMemoryMode()) {
    const members = memoryClassMembers.get(classId)
    if (members) members.delete(userId)
    return
  }
  const pool = getPool()
  if (!pool) return
  await pool.query<ResultSetHeader>(
    'DELETE FROM t_class_member WHERE class_id = ? AND user_id = ?',
    [classId, userId]
  )
}

export async function getClassMemberCount(classId: string): Promise<number> {
  if (isMemoryMode()) return memoryClassMembers.get(classId)?.size || 0
  const pool = getPool()
  if (!pool) return 0
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as cnt FROM t_class_member WHERE class_id = ?',
    [classId]
  )
  return Number(rows[0]?.cnt || 0)
}

export async function getClassMemberIds(classId: string): Promise<string[]> {
  if (isMemoryMode()) return Array.from(memoryClassMembers.get(classId) || [])
  const pool = getPool()
  if (!pool) return []
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT user_id FROM t_class_member WHERE class_id = ?',
    [classId]
  )
  return rows.map((r) => r.user_id)
}

export async function findClassMembersByIds(userIds: string[]): Promise<ClassMember[]> {
  if (userIds.length === 0) return []
  if (isMemoryMode()) {
    const result: ClassMember[] = []
    for (const uid of userIds) {
      const u = memoryUsers.get(uid)
      if (u) {
        result.push({
          userId: u.id,
          nickname: u.nickname || '同学',
          avatar: u.avatar || '',
          targetGrade: u.targetGrade || 0,
          xp: 0,
          createdAt: u.createdAt,
        })
      }
    }
    return result
  }
  const pool = getPool()
  if (!pool) return []
  const placeholders = userIds.map(() => '?').join(',')
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, nickname, avatar, target_grade, created_at FROM t_user WHERE id IN (${placeholders})`,
    userIds
  )
  return rows.map((r) => ({
    userId: r.id,
    nickname: r.nickname || '同学',
    avatar: r.avatar || '',
    targetGrade: r.target_grade || 0,
    xp: 0,
    createdAt: r.created_at,
  }))
}

// ===== 鼓励记录存储 =====

const memoryEncouragements = new Map<string, Encouragement[]>() // userId -> list of encouragements received

export async function sendEncouragement(fromUserId: string, toUserId: string, context?: string): Promise<Encouragement> {
  const enc: Encouragement = {
    id: 'enc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    fromUserId,
    toUserId,
    emoji: 'flower',
    context,
    createdAt: Date.now(),
  }
  if (isMemoryMode()) {
    const list = memoryEncouragements.get(toUserId) || []
    list.push(enc)
    memoryEncouragements.set(toUserId, list)
    return enc
  }
  const pool = getPool()
  if (pool) {
    try {
      await pool.query<ResultSetHeader>(
        'INSERT INTO t_encouragement (id, from_user_id, to_user_id, emoji, context, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [enc.id, fromUserId, toUserId, enc.emoji, context || null, enc.createdAt]
      )
    } catch { /* ignore */ }
  }
  return enc
}

export async function getEncouragementsReceived(userId: string): Promise<Array<Encouragement & { fromUserName: string; fromUserAvatar: string }>> {
  if (isMemoryMode()) {
    const list = memoryEncouragements.get(userId) || []
    return list.slice(-10).map((enc) => {
      const u = memoryUsers.get(enc.fromUserId)
      return { ...enc, fromUserName: u?.nickname || '同学', fromUserAvatar: u?.avatar || '' }
    })
  }
  const pool = getPool()
  if (!pool) return []
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT e.id, e.from_user_id, e.to_user_id, e.emoji, e.context, e.created_at, u.nickname as from_user_name, u.avatar as from_user_avatar FROM t_encouragement e LEFT JOIN t_user u ON e.from_user_id = u.id WHERE e.to_user_id = ? ORDER BY e.created_at DESC LIMIT 10',
    [userId]
  )
  return rows.map((r) => ({
    id: r.id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    emoji: r.emoji,
    context: r.context,
    createdAt: r.created_at,
    fromUserName: r.from_user_name || '同学',
    fromUserAvatar: r.from_user_avatar || '',
  }))
}

export async function getEncouragementCountReceived(userId: string): Promise<number> {
  if (isMemoryMode()) return (memoryEncouragements.get(userId) || []).length
  const pool = getPool()
  if (!pool) return 0
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as cnt FROM t_encouragement WHERE to_user_id = ?',
    [userId]
  )
  return Number(rows[0]?.cnt || 0)
}
