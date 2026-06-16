import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { Check, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import PixelButton from '@/components/PixelButton'
import type { LearningStage, LearningGoal } from '@/types/models'
import { saveProfile } from '@/services/auth'

// 年级选项按阶段划分
const GRADE_MAP: Record<Exclude<LearningStage, 'adult'>, readonly number[]> = {
  primary: [1, 2, 3, 4, 5, 6] as const,
  middle: [7, 8, 9] as const,
  high: [10, 11, 12] as const,
}

const STAGES = [
  { id: 'primary', name: '小学', emoji: '🎒', desc: '1-6年级学习' },
  { id: 'middle', name: '初中', emoji: '📚', desc: '7-9年级学习' },
  { id: 'high', name: '高中', emoji: '📖', desc: '10-12年级学习' },
  { id: 'adult', name: '成人', emoji: '🧑', desc: '成人学习和思维训练' },
] as const

const GOALS = [
  { id: 'consolidation', name: '巩固基础', emoji: '💪', desc: '打牢基础，查漏补缺' },
  { id: 'improvement', name: '提升培优', emoji: '🚀', desc: '拔高训练，冲刺高分' },
  { id: 'interest', name: '兴趣启蒙', emoji: '🎨', desc: '培养兴趣，快乐学习' },
  { id: 'training', name: '思维训练', emoji: '🧠', desc: '提升逻辑和思维能力' },
] as const

const AVATAR_OPTIONS = ['🧒', '👧', '👦', '🧑', '👨', '👩', '🐱', '🐶', '🦊', '🐼', '🦁', '🐯']

// 动态步骤定义
type StepId = 'stage' | 'goal' | 'grade' | 'profile'
interface StepDef {
  id: StepId
  title: string
}

function getSteps(stage: LearningStage): StepDef[] {
  const base: StepDef[] = [
    { id: 'stage', title: '选择学习阶段' },
    { id: 'goal', title: '设定学习目标' },
  ]
  if (stage !== 'adult') {
    base.push({ id: 'grade', title: '选择年级' })
  }
  base.push({ id: 'profile', title: '设置个人信息' })
  return base
}

type FormState = {
  stage: LearningStage
  goal: LearningGoal
  grade: number
  nickname: string
  avatar: string
}

export default function Onboarding() {
  const user = useUserStore()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>({
    stage: 'primary',
    goal: 'consolidation',
    grade: 1,
    nickname: '',
    avatar: '🧒',
  })
  // stepIndex 基于动态 steps 数组
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const steps = getSteps(form.stage)
  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  // 切换学习阶段时重置年级选项，并处理步骤跳转
  const handleStageChange = (stage: LearningStage) => {
    const grades = stage === 'adult' ? [] : GRADE_MAP[stage as Exclude<LearningStage, 'adult'>]
    const defaultGrade = grades[0] ?? 1
    setForm(f => ({ ...f, stage, grade: defaultGrade }))
    // 如果当前在年级步骤且切换到了成人，则跳过年级步骤
    if (currentStep?.id === 'grade' && stage === 'adult') {
      setStepIndex(s => Math.min(s + 1, steps.length - 1))
    }
  }

  // 切换到年级步骤时，根据当前阶段重置年级
  const handleEnterGradeStep = () => {
    const grades = GRADE_MAP[form.stage as Exclude<LearningStage, 'adult'>]
    setForm(f => ({ ...f, grade: grades[0] }))
  }

  const canProceed = () => {
    if (currentStep?.id === 'profile') {
      return form.nickname.trim().length >= 2
    }
    if (currentStep?.id === 'grade') {
      return form.grade > 0
    }
    return true
  }

  const handleNext = () => {
    if (isLastStep) {
      setSubmitting(true)
      user.setProfile({
        learningStage: form.stage,
        learningGoal: form.goal,
        targetGrade: form.stage === 'adult' ? 0 : form.grade,
        nickname: form.nickname.trim(),
        avatar: form.avatar,
      })
      if (form.stage !== 'adult') {
        user.setGrade(form.grade)
      }
      user.completeOnboarding()

      const userId = user.userId || localStorage.getItem('userId')
      if (userId) {
        saveProfile({
          userId,
          nickname: form.nickname.trim(),
          avatar: form.avatar,
          learningStage: form.stage,
          learningGoal: form.goal,
          targetGrade: form.stage === 'adult' ? 0 : form.grade,
        }).finally(() => {
          setSubmitting(false)
          navigate('/assessment', { replace: true })
        })
      } else {
        setSubmitting(false)
        navigate('/assessment', { replace: true })
      }
    } else {
      // 进入年级步骤前重置年级选项
      if (steps[stepIndex + 1]?.id === 'grade') {
        handleEnterGradeStep()
      }
      setStepIndex(s => s + 1)
    }
  }

  // 当前年级选项
  const currentGradeOptions =
    form.stage === 'adult'
      ? []
      : GRADE_MAP[form.stage as Exclude<LearningStage, 'adult'>]

  // 步骤描述文本
  const stepDescriptions: Record<StepId, string> = {
    stage: '告诉我们你在哪个学习阶段',
    goal: '你的学习目标是什么',
    grade: '选择你当前的年级',
    profile: '最后，设置你的个人信息',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-muted flex flex-col">
      {/* 顶部进度条 */}
      <div className="p-4 flex items-center justify-between">
        <div className="w-10" />
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                i < stepIndex
                  ? 'bg-primary'
                  : i === stepIndex
                    ? 'bg-primary w-8'
                    : 'bg-border',
              )}
              style={{ flex: i === stepIndex ? 0 : 1 }}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {currentStep?.title}
            </h1>
            <p className="text-muted-foreground">{stepDescriptions[currentStep?.id as StepId]}</p>
          </div>

          {/* 步骤0：选择学习阶段 */}
          {currentStep?.id === 'stage' && (
            <div className="grid grid-cols-2 gap-3">
              {STAGES.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => handleStageChange(stage.id as LearningStage)}
                  className={clsx(
                    'p-4 rounded-2xl border-2 transition-all text-left',
                    form.stage === stage.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-gray-300 bg-white',
                  )}
                >
                  <div className="text-3xl mb-2">{stage.emoji}</div>
                  <div className="font-bold text-foreground">{stage.name}</div>
                  <div className="text-xs text-muted-foreground">{stage.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* 步骤1：设定学习目标 */}
          {currentStep?.id === 'goal' && (
            <div className="space-y-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setForm(f => ({ ...f, goal: goal.id as LearningGoal }))}
                  className={clsx(
                    'w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4',
                    form.goal === goal.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-gray-300 bg-white',
                  )}
                >
                  <div className="text-3xl">{goal.emoji}</div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">{goal.name}</div>
                    <div className="text-xs text-muted-foreground">{goal.desc}</div>
                  </div>
                  {form.goal === goal.id && <Check size={20} className="text-primary" />}
                </button>
              ))}
            </div>
          )}

          {/* 步骤2：选择年级（小学/初高中才有） */}
          {currentStep?.id === 'grade' && (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                当前阶段：{STAGES.find(s => s.id === form.stage)?.name}
              </div>
              <div
                className={
                  form.stage === 'primary'
                    ? 'grid grid-cols-3 gap-3'
                    : form.stage === 'middle'
                      ? 'grid grid-cols-3 gap-3'
                      : 'grid grid-cols-3 gap-3'
                }
              >
                {currentGradeOptions.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setForm(f => ({ ...f, grade }))}
                    className={clsx(
                      'h-20 rounded-2xl border-2 transition-all flex items-center justify-center font-bold text-lg',
                      form.grade === grade
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-gray-300 bg-white text-muted-foreground',
                    )}
                  >
                    {grade}年级
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 步骤3：设置个人信息 */}
          {currentStep?.id === 'profile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">选择头像</label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setForm(f => ({ ...f, avatar }))}
                      className={clsx(
                        'w-14 h-14 rounded-2xl border-2 transition-all text-2xl flex items-center justify-center',
                        form.avatar === avatar
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-gray-300 bg-white',
                      )}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">昵称</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm(f => ({ ...f, nickname: e.target.value }))}
                  placeholder="输入2-10个字的昵称"
                  maxLength={10}
                  className="w-full h-14 px-4 rounded-2xl border-2 border-border focus:border-primary focus:outline-none transition-all text-foreground font-medium"
                />
                {form.nickname.trim().length > 0 && form.nickname.trim().length < 2 && (
                  <p className="text-destructive text-xs mt-2">昵称至少需要2个字</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-border bg-white">
        <div className="max-w-md mx-auto">
          <PixelButton
            variant="green"
            size="lg"
            className="w-full"
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            icon={<ChevronRight size={20} />}
          >
            {submitting ? '保存中...' : isLastStep ? '开始测评' : '下一步'}
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
