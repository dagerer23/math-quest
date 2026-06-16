import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { useSessionStore } from '@/store/useSessionStore'
import { getLevelsByGrade, getLevelDetail, getQuestionsByIds } from '@/services/content'
import PixelButton from '@/components/PixelButton'
import { Trophy, Home, Check, XCircle } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

export default function AssessmentResult() {
  const navigate = useNavigate()
  const user = useUserStore()
  const startSession = useSessionStore(s => s.start)
  const [loading, setLoading] = useState(false)

  const assessment = user.assessment

  if (!assessment) {
    return (
      <div className="space-y-3 pt-3 pb-6 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-xl font-bold text-foreground mb-2">测评数据不存在</h2>
          <p className="text-muted-foreground mb-6">请重新进行水平测评</p>
          <PixelButton variant="green" size="lg" onClick={() => navigate('/assessment')}>
            开始测评
          </PixelButton>
        </div>
      </div>
    )
  }

  const accuracy = assessment.score
  const correctCount = assessment.answers.filter(a => a.isCorrect).length
  const totalCount = assessment.answers.length
  const recommendedDifficulty = assessment.recommendedDifficulty

  // 从配置读取测评奖励
  const assessmentRewardXp = Number(user.systemConfigs['assessment.reward_xp']) || 100
  const assessmentRewardCoins = Number(user.systemConfigs['assessment.reward_coins']) || 50
  // 从配置读取表情阈值
  const excellentThreshold = Number(user.systemConfigs['assessment.emoji_excellent']) || 80
  const goodThreshold = Number(user.systemConfigs['assessment.emoji_good']) || 50

  // 获取错题详情（包含正确答案）
  const [wrongAnswers, setWrongAnswers] = useState<{ questionId: string; userAnswer: string; correctAnswer: string }[]>([])
  useEffect(() => {
    if (!assessment) return
    const wrong = assessment.answers.filter(a => !a.isCorrect)
    if (wrong.length === 0) return
    const questionIds = wrong.map(a => a.questionId)
    getQuestionsByIds(questionIds).then(questions => {
      const answerMap = new Map(questions.map(q => [q.id, String(q.answer)]))
      setWrongAnswers(wrong.map(a => ({
        questionId: a.questionId,
        userAnswer: a.userAnswer,
        correctAnswer: answerMap.get(a.questionId) || '未知',
      })))
    })
  }, [assessment])

  const handleStartLearning = useCallback(async () => {
    setLoading(true)
    const grade = user.profile.targetGrade || 2
    // 1. 先拉取同年级精简版关卡列表
    const levels = await getLevelsByGrade(grade)
    if (levels.length === 0) {
      setLoading(false)
      navigate('/')
      return
    }
    // 2. 取第一个关卡的完整详情
    const targetLevel = await getLevelDetail(levels[0].id)
    if (!targetLevel) {
      setLoading(false)
      navigate('/')
      return
    }
    // 3. 确保已解锁
    if (!user.unlockedLevels.includes(targetLevel.id)) {
      user.unlockedLevels.push(targetLevel.id)
    }
    startSession(targetLevel, targetLevel.questions)
    setLoading(false)
    navigate(`/battle/${targetLevel.id}`)
  }, [navigate, startSession, user])

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="space-y-3 pt-3 pb-6 px-4">
      {/* 顶部动画区域 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0], 
            scale: [1, 1.1, 1] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
          className="inline-block"
        >
          <div className="text-6xl mb-3">
            {accuracy >= excellentThreshold ? '🏆' : accuracy >= goodThreshold ? '🎉' : '💪'}
          </div>
        </motion.div>
        
        <h1 className="text-xl font-bold text-foreground mb-2">测评完成！</h1>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="relative inline-block"
        >
          <div 
            className="text-5xl font-bold my-4"
            style={{ 
              color: accuracy === 100 ? '#58CC02' : accuracy >= excellentThreshold ? '#1CB0F6' : accuracy >= goodThreshold ? '#FFC800' : '#FF4B4B'
            }}
          >
            {accuracy}%
          </div>
        </motion.div>
        
        <p className="text-muted-foreground text-sm">
          你答对了 {correctCount} / {totalCount} 题
        </p>
      </motion.div>

      {/* 推荐难度卡片 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="pixel-card p-4"
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="text-xl">📊</div>
          <div>
            <div className="font-bold text-foreground text-sm">推荐难度</div>
            <div className="text-xs text-muted-foreground">为你推荐最适合的题目难度</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {[1, 2, 3].map((level, index) => (
            <motion.div
              key={level}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`py-2.5 rounded-xl text-center font-bold text-xs transition-all ${
                level === recommendedDifficulty
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {level === 1 ? '简单' : level === 2 ? '中等' : '困难'}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 奖励卡片 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-duolingo-green/10 to-duolingo-blue/10 rounded-2xl p-4 border border-duolingo-green/20"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Trophy size={18} className="text-duolingo-gold" />
          <div className="font-bold text-foreground text-sm">奖励</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-duolingo-purple">{assessmentRewardXp} XP</span>
            <span className="text-muted-foreground">+</span>
            <span className="font-bold text-duolingo-gold">{assessmentRewardCoins} 金币</span>
          </div>
        </div>
      </motion.div>

      {/* 错题回顾 */}
      {wrongAnswers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pixel-card p-4"
        >
          <div className="font-bold text-sm text-foreground mb-2.5 flex items-center gap-2">
            <XCircle size={14} className="text-destructive" />
            错题回顾
          </div>
          <div className="space-y-2">
            {wrongAnswers.map((a, i) => (
              <div key={a.questionId} className="bg-muted rounded-xl p-2.5 border border-border">
                <div className="text-xs text-muted-foreground mb-1">第 {i + 1} 题</div>
                <div className="text-xs text-muted-foreground">
                  你的答案: <span className="text-destructive">{a.userAnswer || '未作答'}</span>
                  {' · '}
                  正确答案: <span className="text-primary font-medium">{a.correctAnswer}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 全对奖励提示 */}
      {accuracy === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-duolingo-green/10 to-duolingo-yellow/10 rounded-2xl p-3.5 text-center"
        >
          <Check size={22} className="mx-auto text-duolingo-green mb-2" />
          <div className="text-xs font-bold text-duolingo-green">完美！全对通过！</div>
        </motion.div>
      )}

      {/* 底部按钮区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-2.5"
      >
        <PixelButton 
          variant="green" 
          size="lg" 
          className="w-full" 
          onClick={handleStartLearning}
          icon={<Trophy size={18} />}
        >
          开始学习
        </PixelButton>
        <PixelButton 
          variant="white" 
          size="lg" 
          className="w-full" 
          onClick={handleGoHome}
          icon={<Home size={18} />}
        >
          返回首页
        </PixelButton>
      </motion.div>
    </div>
  )
}
