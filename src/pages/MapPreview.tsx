import { useMemo } from 'react'
import { MAP, COLORS } from '@/components/map-preview/constants'
import { getWindingPositions } from '@/components/map-preview/layout'
import { WindingPath } from '@/components/map-preview/WindingPath'
import { MapLevelNode } from '@/components/map-preview/MapLevelNode'
import { MapStarRow } from '@/components/map-preview/MapStarRow'
import { KnowledgeLabel } from '@/components/map-preview/KnowledgeLabel'
import type { MockLevel } from '@/components/map-preview/constants'

// mock 8 关数据(chapter 取自真实 g1/g2 题库)
const MOCK_LEVELS: MockLevel[] = [
  { id: 'g1-L1', chapter: '5以内加减法', isBoss: false, status: 'completed', stars: 3 },
  { id: 'g1-L2', chapter: '10以内加减法', isBoss: false, status: 'completed', stars: 2 },
  { id: 'g1-L3', chapter: '20以内加减法', isBoss: false, status: 'completed', stars: 3 },
  { id: 'g1-L6', chapter: '一年级BOSS', isBoss: true, status: 'completed', stars: 3 },
  { id: 'g2-L1', chapter: '100以内加减法', isBoss: false, status: 'current', stars: 0 },
  { id: 'g2-L2', chapter: '乘法口诀', isBoss: false, status: 'unlocked', stars: 0 },
  { id: 'g2-L3', chapter: '混合运算', isBoss: false, status: 'locked', stars: 0 },
  { id: 'g2-L6', chapter: '综合应用', isBoss: false, status: 'locked', stars: 0 },
]

export default function MapPreview() {
  // 已完成到第 3 关(0-indexed:0,1,2,3 都完成,current 是 index 4)
  const { nodes, segments } = useMemo(
    () => getWindingPositions(MOCK_LEVELS.length, 3),
    [],
  )

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgBot, display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
      <svg
        viewBox={`0 0 ${MAP.W} ${MAP.H}`}
        style={{ width: '100%', maxWidth: 360, height: 'auto' }}
      >
        <defs>
          <radialGradient id="mapBg" cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor={COLORS.bgTop} />
            <stop offset="60%" stopColor={COLORS.bgMid} />
            <stop offset="100%" stopColor={COLORS.bgBot} />
          </radialGradient>
        </defs>
        <rect width={MAP.W} height={MAP.H} fill="url(#mapBg)" />
        {/* 顶部柔光 */}
        <ellipse cx={MAP.cx} cy={0} rx={130} ry={80} fill={COLORS.pathDone} opacity={0.06} />

        {/* 路径 */}
        <WindingPath segments={segments} />

        {/* 每关:标签 + 星行 + 节点 */}
        {nodes.map((node, i) => {
          const level = MOCK_LEVELS[i]
          const r = level.isBoss ? MAP.bossR : MAP.r
          return (
            <g key={level.id}>
              {/* 知识点标签(远端对齐,side 决定左右) */}
              <KnowledgeLabel
                text={level.chapter}
                status={level.status}
                side={node.side}
                centerY={node.y}
              />
              {/* 星行:在标签上方,贴画布外缘侧 */}
              <MapStarRow
                stars={level.stars}
                visible={level.status !== 'locked'}
                x={node.side === 'right' ? MAP.canvasRight - 32 : MAP.canvasLeft + 2}
                y={node.y - r - 14}
              />
              {/* 节点按钮 */}
              <MapLevelNode
                node={node}
                index={i}
                status={level.status}
                isBoss={level.isBoss}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
