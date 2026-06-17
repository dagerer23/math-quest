import { View, Text, Input as TaroInput, Image } from '@tarojs/components'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children?: React.ReactNode
  variant?: Variant
  size?: Size
  block?: boolean
  disabled?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

const sizeMap: Record<Size, { height: number; fontSize: number; padding: string }> = {
  sm: { height: 36, fontSize: 14, padding: '0 16px' },
  md: { height: 44, fontSize: 16, padding: '0 20px' },
  lg: { height: 52, fontSize: 18, padding: '0 24px' },
}

const variantMap: Record<Variant, { bg: string; color: string; border: string }> = {
  primary: { bg: '#58CC02', color: '#FFFFFF', border: 'none' },
  secondary: { bg: '#F3F4F6', color: '#1a1a1a', border: 'none' },
  outline: { bg: 'transparent', color: '#58CC02', border: '2px solid #58CC02' },
  ghost: { bg: 'transparent', color: '#1a1a1a', border: 'none' },
  danger: { bg: '#FF3B6B', color: '#FFFFFF', border: 'none' },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  style,
  onClick,
}: ButtonProps) {
  const s = sizeMap[size]
  const v = variantMap[variant]

  return (
    <View
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: s.height,
        padding: s.padding,
        borderRadius: 12,
        backgroundColor: disabled ? '#E5E7EB' : v.bg,
        border: v.border,
        width: block ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <Text style={{ color: disabled ? '#9CA3AF' : v.color, fontSize: s.fontSize, fontWeight: 600 }}>{children}</Text>
    </View>
  )
}

interface InputProps {
  value: string
  placeholder?: string
  onChange?: (v: string) => void
  type?: 'text' | 'number' | 'password' | 'phone'
  maxLength?: number
  style?: React.CSSProperties
  onFocus?: () => void
  onBlur?: () => void
}

export function Input({ value, placeholder, onChange, type = 'text', maxLength, style, onFocus, onBlur }: InputProps) {
  const taroType = type === 'number' || type === 'phone' ? 'number' : 'text'

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '12px 16px',
        border: '2px solid #E5E7EB',
        borderRadius: 12,
        background: '#FFFFFF',
        minHeight: 48,
        ...style,
      }}
    >
      <TaroInput
        type={taroType}
        password={type === 'password'}
        value={value}
        placeholder={placeholder}
        onInput={(e) => onChange && onChange(e.detail.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        maxlength={maxLength}
        style={{
          flex: 1,
          fontSize: 16,
          background: 'transparent',
          width: '100%',
          color: '#1a1a1a',
        }}
      />
    </View>
  )
}

interface BadgeProps {
  children?: React.ReactNode
  color?: string
  bg?: string
  style?: React.CSSProperties
}

export function Badge({ children, color = '#FFFFFF', bg = '#58CC02', style }: BadgeProps) {
  return (
    <View style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 999, background: bg, ...style }}>
      <Text style={{ color, fontSize: 12, fontWeight: 600 }}>{children}</Text>
    </View>
  )
}

interface AvatarProps {
  name?: string
  size?: number
  url?: string
  style?: React.CSSProperties
}

export function Avatar({ name = '', size = 48, url, style }: AvatarProps) {
  const colors = ['#58CC02', '#FFD23F', '#7B5BFF', '#00E5FF', '#FF3B6B', '#A87147']
  const idx = name.length > 0 ? (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length : 0
  const color = colors[idx]
  const displayName = name.length > 0 ? name[0] : '?'

  if (url) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', background: color, ...style }}>
        <Image src={url} mode="aspectFill" style={{ width: '100%', height: '100%' }} />
      </View>
    )
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        ...style,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.4, fontWeight: 700 }}>{displayName}</Text>
    </View>
  )
}

interface ProgressProps {
  value: number
  max?: number
  color?: string
  bg?: string
  height?: number
  style?: React.CSSProperties
}

export function Progress({ value, max = 100, color = '#58CC02', bg = '#E5E7EB', height = 8, style }: ProgressProps) {
  const pct = Math.max(0, Math.min(1, value / max))
  return (
    <View style={{ background: bg, borderRadius: 999, height, overflow: 'hidden', ...style }}>
      <View style={{ background: color, height: '100%', width: `${pct * 100}%`, borderRadius: 999 }} />
    </View>
  )
}

interface IconProps {
  size?: number
  color?: string
  style?: React.CSSProperties
}

const emojiMap = {
  star: '⭐',
  heart: '❤️',
  coin: '🪙',
  diamond: '💎',
  trophy: '🏆',
  user: '👤',
  book: '📖',
  home: '🏠',
  goal: '🎯',
  mistake: '❌',
  rank: '📊',
  fire: '🔥',
  check: '✅',
  arrow: '➡️',
  back: '⬅️',
  plus: '➕',
  minus: '➖',
  gift: '🎁',
  calendar: '📅',
  time: '⏱️',
  question: '❓',
}

export function EmojiIcon({ name, size = 24, style }: { name: keyof typeof emojiMap; size?: number; style?: React.CSSProperties }) {
  return <Text style={{ fontSize: size, lineHeight: size, ...style }}>{emojiMap[name]}</Text>
}
