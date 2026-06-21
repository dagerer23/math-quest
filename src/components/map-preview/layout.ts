import { MAP } from './constants'

export interface NodePos {
  x: number
  y: number
  index: number
  side: 'left' | 'right'  // 信息块所在侧(节点对面):右排节点→信息块在左
}

export interface PathSegment {
  from: NodePos
  to: NodePos
  isCompleted: boolean  // 该段路径是否已完成(亮绿)
}

export interface WindingLayout {
  nodes: NodePos[]
  segments: PathSegment[]
}

/**
 * 生成蜿蜒地图布局。所有节点居中(cx),路径在节点间用贝塞尔左右摆动;
 * 信息块左右交替放在节点对面外侧(side)。
 * @param count   关卡数
 * @param completedUpTo  最后一个已完成关的 index(-1 表示无完成);到该关为止的路径段亮绿
 */
export function getWindingPositions(
  count: number,
  completedUpTo: number = -1,
): WindingLayout {
  const nodes: NodePos[] = []
  for (let i = 0; i < count; i++) {
    const y = MAP.startY + MAP.step * i
    // 信息块左右交替:偶数关→信息块在右(side=right),奇数关→左
    // side 表示信息块所在侧,与节点摆动无关(节点都在中线)
    const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
    nodes.push({ x: MAP.cx, y, index: i, side })
  }

  const segments: PathSegment[] = []
  for (let i = 0; i < count - 1; i++) {
    segments.push({
      from: nodes[i],
      to: nodes[i + 1],
      isCompleted: i <= completedUpTo,  // 段 i 连接 node[i]→node[i+1],到已完成关为止都亮绿
    })
  }
  return { nodes, segments }
}

/**
 * 生成单段贝塞尔路径的 d 属性。
 * 节点都在 cx,控制点左右偏移 amp 产生 S 弯蜿蜒。
 * 偶数段 cp1 左 cp2 右,奇数段反向,避免单调。
 */
export function segmentPath(from: NodePos, to: NodePos): string {
  const midY = (from.y + to.y) / 2
  const flip = from.index % 2 === 0 ? 1 : -1
  const cp1x = MAP.cx - MAP.amp * flip
  const cp2x = MAP.cx + MAP.amp * flip
  return `M ${from.x} ${from.y} C ${cp1x} ${midY}, ${cp2x} ${midY}, ${to.x} ${to.y}`
}
