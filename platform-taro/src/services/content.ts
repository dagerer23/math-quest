import { get, post } from '@/utils/request'
import { LEVELS } from '@/data/questionBank'
import type { Level, Question } from '@/types/models'

const API_BASE = '/api/content'

export interface LeaderboardUser {
  rank: number; userId: string; nickname: string; avatar: string
  targetGrade: number; totalXp: number; totalSessions: number; correctRate: number
}

export interface AchievementData {
  id: string; name: string; description: string; icon: string; sortOrder: number
}

export interface DailyGoalTemplate {
  id: string; title: string; description: string; icon: string
  type: 'xp' | 'questions' | 'streak'; target: number
  rewardXp: number; rewardCoins: number; sortOrder: number
}

export async function getLevelsByGrade(grade: number): Promise<Level[]> {
  try {
    const data = await get<{ success: boolean; levels: any[] }>(`${API_BASE}/grade/${grade}`)
    if (data?.success && Array.isArray(data.levels)) {
      return data.levels.map(l => ({
        id: l.id, grade: l.grade, chapter: l.chapter,
        sortOrder: l.sortOrder ?? 0, isBoss: l.isBoss || false,
        unitId: l.unitId || `unit-${l.grade}-default`,
        knowledgePoints: l.knowledgePoints || [],
        questions: [], questionCount: l.questionCount || 0,
      }))
    }
  } catch { /* fallthrough */ }
  // Local fallback
  const gradeData = (LEVELS as any)[`g${grade}`]
  return gradeData?.levels || []
}

export async function getLevelDetail(levelId: string): Promise<Level | null> {
  try {
    const data = await get<{ success: boolean; level: Level }>(`${API_BASE}/level/${levelId}`)
    if (data?.success && data.level) return data.level
  } catch { /* fallthrough */ }
  // Local fallback
  for (const gKey of Object.keys(LEVELS)) {
    const g = (LEVELS as any)[gKey]
    if (g?.levels) {
      const found = g.levels.find((l: any) => l.id === levelId)
      if (found) return found
    }
  }
  return null
}

export async function getLeaderboard(limit = 50, grade?: number): Promise<LeaderboardUser[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) })
    if (grade !== undefined) params.set('grade', String(grade))
    const data = await get<{ success: boolean; users: LeaderboardUser[] }>(`${API_BASE}/leaderboard?${params}`)
    if (data?.success && Array.isArray(data.users)) return data.users
  } catch { /* fallthrough */ }
  return []
}

export async function getAchievements(): Promise<AchievementData[]> {
  try {
    const data = await get<{ success: boolean; achievements: AchievementData[] }>(`${API_BASE}/achievements`)
    if (data?.success && Array.isArray(data.achievements)) return data.achievements
  } catch { /* fallthrough */ }
  return []
}

export async function getDailyGoalTemplates(): Promise<DailyGoalTemplate[]> {
  try {
    const data = await get<{ success: boolean; templates: DailyGoalTemplate[] }>(`${API_BASE}/daily-goals`)
    if (data?.success && Array.isArray(data.templates)) return data.templates
  } catch { /* fallthrough */ }
  return []
}

export async function getConfigs(): Promise<Record<string, string>> {
  try {
    const data = await get<{ success: boolean; configs: Record<string, string> }>(`${API_BASE}/configs`)
    if (data?.success && data.configs) return data.configs
  } catch { /* fallthrough */ }
  return {}
}

export async function generateQuestions(levelId: string, userMastery: Record<string, number>, recentQuestionIds?: string[]): Promise<Question[]> {
  try {
    const data = await post<{ success: boolean; questions: Question[] }>(`${API_BASE}/generate-questions`, { levelId, userMastery, recentQuestionIds })
    if (data?.success && Array.isArray(data.questions)) return data.questions
  } catch { /* fallthrough */ }
  // Local fallback
  for (const gKey of Object.keys(LEVELS)) {
    const g = (LEVELS as any)[gKey]
    if (g?.questions?.[levelId]) return g.questions[levelId]
  }
  return []
}
