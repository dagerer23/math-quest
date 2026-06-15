import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { getQuestionsByIds } from '@/services/content'
import { Trash2, Swords, ChevronDown, ChevronUp, Target, TrendingUp, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { useSessionStore } from '@/store/useSessionStore'
import type { Question } from '@/types/models'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ---------- helpers ----------

function getRingColor(kp: string, idx: number) {
  const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF4B4B', '#9069CD', '#00CD9C', '#A5682A']
  return colors[idx % colors.length]
}

function CountdownRing({ mastered, total, color }: { mastered: number; total: number; color: string }) {
  const pct = total > 0 ? (mastered / total) * 100 : 0
  const r = 16
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#E5E7EB" strokeWidth="3" />
      <circle
        cx="20" cy="20" r={r}
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="20" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
        {mastered}
      </text>
    </svg>
  )
}

// ---------- component ----------

export default function Mistakes() {
  const navigate = useNavigate()
  const mistakeIds = useUserStore((s) => s.mistakeIds)
  const mistakeMastery = useUserStore((s) => s.mistakeMastery)
  const clearMistake = useUserStore((s) => s.clearMistake)
  const startSession = useSessionStore((s) => s.start)
  const [tab, setTab] = useState<'all' | 'byKP'>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // ---- 异步拉取题目 ----
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (mistakeIds.length === 0) {
      setQuestionsMap({})
      setLoading(false)
      return
    }
    setLoading(true)
    getQuestionsByIds(mistakeIds).then((qs) => {
      const map: Record<string, Question> = {}
      qs.forEach((q) => { map[q.id] = q })
      setQuestionsMap(map)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [mistakeIds.join(',')])

  // ---- 收集所有错题 ----
  const allItems: { q: Question; kp: string; levelId: string; levelName: string }[] = useMemo(() => {
    const items: typeof allItems = []
    for (const id of mistakeIds) {
      const q = questionsMap[id]
      if (q) {
        items.push({ q, kp: q.knowledgePoint, levelId: '', levelName: q.knowledgePoint })
      }
    }
    return items
  }, [mistakeIds, questionsMap])

  // ---- 按知识点分组 ----
  const byKP = useMemo(() => {
    const map = new Map<string, typeof allItems>()
    allItems.forEach((item) => {
      const arr = map.get(item.kp) ?? []
      arr.push(item)
      map.set(item.kp, arr)
    })
    return Array.from(map.entries())
  }, [allItems])

  // ---- 每个知识点的掌握度 ----
  const kpMastery = useMemo(() => {
    return byKP.map(([kp, list]) => {
      const mastered = list.filter((it) => (mistakeMastery[it.q.id] || 0) >= 3).length
      return { kp, total: list.length, mastered }
    })
  }, [byKP, mistakeMastery])

  // ---- 总体掌握数据 ----
  const totalMastered = useMemo(() => kpMastery.reduce((sum, k) => sum + k.mastered, 0), [kpMastery])
  const totalWeak = allItems.length - totalMastered

  // ---- 展开/折叠 ----
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ---- 复仇战 ----
  const revenge = async (ids: string[]) => {
    const pool = ids.map((id) => questionsMap[id]).filter(Boolean) as Question[]
    if (pool.length === 0) return
    const sample = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length))
    const fakeLevel = {
      id: 'mistakes-revenge',
      chapter: '错题复仇',
      grade: 2,
      isBoss: false,
      questions: sample,
      knowledgePoints: [...new Set(sample.map(q => q.knowledgePoint))],
      unitId: 'unit-mistakes',
    }
    startSession(fakeLevel, sample)
    navigate(`/battle/mistakes-revenge`)
  }

  // ---- 渲染单张错题卡片 ----
  const renderCard = (item: typeof allItems[0], index: number) => {
    const m = mistakeMastery[item.q.id] || 0
    const isExpanded = expandedIds.has(item.q.id)
    const isMastered = m >= 3
    return (
      <motion.div
        key={item.q.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className={clsx(
          'pixel-card overflow-hidden transition-all',
          isMastered ? 'border-duolingo-green/30 bg-duolingo-green/3' : 'bg-white',
        )}
      >
        {/* 折叠头部 — 点击展开 */}
        <button
          onClick={() => toggleExpand(item.q.id)}
          className="w-full flex items-start gap-2.5 p-3 text-left"
        >
          <span className={clsx(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
            isMastered ? 'bg-duolingo-green/15 text-duolingo-green' : 'bg-gray-100 text-gray-500',
          )}>
            {isMastered ? <CheckCircle2 size={14} /> : index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 font-medium mb-0.5 flex items-center gap-1.5">
              <span>{item.kp}</span>
              {m > 0 && (
                <span className={clsx(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  m >= 3 ? 'bg-duolingo-green/12 text-duolingo-green' : 'bg-duolingo-gold/12 text-duolingo-gold',
                )}>
                  ✓{m}/3
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-gray-800 leading-relaxed">
              {item.q.prompt}
            </div>
          </div>
          <div className="flex-shrink-0 mt-1 text-gray-300">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {/* 展开内容 — 答案 & 操作 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">正确答案</div>
                    <div className="text-base font-bold text-duolingo-green">{String(item.q.answer)}</div>
                    {item.q.explanation && (
                      <div className="text-xs text-gray-500 mt-1 leading-relaxed">{item.q.explanation}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>📚 来自：{item.levelName}</span>
                  {isMastered ? (
                    <span className="text-duolingo-green font-bold">🎉 已掌握</span>
                  ) : m > 0 ? (
                    <span>掌握进度：<span className="text-duolingo-gold font-bold">{m}/3</span></span>
                  ) : null}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearMistake(item.q.id)
                  }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-duolingo-red transition-colors py-1"
                >
                  <Trash2 size={12} />
                  移出错题本
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // ---- 主体 ----
  return (
    <div className="min-h-screen pb-6 bg-gradient-to-b from-gray-50 to-white">
      {/* ===== 顶部概览卡 ===== */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-extrabold text-lg text-gray-800 flex items-center gap-1.5">
              📓 错题本
            </h1>
            <span className="text-xs font-bold text-gray-400">{allItems.length} 题待攻克</span>
          </div>

          {/* 知识点圆环 — 横向滚动 */}
          {kpMastery.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {kpMastery.map((k, i) => (
                <div key={k.kp} className="flex items-center gap-1.5 flex-shrink-0 bg-gray-50 rounded-2xl px-2.5 py-1.5">
                  <CountdownRing mastered={k.mastered} total={k.total} color={getRingColor(k.kp, i)} />
                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-gray-700 max-w-[60px] truncate">{k.kp}</div>
                    <div className="text-gray-400">{k.mastered}/{k.total}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 统计行 + 复仇按钮 */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Target size={13} className="text-duolingo-green" />
              <span className="font-bold text-duolingo-green">{totalMastered}</span> 已掌握
              <span className="text-gray-300">|</span>
              <TrendingUp size={13} className="text-duolingo-gold" />
              <span className="font-bold text-duolingo-gold">{totalWeak}</span> 待加强
            </div>
            {allItems.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => revenge(allItems.map(i => i.q.id))}
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-duolingo-red text-white rounded-2xl text-xs font-bold shadow-md shadow-duolingo-red/20 active:shadow-sm transition-all"
              >
                <Swords size={13} />
                复仇再战
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ===== 内容区 ===== */}
      <div className="px-4 pt-3">
        {/* 标签切换 */}
        <Tabs defaultValue="all" value={tab} onValueChange={(v) => setTab(v as 'all' | 'byKP')}>
          <TabsList className="w-full flex gap-1.5 mb-3 h-9 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className={clsx(
                'flex-1 h-9 rounded-xl text-xs font-bold transition-all',
                tab === 'all'
                  ? 'bg-duolingo-green text-white shadow-lg shadow-duolingo-green/25 data-active:bg-duolingo-green data-active:text-white'
                  : 'bg-gray-100 text-gray-500',
              )}
            >
              全部错题
            </TabsTrigger>
            <TabsTrigger
              value="byKP"
              className={clsx(
                'flex-1 h-9 rounded-xl text-xs font-bold transition-all',
                tab === 'byKP'
                  ? 'bg-duolingo-green text-white shadow-lg shadow-duolingo-green/25 data-active:bg-duolingo-green data-active:text-white'
                  : 'bg-gray-100 text-gray-500',
              )}
            >
              按知识点
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 空状态 */}
        {allItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] pt-8"
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <div className="text-base font-bold text-gray-700">太棒了，没有错题！</div>
              <div className="text-sm text-gray-400 mt-1">继续挑战更多关卡吧</div>
            </div>
          </motion.div>
        ) : tab === 'all' ? (
          /* 全部视图 */
          <div className="space-y-2 pb-4">
            {allItems.map((item, i) => renderCard(item, i))}
          </div>
        ) : (
          /* 按知识点视图 */
          <div className="space-y-4 pb-4">
            {byKP.map(([kp, list], gi) => {
              const mastered = list.filter(it => (mistakeMastery[it.q.id] || 0) >= 3).length
              const pct = Math.round((mastered / list.length) * 100)
              return (
                <div key={kp}>
                  {/* 知识点头部 */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getRingColor(kp, gi) }}
                      />
                      <span className="font-bold text-sm text-gray-700">{kp}</span>
                      <span className="text-xs text-gray-400">{list.length} 题</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: getRingColor(kp, gi) }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">{pct}%</span>
                    </div>
                  </div>
                  {/* 该知识点的错题列表 */}
                  <div className="space-y-2">
                    {list.map((item, i) => renderCard(item, i))}
                  </div>
                  {/* 针对性练习 */}
                  <button
                    onClick={() => revenge(list.map(i => i.q.id))}
                    className="mt-2.5 w-full h-9 rounded-xl bg-gray-50 border border-gray-200 text-duolingo-green text-xs font-bold transition-all active:scale-[0.98] hover:border-duolingo-green/30"
                  >
                    只练「{kp}」({list.filter(it => (mistakeMastery[it.q.id] || 0) < 3).length} 题待攻克)
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}