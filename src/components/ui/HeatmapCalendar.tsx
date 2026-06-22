import { Calendar } from 'lucide-react'
import { todayKey } from '@/utils/time'
import type { DailyStat } from '@/types/models'
import clsx from 'clsx'

interface HeatmapCalendarProps {
  dailyHistory: DailyStat[]
}

// 热力图颜色等级（Duolingo 绿色系）
const HEATMAP_COLORS = ['bg-[#EBEDF0]', 'bg-[#9BE9A8]', 'bg-[#58CC02]', 'bg-[#46A302]']
const HEATMAP_TEXT = ['text-[#3C3C3C]', 'text-[#3C3C3C]', 'text-white', 'text-white']

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 5) return 1
  if (count <= 15) return 2
  return 3
}

// 星期标签
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export function HeatmapCalendar({ dailyHistory }: HeatmapCalendarProps) {
  const today = new Date()
  const todayStr = todayKey()

  // 日期到数据的映射
  const dataMap = new Map<string, DailyStat>()
  dailyHistory.forEach((d) => dataMap.set(d.date, d))

  // 本月活跃天数
  const year = today.getFullYear()
  const month = today.getMonth() // 0-11
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  let monthActiveDays = 0
  dailyHistory.forEach((d) => {
    if (d.date.startsWith(monthPrefix) && d.questions > 0) monthActiveDays++
  })

  // 本月已过天数（含今天）
  const daysInMonthSoFar = today.getDate()

  // 进度环比例
  const ringProgress = daysInMonthSoFar > 0 ? monthActiveDays / daysInMonthSoFar : 0
  const circumference = 2 * Math.PI * 36
  const dashoffset = circumference * (1 - ringProgress)

  // 动态文案
  let mainTitle = '还有时间，今天就开始吧'
  if (ringProgress >= 0.8) mainTitle = '本月坚持得不错'
  else if (ringProgress >= 0.5) mainTitle = '保持节奏，继续加油'

  // 近7天数据（今天为终点倒推）
  const recent7: { date: string; count: number; isToday: boolean; weekLabel: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${day}`
    const data = dataMap.get(dateStr)
    recent7.push({
      date: dateStr,
      count: data?.questions || 0,
      isToday: dateStr === todayStr,
      weekLabel: WEEK_LABELS[d.getDay()],
    })
  }

  // 近7天统计
  const recent7Total = recent7.reduce((s, d) => s + d.count, 0)
  const recent7Active = recent7.filter((d) => d.count > 0).length
  const maxCount = Math.max(...recent7.map((d) => d.count), 1)

  // 日期范围
  const monthLabel = String(month + 1).padStart(2, '0')
  const rangeStr = `${monthLabel}.01 - ${monthLabel}.${String(today.getDate()).padStart(2, '0')}`

  return (
    <div>
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-primary" />
          <span className="text-sm font-bold text-foreground">学习日历</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{rangeStr}</span>
      </div>

      {/* 进度环区 */}
      <div className="flex items-center gap-4">
        <div className="relative w-[84px] h-[84px] shrink-0">
          <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
            <circle cx="42" cy="42" r="36" fill="none" stroke="#EBEDF0" strokeWidth="8" />
            <circle
              cx="42"
              cy="42"
              r="36"
              fill="none"
              stroke="#58CC02"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[26px] font-extrabold text-foreground leading-none">{monthActiveDays}</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">活跃天</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-foreground mb-1">{mainTitle}</div>
          <div className="text-[11px] text-muted-foreground leading-[1.5]">
            {monthLabel}月已过 {daysInMonthSoFar} 天，你练习了 {monthActiveDays} 天
            <br />
            继续保持，养成学习好习惯
          </div>
        </div>
      </div>

      {/* 近7天条形图区 */}
      <div className="mt-4 pt-3.5 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground">近 7 天</span>
          <span className="text-[10px] text-muted-foreground">共 {recent7Total} 题 · 活跃 {recent7Active} 天</span>
        </div>
        <div className="flex gap-1.5 items-end h-11">
          {recent7.map((d) => {
            const level = getLevel(d.count)
            const heightPct = d.count === 0 ? 8 : Math.max(15, (d.count / maxCount) * 100)
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={clsx(
                    'w-full rounded-[4px] flex items-end justify-center pb-0.5',
                    HEATMAP_COLORS[level],
                    d.isToday && 'ring-1.5 ring-primary',
                  )}
                  style={{ height: `${heightPct}%` }}
                  title={`${d.date}: ${d.count}题`}
                >
                  {d.count > 0 && (
                    <span className={clsx('text-[9px] font-bold', HEATMAP_TEXT[level])}>{d.count}</span>
                  )}
                </div>
                <span className={clsx('text-[9px]', d.isToday ? 'text-primary font-bold' : 'text-muted-foreground')}>
                  {d.weekLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
