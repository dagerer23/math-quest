/**
 * 题库管理 - 树形大纲 + 侧边面板
 * 年级分组 → 关卡 → 题目面板
 */
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, Plus, RefreshCw, Search, Crown,
  FileText, Pencil, Trash2, X, BookOpen, Tag, Sliders,
  ListOrdered, List as ListIcon, Star, Info
} from 'lucide-react'
import { adminContentApi } from '@/services/adminApi'
import { useToast } from '@/components/AdminLayout'

// ============ Types ============
interface LevelMeta {
  id: string
  grade: number
  chapter: string
  sortOrder: number
  isBoss: boolean
  questionCount: number
  knowledgePoints: string[]
  unitId?: string
}
interface QuestionItem {
  id: string
  levelId?: string
  type: 'choice' | 'input' | 'drag'
  knowledgePoint: string
  difficulty: 1 | 2 | 3
  difficulty_score?: number
  prompt: string
  options?: string[]
  answer: string | number
  explanation?: string
  xp: number
  illustration?: string
}

// ============ Shared UI ============
function RadioPillGroup<T extends string>({
  options, value, onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'inline-flex', gap: 4, padding: 3, background: '#f2f2f5', borderRadius: 8 }}>
      {options.map(o => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 6,
              background: active ? '#fff' : 'transparent',
              color: active ? '#1d1d1f' : '#666',
              fontWeight: active ? 600 : 500,
              border: 'none',
              cursor: 'pointer',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all .15s',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function ConfirmDialog({
  title, message, onCancel, onConfirm,
}: {
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="admin-modal-mask" onClick={onCancel} style={{ zIndex: 2000 }}>
      <motion.div
        className="admin-modal"
        style={{ width: 380 }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <button onClick={onCancel} className="admin-btn admin-btn-ghost"><X size={16} /></button>
        </div>
        <div className="admin-modal-body">
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{message}</div>
          <div className="admin-modal-footer" style={{ margin: '20px -22px -20px -22px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="admin-btn admin-btn-secondary" onClick={onCancel}>取消</button>
            <button className="admin-btn admin-btn-danger" onClick={onConfirm}>确认删除</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============ Question Form (inline in side panel) ============
function QuestionForm({
  levelId, initial, onClose, onSaved, knowledgePoints,
}: {
  levelId: string
  initial: QuestionItem
  onClose: () => void
  onSaved: () => void
  knowledgePoints: string[]
}) {
  const toast = useToast()
  const [form, setForm] = useState<QuestionItem>({ ...initial, levelId: initial.levelId || levelId })
  const update = (k: keyof QuestionItem, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  async function submit() {
    if (!form.prompt || String(form.answer).trim() === '') {
      toast('error', '请填写题目内容和答案')
      return
    }
    try {
      const body: any = {
        id: form.id || undefined,
        levelId: form.levelId || levelId,
        type: form.type,
        knowledgePoint: form.knowledgePoint || '未分类',
        difficulty: Number(form.difficulty) || 1,
        difficulty_score: form.difficulty_score != null ? Number(form.difficulty_score) : undefined,
        prompt: form.prompt,
        answer: form.answer,
        explanation: form.explanation || '',
        xp: Number(form.xp) || 10,
      }
      if (form.options) body.options = form.options.filter(o => String(o).trim() !== '')
      if (form.illustration) body.illustration = form.illustration
      await adminContentApi.upsertQuestion(body)
      toast('success', '保存成功')
      onSaved()
    } catch (e: any) {
      toast('error', e.message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 12, padding: 14,
        background: '#f8f8fa', borderRadius: 12,
        border: '1px solid #ececef',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{initial.id ? '✏️ 编辑题目' : '➕ 新增题目'}</span>
        <button onClick={onClose} className="admin-btn admin-btn-ghost"><X size={14} /></button>
      </div>

      <div className="admin-grid admin-grid-2" style={{ gap: 12 }}>
        <div className="admin-form-row">
          <label className="admin-form-label">题目类型</label>
          <select className="admin-select" value={form.type} onChange={e => update('type', e.target.value as any)}>
            <option value="choice">选择题</option>
            <option value="input">填空题</option>
            <option value="drag">拖拽题</option>
          </select>
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">难度等级</label>
          <select className="admin-select" value={form.difficulty} onChange={e => update('difficulty', Number(e.target.value) as 1 | 2 | 3)}>
            <option value={1}>1 · 简单</option>
            <option value={2}>2 · 中等</option>
            <option value={3}>3 · 困难</option>
          </select>
        </div>
      </div>

      <div className="admin-form-row">
        <label className="admin-form-label">难度分 (1-10，用于动态出题，留空自动推导)</label>
        <input
          type="number" min={1} max={10} step={1}
          className="admin-input"
          value={form.difficulty_score ?? ''}
          onChange={e => update('difficulty_score', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="留空自动从难度等级推导"
        />
      </div>

      <div className="admin-form-row">
        <label className="admin-form-label">题目内容</label>
        <textarea
          className="admin-textarea"
          value={form.prompt}
          onChange={e => update('prompt', e.target.value)}
          rows={3}
          placeholder="请输入题目..."
        />
      </div>

      {form.type === 'choice' && (
        <div className="admin-form-row">
          <label className="admin-form-label">选项（每行一个）</label>
          <textarea
            className="admin-textarea"
            value={(form.options || []).join('\n')}
            onChange={e => update('options', e.target.value.split('\n'))}
            rows={4}
            placeholder={'A 选项\nB 选项\nC 选项\nD 选项'}
          />
        </div>
      )}

      <div className="admin-grid admin-grid-2" style={{ gap: 12 }}>
        <div className="admin-form-row">
          <label className="admin-form-label">正确答案</label>
          <input className="admin-input" value={String(form.answer)} onChange={e => update('answer', e.target.value)} />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">XP 奖励</label>
          <input type="number" className="admin-input" value={form.xp} onChange={e => update('xp', Number(e.target.value))} />
        </div>
      </div>

      <div className="admin-form-row">
        <label className="admin-form-label">知识点</label>
        <input
          className="admin-input"
          list="kp-datalist"
          value={form.knowledgePoint}
          onChange={e => update('knowledgePoint', e.target.value)}
          placeholder="如：20以内进位加法"
        />
        <datalist id="kp-datalist">
          {knowledgePoints.map(kp => <option key={kp} value={kp} />)}
        </datalist>
      </div>

      <div className="admin-grid admin-grid-2" style={{ gap: 12 }}>
        <div className="admin-form-row">
          <label className="admin-form-label">解析（可选）</label>
          <input className="admin-input" value={form.explanation || ''} onChange={e => update('explanation', e.target.value)} />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">表情/图释（可选）</label>
          <input className="admin-input" value={form.illustration || ''} onChange={e => update('illustration', e.target.value)} placeholder="如：🍎" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="admin-btn admin-btn-secondary" onClick={onClose}>取消</button>
        <button className="admin-btn admin-btn-primary" onClick={submit}>
          <FileText size={14} /> 保存
        </button>
      </div>
    </motion.div>
  )
}

// ============ Side Panel (Questions) ============
function QuestionPanel({
  level, onClose, onLevelChanged,
}: {
  level: LevelMeta
  onClose: () => void
  onLevelChanged: () => void
}) {
  const toast = useToast()
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<QuestionItem | null>(null)
  const [confirmDel, setConfirmDel] = useState<QuestionItem | null>(null)
  const [kpList, setKpList] = useState<string[]>([])

  // 过滤器
  const [fType, setFType] = useState<'all' | 'choice' | 'input' | 'drag'>('all')
  const [fDiff, setFDiff] = useState<'all' | '1' | '2' | '3'>('all')
  const [fKp, setFKp] = useState<string>('all')
  const [fSearch, setFSearch] = useState('')
  const [fExp, setFExp] = useState<'all' | 'yes' | 'no'>('all')

  async function load() {
    setLoading(true)
    try {
      const qs = await adminContentApi.getQuestions(level.id)
      setQuestions(qs)
    } catch (e: any) {
      toast('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadKp() {
    try {
      const data = await adminContentApi.knowledgePoints()
      setKpList(data)
    } catch (e: any) {
      toast('error', e.message)
    }
  }

  useEffect(() => { load() }, [level.id])
  useEffect(() => { loadKp() }, [level.grade])

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (fType !== 'all' && q.type !== fType) return false
      if (fDiff !== 'all' && String(q.difficulty) !== fDiff) return false
      if (fKp !== 'all' && (q.knowledgePoint || '') !== fKp) return false
      if (fExp === 'yes' && !q.explanation) return false
      if (fExp === 'no' && q.explanation) return false
      if (fSearch) {
        const s = fSearch.toLowerCase()
        const haystack = [q.prompt, ...(q.options || []), String(q.answer), q.explanation || '']
          .join(' ').toLowerCase()
        if (!haystack.includes(s)) return false
      }
      return true
    })
  }, [questions, fType, fDiff, fKp, fSearch, fExp])

  const typeLabel: Record<string, string> = { choice: '选择题', input: '填空题', drag: '拖拽题' }
  const diffStars = (d: 1 | 2 | 3) => '★'.repeat(d) + '☆'.repeat(3 - d)

  function makeNewQuestion(): QuestionItem {
    return {
      id: '', levelId: level.id, type: 'input',
      knowledgePoint: '', difficulty: 1, prompt: '',
      answer: '', explanation: '', xp: 10,
    }
  }

  async function deleteQuestion(q: QuestionItem) {
    if (!q.id) return
    try {
      await adminContentApi.deleteQuestion(q.id)
      toast('success', '已删除')
      setConfirmDel(null)
      load()
      onLevelChanged()
    } catch (e: any) {
      toast('error', e.message)
    }
  }

  return (
    <motion.div
      className="admin-sidepanel"
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(720px, 92vw)',
        background: '#fff', borderLeft: '1px solid #ececef',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        zIndex: 1500, overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #ececef',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'linear-gradient(180deg, #fff 0%, #fafafb 100%)',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="admin-tag admin-tag-blue">{level.grade} 年级</span>
            {level.isBoss && <span className="admin-tag admin-tag-red">BOSS</span>}
            <span className="admin-tag admin-tag-gray">排序 {level.sortOrder}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {level.chapter}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#999', marginTop: 2 }}>
            {level.id} · 共 {level.questionCount} 题
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="admin-btn admin-btn-secondary" onClick={load}><RefreshCw size={14} /> 刷新</button>
          <button onClick={onClose} className="admin-btn admin-btn-ghost"><X size={16} /></button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #ececef',
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        background: '#fafafb',
      }}>
        <div style={{ position: 'relative', minWidth: 180 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            className="admin-input" style={{ paddingLeft: 28, paddingTop: 6, paddingBottom: 6, fontSize: 12 }}
            placeholder="搜索题目/选项/答案..."
            value={fSearch} onChange={e => setFSearch(e.target.value)}
          />
        </div>
        <RadioPillGroup
          options={[
            { label: '全部类型', value: 'all' as const },
            { label: '选择', value: 'choice' as const },
            { label: '填空', value: 'input' as const },
            { label: '拖拽', value: 'drag' as const },
          ]}
          value={fType} onChange={v => setFType(v)}
        />
        <RadioPillGroup
          options={[
            { label: '全部难度', value: 'all' as const },
            { label: '简单', value: '1' as const },
            { label: '中等', value: '2' as const },
            { label: '困难', value: '3' as const },
          ]}
          value={fDiff} onChange={v => setFDiff(v)}
        />
        <select
          className="admin-select"
          style={{ paddingTop: 6, paddingBottom: 6, fontSize: 12 }}
          value={fKp} onChange={e => setFKp(e.target.value)}
        >
          <option value="all">全部知识点</option>
          {kpList.map(kp => <option key={kp} value={kp}>{kp}</option>)}
        </select>
        <RadioPillGroup
          options={[
            { label: '全部', value: 'all' as const },
            { label: '有解析', value: 'yes' as const },
            { label: '无解析', value: 'no' as const },
          ]}
          value={fExp} onChange={v => setFExp(v)}
        />
        <div style={{ marginLeft: 'auto' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => setEditing(makeNewQuestion())}>
            <Plus size={14} /> 新增题目
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: 40 }}>加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon"><FileText size={40} /></div>
            <div className="admin-empty-text">
              {questions.length === 0 ? '本关卡暂无题目，点击右上角"新增题目"开始' : '没有匹配的题目'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 10, paddingLeft: 4 }}>
              共 {filtered.length} 题 {filtered.length !== questions.length && `(从 ${questions.length} 题中筛选)`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((q, idx) => (
                <div key={q.id || idx} className="admin-card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#999' }}>#{idx + 1}</span>
                        <span className="admin-tag admin-tag-blue">{typeLabel[q.type] || q.type}</span>
                        <span className="admin-tag admin-tag-gold">难度 {diffStars(q.difficulty)}</span>
                        {q.difficulty_score != null && <span className="admin-tag admin-tag-purple">难度分 {q.difficulty_score}</span>}
                        {q.knowledgePoint && <span className="admin-tag admin-tag-gray">{q.knowledgePoint}</span>}
                        <span className="admin-tag admin-tag-green">+{q.xp} XP</span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 6, color: '#1d1d1f' }}>{q.prompt}</div>
                      {q.options && (
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          选项：{q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('  ')}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#666' }}>
                        答案：<b style={{ color: '#46A302' }}>{String(q.answer)}</b>
                        {q.explanation && <span style={{ color: '#888' }}> · 解析：{q.explanation}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="admin-btn admin-btn-ghost" onClick={() => setEditing(q)}><Pencil size={14} /></button>
                      <button className="admin-btn admin-btn-ghost" style={{ color: '#FF4B4B' }} onClick={() => setConfirmDel(q)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <AnimatePresence>
          {editing && (
            <QuestionForm
              levelId={level.id}
              initial={editing}
              knowledgePoints={kpList}
              onClose={() => setEditing(null)}
              onSaved={() => { setEditing(null); load(); onLevelChanged() }}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmDel && (
          <ConfirmDialog
            title="删除题目"
            message={`确认删除该题目？此操作不可撤销。`}
            onCancel={() => setConfirmDel(null)}
            onConfirm={() => deleteQuestion(confirmDel)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============ Level Form ============
function LevelForm({
  initial, onClose, onSaved, maxSortByGrade,
}: {
  initial: LevelMeta | null
  onClose: () => void
  onSaved: () => void
  maxSortByGrade: (grade: number) => number
}) {
  const toast = useToast()
  const [grade, setGrade] = useState<number>(initial?.grade ?? 1)
  const [chapter, setChapter] = useState(initial?.chapter ?? '')
  const [isBoss, setIsBoss] = useState<boolean>(initial?.isBoss ?? false)
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? maxSortByGrade(initial?.grade ?? 1) + 1)
  const [id, setId] = useState<string>(initial?.id ?? '')

  // 当年级变化且当前 sortOrder 为空时自动提示
  useEffect(() => {
    if (!initial) {
      setSortOrder(maxSortByGrade(grade) + 1)
    }
  }, [grade])

  async function submit() {
    if (!chapter.trim()) {
      toast('error', '请填写章节标题')
      return
    }
    try {
      await adminContentApi.upsertLevel({
        id: id || undefined, grade, chapter, sortOrder, isBoss,
        unitId: initial?.unitId,
      })
      toast('success', '保存成功')
      onSaved()
    } catch (e: any) {
      toast('error', e.message)
    }
  }

  return (
    <div className="admin-modal-mask" onClick={onClose} style={{ zIndex: 1600 }}>
      <motion.div
        className="admin-modal"
        style={{ width: '90vw', maxWidth: 520 }}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="admin-modal-header">
          <div>
            <h3 className="admin-modal-title">{initial ? '编辑关卡' : '新增关卡'}</h3>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              sortOrder 决定关卡在年级内的显示顺序
            </div>
          </div>
          <button onClick={onClose} className="admin-btn admin-btn-ghost"><X size={16} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-form-row">
            <label className="admin-form-label">关卡 ID（留空自动生成）</label>
            <input className="admin-input" value={id} onChange={e => setId(e.target.value)} placeholder="如：g1-L7" />
          </div>
          <div className="admin-grid admin-grid-2" style={{ gap: 12 }}>
            <div className="admin-form-row">
              <label className="admin-form-label">年级</label>
              <select className="admin-select" value={grade} onChange={e => setGrade(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => <option key={g} value={g}>{g} 年级</option>)}
              </select>
            </div>
            <div className="admin-form-row">
              <label className="admin-form-label">sortOrder（显示顺序，小的在前）</label>
              <input type="number" className="admin-input" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
            </div>
          </div>
          <div className="admin-form-row">
            <label className="admin-form-label">章节标题</label>
            <input className="admin-input" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="如：分数的初步认识" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
            <input type="checkbox" checked={isBoss} onChange={e => setIsBoss(e.target.checked)} />
            标记为 BOSS 关卡
          </label>
          <div className="admin-modal-footer" style={{ margin: '20px -22px -20px -22px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="admin-btn admin-btn-secondary" onClick={onClose}>取消</button>
            <button className="admin-btn admin-btn-primary" onClick={submit}><FileText size={14} /> 保存</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============ Main Page ============
export default function QuestionBank() {
  const toast = useToast()
  const [levels, setLevels] = useState<LevelMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLevel, setActiveLevel] = useState<LevelMeta | null>(null)
  const [editingLevel, setEditingLevel] = useState<LevelMeta | null>(null)
  const [showLevelForm, setShowLevelForm] = useState(false)
  const [confirmDel, setConfirmDel] = useState<LevelMeta | null>(null)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  // 关卡过滤器
  const [fGrade, setFGrade] = useState<number | ''>('')
  const [fBoss, setFBoss] = useState<'all' | 'normal' | 'boss'>('all')
  const [fCount, setFCount] = useState<'all' | 'has' | 'empty'>('all')
  const [fSearch, setFSearch] = useState('')
  const [fSort, setFSort] = useState<'sortOrder' | 'count'>('sortOrder')

  async function loadLevels() {
    setLoading(true)
    try {
      const data = await adminContentApi.listLevels(
        fGrade === '' ? undefined : fGrade
      )
      setLevels(data)
    } catch (e: any) {
      toast('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLevels() }, [fGrade])

  // 按年级分组 + 过滤 + 排序
  const grouped = useMemo(() => {
    const byGrade = new Map<number, LevelMeta[]>()
    for (const lv of levels) {
      // 过滤
      if (fBoss === 'boss' && !lv.isBoss) continue
      if (fBoss === 'normal' && lv.isBoss) continue
      if (fCount === 'has' && lv.questionCount === 0) continue
      if (fCount === 'empty' && lv.questionCount > 0) continue
      if (fSearch) {
        const s = fSearch.toLowerCase()
        const hay = [
          lv.chapter, lv.id, ...(lv.knowledgePoints || []),
        ].join(' ').toLowerCase()
        if (!hay.includes(s)) continue
      }
      if (!byGrade.has(lv.grade)) byGrade.set(lv.grade, [])
      byGrade.get(lv.grade)!.push(lv)
    }
    // 年级按数字排序
    const grades = Array.from(byGrade.keys()).sort((a, b) => a - b)
    // 每个年级内按 sortOrder 升序（或题目数降序）
    for (const g of grades) {
      byGrade.get(g)!.sort((a, b) => {
        if (fSort === 'count') return b.questionCount - a.questionCount
        return a.sortOrder - b.sortOrder
      })
    }
    return { grades, byGrade }
  }, [levels, fBoss, fCount, fSearch, fSort])

  function maxSortByGrade(grade: number): number {
    const list = levels.filter(l => l.grade === grade)
    if (list.length === 0) return 0
    return Math.max(...list.map(l => l.sortOrder || 0))
  }

  async function deleteLevel(lv: LevelMeta) {
    try {
      await adminContentApi.deleteLevel(lv.id)
      toast('success', '已删除')
      setConfirmDel(null)
      loadLevels()
    } catch (e: any) {
      toast('error', e.message)
    }
  }

  const totalLevels = levels.length
  const totalQuestions = levels.reduce((s, l) => s + (l.questionCount || 0), 0)

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">题库管理</h1>
          <p className="admin-page-subtitle">
            共 {totalLevels} 个关卡 · {totalQuestions} 道题目 · 点击关卡的「题目」管理题目
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-secondary" onClick={loadLevels}>
            <RefreshCw size={14} /> 刷新
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => {
            setEditingLevel(null); setShowLevelForm(true)
          }}>
            <Plus size={14} /> 新增关卡
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        padding: 14, background: '#fafafb',
        border: '1px solid #ececef', borderRadius: 12,
        marginBottom: 16, display: 'flex', flexWrap: 'wrap',
        gap: 10, alignItems: 'center',
      }}>
        <Sliders size={14} style={{ color: '#888' }} />
        <select
          className="admin-select" style={{ paddingTop: 7, paddingBottom: 7, fontSize: 13 }}
          value={fGrade}
          onChange={e => setFGrade(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">全部年级</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => <option key={g} value={g}>{g} 年级</option>)}
        </select>
        <RadioPillGroup
          options={[
            { label: '全部关卡', value: 'all' as const },
            { label: '普通关卡', value: 'normal' as const },
            { label: '仅 BOSS', value: 'boss' as const },
          ]}
          value={fBoss} onChange={v => setFBoss(v)}
        />
        <RadioPillGroup
          options={[
            { label: '有/无题', value: 'all' as const },
            { label: '有题目', value: 'has' as const },
            { label: '空关卡', value: 'empty' as const },
          ]}
          value={fCount} onChange={v => setFCount(v)}
        />
        <RadioPillGroup
          options={[
            { label: '按排序显示', value: 'sortOrder' as const },
            { label: '按题目数', value: 'count' as const },
          ]}
          value={fSort} onChange={v => setFSort(v)}
        />
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            className="admin-input"
            style={{ paddingLeft: 28, paddingTop: 7, paddingBottom: 7, fontSize: 13 }}
            placeholder="搜索章节/ID/知识点..."
            value={fSearch} onChange={e => setFSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content: Tree outline by grade */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: 40 }}>加载中...</div>
      ) : grouped.grades.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon"><BookOpen size={40} /></div>
          <div className="admin-empty-text">没有匹配的关卡</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {grouped.grades.map(g => {
            const list = grouped.byGrade.get(g)!
            const isCollapsed = collapsed[g]
            return (
              <motion.div
                key={g}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#fff', border: '1px solid #ececef', borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {/* Grade header */}
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, [g]: !isCollapsed }))}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'linear-gradient(180deg, #fff 0%, #fafafb 100%)',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: isCollapsed ? 'none' : '1px solid #ececef',
                  }}
                >
                  {isCollapsed ? <ChevronRight size={16} color="#666" /> : <ChevronDown size={16} color="#666" />}
                  <BookOpen size={16} color="#58CC02" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{g} 年级</span>
                  <span className="admin-tag admin-tag-gray" style={{ marginLeft: 4 }}>{list.length} 关</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>
                    {list.reduce((s, l) => s + (l.questionCount || 0), 0)} 题
                  </span>
                </button>

                {/* Levels in grade */}
                {!isCollapsed && (
                  <div style={{ padding: '4px 16px 12px 48px' }}>
                    {list.map((lv, idx) => {
                      const isActive = activeLevel?.id === lv.id
                      return (
                        <div
                          key={lv.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px',
                            marginTop: idx === 0 ? 8 : 4,
                            background: isActive ? 'rgba(88, 204, 2, 0.05)' : '#fafafa',
                            border: isActive ? '1px solid rgba(88, 204, 2, 0.3)' : '1px solid transparent',
                            borderRadius: 10,
                            transition: 'all .15s',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = '#f2f2f5'
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = '#fafafa'
                          }}
                        >
                          <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: lv.isBoss
                              ? 'linear-gradient(135deg, #FF4B4B 0%, #FF7B7B 100%)'
                              : 'linear-gradient(135deg, #58CC02 0%, #7ED321 100%)',
                            color: '#fff', fontSize: 14, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {lv.isBoss ? <Crown size={16} /> : lv.grade}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>{lv.chapter}</div>
                            <div style={{
                              fontSize: 11, color: '#999', fontFamily: 'monospace',
                              marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                            }}>
                              <Tag size={10} /> {lv.id}
                              <span>·</span>
                              <ListOrdered size={10} /> sortOrder: {lv.sortOrder}
                              <span>·</span>
                              <ListIcon size={10} /> {lv.questionCount} 题
                            </div>
                            {lv.knowledgePoints && lv.knowledgePoints.length > 0 && (
                              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {lv.knowledgePoints.slice(0, 5).map(kp => (
                                  <span key={kp} style={{
                                    fontSize: 10, padding: '1px 6px', borderRadius: 6,
                                    background: 'rgba(88,204,2,0.08)', color: '#46A302',
                                  }}>{kp}</span>
                                ))}
                                {lv.knowledgePoints.length > 5 && (
                                  <span style={{ fontSize: 10, color: '#999' }}>
                                    +{lv.knowledgePoints.length - 5}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              className="admin-btn admin-btn-secondary"
                              style={isActive ? { background: '#58CC02', color: '#fff', borderColor: '#58CC02' } : undefined}
                              onClick={() => setActiveLevel(lv)}
                            >
                              <FileText size={14} /> 题目
                            </button>
                            <button className="admin-btn admin-btn-ghost" onClick={() => {
                              setEditingLevel(lv); setShowLevelForm(true)
                            }}>
                              <Pencil size={14} /> 编辑
                            </button>
                            <button className="admin-btn admin-btn-ghost" style={{ color: '#FF4B4B' }} onClick={() => setConfirmDel(lv)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {activeLevel && (
          <QuestionPanel
            level={activeLevel}
            onClose={() => setActiveLevel(null)}
            onLevelChanged={() => loadLevels()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLevelForm && (
          <LevelForm
            initial={editingLevel}
            maxSortByGrade={maxSortByGrade}
            onClose={() => setShowLevelForm(false)}
            onSaved={() => { setShowLevelForm(false); loadLevels() }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDel && (
          <ConfirmDialog
            title="删除关卡"
            message={`确认删除「${confirmDel.chapter}」及其所有题目？此操作不可撤销。`}
            onCancel={() => setConfirmDel(null)}
            onConfirm={() => deleteLevel(confirmDel)}
          />
        )}
      </AnimatePresence>

      {/* Hint */}
      <div style={{
        marginTop: 24, padding: 12, borderRadius: 10,
        background: 'rgba(88, 204, 2, 0.06)', border: '1px solid rgba(88, 204, 2, 0.15)',
        display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#555',
      }}>
        <Info size={14} color="#58CC02" style={{ flexShrink: 0 }} />
        <div>
          小提示：关卡在年级内按 <b>sortOrder</b> 从小到大显示，可在关卡表单中修改该值调整位置。点击「题目」管理该关卡的全部题目。
        </div>
      </div>
    </div>
  )
}
