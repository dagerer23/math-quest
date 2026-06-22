import { useState, useEffect, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { getDailyGoalTemplates, type DailyGoalTemplate } from '@/services/content'
import { todayKey } from '@/utils/time'
import { C, TOKEN, btnShadow } from '@/styles/theme'
import { Icon } from '@/components/Icon'

const primaryLight = 'rgba(88,204,2,0.08)'

// hex -> rgba，用于半透明背景
function hexA(hex: string, a: number): string {
  const h = (hex || '#000000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

const ICON_BG: Record<string, string> = {
  'lightning': C.icon.iconGreenBg,
  'goal': C.icon.iconBlueBg,
  'fire': C.icon.iconRedBg,
}

const ICON_COLOR: Record<string, string> = {
  'lightning': C.semantic.accent,
  'goal': C.semantic.primary,
  'fire': C.semantic.destructive,
}

interface GoalView {
  template: DailyGoalTemplate
  progress: number
  completed: boolean
  claimed: boolean
}

export default function DailyGoalsPage() {
  const user = useUserStore()
  const today = useMemo(() => todayKey(), [])

  const [templates, setTemplates] = useState<DailyGoalTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const loadTemplates = () => {
    setLoading(true)
    getDailyGoalTemplates()
      .then((data) => {
        setTemplates(data)
        setLoading(false)
      })
      .catch(() => {
        setTemplates([])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  // 基于模板生成今日目标视图，进度实时读取 store
  const goals: GoalView[] = templates.map((t) => {
    const todayGoal = user.dailyGoals.find((g) => g.id === t.id)
    let progress = 0
    if (todayGoal?.completed) {
      progress = t.target
    } else if (t.type === 'xp') {
      progress = Math.min(user.dailyXp, t.target)
    } else if (t.type === 'questions') {
      progress = Math.min(user.dailyQuestions, t.target)
    } else if (t.type === 'streak') {
      progress = user.lastCheckInDate === today ? 1 : 0
    }
    return {
      template: t,
      progress,
      completed: progress >= t.target,
      claimed: !!(todayGoal && todayGoal.completed),
    }
  })

  const completedCount = goals.filter((g) => g.completed).length
  const totalPct = goals.length > 0 ? (completedCount / goals.length) * 100 : 0
  const checkedInToday = user.lastCheckInDate === today

  const handleCheckIn = () => {
    if (checkedInToday) {
      Taro.showToast({ title: '今日已签到', icon: 'none' })
      return
    }
    const r = user.checkIn()
    Taro.showToast({ title: r.message, icon: 'none' })
  }

  // 领取奖励：先登记目标（含 reward），再调 completeDailyGoal 结算 XP/金币
  const claimReward = (goal: GoalView) => {
    const t = goal.template
    if (!goal.completed) {
      Taro.showToast({ title: '还未完成该目标', icon: 'none' })
      return
    }
    if (goal.claimed) {
      Taro.showToast({ title: '已领取过奖励', icon: 'none' })
      return
    }
    const existing = user.dailyGoals.find((g) => g.id === t.id)
    if (!existing) {
      user.addDailyGoal({
        id: t.id,
        targetXp: t.type === 'xp' ? t.target : 0,
        targetQuestions: t.type === 'questions' ? t.target : 0,
        completed: false,
        reward: { xp: t.rewardXp, coins: t.rewardCoins },
      })
    }
    user.completeDailyGoal(t.id)
    Taro.showToast({ title: '奖励已领取！', icon: 'none' })
  }

  return (
    <View style={{ minHeight: '100vh', background: C.pageBg, paddingBottom: 32 }}>
      {/* 顶部渐变条 */}
      <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      {/* 顶部导航 */}
      <View style={{ padding: '16px 16px 8px', paddingTop: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: 700, color: C.semantic.foreground }}>每日目标</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>{today}</Text>
        </View>
      </View>

      <View style={{ padding: '0 16px' }}>
        {/* 签到卡片 */}
        <View style={{ background: '#FFFFFF', borderRadius: TOKEN.radius.lg, padding: 16, marginBottom: 12, border: `1px solid ${C.semantic.border}`, boxShadow: TOKEN.shadow.md, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="fire" size={18} color={C.semantic.destructive} />
              <Text style={{ fontSize: 17, fontWeight: 700, color: C.semantic.foreground }}>今日签到</Text>
            </View>
            <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>
              已连续签到 {user.streak} 天{checkedInToday ? ' · 今日已签到' : ''}
            </Text>
          </View>
          <View
            onClick={handleCheckIn}
            className="taro-btn-press"
            style={{
              height: 40,
              padding: '0 18px',
              borderRadius: TOKEN.radius.md,
              background: checkedInToday ? C.icon.iconGrayBg : C.semantic.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: checkedInToday ? 'none' : btnShadow(C.duolingo.greenDark),
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: 700, color: checkedInToday ? C.semantic.mutedForeground : '#FFFFFF' }}>
              {checkedInToday ? '已签到' : '立即签到'}
            </Text>
          </View>
        </View>

        {/* 今日挑战总进度 */}
        <View style={{ background: `linear-gradient(135deg, ${primaryLight}, ${hexA(C.semantic.secondary, 0.08)})`, borderRadius: TOKEN.radius.lg, padding: 16, marginBottom: 12, border: `1px solid ${C.semantic.border}`, boxShadow: TOKEN.shadow.md }}>
          <Text style={{ fontSize: 17, fontWeight: 700, color: C.semantic.foreground }}>今日挑战</Text>
          <Text style={{ fontSize: 13, color: C.semantic.mutedForeground, marginTop: 4 }}>完成目标获取丰厚奖励</Text>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1, height: 10, background: C.semantic.border, borderRadius: 999, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${totalPct}%`, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary})`, borderRadius: 999 }} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: 700, color: C.semantic.primary }}>{completedCount}/{goals.length}</Text>
          </View>
        </View>

        {/* 加载态 */}
        {loading && (
          <View style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: C.semantic.mutedForeground }}>加载中...</Text>
          </View>
        )}

        {/* 空状态 */}
        {!loading && templates.length === 0 && (
          <View style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Icon name="goal" size={56} color={C.semantic.primary} />
            <Text style={{ fontSize: 16, fontWeight: 700, color: C.semantic.foreground, marginTop: 12 }}>今日暂无目标</Text>
            <Text style={{ fontSize: 13, color: C.semantic.mutedForeground, marginTop: 6 }}>稍后再来看看吧</Text>
            <View onClick={loadTemplates} className="taro-btn-press" style={{ marginTop: 16, height: 38, padding: '0 22px', borderRadius: TOKEN.radius.md, background: C.semantic.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: btnShadow(C.duolingo.greenDark) }}>
              <Text style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>刷新</Text>
            </View>
          </View>
        )}

        {/* 目标列表 */}
        {!loading && goals.map((goal) => {
          const t = goal.template
          const iconBg = ICON_BG[t.icon] || C.icon.iconBlueBg
          const iconColor = ICON_COLOR[t.icon] || C.semantic.primary
          return (
            <View
              key={t.id}
              style={{
                background: goal.completed ? primaryLight : '#FFFFFF',
                borderRadius: TOKEN.radius.lg,
                padding: 16,
                marginBottom: 12,
                border: `1px solid ${goal.completed ? hexA(C.semantic.primary, 0.3) : C.semantic.border}`,
                boxShadow: TOKEN.shadow.md,
              }}
            >
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: TOKEN.radius.md, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.icon || 'goal'} size={24} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 15, fontWeight: 700, color: goal.completed ? C.semantic.primary : C.semantic.foreground }}>{t.title}</Text>
                    {goal.completed && <Icon name="checkCircle" size={14} color={C.semantic.primary} />}
                  </View>
                  <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 2 }}>{t.description}</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>进度 {goal.progress}/{t.target}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: C.semantic.primary }}>+{t.rewardXp} XP · +{t.rewardCoins} 金币</Text>
                  </View>
                  <View style={{ height: 8, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
                    <View style={{ height: '100%', width: `${(goal.progress / t.target) * 100}%`, background: C.semantic.primary, borderRadius: 999 }} />
                  </View>
                </View>
              </View>

              {goal.completed && !goal.claimed && (
                <View onClick={() => claimReward(goal)} className="taro-btn-press" style={{ marginTop: 12, height: 42, borderRadius: TOKEN.radius.md, background: C.semantic.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: btnShadow(C.duolingo.greenDark) }}>
                  <Text style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>领取奖励</Text>
                </View>
              )}
              {goal.claimed && (
                <View style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: C.semantic.primary }}>已领取奖励</Text>
                </View>
              )}
              {!goal.completed && (
                <View
                  onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
                  className="taro-btn-press"
                  style={{
                    marginTop: 12, height: 42, borderRadius: TOKEN.radius.md,
                    background: '#FFFFFF', border: `1.5px solid ${C.semantic.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 700, color: C.semantic.foreground }}>去完成</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* 提示卡片 */}
        {!loading && templates.length > 0 && (
          <View style={{ background: C.icon.iconGrayBg, borderRadius: TOKEN.radius.md, padding: 12, border: `1px solid ${C.semantic.border}` }}>
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>每日目标会在每天凌晨 0:00 重置，记得及时完成并领取奖励哦！</Text>
          </View>
        )}
      </View>
    </View>
  )
}
