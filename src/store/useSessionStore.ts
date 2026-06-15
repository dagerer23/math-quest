import { create } from 'zustand'
import type { Level, Question, SessionRecord } from '@/types/models'
import { useUserStore } from '@/store/useUserStore'
import { updateMastery } from '@/services/content'

// 读取 systemConfigs 的辅助函数
function cfgNum(key: string, fallback: number): number {
  const store = useUserStore.getState()
  const v = store.systemConfigs?.[key]
  if (v === undefined || v === '' || v === null) return fallback
  const n = Number(v)
  return isNaN(n) ? fallback : n
}

interface SessionState {
  level: Level | null
  questions: Question[]
  index: number
  answers: { questionId: string; userAnswer: string; isCorrect: boolean; timeMs: number }[]
  combo: number
  comboMax: number
  startTime: number
  questionStartTime: number
  status: 'idle' | 'playing' | 'finished'
  record: SessionRecord | null
  // 最后一题完成时的回调
  onLastQuestionComplete: ((record: SessionRecord) => void) | null
  start: (level: Level, questions: Question[]) => void
  answer: (userAnswer: string, isCorrect: boolean) => void
  finish: () => SessionRecord | null
  abort: () => void
  setOnLastQuestionComplete: (callback: (record: SessionRecord) => void) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  level: null,
  questions: [],
  index: 0,
  answers: [],
  combo: 0,
  comboMax: 0,
  startTime: 0,
  questionStartTime: 0,
  status: 'idle',
  record: null,
  onLastQuestionComplete: null,
  start: (level, questions) => {
    const now = Date.now()
    set({
      level,
      questions,
      index: 0,
      answers: [],
      combo: 0,
      comboMax: 0,
      startTime: now,
      questionStartTime: now,
      status: 'playing',
      record: null,
    })
  },
  answer: (userAnswer, isCorrect) => {
    const s = get()
    const timeMs = Date.now() - s.questionStartTime
    const combo = isCorrect ? s.combo + 1 : 0
    const nextAnswers = [...s.answers, { questionId: s.questions[s.index].id, userAnswer, isCorrect, timeMs }]
    const nextIndex = s.index + 1
    const isLast = nextIndex >= s.questions.length

    if (isLast) {
      // 计算最终记录
      const correct = nextAnswers.filter((a) => a.isCorrect).length
      const total = s.questions.length
      const star3Cutoff = cfgNum('level.star.3_cutoff', 1.0) // 100%
      const star2Cutoff = cfgNum('level.star.2_cutoff', 0.7) // 70%
      const star1Cutoff = cfgNum('level.star.1_cutoff', 0.4) // 40%
      const ratio = total > 0 ? correct / total : 0
      const stars = ratio >= star3Cutoff ? 3 : ratio >= star2Cutoff ? 2 : ratio >= star1Cutoff ? 1 : 0
      const perCorrectScore = cfgNum('level.score.per_correct', 10)
      const perCorrectCoins = cfgNum('level.coins.per_correct', 5)
      const star3Bonus = cfgNum('level.coins.star3_bonus', 30)
      const record: SessionRecord = {
        id: `${s.level!.id}-${Date.now()}`,
        levelId: s.level!.id,
        grade: s.level!.grade,
        sortOrder: s.level!.sortOrder ?? 0,
        isBoss: !!s.level!.isBoss,
        chapter: s.level!.chapter || '',
        score: correct * perCorrectScore,
        stars: stars as 0 | 1 | 2 | 3,
        correctCount: correct,
        totalCount: total,
        comboMax: Math.max(s.comboMax, combo),
        xpGained: nextAnswers.reduce((acc, a, i) => a.isCorrect ? acc + s.questions[i].xp : acc, 0),
        coinsGained: correct * perCorrectCoins + (stars === 3 ? star3Bonus : 0),
        timestamp: Date.now(),
        answers: nextAnswers,
      }

      // 同时设置 status 和 record
      set({
        answers: nextAnswers,
        combo,
        comboMax: Math.max(s.comboMax, combo),
        index: nextIndex,
        questionStartTime: Date.now(),
        status: 'finished',
        record,
      })

      // 异步更新掌握度
      const question = s.questions[s.index]
      const userStore = useUserStore.getState()
      const currentMastery = userStore.learningStats.knowledgeProgress[question.knowledgePoint] || 0
      const difficultyScore = (question as any).difficulty_score || (question.difficulty === 1 ? 2 : question.difficulty === 2 ? 5 : 8)
      const recentAnswers = nextAnswers.slice(-10)
      const consecutiveCorrect = recentAnswers.filter(a => {
        const q = s.questions.find(qq => qq.id === a.questionId)
        return q?.knowledgePoint === question.knowledgePoint && a.isCorrect
      }).length

      updateMastery(question.knowledgePoint, isCorrect, difficultyScore, currentMastery, consecutiveCorrect).then(newMastery => {
        const currentProgress = useUserStore.getState().learningStats.knowledgeProgress
        useUserStore.getState().updateLearningStats({
          knowledgeProgress: { ...currentProgress, [question.knowledgePoint]: newMastery }
        })
      })

      // 触发回调
      const callback = get().onLastQuestionComplete
      if (callback) {
        // 延迟一点触发，确保状态已更新
        setTimeout(() => callback(record), 50)
      }
    } else {
      set({
        answers: nextAnswers,
        combo,
        comboMax: Math.max(s.comboMax, combo),
        index: nextIndex,
        questionStartTime: Date.now(),
        status: 'playing',
        record: null,
      })

      // 异步更新掌握度
      const question = s.questions[s.index]
      const userStore = useUserStore.getState()
      const currentMastery = userStore.learningStats.knowledgeProgress[question.knowledgePoint] || 0
      const difficultyScore = (question as any).difficulty_score || (question.difficulty === 1 ? 2 : question.difficulty === 2 ? 5 : 8)
      const recentAnswers = nextAnswers.slice(-10)
      const consecutiveCorrect = recentAnswers.filter(a => {
        const q = s.questions.find(qq => qq.id === a.questionId)
        return q?.knowledgePoint === question.knowledgePoint && a.isCorrect
      }).length

      updateMastery(question.knowledgePoint, isCorrect, difficultyScore, currentMastery, consecutiveCorrect).then(newMastery => {
        const currentProgress = useUserStore.getState().learningStats.knowledgeProgress
        useUserStore.getState().updateLearningStats({
          knowledgeProgress: { ...currentProgress, [question.knowledgePoint]: newMastery }
        })
      })
    }
  },
  finish: () => {
    const s = get()
    if (s.status !== 'playing' || !s.level) return null
    const correct = s.answers.filter((a) => a.isCorrect).length
    const total = s.questions.length
    const star3Cutoff = cfgNum('level.star.3_cutoff', 1.0)
    const star2Cutoff = cfgNum('level.star.2_cutoff', 0.7)
    const star1Cutoff = cfgNum('level.star.1_cutoff', 0.4)
    const ratio = total > 0 ? correct / total : 0
    const stars = ratio >= star3Cutoff ? 3 : ratio >= star2Cutoff ? 2 : ratio >= star1Cutoff ? 1 : 0
    const perCorrectScore = cfgNum('level.score.per_correct', 10)
    const perCorrectCoins = cfgNum('level.coins.per_correct', 5)
    const star3Bonus = cfgNum('level.coins.star3_bonus', 30)
    const xpGained = s.answers.reduce((acc, a, i) => a.isCorrect ? acc + s.questions[i].xp : acc, 0)
    const coinsGained = correct * perCorrectCoins + (stars === 3 ? star3Bonus : 0)
    const record: SessionRecord = {
      id: `${s.level.id}-${Date.now()}`,
      levelId: s.level.id,
      grade: s.level.grade,
      sortOrder: s.level.sortOrder ?? 0,
      isBoss: !!s.level.isBoss,
      chapter: s.level.chapter || '',
      score: correct * perCorrectScore,
      stars: stars as 0 | 1 | 2 | 3,
      correctCount: correct,
      totalCount: total,
      comboMax: s.comboMax,
      xpGained,
      coinsGained,
      timestamp: Date.now(),
      answers: s.answers,
    }
    set({ status: 'finished', record })
    return record
  },
  abort: () => set({ status: 'idle', level: null, record: null }),
  setOnLastQuestionComplete: (callback) => set({ onLastQuestionComplete: callback }),
}))
