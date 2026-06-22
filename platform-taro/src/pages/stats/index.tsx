import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useUserStore } from '@/store/useUserStore'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { Progress } from '@/components/ui/Controls'
import { Icon } from '@/components/Icon'
import { C, TOKEN } from '@/styles/theme'
import { getRankInfo, getNextRankInfo, getRankProgress } from '@/utils/rank'
import { getEncouragements, type EncouragementItem } from '@/services/classApi'

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const day = Math.floor(diff / 86400000)
  if (day > 0) return `${day}天前`
  const hour = Math.floor(diff / 3600000)
  if (hour > 0) return `${hour}小时前`
  const min = Math.floor(diff / 60000)
  if (min > 0) return `${min}分钟前`
  return '刚刚'
}

export default function StatsPage() {
  const user = useUserStore()
  const { totalQuestions, correctQuestions, totalDays, weeklyStreak, knowledgeProgress } = user.learningStats
  const correctRate = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0
  const wrongCount = totalQuestions - correctQuestions

  const knowledgeEntries = Object.entries(knowledgeProgress || {}).sort(([, a], [, b]) => (a as number) - (b as number))

  // 段位进度
  const rankInfo = getRankInfo(user.xp, user.systemConfigs)
  const nextRank = getNextRankInfo(user.xp, user.systemConfigs)
  const rankProgress = getRankProgress(user.xp, user.systemConfigs)
  const rankColor = rankInfo?.color || C.semantic.primary

  // 鼓励
  const [encouragements, setEncouragements] = useState<EncouragementItem[]>([])
  const [encouragementTotal, setEncouragementTotal] = useState(0)
  const [encLoading, setEncLoading] = useState(false)

  useEffect(() => {
    if (!user.userId) return
    let active = true
    setEncLoading(true)
    getEncouragements(user.userId).then((res) => {
      if (!active) return
      if (res?.success) {
        setEncouragements(res.list || [])
        setEncouragementTotal(res.total || 0)
      }
    }).finally(() => { if (active) setEncLoading(false) })
    return () => { active = false }
  }, [user.userId])

  return (
    <View style={{ minHeight: '100vh', background: C.pageBg, padding: 16 }}>
      <View style={{ padding: 16, paddingTop: 32 }}>
        <Row justify="space-between" align="center">
          <Title size={22} color={C.semantic.foreground}>学习统计</Title>
        </Row>
      </View>

      {/* 概览卡片 */}
      <Row gap={8} style={{ margin: 8 }}>
        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: TOKEN.shadow.md }}>
          <Icon name="memo" size={28} color={C.semantic.foreground} />
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: C.semantic.foreground }}>{totalQuestions}</Text>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>总答题数</Text>
        </Card>

        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: TOKEN.shadow.md }}>
          <Icon name="goal" size={28} color={C.semantic.primary} />
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: C.semantic.primary }}>{correctRate}%</Text>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>正确率</Text>
        </Card>

        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: TOKEN.shadow.md }}>
          <Icon name="checkCircle" size={28} color={C.duolingo.blue} />
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: C.duolingo.blue }}>{Object.keys(user.completedLevels).length}</Text>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>已通关卡</Text>
        </Card>
      </Row>

      <Row gap={8} style={{ margin: 8 }}>
        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: TOKEN.shadow.md }}>
          <Icon name="sparkles" size={28} color={C.duolingo.purple} />
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: C.duolingo.purple }}>{user.xp}</Text>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>总 XP</Text>
        </Card>

        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: TOKEN.shadow.md }}>
          <Icon name="fire" size={28} color={C.semantic.destructive} />
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: C.semantic.destructive }}>{user.streak}</Text>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>连续天数</Text>
        </Card>
      </Row>

      <Spacer size={8} />

      {/* 正确率详情卡片 */}
      <Card padding={20} style={{ margin: 8, boxShadow: TOKEN.shadow.md }}>
        <Col gap={12}>
          <Title size={16} color={C.semantic.foreground}>正确率详情</Title>
          <Progress value={correctRate} max={100} color={C.semantic.primary} />
          <Row justify="space-between">
            <Text style={{ fontSize: 13, color: C.semantic.primary, fontWeight: 600 }}>答对 {correctQuestions} 题</Text>
            <Text style={{ fontSize: 13, color: C.semantic.destructive, fontWeight: 600 }}>答错 {wrongCount} 题</Text>
          </Row>
        </Col>
      </Card>

      <Spacer size={8} />

      {/* 段位进度卡片 */}
      <Card padding={20} style={{ margin: 8, boxShadow: TOKEN.shadow.md }}>
        <Col gap={12}>
          <Row justify="space-between" align="center">
            <Row gap={8} align="center">
              <Icon name="award" size={20} color={rankColor} />
              <Title size={16} color={C.semantic.foreground}>段位进度</Title>
            </Row>
            <Text style={{ fontSize: 14, fontWeight: 700, color: rankColor }}>{user.rank}</Text>
          </Row>
          <Progress value={rankProgress.current} max={rankProgress.target} color={rankColor} />
          <Row justify="space-between">
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>{rankProgress.current} / {rankProgress.target} XP</Text>
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>{nextRank ? `下一段位: ${nextRank.name}` : '已达最高段位'}</Text>
          </Row>
        </Col>
      </Card>

      <Spacer size={8} />

      {/* 知识点掌握度 */}
      <Card padding={20} style={{ margin: 8, boxShadow: TOKEN.shadow.md }}>
        <Col gap={16}>
          <Title size={16} color={C.semantic.foreground}>知识点掌握度</Title>
          {knowledgeEntries.length === 0 ? (
            <View style={{ padding: 24, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <Icon name="chart" size={40} color={C.semantic.mutedForeground} />
              <Spacer size={8} />
              <Subtitle color={C.semantic.mutedForeground}>暂无学习数据，快去答题吧！</Subtitle>
            </View>
          ) : (
            knowledgeEntries.map(([name, progress]) => {
              const pct = Math.round((progress as number) * 100)
              const pctColor = pct >= 80 ? C.semantic.primary : pct >= 50 ? C.duolingo.gold : C.semantic.destructive
              return (
                <Col key={name} gap={6}>
                  <Row justify="space-between">
                    <Text style={{ fontSize: 14, fontWeight: 600, color: C.semantic.foreground }}>{name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: pctColor }}>{pct}%</Text>
                  </Row>
                  <Progress value={pct} max={100} color={pctColor} />
                </Col>
              )
            })
          )}
        </Col>
      </Card>

      <Spacer size={8} />

      {/* 收到的鼓励卡片 */}
      <Card padding={20} style={{ margin: 8, boxShadow: TOKEN.shadow.md }}>
        <Col gap={12}>
          <Row justify="space-between" align="center">
            <Title size={16} color={C.semantic.foreground}>收到的鼓励</Title>
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>共 {encouragementTotal} 朵</Text>
          </Row>
          {encLoading ? (
            <View style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>加载中...</Text>
            </View>
          ) : encouragements.length > 0 ? (
            <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {encouragements.slice(0, 5).map((item) => (
                <View key={item.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, background: C.semantic.primary + '08' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', background: C.semantic.primary + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.fromUserAvatar ? (
                      <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.primary }}>{(item.fromUserName || '?')[0]}</Text>
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.primary }}>{(item.fromUserName || '?')[0]}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: C.semantic.foreground }} numberOfLines={1}>{item.fromUserName}</Text>
                    <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <Text style={{ fontSize: 20 }}>{item.emoji || '🌸'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: 16, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <Icon name="flower" size={36} color={C.semantic.mutedForeground} />
              <Spacer size={6} />
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>暂无鼓励，继续加油！</Text>
            </View>
          )}
        </Col>
      </Card>

      <Spacer size={8} />

      {/* 更多统计 */}
      <Card padding={16} style={{ margin: 8, boxShadow: TOKEN.shadow.md }}>
        <Col gap={12}>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: C.semantic.mutedForeground }}>累计学习天数</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: C.semantic.foreground }}>{totalDays} 天</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: C.semantic.mutedForeground }}>周连续学习</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: C.semantic.foreground }}>{weeklyStreak} 周</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: C.semantic.mutedForeground }}>答对题数</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: C.semantic.primary }}>{correctQuestions} 题</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: C.semantic.mutedForeground }}>当前段位</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: C.semantic.primary }}>{user.rank}</Text>
          </Row>
        </Col>
      </Card>

      <Spacer size={40} />
    </View>
  )
}
