import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Icon } from '@/components/Icon'
import { C, TOKEN } from '@/styles/theme'

interface Props {
  value: string
  onChange: (v: string) => void
  allowDecimal?: boolean
  allowSign?: boolean
  accentColor?: string
}

const NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

// 根据屏幕宽度决定按键高度，小屏更紧凑
function getKeyHeight(): number {
  try {
    const { screenWidth } = Taro.getSystemInfoSync()
    return screenWidth && screenWidth <= 375 ? 52 : 56
  } catch {
    return 56
  }
}

// 数字键盘组件（Taro 端）
export default function Keypad({ value, onChange, allowDecimal, allowSign, accentColor = C.semantic.destructive }: Props) {
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const keyHeight = getKeyHeight()

  const append = (k: string) => {
    if (k === '.' && value.includes('.')) return
    if (k === '-' && value.length > 0) return
    onChange(value + k)
  }
  const back = () => onChange(value.slice(0, -1))
  const clear = () => onChange('')

  const numStyle = (active: boolean): React.CSSProperties => ({
    height: keyHeight,
    borderRadius: TOKEN.radius.lg,
    background: active ? C.duolingo.grayLight : '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: active ? 'inset 0 2px 4px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'background 150ms ease, box-shadow 150ms ease',
  })
  const numTextStyle: React.CSSProperties = {
    color: C.duolingo.grayDark,
    fontSize: 24,
    fontWeight: 700,
  }
  const actionStyle: React.CSSProperties = {
    height: keyHeight,
    borderRadius: TOKEN.radius.lg,
    background: accentColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  }

  const renderNum = (k: string) => {
    const active = pressedKey === k
    return (
      <View key={k} style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }}>
        <View
          className="taro-btn-press"
          style={numStyle(active)}
          onClick={() => append(k)}
          onTouchStart={() => setPressedKey(k)}
          onTouchEnd={() => setPressedKey(null)}
        >
          <Text style={numTextStyle}>{k}</Text>
        </View>
      </View>
    )
  }

  return (
    <View
      style={{
        background: 'rgba(255,255,255,0.85)',
        borderRadius: `${TOKEN.radius['2xl']} ${TOKEN.radius['2xl']} 0 0`,
        padding: 12,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
      }}
    >
      <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        {NUMS.map((k) => renderNum(k))}

        {allowDecimal ? (
          <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0, opacity: value.includes('.') ? 0.4 : 1 }}>
            <View
              className="taro-btn-press"
              style={{
                ...numStyle(pressedKey === '.'),
                background: value.includes('.') ? C.duolingo.grayLight : pressedKey === '.' ? C.duolingo.grayLight : '#FFFFFF',
              }}
              onClick={() => append('.')}
              onTouchStart={() => setPressedKey('.')}
              onTouchEnd={() => setPressedKey(null)}
            >
              <Text style={{ ...numTextStyle, color: value.includes('.') ? '#CCCCCC' : C.duolingo.grayDark }}>.</Text>
            </View>
          </View>
        ) : (
          <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }}>
            <View className="taro-btn-press" style={actionStyle} onClick={clear}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>清空</Text>
            </View>
          </View>
        )}

        {renderNum('0')}

        <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }}>
          <View
            className="taro-btn-press"
            style={{ ...actionStyle, opacity: value.length === 0 ? 0.4 : 1 }}
            onClick={back}
            onLongPress={clear}
          >
            <Icon name="delete" size={22} color="#fff" />
          </View>
        </View>

        {allowSign && (
          <View style={{ flexBasis: '31%', flexGrow: 0, flexShrink: 0 }}>
            <View
              className="taro-btn-press"
              style={numStyle(pressedKey === '-')}
              onClick={() => append('-')}
              onTouchStart={() => setPressedKey('-')}
              onTouchEnd={() => setPressedKey(null)}
            >
              <Text style={numTextStyle}>-</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
