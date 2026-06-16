# Taro 多端适配：微信小程序 + Web

> 日期：2026-06-16
> 状态：Phase 1 进行中

## 背景

当前项目为纯 Web 应用（React + Vite），需要扩展到微信小程序和 Web 双端运行。采用 Taro 框架，一套 React 代码编译输出微信小程序和 H5。

## 架构设计

### Monorepo 结构

```
math-quest/
├── src/                          # 当前 Web 项目（不变）
│   ├── pages/                    # 24 个页面
│   ├── components/               # 组件
│   ├── services/                 # API 层
│   ├── store/                    # Zustand 状态
│   └── utils/                    # 工具函数
├── packages/
│   ├── ui/                       # 共享 UI 组件包（新）
│   │   ├── src/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── avatar/           # DiceBear Lorelei
│   │   │   ├── tabs/
│   │   │   └── ...
│   │   └── package.json
│   └── shared/                   # 共享业务逻辑包（新）
│       ├── src/
│       │   ├── hooks/            # 共享 hooks
│       │   ├── utils/            # 平台无关工具
│       │   ├── constants/        # 常量
│       │   └── types/            # 类型定义
│       └── package.json
├── platform-taro/                # Taro 多端项目（新）
│   ├── src/
│   │   ├── app.config.ts        # 全局配置
│   │   ├── app.tsx              # 入口
│   │   ├── pages/               # 页面入口（引用共享包）
│   │   ├── components/          # 平台特有组件
│   │   ├── adapters/            # 平台适配层（新）
│   │   │   ├── request.ts       # 请求适配
│   │   │   ├── storage.ts       # 存储适配
│   │   │   ├── platform.ts      # 平台检测
│   │   │   └── wx/             # 微信小程序特有 API
│   │   └── styles/              # Taro 样式
│   ├── config/                   # Taro 配置
│   ├── project.config.json       # 微信小程序配置
│   └── package.json
└── package.json                  # 根 workspace 配置
```

### 关键技术决策

| 决策项 | 方案 | 原因 |
|--------|------|------|
| 样式方案 | UnoCSS（原子化 CSS） | Taro + Tailwind 组合在部分场景有兼容问题，UnoCSS 更稳定 |
| 路由方案 | Taro 路由 + React Router | Web 端用 React Router，小程序端用 Taro Router |
| 状态管理 | Zustand | 完全兼容 Taro，无需改动 |
| UI 组件 | 共享包 + Taro 适配 | 尽量复用现有 shadcn 风格组件 |
| 动画 | framer-motion | Web 端保留，小程序端降级/条件加载 |

## Phase 1 任务清单

### 1. 项目初始化

- [ ] 创建 `packages/ui` 共享 UI 包
- [ ] 创建 `packages/shared` 共享逻辑包
- [ ] 创建 `platform-taro` Taro 项目
- [ ] 配置 `pnpm-workspace.yaml`（Monorepo）

### 2. 共享包开发

- [ ] `packages/ui` — 提取核心 UI 组件（Taro 适配版）
  - Button, Card, Input, Avatar(DiceBear)
  - Tabs, Badge, Dialog, Progress, Skeleton
  - Switch, Separator, Tooltip
- [ ] `packages/shared` — 共享 hooks 和工具
  - `useUserStore` Zustand store（兼容）
  - `request.ts` 平台适配版
  - `avatar.ts`（已有，直接引用）
  - 题库、游戏逻辑（直接引用）

### 3. Taro 项目配置

- [ ] `taro.config.ts` — Taro 构建配置
- [ ] `project.config.json` — 微信小程序项目配置
- [ ] `app.config.ts` — 全局配置（pages、tabBar、window）
- [ ] `UnoCSS` 配置

### 4. 平台适配层

- [ ] `src/adapters/request.ts` — fetch 封装，兼容小程序和 Web
- [ ] `src/adapters/storage.ts` — localStorage / wx.getStorageSync
- [ ] `src/adapters/platform.ts` — 平台检测 hooks
- [ ] `src/adapters/wx/` — 微信特有 API（分享、支付、扫码）

### 5. 页面适配

- [ ] 创建 `src/pages/` 页面入口文件（引用共享页面组件）
- [ ] 配置 `app.config.ts` 的 pages 数组
- [ ] 配置 tabBar（5 个 Tab：首页、目标、错题、榜单、我的）
- [ ] 路由参数适配（小程序 URL 传参 vs React Router params）

### 6. 构建验证

- [ ] `npm run build:weapp` — 微信小程序包
- [ ] `npm run build:h5` — H5 包
- [ ] 微信开发者工具导入预览
- [ ] 浏览器访问 H5 验证

## 页面清单（共 24 个）

| 页面 | 路径 | TabBar | 优先级 |
|------|------|--------|--------|
| 首页/地图 | /pages/home/index | ✓ 首页 | P0 |
| 登录 | /pages/login/index | — | P0 |
| 验证码 | /pages/verify-code/index | — | P0 |
| 用户引导 | /pages/onboarding/index | — | P0 |
| 测评 | /pages/assessment/index | — | P0 |
| 测评结果 | /pages/assessment-result/index | — | P1 |
| 关卡战斗 | /pages/battle/index | — | P0 |
| 结果页 | /pages/result/index | — | P0 |
| 每日目标 | /pages/daily-goals/index | ✓ 目标 | P1 |
| 错题本 | /pages/mistakes/index | ✓ 错题 | P1 |
| 排行榜 | /pages/leaderboard/index | ✓ 榜单 | P0 |
| 个人中心 | /pages/profile/index | ✓ 我的 | P0 |
| 学习统计 | /pages/stats/index | — | P1 |
| 协议 | /pages/agreement/index | — | P2 |

## 不做的事

- 不改动现有 `src/` Web 项目
- Phase 1 暂不输出 iOS App（Phase 2 再做）
- 不做暗色模式
- 不做微信支付（后续单独需求）
- 不做小程序分包加载（首期先全量加载）
