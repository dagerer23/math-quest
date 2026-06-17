import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { LEVELS } from '@/data/questionBank'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import type { Level } from '@/types/models'

function getGradeName(g: number): string {
  const names: Record<number, string> = { 1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' }
  return names[g] || `${g}年级`
}

function getLevelsForGrade(grade: number): Level[] {
  const data = (LEVELS as any)[`g${grade}`]
  if (!data) return []
  return data.levels || []
}

export default function HomePage() {
  const user = useUserStore()
  const grade = user.grade || 1
  const levels = getLevelsForGrade(grade)

  useDidShow(() => {
    if (!user.isLoggedIn) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  })

  const startLevel = (level: Level) => {
    const qs = (LEVELS as any)[`g${grade}`]?.questions?.[level.id] || []
    if (qs.length === 0) {
      Taro.showToast({ title: '暂无题目', icon: 'none' })
      return
    }
    ;(Taro as any).currentLevel = level
    ;(Taro as any).currentQuestions = qs
    Taro.navigateTo({ url: '/pages/assessment/index' })
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5' }}>
      <View style={{ background: 'linear-gradient(135deg, #58CC02 0%, #8DE30A 100%)', padding: 24, paddingTop: 40, color: '#FFF' }}>
        <Row justify="space-between">
          <Col gap={4}>
            <Text style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>你好，{user.profile.nickname || '小同学'}！</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{getGradeName(grade)} · 今日已练习 {user.dailyQuestions} 题</Text>
          </Col>
          <Col gap={4} style={{ alignItems: 'flex-end' }}>
            <Row gap={12}>
              <Col style={{ alignItems: 'center' }} gap={0}><Text style={{ fontSize: 20, fontWeight: 700, color: '#FFF' }}>{user.xp}</Text><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>XP</Text></Col>
              <Col style={{ alignItems: 'center' }} gap={0}><Text style={{ fontSize: 20, fontWeight: 700, color: '#FFF' }}>{user.coins}</Text><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>金币</Text></Col>
              <Col style={{ alignItems: 'center' }} gap={0}><Text style={{ fontSize: 20, fontWeight: 700, color: '#FFF' }}>❤️{user.hearts}</Text><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>体力</Text></Col>
            </Row>
          </Col>
        </Row>
        <Spacer size={16} />
        <Row justify="space-between">
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>段位：{user.rank}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>🔥 连续 {user.streak} 天</Text>
        </Row>
      </View>

      <View style={{ padding: 16 }}>
        <Row justify="space-between">
          <Title size={18}>关卡地图</Title>
          <Subtitle size={13}>{getGradeName(grade)} · 共 {levels.length} 关</Subtitle>
        </Row>
        <Spacer size={12} />

        {levels.map((level: Level, idx: number) => {
          const unlocked = user.unlockedLevels.includes(level.id) || idx === 0
          const completed = user.completedLevels[level.id]
          const stars = completed?.stars || 0

          return (
            <View key={level.id}>
              <Card padding={16} style={{ marginTop: 8, marginBottom: 8, opacity: unlocked ? 1 : 0.5, background: level.isBoss ? '#FFF7ED' : '#FFFFFF', border: level.isBoss ? '2px solid #F59E0B' : undefined }}>
                <Row justify="space-between">
                  <Col gap={8} flex={1}>
                    <Row gap={8}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, background: unlocked ? (level.isBoss ? '#F59E0B' : '#58CC02') : '#D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                        <Text style={{ fontSize: 18, color: '#FFF', fontWeight: 700 }}>{level.isBoss ? '👑' : (idx + 1)}</Text>
                      </View>
                      <Col gap={2} flex={1}>
                        <Text style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{level.title}</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>{level.description || `${level.knowledgePoints?.join(' · ') || '综合练习'}`}</Text>
                        <Row gap={6} style={{ marginTop: 4 }}>
                          {[1, 2, 3].map((s) => <Text key={s} style={{ fontSize: 14 }}>{s <= stars ? '⭐' : '☆'}</Text>)}
                        </Row>
                      </Col>
                    </Row>
                  </Col>
                  <Button size="sm" variant={unlocked ? 'primary' : 'secondary'} onClick={() => unlocked && startLevel(level)} disabled={!unlocked}>
                    {unlocked ? (completed ? '继续' : '开始') : '🔒'}
                  </Button>
                </Row>
              </Card>
            </View>
          )
        })}
      </View>

      <Spacer size={40} />
    </View>
  )
}
