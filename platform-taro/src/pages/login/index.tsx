import { useState, useCallback } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import {
  sendVerificationCode,
  quickLogin as apiQuickLogin,
  wxLogin as apiWxLogin,
  guestLogin as apiGuestLogin,
  TOKEN_KEY,
} from '@/services/auth'
import { Icon } from '@/components/Icon'
import { C, TOKEN, btnShadow } from '@/styles/theme'

const APP_VERSION = '1.0.7'
const VERSION_KEY = 'mathquest_version'

const AGREEMENT_URL = '/pages/agreement/index'

function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

function checkVersion() {
  try {
    const saved = Taro.getStorageSync(VERSION_KEY)
    if (saved !== APP_VERSION) {
      Taro.removeStorageSync('lastPhone')
      Taro.removeStorageSync('userId')
      Taro.removeStorageSync(TOKEN_KEY)
      Taro.setStorageSync(VERSION_KEY, APP_VERSION)
      return true
    }
  } catch {}
  return false
}

function BrandLogo() {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <View style={{ position: 'relative', width: 64, height: 64 }}>
        <View style={{
          position: 'absolute', top: -8, left: -8, right: -8, bottom: -8,
          borderRadius: 999, background: C.icon.iconGreenBg,
        }} />
        <View style={{
          position: 'relative', width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${C.semantic.primary}, ${C.semantic.secondary})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: 800 }}>＋</Text>
          <Text style={{ position: 'absolute', left: 14, bottom: 8, color: '#fff', fontSize: 18, fontWeight: 700, opacity: 0.75 }}>−</Text>
          <Text style={{ position: 'absolute', right: 12, bottom: 8, color: '#fff', fontSize: 18, fontWeight: 700, opacity: 0.75 }}>×</Text>
        </View>
        <View style={{
          position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderRadius: 999,
          background: C.semantic.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="star" size={12} color="#fff" fill="#fff" />
        </View>
      </View>
      <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: 800, color: C.semantic.foreground, letterSpacing: -0.5 }}>数学逆袭</Text>
      </View>
    </View>
  )
}

function WxIcon() {
  return (
    <View style={{ width: 22, height: 22, marginRight: 8, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 18, height: 13, borderRadius: 4, background: '#fff',
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{ width: 3, height: 3, borderRadius: 999, background: C.wx.wxGreen, marginRight: 3 }} />
        <View style={{ width: 3, height: 3, borderRadius: 999, background: C.wx.wxGreen }} />
      </View>
      <View style={{ position: 'absolute', left: 3, bottom: 2, width: 5, height: 5, background: '#fff', transform: [{ rotate: '45deg' }] }} />
    </View>
  )
}

function Divider({ text }: { text: string }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
      <View style={{ flex: 1, height: 1, background: C.semantic.border }} />
      <Text style={{ fontSize: 10, color: C.semantic.mutedForeground, letterSpacing: 1, marginLeft: 12, marginRight: 12 }}>{text}</Text>
      <View style={{ flex: 1, height: 1, background: C.semantic.border }} />
    </View>
  )
}

function OneClickLoginCard({ phone, onClick, loading, disabled }: {
  phone: string; onClick: () => void; loading: boolean; disabled: boolean
}) {
  const off = loading || disabled
  return (
    <View
      onClick={off ? undefined : onClick}
      className="taro-btn-press"
      style={{
        width: '100%',
        paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20,
        borderRadius: TOKEN.radius.lg,
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        borderWidth: 2, borderStyle: 'solid',
        borderColor: off ? C.semantic.border : C.semantic.primary,
        background: off ? C.icon.iconGrayBg : C.icon.iconGreenBg,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 32, height: 32, borderRadius: 999, background: C.semantic.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{phone.slice(0, 1)}</Text>
        </View>
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>{maskPhone(phone)}</Text>
        <Text style={{ fontSize: 11, color: C.semantic.mutedForeground, marginTop: 2 }}>一键登录 · 免验证码</Text>
      </View>
      {loading ? (
        <Text style={{ color: C.semantic.primary, fontSize: 13 }}>登录中...</Text>
      ) : (
        <View style={{ width: 36, height: 36, borderRadius: 999, background: C.semantic.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrowRight" size={18} color="#fff" />
        </View>
      )}
    </View>
  )
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{
      height: 56, borderRadius: TOKEN.radius.lg, borderWidth: 2, borderStyle: 'solid',
      borderColor: C.semantic.border, background: C.semantic.background,
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      paddingLeft: 16, paddingRight: 16,
    }}>
      <Text style={{ fontSize: 14, fontWeight: 500, color: C.semantic.mutedForeground, marginRight: 8 }}>+86</Text>
      <View style={{ width: 1, height: 16, background: C.semantic.border, marginRight: 8 }} />
      <Input
        type="number"
        value={value}
        onInput={(e) => onChange((e.detail.value || '').replace(/\D/g, '').slice(0, 11))}
        style={{ flex: 1, height: '100%', fontSize: 16, fontWeight: 500, color: C.semantic.foreground }}
        placeholder="请输入手机号"
        placeholderStyle={{ textAlign: 'center', color: C.semantic.mutedForeground, fontSize: 16, fontWeight: 500 }}
        maxlength={11}
      />
    </View>
  )
}

function PrimaryButton({ text, loading, disabled, onClick }: {
  text: string; loading: boolean; disabled: boolean; onClick: () => void
}) {
  const off = disabled || loading
  return (
    <View
      onClick={off ? undefined : onClick}
      className="taro-btn-press"
      style={{
        width: '100%', height: 52, borderRadius: TOKEN.radius.lg,
        background: off ? C.semantic.border : C.semantic.primary,
        boxShadow: off ? 'none' : btnShadow(C.duolingo.greenDark),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: off ? 0.6 : 1,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{loading ? '发送中...' : text}</Text>
    </View>
  )
}

export default function LoginPage() {
  const setLoggedIn = useUserStore((s) => s.setLoggedIn)
  const setProfile = useUserStore((s) => s.setProfile)
  const isLoggedIn = useUserStore((s) => s.isLoggedIn)

  const [lastPhone, setLastPhone] = useState<string>(() => {
    checkVersion()
    try { return Taro.getStorageSync('lastPhone') || '' } catch { return '' }
  })
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [quickLoading, setQuickLoading] = useState(false)
  const [wxLoading, setWxLoading] = useState(false)
  const [wxAvatar, setWxAvatar] = useState('')
  const [wxAvatarUrl, setWxAvatarUrl] = useState('')
  const [wxStep, setWxStep] = useState<'idle' | 'phone'>('idle')
  const [showOther, setShowOther] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const hasLastPhone = !!lastPhone

  useDidShow(() => {
    if (isLoggedIn) {
      Taro.switchTab({ url: '/pages/home/index' })
    }
  })

  const handleLoginSuccess = useCallback((result: any, inputPhone: string) => {
    if (!result.success || !result.user) {
      setError(result.message || '登录失败')
      return
    }
    const userId = result.user.id
    if (inputPhone) Taro.setStorageSync('lastPhone', inputPhone)
    Taro.setStorageSync('userId', userId)
    if (result.token) Taro.setStorageSync(TOKEN_KEY, result.token)

    setLoggedIn(true)
    const userStore = useUserStore.getState()
    userStore.loginWithPhone(inputPhone, userId)

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
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 250)
    } else {
      userStore.resetUserIdentity()
      // 保存微信授权头像，onboarding 中不可修改
      if (result.user.avatar) {
        userStore.setProfile({ avatar: result.user.avatar })
      }
      setTimeout(() => Taro.redirectTo({ url: '/pages/onboarding/index' }), 250)
    }
  }, [setLoggedIn])

  const ensureAgreed = useCallback((): boolean => {
    if (!agreed) {
      Taro.showToast({ title: '请先阅读并同意用户协议与隐私政策', icon: 'none' })
      return false
    }
    return true
  }, [agreed])

  const openAgreement = () => {
    Taro.navigateTo({ url: AGREEMENT_URL })
  }

  const handleSendCode = async () => {
    if (!ensureAgreed()) return
    if (phone.length !== 11) {
      setError('请输入11位手机号')
      return
    }
    setError('')
    setSendingCode(true)
    const res = await sendVerificationCode(phone)
    setSendingCode(false)
    if (res.success) {
      Taro.setStorageSync('codeSentAt', Date.now().toString())
      Taro.navigateTo({ url: `/pages/verify-code/index?phone=${encodeURIComponent(phone)}` })
    } else {
      setError(res.message || '验证码发送失败')
    }
  }

  const handleQuickLogin = async () => {
    if (!ensureAgreed()) return
    if (!lastPhone) return
    setError('')
    setQuickLoading(true)
    const result = await apiQuickLogin(lastPhone)
    setQuickLoading(false)
    if (result.success) {
      handleLoginSuccess(result, lastPhone)
    } else {
      setPhone(lastPhone)
      setShowOther(true)
      setError(result.message || '一键登录失败，请使用验证码登录')
    }
  }

  // Step 1: 微信头像授权回调（chooseAvatar）
  const handleChooseAvatar = (e: any) => {
    const avatarUrl = e.detail.avatarUrl
    if (!avatarUrl) {
      console.log('[login] 用户取消选择头像')
      return
    }
    console.log('[login] chooseAvatar 成功:', avatarUrl)
    setWxAvatarUrl(avatarUrl)
    // 读取临时文件为 base64，用于提交后端
    try {
      const fs = Taro.getFileSystemManager()
      const base64 = fs.readFileSync(avatarUrl, 'base64')
      setWxAvatar(`data:image/png;base64,${base64}`)
    } catch (err) {
      console.error('[login] 读取头像 base64 失败，降级使用临时路径:', err)
      setWxAvatar(avatarUrl)
    }
    setWxStep('phone')
  }

  // Step 2: 微信手机号授权回调（getPhoneNumber）
  const handleGetPhoneNumber = async (e: any) => {
    const errMsg = e.detail.errMsg
    if (errMsg !== 'getPhoneNumber:ok') {
      console.log('[login] 用户拒绝手机号授权:', errMsg)
      Taro.showToast({ title: '需要授权手机号才能登录', icon: 'none' })
      return
    }
    const phoneCode = e.detail.code
    console.log('[login] getPhoneNumber 成功, phoneCode:', phoneCode)
    setWxLoading(true)
    try {
      // 获取微信登录 code（静默调用，无需用户点击）
      const loginRes = await Taro.login()
      const loginCode = loginRes.code
      console.log('[login] Taro.login code:', loginCode)
      // 提交后端：登录 code + 手机号 code + 头像 base64
      const result = await apiWxLogin({ code: loginCode, phoneCode, avatar: wxAvatar })
      console.log('[login] apiWxLogin 返回:', JSON.stringify(result))
      setWxLoading(false)
      if (result && result.success && result.user) {
        handleLoginSuccess(result, result.user.phone || '')
      } else {
        const errText = (result && typeof result.message === 'string' && result.message)
          ? result.message
          : '后端返回未知错误，请检查后端服务是否启动'
        Taro.showModal({
          title: '微信登录失败',
          content: errText,
          showCancel: false,
        })
      }
    } catch (err) {
      setWxLoading(false)
      let msg = '未知错误'
      if (err instanceof Error) {
        msg = err.message
      } else if (err && typeof err === 'object') {
        msg = (err as any).message || (err as any).errMsg || JSON.stringify(err)
      } else if (typeof err === 'string') {
        msg = err
      }
      console.error('[login] handleGetPhoneNumber 异常:', err, '提取消息:', msg)
      Taro.showModal({
        title: '微信登录异常',
        content: `${msg}\n\n请确认后端服务已启动（端口 3001）`,
        showCancel: false,
      })
    }
  }

  const handleGuestLogin = async () => {
    Taro.showLoading({ title: '进入中...' })
    // 纯本地游客模式，不发网络请求，避免真机网络不通时卡死
    const guestId = `guest_${Date.now()}`
    Taro.setStorageSync('userId', guestId)
    const userStore = useUserStore.getState()
    userStore.loginWithPhone('', guestId)
    userStore.resetUserIdentity()
    setLoggedIn(true)
    setProfile({
      nickname: '游客',
      avatar: '',
      learningStage: 'primary',
      learningGoal: 'consolidation',
      targetGrade: 2,
    })
    Taro.hideLoading()
    setTimeout(() => Taro.redirectTo({ url: '/pages/onboarding/index' }), 250)
  }

  const toggleAgree = () => setAgreed((v) => !v)

  return (
    <View style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column' }}>
      <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: 32, paddingRight: 32, paddingTop: 72, paddingBottom: 40 }}>
        <View style={{ marginBottom: 44 }} className="taro-pop-in">
          <BrandLogo />
        </View>

        <View style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column' }}>
          {/* 微信一键登录（主入口）- 两步授权：头像 → 手机号 */}
          {wxStep === 'idle' ? (
            agreed ? (
              <Button
                openType="chooseAvatar"
                onChooseAvatar={handleChooseAvatar}
                style={{
                  width: '100%', height: 52, borderRadius: TOKEN.radius.lg,
                  background: C.wx.wxGreen,
                  boxShadow: TOKEN.shadow.md,
                  display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  border: 'none', padding: '0', margin: '0', lineHeight: 'normal',
                }}
              >
                <WxIcon />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>微信一键登录</Text>
              </Button>
            ) : (
              <View
                onClick={() => ensureAgreed()}
                className="taro-btn-press"
                style={{
                  width: '100%', height: 52, borderRadius: TOKEN.radius.lg,
                  background: C.wx.wxGreen,
                  boxShadow: TOKEN.shadow.md,
                  display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <WxIcon />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>微信一键登录</Text>
              </View>
            )
          ) : (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <Image src={wxAvatarUrl} style={{ width: 56, height: 56, borderRadius: 999, marginBottom: 8 }} mode="aspectFill" />
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginBottom: 12 }}>头像获取成功，请授权手机号完成登录</Text>
              <Button
                openType="getPhoneNumber"
                onGetPhoneNumber={handleGetPhoneNumber}
                style={{
                  width: '100%', height: 52, borderRadius: TOKEN.radius.lg,
                  background: C.wx.wxGreen,
                  boxShadow: TOKEN.shadow.md,
                  display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  border: 'none', padding: '0', margin: '0', lineHeight: 'normal',
                  opacity: wxLoading ? 0.7 : 1,
                }}
              >
                <WxIcon />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{wxLoading ? '登录中...' : '授权手机号登录'}</Text>
              </Button>
              <View
                onClick={() => { setWxStep('idle'); setWxAvatar(''); setWxAvatarUrl('') }}
                style={{ marginTop: 12 }}
              >
                <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>重新选择头像</Text>
              </View>
            </View>
          )}

          {/* 协议勾选区 */}
          <View
            onClick={toggleAgree}
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingLeft: 4, paddingRight: 4 }}
          >
            <View style={{
              width: 18, height: 18, borderRadius: 999, borderWidth: 2, borderStyle: 'solid',
              borderColor: agreed ? C.semantic.primary : C.semantic.border,
              background: agreed ? C.semantic.primary : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 8,
            }}>
              {agreed && <Icon name="check" size={12} color="#fff" />}
            </View>
            <Text style={{ flex: 1, fontSize: 11, color: C.semantic.mutedForeground, lineHeight: '18px' }}>
              <Text>我已阅读并同意</Text>
              <Text onClick={(e) => { e.stopPropagation(); openAgreement() }} style={{ color: C.semantic.primary }}>《用户协议》</Text>
              <Text>和</Text>
              <Text onClick={(e) => { e.stopPropagation(); openAgreement() }} style={{ color: C.semantic.primary }}>《隐私政策》</Text>
            </Text>
          </View>

          {/* 其他方式登录（折叠） */}
          <View
            onClick={() => setShowOther((v) => !v)}
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 16, paddingBottom: 8, marginTop: 8 }}
          >
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>{showOther ? '收起其他方式' : '其他方式登录'}</Text>
            <Icon name={showOther ? 'chevronUp' : 'chevronDown'} size={10} color={C.semantic.mutedForeground} style={{ marginLeft: 4 }} />
          </View>

          {showOther && (
            <View className="taro-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* 老用户一键登录 */}
              {hasLastPhone && (
                <>
                  <OneClickLoginCard
                    phone={lastPhone}
                    onClick={handleQuickLogin}
                    loading={quickLoading}
                    disabled={sendingCode}
                  />
                  <View style={{ height: 16 }} />
                  <Divider text="或验证码登录" />
                  <View style={{ height: 12 }} />
                </>
              )}

              {/* 手机号验证码登录 */}
              <PhoneInput value={phone} onChange={(v) => { setPhone(v); setError('') }} />
              {!!error && <Text style={{ fontSize: 12, color: C.semantic.destructive, textAlign: 'center', marginTop: 8 }}>{error}</Text>}
              <View style={{ height: 16 }} />
              <PrimaryButton text="验证码登录" loading={sendingCode} disabled={phone.length !== 11 || quickLoading} onClick={handleSendCode} />
            </View>
          )}

          {/* 游客模式 */}
          <View style={{ marginTop: 16 }}>
            <Divider text="或" />
            <View
              onClick={handleGuestLogin}
              className="taro-btn-press"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 12, paddingBottom: 12, marginTop: 4 }}
            >
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>游客模式体验</Text>
            </View>
          </View>
        </View>

        {/* 底部协议文字 */}
        <View style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: C.semantic.mutedForeground, textAlign: 'center' }}>
            登录即代表同意《用户协议》与《隐私政策》
          </Text>
        </View>
      </View>
    </View>
  )
}
