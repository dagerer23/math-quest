import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import type { Level } from '@/types/models'
import { getLevelsByGrade, getLevelDetail, generateQuestions } from '@/services/content'
import { useSessionStore } from '@/store/useSessionStore'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibrate'


// ═══════════════════════════════════════════════════════════════════
// Z字形路径生成
// ═══════════════════════════════════════════════════════════════════

/** 计算关卡知识点平均掌握度 */
function getLevelMastery(knowledgePoints: string[], knowledgeProgress: Record<string, number>): number {
  if (knowledgePoints.length === 0) return 0
  const total = knowledgePoints.reduce((sum, kp) => sum + (knowledgeProgress[kp] || 0), 0)
  return total / knowledgePoints.length
}

function getZigzagPositions(count: number): { x: number; y: number; side: 'left' | 'right' }[] {
  const positions: { x: number; y: number; side: 'left' | 'right' }[] = []
  const startY = 10
  const endY = Math.min(80, 88 - (count > 6 ? 0 : 5))
  const step = count > 1 ? (endY - startY) / (count - 1) : 0

  for (let i = 0; i < count; i++) {
    const x = i % 2 === 0 ? 72 : 28
    const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
    positions.push({ x, y: startY + step * i, side })
  }
  return positions
}

// ═══════════════════════════════════════════════════════════════════
// 主题配色
// ═══════════════════════════════════════════════════════════════════
interface ThemeConfig {
  bg: string
  accent: string
  accentSoft: string
  label: string
  nodeBg: string
  nodeCompletedBg: string
  nodeCurrentBg: string
  nodeBorder: string
  nodeCompletedBorder: string
  nodeCurrentBorder: string
  nodeDisabledBg: string
  nodeDisabledBorder: string
  pathColor: string
  pathActive: string
  textPrimary: string
  textSecondary: string
  textMuted: string
}

const THEMES: Record<number, ThemeConfig> = {
  1: {
    // 🌊 一年级：清新薄荷蓝 + 温暖金色
    bg: '#F0F7F5',
    accent: '#4A9E8A',
    accentSoft: '#D8ECE5',
    label: '基础数学',
    nodeBg: '#FFFFFF',
    nodeCompletedBg: '#E7F3EE',
    nodeCurrentBg: '#FFFFFF',
    nodeBorder: '#E5E8E6',
    nodeCompletedBorder: '#4A9E8A',
    nodeCurrentBorder: '#4A9E8A',
    nodeDisabledBg: '#F3F4F3',
    nodeDisabledBorder: '#E0E3E1',
    pathColor: '#D5DEDA',
    pathActive: '#4A9E8A',
    textPrimary: '#2B3A36',
    textSecondary: '#7A8782',
    textMuted: '#AAB2AF',
  },
  2: {
    // 🌸 二年级：柔和桃粉 + 暖棕色
    bg: '#FBF4F0',
    accent: '#E0896E',
    accentSoft: '#F8E2D9',
    label: '进阶数学',
    nodeBg: '#FFFFFF',
    nodeCompletedBg: '#FBE8DD',
    nodeCurrentBg: '#FFFFFF',
    nodeBorder: '#EEE3DC',
    nodeCompletedBorder: '#E0896E',
    nodeCurrentBorder: '#E0896E',
    nodeDisabledBg: '#F5EFEB',
    nodeDisabledBorder: '#E8DDD6',
    pathColor: '#DCD0C8',
    pathActive: '#E0896E',
    textPrimary: '#4A3A33',
    textSecondary: '#8F7E75',
    textMuted: '#BFB0A8',
  },
  3: {
    // 💜 三年级：薰衣草紫 + 深紫点缀
    bg: '#F3F0F7',
    accent: '#8B7AB8',
    accentSoft: '#E3DDEF',
    label: '高级数学',
    nodeBg: '#FFFFFF',
    nodeCompletedBg: '#ECE5F5',
    nodeCurrentBg: '#FFFFFF',
    nodeBorder: '#E5E1EC',
    nodeCompletedBorder: '#8B7AB8',
    nodeCurrentBorder: '#8B7AB8',
    nodeDisabledBg: '#F1EEEF',
    nodeDisabledBorder: '#DFDADE',
    pathColor: '#D6D1DE',
    pathActive: '#8B7AB8',
    textPrimary: '#3C3452',
    textSecondary: '#7E768C',
    textMuted: '#ABA5B3',
  },
}

// ═══════════════════════════════════════════════════════════════════
// 路径连接组件
// ═══════════════════════════════════════════════════════════════════
function PathConnector({
  from,
  to,
  isCompleted,
  pathColor,
  pathActive,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  isCompleted: boolean
  pathColor: string
  pathActive: string
}) {
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const controlOffsetY = (to.y - from.y) * 0.15

  const cp1 = { x: from.x, y: midY - controlOffsetY }
  const cp2 = { x: to.x, y: midY + controlOffsetY }

  const pathD = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 2 }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={isCompleted ? pathActive : pathColor}
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeDasharray={isCompleted ? undefined : '1.5 3'}
        opacity={isCompleted ? 1 : 0.7}
      />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 关卡节点组件
// ═══════════════════════════════════════════════════════════════════
function LevelNode({
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
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
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

// ═══════════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  const navigate = useNavigate()
  const user = useUserStore()
  const startSession = useSessionStore((s) => s.start)
  const selectedGrade = Math.max(1, Math.min(3, user.profile.targetGrade || 2)) as 1 | 2 | 3
  const [navigating, setNavigating] = useState(false)
  const [navigatingLevelId, setNavigatingLevelId] = useState<string | null>(null)
  const [showNoHearts, setShowNoHearts] = useState(false)
  const [levelError, setLevelError] = useState('')
  const [visibleLevels, setVisibleLevels] = useState<any[]>([])
  const [loadingLevels, setLoadingLevels] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)
  const currentLevelRef = useRef<HTMLDivElement>(null)

  // 从配置读取心形恢复时间
  const heartRecoverMinutes = Number(user.systemConfigs?.['heart.recover_minutes']) || 30

  // 异步从后端（或降级到本地）拉取关卡
  useEffect(() => {
    let cancelled = false
    setLoadingLevels(true)
    getLevelsByGrade(selectedGrade).then(levels => {
      if (cancelled) return
      setVisibleLevels(levels)
      setLoadingLevels(false)
    })
    return () => { cancelled = true }
  }, [selectedGrade])

  const NODE_POSITIONS = useMemo(
    () => getZigzagPositions(visibleLevels.length),
    [visibleLevels.length],
  )

  const enterLevel = useCallback(async (levelId: string) => {
    if (navigating) return
    setLevelError('')
    // 心数检查：没有心数时弹窗提示
    if (user.hearts <= 0) {
      setShowNoHearts(true)
      playSound('wrong', user.settings.sound)
      vibrate(30, user.settings.vibration)
      return
    }
    setNavigating(true)
    setNavigatingLevelId(levelId)
    try {
      // 拉取关卡详情
      const level = await getLevelDetail(levelId)
      if (!level) {
        setNavigating(false)
        setNavigatingLevelId(null)
        setLevelError('关卡加载失败，请稍后重试')
        playSound('wrong', user.settings.sound)
        return
      }
      // 基于掌握度动态生成题目
      const userMastery = user.learningStats.knowledgeProgress || {}
      const recentIds = user.mistakeIds
      const questions = await generateQuestions(levelId, userMastery, recentIds)
      if (!questions || questions.length === 0) {
        setNavigating(false)
        setNavigatingLevelId(null)
        setLevelError('题目生成失败，请稍后重试')
        playSound('wrong', user.settings.sound)
        return
      }
      startSession(level, questions)
      playSound('combo', user.settings.sound)
      vibrate(30, user.settings.vibration)
      setTimeout(() => navigate(`/battle/${levelId}`), 180)
    } catch {
      setNavigating(false)
      setNavigatingLevelId(null)
      setLevelError('网络异常，请稍后重试')
      playSound('wrong', user.settings.sound)
    }
  }, [navigating, navigate, startSession, user.hearts, user.settings.sound, user.settings.vibration, user.learningStats.knowledgeProgress, user.mistakeIds])

  const getLevelStatus = useCallback((levelId: string) => {
    const isUnlocked = user.unlockedLevels.includes(levelId)
    const isCompleted = !!user.completedLevels[levelId]
    return { isUnlocked, isCompleted }
  }, [user.unlockedLevels, user.completedLevels])

  const currentLevelIndex = useMemo(() => {
    return visibleLevels.findIndex(l => {
      const { isUnlocked, isCompleted } = getLevelStatus(l.id)
      return isUnlocked && !isCompleted
    })
  }, [visibleLevels, getLevelStatus])

  useEffect(() => {
    if (currentLevelIndex < 0) return
    const timer = setTimeout(() => {
      currentLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
    return () => clearTimeout(timer)
  }, [currentLevelIndex, selectedGrade])

  const theme = THEMES[selectedGrade] || THEMES[1]

  return (
    <div className="flex flex-col w-full relative" style={{ minHeight: '100vh', backgroundColor: theme.bg }}>
      {/* 心数耗尽提示弹窗 */}
      <AnimatePresence>
        {showNoHearts && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={() => setShowNoHearts(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="bg-white rounded-3xl p-6 max-w-[320px] w-full text-center"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-3">💔</div>
              <h3 className="text-lg font-black mb-1.5" style={{ color: theme.textPrimary }}>
                心数用完了
              </h3>
              <p className="text-xs mb-5" style={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                再等{heartRecoverMinutes}分钟就能恢复啦～<br />
                休息一下，过会儿再来挑战吧！
              </p>
              <div className="flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNoHearts(false)}
                  className="w-full py-2.5 rounded-2xl text-sm font-bold text-white"
                  style={{ backgroundColor: theme.accent, boxShadow: `0 3px 0 ${theme.accent}` }}
                >
                  知道了
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    user.refillHearts()
                    setShowNoHearts(false)
                    playSound('unlock', user.settings.sound)
                    vibrate(30, user.settings.vibration)
                  }}
                  className="w-full py-2.5 rounded-2xl text-sm font-bold"
                  style={{
                    backgroundColor: 'rgba(255,255,255,1)',
                    border: `1.5px solid ${theme.accentSoft}`,
                    color: theme.accent,
                  }}
                >
                  立即恢复 {user.maxHearts} ❤
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 关卡加载失败提示 */}
      <AnimatePresence>
        {levelError && (
          <motion.div
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-lg"
            style={{ backgroundColor: '#FF4B4B' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => setLevelError('')}
          >
            {levelError}
          </motion.div>
        )}
      </AnimatePresence>


      {/* ═══════════════════════════════════════════════════ */}
      {/* 主地图区域 */}
      {/* ═══════════════════════════════════════════════════ */}
      <div
        ref={mapRef}
        className="flex-1 px-3 pb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bg} 40%, ${theme.bg} 100%)`,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`map-${selectedGrade}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative mx-auto"
            style={{ maxWidth: '420px', height: `${Math.max(640, visibleLevels.length * 140)}px` }}
          >
            {visibleLevels.map((level, i) => {
              if (i >= visibleLevels.length - 1) return null
              const { isCompleted } = getLevelStatus(level.id)
              return (
                <PathConnector
                  key={`path-${i}`}
                  from={{ x: NODE_POSITIONS[i].x, y: NODE_POSITIONS[i].y }}
                  to={{ x: NODE_POSITIONS[i + 1].x, y: NODE_POSITIONS[i + 1].y }}
                  isCompleted={isCompleted}
                  pathColor={theme.pathColor}
                  pathActive={theme.pathActive}
                />
              )
            })}

            {visibleLevels.map((level, i) => {
              const { isUnlocked, isCompleted } = getLevelStatus(level.id)
              const isCurrent = i === currentLevelIndex
              const stars = user.completedLevels[level.id]?.stars || 0
              const mastery = getLevelMastery(level.knowledgePoints || [], user.learningStats.knowledgeProgress || {})
              return (
                <LevelNode
                  key={level.id}
                  index={i}
                  level={level}
                  pos={NODE_POSITIONS[i]}
                  isUnlocked={isUnlocked}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  stars={stars}
                  mastery={mastery}
                  theme={theme}
                  forwardRef={isCurrent ? currentLevelRef : undefined}
                  navigatingLevelId={navigatingLevelId}
                  onClick={() => {
                    if (isUnlocked) {
                      enterLevel(level.id)
                    }
                  }}
                />
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
