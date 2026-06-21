import { View, Text } from '@tarojs/components'
import { MAP, COLORS } from './constants'
import type { LevelStatus } from './constants'
import type { NodePos } from './layout'

interface MapLevelNodeProps {
  node: NodePos
  index: number
  status: LevelStatus
  isBoss: boolean
  onClick?: () => void
  busy?: boolean
}

/**
 * 圆形关卡节点（纯View实现，无SVG，与web端完全一致）
 */
export function MapLevelNode({ node, index, status, isBoss, onClick, busy }: MapLevelNodeProps) {
  const r = isBoss ? MAP.bossR : MAP.r
  const cx = node.x - r
  const cy = node.y - r

  // 描边色，与web端逻辑完全一致
  const borderColor = isBoss
    ? COLORS.nodeBossBorder
    : status === 'completed'
      ? COLORS.nodeDoneBorder
      : status === 'current'
        ? COLORS.nodeCurrentBorder
        : status === 'unlocked'
          ? COLORS.nodeUnlockBorder
          : COLORS.nodeLockBg
  const fillColor = status === 'locked' ? COLORS.nodeLockBg : COLORS.nodeWhite
  const isCurrent = status === 'current'
  const isLocked = status === 'locked'
  const clickable = !isLocked && !busy

  return (
    <View
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        width: r * 2,
        height: r * 2,
        cursor: clickable ? 'pointer' : 'not-allowed',
        opacity: busy ? 0.6 : 1,
      }}
      onClick={clickable ? onClick : undefined}
    >
      {/* 当前关光晕效果 */}
      {isCurrent && (
        <>
          <View
            style={{
              position: 'absolute',
              left: -(MAP.currentR - r),
              top: -(MAP.currentR - r),
              width: MAP.currentR * 2,
              height: MAP.currentR * 2,
              borderRadius: MAP.currentR,
              backgroundColor: COLORS.nodeCurrentBorder,
              opacity: 0.18,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: -(MAP.currentR - r - 6),
              top: -(MAP.currentR - r - 6),
              width: (MAP.currentR - 6) * 2,
              height: (MAP.currentR - 6) * 2,
              borderRadius: MAP.currentR - 6,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: COLORS.nodeCurrentBorder,
              opacity: 0.7,
            }}
          />
        </>
      )}

      {/* 底部投影 */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 4,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          backgroundColor: COLORS.bgBot,
          opacity: isLocked ? 0.4 : 0.5,
        }}
      />

      {/* 当前关发光底 */}
      {isCurrent && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            backgroundColor: COLORS.nodeCurrentBorder,
          }}
        />
      )}

      {/* 节点主体：外层边框 */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          backgroundColor: borderColor,
        }}
      />

      {/* 节点主体：内层白色背景 */}
      <View
        style={{
          position: 'absolute',
          left: 3,
          top: 0,
          width: (r - 3) * 2,
          height: (r - 3) * 2,
          borderRadius: r - 3,
          backgroundColor: fillColor,
        }}
      />

      {/* 中心内容 */}
      {isBoss ? (
        // 皇冠（纯CSS实现）
        <View
          style={{
            position: 'absolute',
            left: r - 12,
            top: r - 10,
            width: 24,
            height: 16,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: 7, height: 10, backgroundColor: '#FFD700', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          <View style={{ width: 7, height: 14, backgroundColor: '#FFD700', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          <View style={{ width: 7, height: 10, backgroundColor: '#FFD700', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 24,
              height: 6,
              backgroundColor: '#E6B800',
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
            }}
          />
        </View>
      ) : isLocked ? (
        // 锁（纯CSS实现）
        <View style={{ position: 'absolute', left: r - 8, top: r - 10, width: 16, height: 20 }}>
          {/* 锁身 */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 16,
              height: 12,
              backgroundColor: '#5A6678',
              borderRadius: 3,
            }}
          />
          {/* 锁钩 */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 3,
              width: 10,
              height: 8,
              borderWidth: 2.5,
              borderColor: '#5A6678',
              borderBottomWidth: 0,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
            }}
          />
        </View>
      ) : (
        <Text
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            textAlign: 'center',
            lineHeight: `${r * 2 - 4}px`,
            fontSize: 26,
            fontWeight: '800',
            color: borderColor,
          }}
        >
          {index + 1}
        </Text>
      )}

      {/* 当前关向上箭头（纯CSS实现） */}
      {isCurrent && (
        <View
          style={{
            position: 'absolute',
            top: -38,
            left: r - 8,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: `14px solid ${COLORS.nodeCurrentBorder}`,
          }}
        />
      )}
    </View>
  )
}
