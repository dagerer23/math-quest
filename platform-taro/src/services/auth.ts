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
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : '网络错误，请检查网络连接' }
  }
}

export async function loginWithPhone(phone: string, code: string) {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser; token?: string }>(`${API_BASE}/login`, { phone, code })
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : '网络错误，请检查网络连接' }
  }
}

export async function wxLogin(code: string) {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser; token?: string }>(`${API_BASE}/wx-login`, { code })
  } catch (err) {
    // 微信小程序错误对象可能含 errMsg 字段
    let msg = '网络错误，请检查网络连接'
    if (err instanceof Error) {
      msg = err.message
    } else if (err && typeof err === 'object') {
      msg = (err as any).errMsg || (err as any).message || JSON.stringify(err)
    } else if (typeof err === 'string') {
      msg = err
    }
    return { success: false, message: msg }
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

export async function quickLogin(phone: string) {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser; token?: string }>(`${API_BASE}/quick-login`, { phone })
  } catch {
    return { success: false, message: '网络错误，请检查网络连接' }
  }
}

export async function guestLogin() {
  try {
    return await post<{ success: boolean; message: string; user?: BackendUser; token?: string }>(`${API_BASE}/guest`, {})
  } catch {
    return { success: false, message: '网络错误，请检查网络连接' }
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

export async function saveAssessment(params: {
  userId: string
  id?: string
  completedAt: number
  score: number
  recommendedDifficulty: number
  answers: Array<{ questionId: string; userAnswer: string; isCorrect: boolean }>
}): Promise<{ success: boolean; message: string }> {
  try {
    return await post<{ success: boolean; message: string }>(`${API_BASE}/assessment`, params)
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

export async function exportUserData(userId: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    return await get<{ success: boolean; message: string; data?: any }>(`${API_BASE}/export?userId=${encodeURIComponent(userId)}`)
  } catch {
    return { success: false, message: '网络错误' }
  }
}
