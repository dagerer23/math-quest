import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useSessionStore } from '@/store/useSessionStore'
import { getLevelsByGrade, getLevelDetail, generateQuestions } from '@/services/content'
import { getLevelMastery } from '@/components/home/helpers'
import { getThemeByGrade } from '@/components/home/themes'
import { todayKey } from '@/utils/time'
import { GameMap } from '@/components/map/GameMap'
import { COLORS as MAP_COLORS } from '@/components/map/constants'
import { C, TOKEN, btnShadow } from '@/styles/theme'
import { Icon } from '@/components/Icon'
import { getAvatarUrl } from '@/utils/avatar'
import type { Level } from '@/types/models'

// 顶部资源胶囊（带渐变浅底）
function ResourceCapsule({ icon, value, gradient, color }: { icon: string; value: string | number; gradient: string; color: string }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, borderRadius: 8, background: gradient, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(0,0,0,0.04)' }}>
      <Icon name={icon} size={15} color={color} />
      <Text style={{ fontSize: 13, fontWeight: 800, color: C.semantic.foreground }}>{value}</Text>
    </View>
  )
}

// 昵称首字符兜底
function getInitial(name: string): string {
  return (name || '?')[0]
}

export default function HomePage() {
  const user = useUserStore()
  const startSession = useSessionStore((s) => s.start)

  // 屏幕宽度，用于关卡地图布局
  const [winWidth, setWinWidth] = useState(375)
  const [winHeight, setWinHeight] = useState(667)
  useEffect(() => {
    try {
      const info = Taro.getSystemInfoSync()
      setWinWidth(info.windowWidth || 375)
      setWinHeight(info.windowHeight || 667)
    } catch { /* ignore */ }
  }, [])

  // 当前年级（1-9）
  const selectedGrade = Math.max(1, Math.min(9, user.grade || user.profile.targetGrade || 1))
  const theme = getThemeByGrade(selectedGrade)
  // 心形恢复时间（分钟），用于心数耗尽弹窗文案
  const heartRecoverMinutes = Number(user.systemConfigs?.['heart.recoverMinutes']) || 30

  const [visibleLevels, setVisibleLevels] = useState<Level[]>([])
  const [loadingLevels, setLoadingLevels] = useState(true)
  const [navigating, setNavigating] = useState(false)
  const [navigatingLevelId, setNavigatingLevelId] = useState<string | null>(null)
  const [scrollIntoView, setScrollIntoView] = useState('')
  const [showNoHearts, setShowNoHearts] = useState(false)

  useDidShow(() => {
    // 设置导航栏标题为品牌名
    Taro.setNavigationBarTitle({ title: '算力先锋' })
    if (!user.isLoggedIn) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  })

  // 从后端拉取关卡（降级到本地）
  useEffect(() => {
    let cancelled = false
    setLoadingLevels(true)
    getLevelsByGrade(selectedGrade).then((levels) => {
      if (cancelled) return
      setVisibleLevels(levels)
      setLoadingLevels(false)
    }).catch(() => {
      if (cancelled) return
      setVisibleLevels([])
      setLoadingLevels(false)
    })
    return () => { cancelled = true }
  }, [selectedGrade])

  // 关卡状态
  const getLevelStatus = useCallback((levelId: string, index: number) => {
    const isUnlocked = user.unlockedLevels.includes(levelId)
      // 兜底:若没有任何解锁记录,默认第一关可玩
      || (index === 0 && user.unlockedLevels.length === 0)
    const isCompleted = !!user.completedLevels[levelId]
    return { isUnlocked, isCompleted }
  }, [user.unlockedLevels, user.completedLevels])

  // 当前关（第一个已解锁且未通关）
  const currentLevelIndex = useMemo(() => {
    return visibleLevels.findIndex((l, i) => {
      const { isUnlocked, isCompleted } = getLevelStatus(l.id, i)
      return isUnlocked && !isCompleted
    })
  }, [visibleLevels, getLevelStatus])

  // 进入当前关时自动滚动定位
  useEffect(() => {
    if (currentLevelIndex < 0 || loadingLevels) return
    const timer = setTimeout(() => setScrollIntoView(`ln-${currentLevelIndex}`), 350)
    return () => clearTimeout(timer)
  }, [currentLevelIndex, loadingLevels, selectedGrade])

  // 点击进入关卡
  const enterLevel = useCallback(async (level: Level) => {
    if (navigating) return
    // 心数检查:没有心数时弹出心数耗尽弹窗
    if (user.hearts <= 0) {
      setShowNoHearts(true)
      return
    }

    setNavigating(true)
    setNavigatingLevelId(level.id)
    try {
      // 拉取关卡详情
      const levelDetail = await getLevelDetail(level.id)
      if (!levelDetail) {
        Taro.showToast({ title: '关卡加载失败', icon: 'none' })
        return
      }
      // 基于掌握度动态生成题目
      const userMastery = user.learningStats.knowledgeProgress || {}
      const recentIds = user.mistakeIds
      const questions = await generateQuestions(level.id, userMastery, recentIds)
      if (!questions || questions.length === 0) {
        Taro.showToast({ title: '题目生成失败', icon: 'none' })
        return
      }
      // 存入会话 store，跳转答题页
      startSession(levelDetail, questions)
      Taro.navigateTo({ url: `/pages/battle/index?levelId=${level.id}&grade=${selectedGrade}` })
    } catch {
      Taro.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    } finally {
      // 延迟重置，避免点击穿透
      setTimeout(() => {
        setNavigating(false)
        setNavigatingLevelId(null)
      }, 400)
    }
  }, [navigating, user.hearts, user.maxHearts, user.systemConfigs, user.learningStats.knowledgeProgress, user.mistakeIds, startSession, selectedGrade])

  // 签到
  const checkedInToday = user.lastCheckInDate === todayKey()
  const handleCheckIn = () => {
    const result = user.checkIn()
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' })
  }

  // 顶部信息栏高度（用于 ScrollView 高度计算）
  const scrollViewHeight = Math.max(320, winHeight - 96)

  // 准备 GameMap 需要的 props
  const gameMapProps = useMemo(() => {
    // 星数映射
    const starsByLevelId: Record<string, number> = {}
    Object.entries(user.completedLevels).forEach(([id, data]) => {
      starsByLevelId[id] = data.stars || 0
    })
    // 已解锁集合
    const unlockedSet = new Set(user.unlockedLevels)
    // 已完成集合
    const completedSet = new Set(Object.keys(user.completedLevels))
    // 锚点 id
    const scrollAnchorId = `ln-${currentLevelIndex}`

    return {
      levels: visibleLevels,
      starsByLevelId,
      unlockedSet,
      completedSet,
      currentLevelIndex,
      navigatingLevelId,
      onLevelClick: enterLevel,
      scrollAnchorId,
    }
  }, [visibleLevels, user.completedLevels, user.unlockedLevels, currentLevelIndex, navigatingLevelId, enterLevel])

  return (
    <View style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', flexDirection: 'column' }}>
      {/* ═══ 顶部 Header ═══ */}
      <View style={{ paddingTop: 12, paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 左侧：头像 + 昵称 + Lv + 火焰 */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <View
              style={{
                width: 40, height: 40, borderRadius: 16, overflow: 'hidden',
                borderWidth: 2, borderStyle: 'solid', borderColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #58CC0218, #58CC0208)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {user.profile.avatar ? (
                <Image src={getAvatarUrl(user.profile.avatar)} mode="aspectFill" style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: 700, color: '#58CC02' }}>{getInitial(user.profile.nickname || '用户')}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: 800, color: C.semantic.foreground }} numberOfLines={1}>
                {user.profile.nickname || '数学爱好者'}
              </Text>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', backgroundColor: '#58CC02', paddingLeft: 5, paddingRight: 5, paddingTop: 1, paddingBottom: 1, borderRadius: 4 }}>
                  Lv.{Math.floor(user.xp / 100) + 1}
                </Text>
                {user.streak > 0 && (
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                    <Icon name="fire" size={10} color={C.semantic.destructive} />
                    <Text style={{ fontSize: 10, fontWeight: 700, color: '#FF9600' }}>{user.streak}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 右侧：资源胶囊 + 签到 */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ResourceCapsule icon="heart" value={`${user.hearts}/${user.maxHearts}`} gradient="linear-gradient(135deg, #FFF0F0, #FFE8E8)" color={C.semantic.destructive} />
            <ResourceCapsule icon="coin" value={user.coins} gradient="linear-gradient(135deg, #FFF8EB, #FFEDC8)" color={C.duolingo.gold} />
            <ResourceCapsule icon="sparkles" value={user.diamonds} gradient="linear-gradient(135deg, #EEF3FF, #DDE8FF)" color={C.duolingo.purple} />
            <View
              onClick={handleCheckIn}
              style={{
                height: 28, paddingLeft: 10, paddingRight: 10, borderRadius: 8,
                backgroundColor: checkedInToday ? C.semantic.border : '#58CC02',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: checkedInToday ? 'none' : '0 2px 0 #4CAF00',
                opacity: checkedInToday ? 0.7 : 1,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: 800, color: '#FFFFFF' }}>{checkedInToday ? '已签' : '签到'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ═══ 关卡地图（纵向滚动） ═══ */}
      <ScrollView
        scrollY
        scrollIntoView={scrollIntoView}
        style={{
          height: scrollViewHeight,
          background: MAP_COLORS.bgBot,
        }}
      >
        {loadingLevels && (
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>加载关卡中...</Text>
          </View>
        )}

        {!loadingLevels && visibleLevels.length === 0 && (
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingLeft: 32, paddingRight: 32 }}>
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Icon name="construction" size={60} color={C.semantic.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>该年级内容筹备中</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', lineHeight: 1.6 }}>
                我们正在精心准备这一年级的数学关卡，敬请期待！
              </Text>
            </View>
          </View>
        )}

        {!loadingLevels && visibleLevels.length > 0 && (
          <GameMap {...gameMapProps} />
        )}
      </ScrollView>

      {/* ═══ 心数耗尽提示弹窗（对齐 Web 端样式） ═══ */}
      {showNoHearts && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 24,
            paddingRight: 24,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
          onClick={() => setShowNoHearts(false)}
        >
          <View
            className="taro-pop-in"
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: '#FFFFFF',
              borderRadius: TOKEN.radius['2xl'],
              paddingTop: 24,
              paddingBottom: 24,
              paddingLeft: 24,
              paddingRight: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: TOKEN.shadow.lg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="heart" size={48} color={C.semantic.destructive} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 6 }}>
              心数用完了
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.6, textAlign: 'center', marginBottom: 20 }}>
              再等{heartRecoverMinutes}分钟就能恢复啦～{'\n'}休息一下，过会儿再来挑战吧！
            </Text>
            <View style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <View
                className="taro-btn-press"
                style={{
                  backgroundColor: theme.accent,
                  borderRadius: TOKEN.radius.lg,
                  paddingTop: 10,
                  paddingBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  boxShadow: btnShadow(theme.accent),
                }}
                onClick={() => setShowNoHearts(false)}
              >
                <Text style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>知道了</Text>
              </View>
              <View
                className="taro-btn-press"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: TOKEN.radius.lg,
                  paddingTop: 10,
                  paddingBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px solid ${theme.accentSoft}`,
                }}
                onClick={() => {
                  user.refillHearts()
                  setShowNoHearts(false)
                  Taro.showToast({ title: `已恢复 ${user.maxHearts} 颗心`, icon: 'none' })
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>
                  立即恢复 {user.maxHearts}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
