/**
 * 管理后台 API 客户端
 * 统一封装所有 /api/admin/* 请求
 */
import { getAdminToken } from '@/store/adminAuth'

const API_BASE = '/api'

// ============= 类型定义 =============
export interface SummaryData {
  totalUsers: number
  totalQuestions: number
  totalLevels: number
  activeToday: number
  avgCorrectRate: number
  totalSessions: number
}

export interface TrendPoint {
  date: string
  count: number
}

export interface KnowledgePointStats {
  knowledgePoint: string
  total: number
  correct: number
  accuracy: number
}

export interface TopMistake {
  questionId: string
  content: string
  knowledgePoint: string
  wrongCount: number
}

export interface UserRanking {
  userId: string
  nickname: string
  xp: number
  level: number
}

export interface GradeDistribution {
  grade: number
  count: number
}

export interface ImportHistory {
  id: string
  type: string
  filename: string
  status: string
  createdAt: string
}

export interface SystemConfig {
  key: string
  value: string
  description?: string
}

export interface AdminAccount {
  id: string
  username: string
  nickname?: string
  role: string
  status: number
  createdAt: string
  lastLoginAt?: string
}

export interface LoginLog {
  id: string
  adminId: string
  username: string
  ip: string
  success: boolean
  createdAt: string
}

export interface Level {
  id: string
  grade: number
  chapter: string
  sortOrder: number
  isBoss: boolean
  unitId?: string
}

export interface Question {
  id: string
  levelId: string
  content: string
  type: string
  options?: string[]
  answer: string
  knowledgePoint: string
  difficulty: number
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
  }
  const data = await res.json()
  if (data && data.success === false) {
    throw new Error(data.message || '请求失败')
  }
  return data
}

// ============= 统计 =============
export const adminStatsApi = {
  summary: () => request<{ success: boolean; data: SummaryData }>('/admin/stats/summary').then(r => r.data),
  dailyTrend: (days = 7) => request<{ success: boolean; data: TrendPoint[] }>(`/admin/stats/daily-trend?days=${days}`).then(r => r.data),
  knowledgePoints: () => request<{ success: boolean; data: KnowledgePointStats[] }>('/admin/stats/knowledge-points').then(r => r.data),
  topMistakes: (limit = 20) => request<{ success: boolean; data: TopMistake[] }>(`/admin/stats/top-mistakes?limit=${limit}`).then(r => r.data),
  userRanking: (limit = 50) => request<{ success: boolean; data: UserRanking[] }>(`/admin/stats/user-ranking?limit=${limit}`).then(r => r.data),
  gradeDistribution: () => request<{ success: boolean; data: GradeDistribution[] }>('/admin/stats/grade-distribution').then(r => r.data),
}

// ============= 导入导出 =============
export const adminImportApi = {
  exportJsonUrl: () => `${API_BASE}/admin/import/export/json`,
  templateUrl: () => `${API_BASE}/admin/import/template`,
  importJson: (content: string) => request<{ success: boolean; message: string }>('/admin/import/import/json', {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
  history: (limit = 50) => request<{ success: boolean; data: ImportHistory[] }>(`/admin/import/history?limit=${limit}`).then(r => r.data),
}

// ============= 系统配置 =============
export const adminConfigApi = {
  list: () => request<{ success: boolean; data: SystemConfig[] }>('/admin/config').then(r => r.data),
  update: (updates: { key: string; value: string }[]) => request<{ success: boolean; message: string }>('/admin/config', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  }),
}

// ============= 管理员账号 =============
export const adminAccountsApi = {
  login: (username: string, password: string) => request<{ success: boolean; admin?: AdminAccount; token?: string; message?: string }>('/admin/accounts/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  list: () => request<{ success: boolean; data: AdminAccount[] }>('/admin/accounts').then(r => r.data),
  create: (data: { username: string; password: string; nickname?: string; role: string }) =>
    request<{ success: boolean; message: string }>('/admin/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<AdminAccount, 'id' | 'createdAt'>> & { password?: string }) =>
    request<{ success: boolean; message: string }>(`/admin/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ success: boolean; message: string }>(`/admin/accounts/${id}`, { method: 'DELETE' }),
  loginLog: (limit = 30) => request<{ success: boolean; data: LoginLog[] }>(`/admin/accounts/login-log?limit=${limit}`).then(r => r.data),
}

// ============= 内容（题库）=============
export const adminContentApi = {
  listLevels: (grade?: number) => {
    const q = grade ? `?grade=${grade}` : ''
    return request<{ success: boolean; levels: Level[] }>(`/content/admin/levels${q}`).then(r => r.levels)
  },
  getQuestions: (levelId: string) =>
    request<{ success: boolean; questions: Question[] }>(`/content/admin/levels/${levelId}/questions`).then(r => r.questions),
  upsertLevel: (data: {
    id?: string; grade: number; chapter: string; sortOrder?: number; isBoss: boolean; unitId?: string
  }) =>
    request<{ success: boolean; level: Level }>('/content/admin/levels', { method: 'POST', body: JSON.stringify(data) }),
  deleteLevel: (id: string) => request<{ success: boolean; message: string }>(`/content/admin/levels/${id}`, { method: 'DELETE' }),
  upsertQuestion: (data: Partial<Question> & { levelId: string; content: string; answer: string }) =>
    request<{ success: boolean; question: Question }>('/content/admin/questions', { method: 'POST', body: JSON.stringify(data) }),
  deleteQuestion: (id: string) => request<{ success: boolean; message: string }>(`/content/admin/questions/${id}`, { method: 'DELETE' }),
  knowledgePoints: (grade?: number) => {
    const q = grade ? `?grade=${grade}` : ''
    return request<{ success: boolean; knowledgePoints: string[] }>(`/content/knowledge-points${q}`).then(r => r.knowledgePoints)
  },
}
