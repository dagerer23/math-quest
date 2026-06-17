import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Progress } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { useUserStore } from '@/store/useUserStore'
import type { LearningStage, LearningGoal } from '@/types/models'

const TOTAL_STEPS = 4

const STAGES: { value: LearningStage; label: string; emoji: string }[] = [
  { value: 'primary', label: '小学', emoji: '🏫' },
  { value: 'middle', label: '初中', emoji: '📚' },
  { value: 'high', label: '高中', emoji: '🎓' },
  { value: 'adult', label: '成人', emoji: '💼' },
]

const GOALS: { value: LearningGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'consolidation', label: '巩固基础', emoji: '🏗️', desc: '夯实基础知识' },
  { value: 'improvement', label: '提升培优', emoji: '🚀', desc: '突破重点难点' },
  { value: 'interest', label: '兴趣启蒙', emoji: '✨', desc: '激发学习兴趣' },
  { value: 'training', label: '思维训练', emoji: '🧠', desc: '锻炼逻辑思维' },
]

const GRADE_MAP: Record<LearningStage, { min: number; max: number; labels: string[] }> = {
  primary: { min: 1, max: 6, labels: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'] },
  middle: { min: 7, max: 9, labels: ['初一', '初二', '初三'] },
  high: { min: 10, max: 12, labels: ['高一', '高二', '高三'] },
  adult: { min: 0, max: 0, labels: [] },
}

const AVATAR_EMOJIS = ['🦊', '🐱', '🐶', '🐼', '🦁', '🐸', '🐵', '🐰', '🦄', '🐲', '🦉', '🐧']

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [learningStage, setLearningStage] = useState<LearningStage | null>(null)
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null)
  const [grade, setGrade] = useState<number | null>(null)
  const [avatar, setAvatar] = useState('')
  const [nickname, setNickname] = useState('')

  const userSetProfile = useUserStore((s) => s.setProfile)
  const userSetGrade = useUserStore((s) => s.setGrade)
  const completeOnboarding = useUserStore((s) => s.completeOnboarding)

  const canNext = () => {
    if (step === 1) return learningStage !== null
    if (step === 2) return learningGoal !== null
    if (step === 3) return grade !== null
    if (step === 4) return avatar !== '' && nickname.trim().length > 0
    return false
  }

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      // 完成引导
      userSetProfile({
        learningStage: learningStage!,
        learningGoal: learningGoal!,
        targetGrade: grade || 0,
        avatar,
        nickname: nickname.trim(),
      })
      if (grade) {
        userSetGrade(grade)
      }
      completeOnboarding()
      Taro.redirectTo({ url: '/pages-game/assessment/index' })
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const renderStep1 = () => (
    <Col align="center" gap={24}>
      <Text style={{ fontSize: 48 }}>🎯</Text>
      <Title size={24}>选择你的学习阶段</Title>
      <Subtitle>我们将为你定制合适的内容</Subtitle>
      <Spacer size={8} />
      <Col gap={12} style={{ width: '100%' }}>
        {STAGES.map((s) => {
          const selected = learningStage === s.value
          return (
            <View
              key={s.value}
              onClick={() => setLearningStage(s.value)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: 20,
                borderRadius: 16,
                border: selected ? '2px solid #58CC02' : '2px solid #E5E7EB',
                background: selected ? '#ECFDF5' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 32, marginRight: 16 }}>{s.emoji}</Text>
              <Text style={{ fontSize: 18, fontWeight: 600, color: selected ? '#58CC02' : '#1a1a1a' }}>{s.label}</Text>
              {selected && (
                <View style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: 12, background: '#58CC02', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>✓</Text>
                </View>
              )}
            </View>
          )
        })}
      </Col>
    </Col>
  )

  const renderStep2 = () => (
    <Col align="center" gap={24}>
      <Text style={{ fontSize: 48 }}>🌟</Text>
      <Title size={24}>设定你的学习目标</Title>
      <Subtitle>让我们了解你的学习需求</Subtitle>
      <Spacer size={8} />
      <Col gap={12} style={{ width: '100%' }}>
        {GOALS.map((g) => {
          const selected = learningGoal === g.value
          return (
            <View
              key={g.value}
              onClick={() => setLearningGoal(g.value)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: 20,
                borderRadius: 16,
                border: selected ? '2px solid #58CC02' : '2px solid #E5E7EB',
                background: selected ? '#ECFDF5' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 32, marginRight: 16 }}>{g.emoji}</Text>
              <Col gap={2}>
                <Text style={{ fontSize: 18, fontWeight: 600, color: selected ? '#58CC02' : '#1a1a1a' }}>{g.label}</Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>{g.desc}</Text>
              </Col>
              {selected && (
                <View style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: 12, background: '#58CC02', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>✓</Text>
                </View>
              )}
            </View>
          )
        })}
      </Col>
    </Col>
  )

  const renderStep3 = () => {
    if (!learningStage || learningStage === 'adult') return null
    const gradeInfo = GRADE_MAP[learningStage]
    return (
      <Col align="center" gap={24}>
        <Text style={{ fontSize: 48 }}>📖</Text>
        <Title size={24}>选择你的年级</Title>
        <Subtitle>精准匹配学习内容</Subtitle>
        <Spacer size={8} />
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {gradeInfo.labels.map((label, idx) => {
            const gradeValue = gradeInfo.min + idx
            const selected = grade === gradeValue
            return (
              <View
                key={gradeValue}
                onClick={() => setGrade(gradeValue)}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                  border: selected ? '2px solid #58CC02' : '2px solid #E5E7EB',
                  background: selected ? '#ECFDF5' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: 700, color: selected ? '#58CC02' : '#1a1a1a' }}>{gradeValue}</Text>
                <Text style={{ fontSize: 12, color: selected ? '#58CC02' : '#6b7280', marginTop: 4 }}>{label}</Text>
              </View>
            )
          })}
        </View>
      </Col>
    )
  }

  const renderStep4 = () => (
    <Col align="center" gap={24}>
      <Text style={{ fontSize: 48 }}>😎</Text>
      <Title size={24}>设置你的个人信息</Title>
      <Subtitle>让大家认识你</Subtitle>
      <Spacer size={8} />
      <Col gap={16} style={{ width: '100%' }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>选择头像</Text>
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {AVATAR_EMOJIS.map((emoji) => {
            const selected = avatar === emoji
            return (
              <View
                key={emoji}
                onClick={() => setAvatar(emoji)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  border: selected ? '3px solid #58CC02' : '2px solid #E5E7EB',
                  background: selected ? '#ECFDF5' : '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 28 }}>{emoji}</Text>
              </View>
            )
          })}
        </View>
        <Spacer size={8} />
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>输入昵称</Text>
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '12px 16px',
          border: '2px solid #E5E7EB',
          borderRadius: 12,
          background: '#FFFFFF',
          minHeight: 48,
        }}>
          <input
            type="text"
            value={nickname}
            placeholder="给自己取个名字吧"
            onInput={(e: any) => setNickname(e.detail?.value ?? e.target.value)}
            maxLength={12}
            style={{
              flex: 1,
              fontSize: 16,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              color: '#1a1a1a',
            }}
          />
        </View>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{nickname.length}/12</Text>
      </Col>
    </Col>
  )

  // 如果是成人阶段，跳过年级选择
  const effectiveStep = learningStage === 'adult' && step === 3 ? 4 : step
  const isAdult = learningStage === 'adult'
  const totalSteps = isAdult ? 3 : TOTAL_STEPS
  const progressValue = effectiveStep

  return (
    <View style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAF5 100%)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 顶部进度 */}
      <View style={{ paddingTop: 20, paddingBottom: 8 }}>
        <Row justify="space-between" align="center">
          {step > 1 ? (
            <View onClick={handleBack} style={{ padding: '4px 0' }}>
              <Text style={{ fontSize: 16, color: '#58CC02', fontWeight: 600 }}>← 返回</Text>
            </View>
          ) : (
            <View style={{ width: 60 }} />
          )}
          <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
            {step} / {totalSteps}
          </Text>
          <View style={{ width: 60 }} />
        </Row>
        <Spacer size={12} />
        <Progress value={progressValue} max={totalSteps} height={10} />
      </View>

      <Spacer size={24} />

      {/* 步骤内容 */}
      <View style={{ flex: 1 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && !isAdult && renderStep3()}
        {step === 3 && isAdult && renderStep4()}
        {step === 4 && !isAdult && renderStep4()}
      </View>

      <Spacer size={24} />

      {/* 底部按钮 */}
      <View style={{ paddingBottom: 40 }}>
        <Button
          block
          size="lg"
          disabled={!canNext()}
          onClick={() => {
            if (isAdult && step === 2) {
              // 成人跳过年级，直接到个人信息
              setStep(3)
            } else {
              handleNext()
            }
          }}
        >
          {step === TOTAL_STEPS || (isAdult && step === 3) ? '🎯 开始测评' : '下一步 →'}
        </Button>
      </View>
    </View>
  )
}
