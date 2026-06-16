/**
 * 认证服务 - 调用后端 API 处理手机号登录和验证码验证
 * 测试模式验证码: 123456
 */
import type { User } from '@/types/models'
import { post, get } from '@/utils/request'

const API_BASE = '/api/auth'

export interface BackendUser {
  id: string
  phone: string
  nickname?: string
  avatar?: string
  learningStage?: string
  learningGoal?: string
  targetGrade?: number
  createdAt: number
  lastLoginAt?: number
}

// 本地存储 key
export const TOKEN_KEY = 'mq_token'

// 手机号格式验证
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
  try {
    const data = await post<{ success: boolean; message: string }>(
      `${API_BASE}/send-code`,
      { phone }
    )
    return data
  } catch (err) {
    return { success: false, message: '网络错误，请检查网络连接' }
  }
}

/**
 * 手机号登录（验证码验证 + 登录/注册）
 * 登录成功后返回 30 天有效 token
 */
export async function loginWithPhone(phone: string, code: string): Promise<{
  success: boolean
  message: string
  user?: BackendUser
  token?: string
}> {
  try {
    const data = await post<{
      success: boolean
      message: string
      user?: BackendUser
      token?: string
    }>(`${API_BASE}/login`, { phone, code })
    return data
  } catch {
    return { success: false, message: '网络错误，请检查网络连接' }
  }
}

/**
 * 快捷登录：根据手机号免验证码一键登录
 * 仅限老用户使用（后端根据手机号查找用户）
 */
export async function quickLogin(phone: string): Promise<{
  success: boolean
  message: string
  user?: BackendUser
  token?: string
}> {
  try {
    const data = await post<{
      success: boolean
      message: string
      user?: BackendUser
      token?: string
    }>(`${API_BASE}/quick-login`, { phone })
    return data
  } catch {
    return { success: false, message: '网络错误' }
  }
}

/**
 * Token 自动登录（30天内免验证）
 */
export async function tokenLogin(token: string): Promise<{
  success: boolean
  message: string
  user?: BackendUser
  rateLimited?: boolean
}> {
  try {
    const data = await post<{
      success: boolean
      message: string
      user?: BackendUser
    }>(`${API_BASE}/token-login`, { token })
    return data
  } catch (err) {
    const message = err instanceof Error && err.message.includes('HTTP 429')
      ? '请求过于频繁，请稍后再试'
      : '网络错误'
    return { success: false, message, rateLimited: message.includes('频繁') }
  }
}

/**
 * 保存用户个人信息（学习阶段、目标、年级、昵称、头像）
 */
export async function saveProfile(params: {
  userId: string
  nickname?: string
  avatar?: string
  learningStage?: string
  learningGoal?: string
  targetGrade?: number
}): Promise<{ success: boolean; message: string; user?: BackendUser }> {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser }>(
      `${API_BASE}/profile`,
      params
    )
  } catch {
    return { success: false, message: '网络错误' }
  }
}

/**
 * 保存测评结果
 */
export async function saveAssessment(params: {
  userId: string
  id?: string
  completedAt: number
  score: number
  recommendedDifficulty: number
  answers: Array<{ questionId: string; userAnswer: string; isCorrect: boolean }>
}): Promise<{ success: boolean; message: string }> {
  try {
    return await post<{ success: boolean; message: string }>(
      `${API_BASE}/assessment`,
      params
    )
  } catch {
    return { success: false, message: '网络错误' }
  }
}

/**
 * 获取用户信息（用户初次登录时拉取）
 */
export async function fetchUser(userId: string): Promise<{
  success: boolean
  message: string
  user?: BackendUser
}> {
  try {
    return await get<{ success: boolean; message: string; user?: BackendUser }>(
      `${API_BASE}/me?userId=${encodeURIComponent(userId)}`
    )
  } catch {
    return { success: false, message: '网络错误' }
  }
}

/**
 * 获取用户最新的评测结果
 */
export async function fetchAssessment(userId: string): Promise<{
  success: boolean
  message: string
  assessment?: {
    id: string
    completedAt: number
    score: number
    recommendedDifficulty: number
    answers: Array<{ questionId: string; userAnswer: string; isCorrect: boolean }>
  }
}> {
  try {
    return await get<{
      success: boolean
      message: string
      assessment?: {
        id: string
        completedAt: number
        score: number
        recommendedDifficulty: number
        answers: Array<{ questionId: string; userAnswer: string; isCorrect: boolean }>
      }
    }>(`${API_BASE}/assessment?userId=${encodeURIComponent(userId)}`)
  } catch {
    return { success: false, message: '网络错误' }
  }
}

/**
 * 退出登录
 */
export function logout(): void {
  console.log('用户已退出登录')
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser(_phone: string): User | null {
  // 此方法保留用于兼容，实际数据在 Zustand 中维护
  return null
}
