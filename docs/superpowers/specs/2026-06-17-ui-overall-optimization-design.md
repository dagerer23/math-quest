# 前端 UI 整体优化设计

> 日期：2026-06-17
> 状态：已确认
> 方案：B 系统式 — 建立设计系统 + 全面刷新

## 背景

当前界面存在以下问题：
- 二级页面（Stats/Profile/Leaderboard/Mistakes/DailyGoals/Result）样式不统一
- 缺乏系统性的动效规范，各页面动效风格不一致
- 间距、圆角、阴影等设计 Token 未统一
- 已有两份设计文档（06-14 UI 修复、06-16 风格优化）部分待落地

## 设计方向

**活泼弹性** — 类似多邻国/Duolingo 风格，弹性动画、夸张反馈、趣味性强

## 一、设计 Token 系统

### 1.1 间距系统（4px 基准）

| Token | 值 | 用途 |
|-------|-----|------|
| `space-1` | 4px | 图标与文字间距 |
| `space-2` | 8px | 紧凑元素间距 |
| `space-3` | 12px | 卡片内间距（小） |
| `space-4` | 16px | 页面水平 padding、卡片内间距 |
| `space-5` | 20px | 区块间距 |
| `space-6` | 24px | 卡片内间距（大） |
| `space-8` | 32px | 页面垂直间距 |

### 1.2 圆角规范

| Token | 值 | 用途 |
|-------|-----|------|
| `radius-sm` | 8px | 按钮、小标签 |
| `radius-md` | 12px | 输入框、小卡片 |
| `radius-lg` | 16px | 主卡片、弹窗 |
| `radius-xl` | 20px | 大面板、底部导航 |
| `radius-full` | 9999px | 头像、圆形标签 |

### 1.3 阴影层级

| Token | 值 | 用途 |
|-------|-----|------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | 卡片默认 |
| `shadow-sm` | `0 2px 8px rgba(0,0,0,0.06)` | 悬浮态 |
| `shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` | 弹窗、下拉 |
| `shadow-lg` | `0 8px 32px rgba(0,0,0,0.12)` | 模态框 |

### 1.4 动效参数

| Token | 值 | 用途 |
|-------|-----|------|
| `duration-fast` | 150ms | 按钮反馈、hover |
| `duration-normal` | 250ms | 卡片入场、Tab切换 |
| `duration-slow` | 400ms | 页面过渡 |
| `spring-bounce` | `stiffness:400, damping:15` | 弹性反馈（答对、解锁） |
| `spring-gentle` | `stiffness:280, damping:22` | 卡片入场 |
| `spring-page` | `stiffness:200, damping:25` | 页面切换 |

### 1.5 实现方式

在 `tailwind.config.cjs` 的 `extend` 中添加所有 Token，同时更新 `src/index.css` 的 CSS 变量。组件直接使用 Tailwind class 引用，不硬编码数值。

## 二、落地已有方案

整合 06-16 风格优化文档的待办项。

### 2.1 全局背景 & 卡片基础

| 改动 | 旧值 | 新值 | 涉及文件 |
|------|------|------|----------|
| 页面背景 | 灰白渐变 | `#FFFFFF` 纯白 | `src/index.css` |
| `.shell` 背景 | 渐变 | `#FFFFFF` | `src/index.css` |
| Card 默认样式 | 无边框/无阴影 | `1px solid #E5E7EB` + `shadow-xs` | `src/components/ui/card.tsx` |
| 卡片圆角 | 混用 12px | 统一 `radius-lg` (16px) | `card.tsx` |

### 2.2 Emoji → Lucide 图标替换

| 场景 | 旧 | 新 | 图标色 | 背景色 |
|------|-----|-----|--------|--------|
| 答题总数 | 📚 | `BookOpen` | `#58CC02` | `#E8F9D8` |
| 正确率 | 🎯 | `Target` | `#1CB0F6` | `#E0F4FF` |
| 经验值 | ⚡ | `Zap` | `#58CC02` | `#E8F9D8` |
| 连续天数 | 🔥 | `Flame` | `#FF4B4B` | `#FFE4E4` |
| 学习天数 | 📅 | `Calendar` | `#9CA3AF` | `#F3F4F6` |
| 当前段位 | 🏅 | `Award` | `#FFC800` | `#FFF5D6` |
| 收到的鼓励 | 🌸 | `Flower2` | `#CE82FF` | `#F3E8FF` |

Profile 和 Stats 页面已部分使用 Lucide 图标，需统一为"图标容器"模式（32×32 彩色浅底 + 18px 图标）。

### 2.3 DiceBear Lorelei 头像

- 已有 `src/utils/avatar.ts`，确认实现正确
- 降级方案：网络不可用时回退到首字母圆形头像
- Leaderboard 和 Stats 中的头像需统一使用 `getAvatarUrl()`

### 2.4 不做的事

- 不改暗色模式
- 不改管理后台样式
- 不改布局结构
- 不新增页面或功能

## 三、动效系统

### 3.1 页面切换过渡

所有页面统一使用 `AnimatePresence` + `motion.div` 包裹，参数统一：

```
进入：opacity 0→1, y 12→0, duration 250ms, spring-gentle
退出：opacity 1→0, y 0→-8, duration 150ms
```

在 `Layout.tsx` 中统一处理，子页面无需单独包裹。

### 3.2 卡片入场动效（Stagger）

卡片列表统一使用 stagger 入场：

```
每张卡片：opacity 0→1, y 10→0
延迟：index × 50ms
弹性：spring-gentle
```

适用于：Stats 统计卡片、Profile 快捷操作、Leaderboard 排行列表、Mistakes 错题列表、DailyGoals 目标列表。

### 3.3 Tab 切换指示器

当前 Tab 切换无滑动动效。统一添加：

- 底部滑动指示条，跟随选中项平滑移动
- `layoutId` 实现共享布局动画
- 切换时内容区淡入淡出（duration 200ms）

适用于：Leaderboard（同学/总榜/段位）、Mistakes（全部/按知识点）。

### 3.4 微交互

| 交互 | 动效 | 参数 |
|------|------|------|
| 按钮点击 | `whileTap: scale(0.95)` | duration-fast |
| 卡片点击 | `whileTap: scale(0.97)` + 轻微下沉 | duration-fast |
| 开关切换 | 弹性缩放 | spring-bounce |
| 进度条填充 | 从 0 动画到目标值 | duration 600ms, ease-out |
| 数字变化 | 计数器滚动效果 | duration 400ms |
| 空状态图标 | 轻微浮动 `float` | duration 3s, infinite |

### 3.5 骨架屏优化

- 更柔和的脉冲效果（opacity 0.4↔0.8）
- 与卡片实际布局匹配的骨架形状
- 统一 `Skeleton` 组件的圆角和间距

### 3.6 下拉刷新（可选）

二级页面添加下拉刷新支持，使用 `framer-motion` 的 `drag` 实现：

- 下拉阈值 60px
- 释放后旋转加载图标
- 刷新完成后弹性回弹

## 四、二级页面样式统一

### 4.1 统一页面头部

所有二级页面统一头部结构：

```
┌─────────────────────────────┐
│ ▍ 渐变条 (h-1)              │
├─────────────────────────────┤
│ ← 返回   页面标题    右侧操作│
└─────────────────────────────┘
```

- 返回按钮：`ArrowLeft` + `text-muted-foreground`，点击区域 40×40px
- 标题：`text-lg font-bold text-foreground`
- 右侧操作：可选（如 Mistakes 的题目数、Leaderboard 的图标）
- 底部：`border-b border-border`

### 4.2 统一页面容器

所有二级页面统一外层结构：

```
motion.div (min-h-screen bg-white flex flex-col)
  └─ 渐变条
  └─ 头部
  └─ 内容区 (flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4)
```

### 4.3 各页面特色优化

**Stats 统计页**
- 概览卡片网格：3 列，每张卡片使用图标容器（32×32 彩色浅底 + Lucide 图标）
- 进度条统一使用 `Progress` 组件 + 渐变色
- 知识点列表：添加掌握度颜色（<50% 红、50-80% 黄、>80% 绿）
- 鼓励列表：头像 + 昵称 + 花朵图标，统一行高

**Profile 个人页**
- 个人信息卡：头像加大到 56×56，段位 Badge 使用功能色背景
- 数据统计 3 列网格：统一 `StatCard` 组件
- 快捷操作 4 列网格：统一 `QuickAction` 组件，添加 `whileTap` 动效
- 成就墙：解锁项添加微光动画，未解锁项更明显的锁定态
- 设置区：统一 `SettingRow` 组件，Switch 使用弹性动画

**Leaderboard 排行榜**
- Tab 切换添加滑动指示器
- Top3 领奖台：优化视觉层次
- 排行列表：统一行高、头像尺寸、XP 数字右对齐
- "我的排名"固定底部卡片

**Mistakes 错题本**
- Tab 切换添加滑动指示器
- 错题卡片展开/折叠使用 `AnimatePresence` + `layout` 动画
- 空状态：大图标 + 浮动动画 + 鼓励文案
- 掌握度进度环统一颜色和尺寸

**DailyGoals 每日目标**
- 今日挑战卡：渐变背景 + 进度环
- 目标卡片：图标容器统一、进度条动画
- 领取奖励按钮：弹性点击 + 成功 toast

**Result 结算页**
- 星星动画：保留现有弹性效果
- 奖励徽章：使用功能色浅底图标容器
- 错题回顾：统一列表项样式

### 4.4 统一空状态

所有页面空状态统一结构：

```
大图标（48px，带浮动动画）
标题（font-bold text-base）
副标题（text-sm text-muted-foreground）
操作按钮（可选）
```

### 4.5 涉及文件汇总

| 文件 | 改动类型 |
|------|----------|
| `tailwind.config.cjs` | 添加设计 Token |
| `src/index.css` | 更新 CSS 变量 |
| `src/components/ui/card.tsx` | 默认样式更新 |
| `src/components/Layout.tsx` | 页面过渡动画 |
| `src/components/BottomNav.tsx` | Tab 指示器动效 |
| `src/pages/Stats.tsx` | 全面刷新 |
| `src/pages/Profile.tsx` | 全面刷新 |
| `src/pages/Leaderboard.tsx` | 全面刷新 |
| `src/pages/Mistakes.tsx` | 全面刷新 |
| `src/pages/DailyGoals.tsx` | 全面刷新 |
| `src/pages/Result.tsx` | 全面刷新 |
| `src/pages/Home.tsx` | 顶部资源栏 + 背景统一 |
| `src/pages/Battle.tsx` | 答题反馈增强 |

## 五、不做的事

- 不改暗色模式
- 不改管理后台样式
- 不改布局结构，只改视觉风格和动效
- 不新增页面或功能
- 不添加发光粒子效果
