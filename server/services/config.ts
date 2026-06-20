/**
 * 系统配置服务
 * 存储并读取游戏参数配置
 */
import db from '../db'

const DEFAULT_CONFIGS: { key: string; value: string; description: string }[] = [
  { key: 'xp.base', value: '10', description: '每题基础 XP 奖励' },
  { key: 'xp.combo_bonus', value: '1.2', description: '连击加成倍率' },
  { key: 'heart.recover_minutes', value: '30', description: '心形恢复速度（分钟/颗）' },
  { key: 'heart.max', value: '5', description: '最大心形数' },
  { key: 'heart.loss_per_wrong', value: '1', description: '答错扣心数' },
  { key: 'daily.target_xp', value: '50', description: '每日任务目标 XP' },
  { key: 'daily.target_questions', value: '10', description: '每日任务目标题数' },
  { key: 'mistake.appear_after', value: '3', description: '错题几次后再次出现' },
  { key: 'boss.heart_cost', value: '1', description: 'BOSS 关卡消耗心数' },
  { key: 'coin.star_to_coin', value: '5', description: '每颗星奖励金币' },
  { key: 'checkin.base_xp', value: '10', description: '签到基础 XP 奖励' },
  { key: 'checkin.base_coins', value: '20', description: '签到基础金币奖励' },
  { key: 'checkin.xp_per_streak', value: '5', description: '连签每天额外 XP' },
  { key: 'checkin.coins_per_streak', value: '10', description: '连签每天额外金币' },
  { key: 'level.star.3_cutoff', value: '1.0', description: '3星正确率阈值（1.0=100%）' },
  { key: 'level.star.2_cutoff', value: '0.7', description: '2星正确率阈值（0.7=70%）' },
  { key: 'level.star.1_cutoff', value: '0.4', description: '1星正确率阈值（0.4=40%）' },
  { key: 'level.score.per_correct', value: '10', description: '关卡每答对一题得分' },
  { key: 'level.coins.per_correct', value: '5', description: '关卡每答对一题金币奖励' },
  { key: 'level.coins.star3_bonus', value: '30', description: '3星通关金币奖励' },
  { key: 'init.coins', value: '80', description: '初始金币' },
  { key: 'init.diamonds', value: '5', description: '初始钻石' },
  { key: 'init.hearts', value: '5', description: '初始心形数' },
  // 连击相关
  { key: 'combo.show_threshold', value: '3', description: '连击显示阈值' },
  { key: 'combo.sound_threshold', value: '5', description: '连击特殊音效阈值' },
  // 测评相关
  { key: 'assessment.reward_xp', value: '100', description: '测评完成奖励 XP' },
  { key: 'assessment.reward_coins', value: '50', description: '测评完成奖励金币' },
  { key: 'assessment.emoji_excellent', value: '80', description: '测评优秀表情阈值' },
  { key: 'assessment.emoji_good', value: '50', description: '测评良好表情阈值' },
  // 结算赞美文案阈值
  { key: 'result.praise.perfect', value: '100', description: '完美赞美正确率阈值' },
  { key: 'result.praise.excellent', value: '80', description: '优秀赞美正确率阈值' },
  { key: 'result.praise.good', value: '60', description: '良好赞美正确率阈值' },
  // 限流相关配置（可在后台管理动态调整，保存后立即生效）
  { key: 'rate_limit.api.window_ms', value: '1000', description: '通用API限流窗口（毫秒，1000=1秒）' },
  { key: 'rate_limit.api.max', value: '50', description: '通用API限流窗口内最大请求数' },
  { key: 'rate_limit.auth.window_ms', value: '60000', description: '认证接口限流窗口（毫秒，60000=1分钟）' },
  { key: 'rate_limit.auth.max', value: '5', description: '认证接口限流窗口内最大请求数' },
  { key: 'version', value: '0.1.0', description: '服务版本号' },
]

/** 初始化默认配置 */
export async function initDefaultConfigs() {
  if (db.useMemory) return
  const pool = db.getPool()!
  for (const c of DEFAULT_CONFIGS) {
    await pool.query(
      `INSERT IGNORE INTO t_system_config (\`key\`, \`value\`, description, updated_at) VALUES (?, ?, ?, ?)`,
      [c.key, c.value, c.description, Date.now()],
    )
  }
}

/** 获取所有配置 */
export async function getAllConfigs() {
  if (db.useMemory) {
    return DEFAULT_CONFIGS.map(c => ({ ...c, updatedAt: Date.now(), updatedBy: 'system' }))
  }
  const pool = db.getPool()!
  const [rows] = await pool.query('SELECT * FROM t_system_config ORDER BY `key`') as any
  return (rows as any[]).map((r: any) => ({
    key: r.key,
    value: r.value,
    description: r.description,
    updatedAt: Number(r.updated_at),
    updatedBy: r.updated_by,
  }))
}

/** 获取单个配置 */
export async function getConfig(key: string): Promise<string | null> {
  if (db.useMemory) {
    const c = DEFAULT_CONFIGS.find(c => c.key === key)
    return c ? c.value : null
  }
  const pool = db.getPool()!
  const [rows] = await pool.query('SELECT `value` FROM t_system_config WHERE `key` = ?', [key]) as any
  if (!Array.isArray(rows) || rows.length === 0) return null
  return (rows as any[])[0].value
}

/** 批量更新配置 */
export async function updateConfigs(updates: { key: string; value: string }[], adminId?: string) {
  if (db.useMemory) {
    updates.forEach(u => {
      const c = DEFAULT_CONFIGS.find(c => c.key === u.key)
      if (c) c.value = u.value
    })
    return { success: true, count: updates.length }
  }
  const pool = db.getPool()!
  for (const u of updates) {
    await pool.query(
      `UPDATE t_system_config SET \`value\` = ?, updated_at = ?, updated_by = ? WHERE \`key\` = ?`,
      [u.value, Date.now(), adminId || 'system', u.key],
    )
  }
  return { success: true, count: updates.length }
}
