import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { loginWithPhone, TOKEN_KEY } from '@/services/auth'
import { ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

// ─── 6 格验证码输入 ───
function CodeInput({ value, onChange, onComplete }: {
  value: string
  onChange: (v: string) => void
  onComplete?: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const boxes = Array.from({ length: 6 }, (_, i) => value[i] || '')

  return (
    <div className="flex gap-2 justify-center" onClick={() => ref.current?.focus()}>
      {boxes.map((char, i) => (
        <motion.div
          key={i}
          className={clsx(
            'w-11 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors',
            char
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-border bg-muted text-transparent',
            i === value.length && 'ring-2 ring-primary/30'
          )}
          animate={char ? { scale: [0.95, 1] } : {}}
        >
          {char || (
            <motion.div
              className="w-0.5 h-6 bg-muted-foreground rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
      <input
        ref={ref}
        type="tel"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
          onChange(digits)
          if (digits.length === 6 && onComplete) onComplete()
        }}
        className="sr-only"
        autoFocus
      />
    </div>
  )
}

// ─── 圆环倒计时 ───
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const progress = seconds / total
  const offset = circumference * (1 - progress)

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
      <circle cx="20" cy="20" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
      <motion.circle
        cx="20" cy="20" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  )
}

export default function VerifyCode() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setLoggedIn, setProfile } = useUserStore()

  const phone = searchParams.get('phone') || ''

  // 从 localStorage 读取倒计时过期时间
  const getExpiry = () => {
    const ts = localStorage.getItem('codeSentAt')
    return ts ? parseInt(ts, 10) + 60_000 : 0
  }

  const getRemaining = () => {
    const remaining = Math.max(0, Math.ceil((getExpiry() - Date.now()) / 1000))
    return remaining
  }

  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(() => getRemaining())
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      const remaining = getRemaining()
      setCountdown(remaining)
      if (remaining <= 0) clearInterval(timer)
    }, 500)
    return () => clearInterval(timer)
  }, [countdown])

  // 无手机号则回退
  useEffect(() => {
    if (!phone) navigate('/login', { replace: true })
  }, [phone, navigate])

  // 发送验证码（不调接口，直接倒计时）
  const handleResend = useCallback(() => {
    if (resending) return
    setResending(true)
    const now = Date.now()
    localStorage.setItem('codeSentAt', now.toString())
    setCountdown(60)
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setResending(false)
    }, 2000)
  }, [resending])

  // 验证
  const handleVerify = useCallback(async (inputCode?: string) => {
    const finalCode = inputCode ?? code
    if (finalCode.length !== 6) {
      setError('请输入6位验证码')
      return
    }
    setError('')
    setLoading(true)
    const result = await loginWithPhone(phone, finalCode)
    setLoading(false)
    if (result.success && result.user) {
      localStorage.setItem('lastPhone', phone)
      const userId = result.user.id
      localStorage.setItem('userId', userId)
      // 保存 30 天有效期 token，下次打开 App 自动登录
      if (result.token) {
        localStorage.setItem(TOKEN_KEY, result.token)
      }

      setLoggedIn(true)
      const userStore = useUserStore.getState()
      userStore.loginWithPhone(phone, userId)

      // 如果用户已有完善资料（老用户），用后端资料覆盖并直接进入首页
      if (result.user.nickname && result.user.targetGrade) {
        userStore.setProfile({
          nickname: result.user.nickname,
          avatar: result.user.avatar,
          learningStage: result.user.learningStage as any,
          learningGoal: result.user.learningGoal as any,
          targetGrade: result.user.targetGrade,
        })
        userStore.setGrade(result.user.targetGrade)
        userStore.completeOnboarding()
        navigate('/', { replace: true })
      } else {
        // 新用户：清空上一用户的身份相关数据，走 onboarding 流程
        userStore.resetUserIdentity()
        navigate('/onboarding', { replace: true })
      }
    } else {
      setError(result.message || '验证码错误，请重试')
    }
  }, [code, phone, navigate, setLoggedIn])

  // 自动验证
  const handleCodeChange = (v: string) => {
    setCode(v)
    setError('')
    if (v.length === 6) handleVerify(v)
  }

  return (
    <motion.div
      className="min-h-screen bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 顶条 */}
      <div className="h-1 bg-gradient-to-r from-primary via-[#1CB0F6] to-primary" />

      <div className="flex-1 flex flex-col px-8 py-12">
        {/* 返回 */}
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors -ml-1 mb-auto"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">返回</span>
        </button>

        <div className="w-full max-w-[320px] mx-auto">
          {/* 标题 */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-foreground">输入验证码</h2>
            <p className="text-xs text-muted-foreground mt-2">
              验证码已发送至 {maskPhone(phone)}
            </p>
          </div>

          {/* 验证码输入 */}
          <CodeInput
            value={code}
            onChange={handleCodeChange}
          />

          {/* 提示 */}
          <AnimatePresence>
            {sent && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-primary mt-5"
              >
                验证码已重新发送（测试: 123456）
              </motion.p>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-center text-xs text-red-500 mt-5">{error}</p>
          )}

          {/* 重发 */}
          <div className="text-center mt-8">
            {countdown > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <CountdownRing seconds={countdown} total={60} />
                <span className="text-xs text-muted-foreground">{countdown}s 后可重新发送</span>
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? '发送中...' : '没收到？重新发送'}
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-6"
            >
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">验证中...</span>
            </motion.div>
          )}
        </div>

        {/* 底部 */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-[10px] text-muted-foreground">
            登录即同意 用户协议 和 隐私政策
          </p>
        </div>
      </div>
    </motion.div>
  )
}