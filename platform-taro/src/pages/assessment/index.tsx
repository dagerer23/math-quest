import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { getAssessmentQuestions } from '@/services/content'
import { saveAssessment as saveAssessmentToBackend } from '@/services/auth'
import Keypad from '@/components/Keypad'
import ParticleBurst from '@/components/ParticleBurst'
import { Icon } from '@/components/Icon'
import type { Question } from '@/types/models'
import { C, TOKEN, btnShadow } from '@/styles/theme'

const primaryLight = 'rgba(88,204,2,0.1)'

// hex -> rgba，用于半透明背景
function hexA(hex: string, a: number): string {
  const h = (hex || '#000000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

// 水平测评页 — 对齐 web Assessment.tsx
// 流程：intro 介绍页 → quiz 答题 → 完成后保存测评数据 → 跳 assessment-result
export default function AssessmentPage() {
  const user = useUserStore()
  const [stage, setStage] = useState<'intro' | 'quiz'>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ isCorrect: boolean; userAnswer: string }[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [inputAnswer, setInputAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showParticle, setShowParticle] = useState(0)

  const targetGrade = user.profile.targetGrade || user.grade || 2

  // 拉取测评题目
  useEffect(() => {
    if (stage !== 'quiz') return
    setLoading(true)
    getAssessmentQuestions(targetGrade, 10)
      .then((qs) => {
        setQuestions(qs)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [stage, targetGrade])

  const currentQuestion = questions[currentIndex]
  const correctCount = answers.filter(a => a.isCorrect).length
  const hasQuestions = questions.length > 0 && currentIndex < questions.length

  const startQuiz = () => setStage('quiz')

  const handleSelectOption = (option: string) => {
    if (feedback || !currentQuestion) return
    setSelectedOption(option)
  }

  const handleSubmit = () => {
    if (!currentQuestion || feedback) return
    const userAnswer = currentQuestion.options ? selectedOption : inputAnswer
    if (!userAnswer) return
    const isCorrect = String(currentQuestion.answer) === String(userAnswer)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setAnswers(prev => [...prev, { isCorrect, userAnswer }])
    if (isCorrect) {
      setShowParticle(n => n + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setInputAnswer('')
      setFeedback(null)
    } else {
      // 完成测评
      const finalCorrect = answers.filter(a => a.isCorrect).length
      const finalAccuracy = questions.length > 0 ? Math.round((finalCorrect / questions.length) * 100) : 0
      const finalRec = finalAccuracy >= 80 ? 3 : finalAccuracy >= 50 ? 2 : 1
      const assessmentData = {
        id: 'assessment_' + Date.now(),
        completedAt: Date.now(),
        score: finalAccuracy,
        recommendedDifficulty: finalRec,
        answers: questions.map((q, i) => ({
          questionId: q.id,
          userAnswer: answers[i]?.userAnswer || '',
          isCorrect: answers[i]?.isCorrect || false,
        })),
      }
      // 保存到本地 store
      user.setAssessment(assessmentData)
      // 异步同步到后端
      const userId = user.userId || Taro.getStorageSync('userId')
      if (userId) {
        saveAssessmentToBackend({ userId, ...assessmentData }).catch(() => {})
      }
      // 跳转测评结果页
      Taro.redirectTo({ url: '/pages/assessment-result/index' })
    }
  }

  const handleGoHome = () => Taro.switchTab({ url: '/pages/home/index' })

  // ═══ Intro 阶段 ═══
  if (stage === 'intro') {
    return (
      <View style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Icon name="memo" size={64} color={C.semantic.primary} style={{ marginBottom: 24 }} />
          <Text style={{ fontSize: 22, fontWeight: 700, color: C.semantic.foreground, marginBottom: 12 }}>水平测评</Text>
          <Text style={{ fontSize: 14, color: C.semantic.mutedForeground, textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
            为了给你推荐最适合的题目，让我们先做一个简短的测评。{'\n'}一共10道题，大约需要5分钟。
          </Text>
          <View style={{ background: primaryLight, borderRadius: TOKEN.radius.lg, padding: 16, marginBottom: 32, width: '100%', boxShadow: TOKEN.shadow.md }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.primary, marginBottom: 8 }}>测评内容</Text>
            <View style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>共10道题</Text>
              <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>不计时，无需压力</Text>
              <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>完成后推荐合适难度</Text>
            </View>
          </View>
          <View
            onClick={startQuiz}
            className="taro-btn-press"
            style={{
              width: '100%', height: 52, borderRadius: TOKEN.radius.md, background: C.semantic.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: btnShadow(C.duolingo.greenDark),
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>开始测评</Text>
          </View>
        </View>
      </View>
    )
  }

  // ═══ Loading 阶段 ═══
  if (loading) {
    return (
      <View style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Icon name="hourglass" size={40} color={C.semantic.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 14, color: C.semantic.mutedForeground }}>正在准备题目...</Text>
        </View>
      </View>
    )
  }

  // ═══ 无题目 ═══
  if (stage === 'quiz' && !hasQuestions) {
    return (
      <View style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Icon name="construction" size={64} color={C.semantic.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: 700, color: C.semantic.foreground, marginBottom: 8 }}>该年级内容筹备中</Text>
          <Text style={{ fontSize: 14, color: C.semantic.mutedForeground, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
            我们正在准备这一年级的测评题目，{'\n'}请返回选择其他年级体验。
          </Text>
          <View
            onClick={handleGoHome}
            className="taro-btn-press"
            style={{
              height: 48, paddingLeft: 32, paddingRight: 32, borderRadius: TOKEN.radius.md, background: C.semantic.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: btnShadow(C.duolingo.greenDark),
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>返回首页</Text>
          </View>
        </View>
      </View>
    )
  }

  // ═══ Quiz 阶段 ═══
  const progress = ((currentIndex + (feedback ? 1 : 0)) / questions.length) * 100
  const isDecimal = currentQuestion ? String(currentQuestion.answer).includes('.') : false
  const canSubmit = currentQuestion?.options ? !!selectedOption : !!inputAnswer.trim()

  return (
    <View style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部进度 */}
      <View style={{ padding: 16, borderBottom: `1px solid ${C.semantic.border}` }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: C.semantic.mutedForeground }}>第 {currentIndex + 1} 题 / 共 {questions.length} 题</Text>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="check" size={14} color={C.semantic.primary} />
            <Text style={{ fontSize: 13, color: C.semantic.mutedForeground, marginLeft: 4 }}>{correctCount}</Text>
          </View>
        </View>
        <View style={{ height: 8, background: C.icon.iconGrayBg, borderRadius: 999, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${progress}%`, background: C.semantic.primary, borderRadius: 999 }} />
        </View>
      </View>

      {/* 题目区域 */}
      <View style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* 题目卡片 */}
        <View
          key={currentIndex}
          className="taro-slide-in-right"
          style={{
            position: 'relative',
            borderRadius: TOKEN.radius.lg, paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20,
            marginBottom: 16,
            background: '#fff',
            borderWidth: 2, borderStyle: 'solid',
            borderColor: feedback === 'correct' ? C.semantic.primary : feedback === 'wrong' ? C.semantic.destructive : C.semantic.border,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 160,
            boxShadow: TOKEN.shadow.md,
            overflow: 'hidden',
          }}>
          {currentQuestion.illustration && (
            <Icon name={currentQuestion.illustration} size={40} style={{ marginBottom: 12 }} />
          )}
          <Text style={{ fontSize: 20, fontWeight: 700, color: C.semantic.foreground, textAlign: 'center', lineHeight: 1.6, wordBreak: 'break-all', overflowWrap: 'break-word', maxWidth: '100%' }}>
            {currentQuestion.prompt}
          </Text>
          <ParticleBurst trigger={showParticle} />
        </View>

        {/* 反馈 */}
        {feedback && (
          <View
            key={`feedback-${currentIndex}`}
            className="taro-slide-up"
            style={{
            marginBottom: 16, paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderRadius: TOKEN.radius.lg,
            background: feedback === 'correct' ? primaryLight : hexA(C.semantic.destructive, 0.1),
            display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          }}>
            {feedback === 'correct' ? (
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="check" size={16} color={C.semantic.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: 700, color: C.semantic.primary }}>太棒了！回答正确！</Text>
              </View>
            ) : (
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="x" size={16} color={C.semantic.destructive} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: 700, color: C.semantic.destructive }}>正确答案是 {String(currentQuestion.answer)}</Text>
              </View>
            )}
          </View>
        )}

        {/* 选择题 */}
        {currentQuestion.options && (
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option
              const isCorrectAnswer = String(option) === String(currentQuestion.answer)
              const showResult = feedback !== null
              let bg = '#fff'
              let borderColor = C.semantic.border
              let color = C.semantic.foreground
              if (showResult) {
                if (isCorrectAnswer) {
                  bg = C.semantic.primary; borderColor = C.semantic.primary; color = '#fff'
                } else if (isSelected) {
                  bg = C.semantic.destructive; borderColor = C.semantic.destructive; color = '#fff'
                } else {
                  bg = C.icon.iconGrayBg; color = C.semantic.mutedForeground
                }
              } else if (isSelected) {
                bg = C.semantic.primary; borderColor = C.semantic.primary; color = '#fff'
              }
              return (
                <View
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className="taro-btn-press"
                  style={{
                    width: '48%', height: 56, borderRadius: TOKEN.radius.md, marginBottom: 12,
                    background: bg, borderWidth: 2, borderStyle: 'solid', borderColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: 700, color }}>{option}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* 输入题 */}
        {!currentQuestion.options && (
          <View>
            <View style={{
              borderRadius: TOKEN.radius.lg, paddingTop: 20, paddingBottom: 20, paddingLeft: 24, paddingRight: 24,
              marginBottom: 16,
              background: '#fff', borderWidth: 2, borderStyle: 'solid',
              borderColor: feedback === 'correct' ? C.semantic.primary : feedback === 'wrong' ? C.semantic.destructive : C.semantic.border,
              display: 'flex', alignItems: 'center',
              boxShadow: TOKEN.shadow.md,
            }}>
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginBottom: 8 }}>你的答案</Text>
              <Text style={{ fontSize: 36, fontWeight: 700, color: inputAnswer ? C.semantic.primary : '#999', minHeight: 44 }}>
                {inputAnswer || '—'}
              </Text>
            </View>
            <Keypad
              value={inputAnswer}
              onChange={(v) => !feedback && setInputAnswer(v)}
              allowDecimal={isDecimal}
            />
          </View>
        )}
      </View>

      {/* 底部按钮 */}
      <View style={{ padding: 24, borderTop: `1px solid ${C.semantic.border}` }}>
        {!feedback ? (
          <View
            onClick={handleSubmit}
            className="taro-btn-press"
            style={{
              width: '100%', height: 52, borderRadius: TOKEN.radius.md,
              background: canSubmit ? C.semantic.primary : C.icon.iconGrayBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: canSubmit ? 1 : 0.6,
              boxShadow: canSubmit ? btnShadow(C.duolingo.greenDark) : 'none',
            }}
          >
            <Text style={{ color: canSubmit ? '#fff' : C.semantic.mutedForeground, fontSize: 16, fontWeight: 700 }}>
              确认答案
            </Text>
          </View>
        ) : (
          <View
            onClick={handleNext}
            className="taro-btn-press"
            style={{
              width: '100%', height: 52, borderRadius: TOKEN.radius.md, background: C.semantic.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: btnShadow(C.duolingo.greenDark),
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
              {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
