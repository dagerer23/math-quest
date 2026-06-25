#!/bin/bash
#================================================================
# MathQuest 一键构建部署脚本（单台 ECS）
# 用途：在 ECS 上 clone 代码 → 构建前端 → 同步到部署目录 → PM2 重启
# 使用：在云效流水线「主机部署」节点执行此脚本
#       或手动 SSH 到 ECS 执行：bash deploy.sh [分支名]
#================================================================
set -e

# ---------- 可配置项（按实际修改）----------
# Git 仓库（用 HTTPS + Token 方式，避免 SSH 密钥配置）
# 格式：https://<用户名>:<Token>@github.com/dagerer23/math-quest.git
# Token 在 GitHub → Settings → Developer settings → Personal access tokens 生成，勾选 repo 权限
GIT_REPO="https://dagerer23:替换为你的GitHubToken@github.com/dagerer23/math-quest.git"
GIT_BRANCH="${1:-main}"                      # 默认 main 分支，可传参覆盖

DEPLOY_DIR="/www/mathquest"                  # 生产部署目录
WORK_DIR="/tmp/mathquest-build"              # 临时构建目录
LOG_DIR="${DEPLOY_DIR}/logs"

# Node 路径（如果 nvm 装的，取消下面注释并改版本）
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
# nvm use 18

# ---------- 以下一般无需修改 ----------
echo "=========================================="
echo "  MathQuest 部署脚本"
echo "  分支: ${GIT_BRANCH}"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 1. 拉取代码
echo ""
echo "[1/6] 拉取代码..."
rm -rf "${WORK_DIR}"
git clone --depth 1 --branch "${GIT_BRANCH}" "${GIT_REPO}" "${WORK_DIR}"
cd "${WORK_DIR}"
echo "当前提交: $(git log -1 --pretty=format:'%h - %s (%an, %ad)')"

# 2. 安装依赖
echo ""
echo "[2/6] 安装依赖..."
npm install --no-audit --no-fund

# 3. 构建前端（含后台管理界面）
echo ""
echo "[3/6] 构建前端..."
npm run build
if [ ! -d "dist" ]; then
  echo "构建失败：dist 目录不存在"
  exit 1
fi
echo "前端构建产物大小: $(du -sh dist | cut -f1)"

# 4. 备份当前部署目录（用于回滚）
echo ""
echo "[4/6] 备份当前版本..."
if [ -d "${DEPLOY_DIR}" ] && [ -f "${DEPLOY_DIR}/package.json" ]; then
  BACKUP_DIR="${DEPLOY_DIR}.bak.$(date +%Y%m%d%H%M%S)"
  cp -r "${DEPLOY_DIR}" "${BACKUP_DIR}"
  # 只保留最近 3 个备份
  ls -dt "${DEPLOY_DIR}.bak."* 2>/dev/null | tail -n +4 | xargs rm -rf {} 2>/dev/null || true
  echo "已备份至: ${BACKUP_DIR}"
else
  echo "首次部署，跳过备份"
fi

# 5. 同步文件到部署目录
echo ""
echo "[5/6] 同步文件到 ${DEPLOY_DIR}..."
mkdir -p "${DEPLOY_DIR}"
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'platform-taro' \
  --exclude 'src' \
  --exclude 'dist-webapp' \
  --exclude 'docs' \
  --exclude 'public' \
  --exclude 'scripts/*.py' \
  --exclude 'test_*.py' \
  --exclude '*.cjs' \
  --exclude '.env' \
  "${WORK_DIR}/" "${DEPLOY_DIR}/"

# 部署目录安装后端依赖（tsx 在 devDependencies，必须全装）
cd "${DEPLOY_DIR}"
echo "安装后端依赖..."
npm install --no-audit --no-fund
mkdir -p "${LOG_DIR}"

# 确认 .env 存在（不覆盖已有配置）
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
  echo "⚠️  ${DEPLOY_DIR}/.env 不存在，请手动创建（参考 .env.example）"
  echo "    首次部署需配置 DB_PASSWORD、CORS_ORIGIN、WX_APPID、WX_SECRET 等"
fi

# 6. PM2 重启后端
echo ""
echo "[6/6] 重启后端服务..."
if pm2 describe math-quest > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs
  echo "已 reload（零停机）"
else
  pm2 start ecosystem.config.cjs
  pm2 save
  echo "首次启动，已保存 PM2 进程列表"
fi

# 健康检查
echo ""
echo "健康检查..."
sleep 3
HEALTH=$(curl -sf http://127.0.0.1:3002/api/health 2>/dev/null || echo "")
if [ -n "${HEALTH}" ]; then
  echo "✅ 后端健康: ${HEALTH}"
else
  echo "❌ 健康检查失败，最近日志："
  pm2 logs math-quest --lines 20 --nostream
  exit 1
fi

# 清理临时目录
rm -rf "${WORK_DIR}"

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  前端: http://你的域名/"
echo "  后台: http://你的域名/admin/login"
echo "  API:  http://你的域名/api/health"
echo "  回滚: cp -r ${DEPLOY_DIR}.bak.<时间戳>/* ${DEPLOY_DIR}/ && pm2 reload ecosystem.config.cjs"
echo "=========================================="
