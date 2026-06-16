import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2, VolumeX, Vibrate, VibrateOff, Edit2, Save, RotateCcw,
  Settings as SettingsIcon, LogOut, Trophy, Zap, Target, Coins,
  BookOpen, BarChart3, Swords, Sparkles, Crown, ChevronRight, X
} from 'lucide-react'
import { saveProfile } from '@/services/auth'
import { getRankInfo, getNextRankInfo, getRankProgress } from '@/utils/rank'
import clsx from 'clsx'
import ConfirmDialog from '@/components/ConfirmDialog'
import { TOKEN_KEY } from '@/services/auth'

const AVATAR_OPTIONS = [
  '😊', '😎', '🤓', '🥳', '😇',
  '🌟', '🚀', '🎯', '⭐', '🎨',
  '🐱', '🐶', '🦊', '🐼', '🦁',
]

// 等级图标映射
const RANK_ICONS: Record<string, string> = {
  '青铜': '🥉',
  '白银': '🥈',
  '黄金': '🥇',
  '铂金': '💎',
  '钻石': '👑',
  '大师': '🏆',
}

export default function Profile() {
  const navigate = useNavigate()
  const user = useUserStore()
  const achievementsMeta = useUserStore((s) => s.achievementsMeta)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.profile.nickname)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const rankInfo = getRankInfo(user.xp, user.systemConfigs)
  const nextRank = getNextRankInfo(user.xp, user.systemConfigs)
  const rankProgress = getRankProgress(user.xp, user.systemConfigs)
  const accuracy = user.learningStats.totalQuestions > 0
    ? Math.round((user.learningStats.correctQuestions / user.learningStats.totalQuestions) * 100)
    : 0

  const handleSaveName = async () => {
    const newName = name.trim() || '数学爱好者'
    user.setProfile({ nickname: newName })
    setEditing(false)
    if (!user.userId) return
    setSavingProfile(true)
    await saveProfile({ userId: user.userId, nickname: newName, avatar: user.profile.avatar })
    setSavingProfile(false)
  }

  const handleSelectAvatar = async (avatar: string) => {
    user.setProfile({ avatar })
    setShowAvatarPicker(false)
    if (!user.userId) return
    setSavingProfile(true)
    await saveProfile({ userId: user.userId, nickname: user.profile.nickname, avatar })
    setSavingProfile(false)
  }

  return (
    <div className="flex flex-col gap-5 pt-2 pb-8 px-4 max-w-screen-md mx-auto">
      {/* ═══════════ 个人信息卡 - 英雄区域 ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 p-6 shadow-xl shadow-fuchsia-500/20"
      >
        {/* 装饰性背景元素 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
        <div className="absolute top-4 right-6 text-6xl opacity-10 select-none">✦</div>
        <div className="absolute bottom-8 right-12 text-4xl opacity-10 select-none">✦</div>

        <div className="relative flex items-start gap-4">
          {/* 头像 - 带光环 */}
          <div className="relative flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-20 h-20 rounded-2xl grid place-items-center text-4xl bg-white/95 shadow-lg ring-4 ring-white/30 hover:ring-white/50 transition-all"
            >
              <span className="drop-shadow-sm">{user.profile.avatar}</span>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full grid place-items-center shadow-md ring-2 ring-white">
                <Sparkles size={12} className="text-white" />
              </div>
            </motion.button>
          </div>

          {/* 用户信息 */}
          <div className="flex-1 min-w-0 pt-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm font-bold text-gray-800 bg-white/95 rounded-xl border-2 border-white/50 focus:outline-none focus:border-white"
                  maxLength={10}
                  placeholder="输入昵称"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingProfile}
                  className="p-1.5 bg-white text-fuchsia-600 rounded-xl shadow-md hover:scale-105 transition-transform"
                >
                  <Save size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl text-white truncate drop-shadow-sm">
                  {user.profile.nickname}
                </h1>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}

            {/* 段位徽章 */}
            <div className="mt-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-sm text-white text-xs font-bold ring-1 ring-white/30">
                <Crown size={11} className="text-amber-200" />
                <span>{rankInfo.name}</span>
              </div>
              {nextRank && (
                <span className="text-[10px] text-white/80 font-medium">
                  距 {nextRank.name} {rankProgress.target - rankProgress.current} XP
                </span>
              )}
            </div>

            {/* XP信息 */}
            <div className="mt-2 flex items-center gap-3 text-[11px] text-white/90">
              <span className="font-bold tabular-nums">{user.xp.toLocaleString()}</span>
              <span className="opacity-60">XP</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span className="font-medium">{user.profile.targetGrade}年级</span>
            </div>
          </div>
        </div>

        {/* 经验进度条 */}
        <div className="relative mt-4 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 via-yellow-200 to-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `${rankProgress.pct * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </div>

        {/* 头像选择器 - 浮动面板 */}
        <AnimatePresence>
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-4 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-gray-700">选择头像</span>
                <button onClick={() => setShowAvatarPicker(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => handleSelectAvatar(avatar)}
                    className={clsx(
                      'aspect-square rounded-xl grid place-items-center text-2xl transition-all',
                      user.profile.avatar === avatar
                        ? 'bg-gradient-to-br from-fuchsia-100 to-amber-100 ring-2 ring-fuchsia-400 scale-105'
                        : 'hover:bg-gray-50 hover:scale-105',
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════ 数据统计 - 三栏卡片 ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-3 gap-2.5"
      >
        <StatCard
          icon={<Coins size={18} />}
          value={user.coins}
          label="金币"
          gradient="from-amber-400 to-orange-400"
          shadow="shadow-amber-400/30"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          value={user.diamonds}
          label="钻石"
          gradient="from-cyan-400 to-blue-500"
          shadow="shadow-cyan-400/30"
        />
        <StatCard
          icon={<Zap size={18} />}
          value={user.comboMax}
          label="最高连击"
          gradient="from-rose-400 to-pink-500"
          shadow="shadow-rose-400/30"
        />
      </motion.div>

      {/* ═══════════ 快捷操作 ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-4 gap-2.5"
      >
        <QuickAction
          icon={<Trophy size={20} />}
          label="排行榜"
          bg="bg-gradient-to-br from-amber-50 to-orange-50"
          text="text-amber-500"
          ring="ring-amber-200/50"
          onClick={() => navigate('/leaderboard')}
        />
        <QuickAction
          icon={<BookOpen size={20} />}
          label="错题本"
          bg="bg-gradient-to-br from-rose-50 to-pink-50"
          text="text-rose-500"
          ring="ring-rose-200/50"
          onClick={() => navigate('/mistakes')}
        />
        <QuickAction
          icon={<BarChart3 size={20} />}
          label="学习统计"
          bg="bg-gradient-to-br from-sky-50 to-cyan-50"
          text="text-sky-500"
          ring="ring-sky-200/50"
          onClick={() => navigate('/stats')}
        />
        <QuickAction
          icon={<Swords size={20} />}
          label="闯关冒险"
          bg="bg-gradient-to-br from-emerald-50 to-teal-50"
          text="text-emerald-500"
          ring="ring-emerald-200/50"
          onClick={() => navigate('/')}
        />
      </motion.div>

      {/* ═══════════ 成就墙 ═══════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow-md shadow-amber-400/30">
              <Trophy size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">成就墙</h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold">
            <span className="tabular-nums">{user.achievements.length}</span>
            <span className="opacity-50">/</span>
            <span className="tabular-nums opacity-60">{achievementsMeta.length || 0}</span>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-5 gap-2">
            {achievementsMeta.map((a, idx) => {
              const unlocked = user.achievements.some((x) => x.id === a.id)
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.03 }}
                  className={clsx(
                    'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden',
                    unlocked
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-50 ring-1 ring-amber-200'
                      : 'bg-gray-50 ring-1 ring-gray-100',
                  )}
                  title={unlocked ? `${a.name} · ${a.description}` : `${a.name}（未解锁）`}
                >
                  {unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/30 to-transparent" />
                  )}
                  <span className={clsx('text-lg relative z-10', !unlocked && 'grayscale opacity-30')}>
                    {a.icon}
                  </span>
                  <span className={clsx(
                    'text-[9px] font-bold leading-none text-center px-0.5 relative z-10',
                    unlocked ? 'text-amber-700' : 'text-gray-400',
                  )}>
                    {a.name.slice(0, 4)}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* ═══════════ 学情统计 ═══════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 grid place-items-center shadow-md shadow-sky-400/30">
              <BarChart3 size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">学习数据</h2>
          </div>
        </div>
        <div className="px-4 pb-3 divide-y divide-gray-100">
          <StatRow
            icon={<Target size={15} />}
            label="已通关卡"
            value={String(Object.keys(user.completedLevels).length)}
            sub={`共 ${Object.keys(user.completedLevels).length} 个关卡`}
            color="text-emerald-500"
            bg="bg-emerald-50"
          />
          <StatRow
            icon={<Zap size={15} />}
            label="最高连击"
            value={String(user.comboMax)}
            sub={`连击 ${user.comboMax} 次`}
            color="text-amber-500"
            bg="bg-amber-50"
          />
          <StatRow
            icon={<Trophy size={15} />}
            label="答题正确率"
            value={`${accuracy}%`}
            sub={`${user.learningStats.correctQuestions}/${user.learningStats.totalQuestions} 题正确`}
            color="text-fuchsia-500"
            bg="bg-fuchsia-50"
          />
        </div>
      </motion.section>

      {/* ═══════════ 设置 ═══════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 grid place-items-center shadow-md shadow-slate-400/30">
              <SettingsIcon size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">设置</h2>
          </div>
        </div>
        <div className="px-4 pb-3 divide-y divide-gray-100">
          <SettingRow
            icon={user.settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            label="音效"
            active={user.settings.sound}
            onChange={(v) => user.setSettings({ sound: v })}
          />
          <SettingRow
            icon={user.settings.vibration ? <Vibrate size={16} /> : <VibrateOff size={16} />}
            label="震动反馈"
            active={user.settings.vibration}
            onChange={(v) => user.setSettings({ vibration: v })}
          />
        </div>
      </motion.section>

      {/* ═══════════ 底部操作 ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="flex flex-col gap-2.5 pt-1"
      >
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full h-12 rounded-2xl bg-white text-rose-500 text-sm font-bold flex items-center justify-center gap-2 ring-1 ring-gray-100 hover:bg-rose-50 hover:ring-rose-200 transition-all active:scale-[0.98]"
        >
          <LogOut size={15} /> 退出登录
        </button>
        {user.profile.phone && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full h-10 rounded-xl text-gray-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:text-gray-600 transition-colors"
          >
            <RotateCcw size={12} /> 重置存档
          </button>
        )}
        <p className="text-center text-[10px] text-gray-400 pt-3 font-medium">
          算力先锋 MathQuest · v0.1
        </p>
      </motion.div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        message="确定退出登录吗？下次需要重新验证。"
        confirmText="退出"
        onConfirm={() => {
          setShowLogoutConfirm(false)
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem('userId')
          localStorage.removeItem('lastPhone')
          user.logout()
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showResetConfirm}
        message="确定重置所有数据吗？此操作不可撤销。"
        confirmText="重置"
        onConfirm={() => {
          setShowResetConfirm(false)
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem('userId')
          localStorage.removeItem('lastPhone')
          user.reset()
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  )
}

// ─── 统计卡片 ───
function StatCard({ icon, value, label, gradient, shadow }: {
  icon: React.ReactNode
  value: number | string
  label: string
  gradient: string
  shadow: string
}) {
  return (
    <div className={clsx(
      'relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br text-white shadow-lg',
      gradient,
      shadow
    )}>
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/15 blur-md" />
      <div className="relative flex flex-col gap-1">
        <div className="opacity-90">{icon}</div>
        <div className="text-xl font-black tabular-nums leading-tight">{value}</div>
        <div className="text-[10px] font-medium opacity-85">{label}</div>
      </div>
    </div>
  )
}

// ─── 快捷操作按钮 ───
function QuickAction({ icon, label, bg, text, ring, onClick }: {
  icon: React.ReactNode
  label: string
  bg: string
  text: string
  ring: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center gap-1.5 py-3 rounded-2xl ring-1 transition-all active:scale-95',
        bg, ring
      )}
    >
      <div className={clsx('w-9 h-9 rounded-xl grid place-items-center bg-white shadow-sm', text)}>
        {icon}
      </div>
      <span className="text-[11px] font-bold text-gray-600">{label}</span>
    </motion.button>
  )
}

// ─── 统计行 ───
function StatRow({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={clsx('w-9 h-9 rounded-xl grid place-items-center flex-shrink-0', bg, color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-[10px] text-gray-400">{sub}</div>
      </div>
      <span className="text-base font-black text-gray-800 tabular-nums">{value}</span>
    </div>
  )
}

// ─── 设置行 ───
function SettingRow({ icon, label, active, onChange }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={clsx(
        'w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 transition-colors',
        active ? 'bg-fuchsia-50 text-fuchsia-500' : 'bg-gray-50 text-gray-400'
      )}>
        {icon}
      </div>
      <span className={clsx('flex-1 text-sm font-semibold', active ? 'text-gray-800' : 'text-gray-400')}>
        {label}
      </span>
      <button
        onClick={() => onChange(!active)}
        className={clsx(
          'relative w-10 h-6 rounded-full transition-colors',
          active ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500' : 'bg-gray-200'
        )}
      >
        <motion.div
          animate={{ x: active ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        />
      </button>
    </div>
  )
}
