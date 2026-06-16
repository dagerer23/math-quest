import { View, Text } from '@tarojs/components'

interface CardProps {
  children?: React.ReactNode
  padding?: string | number
  style?: React.CSSProperties
  onClick?: () => void
}

export function Card({ children, padding = 24, style, onClick }: CardProps) {
  return (
    <View
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: padding,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #f0f0f0',
        ...style,
      }}
    >
      {children}
    </View>
  )
}

interface TitleProps {
  children?: React.ReactNode
  size?: number
  weight?: number | string
  color?: string
  style?: React.CSSProperties
}

export function Title({ children, size = 20, weight = 700, color = '#1a1a1a', style }: TitleProps) {
  return (
    <Text style={{ fontSize: size, fontWeight: weight as any, color, ...style }}>{children}</Text>
  )
}

interface SubtitleProps {
  children?: React.ReactNode
  size?: number
  color?: string
  style?: React.CSSProperties
}

export function Subtitle({ children, size = 14, color = '#6b7280', style }: SubtitleProps) {
  return (
    <Text style={{ fontSize: size, color, ...style }}>{children}</Text>
  )
}

interface DividerProps {
  style?: React.CSSProperties
}

export function Divider({ style }: DividerProps) {
  return <View style={{ height: 1, background: '#f0f0f0', margin: '12px 0', ...style }} />
}

interface RowProps {
  children?: React.ReactNode
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  align?: 'flex-start' | 'center' | 'flex-end'
  gap?: number
  style?: React.CSSProperties
  onClick?: () => void
}

export function Row({ children, justify = 'flex-start', align = 'center', gap = 12, style, onClick }: RowProps) {
  return (
    <View onClick={onClick} style={{ display: 'flex', flexDirection: 'row', justifyContent: justify, alignItems: align, gap, ...style }}>
      {children}
    </View>
  )
}

interface ColProps {
  children?: React.ReactNode
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  align?: 'flex-start' | 'center' | 'flex-end'
  gap?: number
  style?: React.CSSProperties
  flex?: number
}

export function Col({ children, justify = 'flex-start', align = 'flex-start', gap = 8, style, flex }: ColProps) {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', justifyContent: justify, alignItems: align, gap, flex, ...style }}>
      {children}
    </View>
  )
}

interface SpacerProps {
  size?: number
  horizontal?: boolean
}

export function Spacer({ size = 16, horizontal = false }: SpacerProps) {
  if (horizontal) return <View style={{ width: size }} />
  return <View style={{ height: size }} />
}
