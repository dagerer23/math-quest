import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { Level } from '@/types/models'
import type { ThemeConfig } from './themes'

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
  onClick,
  forwardRef,
  navigatingLevelId,
}: {
  index: number
  level: Level
  pos: { x: number; y: number; side: 'left' | 'right' }
  isUnlocked: boolean
  isCompleted: boolean
  isCurrent: boolean
  stars: number
  mastery: number
  theme: ThemeConfig
  onClick: () => void
  forwardRef?: React.RefObject<HTMLDivElement>
  navigatingLevelId: string | null
}) {
  const nodeNum = String(index + 1).padStart(2, '0')
  // 优先使用后端返回的 questionCount，否则计算 questions.length
  const questionCount = level.questionCount ?? (level.questions?.length ?? 0)

  // 星级徽章颜色（温暖金色系）
  const starActiveColor = '#E5A13B'
  const starActiveColorSoft = '#F5D89A'
  const starInactiveColor = '#D4D4D4'
  const badgeBgColor = '#FFFFFF'
  const badgeBorderColor = theme.accentSoft

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

  const titleColor = isCompleted
    ? theme.accent
    : isCurrent
      ? theme.textPrimary
      : isUnlocked
        ? theme.textPrimary
        : theme.textMuted

  const subtitleColor = isCompleted
    ? theme.textSecondary
    : isCurrent
      ? theme.textSecondary
      : isUnlocked
        ? theme.textSecondary
        : theme.textMuted

  return (
    <motion.div
      ref={forwardRef}
      className="absolute"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: isCurrent ? 30 : 10 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
    >
      {/* 当前关卡：双层脉动光环（外圈） */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${theme.accent}`, margin: '-12px' }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* 当前关卡：双层脉动光环（内圈，更密） */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `1.5px solid ${theme.accent}`, margin: '-4px' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.15, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <button
        onClick={onClick}
        disabled={!isUnlocked}
        aria-label={`第${index + 1}关 ${level.chapter} ${isCompleted ? '已完成' : isCurrent ? '进行中' : isUnlocked ? '未完成' : '未解锁'}`}
        className={clsx('flex flex-col items-center', isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed')}
      >
        {/* 当前关卡：箭头图标标记 */}
        {isCurrent && (
          <motion.div
            className="mb-1"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M8 8L12 2H4L8 8Z" fill={theme.accent} />
            </svg>
          </motion.div>
        )}

        {/* 当前关卡的上下微浮动 */}
        <motion.div
          animate={isCurrent ? { y: [0, -3, 0] } : {}}
          transition={isCurrent ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
          <motion.div
            whileHover={isUnlocked ? { scale: 1.05 } : {}}
            whileTap={isUnlocked ? { scale: 0.95 } : {}}
            className="relative w-14 h-14 rounded-full grid place-items-center"
            style={{ ...nodeStyle, boxShadow: nodeShadow }}
          >
            {/* 掌握度进度环 - 仅对已解锁且未完成的关卡显示 */}
            {isUnlocked && !isCompleted && mastery > 0 && (
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 56 56"
                style={{ zIndex: 1 }}
              >
                <circle
                  cx="28" cy="28" r="24"
                  fill="none"
                  stroke={theme.accentSoft}
                  strokeWidth="4"
                  opacity="0.5"
                />
                <circle
                  cx="28" cy="28" r="24"
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${mastery * 150.80} 150.80`}
                  opacity="0.85"
                />
              </svg>
            )}
            <span className="text-base leading-none relative" style={{ ...numStyle, zIndex: 2 }}>
              {nodeNum}
            </span>
            {navigatingLevelId === level.id && (
              <div className="absolute inset-0 rounded-full bg-white/60 grid place-items-center z-10">
                <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* 通关星徽章 */}
        {isCompleted && stars > 0 && (
          <motion.div
            className="mt-1 flex items-center justify-center gap-0.5"
            style={{
              padding: '3px 7px',
              borderRadius: '10px',
              backgroundColor: badgeBgColor,
              border: `1px solid ${badgeBorderColor}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
            initial={{ y: 4, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.03, duration: 0.35, ease: 'easeOut' }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <svg
                key={i}
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill={i < stars ? starActiveColor : 'none'}
                stroke={i < stars ? starActiveColor : starInactiveColor}
                strokeWidth="2"
                strokeLinejoin="round"
                opacity={i < stars ? 1 : 0.7}
                style={i < stars ? { filter: `drop-shadow(0 1px 2px ${starActiveColorSoft})` } : {}}
              >
                <path d="M12 2.5l2.9 6 6.6 0.9-4.8 4.7 1.2 6.5L12 17.3 6.1 20.6l1.2-6.5L2.5 9.4l6.6-0.9L12 2.5z" />
              </svg>
            ))}
          </motion.div>
        )}
      </button>

      {/* 关卡标题信息 - 放在圆形节点下方居中 */}
      <div className="mt-2 text-center">
        <div className="text-[11px] font-semibold leading-tight" style={{ color: titleColor }}>
          {level.chapter}
        </div>
        <div className="text-[10px] font-medium leading-tight mt-0.5" style={{ color: subtitleColor }}>
          {isCompleted
            ? stars > 0
              ? `${stars} ★ 通关`
              : '已完成'
            : isCurrent
              ? mastery > 0
                ? `进行中 · ${Math.round(mastery * 100)}%`
                : `进行中 · ${questionCount}题`
              : isUnlocked
                ? mastery > 0
                  ? `${Math.round(mastery * 100)}%`
                  : `${questionCount}题`
                : `${questionCount}题`}
        </div>
      </div>
    </motion.div>
  )
}
