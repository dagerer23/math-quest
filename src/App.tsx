import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { LearningStage, LearningGoal } from '@/types/models'
import Layout from '@/components/Layout'
import AdminLayout from '@/components/AdminLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { NetworkStatus } from '@/components/NetworkStatus'

const Login = lazy(() => import('@/pages/Login'))
const VerifyCode = lazy(() => import('@/pages/VerifyCode'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Assessment = lazy(() => import('@/pages/Assessment'))
const AssessmentResult = lazy(() => import('@/pages/AssessmentResult'))
const Agreement = lazy(() => import('@/pages/Agreement'))
const LayoutPreview = lazy(() => import('@/pages/LayoutPreview'))
const Home = lazy(() => import('@/pages/Home'))
const Battle = lazy(() => import('@/pages/Battle'))
const Result = lazy(() => import('@/pages/Result'))
const Mistakes = lazy(() => import('@/pages/Mistakes'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const Profile = lazy(() => import('@/pages/Profile'))
const DailyGoals = lazy(() => import('@/pages/DailyGoals'))
const Stats = lazy(() => import('@/pages/Stats'))
const Achievements = lazy(() => import('@/pages/Achievements'))
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const QuestionBank = lazy(() => import('@/pages/admin/QuestionBank'))
const DataCenter = lazy(() => import('@/pages/admin/DataCenter'))
const ImportExport = lazy(() => import('@/pages/admin/ImportExport'))
const SystemConfig = lazy(() => import('@/pages/admin/SystemConfig'))
const AccountManagement = lazy(() => import('@/pages/admin/AccountManagement'))
import { useUserStore } from '@/store/useUserStore'
import { tokenLogin, TOKEN_KEY, fetchAssessment } from '@/services/auth'
import { getAchievements, getConfigs } from '@/services/content'
import { Toaster } from '@/components/ui/sonner'
import { silentApiError } from '@/utils/apiError'

function AppRoutes() {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding)
  const assessment = useUserStore((state) => state.assessment)
  const location = useLocation()

  const isAssessmentPath = location.pathname === '/assessment' || location.pathname === '/assessment-result'
  const isOnboardingPath = location.pathname === '/onboarding'

  // 管理后台：独立入口，不受登录/onboarding 约束
  if (location.pathname.startsWith('/admin')) {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/questions" element={<QuestionBank />} />
          <Route path="/admin/analytics" element={<DataCenter />} />
          <Route path="/admin/import" element={<ImportExport />} />
          <Route path="/admin/config" element={<SystemConfig />} />
          <Route path="/admin/accounts" element={<AccountManagement />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    )
  }

  return (
    <div className="relative">
      <NetworkStatus />
      {!isLoggedIn ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/agreement" element={<Agreement />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Routes>
          {/* Onboarding 页面：允许已登录但未完成引导的用户访问 */}
          <Route path="/onboarding" element={<Onboarding />} />
          {/* 测评相关页面：无需 onboarding 也能访问 */}
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/assessment-result" element={<AssessmentResult />} />
          <Route path="/agreement" element={<Agreement />} />
          <Route path="/layout-preview" element={<LayoutPreview />} />
          {/* 其他页面需要完成 onboarding + 测评，否则强制重定向 */}
          {hasCompletedOnboarding ? (
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/battle/:levelId" element={<Battle />} />
              <Route path="/result/:sessionId" element={<Result />} />
              <Route path="/mistakes" element={<Mistakes />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/daily-goals" element={<DailyGoals />} />
              <Route path="/stats" element={<Stats />} />
              {/* 已完成 onboarding 但访问 onboarding → 去首页 */}
              <Route
                path="/onboarding"
                element={<Navigate to={assessment ? '/' : '/assessment'} replace />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          )}
          {/* 兜底：未完成 onboarding 时访问受保护页面 */}
          {!hasCompletedOnboarding && !isOnboardingPath && !isAssessmentPath && (
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          )}
        </Routes>
      )}
    </div>
  )
}

export default function App() {
  const loginWithPhone = useUserStore((s) => s.loginWithPhone)
  const setProfile = useUserStore((s) => s.setProfile)
  const setGrade = useUserStore((s) => s.setGrade)
  const completeOnboarding = useUserStore((s) => s.completeOnboarding)
  const setAssessment = useUserStore((s) => s.setAssessment)
  const setLoggedIn = useUserStore((s) => s.setLoggedIn)
  const setUserId = useUserStore((s) => s.setUserId)
  const setAchievementsMeta = useUserStore((s) => s.setAchievementsMeta)
  const setSystemConfigs = useUserStore((s) => s.setSystemConfigs)
  const [hydrated, setHydrated] = useState(false)

  // 等 Zustand persist hydrate 完成后检测 token 自动登录
  // 登录成功后同步拉取用户资料 + 最新评测
  useEffect(() => {
    const timer = setTimeout(async () => {
      setHydrated(true)
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return

      const result = await tokenLogin(token)
      if (result.success && result.user) {
        const user = result.user
        loginWithPhone(user.phone, user.id)
        // 老用户：有昵称+年级，用后端资料覆盖
        if (user.nickname && user.targetGrade) {
          setProfile({
            nickname: user.nickname,
            avatar: user.avatar,
            learningStage: user.learningStage as LearningStage,
            learningGoal: user.learningGoal as LearningGoal,
            targetGrade: user.targetGrade,
          })
          if (user.targetGrade) setGrade(user.targetGrade)
          completeOnboarding()

          // 尝试拉取用户最新评测，有则直接跳过评测页
          try {
            const res = await fetchAssessment(user.id)
            if (res.success && res.assessment) {
              setAssessment({
                id: res.assessment.id,
                completedAt: res.assessment.completedAt,
                score: res.assessment.score,
                recommendedDifficulty: res.assessment.recommendedDifficulty,
                answers: res.assessment.answers,
              })
            }
          } catch {
            silentApiError(undefined, 'fetchAssessment')
          }
        } else {
          // 资料不全：重置身份，后续路由会走到 onboarding
          const store = useUserStore.getState()
          store.resetUserIdentity()
        }
      } else {
        // 限流(429)时不清除登录状态，保留本地数据
        if (!result.rateLimited) {
          localStorage.removeItem(TOKEN_KEY)
          setLoggedIn(false)
          setUserId(undefined as any)
        }
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [loginWithPhone, setProfile, setGrade, completeOnboarding, setAssessment, setLoggedIn, setUserId])

  // 启动时拉取成就元数据
  useEffect(() => {
    getAchievements()
      .then((list) => {
        setAchievementsMeta(list)
      })
      .catch((err) => {
        silentApiError(err, 'getAchievements')
      })
  }, [setAchievementsMeta])

  // 启动时拉取系统配置
  useEffect(() => {
    getConfigs()
      .then((configs) => {
        setSystemConfigs(configs)
      })
      .catch((err) => {
        silentApiError(err, 'getConfigs')
      })
  }, [setSystemConfigs])

  // 启动时检测跨天，重置每日目标和计数
  useEffect(() => {
    const store = useUserStore.getState()
    const today = new Date().getFullYear() + '-' +
      String(new Date().getMonth() + 1).padStart(2, '0') + '-' +
      String(new Date().getDate()).padStart(2, '0')
    if (store.lastActiveDate !== today) {
      useUserStore.setState({
        lastActiveDate: today,
        streak: store.streak, // streak 由 applyStreak 逻辑处理
        dailyGoals: [],
        dailyGoalDate: today,
        dailyXp: 0,
        dailyQuestions: 0,
      })
    }
  }, [])

  if (!hydrated) return null

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-3 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
        </div>
      }>
        <AppRoutes />
      </Suspense>
      <Toaster position="top-center" richColors />
    </ErrorBoundary>
  )
}
