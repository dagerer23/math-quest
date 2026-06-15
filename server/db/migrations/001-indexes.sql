-- ============================================
-- MathQuest 数据库索引优化
-- 运行: mysql -u root -p math_quest < 001-indexes.sql
-- ============================================

-- 1. 用户表: 手机号唯一索引
ALTER TABLE t_user ADD UNIQUE INDEX idx_user_phone (phone);

-- 2. Token 表: token 查找索引
ALTER TABLE t_token ADD UNIQUE INDEX idx_token_token (token);
ALTER TABLE t_token ADD INDEX idx_token_user_id (user_id);

-- 3. 验证码表: 手机号主键已唯一，加过期时间索引方便清理
ALTER TABLE t_verification_code ADD INDEX idx_vc_expires (expires_at);

-- 4. 题目表: 关卡ID + 知识点查询索引
ALTER TABLE t_question ADD INDEX idx_q_level (level_id);
ALTER TABLE t_question ADD INDEX idx_q_kp (knowledge_point);

-- 5. 关卡表: 年级索引
ALTER TABLE t_level ADD INDEX idx_level_grade (grade);

-- 6. 测评表: 用户ID索引
ALTER TABLE t_assessment ADD INDEX idx_assessment_user (user_id);
ALTER TABLE t_assessment ADD INDEX idx_assessment_time (completed_at);
-- 答案明细表
ALTER TABLE t_assessment_answer ADD INDEX idx_aa_assessment (assessment_id);