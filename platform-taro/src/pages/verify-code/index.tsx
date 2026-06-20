import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { loginWithPhone as apiLoginWithPhone, sendVerificationCode, TOKEN_KEY } from '@/services/auth'
import { Icon } from '@/components/Icon'
import { C, TOKEN } from '@/styles/theme'

const primaryLight = 'rgba(88,204,2,0.08)'

function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

export default function VerifyCodePage() {
  const router = useRouter()
  const phone = (router.params.phone as string) || ''
  const setLoggedIn = useUserStore((s) => s.setLoggedIn)

  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(() => {
    try {
      const ts = Taro.getStorageSync('codeSentAt')
      if (ts) {
        return Math.max(0, Math.ceil((parseInt(ts, 10) + 60000 - Date.now()) / 1000))
      }
    } catch {}
    return 60
  })
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // 无手机号回退
  useEffect(() => {
    if (!phone) Taro.redirectTo({ url: '/pages/login/index' })
  }, [phone])

  const handleVerify = useCallback(async (inputCode?: string) => {
    const finalCode = inputCode ?? code
    if (finalCode.length !== 6) {
      setError('请输入6位验证码')
      return
    }
    setError('')
    setLoading(true)
    const result = await apiLoginWithPhone(phone, finalCode)
    setLoading(false)
    if (result.success && result.user) {
      Taro.setStorageSync('lastPhone', phone)
      Taro.setStorageSync('userId', result.user.id)
      if (result.token) Taro.setStorageSync(TOKEN_KEY, result.token)

      setLoggedIn(true)
      const userStore = useUserStore.getState()
      userStore.loginWithPhone(phone, result.user.id)

      if (result.user.nickname && result.user.targetGrade) {
        userStore.setProfile({
          nickname: result.user.nickname,
          avatar: result.user.avatar,
          learningStage: result.user.learningStage,
          learningGoal: result.user.learningGoal,
          targetGrade: result.user.targetGrade,
        })
        userStore.setGrade(result.user.targetGrade)
        userStore.completeOnboarding()
        Taro.switchTab({ url: '/pages/home/index' })
      } else {
        userStore.resetUserIdentity()
        Taro.redirectTo({ url: '/pages/onboarding/index' })
      }
    } else {
      setError(result.message || '验证码错误，请重试')
    }
  }, [code, phone, setLoggedIn])

  const handleCodeChange = (v: string) => {
    const digits = (v || '').replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError('')
    if (digits.length === 6) handleVerify(digits)
  }

  const handleResend = async () => {
    if (resending) return
    setResending(true)
    await sendVerificationCode(phone)
    Taro.setStorageSync('codeSentAt', Date.now().toString())
    setCountdown(60)
    setSent(true)
    setTimeout(() => setSent(false), 2000)
    setResending(false)
  }

  const boxes = Array.from({ length: 6 }, (_, i) => code[i] || '')

  return (
    <View style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      <View style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 32, paddingRight: 32, paddingTop: 48, paddingBottom: 48 }}>
        {/* 返回 */}
        <View
          onClick={() => Taro.redirectTo({ url: '/pages/login/index' })}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 'auto' }}
        >
          <Icon name="arrowLeft" size={18} color={C.semantic.mutedForeground} />
          <Text style={{ fontSize: 14, color: C.semantic.mutedForeground, marginLeft: 6 }}>返回</Text>
        </View>

        <View style={{ width: '100%', maxWidth: 320, alignSelf: 'center' }}>
          {/* 标题 */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 20, fontWeight: 600, color: C.semantic.foreground }}>输入验证码</Text>
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 8 }}>验证码已发送至 {maskPhone(phone)}</Text>
          </View>

          {/* 6 格验证码 */}
          <View style={{ position: 'relative' }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
              {boxes.map((char, i) => (
                <View
                  key={i}
                  style={{
                    width: 44, height: 56, borderRadius: TOKEN.radius.md,
                    borderWidth: 2, borderStyle: 'solid',
                    borderColor: char ? C.semantic.primary : C.semantic.border,
                    background: char ? primaryLight : C.icon.iconGrayBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: i === 0 ? 0 : 4, marginRight: i === 5 ? 0 : 4,
                  }}
                >
                  {char ? (
                    <Text style={{ fontSize: 20, fontWeight: 700, color: C.semantic.foreground }}>{char}</Text>
                  ) : i === code.length ? (
                    <View style={{ width: 2, height: 24, background: C.semantic.mutedForeground, borderRadius: 999 }} />
                  ) : null}
                </View>
              ))}
            </View>
            <Input
              type="number"
              value={code}
              onInput={(e) => handleCodeChange(e.detail.value)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0 }}
              maxlength={6}
              autoFocus
            />
          </View>

          {/* 提示 */}
          {!!sent && (
            <Text style={{ textAlign: 'center', fontSize: 12, color: C.semantic.primary, marginTop: 20 }}>
              验证码已重新发送（测试: 123456）
            </Text>
          )}
          {!!error && (
            <Text style={{ textAlign: 'center', fontSize: 12, color: C.semantic.destructive, marginTop: 20 }}>{error}</Text>
          )}

          {/* 重发 */}
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
            {countdown > 0 ? (
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>{countdown}s 后可重新发送</Text>
            ) : (
              <View onClick={handleResend}>
                <Text style={{ fontSize: 12, color: C.semantic.primary, fontWeight: 500 }}>
                  {resending ? '发送中...' : '没收到？重新发送'}
                </Text>
              </View>
            )}
          </View>

          {/* Loading */}
          {loading && (
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>验证中...</Text>
            </View>
          )}
        </View>

        {/* 底部 */}
        <View style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: C.semantic.mutedForeground, textAlign: 'center' }}>
            登录即同意 用户协议 和 隐私政策
          </Text>
        </View>
      </View>
    </View>
  )
}
