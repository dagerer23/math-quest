import { useMemo } from 'react'
import { View } from '@tarojs/components'
import { MAP, COLORS } from './constants'
import type { LevelStatus } from './constants'
import { getWindingPositions } from './layout'
import { WindingPath } from './WindingPath'
import { MapLevelNode } from './MapLevelNode'
import MapStarRow from './MapStarRow' // 改成default import
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
  /** 当前关在levels中的index，-1表示无 */
  currentLevelIndex: number
  /** 正在加载进入的关卡id（用于禁用点击/视觉提示，可选） */
  navigatingLevelId?: string | null
  onLevelClick: (level: Level) => void
  /** 用于ScrollView的scrollIntoView锚点id，外部根据currentLevelIndex生成 */
  scrollAnchorId: string
}

/**
 * 多邻国式蜿蜒地图组件
 */
export function GameMap({
  levels,
  starsByLevelId,
  unlockedSet,
  completedSet,
  currentLevelIndex,
  navigatingLevelId,
  onLevelClick,
  scrollAnchorId,
}: GameMapProps) {
  const count = levels.length
  // 完成区间右端:最大的连续已完成index(无则-1),用于路径段着色
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

  // 计算容器总高度
  const containerHeight = useMemo(() => {
    if (count === 0) return 640
    const last = MAP.startY + MAP.step * (count - 1)
    return last + 100 // 底部留白
  }, [count])

  // 当前关锚点位置
  const currentAnchorTop = currentLevelIndex >= 0
    ? (nodes[currentLevelIndex].y / containerHeight) * 100 + '%'
    : '0%'

  return (
    <View
      style={{
        position: 'relative',
        width: '100%',
        minHeight: containerHeight,
        background: `radial-gradient(ellipse at top center, ${COLORS.bgTop} 0%, ${COLORS.bgMid} 60%, ${COLORS.bgBot} 100%)`,
      }}
    >
      {/* 滚动锚点 */}
      {currentLevelIndex >= 0 && (
        <View
          id={scrollAnchorId}
          aria-hidden
          style={{
            position: 'absolute',
            top: currentAnchorTop,
            left: 0,
            width: 1,
            height: 1,
          }}
        />
      )}

      {/* 顶部柔光效果 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 150,
          backgroundColor: COLORS.pathDone,
          opacity: 0.06,
          borderBottomLeftRadius: '100%',
          borderBottomRightRadius: '100%',
          transform: [{ scaleX: 1.5 }],
        }}
      />

      {/* 蜿蜒路径 */}
      <WindingPath segments={segments} />

      {/* 所有关卡元素 */}
      {nodes.map((node, i) => {
        const level = levels[i]
        const status = resolveStatus(level.id, i, currentLevelIndex, unlockedSet, completedSet)
        const r = level.isBoss ? MAP.bossR : MAP.r
        const stars = starsByLevelId[level.id] || 0
        const busy = navigatingLevelId === level.id

        return (
          <View key={level.id}>
            {/* 知识点标签 */}
            <KnowledgeLabel
              text={level.chapter}
              status={status}
              side={node.side}
              centerY={node.y}
            />
            {/* 星星：和文字在同一侧，显示在文字上方 */}
            <MapStarRow
              stars={stars}
              visible={status !== 'locked'}
              side={node.side}
              centerY={node.y}
              nodeRadius={r}
            />
            {/* 关卡节点 */}
            <MapLevelNode
              node={node}
              index={i}
              status={status}
              isBoss={!!level.isBoss}
              busy={busy}
              onClick={() => onLevelClick(level)}
            />
          </View>
        )
      })}
    </View>
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

export type { LevelStatus }
