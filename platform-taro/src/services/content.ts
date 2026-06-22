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
  // Local fallback：LEVELS 为扁平数组，按年级过滤
  return LEVELS.filter(l => l.grade === grade).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export async function getLevelDetail(levelId: string): Promise<Level | null> {
  try {
    const data = await get<{ success: boolean; level: Level }>(`${API_BASE}/level/${levelId}`)
    if (data?.success && data.level) return data.level
  } catch { /* fallthrough */ }
  // Local fallback
  return LEVELS.find(l => l.id === levelId) || null
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

// 每日目标本地兜底模板（游客模式或网络失败时使用）
const LOCAL_DAILY_GOAL_TEMPLATES: DailyGoalTemplate[] = [
  { id: 'daily-xp', title: '获得50经验值', description: '今天内通过答题获得50点经验值', icon: 'lightning', type: 'xp', target: 50, rewardXp: 30, rewardCoins: 20, sortOrder: 1 },
  { id: 'daily-questions', title: '完成10道题目', description: '今天内完成10道数学题', icon: 'goal', type: 'questions', target: 10, rewardXp: 40, rewardCoins: 30, sortOrder: 2 },
  { id: 'daily-streak', title: '保持签到', description: '今日已经完成签到', icon: 'fire', type: 'streak', target: 1, rewardXp: 20, rewardCoins: 10, sortOrder: 3 },
]

export async function getDailyGoalTemplates(): Promise<DailyGoalTemplate[]> {
  try {
    const data = await get<{ success: boolean; templates: DailyGoalTemplate[] }>(`${API_BASE}/daily-goals`)
    if (data?.success && Array.isArray(data.templates) && data.templates.length > 0) return data.templates
  } catch { /* fallthrough */ }
  return LOCAL_DAILY_GOAL_TEMPLATES
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
  const level = LEVELS.find(l => l.id === levelId)
  return level?.questions || []
}

/**
 * 获取水平测评题目
 * 调用后端 /api/content/assessment-questions，失败时本地降级抽题
 */
export async function getAssessmentQuestions(grade: number, count = 10): Promise<Question[]> {
  try {
    const data = await get<{ success: boolean; questions: Question[] }>(`${API_BASE}/assessment-questions?grade=${grade}&count=${count}`)
    if (data?.success && Array.isArray(data.questions)) return data.questions
  } catch { /* fallthrough */ }
  // Local fallback：从 LEVELS 中按年级随机抽题
  const gradeLevels = LEVELS.filter(l => l.grade === grade)
  const allQs = gradeLevels.flatMap(l => l.questions || [])
  const shuffled = [...allQs].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 更新知识点掌握度
 * 调用后端 /api/content/update-mastery，失败时本地降级计算
 */
export async function updateMastery(
  knowledgePoint: string,
  isCorrect: boolean,
  difficultyScore: number,
  currentMastery: number,
  consecutiveCorrect: number,
): Promise<number> {
  try {
    const data = await post<{ success: boolean; mastery: number }>(`${API_BASE}/update-mastery`, {
      knowledgePoint, isCorrect, difficultyScore, currentMastery, consecutiveCorrect,
    })
    if (data?.success && typeof data.mastery === 'number') return data.mastery
  } catch { /* fallthrough to local */ }
  // 本地降级计算
  let delta = 0
  if (isCorrect) {
    if (difficultyScore <= 3) delta = 0.05
    else if (difficultyScore <= 6) delta = 0.08
    else delta = 0.12
    if (consecutiveCorrect >= 3) delta += 0.05
  } else {
    delta = -0.10
  }
  return Math.max(0, Math.min(1, currentMastery + delta))
}
