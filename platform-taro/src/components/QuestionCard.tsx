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
}

export function QuestionCard({
  prompt,
  illustration,
  feedback,
  themeAccentSoft,
  illustrationSize = 48,
  className = '',
  children,
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
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor,
        boxShadow,
      }}
    >
      {illustration && (
        <Icon
          name={illustration}
          size={illustrationSize}
          style={{ marginBottom: 16 }}
        />
      )}
      <Text
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#1d1d1f',
          textAlign: 'center',
          lineHeight: 1.6,
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          maxWidth: '100%',
        }}
      >
        {prompt}
      </Text>
      {children}
    </View>
  )
}
