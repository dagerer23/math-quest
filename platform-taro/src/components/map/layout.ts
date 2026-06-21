import { MAP } from './constants'

export interface NodePos {
  x: number
  y: number
  index: number
  side: 'left' | 'right'  // 信息块所在侧(节点对面)：和web端逻辑完全一致
}

export interface PathSegment {
  from: NodePos
  to: NodePos
  isCompleted: boolean  // 该段路径是否已完成(亮绿色)：和web端逻辑完全一致
}

export interface WindingLayout {
  nodes: NodePos[]
  segments: PathSegment[]
}

/**
 * 生成蜿蜒地图布局，和web端demo逻辑完全一致
 * @param count 关卡总数
 * @param completedUpTo 最后一个已完成关卡的index，-1表示无
 */
export function getWindingPositions(
  count: number,
  completedUpTo: number = -1,
): WindingLayout {
  const nodes: NodePos[] = []
  for (let i = 0; i < count; i++) {
    const y = MAP.startY + MAP.step * i
    // 信息块左右交替：和web端逻辑完全一致，偶数关信息在右侧，奇数关在左侧
    const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
    nodes.push({ x: MAP.cx, y, index: i, side })
  }

  const segments: PathSegment[] = []
  for (let i = 0; i < count - 1; i++) {
    segments.push({
      from: nodes[i],
      to: nodes[i + 1],
      isCompleted: i <= completedUpTo, // 到已完成关为止的路径都亮绿，和web端逻辑完全一致
    })
  }

  return { nodes, segments }
}

/**
 * 生成单段贝塞尔曲线路径的d属性，和web端demo实现完全一致
 * 节点都在中线上，控制点左右偏移产生S型蜿蜒效果，和web端摆动方向完全一致
 */
export function segmentPath(from: NodePos, to: NodePos): string {
  const midY = (from.y + to.y) / 2
  const flip = from.index % 2 === 0 ? 1 : -1 // 摆动方向：和web端完全一致，偶数段左摆，奇数段右摆
  const cp1x = MAP.cx - MAP.amp * flip
  const cp2x = MAP.cx + MAP.amp * flip
  return `M ${from.x} ${from.y} C ${cp1x} ${midY}, ${cp2x} ${midY}, ${to.x} ${to.y}`
}
