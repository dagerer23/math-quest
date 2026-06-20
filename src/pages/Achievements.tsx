import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/useUserStore'
import { ACHIEVEMENTS, getAchievementReward } from '@/data/achievements'
import { getAchievements } from '@/services/content'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Lock } from 'lucide-react'
import { Icon } from '@/components/Icon'
import clsx from 'clsx'
import type { Achievement } from '@/types/models'

export default function Achievements() {
  const user = useUserStore()
  const [achievementsMeta, setAchievementsMeta] = useState<Achievement[]>(ACHIEVEMENTS)
  const [selected, setSelected] = useState<Achievement | null>(null)

  useEffect(() => {
    getAchievements()
      .then((list) => { if (list?.length) setAchievementsMeta(list) })
      .catch(() => {})
  }, [])

  const unlockedCount = achievementsMeta.filter(a => user.achievements.some(x => x.id === a.id)).length

  return (
    <div className="flex flex-col gap-3 pt-3 pb-6 px-4">
      <div className="h-1 bg-gradient-to-r from-primary via-duolingo-blue to-primary" />

      {/* 标题 */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-primary" />
          全部成就
        </h1>
        <Badge variant="secondary" className="text-[11px] tabular-nums bg-primary/10 text-primary">
          {unlockedCount}/{achievementsMeta.length}
        </Badge>
      </div>

      {/* 进度条 */}
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-duolingo-blue"
          initial={{ width: 0 }}
          animate={{ width: `${(unlockedCount / achievementsMeta.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* 成就列表 */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {achievementsMeta.map((a, idx) => {
          const unlocked = user.achievements.some(x => x.id === a.id)
          const reward = getAchievementReward(a.id)
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={clsx(
                  'p-4 cursor-pointer transition-all hover:shadow-md',
                  unlocked ? 'bg-primary/5 border-primary/20' : 'opacity-60',
                )}
                onClick={() => setSelected(a)}
              >
                <CardContent className="p-0">
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'size-12 rounded-xl grid place-items-center text-2xl flex-shrink-0',
                      unlocked ? 'bg-primary/10' : 'bg-muted grayscale',
                    )}>
                      {unlocked ? a.icon : <Lock size={20} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={clsx('font-bold text-sm mb-0.5', unlocked ? 'text-foreground' : 'text-muted-foreground')}>
                        {a.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {a.description}
                      </p>
                      {(reward.coins || reward.diamonds || reward.xp) && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {reward.coins && <Badge variant="secondary" className="text-[9px] py-0"><Icon name="coin" size={14} className="inline" /> {reward.coins}</Badge>}
                          {reward.diamonds && <Badge variant="secondary" className="text-[9px] py-0"><Icon name="diamond" size={14} className="inline" /> {reward.diamonds}</Badge>}
                          {reward.xp && <Badge variant="secondary" className="text-[9px] py-0"><Icon name="star" size={14} className="inline" /> {reward.xp}</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* 成就详情弹窗 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }}
              className="bg-background rounded-3xl shadow-2xl border border-border w-full max-w-xs p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-3">{selected.icon}</div>
              <h3 className="text-lg font-bold text-foreground mb-1">{selected.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{selected.description}</p>
              {(() => {
                const r = getAchievementReward(selected.id)
                const parts = []
                if (r.coins) parts.push(`${r.coins} 金币`)
                if (r.diamonds) parts.push(`${r.diamonds} 钻石`)
                if (r.xp) parts.push(`${r.xp} XP`)
                return parts.length > 0 ? (
                  <div className="flex justify-center gap-2 flex-wrap">
                    {parts.map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">{p}</Badge>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">暂无奖励</p>
              })()}
              <Button className="w-full mt-4" onClick={() => setSelected(null)}>知道了</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
