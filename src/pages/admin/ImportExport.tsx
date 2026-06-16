/**
 * 导入导出 - 批量操作题库
 */
import { useEffect, useRef, useState } from 'react'
import { adminImportApi } from '@/services/adminApi'
import { useToast } from '@/components/AdminLayout'
import {
  Upload,
  Download,
  ScrollText,
  Package,
  FileSpreadsheet,
  Lightbulb,
  Rocket,
  RefreshCw,
  Loader2,
} from 'lucide-react'


interface ImportLog {
  id: string; filename: string; type: string
  total: number; success: number; failed: number
  status: string; createdAt: string
}

const iconClass = 'w-4 h-4 inline-block align-text-bottom'
const emptyIconClass = 'w-12 h-12 text-[#ccc] mb-3'

export default function ImportExport() {
  const toast = useToast()
  const [tab, setTab] = useState<'export' | 'import' | 'history'>('export')
  const [importContent, setImportContent] = useState('')
  const [importing, setImporting] = useState(false)
  const [history, setHistory] = useState<ImportLog[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    try {
      const data = await adminImportApi.history() as unknown as ImportLog[]
      setHistory(data)
    } catch {
      toast('error', '加载历史记录失败')
    }
  }

  async function doImport() {
    if (!importContent.trim()) {
      toast('error', '请粘贴 JSON 内容')
      return
    }
    setImporting(true)
    try {
      const res = await adminImportApi.importJson(importContent)
      if (res.success) {
        toast('success', `导入完成：${res.message}`)
        setImportContent('')
        loadHistory()
      } else {
        toast('error', res.message || '导入失败')
      }
    } catch (e: any) {
      toast('error', e.message || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImportContent(String(ev.target?.result || ''))
      toast('info', `已加载文件：${file.name}`)
    }
    reader.readAsText(file, 'utf-8')
  }

  const tabs = [
    { k: 'export', label: '导出与模板', Icon: Upload },
    { k: 'import', label: '导入题目', Icon: Download },
    { k: 'history', label: '导入历史', Icon: ScrollText },
  ] as const

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">导入导出</h1>
          <p className="admin-page-subtitle">题库备份、迁移、批量上传</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #ececef' }}>
        {tabs.map(({ k, label, Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className="admin-tab-btn"
            style={{
              padding: '10px 16px', background: 'transparent', border: 'none',
              borderBottom: tab === k ? '2px solid #58CC02' : '2px solid transparent',
              color: tab === k ? '#1d1d1f' : '#666',
              fontWeight: tab === k ? 600 : 500, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Icon className={iconClass} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="admin-grid admin-grid-2">
          <div className="admin-card">
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package className={iconClass} />
              导出全量题库
            </h3>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
              一键导出数据库中所有关卡和题目为 JSON 格式，可用于备份或迁移到其他环境。
            </p>
            <a
              href={adminImportApi.exportJsonUrl()}
              className="admin-btn admin-btn-primary"
              download
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download className={iconClass} />
              下载 JSON 备份
            </a>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet className={iconClass} />
              Excel 导入模板
            </h3>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
              下载 CSV 模板，按格式填写后导入。注意：当前仅支持 JSON 导入，模板用于人工录入参考。
            </p>
            <a
              href={adminImportApi.templateUrl()}
              className="admin-btn admin-btn-secondary"
              download
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download className={iconClass} />
              下载 CSV 模板
            </a>
          </div>

          <div className="admin-card" style={{ gridColumn: 'span 2' }}>
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb className={iconClass} />
              导入格式说明
            </h3>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>
              <p>支持两种 JSON 结构：</p>
              <ol style={{ paddingLeft: 20 }}>
                <li><b>直接数组</b>：<code style={{ background: '#f0f0f3', padding: '2px 6px', borderRadius: 4 }}>{"[{...}, {...}]"}</code></li>
                <li><b>带版本号的对象</b>：<code style={{ background: '#f0f0f3', padding: '2px 6px', borderRadius: 4 }}>{`{ "version": 1, "levels": [...] }`}</code></li>
              </ol>
              <p style={{ marginTop: 8 }}>每个关卡对象结构：</p>
              <pre style={{
                background: '#1a1a2e', color: '#7ED321', padding: 14,
                borderRadius: 8, fontSize: 12, overflow: 'auto',
                fontFamily: 'SF Mono, Menlo, monospace',
              }}>{`{
  "id": "g1-L1",
  "grade": 1,
  "chapter": "5以内加减法",
  "isBoss": false,
  "questions": [
    {
      "id": "g1l1q1",
      "type": "choice",
      "knowledgePoint": "5以内加法",
      "difficulty": 1,
      "prompt": "1+1=?",
      "options": ["1", "2", "3", "4"],
      "answer": "2",
      "explanation": "1+1=2",
      "xp": 10
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div className="admin-card">
          <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download className={iconClass} />
            批量导入题目
          </h3>
          <div className="admin-form-row">
            <label className="admin-form-label">上传 JSON 文件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              style={{ fontSize: 13 }}
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-form-label">或直接粘贴 JSON</label>
            <textarea
              className="admin-textarea"
              rows={14}
              value={importContent}
              onChange={e => setImportContent(e.target.value)}
              placeholder='{ "version": 1, "levels": [...] }'
              style={{ fontSize: 12 }}
            />
            <div className="admin-form-hint">支持 2MB 以内的 JSON。已存在的关卡/题目会被覆盖。</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={doImport}
              disabled={importing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {importing ? (
                <>
                  <Loader2 className={`${iconClass} animate-spin`} />
                  导入中...
                </>
              ) : (
                <>
                  <Rocket className={iconClass} />
                  确认导入
                </>
              )}
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setImportContent('')}
            >清空</button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="admin-card">
          <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScrollText className={iconClass} />
              导入历史
            </span>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={loadHistory}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <RefreshCw className={iconClass} />
              刷新
            </button>
          </h3>
          {history.length === 0 ? (
            <div className="admin-empty">
              <ScrollText className={emptyIconClass} />
              <div className="admin-empty-text">暂无导入记录</div>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>文件名</th>
                  <th>类型</th>
                  <th>总数</th>
                  <th>成功</th>
                  <th>失败</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontSize: 12, color: '#666' }}>
                      {new Date(h.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td>{h.filename}</td>
                    <td><span className="admin-tag admin-tag-blue">{h.type}</span></td>
                    <td>{h.total}</td>
                    <td style={{ color: '#46A302' }}>{h.success}</td>
                    <td style={{ color: h.failed > 0 ? '#FF4B4B' : '#999' }}>{h.failed}</td>
                    <td>
                      <span className={`admin-tag ${h.status === 'success' ? 'admin-tag-green' : 'admin-tag-red'}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}