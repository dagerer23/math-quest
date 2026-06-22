import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button, Progress } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { Icon } from '@/components/Icon'
import { getRankInfo, getNextRankInfo, getRankProgress } from '@/utils/rank'
import type { SessionRecord } from '@/types/models'
import { C, TOKEN, btnShadow } from '@/styles/theme'

const primaryLight = 'rgba(88,204,2,0.08)'

// 花式赞美文案库
const PRAISES = {
  perfect: [
    '太棒了！完美通关！',
    '简直是数学天才！',
    '全对！你太厉害了！',
    '完美表现！',
    '零失误！这就是实力！',
  ],
  excellent: [
    '非常棒！',
    '优秀！继续保持！',
    '太厉害了！',
    '优秀的表现！',
    '做得很好！',
  ],
  good: [
    '不错哦！',
    '很棒！继续加油！',
    '做得好！',
    '表现不错！',
    '很棒的尝试！',
  ],
  try: [
    '别灰心，继续努力！',
    '加油！下次会更好！',
    '没关系，多多练习！',
    '坚持就是胜利！',
    '继续加油！',
  ],
}

// 装饰性图标
const DECORATIONS = ['party', 'sparkles', 'sparkles', 'sparkles', 'star', 'party', 'party', 'trophy']

// 根据正确率选择赞美文案
function getPraise(accuracy: number, configs?: Record<string, string>): string {
  const perfect = Number(configs?.['result.praise.perfect']) || 100
  const excellent = Number(configs?.['result.praise.excellent']) || 80
  const good = Number(configs?.['result.praise.good']) || 60
  let cat: keyof typeof PRAISES
  if (accuracy >= perfect) cat = 'perfect'
  else if (accuracy >= excellent) cat = 'excellent'
  else if (accuracy >= good) cat = 'good'
  else cat = 'try'
  const texts = PRAISES[cat]
  return texts[Math.floor(Math.random() * texts.length)]
}

export default function ResultPage() {
  const user = useUserStore()
  const [record, setRecord] = useState<SessionRecord | null>(null)
  const [praiseText, setPraiseText] = useState('')
  // 星级逐颗点亮的阶段：0 未亮，1/2/3 依次亮起
  const [starStage, setStarStage] = useState(0)
  const [showAchievements, setShowAchievements] = useState(false)

  useEffect(() => {
    // 从临时存储读取答题记录（由答题页 battle/assessment 写入）
    const r = Taro.getStorageSync('temp_lastRecord') as SessionRecord | null
    if (r) {
      Taro.removeStorageSync('temp_lastRecord')
      setRecord(r)
      const accuracy = r.totalCount > 0 ? Math.round((r.correctCount / r.totalCount) * 100) : 0
      setPraiseText(getPraise(accuracy, user.systemConfigs))
      // 星级逐颗点亮动画（用 setTimeout 模拟）
      const timers: ReturnType<typeof setTimeout>[] = []
      if (r.stars >= 1) timers.push(setTimeout(() => setStarStage(1), 400))
      if (r.stars >= 2) timers.push(setTimeout(() => setStarStage(2), 800))
      if (r.stars >= 3) timers.push(setTimeout(() => setStarStage(3), 1200))
      // 成就解锁展示
      if (user.achievements.length > 0) {
        timers.push(setTimeout(() => setShowAchievements(true), 1600))
      }
      return () => timers.forEach((t) => clearTimeout(t))
    }
  }, [])

  // 没有可显示的结算数据
  if (!record) {
    return (
      <View style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column' }}>
        <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />
        <View style={{ padding: 16, borderBottom: `1px solid ${C.semantic.border}`, background: '#fff' }}>
          <Title size={18} color={C.semantic.foreground}>结算</Title>
        </View>
        <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Icon name="frown" size={56} color={C.semantic.mutedForeground} />
            <Spacer size={16} />
            <Subtitle size={14} color={C.semantic.mutedForeground}>没有可显示的结算数据</Subtitle>
            <Spacer size={16} />
            <Button size="lg" onClick={() => Taro.switchTab({ url: '/pages/home/index' })} style={{ boxShadow: btnShadow(C.duolingo.greenDark) }}>返回首页</Button>
          </View>
        </View>
      </View>
    )
  }

  const accuracy = record.totalCount > 0 ? Math.round((record.correctCount / record.totalCount) * 100) : 0
  const wrongCount = Math.max(0, record.totalCount - record.correctCount)
  const stars = record.stars

  // 段位进度
  const rankInfo = getRankInfo(user.xp, user.systemConfigs)
  const nextRank = getNextRankInfo(user.xp, user.systemConfigs)
  const rankProgress = getRankProgress(user.xp, user.systemConfigs)

  // 最近解锁的成就（取最后 3 个，匹配成就元数据）
  const recentAchievements = user.achievements
    .slice(-3)
    .map((a) => {
      const meta = user.achievementsMeta.find((m) => m.id === a.id)
      return meta ? { id: meta.id, name: meta.name, description: meta.description, icon: meta.icon } : null
    })
    .filter(Boolean) as { id: string; name: string; description: string; icon: string }[]

  // 动态标题
  const titleText = accuracy === 100 ? 'PERFECT!' : stars >= 1 ? 'VICTORY!' : '继续加油!'
  const titleEmoji = accuracy === 100 ? 'trophy' : stars >= 1 ? 'party' : 'muscle'
  // 正确率颜色
  const accuracyColor = accuracy === 100 ? C.semantic.primary : accuracy >= 60 ? C.semantic.foreground : C.semantic.destructive

  const goHome = () => Taro.switchTab({ url: '/pages/home/index' })
  const goMistakes = () => Taro.switchTab({ url: '/pages/mistakes/index' })
  // 再来一次：带着原关卡参数回到答题页
  const restart = () => {
    const levelId = record.levelId
    const grade = record.grade || user.grade || 1
    Taro.redirectTo({ url: `/pages/battle/index?levelId=${encodeURIComponent(levelId)}&grade=${grade}` })
  }

  return (
    <View style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column' }}>
      {/* 顶部渐变条 */}
      <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      {/* 头部 */}
      <View style={{ padding: '12px 16px', borderBottom: `1px solid ${C.semantic.border}`, background: '#fff', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 700, color: C.semantic.foreground }}>结算</Text>
      </View>

      <View style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 结算主卡片 */}
        <Card padding={20} style={{ position: 'relative', overflow: 'hidden', boxShadow: TOKEN.shadow.md }}>
          {/* 装饰性背景圆点 */}
          <View style={{ position: 'absolute', top: -40, left: -40, width: 80, height: 80, borderRadius: 40, background: primaryLight }} />
          <View style={{ position: 'absolute', bottom: -48, right: -48, width: 96, height: 96, borderRadius: 48, background: primaryLight }} />
          {/* 装饰图标 */}
          <View style={{ position: 'absolute', top: 24, right: 24, opacity: 0.25 }}><Icon name="star" size={24} color={C.duolingo.gold} /></View>
          <View style={{ position: 'absolute', bottom: 36, left: 16, opacity: 0.25 }}><Icon name="lightning" size={20} color={C.duolingo.gold} /></View>

          <View style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* 章节名 */}
            {record.chapter ? (
              <Text style={{ fontSize: 12, fontWeight: 700, color: C.semantic.mutedForeground }}>{record.chapter}</Text>
            ) : null}

            {/* 大标题图标 + 文案 */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
              <Icon name={titleEmoji} size={24} color={C.semantic.primary} />
              <Text style={{ fontSize: 20, fontWeight: 700, color: C.semantic.foreground }}>{titleText}</Text>
            </View>

            {/* 花式赞美 */}
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 8 }}>{praiseText}</Text>

            {/* 星级展示 */}
            <Row justify="center" gap={12} style={{ marginTop: 12, marginBottom: 12 }}>
              {[1, 2, 3].map((s) => {
                const lit = starStage >= s
                return (
                  <View
                    key={s}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: lit ? primaryLight : 'transparent',
                    }}
                  >
                    <Icon name="star" size={32} color={C.duolingo.gold} style={{ opacity: lit ? 1 : 0.25 }} />
                  </View>
                )
              })}
            </Row>

            {/* 正确率 */}
            <Text style={{ fontSize: 48, fontWeight: 800, color: accuracyColor }}>{accuracy}%</Text>
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 4 }}>
              正确率 · {record.correctCount} / {record.totalCount}
            </Text>

            {/* 奖励卡片 */}
            <Row gap={8} style={{ marginTop: 16, width: '100%' }}>
              <RewardBadge bg={C.icon.iconPurpleBg} emoji="sparkles" label="XP" value={`+${record.xpGained || 0}`} valueColor={C.duolingo.purple} />
              <RewardBadge bg={C.icon.iconGoldBg} emoji="coin" label="金币" value={`+${record.coinsGained || 0}`} valueColor={C.duolingo.gold} />
              <RewardBadge bg={C.icon.iconRedBg} emoji="lightning" label="连击" value={`×${record.comboMax || 0}`} valueColor={C.semantic.destructive} />
            </Row>
          </View>
        </Card>

        {/* 段位进度条 */}
        <Card padding={16} style={{ boxShadow: TOKEN.shadow.md }}>
          <Row justify="space-between" align="center">
            <Row gap={8} align="center">
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                background: rankInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="chart" size={16} color="#FFFFFF" />
              </View>
              <View style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontSize: 15, fontWeight: 700, color: C.semantic.foreground }}>当前段位 · {user.rank}</Text>
                <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>
                  {nextRank ? `距 ${nextRank.name} 还需 ${Math.max(0, (nextRank.min - user.xp))} XP` : '已达最高段位'}
                </Text>
              </View>
            </Row>
            <Text style={{ fontSize: 13, fontWeight: 700, color: C.semantic.primary }}>{user.xp} XP</Text>
          </Row>
          <Spacer size={12} />
          <Progress value={rankProgress.current} max={rankProgress.target} color={rankInfo.color} height={10} />
          <Spacer size={8} />
          <Row justify="space-between">
            <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>连续学习 {user.streak} 天</Text>
            <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>金币 {user.coins}</Text>
          </Row>
        </Card>

        {/* 成就解锁展示 */}
        {showAchievements && recentAchievements.length > 0 && (
          <Card padding={16} style={{ boxShadow: TOKEN.shadow.md }}>
            <Row gap={8} align="center" style={{ marginBottom: 12 }}>
              <Icon name="trophy" size={16} color={C.duolingo.gold} />
              <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>解锁成就</Text>
            </Row>
            <Col gap={8}>
              {recentAchievements.map((a) => (
                <View
                  key={a.id}
                  style={{
                    background: C.icon.iconGrayBg, borderRadius: TOKEN.radius.md, padding: 10,
                    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10,
                    border: `1px solid ${C.semantic.border}`,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(88,204,2,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name={a.icon} size={22} color={C.semantic.primary} />
                  </View>
                  <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: C.semantic.foreground }}>{a.name}</Text>
                    <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{a.description}</Text>
                  </View>
                </View>
              ))}
            </Col>
          </Card>
        )}

        {/* 错题查看入口 */}
        {wrongCount > 0 ? (
          <Card padding={16} style={{ boxShadow: TOKEN.shadow.md }}>
            <Row gap={8} align="center" style={{ marginBottom: 8 }}>
              <Icon name="memo" size={16} color={C.semantic.foreground} />
              <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>错题回顾</Text>
            </Row>
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, lineHeight: 1.6 }}>
              本次共答错 {wrongCount} 题，已自动加入错题本，可以复仇再战！
            </Text>
            <Spacer size={12} />
            <Button block variant="outline" onClick={goMistakes}>
              查看错题本（{wrongCount}）
            </Button>
          </Card>
        ) : (
          <Card padding={16} style={{ boxShadow: TOKEN.shadow.md }}>
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Icon name="checkCircle" size={36} color={C.semantic.primary} />
              <Spacer size={8} />
              <Text style={{ fontSize: 14, fontWeight: 600, color: C.semantic.primary }}>太棒了！零失误完美通关</Text>
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 4 }}>你真是太厉害了！</Text>
            </View>
          </Card>
        )}

        {/* 操作按钮 */}
        <Row gap={12} style={{ marginTop: 4 }}>
          <Button block size="lg" variant="outline" onClick={goHome}>
            返回首页
          </Button>
          <Button block size="lg" onClick={restart} style={{ boxShadow: btnShadow(C.duolingo.greenDark) }}>
            再来一局
          </Button>
        </Row>
      </View>
    </View>
  )
}

// 奖励徽章子组件
function RewardBadge({ bg, emoji, label, value, valueColor }: {
  bg: string; emoji: string; label: string; value: string; valueColor: string
}) {
  return (
    <View style={{
      flex: 1, background: bg, borderRadius: TOKEN.radius.md, padding: '10px 4px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      border: `1px solid ${C.semantic.border}`,
    }}>
      <View style={{
        width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={emoji} size={18} color={valueColor} />
      </View>
      <Text style={{ fontSize: 11, color: C.semantic.mutedForeground, marginTop: 4 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: 800, color: valueColor, marginTop: 2 }}>{value}</Text>
    </View>
  )
}
