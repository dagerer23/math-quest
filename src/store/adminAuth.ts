/**
 * 管理员认证状态（localStorage 持久化）
 */
const KEY = 'admin_auth'
const TOKEN_KEY = 'admin_token'

export interface AdminUser {
  id: string
  username: string
  nickname: string
  role: 'super' | 'admin' | 'viewer'
}

export function getAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setAdmin(user: AdminUser | null) {
  if (!user) {
    localStorage.removeItem(KEY)
    localStorage.removeItem(TOKEN_KEY)
  }
  else localStorage.setItem(KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('admin-auth-change'))
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}
