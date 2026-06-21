// 关卡连接线（从 web 端移植）
// 小程序不支持 SVG，用绝对定位 + 旋转的细 View 模拟直线连接
import { View } from '@tarojs/components'
import type { NodePos } from './helpers'

interface PathConnectorProps {
  from: NodePos
  to: NodePos
  isCompleted: boolean
  pathColor: string
  pathActive: string
}

// 节点圆半径（含边框余量），用于让线段从圆环边缘起止，不穿过节点中心
const NODE_RADIUS = 30

export function PathConnector({ from, to, isCompleted, pathColor, pathActive }: PathConnectorProps) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length <= NODE_RADIUS * 2) return null

  const ux = dx / length
  const uy = dy / length
  const startX = from.x + ux * NODE_RADIUS
  const startY = from.y + uy * NODE_RADIUS
  const drawLength = length - NODE_RADIUS * 2
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  const color = isCompleted ? pathActive : pathColor

  return (
    <View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: drawLength,
        height: 0,
        // 已通关画实线，未通关画虚线
        borderTop: `2px ${isCompleted ? 'solid' : 'dashed'} ${color}`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0',
        opacity: isCompleted ? 1 : 0.7,
        zIndex: 1,
      }}
    />
  )
}
