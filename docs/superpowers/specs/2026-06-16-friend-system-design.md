# MathQuest 好友系统设计方案

## 一、背景与目标

MathQuest 小学数学学习应用，当前已有排行榜（Leaderboard）功能，"同学"Tab 入口存在但数据为空。本方案为 MVP 版本，实现班级码社交 + 同学排行榜 + 小花鼓励功能。

## 二、功能范围

### 2.1 班级码系统
- 用户可在 Profile 页**创建班级**（生成唯一班级码 + 班级名称）或**加入班级**（输入班级码）
- 班级码全校统一，不按年级区分；同班同学（同 class_code）且同年级显示在同一排行榜
- 每人只能属于一个班级，支持退出后重新加入

### 2.2 同学排行榜
- Leaderboard"同学"Tab：展示同班（同 class_code + 同 grade）用户，按 XP 降序排列
- 未加入班级时 Tab 提示引导去 Profile 加入
- 与现有"总榜"Tab 并列展示

### 2.3 小花鼓励
- 在 Leaderboard 同学列表中，每位同学右侧显示"送花"按钮
- 点击后从用户余额中扣除 1 朵小花（每日上限 3 朵），对方 Stats 页收到提示
- Stats 页展示收到的小花数量和送花人昵称
- 送花时附带触发情境文字（如"做完加法课后给你加油！"）

## 三、数据模型

### 3.1 新增数据库表（内存存储）

```
t_class: 班级表
  - id: string (UUID)
  - code: string (唯一班级码，如 "2024A1B2")
  - name: string (班级名称)
  - created_by: string (创建者 userId)
  - created_at: number (timestamp)

t_class_member: 班级成员表
  - id: string
  - class_id: string (FK)
  - user_id: string
  - joined_at: number

t_encouragement: 鼓励记录表
  - id: string
  - from_user_id: string
  - to_user_id: string
  - emoji: string ("flower")
  - context: string (触发情境描述)
  - created_at: number
```

### 3.2 t_user 表新增字段
- `class_id: string | null` — 所属班级 ID

### 3.3 用户新增字段（内存）
- `flowers: number` — 小花余额（初始 5，每天重置为 5，stat cron 或新的一天首次打开时重置）
- `last_flower_reset_date: string` — 上次重置日期（格式 YYYY-MM-DD）

## 四、API 设计

### 4.1 班级相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/class/create | 创建班级（返回班级码） | user |
| POST | /api/class/join | 加入班级（body: {code}） | user |
| POST | /api/class/leave | 退出当前班级 | user |
| GET | /api/class/me | 获取当前班级信息 | user |
| GET | /api/class/members?grade=X | 获取同班成员（同码+同年级） | user |

### 4.2 鼓励相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/encouragement/send | 送小花（body: {toUserId}） | user |
| GET | /api/encouragement/received | 获取收到的鼓励列表 | user |

### 4.3 错误码
- 400: 班级码不存在 / 余额不足 / 每日赠送次数用完 / 已在班级中
- 404: 班级不存在 / 用户不存在

## 五、前端页面

### 5.1 Profile 页 — 我的班级
- **未加入班级**：显示"加入班级"按钮（输入码）和"创建班级"按钮
- **已加入班级**：显示班级名称、成员数量、"退出班级"按钮
- 班级创建/加入弹窗（Dialog）

### 5.2 Leaderboard 页 — 同学 Tab
- 调用 `/api/class/members?grade=X`
- 列表项：头像 + 昵称 + 年级 + XP + 段位 + "送花"按钮
- 送花后按钮变为"已送"状态（本次会话内有效）
- 未加入班级时：空状态引导

### 5.3 Stats 页 — 收到鼓励
- 展示收到的小花总数
- 鼓励列表：送花人昵称 + 时间 + 情境描述

## 六、UI 交互细节

### 6.1 班级加入/创建弹窗
- 输入框 + 确定按钮
- 创建班级需额外输入班级名称
- 错误时 toast 提示

### 6.2 送花按钮
- 图标：🌸（或 lucide Flower 图标）
- 点击 → 余额足够且未超限 → 按钮变为 "已送 🌸"，toast 成功
- 余额不足 → toast 提示"小花不足，明天再来！"

### 6.3 小花余额
- 在 Stats 页显示"收到 🌸 X 朵"
- 每日首次打开应用时重置为 5 朵（在后端 API 触发，不做主动 cron）

## 七、后续扩展方向（本期不做）
- 班级管理员（创建者可删除成员）
- 文字鼓励语
- 学习动态 feed
- 关卡 PK
- 小花商店（用 XP 购买更多小花）

## 八、技术约束
- 后端：Express + 内存存储（Map），无需数据库改造
- 前端：复用现有 Leaderboard.tsx、Stats.tsx、Profile.tsx
- 不引入新的状态管理库
