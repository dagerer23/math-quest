import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { motion } from 'framer-motion'
import {
  Volume2, VolumeX, Vibrate, VibrateOff, Edit2, Save, RotateCcw,
  Settings, LogOut, Trophy, Zap, Target, Coins,
  BookOpen, BarChart3, Swords
} from 'lucide-react'
import { saveProfile } from '@/services/auth'
import { getRankInfo, getNextRankInfo, getRankProgress } from '@/utils/rank'
import clsx from 'clsx'
import ConfirmDialog from '@/components/ConfirmDialog'
import { TOKEN_KEY } from '@/services/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const AVATAR_OPTIONS = [
  '😊', '😎', '🤓', '🥳', '😇',
  '🌟', '🚀', '🎯', '⭐', '🎨',
  '🐱', '🐶', '🦊', '🐼', '🦁',
]

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

  // 同步 store 中的昵称到本地状态
  useState(() => {
    setName(user.profile.nickname)
  })

  const rankInfo = getRankInfo(user.xp, user.systemConfigs)
  const nextRank = getNextRankInfo(user.xp, user.systemConfigs)
  const rankProgress = getRankProgress(user.xp, user.systemConfigs)
  const accuracy = user.learningStats.totalQuestions > 0
    ? Math.round((user.learningStats.correctQuestions / user.learningStats.totalQuestions) * 100)
    : 0

  // 保存昵称到后端
  const handleSaveName = async () => {
    const newName = name.trim() || '数学爱好者'
    user.setProfile({ nickname: newName })
    setEditing(false)
    if (!user.userId) return
    setSavingProfile(true)
    await saveProfile({ userId: user.userId, nickname: newName, avatar: user.profile.avatar })
    setSavingProfile(false)
  }

  // 保存头像到后端
  const handleSelectAvatar = async (avatar: string) => {
    user.setProfile({ avatar })
    setShowAvatarPicker(false)
    if (!user.userId) return
    setSavingProfile(true)
    await saveProfile({ userId: user.userId, nickname: user.profile.nickname, avatar })
    setSavingProfile(false)
  }

  return (
    <div className="flex flex-col gap-4 pt-3 pb-6 px-4">
      {/* ═══════════ 个人信息卡 ═══════════ */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* 头像 */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="w-14 h-14 rounded-2xl grid place-items-center text-2xl bg-amber-50 border border-amber-100 hover:border-amber-200 transition-colors"
              >
                {user.profile.avatar}
              </button>
              {showAvatarPicker && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 z-50">
                  <div className="grid grid-cols-5 gap-1.5">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => handleSelectAvatar(avatar)}
                        className={clsx(
                          'aspect-square rounded-xl grid place-items-center text-xl transition-all',
                          user.profile.avatar === avatar
                            ? 'bg-amber-50 ring-2 ring-amber-300'
                            : 'hover:bg-gray-50',
                        )}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm flex-1"
                    maxLength={10}
                    placeholder="输入昵称"
                  />
                  <Button
                    size="icon"
                    variant="default"
                    onClick={handleSaveName}
                    disabled={savingProfile}
                    className="size-8"
                  >
                    {savingProfile ? (
                      <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-base text-foreground truncate">{user.profile.nickname}</h1>
                  <button onClick={() => setEditing(true)} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 size={12} />
                  </button>
                </div>
              )}

              {/* 段位 + 进度条 */}
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs font-semibold" style={{ color: rankInfo.color }}>
                    {rankInfo.name}
                  </Badge>
                  {nextRank && (
                    <span className="text-[10px] text-muted-foreground">
                      距 {nextRank.name} 还需 {rankProgress.target - rankProgress.current} XP
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: rankInfo.color, width: `${rankProgress.pct * 100}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${rankProgress.pct * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* XP / 目标年级 */}
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                <span>{user.xp.toLocaleString()} XP</span>
                <Separator orientation="vertical" className="h-3" />
                <span>{user.profile.targetGrade}年级</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ 快捷操作 ═══════════ */}
      <div className="grid grid-cols-4 gap-2">
        <QuickAction
          icon={<Trophy size={20} />}
          label="排行榜"
          bg="bg-amber-50"
          text="text-amber-500"
          onClick={() => navigate('/leaderboard')}
        />
        <QuickAction
          icon={<BookOpen size={20} />}
          label="错题本"
          bg="bg-rose-50"
          text="text-rose-400"
          onClick={() => navigate('/mistakes')}
        />
        <QuickAction
          icon={<BarChart3 size={20} />}
          label="学习统计"
          bg="bg-blue-50"
          text="text-blue-500"
          onClick={() => navigate('/stats')}
        />
        <QuickAction
          icon={<Swords size={20} />}
          label="闯关冒险"
          bg="bg-emerald-50"
          text="text-emerald-500"
          onClick={() => navigate('/')}
        />
      </div>

      {/* ═══════════ 成就墙 ═══════════ */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Trophy size={15} className="text-amber-500" />
              成就
            </CardTitle>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {user.achievements.length}/{achievementsMeta.length || 0}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {achievementsMeta.map((a) => {
              const unlocked = user.achievements.some((x) => x.id === a.id)
              return (
                <div
                  key={a.id}
                  className={clsx(
                    'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all',
                    unlocked
                      ? 'bg-amber-50 border border-amber-100'
                      : 'bg-muted border border-border',
                  )}
                  title={unlocked ? `${a.name} · ${a.description}` : `${a.name}（未解锁）`}
                >
                  <span className={clsx('text-lg', !unlocked && 'grayscale opacity-30')}>
                    {a.icon}
                  </span>
                  <span className={clsx(
                    'text-[9px] font-medium leading-none text-center px-0.5',
                    unlocked ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {a.name.slice(0, 4)}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ 学情统计 ═══════════ */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <BarChart3 size={15} className="text-muted-foreground" />
            学习数据
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <StatRow
              icon={<Target size={16} className="text-emerald-500" />}
              label="已通关卡"
              value={String(Object.keys(user.completedLevels).length)}
              sub={`共 ${Object.keys(user.completedLevels).length} 个关卡`}
            />
            <Separator />
            <StatRow
              icon={<Zap size={16} className="text-amber-500" />}
              label="最高连击"
              value={String(user.comboMax)}
              sub={`连击 ${user.comboMax} 次`}
            />
            <Separator />
            <StatRow
              icon={<Trophy size={16} className="text-emerald-500" />}
              label="答题正确率"
              value={`${accuracy}%`}
              sub={`${user.learningStats.correctQuestions}/${user.learningStats.totalQuestions} 题正确`}
            />
            <Separator />
            <StatRow
              icon={<Coins size={16} className="text-amber-500" />}
              label="金币"
              value={String(user.coins)}
              sub={`${user.diamonds} 钻石`}
            />
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ 设置 ═══════════ */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Settings size={15} className="text-muted-foreground" />
            设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <div className="flex items-center gap-3 py-3">
              <span className={clsx(user.settings.sound ? 'text-foreground' : 'text-muted-foreground')}>
                {user.settings.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </span>
              <span className={clsx('flex-1 text-sm', user.settings.sound ? 'text-foreground' : 'text-muted-foreground')}>
                音效
              </span>
              <Switch
                checked={user.settings.sound}
                onCheckedChange={(v) => user.setSettings({ sound: v as boolean })}
              />
            </div>
            <Separator />
            <div className="flex items-center gap-3 py-3">
              <span className={clsx(user.settings.vibration ? 'text-foreground' : 'text-muted-foreground')}>
                {user.settings.vibration ? <Vibrate size={17} /> : <VibrateOff size={17} />}
              </span>
              <span className={clsx('flex-1 text-sm', user.settings.vibration ? 'text-foreground' : 'text-muted-foreground')}>
                震动反馈
              </span>
              <Switch
                checked={user.settings.vibration}
                onCheckedChange={(v) => user.setSettings({ vibration: v as boolean })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ 底部操作 ═══════════ */}
      <div className="flex flex-col gap-2 pt-1">
        <Button
          variant="outline"
          className="w-full h-11 rounded-2xl justify-center gap-2 text-sm font-medium hover:border-destructive hover:text-destructive transition-all"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut size={15} /> 退出登录
        </Button>
        {user.profile.phone && (
          <Button
            variant="ghost"
            className="w-full h-9 rounded-xl justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw size={12} /> 重置存档
          </Button>
        )}
        <p className="text-center text-[10px] text-muted-foreground pt-2">
          算力先锋 MathQuest · v0.1
        </p>
      </div>

      {/* 退出登录确认 */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        message="确定退出登录吗？下次需要重新验证。"
        confirmText="退出"
        onConfirm={() => {
          setShowLogoutConfirm(false)
          // 先清 localStorage，再改状态，避免 persist 回写覆盖
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem('userId')
          localStorage.removeItem('lastPhone')
          user.logout()
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* 重置存档确认 */}
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

// ─── 快捷操作按钮 ───
function QuickAction({ icon, label, bg, text, onClick }: {
  icon: React.ReactNode
  label: string
  bg: string
  text: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white shadow-sm border border-gray-50 hover:shadow-md hover:border-gray-100 transition-all"
    >
      <div className={clsx('w-9 h-9 rounded-full grid place-items-center', bg, text)}>
        {icon}
      </div>
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
    </button>
  )
}

// ─── 统计行 ───
function StatRow({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="flex items-center gap-3 py-3 px-0.5">
      <div className="size-8 rounded-xl bg-muted grid place-items-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground/60">{sub}</div>
      </div>
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
    </div>
  )
}