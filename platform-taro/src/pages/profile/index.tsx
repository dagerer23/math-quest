import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'

export default function ProfilePage() {
  const user = useUserStore()

  const handleLogout = () => {
    user.logout()
    Taro.redirectTo({ url: '/pages/login/index' })
  }

  const setNewGrade = (g: number) => {
    user.setGrade(g)
    Taro.showToast({ title: '已切换年级', icon: 'success' })
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      <View style={{ padding: 16, paddingTop: 32 }}>
        <Title size={22}>个人中心</Title>
      </View>

      {/* 用户卡片 */}
      <Card padding={20} style={{ margin: 8 }}>
        <Row gap={16}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: '#58CC02',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ fontSize: 28, color: '#FFF', fontWeight: 700 }}>
              {(user.profile.nickname || '小')[0]}
            </Text>
          </View>
          <Col gap={4} flex={1}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
              {user.profile.nickname || '小同学'}
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>
              {user.profile.learningStage || '小学'} · {user.rank} · 🔥 {user.streak}
            </Text>
          </Col>
        </Row>
        <Spacer size={12} />
        <Row gap={0} justify="space-between">
          <Col style={{ alignItems: 'center' }} gap={2} flex={1}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{user.xp}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>总 XP</Text>
          </Col>
          <Col style={{ alignItems: 'center' }} gap={2} flex={1}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{user.coins}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>金币</Text>
          </Col>
          <Col style={{ alignItems: 'center' }} gap={2} flex={1}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{user.diamonds}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>钻石</Text>
          </Col>
          <Col style={{ alignItems: 'center' }} gap={2} flex={1}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{user.streak}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>连续天数</Text>
          </Col>
        </Row>
      </Card>

      <Spacer size={8} />

      {/* 年级选择 */}
      <Card padding={16} style={{ margin: 8 }}>
        <Col gap={12}>
          <Title size={16}>选择年级</Title>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <View key={g}>
                <Button
                  size="sm"
                  variant={user.grade === g ? 'primary' : 'secondary'}
                  onClick={() => setNewGrade(g)}
                  style={{ minWidth: 64 }}
                >
                  {g}年级
                </Button>
              </View>
            ))}
          </Row>
        </Col>
      </Card>

      <Spacer size={8} />

      {/* 设置项 */}
      <Card padding={0} style={{ margin: 8 }}>
        {[
          { icon: '⚙️', title: '设置', desc: '声音与振动' },
          { icon: '📚', title: '学习统计', desc: '查看学习进度', action: () => Taro.showToast({ title: '即将上线', icon: 'none' }) },
          { icon: '🏆', title: '成就徽章', desc: '已解锁成就', action: () => Taro.showToast({ title: '即将上线', icon: 'none' }) },
          { icon: '❤️', title: '关于我们', desc: '了解数学探险', action: () => Taro.showToast({ title: '数学探险 v1.0', icon: 'none' }) },
        ].map((item, idx) => (
          <View
            key={item.title}
            onClick={item.action || (() => Taro.showToast({ title: '敬请期待', icon: 'none' }))}
            style={{
              padding: 16,
              borderBottomWidth: idx < 3 ? 1 : 0,
              borderBottomColor: '#F3F4F6',
              borderStyle: 'solid',
              cursor: 'pointer',
            }}
          >
            <Row justify="space-between">
              <Row gap={12} flex={1}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <Col gap={2}>
                  <Text style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</Text>
                </Col>
              </Row>
              <Text style={{ fontSize: 14, color: '#D1D5DB' }}>›</Text>
            </Row>
          </View>
        ))}
      </Card>

      <Spacer size={16} />

      {/* 退出登录 */}
      <Card style={{ margin: 8 }} padding={0}>
        <View
          onClick={handleLogout}
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
        >
          <Text style={{ fontSize: 15, color: '#EF4444', fontWeight: 600 }}>退出登录</Text>
        </View>
      </Card>

      <Spacer size={40} />
    </View>
  )
}
