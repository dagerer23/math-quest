import { post, get, TOKEN_KEY } from '@/utils/request'

export { TOKEN_KEY }

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

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export async function sendVerificationCode(phone: string) {
  try {
    return await post<{ success: boolean; message: string }>(`${API_BASE}/send-code`, { phone })
  } catch {
    return { success: false, message: '网络错误，请检查网络连接' }
  }
}

export async function loginWithPhone(phone: string, code: string) {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser; token?: string }>(`${API_BASE}/login`, { phone, code })
  } catch {
    return { success: false, message: '网络错误，请检查网络连接' }
  }
}

export async function tokenLogin(token: string) {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser }>(`${API_BASE}/token-login`, { token })
  } catch (err) {
    const message = err instanceof Error && err.message.includes('429') ? '请求过于频繁，请稍后再试' : '网络错误'
    return { success: false, message, rateLimited: message.includes('频繁') }
  }
}

export async function saveProfile(params: {
  userId: string; nickname?: string; avatar?: string
  learningStage?: string; learningGoal?: string; targetGrade?: number
}) {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser }>(`${API_BASE}/profile`, params)
  } catch {
    return { success: false, message: '网络错误' }
  }
}

export async function fetchAssessment(userId: string) {
  try {
    return await get<{ success: boolean; message: string; assessment?: any }>(`${API_BASE}/assessment?userId=${encodeURIComponent(userId)}`)
  } catch {
    return { success: false, message: '网络错误' }
  }
}
