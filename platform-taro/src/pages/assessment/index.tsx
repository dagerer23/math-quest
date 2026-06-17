import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useSessionStore } from '@/store/useSessionStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Spacer, Row, Col } from '@/components/ui/Basic'
import { LEVELS } from '@/data/questionBank'
import type { Question, Level } from '@/types/models'

export default function AssessmentPage() {
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [inputAnswer, setInputAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const userStore = useUserStore()
  const sessionStore = useSessionStore()

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const params = instance.router?.params

    // 错题复习模式
    if (params?.mode === 'review') {
      const reviewQs = JSON.parse(Taro.getStorageSync('temp_reviewQuestions') || '[]')
      if (reviewQs.length > 0) {
        const level: Level = { id: 'mistake-review', grade: 1, title: '错题复习', sortOrder: 0 }
        setCurrentLevel(level)
        setQuestions(reviewQs)
        sessionStore.start(level, reviewQs)
        Taro.removeStorageSync('temp_reviewQuestions')
        return
      }
    }

    // 正常模式：从路由参数获取 levelId 和 grade
    const levelId = params?.levelId || ''
    const grade = Number(params?.grade) || 1

    const gradeData = (LEVELS as any)[`g${grade}`]
    const levels: Level[] = gradeData?.levels || []
    const level = levels.find((l) => l.id === levelId)
    const qs = gradeData?.questions?.[levelId] || []

    if (!level || qs.length === 0) {
      Taro.showToast({ title: '题目加载失败', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1000)
      return
    }
    setCurrentLevel(level)
    setQuestions(qs)
    sessionStore.start(level, qs)
  }, [])

  const question = questions[index]
  const total = questions.length
  const progress = total > 0 ? ((index + (showFeedback ? 1 : 0)) / total) * 100 : 0

  const checkAnswer = (answer: string | number) => {
    if (!question) return
    const correct = String(answer).trim() === String(question.answer).trim()
    setLastCorrect(correct)
    setShowFeedback(true)

    sessionStore.answer(answer, correct)
  }

  const submitOption = (opt: string) => {
    if (showFeedback) return
    setSelectedOption(opt)
    checkAnswer(opt)
  }

  const submitInput = () => {
    if (showFeedback || !inputAnswer.trim()) return
    checkAnswer(inputAnswer)
  }

  const nextQuestion = () => {
    if (index + 1 >= total) {
      // 完成了
      const record = sessionStore.finish() || {
        id: 'end',
        levelId: currentLevel?.id || '',
        grade: currentLevel?.grade || 1,
        sortOrder: currentLevel?.sortOrder || 0,
        isBoss: !!currentLevel?.isBoss,
        chapter: '',
        score: 0,
        stars: 0,
        correctCount: sessionStore.answers.filter(a => a.isCorrect).length,
        totalCount: total,
        comboMax: 0,
        xpGained: 0,
        coinsGained: 0,
        timestamp: Date.now(),
        answers: sessionStore.answers,
      }
      // 同步到用户 store
      userStore.registerSession(record)
      // 把记录传到结果页
      Taro.setStorageSync('temp_lastRecord', record)
      setIsFinished(true)
    } else {
      setIndex(index + 1)
      setInputAnswer('')
      setSelectedOption(null)
      setShowFeedback(false)
    }
  }

  useEffect(() => {
    if (isFinished) {
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/result/index' })
      }, 500)
    }
  }, [isFinished])

  if (!question) {
    return (
      <View style={{ padding: 24 }}>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      {/* 顶部进度 */}
      <View style={{ paddingTop: 24, paddingBottom: 16 }}>
        <Row justify="space-between">
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            第 {index + 1} / {total} 题
          </Text>
          <Text style={{ fontSize: 14, color: '#58CC02', fontWeight: 600 }}>
            🔥 {sessionStore.combo} 连击
          </Text>
        </Row>
        <View style={{ height: 8, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden', marginTop: 12 }}>
          <View style={{ height: '100%', width: `${progress}%`, background: '#58CC02', borderRadius: 999 }} />
        </View>
      </View>

      {/* 题目 */}
      <Card padding={24} style={{ margin: 8, marginTop: 8 }}>
        <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <View style={{ padding: '4px 12px', background: '#ECFDF5', borderRadius: 999 }}>
            <Text style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
              {question.knowledgePoint || '综合'}
            </Text>
          </View>
          <View style={{ padding: '4px 12px', background: '#FFFBEB', borderRadius: 999 }}>
            <Text style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>
              {'⭐'.repeat(question.difficulty || 1)}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.6 }}>
          {question.prompt}
        </Text>

        {question.illustration && (
          <Text style={{ fontSize: 48, marginTop: 16, display: 'block' }}>{question.illustration}</Text>
        )}
      </Card>

      <Spacer size={16} />

      {/* 选项或输入 */}
      {question.type === 'choice' && question.options ? (
        <Col gap={12} style={{ padding: 8 }}>
          {question.options.map((opt, idx) => {
            const isSelected = selectedOption === opt
            const isCorrect = String(opt).trim() === String(question.answer).trim()
            let bg = '#FFFFFF'
            let border = '2px solid #E5E7EB'
            let color = '#1a1a1a'

            if (showFeedback) {
              if (isCorrect) {
                bg = '#ECFDF5'
                border = '2px solid #58CC02'
                color = '#58CC02'
              } else if (isSelected && !isCorrect) {
                bg = '#FEF2F2'
                border = '2px solid #EF4444'
                color = '#EF4444'
              }
            } else if (isSelected) {
              bg = '#ECFDF5'
              border = '2px solid #58CC02'
              color = '#58CC02'
            }

            return (
              <View
                key={idx}
                onClick={() => submitOption(opt)}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: bg,
                  border,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: showFeedback && isCorrect ? '#58CC02' : (showFeedback && isSelected ? '#EF4444' : '#F3F4F6'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 700, color: showFeedback && (isCorrect || isSelected) ? '#FFF' : '#6b7280' }}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 600, color, flex: 1 }}>{opt}</Text>
              </View>
            )
          })}
        </Col>
      ) : (
        <Col gap={12} style={{ padding: 8 }}>
          <View
            style={{
              padding: 20,
              borderRadius: 16,
              background: '#FFFFFF',
              border: '2px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Input
              type="number"
              placeholder="输入答案..."
              value={inputAnswer}
              onInput={(e) => setInputAnswer(e.detail.value)}
              onConfirm={submitInput}
              disabled={showFeedback}
              style={{
                flex: 1,
                fontSize: 24,
                fontWeight: 700,
                color: '#1a1a1a',
                textAlign: 'center',
              }}
            />
          </View>
          {!showFeedback && (
            <Button block size="lg" onClick={submitInput} disabled={!inputAnswer.trim()}>
              确认答案
            </Button>
          )}
        </Col>
      )}

      {/* 反馈 */}
      {showFeedback && (
        <Card
          padding={20}
          style={{
            margin: 8,
            marginTop: 16,
            background: lastCorrect ? '#ECFDF5' : '#FEF2F2',
            border: `2px solid ${lastCorrect ? '#58CC02' : '#EF4444'}`,
          }}
        >
          <Col gap={8}>
            <Row gap={8}>
              <Text style={{ fontSize: 24 }}>{lastCorrect ? '🎉' : '😅'}</Text>
              <Text style={{ fontSize: 18, fontWeight: 700, color: lastCorrect ? '#58CC02' : '#EF4444' }}>
                {lastCorrect ? '答对啦！' : '答错了'}
              </Text>
            </Row>
            <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              💡 {question.explanation || `正确答案是：${question.answer}`}
            </Text>
            <Spacer size={8} />
            <Button block size="lg" variant={lastCorrect ? 'primary' : 'secondary'} onClick={nextQuestion}>
              {index + 1 >= total ? '查看结果' : '下一题'}
            </Button>
          </Col>
        </Card>
      )}

      <Spacer size={40} />
    </View>
  )
}
