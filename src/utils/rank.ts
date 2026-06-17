import type { Rank } from '@/types/models'

interface RankThreshold {
  rank: Rank
  minXp: number
}

const RANKS: RankThreshold[] = [
  { rank: '青铜', minXp: 0 },
  { rank: '白银', minXp: 500 },
  { rank: '黄金', minXp: 1500 },
  { rank: '铂金', minXp: 4000 },
  { rank: '钻石', minXp: 8000 },
  { rank: '王者', minXp: 15000 },
]

export function getRankFromXp(xp: number, configs?: Record<string, string>): Rank {
  if (!configs) return RANKS[RANKS.length - 1].rank
  const multipliers = configs['rank_xp_multipliers']
  const overrides = configs['rank_thresholds']

  if (overrides) {
    try {
      const parsed = JSON.parse(overrides) as RankThreshold[]
      const sorted = parsed.sort((a, b) => b.minXp - a.minXp)
      return sorted.find((r) => xp >= r.minXp)?.rank ?? '青铜'
    } catch {
      /* use default */
    }
  }

  if (multipliers) {
    try {
      const m = JSON.parse(multipliers)
      return getRankFromXpWithMultipliers(xp, m)
    } catch {
      /* use default */
    }
  }

  return RANKS.find((r) => xp >= r.minXp)?.rank ?? '青铜'
}

function getRankFromXpWithMultipliers(xp: number, multipliers: Record<number, number>): Rank {
  let effectiveXp = xp
  for (const [threshold, mult] of Object.entries(multipliers)) {
    if (xp >= Number(threshold)) {
      effectiveXp = xp * mult
    }
  }
  return RANKS.find((r) => effectiveXp >= r.minXp)?.rank ?? '青铜'
}

export function getXpProgress(xp: number, configs?: Record<string, string>): { current: number; next: number; rank: Rank; nextRank: Rank } {
  const rank = getRankFromXp(xp, configs)
  const idx = RANKS.findIndex((r) => r.rank === rank)
  const current = RANKS[idx].minXp
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1].minXp : current
  return { current, next, rank, nextRank: idx < RANKS.length - 1 ? RANKS[idx + 1].rank : rank }
}
