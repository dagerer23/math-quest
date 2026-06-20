/**
 * Taro 小程序统一设计 Token 体系
 *
 * 颜色值与 Web 端 `src/index.css`（HSL 变量解析后）+ `tailwind.config.cjs` 中的实际 hex 值保持一致，
 * 圆角 / 阴影 / 间距 / 动效时长同样对齐 Tailwind 配置。
 *
 * 导出：
 * - `TOKEN`：完整 token 常量对象（colors / radius / shadow / spacing / duration）
 * - `C`：TOKEN.colors 的别名，供各页面渐进迁移（`import { C } from '@/styles/theme'`）
 * - `btnShadow(color)`：PixelButton 风格底部硬投影
 * - `THEME`：向后兼容，保留原有导出结构
 */

export const TOKEN = {
  colors: {
    /** 语义色（shadcn 风格，对齐 Web 端 CSS 变量解析值） */
    semantic: {
      primary: '#58CC02',
      secondary: '#1CB0F6',
      accent: '#FFC800',
      destructive: '#FF4B4B',
      background: '#FFFFFF',
      foreground: '#3C3C3C',
      card: '#FFFFFF',
      cardForeground: '#3C3C3C',
      muted: '#F9FAFB',
      mutedForeground: '#777777',
      border: '#E5E7EB',
      input: '#E5E7EB',
      ring: '#58CC02',
    },
    /** 多邻国配色 */
    duolingo: {
      green: '#58CC02',
      greenDark: '#46A302',
      blue: '#1CB0F6',
      blueDark: '#0F9ADE',
      red: '#FF4B4B',
      gold: '#FFC800',
      purple: '#CE82FF',
      grayDark: '#3C3C3C',
      gray: '#777777',
      grayLight: '#F4F4F4',
    },
    /** 功能色浅底（图标背景） */
    icon: {
      iconGreenBg: '#E8F9D8',
      iconBlueBg: '#E0F4FF',
      iconGoldBg: '#FFF5D6',
      iconRedBg: '#FFE4E4',
      iconPurpleBg: '#F3E8FF',
      iconGrayBg: '#F3F4F6',
    },
    /** 微信品牌色 */
    wx: {
      wxGreen: '#07C160',
    },
    /** 太空风深色（对齐 Web 端 tailwind.config 的 space/ink，键盘等复古组件用） */
    space: {
      700: '#1E1E47',
      800: '#141433',
      900: '#0B0B1F',
    },
    /** 浅色前景文字（对齐 Web 端 ink，用于深色按键文字） */
    ink: '#E6E6F0',
    /** 霓虹色（对齐 Web 端 tailwind.config 的 neon 配色） */
    neon: {
      pink: '#FF3B6B',
      yellow: '#FFD23F',
    },
    /** 页面背景 */
    pageBg: '#F8FAF5',
  },
  /** 圆角 */
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },
  /** 阴影 */
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.04)',
    sm: '0 2px 8px rgba(0,0,0,0.06)',
    md: '0 4px 16px rgba(0,0,0,0.08)',
    lg: '0 8px 32px rgba(0,0,0,0.12)',
  },
  /** 间距 */
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
  },
  /** 动效时长 */
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
  },
} as const

/**
 * 按钮投影（Web 端 PixelButton 风格）
 * 返回形如 `0 4px 0 <color>` 的底部硬投影，用于内联 style。
 */
export function btnShadow(color: string): string {
  return `0 4px 0 ${color}`
}

/** C 别名，指向 TOKEN.colors，方便各页面渐进迁移 */
export const C = TOKEN.colors

/**
 * 向后兼容：保留原有 THEME 导出（值与改造前完全一致，不影响既有引用）。
 */
export const THEME = {
  colors: {
    primary: '#58CC02',
    secondary: '#1CB0F6',
    accent: '#FFC800',
    destructive: '#FF4B4B',
    background: '#FFFFFF',
    muted: '#F9FAFB',
    text: '#3C3C3C',
    mutedText: '#9CA3AF',
    border: '#E5E7EB',
  },
  greenBg: '#E8F9D8',
  blueBg: '#E0F4FF',
  goldBg: '#FFF5D6',
  redBg: '#FFE4E4',
  purpleBg: '#F3E8FF',
  grayBg: '#F3F4F6',
}
