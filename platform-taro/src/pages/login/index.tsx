import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Avatar } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { useUserStore } from '@/store/useUserStore'
import { loginWithPhone as apiLogin, sendVerificationCode, validatePhone, TOKEN_KEY } from '@/services/auth'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const loginWithPhone = useUserStore((s) => s.loginWithPhone)
  const isLoggedIn = useUserStore((s) => s.isLoggedIn)

  useDidShow(() => {
    if (isLoggedIn) {
      Taro.switchTab({ url: '/pages/home/index' })
    }
  })

  const requestCode = async () => {
    if (!validatePhone(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    setLoading(true)
    const result = await sendVerificationCode(phone)
    setLoading(false)
    if (result.success) {
      setStep('code')
      Taro.showToast({ title: '验证码已发送', icon: 'none' })
    } else {
      Taro.showToast({ title: result.message || '发送失败', icon: 'none' })
    }
  }

  const verify = async () => {
    if (code.length < 4) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }
    setLoading(true)
    const result = await apiLogin(phone, code)
    setLoading(false)
    if (result.success && result.user && result.token) {
      // Save token
      Taro.setStorageSync(TOKEN_KEY, result.token)
      // Update user store
      loginWithPhone(phone, result.user.id)
      if (result.user.nickname && result.user.targetGrade) {
        // Existing user - go to home
        Taro.switchTab({ url: '/pages/home/index' })
      } else {
        // New user - go to onboarding
        Taro.redirectTo({ url: '/pages/onboarding/index' })
      }
    } else {
      Taro.showToast({ title: result.message || '登录失败', icon: 'none' })
    }
  }

  return (
    <View style={{ minHeight: '100vh', background: '#FFFFFF', padding: 24, display: 'flex', flexDirection: 'column' }}>
      <View style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', paddingTop: 60, paddingBottom: 40 }}>
        <Avatar name="数学" size={96} />
        <Spacer size={16} />
        <Title size={28} weight={800}>数学探险</Title>
        <Spacer size={8} />
        <Subtitle size={16}>让学习像游戏一样有趣</Subtitle>
      </View>

      <Card>
        {step === 'phone' ? (
          <Col gap={16}>
            <Title size={18}>手机号登录</Title>
            <Subtitle>输入手机号，接收验证码</Subtitle>
            <Spacer size={8} />
            <Input
              value={phone}
              type="phone"
              placeholder="请输入 11 位手机号"
              onChange={setPhone}
              maxLength={11}
            />
            <Spacer size={8} />
            <Button block size="lg" onClick={requestCode} disabled={loading}>
              获取验证码
            </Button>
          </Col>
        ) : (
          <Col gap={16}>
            <Row>
              <Button variant="ghost" size="sm" onClick={() => setStep('phone')}>
                ← 修改
              </Button>
            </Row>
            <Title size={18}>输入验证码</Title>
            <Subtitle>已发送到 {phone.slice(0, 3)}****{phone.slice(7)}</Subtitle>
            <Spacer size={8} />
            <Input
              value={code}
              type="number"
              placeholder="请输入 4 位验证码"
              onChange={setCode}
              maxLength={4}
            />
            <Spacer size={8} />
            <Button block size="lg" onClick={verify} disabled={loading}>
              登录
            </Button>
          </Col>
        )}
      </Card>

      <Spacer size={24} />

      <View style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
          登录即表示同意用户协议和隐私政策
        </Text>
      </View>
    </View>
  )
}
