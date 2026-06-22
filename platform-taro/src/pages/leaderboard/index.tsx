import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { getLeaderboard, type LeaderboardUser } from '@/services/content'
import * as classApi from '@/services/classApi'
import { getRankFromXp, getRankInfo, getRankProgress, getNextRankInfo } from '@/utils/rank'
import { getAvatarBgColor, getAvatarTextColor, getAvatarBorderColor, getInitial } from '@/utils/avatar'
import type { Rank } from '@/types/models'
import { C, TOKEN } from '@/styles/theme'
import { Icon } from '@/components/Icon'

// 段位图标 key（对应 Lucide 图标）
const RANK_ICON: Record<Rank, string> = {
  '青铜': 'medal', '白银': 'shield', '黄金': 'star', '铂金': 'diamond', '钻石': 'diamond', '王者': 'crown',
}

// hex -> rgba，用于半透明背景
function hexA(hex: string, a: number): string {
  const h = (hex || '#000000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

function fmt(n: number): string {
  return Number(n || 0).toLocaleString('en-US')
}

function rankColorOf(xp: number, configs?: Record<string, string>): string {
  return getRankInfo(xp, configs).color
}

// ── 头像盒（icon / 首字降级，避免小程序网络图问题）──────────────
function AvatarBox({ name, avatar, size }: { name: string; avatar?: string; size: number }) {
  const safeName = name || '?'
  const bg = getAvatarBgColor(safeName)
  const fg = getAvatarTextColor(safeName)
  const border = getAvatarBorderColor(safeName)
  const isUrl = !!avatar && /^https?:\/\//.test(avatar)
  const ch = (!avatar || isUrl) ? getInitial(safeName) : avatar
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      background: bg, border: `2px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <Text style={{ fontSize: size * 0.45, fontWeight: '700', color: fg }}>{ch}</Text>
    </View>
  )
}

// ── 段位进度条 ────────────────────────────────────────────────────
function RankProgressBar({ xp, configs }: { xp: number; configs?: Record<string, string> }) {
  const prog = getRankProgress(xp, configs)
  const cur = getRankInfo(xp, configs)
  const next = getNextRankInfo(xp, configs)
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>距离下一段位</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: cur.color }}>
          {next ? `${prog.current} / ${prog.target} XP` : '已达最高段位'}
        </Text>
      </View>
      <View style={{ height: 8, background: C.icon.iconGrayBg, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{
          width: `${Math.min(100, Math.max(0, prog.pct * 100))}%`,
          height: '100%', background: cur.color, borderRadius: 4,
        }} />
      </View>
    </View>
  )
}

// ── Top3 领奖台（2 左 / 1 中最高 / 3 右）─────────────────────────
function Podium({ list, configs, isMe }: {
  list: LeaderboardUser[]
  configs?: Record<string, string>
  isMe: (u: LeaderboardUser) => boolean
}) {
  if (!list.length) return null
  const order = [
    { rank: 2, h: 96, label: '亚军', accent: '#B0B8C4' },
    { rank: 1, h: 130, label: '冠军', accent: '#FFC800' },
    { rank: 3, h: 80, label: '季军', accent: '#D97706' },
  ]
  return (
    <View style={{ display: 'flex', flexDirection: 'column', marginBottom: 4 }}>
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
        {order.map(pos => {
          const u = list[pos.rank - 1]
          if (!u) return <View key={pos.rank} style={{ flex: 1 }} />
          const crown = pos.rank === 1
          const rname = getRankFromXp(u.totalXp, configs)
          const meFlg = isMe(u)
          return (
            <View key={pos.rank} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 4px' }}>
              {/* 头像 + 徽章 */}
              <View style={{ position: 'relative', marginBottom: 8 }}>
                {crown ? (
                  <View style={{
                    position: 'absolute', top: -22, left: '50%', marginLeft: -14,
                    width: 28, height: 28, borderRadius: 14, background: C.duolingo.gold,
                    border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2,
                  }}>
                    <Icon name="crown" size={14} color={C.semantic.foreground} />
                  </View>
                ) : null}
                <AvatarBox name={u.nickname} avatar={u.avatar} size={crown ? 64 : 52} />
                <View style={{
                  position: 'absolute', top: -8, left: '50%', marginLeft: -12,
                  width: 24, height: 24, borderRadius: 12, background: pos.accent,
                  border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>{pos.rank}</Text>
                </View>
                {meFlg ? (
                  <View style={{
                    position: 'absolute', bottom: -4, right: -4,
                    paddingHorizontal: 4, height: 16, borderRadius: 8, background: C.semantic.primary,
                    border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>我</Text>
                  </View>
                ) : null}
              </View>

              {/* 昵称 */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.semantic.foreground, maxWidth: 80, textAlign: 'center' }} numberOfLines={1}>
                {u.nickname}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: pos.accent, marginTop: 2 }}>{pos.label}</Text>

              {/* XP 胶囊 */}
              <View style={{ marginTop: 4, marginBottom: 6, padding: '3px 10px', borderRadius: 12, background: hexA(pos.accent, 0.18) }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: pos.accent }}>{fmt(u.totalXp)} XP</Text>
              </View>

              {/* 基座 */}
              <View style={{
                width: '100%', height: pos.h, borderRadius: 14, paddingTop: 10, paddingBottom: 8,
                background: hexA(pos.accent, 0.15), border: `1px solid ${hexA(pos.accent, 0.35)}`, borderBottom: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              }}>
                <Icon name={RANK_ICON[rname]} size={crown ? 24 : 20} color={pos.accent} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: pos.accent, marginTop: 4 }}>{rname}</Text>
              </View>
            </View>
          )
        })}
      </View>
      {/* 地板 */}
      <View style={{ height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.icon.iconGrayBg}, ${C.semantic.border}, ${C.icon.iconGrayBg})`, marginTop: 2 }} />
    </View>
  )
}

// ── 普通排名行（4 名以后 / 班级列表通用）────────────────────────
function RankRow({ u, rank, configs, me }: {
  u: LeaderboardUser
  rank: number
  configs?: Record<string, string>
  me: boolean
}) {
  const rc = rankColorOf(u.totalXp, configs)
  const rname = getRankFromXp(u.totalXp, configs)
  return (
    <View style={{
      background: me ? hexA(C.semantic.primary, 0.06) : '#fff',
      border: `1px solid ${me ? hexA(C.semantic.primary, 0.35) : C.semantic.border}`,
      borderRadius: TOKEN.radius.lg, padding: 12, marginBottom: 10,
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      boxShadow: TOKEN.shadow.md,
    }}>
      {/* 名次 */}
      <View style={{
        width: 28, height: 28, borderRadius: 8, background: hexA(rc, 0.15),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: rc }}>{rank}</Text>
      </View>
      <View style={{ width: 10 }} />
      <AvatarBox name={u.nickname} avatar={u.avatar} size={40} />
      <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.semantic.foreground }} numberOfLines={1}>{u.nickname}</Text>
          {me ? (
            <View style={{ marginLeft: 6, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, background: hexA(C.semantic.primary, 0.14) }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.semantic.primary }}>我</Text>
            </View>
          ) : null}
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{u.targetGrade || 1}年级</Text>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground, margin: '0 6px' }}>·</Text>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Icon name={RANK_ICON[rname]} size={11} color={rc} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: rc }}>{rname}</Text>
          </View>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: C.semantic.foreground }}>{fmt(u.totalXp)}</Text>
        <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>XP</Text>
      </View>
    </View>
  )
}

// ── 骨架屏 ────────────────────────────────────────────────────────
function SkeletonRows({ n = 4 }: { n?: number }) {
  const block = (w: number, h: number, r = 5): React.CSSProperties => ({
    width: w, height: h, borderRadius: r, background: C.icon.iconGrayBg,
  })
  return (
    <View style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{
          background: '#fff', border: `1px solid ${C.semantic.border}`, borderRadius: TOKEN.radius.lg,
          padding: 12, marginBottom: 10, display: 'flex', flexDirection: 'row', alignItems: 'center',
          boxShadow: TOKEN.shadow.md,
        }}>
          <View style={block(28, 28, 8)} />
          <View style={{ width: 10 }} />
          <View style={block(40, 40, 20)} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ ...block(80, 10), marginBottom: 6 }} />
            <View style={block(120, 9)} />
          </View>
          <View style={block(36, 14)} />
        </View>
      ))}
    </View>
  )
}

// ── 空状态 ────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, action }: {
  icon: string
  title: string
  desc?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <View style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Icon name={icon} size={44} color={C.semantic.mutedForeground} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: C.semantic.mutedForeground, marginTop: 12 }}>{title}</Text>
      {desc ? (
        <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>{desc}</Text>
      ) : null}
      {action ? (
        <View onClick={action.onClick} className="taro-btn-press" style={{
          marginTop: 16, padding: '8px 16px', borderRadius: TOKEN.radius.md,
          border: `1px solid ${C.semantic.border}`, background: '#fff',
          boxShadow: TOKEN.shadow.sm,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.semantic.foreground }}>{action.label}</Text>
        </View>
      ) : null}
    </View>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────
type ClassItem = classApi.ClassMember & { isMe?: boolean }

export default function LeaderboardPage() {
  const user = useUserStore()
  const [tab, setTab] = useState<'global' | 'class'>('global')
  const [loading, setLoading] = useState(false)
  const [globalData, setGlobalData] = useState<LeaderboardUser[]>([])
  const [classData, setClassData] = useState<ClassItem[]>([])
  const [className, setClassName] = useState('')

  const myXp = user.xp
  const myNickname = user.profile.nickname || '我'
  const myAvatar = user.profile.avatar
  const configs = user.systemConfigs
  const targetGrade = user.profile.targetGrade
  const myRank = getRankFromXp(myXp, configs)
  const myRankInfo = getRankInfo(myXp, configs)
  const myLevel = Math.floor(myXp / 500) + 1

  const isMeUser = (u: { userId?: string; nickname?: string }) =>
    (!!user.userId && u.userId === user.userId) || u.nickname === myNickname

  useEffect(() => {
    if (tab === 'global') loadGlobal()
    else loadClass()
  }, [tab])

  async function loadGlobal() {
    setLoading(true)
    try {
      // 不传年级 => 全部年级
      const data = await getLeaderboard(50)
      setGlobalData(data)
    } catch {
      setGlobalData([])
    } finally {
      setLoading(false)
    }
  }

  async function loadClass() {
    if (!user.userId) {
      setClassData([])
      setClassName('')
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await classApi.getClassMembers(user.userId)
      if (res.success && res.members.length > 0) {
        const formatted: ClassItem[] = res.members
          .map(m => ({ ...m, isMe: m.userId === user.userId }))
          .sort((a, b) => (b.xp || 0) - (a.xp || 0))
        setClassData(formatted)
        setClassName(res.className || '班级')
      } else {
        setClassData([])
        setClassName('')
      }
    } catch {
      setClassData([])
      Taro.showToast({ title: '加载失败，请稍后重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 当前用户若不在总榜则追加到末尾
  const globalList = useMemo<LeaderboardUser[]>(() => {
    const meIn = globalData.find(isMeUser)
    if (meIn) return globalData
    return [
      ...globalData,
      {
        rank: globalData.length + 1,
        userId: user.userId || 'me',
        nickname: myNickname,
        avatar: myAvatar || '',
        targetGrade: targetGrade || 2,
        totalXp: myXp,
        totalSessions: 0,
        correctRate: 0,
      },
    ]
  }, [globalData, user.userId, myNickname, myXp, myAvatar, targetGrade])

  const myGlobalIndex = globalList.findIndex(isMeUser)
  const top3 = globalList.slice(0, 3)
  const restGlobal = globalList.slice(3)

  // 班级数据映射为统一行结构
  const classAsLeader: LeaderboardUser[] = classData.map(c => ({
    rank: 0, userId: c.userId, nickname: c.nickname, avatar: c.avatar,
    targetGrade: c.targetGrade, totalXp: c.xp, totalSessions: 0, correctRate: 0,
  }))

  return (
    <View style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.pageBg }}>
      {/* 顶部渐变条 */}
      <View style={{ height: 4, background: `linear-gradient(90deg, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      {/* 头部 */}
      <View style={{
        padding: '12px 16px', background: '#fff', borderBottom: `1px solid ${C.semantic.border}`,
        display: 'flex', flexDirection: 'row', alignItems: 'center',
      }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: C.semantic.foreground }}>巅峰榜单</Text>
      </View>

      <ScrollView scrollY style={{ flex: 1, minHeight: 0 }}>
        <View style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>

          {/* Tab 切换 */}
          <View style={{
            display: 'flex', flexDirection: 'row', background: C.icon.iconGrayBg,
            borderRadius: TOKEN.radius.md, padding: 4, marginBottom: 12,
          }}>
            {(['global', 'class'] as const).map(t => {
              const active = tab === t
              return (
                <View key={t} onClick={() => setTab(t)} className="taro-btn-press" style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  background: active ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? C.semantic.foreground : C.semantic.mutedForeground }}>
                    {t === 'global' ? '总榜' : '班级榜'}
                  </Text>
                </View>
              )
            })}
          </View>

          {/* 我的段位卡 */}
          <View style={{
            background: '#fff', borderRadius: TOKEN.radius.lg, padding: 16,
            border: `1px solid ${C.semantic.border}`, marginBottom: 12,
            boxShadow: TOKEN.shadow.md,
          }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                background: hexA(myRankInfo.color, 0.15),
                border: `2px solid ${hexA(myRankInfo.color, 0.3)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={RANK_ICON[myRank]} size={24} color={C.semantic.foreground} />
              </View>
              <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: myRankInfo.color }}>{myRank}段位</Text>
                  <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginLeft: 8 }}>LV.{myLevel}</Text>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: C.semantic.foreground }}>{fmt(myXp)}</Text>
                  <Text style={{ fontSize: 13, color: C.semantic.mutedForeground, marginLeft: 4 }}>XP</Text>
                </View>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
                background: hexA(C.semantic.accent, 0.15), display: 'flex', alignItems: 'center',
              }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Icon name="fire" size={12} color={C.semantic.accent} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.semantic.accent }}>{user.streak || 0}</Text>
                </View>
              </View>
            </View>
            <RankProgressBar xp={myXp} configs={configs} />
          </View>

          {/* 内容区 */}
          {loading ? (
            <SkeletonRows n={5} />
          ) : tab === 'global' ? (
            globalList.length === 0 ? (
              <EmptyState icon="trophy" title="暂无排行数据" desc="完成关卡后来这里看看" />
            ) : (
              <>
                <Text style={{ fontSize: 11, color: C.semantic.mutedForeground, marginBottom: 10 }}>全部年级 · 前 {globalList.length} 名</Text>
                <View style={{ marginBottom: 12 }}>
                  <Podium list={top3} configs={configs} isMe={isMeUser} />
                </View>
                <View>
                  {restGlobal.map((u, idx) => (
                    <RankRow key={u.userId || u.nickname} u={u} rank={idx + 4} configs={configs} me={isMeUser(u)} />
                  ))}
                </View>
                {/* 我的排名卡 */}
                {myGlobalIndex >= 0 ? (
                  <View style={{
                    background: hexA(C.semantic.primary, 0.06),
                    border: `1px solid ${hexA(C.semantic.primary, 0.35)}`,
                    borderRadius: TOKEN.radius.lg, padding: 16, marginTop: 4,
                    display: 'flex', flexDirection: 'row', alignItems: 'center',
                    boxShadow: TOKEN.shadow.md,
                  }}>
                    <View style={{ position: 'relative' }}>
                      <AvatarBox name={myNickname} avatar={myAvatar} size={52} />
                      <View style={{
                        position: 'absolute', top: -6, left: -6,
                        width: 26, height: 26, borderRadius: 8, background: C.semantic.primary,
                        border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>#{myGlobalIndex + 1}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                      <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>我的排名</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: C.semantic.foreground, marginTop: 2 }} numberOfLines={1}>{myNickname}</Text>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Icon name="lightning" size={12} color={C.semantic.primary} />
                          <Text style={{ fontSize: 12, color: C.semantic.primary, fontWeight: '700' }}>{fmt(myXp)} XP</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, margin: '0 6px' }}>·</Text>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Icon name={RANK_ICON[myRank]} size={12} color={myRankInfo.color} />
                          <Text style={{ fontSize: 12, color: myRankInfo.color, fontWeight: '700' }}>{myRank}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            )
          ) : (
            classData.length === 0 ? (
              <EmptyState
                icon="users"
                title="加入班级后查看同学排行"
                desc="去「我的」页面创建或加入班级"
                action={{ label: '加入班级', onClick: () => Taro.switchTab({ url: '/pages/profile/index' }) }}
              />
            ) : (
              <>
                <Text style={{ fontSize: 11, color: C.semantic.mutedForeground, marginBottom: 10 }}>
                  {className || '班级'} · 共 {classData.length} 人 · 按 XP 排序
                </Text>
                <View>
                  {classAsLeader.map((u, idx) => (
                    <RankRow
                      key={u.userId || u.nickname}
                      u={u}
                      rank={idx + 1}
                      configs={configs}
                      me={!!classData[idx]?.isMe}
                    />
                  ))}
                </View>
              </>
            )
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </View>
  )
}
