import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserState, Rank, SessionRecord, Achievement, UserProfile, LearningStage, LearningGoal, AssessmentRecord, DailyGoal, InventoryItem, TreasureBox, LearningStat } from '@/types/models'
import { getRankFromXp } from '@/utils/rank'
import { todayKey, isYesterday } from '@/utils/time'
import { getLevelsByGrade } from '@/services/content'

// 从 systemConfigs 读取配置值（带默认兜底）
function cfg(key: string, fallback: number): number {
  const s = useUserStore.getState?.()
  const v = s?.systemConfigs?.[key]
  if (v === undefined || v === '' || v === null) return fallback
  const n = Number(v)
  return isNaN(n) ? fallback : n
}

interface UserActions {
  addXp: (xp: number) => void
  addCoins: (n: number) => void
  addDiamonds: (n: number) => void
  loseHeart: (n?: number) => void
  refillHearts: () => void
  registerSession: (record: SessionRecord) => { newUnlocks: Achievement[]; leveledUp: boolean }
  addMistake: (questionId: string) => void
  clearMistake: (questionId: string) => void
  incrementMistakeMastery: (questionId: string) => void
  setSettings: (s: Partial<UserState['settings']>) => void
  setNickname: (name: string) => void
  setGrade: (g: UserState['grade']) => void
  setProfile: (profile: Partial<UserProfile>) => void
  setLoggedIn: (loggedIn: boolean) => void
  completeOnboarding: () => void
  setAssessment: (assessment: AssessmentRecord) => void
  addDailyGoal: (goal: DailyGoal) => void
  completeDailyGoal: (goalId: string) => void
  addInventoryItem: (item: InventoryItem) => void
  useInventoryItem: (itemId: string) => boolean
  addTreasureBox: (box: TreasureBox) => void
  openTreasureBox: (boxId: string) => TreasureBox['rewards'] | null
  updateLearningStats: (stats: Partial<LearningStat>) => void
  reset: () => void
  checkIn: () => { success: boolean; message: string }
  // 登录相关方法
  setUserId: (userId: string) => void
  resetUserIdentity: () => void
  loginWithPhone: (phone: string, userId: string) => void
  logout: () => void
  setPhone: (phone: string) => void
  // 成就元数据
  setAchievementsMeta: (list: Achievement[]) => void
  // 系统配置
  setSystemConfigs: (configs: Record<string, string>) => void
}

// 初始 profile 字段均为空字符串，不写死任何年级/昵称，
// 实际值会在登录/Onboarding 时动态写入
const initialProfile: UserProfile = {
  avatar: '',
  nickname: '',
  learningStage: 'primary',
  learningGoal: 'consolidation',
  targetGrade: undefined as unknown as number,
}

const initialLearningStats: LearningStat = {
  totalQuestions: 0,
  correctQuestions: 0,
  totalDays: 1,
  weeklyStreak: 1,
  knowledgeProgress: {},
}

// 初始 unlockedLevels 为空，只有登录 + 选定年级后才解锁对应关卡
const initial: UserState = {
  isLoggedIn: false,
  profile: initialProfile,
  grade: undefined as unknown as number, // 未选年级前保持空，避免干扰地图渲染
  xp: 0,
  coins: 80,
  diamonds: 5,
  hearts: 5,
  maxHearts: 5,
  streak: 1,
  comboMax: 0,
  rank: '青铜',
  unlockedLevels: [] as string[],
  completedLevels: {},
  mistakeIds: [],
  mistakeMastery: {},
  achievements: [],
  achievementsMeta: [],
  systemConfigs: {},
  settings: { sound: true, vibration: true },
  lastActiveDate: todayKey(),
  lastCheckInDate: undefined,
  assessment: undefined,
  dailyGoals: [],
  dailyGoalDate: undefined,
  dailyXp: 0,
  dailyQuestions: 0,
  inventory: [],
  treasureBoxes: [],
  learningStats: initialLearningStats,
  hasCompletedOnboarding: false,
  userId: undefined,
  lastLoginAt: undefined,
}
function applyStreak(state: UserState): UserState {
  const today = todayKey()
  if (state.lastActiveDate === today) return state
  const newStreak = isYesterday(state.lastActiveDate) ? state.streak + 1 : 1
  // 跨天重置每日目标和计数
  return {
    ...state,
    streak: newStreak,
    lastActiveDate: today,
    dailyGoals: [],
    dailyGoalDate: today,
    dailyXp: 0,
    dailyQuestions: 0,
  }
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...initial,
      addXp: (n) => {
        const st = get()
        const before = st.rank
        const xp = Math.max(0, st.xp + n)
        const rank: Rank = getRankFromXp(xp, st.systemConfigs)
        set({ xp, rank, dailyXp: st.dailyXp + n })
        return void (before !== rank)
      },
      addCoins: (n) => set({ coins: Math.max(0, get().coins + n) }),
      addDiamonds: (n) => set({ diamonds: Math.max(0, get().diamonds + n) }),
      loseHeart: (n) => {
        const loss = n ?? cfg('heart.loss_per_wrong', 1)
        set({ hearts: Math.max(0, get().hearts - loss) })
      },
      refillHearts: () => set({ hearts: get().maxHearts }),
      registerSession: (record) => {
        const state = get()
        const completed = state.completedLevels[record.levelId]
        const stars = Math.max(completed?.stars ?? 0, record.stars) as 0 | 1 | 2 | 3
        const bestScore = Math.max(completed?.bestScore ?? 0, record.score)

        const beforeRank = state.rank
        const newXp = state.xp + record.xpGained
        const newRank: Rank = getRankFromXp(newXp, state.systemConfigs)
        const newCombo = Math.max(state.comboMax, record.comboMax)
        const newMistakes = record.answers
          .filter((a) => !a.isCorrect)
          .map((a) => a.questionId)
          .filter((id) => !state.mistakeIds.includes(id))

        const achievementUnlocks: Achievement[] = []
        const hasAchievement = (id: string) => state.achievements.some((a) => a.id === id)
        const findAchievement = (id: string) => state.achievementsMeta.find((a) => a.id === id)

        if (!hasAchievement('first_blood') && Object.keys({ ...state.completedLevels, [record.levelId]: { stars, bestScore } }).length >= 1) {
          const a = findAchievement('first_blood')
          if (a) achievementUnlocks.push(a)
        }
        if (!hasAchievement('combo_5') && newCombo >= 5) {
          const a = findAchievement('combo_5')
          if (a) achievementUnlocks.push(a)
        }
        if (!hasAchievement('combo_10') && newCombo >= 10) {
          const a = findAchievement('combo_10')
          if (a) achievementUnlocks.push(a)
        }
        if (!hasAchievement('no_mistake') && record.correctCount === record.totalCount) {
          const a = findAchievement('no_mistake')
          if (a) achievementUnlocks.push(a)
        }
        if (!hasAchievement('boss_killer') && record.isBoss) {
          const boss = findAchievement('boss_killer')
          if (boss) {
            achievementUnlocks.push(boss)
          }
        }
        if (!hasAchievement('xp_1000') && newXp >= 1000) {
          const a = findAchievement('xp_1000')
          if (a) achievementUnlocks.push(a)
        }
        if (!hasAchievement('coins_500') && state.coins + record.coinsGained >= 500) {
          const a = findAchievement('coins_500')
          if (a) achievementUnlocks.push(a)
        }
        if (!hasAchievement('streak_3') && state.streak >= 3) {
          const a = findAchievement('streak_3')
          if (a) achievementUnlocks.push(a)
        }

        const next: UserState = applyStreak({
          ...state,
          xp: newXp,
          rank: newRank,
          coins: state.coins + record.coinsGained,
          comboMax: newCombo,
          completedLevels: { ...state.completedLevels, [record.levelId]: { stars, bestScore } },
          mistakeIds: [...state.mistakeIds, ...newMistakes],
          achievements: [
            ...state.achievements,
            ...achievementUnlocks.map((a) => ({ id: a.id, unlockedAt: Date.now() })),
          ],
          learningStats: {
            ...state.learningStats,
            totalQuestions: state.learningStats.totalQuestions + record.totalCount,
            correctQuestions: state.learningStats.correctQuestions + record.correctCount,
          },
          dailyQuestions: state.dailyQuestions + record.totalCount,
        })
        set(next)

        // 异步解锁下一关：从后端拉取同年级关卡列表（需至少1星）
        if (record.stars >= 1 && record.grade !== undefined && record.sortOrder !== undefined) {
          getLevelsByGrade(record.grade).then((sameGradeLevels) => {
            const currentSortOrder = record.sortOrder ?? 0
            const nextLevel = sameGradeLevels
              .filter((l) => (l.sortOrder ?? 0) > currentSortOrder)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]
            if (nextLevel) {
              const curr = get()
              if (!curr.unlockedLevels.includes(nextLevel.id)) {
                set({ unlockedLevels: [...curr.unlockedLevels, nextLevel.id] })
              }
            }
          })
        }

        // 基于掌握度的解锁：当当前关卡所有知识点平均掌握度 >= target_mastery 时，也解锁下一关
        if (record.grade !== undefined && record.sortOrder !== undefined) {
          getLevelsByGrade(record.grade).then((sameGradeLevels) => {
            const currentLevel = sameGradeLevels.find(l => l.id === record.levelId)
            if (!currentLevel || !currentLevel.knowledgePoints || currentLevel.knowledgePoints.length === 0) return
            const targetMastery = 0.4
            const currentProgress = get().learningStats.knowledgeProgress
            const avgMastery = currentLevel.knowledgePoints.reduce((sum, kp) => sum + (currentProgress[kp] || 0), 0) / currentLevel.knowledgePoints.length
            if (avgMastery >= targetMastery) {
              const currentSortOrder = record.sortOrder ?? 0
              const nextLevel = sameGradeLevels
                .filter((l) => (l.sortOrder ?? 0) > currentSortOrder)
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]
              if (nextLevel) {
                const curr = get()
                if (!curr.unlockedLevels.includes(nextLevel.id)) {
                  set({ unlockedLevels: [...curr.unlockedLevels, nextLevel.id] })
                }
              }
            }
          })
        }

        return { newUnlocks: achievementUnlocks, leveledUp: beforeRank !== newRank }
      },
      addMistake: (id) => {
        if (get().mistakeIds.includes(id)) return
        set({ mistakeIds: [...get().mistakeIds, id] })
      },
      clearMistake: (id) => set({ mistakeIds: get().mistakeIds.filter((m) => m !== id) }),
      incrementMistakeMastery: (id) => {
        const current = get().mistakeMastery[id] || 0
        const next = current + 1
        if (next >= 3) {
          // 掌握 ≥3 次，自动从错题本移除
          set({
            mistakeMastery: { ...get().mistakeMastery, [id]: next },
            mistakeIds: get().mistakeIds.filter((m) => m !== id),
          })
        } else {
          set({ mistakeMastery: { ...get().mistakeMastery, [id]: next } })
        }
      },
      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      setNickname: (n) => set({ profile: { ...get().profile, nickname: n } }),
      setGrade: (g) => {
        const grade = Number(g)
        if (!Number.isFinite(grade) || grade < 1) return
        const gradeKey = `g${grade}-L1` as const
        const currentUnlocked = get().unlockedLevels
        const nextUnlocked = currentUnlocked.includes(gradeKey) ? currentUnlocked : [...currentUnlocked, gradeKey]
        set({ grade, profile: { ...get().profile, targetGrade: grade }, unlockedLevels: nextUnlocked })
      },
      setProfile: (profile) => set({ profile: { ...get().profile, ...profile } }),
      setLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
      completeOnboarding: () => {
        const g = Number(get().grade || get().profile.targetGrade)
        if (!Number.isFinite(g) || g < 1) {
          set({ hasCompletedOnboarding: true })
          return
        }
        const gradeKey = `g${g}-L1` as const
        const currentUnlocked = get().unlockedLevels
        const nextUnlocked = currentUnlocked.includes(gradeKey) ? currentUnlocked : [...currentUnlocked, gradeKey]
        set({
          hasCompletedOnboarding: true,
          grade: g,
          profile: { ...get().profile, targetGrade: g },
          unlockedLevels: nextUnlocked,
        })
      },
      setAssessment: (assessment) => set({ assessment }),
      addDailyGoal: (goal) => set({ dailyGoals: [...get().dailyGoals, goal] }),
      completeDailyGoal: (goalId) => {
        const goal = get().dailyGoals.find((g) => g.id === goalId)
        if (goal && !goal.completed && goal.reward) {
          set((state) => ({
            dailyGoals: state.dailyGoals.map((g) =>
              g.id === goalId ? { ...g, completed: true, completedAt: Date.now() } : g
            ),
            xp: state.xp + goal.reward!.xp,
            coins: state.coins + goal.reward!.coins,
          }))
        }
      },
      addInventoryItem: (item) => {
        set((state) => {
          const existing = state.inventory.find((i) => i.id === item.id)
          if (existing) {
            return {
              inventory: state.inventory.map((i) =>
                i.id === item.id ? { ...i, count: i.count + item.count } : i
              ),
            }
          }
          return { inventory: [...state.inventory, item] }
        })
      },
      useInventoryItem: (itemId) => {
        const state = get()
        const item = state.inventory.find((i) => i.id === itemId)
        if (!item || item.count <= 0) return false

        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === itemId ? { ...i, count: i.count - 1 } : i
          ).filter((i) => i.count > 0),
        }))
        return true
      },
      addTreasureBox: (box) => set({ treasureBoxes: [...get().treasureBoxes, box] }),
      openTreasureBox: (boxId) => {
        const state = get()
        const box = state.treasureBoxes.find((b) => b.id === boxId)
        if (!box || box.opened) return null

        set((s) => ({
          treasureBoxes: s.treasureBoxes.map((b) =>
            b.id === boxId ? { ...b, opened: true, openedAt: Date.now() } : b
          ),
          xp: s.xp + box.rewards.xp,
          coins: s.coins + box.rewards.coins,
        }))

        if (box.rewards.items) {
          box.rewards.items.forEach((item) => get().addInventoryItem(item))
        }

        return box.rewards
      },
      updateLearningStats: (stats) => set((state) => ({
        learningStats: { ...state.learningStats, ...stats },
      })),
      reset: () => set({ ...initial, lastActiveDate: todayKey() }),
      checkIn: () => {
        const state = get()
        const today = todayKey()

        if (state.lastCheckInDate === today) {
          return { success: false, message: '今日已签到，请明天再来！' }
        }

        // 更新签到日期和连签
        let newStreak = state.streak
        if (isYesterday(state.lastCheckInDate || '')) {
          newStreak = state.streak + 1
        } else if (state.lastCheckInDate !== today) {
          newStreak = 1
        }

        // 从配置中读取签到奖励参数
        const baseXp = Number(state.systemConfigs['checkin.base_xp'] || 10)
        const baseCoins = Number(state.systemConfigs['checkin.base_coins'] || 20)
        const xpPerStreak = Number(state.systemConfigs['checkin.xp_per_streak'] || 5)
        const coinsPerStreak = Number(state.systemConfigs['checkin.coins_per_streak'] || 10)

        // 根据连签天数给奖励
        const rewards = {
          xp: baseXp + newStreak * xpPerStreak,
          coins: baseCoins + newStreak * coinsPerStreak
        }
        
        set({
          lastCheckInDate: today,
          streak: newStreak,
          xp: state.xp + rewards.xp,
          coins: state.coins + rewards.coins
        })
        
        // 同时标记签到目标完成
        const streakGoal = state.dailyGoals.find(g => g.id === 'daily-streak')
        if (!streakGoal) {
          get().addDailyGoal({
            id: 'daily-streak',
            targetXp: 20,
            targetQuestions: 1,
            completed: true,
            completedAt: Date.now(),
            reward: { xp: 20, coins: 15 }
          })
        }
        
        return { 
          success: true, 
          message: `签到成功！获得 ${rewards.xp} XP 和 ${rewards.coins} 金币，连续签到 ${newStreak} 天！` 
        }
      },
      
      // ===== 登录相关方法 =====

      setUserId: (userId: string) => {
        set({ userId })
      },

      loginWithPhone: (phone: string, userId: string) => {
        // 仅做最小登录态更新——onboarding/测评是否重置由调用方控制
        // （登录页/验证码页对于新用户会额外调用 resetUserIdentity）
        set({
          isLoggedIn: true,
          userId,
          lastLoginAt: Date.now(),
          profile: {
            ...get().profile,
            phone,
          },
        })
      },

      // 重置当前用户身份：清空 onboarding 完成标记、测评结果、
      // 用户资料、年级、已解锁关卡——用于新手机号首次登录
      resetUserIdentity: () => {
        set({
          hasCompletedOnboarding: false,
          assessment: undefined,
          profile: {
            avatar: '',
            nickname: '',
            learningStage: 'primary',
            learningGoal: 'consolidation',
            targetGrade: undefined as unknown as number,
            phone: get().profile.phone,
          },
          grade: undefined as unknown as number,
          unlockedLevels: [],
          completedLevels: {},
        })
      },

      logout: () => {
        // 彻底清除登录态与测评进度，确保下次进入需要重新登录
        const currentProfile = get().profile
        set({
          isLoggedIn: false,
          userId: undefined,
          lastLoginAt: undefined,
          // 清除 onboarding 与测评信息，让登录流程重新走一遍
          hasCompletedOnboarding: false,
          assessment: undefined,
          // 保留头像、昵称等偏好，便于下次登录快速恢复
          profile: {
            ...currentProfile,
            // 不清昵称/头像/年级，但保持 phone 以便下次登录提示
          },
          // 不清空金币/经验等游戏数据，作为本地存档保留
        })
      },
      
      setPhone: (phone: string) => {
        set({
          profile: {
            ...get().profile,
            phone,
          },
        })
      },

      setAchievementsMeta: (list) => set({ achievementsMeta: list }),

      setSystemConfigs: (configs) => {
        const state = get()
        const initCoins = Number(configs['init.coins']) || state.coins
        const initDiamonds = Number(configs['init.diamonds']) || state.diamonds
        const initHearts = Number(configs['init.hearts']) || state.hearts
        const maxHearts = Number(configs['heart.max']) || state.maxHearts
        const isFirstLoad = Object.keys(state.systemConfigs).length === 0
        set({
          systemConfigs: configs,
          ...(isFirstLoad ? { coins: initCoins, diamonds: initDiamonds, hearts: initHearts, maxHearts } : { maxHearts }),
        })
      },
    }),
    { name: 'mathquest.user.v1' },
  ),
)
