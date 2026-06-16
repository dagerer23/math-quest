import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { Card, CardContent } from '@/components/ui/card'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, Target, Trophy, Calendar, Zap, Flame, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getDailyGoalTemplates, type DailyGoalTemplate } from '@/services/content'
import { toast } from 'sonner'

// 每日目标类型
interface Goal {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  type: 'xp' | 'questions' | 'streak'
  target: number
  reward: { xp: number; coins: number }
  getCurrentProgress: () => number
  completed?: boolean
}

export default function DailyGoals() {
  const user = useUserStore()
  const navigate = useNavigate()

  // 今日目标列表
  const [goals, setGoals] = useState<Goal[]>([])
  const [templates, setTemplates] = useState<DailyGoalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayDate] = useState(new Date().toDateString())

  // 拉取目标模板
  useEffect(() => {
    setLoading(true)
    setError('')
    getDailyGoalTemplates()
      .then((data) => {
        setTemplates(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        setError('加载失败，请稍后重试')
      })
  }, [])

  // 生成每日目标
  useEffect(() => {
    if (templates.length === 0) return

    const iconMap: Record<string, React.ReactNode> = {
      '⚡': <Zap size={24} className="text-primary" />,
      '🎯': <Target size={24} className="text-primary" />,
      '🔥': <Flame size={24} className="text-destructive" />,
    }

    const newGoals: Goal[] = templates.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: iconMap[t.icon] || <Target size={24} className="text-primary" />,
      type: t.type,
      target: t.target,
      reward: { xp: t.rewardXp, coins: t.rewardCoins },
      getCurrentProgress: () => {
        const todayGoal = user.dailyGoals.find((g) => g.id === t.id)
        if (t.type === 'xp') {
          return todayGoal?.completed ? t.target : Math.min(user.dailyXp, t.target)
        }
        if (t.type === 'questions') {
          return todayGoal?.completed ? t.target : Math.min(user.dailyQuestions, t.target)
        }
        if (t.type === 'streak') {
          return todayGoal?.completed ? 1 : 0
        }
        return 0
      },
    }))

    setGoals(newGoals)
  }, [templates, user.dailyXp, user.dailyQuestions, user.dailyGoals])

  // 领取奖励
  const claimReward = (goal: Goal) => {
    // 检查是否已完成
    const progress = goal.getCurrentProgress()
    if (progress >= goal.target) {
      user.addXp(goal.reward.xp)
      user.addCoins(goal.reward.coins)
      
      // 更新目标状态
      const existing = user.dailyGoals.find(g => g.id === goal.id)
      if (!existing) {
        user.addDailyGoal({
          id: goal.id,
          targetXp: goal.reward.xp,
          targetQuestions: goal.target,
          completed: true,
          completedAt: Date.now(),
          reward: goal.reward
        })
      }

      toast.success('🎉 奖励已领取！')
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-3 pb-6 px-4 relative">
      {/* 顶部渐变条 */}
      <div className="h-1 bg-gradient-to-r from-primary via-duolingo-blue to-primary" />

      {/* 顶部 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="size-10 rounded-xl bg-muted grid place-items-center"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-foreground">每日目标</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} />
          {new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>

      {/* 总进度 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-4 bg-gradient-to-br from-duolingo-green/10 to-duolingo-blue/10">
          <CardContent className="p-0">
            <h2 className="font-bold text-lg text-foreground mb-2">今日挑战</h2>
            <p className="text-sm text-muted-foreground mb-3">完成目标获取丰厚奖励</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={(goals.filter(g => g.getCurrentProgress() >= g.target).length / goals.length) * 100}>
                  <ProgressTrack className="h-2.5">
                    <ProgressIndicator className="bg-gradient-to-r from-duolingo-green to-duolingo-blue transition-all duration-500" />
                  </ProgressTrack>
                </Progress>
              </div>
              <div className="font-bold text-primary">
                {goals.filter(g => g.getCurrentProgress() >= g.target).length}/{goals.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 加载错误提示 */}
      {error && !loading && (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">😕</div>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button
            onClick={() => {
              setLoading(true)
              setError('')
              getDailyGoalTemplates()
                .then((data) => {
                  setTemplates(data)
                  setLoading(false)
                })
                .catch(() => {
                  setLoading(false)
                  setError('加载失败，请稍后重试')
                })
            }}
            variant="default"
            size="sm"
          >
            重试
          </Button>
        </div>
      )}

      {/* 目标列表 */}
      <div className="flex flex-col gap-3">
        {!error && goals.map((goal, index) => {
          const progress = goal.getCurrentProgress()
          const completed = progress >= goal.target
          const alreadyClaimed = user.dailyGoals.find(g => g.id === goal.id && g.completed)

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-4 ${completed ? 'bg-primary/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-xl bg-muted grid place-items-center flex-shrink-0">
                    {goal.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-sm ${completed ? 'text-primary' : 'text-foreground'}`}>
                        {goal.title}
                      </h3>
                      {completed && (
                        <CheckCircle size={16} className="text-primary" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {goal.description}
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          进度 {progress}/{goal.target}
                        </span>
                        <span className="text-primary font-medium flex items-center gap-1">
                          <Trophy size={12} />
                          +{goal.reward.xp} XP · +{goal.reward.coins} 金币
                        </span>
                      </div>

                      <Progress value={Math.min((progress / goal.target) * 100, 100)}>
                        <ProgressTrack className="h-2">
                          <ProgressIndicator className={`transition-all duration-500 ${completed ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                        </ProgressTrack>
                      </Progress>
                    </div>
                  </div>
                </div>

                {completed && !alreadyClaimed && (
                  <div className="mt-3">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => claimReward(goal)}
                    >
                      领取奖励
                    </Button>
                  </div>
                )}

                {alreadyClaimed && (
                  <div className="mt-3 text-center text-xs text-primary font-medium">
                    ✓ 已领取奖励
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* 提示卡片 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-3 bg-muted border-border">
          <p className="text-xs text-muted-foreground">
            💡 每日目标会在每天凌晨 0:00 重置，记得及时完成并领取奖励哦！
          </p>
        </Card>
      </motion.div>

    </div>
  )
}
