import { View, Text } from '@tarojs/components'
import { C } from '@/styles/theme'

interface Props {
  value: number
  show: boolean
}

// 连击数字组件（Taro 端，用 CSS 动画近似 framer-motion 的缩放弹出）
// 字号 / 颜色 / 缩放弹出动画对齐 Web 端 ComboNumber
export default function ComboNumber({ value, show }: Props) {
  if (!show || value <= 1) return null
  return (
    <View style={{
      position: 'absolute',
      top: -8,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 30,
    }}>
      <Text
        key={value}
        className="taro-combo-pop"
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: C.neon.yellow,
          textShadow: '0 0 18px rgba(255,210,63,0.65), 0 0 36px rgba(255,210,63,0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        COMBO ×{value}
      </Text>
    </View>
  )
}
