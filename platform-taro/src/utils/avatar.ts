/**
 * DiceBear Lorelei 卡通头像工具
 * URL 格式：https://api.dicebear.com/9.x/lorelei/svg?seed={name}&backgroundColor={color}
 */

const AVATAR_COLORS = [
  { bg: 'E8F9D8', border: '#D4F0B8', text: '#58CC02' },
  { bg: 'E0F4FF', border: '#B8E6FC', text: '#1CB0F6' },
  { bg: 'FFF5D6', border: '#FFE8A0', text: '#FFC800' },
  { bg: 'FFE4E4', border: '#FFB8B8', text: '#FF4B4B' },
  { bg: 'F3E8FF', border: '#E4D0FF', text: '#CE82FF' },
  { bg: 'F3F4F6', border: '#E5E7EB', text: '#9CA3AF' },
]

/** 根据昵称生成稳定的颜色索引 */
function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

/** 生成 DiceBear Lorelei 头像 URL */
export function getAvatarUrl(name: string): string {
  const color = AVATAR_COLORS[getColorIndex(name)]
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name)}&backgroundColor=${color.bg}`
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
