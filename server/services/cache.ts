/**
 * Redis 缓存服务
 * 不可用时自动降级为直接返回 null，调用方走 MySQL
 */
import { Redis } from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

let redis: Redis | null = null
let redisAvailable = false

function getRedis(): Redis | null {
  if (redis) return redis
  if (redisAvailable === false) return null

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 2) {
          console.warn('[cache] Redis 重试超过 2 次，降级为 MySQL 直查')
          redisAvailable = false
          return null
        }
        return Math.min(times * 200, 1000)
      },
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      console.warn('[cache] Redis 连接错误:', err.message)
      redisAvailable = false
    })

    redis.on('connect', () => {
      console.log('[cache] Redis 已连接')
      redisAvailable = true
    })

    redisAvailable = true
    return redis
  } catch (e: any) {
    console.warn('[cache] Redis 初始化失败:', e.message)
    redisAvailable = false
    return null
  }
}

/** 获取缓存 */
export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis()
  if (!r) return null
  try {
    return await r.get(key)
  } catch {
    return null
  }
}

/** 写入缓存 */
export async function cacheSet(key: string, value: string, ttlSeconds = 600): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.setex(key, ttlSeconds, value)
  } catch { /* 静默降级 */ }
}

/** 删除缓存 */
export async function cacheDel(key: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.del(key)
  } catch { /* 静默降级 */ }
}

/** 批量删除匹配的 key */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    const keys = await r.keys(pattern)
    if (keys.length > 0) {
      await r.del(...keys)
    }
  } catch { /* 静默降级 */ }
}

/** 检查 Redis 是否可用 */
export function isRedisAvailable(): boolean {
  return redisAvailable
}