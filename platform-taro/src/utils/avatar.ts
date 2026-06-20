/**
 * DiceBear Lorelei 卡通头像工具（本地 PNG 资源版）
 * 头像通过 scripts/gen-avatars.cjs 预生成 PNG，运行时无网络依赖
 */

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

/** 预生成的本地 PNG 头像映射 */
const AVATAR_PNG_MAP: Record<string, string> = {
  Alice: require('@/assets/avatars/Alice.png'),
  Bob: require('@/assets/avatars/Bob.png'),
  Charlie: require('@/assets/avatars/Charlie.png'),
  Diana: require('@/assets/avatars/Diana.png'),
  Eve: require('@/assets/avatars/Eve.png'),
  Frank: require('@/assets/avatars/Frank.png'),
  Grace: require('@/assets/avatars/Grace.png'),
  Henry: require('@/assets/avatars/Henry.png'),
  Ivy: require('@/assets/avatars/Ivy.png'),
  Jack: require('@/assets/avatars/Jack.png'),
  Kate: require('@/assets/avatars/Kate.png'),
  Leo: require('@/assets/avatars/Leo.png'),
  Mia: require('@/assets/avatars/Mia.png'),
  Noah: require('@/assets/avatars/Noah.png'),
  Olivia: require('@/assets/avatars/Olivia.png'),
}

/** 根据昵称生成稳定的颜色索引 */
function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

/**
 * 获取头像图片地址
 * 优先返回预生成的本地 PNG；若 seed 不在预生成列表中则降级到第一个头像
 */
export function getAvatarUrl(name: string): string {
  const seed = name || 'Alice'
  return AVATAR_PNG_MAP[seed] || AVATAR_PNG_MAP['Alice']
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
