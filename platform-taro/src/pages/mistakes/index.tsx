import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { LEVELS } from '@/data/questionBank'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'

export default function MistakesPage() {
  const user = useUserStore()
  const mistakeIds = user.mistakeIds || []

  // 从题库中查找错题
  const findQuestion = (id: string) => {
    for (const gKey of Object.keys(LEVELS)) {
      const g = (LEVELS as any)[gKey]
      if (!g?.questions) continue
      for (const qList of Object.values<any>(g.questions)) {
        const found = (qList as any[]).find((q) => q.id === id)
        if (found) return found
      }
    }
    return null
  }

  const mistakes = mistakeIds
    .map((id) => findQuestion(id))
    .filter(Boolean)

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      <View style={{ padding: 16, paddingTop: 32 }}>
        <Title size={22}>错题本</Title>
        <Subtitle size={14}>共 {mistakes.length} 道需要复习</Subtitle>
      </View>

      {mistakes.length === 0 ? (
        <Card padding={40} style={{ margin: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Text style={{ fontSize: 64 }}>🎉</Text>
          <Spacer size={16} />
          <Title size={18}>太棒了！暂无错题</Title>
          <Spacer size={8} />
          <Subtitle size={13}>继续保持，每次答对都能巩固知识</Subtitle>
        </Card>
      ) : (
        mistakes.map((q: any, idx: number) => (
          <Card key={q.id} padding={16} style={{ margin: 8, marginTop: 8 }}>
            <Row justify="space-between">
              <Col gap={6} flex={1}>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  第 {idx + 1} 题 · {q.knowledgePoint || '综合'}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.5 }}>
                  {q.prompt}
                </Text>
                <Text style={{ fontSize: 13, color: '#58CC02', marginTop: 4 }}>
                  ✅ 正确答案：{q.answer}
                </Text>
                {q.explanation && (
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    💡 {q.explanation}
                  </Text>
                )}
              </Col>
              <Col style={{ alignItems: 'center' }} gap={4}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // 单个复习
                    ;(Taro as any).currentLevel = { id: 'mistake-review', grade: 1, title: '错题复习', sortOrder: 0 }
                    ;(Taro as any).currentQuestions = [q]
                    Taro.navigateTo({ url: '/pages/assessment/index' })
                  }}
                >
                  再练一次
                </Button>
              </Col>
            </Row>
          </Card>
        ))
      )}

      <Spacer size={40} />
    </View>
  )
}
