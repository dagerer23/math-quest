import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Avatar } from '@/components/ui/Controls'
import { Card, Title, Subtitle, Spacer, Row, Col } from '@/components/ui/Basic'
import { useUserStore } from '@/store/useUserStore'

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

  const requestCode = () => {
    if (phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('code')
      Taro.showToast({ title: '验证码已发送（测试：1234）', icon: 'none' })
    }, 500)
  }

  const verify = () => {
    if (code !== '1234') {
      Taro.showToast({ title: '验证码错误', icon: 'none' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      loginWithPhone(phone, `user-${phone.slice(-4)}`)
      setLoading(false)
      Taro.switchTab({ url: '/pages/home/index' })
    }, 500)
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
            <Input value={phone} type="phone" placeholder="请输入 11 位手机号" onChange={setPhone} maxLength={11} />
            <Spacer size={8} />
            <Button block size="lg" onClick={requestCode} disabled={loading}>获取验证码</Button>
          </Col>
        ) : (
          <Col gap={16}>
            <Row>
              <Button variant="ghost" size="sm" onClick={() => setStep('phone')}>← 修改</Button>
            </Row>
            <Title size={18}>输入验证码</Title>
            <Subtitle>已发送到 {phone.slice(0, 3)}****{phone.slice(7)}</Subtitle>
            <Spacer size={8} />
            <Input value={code} type="number" placeholder="请输入 4 位验证码" onChange={setCode} maxLength={4} />
            <Spacer size={8} />
            <Button block size="lg" onClick={verify} disabled={loading}>登录</Button>
          </Col>
        )}
      </Card>

      <Spacer size={24} />
      <View style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>登录即表示同意用户协议和隐私政策</Text>
      </View>
    </View>
  )
}
