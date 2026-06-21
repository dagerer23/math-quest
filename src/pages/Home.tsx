import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { getLevelsByGrade, getLevelDetail, generateQuestions } from '@/services/content'
import { useSessionStore } from '@/store/useSessionStore'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { playSound } from '@/utils/sound'
import { vibrate } from '@/utils/vibrate'
import { THEMES } from '@/components/home/themes'
import { GameMap } from '@/components/map-preview/GameMap'
import { COLORS as MAP_COLORS } from '@/components/map-preview/constants'
import { Icon } from '@/components/Icon'


// ═══════════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  const navigate = useNavigate()
  const user = useUserStore()
  const startSession = useSessionStore((s) => s.start)
  const selectedGrade = Math.max(1, Math.min(12, user.profile.targetGrade || 1))
  const [navigating, setNavigating] = useState(false)
  const [navigatingLevelId, setNavigatingLevelId] = useState<string | null>(null)
  const [showNoHearts, setShowNoHearts] = useState(false)
  const [levelError, setLevelError] = useState('')
  const [visibleLevels, setVisibleLevels] = useState<any[]>([])
  const [loadingLevels, setLoadingLevels] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)

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
      // 基于掌握度 + 上一关连击动态生成题目
      const userMastery = user.learningStats.knowledgeProgress || {}
      const recentIds = user.mistakeIds
      const lastCombo = user.comboMax || 0
      const userId = user.userId || undefined
      const questions = await generateQuestions(levelId, userMastery, recentIds, lastCombo, userId)
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
              <div className="mb-3 flex justify-center">
                <Icon name="heart" size={48} className="text-[#FF4B4B]" />
              </div>
              <h3 className="text-lg font-bold mb-1.5" style={{ color: theme.textPrimary }}>
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
                  aria-label={`立即恢复${user.maxHearts}颗心`}
                  className="w-full py-2.5 rounded-2xl text-sm font-bold"
                  style={{
                    backgroundColor: 'rgba(255,255,255,1)',
                    border: `1.5px solid ${theme.accentSoft}`,
                    color: theme.accent,
                  }}
                >
                  立即恢复 {user.maxHearts} <Icon name="heart" size={12} className="inline" />
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
          background: MAP_COLORS.bgBot,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`map-${selectedGrade}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative mx-auto w-full"
            style={{ maxWidth: '420px' }}
          >
            {visibleLevels.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="text-center max-w-xs">
                  <div className="mb-4 flex justify-center">
                    <Icon name="construction" size={64} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: theme.textPrimary }}>
                    该年级内容筹备中
                  </h3>
                  <p className="text-xs" style={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                    我们正在精心准备这一年级的数学关卡，敬请期待！
                  </p>
                </div>
              </div>
            )}
            {visibleLevels.length > 0 && (
              <GameMap
                levels={visibleLevels}
                starsByLevelId={Object.fromEntries(
                  Object.entries(user.completedLevels).map(([id, v]) => [id, v?.stars || 0]),
                )}
                unlockedSet={new Set(user.unlockedLevels)}
                completedSet={new Set(Object.keys(user.completedLevels))}
                currentLevelIndex={currentLevelIndex}
                navigatingLevelId={navigatingLevelId}
                onLevelClick={(lvl) => enterLevel(lvl.id)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
