/**
 * 管理后台统一布局 - 深色侧边栏 + 主内容区
 * 使用 lucide-react 统一图标风格
 */
import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAdmin, setAdmin } from '@/store/adminAuth'
import {
  LayoutDashboard, BookOpen, BarChart3, Upload, Settings, Users,
  ExternalLink, LogOut, ChevronRight, Menu, X
} from 'lucide-react'

interface NavItem {
  to: string
  icon: ReactNode
  label: string
}

const NAV: NavItem[] = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: '仪表盘' },
  { to: '/admin/questions', icon: <BookOpen size={18} />, label: '题库管理' },
  { to: '/admin/analytics', icon: <BarChart3 size={18} />, label: '数据中心' },
  { to: '/admin/import', icon: <Upload size={18} />, label: '导入导出' },
  { to: '/admin/config', icon: <Settings size={18} />, label: '系统配置' },
  { to: '/admin/accounts', icon: <Users size={18} />, label: '账号管理' },
]

const TITLE_MAP: Record<string, string> = {
  '/admin/dashboard': '仪表盘',
  '/admin/questions': '题库管理',
  '/admin/analytics': '数据中心',
  '/admin/import': '导入导出',
  '/admin/config': '系统配置',
  '/admin/accounts': '账号管理',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [admin, setAdminState] = useState(getAdmin())
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 监听 admin 登录/登出事件，同步刷新 state
  useEffect(() => {
    const handleAdminChange = () => setAdminState(getAdmin())
    window.addEventListener('admin-auth-change', handleAdminChange)
    return () => window.removeEventListener('admin-auth-change', handleAdminChange)
  }, [])

  useEffect(() => {
    if (!admin && !location.pathname.startsWith('/admin/login')) {
      navigate('/admin/login', { replace: true })
    }
  }, [admin, location.pathname, navigate])

  function showToast(type: string, message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 2400)
  }

  function logout() {
    setAdmin(null)
    setAdminState(null)
    navigate('/admin/login', { replace: true })
  }

  if (location.pathname.startsWith('/admin/login')) {
    return <div className="admin-shell">{children}</div>
  }

  if (!admin) return null

  const currentTitle = TITLE_MAP[location.pathname] || '后台'

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <div className="admin-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h6v6H4z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6H4z" /><path d="M14 14h6v6h-6z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="admin-logo-text">算力先锋</div>
                <div className="admin-logo-sub">ADMIN</div>
              </div>
            )}
          </div>
          <button
            className="admin-sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <Menu size={14} />}
          </button>
        </div>
        <nav className="admin-nav">
          {NAV.map(item => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/admin/dashboard' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-avatar">{admin.nickname?.[0] || 'A'}</div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="admin-user-name">{admin.nickname || admin.username}</div>
              <div className="admin-user-role">
                {admin.role === 'super' ? '超级管理员' : admin.role === 'admin' ? '内容管理员' : '只读账号'}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title="退出登录"
            aria-label="退出登录"
            className="admin-btn admin-btn-ghost"
            style={{ padding: '6px', minWidth: 32 }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-breadcrumb">
            <span className="admin-breadcrumb-sep">后台</span>
            <ChevronRight size={12} className="admin-breadcrumb-sep" />
            <span className="admin-breadcrumb-current">{currentTitle}</span>
          </div>
          <div className="admin-header-actions">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-ghost"
            >
              <ExternalLink size={12} /> 用户端
            </a>
          </div>
        </header>
        <main className="admin-content">
          <ToastContext.Provider value={showToast}>
            {children}
          </ToastContext.Provider>
        </main>
      </div>

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  )
}

const ToastContext = createContext<(type: string, msg: string) => void>(() => {})
export function useToast() {
  return useContext(ToastContext)
}