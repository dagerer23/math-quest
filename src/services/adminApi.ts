/**
 * 管理后台 API 客户端
 * 统一封装所有 /api/admin/* 请求
 */
import { getAdminToken } from '@/store/adminAuth'

const API_BASE = '/api'

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
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
  let data: any
  try {
    data = await res.json()
  } catch {
    throw new Error(`响应解析失败 (非 JSON): ${url}`)
  }
  if (data && data.success === false) {
    throw new Error(data.message || '请求失败')
  }
  return data
}

// ============= 统计 =============
export const adminStatsApi = {
  summary: () => request<{ success: boolean; data: any }>('/admin/stats/summary').then(r => r.data),
  dailyTrend: (days = 7) => request<{ success: boolean; data: any[] }>(`/admin/stats/daily-trend?days=${days}`).then(r => r.data),
  knowledgePoints: () => request<{ success: boolean; data: any[] }>('/admin/stats/knowledge-points').then(r => r.data),
  topMistakes: (limit = 20) => request<{ success: boolean; data: any[] }>(`/admin/stats/top-mistakes?limit=${limit}`).then(r => r.data),
  userRanking: (limit = 50) => request<{ success: boolean; data: any[] }>(`/admin/stats/user-ranking?limit=${limit}`).then(r => r.data),
  gradeDistribution: () => request<{ success: boolean; data: any[] }>('/admin/stats/grade-distribution').then(r => r.data),
}

// ============= 导入导出 =============
export const adminImportApi = {
  exportJsonUrl: () => `${API_BASE}/admin/import/export/json`,
  templateUrl: () => `${API_BASE}/admin/import/template`,
  importJson: (content: string) => request<any>('/admin/import/import/json', {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
  history: (limit = 50) => request<{ success: boolean; data: any[] }>(`/admin/import/history?limit=${limit}`).then(r => r.data),
}

// ============= 系统配置 =============
export const adminConfigApi = {
  list: () => request<{ success: boolean; data: any[] }>('/admin/config').then(r => r.data),
  update: (updates: { key: string; value: string }[]) => request<any>('/admin/config', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  }),
}

// ============= 管理员账号 =============
export const adminAccountsApi = {
  login: (username: string, password: string) => request<any>('/admin/accounts/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  list: () => request<{ success: boolean; data: any[] }>('/admin/accounts').then(r => r.data),
  create: (data: { username: string; password: string; nickname?: string; role: string }) =>
    request<any>('/admin/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/admin/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/admin/accounts/${id}`, { method: 'DELETE' }),
  loginLog: (limit = 30) => request<{ success: boolean; data: any[] }>(`/admin/accounts/login-log?limit=${limit}`).then(r => r.data),
}

// ============= 内容（题库）=============
export const adminContentApi = {
  listLevels: (grade?: number) => {
    const q = grade ? `?grade=${grade}` : ''
    return request<{ success: boolean; levels: any[] }>(`/content/admin/levels${q}`).then(r => r.levels)
  },
  getQuestions: (levelId: string) =>
    request<{ success: boolean; questions: any[] }>(`/content/admin/levels/${levelId}/questions`).then(r => r.questions),
  upsertLevel: (data: {
    id?: string; grade: number; chapter: string; sortOrder?: number; isBoss: boolean; unitId?: string
  }) =>
    request<any>('/content/admin/levels', { method: 'POST', body: JSON.stringify(data) }),
  deleteLevel: (id: string) => request<any>(`/content/admin/levels/${id}`, { method: 'DELETE' }),
  upsertQuestion: (data: any) =>
    request<any>('/content/admin/questions', { method: 'POST', body: JSON.stringify(data) }),
  deleteQuestion: (id: string) => request<any>(`/content/admin/questions/${id}`, { method: 'DELETE' }),
  knowledgePoints: (grade?: number) => {
    const q = grade ? `?grade=${grade}` : ''
    return request<{ success: boolean; knowledgePoints: string[] }>(`/content/knowledge-points${q}`).then(r => r.knowledgePoints)
  },
}
