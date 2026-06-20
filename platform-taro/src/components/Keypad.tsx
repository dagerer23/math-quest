import { View, Text } from '@tarojs/components'
import { Icon } from '@/components/Icon'
import { C, TOKEN, btnShadow } from '@/styles/theme'

interface Props {
  value: string
  onChange: (v: string) => void
  allowDecimal?: boolean
  allowSign?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

// 数字键盘组件（Taro 端，用 View+Text 替代 button，inline style）
export default function Keypad({ value, onChange, allowDecimal, allowSign }: Props) {
  const append = (k: string) => {
    if (k === '.' && value.includes('.')) return
    if (k === '-' && value.length > 0) return
    onChange(value + k)
  }
  const back = () => onChange(value.slice(0, -1))
  const clear = () => onChange('')

  // 数字键：space-700→space-800 渐变 + ink 文字（对齐 Web 端 Keypad 配色）
  const keyBg = `linear-gradient(to bottom, ${C.space[700]}, ${C.space[800]})`
  const keyStyle: React.CSSProperties = {
    height: 56,
    borderRadius: TOKEN.radius.md,
    background: keyBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: btnShadow(C.space[900]),
  }
  const keyTextStyle: React.CSSProperties = {
    color: C.ink,
    fontSize: 24,
    fontWeight: 700,
  }
  // 删除键：neon-pink→#CC2E54 渐变 + 白字（对齐 Web 端）
  const delStyle: React.CSSProperties = {
    height: 56,
    borderRadius: TOKEN.radius.md,
    background: `linear-gradient(to bottom, ${C.neon.pink}, #CC2E54)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: btnShadow('#CC2E54'),
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {KEYS.map((k) => (
        <View key={k} style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }} onClick={() => append(k)}>
          <View className="taro-btn-press" style={keyStyle}>
            <Text style={keyTextStyle}>{k}</Text>
          </View>
        </View>
      ))}

      {allowSign && (
        <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }} onClick={() => append('-')}>
          <View className="taro-btn-press" style={keyStyle}>
            <Text style={keyTextStyle}>-</Text>
          </View>
        </View>
      )}

      <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }} onClick={() => append('0')}>
        <View className="taro-btn-press" style={keyStyle}>
          <Text style={keyTextStyle}>0</Text>
        </View>
      </View>

      {allowDecimal ? (
        <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0, opacity: value.includes('.') ? 0.5 : 1 }} onClick={() => append('.')}>
          <View className="taro-btn-press" style={keyStyle}>
            <Text style={keyTextStyle}>.</Text>
          </View>
        </View>
      ) : null}

      <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }} onClick={back}>
        <View className="taro-btn-press" style={delStyle}>
          <Icon name="delete" size={22} color="#fff" />
        </View>
      </View>

      <View style={{ flexBasis: '100%', flexGrow: 0, flexShrink: 0 }} onClick={clear}>
        <View className="taro-btn-press" style={{ height: 40, borderRadius: TOKEN.radius.md, background: C.space[800], display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: btnShadow(C.space[900]) }}>
          <Text style={{ color: 'rgba(230,230,240,0.7)', fontSize: 14 }}>清空</Text>
        </View>
      </View>
    </View>
  )
}
