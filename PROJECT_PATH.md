# 项目路径信息

- **项目路径**: /Users/wangzeming/duoinguo/math-quest

## 说明

本文件用于记录当前项目的绝对路径与目录结构，供 Agent 在生成文件时读取，以确保文件生成在正确的项目目录下。

如项目迁移路径或结构调整，请同步更新本文件内容。

## 项目结构

```
math-quest/
├── server/                      # 后端服务（Node.js + Express + TypeScript）
│   ├── data/                    # 运行时数据（用户、验证码）
│   ├── db/                      # 数据库迁移脚本
│   │   └── migrations/
│   ├── middleware/              # 中间件（鉴权、审计、限流）
│   ├── routes/                  # 路由（auth、class、content、admin 等）
│   ├── scripts/                 # 数据库初始化脚本
│   ├── services/                # 业务服务层（auth、class、content、stats 等）
│   ├── db.ts                    # 数据库连接
│   ├── index.ts                 # 后端入口
│   └── types.ts                 # 后端类型定义
├── src/                         # 前端源码（React + Vite + TypeScript）
│   ├── assets/                  # 静态资源
│   ├── components/              # 通用组件
│   │   ├── home/                # 首页地图相关组件
│   │   └── ui/                  # 基础 UI 组件（shadcn/ui）
│   ├── data/                    # 前端静态数据（成就、题库）
│   ├── lib/                     # 工具库
│   ├── pages/                   # 页面组件
│   │   └── admin/               # 后台管理页面
│   ├── services/                # 前端 API 服务层
│   ├── store/                   # 状态管理（zustand）
│   ├── types/                   # 前端类型定义
│   ├── utils/                   # 工具函数
│   ├── App.tsx                  # 前端根组件
│   ├── main.tsx                 # 前端入口
│   └── index.css                # 全局样式
├── platform-taro/               # Taro 多端项目（微信小程序 / H5）
│   ├── config/                  # Taro 构建配置
│   ├── public/                  # 公共静态资源
│   ├── scripts/                 # 图标生成等脚本
│   ├── src/
│   │   ├── assets/              # 资源（头像、tab 图标）
│   │   ├── components/          # Taro 组件
│   │   ├── data/                # 数据
│   │   ├── pages/               # Taro 页面
│   │   ├── services/            # API 服务
│   │   ├── store/               # 状态管理
│   │   ├── styles/              # 样式
│   │   ├── types/               # 类型定义
│   │   ├── utils/               # 工具函数
│   │   └── app.tsx              # Taro 入口
│   ├── package.json
│   ├── tsconfig.json
│   └── uno.config.ts            # UnoCSS 配置
├── public/                      # 前端公共资源（demo 图、截图、favicon）
├── scripts/                     # 项目脚本（题库导入、测试、头像生成等）
├── docs/                        # 文档与设计规范
│   └── superpowers/specs/       # 各功能模块设计文档
├── nginx/                       # Nginx 配置
├── dist-webapp/                 # 小程序构建产物（自动生成，勿手动修改）
├── .env.example                 # 环境变量示例
├── AGENTS.md                    # Agent 规则文件
├── PROJECT_PATH.md              # 本文件（项目路径与结构信息）
├── README.md
├── package.json                 # 根 package.json
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.cjs          # Tailwind 配置
├── postcss.config.cjs           # PostCSS 配置
├── eslint.config.js             # ESLint 配置
└── ecosystem.config.cjs         # PM2 配置
```

### 目录用途说明

- **server/**：后端服务，端口 3001，连接 MySQL，提供 API 与后台管理接口
- **src/**：Web 前端（React + Vite），端口 5173，包含学生端与管理后台
- **platform-taro/**：基于 Taro 的多端项目，可编译为微信小程序与 H5
- **scripts/**：题库导入、自动化测试、头像生成等辅助脚本
- **docs/superpowers/specs/**：各功能模块的设计文档与实施任务清单
- **dist-webapp/**：小程序构建产物目录，自动生成，请勿手动修改
