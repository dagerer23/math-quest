/**
 * 管理员账号服务
 * 简单用户名+密码（哈希），支持多角色：super/admin/viewer
 */
import db from '../db'
import { generateAdminToken } from '../middleware/adminAuth'

export type AdminRole = 'super' | 'admin' | 'viewer'

/** 简单哈希（仅用于演示环境，生产应使用 bcrypt） */
function hashPwd(pwd: string): string {
  let h = 0
  for (let i = 0; i < pwd.length; i++) {
    h = (h * 31 + pwd.charCodeAt(i)) | 0
  }
  return `h_${h}_${pwd.length}`
}

function verifyPwd(pwd: string, hash: string): boolean {
  return hashPwd(pwd) === hash
}

/** 初始化默认超级管理员 */
export async function initDefaultAdmin() {
  if (db.useMemory) return
  const pool = db.getPool()!
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM t_admin_user') as any
  if (Number((rows as any[])[0].c) === 0) {
    await pool.query(
      `INSERT INTO t_admin_user (id, username, password, nickname, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin-1', 'admin', hashPwd('admin123'), '超级管理员', 'super', Date.now()],
    )
    console.log('[admin] 已创建默认管理员: admin / admin123')
  }
}

/** 登录验证 */
export async function adminLogin(username: string, password: string, ip?: string) {
  if (db.useMemory) {
    // 内存模式直接放行
    if (username === 'admin' && password === 'admin123') {
      const admin = { id: 'admin-1', username: 'admin', nickname: '超级管理员', role: 'super' }
      const token = generateAdminToken(admin.id, admin.username, admin.role)
      return { success: true, admin, token }
    }
    return { success: false, message: '用户名或密码错误' }
  }
  const pool = db.getPool()!
  const [rows] = await pool.query(
    'SELECT * FROM t_admin_user WHERE username = ? AND status = 1',
    [username],
  ) as any
  const admin = (rows as any[])[0]
  if (!admin) return { success: false, message: '用户不存在' }
  if (!verifyPwd(password, admin.password)) {
    return { success: false, message: '密码错误' }
  }
  await pool.query('UPDATE t_admin_user SET last_login_at = ? WHERE id = ?', [Date.now(), admin.id])
  await pool.query(
    'INSERT INTO t_admin_login_log (admin_id, username, ip, login_at) VALUES (?, ?, ?, ?)',
    [admin.id, admin.username, ip || '', Date.now()],
  )
  const token = generateAdminToken(admin.id, admin.username, admin.role)
  return {
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
    },
    token,
  }
}

/** 列出所有管理员 */
export async function listAdmins() {
  if (db.useMemory) {
    return [{
      id: 'admin-1',
      username: 'admin',
      nickname: '超级管理员',
      role: 'super',
      status: 1,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    }]
  }
  const pool = db.getPool()!
  const [rows] = await pool.query(
    'SELECT id, username, nickname, role, status, created_at, last_login_at FROM t_admin_user ORDER BY created_at',
  ) as any
  return (rows as any[]).map((r: any) => ({
    id: r.id,
    username: r.username,
    nickname: r.nickname,
    role: r.role,
    status: r.status,
    createdAt: Number(r.created_at),
    lastLoginAt: r.last_login_at ? Number(r.last_login_at) : null,
  }))
}

/** 创建管理员 */
export async function createAdmin(input: {
  username: string
  password: string
  nickname?: string
  role: AdminRole
}) {
  if (db.useMemory) return { success: false, message: '内存模式不支持' }
  const pool = db.getPool()!
  const id = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  try {
    await pool.query(
      `INSERT INTO t_admin_user (id, username, password, nickname, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.username, hashPwd(input.password), input.nickname || '管理员', input.role, Date.now()],
    )
    return { success: true, id }
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY') return { success: false, message: '用户名已存在' }
    return { success: false, message: e?.message || '创建失败' }
  }
}

/** 更新管理员 */
export async function updateAdmin(id: string, updates: {
  nickname?: string
  role?: AdminRole
  password?: string
  status?: number
}) {
  if (db.useMemory) return { success: false, message: '内存模式不支持' }
  const pool = db.getPool()!
  const fields: string[] = []
  const values: any[] = []
  if (updates.nickname !== undefined) { fields.push('nickname = ?'); values.push(updates.nickname) }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role) }
  if (updates.password) { fields.push('password = ?'); values.push(hashPwd(updates.password)) }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (fields.length === 0) return { success: false, message: '没有要更新的字段' }
  values.push(id)
  await pool.query(`UPDATE t_admin_user SET ${fields.join(', ')} WHERE id = ?`, values)
  return { success: true }
}

/** 删除管理员 */
export async function deleteAdmin(id: string) {
  if (db.useMemory) return { success: false, message: '内存模式不支持' }
  const pool = db.getPool()!
  await pool.query('DELETE FROM t_admin_user WHERE id = ?', [id])
  return { success: true }
}

/** 获取登录日志 */
export async function listLoginLog(limit = 30) {
  if (db.useMemory) return []
  const pool = db.getPool()!
  const [rows] = await pool.query(
    'SELECT * FROM t_admin_login_log ORDER BY login_at DESC LIMIT ?',
    [limit],
  ) as any
  return (rows as any[]).map((r: any) => ({
    id: r.id,
    adminId: r.admin_id,
    username: r.username,
    ip: r.ip,
    loginAt: Number(r.login_at),
  }))
}
