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
  difficulty_score?: number
}

export type LearningStage = 'primary' | 'middle' | 'high' | 'adult'
export type LearningGoal = 'consolidation' | 'improvement' | 'interest' | 'training'

export interface UserProfile {
  avatar: string
  nickname: string
  learningStage: LearningStage
  learningGoal: LearningGoal
  targetGrade: number
  phone?: string
}

export interface AssessmentRecord {
  id: string
  completedAt: number
  score: number
  recommendedDifficulty: number
  answers: { questionId: string; userAnswer: string; isCorrect: boolean }[]
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
  grade: number
  sortOrder: number
  isBoss: boolean
  questions: Question[]
  knowledgePoints: string[]
  unitId: string
  questionCount?: number
  target_mastery?: number
  title?: string
  description?: string
}

export interface Unit {
  id: string
  name: string
  grade: number
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

export interface User {
  id: string
  phone: string
  createdAt: number
  lastLoginAt: number
}

export interface VerificationRecord {
  phone: string
  code: string
  expiresAt: number
  attempts: number
}

export interface UserState {
  isLoggedIn: boolean
  profile: UserProfile
  grade: number
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
  achievementsMeta: Achievement[]
  systemConfigs: Record<string, string>
  settings: { sound: boolean; vibration: boolean }
  lastActiveDate: string
  lastCheckInDate?: string
  assessment?: AssessmentRecord
  dailyGoals: DailyGoal[]
  dailyGoalDate?: string
  dailyXp: number
  dailyQuestions: number
  inventory: InventoryItem[]
  treasureBoxes: TreasureBox[]
  learningStats: LearningStat
  hasCompletedOnboarding: boolean
  userId?: string
  lastLoginAt?: number
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
  grade?: number
  sortOrder?: number
  isBoss?: boolean
  chapter?: string
  answers: { questionId: string; userAnswer: string; isCorrect: boolean; timeMs: number }[]
}
