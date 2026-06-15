import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { getLevelsByGrade } from '@/services/content'
import StarRow from '@/components/StarRow'
import PixelButton from '@/components/PixelButton'
import { Lock, Crown, Trophy, BookOpen, Calendar, Flame, Zap, Book, School, Check, ChevronDown, ChevronUp, Home, Target, Award } from 'lucide-react'
import clsx from 'clsx'

const learningStageLabels: Record<string, string> = {
  primary: '小学',
  middle: '初中',
  high: '高中',
  adult: '成人',
}

const learningGoalLabels: Record<string, string> = {
  consolidation: '巩固基础',
  improvement: '提升培优',
  interest: '兴趣启蒙',
  training: '思维训练',
}

const Stat = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-gray-50 rounded-xl py-2 border border-gray-100">
    <div className="flex items-center justify-center gap-1 mb-1">
      <span className={color}>{icon}</span>
    </div>
    <div className={clsx('font-bold text-lg', color)}>{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
)

export default function LayoutPreview() {
  const navigate = useNavigate()
  const user = useUserStore()
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1)
  const [visibleLevels, setVisibleLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const targetGrade = user.profile.targetGrade || 2

  // 从后端拉取同年级关卡列表
  useEffect(() => {
    setLoading(true)
    getLevelsByGrade(targetGrade).then((levels) => {
      setVisibleLevels(levels)
      setLoading(false)
    })
  }, [targetGrade])

  const gradeLabel = targetGrade === 1 ? '一年级' : targetGrade === 2 ? '二年级' : targetGrade === 3 ? '三年级' : targetGrade + '年级'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
            <Home size={20} />
          </button>
          <h1 className="font-bold text-lg text-gray-800">布局方案预览</h1>
          <div className="w-5"></div>
        </div>
        <div className="flex gap-2">
          {[
            { id: 1, label: '方案一', color: 'from-duolingo-green' },
            { id: 2, label: '方案二', color: 'from-duolingo-blue' },
            { id: 3, label: '方案三', color: 'from-duolingo-purple' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 1 | 2 | 3)}
              className={clsx(
                'flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all',
                activeTab === tab.id
                  ? `${tab.color} text-white shadow-md`
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* 方案一：三区域式布局 */}
        {activeTab === 1 && <LayoutOne levels={visibleLevels} loading={loading} />}

        {/* 方案二：标签页式布局 */}
        {activeTab === 2 && <LayoutTwo levels={visibleLevels} loading={loading} />}

        {/* 方案三：强化版单页布局 */}
        {activeTab === 3 && <LayoutThree levels={visibleLevels} loading={loading} />}
      </div>

      {/* 方案说明 */}
      <div className="px-4 pb-8 pt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-2">当前方案说明</h3>
          <p className="text-sm text-gray-600">
            {activeTab === 1 && '采用清晰的上中下三区域布局，重点突出，适合快速操作。'}
            {activeTab === 2 && '标签页切换，各功能独立，适合有多个模块的复杂应用。'}
            {activeTab === 3 && '内容更密集，进度一目了然，适合学习动力强的用户。'}
          </p>
        </div>
      </div>

      <div className="hidden">{gradeLabel}</div>
    </div>
  )
}

// 方案一：三区域式布局
function LayoutOne({ levels, loading }: { levels: any[]; loading: boolean }) {
  const user = useUserStore()
  const visibleLevels = levels
  const [mapCollapsed, setMapCollapsed] = useState(false)
  const today = new Date().toDateString()
  const hasCheckedIn = user.lastCheckInDate === today

  // 关卡图标的 emoji
  const levelIcons = ['🧮', '➕', '➖', '✖️', '➗', '📐', '📊', '🔢', '📏', '🎯']

  return (
    <div className="space-y-4">
      {/* 顶部：用户信息 + 签到 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pixel-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-duolingo-green/10 to-duolingo-blue/10 border border-duolingo-green/20 grid place-items-center text-2xl">
              {user.profile.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{user.profile.nickname}</span>
                <span className="text-xs text-gray-400">Lv.{Math.floor(user.xp / 100) + 1}</span>
              </div>
              <div className="text-xs text-gray-500">{user.xp.toLocaleString()} XP</div>
            </div>
          </div>
          <PixelButton
            variant={hasCheckedIn ? 'gray' : 'green'}
            size="sm"
            onClick={() => {}}
            disabled={hasCheckedIn}
          >
            {hasCheckedIn ? '已签到' : '签到'}
          </PixelButton>
        </div>
      </motion.div>

      {/* 中部：快捷操作区 */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="pixel-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-duolingo-blue" />
            <span className="font-bold text-sm text-gray-800">每日目标</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full mb-2">
            <div className="h-full w-2/3 bg-duolingo-blue rounded-full"></div>
          </div>
          <span className="text-xs text-gray-500">2/3 完成</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pixel-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-duolingo-gold" />
            <span className="font-bold text-sm text-gray-800">错题本</span>
          </div>
          <div className="text-2xl font-bold text-duolingo-gold">{user.mistakeIds.length}</div>
          <span className="text-xs text-gray-500">道错题</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="pixel-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-duolingo-red" />
            <span className="font-bold text-sm text-gray-800">连签</span>
          </div>
          <div className="text-2xl font-bold text-duolingo-red">{user.streak}</div>
          <span className="text-xs text-gray-500">天</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pixel-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-duolingo-green" />
            <span className="font-bold text-sm text-gray-800">成就</span>
          </div>
          <div className="text-2xl font-bold text-duolingo-green">{user.achievements.length}/10</div>
          <span className="text-xs text-gray-500">已解锁</span>
        </motion.div>
      </div>

      {/* 下部：炫酷游戏风格学习地图 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pixel-card p-4">
        <button 
          onClick={() => setMapCollapsed(!mapCollapsed)}
          className="flex items-center justify-between w-full mb-3"
        >
          <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
            <Trophy size={16} className="text-duolingo-gold" /> 冒险地图
          </h2>
          {mapCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        
        {!mapCollapsed && (
          <div className="relative">
            {/* 装饰元素 */}
            <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
              <div className="absolute top-2 right-4 text-2xl animate-bounce">⭐</div>
              <div className="absolute top-10 left-2 text-xl opacity-60">☁️</div>
              <div className="absolute bottom-8 right-8 text-xl opacity-60">☁️</div>
            </div>

            {/* 关卡列表 */}
            <div className="relative z-10 space-y-2">
              {visibleLevels.slice(0, 6).map((level, i) => {
                const isUnlocked = user.unlockedLevels.includes(level.id)
                const isCompleted = !!user.completedLevels[level.id]
                const isCurrent = isUnlocked && !isCompleted && i === visibleLevels.findIndex(l => user.unlockedLevels.includes(l.id) && !user.completedLevels[l.id])
                
                return (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={clsx(
                      'relative flex items-center gap-3 p-3 rounded-2xl transition-all',
                      isCurrent 
                        ? 'bg-gradient-to-r from-duolingo-green/20 to-duolingo-green/10 border-2 border-duolingo-green shadow-lg' 
                        : isCompleted
                          ? 'bg-gradient-to-r from-duolingo-gold/10 to-gray-50 border border-duolingo-gold/30'
                          : isUnlocked
                            ? 'bg-white border border-gray-100 hover:border-duolingo-green/30 hover:shadow-md cursor-pointer'
                            : 'bg-gray-50 border border-gray-100 opacity-70'
                    )}
                  >
                    {/* 关卡图标 */}
                    <div className={clsx(
                      'w-14 h-14 rounded-2xl grid place-items-center text-2xl relative',
                      isCompleted ? 'bg-gradient-to-br from-duolingo-gold to-duolingo-green shadow-lg' :
                      isCurrent ? 'bg-gradient-to-br from-duolingo-green to-duolingo-blue animate-pulse shadow-lg' :
                      isUnlocked ? 'bg-gradient-to-br from-white to-gray-100 border border-gray-200' :
                      'bg-gray-200'
                    )}>
                      <span className={isUnlocked ? '' : 'grayscale'}>
                        {isCompleted ? '⭐' : levelIcons[i % levelIcons.length]}
                      </span>
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 bg-duolingo-red text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-bounce">
                          GO!
                        </div>
                      )}
                    </div>

                    {/* 关卡信息 */}
                    <div className="flex-1">
                      <div className={clsx(
                        'text-sm font-bold flex items-center gap-2',
                        isCurrent ? 'text-duolingo-green' : isCompleted ? 'text-duolingo-gold' : 'text-gray-700'
                      )}>
                        第 {i + 1} 关 · {level.chapter}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {level.questions.length} 道题
                      </div>
                      {isCompleted && (
                        <StarRow earned={user.completedLevels[level.id].stars as 0 | 1 | 2 | 3} size="sm" />
                      )}
                    </div>

                    {/* 右侧状态 */}
                    <div className="text-right">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-2xl"
                        >
                          ✅
                        </motion.div>
                      ) : isCurrent ? (
                        <div className="w-8 h-8 bg-duolingo-green rounded-full grid place-items-center animate-pulse">
                          <span className="text-white text-sm font-bold">→</span>
                        </div>
                      ) : isUnlocked ? (
                        <div className="w-8 h-8 bg-gray-100 rounded-full grid place-items-center">
                          <Lock size={14} className="text-gray-400" />
                        </div>
                      ) : (
                        <Lock size={20} className="text-gray-400" />
                      )}
                    </div>

                    {/* 连接线（除了最后一个） */}
                    {i < visibleLevels.slice(0, 6).length - 1 && (
                      <div className={clsx(
                        'absolute left-7 bottom-0 translate-y-full h-4 w-1',
                        isCompleted ? 'bg-duolingo-green' : 'bg-gray-200'
                      )}>
                        {isCompleted && (
                          <motion.div
                            className="absolute top-0 left-0 right-0 h-full bg-duolingo-green"
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {visibleLevels.length > 6 && (
              <div className="text-center text-sm text-gray-500 py-3 mt-2 bg-gray-50 rounded-xl">
                还有 {visibleLevels.length - 6} 个神秘关卡等你解锁 🔒
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// 方案二：标签页式布局
function LayoutTwo({ levels }: { levels: any[] }) {
  const user = useUserStore()
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'achievements'>('learn')
  const visibleLevels = levels

  return (
    <div className="space-y-4">
      {/* 顶部用户信息 */}
      <div className="pixel-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-duolingo-green/10 to-duolingo-blue/10 border border-duolingo-green/20 grid place-items-center text-2xl">
            {user.profile.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800">{user.profile.nickname}</span>
                <span className="text-xs text-gray-400 ml-2">Lv.{Math.floor(user.xp / 100) + 1}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Flame size={14} className="text-duolingo-red" />
                {user.streak}天
              </div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-duolingo-green rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'learn', label: '学习', icon: <Book size={16} /> },
          { id: 'practice', label: '练习', icon: <Target size={16} /> },
          { id: 'achievements', label: '成就', icon: <Award size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1',
              activeTab === tab.id
                ? 'bg-white text-duolingo-green shadow-sm'
                : 'text-gray-500'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="min-h-[400px]">
        {activeTab === 'learn' && (
          <div className="pixel-card p-4">
            <h3 className="font-bold text-sm text-gray-800 mb-3">学习地图</h3>
            <div className="space-y-2">
              {visibleLevels.slice(0, 5).map((level, i) => (
                <div key={level.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl grid place-items-center font-bold',
                    user.unlockedLevels.includes(level.id) 
                      ? 'bg-duolingo-green text-white' 
                      : 'bg-gray-200 text-gray-400'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800">{level.chapter}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-3">
            <div className="pixel-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen size={24} className="text-duolingo-gold" />
                <div>
                  <div className="font-bold text-gray-800">错题本</div>
                  <div className="text-xs text-gray-500">复习错题，巩固知识</div>
                </div>
                <div className="ml-auto text-2xl font-bold text-duolingo-gold">{user.mistakeIds.length}</div>
              </div>
            </div>
            <div className="pixel-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target size={24} className="text-duolingo-blue" />
                <div>
                  <div className="font-bold text-gray-800">专项练习</div>
                  <div className="text-xs text-gray-500">针对性强化</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-3">
            <div className="pixel-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-duolingo-gold" />
                <h3 className="font-bold text-gray-800">我的成就</h3>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className={clsx(
                    'w-full aspect-square rounded-xl grid place-items-center text-xl',
                    i < user.achievements.length ? 'bg-duolingo-gold/10' : 'bg-gray-100'
                  )}>
                    {i < user.achievements.length ? '🏆' : '🔒'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 方案三：强化版单页布局
function LayoutThree({ levels }: { levels: any[] }) {
  const user = useUserStore()
  const visibleLevels = levels
  const today = new Date().toDateString()
  const hasCheckedIn = user.lastCheckInDate === today

  return (
    <div className="space-y-3">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-duolingo-green/10 to-duolingo-blue/10 grid place-items-center text-xl">
            {user.profile.avatar}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">{user.profile.nickname}</div>
            <div className="text-xs text-gray-500">{user.xp.toLocaleString()} XP</div>
          </div>
        </div>
        <PixelButton variant={hasCheckedIn ? 'gray' : 'green'} size="sm">
          {hasCheckedIn ? '✓ 已签' : '签到'}
        </PixelButton>
      </div>

      {/* 进度概览条 */}
      <div className="pixel-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-600">今日进度</span>
          <span className="text-xs text-duolingo-green">60%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full w-3/5 bg-duolingo-green rounded-full"></div>
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-lg font-bold text-duolingo-red">🔥{user.streak}</div>
            <div className="text-xs text-gray-500">连签</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-duolingo-gold">📚{user.mistakeIds.length}</div>
            <div className="text-xs text-gray-500">错题</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-duolingo-green">🏆{user.achievements.length}</div>
            <div className="text-xs text-gray-500">成就</div>
          </div>
        </div>
      </div>

      {/* 每日目标 */}
      <div className="pixel-card p-4 bg-gradient-to-br from-duolingo-green/5 to-duolingo-blue/5 border border-duolingo-green/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-duolingo-blue" />
            <span className="font-bold text-sm text-gray-800">每日目标</span>
          </div>
          <span className="text-xs text-duolingo-blue font-bold">2/3</span>
        </div>
        <div className="space-y-2">
          {[
            { label: '完成10道题', done: true },
            { label: '复习3道错题', done: true },
            { label: '获得50XP', done: false }
          ].map((task, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl">
              <div className={clsx(
                'w-5 h-5 rounded-full grid place-items-center text-xs',
                task.done ? 'bg-duolingo-green text-white' : 'bg-gray-200'
              )}>
                {task.done ? <Check size={12} /> : ''}
              </div>
              <span className={clsx('text-sm', task.done ? 'text-gray-400 line-through' : 'text-gray-700')}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 学习地图 - 紧凑版 */}
      <div className="pixel-card p-4">
        <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-duolingo-gold" /> {(user.profile.targetGrade || 2) + '年级'} · 学习地图
        </h3>
        <div className="flex flex-wrap gap-2">
          {visibleLevels.slice(0, 8).map((level, i) => (
            <div
              key={level.id}
              className={clsx(
                'w-14 h-14 rounded-xl grid place-items-center font-bold text-sm transition-all',
                user.unlockedLevels.includes(level.id)
                  ? user.completedLevels[level.id]
                    ? 'bg-duolingo-green text-white'
                    : 'bg-white border-2 border-duolingo-green/30 text-duolingo-green'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {i + 1}
            </div>
          ))}
          {visibleLevels.length > 8 && (
            <div className="w-14 h-14 rounded-xl bg-gray-50 grid place-items-center text-xs text-gray-400">
              +{visibleLevels.length - 8}
            </div>
          )}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="pixel-card p-3 flex items-center gap-2">
          <BookOpen size={20} className="text-duolingo-gold" />
          <div>
            <div className="text-sm font-bold text-gray-800">错题本</div>
            <div className="text-xs text-gray-500">{user.mistakeIds.length}道</div>
          </div>
        </div>
        <div className="pixel-card p-3 flex items-center gap-2">
          <Trophy size={20} className="text-duolingo-green" />
          <div>
            <div className="text-sm font-bold text-gray-800">排行榜</div>
            <div className="text-xs text-gray-500">查看排名</div>
          </div>
        </div>
      </div>
    </div>
  )
}
