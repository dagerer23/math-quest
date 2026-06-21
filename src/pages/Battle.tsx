import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { useSessionStore } from '@/store/useSessionStore'
import { useUserStore } from '@/store/useUserStore'
import Keypad from '@/components/Keypad'
import ParticleBurst from '@/components/ParticleBurst'
import ComboNumber from '@/components/ComboNumber'
import PixelButton from '@/components/PixelButton'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Icon } from '@/components/Icon'
import { Check, X, Star } from 'lucide-react'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibrate'
import { recordMistakeApi, correctMistakeApi } from '@/services/content'

// ═══════════════════════════════════════════════════════════════════
// 答题中的鼓励文案
// ═══════════════════════════════════════════════════════════════════
const ENCOURAGEMENTS = {
  correct: ['太棒了！', '你真厉害！', '完美！', '继续保持！', '厉害厉害！', '优秀！'],
  combo: ['连击！', '太牛了！', '停不下来！', '无敌！', '连胜！'],
  wrong: ['没关系，下次一定行！', '别灰心，再来一次！', '错题本已收录，下次复仇！', '下一题就是加分题！', '失误而已，稳住！'],
}

// ═══════════════════════════════════════════════════════════════════
// 主题配色（根据年级动态切换）
// ═══════════════════════════════════════════════════════════════════
const GRADE_THEMES: Record<number, { bg: string; accent: string; accentSoft: string; cardBg: string }> = {
  1: { bg: 'from-[#F0F7F5] via-[#E8F4EE] to-[#F5FBF8]', accent: '#4A9E8A', accentSoft: '#D8ECE5', cardBg: '#FFFFFF' },
  2: { bg: 'from-[#FBF4F0] via-[#F8E8E0] to-[#FFF8F5]', accent: '#E0896E', accentSoft: '#F8E2D9', cardBg: '#FFFFFF' },
  3: { bg: 'from-[#F3F0F7] via-[#ECE5F5] to-[#F8F5FB]', accent: '#8B7AB8', accentSoft: '#E3DDEF', cardBg: '#FFFFFF' },
}

function getBattleThemeByGrade(grade: number) {
  return GRADE_THEMES[grade] || GRADE_THEMES[1]
}

export default function Battle() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const sessionStatus = useSessionStore((s) => s.status)
  const sessionIndex = useSessionStore((s) => s.index)
  const sessionQuestions = useSessionStore((s) => s.questions)
  const sessionCombo = useSessionStore((s) => s.combo)
  const setOnLastQuestionComplete = useSessionStore((s) => s.setOnLastQuestionComplete)
  const finish = useSessionStore((s) => s.finish)
  const user = useUserStore()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showParticle, setShowParticle] = useState(0)
  const [encouragement, setEncouragement] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [heartsJustLost, setHeartsJustLost] = useState(0)
  const [heartShake, setHeartShake] = useState(false)
  const [noHearts, setNoHearts] = useState(false)
  const heartsDepletedRef = useRef(false)
  const submitLock = useRef(false)

  const level = useSessionStore((s) => s.level)
  const currentQ = sessionQuestions[sessionIndex]
  const theme = getBattleThemeByGrade(level?.grade || 1)
  const isDecimal = currentQ ? String(currentQ.answer).includes('.') : false
  const allowSign = currentQ ? String(currentQ.answer).startsWith('-') : false

  // 从配置读取连击阈值
  const comboShowThreshold = Number(user.systemConfigs['combo.show_threshold']) || 3
  const comboSoundThreshold = Number(user.systemConfigs['combo.sound_threshold']) || 5

  const getEncouragement = (isCombo: boolean) => {
    const texts = isCombo ? ENCOURAGEMENTS.combo : ENCOURAGEMENTS.correct
    return texts[Math.floor(Math.random() * texts.length)]
  }

  // 注册最后一题完成的回调
  useEffect(() => {
    const handleLastQuestionComplete = (record: any) => {
      // 心数已耗尽时，由 hearts-depleted 处理器负责导航，此处跳过
      if (heartsDepletedRef.current) return
      const res = user.registerSession(record)
      if (res.newUnlocks.length > 0) {
        setTimeout(() => {
          res.newUnlocks.forEach(() => playSound('unlock', user.settings.sound))
        }, 500)
      }
      navigate(`/result/${record.id}`, { replace: true })
    }
    setOnLastQuestionComplete(handleLastQuestionComplete)
    return () => setOnLastQuestionComplete(() => {})
  }, [setOnLastQuestionComplete, user, navigate])

  // 心数为 0 时提前结束
  useEffect(() => {
    if (user.hearts <= 0 && sessionStatus === 'playing' && !heartsDepletedRef.current) {
      heartsDepletedRef.current = true
      setNoHearts(true)
      setTimeout(() => {
        const finalRecord = finish()
        if (finalRecord) {
          user.registerSession(finalRecord)
          navigate(`/result/${finalRecord.id}`, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      }, 1500)
    }
  }, [user.hearts, sessionStatus, finish, user, navigate])

  // 每题重置状态
  useEffect(() => {
    if (sessionStatus !== 'playing' || !currentQ) return
    setSelectedOption(null)
    setInputValue('')
    setFeedback(null)
    setEncouragement('')
    submitLock.current = false
  }, [sessionIndex, sessionStatus, currentQ])

  // 物理键盘支持（仅 input 类型题目）
  useEffect(() => {
    if (currentQ?.type !== 'input' || feedback) return

    let backspaceTimer: NodeJS.Timeout | null = null
    let backspaceInterval: NodeJS.Timeout | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框聚焦时的按键（本页虽无输入框，但防御性处理）
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      if (e.key >= '0' && e.key <= '9') {
        setInputValue((prev) => prev + e.key)
        return
      }

      if (e.key === '.' && isDecimal) {
        setInputValue((prev) => (prev.includes('.') ? prev : prev + '.'))
        return
      }

      if (e.key === '-' && allowSign) {
        setInputValue((prev) => (prev.length > 0 ? prev : prev + '-'))
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        setInputValue((prev) => prev.slice(0, -1))
        // 长按 Backspace 清空
        if (!backspaceTimer) {
          backspaceTimer = setTimeout(() => {
            backspaceInterval = setInterval(() => {
              setInputValue((prev) => {
                if (prev.length === 0) {
                  if (backspaceInterval) clearInterval(backspaceInterval)
                  backspaceInterval = null
                  return prev
                }
                return prev.slice(0, -1)
              })
            }, 80)
          }, 500)
        }
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (inputValue && !submitLock.current) {
          handleSubmit()
        }
        return
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        if (backspaceTimer) {
          clearTimeout(backspaceTimer)
          backspaceTimer = null
        }
        if (backspaceInterval) {
          clearInterval(backspaceInterval)
          backspaceInterval = null
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (backspaceTimer) clearTimeout(backspaceTimer)
      if (backspaceInterval) clearInterval(backspaceInterval)
    }
  }, [currentQ?.type, feedback, isDecimal, allowSign, inputValue])

  // ═══════════════════════════════════════════════════════════════════
  // 状态检查
  // ═══════════════════════════════════════════════════════════════════
  if (!level) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted to-background">
        <Icon name="search" size={64} className="text-gray-400 mb-4" />
        <p className="text-muted-foreground font-medium">关卡不存在</p>
        <PixelButton className="mt-6" onClick={() => navigate('/')}>返回首页</PixelButton>
      </div>
    )
  }

  if (!user.unlockedLevels.includes(level.id)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          <Icon name="lock" size={24} />
        </motion.div>
        <p className="text-foreground font-bold mb-2">该关卡尚未解锁</p>
        <p className="text-muted-foreground text-sm mb-6">请先完成前面的关卡</p>
        <PixelButton onClick={() => navigate('/')}>返回首页</PixelButton>
      </div>
    )
  }

  if (sessionStatus === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
        <motion.p
          className="text-muted-foreground text-sm mt-5 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >正在结算...</motion.p>
      </div>
    )
  }

  if (sessionStatus !== 'playing' || !currentQ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Icon name="gamepad" size={40} />
        <p className="font-medium">未找到答题会话</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-6 py-2.5 rounded-2xl text-sm font-bold text-primary-foreground bg-primary shadow-md active:translate-y-[1px] transition-all"
        >
          返回首页
        </button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // 答题逻辑
  // ═══════════════════════════════════════════════════════════════════
  const isCorrect = (val: string) => {
    const norm = (s: string) => String(s).replace(/\s+/g, '').toLowerCase()
    return norm(val) === norm(String(currentQ.answer))
  }

  const handleSubmit = (override?: string) => {
    if (submitLock.current) return
    submitLock.current = true
    let userAnswer: string
    if (currentQ.type === 'choice') {
      userAnswer = override ?? selectedOption ?? ''
    } else {
      userAnswer = override ?? inputValue
    }
    const correct = isCorrect(userAnswer)
    setFeedback(correct ? 'correct' : 'wrong')

    if (correct) {
      const isCombo = sessionCombo + 1 >= comboShowThreshold
      setEncouragement(getEncouragement(isCombo))
      playSound(sessionCombo + 1 >= comboSoundThreshold ? 'combo' : 'correct', user.settings.sound)
      vibrate(40, user.settings.vibration)
      setShowParticle((n) => n + 1)
      if (levelId === 'mistakes-revenge' && currentQ?.id) {
        user.incrementMistakeMastery(currentQ.id)
      }
      // 答对错题：通知后端累计答对次数（非错题复仇模式）
      if (levelId !== 'mistakes-revenge' && currentQ?.id && user.userId) {
        const sortOrder = useSessionStore.getState().level?.sortOrder ?? 0
        correctMistakeApi(user.userId, currentQ.id).catch(() => {})
      }
    } else {
      setEncouragement(ENCOURAGEMENTS.wrong[Math.floor(Math.random() * ENCOURAGEMENTS.wrong.length)])
      playSound('wrong', user.settings.sound)
      vibrate([0, 60, 40, 60], user.settings.vibration)
      user.loseHeart()
      setHeartsJustLost(1)
      setHeartShake(true)
      setTimeout(() => {
        setHeartShake(false)
        setHeartsJustLost(0)
      }, 600)
      if (currentQ?.id) user.addMistake(currentQ.id)
      // 记录错题到后端（非错题复仇模式）
      if (levelId !== 'mistakes-revenge' && currentQ?.id && user.userId) {
        const sortOrder = useSessionStore.getState().level?.sortOrder ?? 0
        recordMistakeApi(user.userId, currentQ.id, userAnswer, String(currentQ.answer), sortOrder).catch(() => {})
      }
    }

    setTimeout(() => {
      useSessionStore.getState().answer(userAnswer, correct)
    }, 1200)
  }

  const total = sessionQuestions.length
  const progressPercent = ((sessionIndex + 1) / total) * 100

  // ═══════════════════════════════════════════════════════════════════
  // 渲染
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className={`relative min-h-screen flex flex-col bg-gradient-to-b ${theme.bg}`}>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 顶部状态栏：退出 + 进度 + 心数 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-4">
          {/* 退出按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExitConfirm(true)}
            aria-label="退出答题"
            className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ border: `1px solid ${theme.accentSoft}` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>

          {/* 进度条 */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: theme.accentSoft }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: theme.accent }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: theme.accent }}>
              {sessionIndex + 1}/{total}
            </span>
          </div>

          {/* 心数 */}
          <motion.div
            animate={heartShake ? { x: [-6, 6, -4, 4, 0], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.span
                key={i}
                animate={heartShake && i === user.hearts ? { scale: [1, 1.4, 1], opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={i < user.hearts ? '#FF4B4B' : '#E0E0E0'}
                  className={i < user.hearts ? 'drop-shadow-sm' : ''}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* 连击显示 */}
        <AnimatePresence>
          {sessionCombo >= comboShowThreshold && (
            <motion.div
              initial={{ y: -10, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="flex items-center justify-center mt-3"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(255,75,75,0.1)', color: '#FF4B4B' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span className="font-bold text-sm">{sessionCombo} 连击！</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 题目卡片（核心焦点） */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 px-5 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* 知识点标签 */}
        <div className="flex items-center justify-between mb-4">
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: theme.accentSoft, color: theme.accent }}
          >
            {currentQ.knowledgePoint}
          </motion.span>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-0.5">
            难度 {Array.from({ length: currentQ.difficulty }).map((_, i) => (
              <Star key={i} size={12} className="fill-current" />
            ))}
          </span>
        </div>

        {/* 题目内容 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className={clsx(
              'relative rounded-2xl p-6 min-h-[180px] flex flex-col items-center justify-center text-center shadow-lg',
              feedback === 'wrong' && 'animate-shake',
            )}
            style={{
              background: theme.cardBg,
              border: `2px solid ${feedback === 'correct' ? '#58CC02' : feedback === 'wrong' ? '#FF4B4B' : theme.accentSoft}`,
              boxShadow: feedback === 'correct'
                ? '0 8px 32px rgba(88,204,2,0.2)'
                : feedback === 'wrong'
                  ? '0 8px 32px rgba(255,75,75,0.2)'
                  : '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            {/* 题目图标 */}
            {currentQ.illustration && (
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                <Icon name={currentQ.illustration} size={64} />
              </motion.div>
            )}

            {/* 题目文字 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl font-bold leading-relaxed"
              style={{ color: '#1d1d1f' }}
            >
              {currentQ.prompt}
            </motion.div>

            {/* 粒子效果 + 连击数字 */}
            <ParticleBurst trigger={showParticle} color={theme.accent} />
            <ComboNumber value={sessionCombo} show={feedback === 'correct'} />
          </motion.div>
        </AnimatePresence>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 反馈提示 */}
        {/* ════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ y: 15, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              className="mt-4 px-5 py-4 rounded-2xl text-center"
              style={{
                background: feedback === 'correct'
                  ? 'linear-gradient(135deg, rgba(88,204,2,0.12) 0%, rgba(88,204,2,0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(255,75,75,0.12) 0%, rgba(255,75,75,0.06) 100%)',
                border: `1px solid ${feedback === 'correct' ? 'rgba(88,204,2,0.3)' : 'rgba(255,75,75,0.3)'}`,
                color: feedback === 'correct' ? '#46A302' : '#E63A3A',
              }}
            >
              {feedback === 'correct' ? (
                <div>
                  <div className="font-bold text-base flex items-center justify-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFC800">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {encouragement} +{currentQ.xp} XP
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-sm mb-1">正确答案</div>
                  <div className="text-xl font-bold">{String(currentQ.answer)}</div>
                  {currentQ.explanation && (
                    <div className="text-xs mt-2 opacity-70">{currentQ.explanation}</div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* 答案输入区 */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="mt-4 shrink-0 pb-[max(16px,env(safe-area-inset-bottom))]">
          {currentQ.type === 'choice' && currentQ.options && (
            <div className="grid grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isPicked = selectedOption === opt
                const isAns = String(currentQ.answer) === opt
                const showCorrect = feedback === 'correct' && isPicked
                const showCorrectHighlight = feedback === 'wrong' && isAns
                const showWrong = feedback === 'wrong' && isPicked && !isAns
                return (
                  <motion.button
                    key={opt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      ...(showWrong ? { x: [0, -8, 8, -8, 8, -4, 4, 0] } : {}),
                    }}
                    transition={{ delay: idx * 0.05, ...(showWrong ? { duration: 0.5 } : {}) }}
                    whileHover={!feedback ? { scale: 1.03, y: -2 } : {}}
                    whileTap={!feedback ? { scale: 0.97 } : {}}
                    onClick={() => !feedback && setSelectedOption(opt)}
                    disabled={!!feedback}
                    aria-label={`选项 ${opt}`}
                    className={clsx(
                      'h-14 rounded-xl text-lg font-bold transition-all duration-200',
                      'flex items-center justify-center relative',
                      showCorrect && 'animate-correct-pulse',
                      showCorrectHighlight && 'animate-correct-highlight-pulse',
                    )}
                    style={{
                      background: showCorrect
                        ? 'linear-gradient(135deg, rgba(88,204,2,0.25) 0%, rgba(88,204,2,0.12) 100%)'
                        : showCorrectHighlight
                          ? 'linear-gradient(135deg, rgba(88,204,2,0.2) 0%, rgba(88,204,2,0.08) 100%)'
                          : showWrong
                            ? 'linear-gradient(135deg, rgba(255,75,75,0.2) 0%, rgba(255,75,75,0.1) 100%)'
                            : isPicked && !feedback
                              ? theme.accentSoft
                              : '#FFFFFF',
                      border: `2px solid ${showCorrect ? '#58CC02' : showCorrectHighlight ? '#58CC02' : showWrong ? '#FF4B4B' : isPicked && !feedback ? theme.accent : '#E5E5E5'}`,
                      color: showCorrect ? '#46A302' : showCorrectHighlight ? '#46A302' : showWrong ? '#E63A3A' : isPicked && !feedback ? theme.accent : '#4B4B4B',
                      boxShadow: showCorrect
                        ? '0 0 16px rgba(88,204,2,0.4), 0 4px 12px rgba(88,204,2,0.2)'
                        : showCorrectHighlight
                          ? '0 0 12px rgba(88,204,2,0.3)'
                          : showWrong
                            ? '0 0 12px rgba(255,75,75,0.3)'
                            : isPicked && !feedback ? `0 4px 12px ${theme.accentSoft}` : '0 2px 8px rgba(0,0,0,0.04)',
                      opacity: feedback && !isPicked && !isAns ? 0.5 : 1,
                    }}
                  >
                    {opt}
                    {/* 正确标记 */}
                    {showCorrect && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md"
                      >
                        <Check size={14} />
                      </motion.span>
                    )}
                    {/* 错误标记 */}
                    {showWrong && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground shadow-md"
                      >
                        <X size={14} />
                      </motion.span>
                    )}
                    {/* 答错时正确答案标记（延迟出现） */}
                    {showCorrectHighlight && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md"
                      >
                        <Check size={14} />
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
              {/* 提交按钮 */}
              <div className="col-span-2 mt-2">
                <motion.button
                  whileHover={selectedOption && !feedback ? { scale: 1.02, y: -1 } : {}}
                  whileTap={selectedOption && !feedback ? { scale: 0.98 } : {}}
                  onClick={() => handleSubmit()}
                  disabled={!selectedOption || !!feedback}
                  className="w-full h-14 rounded-xl font-bold text-white text-base transition-all duration-200"
                  style={{
                    background: selectedOption && !feedback
                      ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent} 100%)`
                      : '#E0E0E0',
                    boxShadow: selectedOption && !feedback
                      ? `0 4px 0 ${theme.accent}, 0 6px 20px ${theme.accentSoft}`
                      : 'none',
                    opacity: !selectedOption || feedback ? 0.6 : 1,
                  }}
                >
                  确认提交
                </motion.button>
              </div>
            </div>
          )}

          {currentQ.type === 'input' && (
            <div>
              {/* 答案显示区 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5 mb-4 text-center relative overflow-hidden"
                style={{
                  background: theme.cardBg,
                  border: `2px solid ${theme.accentSoft}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                <div className="text-xs font-medium mb-2" style={{ color: theme.accent }}>你的答案</div>
                <motion.div
                  key={inputValue}
                  initial={inputValue ? { scale: 1.1 } : {}}
                  animate={{ scale: 1 }}
                  className="font-bold text-4xl"
                  style={{ color: inputValue ? theme.accent : '#999', minHeight: '44px' }}
                >
                  {inputValue || '—'}
                </motion.div>
              </motion.div>

              {/* 数字键盘 */}
              <Keypad
                value={inputValue}
                onChange={(v) => !feedback && setInputValue(v)}
                allowDecimal={isDecimal}
                allowSign={allowSign}
                accentColor={theme.accent}
              />

              {/* 提交按钮 */}
              <div className="mt-4">
                <motion.button
                  whileHover={inputValue && !feedback ? { scale: 1.02, y: -1 } : {}}
                  whileTap={inputValue && !feedback ? { scale: 0.98 } : {}}
                  onClick={() => handleSubmit()}
                  disabled={!inputValue || !!feedback}
                  className="w-full h-14 rounded-xl font-bold text-white text-base transition-all duration-200"
                  style={{
                    background: inputValue && !feedback
                      ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent} 100%)`
                      : '#E0E0E0',
                    boxShadow: inputValue && !feedback
                      ? `0 4px 0 ${theme.accent}, 0 6px 20px ${theme.accentSoft}`
                      : 'none',
                    opacity: !inputValue || feedback ? 0.6 : 1,
                  }}
                >
                  确认提交
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 心数耗尽遮罩 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {noHearts && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center px-8"
              initial={{ scale: 0.6, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.15 }}
            >
              <motion.div
                className="mb-5"
                animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, delay: 0.2 }}
              >
                <Icon name="heart" size={48} className="text-red-500" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-white">心数耗尽！</h2>
              <p className="text-sm text-white/70 mb-4">别灰心，休息一下再来挑战！</p>
              <p className="text-xs text-white/50">已收集的错题已进入错题本</p>
              <motion.div
                className="mt-6 text-sm font-medium"
                style={{ color: theme.accent }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                正在结算...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 退出确认弹窗 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <ConfirmDialog
        isOpen={showExitConfirm}
        title="确定退出吗？"
        message="当前答题进度将丢失。"
        confirmText="退出"
        cancelText="继续答题"
        onConfirm={() => {
          useSessionStore.getState().abort()
          navigate('/')
        }}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CSS 动画 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes correct-pulse {
          0% { box-shadow: 0 0 0 0 rgba(88,204,2,0.5); }
          50% { box-shadow: 0 0 20px 6px rgba(88,204,2,0.3); }
          100% { box-shadow: 0 0 16px rgba(88,204,2,0.4), 0 4px 12px rgba(88,204,2,0.2); }
        }
        .animate-correct-pulse {
          animation: correct-pulse 0.6s ease-out;
        }
        @keyframes correct-highlight-pulse {
          0% { box-shadow: 0 0 0 0 rgba(88,204,2,0.4); }
          50% { box-shadow: 0 0 16px 4px rgba(88,204,2,0.25); }
          100% { box-shadow: 0 0 12px rgba(88,204,2,0.3); }
        }
        .animate-correct-highlight-pulse {
          animation: correct-highlight-pulse 1s ease-in-out 0.3s 2;
        }
      `}</style>
    </div>
  )
}