import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/useUserStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2, VolumeX, Vibrate, VibrateOff, Edit2, Save, RotateCcw,
  Settings, LogOut, Trophy, Zap, Target, Coins,
  BookOpen, BarChart3, Swords, X, Crown, Sparkles, Download,
  Users, UserPlus, ArrowRight, Flower2, Copy, Check, ChevronRight,
} from 'lucide-react'
import { getAvatarUrl, getAvatarBorderColor, getInitial, getAvatarBgColor, getAvatarTextColor } from '@/utils/avatar'
import { saveProfile, exportUserData } from '@/services/auth'
import { getRankInfo, getNextRankInfo, getRankProgress } from '@/utils/rank'
import { handleApiError } from '@/utils/apiError'
import { toast } from 'sonner'
import clsx from 'clsx'
import ConfirmDialog from '@/components/ConfirmDialog'
import { TOKEN_KEY } from '@/services/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import * as classApi from '@/services/classApi'
import type { ClassInfo } from '@/services/classApi'

const AVATAR_SEEDS = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia']

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
  const [exporting, setExporting] = useState(false)
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [showLeaveClassConfirm, setShowLeaveClassConfirm] = useState(false)
  const [myClass, setMyClass] = useState<ClassInfo | null>(null)
  const [classLoading, setClassLoading] = useState(false)
  const [classDialogTab, setClassDialogTab] = useState<'join' | 'create'>('join')
  const [classCode, setClassCode] = useState('')
  const [className, setClassName] = useState('')
  const [submittingClass, setSubmittingClass] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // 加载班级信息
  useEffect(() => {
    if (user.userId) {
      setClassLoading(true)
      classApi.getMyClass(user.userId).then((res) => {
        setMyClass(res.class || null)
        setClassLoading(false)
      }).catch(() => setClassLoading(false))
    }
  }, [user.userId])

  const handleCreateClass = async () => {
    if (!user.userId) return
    if (!className.trim()) { toast.error('请输入班级名称'); return }
    setSubmittingClass(true)
    const res = await classApi.createClass(user.userId, className.trim())
    setSubmittingClass(false)
    if (res.success && res.class) {
      setMyClass(res.class)
      setShowClassDialog(false)
      setClassName('')
      toast.success('班级创建成功')
    } else {
      toast.error(res.message)
    }
  }

  const handleJoinClass = async () => {
    if (!user.userId) return
    if (!classCode.trim()) { toast.error('请输入班级码'); return }
    setSubmittingClass(true)
    const res = await classApi.joinClass(user.userId, classCode.trim())
    setSubmittingClass(false)
    if (res.success && res.class) {
      setMyClass(res.class)
      setShowClassDialog(false)
      setClassCode('')
      toast.success('加入班级成功')
    } else {
      toast.error(res.message)
    }
  }

  const handleLeaveClass = async () => {
    if (!user.userId || !myClass) return
    const res = await classApi.leaveClass(user.userId, myClass.id)
    if (res.success) {
      setMyClass(null)
      setShowLeaveClassConfirm(false)
      toast.success('已退出班级')
    } else {
      toast.error(res.message)
    }
  }

  const handleCopyCode = async () => {
    if (!myClass) return
    try {
      await navigator.clipboard.writeText(myClass.code)
      setCopiedCode(true)
      toast.success('已复制班级码')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

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

  const handleExport = async () => {
    if (!user.userId) return
    setExporting(true)
    try {
      const res = await exportUserData(user.userId)
      if (!res.success || !res.data) {
        handleApiError(new Error(res.message), '导出失败')
        return
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mathquest-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('数据导出成功')
    } catch (err) {
      handleApiError(err, '导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-1 bg-gradient-to-r from-primary via-duolingo-blue to-primary" />

      {/* 头部 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold text-foreground">我的</h1>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
        {/* ═══════════ 个人信息卡 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* 头像 */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="rounded-full border-2 overflow-hidden hover:border-primary/50 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-[transform,border-color] duration-200"
                    style={{ borderColor: getAvatarBorderColor(user.profile.nickname || '用户') }}
                  >
                    <div className="size-14">
                      <img src={getAvatarUrl(user.profile.nickname || '用户')} alt="" className="w-full h-full" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden') }} />
                      <div className="hidden w-full h-full items-center justify-center text-lg font-bold" style={{ background: getAvatarBgColor(user.profile.nickname || '用户'), color: getAvatarTextColor(user.profile.nickname || '用户') }}>
                        {getInitial(user.profile.nickname || '用户')}
                      </div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {showAvatarPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-60 bg-card rounded-2xl shadow-xl border border-border p-3 z-50"
                      >
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-xs font-bold text-foreground">选择头像</span>
                          <button onClick={() => setShowAvatarPicker(false)} className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {AVATAR_SEEDS.map((seed) => (
                            <button
                              key={seed}
                              onClick={() => handleSelectAvatar(seed)}
                              className={clsx(
                                'aspect-square rounded-xl overflow-hidden transition-[opacity,transform] duration-200 focus-visible:ring-2 focus-visible:ring-ring',
                                user.profile.avatar === seed
                                  ? 'ring-2 ring-primary'
                                  : 'hover:opacity-80',
                              )}
                            >
                              <img src={getAvatarUrl(seed)} alt={seed} className="w-full h-full" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        aria-label="昵称"
                        autoFocus
                      />
                      <Button
                        size="icon-sm"
                        variant="default"
                        onClick={handleSaveName}
                        disabled={savingProfile}
                      >
                        {savingProfile ? (
                          <div className="size-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2 className="font-bold text-base text-foreground truncate max-w-[160px]">{user.profile.nickname}</h2>
                      <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring" aria-label="编辑昵称">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* 段位 */}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      <Crown size={10} className="mr-1" />
                      {rankInfo.name}
                    </Badge>
                    {nextRank && (
                      <span className="text-[10px] text-muted-foreground">
                        距 {nextRank.name} 还需 {rankProgress.target - rankProgress.current} XP
                      </span>
                    )}
                  </div>

                  {/* 进度条 */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${rankProgress.pct * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>

                  {/* XP / 年级 */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="font-medium">{user.xp.toLocaleString()} XP</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>{user.profile.targetGrade}年级</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════ 数据统计 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2.5"
        >
          <StatCard
            icon={<Coins size={18} />}
            value={user.coins}
            label="金币"
            iconBg="bg-[#FFF5D6]"
            iconColor="text-[#FFC800]"
          />
          <StatCard
            icon={<Sparkles size={18} />}
            value={user.diamonds}
            label="钻石"
            iconBg="bg-[#E0F4FF]"
            iconColor="text-[#1CB0F6]"
          />
          <StatCard
            icon={<Zap size={18} />}
            value={user.comboMax}
            label="最高连击"
            iconBg="bg-[#FFE4E4]"
            iconColor="text-[#FF4B4B]"
          />
        </motion.div>

        {/* ═══════════ 快捷操作 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-4 gap-2.5"
        >
          <QuickAction
            icon={<Trophy size={20} />}
            label="排行榜"
            iconBg="bg-[#FFF5D6]"
            iconColor="text-[#FFC800]"
            onClick={() => navigate('/leaderboard')}
          />
          <QuickAction
            icon={<BookOpen size={20} />}
            label="错题本"
            iconBg="bg-[#E0F4FF]"
            iconColor="text-[#1CB0F6]"
            onClick={() => navigate('/mistakes')}
          />
          <QuickAction
            icon={<BarChart3 size={20} />}
            label="学习统计"
            iconBg="bg-[#F3E8FF]"
            iconColor="text-[#CE82FF]"
            onClick={() => navigate('/stats')}
          />
          <QuickAction
            icon={<Swords size={20} />}
            label="闯关冒险"
            iconBg="bg-[#FFE4E4]"
            iconColor="text-[#FF4B4B]"
            onClick={() => navigate('/')}
          />
        </motion.div>

        {/* ═══════════ 成就墙 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Trophy size={15} className="text-primary" />
                  成就
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {user.achievements.length}/{achievementsMeta.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {achievementsMeta.map((a, idx) => {
                  const unlocked = user.achievements.some((x) => x.id === a.id)
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={unlocked
                        ? { opacity: 1, scale: [1, 1.02, 1] }
                        : { opacity: 1, scale: 1 }
                      }
                      transition={unlocked
                        ? { delay: 0.25 + idx * 0.02, duration: 2, repeat: Infinity }
                        : { delay: 0.25 + idx * 0.02 }
                      }
                      className={clsx(
                        'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-[background-color,border-color,opacity,filter] duration-200',
                        unlocked
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted border border-border opacity-40 grayscale',
                      )}
                      title={unlocked ? `${a.name} · ${a.description}` : `${a.name}（未解锁）`}
                    >
                      <span className={clsx('text-lg', !unlocked && 'grayscale opacity-40')}>
                        {a.icon}
                      </span>
                      <span className={clsx(
                        'text-[9px] font-medium leading-none text-center px-0.5 min-h-[1.25rem]',
                        unlocked ? 'text-foreground' : 'text-muted-foreground',
                      )}>
                        {a.name.slice(0, 4)}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════ 学情统计 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
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
                  icon={<Target size={16} className="text-primary" />}
                  label="已通关卡"
                  value={String(Object.keys(user.completedLevels).length)}
                  sub={`共 ${Object.keys(user.completedLevels).length} 个关卡`}
                />
                <Separator />
                <StatRow
                  icon={<Zap size={16} className="text-primary" />}
                  label="最高连击"
                  value={String(user.comboMax)}
                  sub={`连击 ${user.comboMax} 次`}
                />
                <Separator />
                <StatRow
                  icon={<Trophy size={16} className="text-fuchsia-500" />}
                  label="答题正确率"
                  value={`${accuracy}%`}
                  sub={`${user.learningStats.correctQuestions}/${user.learningStats.totalQuestions} 题正确`}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════ 我的班级 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Users size={15} className="text-primary" />
                我的班级
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">加载中...</div>
              ) : myClass ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">{myClass.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>班级码:</span>
                        <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">{myClass.code}</code>
                        <button onClick={handleCopyCode} className="hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label="复制班级码">
                          {copiedCode ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <Badge variant="secondary">{myClass.memberCount} 人</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/leaderboard')}
                      className="gap-1.5 justify-center"
                    >
                      <Flower2 size={12} /> 同学榜
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLeaveClassConfirm(true)}
                      className="gap-1.5 justify-center"
                    >
                      退出班级
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">加入班级，和同学一起学习</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setClassDialogTab('join'); setShowClassDialog(true) }}
                      className="gap-1.5 justify-center text-sm"
                    >
                      <UserPlus size={14} /> 加入班级
                    </Button>
                    <Button
                      onClick={() => { setClassDialogTab('create'); setShowClassDialog(true) }}
                      className="gap-1.5 justify-center text-sm"
                    >
                      <Users size={14} /> 创建班级
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════ 设置 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Settings size={15} className="text-muted-foreground" />
                设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <SettingRow
                  icon={user.settings.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
                  label="音效"
                  active={user.settings.sound}
                  onChange={(v) => user.setSettings({ sound: v })}
                />
                <Separator />
                <SettingRow
                  icon={user.settings.vibration ? <Vibrate size={17} /> : <VibrateOff size={17} />}
                  label="震动反馈"
                  active={user.settings.vibration}
                  onChange={(v) => user.setSettings({ vibration: v })}
                />
                <Separator />
                <Button
                  variant="outline"
                  className="w-full h-9 rounded-xl justify-center gap-1.5 text-sm font-medium"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <Download size={14} /> {exporting ? '导出中...' : '导出我的数据'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════ 底部操作 ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-2.5 pt-1"
        >
          <Button
            variant="outline"
            className="w-full h-11 rounded-2xl justify-center gap-2 text-sm font-medium hover:border-destructive hover:text-destructive transition-[color,border-color,background-color] duration-200"
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
        </motion.div>
      </div>

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

      <ConfirmDialog
        isOpen={showLeaveClassConfirm}
        message="确定退出当前班级吗？"
        confirmText="退出"
        onConfirm={handleLeaveClass}
        onCancel={() => setShowLeaveClassConfirm(false)}
      />

      <AnimatePresence>
        {showClassDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !submittingClass && setShowClassDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-background rounded-2xl shadow-xl border border-border w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold text-foreground">
                  {classDialogTab === 'join' ? '加入班级' : '创建班级'}
                </h3>
                <button onClick={() => !submittingClass && setShowClassDialog(false)} className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label="关闭">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 p-4 pt-3">
                <button
                  onClick={() => setClassDialogTab('join')}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    classDialogTab === 'join' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  加入班级
                </button>
                <button
                  onClick={() => setClassDialogTab('create')}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    classDialogTab === 'create' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  创建班级
                </button>
              </div>

              <div className="px-4 pb-4 space-y-3">
                {classDialogTab === 'join' ? (
                  <>
                    <label className="text-xs text-muted-foreground">输入班级码</label>
                    <Input
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      placeholder="例如：ABC123"
                      className="font-mono uppercase text-center tracking-widest"
                      maxLength={12}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">向老师或同学获取班级码</p>
                  </>
                ) : (
                  <>
                    <label className="text-xs text-muted-foreground">班级名称</label>
                    <Input
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="例如：三年级一班"
                      maxLength={20}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">创建后可分享班级码给同学加入</p>
                  </>
                )}

                <Button
                  onClick={classDialogTab === 'join' ? handleJoinClass : handleCreateClass}
                  disabled={submittingClass}
                  className="w-full mt-2"
                >
                  {submittingClass ? '处理中...' : classDialogTab === 'join' ? '加入' : '创建'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── 统计卡片 ───
function StatCard({ icon, value, label, iconBg, iconColor }: {
  icon: React.ReactNode
  value: number | string
  label: string
  iconBg?: string
  iconColor?: string
}) {
  return (
    <Card className="p-3 text-center">
      <CardContent className="p-0">
        <div className={clsx('inline-flex items-center justify-center size-8 rounded-[10px] mb-2', iconBg || 'bg-[#FFF5D6]', iconColor || 'text-[#FFC800]')}>
          {icon}
        </div>
        <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

// ─── 快捷操作按钮 ───
function QuickAction({ icon, label, iconBg, iconColor, onClick }: {
  icon: React.ReactNode
  label: string
  iconBg?: string
  iconColor?: string
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card shadow-sm border border-border hover:shadow-md transition-[box-shadow,transform] duration-200"
    >
      <div className={clsx('size-8 rounded-[10px] grid place-items-center', iconBg || 'bg-[#E0F4FF]', iconColor || 'text-[#1CB0F6]')}>
        {icon}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </motion.button>
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
      <div className="size-8 rounded-xl bg-[#E8F9D8] grid place-items-center flex-shrink-0">
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

// ─── 设置行 ───
function SettingRow({ icon, label, active, onChange }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={clsx(active ? 'text-foreground' : 'text-muted-foreground')}>
        {icon}
      </span>
      <span className={clsx('flex-1 text-sm', active ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <motion.div whileTap={{ scale: 0.9 }}>
        <Switch
          checked={active}
          onCheckedChange={(v) => onChange(v as boolean)}
        />
      </motion.div>
    </div>
  )
}
