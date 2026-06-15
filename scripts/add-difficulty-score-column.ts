/**
 * 给 t_question 表添加 difficulty_score 列
 */
import mysql from 'mysql2/promise'

async function main() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mathquest',
  })

  const conn = await pool.getConnection()
  try {
    // 检查列是否已存在
    const [cols] = await conn.query(`SHOW COLUMNS FROM t_question LIKE 'difficulty_score'`)
    if ((cols as any[]).length > 0) {
      console.log('difficulty_score 列已存在，无需添加')
      return
    }

    await conn.query(`ALTER TABLE t_question ADD COLUMN difficulty_score INT DEFAULT NULL AFTER difficulty`)
    console.log('✅ difficulty_score 列添加成功')
  } finally {
    conn.release()
    await pool.end()
  }
}
main().catch(console.error)