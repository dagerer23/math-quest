import { useEffect, useState, useRef, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useSessionStore } from '@/store/useSessionStore'
import { useUserStore } from '@/store/useUserStore'
import { getLevelDetail, generateQuestions } from '@/services/content'
import type { Level } from '@/types/models'
import Keypad from '@/components/Keypad'
import ParticleBurst from '@/components/ParticleBurst'
import ComboNumber from '@/components/ComboNumber'
import { Icon } from '@/components/Icon'
import { ChoiceOptions } from '@/components/ChoiceOptions'
import { QuestionCard } from '@/components/QuestionCard'
import { C, TOKEN, btnShadow } from '@/styles/theme'

// 鼓励文案
const ENCOURAGEMENTS = {
  correct: ['太棒了！', '你真厉害！', '完美！', '继续保持！', '厉害厉害！', '优秀！'],
  combo: ['连击！', '太牛了！', '停不下来！', '无敌！', '连胜！'],
  wrong: ['没关系，下次一定行！', '别灰心，再来一次！', '错题本已收录，下次复仇！', '下一题就是加分题！', '失误而已，稳住！'],
}

// 年级主题色
const GRADE_THEMES: Record<number, { bg: string; accent: string; accentSoft: string; cardBg: string }> = {
  1: { bg: '#F0F7F5', accent: '#4A9E8A', accentSoft: '#D8ECE5', cardBg: '#FFFFFF' },
  2: { bg: '#FBF4F0', accent: '#E0896E', accentSoft: '#F8E2D9', cardBg: '#FFFFFF' },
  3: { bg: '#F3F0F7', accent: '#8B7AB8', accentSoft: '#E3DDEF', cardBg: '#FFFFFF' },
  4: { bg: '#F0F5F7', accent: '#4A8AB8', accentSoft: '#D8E8F0', cardBg: '#FFFFFF' },
  5: { bg: '#F7F0F5', accent: '#B86E9E', accentSoft: '#F0D8E5', cardBg: '#FFFFFF' },
  6: { bg: '#F5F7F0', accent: '#8AB84A', accentSoft: '#E0ECD8', cardBg: '#FFFFFF' },
  7: { bg: '#F0F7F5', accent: '#4A9E8A', accentSoft: '#D8ECE5', cardBg: '#FFFFFF' },
  8: { bg: '#FBF4F0', accent: '#E0896E', accentSoft: '#F8E2D9', cardBg: '#FFFFFF' },
  9: { bg: '#F3F0F7', accent: '#8B7AB8', accentSoft: '#E3DDEF', cardBg: '#FFFFFF' },
}

function getTheme(grade: number) {
  return GRADE_THEMES[grade] || GRADE_THEMES[1]
}

export default function BattlePage() {
  const level = useSessionStore((s) => s.level)
  const sessionStatus = useSessionStore((s) => s.status)
  const sessionIndex = useSessionStore((s) => s.index)
  const sessionQuestions = useSessionStore((s) => s.questions)
  const sessionCombo = useSessionStore((s) => s.combo)
  const setOnLastQuestionComplete = useSessionStore((s) => s.setOnLastQuestionComplete)
  const finish = useSessionStore((s) => s.finish)
  const abort = useSessionStore((s) => s.abort)
  const startSession = useSessionStore((s) => s.start)
  const user = useUserStore()

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showParticle, setShowParticle] = useState(0)
  const [encouragement, setEncouragement] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [noHearts, setNoHearts] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)
  const [blink, setBlink] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const heartsDepletedRef = useRef(false)
  const submitLock = useRef(false)
  const initRef = useRef(false)

  const currentQ = sessionQuestions[sessionIndex]
  const theme = getTheme(level?.grade || 1)
  const comboShowThreshold = Number(user.systemConfigs['combo.show_threshold']) || 3
  // input 题型会显示数字键盘，上方区域需更紧凑以腾出空间
  const isInput = currentQ?.type === 'input'

  const getEncouragement = (isCombo: boolean) => {
    const texts = isCombo ? ENCOURAGEMENTS.combo : ENCOURAGEMENTS.correct
    return texts[Math.floor(Math.random() * texts.length)]
  }

  // 注册最后一题完成的回调 → 跳 result 页
  useEffect(() => {
    const handleLastQuestionComplete = (record: any) => {
      if (heartsDepletedRef.current) return
      const res = user.registerSession(record)
      Taro.setStorageSync('temp_lastRecord', { ...record, newUnlocks: res.newUnlocks, leveledUp: res.leveledUp })
      setTimeout(() => Taro.redirectTo({ url: '/pages/result/index' }), 200)
    }
    setOnLastQuestionComplete(handleLastQuestionComplete)
    return () => setOnLastQuestionComplete(() => {})
  }, [setOnLastQuestionComplete, user])

  // 心数为 0 时提前结束
  useEffect(() => {
    if (user.hearts <= 0 && sessionStatus === 'playing' && !heartsDepletedRef.current) {
      heartsDepletedRef.current = true
      setNoHearts(true)
      setTimeout(() => {
        const finalRecord = finish()
        if (finalRecord) {
          user.registerSession(finalRecord)
          Taro.setStorageSync('temp_lastRecord', finalRecord)
          Taro.redirectTo({ url: '/pages/result/index' })
        } else {
          Taro.switchTab({ url: '/pages/home/index' })
        }
      }, 1500)
    }
  }, [user.hearts, sessionStatus, finish, user])

  // 每题重置状态
  useEffect(() => {
    if (sessionStatus !== 'playing' || !currentQ) return
    setSelectedOption(null)
    setInputValue('')
    setFeedback(null)
    setEncouragement('')
    submitLock.current = false
  }, [sessionIndex, sessionStatus, currentQ])

  // 答错时正确答案标记延迟出现（对齐 Web 端 delay 0.3s）
  useEffect(() => {
    setShowHighlight(false)
    if (feedback === 'wrong') {
      const t = setTimeout(() => setShowHighlight(true), 300)
      return () => clearTimeout(t)
    }
  }, [feedback])

  // 心数耗尽「正在结算...」闪烁动画
  useEffect(() => {
    if (!noHearts) return
    const t = setInterval(() => setBlink((b) => !b), 700)
    return () => clearInterval(t)
  }, [noHearts])

  // 会话初始化：处理从结果页重玩 / 错题复习等无活跃 session 的场景
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    const sess = useSessionStore.getState()
    // 已有活跃 session（首页已 start），直接复用
    if (sess.level && sess.questions.length > 0 && sess.status === 'playing') return

    const instance = Taro.getCurrentInstance()
    const params = instance.router?.params

    // 错题复习模式
    if (params?.mode === 'review') {
      const reviewQs = JSON.parse(Taro.getStorageSync('temp_reviewQuestions') || '[]')
      if (reviewQs.length > 0) {
        const lvl: Level = {
          id: 'mistakes-revenge',
          chapter: '错题复习',
          grade: Number(params.grade) || 1,
          sortOrder: 0,
          isBoss: false,
          questions: reviewQs,
          knowledgePoints: [],
          unitId: 'mistakes-revenge',
        }
        startSession(lvl, reviewQs)
        Taro.removeStorageSync('temp_reviewQuestions')
        return
      }
    }

    // 从结果页重玩：重新加载关卡 + 生成题目
    const levelId = params?.levelId
    if (levelId) {
      setInitializing(true)
      Promise.all([getLevelDetail(levelId), generateQuestions(levelId, {}, [])])
        .then(([lvl, qs]) => {
          if (lvl && qs && qs.length > 0) {
            startSession(lvl, qs)
          }
        })
        .catch(() => {})
        .finally(() => setInitializing(false))
    }
  }, [startSession])

  // 状态检查
  if (initializing) {
    return (
      <View style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Icon name="hourglass" size={40} color={C.semantic.mutedForeground} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 14, color: '#6b7280' }}>正在加载题目...</Text>
      </View>
    )
  }

  if (!level) {
    return (
      <View style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Icon name="search" size={48} color={C.semantic.mutedForeground} style={{ marginBottom: 16 }} />
        <Text style={{ color: '#6b7280', fontWeight: 500 }}>关卡不存在</Text>
        <View onClick={() => Taro.switchTab({ url: '/pages/home/index' })} style={{ marginTop: 24, paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, borderRadius: 12, background: '#58CC02' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>返回首页</Text>
        </View>
      </View>
    )
  }

  if (sessionStatus === 'finished') {
    return (
      <View style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>正在结算...</Text>
      </View>
    )
  }

  if (sessionStatus !== 'playing' || !currentQ) {
    return (
      <View style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Icon name="gamepad" size={40} color={C.semantic.mutedForeground} style={{ marginBottom: 16 }} />
        <Text style={{ color: '#6b7280', fontWeight: 500, marginBottom: 16 }}>未找到答题会话</Text>
        <View onClick={() => Taro.switchTab({ url: '/pages/home/index' })} style={{ paddingTop: 10, paddingBottom: 10, paddingLeft: 24, paddingRight: 24, borderRadius: 12, background: '#58CC02' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>返回首页</Text>
        </View>
      </View>
    )
  }

  // 答题逻辑
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
      setShowParticle((n) => n + 1)
      if (level.id === 'mistakes-revenge' && currentQ?.id) {
        user.incrementMistakeMastery(currentQ.id)
      }
    } else {
      setEncouragement(ENCOURAGEMENTS.wrong[Math.floor(Math.random() * ENCOURAGEMENTS.wrong.length)])
      user.loseHeart()
      if (currentQ?.id) user.addMistake(currentQ.id)
    }

    setTimeout(() => {
      useSessionStore.getState().answer(userAnswer, correct)
    }, 1200)
  }

  const total = sessionQuestions.length
  const isDecimal = String(currentQ.answer).includes('.')
  const allowSign = String(currentQ.answer).startsWith('-')
  const progressPercent = ((sessionIndex + 1) / total) * 100

  // 底部安全区高度（iPhone 刘海/手势条、Android 导航条）
  const safeAreaBottom = useMemo(() => {
    try {
      const info = Taro.getSystemInfoSync()
      return info.safeArea ? Math.max(0, info.screenHeight - info.safeArea.bottom) : 0
    } catch {
      return 0
    }
  }, [])

  return (
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: `linear-gradient(to bottom, ${theme.bg}, ${theme.bg})` }}>
      {/* 顶部状态栏 */}
      <View style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 20, paddingBottom: 12, flexShrink: 0 }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* 退出按钮 */}
          <View
            onClick={() => setShowExitConfirm(true)}
            style={{
              width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderStyle: 'solid', borderColor: theme.accentSoft,
            }}
          >
            <Icon name="x" size={20} color={C.semantic.mutedForeground} />
          </View>

          {/* 进度条 */}
          <View style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 12, borderRadius: 999, overflow: 'hidden', background: theme.accentSoft }}>
              <View style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 999, background: theme.accent }} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{sessionIndex + 1}/{total}</Text>
          </View>

          {/* 心数 */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name={i < user.hearts ? 'heart' : 'heartOutline'}
                size={16}
                color={i < user.hearts ? C.semantic.destructive : C.semantic.mutedForeground}
                style={{ marginLeft: i === 0 ? 0 : 2 }}
              />
            ))}
          </View>
        </View>

        {/* 连击显示 */}
        {sessionCombo >= comboShowThreshold && (
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
            <View style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderRadius: 999,
              background: 'rgba(255,75,75,0.1)',
            }}>
              <Icon name="lightning" size={14} color={C.duolingo.gold} />
              <Text style={{ fontSize: 14, fontWeight: 700, color: '#FF4B4B' }}>{sessionCombo} 连击！</Text>
            </View>
          </View>
        )}
      </View>

      {/* 题目卡片 */}
      <View style={{ flex: 1, paddingLeft: 20, paddingRight: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <View style={{ flex: 1, overflowY: 'auto' }}>
          {/* 知识点标签 */}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isInput ? 8 : 16 }}>
          <View style={{ paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12, borderRadius: 999, background: theme.accentSoft }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: theme.accent }}>{currentQ.knowledgePoint}</Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>难度</Text>
            {Array.from({ length: currentQ.difficulty }).map((_, i) => (
              <Icon key={i} name="star" size={12} color={C.duolingo.gold} />
            ))}
          </View>
        </View>

        {/* 题目内容 */}
        <QuestionCard
          className={feedback === 'wrong' ? 'taro-shake' : ''}
          prompt={currentQ.prompt}
          illustration={currentQ.illustration}
          feedback={feedback}
          themeAccentSoft={theme.accentSoft}
          compact={isInput}
        >
          <ParticleBurst trigger={showParticle} color={theme.accent} />
          <ComboNumber value={sessionCombo} show={feedback === 'correct'} />
        </QuestionCard>

        {/* 反馈提示 */}
        {feedback && (
          <View
            className="taro-fade-in"
            style={{
              marginTop: 16, paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderRadius: TOKEN.radius.lg,
              background: feedback === 'correct'
                ? 'linear-gradient(135deg, rgba(88,204,2,0.12) 0%, rgba(88,204,2,0.06) 100%)'
                : 'linear-gradient(135deg, rgba(255,75,75,0.12) 0%, rgba(255,75,75,0.06) 100%)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: feedback === 'correct' ? 'rgba(88,204,2,0.3)' : 'rgba(255,75,75,0.3)',
            }}>
            {feedback === 'correct' ? (
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="star" size={16} color={C.duolingo.gold} />
                <Text style={{ fontSize: 16, fontWeight: 700, color: C.duolingo.greenDark }}>{encouragement} +{currentQ.xp} XP</Text>
              </View>
            ) : (
              <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: 700, color: '#E63A3A', marginBottom: 4 }}>正确答案</Text>
                <Text style={{ fontSize: 20, fontWeight: 700, color: '#E63A3A' }}>{String(currentQ.answer)}</Text>
                {currentQ.explanation && (
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>{currentQ.explanation}</Text>
                )}
              </View>
            )}
          </View>
        )}

        </View>

        {/* 答案输入区 */}
        <View style={{ marginTop: 16, flexShrink: 0, paddingBottom: 20 + safeAreaBottom }}>
          {currentQ.type === 'choice' && currentQ.options && (
            <View>
              <ChoiceOptions
                options={currentQ.options}
                answer={currentQ.answer}
                selectedOption={selectedOption}
                feedback={feedback}
                onSelect={(opt: string) => setSelectedOption(opt)}
                themeAccent={theme.accent}
                themeAccentSoft={theme.accentSoft}
                showHighlight={showHighlight}
              />
              {/* 提交按钮 */}
              <View style={{ marginTop: 16 }}>
                <View
                  className="taro-btn-press"
                  onClick={() => selectedOption && !feedback && handleSubmit()}
                  style={{
                    width: '100%', height: 56, borderRadius: 12,
                    background: selectedOption && !feedback
                      ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent} 100%)`
                      : '#E0E0E0',
                    boxShadow: selectedOption && !feedback
                      ? `${btnShadow(theme.accent)}, 0 6px 20px ${theme.accentSoft}`
                      : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: !selectedOption || feedback ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>确认提交</Text>
                </View>
              </View>
            </View>
          )}

          {currentQ.type === 'input' && (
            <View>
              {/* 答案显示区 */}
              <View style={{
                borderRadius: 16, paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24,
                marginBottom: 10, display: 'flex', alignItems: 'center',
                background: theme.cardBg,
                borderWidth: 2, borderStyle: 'solid', borderColor: theme.accentSoft,
              }}>
                <Text style={{ fontSize: 12, fontWeight: 500, color: theme.accent, marginBottom: 4 }}>你的答案</Text>
                {inputValue ? (
                  <Text style={{ fontSize: 32, fontWeight: 700, color: theme.accent, minHeight: 38 }}>
                    {inputValue}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 26, fontWeight: 700, color: '#E0E0E0', minHeight: 38 }}>
                    ?
                  </Text>
                )}
              </View>

              {/* 数字键盘 */}
              <View style={{ marginLeft: -20, marginRight: -20 }}>
                <Keypad
                  value={inputValue}
                  onChange={(v) => !feedback && setInputValue(v)}
                  allowDecimal={isDecimal}
                  allowSign={allowSign}
                  accentColor={theme.accent}
                />
              </View>

              {/* 提交按钮 */}
              <View style={{ marginTop: 16 }}>
                <View
                  className="taro-btn-press"
                  onClick={() => inputValue && !feedback && handleSubmit()}
                  style={{
                    width: '100%', height: 56, borderRadius: 12,
                    background: inputValue && !feedback
                      ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent} 100%)`
                      : '#E0E0E0',
                    boxShadow: inputValue && !feedback
                      ? `${btnShadow(theme.accent)}, 0 6px 20px ${theme.accentSoft}`
                      : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: !inputValue || feedback ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>确认提交</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 心数耗尽遮罩 */}
      {noHearts && (
        <View style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
        }}>
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: 32, paddingRight: 32 }}>
            <Icon name="heart" size={64} color={C.semantic.destructive} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>心数耗尽！</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>别灰心，休息一下再来挑战！</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>已收集的错题已进入错题本</Text>
            <Text style={{ fontSize: 14, fontWeight: 500, color: theme.accent, marginTop: 24, opacity: blink ? 1 : 0.4, transition: 'opacity 300ms ease' }}>正在结算...</Text>
          </View>
        </View>
      )}

      {/* 退出确认弹窗 */}
      {showExitConfirm && (
        <View style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            width: '85%', minWidth: 280, background: '#fff', borderRadius: 16, paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>确定退出吗？</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>当前答题进度将丢失。</Text>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 12, width: '100%' }}>
              <View
                className="taro-btn-press"
                onClick={() => setShowExitConfirm(false)}
                style={{ flex: 1, height: 44, borderRadius: 12, background: '#58CC02', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>继续答题</Text>
              </View>
              <View
                className="taro-btn-press"
                onClick={() => {
                  abort()
                  Taro.switchTab({ url: '/pages/home/index' })
                }}
                style={{ flex: 1, height: 44, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>退出</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
