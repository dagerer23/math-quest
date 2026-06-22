import { Calendar } from 'lucide-react'
import { todayKey } from '@/utils/time'
import type { DailyStat } from '@/types/models'
import clsx from 'clsx'

interface HeatmapCalendarProps {
  dailyHistory: DailyStat[]
  days?: number
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

export function HeatmapCalendar({ dailyHistory, days = 30 }: HeatmapCalendarProps) {
  // 生成最近 N 天的日期数组
  const today = new Date()
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
  }

  // 日期到数据的映射
  const dataMap = new Map<string, DailyStat>()
  dailyHistory.forEach((d) => dataMap.set(d.date, d))

  // 统计
  let totalQuestions = 0
  let activeDays = 0
  dates.forEach((date) => {
    const data = dataMap.get(date)
    if (data) {
      totalQuestions += data.questions
      if (data.questions > 0) activeDays++
    }
  })

  // 按周分组（7 天一行）
  const weeks: string[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }

  const todayStr = todayKey()

  return (
    <div>
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={15} className="text-primary" />
          <span className="text-sm font-bold text-foreground">学习日历</span>
        </div>
        <span className="text-[10px] text-muted-foreground">近{days}天 · {activeDays}天活跃 · {totalQuestions}题</span>
      </div>

      {/* 热力图网格 */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((date) => {
              const data = dataMap.get(date)
              const count = data?.questions || 0
              const level = getLevel(count)
              const isToday = date === todayStr
              return (
                <div
                  key={date}
                  className={clsx(
                    'aspect-square rounded-[5px] flex items-center justify-center transition-all',
                    HEATMAP_COLORS[level],
                    isToday && 'ring-1.5 ring-primary ring-offset-1',
                  )}
                  title={`${date}: ${count}题`}
                >
                  {count > 0 && (
                    <span className={clsx('text-[9px] font-bold', HEATMAP_TEXT[level])}>{count}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[10px] text-muted-foreground">{dates[0].slice(5)} - {dates[dates.length - 1].slice(5)}</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">少</span>
          {HEATMAP_COLORS.map((c) => (
            <div key={c} className={clsx('size-2.5 rounded-sm', c)} />
          ))}
          <span className="text-[10px] text-muted-foreground">多</span>
        </div>
      </div>
    </div>
  )
}
