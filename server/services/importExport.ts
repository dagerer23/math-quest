/**
 * 导入导出服务
 * - JSON 导出/导入
 * - Excel 模板下载（用 xlsx 包）
 * - 导入日志
 */
import db from '../db'
import { LEVELS as FALLBACK_LEVELS } from '../../src/data/questionBank'

/** 导出全量题库为 JSON */
export async function exportAllToJson() {
  if (db.useMemory) {
    return JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      levels: FALLBACK_LEVELS,
    }, null, 2)
  }
  const pool = db.getPool()!
  const [lvRows] = await pool.query('SELECT * FROM t_level ORDER BY grade, chapter') as any
  const levels: any[] = []
  for (const lv of (lvRows as any[])) {
    const [qRows] = await pool.query('SELECT * FROM t_question WHERE level_id = ?', [lv.id]) as any
    const questions = (qRows as any[]).map((q: any) => ({
      id: q.id,
      type: q.type,
      knowledgePoint: q.knowledge_point,
      difficulty: q.difficulty,
      prompt: q.prompt,
      options: q.options ? String(q.options).split('||').filter(Boolean) : undefined,
      answer: q.answer,
      explanation: q.explanation || '',
      xp: Number(q.xp) || 10,
      illustration: q.illustration || undefined,
    }))
    levels.push({
      id: lv.id,
      grade: lv.grade,
      chapter: lv.chapter,
      isBoss: !!lv.is_boss,
      unitId: lv.unit_id,
      questions,
      knowledgePoints: [...new Set(questions.map((q: any) => q.knowledgePoint))],
    })
  }
  return JSON.stringify({ version: 1, exportedAt: Date.now(), levels }, null, 2)
}

/** 解析并导入 JSON 题库 */
export async function importFromJson(jsonText: string, adminId?: string) {
  let parsed: any
  try {
    parsed = JSON.parse(jsonText)
  } catch (e: any) {
    return { success: false, total: 0, successCount: 0, failedCount: 0, message: 'JSON 解析失败: ' + e.message }
  }
  const levels: any[] = Array.isArray(parsed) ? parsed : parsed.levels || []
  if (db.useMemory) {
    return {
      success: true,
      total: levels.length,
      successCount: 0,
      failedCount: levels.length,
      message: '内存模式不支持写入，请配置 MySQL',
    }
  }
  const pool = db.getPool()!
  let successCount = 0
  let failedCount = 0
  for (const lv of levels) {
    if (!lv.id || !lv.grade || !lv.chapter) { failedCount++; continue }
    try {
      await pool.query(
        `INSERT INTO t_level (id, grade, chapter, is_boss, unit_id) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE grade=VALUES(grade), chapter=VALUES(chapter),
           is_boss=VALUES(is_boss), unit_id=VALUES(unit_id)`,
        [lv.id, lv.grade, lv.chapter, lv.isBoss ? 1 : 0, lv.unitId || `unit-${lv.grade}-default`],
      )
      for (const q of (lv.questions || [])) {
        const id = q.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const options = q.options && q.options.length > 0 ? q.options.join('||') : null
        await pool.query(
          `INSERT INTO t_question (id, level_id, type, knowledge_point, difficulty, prompt, \`options\`, answer, explanation, xp, illustration)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE prompt=VALUES(prompt), answer=VALUES(answer)`,
          [id, lv.id, q.type, q.knowledgePoint || '未分类', q.difficulty || 1,
           q.prompt, options, String(q.answer), q.explanation || '', Number(q.xp) || 10, q.illustration || null],
        )
      }
      successCount++
    } catch {
      failedCount++
    }
  }
  await recordImportLog({
    adminId,
    filename: 'json-import.json',
    type: 'json',
    total: levels.length,
    success: successCount,
    failed: failedCount,
    status: 'success',
    message: `导入完成：成功 ${successCount} 失败 ${failedCount}`,
  })
  return { success: true, total: levels.length, successCount, failedCount, message: 'ok' }
}

/** 记录导入日志 */
export async function recordImportLog(log: {
  adminId?: string
  filename: string
  type: string
  total: number
  success: number
  failed: number
  status: string
  message?: string
}) {
  if (db.useMemory) return
  const pool = db.getPool()!
  await pool.query(
    `INSERT INTO t_import_log (admin_id, filename, type, total, success, failed, status, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [log.adminId || null, log.filename, log.type, log.total, log.success, log.failed, log.status, log.message || '', Date.now()],
  )
}

/** 获取导入历史 */
export async function listImportLog(limit = 50) {
  if (db.useMemory) return []
  const pool = db.getPool()!
  const [rows] = await pool.query(
    'SELECT * FROM t_import_log ORDER BY created_at DESC LIMIT ?',
    [limit],
  ) as any
  return (rows as any[]).map((r: any) => ({
    id: r.id,
    filename: r.filename,
    type: r.type,
    total: Number(r.total),
    success: Number(r.success),
    failed: Number(r.failed),
    status: r.status,
    message: r.message,
    createdAt: Number(r.created_at),
  }))
}

/** 生成 Excel 模板（CSV 格式） */
export function generateExcelTemplate() {
  const header = ['关卡ID', '年级', '章节', '题目ID', '类型', '知识点', '难度', '题目内容', '选项(每行一个用|分隔)', '答案', '解析', 'XP', '图释']
  const sample = [
    'g1-L1', '1', '5以内加减法', 'g1l1q_new', 'choice', '5以内加法', '1',
    '1 + 1 = ?', '1|2|3|4', '2', '1+1=2', '10', '🍎',
  ]
  return [header, sample].map(row => row.join(',')).join('\n')
}
