/** 成就奖励映射（前端硬编码，后端 Achievement 类型无 reward 字段） */
export const ACHIEVEMENT_REWARDS: Record<string, { coins?: number; diamonds?: number; xp?: number }> = {
  first_blood: { coins: 50 },
  combo_5: { coins: 30 },
  combo_10: { diamonds: 5 },
  streak_3: { coins: 50 },
  streak_7: { diamonds: 10 },
  coins_500: { xp: 100 },
  no_mistake: { diamonds: 5 },
  boss_killer: { diamonds: 10 },
  xp_1000: { coins: 100 },
  mistake_master: { coins: 80 },
}

export function getAchievementReward(id: string) {
  return ACHIEVEMENT_REWARDS[id] || {}
}
