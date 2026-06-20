// 关卡地图辅助函数（从 web 端移植，坐标改为像素，便于连接线旋转计算）

/** 计算关卡知识点平均掌握度 */
export function getLevelMastery(knowledgePoints: string[], knowledgeProgress: Record<string, number>): number {
  if (!knowledgePoints || knowledgePoints.length === 0) return 0
  const total = knowledgePoints.reduce((sum, kp) => sum + (knowledgeProgress[kp] || 0), 0)
  return total / knowledgePoints.length
}

export interface NodePos {
  x: number
  y: number
  side: 'left' | 'right'
}

/**
 * 蛇形（之字形）布局：关卡节点左右交替排列
 * @param count 关卡数量
 * @param width  地图容器宽度（px）
 * @param height 地图容器高度（px）
 */
export function getZigzagPositions(count: number, width: number, height: number): NodePos[] {
  const positions: NodePos[] = []
  if (count <= 0) return positions
  // 对齐 Web 端百分比逻辑，转为像素
  const startY = height * 0.10
  const endYPct = Math.min(80, 88 - (count > 6 ? 0 : 5))
  const endY = height * (endYPct / 100)
  const step = count > 1 ? (endY - startY) / (count - 1) : 0

  for (let i = 0; i < count; i++) {
    // 偶数索引靠右，奇数索引靠左，与 web 端一致
    const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
    const x = side === 'right' ? width * 0.72 : width * 0.28
    positions.push({ x, y: startY + step * i, side })
  }
  return positions
}
