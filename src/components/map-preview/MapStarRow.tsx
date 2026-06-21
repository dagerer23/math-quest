import { COLORS } from './constants'

interface MapStarRowProps {
  stars: number       // 已得星数 0-3
  visible: boolean    // 是否显示星行(锁定关不显示)
  x: number           // 星行左上角 x(SVG 坐标)
  y: number           // 星行左上角 y
}

// 纯 SVG 星形(避免 foreignObject/lucide 在 SVG 内嵌的兼容问题)
const STAR_D = 'M5 0 L6.2 3.4 L10 3.4 L7 5.6 L8.1 9 L5 7 L1.9 9 L3 5.6 L0 3.4 L3.8 3.4 Z'

/** 三星行:已得点亮(金),未得空心(灰) */
export function MapStarRow({ stars, visible, x, y }: MapStarRowProps) {
  if (!visible) return null
  const size = 10, gap = 1
  return (
    <g>
      {Array.from({ length: 3 }, (_, i) => {
        const lit = i < stars
        return (
          <path
            key={i}
            d={STAR_D}
            transform={`translate(${x + i * (size + gap)}, ${y}) scale(${size / 10})`}
            fill={lit ? COLORS.starGold : 'none'}
            stroke={lit ? COLORS.starGold : COLORS.starEmpty}
            strokeWidth={1.2}
          />
        )
      })}
    </g>
  )
}
