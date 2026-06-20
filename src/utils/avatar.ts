/**
 * DiceBear Lorelei 卡通头像工具（JS 库本地生成版）
 * 使用 @dicebear/core 在运行时本地生成 SVG，无需网络请求
 */
import { Style, Avatar } from '@dicebear/core'
import lorelei from '@dicebear/styles/lorelei.json'

const AVATAR_COLORS = [
  { bg: 'E8F9D8', border: '#D4F0B8', text: '#58CC02' },
  { bg: 'E0F4FF', border: '#B8E6FC', text: '#1CB0F6' },
  { bg: 'FFF5D6', border: '#FFE8A0', text: '#FFC800' },
  { bg: 'FFE4E4', border: '#FFB8B8', text: '#FF4B4B' },
  { bg: 'F3E8FF', border: '#E4D0FF', text: '#CE82FF' },
  { bg: 'F3F4F6', border: '#E5E7EB', text: '#9CA3AF' },
]

/** 统一头像 seed 选项（Onboarding 与 Profile 共用） */
export const AVATAR_SEEDS = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia']

// 复用的 Style 实例（不可变，可安全共享）
const loreleiStyle = new Style(lorelei as any)

/** 根据昵称生成稳定的颜色索引 */
function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

/**
 * 生成本地 DiceBear Lorelei 头像 data URI
 * 使用 JS 库在运行时生成 SVG，无网络依赖
 */
export function getAvatarUrl(name: string): string {
  const color = AVATAR_COLORS[getColorIndex(name)]
  const avatar = new Avatar(loreleiStyle, {
    seed: name,
    backgroundColor: [color.bg],
  })
  return avatar.toDataUri()
}

/** 获取头像边框色 */
export function getAvatarBorderColor(name: string): string {
  return AVATAR_COLORS[getColorIndex(name)].border
}

/** 获取头像文字色（降级用） */
export function getAvatarTextColor(name: string): string {
  return AVATAR_COLORS[getColorIndex(name)].text
}

/** 获取头像背景色（降级用） */
export function getAvatarBgColor(name: string): string {
  return '#' + AVATAR_COLORS[getColorIndex(name)].bg
}

/** 获取昵称首字（降级用） */
export function getInitial(name: string): string {
  return (name || '?').charAt(0)
}
