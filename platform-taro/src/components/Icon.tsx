import { Image } from '@tarojs/components'
import { iconData } from '@/utils/icon-data'
import type { CSSProperties } from 'react'

interface IconProps {
  /** 语义键名，对应 iconData 的 key */
  name: string
  /** 图标尺寸（px） */
  size?: number
  /** 描边颜色 */
  color?: string
  /** 填充颜色，默认 none（线条图标）。传 color 可做实心图标 */
  fill?: string
  /** 描边宽度，默认 2 */
  strokeWidth?: number
  style?: CSSProperties
}

/**
 * Lucide 线条图标渲染组件（Taro 端）
 * 基于 Image + SVG data URI，兼容微信小程序（不支持内联 svg 标签）
 * 图标数据由 scripts/gen-icons.cjs 从 lucide-react@0.451.0 提取
 */
export function Icon({ name, size = 24, color = '#1a1a1a', fill = 'none', strokeWidth = 2, style }: IconProps) {
  const nodes = iconData[name]
  if (!nodes) return null

  const inner = nodes
    .map((n) => {
      const attrs = Object.entries(n.attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      return `<${n.tag} ${attrs}/>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`

  return <Image src={uri} style={{ width: size, height: size, ...style }} />
}
