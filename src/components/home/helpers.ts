/** 计算关卡知识点平均掌握度 */
export function getLevelMastery(knowledgePoints: string[], knowledgeProgress: Record<string, number>): number {
  if (knowledgePoints.length === 0) return 0
  const total = knowledgePoints.reduce((sum, kp) => sum + (knowledgeProgress[kp] || 0), 0)
  return total / knowledgePoints.length
}

export function getZigzagPositions(count: number): { x: number; y: number; side: 'left' | 'right' }[] {
  const positions: { x: number; y: number; side: 'left' | 'right' }[] = []
  const startY = 10
  const endY = Math.min(80, 88 - (count > 6 ? 0 : 5))
  const step = count > 1 ? (endY - startY) / (count - 1) : 0

  for (let i = 0; i < count; i++) {
    const x = i % 2 === 0 ? 72 : 28
    const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
    positions.push({ x, y: startY + step * i, side })
  }
  return positions
}
