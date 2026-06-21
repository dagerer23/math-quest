import { useMemo, useRef, useEffect } from 'react'
import { MAP, COLORS } from './constants'
import type { LevelStatus, MockLevel } from './constants'
import { getWindingPositions } from './layout'
import { WindingPath } from './WindingPath'
import { MapLevelNode } from './MapLevelNode'
import { MapStarRow } from './MapStarRow'
import { KnowledgeLabel } from './KnowledgeLabel'
import type { Level } from '@/types/models'

interface GameMapProps {
  levels: Level[]
  /** key: levelId, value: 已得星数 0-3 */
  starsByLevelId: Record<string, number>
  /** key: levelId, value: 是否解锁 */
  unlockedSet: Set<string>
  /** key: levelId, value: 是否已通关 */
  completedSet: Set<string>
  /** 当前关在 levels 中的 index，-1 表示无 */
  currentLevelIndex: number
  /** 正在加载进入的关卡 id（用于禁用点击/视觉提示，可选） */
  navigatingLevelId?: string | null
  onLevelClick: (level: Level) => void
}

/**
 * 多邻国式蜿蜒地图组件:
 * - 关卡列表渲染为蜿蜒贝塞尔土路 + 圆形按钮节点
 * - 每关挂左右交替的知识点 pill 标签 + 三星行
 * - 当前关自动滚动到视野
 */
export function GameMap({
  levels,
  starsByLevelId,
  unlockedSet,
  completedSet,
  currentLevelIndex,
  navigatingLevelId,
  onLevelClick,
}: GameMapProps) {
  const count = levels.length
  // 完成区间右端:最大的连续已完成 index(无则 -1),用于路径段着色
  const completedUpTo = useMemo(() => {
    let last = -1
    for (let i = 0; i < count; i++) {
      if (completedSet.has(levels[i].id)) last = i
      else break
    }
    return last
  }, [levels, completedSet, count])

  const { nodes, segments } = useMemo(
    () => getWindingPositions(count, completedUpTo),
    [count, completedUpTo],
  )

  // 计算 SVG 高度(按 step 累加+底部 padding,保证最后一关有显示空间)
  const svgH = useMemo(() => {
    if (count === 0) return MAP.H
    const last = MAP.startY + MAP.step * (count - 1)
    return last + 70  // 底部 70 留白
  }, [count])

  const containerRef = useRef<HTMLDivElement>(null)
  const currentAnchorRef = useRef<HTMLDivElement>(null)

  // 当前关自动滚动到视野中
  useEffect(() => {
    if (currentLevelIndex < 0) return
    const t = setTimeout(() => {
      currentAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
    return () => clearTimeout(t)
  }, [currentLevelIndex])

  // 把 svg 坐标 y 换算到容器内 px(svg 宽 100% 等比缩放,所以 px y = svg y * containerW / MAP.W)
  const currentAnchorTopPct = currentLevelIndex >= 0
    ? `${(nodes[currentLevelIndex].y / svgH) * 100}%`
    : '0%'

  return (
    <div
      ref={containerRef}
      style={{
        background: COLORS.bgBot,
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* current 关 scroll 锚点(不可见,跟随 svg 比例定位) */}
      {currentLevelIndex >= 0 && (
        <div
          ref={currentAnchorRef}
          aria-hidden
          style={{
            position: 'absolute',
            top: currentAnchorTopPct,
            left: 0,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      <svg
        viewBox={`0 0 ${MAP.W} ${svgH}`}
        style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block' }}
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <radialGradient id="gameMapBg" cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor={COLORS.bgTop} />
            <stop offset="60%" stopColor={COLORS.bgMid} />
            <stop offset="100%" stopColor={COLORS.bgBot} />
          </radialGradient>
        </defs>
        <rect width={MAP.W} height={svgH} fill="url(#gameMapBg)" />
        {/* 顶部柔光 */}
        <ellipse cx={MAP.cx} cy={0} rx={130} ry={80} fill={COLORS.pathDone} opacity={0.06} />

        {/* 路径 */}
        <WindingPath segments={segments} />

        {/* 每关:标签 + 星行 + 节点 */}
        {nodes.map((node, i) => {
          const level = levels[i]
          const status = resolveStatus(level.id, i, currentLevelIndex, unlockedSet, completedSet)
          const r = level.isBoss ? MAP.bossR : MAP.r
          const stars = starsByLevelId[level.id] || 0
          const clickable = status !== 'locked'
          const busy = navigatingLevelId === level.id

          return (
            <g key={level.id}>
              <KnowledgeLabel
                text={level.chapter}
                status={status}
                side={node.side}
                centerY={node.y}
              />
              <MapStarRow
                stars={stars}
                visible={status !== 'locked'}
                x={node.side === 'right' ? MAP.canvasRight - 32 : MAP.canvasLeft + 2}
                y={node.y - r - 14}
              />
              <g
                style={{
                  cursor: clickable && !busy ? 'pointer' : 'not-allowed',
                  opacity: busy ? 0.6 : 1,
                }}
                onClick={() => {
                  if (clickable && !busy) onLevelClick(level)
                }}
              >
                <MapLevelNode
                  node={node}
                  index={i}
                  status={status}
                  isBoss={!!level.isBoss}
                />
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function resolveStatus(
  id: string,
  index: number,
  currentIndex: number,
  unlocked: Set<string>,
  completed: Set<string>,
): LevelStatus {
  if (completed.has(id)) return 'completed'
  if (index === currentIndex) return 'current'
  if (unlocked.has(id)) return 'unlocked'
  return 'locked'
}

export type { MockLevel }
