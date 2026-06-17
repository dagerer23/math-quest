import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useSessionStore } from '@/store/useSessionStore'
import { useUserStore } from '@/store/useUserStore'
import { Button, Progress } from '@/components/ui/Controls'
import { Card, Spacer, Row, Col } from '@/components/ui/Basic'
import { LEVELS } from '@/data/questionBank'
import type { Question, Level } from '@/types/models'

// 主题色
const GRADE_COLORS: Record<number, string> = {
  1: '#4A9E8A',
  2: '#E0896E',
  3: '#8B7AB8',
  4: '#4A9E8A',
  5: '#E0896E',
  6: '#8B7AB8',
}
const PRIMARY_GREEN = '#58CC02'
const WRONG_RED = '#FF4B4B'
const COMBO_THRESHOLD = 3

// 鼓励语
const CORRECT_PHRASES = ['太棒了！', '答对啦！', '真厉害！', '继续保持！', '完美！']
const WRONG_PHRASES = ['别灰心！', '再想想！', '加油！']

function getEncouragement(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)]
}

export default function BattlePage() {
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [inputAnswer, setInputAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [encouragement, setEncouragement] = useState('')
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showHeartsDepleted, setShowHeartsDepleted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const sessionStore = useSessionStore()
  const userStore = useUserStore()

  const grade = currentLevel?.grade || userStore.grade || 1
  const themeColor = GRADE_COLORS[grade] || GRADE_COLORS[1]

  // 初始化：从路由参数或 Taro 传递获取关卡数据
  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    const levelId = params?.levelId

    // 优先从路由参数加载
    if (levelId) {
      const gradeKey = `g${grade}`
      const data = (LEVELS as any)[gradeKey]
      if (data) {
        const level = data.levels?.find((l: Level) => l.id === levelId)
        const qs = data.questions?.[levelId] || []
        if (level && qs.length > 0) {
          setCurrentLevel(level)
          setQuestions(qs)
          sessionStore.start(level, qs)
          return
        }
      }
    }

    // 备选：从 Taro 全局变量获取
    const level = (Taro as any).currentLevel
    const qs = (Taro as any).currentQuestions || []
    if (level && qs.length > 0) {
      setCurrentLevel(level)
      setQuestions(qs)
      sessionStore.start(level, qs)
      return
    }

    // 加载失败
    Taro.showToast({ title: '题目加载失败', icon: 'none' })
    setTimeout(() => Taro.navigateBack(), 1000)
  }, [])

  const question = questions[index]
  const total = questions.length
  const progress = total > 0 ? ((index + (showFeedback ? 1 : 0)) / total) * 100 : 0
  const combo = sessionStore.combo
  const hearts = userStore.hearts
  const maxHearts = userStore.maxHearts

  // 检查体力耗尽
  useEffect(() => {
    if (hearts <= 0 && !showHeartsDepleted && sessionStore.status === 'playing') {
      setShowHeartsDepleted(true)
    }
  }, [hearts])

  const checkAnswer = useCallback((answer: string | number) => {
    if (!question) return
    const correct = String(answer).trim() === String(question.answer).trim()
    setLastCorrect(correct)
    setEncouragement(correct ? getEncouragement(CORRECT_PHRASES) : getEncouragement(WRONG_PHRASES))
    setShowFeedback(true)
    sessionStore.answer(String(answer), correct)

    if (!correct) {
      userStore.loseHeart()
      userStore.addMistake(question.id)
    }
  }, [question])

  const submitOption = useCallback((opt: string) => {
    if (showFeedback) return
    setSelectedOption(opt)
    checkAnswer(opt)
  }, [showFeedback, checkAnswer])

  const submitInput = useCallback(() => {
    if (showFeedback || !inputAnswer.trim()) return
    checkAnswer(inputAnswer)
  }, [showFeedback, inputAnswer, checkAnswer])

  const nextQuestion = useCallback(() => {
    if (index + 1 >= total) {
      const record = sessionStore.finish() || {
        id: `end-${Date.now()}`,
        levelId: currentLevel?.id || '',
        grade: currentLevel?.grade || 1,
        sortOrder: currentLevel?.sortOrder || 0,
        isBoss: !!currentLevel?.isBoss,
        chapter: currentLevel?.chapter || '',
        score: 0,
        stars: 0 as const,
        correctCount: sessionStore.answers.filter((a) => a.isCorrect).length,
        totalCount: total,
        comboMax: sessionStore.comboMax,
        xpGained: 0,
        coinsGained: 0,
        timestamp: Date.now(),
        answers: sessionStore.answers,
      }
      userStore.registerSession(record)
      ;(Taro as any).lastRecord = record
      setIsFinished(true)
    } else {
      setIndex(index + 1)
      setInputAnswer('')
      setSelectedOption(null)
      setShowFeedback(false)
    }
  }, [index, total, currentLevel, sessionStore, userStore])

  // 完成后跳转结果页
  useEffect(() => {
    if (isFinished) {
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages-game/result/index' })
      }, 500)
    }
  }, [isFinished])

  const handleExit = () => {
    setShowExitDialog(true)
  }

  const confirmExit = () => {
    sessionStore.abort()
    Taro.redirectTo({ url: '/pages/home/index' })
  }

  const cancelExit = () => {
    setShowExitDialog(false)
  }

  const handleHeartsDepletedClose = () => {
    sessionStore.abort()
    Taro.redirectTo({ url: '/pages/home/index' })
  }

  // 数字键盘按键
  const handleKeypad = (key: string) => {
    if (showFeedback) return
    if (key === 'delete') {
      setInputAnswer((prev) => prev.slice(0, -1))
    } else if (key === 'submit') {
      submitInput()
    } else {
      setInputAnswer((prev) => prev + key)
    }
  }

  if (!question) {
    return (
      <View style={{ minHeight: '100vh', background: '#F8FAF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Text style={{ fontSize: 16, color: '#6b7280' }}>加载中...</Text>
      </View>
    )
  }

  // 渲染心形
  const renderHearts = () => {
    const heartsArr = []
    for (let i = 0; i < maxHearts; i++) {
      heartsArr.push(
        <Text key={i} style={{ fontSize: 18, opacity: i < hearts ? 1 : 0.3 }}>
          ❤️
        </Text>
      )
    }
    return heartsArr
  }

  // 渲染难度星星
  const renderDifficulty = (difficulty: number) => {
    return '⭐'.repeat(difficulty)
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5' }}>
      {/* 顶部状态栏 */}
      <View style={{ background: themeColor, padding: '12px 16px', paddingTop: 40, paddingBottom: 16 }}>
        <Row justify="space-between" align="center">
          {/* 退出按钮 */}
          <View
            onClick={handleExit}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 700 }}>✕</Text>
          </View>

          {/* 进度条 */}
          <View style={{ flex: 1, marginLeft: 12, marginRight: 12 }}>
            <Row justify="center" align="center" gap={6}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                {index + 1}/{total}
              </Text>
            </Row>
            <View style={{ height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
              <View style={{ height: '100%', width: `${progress}%`, background: '#FFF', borderRadius: 999, transition: 'width 0.3s' }} />
            </View>
          </View>

          {/* 体力 */}
          <Row gap={2} align="center">
            {renderHearts()}
          </Row>
        </Row>
      </View>

      {/* 连击显示 */}
      {combo >= COMBO_THRESHOLD && !showFeedback && (
        <View style={{ padding: '8px 16px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <Text style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B' }}>🔥 {combo} 连击！</Text>
        </View>
      )}

      {/* 题目卡片 */}
      <View style={{ padding: 16 }}>
        <Card padding={20} style={{ borderLeft: `4px solid ${themeColor}` }}>
          {/* 知识点标签 + 难度 */}
          <Row justify="space-between" align="center" style={{ marginBottom: 12 }}>
            <View style={{ padding: '4px 12px', background: '#ECFDF5', borderRadius: 999 }}>
              <Text style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>{question.knowledgePoint || '综合'}</Text>
            </View>
            <Text style={{ fontSize: 14 }}>{renderDifficulty(question.difficulty)}</Text>
          </Row>

          {/* 题目内容 */}
          <Text style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5 }}>
            {question.prompt}
          </Text>

          {/* 插图 emoji */}
          {question.illustration && (
            <Text style={{ fontSize: 56, marginTop: 16, display: 'block', textAlign: 'center' }}>
              {question.illustration}
            </Text>
          )}
        </Card>
      </View>

      {/* 答题区域 */}
      {question.type === 'choice' && question.options ? (
        <View style={{ padding: '0 16px' }}>
          {/* 选择题：2x2 网格 */}
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === opt
              const isCorrect = String(opt).trim() === String(question.answer).trim()
              let bg = '#FFFFFF'
              let border = '2px solid #E5E7EB'
              let color = '#1a1a1a'
              let iconBg = '#F3F4F6'
              let iconColor = '#6b7280'
              let iconText = String.fromCharCode(65 + idx)

              if (showFeedback) {
                if (isCorrect) {
                  bg = '#ECFDF5'
                  border = `2px solid ${PRIMARY_GREEN}`
                  color = PRIMARY_GREEN
                  iconBg = PRIMARY_GREEN
                  iconColor = '#FFF'
                  iconText = '✓'
                } else if (isSelected) {
                  bg = '#FEF2F2'
                  border = `2px solid ${WRONG_RED}`
                  color = WRONG_RED
                  iconBg = WRONG_RED
                  iconColor = '#FFF'
                  iconText = '✕'
                }
              } else if (isSelected) {
                bg = '#ECFDF5'
                border = `2px solid ${PRIMARY_GREEN}`
                color = PRIMARY_GREEN
                iconBg = PRIMARY_GREEN
                iconColor = '#FFF'
              }

              return (
                <View
                  key={idx}
                  onClick={() => submitOption(opt)}
                  style={{
                    width: 'calc(50% - 5px)',
                    padding: 16,
                    borderRadius: 14,
                    background: bg,
                    border,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      background: iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: 700, color: iconColor }}>{iconText}</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: 600, color, flex: 1 }}>{opt}</Text>
                </View>
              )
            })}
          </View>
        </View>
      ) : (
        <View style={{ padding: '0 16px' }}>
          {/* 输入题：答案显示区 + 数字键盘 */}
          {/* 答案显示区 */}
          <View
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              background: '#FFFFFF',
              border: `2px solid ${showFeedback ? (lastCorrect ? PRIMARY_GREEN : WRONG_RED) : '#E5E7EB'}`,
              marginBottom: 12,
              minHeight: 56,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: showFeedback
                  ? lastCorrect ? PRIMARY_GREEN : WRONG_RED
                  : inputAnswer ? '#1a1a1a' : '#9CA3AF',
                textAlign: 'center',
              }}
            >
              {inputAnswer || '输入答案...'}
            </Text>
          </View>

          {/* 数字键盘 */}
          {!showFeedback && (
            <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 1-9 */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {['1', '2', '3'].map((k) => (
                  <View
                    key={k}
                    onClick={() => handleKeypad(k)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{k}</Text>
                  </View>
                ))}
              </View>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {['4', '5', '6'].map((k) => (
                  <View
                    key={k}
                    onClick={() => handleKeypad(k)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{k}</Text>
                  </View>
                ))}
              </View>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {['7', '8', '9'].map((k) => (
                  <View
                    key={k}
                    onClick={() => handleKeypad(k)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{k}</Text>
                  </View>
                ))}
              </View>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {/* . */}
                <View
                  onClick={() => handleKeypad('.')}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>.</Text>
                </View>
                {/* 0 */}
                <View
                  onClick={() => handleKeypad('0')}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>0</Text>
                </View>
                {/* 删除 */}
                <View
                  onClick={() => handleKeypad('delete')}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 10,
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <Text style={{ fontSize: 18, color: '#6b7280' }}>⌫</Text>
                </View>
              </View>
              {/* 提交按钮 */}
              <View
                onClick={submitInput}
                style={{
                  height: 52,
                  borderRadius: 14,
                  background: inputAnswer.trim() ? PRIMARY_GREEN : '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 700, color: inputAnswer.trim() ? '#FFF' : '#9CA3AF' }}>确认答案</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 反馈区域 */}
      {showFeedback && (
        <View style={{ padding: 16 }}>
          <View
            style={{
              padding: 20,
              borderRadius: 16,
              background: lastCorrect ? '#ECFDF5' : '#FEF2F2',
              border: `2px solid ${lastCorrect ? PRIMARY_GREEN : WRONG_RED}`,
            }}
          >
            <Col gap={10}>
              <Row gap={8} align="center">
                <Text style={{ fontSize: 24 }}>{lastCorrect ? '🎉' : '😅'}</Text>
                <Text style={{ fontSize: 18, fontWeight: 700, color: lastCorrect ? PRIMARY_GREEN : WRONG_RED }}>
                  {encouragement}
                </Text>
              </Row>

              {lastCorrect && (
                <Row gap={6} align="center">
                  <Text style={{ fontSize: 14, color: PRIMARY_GREEN, fontWeight: 600 }}>+{question.xp} XP</Text>
                  {combo >= COMBO_THRESHOLD && (
                    <Text style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>🔥 连击 ×{combo}</Text>
                  )}
                </Row>
              )}

              {!lastCorrect && (
                <Col gap={6}>
                  <Row gap={6} align="center">
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>正确答案：</Text>
                    <Text style={{ fontSize: 16, fontWeight: 700, color: PRIMARY_GREEN }}>{String(question.answer)}</Text>
                  </Row>
                  <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                    💡 {question.explanation}
                  </Text>
                </Col>
              )}

              <Spacer size={4} />
              <View
                onClick={nextQuestion}
                style={{
                  height: 52,
                  borderRadius: 14,
                  background: lastCorrect ? PRIMARY_GREEN : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 700, color: '#FFF' }}>
                  {index + 1 >= total ? '查看结果' : '下一题'}
                </Text>
              </View>
            </Col>
          </View>
        </View>
      )}

      <Spacer size={40} />

      {/* 退出确认弹窗 */}
      {showExitDialog && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 999,
          }}
        >
          <View
            style={{
              width: '80%',
              maxWidth: 340,
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>确定退出？</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              退出后当前答题进度将不会保存哦～
            </Text>
            <Row gap={12} style={{ width: '100%' }}>
              <View
                onClick={cancelExit}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>继续答题</Text>
              </View>
              <View
                onClick={confirmExit}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  background: WRONG_RED,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 600, color: '#FFF' }}>退出</Text>
              </View>
            </Row>
          </View>
        </View>
      )}

      {/* 体力耗尽弹窗 */}
      {showHeartsDepleted && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 999,
          }}
        >
          <View
            style={{
              width: '80%',
              maxWidth: 340,
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 56, marginBottom: 12 }}>💔</Text>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>体力耗尽了！</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              休息一下，体力恢复后再来挑战吧～
            </Text>
            <View
              onClick={handleHeartsDepletedClose}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                background: PRIMARY_GREEN,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 700, color: '#FFF' }}>返回首页</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
