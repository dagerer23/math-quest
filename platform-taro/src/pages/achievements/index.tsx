import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { getAchievements } from '@/services/content'
import { getAchievementReward } from '@/data/achievements'
import { C, TOKEN } from '@/styles/theme'
import { Icon } from '@/components/Icon'

const PRIMARY_LIGHT = 'rgba(88,204,2,0.08)'

export default function AchievementsPage() {
  const user = useUserStore()
  const achievementsMeta = user.achievementsMeta
  const [selected, setSelected] = useState<any>(null)

  useDidShow(() => {
    if (user.achievementsMeta.length === 0) {
      getAchievements().then(list => {
        if (list.length > 0) user.setAchievementsMeta(list)
      }).catch(() => {})
    }
  })

  const unlockedCount = achievementsMeta.filter(a => user.achievements.some(x => x.id === a.id)).length
  const totalPct = achievementsMeta.length > 0 ? (unlockedCount / achievementsMeta.length) * 100 : 0

  return (
    <ScrollView scrollY className="taro-fade-in" style={{ minHeight: '100vh', background: C.pageBg }}>
      {/* 顶部渐变条 */}
      <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      {/* 标题 */}
      <View style={{ padding: '16px 16px 8px', paddingTop: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: 700, color: C.semantic.foreground }}>全部成就</Text>
        <View style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 10, paddingRight: 10, borderRadius: 999, background: PRIMARY_LIGHT }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: C.semantic.primary }}>{unlockedCount}/{achievementsMeta.length}</Text>
        </View>
      </View>

      {/* 进度条 */}
      <View style={{ padding: '0 16px', marginBottom: 12 }}>
        <View style={{ height: 10, background: C.semantic.border, borderRadius: 999, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${totalPct}%`, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary})`, borderRadius: 999 }} />
        </View>
      </View>

      {/* 成就列表 */}
      <View style={{ padding: '0 16px', paddingBottom: 32, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {achievementsMeta.map((a) => {
          const unlocked = user.achievements.some((x) => x.id === a.id)
          const r = getAchievementReward(a.id)
          return (
            <View
              key={a.id}
              onClick={() => setSelected(a)}
              className="taro-btn-press"
              style={{
                width: '100%', borderRadius: 16, padding: 14,
                background: unlocked ? PRIMARY_LIGHT : C.semantic.card,
                borderWidth: 1, borderStyle: 'solid',
                borderColor: unlocked ? 'rgba(88,204,2,0.2)' : C.semantic.border,
                boxShadow: TOKEN.shadow.md,
                display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                opacity: unlocked ? 1 : 0.6,
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: unlocked ? 'rgba(88,204,2,0.1)' : C.icon.iconGrayBg,
              }}>
                {unlocked ? <Icon name={a.icon} size={24} color={C.semantic.foreground} /> : <Icon name="lock" size={24} color={C.semantic.mutedForeground} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontWeight: 700, color: unlocked ? C.semantic.foreground : C.semantic.mutedForeground }}>{a.name}</Text>
                <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 2 }}>{a.description}</Text>
                {(r.coins || r.diamonds || r.xp) && (
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {r.coins && (
                      <View style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8, borderRadius: 999, background: C.icon.iconGoldBg, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Icon name="coin" size={12} color={C.duolingo.gold} />
                        <Text style={{ fontSize: 10, color: C.semantic.foreground }}>{r.coins}</Text>
                      </View>
                    )}
                    {r.diamonds && (
                      <View style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8, borderRadius: 999, background: C.icon.iconBlueBg, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Icon name="diamond" size={12} color={C.duolingo.blue} />
                        <Text style={{ fontSize: 10, color: C.semantic.foreground }}>{r.diamonds}</Text>
                      </View>
                    )}
                    {r.xp && (
                      <View style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8, borderRadius: 999, background: C.icon.iconGoldBg, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Icon name="star" size={12} color={C.duolingo.gold} />
                        <Text style={{ fontSize: 10, color: C.semantic.foreground }}>{r.xp}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          )
        })}
      </View>

      {/* 成就详情弹窗 */}
      {selected && (
        <View
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
          }}
        >
          <View
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.semantic.card, borderRadius: 24, padding: 24, width: '100%', maxWidth: 280,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}
          >
            <Icon name={selected.icon} size={48} color={C.semantic.foreground} />
            <Text style={{ fontSize: 18, fontWeight: 700, color: C.semantic.foreground }}>{selected.name}</Text>
            <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, textAlign: 'center' }}>{selected.description}</Text>
            {(() => {
              const r = getAchievementReward(selected.id)
              const parts = []
              if (r.coins) parts.push(`${r.coins} 金币`)
              if (r.diamonds) parts.push(`${r.diamonds} 钻石`)
              if (r.xp) parts.push(`${r.xp} XP`)
              return parts.length > 0 ? (
                <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                  {parts.map((p, i) => (
                    <View key={i} style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8, borderRadius: 999, background: C.icon.iconGrayBg }}>
                      <Text style={{ fontSize: 11, color: C.semantic.foreground }}>{p}</Text>
                    </View>
                  ))}
                </View>
              ) : <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>暂无奖励</Text>
            })()}
            <View
              onClick={() => setSelected(null)}
              className="taro-btn-press"
              style={{
                marginTop: 12, width: '100%', height: 44, borderRadius: 12,
                background: C.semantic.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>知道了</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
