/**
 * 前端班级 API 层
 */
import { post, get } from '@/utils/request'

const API_BASE = '/api/class'

export interface ClassInfo {
  id: string
  code: string
  name: string
  createdBy: string
  createdAt: number
  memberCount: number
}

export interface ClassMember {
  userId: string
  nickname: string
  avatar: string
  targetGrade: number
  xp: number
  createdAt: number
}

export interface EncouragementItem {
  id: string
  fromUserId: string
  toUserId: string
  emoji: string
  context?: string
  createdAt: number
  fromUserName: string
  fromUserAvatar: string
}

/** 创建班级 */
export async function createClass(userId: string, name: string): Promise<{ success: boolean; message: string; class?: ClassInfo }> {
  try {
    return await post(`${API_BASE}/create`, { userId, name })
  } catch (e) {
    return { success: false, message: '网络错误' }
  }
}

/** 加入班级 */
export async function joinClass(userId: string, code: string): Promise<{ success: boolean; message: string; class?: ClassInfo }> {
  try {
    return await post(`${API_BASE}/join`, { userId, code })
  } catch (e) {
    return { success: false, message: '网络错误' }
  }
}

/** 退出班级 */
export async function leaveClass(userId: string, classId: string): Promise<{ success: boolean; message: string }> {
  try {
    return await post(`${API_BASE}/leave`, { userId, classId })
  } catch (e) {
    return { success: false, message: '网络错误' }
  }
}

/** 获取当前班级信息 */
export async function getMyClass(userId: string): Promise<{ success: boolean; message: string; class?: ClassInfo }> {
  try {
    return await get(`${API_BASE}/me?userId=${encodeURIComponent(userId)}`)
  } catch (e) {
    return { success: false, message: '网络错误' }
  }
}

/** 获取同班同学列表 */
export async function getClassMembers(userId: string): Promise<{ success: boolean; message: string; members: ClassMember[]; className?: string }> {
  try {
    const result = await get<any>(`${API_BASE}/members?userId=${encodeURIComponent(userId)}`)
    return {
      success: result?.success ?? false,
      message: result?.message || '',
      members: result?.members || [],
      className: result?.className,
    }
  } catch (e) {
    return { success: false, message: '网络错误', members: [] }
  }
}

/** 送花给同学 */
export async function sendEncouragement(fromUserId: string, toUserId: string, context?: string): Promise<{ success: boolean; message: string }> {
  try {
    return await post(`${API_BASE}/encourage`, { fromUserId, toUserId, context })
  } catch (e) {
    return { success: false, message: '网络错误' }
  }
}

/** 获取收到的鼓励列表 */
export async function getEncouragements(userId: string): Promise<{ success: boolean; message: string; list: EncouragementItem[]; total: number }> {
  try {
    const result = await get<any>(`${API_BASE}/encouragements?userId=${encodeURIComponent(userId)}`)
    return {
      success: result?.success ?? false,
      message: result?.message || '',
      list: result?.list || [],
      total: result?.total || 0,
    }
  } catch (e) {
    return { success: false, message: '网络错误', list: [], total: 0 }
  }
}
