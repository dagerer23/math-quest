import type { Achievement } from '@/types/models'

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', name: '初出茅庐', description: '完成第 1 关', icon: '⚔️' },
  { id: 'combo_5', name: '连击新星', description: '达成 5 连击', icon: '⚡' },
  { id: 'combo_10', name: '连击大师', description: '达成 10 连击', icon: '🔥' },
  { id: 'streak_3', name: '坚持不懈', description: '连续打卡 3 天', icon: '📅' },
  { id: 'streak_7', name: '一周学霸', description: '连续打卡 7 天', icon: '🏆' },
  { id: 'coins_500', name: '小富翁', description: '累计获得 500 金币', icon: '🪙' },
  { id: 'no_mistake', name: '完美通关', description: '一关内零失误', icon: '💎' },
  { id: 'boss_killer', name: 'BOSS 杀手', description: '击败 1 个 BOSS 关卡', icon: '🐲' },
  { id: 'xp_1000', name: '经验大亨', description: '累计获得 1000 XP', icon: '🌟' },
  { id: 'mistake_master', name: '错题克星', description: '错题本累积 20 题后清空', icon: '📓' },
]
