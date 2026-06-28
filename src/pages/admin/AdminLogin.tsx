/**
 * 管理后台登录页
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react'
import { adminAccountsApi } from '@/services/adminApi'
import { setAdmin, setAdminToken } from '@/store/adminAuth'

export default function AdminLogin() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await adminAccountsApi.login(username, password)
      if (res.success) {
        setAdmin(res.admin as unknown as import('@/store/adminAuth').AdminUser ?? null)
        if (res.token) setAdminToken(res.token)
        const params = new URLSearchParams(location.search)
        const redirect = params.get('redirect') || '/admin/dashboard'
        navigate(redirect, { replace: true })
      } else {
        setErr(res.message || '登录失败')
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '登录失败，请检查服务是否启动'
      setErr(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-wrap">
      <form
        onSubmit={handleSubmit}
        className="admin-login-card"
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="admin-login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h6v6H4z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6H4z" /><path d="M14 14h6v6h-6z" />
            </svg>
          </div>
          <h1 className="admin-login-title">数学逆袭</h1>
          <p className="admin-login-subtitle">管理控制台</p>
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">管理员账号</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="admin-input"
            placeholder="请输入账号"
            autoComplete="username"
          />
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="admin-input"
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </div>

        {err && (
          <div className="admin-login-error">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            {err}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="admin-btn admin-btn-primary"
          style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> 登录中...</>
          ) : (
            <><LogIn size={16} /> 登 录</>
          )}
        </button>

        <div className="admin-login-hint">
          <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
          <span>默认账号 <strong style={{ color: '#1e293b' }}>admin</strong> / 密码 <strong style={{ color: '#1e293b' }}>admin123</strong><br />首次启动服务时会自动创建</span>
        </div>
      </form>
    </div>
  )
}