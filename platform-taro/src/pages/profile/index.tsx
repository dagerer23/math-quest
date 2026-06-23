import { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { saveProfile, exportUserData, TOKEN_KEY } from '@/services/auth'
import { getAchievements } from '@/services/content'
import * as classApi from '@/services/classApi'
import type { ClassInfo } from '@/services/classApi'
import { getRankInfo, getNextRankInfo, getRankProgress } from '@/utils/rank'
import { C, TOKEN } from '@/styles/theme'
import { getAvatarUrl } from '@/utils/avatar'
import { Icon } from '@/components/Icon'
import { HeatmapCalendar } from '@/components/ui/HeatmapCalendar'

// 浅主色背景（头像选中 / 成就解锁，对齐 Web 端 primary/10）
const PRIMARY_LIGHT = 'rgba(88,204,2,0.08)'

// 年级标签
const GRADE_LABELS: Record<number, string> = {
  1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级',
  5: '五年级', 6: '六年级', 7: '初一', 8: '初二', 9: '初三',
}

// 头像背景色（按昵称首字符 hash）
function getAvatarBg(name: string): string {
  const colors = ['#58CC02', '#1CB0F6', '#FF4B4B', '#FFC800', '#CE82FF', '#FF8C42', '#00C9A7', '#FF6B9D']
  const code = (name || '?').charCodeAt(0) || 0
  return colors[code % colors.length]
}

export default function ProfilePage() {
  const user = useUserStore()
  const [editing, setEditing] = useState(false)
  const [nickName, setNickName] = useState(user.profile.nickname || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // 班级状态
  const [myClass, setMyClass] = useState<ClassInfo | null>(null)
  const [classLoading, setClassLoading] = useState(false)
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [classTab, setClassTab] = useState<'join' | 'create'>('join')
  const [classCode, setClassCode] = useState('')
  const [className, setClassName] = useState('')
  const [submittingClass, setSubmittingClass] = useState(false)

  useDidShow(() => {
    Taro.setNavigationBarTitle({ title: '我的' })
    // 加载成就元数据
    if (user.achievementsMeta.length === 0) {
      getAchievements().then(list => {
        if (list.length > 0) user.setAchievementsMeta(list)
      }).catch(() => {})
    }
    // 加载班级信息
    if (user.userId) {
      setClassLoading(true)
      classApi.getMyClass(user.userId).then(res => {
        setMyClass(res.class || null)
        setClassLoading(false)
      }).catch(() => setClassLoading(false))
    }
  })

  useEffect(() => {
    setNickName(user.profile.nickname || '')
  }, [user.profile.nickname])

  const rankInfo = getRankInfo(user.xp, user.systemConfigs)
  const nextRank = getNextRankInfo(user.xp, user.systemConfigs)
  const rankProgress = getRankProgress(user.xp, user.systemConfigs)
  // 保存昵称
  const handleSaveName = async () => {
    const newName = nickName.trim() || '数学爱好者'
    user.setProfile({ nickname: newName })
    setEditing(false)
    if (!user.userId) return
    setSavingProfile(true)
    await saveProfile({ userId: user.userId, nickname: newName, avatar: user.profile.avatar })
    setSavingProfile(false)
  }

  // 导出数据（小程序端复制到剪贴板）
  const handleExport = async () => {
    if (!user.userId) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    Taro.showLoading({ title: '导出中...' })
    try {
      const res = await exportUserData(user.userId)
      Taro.hideLoading()
      if (res.success && res.data) {
        const json = JSON.stringify(res.data, null, 2)
        Taro.setClipboardData({
          data: json,
          success: () => Taro.showToast({ title: '数据已复制到剪贴板', icon: 'success' }),
        })
      } else {
        Taro.showToast({ title: res.message || '导出失败', icon: 'none' })
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '导出失败', icon: 'none' })
    }
  }

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定退出登录吗？下次需要重新验证。',
      confirmText: '退出',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync(TOKEN_KEY)
          Taro.removeStorageSync('userId')
          Taro.removeStorageSync('lastPhone')
          user.logout()
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  // 重置存档
  const handleReset = () => {
    Taro.showModal({
      title: '危险操作',
      content: '确定重置所有数据吗？此操作不可撤销。',
      confirmText: '重置',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync(TOKEN_KEY)
          Taro.removeStorageSync('userId')
          user.reset()
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  // 班级操作
  const handleCreateClass = async () => {
    if (!user.userId) { Taro.showToast({ title: '请先登录', icon: 'none' }); return }
    if (!className.trim()) { Taro.showToast({ title: '请输入班级名称', icon: 'none' }); return }
    setSubmittingClass(true)
    const res = await classApi.createClass(user.userId, className.trim())
    setSubmittingClass(false)
    if (res.success && res.class) {
      setMyClass(res.class)
      setShowClassDialog(false)
      setClassName('')
      Taro.showToast({ title: '班级创建成功', icon: 'success' })
    } else {
      Taro.showToast({ title: res.message, icon: 'none' })
    }
  }

  const handleJoinClass = async () => {
    if (!user.userId) { Taro.showToast({ title: '请先登录', icon: 'none' }); return }
    if (!classCode.trim()) { Taro.showToast({ title: '请输入班级码', icon: 'none' }); return }
    setSubmittingClass(true)
    const res = await classApi.joinClass(user.userId, classCode.trim())
    setSubmittingClass(false)
    if (res.success && res.class) {
      setMyClass(res.class)
      setShowClassDialog(false)
      setClassCode('')
      Taro.showToast({ title: '加入班级成功', icon: 'success' })
    } else {
      Taro.showToast({ title: res.message, icon: 'none' })
    }
  }

  const handleLeaveClass = () => {
    Taro.showModal({
      title: '提示',
      content: '确定退出当前班级吗？',
      confirmText: '退出',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm && user.userId && myClass) {
          const result = await classApi.leaveClass(user.userId, myClass.id)
          if (result.success) {
            setMyClass(null)
            Taro.showToast({ title: '已退出班级', icon: 'success' })
          } else {
            Taro.showToast({ title: result.message, icon: 'none' })
          }
        }
      },
    })
  }

  const handleCopyCode = () => {
    if (!myClass) return
    Taro.setClipboardData({
      data: myClass.code,
      success: () => Taro.showToast({ title: '已复制班级码', icon: 'success' }),
    })
  }

  // 切换设置
  const toggleSetting = (key: 'sound' | 'vibration') => {
    user.setSettings({ [key]: !user.settings[key] })
  }

  return (
    <ScrollView scrollY className="taro-fade-in" style={{ minHeight: '100vh', background: C.pageBg }}>
      {/* 顶部渐变条 */}
      <View style={{ height: 3, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.duolingo.blue}, ${C.semantic.primary})` }} />

      <View style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* ═══ 个人信息卡 ═══ */}
        <View style={{ background: C.semantic.card, borderRadius: 16, padding: 16, boxShadow: TOKEN.shadow.md }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
            {/* 头像 */}
            <View>
              <View
                style={{
                  width: 56, height: 56, borderRadius: 28, overflow: 'hidden',
                  borderWidth: 2, borderStyle: 'solid', borderColor: getAvatarBg(user.profile.nickname || '用户'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: PRIMARY_LIGHT,
                }}
              >
                {user.profile.avatar ? (
                  <Image
                    src={user.profile.avatar.startsWith('data:') || user.profile.avatar.startsWith('http')
                      ? user.profile.avatar
                      : getAvatarUrl(user.profile.avatar)}
                    mode="aspectFill"
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Text style={{ fontSize: 22, fontWeight: 700, color: getAvatarBg(user.profile.nickname || '用户') }}>
                    {(user.profile.nickname || '?')[0]}
                  </Text>
                )}
              </View>
            </View>

            {/* 信息 */}
            <View style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Input
                    value={nickName}
                    onInput={(e) => setNickName(e.detail.value)}
                    maxLength={10}
                    placeholder="输入昵称"
                    autoFocus
                    style={{
                      flex: 1, fontSize: 14, height: 36, padding: '0 8px',
                      borderWidth: 1, borderStyle: 'solid', borderColor: C.semantic.border, borderRadius: 8,
                    }}
                  />
                  <View
                    onClick={handleSaveName}
                    style={{
                      width: 36, height: 36, borderRadius: 8, background: C.semantic.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{savingProfile ? '...' : '保存'}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: 700, color: C.semantic.foreground }} numberOfLines={1}>
                    {user.profile.nickname || '同学'}
                  </Text>
                  <View
                    onClick={() => setEditing(true)}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    hoverStyle={{ backgroundColor: C.icon.iconGrayBg }}
                  >
                    <Icon name="pencil" size={14} color={C.semantic.mutedForeground} />
                  </View>
                </View>
              )}

              {/* 段位 */}
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <View style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8, borderRadius: 999, background: rankInfo.color }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: '#FFFFFF' }}>{rankInfo.name}</Text>
                </View>
                {nextRank && (
                  <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>
                    距{nextRank.name}还需{rankProgress.target - rankProgress.current}XP
                  </Text>
                )}
              </View>

              {/* 进度条 */}
              <View style={{ height: 6, background: C.icon.iconGrayBg, borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
                <View style={{ height: '100%', width: `${rankProgress.pct * 100}%`, background: C.semantic.primary, borderRadius: 999 }} />
              </View>

              {/* XP / 年级 */}
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: 500, color: C.semantic.mutedForeground }}>{user.xp} XP</Text>
                <Text style={{ fontSize: 11, color: C.semantic.border }}>|</Text>
                <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{GRADE_LABELS[user.profile.targetGrade] ?? `${user.profile.targetGrade || 1}年级`}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ 数据统计 ═══ */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          {[
            { icon: 'coin', value: user.coins, label: '金币', bg: C.icon.iconGoldBg, color: C.duolingo.gold },
            { icon: 'sparkles', value: user.diamonds, label: '钻石', bg: C.icon.iconBlueBg, color: C.duolingo.blue },
            { icon: 'lightning', value: user.comboMax, label: '最高连击', bg: C.icon.iconRedBg, color: C.semantic.destructive },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, background: C.semantic.card, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: TOKEN.shadow.md }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon name={s.icon} size={16} color={s.color} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: 700, color: C.semantic.foreground }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ═══ 快捷操作 ═══ */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          {[
            { icon: 'trophy', label: '排行榜', bg: C.icon.iconGoldBg, color: C.duolingo.gold, action: () => Taro.switchTab({ url: '/pages/leaderboard/index' }) },
            { icon: 'medal', label: '成就', bg: C.icon.iconGreenBg, color: C.semantic.primary, action: () => Taro.navigateTo({ url: '/pages/achievements/index' }) },
            { icon: 'chart', label: '学习统计', bg: C.icon.iconPurpleBg, color: C.duolingo.purple, action: () => Taro.navigateTo({ url: '/pages/stats/index' }) },
          ].map((a) => (
            <View
              key={a.label}
              className="taro-btn-press"
              onClick={a.action}
              hoverStyle={{ opacity: 0.8, backgroundColor: C.semantic.muted }}
              style={{ flex: 1, background: C.semantic.card, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderWidth: 1, borderStyle: 'solid', borderColor: C.semantic.border, boxShadow: TOKEN.shadow.md }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.icon} size={18} color={a.color} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: 500, color: C.semantic.mutedForeground }}>{a.label}</Text>
            </View>
          ))}
        </View>

        {/* ═══ 学习日历热力图 ═══ */}
        <View style={{ background: C.semantic.card, borderRadius: 16, padding: 16, boxShadow: TOKEN.shadow.md }}>
          <HeatmapCalendar dailyHistory={user.dailyHistory} />
        </View>

        {/* ═══ 我的班级 ═══ */}
        <View style={{ background: C.semantic.card, borderRadius: 16, padding: 16, boxShadow: TOKEN.shadow.md }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Icon name="users" size={14} color={C.duolingo.blue} />
            <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>我的班级</Text>
          </View>
          {classLoading ? (
            <Text style={{ fontSize: 13, color: C.semantic.mutedForeground, textAlign: 'center', padding: 16 }}>加载中...</Text>
          ) : myClass ? (
            <View>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>{myClass.name}</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>班级码:</Text>
                    <View style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6, borderRadius: 4, background: C.icon.iconGrayBg }}>
                      <Text style={{ fontSize: 12, color: C.semantic.foreground, fontFamily: 'monospace' }}>{myClass.code}</Text>
                    </View>
                    <View onClick={handleCopyCode}><Icon name="clipboard" size={12} color={C.semantic.primary} /></View>
                  </View>
                </View>
                <View style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8, borderRadius: 999, background: C.icon.iconGrayBg }}>
                  <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{myClass.memberCount}人</Text>
                </View>
              </View>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <View
                  onClick={() => Taro.switchTab({ url: '/pages/leaderboard/index' })}
                  style={{ flex: 1, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: C.semantic.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, color: C.semantic.foreground }}>同学榜</Text>
                </View>
                <View
                  onClick={handleLeaveClass}
                  style={{ flex: 1, height: 36, borderRadius: 8, background: C.icon.iconGrayBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, color: C.semantic.mutedForeground }}>退出班级</Text>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 13, color: C.semantic.mutedForeground, marginBottom: 12 }}>加入班级，和同学一起学习</Text>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <View
                  onClick={() => { setClassTab('join'); setShowClassDialog(true) }}
                  style={{ flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: C.semantic.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, color: C.semantic.foreground }}>加入班级</Text>
                </View>
                <View
                  onClick={() => { setClassTab('create'); setShowClassDialog(true) }}
                  style={{ flex: 1, height: 40, borderRadius: 8, background: C.semantic.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, color: '#fff' }}>创建班级</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ═══ 设置 ═══ */}
        <View style={{ background: C.semantic.card, borderRadius: 16, padding: 16, boxShadow: TOKEN.shadow.md }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Icon name="settings" size={14} color={C.semantic.foreground} />
            <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>设置</Text>
          </View>
          {/* 音效 */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: C.semantic.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, background: user.settings.sound ? C.icon.iconGreenBg : C.icon.iconGrayBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={user.settings.sound ? 'soundOn' : 'soundOff'} size={18} color={user.settings.sound ? C.semantic.primary : C.semantic.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: C.semantic.foreground }}>音效</Text>
              <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{user.settings.sound ? '已开启' : '已关闭'}</Text>
            </View>
            <View
              onClick={() => toggleSetting('sound')}
              style={{
                width: 48, height: 28, borderRadius: 14, padding: 3,
                background: user.settings.sound ? C.semantic.primary : '#E5E7EB',
                display: 'flex', flexDirection: 'row', alignItems: 'center',
                justifyContentContent: user.settings.sound ? 'flex-end' : 'flex-start',
              }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
            </View>
          </View>
          {/* 震动 */}
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: C.semantic.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, background: user.settings.vibration ? C.icon.iconGreenBg : C.icon.iconGrayBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={user.settings.vibration ? 'vibrateOn' : 'vibrateOff'} size={18} color={user.settings.vibration ? C.semantic.primary : C.semantic.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: C.semantic.foreground }}>震动反馈</Text>
              <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>{user.settings.vibration ? '已开启' : '已关闭'}</Text>
            </View>
            <View
              onClick={() => toggleSetting('vibration')}
              style={{
                width: 48, height: 28, borderRadius: 14, padding: 3,
                background: user.settings.vibration ? C.semantic.primary : '#E5E7EB',
                display: 'flex', flexDirection: 'row', alignItems: 'center',
                justifyContentContent: user.settings.vibration ? 'flex-end' : 'flex-start',
              }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
            </View>
          </View>
          {/* 导出数据 */}
          <View
            onClick={handleExport}
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: C.semantic.border }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, background: C.icon.iconBlueBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="download" size={18} color={C.duolingo.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: C.semantic.foreground }}>导出我的数据</Text>
              <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>复制学习记录到剪贴板</Text>
            </View>
            <Icon name="chevronRight" size={14} color={C.semantic.mutedForeground} />
          </View>
        </View>

        {/* ═══ 底部操作 ═══ */}
        <View style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          <View
            className="taro-btn-press"
            onClick={handleLogout}
            style={{
              height: 44, borderRadius: 12, borderWidth: 1, borderStyle: 'solid', borderColor: C.semantic.border,
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: 500, color: C.semantic.destructive }}>退出登录</Text>
          </View>
          {user.profile.phone ? (
            <View
              onClick={handleReset}
              style={{ height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>重置存档</Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 10, color: C.semantic.mutedForeground, textAlign: 'center', paddingTop: 8 }}>
            算力先锋 MathQuest · v0.1
          </Text>
        </View>
      </View>

      {/* ═══ 班级弹窗 ═══ */}
      {showClassDialog && (
        <View
          onClick={() => !submittingClass && setShowClassDialog(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
          }}
        >
          <View
            className="taro-pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', background: '#fff', borderRadius: 16, padding: 16, boxShadow: TOKEN.shadow.md }}
          >
            {/* 标题 */}
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${C.semantic.border}` }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: C.semantic.foreground }}>
                {classTab === 'join' ? '加入班级' : '创建班级'}
              </Text>
              <View onClick={() => !submittingClass && setShowClassDialog(false)}><Icon name="x" size={16} color={C.semantic.mutedForeground} /></View>
            </View>

            {/* Tab 切换 */}
            <View style={{ display: 'flex', flexDirection: 'row', gap: 8, paddingTop: 12 }}>
              {(['join', 'create'] as const).map(tab => (
                <View
                  key={tab}
                  onClick={() => setClassTab(tab)}
                  style={{
                    flex: 1, height: 36, borderRadius: 8,
                    background: classTab === tab ? C.semantic.primary : C.icon.iconGrayBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: 500, color: classTab === tab ? '#fff' : C.semantic.mutedForeground }}>
                    {tab === 'join' ? '加入班级' : '创建班级'}
                  </Text>
                </View>
              ))}
            </View>

            {/* 输入区 */}
            <View style={{ paddingTop: 16, paddingBottom: 16 }}>
              {classTab === 'join' ? (
                <View>
                  <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginBottom: 8 }}>输入班级码</Text>
                  <Input
                    value={classCode}
                    onInput={(e) => setClassCode(e.detail.value.toUpperCase())}
                    placeholder="例如：ABC123"
                    maxLength={12}
                    style={{
                      fontSize: 16, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 2,
                      height: 44, padding: '0 16px', borderRadius: 12,
                      borderWidth: 1, borderStyle: 'solid', borderColor: C.semantic.border,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 8 }}>向老师或同学获取班级码</Text>
                </View>
              ) : (
                <View>
                  <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginBottom: 8 }}>班级名称</Text>
                  <Input
                    value={className}
                    onInput={(e) => setClassName(e.detail.value)}
                    placeholder="例如：三年级一班"
                    maxLength={20}
                    style={{
                      fontSize: 16, height: 44, padding: '0 16px', borderRadius: 12,
                      borderWidth: 1, borderStyle: 'solid', borderColor: C.semantic.border,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 8 }}>创建后可分享班级码给同学加入</Text>
                </View>
              )}
              <View
                className="taro-btn-press"
                onClick={classTab === 'join' ? handleJoinClass : handleCreateClass}
                style={{
                  height: 44, borderRadius: 12, background: C.semantic.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16,
                  opacity: submittingClass ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {submittingClass ? '处理中...' : classTab === 'join' ? '加入' : '创建'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
