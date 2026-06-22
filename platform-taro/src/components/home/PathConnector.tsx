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
       top: startY - 1,
       width: drawLength,
       height: 2,
       ...(isCompleted
         ? { backgroundColor: color }
         : { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 10px)` }),
       transform: `rotate(${angle}deg)`,
       transformOrigin: '0 50%',
       opacity: isCompleted ? 1 : 0.7,
       zIndex: 1,
       borderRadius: 1,
     }}
   />
 )
}
