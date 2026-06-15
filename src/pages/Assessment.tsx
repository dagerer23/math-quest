import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import PixelButton from '@/components/PixelButton'
import { Check, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { saveAssessment as saveAssessmentToBackend } from '@/services/auth'
import { getAssessmentQuestions } from '@/services/content'
import type { Question } from '@/types/models'

export default function Assessment() {
  const navigate = useNavigate()
  const user = useUserStore()
  const [stage, setStage] = useState<'intro' | 'quiz'>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ isCorrect: boolean; userAnswer: string }[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [inputAnswer, setInputAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  // 拉取测评题目
  useEffect(() => {
    if (stage === 'quiz') {
      setLoading(true)
      getAssessmentQuestions(user.profile.targetGrade || 2, 10)
        .then((qs) => {
          setQuestions(qs)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [stage, user.profile.targetGrade])

  const currentQuestion = questions[currentIndex]
  const correctCount = answers.filter(a => a.isCorrect).length
  const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const hasQuestions = questions.length > 0 && currentIndex < questions.length

  const recommendedDifficulty = useMemo(() => {
    if (accuracy >= 80) return 3
    if (accuracy >= 50) return 2
    return 1
  }, [accuracy])

  const startQuiz = () => {
    setStage('quiz')
  }

  const handleSelectOption = (option: string) => {
    if (feedback || !currentQuestion) return
    setSelectedOption(option)
    setInputAnswer('')
  }

  const handleSubmit = () => {
    if (!currentQuestion) return
    const userAnswer = currentQuestion.options ? selectedOption : inputAnswer
    if (!userAnswer) return
    
    const isCorrect = String(currentQuestion.answer) === String(userAnswer)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setAnswers(prev => [...prev, { isCorrect, userAnswer }])
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setInputAnswer('')
      setFeedback(null)
    } else {
      const assessmentData = {
        id: 'assessment_' + Date.now(),
        completedAt: Date.now(),
        score: accuracy,
        recommendedDifficulty,
        answers: questions.map((q, i) => {
          const answer = answers[i]
          return {
            questionId: q.id,
            userAnswer: answer ? answer.userAnswer : '',
            isCorrect: answer ? answer.isCorrect : false,
          }
        }),
      }
      // 立即保存测评数据到本地 store
      user.setAssessment(assessmentData)

      // 异步同步到后端（不阻塞跳转）
      const userId = user.userId || localStorage.getItem('userId')
      if (userId) {
        saveAssessmentToBackend({
          userId,
          ...assessmentData,
        }).catch((err) => {
          console.error('[Assessment] 保存测评到后端失败:', err)
        })
      }

      // 跳转到专门的测评结果页面
      navigate('/assessment-result')
    }
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      {stage === 'intro' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md"
          >
            <div className="text-6xl mb-6">📝</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">水平测评</h1>
            <p className="text-gray-500 mb-8">
              为了给你推荐最适合的题目，让我们先做一个简短的测评。
              一共10道题，大约需要5分钟。
            </p>
            <div className="bg-duolingo-green/10 rounded-2xl p-4 mb-8">
              <div className="font-bold text-duolingo-green mb-2">测评内容</div>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>📊 共10道题</li>
                <li>⏱️ 不计时，无需压力</li>
                <li>🎯 完成后推荐合适难度</li>
              </ul>
            </div>
            <PixelButton variant="green" size="lg" className="w-full" onClick={startQuiz}>
              开始测评
            </PixelButton>
          </motion.div>
        </div>
      )}

      {stage === 'quiz' && !hasQuestions && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">暂无题目</h2>
          <p className="text-gray-500 mb-6 text-center">
            当前年级暂未收录题目，请返回首页重新设置年级。
          </p>
          <PixelButton variant="green" size="lg" onClick={handleGoHome}>
            返回首页
          </PixelButton>
        </div>
      )}

      {stage === 'quiz' && hasQuestions && currentQuestion && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-600">第 {currentIndex + 1} 题 / 共 {questions.length} 题</span>
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <Check size={16} className="text-duolingo-green" />
                  {correctCount}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-duolingo-green transition-all duration-300"
                  style={{ width: `${((currentIndex + (feedback ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="max-w-md mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="pixel-card p-6 mb-6"
                >
                  {currentQuestion.illustration && (
                    <div className="text-4xl text-center mb-4">{currentQuestion.illustration}</div>
                  )}
                  <div className="text-xl font-bold text-gray-800 text-center leading-relaxed">
                    {currentQuestion.prompt}
                  </div>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      'mb-6 p-4 rounded-2xl text-center font-bold',
                      feedback === 'correct' ? 'bg-duolingo-green/10 text-duolingo-green' : 'bg-duolingo-red/10 text-duolingo-red',
                    )}
                  >
                    {feedback === 'correct' ? (
                      <div className="flex items-center justify-center gap-2">
                        <Check size={20} />
                        太棒了！回答正确！
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <XCircle size={20} />
                        正确答案是 {currentQuestion.answer}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {currentQuestion.options && (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOption === option
                    const isCorrectAnswer = String(option) === String(currentQuestion.answer)
                    const showResult = feedback !== null
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectOption(option)}
                        disabled={showResult}
                        className={clsx(
                          'h-16 rounded-2xl font-bold text-lg transition-all',
                          showResult ? (
                            isCorrectAnswer
                              ? 'bg-duolingo-green text-white'
                              : isSelected
                                ? 'bg-duolingo-red text-white'
                                : 'bg-gray-100 text-gray-400'
                          ) : isSelected
                            ? 'bg-duolingo-green text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-duolingo-green/50',
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              {!currentQuestion.options && (
                <div className="mb-4">
                  <input
                    type="number"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    disabled={feedback !== null}
                    placeholder="输入答案"
                    className={clsx(
                      'w-full h-16 px-4 rounded-2xl font-bold text-xl text-center transition-all',
                      feedback ? (
                        feedback === 'correct'
                          ? 'bg-duolingo-green text-white'
                          : 'bg-duolingo-red text-white'
                      ) : 'bg-white text-gray-700 border-2 border-gray-200 focus:border-duolingo-green focus:outline-none',
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border-t border-gray-100">
            <div className="max-w-md mx-auto">
              {!feedback ? (
                <PixelButton
                  variant="green"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!selectedOption && !inputAnswer}
                >
                  确认答案
                </PixelButton>
              ) : (
                <PixelButton
                  variant="green"
                  size="lg"
                  className="w-full"
                  onClick={handleNext}
                >
                  {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
                </PixelButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
