import type { Achievement } from '@/types/models'

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', name: '初出茅庐', description: '完成第 1 关', icon: 'sword' },
  { id: 'combo_5', name: '连击新星', description: '达成 5 连击', icon: 'lightning' },
  { id: 'combo_10', name: '连击大师', description: '达成 10 连击', icon: 'fire' },
  { id: 'streak_3', name: '坚持不懈', description: '连续打卡 3 天', icon: 'calendar' },
  { id: 'streak_7', name: '一周学霸', description: '连续打卡 7 天', icon: 'trophy' },
  { id: 'coins_500', name: '小富翁', description: '累计获得 500 金币', icon: 'coin' },
  { id: 'no_mistake', name: '完美通关', description: '一关内零失误', icon: 'diamond' },
  { id: 'boss_killer', name: 'BOSS 杀手', description: '击败 1 个 BOSS 关卡', icon: 'ghost' },
  { id: 'xp_1000', name: '经验大亨', description: '累计获得 1000 XP', icon: 'sparkles' },
  { id: 'mistake_master', name: '错题克星', description: '错题本累积 20 题后清空', icon: 'memo' },
]

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
