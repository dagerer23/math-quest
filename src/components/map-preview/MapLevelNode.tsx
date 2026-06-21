import { MAP, COLORS } from './constants'
import type { LevelStatus } from './constants'
import type { NodePos } from './layout'

interface MapLevelNodeProps {
  node: NodePos
  index: number          // 关卡序号(显示编号)
  status: LevelStatus
  isBoss: boolean
}

// 纯 SVG 图标(避免 foreignObject 兼容问题)
// 皇冠
const CROWN_D = 'M-6,2 L-6,-3 L-3,0 L0,-5 L3,0 L6,-3 L6,2 Z'
// 锁(锁体)
const LOCK_BODY_D = 'M-3.5,-1 L3.5,-1 L3.5,5 L-3.5,5 Z'
// 锁(锁钩)
const LOCK_HOOK_D = 'M-2,-1 L-2,-3 A2,2 0 0 1 2,-3 L2,-1'
// 向上箭头
const ARROW_D = 'M0,-6 L-5,0 L-2,0 L-2,4 L2,4 L2,0 L5,0 Z'

/** 圆形按钮节点:白顶+彩描边+底部投影,按状态切换。Boss 更大+皇冠;锁定显示锁;当前关发光+脉冲+箭头 */
export function MapLevelNode({ node, index, status, isBoss }: MapLevelNodeProps) {
  const r = isBoss ? MAP.bossR : MAP.r
  const cx = node.x
  const cy = node.y

  // 描边色:Boss 优先紫,否则按状态
  const border = isBoss
    ? COLORS.nodeBossBorder
    : status === 'completed'
      ? COLORS.nodeDoneBorder
      : status === 'current'
        ? COLORS.nodeCurrentBorder
        : status === 'unlocked'
          ? COLORS.nodeUnlockBorder
          : COLORS.nodeLockBg
  const fill = status === 'locked' ? COLORS.nodeLockBg : COLORS.nodeWhite
  const isCurrent = status === 'current'
  const isLocked = status === 'locked'

  return (
    <g>
      {/* 当前关:光晕 + 脉冲圈 */}
      {isCurrent && (
        <>
          <circle cx={cx} cy={cy} r={MAP.currentR} fill={COLORS.nodeCurrentBorder} opacity={0.18} />
          <circle
            cx={cx}
            cy={cy}
            r={MAP.currentR - 4}
            fill="none"
            stroke={COLORS.nodeCurrentBorder}
            strokeWidth={1.5}
            strokeDasharray="2 3"
            opacity={0.7}
          />
        </>
      )}

      {/* 底部投影 */}
      <circle
        cx={cx}
        cy={cy + 4}
        r={r}
        fill={COLORS.bgBot}
        opacity={isLocked ? 0.4 : 0.5}
      />

      {/* 当前关:实色发光底 */}
      {isCurrent && (
        <circle cx={cx} cy={cy} r={r} fill={COLORS.nodeCurrentBorder} />
      )}

      {/* 按钮主体:彩描边 + 白顶(白顶略上移,多邻国双层感) */}
      <circle cx={cx} cy={cy} r={r} fill={border} />
      <circle cx={cx} cy={cy - 2} r={r - 2} fill={fill} />

      {/* 中心内容:Boss 皇冠 / 锁定锁 / 否则编号 */}
      {isBoss ? (
        <path
          d={CROWN_D}
          transform={`translate(${cx}, ${cy + 1}) scale(1.1)`}
          fill="#FFD700"
          stroke="#E6B800"
          strokeWidth={0.5}
        />
      ) : isLocked ? (
        <g transform={`translate(${cx}, ${cy})`}>
          <path d={LOCK_BODY_D} fill="#5A6678" />
          <path d={LOCK_HOOK_D} fill="none" stroke="#5A6678" strokeWidth={1.2} />
        </g>
      ) : (
        <text
          x={cx}
          y={cy + 5}
          fontSize={16}
          fontWeight={800}
          fill={border}
          textAnchor="middle"
        >
          {index + 1}
        </text>
      )}

      {/* 当前关:向上箭头 */}
      {isCurrent && (
        <path
          d={ARROW_D}
          transform={`translate(${cx}, ${cy - 32})`}
          fill={COLORS.nodeCurrentBorder}
        />
      )}
    </g>
  )
}
