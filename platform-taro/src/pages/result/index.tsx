import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Spacer, Row, Col } from '@/components/ui/Basic'

export default function ResultPage() {
  const user = useUserStore()
  const record = Taro.getStorageSync('temp_lastRecord') || {
    score: 0,
    stars: 0,
    correctCount: 0,
    totalCount: 0,
    xpGained: 0,
    coinsGained: 0,
  }
  // 读取后清除临时存储
  Taro.removeStorageSync('temp_lastRecord')

  const { stars, correctCount, totalCount, xpGained, coinsGained } = record
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  const goHome = () => {
    Taro.switchTab({ url: '/pages/home/index' })
  }

  const goMistakes = () => {
    Taro.switchTab({ url: '/pages/mistakes/index' })
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      {/* 头部庆祝 */}
      <View style={{ padding: 24, paddingTop: 48, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Text style={{ fontSize: 80 }}>{stars === 3 ? '🏆' : stars === 2 ? '🎉' : stars === 1 ? '👍' : '💪'}</Text>
        <Spacer size={16} />
        <Title size={24}>
          {stars === 3 ? '完美通关！' : stars === 2 ? '表现不错！' : stars === 1 ? '继续加油！' : '别灰心！'}
        </Title>
        <Spacer size={8} />
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          本次答题 {correctCount}/{totalCount} 题，正确率 {accuracy}%
        </Text>
      </View>

      {/* 星级展示 */}
      <Card padding={24} style={{ margin: 8 }}>
        <Row justify="center" gap={16}>
          {[1, 2, 3].map((s) => (
            <Text key={s} style={{ fontSize: 56, opacity: s <= stars ? 1 : 0.2 }}>
              ⭐
            </Text>
          ))}
        </Row>
      </Card>

      <Spacer size={8} />

      {/* 奖励统计 */}
      <Row gap={8} style={{ margin: 8 }}>
        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Text style={{ fontSize: 32 }}>✨</Text>
          <Spacer size={8} />
          <Text style={{ fontSize: 24, fontWeight: 800, color: '#58CC02' }}>+{xpGained}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>经验值</Text>
        </Card>

        <Card padding={16} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Text style={{ fontSize: 32 }}>🪙</Text>
          <Spacer size={8} />
          <Text style={{ fontSize: 24, fontWeight: 800, color: '#FFD23F' }}>+{coinsGained}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>金币</Text>
        </Card>
      </Row>

      <Spacer size={8} />

      {/* 数据汇总 */}
      <Card padding={16} style={{ margin: 8 }}>
        <Col gap={12}>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>当前段位</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#58CC02' }}>{user.rank}</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>总 XP</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{user.xp}</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>金币余额</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{user.coins}</Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 14, color: '#6b7280' }}>连续学习</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>🔥 {user.streak} 天</Text>
          </Row>
        </Col>
      </Card>

      <Spacer size={16} />

      {/* 操作按钮 */}
      <Col gap={12} style={{ padding: 8 }}>
        <Button block size="lg" onClick={goHome}>
          返回首页
        </Button>
        {totalCount - correctCount > 0 && (
          <Button block size="lg" variant="outline" onClick={goMistakes}>
            查看错题（{totalCount - correctCount}）
          </Button>
        )}
      </Col>

      <Spacer size={40} />
    </View>
  )
}
