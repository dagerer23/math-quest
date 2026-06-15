# 高并发后端优化设计

> 日期：2025-06-12  
> 目标：几千到几万日活  
> 方案：渐进式优化（方案一）

---

## 1. 背景

算力先锋（MathQuest）后端当前为单进程 Express + MySQL（含内存降级）。为支持推广后几千到几万日活用户，需要在不重构现有代码的前提下，叠加高并发能力。

## 2. 整体架构

```
                         Nginx (:80)
                      /              \
            /api/* 反向代理       /* 静态资源
                 /                      \
    Express (PM2 cluster × N)     dist/ (Vite build)
         :3002
           |
      +----+----+
      |         |
    Redis    MySQL (RDS)
   (缓存)    (持久化)
```

- **Nginx**：统一入口，HTTPS，gzip，SPA fallback，限流
- **PM2 cluster**：N 个 Express 进程（CPU 核数），自带负载均衡，崩溃自动重启
- **Redis**：ioredis 接入，缓存关卡内容、Token、限流
- **MySQL**：阿里云/腾讯云 RDS，连接池优化，慢查询监控

## 3. Redis 缓存策略

### 3.1 缓存 Key 设计

| 缓存对象 | Key 格式 | TTL | 说明 |
|---------|---------|-----|------|
| 年级关卡聚合 | `content:grade:{n}` | 10 min | 首页最高频读取 |
| 单关卡详情 | `content:level:{id}` | 10 min | 进入答题时拉取 |
| 知识点列表 | `content:kps:{grade}` | 30 min | 几乎不变 |
| 用户 Token | `token:{userId}` | 7 day | 替代 MySQL 查询 |
| 验证码限流 | `sms:limit:{phone}` | 60 sec | 防刷 |
| 统计摘要 | `stats:summary` | 5 min | 管理后台 |

全部使用 Redis String 类型存储 JSON。

### 3.2 缓存更新策略（分级处理）

| 缓存类型 | 写策略 | 理由 |
|---------|--------|------|
| 单关卡详情 | 直接删除 Key | 单关卡流量极低，回源 MySQL 主键查询毫秒级，不冲击数据库 |
| 年级聚合数据 | MySQL 写完后，重新查询 MySQL 该年级数据，完整覆盖写入 Redis | 保证聚合数据准确 |
| 知识点列表 | TTL 自然过期 | 变动极罕见，不需要主动同步 |
| Token / 限流 | Cache-Aside | 非内容缓存，无一致性问题 |

### 3.3 读策略（Cache-Aside）

```
读请求 → Redis 命中？→ 是 → 返回
                    → 否 → MySQL → 回写 Redis（带 TTL）→ 返回
```

### 3.4 预热

服务启动时自动加载所有年级关卡内容到 Redis。

## 4. MySQL 数据库优化

### 4.1 连接池

```typescript
{
  connectionLimit: 20,
  queueLimit: 50,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
}
```

### 4.2 读写分离池（预留）

- `readPool`：所有 SELECT
- `writePool`：所有 INSERT/UPDATE/DELETE

当前两者指向同一 MySQL 实例。后续需读写分离时，仅改配置即可，代码不动。

### 4.3 新增索引

| 表 | 新增索引 | 用途 |
|---|---------|------|
| `t_session` | `idx_user_date (user_id, completed_at)` | 个人答题趋势查询 |
| `t_question` | `idx_kp_diff (knowledge_point, difficulty)` | 后台按知识点筛选 |

### 4.4 监控

开启 `slow_query_log`，阈值 200ms。定期 `EXPLAIN` 分析慢查询。

## 5. PM2 集群配置

### 5.1 ecosystem.config.cjs

```javascript
module.exports = {
  apps: [{
    name: 'mathquest-api',
    script: 'server/index.ts',
    interpreter: 'node_modules/.bin/tsx',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    kill_timeout: 5000,
    listen_timeout: 3000,
  }]
}
```

### 5.2 关键点

- 每个进程各自建立 Redis 连接（ioredis）
- PM2 自带轮询负载均衡，共享端口 3002
- 零宕机重启：`pm2 reload`
- 移除 Express 服务中进程内的内存 Map 缓存（改为 Redis 统一缓存）

## 6. Nginx 配置

### 6.1 关键配置

| 机制 | 作用 |
|------|------|
| `keepalive 64` | upstream 长连接池，减少 TCP 握手 |
| `gzip` | 压缩 JSON/JS/CSS/SVG |
| `try_files /index.html` | SPA fallback |
| `expires 30d` + `immutable` | hash 命名的 JS/CSS 永远缓存 |
| `limit_req` | 每个 IP 每秒 20 个请求 |

### 6.2 完整配置见 `nginx/mathquest.conf`

## 7. API 限流

新增 `server/middleware/rateLimit.ts`，使用 `express-rate-limit`：

- 一般 API：每个 IP 15 分钟内 100 次
- 登录/验证码：每个 IP 1 分钟内 5 次
- 管理后台：不做限流（或更宽松）

## 8. 实施清单

| # | 改动项 | 文件 | 类型 |
|---|--------|------|------|
| 1 | 安装依赖（ioredis, express-rate-limit） | package.json | 新增 |
| 2 | Redis 缓存服务 | server/services/cache.ts | 新增 |
| 3 | 题库服务接入缓存 | server/services/content.ts | 修改 |
| 4 | Token/验证码接入缓存 | server/services/auth.ts | 修改 |
| 5 | MySQL 连接池 + 读写分离池 | server/db.ts | 修改 |
| 6 | 新增索引 DDL | server/db/migrations/001-indexes.sql | 新增 |
| 7 | API 限流中间件 | server/middleware/rateLimit.ts | 新增 |
| 8 | PM2 配置 | ecosystem.config.cjs | 新增 |
| 9 | Nginx 配置 | nginx/mathquest.conf | 新增 |
| 10 | 移除前端内存缓存 | src/services/content.ts | 修改 |

## 9. 不使用 Redis 时的降级

如果 Redis 不可用（未安装/连接失败），所有缓存功能自动降级为 MySQL 直接查询。日志输出 `[cache] Redis 不可用，降级到 MySQL 直查`。