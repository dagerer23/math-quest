import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { getRankFromXp, getXpProgress } from '@/utils/rank'
import { Card, Title, Subtitle, Row, Col, Spacer, Divider } from '@/components/ui/Basic'
import { Badge, Progress } from '@/components/ui/Controls'

const COLORS = {
  primary: '#58CC02',
  primaryLight: '#E8F5D4',
  bg: '#F8FAF5',
  white: '#FFFFFF',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  textMuted: '#9CA3AF',
  border: '#F0F0F0',
  danger: '#FF3B6B',
  dangerLight: '#FFE0E8',
  warning: '#FFD23F',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  purple: '#7B5BFF',
  purpleLight: '#EDE9FE',
}

export default function StatsPage() {
  const user = useUserStore()
  const { xp, streak, rank, learningStats, achievements, achievementsMeta, systemConfigs } = user
  const { totalQuestions, correctQuestions, totalDays, weeklyStreak, knowledgeProgress } = learningStats

  const accuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0
  const wrongQuestions = totalQuestions - correctQuestions
  const xpProgress = getXpProgress(xp, systemConfigs)
  const xpInRank = xp - xpProgress.current
  const xpToNext = xpProgress.next - xpProgress.current

  const knowledgeEntries = Object.entries(knowledgeProgress)

  const rankEmoji: Record<string, string> = {
    '青铜': '🥉',
    '白银': '🥈',
    '黄金': '🥇',
    '铂金': '💎',
    '钻石': '💠',
    '王者': '👑',
  }

  const statCards = [
    { emoji: '📝', label: '答题总数', value: totalQuestions, color: COLORS.blue, bg: COLORS.blueLight },
    { emoji: '✅', label: '正确率', value: `${accuracy}%`, color: COLORS.primary, bg: COLORS.primaryLight },
    { emoji: '⭐', label: '经验值', value: xp, color: COLORS.warning, bg: '#FEF9E7' },
    { emoji: '🔥', label: '连续天数', value: streak, color: COLORS.danger, bg: COLORS.dangerLight },
    { emoji: '📅', label: '学习天数', value: totalDays, color: COLORS.purple, bg: COLORS.purpleLight },
    { emoji: '🏅', label: '当前段位', value: rank, color: COLORS.blue, bg: COLORS.blueLight },
  ]

  return (
    <View style={{ minHeight: '100vh', background: COLORS.bg }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 48, paddingBottom: 8, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <View
          onClick={() => Taro.navigateBack()}
          style={{ width: 36, height: 36, borderRadius: 18, background: COLORS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          <Text style={{ fontSize: 18, color: COLORS.text }}>←</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, marginLeft: 12 }}>学习统计</Text>
      </View>

      <View style={{ padding: '8px 16px 32px' }}>
        {/* Stat Cards Grid */}
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {statCards.map((card) => (
            <View key={card.label} style={{ width: 'calc(33.33% - 7px)', minWidth: '30%' }}>
              <Card padding={12} style={{ alignItems: 'center' }}>
                <Col align="center" gap={6}>
                  <Text style={{ fontSize: 24 }}>{card.emoji}</Text>
                  <Text style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.value}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{card.label}</Text>
                </Col>
              </Card>
            </View>
          ))}
        </View>

        <Spacer size={16} />

        {/* 正确率详情 */}
        <Card padding={20}>
          <Row justify="space-between" align="flex-start">
            <Col gap={4}>
              <Title size={16}>正确率</Title>
              <Subtitle size={12}>答题正确比例</Subtitle>
            </Col>
            <Text style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary }}>{accuracy}%</Text>
          </Row>
          <Spacer size={12} />
          <Progress value={accuracy} max={100} color={COLORS.primary} height={12} />
          <Spacer size={8} />
          <Row justify="space-between">
            <Row gap={6}>
              <View style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.primary }} />
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>正确 {correctQuestions}</Text>
            </Row>
            <Row gap={6}>
              <View style={{ width: 8, height: 8, borderRadius: 4, background: '#E5E7EB' }} />
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>错误 {wrongQuestions}</Text>
            </Row>
          </Row>
        </Card>

        <Spacer size={16} />

        {/* 段位进度 */}
        <Card padding={20}>
          <Row justify="space-between" align="flex-start">
            <Col gap={4}>
              <Title size={16}>段位进度</Title>
              <Subtitle size={12}>
                {xpProgress.rank} → {xpProgress.nextRank}
              </Subtitle>
            </Col>
            <Row gap={6} align="center">
              <Text style={{ fontSize: 24 }}>{rankEmoji[xpProgress.rank] || '🏅'}</Text>
              <Text style={{ fontSize: 20, fontWeight: 700, color: COLORS.blue }}>{xpProgress.rank}</Text>
            </Row>
          </Row>
          <Spacer size={12} />
          <Progress value={xpInRank} max={xpToNext || 1} color={COLORS.blue} height={12} />
          <Spacer size={8} />
          <Row justify="space-between">
            <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{xp} XP</Text>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{xpProgress.next} XP</Text>
          </Row>
        </Card>

        <Spacer size={16} />

        {/* 知识点掌握度 */}
        <Card padding={20}>
          <Title size={16}>知识点掌握度</Title>
          <Spacer size={4} />
          <Subtitle size={12}>各知识点的学习进度</Subtitle>
          <Spacer size={12} />
          {knowledgeEntries.length > 0 ? (
            <Col gap={14}>
              {knowledgeEntries.map(([name, progress]) => {
                const pct = Math.min(100, Math.round(progress))
                const barColor = pct >= 80 ? COLORS.primary : pct >= 50 ? COLORS.warning : COLORS.danger
                return (
                  <Col key={name} gap={6}>
                    <Row justify="space-between" align="center">
                      <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: 500, flex: 1 }}>{name}</Text>
                      <Badge color={pct >= 80 ? COLORS.primary : pct >= 50 ? '#92400E' : COLORS.danger} bg={pct >= 80 ? COLORS.primaryLight : pct >= 50 ? '#FEF3C7' : COLORS.dangerLight}>
                        {pct}%
                      </Badge>
                    </Row>
                    <Progress value={pct} max={100} color={barColor} height={8} />
                  </Col>
                )
              })}
            </Col>
          ) : (
            <View style={{ padding: '20px 0', display: 'flex', alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>📚</Text>
              <Spacer size={8} />
              <Text style={{ fontSize: 14, color: COLORS.textMuted }}>暂无知识点数据</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>开始学习后这里会显示你的掌握情况</Text>
            </View>
          )}
        </Card>

        <Spacer size={16} />

        {/* 成就 */}
        <Card padding={20}>
          <Row justify="space-between" align="flex-start">
            <Col gap={4}>
              <Title size={16}>成就</Title>
              <Subtitle size={12}>已解锁的成就徽章</Subtitle>
            </Col>
            <Badge color={COLORS.white} bg={achievements.length > 0 ? COLORS.primary : '#E5E7EB'}>
              {achievements.length} / {achievementsMeta.length || achievements.length}
            </Badge>
          </Row>
          <Spacer size={12} />
          {achievements.length > 0 ? (
            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {achievements.map((a) => {
                const meta = achievementsMeta.find((m) => m.id === a.id)
                return (
                  <View
                    key={a.id}
                    style={{
                      width: 'calc(25% - 8px)',
                      minWidth: '22%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: 8,
                      background: COLORS.primaryLight,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{meta?.icon || '🏆'}</Text>
                    <Text style={{ fontSize: 10, color: COLORS.text, fontWeight: 600, textAlign: 'center' }}>{meta?.name || a.id}</Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <View style={{ padding: '20px 0', display: 'flex', alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>🏆</Text>
              <Spacer size={8} />
              <Text style={{ fontSize: 14, color: COLORS.textMuted }}>暂无成就</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>继续学习来解锁成就吧</Text>
            </View>
          )}
        </Card>

        <Spacer size={32} />
      </View>
    </View>
  )
}
