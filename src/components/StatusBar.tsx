import { Heart, Flame, Gift, Gem, Coins, Clock, ArrowRight, Sparkles, ShoppingBag, Star } from 'lucide-react'
import { useUserStore } from '@/store/useUserStore'
import { todayKey } from '@/utils/time'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type PopupType = 'hearts' | 'coins' | 'diamonds' | null

export default function StatusBar() {
  const user = useUserStore()
  const navigate = useNavigate()
  const [popup, setPopup] = useState<PopupType>(null)
  const hasCheckedIn = user.lastCheckInDate === todayKey()
  const heartRecoverMinutes = Number(user.systemConfigs['heart.recover_minutes']) || 30

  const handleCheckIn = () => {
    const result = user.checkIn()
    if (result.message.includes('成功')) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="relative">
      {/* 主状态栏 */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* 左侧：头像 + 昵称 + 等级（点击跳转个人中心） */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 min-w-0 active:opacity-70 transition-opacity"
        >
          <div
            className="size-8 rounded-xl grid place-items-center text-base flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #58CC0218, #58CC0208)',
              boxShadow: '0 2px 6px rgba(88,204,2,0.12)',
            }}
          >
            {user.profile.avatar || '🧮'}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold truncate leading-tight text-foreground">
              {user.profile.nickname || '数学爱好者'}
            </div>
            <div className="flex items-center gap-1 mt-[2px]">
              <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-[1px] rounded-md bg-primary/10 text-primary">
                Lv.{Math.floor(user.xp / 100) + 1}
              </Badge>
              {user.streak > 0 && (
                <span className="flex items-center gap-[2px] text-[9px] font-bold text-orange-500">
                  <Flame size={9} />
                  {user.streak}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* 右侧：资源胶囊 + 签到 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPopup('hearts')}
            aria-label={`心数: ${user.hearts}`}
            className="flex items-center gap-[3px] px-2 py-1 rounded-lg active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: 'linear-gradient(135deg, #FFF0F0, #FFE8E8)' }}
          >
            <Heart size={12} fill="#FF4B4B" stroke="#FF4B4B" />
            <span className="text-[11px] font-extrabold text-red-500 tabular-nums">{user.hearts}</span>
          </button>
          <button
            onClick={() => setPopup('coins')}
            aria-label={`金币: ${user.coins}`}
            className="flex items-center gap-[3px] px-2 py-1 rounded-lg active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: 'linear-gradient(135deg, #FFF8EB, #FFEDC8)' }}
          >
            <Coins size={12} fill="#E5A13B" stroke="#C8891F" />
            <span className="text-[11px] font-extrabold text-amber-600 tabular-nums">{user.coins}</span>
          </button>
          <button
            onClick={() => setPopup('diamonds')}
            aria-label={`钻石: ${user.diamonds}`}
            className="flex items-center gap-[3px] px-2 py-1 rounded-lg active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: 'linear-gradient(135deg, #EEF3FF, #DDE8FF)' }}
          >
            <Gem size={12} fill="#5B8DEF" stroke="#4A7AD4" />
            <span className="text-[11px] font-extrabold text-blue-500 tabular-nums">{user.diamonds}</span>
          </button>

          {/* 签到按钮 */}
          <Button
            size="sm"
            onClick={handleCheckIn}
            disabled={hasCheckedIn}
            variant={hasCheckedIn ? 'ghost' : 'default'}
            className={`h-7 gap-0.5 px-2 text-[9px] font-bold ${!hasCheckedIn ? 'shadow-sm' : ''}`}
          >
            <Gift size={10} />
            {hasCheckedIn ? '已签' : '签到'}
          </Button>
        </div>
      </div>

      {/* ═══════════ 资源详情 Sheet ═══════════ */}
      <Sheet open={!!popup} onOpenChange={(open) => { if (!open) setPopup(null) }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-[420px] mx-auto" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>
              {popup === 'hearts' ? '生命值' : popup === 'coins' ? '金币' : '钻石'}
            </SheetTitle>
            <SheetDescription>
              {popup === 'hearts' ? '答错题会消耗心数' : popup === 'coins' ? '完成关卡和每日目标获得' : '稀有货币，特殊成就获得'}
            </SheetDescription>
          </SheetHeader>

          {/* ── 心数弹窗 ── */}
          {popup === 'hearts' && (
            <div className="px-6 pb-8 pt-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-12 rounded-2xl grid place-items-center" style={{ background: 'linear-gradient(135deg, #FFF0F0, #FFE0E0)' }}>
                  <Heart size={24} fill="#FF4B4B" stroke="#FF4B4B" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">生命值</h3>
                  <p className="text-xs text-muted-foreground">答错题会消耗心数</p>
                </div>
              </div>

              {/* 心数显示 */}
              <div className="flex items-center justify-center gap-1.5 mb-5">
                {Array.from({ length: user.maxHearts }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
                  >
                    <Heart
                      size={28}
                      fill={i < user.hearts ? '#FF4B4B' : '#E8E8E8'}
                      stroke={i < user.hearts ? '#FF4B4B' : '#D4D4D4'}
                    />
                  </motion.div>
                ))}
              </div>

              {/* 恢复提示 */}
              {user.hearts < user.maxHearts && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4" style={{ background: '#FFF8F0' }}>
                  <Clock size={16} className="text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    每{heartRecoverMinutes}分钟自动恢复1颗心
                  </p>
                </div>
              )}

              {/* 补充按钮 */}
              {user.hearts < user.maxHearts && (
                <Button
                  onClick={() => {
                    user.refillHearts()
                    setPopup(null)
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FF4B4B, #E83A3A)',
                    boxShadow: '0 4px 12px rgba(255,75,75,0.3)',
                  }}
                >
                  <Sparkles size={16} />
                  立即补充满 {user.maxHearts} 颗心
                </Button>
              )}

              {user.hearts >= user.maxHearts && (
                <div className="text-center py-3 text-sm font-semibold text-primary">
                  心数已满，去答题吧！
                </div>
              )}
            </div>
          )}

          {/* ── 金币弹窗 ── */}
          {popup === 'coins' && (
            <div className="px-6 pb-8 pt-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-12 rounded-2xl grid place-items-center" style={{ background: 'linear-gradient(135deg, #FFF8EB, #FFEDC8)' }}>
                  <Coins size={24} fill="#E5A13B" stroke="#C8891F" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">金币</h3>
                  <p className="text-xs text-muted-foreground">完成关卡和每日目标获得</p>
                </div>
              </div>

              {/* 金币数量 */}
              <div className="text-center mb-5">
                <span className="text-4xl font-black tabular-nums text-amber-500">{user.coins}</span>
              </div>

              {/* 获取途径 */}
              <div className="flex flex-col gap-2.5 mb-5">
                <h4 className="text-xs font-bold text-muted-foreground">获取途径</h4>
                <CoinSource icon={<Star size={16} className="text-amber-500" />} label="完成关卡" desc="每关首次通关获得金币" />
                <CoinSource icon={<Sparkles size={16} className="text-emerald-500" />} label="每日目标" desc="完成每日目标领取奖励" />
                <CoinSource icon={<Gift size={16} className="text-purple-500" />} label="每日签到" desc="签到可获得随机金币" />
              </div>

              {/* 跳转每日目标 */}
              <Button
                onClick={() => { setPopup(null); setTimeout(() => navigate('/daily-goals'), 200) }}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #E5A13B, #C8891F)',
                  boxShadow: '0 4px 12px rgba(229,161,59,0.3)',
                }}
              >
                去完成每日目标
                <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {/* ── 钻石弹窗 ── */}
          {popup === 'diamonds' && (
            <div className="px-6 pb-8 pt-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-12 rounded-2xl grid place-items-center" style={{ background: 'linear-gradient(135deg, #EEF3FF, #DDE8FF)' }}>
                  <Gem size={24} fill="#5B8DEF" stroke="#4A7AD4" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">钻石</h3>
                  <p className="text-xs text-muted-foreground">稀有货币，特殊成就获得</p>
                </div>
              </div>

              {/* 钻石数量 */}
              <div className="text-center mb-5">
                <span className="text-4xl font-black tabular-nums text-blue-500">{user.diamonds}</span>
              </div>

              {/* 获取途径 */}
              <div className="flex flex-col gap-2.5 mb-5">
                <h4 className="text-xs font-bold text-muted-foreground">获取途径</h4>
                <CoinSource icon={<Star size={16} className="text-amber-500" />} label="满星通关" desc="关卡获得3星评价奖励钻石" />
                <CoinSource icon={<Sparkles size={16} className="text-blue-500" />} label="成就解锁" desc="达成特殊成就获得钻石" />
                <CoinSource icon={<ShoppingBag size={16} className="text-purple-500" />} label="宝箱奖励" desc="开启宝箱有概率获得" />
              </div>

              {/* 跳转成就 */}
              <Button
                onClick={() => { setPopup(null); setTimeout(() => navigate('/profile'), 200) }}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #5B8DEF, #4A7AD4)',
                  boxShadow: '0 4px 12px rgba(91,141,239,0.3)',
                }}
              >
                查看我的成就
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ── 获取途径行 ──
function CoinSource({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted">
      <div className="size-8 rounded-lg bg-background grid place-items-center flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{desc}</div>
      </div>
    </div>
  )
}
