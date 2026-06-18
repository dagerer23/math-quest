export type QuestionType = 'choice' | 'input' | 'drag'

export interface Question {
  id: string
  type: QuestionType
  knowledgePoint: string
  difficulty: 1 | 2 | 3
  prompt: string
  illustration?: string
  options?: string[]
  answer: string | number
  explanation: string
  xp: number
  difficulty_score?: number  // 1-10 精细难度评分，可选，向后兼容
}

export type LearningStage = 'primary' | 'middle' | 'high'

export type LearningGoal = 'consolidation' | 'improvement' | 'interest' | 'training'

export interface UserProfile {
  avatar: string
  nickname: string
  learningStage: LearningStage
  learningGoal: LearningGoal
  targetGrade: number  // 1-9 的年级
  phone?: string  // 手机号
}

export interface AssessmentRecord {
  id: string
  completedAt: number
  score: number
  recommendedDifficulty: number  // 1-3 难度
  answers: {
    questionId: string
    userAnswer: string
    isCorrect: boolean
  }[]
}

export interface DailyGoal {
  id: string
  targetXp: number
  targetQuestions: number
  completed: boolean
  completedAt?: number
  reward?: { xp: number; coins: number }
}

export type ItemType = 'streak_freeze' | 'heart_refill' | 'xp_booster'

export interface InventoryItem {
  id: string
  type: ItemType
  name: string
  description: string
  icon: string
  count: number
}

export interface TreasureBox {
  id: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  rewards: { xp: number; coins: number; items?: InventoryItem[] }
  opened: boolean
  openedAt?: number
}

export interface LearningStat {
  totalQuestions: number
  correctQuestions: number
  totalDays: number
  weeklyStreak: number
  knowledgeProgress: Record<string, number>
}

export interface Level {
  id: string
  chapter: string
  grade: number  // 1-9 的年级
  sortOrder: number
  isBoss: boolean
  questions: Question[]
  knowledgePoints: string[]
  unitId: string
  questionCount?: number  // 后端摘要数据使用，避免每次计算长度
  target_mastery?: number  // 0-1 关卡目标掌握度，默认 0.4
}

export interface Unit {
  id: string
  name: string
  grade: number  // 1-9 的年级
  levels: string[]
  description: string
}

export interface Stage {
  id: string
  name: string
  stage: LearningStage
  units: string[]
}

export type Rank = '青铜' | '白银' | '黄金' | '铂金' | '钻石' | '王者'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

// 用户信息
export interface User {
  id: string
  phone: string
  createdAt: number
  lastLoginAt: number
}

// 验证码记录
export interface VerificationRecord {
  phone: string
  code: string
  expiresAt: number  // 过期时间戳
  attempts: number   // 尝试次数
}

export interface UserState {
  isLoggedIn: boolean
  profile: UserProfile
  grade: number  // 1-9 的年级
  xp: number
  coins: number
  diamonds: number
  hearts: number
  maxHearts: number
  streak: number
  comboMax: number
  rank: Rank
  unlockedLevels: string[]
  completedLevels: Record<string, { stars: 0 | 1 | 2 | 3; bestScore: number }>
  mistakeIds: string[]
  mistakeMastery: Record<string, number>
  achievements: { id: string; unlockedAt: number }[]
  achievementsMeta: Achievement[]  // 从后端拉取的成就元数据
  systemConfigs: Record<string, string>  // 从后端拉取的系统配置
  settings: {
    sound: boolean
    vibration: boolean
  }
  lastActiveDate: string
  lastCheckInDate?: string
  assessment?: AssessmentRecord
  dailyGoals: DailyGoal[]
  dailyGoalDate?: string  // 当前每日目标所属日期，用于跨天重置
  dailyXp: number         // 今日获得的 XP
  dailyQuestions: number  // 今日答题数
  inventory: InventoryItem[]
  treasureBoxes: TreasureBox[]
  learningStats: LearningStat
  hasCompletedOnboarding: boolean
  userId?: string      // 用户唯一ID
  lastLoginAt?: number // 最后登录时间
}

export interface SessionRecord {
  id: string
  levelId: string
  score: number
  stars: 0 | 1 | 2 | 3
  correctCount: number
  totalCount: number
  comboMax: number
  xpGained: number
  coinsGained: number
  timestamp: number
  // 关卡信息（从 level 复制过来，避免 registerSession 查本地 LEVELS）
  grade?: number
  sortOrder?: number
  isBoss?: boolean
  chapter?: string
  answers: {
    questionId: string
    userAnswer: string
    isCorrect: boolean
    timeMs: number
  }[]
}
