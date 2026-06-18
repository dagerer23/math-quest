import type { LearningStage } from '@/types/models'

export interface ThemeConfig {
  bg: string
  accent: string
  accentSoft: string
  label: string
  nodeBg: string
  nodeCompletedBg: string
  nodeCurrentBg: string
  nodeBorder: string
  nodeCompletedBorder: string
  nodeCurrentBorder: string
  nodeDisabledBg: string
  nodeDisabledBorder: string
  pathColor: string
  pathActive: string
  textPrimary: string
  textSecondary: string
  textMuted: string
}

// 按阶段配色：小学 / 初中 / 高中 各一套，同阶段年级共享
export const STAGE_THEMES: Record<LearningStage, ThemeConfig> = {
  primary: {
    // 🌊 小学（1-6年级）：清新薄荷蓝 + 温暖金色
    bg: '#F0F7F5',
    accent: '#4A9E8A',
    accentSoft: '#D8ECE5',
    label: '小学',
    nodeBg: '#FFFFFF',
    nodeCompletedBg: '#E7F3EE',
    nodeCurrentBg: '#FFFFFF',
    nodeBorder: '#E5E8E6',
    nodeCompletedBorder: '#4A9E8A',
    nodeCurrentBorder: '#4A9E8A',
    nodeDisabledBg: '#F3F4F3',
    nodeDisabledBorder: '#E0E3E1',
    pathColor: '#D5DEDA',
    pathActive: '#4A9E8A',
    textPrimary: '#2B3A36',
    textSecondary: '#7A8782',
    textMuted: '#AAB2AF',
  },
  middle: {
    // 🌸 初中（7-9年级）：柔和桃粉 + 暖棕色
    bg: '#FBF4F0',
    accent: '#E0896E',
    accentSoft: '#F8E2D9',
    label: '初中',
    nodeBg: '#FFFFFF',
    nodeCompletedBg: '#FBE8DD',
    nodeCurrentBg: '#FFFFFF',
    nodeBorder: '#EEE3DC',
    nodeCompletedBorder: '#E0896E',
    nodeCurrentBorder: '#E0896E',
    nodeDisabledBg: '#F5EFEB',
    nodeDisabledBorder: '#E8DDD6',
    pathColor: '#DCD0C8',
    pathActive: '#E0896E',
    textPrimary: '#4A3A33',
    textSecondary: '#8F7E75',
    textMuted: '#BFB0A8',
  },
  high: {
    // 💜 高中（10-12年级）：薰衣草紫 + 深紫点缀
    bg: '#F3F0F7',
    accent: '#8B7AB8',
    accentSoft: '#E3DDEF',
    label: '高中',
    nodeBg: '#FFFFFF',
    nodeCompletedBg: '#ECE5F5',
    nodeCurrentBg: '#FFFFFF',
    nodeBorder: '#E5E1EC',
    nodeCompletedBorder: '#8B7AB8',
    nodeCurrentBorder: '#8B7AB8',
    nodeDisabledBg: '#F1EEEF',
    nodeDisabledBorder: '#DFDADE',
    pathColor: '#D6D1DE',
    pathActive: '#8B7AB8',
    textPrimary: '#3C3452',
    textSecondary: '#7E768C',
    textMuted: '#ABA5B3',
  },
}

// 根据年级返回所属阶段主题：1-6 小学 / 7-9 初中 / 10-12 高中
export function getThemeByGrade(grade: number): ThemeConfig {
  if (grade >= 10) return STAGE_THEMES.high
  if (grade >= 7) return STAGE_THEMES.middle
  return STAGE_THEMES.primary
}

// 向后兼容：按年级编号返回主题（1-3 原始配色，其余按阶段映射）
export const THEMES: Record<number, ThemeConfig> = {
  1: STAGE_THEMES.primary,
  2: STAGE_THEMES.middle,
  3: STAGE_THEMES.high,
}
