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
