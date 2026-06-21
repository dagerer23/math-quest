/**
 * 前端内容服务：从后端 API 拉取关卡/题目
 * 后端已接入 Redis 缓存，前端不再做内存缓存，只做本地降级兜底
 */
import { LEVELS } from '@/data/questionBank'
import type { Level, Question } from '@/types/models'

const API_BASE = '/api/content'

let _hasServer: boolean | null = null

/** 带重试的 fetch 请求（5xx 和网络错误自动重试） */
async function fetchWithRetry(url: string, options?: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, options)
      if (!res.ok && res.status >= 500 && attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      return res
    } catch (err) {
      if (err instanceof TypeError && attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
}

/** 快速探测后端是否可达 */
async function probeServer(): Promise<boolean> {
  if (_hasServer !== null) return _hasServer
  try {
    const res = await fetchWithRetry(`${API_BASE}/grade/1`)
    if (res.ok) {
      _hasServer = true
      return true
    }
    _hasServer = false
  } catch {
    _hasServer = false
  }
  return false
}

/** 安全解析 JSON 响应 */
async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    if (!res.ok) return null
    const text = await res.text()
    if (!text) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ============= 导出类型 =============
export interface LeaderboardUser {
  rank: number
  userId: string
  nickname: string
  avatar: string
  targetGrade: number
  totalXp: number
  totalSessions: number
  correctRate: number
}

export interface AchievementData {
  id: string
  name: string
  description: string
  icon: string
  sortOrder: number
}

export interface DailyGoalTemplate {
  id: string
  title: string
  description: string
  icon: string
  type: 'xp' | 'questions' | 'streak'
  target: number
  rewardXp: number
  rewardCoins: number
  sortOrder: number
}

// ============= API 响应类型 =============
interface ApiLevelsResponse {
  success: boolean
  levels: Array<{
    id: string; grade: number; chapter: string; sortOrder?: number
    isBoss?: boolean; unitId?: string; knowledgePoints?: string[]
    questionCount?: number
  }>
}

interface ApiLevelDetailResponse {
  success: boolean
  level: Level
}

interface ApiLeaderboardResponse {
  success: boolean
  users: LeaderboardUser[]
}

interface ApiAchievementsResponse {
  success: boolean
  achievements: AchievementData[]
}

interface ApiDailyGoalsResponse {
  success: boolean
  templates: DailyGoalTemplate[]
}

interface ApiConfigsResponse {
  success: boolean
  configs: Record<string, string>
}

interface ApiQuestionsResponse {
  success: boolean
  questions: Question[]
}

interface ApiMasteryResponse {
  success: boolean
  mastery: number
}

/** 拉取指定年级的关卡（含精简信息，不含题目正文） */
export async function getLevelsByGrade(grade: number): Promise<Level[]> {
  const hasServer = await probeServer()
  if (hasServer) {
    try {
      const res = await fetchWithRetry(`${API_BASE}/grade/${grade}`)
      const data = await safeJson<ApiLevelsResponse>(res)
      if (data?.success && Array.isArray(data.levels)) {
        return data.levels.map((l) => ({
          id: l.id,
          grade: l.grade,
          chapter: l.chapter,
          sortOrder: l.sortOrder ?? 0,
          isBoss: l.isBoss || false,
          unitId: l.unitId || `unit-${l.grade}-default`,
          knowledgePoints: l.knowledgePoints || [],
          questions: [],
          questionCount: l.questionCount || 0,
        }))
      }
    } catch { /* fallthrough to local */ }
  }
  return LEVELS.filter(l => l.grade === grade)
}

/** 拉取一个关卡的完整详情（含题目）- Battle 页使用 */
export async function getLevelDetail(levelId: string): Promise<Level | null> {
  const hasServer = await probeServer()
  if (hasServer) {
    try {
      const res = await fetchWithRetry(`${API_BASE}/level/${levelId}`)
      const data = await safeJson<ApiLevelDetailResponse>(res)
      if (data?.success && data.level) {
        return data.level
      }
    } catch { /* fallthrough */ }
  }
  return LEVELS.find(l => l.id === levelId) || null
}

/** 重置服务可达性探测（切换网络后调用） */
export function clearContentCache() {
  _hasServer = null
}

/** 拉取排行榜（C 端） */
export async function getLeaderboard(limit = 50, grade?: number): Promise<LeaderboardUser[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) })
    if (grade !== undefined) params.set('grade', String(grade))
    const res = await fetchWithRetry(`${API_BASE}/leaderboard?${params}`)
    const data = await safeJson<ApiLeaderboardResponse>(res)
    if (data?.success && Array.isArray(data.users)) return data.users
  } catch { /* fallthrough */ }
  return []
}

/** 拉取成就列表 */
export async function getAchievements(): Promise<AchievementData[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/achievements`)
    const data = await safeJson<ApiAchievementsResponse>(res)
    if (data?.success && Array.isArray(data.achievements)) return data.achievements
  } catch { /* fallthrough */ }
  return []
}

/** 拉取每日目标模板列表 */
export async function getDailyGoalTemplates(): Promise<DailyGoalTemplate[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/daily-goals`)
    const data = await safeJson<ApiDailyGoalsResponse>(res)
    if (data?.success && Array.isArray(data.templates)) return data.templates
  } catch { /* fallthrough */ }
  return []
}

/** 拉取系统配置 */
export async function getConfigs(): Promise<Record<string, string>> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/configs`)
    const data = await safeJson<ApiConfigsResponse>(res)
    if (data?.success && data.configs) return data.configs
  } catch { /* fallthrough */ }
  return {}
}

/** 拉取测评题目 */
export async function getAssessmentQuestions(grade: number, count = 10): Promise<Question[]> {
  try {
    const res = await fetchWithRetry(`${API_BASE}/assessment-questions?grade=${grade}&count=${count}`)
    const data = await safeJson<ApiQuestionsResponse>(res)
    if (data?.success && Array.isArray(data.questions)) return data.questions
  } catch { /* fallthrough */ }
  return generateLocalAssessmentQuestions(grade)
}

/** 根据 ID 列表批量拉取题目 */
export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!Array.isArray(ids) || ids.length === 0) return []
  try {
    const res = await fetchWithRetry(`${API_BASE}/questions-by-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    const data = await safeJson<ApiQuestionsResponse>(res)
    if (data?.success && Array.isArray(data.questions)) return data.questions as Question[]
  } catch { /* fallthrough */ }
  const idSet = new Set(ids.filter(id => typeof id === 'string' && id.length > 0))
  if (idSet.size === 0) return []
  const result: Question[] = []
  const seen = new Set<string>()
  for (const lv of LEVELS) {
    if (!lv.questions) continue
    for (const q of lv.questions) {
      if (idSet.has(q.id) && !seen.has(q.id)) {
        seen.add(q.id)
        result.push(q)
      }
    }
  }
  return result
}

/** 基于掌握度 + 上一关连击动态生成题目（三档加权 + 错题插入） */
export async function generateQuestions(
  levelId: string,
  userMastery: Record<string, number>,
  recentQuestionIds?: string[],
  lastCombo?: number,
  userId?: string,
): Promise<Question[]> {
  const hasServer = await probeServer()
  if (hasServer) {
    try {
      const res = await fetchWithRetry(`${API_BASE}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId, userMastery, recentQuestionIds, lastCombo: lastCombo ?? 0, userId }),
      })
      const data = await safeJson<ApiQuestionsResponse>(res)
    if (data?.success && Array.isArray(data.questions)) return data.questions
    } catch { /* fallthrough to local */ }
  }
  // 本地降级：从 LEVELS 中取出该关卡所有题目，打乱后取 8-10 道
  const level = LEVELS.find(l => l.id === levelId)
  if (!level || !level.questions || level.questions.length === 0) return []
  const count = Math.min(level.questions.length, 8 + Math.floor(Math.random() * 3)) // 8-10
  const shuffled = [...level.questions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/** 记录错题（答错时调用） */
export async function recordMistakeApi(
  userId: string,
  questionId: string,
  userAnswer: string,
  correctAnswer: string,
  currentLevelSortOrder: number,
): Promise<void> {
  const hasServer = await probeServer()
  if (!hasServer) return
  try {
    await fetchWithRetry(`${API_BASE}/on-mistake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId, userAnswer, correctAnswer, currentLevelSortOrder }),
    })
  } catch { /* 静默失败 */ }
}

/** 答对错题（累计答对次数，达阈值移出） */
export async function correctMistakeApi(
  userId: string,
  questionId: string,
): Promise<void> {
  const hasServer = await probeServer()
  if (!hasServer) return
  try {
    await fetchWithRetry(`${API_BASE}/on-correct-mistake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId }),
    })
  } catch { /* 静默失败 */ }
}

/** 更新知识点掌握度 */
export async function updateMastery(
  knowledgePoint: string,
  isCorrect: boolean,
  difficultyScore: number,
  currentMastery: number,
  consecutiveCorrect: number,
): Promise<number> {
  const hasServer = await probeServer()
  if (hasServer) {
    try {
      const res = await fetchWithRetry(`${API_BASE}/update-mastery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgePoint, isCorrect, difficultyScore, currentMastery, consecutiveCorrect }),
      })
      const data = await safeJson<ApiMasteryResponse>(res)
      if (data?.success && typeof data.mastery === 'number') return data.mastery
    } catch { /* fallthrough to local */ }
  }
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

// 本地降级：生成测评题目
function generateLocalAssessmentQuestions(grade: number): Question[] {
  const gradeQuestions = LEVELS.filter(l => l.grade === grade).flatMap(l => l.questions)
  const pool = gradeQuestions.length > 0 ? gradeQuestions : LEVELS.flatMap(l => l.questions)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const easy = shuffled.filter(q => q.difficulty === 1).slice(0, 3)
  const medium = shuffled.filter(q => q.difficulty === 2).slice(0, 4)
  const hard = shuffled.filter(q => q.difficulty === 3).slice(0, 3)
  return [...easy, ...medium, ...hard].sort(() => Math.random() - 0.5).slice(0, 10)
}
