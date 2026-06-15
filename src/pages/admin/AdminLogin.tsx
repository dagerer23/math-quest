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
      console.log('[AdminLogin] 正在登录...', { username })
      const res = await adminAccountsApi.login(username, password)
      console.log('[AdminLogin] 登录响应:', res)
      if (res.success) {
        console.log('[AdminLogin] 登录成功，保存状态并跳转')
        setAdmin(res.admin)
        if (res.token) setAdminToken(res.token)
        const params = new URLSearchParams(location.search)
        const redirect = params.get('redirect') || '/admin/dashboard'
        navigate(redirect, { replace: true })
      } else {
        console.log('[AdminLogin] 登录失败:', res.message)
        setErr(res.message || '登录失败')
      }
    } catch (e: any) {
      console.error('[AdminLogin] 登录异常:', e)
      setErr(e?.message || '登录失败，请检查服务是否启动')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      minHeight: '100vh',
      width: '100%',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '40px 36px',
          width: 400,
          maxWidth: '92vw',
          boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #10b981 0%, #58CC02 100%)',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h6v6H4z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6H4z" /><path d="M14 14h6v6h-6z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>算力先锋</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, letterSpacing: '0.05em' }}>管理控制台</p>
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">管理员账号</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="admin-input"
            placeholder="请输入账号"
            autoComplete="username"
            style={{ fontSize: 14, padding: '11px 14px' }}
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
            style={{ fontSize: 14, padding: '11px 14px' }}
          />
        </div>

        {err && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #fecaca',
          }}>
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

        <div style={{
          marginTop: 20,
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: 10,
          fontSize: 12,
          color: '#64748b',
          lineHeight: 1.6,
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: 8,
        }}>
          <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
          <span>默认账号 <strong style={{ color: '#1e293b' }}>admin</strong> / 密码 <strong style={{ color: '#1e293b' }}>admin123</strong><br />首次启动服务时会自动创建</span>
        </div>
      </form>
    </div>
  )
}