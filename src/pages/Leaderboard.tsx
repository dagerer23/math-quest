import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { motion } from 'framer-motion'
import { Crown, Medal, Trophy, Star, Sparkles, Award, Target, ChevronRight, Zap, Gem, Loader2, Users, Globe2, Flower2 } from 'lucide-react'
import clsx from 'clsx'
import { RANK_COLORS, getRankFromXp, getRankInfo, getRankProgress, getNextRankInfo } from '@/utils/rank'
import { getAvatarUrl, getAvatarBorderColor, getInitial, getAvatarBgColor, getAvatarTextColor } from '@/utils/avatar'
import { getLeaderboard, type LeaderboardUser } from '@/services/content'
import * as classApi from '@/services/classApi'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════
// 排行榜类型（兼容 API 返回字段）
// ═══════════════════════════════════════════════════════════════════
type RankUser = LeaderboardUser

// ═══════════════════════════════════════════════════════════════════
// 段位系统
// ═══════════════════════════════════════════════════════════════════
type RankName = '青铜' | '白银' | '黄金' | '铂金' | '钻石' | '王者'

const RANK_DETAILS: Record<RankName, {
  label: string
  min: number
  max: number
  color: string
  bg: string
  border: string
  ring: string
  shadow: string
  icon: typeof Crown
  iconSize: number
}> = {
  '青铜': { label: '青铜', min: 0, max: 499, color: '#A87147', bg: 'from-amber-100 to-orange-50', border: 'border-amber-200', ring: 'ring-amber-300', shadow: 'shadow-amber-200/50', icon: Medal, iconSize: 20 },
  '白银': { label: '白银', min: 500, max: 1499, color: '#7C8591', bg: 'from-slate-100 to-gray-50', border: 'border-slate-200', ring: 'ring-slate-300', shadow: 'shadow-slate-200/50', icon: Medal, iconSize: 20 },
  '黄金': { label: '黄金', min: 1500, max: 3499, color: '#E5A100', bg: 'from-yellow-100 to-amber-50', border: 'border-yellow-200', ring: 'ring-yellow-400', shadow: 'shadow-yellow-300/50', icon: Star, iconSize: 20 },
  '铂金': { label: '铂金', min: 3500, max: 6499, color: '#7B5BFF', bg: 'from-violet-100 to-purple-50', border: 'border-violet-200', ring: 'ring-violet-400', shadow: 'shadow-violet-300/50', icon: Gem, iconSize: 20 },
  '钻石': { label: '钻石', min: 6500, max: 9999, color: '#0891B2', bg: 'from-cyan-100 to-sky-50', border: 'border-cyan-200', ring: 'ring-cyan-400', shadow: 'shadow-cyan-300/50', icon: Gem, iconSize: 22 },
  '王者': { label: '王者', min: 10000, max: Infinity, color: '#E11D48', bg: 'from-rose-100 via-red-50 to-orange-50', border: 'border-rose-200', ring: 'ring-rose-400', shadow: 'shadow-rose-300/50', icon: Crown, iconSize: 22 },
}

// ═══════════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════════
export default function Leaderboard() {
  const user = useUserStore()
  const [tab, setTab] = useState<'global' | 'classmates' | 'rank'>('classmates')
  const [loading, setLoading] = useState(true)
  const [classmatesLoading, setClassmatesLoading] = useState(false)
  const [rankingData, setRankingData] = useState<RankUser[]>([])
  const [classmatesData, setClassmatesData] = useState<ClassMemberItem[]>([])
  const [sentFlowers, setSentFlowers] = useState<Set<string>>(new Set())
  const [className, setClassName] = useState<string>('')
  const myNickname = user.profile.nickname || '我'
  const myXp = user.xp
  const myRank = getRankFromXp(myXp)

  type ClassMemberItem = {
    userId: string
    nickname: string
    avatar: string
    targetGrade: number
    xp: number
    isMe?: boolean
  }

  useEffect(() => {
    if (tab === 'global') {
      setLoading(true)
      getLeaderboard(50, user.profile.targetGrade)
        .then(data => setRankingData(data))
        .catch(() => setRankingData([]))
        .finally(() => setLoading(false))
    } else if (tab === 'classmates') {
      loadClassmates()
    }
  }, [tab])

  async function loadClassmates() {
    if (!user.userId) return
    setClassmatesLoading(true)
    try {
      const res = await classApi.getClassMembers(user.userId)
      if (res.success && res.members.length > 0) {
        const formatted: ClassMemberItem[] = res.members
          .map(m => ({
            userId: m.userId,
            nickname: m.nickname || '同学',
            avatar: m.avatar || '😊',
            targetGrade: m.targetGrade || 0,
            xp: m.xp || 0,
            isMe: m.userId === user.userId,
          }))
          .sort((a, b) => b.xp - a.xp)
        setClassmatesData(formatted)
        setClassName(res.className || '班级')
      } else {
        setClassmatesData([])
        setClassName('')
      }
    } catch {
      setClassmatesData([])
    } finally {
      setClassmatesLoading(false)
    }
  }

  const handleSendFlower = async (toUserId: string, toNickname: string) => {
    if (!user.userId) return
    if (sentFlowers.has(toUserId)) {
      toast.info('今天已给 TA 送过花啦 🌸')
      return
    }
    const res = await classApi.sendEncouragement(user.userId, toUserId, '加油！')
    if (res.success) {
      setSentFlowers(prev => new Set(prev).add(toUserId))
      toast.success(`已给 ${toNickname} 送上一朵花 🌸`)
    } else {
      toast.error(res.message || '送花失败')
    }
  }

  // 把当前用户信息注入全局榜（若榜上没有则追加到末尾）
  const rawList = tab === 'global' ? rankingData : []
  const meInList = rawList.find(u => u.nickname === myNickname)
  const list = meInList
    ? rawList
    : [
        ...rawList,
        {
          rank: rawList.length + 1,
          userId: 'me',
          nickname: myNickname,
          avatar: user.profile.avatar || '🧒',
          targetGrade: user.profile.targetGrade || 2,
          totalXp: myXp,
          totalSessions: 0,
          correctRate: 0,
        },
      ]

  const me = list.find(u => u.nickname === myNickname)
  const myIndex = list.findIndex(u => u.nickname === myNickname)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 顶部渐变条 */}
      <div className="h-1 bg-gradient-to-r from-primary via-duolingo-blue to-primary" />

      {/* 头部 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-primary" />
          巅峰榜单
        </h1>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">

      {/* ═══ 分段 Tab 切换器 ═══ */}
      <Tabs defaultValue="classmates" value={tab} onValueChange={(v) => setTab(v as 'global' | 'classmates' | 'rank')}>
        <TabsList className="w-full rounded-xl bg-muted p-1 grid grid-cols-3 gap-1">
          <TabsTrigger
            value="classmates"
            className={clsx(
              'h-10 rounded-lg text-sm font-medium transition-all',
              tab === 'classmates'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Users size={16} className="mr-1.5" />
            同学
          </TabsTrigger>
          <TabsTrigger
            value="global"
            className={clsx(
              'h-10 rounded-lg text-sm font-medium transition-all',
              tab === 'global'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Globe2 size={16} className="mr-1.5" />
            总榜
          </TabsTrigger>
          <TabsTrigger
            value="rank"
            className={clsx(
              'h-10 rounded-lg text-sm font-medium transition-all',
              tab === 'rank'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Award size={16} className="mr-1.5" />
            段位
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 我的段位信息卡 */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl grid place-items-center border-2 border-border"
            style={{
              background: `linear-gradient(135deg, ${RANK_COLORS[myRank]}15, ${RANK_COLORS[myRank]}30)`,
            }}
          >
            {(() => {
              const Icon = RANK_DETAILS[myRank].icon
              return <Icon size={24} style={{ color: RANK_COLORS[myRank] }} strokeWidth={2.5} />
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold" style={{ color: RANK_COLORS[myRank] }}>
                {myRank}段位
              </span>
              <span className="text-xs text-muted-foreground">LV.{Math.floor(myXp / 500) + 1}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {myXp.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">XP</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <RankProgressBar xp={myXp} />
        </div>
      </Card>

      {/* ═══ 内容区 ═══ */}
      {tab === 'classmates' ? (
        <div className="space-y-3">
          {classmatesLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                </Card>
              ))}
            </div>
          ) : classmatesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users size={48} className="text-muted-foreground" />
              <div className="text-center">
                <div className="text-base font-bold text-muted-foreground">加入班级后查看同学排行</div>
                <div className="text-xs text-muted-foreground mt-1">去「我的」页面创建或加入班级</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                className="mt-2 gap-1.5"
              >
                <Users size={14} /> 加入班级
              </Button>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground px-1 flex items-center justify-between">
                <span>{className || '班级'} · 共 {classmatesData.length} 人</span>
                <span>按 XP 排序</span>
              </div>
              <div className="space-y-2">
                {classmatesData.slice(0, 3).map((u, idx) => {
                  const rank = idx + 1
                  const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#64748b' : '#d97706'
                  return (
                    <Card key={u.userId} className={clsx('p-3 transition-all', u.isMe && 'border-primary/30 bg-primary/5')}>
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx('w-8 h-8 rounded-lg grid place-items-center font-bold text-sm', rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800')}
                          style={{ color: rankColor }}
                        >
                          {rank}
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: getAvatarBorderColor(u.nickname || '同学') }}>
                          <img src={getAvatarUrl(u.nickname || '同学')} alt="" className="w-full h-full" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden') }} />
                          <div className="hidden w-full h-full items-center justify-center text-sm font-bold" style={{ background: getAvatarBgColor(u.nickname || '同学'), color: getAvatarTextColor(u.nickname || '同学') }}>
                            {getInitial(u.nickname || '同学')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                            {u.nickname}
                            {u.isMe && <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary/40 text-primary/80">我</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.targetGrade}年级</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-foreground tabular-nums">{u.xp.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">XP</div>
                        </div>
                        {!u.isMe && (
                          <Button
                            size="sm"
                            variant={sentFlowers.has(u.userId) ? 'default' : 'outline'}
                            onClick={() => handleSendFlower(u.userId, u.nickname)}
                            disabled={sentFlowers.has(u.userId)}
                            className="shrink-0 gap-1 h-8 px-2"
                          >
                            <Flower2 size={14} className="text-pink-500" />
                            {sentFlowers.has(u.userId) ? '已送' : '送花'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
                {classmatesData.length > 3 && classmatesData.slice(3).map((u, idx) => {
                  const rank = idx + 4
                  return (
                    <Card key={u.userId} className={clsx('p-3 transition-all', u.isMe && 'border-primary/30 bg-primary/5')}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg grid place-items-center font-bold text-sm" style={{ background: getAvatarBgColor(u.nickname || '同学'), color: getAvatarTextColor(u.nickname || '同学') }}>{rank}</div>
                        <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: getAvatarBorderColor(u.nickname || '同学') }}>
                          <img src={getAvatarUrl(u.nickname || '同学')} alt="" className="w-full h-full" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden') }} />
                          <div className="hidden w-full h-full items-center justify-center text-sm font-bold" style={{ background: getAvatarBgColor(u.nickname || '同学'), color: getAvatarTextColor(u.nickname || '同学') }}>
                            {getInitial(u.nickname || '同学')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                            {u.nickname}
                            {u.isMe && <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary/40 text-primary/80">我</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.targetGrade}年级</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground tabular-nums">{u.xp.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">XP</div>
                        </div>
                        {!u.isMe && (
                          <Button
                            size="sm"
                            variant={sentFlowers.has(u.userId) ? 'default' : 'outline'}
                            onClick={() => handleSendFlower(u.userId, u.nickname)}
                            disabled={sentFlowers.has(u.userId)}
                            className="shrink-0 gap-1 h-8 px-2"
                          >
                            <Flower2 size={14} className="text-pink-500" />
                            {sentFlowers.has(u.userId) ? '已送' : '送花'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      ) : tab === 'global' ? (
        <div className="space-y-5">
          {loading ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[0, 1, 2].map((i) => (
                  <Card key={i} className="p-3 text-center">
                    <Skeleton className="w-8 h-8 mx-auto rounded-full mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </Card>
                ))}
              </div>
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                </Card>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Trophy size={48} className="text-muted-foreground" />
              <div className="text-center">
                <div className="text-base font-bold text-muted-foreground">暂无排行数据</div>
                <div className="text-xs text-muted-foreground mt-1">完成关卡后来这里看看</div>
              </div>
            </div>
          ) : (
            <>
              <Top3Podium list={list} />

                {/* ── 4 名以后的榜单 ── */}
                <div className="space-y-2">
                  {list.slice(3).map((u, idx) => {
                    const rank = idx + 4
                    const userRank = getRankFromXp(u.totalXp)
                    const rankColor = RANK_COLORS[userRank]
                    const isMe = u.nickname === myNickname
                    return (
                      <motion.div
                        key={u.userId || u.nickname}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <Card className={clsx(
                          'p-3 transition-all',
                          isMe ? 'border-primary/30 bg-primary/5' : '',
                        )}>
                          <div className={clsx('flex items-center gap-3', isMe && 'pl-4')}>
                            {isMe && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                            )}
                            <div className={clsx(
                              'w-8 h-8 rounded-lg grid place-items-center font-bold text-sm',
                            )} style={{ background: rankColor + '18', color: rankColor }}>
                              {rank}
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: getAvatarBorderColor(u.nickname || '同学') }}>
                              <img src={getAvatarUrl(u.nickname || '同学')} alt="" className="w-full h-full" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden') }} />
                              <div className="hidden w-full h-full items-center justify-center text-sm font-bold" style={{ background: getAvatarBgColor(u.nickname || '同学'), color: getAvatarTextColor(u.nickname || '同学') }}>
                                {getInitial(u.nickname || '同学')}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-sm text-foreground truncate">
                                  {u.nickname}
                                </span>
                                {isMe && (
                                  <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                                    我
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5">
                                  <Target size={10} />
                                  {u.targetGrade || 1} 年级
                                </span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span style={{ color: rankColor }} className="font-bold">
                                  {userRank}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-sm text-foreground">
                                {u.totalXp.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">XP</div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                {/* ── 我的排名卡 ── */}
                {me && myIndex >= 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="p-4 border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-xl border-2 border-primary/20 overflow-hidden shrink-0" style={{ borderColor: getAvatarBorderColor(myNickname) }}>
                          <img src={getAvatarUrl(myNickname)} alt="" className="w-full h-full" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden') }} />
                          <div className="hidden w-full h-full items-center justify-center text-base font-bold" style={{ background: getAvatarBgColor(myNickname), color: getAvatarTextColor(myNickname) }}>
                            {getInitial(myNickname)}
                          </div>
                          <div className="absolute -top-2 -left-2 w-7 h-7 rounded-lg bg-primary border-2 border-background grid place-items-center text-xs font-bold text-primary-foreground">
                            #{myIndex + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-0.5">我的排名</div>
                          <div className="font-bold text-foreground mb-1">{myNickname}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Zap size={10} className="text-primary" />
                            <span>{myXp.toLocaleString()} XP</span>
                            <span className="text-muted-foreground/50">·</span>
                            <span>{myRank}段位</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </div>
        ) : (
          <RankTab currentXp={myXp} />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Top 3 领奖台组件
// ═══════════════════════════════════════════════════════════════════
function Top3Podium({ list }: { list: RankUser[] }) {
  const top3 = list.slice(0, 3)
  if (top3.length === 0) return null

  // 领奖台顺序：2 1 3
  const positions = [
    { rank: 2, height: 'h-28', label: '亚军', accent: '#B0B8C4', accentSoft: 'rgba(176,184,196,0.15)', icon: Medal, textColor: '#6B7280', ringColor: 'ring-slate-300' },
    { rank: 1, height: 'h-36', label: '冠军', accent: '#FFC800', accentSoft: 'rgba(255,200,0,0.2)', icon: Crown, textColor: '#C78A00', ringColor: 'ring-yellow-400' },
    { rank: 3, height: 'h-24', label: '季军', accent: '#D97706', accentSoft: 'rgba(217,119,6,0.15)', icon: Medal, textColor: '#92400E', ringColor: 'ring-amber-400' },
  ]

  return (
    <div className="relative pt-6">
      {/* 背景装饰 */}
      <div className="absolute inset-x-0 top-8 bottom-0 bg-gradient-to-b from-yellow-50/80 to-transparent rounded-3xl -z-10" />

      <div className="grid grid-cols-3 gap-2 items-end px-1">
        {positions.map((pos, idx) => {
          const user = top3[pos.rank - 1]
          if (!user) return <div key={pos.rank} className="invisible" />
          const Icon = pos.icon
          const userRank = getRankFromXp(user.totalXp)

          return (
            <motion.div
              key={pos.rank}
              initial={{ y: 40 + pos.rank * 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.5, type: 'spring' }}
              className="flex flex-col items-center"
            >
              {/* 头像与皇冠 */}
              <div className="relative mb-2">
                <div
                  className={clsx(
                    'w-16 h-16 rounded-2xl bg-white border-2 shadow-lg overflow-hidden',
                    pos.ringColor,
                  )}
                  style={{ boxShadow: `0 8px 24px ${pos.accent}30`, borderColor: getAvatarBorderColor(user.nickname || '同学') }}
                >
                  <img src={getAvatarUrl(user.nickname || '同学')} alt="" className="w-full h-full" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden') }} />
                  <div className="hidden w-full h-full items-center justify-center text-base font-bold" style={{ background: getAvatarBgColor(user.nickname || '同学'), color: getAvatarTextColor(user.nickname || '同学') }}>
                    {getInitial(user.nickname || '同学')}
                  </div>
                </div>
                {pos.rank === 1 && (
                  <motion.div
                    animate={{ y: [0, -4, 0], rotate: [-3, 3, -3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-yellow-400 border-2 border-white grid place-items-center shadow-lg"
                  >
                    <Icon size={18} className="text-white" strokeWidth={2.5} fill="currentColor" />
                  </motion.div>
                )}
                {pos.rank !== 1 && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full grid place-items-center text-white text-[10px] font-bold shadow-md border-2 border-white"
                    style={{ background: pos.accent }}
                  >
                    {pos.rank}
                  </div>
                )}
              </div>

              {/* 昵称 */}
              <div className="text-xs font-bold text-foreground truncate max-w-[80px] mb-0.5">
                {user.nickname}
              </div>
              <div className="text-[10px] font-bold mb-2" style={{ color: pos.textColor }}>
                {pos.label}
              </div>

              {/* XP */}
              <div
                className="mb-2 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight"
                style={{ background: pos.accentSoft, color: pos.textColor }}
              >
                {user.totalXp.toLocaleString()} XP
              </div>

              {/* 领奖台基座 */}
              <div
                className={clsx(
                  'w-full rounded-t-2xl flex flex-col items-center justify-start pt-3 pb-2 relative overflow-hidden',
                  pos.height,
                )}
                style={{
                  background: `linear-gradient(180deg, ${pos.accent}25, ${pos.accent}10)`,
                  border: `1px solid ${pos.accent}40`,
                  borderBottom: 'none',
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, transparent, ${pos.accent}, transparent)` }}
                />
                <div
                  className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                  style={{ background: pos.accent, opacity: 0.3 }}
                />
                <Icon
                  size={pos.rank === 1 ? 28 : 22}
                  style={{ color: pos.accent, opacity: 0.85 }}
                  strokeWidth={2}
                  {...(pos.rank === 1 ? { fill: pos.accent + '30' } : {})}
                />
                <div className="text-[10px] font-bold mt-1" style={{ color: pos.textColor, opacity: 0.7 }}>
                  {userRank}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 底部地板 */}
      <div className="h-2 rounded-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 -mt-0.5" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 段位进度条
// ═══════════════════════════════════════════════════════════════════
function RankProgressBar({ xp }: { xp: number }) {
  const user = useUserStore()
  const configs = user.systemConfigs
  const progress = getRankProgress(xp, configs)
  const cur = getRankInfo(xp, configs)
  const next = getNextRankInfo(xp, configs)
  const color = cur.color

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted-foreground">距离下一段位</span>
        <span style={{ color }}>
          {next ? `${progress.current} / ${progress.target} XP` : '已达最高段位'}
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress.pct * 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: color,
          }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 段位说明 Tab
// ═══════════════════════════════════════════════════════════════════
function RankTab({ currentXp }: { currentXp: number }) {
  const ranks = Object.keys(RANK_DETAILS) as RankName[]
  const myRank = getRankFromXp(currentXp)

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Award size={16} className="text-primary" strokeWidth={2.5} />
          <span className="font-bold text-sm text-foreground">段位体系</span>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          通过练习获得 XP，每提升一段位解锁新的荣誉与徽章。当前段位越高，挑战越精彩！
        </div>
      </Card>

      {ranks.map((r, idx) => {
        const detail = RANK_DETAILS[r]
        const isCurrent = r === myRank
        const Icon = detail.icon

        return (
          <motion.div
            key={r}
            initial={{ x: idx * 15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.06 }}
          >
            <Card className={clsx(
              'overflow-hidden',
              isCurrent ? 'border-primary/50' : '',
            )}>
              {isCurrent && (
                <div className="px-4 py-2 bg-primary/5 border-b border-primary/20">
                  <span className="text-xs font-bold text-primary">当前段位</span>
                </div>
              )}
              <div className={clsx('p-4', `bg-gradient-to-r ${detail.bg}`)}>
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'relative w-12 h-12 rounded-xl grid place-items-center border bg-background shadow-sm shrink-0',
                    )}
                    style={{
                      borderColor: detail.color + '30',
                      boxShadow: isCurrent ? `0 4px 12px ${detail.color}30` : undefined,
                    }}
                  >
                    <Icon size={detail.iconSize} style={{ color: detail.color }} strokeWidth={2.5} {...(r === '王者' || r === '黄金' ? { fill: detail.color + '15' } : {})} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-base font-bold"
                        style={{ color: detail.color }}
                      >
                        {r}段位
                      </span>
                      {r === '王者' && (
                        <Sparkles size={12} style={{ color: detail.color }} fill="currentColor" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {detail.max === Infinity
                        ? `${detail.min.toLocaleString()}+ XP`
                        : `${detail.min.toLocaleString()} - ${detail.max.toLocaleString()} XP`}
                    </div>
                  </div>
                  <div
                    className="text-right font-bold text-lg leading-none"
                    style={{ color: detail.color, opacity: 0.85 }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </div>

                {/* 本段位进度（仅对当前段位显示） */}
                {isCurrent && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <RankProgressBar xp={currentXp} />
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// 抑制未使用变量警告
void getRankFromXp
