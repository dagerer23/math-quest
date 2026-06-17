import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { quickLogin, TOKEN_KEY, sendVerificationCode } from '@/services/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// 每次代码更新后修改此版本号，可强制清除前端缓存
const APP_VERSION = '1.0.7'
const VERSION_KEY = 'mathquest_version'

function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

// 版本不匹配时清除旧缓存
function checkVersion() {
  const saved = localStorage.getItem(VERSION_KEY)
  if (saved !== APP_VERSION) {
    localStorage.removeItem('lastPhone')
    localStorage.removeItem('userId')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.setItem(VERSION_KEY, APP_VERSION)
    return true
  }
  return false
}

function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="absolute inset-[-8px] rounded-full bg-primary/10" />
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#1CB0F6" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#g1)" />
            <text x="32" y="28" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="system-ui">＋</text>
            <text x="20" y="46" textAnchor="middle" fill="white" fontSize="15" fontWeight="700" fontFamily="system-ui" opacity="0.75">−</text>
            <text x="44" y="46" textAnchor="middle" fill="white" fontSize="15" fontWeight="700" fontFamily="system-ui" opacity="0.75">×</text>
          </svg>
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1L6.2 3.8L9 4L7 6.2L7.6 9L5 7.5L2.4 9L3 6.2L1 4L3.8 3.8L5 1Z" fill="white" />
          </svg>
        </motion.div>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">算力先锋</h1>
        <p className="text-[11px] text-muted-foreground/80 mt-0.5 tracking-widest uppercase">Math Quest</p>
      </div>
    </div>
  )
}

// ─── 一键登录卡片（老用户二次登录）───────────────────────────────────
function OneClickLoginCard({
  phone,
  onClick,
  loading,
  disabled,
}: {
  phone: string
  onClick: () => void
  loading: boolean
  disabled: boolean
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      disabled={loading || disabled}
      className={[
        'w-full py-4 rounded-2xl flex items-center gap-4 px-5 border-2 transition-[background-color,border-color,transform] active:scale-[0.99]',
        disabled || loading
          ? 'bg-muted border-border text-muted-foreground'
          : 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10',
      ].join(' ')}
    >
      <div className="w-11 h-11 rounded-full bg-white grid place-items-center shadow-sm">
        <div className="w-8 h-8 rounded-full bg-primary text-white grid place-items-center text-sm font-bold">
          {phone.slice(0, 1)}
        </div>
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-bold text-foreground">{maskPhone(phone)}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">一键登录 · 免验证码</div>
      </div>
      {loading ? (
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center text-sm font-bold shadow-sm">
          →
        </div>
      )}
    </motion.button>
  )
}

// ─── 手机号输入框（placeholder 居中）─────────────────────────────────
function PhoneInput({
  value,
  onChange,
  onEnter,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  onEnter: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-4 flex items-center gap-2 pointer-events-none z-10">
        <span className="text-muted-foreground text-sm font-medium">+86</span>
        <Separator orientation="vertical" className="h-4" />
      </div>
      <Input
        ref={inputRef as unknown as React.LegacyRef<HTMLInputElement>}
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter() }}
        placeholder="请输入手机号"
        className="w-full h-14 pl-[88px] pr-4 rounded-2xl border-2 border-border bg-background focus:border-primary text-foreground font-medium text-base text-left"
        autoComplete="tel"
      />
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { setLoggedIn, setProfile } = useUserStore()

  // 页面加载时检查版本，不匹配则清除缓存
  const [lastPhone, setLastPhone] = useState(() => {
    checkVersion()
    return localStorage.getItem('lastPhone')
  })

  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [quickLoading, setQuickLoading] = useState(false)
  const [showOther, setShowOther] = useState(false)


  const hasLastPhone = !!lastPhone
  const inputRef = useRef<HTMLInputElement>(null)

  // 处理登录成功后统一的导航逻辑
  const handleLoginSuccess = useCallback(
    (result: { success: boolean; message: string; user?: any; token?: string }, inputPhone: string) => {
      if (!result.success || !result.user) {
        setError(result.message || '登录失败')
        return
      }
      const userId = result.user.id
      localStorage.setItem('lastPhone', inputPhone)
      localStorage.setItem('userId', userId)
      if (result.token) localStorage.setItem(TOKEN_KEY, result.token)

      setLoggedIn(true)
      const userStore = useUserStore.getState()
      userStore.loginWithPhone(inputPhone, userId)

      // 老用户：有昵称 + 目标年级，直接进入首页
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
        setTimeout(() => navigate('/', { replace: true }), 250)
      } else {
        // 新用户：清空上一用户的 onboarding/测评/用户资料状态，走完整的引导流程
        userStore.resetUserIdentity()
        setTimeout(() => navigate('/onboarding', { replace: true }), 250)
      }
    },
    [navigate, setLoggedIn],
  )

  const handleSendCode = async () => {
    if (phone.length !== 11) {
      setError('请输入11位手机号')
      return
    }
    setError('')
    setSendingCode(true)
    const res = await sendVerificationCode(phone)
    setSendingCode(false)
    if (res.success) {
      localStorage.setItem('codeSentAt', Date.now().toString())
      navigate(`/verify-code?phone=${encodeURIComponent(phone)}`)
    } else {
      setError(res.message || '验证码发送失败')
    }
  }

  const handleQuickLogin = async () => {
    if (!lastPhone) return
    setError('')
    setQuickLoading(true)
    const result = await quickLogin(lastPhone)
    setQuickLoading(false)
    if (result.success) {
      handleLoginSuccess(result, lastPhone)
    } else {
      setPhone(lastPhone)
      setShowOther(true)
      setError(result.message || '一键登录失败，请使用验证码登录')
    }
  }

  const handleGuestLogin = () => {
    setLoggedIn(true)
    setProfile({
      nickname: '数学爱好者',
      avatar: '🤓',
      learningStage: 'primary',
      learningGoal: 'consolidation',
      targetGrade: 2,
    })
    setTimeout(() => navigate('/onboarding'), 250)
  }

  useEffect(() => {
    if (!hasLastPhone && inputRef.current) {
      inputRef.current.focus()
    }
  }, [hasLastPhone])

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen bg-white flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="h-1 bg-gradient-to-r from-primary via-[#1CB0F6] to-primary" />

        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-24"
          >
            <BrandLogo />
          </motion.div>

          <div className="w-full max-w-[320px] flex flex-col gap-5">
            {/* ── 二次登录：有历史手机号 ── */}
            {hasLastPhone && (
              <>
                <OneClickLoginCard
                  phone={lastPhone}
                  onClick={handleQuickLogin}
                  loading={quickLoading}
                  disabled={sendingCode}
                />

                <div className="pt-2">
                  <button
                    onClick={() => setShowOther((v) => !v)}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  >
                    <span>其他方式登录</span>
                    {showOther ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <AnimatePresence>
                    {showOther && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 flex flex-col gap-4">
                          <div className="flex items-center gap-3 py-1">
                            <Separator className="flex-1 h-px" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              手机号验证码登录
                            </span>
                            <Separator className="flex-1 h-px" />
                          </div>

                          <PhoneInput
                            value={phone}
                            onChange={(v) => { setPhone(v); setError('') }}
                            onEnter={handleSendCode}
                            inputRef={inputRef as React.RefObject<HTMLInputElement>}
                          />

                          <AnimatePresence>
                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-destructive text-xs text-center -mt-1"
                              >
                                {error}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          <Button
                            onClick={handleSendCode}
                            disabled={phone.length !== 11 || sendingCode || quickLoading}
                            className="w-full h-14 rounded-2xl font-semibold text-base"
                          >
                            {sendingCode ? (
                              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              '验证码登录'
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* ── 首次登录：无历史手机号 ── */}
            {!hasLastPhone && (
              <>
                <PhoneInput
                  value={phone}
                  onChange={(v) => { setPhone(v); setError('') }}
                  onEnter={handleSendCode}
                  inputRef={inputRef as React.RefObject<HTMLInputElement>}
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-destructive text-xs text-center -mt-1"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleSendCode}
                  disabled={phone.length !== 11 || sendingCode}
                  className="w-full h-14 rounded-2xl font-semibold text-base"
                >
                  {sendingCode ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '验证码登录'
                  )}
                </Button>
              </>
            )}

            {/* ── 底部：游客登录 ── */}
            <div className="pt-4 mt-2">
              <div className="flex items-center gap-3 py-1 mb-2">
                <Separator className="flex-1 h-px" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">或</span>
                <Separator className="flex-1 h-px" />
              </div>
              <Button
                variant="ghost"
                onClick={handleGuestLogin}
                className="w-full h-11 text-xs text-muted-foreground hover:text-foreground"
              >
                游客模式体验
              </Button>
            </div>
          </div>

          <motion.div
            className="mt-auto pt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[10px] text-muted-foreground">
              登录即同意
              <Link to="/agreement" className="text-muted-foreground hover:text-foreground transition-colors mx-0.5 min-h-[44px] inline-flex items-center">用户协议</Link>
              和
              <Link to="/agreement?tab=privacy" className="text-muted-foreground hover:text-foreground transition-colors mx-0.5 min-h-[44px] inline-flex items-center">隐私政策</Link>
              <br />
              <span className="text-[9px] mt-1 inline-block">测试验证码：123456</span>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
