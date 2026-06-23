import { useState } from 'react'
import { View, Text, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Icon } from '@/components/Icon'
import { useUserStore } from '@/store/useUserStore'
import { saveProfile } from '@/services/auth'
import type { LearningStage, LearningGoal } from '@/types/models'
import { C, TOKEN, btnShadow } from '@/styles/theme'
import { AVATAR_SEEDS, getAvatarUrl } from '@/utils/avatar'

const primaryLight = 'rgba(88,204,2,0.08)'

// hex -> rgba，用于半透明背景
function hexA(hex: string, a: number): string {
  const h = (hex || '#000000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

// 学习阶段选项
const STAGES: { id: LearningStage; name: string; icon: string; desc: string }[] = [
  { id: 'primary', name: '小学', icon: 'backpack', desc: '1-6年级学习' },
  { id: 'middle', name: '初中', icon: 'book', desc: '7-9年级学习' },
  { id: 'high', name: '高中', icon: 'book', desc: '10-12年级学习' },
]

// 学习目标选项（对齐 web 端四种）
const GOALS: { id: LearningGoal; name: string; icon: string; desc: string }[] = [
  { id: 'consolidation', name: '巩固基础', icon: 'muscle', desc: '打牢基础，查漏补缺' },
  { id: 'improvement', name: '提升培优', icon: 'rocket', desc: '拔高训练，冲刺高分' },
  { id: 'interest', name: '兴趣启蒙', icon: 'palette', desc: '培养兴趣，快乐学习' },
  { id: 'training', name: '思维训练', icon: 'brain', desc: '提升逻辑和思维能力' },
]

// 年级选项按阶段划分
const GRADE_MAP: Record<LearningStage, number[]> = {
  primary: [1, 2, 3, 4, 5, 6],
  middle: [7, 8, 9],
  high: [10, 11, 12],
}

// 步骤定义
type StepId = 'stage' | 'goal' | 'grade' | 'profile'
interface StepDef { id: StepId; title: string; desc: string }

// 引导步骤（固定 4 步）
function getSteps(): StepDef[] {
  return [
    { id: 'stage', title: '选择学习阶段', desc: '告诉我们你在哪个学习阶段' },
    { id: 'goal', title: '设定学习目标', desc: '你的学习目标是什么' },
    { id: 'grade', title: '选择年级', desc: '选择你当前的年级' },
    { id: 'profile', title: '设置个人信息', desc: '最后，设置你的个人信息' },
  ]
}

interface FormState {
  stage: LearningStage
  goal: LearningGoal
  grade: number
  nickname: string
  avatar: string
}

export default function OnboardingPage() {
  const userStore = useUserStore()
  const existingAvatar = userStore.profile?.avatar || ''
  const hasWxAvatar = existingAvatar.startsWith('data:') || existingAvatar.startsWith('http')
  const [form, setForm] = useState<FormState>({
    stage: 'primary',
    goal: 'consolidation',
    grade: 1,
    nickname: '',
    avatar: existingAvatar || 'Alice',
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // 引导步骤（固定 4 步）
  const steps = getSteps()
  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1
  const isFirstStep = stepIndex === 0

  // 切换学习阶段时重置年级为该阶段首个
  const handleStageChange = (stage: LearningStage) => {
    const defaultGrade = GRADE_MAP[stage][0] ?? 0
    setForm(f => ({ ...f, stage, grade: defaultGrade }))
  }

  // 当前阶段的年级选项
  const currentGradeOptions = GRADE_MAP[form.stage]

  // 判断是否可以进入下一步
  const canProceed = () => {
    if (currentStep?.id === 'profile') {
      return form.nickname.trim().length >= 2
    }
    if (currentStep?.id === 'grade') {
      return form.grade > 0
    }
    return true
  }

  // 完成引导：保存后端 + 更新本地状态 + 跳转
  const handleComplete = () => {
    setSubmitting(true)
    const targetGrade = form.grade
    const nickname = form.nickname.trim()

    // 更新本地 store
    userStore.setProfile({
      learningStage: form.stage,
      learningGoal: form.goal,
      targetGrade,
      nickname,
      avatar: form.avatar,
    })
    userStore.setGrade(form.grade)
    userStore.completeOnboarding()

    // 保存到后端
    const userId = Taro.getStorageSync('userId')
    if (userId) {
      saveProfile({
        userId,
        nickname,
        avatar: form.avatar,
        learningStage: form.stage,
        learningGoal: form.goal,
        targetGrade,
      }).finally(() => {
        setSubmitting(false)
        // 新用户跳测评页
        Taro.redirectTo({ url: '/pages/assessment/index' })
      })
    } else {
      setSubmitting(false)
      // 无 userId 也跳测评页
      Taro.redirectTo({ url: '/pages/assessment/index' })
    }
  }

  // 下一步 / 完成
  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      const nextStep = steps[stepIndex + 1]
      // 进入年级步骤时，重置年级为当前阶段首个（对齐 Web 端 handleEnterGradeStep）
      if (nextStep?.id === 'grade') {
        const defaultGrade = GRADE_MAP[form.stage][0] ?? 0
        setForm(f => ({ ...f, grade: defaultGrade }))
      }
      setStepIndex(s => s + 1)
    }
  }

  // 上一步
  const handlePrev = () => {
    if (!isFirstStep) {
      setStepIndex(s => s - 1)
    }
  }

  // 按钮文案
  const nextButtonText = submitting ? '保存中...' : isLastStep ? '开始测评' : '下一步'
  const nextDisabled = !canProceed() || submitting

  return (
    <View style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部进度条 */}
      <View style={{ padding: '16px 24px', paddingTop: 48, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36 }} />
        <View style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {steps.map((s, i) => {
            const isCompleted = i < stepIndex
            const isCurrent = i === stepIndex
            return (
              <View
                key={s.id}
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: isCompleted || isCurrent ? C.semantic.primary : C.semantic.border,
                  flex: isCurrent ? 0 : 1,
                  width: isCurrent ? 32 : 0,
                  marginLeft: i === 0 ? 0 : 6,
                }}
              />
            )
          })}
        </View>
        <View style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>{stepIndex + 1}/{steps.length}</Text>
        </View>
      </View>

      {/* 主内容区 */}
      <View style={{ flex: 1, padding: '24px 24px 24px 24px' }}>
        {/* 标题 + 描述 */}
        <View style={{ marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 800, color: C.semantic.foreground }}>{currentStep?.title}</Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 14, color: C.semantic.mutedForeground }}>{currentStep?.desc}</Text>
          </View>
        </View>

        {/* 步骤1：选择学习阶段 */}
        {currentStep?.id === 'stage' && (
          <View style={{ display: 'flex', flexDirection: 'column' }}>
            {STAGES.map(stage => {
              const selected = form.stage === stage.id
              return (
                <View
                  key={stage.id}
                  onClick={() => handleStageChange(stage.id)}
                  className="taro-btn-press"
                  style={{
                    marginBottom: 16,
                    padding: 20,
                    borderRadius: TOKEN.radius.lg,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: selected ? C.semantic.primary : C.semantic.border,
                    background: selected ? primaryLight : C.semantic.card,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    boxShadow: TOKEN.shadow.md,
                  }}
                >
                  <View><Icon name={stage.icon} size={36} color={selected ? C.semantic.primary : C.semantic.mutedForeground} /></View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 17, fontWeight: 700, color: C.semantic.foreground }}>{stage.name}</Text>
                    <View style={{ marginTop: 2 }}>
                      <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>{stage.desc}</Text>
                    </View>
                  </View>
                  {selected && <Icon name="check" size={22} color={C.semantic.primary} />}
                </View>
              )
            })}
          </View>
        )}

        {/* 步骤2：设定学习目标 */}
        {currentStep?.id === 'goal' && (
          <View style={{ display: 'flex', flexDirection: 'column' }}>
            {GOALS.map(goal => {
              const selected = form.goal === goal.id
              return (
                <View
                  key={goal.id}
                  onClick={() => setForm(f => ({ ...f, goal: goal.id }))}
                  className="taro-btn-press"
                  style={{
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: TOKEN.radius.lg,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: selected ? C.semantic.primary : C.semantic.border,
                    background: selected ? primaryLight : C.semantic.card,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    boxShadow: TOKEN.shadow.md,
                  }}
                >
                  <View><Icon name={goal.icon} size={32} color={selected ? C.semantic.primary : C.semantic.mutedForeground} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: 700, color: C.semantic.foreground }}>{goal.name}</Text>
                    <View style={{ marginTop: 2 }}>
                      <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>{goal.desc}</Text>
                    </View>
                  </View>
                  {selected && <Icon name="check" size={20} color={C.semantic.primary} />}
                </View>
              )
            })}
          </View>
        )}

        {/* 步骤3：选择年级（成人跳过此步） */}
        {currentStep?.id === 'grade' && (
          <View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>
                当前阶段：{STAGES.find(s => s.id === form.stage)?.name}
              </Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {currentGradeOptions.map(grade => {
                const selected = form.grade === grade
                return (
                  <View
                    key={grade}
                    onClick={() => setForm(f => ({ ...f, grade }))}
                    className="taro-btn-press"
                    style={{
                      width: '31%',
                      marginBottom: 12,
                      height: 80,
                      borderRadius: TOKEN.radius.lg,
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: selected ? C.semantic.primary : C.semantic.border,
                      background: selected ? primaryLight : C.semantic.card,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: TOKEN.shadow.md,
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: 700, color: selected ? C.semantic.primary : C.semantic.foreground }}>
                      {grade}年级
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* 步骤4：设置个人信息 */}
        {currentStep?.id === 'profile' && (
          <View style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 头像选择 */}
            <View style={{ marginBottom: 24 }}>
              {hasWxAvatar ? (
                <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Image src={form.avatar} mode="aspectFill" style={{ width: 72, height: 72, borderRadius: 999, marginBottom: 8 }} />
                  <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>微信头像（不可修改）</Text>
                </View>
              ) : (
                <>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>选择头像</Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {AVATAR_SEEDS.map(seed => {
                      const selected = form.avatar === seed
                      return (
                        <View
                          key={seed}
                          onClick={() => setForm(f => ({ ...f, avatar: seed }))}
                          className="taro-btn-press"
                          style={{
                            width: '14%',
                            marginBottom: 12,
                            height: 56,
                            borderRadius: TOKEN.radius.lg,
                            borderWidth: 2,
                            borderStyle: 'solid',
                            borderColor: selected ? C.semantic.primary : C.semantic.border,
                            background: selected ? primaryLight : C.semantic.card,
                            overflow: 'hidden',
                          }}
                        >
                          <Image src={getAvatarUrl(seed)} mode="aspectFill" style={{ width: '100%', height: '100%' }} />
                        </View>
                      )
                    })}
                  </View>
                </>
              )}
            </View>
            {/* 昵称输入 */}
            <View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>昵称</Text>
              </View>
              <View style={{
                height: 56,
                borderRadius: TOKEN.radius.lg,
                borderWidth: 2,
                borderStyle: 'solid',
                borderColor: C.semantic.border,
                background: C.semantic.card,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 16,
                paddingRight: 16,
              }}>
                <Input
                  type="text"
                  value={form.nickname}
                  onInput={(e) => setForm(f => ({ ...f, nickname: e.detail.value }))}
                  placeholder="输入2-10个字的昵称"
                  placeholderStyle={{ color: hexA(C.semantic.mutedForeground, 0.5) }}
                  maxlength={10}
                  style={{ flex: 1, height: '100%', fontSize: 16, fontWeight: 500, color: C.semantic.foreground }}
                />
              </View>
              {form.nickname.trim().length > 0 && form.nickname.trim().length < 2 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 12, color: C.semantic.destructive }}>昵称至少需要2个字</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 底部按钮区 */}
      <View style={{ padding: 24, paddingBottom: 40, borderTop: `1px solid ${C.semantic.border}`, background: '#fff' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {/* 上一步按钮（非首步显示） */}
          {!isFirstStep && (
            <View
              onClick={handlePrev}
              className="taro-btn-press"
              style={{
                width: 100,
                height: 52,
                borderRadius: TOKEN.radius.lg,
                background: C.icon.iconGrayBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 600, color: C.semantic.foreground }}>上一步</Text>
            </View>
          )}
          {/* 下一步 / 开始学习 */}
          <View
            onClick={nextDisabled ? undefined : handleNext}
            className="taro-btn-press"
            style={{
              flex: 1,
              height: 52,
              borderRadius: TOKEN.radius.lg,
              background: nextDisabled ? C.semantic.border : C.semantic.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: nextDisabled ? 0.6 : 1,
              boxShadow: nextDisabled ? 'none' : btnShadow(C.duolingo.greenDark),
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{nextButtonText}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
