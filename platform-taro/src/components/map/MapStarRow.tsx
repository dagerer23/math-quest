import { View } from '@tarojs/components'
import { MAP, COLORS } from './constants'

interface MapStarRowProps {
  stars: number // 已得星数 0-3
  visible: boolean
  side: 'left' | 'right' // 和文字同侧
  centerY: number // 和文字同Y轴对齐基准
  nodeRadius: number // 节点半径，用来计算偏移
}

/**
 * 三星显示组件（和文字在同一侧，显示在文字上方）
 */
export default function MapStarRow({ stars, visible, side, centerY, nodeRadius }: MapStarRowProps) {
  if (!visible) return null

  const starSize = 16
  const gap = 2
  const totalWidth = starSize * 3 + gap * 2

  // 位置计算
  const left = side === 'left' ? MAP.canvasLeft : undefined
  const right = side === 'right' ? MAP.W - MAP.canvasRight : undefined
  // 星星显示在节点上方，文字的上方
  const top = centerY - nodeRadius - 40

  return (
    <View
      style={{
        position: 'absolute',
        left,
        right,
        top,
        width: totalWidth,
        display: 'flex',
        flexDirection: 'row',
        gap,
      }}
    >
      {Array.from({ length: 3 }, (_, i) => {
        const lit = i < stars
        return (
          <View
            key={i}
            style={{
              width: starSize,
              height: starSize,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              backgroundColor: lit ? COLORS.starGold : 'transparent',
              borderWidth: 1.5,
              borderColor: lit ? COLORS.starGold : COLORS.starEmpty,
              borderStyle: 'solid',
            }}
          />
        )
      })}
    </View>
  )
}
