import { View, Text, Image } from '@tarojs/components'
import { Icon } from '@/components/Icon'
import { C } from '@/styles/theme'
import { todayKey } from '@/utils/time'
import type { DailyStat } from '@/types/models'

interface HeatmapCalendarProps {
  dailyHistory: DailyStat[]
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

// 星期标签
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 生成环形进度 SVG data URI（小程序不支持内联 svg 标签，用 Image + data URI）
 */
function makeRingSvg(progress: number, size = 84): string {
  const r = 36
  const cx = 42
  const cy = 42
  const circumference = 2 * Math.PI * r
  const dashoffset = circumference * (1 - progress)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 84 84">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EBEDF0" stroke-width="8"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#58CC02" stroke-width="8" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}" transform="rotate(-90 ${cx} ${cy})"/>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

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
    <View>
      {/* 标题行 */}
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="calendar" size={14} color={C.semantic.primary} />
          <Text style={{ fontSize: 14, fontWeight: 700, color: C.semantic.foreground }}>学习日历</Text>
        </View>
        <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>{rangeStr}</Text>
      </View>

      {/* 进度环区 */}
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* 环形进度（Image + SVG data URI） */}
        <View style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
          <Image src={makeRingSvg(ringProgress)} style={{ width: 84, height: 84 }} />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Text style={{ fontSize: 26, fontWeight: 800, color: C.semantic.foreground, lineHeight: 1 }}>{monthActiveDays}</Text>
            <Text style={{ fontSize: 9, color: C.semantic.mutedForeground, marginTop: 2 }}>活跃天</Text>
          </View>
        </View>
        {/* 文案区 */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: C.semantic.foreground, marginBottom: 4 }}>{mainTitle}</Text>
          <Text style={{ fontSize: 11, color: C.semantic.mutedForeground, lineHeight: 1.5 }}>
            {monthLabel}月已过 {daysInMonthSoFar} 天，你练习了 {monthActiveDays} 天{'\n'}继续保持，养成学习好习惯
          </Text>
        </View>
      </View>

      {/* 近7天条形图区 */}
      <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: C.semantic.border }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: C.semantic.foreground }}>近 7 天</Text>
          <Text style={{ fontSize: 10, color: C.semantic.mutedForeground }}>共 {recent7Total} 题 · 活跃 {recent7Active} 天</Text>
        </View>
        {/* 条形图 */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 44 }}>
          {recent7.map((d) => {
            const heightPct = d.count === 0 ? 8 : Math.max(15, (d.count / maxCount) * 100)
            return (
              <View key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    borderRadius: 4,
                    background: getColor(d.count),
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: 2,
                    borderWidth: d.isToday ? 1.5 : 0,
                    borderStyle: 'solid',
                    borderColor: d.isToday ? C.semantic.primary : 'transparent',
                  }}
                >
                  {d.count > 0 && (
                    <Text style={{ fontSize: 9, fontWeight: 700, color: getText(d.count) }}>{d.count}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 9, color: d.isToday ? C.semantic.primary : C.semantic.mutedForeground, fontWeight: d.isToday ? 700 : 400 }}>{d.weekLabel}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}
