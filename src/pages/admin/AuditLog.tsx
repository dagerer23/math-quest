/**
 * 审计日志 - 仅超级管理员可查看
 */
import { useEffect, useState } from 'react'
import { Shield, Loader2, ClipboardList } from 'lucide-react'
import { adminAuditApi, type AuditEntry } from '@/services/adminApi'
import { useToast } from '@/components/AdminLayout'
import { getAdmin } from '@/store/adminAuth'

const iconClass = 'w-4 h-4 inline-block align-text-bottom'
const emptyIconClass = 'w-12 h-12 text-[#ccc] mb-3'

export default function AuditLog() {
  const toast = useToast()
  const admin = getAdmin()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await adminAuditApi.list(100)
      setLogs(data)
    } catch (e: any) {
      toast('error', e.message || '加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-empty">
        <div className="admin-empty-icon">
          <Loader2 size={32} className="animate-spin" />
        </div>
        <div className="admin-empty-text">加载中...</div>
      </div>
    )
  }

  if (admin?.role !== 'super') {
    return (
      <div className="admin-empty">
        <Shield size={48} className="text-[#ccc] mb-3" />
        <div className="admin-empty-text">仅超级管理员可查看审计日志</div>
      </div>
    )
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">审计日志</h1>
          <p className="admin-page-subtitle">管理后台操作审计记录</p>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">
          <Shield className={iconClass} /> 操作记录
        </h3>
        {logs.length === 0 ? (
          <div className="admin-empty">
            <ClipboardList className={emptyIconClass} />
            <div className="admin-empty-text">暂无审计记录</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作人</th>
                <th>角色</th>
                <th>方法</th>
                <th>路径</th>
                <th>IP</th>
                <th>请求体</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, idx) => (
                <tr key={`${l.timestamp}-${idx}`}>
                  <td>{new Date(l.timestamp).toLocaleString('zh-CN')}</td>
                  <td>{l.username}</td>
                  <td>{l.role}</td>
                  <td>
                    <span className={`admin-tag ${
                      l.method === 'DELETE' ? 'admin-tag-red' :
                      l.method === 'POST' ? 'admin-tag-green' :
                      'admin-tag-blue'
                    }`}>{l.method}</span>
                  </td>
                  <td className="admin-mono">{l.path}</td>
                  <td className="admin-mono">{l.ip || '-'}</td>
                  <td>
                    {l.body ? (
                      <pre className="admin-code-block" style={{ maxWidth: 320, maxHeight: 120, overflow: 'auto', fontSize: 11, margin: 0 }}>
                        {JSON.stringify(l.body, null, 2)}
                      </pre>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
