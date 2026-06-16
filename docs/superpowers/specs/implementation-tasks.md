# MathQuest 好友系统实现方案

## 一、数据模型

### 1.1 后端类型定义 (`/workspace/server/types.ts`)

新增类型：

```typescript
// 班级
export interface Class {
  id: string
  code: string        // 唯一班级码，如 "2024A1B2"
  name: string        // 班级名称
  createdBy: string   // 创建者 userId
  createdAt: number   // timestamp
}

// 班级成员
export interface ClassMember {
  id: string
  classId: string    // FK -> Class.id
  userId: string
  joinedAt: number
}

// 鼓励记录
export interface Encouragement {
  id: string
  fromUserId: string
  toUserId: string
  emoji: string       // "flower"
  context: string    // 触发情境描述
  createdAt: number
}
```

### 1.2 t_user 表新增字段（内存存储中扩展 User 接口）

```typescript
// server/types.ts - User 接口扩展
export interface User {
  // ... 现有字段
  classId?: string | null   // 所属班级 ID
  flowers?: number          // 小花余额（默认 5）
  lastFlowerResetDate?: string  // 上次重置日期 YYYY-MM-DD
}
```

---

## 二、后端实现

### 2.1 内存存储 (`/workspace/server/services/storage.ts`)

在文件末尾添加：

```typescript
// ===== 班级存储 =====
const memoryClasses = new Map<string, Class>()
const memoryClassCodes = new Map<string, string>() // code -> classId（用于快速查找）
const memoryClassMembers = new Map<string, ClassMember>() // id -> ClassMember
// 索引：classId -> memberIds[]
const memoryClassMemberIndex = new Map<string, string[]>()
// 索引：userId -> memberId
const memoryUserClassIndex = new Map<string, string>()

export async function createClass(code: string, name: string, createdBy: string): Promise<Class> {
  const id = `class-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const now = Date.now()
  const cls: Class = { id, code, name, createdBy, createdAt: now }
  if (isMemoryMode()) {
    memoryClasses.set(id, cls)
    memoryClassCodes.set(code, id)
    console.log(`[Memory] 创建班级: code=${code}, id=${id}`)
    return cls
  }
  // MySQL 模式暂不实现
  return cls
}

export async function findClassByCode(code: string): Promise<Class | null> {
  if (isMemoryMode()) {
    const classId = memoryClassCodes.get(code)
    return classId ? memoryClasses.get(classId) || null : null
  }
  return null
}

export async function findClassById(id: string): Promise<Class | null> {
  if (isMemoryMode()) return memoryClasses.get(id) || null
  return null
}

export async function addClassMember(classId: string, userId: string): Promise<ClassMember> {
  const id = `cm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const member: ClassMember = { id, classId, userId, joinedAt: Date.now() }
  if (isMemoryMode()) {
    memoryClassMembers.set(id, member)
    // 维护索引
    const memberIds = memoryClassMemberIndex.get(classId) || []
    memoryClassMemberIndex.set(classId, [...memberIds, id])
    memoryUserClassIndex.set(userId, id)
    return member
  }
  return member
}

export async function removeClassMember(userId: string): Promise<void> {
  if (isMemoryMode()) {
    const memberId = memoryUserClassIndex.get(userId)
    if (memberId) {
      const member = memoryClassMembers.get(memberId)
      if (member) {
        memoryClassMemberIndex.set(
          member.classId,
          (memoryClassMemberIndex.get(member.classId) || []).filter(id => id !== memberId)
        )
      }
      memoryClassMembers.delete(memberId)
      memoryUserClassIndex.delete(userId)
    }
  }
}

export async function getClassMemberByUserId(userId: string): Promise<ClassMember | null> {
  if (isMemoryMode()) {
    const memberId = memoryUserClassIndex.get(userId)
    return memberId ? memoryClassMembers.get(memberId) || null : null
  }
  return null
}

export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  if (isMemoryMode()) {
    const memberIds = memoryClassMemberIndex.get(classId) || []
    return memberIds.map(id => memoryClassMembers.get(id)).filter(Boolean) as ClassMember[]
  }
  return []
}

export async function getUserClassInfo(userId: string): Promise<{ class: Class | null; members: ClassMember[] }> {
  const member = await getClassMemberByUserId(userId)
  if (!member) return { class: null, members: [] }
  const cls = await findClassById(member.classId)
  const members = await getClassMembers(member.classId)
  return { class: cls, members }
}

// ===== 鼓励存储 =====
const memoryEncouragements = new Map<string, Encouragement>()
// 索引：toUserId -> encouragementIds[]
const memoryEncouragementIndex = new Map<string, string[]>()

export async function createEncouragement(fromUserId: string, toUserId: string, emoji: string, context: string): Promise<Encouragement> {
  const id = `enc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const record: Encouragement = { id, fromUserId, toUserId, emoji, context, createdAt: Date.now() }
  if (isMemoryMode()) {
    memoryEncouragements.set(id, record)
    const ids = memoryEncouragementIndex.get(toUserId) || []
    memoryEncouragementIndex.set(toUserId, [...ids, id])
    return record
  }
  return record
}

export async function getReceivedEncouragements(userId: string): Promise<Encouragement[]> {
  if (isMemoryMode()) {
    const ids = memoryEncouragementIndex.get(userId) || []
    return ids.map(id => memoryEncouragements.get(id)).filter(Boolean).sort((a, b) => b!.createdAt - a!.createdAt) as Encouragement[]
  }
  return []
}

export async function getSentTodayCount(userId: string): Promise<number> {
  if (isMemoryMode()) {
    const today = new Date().toISOString().split('T')[0]
    let count = 0
    for (const enc of memoryEncouragements.values()) {
      if (enc.fromUserId === userId) {
        const encDate = new Date(enc.createdAt).toISOString().split('T')[0]
        if (encDate === today) count++
      }
    }
    return count
  }
  return 0
}
```

### 2.2 用户表扩展 - 更新 `findUserById` / `updateUser`

修改 `server/services/storage.ts` 中 `findUserById` 返回值，增加 `classId`、`flowers`、`lastFlowerResetDate` 字段。

### 2.3 业务逻辑服务 (`/workspace/server/services/class.ts` - 新建)

```typescript
/**
 * 班级和鼓励业务逻辑
 */
import {
  createClass, findClassByCode, findClassById, addClassMember,
  removeClassMember, getClassMemberByUserId, getUserClassInfo,
  findUserById, updateUser,
  createEncouragement, getReceivedEncouragements, getSentTodayCount,
} from './storage'

const DAILY_FLOWER_LIMIT = 3
const INITIAL_FLOWERS = 5

// 生成6位班级码
function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// 重置小花余额检查
export async function checkAndResetFlowers(userId: string): Promise<number> {
  const user = await findUserById(userId)
  if (!user) return INITIAL_FLOWERS
  
  const today = new Date().toISOString().split('T')[0]
  const lastReset = user.lastFlowerResetDate || ''
  
  if (lastReset !== today) {
    await updateUser(userId, { flowers: INITIAL_FLOWERS, lastFlowerResetDate: today })
    return INITIAL_FLOWERS
  }
  return user.flowers ?? INITIAL_FLOWERS
}

// POST /api/class/create
export async function classCreate(userId: string, name: string): Promise<{ success: boolean; message: string; class?: any }> {
  // 检查是否已在班级
  const existing = await getClassMemberByUserId(userId)
  if (existing) {
    return { success: false, message: '您已在班级中，请先退出当前班级' }
  }
  
  // 生成唯一班级码
  let code: string
  do {
    code = generateClassCode()
  } while (await findClassByCode(code))
  
  const cls = await createClass(code, name, userId)
  await addClassMember(cls.id, userId)
  await updateUser(userId, { classId: cls.id })
  
  return { success: true, message: '班级创建成功', class: cls }
}

// POST /api/class/join
export async function classJoin(userId: string, code: string): Promise<{ success: boolean; message: string; class?: any }> {
  // 检查是否已在班级
  const existing = await getClassMemberByUserId(userId)
  if (existing) {
    return { success: false, message: '您已在班级中，请先退出当前班级' }
  }
  
  const cls = await findClassByCode(code.toUpperCase())
  if (!cls) {
    return { success: false, message: '班级码不存在' }
  }
  
  await addClassMember(cls.id, userId)
  await updateUser(userId, { classId: cls.id })
  
  return { success: true, message: '加入班级成功', class: cls }
}

// POST /api/class/leave
export async function classLeave(userId: string): Promise<{ success: boolean; message: string }> {
  const member = await getClassMemberByUserId(userId)
  if (!member) {
    return { success: false, message: '您未加入任何班级' }
  }
  
  await removeClassMember(userId)
  await updateUser(userId, { classId: null })
  
  return { success: true, message: '已退出班级' }
}

// GET /api/class/me
export async function classMe(userId: string): Promise<{ success: boolean; message: string; class?: any; memberCount?: number }> {
  const { class: cls, members } = await getUserClassInfo(userId)
  if (!cls) {
    return { success: false, message: '您未加入任何班级' }
  }
  
  return { success: true, message: 'ok', class: cls, memberCount: members.length }
}

// GET /api/class/members
export async function classMembers(userId: string, grade?: number): Promise<{ success: boolean; message: string; members?: any[] }> {
  const member = await getClassMemberByUserId(userId)
  if (!member) {
    return { success: false, message: '您未加入任何班级' }
  }
  
  const cls = await findClassById(member.classId)
  if (!cls) {
    return { success: false, message: '班级不存在' }
  }
  
  const allMembers = await getClassMembers(member.classId)
  // 过滤同 grade 的成员（根据用户信息中的 targetGrade）
  const memberUsers = []
  for (const m of allMembers) {
    const u = await findUserById(m.userId)
    if (u) {
      // 需要获取用户 XP、nickname、avatar 等信息
      memberUsers.push({
        userId: u.id,
        nickname: u.nickname || '匿名',
        avatar: u.avatar || '🧒',
        targetGrade: u.targetGrade || 1,
        totalXp: 0, // TODO: 需要关联 XP 数据
        classCode: cls.code,
        className: cls.name,
        joinedAt: m.joinedAt,
      })
    }
  }
  
  // 按 grade 过滤
  const filtered = grade !== undefined
    ? memberUsers.filter(u => u.targetGrade === grade)
    : memberUsers
  
  // 按 XP 降序排列
  filtered.sort((a, b) => b.totalXp - a.totalXp)
  
  return { success: true, message: 'ok', members: filtered }
}

// POST /api/encouragement/send
export async function encouragementSend(
  fromUserId: string,
  toUserId: string,
  context: string = ''
): Promise<{ success: boolean; message: string }> {
  if (fromUserId === toUserId) {
    return { success: false, message: '不能给自己送花' }
  }
  
  // 检查目标用户是否存在
  const toUser = await findUserById(toUserId)
  if (!toUser) {
    return { success: false, message: '用户不存在' }
  }
  
  // 重置并检查小花余额
  const flowers = await checkAndResetFlowers(fromUserId)
  
  // 检查今日发送次数
  const sentToday = await getSentTodayCount(fromUserId)
  if (sentToday >= DAILY_FLOWER_LIMIT) {
    return { success: false, message: '今日送花次数已用完（每天最多3朵）' }
  }
  
  if (flowers <= 0) {
    return { success: false, message: '小花不足，明天再来！' }
  }
  
  // 扣减小花
  await updateUser(fromUserId, { flowers: flowers - 1 })
  
  // 记录鼓励
  await createEncouragement(fromUserId, toUserId, 'flower', context)
  
  return { success: true, message: '送花成功' }
}

// GET /api/encouragement/received
export async function encouragementReceived(userId: string): Promise<{ success: boolean; message: string; encouragements?: any[]; totalFlowers?: number }> {
  const encouragements = await getReceivedEncouragements(userId)
  
  // 补充发送者信息
  const enriched = []
  for (const enc of encouragements) {
    const fromUser = await findUserById(enc.fromUserId)
    enriched.push({
      id: enc.id,
      fromUserId: enc.fromUserId,
      fromNickname: fromUser?.nickname || '匿名',
      fromAvatar: fromUser?.avatar || '🧒',
      emoji: enc.emoji,
      context: enc.context,
      createdAt: enc.createdAt,
    })
  }
  
  const totalFlowers = encouragements.filter(e => e.emoji === 'flower').length
  
  return { success: true, message: 'ok', encouragements: enriched, totalFlowers }
}
```

### 2.4 路由文件 (`/workspace/server/routes/class.ts` - 新建)

```typescript
/**
 * 班级和鼓励相关 API 路由
 */
import { Router, Request, Response } from 'express'
import { classCreate, classJoin, classLeave, classMe, classMembers, encouragementSend, encouragementReceived } from '../services/class'
import { findUserById } from '../services/storage'

const router = Router()

// 获取当前用户（中间件简化版，实际应复用 auth 中间件）
async function getUserId(req: Request): Promise<string | null> {
  const userId = req.query.userId as string
  if (!userId) return null
  const user = await findUserById(userId)
  return user ? userId : null
}

// POST /api/class/create
router.post('/create', async (req: Request, res: Response) => {
  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: '请先登录' })
    return
  }
  const { name } = req.body
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, message: '班级名称不能为空' })
    return
  }
  const result = await classCreate(userId, name.trim())
  res.json(result)
})

// POST /api/class/join
router.post('/join', async (req: Request, res: Response) => {
  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: '请先登录' })
    return
  }
  const { code } = req.body
  if (!code || !code.trim()) {
    res.status(400).json({ success: false, message: '班级码不能为空' })
    return
  }
  const result = await classJoin(userId, code.trim())
  res.json(result)
})

// POST /api/class/leave
router.post('/leave', async (req: Request, res: Response) => {
  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: '请先登录' })
    return
  }
  const result = await classLeave(userId)
  res.json(result)
})

// GET /api/class/me
router.get('/me', async (req: Request, res: Response) => {
  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: '请先登录' })
    return
  }
  const result = await classMe(userId)
  if (!result.success && result.message === '您未加入任何班级') {
    res.status(200).json({ success: true, message: 'ok', class: null })
    return
  }
  res.json(result)
})

// GET /api/class/members?grade=X
router.get('/members', async (req: Request, res: Response) => {
  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: '请先登录' })
    return
  }
  const grade = req.query.grade ? Number(req.query.grade) : undefined
  const result = await classMembers(userId, grade)
  res.json(result)
})

// POST /api/encouragement/send
router.post('/send', async (req: Request, res: Response) => {
  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: '请先登录' })
    return
  }
  const { toUserId, context } = req.body
  if (!toUserId) {
    res.status(400).json({ success: false, message: '缺少目标用户ID' })
    return
  }
  const result = await encouragementSend(userId, toUserId, context || '')
  res.json(result)
})

// GET /api/encouragement/received
router.get('/received', async (req: Request, res: Response) => {
  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, message: '请先登录' })
    return
  }
  const result = await encouragementReceived(userId)
  res.json(result)
})

export default router
```

### 2.5 注册路由 (`/workspace/server/index.ts`)

在 `app.use('/api/auth', ...)` 后添加：

```typescript
import classRoutes from './routes/class'

// ... 其他路由
app.use('/api/class', classRoutes)
app.use('/api/encouragement', classRoutes)
```

---

## 三、前端实现

### 3.1 API 服务 (`/workspace/src/services/classApi.ts` - 新建)

```typescript
/**
 * 班级和鼓励相关 API 调用
 */
import { post, get } from '@/utils/request'

const API_BASE = '/api/class'
const ENCOURAGEMENT_API_BASE = '/api/encouragement'

// 班级
export async function createClass(name: string, userId: string) {
  return post<{ success: boolean; message: string; class?: any }>(
    `${API_BASE}/create`,
    { name, userId }
  )
}

export async function joinClass(code: string, userId: string) {
  return post<{ success: boolean; message: string; class?: any }>(
    `${API_BASE}/join`,
    { code, userId }
  )
}

export async function leaveClass(userId: string) {
  return post<{ success: boolean; message: string }>(
    `${API_BASE}/leave`,
    { userId }
  )
}

export async function getMyClass(userId: string) {
  return get<{ success: boolean; message: string; class?: any; memberCount?: number }>(
    `${API_BASE}/me?userId=${encodeURIComponent(userId)}`
  )
}

export async function getClassMembers(userId: string, grade?: number) {
  let url = `${API_BASE}/members?userId=${encodeURIComponent(userId)}`
  if (grade !== undefined) url += `&grade=${grade}`
  return get<{ success: boolean; message: string; members?: ClassMember[] }>(url)
}

// 鼓励
export async function sendFlower(toUserId: string, userId: string, context?: string) {
  return post<{ success: boolean; message: string }>(
    `${ENCOURAGEMENT_API_BASE}/send`,
    { toUserId, userId, context }
  )
}

export async function getReceivedEncouragements(userId: string) {
  return get<{
    success: boolean
    message: string
    encouragements?: EncouragementItem[]
    totalFlowers?: number
  }>(`${ENCOURAGEMENT_API_BASE}/received?userId=${encodeURIComponent(userId)}`)
}

// 类型定义
export interface ClassMember {
  userId: string
  nickname: string
  avatar: string
  targetGrade: number
  totalXp: number
  classCode: string
  className: string
  joinedAt: number
}

export interface EncouragementItem {
  id: string
  fromUserId: string
  fromNickname: string
  fromAvatar: string
  emoji: string
  context: string
  createdAt: number
}
```

### 3.2 Profile 页改造 (`/workspace/src/pages/Profile.tsx`)

在"快捷操作"区域下方添加"我的班级"卡片：

```tsx
// 在快捷操作区域后添加
import { useState, useEffect } from 'react'
import { Users, Plus, LogOut, Copy, Loader2 } from 'lucide-react'
import { getMyClass, createClass, joinClass, leaveClass } from '@/services/classApi'
import { handleApiError } from '@/utils/apiError'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ... 在 Profile 组件内添加状态
const [classInfo, setClassInfo] = useState<{ class: any; memberCount: number } | null>(null)
const [loadingClass, setLoadingClass] = useState(false)
const [showClassDialog, setShowClassDialog] = useState<'create' | 'join' | null>(null)
const [classDialogLoading, setClassDialogLoading] = useState(false)
const [classNameInput, setClassNameInput] = useState('')
const [classCodeInput, setClassCodeInput] = useState('')

// 加载班级信息
useEffect(() => {
  if (!user.userId) return
  loadClassInfo()
}, [user.userId])

async function loadClassInfo() {
  if (!user.userId) return
  setLoadingClass(true)
  try {
    const res = await getMyClass(user.userId)
    if (res.success && res.class) {
      setClassInfo({ class: res.class, memberCount: res.memberCount || 0 })
    } else {
      setClassInfo(null)
    }
  } finally {
    setLoadingClass(false)
  }
}

async function handleCreateClass() {
  if (!classNameInput.trim() || !user.userId) return
  setClassDialogLoading(true)
  try {
    const res = await createClass(classNameInput.trim(), user.userId)
    if (res.success) {
      toast.success('班级创建成功！')
      setShowClassDialog(null)
      setClassNameInput('')
      loadClassInfo()
    } else {
      toast.error(res.message)
    }
  } catch (err) {
    handleApiError(err, '创建班级失败')
  } finally {
    setClassDialogLoading(false)
  }
}

async function handleJoinClass() {
  if (!classCodeInput.trim() || !user.userId) return
  setClassDialogLoading(true)
  try {
    const res = await joinClass(classCodeInput.trim(), user.userId)
    if (res.success) {
      toast.success('加入成功！')
      setShowClassDialog(null)
      setClassCodeInput('')
      loadClassInfo()
    } else {
      toast.error(res.message)
    }
  } catch (err) {
    handleApiError(err, '加入班级失败')
  } finally {
    setClassDialogLoading(false)
  }
}

async function handleLeaveClass() {
  if (!user.userId) return
  setClassDialogLoading(true)
  try {
    const res = await leaveClass(user.userId)
    if (res.success) {
      toast.success('已退出班级')
      setClassInfo(null)
    } else {
      toast.error(res.message)
    }
  } catch (err) {
    handleApiError(err, '退出班级失败')
  } finally {
    setClassDialogLoading(false)
  }
}

// ... 在 render 中，在快捷操作区域后添加班级卡片
{/* ═══════════ 我的班级 ═══════════ */}
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-1.5">
        <Users size={15} className="text-primary" />
        我的班级
      </CardTitle>
    </CardHeader>
    <CardContent>
      {loadingClass ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : classInfo ? (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 grid place-items-center text-lg">
            🏫
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">{classInfo.class.name}</div>
            <div className="text-xs text-muted-foreground">
              班级码: {classInfo.class.code} · {classInfo.memberCount} 名成员
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleLeaveClass}
            disabled={classDialogLoading}
          >
            <LogOut size={12} className="mr-1" />
            退出
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-9 text-xs"
            onClick={() => setShowClassDialog('join')}
          >
            <Plus size={14} className="mr-1" />
            加入班级
          </Button>
          <Button
            variant="default"
            className="flex-1 h-9 text-xs"
            onClick={() => setShowClassDialog('create')}
          >
            <Plus size={14} className="mr-1" />
            创建班级
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</motion.div>

// ... 在 return 末尾添加 Dialog
{/* 创建班级弹窗 */}
<Dialog open={showClassDialog === 'create'} onOpenChange={() => setShowClassDialog(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>创建班级</DialogTitle>
    </DialogHeader>
    <div className="space-y-3 pt-2">
      <Input
        placeholder="输入班级名称"
        value={classNameInput}
        onChange={(e) => setClassNameInput(e.target.value)}
        maxLength={20}
      />
      <Button
        className="w-full"
        onClick={handleCreateClass}
        disabled={!classNameInput.trim() || classDialogLoading}
      >
        {classDialogLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        创建
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* 加入班级弹窗 */}
<Dialog open={showClassDialog === 'join'} onOpenChange={() => setShowClassDialog(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>加入班级</DialogTitle>
    </DialogHeader>
    <div className="space-y-3 pt-2">
      <Input
        placeholder="输入班级码"
        value={classCodeInput}
        onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
        maxLength={8}
      />
      <Button
        className="w-full"
        onClick={handleJoinClass}
        disabled={!classCodeInput.trim() || classDialogLoading}
      >
        {classDialogLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        加入
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 3.3 Leaderboard 页改造 (`/workspace/src/pages/Leaderboard.tsx`)

修改 Tab 结构，将"同学"Tab 改为真正的同学排行榜：

```tsx
// 修改 tab 类型
const [tab, setTab] = useState<'classmates' | 'global' | 'rank'>('classmates')

// 修改 TabsList
<TabsList className="w-full rounded-xl bg-muted p-1 grid grid-cols-3 gap-1">
  <TabsTrigger value="classmates" ...>
    <Users size={16} className="mr-1.5" />
    同学
  </TabsTrigger>
  <TabsTrigger value="global" ...>
    <Trophy size={16} className="mr-1.5" />
    总榜
  </TabsTrigger>
  <TabsTrigger value="rank" ...>
    <Award size={16} className="mr-1.5" />
    段位
  </TabsTrigger>
</TabsList>

// 修改 useEffect
useEffect(() => {
  if (tab === 'classmates') {
    setLoading(true)
    getClassMembers(user.userId || '', user.profile.targetGrade)
      .then(data => {
        if (data.success && data.members) {
          setRankingData(data.members.map((m, i) => ({
            rank: i + 1,
            userId: m.userId,
            nickname: m.nickname,
            avatar: m.avatar,
            targetGrade: m.targetGrade,
            totalXp: m.totalXp,
            totalSessions: 0,
            correctRate: 0,
          })))
        } else {
          setRankingData([])
        }
      })
      .catch(() => setRankingData([]))
      .finally(() => setLoading(false))
  } else if (tab === 'global') {
    setLoading(true)
    getLeaderboard(50, user.profile.targetGrade)
      .then(data => setRankingData(data))
      .catch(() => setRankingData([]))
      .finally(() => setLoading(false))
  }
}, [tab])

// 在列表项中添加"送花"按钮
// 在卡片右侧添加 Flower 按钮
import { Flower } from 'lucide-react'
const [sentFlowers, setSentFlowers] = useState<Set<string>>(new Set())

async function handleSendFlower(toUserId: string) {
  if (!user.userId) return
  try {
    const res = await sendFlower(toUserId, user.userId)
    if (res.success) {
      toast.success('送花成功！')
      setSentFlowers(prev => new Set([...prev, toUserId]))
    } else {
      toast.error(res.message)
    }
  } catch (err) {
    handleApiError(err, '送花失败')
  }
}

// 在列表项中添加按钮
<div className="flex items-center gap-2 shrink-0">
  {!sentFlowers.has(u.userId) && u.userId !== user.userId && (
    <button
      onClick={() => handleSendFlower(u.userId)}
      className="p-1.5 rounded-lg hover:bg-pink-50 transition-colors"
      title="送花"
    >
      <Flower size={16} className="text-pink-400" />
    </button>
  )}
  {sentFlowers.has(u.userId) && (
    <span className="text-xs text-pink-400">🌸</span>
  )}
</div>

// 空状态引导
{rankingData.length === 0 && tab === 'classmates' && (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Users size={48} className="text-muted" />
    <div className="text-center">
      <div className="text-base font-bold text-muted-foreground">还没有同学</div>
      <div className="text-xs text-muted-foreground/60 mt-1">
        去个人资料页加入班级吧
      </div>
    </div>
    <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
      前往加入班级
    </Button>
  </div>
)}
```

### 3.4 Stats 页改造 (`/workspace/src/pages/Stats.tsx`)

在页面底部添加"收到鼓励"区域：

```tsx
// 添加状态
const [encouragements, setEncouragements] = useState<any[]>([])
const [totalFlowers, setTotalFlowers] = useState(0)

useEffect(() => {
  if (user.userId) {
    getReceivedEncouragements(user.userId)
      .then(res => {
        if (res.success) {
          setEncouragements(res.encouragements || [])
          setTotalFlowers(res.totalFlowers || 0)
        }
      })
      .catch(() => {})
  }
}, [user.userId])

// 在 render 中，在"成就统计"卡片后添加
{/* 收到鼓励 */}
<Card className="p-4 mb-4">
  <CardHeader className="p-0 mb-3">
    <div className="flex items-center gap-2">
      <span className="text-xl">🌸</span>
      <CardTitle className="text-sm font-bold text-foreground">
        收到鼓励
      </CardTitle>
      <Badge variant="secondary" className="ml-auto">
        {totalFlowers} 朵
      </Badge>
    </div>
  </CardHeader>
  <CardContent className="p-0">
    {encouragements.length > 0 ? (
      <div className="flex flex-col gap-2">
        {encouragements.map((enc) => (
          <div key={enc.id} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
            <span className="text-lg">{enc.fromAvatar}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">{enc.fromNickname}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(enc.createdAt).toLocaleDateString()}
                </span>
              </div>
              {enc.context && (
                <p className="text-xs text-muted-foreground mt-0.5">{enc.context}</p>
              )}
            </div>
            <span className="text-sm">{enc.emoji === 'flower' ? '🌸' : enc.emoji}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">还没有收到鼓励</p>
        <p className="text-xs text-muted-foreground/60 mt-1">在排行榜给同学送花吧</p>
      </div>
    )}
  </CardContent>
</Card>
```

---

## 四、实现顺序

### Phase 1: 后端基础 (1-2)
1. 在 `server/types.ts` 添加新类型定义
2. 在 `server/services/storage.ts` 添加内存存储 Map 和操作函数
3. 创建 `server/services/class.ts` 业务逻辑
4. 创建 `server/routes/class.ts` 路由
5. 在 `server/index.ts` 注册新路由

### Phase 2: 前端 API (3)
6. 创建 `src/services/classApi.ts` API 调用函数

### Phase 3: 前端页面改造 (4-6)
7. 改造 `src/pages/Profile.tsx` - 添加班级卡片和弹窗
8. 改造 `src/pages/Leaderboard.tsx` - 添加同学 Tab 和送花按钮
9. 改造 `src/pages/Stats.tsx` - 添加收到鼓励区域

### Phase 4: 联调测试 (7)
10. 整体功能联调

---

## 五、关键实现细节

### 5.1 班级码生成
- 8位字母数字混合，确保唯一性
- 存储在 `memoryClassCodes` Map 中用于快速查找

### 5.2 小花重置机制
- 在 `checkAndResetFlowers` 中检查 `lastFlowerResetDate`
- 每日首次 API 调用时自动重置为 5 朵

### 5.3 送花限制
- 每日最多 3 朵（`DAILY_FLOWER_LIMIT`）
- 检查 `getSentTodayCount` 统计今日发送数

### 5.4 排行榜排序
- 按 `totalXp` 降序排列
- 需要关联用户 XP 数据（当前实现为占位，需后续完善）

### 5.5 错误处理
- 400: 参数错误、余额不足、次数用完、已在班级中
- 401: 未登录
- 404: 班级不存在、用户不存在
- 使用 `handleApiError` 统一处理并 toast 提示
