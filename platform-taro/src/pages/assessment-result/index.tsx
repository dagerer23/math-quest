import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'

const DIFFICULTY_LABELS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: '基础', desc: '从基础开始，稳扎稳打', color: '#58CC02' },
  2: { label: '进阶', desc: '有一定基础，挑战提升', color: '#FFD23F' },
  3: { label: '拔高', desc: '基础扎实，冲刺高分', color: '#FF6B35' },
}

export default function AssessmentResultPage() {
  const user = useUserStore()
  const assessment = user.assessment

  const score = assessment?.score ?? 0
  const recommendedDifficulty = assessment?.recommendedDifficulty ?? 1
  const diffInfo = DIFFICULTY_LABELS[recommendedDifficulty] || DIFFICULTY_LABELS[1]
  const totalQuestions = assessment?.answers?.length ?? 0
  const correctCount = assessment?.answers?.filter((a: any) => a.isCorrect).length ?? 0
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  const goHome = () => {
    Taro.switchTab({ url: '/pages/home/index' })
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      {/* 头部 */}
      <View style={{ padding: 24, paddingTop: 48, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Text style={{ fontSize: 80 }}>{score >= 80 ? '🏆' : score >= 60 ? '🎉' : '💪'}</Text>
        <Spacer size={16} />
        <Title size={24}>
          {score >= 80 ? '太棒了！' : score >= 60 ? '表现不错！' : '继续加油！'}
        </Title>
        <Spacer size={8} />
        <Subtitle size={15}>测评已完成</Subtitle>
      </View>

      {/* 分数展示 */}
      <Card padding={24} style={{ margin: 8, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Text style={{ fontSize: 56, fontWeight: 800, color: '#58CC02' }}>{score}</Text>
        <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>测评得分</Text>
        <Spacer size={12} />
        <Row gap={16}>
          <Col style={{ alignItems: 'center' }} gap={2}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{correctCount}/{totalQuestions}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>答对题数</Text>
          </Col>
          <Col style={{ alignItems: 'center' }} gap={2}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#58CC02' }}>{accuracy}%</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>正确率</Text>
          </Col>
        </Row>
      </Card>

      <Spacer size={8} />

      {/* 推荐难度 */}
      <Card padding={20} style={{ margin: 8 }}>
        <Col gap={12}>
          <Title size={16}>推荐学习难度</Title>
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              background: '#F8FAF5',
              border: `2px solid ${diffInfo.color}`,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: diffInfo.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{recommendedDifficulty}</Text>
            </View>
            <Col gap={2} flex={1}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: diffInfo.color }}>{diffInfo.label}</Text>
              <Text style={{ fontSize: 13, color: '#6b7280' }}>{diffInfo.desc}</Text>
            </Col>
          </View>
        </Col>
      </Card>

      <Spacer size={16} />

      {/* 开始学习按钮 */}
      <Col gap={12} style={{ padding: 8 }}>
        <Button block size="lg" onClick={goHome}>
          开始学习 🚀
        </Button>
      </Col>

      <Spacer size={40} />
    </View>
  )
}
