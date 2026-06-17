import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'

export default function DailyGoalsPage() {
  const user = useUserStore()

  const goals = [
    { id: 'daily-q3', title: '完成 3 道题', current: Math.min(user.dailyQuestions, 3), target: 3, reward: { xp: 20, coins: 10 } },
    { id: 'daily-q10', title: '完成 10 道题', current: Math.min(user.dailyQuestions, 10), target: 10, reward: { xp: 50, coins: 30 } },
    { id: 'daily-xp', title: '获得 100 XP', current: Math.min(user.dailyXp, 100), target: 100, reward: { xp: 30, coins: 20 } },
    { id: 'daily-streak', title: '连续登录签到', current: user.streak > 0 ? 1 : 0, target: 1, reward: { xp: 15, coins: 10 } },
  ]

  const checkIn = () => {
    const r = user.checkIn()
    Taro.showToast({ title: r.message, icon: 'none' })
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      <View style={{ padding: 16, paddingTop: 32 }}>
        <Title size={22}>每日目标</Title>
        <Subtitle size={14}>每天坚持，积少成多！</Subtitle>
      </View>

      <Card padding={20} style={{ margin: 8 }}>
        <Row justify="space-between">
          <Col gap={4}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>今日签到</Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>已连续签到 {user.streak} 天</Text>
          </Col>
          <Button size="md" onClick={checkIn}>立即签到</Button>
        </Row>
      </Card>

      <Spacer size={12} />

      {goals.map((g) => {
        const done = g.current >= g.target
        const pct = g.target > 0 ? (g.current / g.target) * 100 : 0

        return (
          <Card key={g.id} padding={16} style={{ margin: 8, marginTop: 8 }}>
            <Row justify="space-between">
              <Col gap={4} flex={1}>
                <Text style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{g.title}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>奖励：+{g.reward.xp} XP · +{g.reward.coins} 金币</Text>
                <View style={{ marginTop: 8, height: 8, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${pct}%`, background: done ? '#58CC02' : '#FFD23F', borderRadius: 999 }} />
                </View>
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{g.current} / {g.target}</Text>
              </Col>
              <Col style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>{done ? '✅' : '🎯'}</Text>
              </Col>
            </Row>
          </Card>
        )
      })}

      <Spacer size={40} />
    </View>
  )
}
