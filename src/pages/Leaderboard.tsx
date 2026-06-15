import { useEffect, useState } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { motion } from 'framer-motion'
import { Crown, Medal, Trophy, Star, Sparkles, Award, Target, ChevronRight, Zap, Gem, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { RANK_COLORS, getRankFromXp, getRankInfo, getRankProgress, getNextRankInfo } from '@/utils/rank'
import { getLeaderboard, type LeaderboardUser } from '@/services/content'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

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
  const [tab, setTab] = useState<'friends' | 'rank'>('friends')
  const [loading, setLoading] = useState(true)
  const [rankingData, setRankingData] = useState<RankUser[]>([])
  const myNickname = user.profile.nickname || '我'
  const myXp = user.xp
  const myRank = getRankFromXp(myXp)

  useEffect(() => {
    if (tab !== 'friends') return
    setLoading(true)
    getLeaderboard(50, user.profile.targetGrade)
      .then(data => setRankingData(data))
      .catch(() => setRankingData([]))
      .finally(() => setLoading(false))
  }, [tab])

  // 把当前用户信息注入榜单（若榜上没有则追加到末尾）
  const rawList = tab === 'friends' ? rankingData : []
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* ═══ 顶部渐变装饰区 ═══ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400" />
        <div className="absolute -top-10 -right-8 w-48 h-48 rounded-full bg-yellow-300/30 blur-3xl" />
        <div className="absolute top-16 -left-6 w-32 h-32 rounded-full bg-white/20 blur-2xl" />

        <div className="relative px-5 pt-6 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white tracking-wider">SEASON 01</span>
              </div>
              <h1 className="text-white text-3xl font-black tracking-tight flex items-center gap-2">
                <Trophy size={28} className="text-yellow-200" strokeWidth={2.5} />
                巅峰榜单
              </h1>
            </div>
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 grid place-items-center"
            >
              <Sparkles size={26} className="text-yellow-200" />
            </motion.div>
          </div>

          {/* 我的段位速览卡 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative rounded-3xl p-4 bg-white shadow-xl shadow-emerald-500/20 border border-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 via-transparent to-transparent rounded-full blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl grid place-items-center border-2 border-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${RANK_COLORS[myRank]}15, ${RANK_COLORS[myRank]}30)`,
                }}
              >
                {(() => {
                  const Icon = RANK_DETAILS[myRank].icon
                  return <Icon size={30} style={{ color: RANK_COLORS[myRank] }} strokeWidth={2.5} />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-black tracking-tight"
                    style={{ color: RANK_COLORS[myRank] }}
                  >
                    {myRank}段位
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">LV.{Math.floor(myXp / 500) + 1}</span>
                </div>
                <div className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">
                  {myXp.toLocaleString()} <span className="text-sm font-bold text-gray-400">XP</span>
                </div>
                <RankProgressBar xp={myXp} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ 分段 Tab 切换器 ═══ */}
      <div className="px-4 -mt-5 relative z-10">
        <Tabs defaultValue="friends" value={tab} onValueChange={(v) => setTab(v as 'friends' | 'rank')}>
          <TabsList className="w-full rounded-2xl bg-white border border-gray-100 p-1.5 grid grid-cols-2 gap-1 shadow-lg shadow-gray-200/60 h-auto">
            <TabsTrigger
              value="friends"
              className={clsx(
                'h-12 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5',
                tab === 'friends'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 data-active:bg-gradient-to-br data-active:from-emerald-500 data-active:to-emerald-600 data-active:text-white'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Trophy size={16} strokeWidth={2.5} />
              排行榜
            </TabsTrigger>
            <TabsTrigger
              value="rank"
              className={clsx(
                'h-12 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5',
                tab === 'rank'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 data-active:bg-gradient-to-br data-active:from-emerald-500 data-active:to-emerald-600 data-active:text-white'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Award size={16} strokeWidth={2.5} />
              段位说明
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ═══ 内容区 ═══ */}
      <div className="px-4 pt-5 pb-24">
        {tab !== 'rank' ? (
          <div className="space-y-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={32} className="text-emerald-400 animate-spin" />
                <span className="text-sm text-gray-400 font-medium">加载中...</span>
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Trophy size={48} className="text-gray-200" />
                <div className="text-center">
                  <div className="text-base font-bold text-gray-400">暂无排行数据</div>
                  <div className="text-xs text-gray-300 mt-1">完成关卡后来这里看看</div>
                </div>
              </div>
            ) : (
              <>
                {/* ── Top 3 领奖台 ── */}
                <Top3Podium list={list} />

                {/* ── 4 名以后的榜单 ── */}
                <div className="space-y-2.5">
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
                        className={clsx(
                          'relative overflow-hidden rounded-2xl border transition-all',
                          isMe
                            ? 'bg-gradient-to-r from-emerald-50 via-white to-white border-emerald-200 shadow-lg shadow-emerald-500/10'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm',
                        )}
                      >
                        {isMe && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                        )}
                        <div className={clsx('flex items-center gap-3 p-3.5', isMe && 'pl-5')}>
                          <div className={clsx(
                            'w-9 h-9 rounded-xl grid place-items-center font-black text-sm',
                            'bg-gray-50 border border-gray-100 text-gray-500',
                          )}>
                            {rank}
                          </div>
                          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 grid place-items-center text-2xl shrink-0">
                            {u.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-black text-sm text-gray-900 truncate">
                                {u.nickname}
                              </span>
                              {isMe && (
                                <span className="inline-block text-[9px] font-black text-white bg-emerald-500 rounded-full px-1.5 py-0.5 tracking-tight">
                                  我
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                              <span className="inline-flex items-center gap-0.5">
                                <Target size={10} strokeWidth={2.5} />
                                {u.targetGrade || 1} 年级
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span style={{ color: rankColor }} className="font-bold">
                                {userRank}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-sm text-gray-900 leading-none">
                              {u.totalXp.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 mt-1 tracking-wider">XP</div>
                          </div>
                        </div>
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
                    className="mt-4 relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-xl shadow-emerald-500/30"
                  >
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-lime-300/20 rounded-full blur-2xl" />
                    <div className="relative p-5 flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 grid place-items-center text-3xl shrink-0">
                        {user.profile.avatar || '🧒'}
                        <div className="absolute -top-2 -left-2 w-10 h-10 rounded-xl bg-yellow-400 border-2 border-white grid place-items-center text-white text-sm font-black shadow-lg">
                          #{myIndex + 1}
                        </div>
                      </div>
                      <div className="flex-1 text-white">
                        <div className="text-xs font-bold opacity-80 mb-0.5">我的排名</div>
                        <div className="text-xl font-black tracking-tight mb-1">{myNickname}</div>
                        <div className="flex items-center gap-2 text-[11px] opacity-90 font-medium">
                          <span className="flex items-center gap-0.5"><Zap size={10} fill="currentColor" />{myXp.toLocaleString()} XP</span>
                          <span className="w-1 h-1 rounded-full bg-white/40" />
                          <span>{myRank}段位</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
                        <ChevronRight size={18} className="text-white" strokeWidth={3} />
                      </div>
                    </div>
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
                    'w-16 h-16 rounded-2xl bg-white grid place-items-center text-3xl border-2 shadow-lg',
                    pos.ringColor,
                  )}
                  style={{ boxShadow: `0 8px 24px ${pos.accent}30` }}
                >
                  {user.avatar}
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
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full grid place-items-center text-white text-[10px] font-black shadow-md border-2 border-white"
                    style={{ background: pos.accent }}
                  >
                    {pos.rank}
                  </div>
                )}
              </div>

              {/* 昵称 */}
              <div className="text-xs font-black text-gray-900 truncate max-w-[80px] mb-0.5">
                {user.nickname}
              </div>
              <div className="text-[10px] font-bold mb-2" style={{ color: pos.textColor }}>
                {pos.label}
              </div>

              {/* XP */}
              <div
                className="mb-2 px-2.5 py-1 rounded-full text-[11px] font-black tracking-tight"
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
                <div className="text-[10px] font-black mt-1" style={{ color: pos.textColor, opacity: 0.7 }}>
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
      <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
        <span className="text-gray-400">距离下一段位</span>
        <span style={{ color }}>
          {next ? `${progress.current} / ${progress.target} XP` : '已达最高段位'}
        </span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress.pct * 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 8px ${color}60`,
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
      <div className="rounded-2xl bg-white border border-gray-100 p-4 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Award size={16} className="text-emerald-500" strokeWidth={2.5} />
          <span className="font-black text-sm text-gray-900">段位体系</span>
        </div>
        <div className="text-xs text-gray-500 leading-relaxed">
          通过练习获得 XP，每提升一段位解锁新的荣誉与徽章。当前段位越高，挑战越精彩！
        </div>
      </div>

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
            className={clsx(
              'relative rounded-2xl border overflow-hidden',
              isCurrent
                ? 'border-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'border-gray-100 bg-white',
            )}
            style={isCurrent ? undefined : {}}
          >
            {isCurrent && (
              <div className="absolute -top-1 right-3 z-10">
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black text-white bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm tracking-wider">
                  当前段位
                </span>
              </div>
            )}
            <div className={clsx('p-4', `bg-gradient-to-r ${detail.bg}`)}>
              <div className="flex items-center gap-3.5">
                <div
                  className={clsx(
                    'relative w-12 h-12 rounded-2xl grid place-items-center border bg-white shadow-sm shrink-0',
                  )}
                  style={{
                    borderColor: detail.color + '30',
                    boxShadow: isCurrent ? `0 6px 16px ${detail.color}40` : undefined,
                  }}
                >
                  <Icon size={detail.iconSize} style={{ color: detail.color }} strokeWidth={2.5} {...(r === '王者' || r === '黄金' ? { fill: detail.color + '15' } : {})} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-base font-black tracking-tight"
                      style={{ color: detail.color }}
                    >
                      {r}段位
                    </span>
                    {r === '王者' && (
                      <Sparkles size={12} style={{ color: detail.color }} fill="currentColor" />
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 font-bold">
                    {detail.max === Infinity
                      ? `${detail.min.toLocaleString()}+ XP`
                      : `${detail.min.toLocaleString()} - ${detail.max.toLocaleString()} XP`}
                  </div>
                </div>
                <div
                  className="text-right font-black text-lg leading-none"
                  style={{ color: detail.color, opacity: 0.85 }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>
              </div>

              {/* 本段位进度（仅对当前段位显示） */}
              {isCurrent && (
                <div className="mt-3 pt-3 border-t border-white/80">
                  <RankProgressBar xp={currentXp} />
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// 抑制未使用变量警告
void getRankFromXp
