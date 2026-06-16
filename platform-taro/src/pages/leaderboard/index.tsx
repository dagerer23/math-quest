import { View, Text } from '@tarojs/components'
import { useUserStore } from '@/store/useUserStore'
import { Avatar, Badge } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'

const MOCK_RANKINGS = [
  { id: 'p1', name: '数学小达人', avatar: '小', xp: 12800, rank: '王者', streak: 30 },
  { id: 'p2', name: '闪电计算', avatar: '闪', xp: 9200, rank: '钻石', streak: 25 },
  { id: 'p3', name: '算术小能手', avatar: '算', xp: 7650, rank: '钻石', streak: 18 },
  { id: 'p4', name: '逻辑大师', avatar: '逻', xp: 6400, rank: '铂金', streak: 15 },
  { id: 'p5', name: '小神童', avatar: '神', xp: 5200, rank: '铂金', streak: 12 },
  { id: 'p6', name: '数字爱好者', avatar: '数', xp: 4100, rank: '黄金', streak: 10 },
  { id: 'p7', name: '计算达人', avatar: '计', xp: 3200, rank: '黄金', streak: 8 },
  { id: 'p8', name: '智慧星', avatar: '智', xp: 2100, rank: '白银', streak: 6 },
  { id: 'p9', name: '小天才', avatar: '天', xp: 1500, rank: '白银', streak: 5 },
  { id: 'p10', name: '初学者', avatar: '初', xp: 800, rank: '青铜', streak: 3 },
]

export default function LeaderboardPage() {
  const user = useUserStore()

  const allRankings = [...MOCK_RANKINGS].sort((a, b) => b.xp - a.xp)
  const top3 = allRankings.slice(0, 3)
  const others = allRankings.slice(3)

  const myRank = Math.max(
    allRankings.findIndex((p) => p.xp < user.xp),
    allRankings.findIndex((p) => p.xp <= user.xp) + 1,
    0
  )

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      <View style={{ padding: 16, paddingTop: 32 }}>
        <Title size={22}>🏆 排行榜</Title>
        <Subtitle size={14}>和全国小朋友一起比拼</Subtitle>
      </View>

      {/* 我的排名 */}
      <Card padding={16} style={{ margin: 8, background: 'linear-gradient(135deg, #58CC02 0%, #8DE30A 100%)' }}>
        <Row justify="space-between">
          <Col gap={4} flex={1}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>我的排名</Text>
            <Text style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>
              第 {myRank + 1} 名
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>
              {user.xp} XP · {user.rank} · 🔥 {user.streak} 天
            </Text>
          </Col>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ fontSize: 28 }}>🧑</Text>
          </View>
        </Row>
      </Card>

      <Spacer size={12} />

      {/* Top 3 */}
      <Row justify="center" gap={8} style={{ marginTop: 8, marginBottom: 8 }}>
        {[top3[1], top3[0], top3[2]].map((p, idx) => {
          const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3
          const height = rank === 1 ? 130 : 100
          const bg = rank === 1 ? '#FFD23F' : rank === 2 ? '#E5E7EB' : '#F59E0B'
          if (!p) return <View key={rank} style={{ width: 100 }} />
          return (
            <Col key={p.id} style={{ alignItems: 'center' }} gap={4}>
              <Text style={{ fontSize: rank === 1 ? 36 : 28 }}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</Text>
              <Avatar name={p.name} size={rank === 1 ? 64 : 48} />
              <Text style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', maxWidth: 80, textAlign: 'center' }}>
                {p.name}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  padding: '8px 12px',
                  background: bg,
                  borderRadius: 12,
                  minWidth: 70,
                  height,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{p.xp}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>XP</Text>
              </View>
            </Col>
          )
        })}
      </Row>

      <Spacer size={16} />

      {/* 其他人 */}
      <Card padding={0} style={{ margin: 8 }}>
        {others.map((p, idx) => (
          <View
            key={p.id}
            style={{
              padding: 16,
              borderBottomWidth: idx < others.length - 1 ? 1 : 0,
              borderBottomColor: '#F3F4F6',
              borderStyle: 'solid',
            }}
          >
            <Row justify="space-between">
              <Row gap={12} flex={1}>
                <Text style={{ fontSize: 16, fontWeight: 700, color: '#6b7280', width: 20 }}>
                  {idx + 4}
                </Text>
                <Avatar name={p.name} size={40} />
                <Col gap={2} flex={1}>
                  <Text style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    🔥 {p.streak} 天 · {p.rank}
                  </Text>
                </Col>
              </Row>
              <Col style={{ alignItems: 'flex-end' }} gap={2}>
                <Text style={{ fontSize: 16, fontWeight: 700, color: '#58CC02' }}>{p.xp}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>XP</Text>
              </Col>
            </Row>
          </View>
        ))}
      </Card>

      <Spacer size={40} />
    </View>
  )
}
