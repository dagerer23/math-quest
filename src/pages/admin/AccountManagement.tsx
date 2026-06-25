/**
 * 账号管理 - 管理员与登录日志
 */
import { useEffect, useState } from 'react'
import { adminAccountsApi, type LoginLog, type AdminAccount } from '@/services/adminApi'
import { useToast } from '@/components/AdminLayout'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
  Plus,
  Users,
  Lock,
  Loader2,
  Pencil,
  Key,
  PauseCircle,
  PlayCircle,
  Trash2,
  ClipboardList,
} from 'lucide-react'

type Admin = AdminAccount

function Modal({ title, onClose, width, children }: { title: string; onClose: () => void; width?: number; children: ReactNode }) {
  return (
    <div className="admin-modal-mask" onClick={onClose}>
      <motion.div
        className="admin-modal"
        style={{ maxWidth: width ?? 520 }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <button onClick={onClose} className="admin-btn admin-btn-ghost"><X size={16} /></button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </motion.div>
    </div>
  )
}

function ModalFooter({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="admin-modal-footer">
      <button className="admin-btn admin-btn-ghost" onClick={onClose}>取消</button>
      {children}
    </div>
  )
}

export default function AccountManagement() {
  const toast = useToast()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Admin | null>(null)
  const [showPwd, setShowPwd] = useState<Admin | null>(null)
  const [form, setForm] = useState({ username: '', password: '', nickname: '', role: 'admin' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [a, l] = await Promise.all([adminAccountsApi.list(), adminAccountsApi.loginLog()])
      setAdmins(a)
      setLogs(l)
    } catch (e: any) { toast('error', e.message) }
    finally { setLoading(false) }
  }

  function openNew() {
    setEditing(null)
    setForm({ username: '', password: '', nickname: '', role: 'admin' })
    setShowForm(true)
  }

  function openEdit(a: Admin) {
    setEditing(a)
    setForm({ username: a.username, password: '', nickname: a.nickname ?? '', role: a.role })
    setShowForm(true)
  }

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    try {
      if (editing) {
        const updates: any = { nickname: form.nickname, role: form.role }
        if (form.password) updates.password = form.password
        await adminAccountsApi.update(editing.id, updates)
        toast('success', '已更新')
      } else {
        if (!form.username || !form.password) {
          toast('error', '请填写账号和密码')
          return
        }
        await adminAccountsApi.create({ ...form, nickname: form.nickname || form.username })
        toast('success', '已创建')
      }
      setShowForm(false)
      load()
    } catch (e: any) { toast('error', e.message) }
    finally { setSubmitting(false) }
  }

  async function remove(a: Admin) {
    if (a.role === 'super') {
      toast('error', '超级管理员不可删除')
      return
    }
    if (!confirm(`确认删除管理员 ${a.username}？`)) return
    try {
      await adminAccountsApi.remove(a.id)
      toast('success', '已删除')
      load()
    } catch (e: any) { toast('error', e.message) }
  }

  async function changePwd() {
    if (!showPwd) return
    const pwd = prompt(`请输入 ${showPwd.username} 的新密码（至少8位，需含字母和数字）：`)
    if (!pwd) return
    if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd) || !/\d/.test(pwd)) {
      toast('error', '密码至少8位，需包含字母和数字')
      return
    }
    try {
      await adminAccountsApi.update(showPwd.id, { password: pwd })
      toast('success', '密码已更新')
    } catch (e: any) { toast('error', e.message) }
  }

  async function toggleStatus(a: Admin) {
    try {
      await adminAccountsApi.update(a.id, { status: a.status === 1 ? 0 : 1 })
      toast('success', a.status === 1 ? '已禁用' : '已启用')
      load()
    } catch (e: any) { toast('error', e.message) }
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

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">账号管理</h1>
          <p className="admin-page-subtitle">管理员账号与登录日志</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-primary" onClick={openNew}>
            <Plus size={16} className="admin-btn-icon" /> 新增账号
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h3 className="admin-card-title">
          <Users size={18} className="admin-card-title-icon" /> 管理员列表
        </h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>账号</th>
              <th>昵称</th>
              <th>角色</th>
              <th>状态</th>
              <th>最近登录</th>
              <th style={{ width: 200 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td><span className="admin-mono">{a.username}</span></td>
                <td>{a.nickname}</td>
                <td>
                  <span className={`admin-tag ${a.role === 'super' ? 'admin-tag-red' : a.role === 'admin' ? 'admin-tag-blue' : 'admin-tag-gray'}`}>
                    {a.role === 'super' ? '超级管理员' : a.role === 'admin' ? '内容管理员' : '只读账号'}
                  </span>
                </td>
                <td>
                  <span className={`admin-tag ${a.status === 1 ? 'admin-tag-green' : 'admin-tag-gray'}`}>
                    {a.status === 1 ? '正常' : '已禁用'}
                  </span>
                </td>
                <td>
                  {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="admin-btn admin-btn-ghost" onClick={() => openEdit(a)}>
                      <Pencil size={14} />
                    </button>
                    <button className="admin-btn admin-btn-ghost" onClick={() => { setShowPwd(a); changePwd() }}>
                      <Key size={14} />
                    </button>
                    <button className="admin-btn admin-btn-ghost" onClick={() => toggleStatus(a)}>
                      {a.status === 1 ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                    </button>
                    <button className="admin-btn admin-btn-ghost danger" onClick={() => remove(a)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">
          <Lock size={18} className="admin-card-title-icon" /> 登录日志
        </h3>
        {logs.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">
              <ClipboardList size={32} />
            </div>
            <div className="admin-empty-text">暂无登录记录</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>账号</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.loginAt).toLocaleString('zh-CN')}</td>
                  <td>{l.username}</td>
                  <td className="admin-mono">{l.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? '编辑账号' : '新增账号'} onClose={() => setShowForm(false)} width={460}>
          <div className="admin-form-row">
            <label className="admin-form-label">账号 *</label>
            <input
              className="admin-input"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              disabled={!!editing}
              placeholder="登录账号"
            />
            {editing && <div className="admin-form-hint">账号不可修改</div>}
          </div>
          <div className="admin-form-row">
            <label className="admin-form-label">密码 {editing ? '（留空则不修改）' : '*'}</label>
            <input
              type="password"
              className="admin-input"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="至少 6 位"
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-form-label">昵称</label>
            <input
              className="admin-input"
              value={form.nickname}
              onChange={e => setForm({ ...form, nickname: e.target.value })}
              placeholder="显示名称"
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-form-label">角色</label>
            <select className="admin-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="super">超级管理员（全功能）</option>
              <option value="admin">内容管理员（题库）</option>
              <option value="viewer">只读账号</option>
            </select>
          </div>
          <ModalFooter onClose={() => setShowForm(false)}>
            <button className="admin-btn admin-btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}