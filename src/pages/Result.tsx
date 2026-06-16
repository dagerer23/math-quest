import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useSessionStore } from '@/store/useSessionStore'
import { useUserStore } from '@/store/useUserStore'
import StarRow from '@/components/StarRow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, Sparkles, CheckCircle2, Repeat, Trophy, Star, Zap, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { playSound } from '@/utils/sound'
import { generateQuestions } from '@/services/content'

// 花式赞美文案库
const PRAISES = {
  perfect: [
    '太棒了！完美通关！',
    '简直是数学天才！',
    '全对！你太厉害了！',
    '完美表现！',
    '零失误！这就是实力！'
  ],
  excellent: [
    '非常棒！',
    '优秀！继续保持！',
    '太厉害了！',
    '优秀的表现！',
    '做得很好！'
  ],
  good: [
    '不错哦！',
    '很棒！继续加油！',
    '做得好！',
    '表现不错！',
    '很棒的尝试！'
  ],
  try: [
    '别灰心，继续努力！',
    '加油！下次会更好！',
    '没关系，多多练习！',
    '坚持就是胜利！',
    '继续加油！'
  ]
}

// 装饰性 emoji 雨
const DECORATIONS = ['🎉', '✨', '🌟', '💫', '⭐', '🎊', '🎈', '🏆']

export default function Result() {
  const navigate = useNavigate()
  const session = useSessionStore()
  const user = useUserStore()
  const achievementsMeta = useUserStore((s) => s.achievementsMeta)
  const [starStage, setStarStage] = useState(0)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [praiseText, setPraiseText] = useState('')

  const record = session.record
  const level = session.level

  // 从配置读取赞美阈值
  const perfectThreshold = Number(user.systemConfigs['result.praise.perfect']) || 100
  const excellentThreshold = Number(user.systemConfigs['result.praise.excellent']) || 80
  const goodThreshold = Number(user.systemConfigs['result.praise.good']) || 60

  // 根据正确率选择赞美文案
  const getPraise = (accuracy: number) => {
    let category: keyof typeof PRAISES
    if (accuracy >= perfectThreshold) category = 'perfect'
    else if (accuracy >= excellentThreshold) category = 'excellent'
    else if (accuracy >= goodThreshold) category = 'good'
    else category = 'try'
    
    const texts = PRAISES[category]
    return texts[Math.floor(Math.random() * texts.length)]
  }

  useEffect(() => {
    if (!record) return
    
    const accuracy = Math.round((record.correctCount / record.totalCount) * 100)
    setPraiseText(getPraise(accuracy))
    
    // 显示彩纸效果（至少1颗星才显示）
    if (record.stars >= 1 && accuracy >= excellentThreshold) {
      setTimeout(() => setShowConfetti(true), 500)
    }
    
    const t1 = setTimeout(() => {
      if (record.stars >= 1) { setStarStage(1); playSound('star', user.settings.sound) }
    }, 600)
    const t2 = setTimeout(() => {
      if (record.stars >= 2) { setStarStage(2); playSound('star', user.settings.sound) }
    }, 1200)
    const t3 = setTimeout(() => {
      if (record.stars >= 3) { setStarStage(3); playSound('star', user.settings.sound) }
    }, 1800)
    const t4 = setTimeout(() => {
      if (user.achievements.length > 0) setShowAchievements(true)
    }, 2400)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [record, user.settings.sound, user.achievements.length])

  if (!record || !level) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="h-1 bg-gradient-to-r from-primary via-duolingo-blue to-primary" />
        <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-foreground">结算</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">没有可显示的结算数据</p>
            <Button className="mt-4" onClick={() => navigate('/')}>返回首页</Button>
          </div>
        </div>
      </div>
    )
  }

  const wrongAnswers = record.answers
    .map((a, i) => ({ ...a, question: session.questions[i] }))
    .filter((a) => !a.isCorrect)

  const accuracy = Math.round((record.correctCount / record.totalCount) * 100)

  const restart = async () => {
    const userMastery = user.learningStats.knowledgeProgress
    const recentIds = user.mistakeIds
    const questions = await generateQuestions(level.id, userMastery, recentIds)
    if (!questions || questions.length === 0) {
      session.start(level, level.questions)
    } else {
      session.start(level, questions)
    }
    navigate(`/battle/${level.id}`)
  }

  return (
    <motion.div
      className="min-h-screen bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-1 bg-gradient-to-r from-primary via-duolingo-blue to-primary" />

      {/* 头部 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground">结算</h1>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-4 overflow-y-auto">
      {/* 彩纸效果 */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: -50,
                rotate: 0,
                scale: 0.5 + Math.random() * 0.5
              }}
              animate={{
                y: window.innerHeight + 50,
                rotate: 360 + Math.random() * 720,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                ease: 'linear',
                delay: Math.random() * 0.5
              }}
              className="absolute text-2xl"
            >
              {DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)]}
            </motion.div>
          ))}
        </div>
      )}

      <motion.section
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <Card className="p-5 text-center relative overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute top-0 left-0 size-20 bg-primary/10 rounded-full -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 right-0 size-24 bg-primary/10 rounded-full translate-y-1/2 translate-x-1/2" />
        <div className="absolute top-8 right-8 text-3xl text-muted-foreground/20">
          <Star />
        </div>
        <div className="absolute bottom-12 left-6 text-2xl text-muted-foreground/20">
          <Zap />
        </div>

        <div className="text-xs font-bold text-muted-foreground">{level.chapter}</div>
        
        {/* 动态标题 */}
        <div className="font-bold text-xl mt-2 text-foreground">
          {accuracy === 100 ? '🏆 PERFECT!' : record.stars >= 1 ? '🎉 VICTORY!' : '💪 继续加油!'}
        </div>

        {/* 花式赞美 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground mt-2"
        >
          {praiseText}
        </motion.div>

        <div className="flex justify-center gap-1.5 my-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180, y: 20 }}
              animate={starStage > i ? { scale: 1, rotate: 0, y: 0 } : { scale: 1, rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12, delay: i * 0.1 }}
              className="size-12 grid place-items-center relative"
            >
              {/* 星星发光效果 */}
              {starStage > i && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/20 rounded-full"
                />
              )}
              {starStage > i ? (
                <StarRow earned={1} size="md" />
              ) : (
                <Star size={28} className="text-muted-foreground/30" />
              )}
            </motion.div>
          ))}
        </div>

        {/* 正确率显示 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="relative"
        >
          <div className={clsx(
            "text-5xl font-bold",
            accuracy === 100 ? "text-primary" : accuracy >= 60 ? "text-foreground" : "text-destructive"
          )}>
            {accuracy}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">正确率 · {record.correctCount} / {record.totalCount}</div>
        </motion.div>

        {/* 奖励卡片 */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <RewardBadge icon={<Sparkles size={16} className="text-primary" />} label="XP" value={`+${record.xpGained}`} color="purple" />
          <RewardBadge icon={<Coins size={16} className="text-primary" />} label="金币" value={`+${record.coinsGained}`} color="gold" />
          <RewardBadge icon={<Zap size={16} className="text-primary" />} label="连击" value={`×${record.comboMax}`} color="red" />
        </div>
        </Card>
      </motion.section>

      {showAchievements && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4">
          <div className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
            <Trophy size={14} className="text-primary" />
            🎉 解锁成就
          </div>
          <div className="grid grid-cols-2 gap-2">
            {user.achievements.slice(-3).map((a) => {
              const ach = achievementsMeta.find((x) => x.id === a.id)
              if (!ach) return null
              return (
                <motion.div
                  key={a.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-muted rounded-xl p-2 flex items-center gap-2 border border-border"
                >
                  <div className="text-xl">{ach.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{ach.name}</div>
                    <div className="text-xs text-muted-foreground">{ach.description}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          </Card>
        </motion.section>
      )}

      <Card className="p-4">
        <div className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">📝 错题回顾</div>
        {wrongAnswers.length === 0 ? (
          <div className="text-center text-muted-foreground py-5">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            >
              <CheckCircle2 className="mx-auto text-primary" size={36} />
            </motion.div>
            <p className="mt-2 text-sm font-medium text-primary">太棒了！零失误完美通关 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">你真是太厉害了！</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {wrongAnswers.map((a, i) => (
              <li key={i} className="bg-muted rounded-xl p-2.5 border border-border">
                <div className="text-xs text-foreground/80">
                  <span className="text-destructive font-bold">第 {i + 1} 题 · </span>
                  {a.question?.prompt}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  你的答案：<span className="text-destructive">{a.userAnswer || '未作答'}</span> · 正确答案：<span className="text-primary font-medium">{a.question?.answer}</span>
                </div>
                {a.question?.explanation && (
                  <div className="mt-1 text-xs text-primary/80 bg-primary/5 rounded-lg p-2">
                    💡 {a.question.explanation}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={() => navigate('/')}>
          返回首页
        </Button>
        <Button size="lg" onClick={restart} className="gap-2">
          <Repeat size={16} /> 再来一局
        </Button>
      </div>

      {wrongAnswers.length > 0 && (
        <div className="text-center text-xs text-muted-foreground bg-card rounded-xl p-2.5 border border-border">
          错题已自动加入 <button className="text-primary underline font-medium" onClick={() => navigate('/mistakes')}>错题本</button>，可以复仇再战！
        </div>
      )}
      </div>
    </motion.div>
  )
}

function RewardBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'purple' | 'gold' | 'red' }) {
  const bgClass = {
    purple: 'bg-muted',
    gold: 'bg-muted',
    red: 'bg-muted',
  }
  const variant = {
    purple: 'secondary' as const,
    gold: 'outline' as const,
    red: 'destructive' as const,
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className={`${bgClass[color]} rounded-xl py-2.5 flex flex-col items-center border border-border`}
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
      >
        <Badge variant={variant[color]} className="mt-1 font-bold text-sm">
          {value}
        </Badge>
      </motion.div>
    </motion.div>
  )
}
