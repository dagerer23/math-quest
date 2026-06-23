import { View, Text } from '@tarojs/components'
import { Icon } from '@/components/Icon'
import { C, TOKEN } from '@/styles/theme'

interface QuestionCardProps {
  prompt: string
  illustration?: string
  feedback: 'correct' | 'wrong' | null
  themeAccentSoft: string
  illustrationSize?: number
  className?: string
  children?: React.ReactNode
  /** 紧凑模式：键盘弹出时降低卡片高度 */
  compact?: boolean
}

export function QuestionCard({
  prompt,
  illustration,
  feedback,
  themeAccentSoft,
  illustrationSize = 48,
  className = '',
  children,
  compact = false,
}: QuestionCardProps) {
  const borderColor =
    feedback === 'correct'
      ? C.semantic.primary
      : feedback === 'wrong'
        ? C.semantic.destructive
        : themeAccentSoft

  const boxShadow =
    feedback === 'correct'
      ? '0 8px 32px rgba(88,204,2,0.2)'
      : feedback === 'wrong'
        ? '0 8px 32px rgba(255,75,75,0.2)'
        : '0 4px 20px rgba(0,0,0,0.08)'

  return (
    <View
      className={className}
      style={{
        position: 'relative',
        borderRadius: TOKEN.radius.lg,
        paddingTop: compact ? 12 : 16,
        paddingBottom: compact ? 12 : 16,
        paddingLeft: 20,
        paddingRight: 20,
        minHeight: compact ? 80 : 110,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor,
        boxShadow,
        overflow: 'hidden',
      }}
    >
      {illustration && (
        <Icon
          name={illustration}
          size={illustrationSize}
          style={{ marginBottom: 10 }}
        />
      )}
      <Text
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: '#1d1d1f',
          textAlign: 'center',
          lineHeight: 1.4,
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          maxWidth: '100%',
        }}
      >
        {prompt}
      </Text>
      {children}
    </View>
  )
}
