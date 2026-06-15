/**
 * 数据库初始化脚本
 * 运行: npx tsx server/scripts/init-db.ts
 */
import mysql from 'mysql2/promise'

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  socketPath: process.env.DB_SOCKET || '/var/run/mysqld/mysqld.sock',
}

const DB_NAME = process.env.DB_NAME || 'mathquest'

async function initDatabase() {
  console.log('[初始化] 开始创建数据库...')

  // 先连接到 MySQL 服务器（不指定数据库）
  const connection = await mysql.createConnection(DB_CONFIG)

  try {
    // 创建数据库
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    console.log(`[初始化] 数据库 ${DB_NAME} 创建成功`)

    // 切换到该数据库
    await connection.query(`USE \`${DB_NAME}\``)

    // 创建用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS t_user (
        id VARCHAR(50) PRIMARY KEY COMMENT '用户ID',
        phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
        nickname VARCHAR(50) DEFAULT '小先锋' COMMENT '昵称',
        avatar VARCHAR(20) DEFAULT '🧒' COMMENT '头像',
        learning_stage ENUM('primary','middle','high','adult') DEFAULT 'primary' COMMENT '学习阶段',
        learning_goal ENUM('consolidation','improvement','interest','training') DEFAULT 'consolidation' COMMENT '学习目标',
        target_grade TINYINT DEFAULT 2 COMMENT '目标年级',
        created_at BIGINT NOT NULL COMMENT '创建时间戳',
        last_login_at BIGINT DEFAULT NULL COMMENT '最后登录时间戳',
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
    `)
    console.log('[初始化] 用户表 t_user 创建成功')

    // 创建验证码表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS t_verification_code (
        phone VARCHAR(20) PRIMARY KEY COMMENT '手机号',
        code VARCHAR(10) NOT NULL COMMENT '验证码',
        expires_at BIGINT NOT NULL COMMENT '过期时间戳',
        attempts TINYINT DEFAULT 0 COMMENT '尝试次数',
        created_at BIGINT NOT NULL COMMENT '创建时间戳'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='验证码表'
    `)
    console.log('[初始化] 验证码表 t_verification_code 创建成功')

    console.log('[初始化] 数据库初始化完成!')
  } catch (err) {
    console.error('[初始化] 初始化失败:', err)
    throw err
  } finally {
    await connection.end()
  }
}

initDatabase().catch(console.error)
