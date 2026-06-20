/**
 * 数据库连接 - 支持 MySQL / 内存降级
 */
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

// 尝试 MySQL 连接
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mathquest',
  ...(process.env.DB_SOCKET ? { socketPath: process.env.DB_SOCKET } : {}),
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 50,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
}

let readPool: mysql.Pool | null = null
let writePool: mysql.Pool | null = null
let useMemory = false

// 尝试初始化 MySQL
export async function initDB(): Promise<boolean> {
  try {
    // 先测试 socket 能否连接
    const testPool = mysql.createPool(DB_CONFIG)
    const conn = await testPool.getConnection()
    // 测试数据库是否存在
    try {
      await conn.query(`USE \`${DB_CONFIG.database}\``)
    } catch {
      // 数据库不存在，尝试创建
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
      await conn.query(`USE \`${DB_CONFIG.database}\``)
    }
    // 检查表是否存在，不存在则创建
    const ensureTable = async (tableName: string, ddl: string) => {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(`SHOW TABLES LIKE "${tableName}"`)
      if (rows.length === 0) await conn.query(ddl)
    }

    await ensureTable('t_user', `
      CREATE TABLE t_user (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20) DEFAULT NULL,
        openid VARCHAR(64) DEFAULT NULL,
        nickname VARCHAR(50) DEFAULT '小先锋',
        avatar VARCHAR(20) DEFAULT '',
        learning_stage VARCHAR(20) DEFAULT 'primary',
        learning_goal VARCHAR(20) DEFAULT 'consolidation',
        target_grade TINYINT DEFAULT 2,
        created_at BIGINT NOT NULL,
        last_login_at BIGINT DEFAULT NULL,
        UNIQUE KEY uk_phone (phone),
        UNIQUE KEY uk_openid (openid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 存量数据库兼容：t_user 增加 openid 字段、phone 改为可空（支持纯微信登录用户）
    try {
      await conn.query(`ALTER TABLE t_user ADD COLUMN openid VARCHAR(64) DEFAULT NULL`)
      console.log('[DB] t_user 已新增 openid 列')
    } catch { /* 列已存在 */ }
    try {
      await conn.query(`ALTER TABLE t_user ADD UNIQUE KEY uk_openid (openid)`)
    } catch { /* 索引已存在 */ }
    try {
      await conn.query(`ALTER TABLE t_user MODIFY COLUMN phone VARCHAR(20) DEFAULT NULL`)
    } catch { /* 修改失败忽略 */ }

    await ensureTable('t_verification_code', `
      CREATE TABLE t_verification_code (
        phone VARCHAR(20) PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        expires_at BIGINT NOT NULL,
        attempts TINYINT DEFAULT 0,
        created_at BIGINT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await ensureTable('t_assessment', `
      CREATE TABLE t_assessment (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        completed_at BIGINT NOT NULL,
        score INT NOT NULL,
        recommended_difficulty TINYINT NOT NULL,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await ensureTable('t_assessment_answer', `
      CREATE TABLE t_assessment_answer (
        id VARCHAR(120) PRIMARY KEY,
        assessment_id VARCHAR(64) NOT NULL,
        question_id VARCHAR(64) NOT NULL,
        user_answer VARCHAR(64) NOT NULL,
        is_correct TINYINT NOT NULL,
        INDEX idx_assessment (assessment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await ensureTable('t_token', `
      CREATE TABLE t_token (
        token VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL,
        INDEX idx_user_id (user_id),
        UNIQUE INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 关卡表
    await ensureTable('t_level', `
      CREATE TABLE t_level (
        id VARCHAR(64) PRIMARY KEY,
        grade TINYINT NOT NULL,
        chapter VARCHAR(100) NOT NULL,
        is_boss TINYINT DEFAULT 0,
        unit_id VARCHAR(64) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        INDEX idx_grade (grade),
        INDEX idx_sort (grade, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 存量数据库兼容：新增 sort_order 列并回填值
    try {
      await conn.query(`ALTER TABLE t_level ADD COLUMN sort_order INT NOT NULL DEFAULT 0`)
      console.log('[DB] t_level 已新增 sort_order 列')
    } catch { /* 列已存在 */ }
    try {
      await conn.query(`ALTER TABLE t_level ADD INDEX idx_sort (grade, sort_order)`)
    } catch { /* 索引已存在 */ }

    // 回填 sort_order（仅对 sort_order = 0 的行，按 id 排序分配）
    {
      const [zeroRows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT id, grade FROM t_level WHERE sort_order = 0 ORDER BY grade ASC, id ASC`
      )
      if (zeroRows.length > 0) {
        const byGrade = new Map<number, string[]>()
        for (const r of zeroRows) {
          const g = Number(r.grade)
          if (!byGrade.has(g)) byGrade.set(g, [])
          byGrade.get(g)!.push(r.id)
        }
        for (const [, ids] of byGrade) {
          ids.forEach((id, i) => {
            conn.query(`UPDATE t_level SET sort_order = ? WHERE id = ?`, [i + 1, id]).catch(() => {})
          })
        }
        console.log(`[DB] 已回填 ${zeroRows.length} 条关卡的 sort_order`)
      }
    }

    // 题目表
    await ensureTable('t_question', `
      CREATE TABLE t_question (
        id VARCHAR(80) PRIMARY KEY,
        level_id VARCHAR(64) NOT NULL,
        type VARCHAR(20) NOT NULL,
        knowledge_point VARCHAR(64) NOT NULL,
        difficulty TINYINT NOT NULL DEFAULT 1,
        difficulty_score INT DEFAULT NULL,
        prompt TEXT NOT NULL,
        \`options\` TEXT,
        answer VARCHAR(200) NOT NULL,
        explanation TEXT,
        xp INT NOT NULL DEFAULT 10,
        illustration VARCHAR(50),
        created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        INDEX idx_level (level_id),
        INDEX idx_kp (knowledge_point)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 答题会话记录（用于统计）
    await ensureTable('t_session', `
      CREATE TABLE t_session (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        level_id VARCHAR(64) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        stars TINYINT NOT NULL DEFAULT 0,
        correct_count INT NOT NULL DEFAULT 0,
        total_count INT NOT NULL DEFAULT 0,
        combo_max INT NOT NULL DEFAULT 0,
        xp_gained INT NOT NULL DEFAULT 0,
        completed_at BIGINT NOT NULL,
        INDEX idx_user (user_id),
        INDEX idx_level (level_id),
        INDEX idx_completed (completed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 错题记录
    await ensureTable('t_mistake', `
      CREATE TABLE t_mistake (
        id VARCHAR(80) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        question_id VARCHAR(80) NOT NULL,
        user_answer VARCHAR(200) NOT NULL,
        correct_answer VARCHAR(200) NOT NULL,
        created_at BIGINT NOT NULL,
        INDEX idx_user (user_id),
        INDEX idx_question (question_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 系统配置表
    await ensureTable('t_system_config', `
      CREATE TABLE t_system_config (
        \`key\` VARCHAR(64) PRIMARY KEY,
        \`value\` TEXT NOT NULL,
        description VARCHAR(200) DEFAULT NULL,
        updated_at BIGINT NOT NULL,
        updated_by VARCHAR(50) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 管理员账号表
    await ensureTable('t_admin_user', `
      CREATE TABLE t_admin_user (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(200) NOT NULL,
        nickname VARCHAR(50) DEFAULT '管理员',
        role VARCHAR(20) NOT NULL DEFAULT 'admin',
        created_at BIGINT NOT NULL,
        last_login_at BIGINT DEFAULT NULL,
        status TINYINT NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 管理员登录日志
    await ensureTable('t_admin_login_log', `
      CREATE TABLE t_admin_login_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL,
        ip VARCHAR(50) DEFAULT NULL,
        login_at BIGINT NOT NULL,
        INDEX idx_admin (admin_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 导入日志
    await ensureTable('t_import_log', `
      CREATE TABLE t_import_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(50) DEFAULT NULL,
        filename VARCHAR(200) NOT NULL,
        type VARCHAR(20) NOT NULL,
        total INT NOT NULL DEFAULT 0,
        success INT NOT NULL DEFAULT 0,
        failed INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        message TEXT,
        created_at BIGINT NOT NULL,
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 成就表
    await ensureTable('t_achievement', `
      CREATE TABLE t_achievement (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NOT NULL,
        icon VARCHAR(50) NOT NULL DEFAULT 'trophy',
        sort_order INT NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        INDEX idx_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 每日目标模板表
    await ensureTable('t_daily_goal_template', `
      CREATE TABLE t_daily_goal_template (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description VARCHAR(255) NOT NULL,
        icon VARCHAR(50) NOT NULL DEFAULT 'goal',
        type VARCHAR(20) NOT NULL DEFAULT 'xp',
        target INT NOT NULL DEFAULT 0,
        reward_xp INT NOT NULL DEFAULT 0,
        reward_coins INT NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        INDEX idx_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 初始化默认成就（仅当表为空时）
    {
      const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM t_achievement')
      if (rows[0].cnt === 0) {
        const defaults = [
          ['first_blood', '初出茅庐', '完成第 1 关', 'sword', 1],
          ['combo_5', '连击新星', '达成 5 连击', 'lightning', 2],
          ['combo_10', '连击大师', '达成 10 连击', 'fire', 3],
          ['streak_3', '坚持不懈', '连续打卡 3 天', 'calendar', 4],
          ['streak_7', '一周学霸', '连续打卡 7 天', 'trophy', 5],
          ['coins_500', '小富翁', '累计获得 500 金币', 'coin', 6],
          ['no_mistake', '完美通关', '一关内零失误', 'diamond', 7],
          ['boss_killer', 'BOSS 杀手', '击败 1 个 BOSS 关卡', 'ghost', 8],
          ['xp_1000', '经验大亨', '累计获得 1000 XP', 'sparkles', 9],
          ['mistake_master', '错题克星', '错题本累积 20 题后清空', 'memo', 10],
        ] as const
        for (const [id, name, desc, icon, sort] of defaults) {
          await conn.query(
            'INSERT INTO t_achievement (id, name, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
            [id, name, desc, icon, sort]
          )
        }
        console.log('[DB] 已初始化默认成就数据')
      }
    }

    // 初始化默认每日目标模板（仅当表为空时）
    {
      const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM t_daily_goal_template')
      if (rows[0].cnt === 0) {
        const defaults = [
          ['daily-xp', '获得50经验值', '今天内通过答题获得50点经验值', 'lightning', 'xp', 50, 30, 20, 1],
          ['daily-questions', '完成10道题目', '今天内完成10道数学题', 'goal', 'questions', 10, 40, 30, 2],
          ['daily-streak', '保持签到', '今日已经完成签到', 'fire', 'streak', 1, 20, 15, 3],
        ] as const
        for (const [id, title, desc, icon, type, target, rewardXp, rewardCoins, sort] of defaults) {
          await conn.query(
            'INSERT INTO t_daily_goal_template (id, title, description, icon, type, target, reward_xp, reward_coins, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, desc, icon, type, target, rewardXp, rewardCoins, sort]
          )
        }
        console.log('[DB] 已初始化默认每日目标模板')
      }
    }

    conn.release()
    readPool = testPool
    writePool = testPool
    useMemory = false
    console.log('[DB] MySQL 连接成功')
    return true
  } catch (err: any) {
    console.log('[DB] MySQL 不可用，降级到内存存储:', err?.code || err?.message || 'unknown')
    useMemory = true
    readPool = null
    writePool = null
    return false
  }
}

export function getReadPool(): mysql.Pool | null {
  return readPool
}

export function getWritePool(): mysql.Pool | null {
  return writePool
}

/** @deprecated 使用 getReadPool/getWritePool 代替，保留仅用于兼容 */
export function getPool(): mysql.Pool | null {
  return readPool
}

export function isMemoryMode(): boolean {
  return useMemory
}

export async function testConnection(): Promise<boolean> {
  if (useMemory) return true
  if (!readPool) return false
  try {
    const conn = await readPool.getConnection()
    conn.release()
    return true
  } catch {
    return false
  }
}

export default {
  get readPool() { return readPool },
  get writePool() { return writePool },
  get pool() { return readPool },
  get useMemory() { return useMemory },
  getPool,
  getReadPool,
  getWritePool,
  initDB,
  testConnection,
}
