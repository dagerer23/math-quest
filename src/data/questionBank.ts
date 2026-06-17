import type { Level, Question } from '@/types/models'

const g1Questions: Question[] = [
  { id: 'g1-q1', type: 'choice', knowledgePoint: '10以内加法', difficulty: 1, prompt: '3 + 4 = ?', answer: '7', explanation: '3加4等于7', xp: 10 },
  { id: 'g1-q2', type: 'choice', knowledgePoint: '10以内减法', difficulty: 1, prompt: '8 - 3 = ?', answer: '5', explanation: '8减3等于5', xp: 10 },
  { id: 'g1-q3', type: 'choice', knowledgePoint: '认识数字', difficulty: 1, prompt: '5 + 5 = ?', answer: '10', explanation: '两个5相加等于10', xp: 10 },
  { id: 'g1-q4', type: 'input', knowledgePoint: '10以内加法', difficulty: 1, prompt: '2 + 6 = ?', answer: '8', explanation: '2加6等于8', xp: 10 },
  { id: 'g1-q5', type: 'choice', knowledgePoint: '认识图形', difficulty: 1, prompt: '哪个是圆形？', options: ['□', '○', '△', '☆'], answer: '○', explanation: '圆形是○', xp: 10 },
  { id: 'g1-q6', type: 'choice', knowledgePoint: '10以内减法', difficulty: 1, prompt: '9 - 4 = ?', answer: '5', explanation: '9减4等于5', xp: 10 },
]

const g2Questions: Question[] = [
  { id: 'g2-q1', type: 'choice', knowledgePoint: '两位数加法', difficulty: 1, prompt: '23 + 15 = ?', answer: '38', explanation: '23加15等于38', xp: 15 },
  { id: 'g2-q2', type: 'choice', knowledgePoint: '两位数减法', difficulty: 1, prompt: '47 - 23 = ?', answer: '24', explanation: '47减23等于24', xp: 15 },
  { id: 'g2-q3', type: 'input', knowledgePoint: '乘法入门', difficulty: 2, prompt: '3 × 4 = ?', answer: '12', explanation: '3乘以4等于12', xp: 15 },
  { id: 'g2-q4', type: 'choice', knowledgePoint: '乘法入门', difficulty: 1, prompt: '2 × 6 = ?', answer: '12', explanation: '2乘以6等于12', xp: 15 },
  { id: 'g2-q5', type: 'choice', knowledgePoint: '认识时间', difficulty: 1, prompt: '1小时 = ?分钟', options: ['60', '100', '50', '30'], answer: '60', explanation: '1小时等于60分钟', xp: 15 },
]

const g3Questions: Question[] = [
  { id: 'g3-q1', type: 'choice', knowledgePoint: '三位数加减', difficulty: 1, prompt: '256 + 347 = ?', answer: '603', explanation: '256加347等于603', xp: 20 },
  { id: 'g3-q2', type: 'input', knowledgePoint: '除法入门', difficulty: 2, prompt: '24 ÷ 4 = ?', answer: '6', explanation: '24除以4等于6', xp: 20 },
  { id: 'g3-q3', type: 'choice', knowledgePoint: '重量单位', difficulty: 1, prompt: '1千克 = ?克', options: ['1000', '100', '10', '10000'], answer: '1000', explanation: '1千克等于1000克', xp: 20 },
  { id: 'g3-q4', type: 'choice', knowledgePoint: '分数入门', difficulty: 2, prompt: '1/2 + 1/4 = ?', options: ['3/4', '2/6', '1/2', '2/4'], answer: '3/4', explanation: '二分之一加四分之一等于四分之三', xp: 20 },
]

const g4Questions: Question[] = [
  { id: 'g4-q1', type: 'choice', knowledgePoint: '大数读写', difficulty: 1, prompt: '123456 读作？', options: ['十二万三千四百五十六', '一千二百三十四', '一万二千三百四十五', '十二万三千四百'], answer: '十二万三千四百五十六', explanation: '按数位从高到低读', xp: 25 },
  { id: 'g4-q2', type: 'input', knowledgePoint: '面积计算', difficulty: 2, prompt: '长6厘米，宽4厘米的长方形面积是？', answer: '24', explanation: '面积=长×宽=6×4=24平方厘米', xp: 25 },
  { id: 'g4-q3', type: 'choice', knowledgePoint: '小数运算', difficulty: 2, prompt: '3.5 + 2.8 = ?', answer: '6.3', explanation: '3.5加2.8等于6.3', xp: 25 },
]

const g5Questions: Question[] = [
  { id: 'g5-q1', type: 'input', knowledgePoint: '分数运算', difficulty: 2, prompt: '2/3 + 1/4 = ?（用/表示，如 11/12）', answer: '11/12', explanation: '三分之二加四分之一等于十二分之十一', xp: 30 },
  { id: 'g5-q2', type: 'choice', knowledgePoint: '倍数与因数', difficulty: 2, prompt: '12的因数有几个？', options: ['6', '5', '4', '8'], answer: '6', explanation: '12的因数有1,2,3,4,6,12共6个', xp: 30 },
  { id: 'g5-q3', type: 'choice', knowledgePoint: '体积计算', difficulty: 2, prompt: '棱长3厘米的正方体体积是？', options: ['27立方厘米', '9立方厘米', '12立方厘米', '18立方厘米'], answer: '27立方厘米', explanation: '体积=棱长³=3³=27', xp: 30 },
]

const g6Questions: Question[] = [
  { id: 'g6-q1', type: 'input', knowledgePoint: '比例', difficulty: 2, prompt: '如果 a:b = 3:5，且 a = 9，则 b = ?', answer: '15', explanation: '比例相同，9/3=3，所以5×3=15', xp: 35 },
  { id: 'g6-q2', type: 'choice', knowledgePoint: '百分数', difficulty: 2, prompt: '75% 的酒精溶液中，酒精与水的比是？', options: ['3:1', '1:3', '3:4', '4:3'], answer: '3:1', explanation: '75%即四分之三，酒精比水等于3:1', xp: 35 },
  { id: 'g6-q3', type: 'choice', knowledgePoint: '圆的周长', difficulty: 2, prompt: '半径为5的圆，周长约是？（π取3.14）', answer: '31.4', explanation: '周长=2πr=2×3.14×5=31.4', xp: 35 },
]

export const LEVELS: Record<string, { levels: Level[]; questions: Record<string, Question[]> }> = {
  g1: {
    levels: [
      { id: 'g1-L1', chapter: '第1章', grade: 1, sortOrder: 0, isBoss: false, knowledgePoints: ['10以内加法'], unitId: 'u1', title: '10以内加法', description: '学习10以内数字相加', questions: g1Questions },
      { id: 'g1-L2', chapter: '第1章', grade: 1, sortOrder: 1, isBoss: false, knowledgePoints: ['10以内减法'], unitId: 'u1', title: '10以内减法', description: '学习10以内数字相减', questions: g1Questions },
      { id: 'g1-L3', chapter: '第2章', grade: 1, sortOrder: 2, isBoss: false, knowledgePoints: ['认识图形'], unitId: 'u2', title: '认识图形', description: '认识基本几何图形', questions: g1Questions },
      { id: 'g1-B1', chapter: '第2章', grade: 1, sortOrder: 3, isBoss: true, knowledgePoints: ['综合'], unitId: 'u2', title: '第一章Boss', description: '综合测试', questions: g1Questions },
    ],
    questions: { 'g1-L1': g1Questions, 'g1-L2': g1Questions, 'g1-L3': g1Questions, 'g1-B1': g1Questions },
  },
  g2: {
    levels: [
      { id: 'g2-L1', chapter: '第1章', grade: 2, sortOrder: 0, isBoss: false, knowledgePoints: ['两位数加法'], unitId: 'u1', title: '两位数加法', description: '学习两位数相加', questions: g2Questions },
      { id: 'g2-L2', chapter: '第1章', grade: 2, sortOrder: 1, isBoss: false, knowledgePoints: ['乘法入门'], unitId: 'u1', title: '乘法入门', description: '认识乘法', questions: g2Questions },
      { id: 'g2-L3', chapter: '第2章', grade: 2, sortOrder: 2, isBoss: false, knowledgePoints: ['认识时间'], unitId: 'u2', title: '认识时间', description: '学习看时钟', questions: g2Questions },
      { id: 'g2-B1', chapter: '第2章', grade: 2, sortOrder: 3, isBoss: true, knowledgePoints: ['综合'], unitId: 'u2', title: '第二章Boss', description: '综合测试', questions: g2Questions },
    ],
    questions: { 'g2-L1': g2Questions, 'g2-L2': g2Questions, 'g2-L3': g2Questions, 'g2-B1': g2Questions },
  },
  g3: {
    levels: [
      { id: 'g3-L1', chapter: '第1章', grade: 3, sortOrder: 0, isBoss: false, knowledgePoints: ['三位数加减'], unitId: 'u1', title: '三位数加减', description: '学习三位数混合运算', questions: g3Questions },
      { id: 'g3-L2', chapter: '第1章', grade: 3, sortOrder: 1, isBoss: false, knowledgePoints: ['除法入门'], unitId: 'u1', title: '除法入门', description: '认识除法', questions: g3Questions },
      { id: 'g3-L3', chapter: '第2章', grade: 3, sortOrder: 2, isBoss: false, knowledgePoints: ['分数入门'], unitId: 'u2', title: '分数入门', description: '认识分数', questions: g3Questions },
      { id: 'g3-B1', chapter: '第2章', grade: 3, sortOrder: 3, isBoss: true, knowledgePoints: ['综合'], unitId: 'u2', title: '第三章Boss', description: '综合测试', questions: g3Questions },
    ],
    questions: { 'g3-L1': g3Questions, 'g3-L2': g3Questions, 'g3-L3': g3Questions, 'g3-B1': g3Questions },
  },
  g4: {
    levels: [
      { id: 'g4-L1', chapter: '第1章', grade: 4, sortOrder: 0, isBoss: false, knowledgePoints: ['大数读写'], unitId: 'u1', title: '大数读写', description: '认识万以上的数', questions: g4Questions },
      { id: 'g4-L2', chapter: '第1章', grade: 4, sortOrder: 1, isBoss: false, knowledgePoints: ['面积计算'], unitId: 'u1', title: '面积计算', description: '学习面积公式', questions: g4Questions },
      { id: 'g4-L3', chapter: '第2章', grade: 4, sortOrder: 2, isBoss: false, knowledgePoints: ['小数运算'], unitId: 'u2', title: '小数运算', description: '小数加减乘除', questions: g4Questions },
      { id: 'g4-B1', chapter: '第2章', grade: 4, sortOrder: 3, isBoss: true, knowledgePoints: ['综合'], unitId: 'u2', title: '第四章Boss', description: '综合测试', questions: g4Questions },
    ],
    questions: { 'g4-L1': g4Questions, 'g4-L2': g4Questions, 'g4-L3': g4Questions, 'g4-B1': g4Questions },
  },
  g5: {
    levels: [
      { id: 'g5-L1', chapter: '第1章', grade: 5, sortOrder: 0, isBoss: false, knowledgePoints: ['分数运算'], unitId: 'u1', title: '分数运算', description: '分数加减法', questions: g5Questions },
      { id: 'g5-L2', chapter: '第1章', grade: 5, sortOrder: 1, isBoss: false, knowledgePoints: ['倍数与因数'], unitId: 'u1', title: '倍数与因数', description: '学习因数和倍数', questions: g5Questions },
      { id: 'g5-L3', chapter: '第2章', grade: 5, sortOrder: 2, isBoss: false, knowledgePoints: ['体积计算'], unitId: 'u2', title: '体积计算', description: '正方体和长方体', questions: g5Questions },
      { id: 'g5-B1', chapter: '第2章', grade: 5, sortOrder: 3, isBoss: true, knowledgePoints: ['综合'], unitId: 'u2', title: '第五章Boss', description: '综合测试', questions: g5Questions },
    ],
    questions: { 'g5-L1': g5Questions, 'g5-L2': g5Questions, 'g5-L3': g5Questions, 'g5-B1': g5Questions },
  },
  g6: {
    levels: [
      { id: 'g6-L1', chapter: '第1章', grade: 6, sortOrder: 0, isBoss: false, knowledgePoints: ['比例'], unitId: 'u1', title: '比例', description: '学习比例关系', questions: g6Questions },
      { id: 'g6-L2', chapter: '第1章', grade: 6, sortOrder: 1, isBoss: false, knowledgePoints: ['百分数'], unitId: 'u1', title: '百分数', description: '认识百分数', questions: g6Questions },
      { id: 'g6-L3', chapter: '第2章', grade: 6, sortOrder: 2, isBoss: false, knowledgePoints: ['圆的周长'], unitId: 'u2', title: '圆的周长', description: '学习圆周率', questions: g6Questions },
      { id: 'g6-B1', chapter: '第2章', grade: 6, sortOrder: 3, isBoss: true, knowledgePoints: ['综合'], unitId: 'u2', title: '第六章Boss', description: '综合测试', questions: g6Questions },
    ],
    questions: { 'g6-L1': g6Questions, 'g6-L2': g6Questions, 'g6-L3': g6Questions, 'g6-B1': g6Questions },
  },
}
