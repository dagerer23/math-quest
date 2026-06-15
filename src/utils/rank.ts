import type { Rank } from '@/types/models'

// 从后端配置动态生成段位表
function buildRanks(configs?: Record<string, string>): { name: Rank; min: number; max: number; color: string }[] {
  const defaultRanks: { name: Rank; min: number; max: number; color: string }[] = [
    { name: '青铜', min: 0, max: 499, color: '#A87147' },
    { name: '白银', min: 500, max: 1499, color: '#C0C8D0' },
    { name: '黄金', min: 1500, max: 3499, color: '#FFD23F' },
    { name: '铂金', min: 3500, max: 6499, color: '#7B5BFF' },
    { name: '钻石', min: 6500, max: 9999, color: '#00E5FF' },
    { name: '王者', min: 10000, max: Infinity, color: '#FF3B6B' },
  ]
  if (!configs) return defaultRanks

  const toNum = (key: string, fallback: number) => {
    const v = configs[key]
    return v !== undefined && v !== '' ? Number(v) : fallback
  }
  const bronze = toNum('rank.bronze', 499)
  const silver = toNum('rank.silver', 1499)
  const gold = toNum('rank.gold', 3499)
  const platinum = toNum('rank.platinum', 6499)
  const diamond = toNum('rank.diamond', 9999)
  const king = toNum('rank.king', Infinity)

  const fromKey = (maxVal: number, fallback: number) => maxVal || fallback

  return [
    { name: '青铜', min: 0, max: bronze, color: '#A87147' },
    { name: '白银', min: bronze + 1, max: silver, color: '#C0C8D0' },
    { name: '黄金', min: silver + 1, max: gold, color: '#FFD23F' },
    { name: '铂金', min: gold + 1, max: platinum, color: '#7B5BFF' },
    { name: '钻石', min: platinum + 1, max: diamond, color: '#00E5FF' },
    { name: '王者', min: diamond + 1, max: king, color: '#FF3B6B' },
  ]
}

export function getRankFromXp(xp: number, configs?: Record<string, string>): Rank {
  const ranks = buildRanks(configs)
  for (const r of ranks) {
    if (xp >= r.min && xp <= r.max) return r.name
  }
  return '青铜'
}

export function getRankInfo(xp: number, configs?: Record<string, string>) {
  const ranks = buildRanks(configs)
  return ranks.find((r) => xp >= r.min && xp <= r.max) ?? ranks[0]
}

export function getNextRankInfo(xp: number, configs?: Record<string, string>) {
  const ranks = buildRanks(configs)
  const idx = ranks.findIndex((r) => xp >= r.min && xp <= r.max)
  if (idx < 0 || idx === ranks.length - 1) return null
  return ranks[idx + 1]
}

export function getRankProgress(xp: number, configs?: Record<string, string>): { current: number; target: number; pct: number } {
  const cur = getRankInfo(xp, configs)
  const target = cur.max === Infinity ? cur.min : cur.max
  const denom = (cur.max - cur.min + 1) || 1
  const pct = cur.max === Infinity ? 1 : Math.min(1, (xp - cur.min) / denom)
  return { current: xp - cur.min, target: target - cur.min + 1, pct }
}

export function getRankColors(configs?: Record<string, string>): Record<Rank, string> {
  const ranks = buildRanks(configs)
  return ranks.reduce(
    (acc, r) => ({ ...acc, [r.name]: r.color }),
    {} as Record<Rank, string>,
  )
}

export const RANK_COLORS: Record<Rank, string> = getRankColors()
