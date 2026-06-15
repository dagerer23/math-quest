/**
 * 管理员导入导出路由
 */
import { Router, Request, Response } from 'express'
import {
  exportAllToJson,
  importFromJson,
  listImportLog,
  generateExcelTemplate,
} from '../services/importExport'

const router = Router()

/** 导出全量题库为 JSON */
router.get('/export/json', async (_req, res) => {
  const json = await exportAllToJson()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=question-bank-${Date.now()}.json`)
  res.send(json)
})

/** 导入 JSON */
router.post('/import/json', async (req, res) => {
  const { content, adminId } = req.body
  if (!content) {
    res.status(400).json({ success: false, message: '缺少 content 字段' })
    return
  }
  const result = await importFromJson(content, adminId)
  res.json(result)
})

/** Excel 模板下载（CSV 简化版） */
router.get('/template', async (_req, res) => {
  const csv = generateExcelTemplate()
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=question-template.csv')
  res.send('\ufeff' + csv) // BOM 让 Excel 正确识别中文
})

/** 导入历史 */
router.get('/history', async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
  const data = await listImportLog(limit)
  res.json({ success: true, data })
})

export default router
