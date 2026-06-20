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
