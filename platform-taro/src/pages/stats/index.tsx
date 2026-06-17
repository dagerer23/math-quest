import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { Progress } from '@/components/ui/Controls'

export default function StatsPage() {
  const user = useUserStore()
  const { totalQuestions, correctQuestions, totalDays, weeklyStreak, knowledgeProgress } = user.learningStats
  const correctRate = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0

  const knowledgeEntries = Object.entries(knowledgeProgress || {})

  const goBack = () => {
    Taro.navigateBack()
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      <View style={{ padding: 16, paddingTop: 32 }}>
        <Row justify="space-between" align="center">
          <Title size={22}>学习统计</Title>
          <Button variant="ghost" size="sm" onClick={goBack}>← 返回</Button>
        </Row>
      </View>

      {/* 概览卡片 */}
      <Row gap={8} style={{ margin: 8 }}>
        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Text style={{ fontSize: 28 }}>📝</Text>
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{totalQuestions}</Text>
          <Text style={{ fontSize: 11, color: '#6b7280' }}>总答题数</Text>
        </Card>

        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Text style={{ fontSize: 28 }}>🎯</Text>
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: '#58CC02' }}>{correctRate}%</Text>
          <Text style={{ fontSize: 11, color: '#6b7280' }}>正确率</Text>
        </Card>
      </Row>

      <Row gap={8} style={{ margin: 8 }}>
        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Text style={{ fontSize: 28 }}>✨</Text>
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: '#7B5BFF' }}>{user.xp}</Text>
          <Text style={{ fontSize: 11, color: '#6b7280' }}>总 XP</Text>
        </Card>

        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Text style={{ fontSize: 28 }}>🔥</Text>
          <Spacer size={4} />
          <Text style={{ fontSize: 22, fontWeight: 800, color: '#FF6B35' }}>{user.streak}</Text>
          <Text style={{ fontSize: 11, color: '#6b7280' }}>连续天数</Text>
        </Card>
      </Row>

      <Spacer size={8} />

      {/* 知识点掌握度 */}
      <Card padding={20} style={{ margin: 8 }}>
        <Col gap={16}>
          <Title size={16}>知识点掌握度</Title>
          {knowledgeEntries.length === 0 ? (
            <View style={{ padding: 24, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <Text style={{ fontSize: 40 }}>📊</Text>
              <Spacer size={8} />
              <Subtitle>暂无学习数据，快去答题吧！</Subtitle>
            </View>
          ) : (
            knowledgeEntries.map(([name, progress]) => {
              const pct = Math.round(progress * 100)
              return (
                <Col key={name} gap={6}>
                  <Row justify="space-between">
                    <Text style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{name}</Text>
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>{pct}%</Text>
                  </Row>
                  <Progress value={pct} max={100} color={pct >= 80 ? '#58CC02' : pct >= 50 ? '#FFD23F' : '#EF4444'} />
                </Col>
              )
            })
          )}
        </Col>
      </Card>

      <Spacer size={8} />

      {/* 更多统计 */}
      <Card padding={16} style={{ margin: 8 }}>
        <Col gap={12}>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>累计学习天数</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{totalDays} 天</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>周连续学习</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{weeklyStreak} 周</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>答对题数</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#58CC02' }}>{correctQuestions} 题</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>当前段位</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#58CC02' }}>{user.rank}</Text>
          </Row>
        </Col>
      </Card>

      <Spacer size={40} />
    </View>
  )
}
