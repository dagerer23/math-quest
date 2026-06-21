/**
 * 系统配置 - 游戏参数配置
 */
import { useEffect, useState } from 'react'
import {
  Star,
  Heart,
  Target,
  XCircle,
  Crown,
  Coins,
  Settings,
  Pin,
  Puzzle,
  Gauge,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react'
import { adminConfigApi } from '@/services/adminApi'
import { useToast } from '@/components/AdminLayout'

interface ConfigItem {
  key: string; value: string; description?: string
  updatedAt?: number; updatedBy?: string
}

const iconSize = 18

const GROUP_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  'xp.': { label: 'XP 经验值', icon: <Star size={iconSize} /> },
  'heart.': { label: '心形系统', icon: <Heart size={iconSize} /> },
  'daily.': { label: '每日任务', icon: <Target size={iconSize} /> },
  'mistake.': { label: '错题策略', icon: <XCircle size={iconSize} /> },
  'question.': { label: '出题策略', icon: <Puzzle size={iconSize} /> },
  'boss.': { label: 'BOSS 关卡', icon: <Crown size={iconSize} /> },
  'coin.': { label: '货币经济', icon: <Coins size={iconSize} /> },
  'rate_limit.': { label: '限流配置', icon: <Gauge size={iconSize} /> },
  'version': { label: '系统信息', icon: <Settings size={iconSize} /> },
}

const defaultGroup = { label: '其他', icon: <Puzzle size={iconSize} /> }

function getGroup(key: string): { label: string; icon: React.ReactNode } {
  for (const [prefix, info] of Object.entries(GROUP_MAP)) {
    if (key.startsWith(prefix) || key === prefix.replace(/\.$/, '')) return info
  }
  return defaultGroup
}

export default function SystemConfig() {
  const toast = useToast()
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const data = await adminConfigApi.list()
      setConfigs(data)
      const map: Record<string, string> = {}
      data.forEach((c: ConfigItem) => { map[c.key] = c.value })
      setEdits(map)
    } catch (e: any) { toast('error', e.message) }
    finally { setLoading(false) }
  }

  async function save() {
    setSaving(true)
    try {
      const updates = Object.entries(edits)
        .filter(([k, v]) => {
          const orig = configs.find(c => c.key === k)?.value
          return v !== orig
        })
        .map(([k, v]) => ({ key: k, value: v }))
      if (updates.length === 0) {
        toast('info', '没有变更')
        return
      }
      await adminConfigApi.update(updates)
      toast('success', `已保存 ${updates.length} 项`)
      load()
    } catch (e: any) { toast('error', e.message) }
    finally { setSaving(false) }
  }

  function reset() {
    const map: Record<string, string> = {}
    configs.forEach(c => { map[c.key] = c.value })
    setEdits(map)
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

  // 按 group 分组
  const groups = new Map<string, ConfigItem[]>()
  configs.forEach(c => {
    const g = getGroup(c.key)
    if (!groups.has(g.label)) groups.set(g.label, [])
    groups.get(g.label)!.push(c)
  })

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">系统配置</h1>
          <p className="admin-page-subtitle">游戏参数动态调整</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={reset}>
            <RotateCcw size={16} /> 撤销修改
          </button>
          <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 保存中...
              </>
            ) : (
              <>
                <Save size={16} /> 保存所有变更
              </>
            )}
          </button>
        </div>
      </div>

      <div className="admin-grid admin-grid-2">
        {[...groups.entries()].map(([label, items]) => {
          const groupInfo = Object.values(GROUP_MAP).find(g => g.label === label) || defaultGroup
          return (
            <div key={label} className="admin-card">
              <h3 className="admin-card-title">
                <span>{groupInfo.icon} {label}</span>
              </h3>
              <table className="admin-table">
                <tbody>
                  {items.map(c => (
                    <tr key={c.key}>
                      <td style={{ width: '50%' }}>
                        <div className="admin-config-key">{c.description || c.key}</div>
                        <div className="admin-config-desc">{c.key}</div>
                      </td>
                      <td>
                        {c.key === 'version' ? (
                          <span className="admin-tag admin-tag-gray">{c.value}</span>
                        ) : (
                          <input
                            className="admin-input"
                            value={edits[c.key] ?? c.value}
                            onChange={e => setEdits(prev => ({ ...prev, [c.key]: e.target.value }))}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}