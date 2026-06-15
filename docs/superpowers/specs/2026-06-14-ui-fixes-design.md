# 前端 UI 修复设计文档

## 概述
修复 18 个前端 UI/UX 问题，按优先级分 P0（功能正确性）、P1（体验优化）、P2（体验完善）三级。

## P0 - 功能正确性

### 1. Result 页错题映射修复
- **问题**: `wrongAnswers` 用 `level.questions[i]` 取题，动态出题后顺序不对应
- **修复**: 用 `session.questions` (useSessionStore 中的 questions) 替代 `level.questions`
- **文件**: `src/pages/Result.tsx` L111-113

### 2. Result "再来一局"动态出题
- **问题**: `restart()` 用 `level.questions` 固定题目
- **修复**: 改为调用 `generateQuestions(levelId, userMastery, recentIds)` 动态生成
- **文件**: `src/pages/Result.tsx` L117-120

### 3. Home 顶部资源栏
- **问题**: 用户无法快速查看心数/金币/钻石
- **修复**: 在顶部信息栏添加 ❤️心数 + 🪙金币 + 💎钻石 显示
- **文件**: `src/pages/Home.tsx` 顶部区域

## P1 - 重要体验优化

### 4. Battle 答题反馈增强
- **问题**: 答对/答错后视觉反馈不明显
- **修复**:
  - 答对: 选项背景闪绿色 + ✓ 图标 + 正确音效
  - 答错: 选项背景闪红色 + ✗ 图标 + 抖动动画 + 错误音效 + 显示正确答案 1.5 秒
- **文件**: `src/pages/Battle.tsx`

### 5. Battle 退出确认弹窗
- **问题**: 误触返回键直接丢失答题进度
- **修复**: 返回按钮点击时弹出确认弹窗"确定退出吗？当前进度将丢失"
- **文件**: `src/pages/Battle.tsx`

### 6. BottomNav 增加每日目标入口
- **问题**: 每日目标只能从首页小按钮进入
- **修复**: 将底部导航从4项改为5项：地图/目标/错题/榜单/我的
- **文件**: `src/components/BottomNav.tsx`

### 7. Home 关卡点击 loading
- **问题**: 动态出题期间无反馈
- **修复**: 点击关卡后显示 loading spinner 覆盖在节点上
- **文件**: `src/pages/Home.tsx`

### 8. 掌握度进度环加粗
- **问题**: 2px stroke 在手机上几乎看不见
- **修复**: stroke 从 2px 改为 4px，r 从 26 改为 24
- **文件**: `src/pages/Home.tsx` LevelNode SVG

## P2 - 体验完善

### 9. DailyGoals 加载失败提示 + 领取奖励 toast
- **问题**: 加载失败无提示，领取奖励无反馈
- **修复**: 加载失败显示重试按钮；领取奖励后显示 toast "🎉 奖励已领取！"
- **文件**: `src/pages/DailyGoals.tsx`

### 10. Profile 保存昵称 loading
- **问题**: 保存时无 loading，可能重复点击
- **修复**: 保存中显示 spinner + 按钮禁用
- **文件**: `src/pages/Profile.tsx`

### 11. Stats 知识点排序
- **问题**: 知识点列表无序
- **修复**: 按掌握度从低到高排序（薄弱项在前）
- **文件**: `src/pages/Stats.tsx`

### 12. 统一返回按钮和顶部渐变条
- **问题**: 风格不统一
- **修复**: 所有子页面统一用 ArrowLeft 图标 + 顶部渐变条
- **文件**: `DailyGoals.tsx`, `Stats.tsx`
