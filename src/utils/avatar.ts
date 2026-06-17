const AVATAR_COLORS = ['#58CC02', '#FFD23F', '#7B5BFF', '#00E5FF', '#FF3B6B', '#A87147']

export function getAvatarUrl(name: string, bgColor?: string): string {
  const seed = encodeURIComponent(name)
  const bg = bgColor || AVATAR_COLORS[name.length % AVATAR_COLORS.length]
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=${bg.slice(1)}`
}

export function getAvatarBorderColor(name: string): string {
  const colors = ['#58CC02', '#FFD23F', '#7B5BFF', '#00E5FF', '#FF3B6B', '#A87147']
  return colors[name.length % colors.length]
}

export function getAvatarBgColor(name: string): string {
  return getAvatarBorderColor(name)
}

export function getAvatarTextColor(name: string): string {
  return '#FFFFFF'
}

export function getInitial(name: string): string {
  return name.length > 0 ? name[0].toUpperCase() : '?'
}
