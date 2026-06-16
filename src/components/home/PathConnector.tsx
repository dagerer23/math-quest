import type { ThemeConfig } from './themes'

export function PathConnector({
  from,
  to,
  isCompleted,
  pathColor,
  pathActive,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  isCompleted: boolean
  pathColor: string
  pathActive: string
}) {
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const controlOffsetY = (to.y - from.y) * 0.15

  const cp1 = { x: from.x, y: midY - controlOffsetY }
  const cp2 = { x: to.x, y: midY + controlOffsetY }

  const pathD = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 2 }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={isCompleted ? pathActive : pathColor}
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeDasharray={isCompleted ? undefined : '1.5 3'}
        opacity={isCompleted ? 1 : 0.7}
      />
    </svg>
  )
}
