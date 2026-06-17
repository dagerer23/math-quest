import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { Button, Input } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { saveProfile } from '@/services/auth'

const GOALS = [
  { key: 'consolidation' as const, label: '巩固提高', desc: '夯实基础，稳步提升', icon: '📖' },
  { key: 'extension' as const, label: '拓展拔高', desc: '挑战难题，突破自我', icon: '🚀' },
  { key: 'foundation' as const, label: '基础补强', desc: '查漏补缺，打牢根基', icon: '💪' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [grade, setGrade] = useState(0)
  const [goal, setGoal] = useState<'consolidation' | 'extension' | 'foundation'>('consolidation')
  const [loading, setLoading] = useState(false)
  const userStore = useUserStore()

  const handleComplete = async () => {
    setLoading(true)
    try {
      const userId = userStore.userId
      if (userId) {
        await saveProfile({ userId, nickname, targetGrade: grade, learningStage: 'primary', learningGoal: goal })
      }
    } catch { /* continue even if API fails */ }
    userStore.setNickname(nickname)
    userStore.setGrade(grade)
    userStore.setProfile({ learningStage: 'primary', learningGoal: goal })
    userStore.completeOnboarding()
    setLoading(false)
    Taro.switchTab({ url: '/pages/home/index' })
  }

  const canNext = () => {
    if (step === 0) return nickname.trim().length > 0
    if (step === 1) return grade > 0
    return true
  }

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
    else handleComplete()
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F8FAF5', padding: 16 }}>
      <View style={{ padding: 16, paddingTop: 48, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Text style={{ fontSize: 48 }}>🧙</Text>
        <Spacer size={16} />
        <Title size={24}>欢迎来到数学探险</Title>
        <Spacer size={8} />
        <Subtitle size={15}>让我们先了解一下你吧</Subtitle>
      </View>

      <Spacer size={16} />

      {/* 步骤指示器 */}
      <Row justify="center" gap={8} style={{ marginBottom: 24 }}>
        {[0, 1, 2].map((s) => (
          <View
            key={s}
            style={{
              width: s === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: s === step ? '#58CC02' : '#E5E7EB',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </Row>

      {/* Step 0: 输入昵称 */}
      {step === 0 && (
        <Card padding={24}>
          <Col gap={16}>
            <Title size={18}>你叫什么名字？</Title>
            <Subtitle>给自己取一个响亮的昵称吧</Subtitle>
            <Spacer size={8} />
            <Input
              value={nickname}
              placeholder="输入昵称"
              onChange={setNickname}
              maxLength={12}
            />
            <Spacer size={8} />
            <Button block size="lg" onClick={handleNext} disabled={!canNext()}>
              下一步
            </Button>
          </Col>
        </Card>
      )}

      {/* Step 1: 选择年级 */}
      {step === 1 && (
        <Card padding={24}>
          <Col gap={16}>
            <Title size={18}>你读几年级？</Title>
            <Subtitle>选择你当前的年级</Subtitle>
            <Spacer size={8} />
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <View
                  key={g}
                  onClick={() => setGrade(g)}
                  style={{
                    width: 80,
                    height: 64,
                    borderRadius: 16,
                    background: grade === g ? '#58CC02' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    border: grade === g ? '2px solid #58CC02' : '2px solid transparent',
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: 700, color: grade === g ? '#FFFFFF' : '#1a1a1a' }}>
                    {g}
                  </Text>
                  <Text style={{ fontSize: 11, color: grade === g ? '#FFFFFF' : '#6b7280', marginTop: 2 }}>
                    年级
                  </Text>
                </View>
              ))}
            </Row>
            <Spacer size={8} />
            <Button block size="lg" onClick={handleNext} disabled={!canNext()}>
              下一步
            </Button>
          </Col>
        </Card>
      )}

      {/* Step 2: 选择学习目标 */}
      {step === 2 && (
        <Card padding={24}>
          <Col gap={16}>
            <Title size={18}>你的学习目标是什么？</Title>
            <Subtitle>选择最符合你的目标</Subtitle>
            <Spacer size={8} />
            {GOALS.map((g) => (
              <View
                key={g.key}
                onClick={() => setGoal(g.key)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: goal === g.key ? '#ECFDF5' : '#FFFFFF',
                  border: goal === g.key ? '2px solid #58CC02' : '2px solid #E5E7EB',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 32 }}>{g.icon}</Text>
                <Col gap={2} flex={1}>
                  <Text style={{ fontSize: 16, fontWeight: 700, color: goal === g.key ? '#58CC02' : '#1a1a1a' }}>
                    {g.label}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6b7280' }}>{g.desc}</Text>
                </Col>
                {goal === g.key && (
                  <Text style={{ fontSize: 20, color: '#58CC02' }}>✓</Text>
                )}
              </View>
            ))}
            <Spacer size={8} />
            <Button block size="lg" onClick={handleNext} disabled={loading}>
              {loading ? '保存中...' : '开始学习 🎉'}
            </Button>
          </Col>
        </Card>
      )}

      <Spacer size={40} />
    </View>
  )
}
