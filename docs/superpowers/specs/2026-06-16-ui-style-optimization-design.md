# UI 风格优化设计

> 日期：2026-06-16
> 状态：已确认

## 背景

当前界面存在以下问题：
- 白→灰渐变底 + muted 灰卡片，层次感弱，整体发灰
- 鲜艳主色被灰色底淹没，缺乏活力
- 圆角/阴影不统一
- 使用 emoji 作为图标和头像，风格不统一且不够专业

## 设计方向

**明亮活泼** — 纯白底 + 圆润细边卡片 + lucide 图标 + Lorelei 卡通头像

## 一、配色体系

### 主色（保持不变）

| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#58CC02` | 主按钮、关键数据 |
| Secondary | `#1CB0F6` | 辅助信息、正确率 |
| Accent | `#FFC800` | 段位、成就、高亮 |
| Destructive | `#FF4B4B` | 错误、连续天数、警告 |

### 中性色（优化）

| 名称 | 旧值 | 新值 | 用途 |
|------|------|------|------|
| Background | `#F4F4F4` 渐变 | `#FFFFFF` 纯白 | 页面底色 |
| Muted | `hsl(0 0% 96%)` ~`#F5F5F5` | `#F9FAFB` | Tab 背景、分割区域 |
| Muted Hover | 无 | `#F3F4F6` | 悬停态 |
| Border | `hsl(0 0% 90%)` ~`#E5E5E5` | `#E5E7EB` | 卡片边框 |
| Card | `#FFFFFF` | `#FFFFFF`（不变） | 卡片背景 |

### 功能色（新增：图标彩色浅底）

| 名称 | 色值 | 对应主色 | 用途 |
|------|------|----------|------|
| Green/10 | `#E8F9D8` | Primary | 答题、经验值图标背景 |
| Blue/10 | `#E0F4FF` | Secondary | 正确率图标背景 |
| Gold/10 | `#FFF5D6` | Accent | 段位、成就图标背景 |
| Red/10 | `#FFE4E4` | Destructive | 连续天数、错误图标背景 |
| Purple/10 | `#F3E8FF` | Purple | 鼓励、花朵图标背景 |
| Gray/10 | `#F3F4F6` | Gray | 学习天数等中性图标背景 |

## 二、卡片样式规范

| 属性 | 旧值 | 新值 |
|------|------|------|
| 圆角 | 12px 混用 | 统一 16px (`rounded-2xl`) |
| 边框 | 无或 `1px solid #E5E5E5` | `1px solid #E5E7EB` |
| 阴影 | 无 | `0 1px 3px rgba(0,0,0,0.04)` |
| 背景 | `#FAFAFA` 灰色 | `#FFFFFF` 白色 |

图标容器：
- 尺寸：32×32px (`size-8`)
- 圆角：10px (`rounded-[10px]`)
- 背景：对应功能色（如 Green/10）
- 图标：lucide-react，18px，对应主色

## 三、图标映射（Emoji → Lucide）

| 场景 | 旧 Emoji | 新 Lucide 图标 | 图标色 | 背景色 |
|------|----------|----------------|--------|--------|
| 答题总数 | 📚 | `BookOpen` | `#58CC02` | `#E8F9D8` |
| 正确率 | 🎯 | `Target` | `#1CB0F6` | `#E0F4FF` |
| 经验值 | ⚡ | `Zap` | `#58CC02` | `#E8F9D8` |
| 连续天数 | 🔥 | `Flame` | `#FF4B4B` | `#FFE4E4` |
| 学习天数 | 📅 | `Calendar` | `#9CA3AF` | `#F3F4F6` |
| 当前段位 | 🏅 | `Award` | `#FFC800` | `#FFF5D6` |
| 收到的鼓励 | 🌸 | `Flower2` | `#CE82FF` | `#F3E8FF` |
| 知识点 | 📊 | `TrendingUp` | `#58CC02` | `#E8F9D8` |
| 我的班级 | — | `Users` | `#58CC02` | `#E8F9D8` |
| 同学排行 | — | `GraduationCap` | `#1CB0F6` | `#E0F4FF` |

## 四、头像方案

**DiceBear Lorelei** — 简约线条风卡通头像

- URL 格式：`https://api.dicebear.com/9.x/lorelei/svg?seed={nickname}&backgroundColor={color}`
- 基于昵称 seed 自动生成唯一头像，纯 SVG
- 圆形裁切 + 彩色边框（与功能色对应）
- 降级方案：网络不可用时回退到首字母圆形头像（昵称首字 + 彩色背景）

## 五、全局背景改动

| 位置 | 旧值 | 新值 |
|------|------|------|
| `html, body, #root` | `linear-gradient(180deg, #FFF 0%, #F4F4F4 100%)` | `#FFFFFF` |
| `.shell` | `linear-gradient(180deg, #FFF 0%, #F4F4F4 100%)` | `#FFFFFF` |
| 各页面 `bg-gradient-to-b from-background to-muted` | 渐变 | `bg-white` |
| 登录页 | `bg-muted` | `bg-white` |

## 六、涉及文件

### CSS 变量
- `src/index.css` — `--background`、`--muted`、`--border` 值更新，全局背景去除渐变

### 页面（背景 + 卡片 + 图标）
- `src/pages/Stats.tsx` — 背景、统计卡片图标、鼓励卡片
- `src/pages/Profile.tsx` — 背景、头像改为 DiceBear、emoji 替换
- `src/pages/Leaderboard.tsx` — 背景、同学头像
- `src/pages/Mistakes.tsx` — 背景
- `src/pages/Result.tsx` — 背景
- `src/pages/DailyGoals.tsx` — 图标背景
- `src/pages/Login.tsx` — 已改为白色，确认
- `src/pages/VerifyCode.tsx` — 背景
- `src/pages/Agreement.tsx` — 背景
- `src/pages/Assessment.tsx` — 图标背景
- `src/pages/AssessmentResult.tsx` — 图标背景
- `src/pages/Home.tsx` — 地图页背景

### 组件
- `src/components/BottomNav.tsx` — 确认白色背景
- `src/components/ui/card.tsx` — 默认卡片样式更新（边框+阴影）

### 工具
- 新增 `src/utils/avatar.ts` — DiceBear URL 生成 + 降级逻辑

## 七、不做的事

- 不改暗色模式（当前无暗色模式）
- 不改管理后台样式
- 不改布局结构，只改视觉风格
- 不新增页面或功能
