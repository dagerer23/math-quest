import { View, Text } from '@tarojs/components'
import './index.css'

interface CardProps {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function Card({ children, className = '', style, onClick }: CardProps) {
  return (
    <View className={`card ${className}`} style={style} onClick={onClick}>
      {children}
    </View>
  )
}

export function CardHeader({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <View className={`card-header ${className}`}>{children}</View>
}

export function CardTitle({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <Text className={`card-title ${className}`}>{children}</Text>
}

export function CardContent({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <View className={`card-content ${className}`}>{children}</View>
}

export function CardFooter({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <View className={`card-footer ${className}`}>{children}</View>
}
