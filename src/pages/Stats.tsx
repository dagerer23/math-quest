import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getAvatarUrl, getAvatarBorderColor, getInitial, getAvatarBgColor, getAvatarTextColor } from '@/utils/avatar'
import { ArrowLeft, Target, Zap, BookOpen, TrendingUp, Award, Calendar, Flame, Flower2 } from 'lucide-react'
import { getRankInfo, getRankProgress } from '@/utils/rank'
import { getEncouragements, type EncouragementItem } from '@/services/classApi'

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  const days = Math.floor(hrs / 24)
  return `${days}天前`
}

export default function Stats() {
  const navigate = useNavigate()
  const user = useUserStore()
  const [isLoading, setIsLoading] = useState(true)
  const [encouragements, setEncouragements] = useState<EncouragementItem[]>([])
  const [encouragementTotal, setEncouragementTotal] = useState(0)
  const [encouragementLoading, setEncouragementLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!user?.userId) return
    let active = true
    setEncouragementLoading(true)
    getEncouragements(user.userId).then((res) => {
      if (!active) return
      if (res?.success) {
        setEncouragements(res.list || [])
        setEncouragementTotal(res.total || 0)
      }
    }).finally(() => {
      if (active) setEncouragementLoading(false)
    })
    return () => { active = false }
  }, [user?.userId])

  const stats = user.learningStats || {}
  const accuracy = (stats.totalQuestions || 0) > 0
    ? Math.round(((stats.correctQuestions || 0) / stats.totalQuestions) * 100)
    : 0
  const rankInfo = getRankInfo(user.xp, user.systemConfigs || {})
  const rankProgress = getRankProgress(user.xp, user.systemConfigs || {})

  const statCards = [
    { icon: <BookOpen size={18} />, label: '答题总数', value: stats.totalQuestions, iconBg: 'bg-[#E8F9D8]', iconColor: 'text-[#58CC02]' },
    { icon: <Target size={18} />, label: '正确率', value: `${accuracy}%`, iconBg: 'bg-[#E0F4FF]', iconColor: 'text-[#1CB0F6]' },
    { icon: <Zap size={18} />, label: '经验值', value: user.xp, iconBg: 'bg-[#E8F9D8]', iconColor: 'text-[#58CC02]' },
    { icon: <Flame size={18} />, label: '连续天数', value: `${user.streak}天`, iconBg: 'bg-[#FFE4E4]', iconColor: 'text-[#FF4B4B]' },
    { icon: <Calendar size={18} />, label: '学习天数', value: `${stats.totalDays}天`, iconBg: 'bg-[#F3F4F6]', iconColor: 'text-[#9CA3AF]' },
    { icon: <Award size={18} />, label: '当前段位', value: rankInfo.name, iconBg: 'bg-[#FFF5D6]', iconColor: 'text-[#FFC800]' },
  ]

  // 知识点掌握度
  const knowledgeEntries = Object.entries(stats.knowledgeProgress || {})
    .sort(([, a], [, b]) => a - b)
  const hasKnowledge = knowledgeEntries.length > 0

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
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-foreground">学习统计</h1>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* 概览卡片 */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-3 text-center h-full">
                <CardContent className="p-0 flex flex-col justify-between h-full">
                  <div className={`inline-flex items-center justify-center size-8 rounded-[10px] mb-2 ${card.iconBg} ${card.iconColor}`}>
                    {card.icon}
                  </div>
                  <div className="text-lg font-bold text-foreground">{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 正确率进度条 */}
        <Card className="p-4">
          <CardHeader className="p-0 mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">正确率</CardTitle>
              <span className="text-sm font-bold text-primary">{accuracy}%</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Progress value={accuracy}>
              <ProgressTrack className="h-3">
                <ProgressIndicator className="bg-gradient-to-r from-primary to-duolingo-blue" />
              </ProgressTrack>
            </Progress>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>答对 {stats.correctQuestions} 题</span>
              <span>答错 {stats.totalQuestions - stats.correctQuestions} 题</span>
            </div>
          </CardContent>
        </Card>

        {/* 段位进度 */}
        <Card className="p-4">
          <CardHeader className="p-0 mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">段位进度</CardTitle>
              <span className="text-xs text-muted-foreground">{rankInfo.name}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <Award size={28} className="text-amber-500" />
              <div className="flex-1">
                <Progress value={Math.min(100, rankProgress.pct * 100)}>
                  <ProgressTrack className="h-3">
                    <ProgressIndicator className="bg-gradient-to-r from-amber-400 to-amber-500" />
                  </ProgressTrack>
                </Progress>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {rankProgress.current} / {rankProgress.target} XP
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 知识点掌握度 */}
        <Card className="p-4">
          <CardHeader className="p-0 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <CardTitle className="text-sm font-bold text-foreground">知识点掌握度</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {hasKnowledge ? (
              <div className="flex flex-col gap-3">
                {knowledgeEntries.map(([name, progress]) => {
                  const pct = Math.round(progress * 100)
                  const masteryColor = pct < 50 ? 'text-destructive' : pct <= 80 ? 'text-amber-500' : 'text-primary'
                  const barColor = pct < 50 ? 'bg-destructive' : pct <= 80 ? 'bg-amber-500' : 'bg-primary'
                  return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{name}</span>
                      <span className={`text-xs font-bold ${masteryColor}`}>{pct}%</span>
                    </div>
                    <Progress value={pct}>
                      <ProgressTrack className="h-1.5">
                        <ProgressIndicator className={`${barColor} transition-[width] duration-500`} />
                      </ProgressTrack>
                    </Progress>
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <TrendingUp size={48} className="text-muted-foreground/40" />
                </motion.div>
                <p className="text-sm font-bold text-foreground mt-3">暂无知识点数据</p>
                <p className="text-xs text-muted-foreground mt-1">完成更多关卡后，这里会显示知识点掌握情况</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 成就统计 */}
        <Card className="p-4">
          <CardHeader className="p-0 mb-3">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <CardTitle className="text-sm font-bold text-foreground">成就</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{user.achievements.length}</span>
              <span className="text-xs text-muted-foreground">已解锁</span>
            </div>
            {user.achievements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {user.achievements.slice(0, 8).map((item) => {
                  const achId = typeof item === 'string' ? item : item?.id
                  const meta = user.achievementsMeta.find(a => a.id === achId)
                  return (
                    <Badge key={achId} variant="secondary" className="text-[10px] font-bold">
                      {meta?.name || achId}
                    </Badge>
                  )
                })}
                {user.achievements.length > 8 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{user.achievements.length - 8} 更多
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 收到的鼓励 */}
        <Card className="p-4">
          <CardHeader className="p-0 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flower2 size={16} className="text-pink-500" />
                <CardTitle className="text-sm font-bold text-foreground">收到的鼓励</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">共 {encouragementTotal} 朵</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {encouragementLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : encouragements.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {encouragements.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-border/40"
                  >
                    <div className="h-9 w-9 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: getAvatarBorderColor(item.fromUserName || '同学') }}>
                      <img src={getAvatarUrl(item.fromUserName || '同学')} alt="" className="w-full h-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
                      <div className="hidden w-full h-full items-center justify-center text-sm font-bold" style={{ background: getAvatarBgColor(item.fromUserName || '同学'), color: getAvatarTextColor(item.fromUserName || '同学') }}>
                        {getInitial(item.fromUserName || '同学')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground truncate">
                          {item.fromUserName || '同学'}
                        </span>
                        <Flower2 size={14} className="text-purple-400" />
                      </div>
                      {item.context && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.context}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Flower2 size={48} className="text-purple-300" />
                </motion.div>
                <p className="text-sm font-bold text-foreground mt-3">还没有收到鼓励</p>
                <p className="text-xs text-muted-foreground mt-1">快邀请同学加入班级吧</p>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </motion.div>
  )
}
