import { MAP, COLORS } from './constants'
import type { LevelStatus } from './constants'

interface KnowledgeLabelProps {
  text: string         // 知识点文字(Level.chapter)
  status: LevelStatus
  side: 'left' | 'right'  // 远端对齐:left→左沿贴 canvasLeft;right→右沿贴 canvasRight
  centerY: number      // 标签竖直中心对齐按钮中线
}

/** 知识点标签:深底圆角 pill,固定宽,文字居中;远端对齐到画布外缘,向远离按钮方向生长 */
export function KnowledgeLabel({ text, status, side, centerY }: KnowledgeLabelProps) {
  const bg =
    status === 'locked' ? COLORS.labelBgLock : COLORS.labelBgDone
  const textColor =
    status === 'locked'
      ? COLORS.labelTextLock
      : status === 'unlocked'
        ? COLORS.labelTextUnlock
        : COLORS.labelTextDone

  const x =
    side === 'right'
      ? MAP.canvasRight - MAP.labelW  // 右标签右沿贴 196,向左生长
      : MAP.canvasLeft                // 左标签左沿贴 4,向右生长
  const y = centerY - MAP.labelH / 2

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={MAP.labelW}
        height={MAP.labelH}
        rx={MAP.labelH / 2}
        fill={bg}
      />
      <text
        x={x + MAP.labelW / 2}
        y={y + MAP.labelH / 2 + 3.5}
        fontSize={7}
        fontWeight={600}
        fill={textColor}
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  )
}
