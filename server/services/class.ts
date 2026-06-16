/**
 * 班级业务逻辑层：创建/加入/退出班级、获取成员、送鼓励
 */
import {
  createClass as dbCreateClass,
  findClassByCode,
  findClassById,
  joinClass as dbJoinClass,
  leaveClass as dbLeaveClass,
  getClassMemberCount,
  sendEncouragement as dbSendEncouragement,
  getEncouragementsReceived,
  getEncouragementCountReceived,
  findUserById,
  updateUser,
  getClassMemberIds,
  findClassMembersByIds,
} from './storage'
import type { ClassEntity } from '../types'

export interface ClassMember {
  userId: string
  nickname: string
  avatar: string
  targetGrade: number
  xp: number
  createdAt: number
}

export interface ClassInfo extends ClassEntity {
  memberCount: number
}

/** 生成随机班级码：大写字母+数字，6位 */
function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** 创建班级 */
export async function createClass(userId: string, className: string): Promise<{ success: boolean; message: string; class?: ClassInfo }> {
  const user = await findUserById(userId)
  if (!user) return { success: false, message: '用户不存在' }

  let code = generateClassCode()
  let existing = await findClassByCode(code)
  let attempts = 0
  while (existing && attempts < 10) {
    code = generateClassCode()
    existing = await findClassByCode(code)
    attempts++
  }

  const cls = await dbCreateClass(code, className, userId)
  await updateUser(userId, { classId: cls.id } as any)
  const memberCount = await getClassMemberCount(cls.id)
  return { success: true, message: '班级创建成功', class: { ...cls, memberCount } }
}

/** 通过班级码加入 */
export async function joinClassByCode(userId: string, code: string): Promise<{ success: boolean; message: string; class?: ClassInfo }> {
  const user = await findUserById(userId)
  if (!user) return { success: false, message: '用户不存在' }
  if (user.classId) return { success: false, message: '您已在班级中，请先退出当前班级' }

  const cls = await findClassByCode(code.toUpperCase())
  if (!cls) return { success: false, message: '班级码无效' }

  await dbJoinClass(userId, cls.id)
  await updateUser(userId, { classId: cls.id } as any)
  const memberCount = await getClassMemberCount(cls.id)
  return { success: true, message: '加入班级成功', class: { ...cls, memberCount } }
}

/** 退出班级 */
export async function leaveClass(userId: string, classId: string): Promise<{ success: boolean; message: string }> {
  await dbLeaveClass(userId, classId)
  await updateUser(userId, { classId: null } as any)
  return { success: true, message: '已退出班级' }
}

/** 获取当前班级信息 */
export async function getMyClass(userId: string): Promise<{ success: boolean; message: string; class?: ClassInfo }> {
  const user = await findUserById(userId)
  if (!user || !user.classId) return { success: true, message: '未加入班级' }
  const cls = await findClassById(user.classId)
  if (!cls) return { success: true, message: '未加入班级' }
  const memberCount = await getClassMemberCount(cls.id)
  return { success: true, message: '', class: { ...cls, memberCount } }
}

/** 获取同班同学（返回成员基础信息列表） */
export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  const memberIds = await getClassMemberIds(classId)
  return findClassMembersByIds(memberIds)
}

/** 送花鼓励同学 */
export async function sendEncouragement(fromUserId: string, toUserId: string, context?: string): Promise<{ success: boolean; message: string }> {
  if (fromUserId === toUserId) return { success: false, message: '不能给自己送花哦' }

  const toUser = await findUserById(toUserId)
  if (!toUser) return { success: false, message: '同学不存在' }

  await dbSendEncouragement(fromUserId, toUserId, context)
  return { success: true, message: '已送出一朵花 🌸' }
}

/** 获取收到的鼓励列表 */
export async function getReceivedEncouragements(userId: string) {
  const list = await getEncouragementsReceived(userId)
  const total = await getEncouragementCountReceived(userId)
  return { success: true, list, total }
}
