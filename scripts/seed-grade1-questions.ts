/**
 * 生成并导入200道小学一年级数学题
 * 用法: npx tsx scripts/seed-grade1-questions.ts
 */
import { upsertQuestion } from '../server/services/content'
import { initDB } from '../server/db'

// 一年级关卡ID
const LEVELS = {
  L1: 'g1-L1',   // 5以内加减法
  L2: 'g1-L2',   // 10以内加减法
  L3: 'g1-L3',   // 20以内加减法
  L4: 'g1-L4',   // 认识钟表与图形
  L5: 'g1-L5',   // 20以内综合
  BOSS: 'g1-L6_BOSS', // 综合应用
}

interface QuestionInput {
  levelId: string
  type: 'choice' | 'input'
  knowledgePoint: string
  difficulty: 1 | 2 | 3
  prompt: string
  answer: string | number
  explanation: string
  xp: number
  options?: string[]
  illustration?: string
  difficulty_score?: number
}

// ═══════════════════════════════════════════════════════════════
// 生成题目
// ═══════════════════════════════════════════════════════════════

function makeQuestions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const all = (items: QuestionInput[]) => qs.push(...items)

  // ──────────────── L1: 5以内加减法 (difficulty 1为主) ────────────────
  all([
    // 5以内加法 - 简单 (1)
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内加法', difficulty: 1, prompt: '1 + 2 = ?', answer: 3, explanation: '1 + 2 = 3', xp: 10, options: ['2', '3', '4', '5'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内加法', difficulty: 1, prompt: '2 + 2 = ?', answer: 4, explanation: '2 + 2 = 4', xp: 10 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内加法', difficulty: 1, prompt: '3 + 1 = ?', answer: 4, explanation: '3 + 1 = 4', xp: 10, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内加法', difficulty: 1, prompt: '0 + 4 = ?', answer: 4, explanation: '0 + 4 = 4', xp: 10 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内加法', difficulty: 1, prompt: '1 + 3 = ?', answer: 4, explanation: '1 + 3 = 4', xp: 10, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内加法', difficulty: 1, prompt: '2 + 1 = ?', answer: 3, explanation: '2 + 1 = 3', xp: 10 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内加法', difficulty: 1, prompt: '0 + 5 = ?', answer: 5, explanation: '0 + 5 = 5', xp: 10, options: ['4', '5', '6', '7'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内加法', difficulty: 1, prompt: '4 + 1 = ?', answer: 5, explanation: '4 + 1 = 5', xp: 10 },

    // 5以内减法 - 简单 (1)
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内减法', difficulty: 1, prompt: '5 - 2 = ?', answer: 3, explanation: '5 - 2 = 3', xp: 10, options: ['2', '3', '4', '5'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内减法', difficulty: 1, prompt: '4 - 3 = ?', answer: 1, explanation: '4 - 3 = 1', xp: 10 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内减法', difficulty: 1, prompt: '3 - 1 = ?', answer: 2, explanation: '3 - 1 = 2', xp: 10, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内减法', difficulty: 1, prompt: '5 - 5 = ?', answer: 0, explanation: '5 - 5 = 0', xp: 10 },

    // 比大小 - 简单 (1)
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '比较大小', difficulty: 1, prompt: '3 和 4 哪个大？', answer: 4, explanation: '4 > 3', xp: 10, options: ['3', '4', '一样大', '不确定'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '比较大小', difficulty: 1, prompt: '比 2 大 1 的数是？', answer: 3, explanation: '2 + 1 = 3', xp: 10 },

    // 认识数字 - 简单 (1)
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '认识数字', difficulty: 1, prompt: '★★★ 表示数字几？', answer: 3, explanation: '三颗星表示数字 3', xp: 10, options: ['1', '2', '3', '4'], illustration: '⭐' },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '认识数字', difficulty: 1, prompt: '数一数：🍎 🍎 🍎 🍎 🍎 有几个苹果？', answer: 5, explanation: '5个苹果', xp: 10 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '认识数字', difficulty: 1, prompt: '下面哪个代表数字 2？', answer: '●●', explanation: '●● 表示 2', xp: 10, options: ['●', '●●', '●●●', '●●●●'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '认识数字', difficulty: 1, prompt: '★ ★ ★ ★ 表示数字几？', answer: 4, explanation: '4颗星', xp: 10 },

    // 凑十法 - 中等 (2)
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内加法', difficulty: 2, prompt: '2 + ( ) = 5', answer: 3, explanation: '5 - 2 = 3，所以填 3', xp: 15, options: ['2', '3', '4', '5'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内减法', difficulty: 2, prompt: '( ) - 2 = 2', answer: 4, explanation: '2 + 2 = 4', xp: 15 },

    // 应用题 - 中等 (2)
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内应用', difficulty: 2, prompt: '小明有 2 支铅笔，小红有 3 支铅笔，一共几支？', answer: 5, explanation: '2 + 3 = 5', xp: 15, options: ['4', '5', '6', '7'], illustration: '✏️' },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内应用', difficulty: 2, prompt: '树上有 5 只小鸟，飞走了 2 只，还剩几只？', answer: 3, explanation: '5 - 2 = 3', xp: 15 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内应用', difficulty: 2, prompt: '盒子里有 3 个球，又放进去 1 个，现在有几个？', answer: 4, explanation: '3 + 1 = 4', xp: 15, options: ['3', '4', '5', '2'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内应用', difficulty: 2, prompt: '小华吃了 4 颗糖，还剩 1 颗，原来有几颗？', answer: 5, explanation: '4 + 1 = 5', xp: 15 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内应用', difficulty: 2, prompt: '鱼缸里有 5 条鱼，捞走 3 条，还剩几条？', answer: 2, explanation: '5 - 3 = 2', xp: 15, options: ['1', '2', '3', '4'], illustration: '🐟' },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内应用', difficulty: 2, prompt: '玲玲折了 2 只纸鹤，妈妈又帮她折了 2 只，一共几只？', answer: 4, explanation: '2 + 2 = 4', xp: 15 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内应用', difficulty: 2, prompt: '停车场有 4 辆车，开走 1 辆，还剩几辆？', answer: 3, explanation: '4 - 1 = 3', xp: 15, options: ['2', '3', '4', '5'], illustration: '🚗' },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内应用', difficulty: 2, prompt: '妈妈买了 3 个苹果，爸爸买了 2 个苹果，一共买了几个？', answer: 5, explanation: '3 + 2 = 5', xp: 15 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内应用', difficulty: 2, prompt: '有 5 个小朋友在玩，走了 2 个，还剩几个？', answer: 3, explanation: '5 - 2 = 3', xp: 15, options: ['2', '3', '4', '5'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内应用', difficulty: 2, prompt: '你有 1 张卡片，朋友送你 3 张，现在有几张？', answer: 4, explanation: '1 + 3 = 4', xp: 15 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内应用', difficulty: 2, prompt: '篮子里有 4 个鸡蛋，打了 1 个，还剩几个？', answer: 3, explanation: '4 - 1 = 3', xp: 15, options: ['2', '3', '4', '5'], illustration: '🥚' },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内应用', difficulty: 2, prompt: '池塘里有 2 只鸭子，又来了 3 只，现在一共几只？', answer: 5, explanation: '2 + 3 = 5', xp: 15 },
  ])

  // ──────────────── L2: 10以内加减法 (difficulty 1-2) ────────────────
  all([
    // 10以内加法 - 简单 (1)
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内加法', difficulty: 1, prompt: '5 + 3 = ?', answer: 8, explanation: '5 + 3 = 8', xp: 10, options: ['7', '8', '9', '10'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加法', difficulty: 1, prompt: '4 + 5 = ?', answer: 9, explanation: '4 + 5 = 9', xp: 10 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内加法', difficulty: 1, prompt: '6 + 2 = ?', answer: 8, explanation: '6 + 2 = 8', xp: 10, options: ['7', '8', '9', '10'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加法', difficulty: 1, prompt: '3 + 6 = ?', answer: 9, explanation: '3 + 6 = 9', xp: 10 },

    // 10以内减法 - 中等 (2)
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内减法', difficulty: 2, prompt: '9 - 5 = ?', answer: 4, explanation: '9 - 5 = 4', xp: 10, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内减法', difficulty: 2, prompt: '7 - 3 = ?', answer: 4, explanation: '7 - 3 = 4', xp: 10 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内减法', difficulty: 2, prompt: '8 - 6 = ?', answer: 2, explanation: '8 - 6 = 2', xp: 10, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内减法', difficulty: 2, prompt: '10 - 3 = ?', answer: 7, explanation: '10 - 3 = 7', xp: 10 },

    // 10以内连加连减 - 中等 (2)
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内连加', difficulty: 2, prompt: '3 + 2 + 4 = ?', answer: 9, explanation: '3 + 2 = 5，5 + 4 = 9', xp: 15, options: ['7', '8', '9', '10'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内连加', difficulty: 2, prompt: '1 + 4 + 3 = ?', answer: 8, explanation: '1 + 4 = 5，5 + 3 = 8', xp: 15 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内连减', difficulty: 2, prompt: '9 - 2 - 3 = ?', answer: 4, explanation: '9 - 2 = 7，7 - 3 = 4', xp: 15, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内连减', difficulty: 2, prompt: '8 - 3 - 4 = ?', answer: 1, explanation: '8 - 3 = 5，5 - 4 = 1', xp: 15 },

    // 10以内加减混合
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内加减混合', difficulty: 2, prompt: '4 + 5 - 3 = ?', answer: 6, explanation: '4 + 5 = 9，9 - 3 = 6', xp: 15, options: ['5', '6', '7', '8'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加减混合', difficulty: 2, prompt: '7 - 4 + 5 = ?', answer: 8, explanation: '7 - 4 = 3，3 + 5 = 8', xp: 15 },

    // 10以内应用题
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内应用', difficulty: 2, prompt: '书架上有 7 本书，又放了 3 本，现在一共有几本？', answer: 10, explanation: '7 + 3 = 10', xp: 15, options: ['8', '9', '10', '11'], illustration: '📚' },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内应用', difficulty: 2, prompt: '花坛里有 8 朵花，摘了 4 朵，还剩几朵？', answer: 4, explanation: '8 - 4 = 4', xp: 15 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内应用', difficulty: 2, prompt: '一盒笔有 6 支，又买来 4 支，一共有几支？', answer: 10, explanation: '6 + 4 = 10', xp: 15, options: ['8', '9', '10', '12'], illustration: '🖊️' },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内应用', difficulty: 2, prompt: '小明有 10 元钱，买文具用了 5 元，还剩多少元？', answer: 5, explanation: '10 - 5 = 5', xp: 15 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内应用', difficulty: 2, prompt: '动物园里有 3 只猴子，又来了 4 只，现在有几只？', answer: 7, explanation: '3 + 4 = 7', xp: 15, options: ['6', '7', '8', '9'], illustration: '🐒' },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内应用', difficulty: 2, prompt: '盘子里有 10 个饺子，吃了 6 个，还剩几个？', answer: 4, explanation: '10 - 6 = 4', xp: 15 },

    // 认识序数
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '认识序数', difficulty: 1, prompt: '排队时从前往后数小明排第 3，他前面有几人？', answer: 2, explanation: '第3名前面有2人', xp: 10, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '认识序数', difficulty: 1, prompt: '从 1 开始数，第 5 个数是几？', answer: 5, explanation: '1,2,3,4,5 — 第5个是5', xp: 10 },

    // 10以内大小比较
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '比较大小', difficulty: 2, prompt: '7 和 9 哪个更接近 10？', answer: 9, explanation: '9 离 10 差 1，7 离 10 差 3', xp: 15, options: ['7', '9', '一样近', '不确定'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '比较大小', difficulty: 2, prompt: '在 3, 6, 8 中最大的是几？', answer: 8, explanation: '8 > 6 > 3', xp: 15 },

    // 10以内填空
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内加减', difficulty: 2, prompt: '6 + ( ) = 10', answer: 4, explanation: '10 - 6 = 4', xp: 15, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加减', difficulty: 2, prompt: '( ) - 3 = 5', answer: 8, explanation: '5 + 3 = 8', xp: 15 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内加减', difficulty: 2, prompt: '10 - ( ) = 6', answer: 4, explanation: '10 - 6 = 4', xp: 15, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加减', difficulty: 2, prompt: '( ) + 2 = 9', answer: 7, explanation: '9 - 2 = 7', xp: 15 },
  ])

  // ──────────────── L3: 20以内加减法 (difficulty 2-3) ────────────────
  all([
    // 20以内不进位加法 - 中等 (2)
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内不进位加法', difficulty: 2, prompt: '11 + 6 = ?', answer: 17, explanation: '11 + 6 = 17', xp: 10, options: ['15', '16', '17', '18'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内不进位加法', difficulty: 2, prompt: '12 + 4 = ?', answer: 16, explanation: '12 + 4 = 16', xp: 10 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内不进位加法', difficulty: 2, prompt: '15 + 3 = ?', answer: 18, explanation: '15 + 3 = 18', xp: 10, options: ['16', '17', '18', '19'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内不进位加法', difficulty: 2, prompt: '14 + 5 = ?', answer: 19, explanation: '14 + 5 = 19', xp: 10 },

    // 20以内不退位减法 - 中等 (2)
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内不退位减法', difficulty: 2, prompt: '17 - 5 = ?', answer: 12, explanation: '17 - 5 = 12', xp: 10, options: ['11', '12', '13', '14'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内不退位减法', difficulty: 2, prompt: '19 - 7 = ?', answer: 12, explanation: '19 - 7 = 12', xp: 10 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内不退位减法', difficulty: 2, prompt: '16 - 4 = ?', answer: 12, explanation: '16 - 4 = 12', xp: 10, options: ['11', '12', '13', '14'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内不退位减法', difficulty: 2, prompt: '18 - 6 = ?', answer: 12, explanation: '18 - 6 = 12', xp: 10 },

    // 20以内进位加法 - 困难 (3)
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内进位加法', difficulty: 3, prompt: '8 + 5 = ?', answer: 13, explanation: '凑十法：8 + 2 = 10，10 + 3 = 13', xp: 15, options: ['11', '12', '13', '14'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内进位加法', difficulty: 3, prompt: '7 + 6 = ?', answer: 13, explanation: '凑十法：7 + 3 = 10，10 + 3 = 13', xp: 15 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内进位加法', difficulty: 3, prompt: '9 + 6 = ?', answer: 15, explanation: '凑十法：9 + 1 = 10，10 + 5 = 15', xp: 15, options: ['14', '15', '16', '17'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内进位加法', difficulty: 3, prompt: '5 + 8 = ?', answer: 13, explanation: '凑十法：8 + 2 = 10，10 + 3 = 13', xp: 15 },

    // 20以内退位减法 - 困难 (3)
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内退位减法', difficulty: 3, prompt: '13 - 6 = ?', answer: 7, explanation: '13 - 6 = 7', xp: 15, options: ['6', '7', '8', '9'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内退位减法', difficulty: 3, prompt: '15 - 8 = ?', answer: 7, explanation: '15 - 8 = 7', xp: 15 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内退位减法', difficulty: 3, prompt: '12 - 9 = ?', answer: 3, explanation: '12 - 9 = 3', xp: 15, options: ['2', '3', '4', '5'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内退位减法', difficulty: 3, prompt: '14 - 7 = ?', answer: 7, explanation: '14 - 7 = 7', xp: 15 },

    // 20以内混合运算
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内加减混合', difficulty: 3, prompt: '8 + 6 - 3 = ?', answer: 11, explanation: '8 + 6 = 14，14 - 3 = 11', xp: 15, options: ['10', '11', '12', '13'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内加减混合', difficulty: 3, prompt: '12 - 5 + 7 = ?', answer: 14, explanation: '12 - 5 = 7，7 + 7 = 14', xp: 15 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内加减混合', difficulty: 3, prompt: '9 + 7 - 4 = ?', answer: 12, explanation: '9 + 7 = 16，16 - 4 = 12', xp: 15, options: ['11', '12', '13', '14'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内加减混合', difficulty: 3, prompt: '15 - 9 + 6 = ?', answer: 12, explanation: '15 - 9 = 6，6 + 6 = 12', xp: 15 },

    // 20以内应用题
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内应用', difficulty: 3, prompt: '一年级有 8 个男生和 9 个女生，一共多少人？', answer: 17, explanation: '8 + 9 = 17', xp: 15, options: ['15', '16', '17', '18'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内应用', difficulty: 3, prompt: '小芳有 16 张贴纸，送给同学 7 张，还剩几张？', answer: 9, explanation: '16 - 7 = 9', xp: 15 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内应用', difficulty: 3, prompt: '操场上有 7 人在跑步，又来了 5 人，现在有多少人？', answer: 12, explanation: '7 + 5 = 12', xp: 15, options: ['11', '12', '13', '14'], illustration: '🏃' },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内应用', difficulty: 3, prompt: '公共汽车上有 18 人，到站下了 9 人，车上还剩几人？', answer: 9, explanation: '18 - 9 = 9', xp: 15 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内应用', difficulty: 3, prompt: '水果店上午卖出 9 个西瓜，下午卖出 8 个，一天卖出几个？', answer: 17, explanation: '9 + 8 = 17', xp: 15, options: ['15', '16', '17', '18'], illustration: '🍉' },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内应用', difficulty: 3, prompt: '小红有 20 元，买了一本书花 8 元，再买一支笔花 3 元，还剩多少？', answer: 9, explanation: '20 - 8 - 3 = 9', xp: 20 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内应用', difficulty: 3, prompt: '从 1 数到 20，数字 1 出现几次？', answer: 3, explanation: '1, 10, 11~19中十位都是1，共3次在个位/十位', xp: 20, options: ['2', '3', '4', '5'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内应用', difficulty: 3, prompt: '比 15 少 7 的数是？', answer: 8, explanation: '15 - 7 = 8', xp: 15 },
  ])

  // ──────────────── L4: 认识钟表与图形 (difficulty 2-3) ────────────────
  all([
    // 认识钟表 - 中等 (2)
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识钟表', difficulty: 2, prompt: '分针指着 12，时针指着 7，是几时？', answer: '7时', explanation: '时针指向7，分针指向12，就是7时', xp: 10, options: ['6时', '7时', '8时', '12时'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识钟表', difficulty: 2, prompt: '分针指着 12，时针指着 10，是几时？', answer: '10时', explanation: '10时整', xp: 10 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识钟表', difficulty: 2, prompt: '分针指着 6，时针在 1 和 2 之间，是几时半？', answer: '1时半', explanation: '1:30 即 1时半', xp: 15, options: ['1时', '1时半', '2时', '2时半'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识钟表', difficulty: 2, prompt: '现在是 8 时，再过 2 小时是几时？', answer: '10时', explanation: '8 + 2 = 10', xp: 15 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识钟表', difficulty: 2, prompt: '时针指向 12，分针指向 12，是几时？', answer: '12时', explanation: '12时整', xp: 10, options: ['0时', '6时', '12时', '24时'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识钟表', difficulty: 2, prompt: '一节课 40 分钟，课间休息 10 分钟，一共是多少分钟？', answer: 50, explanation: '40 + 10 = 50', xp: 15 },

    // 认识图形 - 中等 (2)
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识图形', difficulty: 2, prompt: '黑板的面是什么形状？', answer: '长方形', explanation: '黑板是长方形', xp: 10, options: ['正方形', '长方形', '圆形', '三角形'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识图形', difficulty: 2, prompt: '一个正方形有 ? 条边', answer: 4, explanation: '正方形有4条相等的边', xp: 10 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识图形', difficulty: 2, prompt: '一个三角形有几条边？', answer: 3, explanation: '三角形有3条边', xp: 10, options: ['2', '3', '4', '5'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识图形', difficulty: 2, prompt: '一个长方形有 ? 个角', answer: 4, explanation: '长方形有4个直角', xp: 10 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识图形', difficulty: 2, prompt: '足球是什么形状？', answer: '球体', explanation: '足球是球体', xp: 10, options: ['圆形', '球体', '圆柱', '正方体'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识图形', difficulty: 2, prompt: '长方体有 ? 个面', answer: 6, explanation: '长方体有6个面', xp: 15 },

    // 认识人民币
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识人民币', difficulty: 2, prompt: '1 元 = ? 角', answer: 10, explanation: '1元 = 10角', xp: 10, options: ['5', '10', '20', '100'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识人民币', difficulty: 2, prompt: '1 张 10 元可以换几张 5 元？', answer: 2, explanation: '10元 = 2张5元', xp: 10 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识人民币', difficulty: 2, prompt: '一瓶水 2 元，妈妈给了 5 元，应找回几元？', answer: 3, explanation: '5 - 2 = 3', xp: 15, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识人民币', difficulty: 2, prompt: '一支铅笔 1 元，一个橡皮 2 元，一共需要几元？', answer: 3, explanation: '1 + 2 = 3', xp: 15 },

    // 位置与方向
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '位置与方向', difficulty: 2, prompt: '你面朝东，你的后面是？', answer: '西', explanation: '面东背西', xp: 10, options: ['东', '南', '西', '北'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '位置与方向', difficulty: 2, prompt: '太阳从哪边升起？', answer: '东', explanation: '太阳从东方升起', xp: 10 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '位置与方向', difficulty: 2, prompt: '小明在小红的左边，小红在小明的？', answer: '右边', explanation: '左右是相对的', xp: 15, options: ['左边', '右边', '前面', '后面'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '位置与方向', difficulty: 2, prompt: '上下楼梯要靠哪边走？', answer: '右', explanation: '上下楼梯靠右行', xp: 10 },

    // 找规律
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '找规律', difficulty: 3, prompt: '按规律：1, 3, 5, 7, __', answer: 9, explanation: '每次加2', xp: 15, options: ['8', '9', '10', '11'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '找规律', difficulty: 3, prompt: '按规律：2, 4, 6, __, 10', answer: 8, explanation: '每次加2', xp: 15 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '找规律', difficulty: 3, prompt: '按规律：10, 8, 6, __, 2', answer: 4, explanation: '每次减2', xp: 15, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '找规律', difficulty: 3, prompt: '按规律：1, 4, 7, 10, __', answer: 13, explanation: '每次加3', xp: 15 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '找规律', difficulty: 3, prompt: '⭕❌⭕❌⭕__ 下一个是？', answer: '❌', explanation: '⭕❌交替', xp: 15, options: ['⭕', '❌', '⭐', '❤️'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '找规律', difficulty: 3, prompt: '5, 10, 15, __, 25', answer: 20, explanation: '每次加5', xp: 15 },

    // 分类与整理
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '分类与整理', difficulty: 2, prompt: '🍎🍌🍎🍌🍎 — 香蕉有几个？', answer: 2, explanation: '🍌出现2次', xp: 10, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '分类与整理', difficulty: 2, prompt: '红红蓝蓝红红蓝 — 红色有几个？', answer: 3, explanation: '红出现3次', xp: 10 },
  ])

  // ──────────────── L5: 20以内综合 (difficulty 2-3) ────────────────
  all([
    // 20以内综合
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '13 + 5 - 7 = ?', answer: 11, explanation: '13 + 5 = 18，18 - 7 = 11', xp: 15, options: ['10', '11', '12', '13'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '16 - 8 + 6 = ?', answer: 14, explanation: '16 - 8 = 8，8 + 6 = 14', xp: 15 },
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '小明有 11 颗糖，吃了 3 颗，又买了 6 颗，现在有几颗？', answer: 14, explanation: '11 - 3 + 6 = 14', xp: 20, options: ['13', '14', '15', '16'], illustration: '🍬' },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '一个数加 8 等于 17，这个数是几？', answer: 9, explanation: '17 - 8 = 9', xp: 20 },
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '比 18 少 9 的数比 5 多几？', answer: 4, explanation: '18 - 9 = 9，9 - 5 = 4', xp: 20, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '草地上有 7 只白兔，5 只灰兔，白兔比灰兔多几只？', answer: 2, explanation: '7 - 5 = 2', xp: 20 },

    // 20以内排队问题
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '小军排第 5，小华排第 12，他们之间隔了几个人？', answer: 6, explanation: '12 - 5 - 1 = 6', xp: 20, options: ['5', '6', '7', '8'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '排队时从前往后数小红排第 8，从后往前数排第 4，一共多少人？', answer: 11, explanation: '8 + 4 - 1 = 11', xp: 25 },

    // 20以内数的大小比较
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '在 6, 13, 19, 8 中，比 10 小的数有几个？', answer: 2, explanation: '6和8比10小', xp: 15, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '小于 20 大于 15 的数有几个？', answer: 4, explanation: '16, 17, 18, 19 共4个', xp: 15 },

    // 20以内加法交换律
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '6 + 7 = 7 + ( )', answer: 6, explanation: '加法交换律：6 + 7 = 7 + 6', xp: 15, options: ['5', '6', '7', '8'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '9 + 5 = 5 + 9，这个等式对吗？填对或错', answer: '对', explanation: '加法交换律，对', xp: 15 },

    // 图表统计
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '统计：苹果5个，梨3个，橘子4个，哪种水果最多？', answer: '苹果', explanation: '5 > 4 > 3', xp: 15, options: ['苹果', '梨', '橘子', '一样多'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '小明做了8道题，小红做了12道题，小红比小明多做几道？', answer: 4, explanation: '12 - 8 = 4', xp: 20 },

    // 20以内综合应用
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '妈妈买了 15 个鸡蛋，用了 7 个，又买了 4 个，现在有几个？', answer: 12, explanation: '15 - 7 + 4 = 12', xp: 20, options: ['11', '12', '13', '14'], illustration: '🥚' },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '姐姐有 14 张贴纸，给妹妹 6 张，两人一样多，妹妹原来有几张？', answer: 2, explanation: '14 - 6 = 8，8 - 6 = 2', xp: 25 },
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '最大的一位数和最小的两位数相加是多少？', answer: 19, explanation: '9 + 10 = 19', xp: 20, options: ['17', '18', '19', '20'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '一个两位数，十位是1，个位比十位大3，这个数是几？', answer: 14, explanation: '十位1，个位1+3=4，所以是14', xp: 20 },
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '停车场有 17 辆车，开走一些后剩 9 辆，开走了几辆？', answer: 8, explanation: '17 - 9 = 8', xp: 20, options: ['7', '8', '9', '10'], illustration: '🚗' },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '用 3, 5, 8 组成最大的两位数是多少？', answer: 85, explanation: '高位用最大的数，85', xp: 20 },
  ])

  // ──────────────── BOSS: 综合应用 (difficulty 3为主) ────────────────
  all([
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '8 + 7 - 5 = ?', answer: 10, explanation: '8 + 7 = 15，15 - 5 = 10', xp: 20, options: ['9', '10', '11', '12'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '19 - 8 + 3 = ?', answer: 14, explanation: '19 - 8 = 11，11 + 3 = 14', xp: 20 },
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '小华有 12 本故事书，小丽比小华多 5 本，两人一共有多少本？', answer: 29, explanation: '小丽：12 + 5 = 17，一共：12 + 17 = 29', xp: 20, options: ['27', '28', '29', '30'], illustration: '📚' },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '从 20 里连续减去 3，减 5 次后还剩多少？', answer: 5, explanation: '20 - 3 × 5 = 20 - 15 = 5', xp: 20 },
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一张桌子配 4 把椅子，3 张桌子配几把椅子？', answer: 12, explanation: '4 × 3 = 12', xp: 20, options: ['10', '11', '12', '14'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '教室里有 6 排桌子，每排 3 张，一共有多少张桌子？', answer: 18, explanation: '6 × 3 = 18', xp: 20 },

    // 综合应用题
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '小明有 20 元钱，买文具盒花了 8 元，买铅笔花了 3 元，还剩多少？', answer: 9, explanation: '20 - 8 - 3 = 9', xp: 20, options: ['8', '9', '10', '11'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一箱苹果 20 个，吃了 5 个，又买了 8 个，现在有多少个？', answer: 23, explanation: '20 - 5 + 8 = 23', xp: 20 },
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '32 + 15 = ?', answer: 47, explanation: '32 + 15 = 47', xp: 20, options: ['45', '46', '47', '48'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '56 - 23 = ?', answer: 33, explanation: '56 - 23 = 33', xp: 20 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '两数之和是 18，其中一个数是 7，另一个数是？', answer: 11, explanation: '18 - 7 = 11', xp: 20, options: ['10', '11', '12', '13'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '两数之差是 5，大数是 14，小数是多少？', answer: 9, explanation: '14 - 5 = 9', xp: 20 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '用 4 根小棒可以摆一个正方形，摆 3 个需要多少根？', answer: 12, explanation: '4 × 3 = 12', xp: 20, options: ['10', '11', '12', '13'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '每只小鸡有 2 条腿，8 只小鸡有多少条腿？', answer: 16, explanation: '2 × 8 = 16', xp: 20 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '妈妈今年 30 岁，小明今年 6 岁，妈妈比小明大几岁？', answer: 24, explanation: '30 - 6 = 24', xp: 20, options: ['22', '23', '24', '25'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '树上有 16 只鸟，飞走一半，还剩几只？', answer: 8, explanation: '16 ÷ 2 = 8', xp: 20 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一盒巧克力有 10 块，3 盒巧克力有多少块？', answer: 30, explanation: '10 × 3 = 30', xp: 20, options: ['20', '25', '30', '35'], illustration: '🍫' },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '把 18 个苹果平均分给 3 个小朋友，每人分几个？', answer: 6, explanation: '18 ÷ 3 = 6', xp: 25 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一本故事书每天看 4 页，5 天可以看多少页？', answer: 20, explanation: '4 × 5 = 20', xp: 20, options: ['16', '18', '20', '24'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一根绳子剪成 5 段，每段 3 米，原来绳子长多少米？', answer: 15, explanation: '5 × 3 = 15', xp: 25 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '45 + 27 = ?', answer: 72, explanation: '45 + 27 = 72', xp: 25, options: ['70', '71', '72', '73'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '83 - 46 = ?', answer: 37, explanation: '83 - 46 = 37', xp: 25 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一个加数是 38，另一个加数是 29，和是多少？', answer: 67, explanation: '38 + 29 = 67', xp: 20, options: ['65', '66', '67', '68'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '被减数是 71，差是 38，减数是多少？', answer: 33, explanation: '71 - 38 = 33', xp: 25 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '100 - 35 - 28 = ?', answer: 37, explanation: '100 - 35 = 65，65 - 28 = 37', xp: 25, options: ['35', '37', '39', '41'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '小明有 50 元，买书包花 38 元，买铅笔花 5 元，一共花多少元？', answer: 43, explanation: '38 + 5 = 43', xp: 25 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一班有 28 人，二班比一班多 5 人，两个班一共多少人？', answer: 61, explanation: '二班：28 + 5 = 33，一共：28 + 33 = 61', xp: 25, options: ['58', '60', '61', '63'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '图书馆借出 24 本书后还剩 46 本，原来有多少本？', answer: 70, explanation: '24 + 46 = 70', xp: 20 },

    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '每行种 8 棵树，种 6 行，一共种多少棵？', answer: 48, explanation: '8 × 6 = 48', xp: 25, options: ['42', '46', '48', '52'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一个月有 30 天，4 个星期零几天？', answer: 2, explanation: '4 × 7 = 28，30 - 28 = 2', xp: 30 },

    // ──────────────── 补充题目（确保200道）────────────────
    // 5以内补充 - 简单 (1)
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内加法', difficulty: 1, prompt: '3 + 2 = ?', answer: 5, explanation: '3 + 2 = 5', xp: 10 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内减法', difficulty: 1, prompt: '4 - 2 = ?', answer: 2, explanation: '4 - 2 = 2', xp: 10, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内减法', difficulty: 1, prompt: '目标：篮子里有5个鸡蛋，拿出来3个，还剩几个？', answer: 2, explanation: '5 - 3 = 2', xp: 15 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '比较大小', difficulty: 1, prompt: '5和2哪个小？', answer: 2, explanation: '2 < 5', xp: 10, options: ['2', '5', '一样', '不确定'] },

    // 10以内补充 - 中等 (2)
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加法', difficulty: 2, prompt: '妈妈买了5个梨，爸爸又买了4个，一共买了几个？', answer: 9, explanation: '5 + 4 = 9', xp: 15 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内减法', difficulty: 2, prompt: '教室里有10个同学，下课走了3人，还剩几人？', answer: 7, explanation: '10 - 3 = 7', xp: 15, options: ['6', '7', '8', '9'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加减混合', difficulty: 2, prompt: '弟弟有3颗糖，哥哥给了5颗，弟弟吃了2颗，还剩几颗？', answer: 6, explanation: '3 + 5 = 8，8 - 2 = 6', xp: 20 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '比较大小', difficulty: 2, prompt: '在 2, 5, 9, 1 中，从小到大排第三个是几？', answer: 5, explanation: '排序：1, 2, 5, 9，第三个是5', xp: 15, options: ['2', '5', '9', '1'] },

    // 20以内补充
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内进位加法', difficulty: 3, prompt: '4 + 9 = ?', answer: 13, explanation: '凑十法：4 + 6 = 10，10 + 3 = 13', xp: 15, options: ['12', '13', '14', '15'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内退位减法', difficulty: 3, prompt: '16 - 9 = ?', answer: 7, explanation: '16 - 9 = 7', xp: 15 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内应用', difficulty: 3, prompt: '有12个气球，飞走5个，又买来4个，现在有几个？', answer: 11, explanation: '12 - 5 + 4 = 11', xp: 20, options: ['10', '11', '12', '13'], illustration: '🎈' },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内应用', difficulty: 3, prompt: '小明看一本书，第一天看了8页，第二天看了7页，两天一共看了多少页？', answer: 15, explanation: '8 + 7 = 15', xp: 15 },

    // 认识钟表补充
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识钟表', difficulty: 2, prompt: '下午2时上课，一节课40分钟，下课时间是？', answer: '2:40', explanation: '2时 + 40分 = 2时40分', xp: 15, options: ['2:30', '2:40', '3:00', '3:40'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识钟表', difficulty: 2, prompt: '电影从7:00开始，8:30结束，放映了多久？', answer: '1小时30分', explanation: '8:30 - 7:00 = 1时30分', xp: 15 },
    { levelId: LEVELS.L4, type: 'choice', knowledgePoint: '认识图形', difficulty: 2, prompt: '魔方的每个面是什么形状？', answer: '正方形', explanation: '魔方的每个面都是正方形', xp: 10, options: ['圆形', '正方形', '三角形', '长方形'] },
    { levelId: LEVELS.L4, type: 'input', knowledgePoint: '认识图形', difficulty: 2, prompt: '七巧板中最多的是哪种图形？', answer: '三角形', explanation: '七巧板中有5个三角形', xp: 15 },

    // 综合补充
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '红花8朵，黄花比红花多5朵，黄花有几朵？', answer: 13, explanation: '8 + 5 = 13', xp: 20, options: ['11', '12', '13', '14'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '一根绳子长18米，剪去9米，还剩多少米？', answer: 9, explanation: '18 - 9 = 9', xp: 15 },
    { levelId: LEVELS.L5, type: 'choice', knowledgePoint: '20以内综合', difficulty: 3, prompt: '鸡有7只，鸭比鸡少3只，鸭有几只？', answer: 4, explanation: '7 - 3 = 4', xp: 15, options: ['3', '4', '5', '6'] },
    { levelId: LEVELS.L5, type: 'input', knowledgePoint: '20以内综合', difficulty: 3, prompt: '一班和二班一共15人，一班有8人，二班有几人？', answer: 7, explanation: '15 - 8 = 7', xp: 20 },

    // BOSS补充
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '40 + 35 = ?', answer: 75, explanation: '40 + 35 = 75', xp: 20, options: ['70', '75', '80', '85'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '90 - 45 = ?', answer: 45, explanation: '90 - 45 = 45', xp: 20 },
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '小明做了15道口算题，小红比小明多做6道，小红做了几道？', answer: 21, explanation: '15 + 6 = 21', xp: 20, options: ['19', '20', '21', '22'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '一根绳子对折一次后长 9 米，原来绳子长多少米？', answer: 18, explanation: '9 × 2 = 18', xp: 25 },
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '合唱队有男生 14 人，女生 16 人，合唱队共有多少人？', answer: 30, explanation: '14 + 16 = 30', xp: 20, options: ['28', '29', '30', '32'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '夏令营有 42 人，每 6 人一组，可以分几组？', answer: 7, explanation: '42 ÷ 6 = 7', xp: 25 },
    { levelId: LEVELS.BOSS, type: 'choice', knowledgePoint: '一年级综合', difficulty: 3, prompt: '铅笔 2 元一支，本子 3 元一本，买 2 支铅笔和 1 本本子一共多少元？', answer: 7, explanation: '2 × 2 + 3 = 7', xp: 25, options: ['6', '7', '8', '9'] },
    { levelId: LEVELS.BOSS, type: 'input', knowledgePoint: '一年级综合', difficulty: 3, prompt: '丽丽做口算，5 分钟做了 30 道，平均每分钟做几道？', answer: 6, explanation: '30 ÷ 5 = 6', xp: 20 },

    // 再补6道简单题
    { levelId: LEVELS.L1, type: 'input', knowledgePoint: '5以内加法', difficulty: 1, prompt: '1 + 4 = ?', answer: 5, explanation: '1 + 4 = 5', xp: 10 },
    { levelId: LEVELS.L1, type: 'choice', knowledgePoint: '5以内减法', difficulty: 1, prompt: '2 - 1 = ?', answer: 1, explanation: '2 - 1 = 1', xp: 10, options: ['0', '1', '2', '3'] },
    { levelId: LEVELS.L2, type: 'input', knowledgePoint: '10以内加法', difficulty: 1, prompt: '2 + 7 = ?', answer: 9, explanation: '2 + 7 = 9', xp: 10 },
    { levelId: LEVELS.L2, type: 'choice', knowledgePoint: '10以内减法', difficulty: 1, prompt: '6 - 4 = ?', answer: 2, explanation: '6 - 4 = 2', xp: 10, options: ['1', '2', '3', '4'] },
    { levelId: LEVELS.L3, type: 'input', knowledgePoint: '20以内不进位加法', difficulty: 2, prompt: '13 + 5 = ?', answer: 18, explanation: '13 + 5 = 18', xp: 10 },
    { levelId: LEVELS.L3, type: 'choice', knowledgePoint: '20以内不退位减法', difficulty: 2, prompt: '18 - 3 = ?', answer: 15, explanation: '18 - 3 = 15', xp: 10, options: ['14', '15', '16', '17'] },
  ])

  return qs
}

// ═══════════════════════════════════════════════════════════════
// 主函数：导入题目
// ═══════════════════════════════════════════════════════════════

async function main() {
  // 初始化数据库连接
  const dbReady = await initDB()
  if (!dbReady) {
    console.error('❌ 数据库连接失败，请确保 MySQL 已启动')
    process.exit(1)
  }
  console.log('✅ 数据库连接成功\n')

  const questions = makeQuestions()
  // 去重（按 levelId + prompt）
  const seen = new Set<string>()
  const unique = questions.filter(q => {
    const key = `${q.levelId}::${q.prompt}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`准备导入 ${unique.length} 道题目（去重后）...`)

  let success = 0
  let fail = 0

  for (let i = 0; i < unique.length; i++) {
    const q = unique[i]
    try {
      const result = await upsertQuestion({
        levelId: q.levelId,
        type: q.type,
        knowledgePoint: q.knowledgePoint,
        difficulty: q.difficulty,
        prompt: q.prompt,
        answer: q.answer,
        explanation: q.explanation,
        xp: q.xp,
        options: q.options,
        illustration: q.illustration,
        difficulty_score: q.difficulty_score,
      })
      success++
      const status = result.existed ? '更新' : '新增'
      if ((i + 1) % 20 === 0) {
        console.log(`  进度: ${i + 1}/${unique.length} (${status}: ${q.prompt.slice(0, 20)}...)`)
      }
    } catch (err) {
      fail++
      console.error(`  失败: ${q.prompt}`, (err as Error).message)
    }
  }

  console.log(`\n✅ 导入完成！`)
  console.log(`   成功: ${success} 道`)
  if (fail > 0) console.log(`   失败: ${fail} 道`)
  console.log(`   总计: ${unique.length} 道`)

  // 统计各难度分布
  const diffCount = { 1: 0, 2: 0, 3: 0 }
  const levelCount: Record<string, number> = {}
  for (const q of unique) {
    diffCount[q.difficulty]++
    levelCount[q.levelId] = (levelCount[q.levelId] || 0) + 1
  }

  console.log('\n📊 难度分布:')
  console.log(`   简单(1): ${diffCount[1]} 道`)
  console.log(`   中等(2): ${diffCount[2]} 道`)
  console.log(`   困难(3): ${diffCount[3]} 道`)

  console.log('\n📊 关卡分布:')
  for (const [level, count] of Object.entries(levelCount)) {
    console.log(`   ${level}: ${count} 道`)
  }
}

main().catch(console.error)