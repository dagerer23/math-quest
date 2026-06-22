# Agent Rules

## 仓库信息

- **仓库地址**: https://github.com/dagerer23/math-quest
- **主分支**: main（所有代码都合并至这个分支）

## GitHub Token 配置

用于推送代码到远程仓库。将 Token 配置到远程 URL 即可：

```bash
git remote set-url origin https://dagerer23:<YOUR_GITHUB_TOKEN>@github.com/dagerer23/math-quest.git
```

> ⚠️ **安全建议**：Token 建议单独保存，不要明文提交到代码中。推送后建议在 GitHub 上禁用此 Token 并重新生成新的。

## 代码更改后返回服务地址

每次更改代码后，必须返回前后端服务地址，方便用户预览：

- **前端预览地址**: http://localhost:5173
- **后端服务地址**: http://localhost:3001

如果服务端口有变化，以实际启动时输出的端口为准。

## 界面变更回归测试

每次修改了前后端界面时（必须有代码文件变更），需要使用 `webapp-testing` 技能进行回归测试，确保界面功能正常。

- **技能名称**: webapp-testing
- **触发条件**: 当本次任务涉及前端或后端界面相关代码文件的修改时
- **执行要求**: 在完成代码修改后，调用 webapp-testing 技能对变更的界面进行回归测试

## MySQL 数据库配置

MySQL 已通过 Homebrew 安装并配置完成，**无需重复安装**，每次只需启动服务即可。

- **安装方式**: `brew install mysql`（已安装，版本 9.6.0）
- **数据目录**: `/opt/homebrew/var/mysql/`
- **端口**: 3306
- **用户**: root（无密码）
- **数据库名**: mathquest（首次启动后端时会自动创建并建表、导入题库）
- **Brew 路径**: `/opt/homebrew/bin/brew`（需 `eval "$(/opt/homebrew/bin/brew shellenv)"` 加载环境）

### MySQL 服务管理命令

```bash
# 加载 brew 环境（每个新终端会话需先执行）
eval "$(/opt/homebrew/bin/brew shellenv)"

# 启动 MySQL（开机自启，后台运行）
brew services start mysql

# 停止 MySQL
brew services stop mysql

# 重启 MySQL
brew services restart mysql

# 查看运行状态
brew services list | grep mysql

# 连接 MySQL（无密码）
mysql -u root
```

## 前后端服务启动

MySQL 启动后，按以下方式启动前后端（端口已固化）：

- **后端**: 端口 3001，连接 MySQL（配置见 `.env` 文件）
  ```bash
  npm run dev:server
  ```
- **前端**: 端口 5173，Vite 代理指向 3001
  ```bash
  npm run dev
  ```
- **后台管理**: http://localhost:5173/admin/login （账号 admin / admin123）

> 后端端口和数据库连接配置已写入项目根目录 `.env` 文件，`npm run dev:server` 会自动读取，无需手动指定 PORT。

## Taro 小程序打包规则

当 `platform-taro/src` 目录下的文件发生变更时，需要重新执行 `npm run build:weapp` 打包微信小程序，并将打包结果记录到本文件。

**输出目录**：`platform-taro/dist-weapp`

### 打包记录

- 2026-06-22：实现 BASE_URL 环境区分配置（本地开发/真机预览/阿里云生产自动切换）。变更文件：`platform-taro/config/index.ts`、`platform-taro/src/utils/request.ts`、`platform-taro/src/env.d.ts`。执行 `npm run build:weapp` 构建成功，产物输出至 `dist-webapp/`，已验证 DefinePlugin 环境变量注入正常。
- 2026-06-22：优化个人中心界面——成就模块改为可点击跳转入口并移至排行榜旁，学习数据卡片合并到学习统计页面并移除原卡片。变更文件：`platform-taro/src/pages/profile/index.tsx`、`platform-taro/src/pages/stats/index.tsx`。执行 `npm run build:weapp` 构建成功。
- 2026-06-22：新增学习日历热力图功能（近30天答题统计）。变更文件：`platform-taro/src/types/models.ts`、`platform-taro/src/store/useUserStore.ts`、`platform-taro/src/components/ui/HeatmapCalendar.tsx`（新增）、`platform-taro/src/pages/profile/index.tsx`。执行 `npm run build:weapp` 构建成功。
- 2026-06-22：Web 前端同步 Taro 端三项界面改动（成就跳转入口+学习数据合并到统计页+学习日历热力图）。变更文件：`src/types/models.ts`、`src/store/useUserStore.ts`、`src/components/ui/HeatmapCalendar.tsx`（新增）、`src/pages/Profile.tsx`、`src/pages/Stats.tsx`、`src/App.tsx`。TypeScript 编译通过，webapp-testing 回归测试通过。
- 2026-06-23：优化登录页勾选框与协议文字的水平/垂直对齐，并移除底部“测试验证码：123456”提示。变更文件：`platform-taro/src/pages/login/index.tsx`。执行 `npm run build:weapp` 构建成功，产物输出至 `dist-weapp/`。