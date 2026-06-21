import { View } from '@tarojs/components'
import { PathSegment } from './layout'
import { MAP, COLORS } from './constants'

interface WindingPathProps {
  segments: PathSegment[]
}

/**
 * 蜿蜒土路路径（最细线条，流畅S型）
 */
export function WindingPath({ segments }: WindingPathProps) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, pointerEvents: 'none' }}>
      {segments.map((seg, i) => {
        const done = seg.isCompleted
        const color = done ? COLORS.pathDone : '#66788A'
        const fromY = seg.from.y
        const toY = seg.to.y
        const isBendRight = i % 2 !== 0 // 第一个弯向左，第二个向右，和demo一致
        const bendLength = 40
        const pathWidth = 10 // 调到最细
        const segmentHeight = toY - fromY
        const halfHeight = segmentHeight / 2
        const borderRadius = pathWidth / 2 // 圆角也对应缩小

        return (
          <View key={i} style={{ position: 'absolute', left: 0, right: 0 }}>
            {isBendRight ? (
              // 向右凸的C型弯
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: MAP.cx - pathWidth / 2,
                    top: fromY,
                    width: bendLength + pathWidth,
                    height: halfHeight,
                    backgroundColor: color,
                    borderBottomRightRadius: borderRadius,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: MAP.cx + bendLength - pathWidth / 2,
                    top: fromY + halfHeight,
                    width: bendLength + pathWidth,
                    height: halfHeight,
                    backgroundColor: color,
                    borderTopLeftRadius: borderRadius,
                  }}
                />
              </>
            ) : (
              // 向左凸的C型弯
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: MAP.cx - bendLength - pathWidth / 2,
                    top: fromY,
                    width: bendLength + pathWidth,
                    height: halfHeight,
                    backgroundColor: color,
                    borderBottomLeftRadius: borderRadius,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: MAP.cx - pathWidth / 2,
                    top: fromY + halfHeight,
                    width: bendLength + pathWidth,
                    height: halfHeight,
                    backgroundColor: color,
                    borderTopRightRadius: borderRadius,
                  }}
                />
              </>
            )}
          </View>
        )
      })}
    </View>
  )
}
