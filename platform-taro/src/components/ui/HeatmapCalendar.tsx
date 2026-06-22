import { View, Text } from '@tarojs/components'
import { Icon } from '@/components/Icon'
import { C } from '@/styles/theme'
import { todayKey } from '@/utils/time'
import type { DailyStat } from '@/types/models'

interface HeatmapCalendarProps {
  dailyHistory: DailyStat[]
  days?: number
}

// 热力图颜色等级（Duolingo 绿色系）
const HEATMAP_COLORS = ['#EBEDF0', '#9BE9A8', '#58CC02', '#46A302']

function getColor(count: number): string {
  if (count === 0) return HEATMAP_COLORS[0]
  if (count <= 5) return HEATMAP_COLORS[1]
  if (count <= 15) return HEATMAP_COLORS[2]
  return HEATMAP_COLORS[3]
}

function getText(count: number): string {
  return count > 5 ? '#FFFFFF' : '#3C3C3C'
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

  // 统计近 N 天总答题数和活跃天数
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
    <View>
      {/* 标题行 */}
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="calendar" size={14} color={C.semantic.primary} />
          <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>学习日历</Text>
        </View>
        <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>近{days}天 · {activeDays}天活跃 · {totalQuestions}题</Text>
      </View>

      {/* 热力图网格 */}
      <View style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
            {week.map((date) => {
              const data = dataMap.get(date)
              const count = data?.questions || 0
              const isToday = date === todayStr
              return (
                <View
                  key={date}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 5,
                    background: getColor(count),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isToday ? 1.5 : 0,
                    borderStyle: 'solid',
                    borderColor: isToday ? C.semantic.primary : 'transparent',
                  }}
                >
                  {count > 0 && (
                    <Text style={{ fontSize: 9, fontWeight: 700, color: getText(count) }}>{count}</Text>
                  )}
                </View>
              )
            })}
            {/* 不足 7 个的用空位补齐 */}
            {Array.from({ length: 7 - week.length }).map((_, i) => (
              <View key={`empty-${i}`} style={{ flex: 1, height: 34 }} />
            ))}
          </View>
        ))}
      </View>

      {/* 图例 */}
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>{dates[0].slice(5)} - {dates[dates.length - 1].slice(5)}</Text>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>少</Text>
          {HEATMAP_COLORS.map((c) => (
            <View key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
          ))}
          <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>多</Text>
        </View>
      </View>
    </View>
  )
}
