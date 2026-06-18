/**
 * 后端类型定义 - MySQL 版本
 * 
 * 数据库表结构:
 * - t_user: 用户表
 * - t_verification_code: 验证码表
 */

export interface User {
  id: string
  phone: string
  nickname?: string
  avatar?: string
  learningStage?: 'primary' | 'middle' | 'high'
  learningGoal?: 'consolidation' | 'improvement' | 'interest' | 'training'
  targetGrade?: number
  classId?: string
  createdAt: number
  lastLoginAt?: number
}

export interface ClassEntity {
  id: string
  code: string
  name: string
  createdBy: string
  createdAt: number
}

export interface Encouragement {
  id: string
  fromUserId: string
  toUserId: string
  emoji: string
  context?: string
  createdAt: number
}

export interface VerificationRecord {
  phone: string
  code: string
  expiresAt: number
  attempts: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface SendCodeRequest {
  phone: string
}

export interface LoginRequest {
  phone: string
  code: string
}

export interface SyncDataRequest {
  userId: string
  xp: number
  coins: number
  hearts: number
  unlockedLevels: string[]
  completedLevels: Record<string, any>
  mistakeIds: string[]
  achievements: Array<{ id: string; unlockedAt: number }>
  streak: number
  profile: any
}
