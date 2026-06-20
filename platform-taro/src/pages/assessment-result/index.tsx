import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { Icon } from '@/components/Icon'
import { LEVELS } from '@/data/questionBank'
import type { Question } from '@/types/models'
import { C, TOKEN } from '@/styles/theme'

const PRIMARY_LIGHT = 'rgba(88,204,2,0.08)'

// 难度档位：1 简单 / 2 中等 / 3 困难
const DIFFICULTY_TIERS = [
  { level: 1, label: '简单' },
  { level: 2, label: '中等' },
  { level: 3, label: '困难' },
]

// 构建题目 id -> Question 查找表，用于补全错题题干与正确答案
const QUESTION_MAP: Record<string, Question> = {}
LEVELS.forEach((lv) => {
  ;(lv.questions || []).forEach((q) => {
    QUESTION_MAP[q.id] = q
  })
})

export default function AssessmentResultPage() {
  const user = useUserStore()
  const assessment = user.assessment

  // 没有测评数据
  if (!assessment) {
    return (
      <View style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column' }}>
        <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />
        <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Icon name="frown" size={64} color={C.semantic.mutedForeground} />
            <Spacer size={16} />
            <Title size={20}>测评数据不存在</Title>
            <Spacer size={8} />
            <Subtitle size={14}>请重新进行水平测评</Subtitle>
            <Spacer size={20} />
            <Button className="taro-btn-press" size="lg" onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>返回首页</Button>
          </View>
        </View>
      </View>
    )
  }

  const score = assessment.score ?? 0
  const answers = assessment.answers || []
  const totalCount = answers.length
  const correctCount = answers.filter((a) => a.isCorrect).length
  const recommendedDifficulty = assessment.recommendedDifficulty ?? 1

  // 从配置读取测评奖励与表情阈值
  const rewardXp = Number(user.systemConfigs?.['assessment.reward_xp']) || 100
  const rewardCoins = Number(user.systemConfigs?.['assessment.reward_coins']) || 50
  const excellentThreshold = Number(user.systemConfigs?.['assessment.emoji_excellent']) || 80
  const goodThreshold = Number(user.systemConfigs?.['assessment.emoji_good']) || 50

  // 顶部表情与主色
  const headerEmoji = score >= excellentThreshold ? 'trophy' : score >= goodThreshold ? 'party' : 'muscle'
  const headerColor = score >= goodThreshold ? C.duolingo.gold : C.duolingo.purple
  const scoreColor =
    score === 100 ? C.semantic.primary : score >= excellentThreshold ? C.semantic.secondary : score >= goodThreshold ? C.duolingo.gold : C.semantic.destructive

  // 错题详情（补全题干与正确答案）
  const wrongAnswers = answers
    .map((a, i) => ({ ...a, index: i, question: QUESTION_MAP[a.questionId] }))
    .filter((a) => !a.isCorrect)

  const goHome = () => Taro.switchTab({ url: '/pages/home/index' })

  return (
    <View style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column' }}>
      {/* 顶部渐变条 */}
      <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      <View style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 顶部庆祝区 */}
        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
          <Icon name={headerEmoji} size={64} color={headerColor} />
          <Spacer size={12} />
          <Title size={22}>测评完成！</Title>
          <Spacer size={12} />
          <Text style={{ fontSize: 56, fontWeight: 800, color: scoreColor }}>{score}%</Text>
          <Spacer size={8} />
          <Subtitle size={14}>你答对了 {correctCount} / {totalCount} 题</Subtitle>
        </View>

        {/* 推荐难度卡片 */}
        <Card padding={16} style={{ boxShadow: TOKEN.shadow.md }}>
          <Row gap={10} align="center" style={{ marginBottom: 12 }}>
            <Icon name="chart" size={20} color={C.semantic.primary} />
            <View style={{ display: 'flex', flexDirection: 'column' }}>
              <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>推荐难度</Text>
              <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>为你推荐最适合的题目难度</Text>
            </View>
          </Row>
          <Row gap={8}>
            {DIFFICULTY_TIERS.map((t) => {
              const active = t.level === recommendedDifficulty
              return (
                <View
                  key={t.level}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 12,
                    background: active ? C.semantic.primary : C.icon.iconGrayBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: active ? '#fff' : C.semantic.mutedForeground,
                  }}>
                    {t.label}
                  </Text>
                </View>
              )
            })}
          </Row>
        </Card>

        {/* 奖励卡片 */}
        <View style={{
          borderRadius: 16, padding: 16,
          background: `linear-gradient(135deg, ${PRIMARY_LIGHT}, rgba(28,176,246,0.08))`,
          border: `1px solid rgba(88,204,2,0.2)`,
          boxShadow: TOKEN.shadow.sm,
        }}>
          <Row gap={8} align="center" style={{ marginBottom: 10 }}>
            <Icon name="trophy" size={18} color={C.duolingo.gold} />
            <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>奖励</Text>
          </Row>
          <Row gap={8} align="center">
            <Text style={{ fontSize: 15, fontWeight: 700, color: C.duolingo.purple }}>{rewardXp} XP</Text>
            <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>+</Text>
            <Text style={{ fontSize: 15, fontWeight: 700, color: '#B8860B' }}>{rewardCoins} 金币</Text>
          </Row>
        </View>

        {/* 全对奖励提示 */}
        {score === 100 && (
          <View style={{
            borderRadius: 16, padding: 14,
            background: `linear-gradient(to right, ${PRIMARY_LIGHT}, rgba(255,210,63,0.1))`,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: TOKEN.shadow.xs,
          }}>
            <Icon name="checkCircle" size={22} color={C.semantic.primary} />
            <Spacer size={6} />
            <Text style={{ fontSize: 13, fontWeight: 700, color: C.semantic.primary }}>完美！全对通过！</Text>
          </View>
        )}

        {/* 错题详情列表 */}
        {wrongAnswers.length > 0 && (
          <Card padding={16} style={{ boxShadow: TOKEN.shadow.md }}>
            <Row gap={8} align="center" style={{ marginBottom: 12 }}>
              <Icon name="xCircle" size={16} color={C.semantic.destructive} />
              <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>错题回顾</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>共 {wrongAnswers.length} 题</Text>
            </Row>
            <Col gap={10}>
              {wrongAnswers.map((a) => {
                const q = a.question
                const correctAnswer = q ? String(q.answer) : '未知'
                return (
                  <View
                    key={a.questionId + a.index}
                    style={{
                      background: C.icon.iconGrayBg, borderRadius: 12, padding: 12,
                      border: `1px solid ${C.semantic.border}`,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: C.semantic.mutedForeground, marginBottom: 4 }}>第 {a.index + 1} 题</Text>
                    {q ? (
                      <Text style={{ fontSize: 13, color: C.semantic.foreground, lineHeight: 1.5 }}>{q.prompt}</Text>
                    ) : (
                      <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>（题目详情未找到）</Text>
                    )}
                    <Spacer size={6} />
                    <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, lineHeight: 1.5 }}>
                      你的答案：<Text style={{ color: C.semantic.destructive, fontWeight: 600 }}>{a.userAnswer || '未作答'}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, lineHeight: 1.5, marginTop: 2 }}>
                      正确答案：<Text style={{ color: C.semantic.primary, fontWeight: 600 }}>{correctAnswer}</Text>
                    </Text>
                    {q?.explanation ? (
                      <View style={{ marginTop: 6, background: PRIMARY_LIGHT, borderRadius: 8, padding: 8 }}>
                        <Text style={{ fontSize: 11, color: C.semantic.primary, lineHeight: 1.5 }}>
                          {q.explanation}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </Col>
          </Card>
        )}

        {/* 底部按钮 */}
        <Col gap={10} style={{ marginTop: 4 }}>
          <Button className="taro-btn-press" block size="lg" onClick={goHome}>
            开始学习
          </Button>
          <Button className="taro-btn-press" block size="lg" variant="outline" onClick={goHome}>
            返回首页
          </Button>
        </Col>
      </View>
    </View>
  )
}
