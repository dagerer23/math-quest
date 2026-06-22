// 关卡节点组件（从 web 端移植）
// 用 View + Text + Icon 替代 SVG 与 framer-motion 动画
import { View, Text } from '@tarojs/components'
import { Icon } from '@/components/Icon'
import { C } from '@/styles/theme'
import type { Level } from '@/types/models'
import type { NodePos } from './helpers'
import type { ThemeConfig } from './themes'

interface LevelNodeProps {
  index: number
  level: Level
  pos: NodePos
  isUnlocked: boolean
  isCompleted: boolean
  isCurrent: boolean
  stars: number
  mastery: number
  theme: ThemeConfig
  navigatingLevelId: string | null
  onClick: () => void
}

export function LevelNode({
  index,
  level,
  pos,
  isUnlocked,
  isCompleted,
  isCurrent,
  stars,
  mastery,
  theme,
  navigatingLevelId,
  onClick,
}: LevelNodeProps) {
  const nodeNum = String(index + 1).padStart(2, '0')
  // 优先用后端的 questionCount，否则计算 questions 长度
  const questionCount = level.questionCount ?? (level.questions?.length ?? 0)
  const isBoss = !!level.isBoss
  const isLoading = navigatingLevelId === level.id

  // 节点圆形样式（按状态区分）
  let nodeStyle: React.CSSProperties
  let numStyle: React.CSSProperties
  let nodeShadow = 'none'

  if (isCompleted) {
    nodeStyle = {
      backgroundColor: theme.nodeCompletedBg,
      border: `2px solid ${theme.nodeCompletedBorder}`,
    }
    numStyle = { color: theme.accent, fontWeight: 700 }
    nodeShadow = `0 2px 8px ${theme.accentSoft}`
  } else if (isCurrent) {
    nodeStyle = {
      backgroundColor: theme.nodeCurrentBg,
      border: `3px solid ${theme.nodeCurrentBorder}`,
    }
    numStyle = { color: theme.accent, fontWeight: 700 }
    nodeShadow = `0 4px 16px ${theme.accentSoft}`
  } else if (isUnlocked) {
    nodeStyle = {
      backgroundColor: theme.nodeBg,
      border: `1.5px solid ${theme.nodeBorder}`,
    }
    numStyle = { color: theme.textPrimary, fontWeight: 600 }
    nodeShadow = '0 2px 6px rgba(0,0,0,0.04)'
  } else {
    nodeStyle = {
      backgroundColor: theme.nodeDisabledBg,
      border: `1.5px solid ${theme.nodeDisabledBorder}`,
    }
    numStyle = { color: theme.textMuted, fontWeight: 500 }
  }

  // 标题/副标题颜色
  const titleColor = isCompleted
    ? theme.accent
    : isUnlocked
      ? theme.textPrimary
      : theme.textMuted
  const subtitleColor = isCompleted
    ? theme.textSecondary
    : isUnlocked
      ? theme.textSecondary
      : theme.textMuted

  // 题数文案：无题时显示“挑战”，避免“0题”
  const countLabel = questionCount > 0 ? `${questionCount}题` : '挑战'

  // 副标题文案：用题数/状态替代知识点掌握度，避免被误读为答题进度
  let subtitle: string
  if (isCompleted) {
    subtitle = stars > 0 ? `${stars} 通关` : '已完成'
  } else if (isCurrent) {
    subtitle = `进行中 · ${countLabel}`
  } else if (isUnlocked) {
    subtitle = countLabel
  } else {
    subtitle = countLabel
  }

  return (
    <View
      id={`ln-${index}`}
      onClick={isUnlocked ? onClick : undefined}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        marginLeft: -28,
        marginTop: -28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: isCurrent ? 30 : 10,
      }}
    >
     {/* 当前关卡：上方三角标记 */}
     {isCurrent && (
       <Icon name="chevronDown" size={14} color={theme.accent} style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)' }} />
     )}

      {/* 圆形节点 */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          position: 'relative',
          ...nodeStyle,
          boxShadow: nodeShadow,
          opacity: isUnlocked ? 1 : 0.85,
        }}
      >
        {/* 当前关卡脉动光环 */}
        {isCurrent && (
          <View className="taro-pulse" style={{
            position: 'absolute',
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: theme.accent,
            opacity: 0.3,
            zIndex: -1,
          }} />
        )}
        {/* 已通关掌握度进度环 */}
        {isCompleted && mastery > 0 && (
          <View style={{
            position: 'absolute',
            width: 64, height: 64, borderRadius: 32,
            top: -4, left: -4,
            background: `conic-gradient(${theme.accent} ${mastery * 360}deg, transparent ${mastery * 360}deg)`,
            zIndex: -1,
            opacity: 0.5,
          }} />
        )}
        {/* 中心内容：BOSS 显示 ghost 图标，否则显示关卡编号 */}
        {isBoss ? (
          <Icon name="ghost" size={26} color={numStyle.color as string} />
        ) : (
          <Text style={{ fontSize: 16, lineHeight: 20, ...numStyle }}>{nodeNum}</Text>
        )}

        {/* 锁定标记 */}
        {!isUnlocked && (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: C.semantic.card,
              border: `1.5px solid ${theme.nodeDisabledBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Icon name="lock" size={12} color={C.semantic.mutedForeground} />
          </View>
        )}

        {/* 加载中遮罩 */}
        {isLoading && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              borderRadius: 28,
              backgroundColor: 'rgba(255,255,255,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Icon name="hourglass" size={18} color={C.semantic.mutedForeground} />
          </View>
        )}
      </View>

     {/* 通关星徽章 */}
     {isCompleted && stars > 0 && (
       <View
         style={{
           position: 'absolute',
           top: 60,
           left: '50%',
           transform: 'translateX(-50%)',
           padding: '3px 7px',
            borderRadius: 10,
            backgroundColor: C.semantic.card,
            border: `1px solid ${theme.accentSoft}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <Icon
                key={i}
                name={i < stars ? 'star' : 'starOutline'}
                size={10}
                color={i < stars ? '#E5A13B' : '#D4D4D4'}
                fill={i < stars ? '#E5A13B' : 'none'}
              />
            ))}
          </View>
        </View>
      )}

     {/* 关卡标题信息：加背景遮罩避免与路径线重叠，并提升层级 */}
     <View
       style={{
         position: 'absolute',
         top: isCompleted && stars > 0 ? 82 : 60,
         left: '50%',
         transform: 'translateX(-50%)',
         width: 112,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 2,
          paddingBottom: 2,
          borderRadius: 8,
          backgroundColor: theme.bg,
          zIndex: 5,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: titleColor,
            lineHeight: 18,
            textAlign: 'center',
          }}
        >
          {level.chapter}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: subtitleColor,
            lineHeight: 16,
            marginTop: 1,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  )
}
