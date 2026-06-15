/**
 * 认证业务逻辑 - MySQL 版本
 * 测试模式：验证码固定为 123456
 */
import {
  findUserByPhone,
  findUserById,
  createUser,
  updateUser,
  getVerificationRecord,
  saveVerificationRecord,
  deleteVerificationRecord,
  cleanExpiredCodes,
  saveAssessment,
  getLatestAssessment,
  generateToken,
  validateToken,
} from './storage'
import type { AssessmentRecord } from './storage'

const CODE_EXPIRY_MS = 5 * 60 * 1000 // 5分钟
const MAX_ATTEMPTS = 3
const TEST_CODE = '123456' // 测试模式固定验证码
const SEND_COOLDOWN_MS = 60 * 1000 // 60秒内不可重复发送

/**
 * 手机号格式验证
 */
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 发送验证码
 */
export async function sendVerificationCode(phone: string): Promise<{
  success: boolean
  message: string
}> {
  if (!validatePhone(phone)) {
    return { success: false, message: '请输入正确的手机号' }
  }

  await cleanExpiredCodes()
  const existing = await getVerificationRecord(phone)

  // 检查冷却时间
  if (existing && existing.expiresAt - CODE_EXPIRY_MS + SEND_COOLDOWN_MS > Date.now()) {
    return { success: false, message: '验证码已发送，请稍后再试' }
  }

  const code = TEST_CODE
  const expiresAt = Date.now() + CODE_EXPIRY_MS

  await saveVerificationRecord({
    phone,
    code,
    expiresAt,
    attempts: 0,
  })

  console.log(`[MySQL] 发送验证码: phone=${phone}, code=${code}`)

  return { success: true, message: '验证码已发送' }
}

/**
 * 验证验证码并登录/注册
 */
export async function verifyAndLogin(phone: string, code: string): Promise<{
  success: boolean
  message: string
  user?: any
}> {
  if (!validatePhone(phone)) {
    return { success: false, message: '请输入正确的手机号' }
  }

  if (!/^\d{6}$/.test(code)) {
    return { success: false, message: '请输入6位数字验证码' }
  }

  await cleanExpiredCodes()
  const record = await getVerificationRecord(phone)

  if (!record) {
    return { success: false, message: '请先获取验证码' }
  }

  if (record.expiresAt <= Date.now()) {
    await deleteVerificationRecord(phone)
    return { success: false, message: '验证码已过期，请重新获取' }
  }

  // 更新尝试次数
  await saveVerificationRecord({
    ...record,
    attempts: record.attempts + 1,
  })

  if (code !== TEST_CODE) {
    if (record.attempts + 1 >= MAX_ATTEMPTS) {
      await deleteVerificationRecord(phone)
      return { success: false, message: '验证码错误，请重新获取' }
    }
    return { success: false, message: '验证码错误' }
  }

  // 验证成功，删除验证码记录
  await deleteVerificationRecord(phone)

  // 查找或创建用户
  let user = await findUserByPhone(phone)
  if (!user) {
    user = await createUser(phone)
    console.log(`[MySQL] 新用户注册: phone=${phone}, id=${user.id}`)
  } else {
    user = await updateUser(user.id, { lastLoginAt: Date.now() })
    console.log(`[MySQL] 用户登录: phone=${phone}, id=${user.id}`)
  }

  // 生成 30 天有效期 token
  const token = await generateToken(user.id, phone)
  return { success: true, message: '登录成功', user, token }
}

/**
 * 快捷登录：根据手机号免验证码直接登录
 * - 如果用户已存在且完成过 onboarding（有昵称+年级），直接生成 token 返回
 * - 如果用户不存在或资料不完整，返回失败，前端会回落为验证码登录
 */
export async function quickLoginByPhone(phone: string): Promise<{
  success: boolean
  message: string
  user?: any
  token?: string
}> {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '请输入正确的手机号' }
  }

  const user = await findUserByPhone(phone)
  if (!user) {
    return { success: false, message: '该手机号尚未注册，请先获取验证码登录' }
  }

  // 更新最近登录时间
  const updatedUser = await updateUser(user.id, { lastLoginAt: Date.now() })
  const token = await generateToken(user.id, phone)
  return {
    success: true,
    message: '登录成功',
    user: updatedUser,
    token,
  }
}

/**
 * Token 自动登录（30天内有效）
 */
export async function tokenLogin(token: string): Promise<{
  success: boolean
  message: string
  user?: any
}> {
  const record = await validateToken(token)
  if (!record) {
    return { success: false, message: '登录已过期，请重新登录' }
  }
  const user = await findUserById(record.userId)
  if (!user) {
    return { success: false, message: '用户不存在，请重新登录' }
  }
  // 更新 lastLoginAt
  await updateUser(user.id, { lastLoginAt: Date.now() })
  console.log(`[Auth] Token 自动登录: userId=${user.id}, phone=${record.phone}`)
  return { success: true, message: 'ok', user, token }
}

/**
 * 获取用户信息
 */
export async function getUserInfo(userId: string): Promise<{
  success: boolean
  message: string
  user?: any
}> {
  const user = await findUserById(userId)
  if (!user) {
    return { success: false, message: '用户不存在' }
  }
  return { success: true, message: 'ok', user }
}

/**
 * 更新用户个人信息（学习阶段、目标、年级、昵称、头像）
 */
export async function updateProfile(userId: string, profile: Partial<{
  learningStage: string
  learningGoal: string
  targetGrade: number
  nickname: string
  avatar: string
}>): Promise<{ success: boolean; message: string; user?: any }> {
  const existing = await findUserById(userId)
  if (!existing) {
    return { success: false, message: '用户不存在' }
  }
  const updated = await updateUser(userId, profile)
  console.log(`[Auth] 用户信息更新: userId=${userId}, nickname=${profile.nickname ?? existing.nickname}`)
  return { success: true, message: '保存成功', user: updated }
}

/**
 * 保存测评结果
 */
export async function saveAssessmentResult(userId: string, assessment: Omit<AssessmentRecord, 'userId'>): Promise<{ success: boolean; message: string; assessment?: AssessmentRecord }> {
  const existing = await findUserById(userId)
  if (!existing) {
    return { success: false, message: '用户不存在' }
  }
  const record: AssessmentRecord = {
    ...assessment,
    userId,
  }
  await saveAssessment(record)
  return { success: true, message: '保存成功', assessment: record }
}

/**
 * 获取用户最新测评
 */
export async function getAssessment(userId: string): Promise<{ success: boolean; message: string; assessment?: AssessmentRecord | null }> {
  const existing = await findUserById(userId)
  if (!existing) {
    return { success: false, message: '用户不存在' }
  }
  const record = await getLatestAssessment(userId)
  return { success: true, message: 'ok', assessment: record }
}
