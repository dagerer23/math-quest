import { View, Text } from '@tarojs/components'
import { MAP, COLORS } from './constants'
import type { LevelStatus } from './constants'

interface KnowledgeLabelProps {
  text: string
  status: LevelStatus
  side: 'left' | 'right'
  centerY: number
}

/**
 * 知识点标签组件（纯View实现，与web端完全一致）
 */
export function KnowledgeLabel({ text, status, side, centerY }: KnowledgeLabelProps) {
  const bgColor = status === 'locked' ? COLORS.labelBgLock : COLORS.labelBgDone
  const textColor =
    status === 'locked'
      ? COLORS.labelTextLock
      : status === 'unlocked'
        ? COLORS.labelTextUnlock
        : COLORS.labelTextDone

  const left = side === 'left' ? MAP.canvasLeft : undefined
  const right = side === 'right' ? MAP.W - MAP.canvasRight : undefined
  const top = centerY - MAP.labelH / 2

  return (
    <View
      style={{
        position: 'absolute',
        left,
        right,
        top,
        width: MAP.labelW,
        height: MAP.labelH,
        borderRadius: MAP.labelH / 2,
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: textColor,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  )
}
