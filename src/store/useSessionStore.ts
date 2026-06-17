import { create } from 'zustand'
import type { Level, Question, SessionRecord } from '@/types/models'
import { useUserStore } from '@/store/useUserStore'

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
  start: (level: Level, questions: Question[]) => void
  answer: (userAnswer: string, isCorrect: boolean) => void
  finish: () => SessionRecord | null
  abort: () => void
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
  start: (level, questions) => {
    const now = Date.now()
    set({ level, questions, index: 0, answers: [], combo: 0, comboMax: 0, startTime: now, questionStartTime: now, status: 'playing', record: null })
  },
  answer: (userAnswer, isCorrect) => {
    const s = get()
    const timeMs = Date.now() - s.questionStartTime
    const combo = isCorrect ? s.combo + 1 : 0
    const nextAnswers = [...s.answers, { questionId: s.questions[s.index].id, userAnswer, isCorrect, timeMs }]
    const nextIndex = s.index + 1
    const isLast = nextIndex >= s.questions.length

    if (isLast) {
      const correct = nextAnswers.filter((a) => a.isCorrect).length
      const total = s.questions.length
      const ratio = total > 0 ? correct / total : 0
      const stars: 0 | 1 | 2 | 3 = ratio >= cfgNum('level.star.3_cutoff', 1.0) ? 3 : ratio >= cfgNum('level.star.2_cutoff', 0.7) ? 2 : ratio >= cfgNum('level.star.1_cutoff', 0.4) ? 1 : 0
      const record: SessionRecord = {
        id: `${s.level!.id}-${Date.now()}`,
        levelId: s.level!.id,
        grade: s.level!.grade,
        sortOrder: s.level!.sortOrder ?? 0,
        isBoss: !!s.level!.isBoss,
        chapter: s.level!.chapter || '',
        score: correct * cfgNum('level.score.per_correct', 10),
        stars,
        correctCount: correct,
        totalCount: total,
        comboMax: Math.max(s.comboMax, combo),
        xpGained: nextAnswers.reduce((acc, a, i) => a.isCorrect ? acc + s.questions[i].xp : acc, 0),
        coinsGained: correct * cfgNum('level.coins.per_correct', 5) + (stars === 3 ? cfgNum('level.coins.star3_bonus', 30) : 0),
        timestamp: Date.now(),
        answers: nextAnswers,
      }
      set({ answers: nextAnswers, combo, comboMax: Math.max(s.comboMax, combo), index: nextIndex, questionStartTime: Date.now(), status: 'finished', record })
    } else {
      set({ answers: nextAnswers, combo, comboMax: Math.max(s.comboMax, combo), index: nextIndex, questionStartTime: Date.now(), status: 'playing', record: null })
    }
  },
  finish: () => {
    const s = get()
    if (s.status !== 'playing' || !s.level) return null
    const correct = s.answers.filter((a) => a.isCorrect).length
    const total = s.questions.length
    const ratio = total > 0 ? correct / total : 0
    const stars: 0 | 1 | 2 | 3 = ratio >= cfgNum('level.star.3_cutoff', 1.0) ? 3 : ratio >= cfgNum('level.star.2_cutoff', 0.7) ? 2 : ratio >= cfgNum('level.star.1_cutoff', 0.4) ? 1 : 0
    const record: SessionRecord = {
      id: `${s.level.id}-${Date.now()}`,
      levelId: s.level.id,
      grade: s.level.grade,
      sortOrder: s.level.sortOrder ?? 0,
      isBoss: !!s.level.isBoss,
      chapter: s.level.chapter || '',
      score: correct * cfgNum('level.score.per_correct', 10),
      stars,
      correctCount: correct,
      totalCount: total,
      comboMax: s.comboMax,
      xpGained: s.answers.reduce((acc, a, i) => a.isCorrect ? acc + s.questions[i].xp : acc, 0),
      coinsGained: correct * cfgNum('level.coins.per_correct', 5) + (stars === 3 ? cfgNum('level.coins.star3_bonus', 30) : 0),
      timestamp: Date.now(),
      answers: s.answers,
    }
    set({ status: 'finished', record })
    return record
  },
  abort: () => set({ status: 'idle', level: null, record: null }),
}))
