export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isYesterday(prev: string, today = new Date()): boolean {
  if (!prev) return false
  const t = new Date()
  t.setDate(t.getDate() - 1)
  return prev === todayKey(t)
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
