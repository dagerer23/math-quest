import { segmentPath } from './windingPath'
import type { PathSegment } from './windingPath'
import { COLORS } from './constants'

interface WindingPathProps {
  segments: PathSegment[]
}

/** 蜿蜒绿色土路:已完成段亮绿(带圆点高光),未完成段深灰(带圆点虚线) */
export function WindingPath({ segments }: WindingPathProps) {
  return (
    <g>
      {segments.map((seg, i) => {
        const d = segmentPath(seg.from, seg.to)
        const done = seg.isCompleted
        return (
          <g key={`seg-${i}`}>
            {/* 主路径:有宽度的圆角线 */}
            <path
              d={d}
              fill="none"
              stroke={done ? COLORS.pathDone : COLORS.pathTodo}
              strokeWidth={16}
              strokeLinecap="round"
            />
            {/* 高光虚线纹理(多邻国圆点感) */}
            <path
              d={d}
              fill="none"
              stroke={done ? COLORS.pathDoneHL : COLORS.pathTodoHL}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="0.5 10"
              opacity={done ? 0.5 : 0.4}
            />
          </g>
        )
      })}
    </g>
  )
}
