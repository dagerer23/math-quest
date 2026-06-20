/**
 * 为所有年级（1-12）每个补充100道题
 * 用法: npx tsx scripts/seed-all-questions.ts
 */
import { upsertQuestion } from '../server/services/content'
import { initDB } from '../server/db'

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

// 各级别关卡ID
function levelId(grade: number, level: string) {
  return `g${grade}-${level}`
}

// 随机选项生成辅助
function randChoice(a: number, range: number, count: number): string[] {
  const answers = new Set<string>()
  answers.add(String(a))
  while (answers.size < count) {
    const offset = Math.floor(Math.random() * range * 2) - range
    const val = a + offset
    if (val !== a && val >= 0) answers.add(String(val))
  }
  return [...answers].sort((a, b) => Number(a) - Number(b))
}

// ============== 一年级 (g1) ==============
function makeG1Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 5以内加减法 (补充约16题)
  for (let i = 0; i < 16; i++) {
    const a = Math.floor(Math.random() * 5) + 1
    const b = Math.floor(Math.random() * (6 - a))
    const ans = a + b
    const isChoice = i % 2 === 0
    add({
      levelId: levelId(1, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '5以内加法', difficulty: 1,
      prompt: `${a} + ${b} = ?`,
      answer: ans, explanation: `${a} + ${b} = ${ans}`, xp: 10,
      options: isChoice ? randChoice(ans, 3, 4) : undefined,
    })
  }

  // L2: 10以内加减法 (补充约16题)
  for (let i = 0; i < 16; i++) {
    const isAdd = i < 8
    const isChoice = i % 2 === 0
    if (isAdd) {
      const a = Math.floor(Math.random() * 8) + 2
      const b = Math.floor(Math.random() * (10 - a)) + 1
      add({
        levelId: levelId(1, 'L2'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '10以内加法', difficulty: 1,
        prompt: `${a} + ${b} = ?`,
        answer: a + b, explanation: `${a} + ${b} = ${a + b}`, xp: 10,
        options: isChoice ? randChoice(a + b, 3, 4) : undefined,
      })
    } else {
      const a = Math.floor(Math.random() * 8) + 3
      const b = Math.floor(Math.random() * a) + 1
      add({
        levelId: levelId(1, 'L2'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '10以内减法', difficulty: 2,
        prompt: `${a} - ${b} = ?`,
        answer: a - b, explanation: `${a} - ${b} = ${a - b}`, xp: 10,
        options: isChoice ? randChoice(a - b, 3, 4) : undefined,
      })
    }
  }

  // L3: 20以内加减法 (补充约16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    if (i < 8) {
      const a = Math.floor(Math.random() * 9) + 8
      const b = Math.floor(Math.random() * 9) + 2
      const ans = a + b
      add({
        levelId: levelId(1, 'L3'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '20以内进位加法', difficulty: 3,
        prompt: `${a} + ${b} = ?`,
        answer: ans, explanation: `凑十法：${a} + ${b} = ${ans}`, xp: 15,
        options: isChoice ? randChoice(ans, 3, 4) : undefined,
      })
    } else {
      const a = Math.floor(Math.random() * 8) + 11
      const b = Math.floor(Math.random() * 7) + 3
      add({
        levelId: levelId(1, 'L3'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '20以内退位减法', difficulty: 3,
        prompt: `${a} - ${b} = ?`,
        answer: a - b, explanation: `${a} - ${b} = ${a - b}`, xp: 15,
        options: isChoice ? randChoice(a - b, 3, 4) : undefined,
      })
    }
  }

  // L4: 认识钟表与图形 (补充约16题)
  const clockQuestions = [
    { prompt: '分针指着12，时针指着3，是几时？', answer: '3时', exp: '3时整', opts: ['2时', '3时', '4时', '6时'] },
    { prompt: '分针指着12，时针指着8，是几时？', answer: '8时', exp: '8时整', opts: ['7时', '8时', '9时', '10时'] },
    { prompt: '分针指着6，时针在5和6之间，是几时半？', answer: '5时半', exp: '5:30', opts: ['5时', '5时半', '6时', '6时半'] },
    { prompt: '现在是4时，再过3小时是几时？', answer: '7时', exp: '4+3=7', opts: ['6时', '7时', '8时', '9时'] },
    { prompt: '正方形有几个角？', answer: 4, exp: '正方形有4个直角', opts: ['2', '3', '4', '5'] },
    { prompt: '三角形有几条边？', answer: 3, exp: '三角形有3条边', opts: ['2', '3', '4', '5'] },
    { prompt: '1元等于多少角？', answer: 10, exp: '1元=10角', opts: ['5', '10', '20', '100'] },
    { prompt: '1张5元可以换几张1元？', answer: 5, exp: '5元=5张1元', opts: ['3', '4', '5', '6'] },
    { prompt: '左手的对面是？', answer: '右手', exp: '左右相对', opts: ['左手', '右手', '前方', '后方'] },
    { prompt: '太阳从哪个方向升起？', answer: '东', exp: '太阳东升', opts: ['东', '南', '西', '北'] },
    { prompt: '按规律：2,4,6,8,__', answer: 10, exp: '每次加2', opts: ['9', '10', '11', '12'] },
    { prompt: '按规律：1,4,7,10,__', answer: 13, exp: '每次加3', opts: ['11', '12', '13', '14'] },
    { prompt: '按规律：20,17,14,__', answer: 11, exp: '每次减3', opts: ['10', '11', '12', '13'] },
    { prompt: '圆形有几个角？', answer: 0, exp: '圆形没有角', opts: ['0', '1', '2', '4'] },
    { prompt: '长方形有几条边？', answer: 4, exp: '长方形有4条边', opts: ['3', '4', '5', '6'] },
    { prompt: '从1数到10，一共有几个数？', answer: 10, exp: '1到10有10个数', opts: ['9', '10', '11', '12'] },
  ]
  clockQuestions.forEach((q, i) => {
    add({
      levelId: levelId(1, 'L4'), type: 'choice',
      knowledgePoint: i < 5 ? '认识钟表' : i < 10 ? '认识图形' : '找规律',
      difficulty: i < 6 ? 2 : 3,
      prompt: q.prompt, answer: q.answer, explanation: q.exp, xp: 15,
      options: q.opts,
    })
  })

  // L5: 20以内综合 (补充约16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 15) + 3
    const b = Math.floor(Math.random() * 8) + 2
    const c = Math.floor(Math.random() * 5) + 1
    const ans = a + b - c
    add({
      levelId: levelId(1, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '20以内综合', difficulty: 3,
      prompt: `${a} + ${b} - ${c} = ?`,
      answer: ans, explanation: `${a}+${b}=${a+b}，${a+b}-${c}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 3, 4) : undefined,
    })
  }

  // BOSS: 综合应用 (补充约20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 30) + 20
    const b = Math.floor(Math.random() * 20) + 10
    const ans = a + b
    add({
      levelId: levelId(1, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '一年级综合', difficulty: 3,
      prompt: `${a} + ${b} = ?`,
      answer: ans, explanation: `${a}+${b}=${ans}`, xp: 20,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  return qs
}

// ============== 二年级 (g2) ==============
function makeG2Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 100以内加减法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 60) + 20
    const b = Math.floor(Math.random() * 30) + 5
    const isAdd = i < 8
    const ans = isAdd ? a + b : a - b
    add({
      levelId: levelId(2, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: isAdd ? '100以内加法' : '100以内减法', difficulty: isAdd ? 1 : 2,
      prompt: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      answer: ans, explanation: `${a}${isAdd?'+':'-'}${b}=${ans}`, xp: 10,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  // L2: 乘法口诀 (16题)
  const mulPairs = [
    [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9],
    [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
    [4, 5], [4, 6], [4, 7],
  ]
  mulPairs.forEach(([a, b], i) => {
    const isChoice = i % 2 === 0
    add({
      levelId: levelId(2, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '乘法口诀', difficulty: 2,
      prompt: `${a} × ${b} = ?`,
      answer: a * b, explanation: `${a}×${b}=${a * b}`, xp: 10,
      options: isChoice ? randChoice(a * b, 5, 4) : undefined,
    })
  })

  // L3: 混合运算 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 5) + 2
    const b = Math.floor(Math.random() * 5) + 2
    const c = Math.floor(Math.random() * 8) + 3
    const ans = a * b + c
    add({
      levelId: levelId(2, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '混合运算', difficulty: 3,
      prompt: `${a} × ${b} + ${c} = ?`,
      answer: ans, explanation: `${a}×${b}=${a*b}，${a*b}+${c}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  // L4: 除法初步 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const b = Math.floor(Math.random() * 7) + 2
    const q = Math.floor(Math.random() * 7) + 2
    const a = b * q
    add({
      levelId: levelId(2, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '除法口诀', difficulty: 2,
      prompt: `${a} ÷ ${b} = ?`,
      answer: q, explanation: `${a}÷${b}=${q}`, xp: 10,
      options: isChoice ? randChoice(q, 3, 4) : undefined,
    })
  }

  // L5: 万以内数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 4000) + 1000
    const b = Math.floor(Math.random() * 2000) + 500
    const isAdd = i < 8
    const ans = isAdd ? a + b : Math.max(a - b, 0)
    add({
      levelId: levelId(2, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '万以内加减', difficulty: 3,
      prompt: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      answer: ans, explanation: `${a}${isAdd?'+':'-'}${b}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 500, 4) : undefined,
    })
  }

  // BOSS: 万以内综合 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 7) + 3
    const b = Math.floor(Math.random() * 7) + 3
    const ans = a * b
    add({
      levelId: levelId(2, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '万以内综合', difficulty: 3,
      prompt: `${a} × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 20,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  return qs
}

// ============== 三年级 (g3) ==============
function makeG3Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 多位数乘除法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 300) + 100
    const b = Math.floor(Math.random() * 7) + 2
    const ans = a * b
    add({
      levelId: levelId(3, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '三位数乘一位数', difficulty: 2,
      prompt: `${a} × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 50, 4) : undefined,
    })
  }

  // L2: 分数与面积 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    if (i < 8) {
      const a = Math.floor(Math.random() * 8) + 3
      const b = Math.floor(Math.random() * 8) + 3
      add({
        levelId: levelId(3, 'L2'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '长方形面积', difficulty: 2,
        prompt: `长方形长${a}cm，宽${b}cm，面积=?cm²`,
        answer: a * b, explanation: `${a}×${b}=${a*b}`, xp: 10,
        options: isChoice ? randChoice(a * b, 10, 4) : undefined,
      })
    } else {
      const a = Math.floor(Math.random() * 8) + 3
      const b = Math.floor(Math.random() * 8) + 3
      add({
        levelId: levelId(3, 'L2'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '长方形周长', difficulty: 2,
        prompt: `长方形长${a}cm，宽${b}cm，周长=?cm`,
        answer: 2 * (a + b), explanation: `2×(${a}+${b})=${2*(a+b)}`, xp: 10,
        options: isChoice ? randChoice(2 * (a + b), 8, 4) : undefined,
      })
    }
  }

  // L3: 四则混合 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 50) + 20
    const b = Math.floor(Math.random() * 8) + 2
    const c = Math.floor(Math.random() * 10) + 5
    const ans = a + b * c
    add({
      levelId: levelId(3, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '四则混合', difficulty: 3,
      prompt: `${a} + ${b} × ${c} = ?`,
      answer: ans, explanation: `先乘：${b}×${c}=${b*c}，${a}+${b*c}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 10, 4) : undefined,
    })
  }

  // L4: 两位数乘除法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 50) + 10
    const b = Math.floor(Math.random() * 30) + 10
    add({
      levelId: levelId(3, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '两位数乘两位数', difficulty: 3,
      prompt: `${a} × ${b} = ?`,
      answer: a * b, explanation: `${a}×${b}=${a*b}`, xp: 15,
      options: isChoice ? randChoice(a * b, 50, 4) : undefined,
    })
  }

  // L5: 小数初步 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = +(Math.random() * 8 + 1).toFixed(1)
    const b = +(Math.random() * 8 + 1).toFixed(1)
    const ans = +(a + b).toFixed(1)
    add({
      levelId: levelId(3, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '小数加减', difficulty: 2,
      prompt: `${a} + ${b} = ?`,
      answer: ans, explanation: `${a}+${b}=${ans}`, xp: 15,
      options: isChoice ? randChoice(Math.round(ans * 10), 20, 4).map(v => String((Number(v) / 10).toFixed(1))) : undefined,
    })
  }

  // BOSS: 综合实战 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 40) + 10
    const b = Math.floor(Math.random() * 30) + 10
    const ans = a * b
    add({
      levelId: levelId(3, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `${a} × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 20,
      options: isChoice ? randChoice(ans, 100, 4) : undefined,
    })
  }

  return qs
}

// ============== 四年级 (g4) ==============
function makeG4Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 大数的认识 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 90000) + 10000
    const b = Math.floor(Math.random() * 50000) + 10000
    const ans = a + b
    add({
      levelId: levelId(4, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '大数的认识', difficulty: 2,
      prompt: `${a} + ${b} = ?`,
      answer: ans, explanation: `${a}+${b}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 1000, 4) : undefined,
    })
  }

  // L2: 三位数乘两位数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 400) + 100
    const b = Math.floor(Math.random() * 50) + 10
    add({
      levelId: levelId(4, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '三位数乘两位数', difficulty: 3,
      prompt: `${a} × ${b} = ?`,
      answer: a * b, explanation: `${a}×${b}=${a*b}`, xp: 15,
      options: isChoice ? randChoice(a * b, 500, 4) : undefined,
    })
  }

  // L3: 除数是两位数的除法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const b = Math.floor(Math.random() * 30) + 10
    const qv = Math.floor(Math.random() * 20) + 5
    const a = b * qv
    add({
      levelId: levelId(4, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '除数是两位数的除法', difficulty: 3,
      prompt: `${a} ÷ ${b} = ?`,
      answer: qv, explanation: `${a}÷${b}=${qv}`, xp: 15,
      options: isChoice ? randChoice(qv, 5, 4) : undefined,
    })
  }

  // L4: 角的认识 (16题)
  const angleQuestions = [
    { prompt: '45°的角是什么角？', answer: '锐角', exp: '小于90°是锐角', opts: ['锐角', '直角', '钝角', '平角'] },
    { prompt: '120°的角是什么角？', answer: '钝角', exp: '大于90°小于180°是钝角', opts: ['锐角', '直角', '钝角', '平角'] },
    { prompt: '1周角=？直角', answer: 4, exp: '360÷90=4', opts: ['2', '3', '4', '5'] },
    { prompt: '1平角=？直角', answer: 2, exp: '180÷90=2', opts: ['1', '2', '3', '4'] },
    { prompt: '三点钟方向夹角是？', answer: 90, exp: '90°', opts: ['30', '60', '90', '120'] },
    { prompt: '平行四边形对边关系？', answer: '平行且相等', exp: '平行四边形对边平行且相等', opts: ['平行', '相等', '平行且相等', '不平行不相等'] },
    { prompt: '梯形有几组对边平行？', answer: 1, exp: '梯形只有一组对边平行', opts: ['0', '1', '2', '3'] },
    { prompt: '35°的角是什么角？', answer: '锐角', exp: '小于90°是锐角', opts: ['锐角', '直角', '钝角', '平角'] },
    { prompt: '150°的角是什么角？', answer: '钝角', exp: '大于90°小于180°是钝角', opts: ['锐角', '直角', '钝角', '平角'] },
    { prompt: '等边三角形每个角几度？', answer: 60, exp: '180÷3=60', opts: ['45', '60', '90', '120'] },
    { prompt: '一个三角形最多有几个钝角？', answer: 1, exp: '最多1个钝角', opts: ['0', '1', '2', '3'] },
    { prompt: '一个三角形最多有几个直角？', answer: 1, exp: '最多1个直角', opts: ['0', '1', '2', '3'] },
    { prompt: '六点钟方向夹角是？', answer: 180, exp: '180°', opts: ['90', '120', '180', '360'] },
    { prompt: '菱形是特殊的？', answer: '平行四边形', exp: '菱形是特殊的平行四边形', opts: ['正方形', '平行四边形', '梯形', '三角形'] },
    { prompt: '四边形内角和是？', answer: 360, exp: '360°', opts: ['180', '270', '360', '450'] },
    { prompt: '五边形内角和是？', answer: 540, exp: '(5-2)×180=540', opts: ['360', '450', '540', '720'] },
  ]
  angleQuestions.forEach((q) => {
    add({
      levelId: levelId(4, 'L4'), type: 'choice',
      knowledgePoint: '角的认识', difficulty: 2,
      prompt: q.prompt, answer: q.answer, explanation: q.exp, xp: 15,
      options: q.opts,
    })
  })

  // L5: 四则混合运算 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 50) + 10
    const b = Math.floor(Math.random() * 20) + 5
    const c = Math.floor(Math.random() * 10) + 2
    const ans = (a + b) * c
    add({
      levelId: levelId(4, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '四则混合运算', difficulty: 3,
      prompt: `(${a} + ${b}) × ${c} = ?`,
      answer: ans, explanation: `(${a}+${b})×${c}=${a+b}×${c}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 20, 4) : undefined,
    })
  }

  // BOSS: 综合应用 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 200) + 50
    const b = Math.floor(Math.random() * 30) + 10
    const ans = a * b
    add({
      levelId: levelId(4, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `${a} × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 20,
      options: isChoice ? randChoice(ans, 500, 4) : undefined,
    })
  }

  return qs
}

// ============== 五年级 (g5) ==============
function makeG5Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 小数乘法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = +(Math.random() * 5 + 0.5).toFixed(1)
    const b = +(Math.random() * 5 + 0.5).toFixed(1)
    const ans = +(a * b).toFixed(2)
    add({
      levelId: levelId(5, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '小数乘法', difficulty: 2,
      prompt: `${a} × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 15,
      options: isChoice ? ['1', '2', '3', '4'].map(v => String(+(Number(v) * 0.5).toFixed(2))) : undefined,
    })
  }

  // L2: 小数除法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const b = +(Math.random() * 3 + 0.5).toFixed(1)
    const qv = +(Math.random() * 5 + 1).toFixed(1)
    const a = +(b * Number(qv)).toFixed(2)
    add({
      levelId: levelId(5, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '小数除法', difficulty: 3,
      prompt: `${a} ÷ ${b} = ?`,
      answer: qv, explanation: `${a}÷${b}=${qv}`, xp: 15,
      options: isChoice ? ['1', '2', '3', '4'].map(v => String(+(Number(v) * 0.5).toFixed(1))) : undefined,
    })
  }

  // L3: 观察物体 (16题)
  const objQuestions = [
    { prompt: '正方体有几个面？', answer: 6, exp: '正方体有6个面', opts: ['4', '6', '8', '12'] },
    { prompt: '长方体有几个顶点？', answer: 8, exp: '长方体有8个顶点', opts: ['4', '6', '8', '12'] },
    { prompt: '长方体有几条棱？', answer: 12, exp: '长方体有12条棱', opts: ['6', '8', '10', '12'] },
    { prompt: '从正面看圆柱，看到的是？', answer: '长方形', exp: '圆柱正面看是长方形', opts: ['圆形', '长方形', '正方形', '三角形'] },
    { prompt: '从上面看圆锥，看到的是？', answer: '圆形', exp: '圆锥上面看是圆形', opts: ['圆形', '三角形', '正方形', '长方形'] },
    { prompt: '正方体有几条棱？', answer: 12, exp: '正方体有12条棱', opts: ['6', '8', '10', '12'] },
    { prompt: '正方体有几个顶点？', answer: 8, exp: '正方体有8个顶点', opts: ['4', '6', '8', '12'] },
    { prompt: '从正面看球体，看到的是？', answer: '圆形', exp: '球体从任何方向看都是圆形', opts: ['圆形', '正方形', '三角形', '椭圆'] },
    { prompt: '从右面看正方体，看到的是？', answer: '正方形', exp: '正方体从右面看是正方形', opts: ['圆形', '正方形', '三角形', '长方形'] },
    { prompt: '圆柱有几个底面？', answer: 2, exp: '圆柱有2个底面', opts: ['1', '2', '3', '4'] },
    { prompt: '圆锥有几个顶点？', answer: 1, exp: '圆锥有1个顶点', opts: ['0', '1', '2', '3'] },
    { prompt: '三棱柱有几个面？', answer: 5, exp: '三棱柱有5个面', opts: ['3', '4', '5', '6'] },
    { prompt: '从正面看三棱柱，看到的是？', answer: '长方形', exp: '三棱柱正面看是长方形', opts: ['三角形', '长方形', '正方形', '梯形'] },
    { prompt: '正方体体对角线有几条？', answer: 4, exp: '正方体有4条体对角线', opts: ['2', '3', '4', '6'] },
    { prompt: '一个物体从正面和左面看都是正方形，可能是？', answer: '正方体', exp: '正方体从正、左面看都是正方形', opts: ['球体', '圆柱', '正方体', '圆锥'] },
    { prompt: '从三个方向看都相同的立体图形是？', answer: '球体', exp: '球体从任何方向看都一样', opts: ['正方体', '圆柱', '球体', '圆锥'] },
  ]
  objQuestions.forEach((q) => {
    add({
      levelId: levelId(5, 'L3'), type: 'choice',
      knowledgePoint: '观察物体', difficulty: 2,
      prompt: q.prompt, answer: q.answer, explanation: q.exp, xp: 10,
      options: q.opts,
    })
  })

  // L4: 简易方程 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const x = Math.floor(Math.random() * 15) + 2
    const a = Math.floor(Math.random() * 5) + 2
    const b = a * x + Math.floor(Math.random() * 5) - 2
    add({
      levelId: levelId(5, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '简易方程', difficulty: 3,
      prompt: `${a}x + ${b - a * x} = ${b}, x = ?`,
      answer: x, explanation: `${a}x=${b-(b-a*x)}，x=${x}`, xp: 15,
      options: isChoice ? randChoice(x, 3, 4) : undefined,
    })
  }

  // L5: 多边形面积 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 10) + 3
    const b = Math.floor(Math.random() * 8) + 3
    add({
      levelId: levelId(5, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '多边形面积', difficulty: 3,
      prompt: `三角形底${a}cm，高${b}cm，面积=?cm²`,
      answer: a * b / 2, explanation: `${a}×${b}÷2=${a*b/2}`, xp: 15,
      options: isChoice ? randChoice(a * b / 2, 5, 4) : undefined,
    })
  }

  // BOSS: 综合应用 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = +(Math.random() * 8 + 1).toFixed(1)
    const b = +(Math.random() * 8 + 1).toFixed(1)
    const ans = +(Number(a) * Number(b)).toFixed(2)
    add({
      levelId: levelId(5, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `${a} × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 20,
      options: isChoice ? ['1', '2', '3', '4'].map(v => String(+(Number(v) * 1.5).toFixed(2))) : undefined,
    })
  }

  return qs
}

// ============== 六年级 (g6) ==============
function makeG6Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 分数乘法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const na = Math.floor(Math.random() * 5) + 1
    const da = Math.floor(Math.random() * 5) + 2
    const nb = Math.floor(Math.random() * 5) + 1
    const db = Math.floor(Math.random() * 5) + 2
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const n = na * nb
    const d = da * db
    const g = gcd(n, d)
    const ansN = n / g
    const ansD = d / g
    const ans = ansD === 1 ? String(ansN) : `${ansN}/${ansD}`
    add({
      levelId: levelId(6, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '分数乘法', difficulty: 2,
      prompt: `${na}/${da} × ${nb}/${db} = ?`,
      answer: ans, explanation: `${na}×${nb}=${n}，${da}×${db}=${d}，约分=${ans}`, xp: 15,
      options: isChoice ? ['1/2', '1/3', '2/3', '1/4'] : undefined,
    })
  }

  // L2: 分数除法 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 20) + 5
    const b = Math.floor(Math.random() * 5) + 2
    add({
      levelId: levelId(6, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '分数除法', difficulty: 3,
      prompt: `${a} ÷ ${b} = ?`,
      answer: +(a / b).toFixed(1), explanation: `${a}÷${b}=${(a/b).toFixed(1)}`, xp: 15,
      options: isChoice ? randChoice(Math.round(a / b * 10), 10, 4).map(v => String((Number(v) / 10).toFixed(1))) : undefined,
    })
  }

  // L3: 比 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 8) + 2
    const b = Math.floor(Math.random() * 8) + 2
    const g = (a2: number, b2: number): number => b2 === 0 ? a2 : g(b2, a2 % b2)
    const div = g(a, b)
    add({
      levelId: levelId(6, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '比', difficulty: 2,
      prompt: `${a * div}:${b * div} 化简后是？`,
      answer: `${a}:${b}`, explanation: `除以${div}得${a}:${b}`, xp: 10,
      options: isChoice ? [`${a}:${b}`, `${b}:${a}`, `${a*2}:${b*2}`, `${a*div}:${b*div}`] : undefined,
    })
  }

  // L4: 圆 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const r = Math.floor(Math.random() * 6) + 2
    if (i < 8) {
      const ans = +(2 * 3.14 * r).toFixed(2)
      add({
        levelId: levelId(6, 'L4'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '圆', difficulty: 3,
        prompt: `圆的半径${r}cm，周长=?cm（π取3.14）`,
        answer: ans, explanation: `2×3.14×${r}=${ans}`, xp: 15,
        options: isChoice ? randChoice(Math.round(ans * 100), 500, 4).map(v => String((Number(v) / 100).toFixed(2))) : undefined,
      })
    } else {
      const ans = +(3.14 * r * r).toFixed(2)
      add({
        levelId: levelId(6, 'L4'), type: isChoice ? 'choice' : 'input',
        knowledgePoint: '圆', difficulty: 3,
        prompt: `圆的半径${r}cm，面积=?cm²（π取3.14）`,
        answer: ans, explanation: `3.14×${r}²=${ans}`, xp: 15,
        options: isChoice ? randChoice(Math.round(ans * 100), 500, 4).map(v => String((Number(v) / 100).toFixed(2))) : undefined,
      })
    }
  }

  // L5: 百分数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const total = Math.floor(Math.random() * 600) + 100
    const pct = Math.floor(Math.random() * 40) + 5
    const ans = +(total * pct / 100).toFixed(1)
    add({
      levelId: levelId(6, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '百分数', difficulty: 3,
      prompt: `${total}的${pct}%是多少？`,
      answer: ans, explanation: `${total}×${pct}%=${ans}`, xp: 15,
      options: isChoice ? randChoice(Math.round(Number(ans) * 10), 50, 4).map(v => String((Number(v) / 10).toFixed(1))) : undefined,
    })
  }

  // BOSS: 综合应用 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const r = Math.floor(Math.random() * 5) + 3
    const ans = +(3.14 * r * r).toFixed(2)
    add({
      levelId: levelId(6, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `圆形花坛半径${r}m，面积=?m²（π取3.14）`,
      answer: ans, explanation: `3.14×${r}²=${ans}`, xp: 20,
      options: isChoice ? randChoice(Math.round(Number(ans) * 100), 500, 4).map(v => String((Number(v) / 100).toFixed(2))) : undefined,
    })
  }

  return qs
}

// ============== 七年级 (g7) ==============
function makeG7Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 有理数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = -(Math.floor(Math.random() * 10) + 1)
    const b = Math.floor(Math.random() * 10) + 1
    const ans = a + b
    add({
      levelId: levelId(7, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '有理数加法', difficulty: 3,
      prompt: `(${a}) + ${b} = ?`,
      answer: ans, explanation: `${a}+${b}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans + 5, 5, 4) : undefined,
    })
  }

  // L2: 有理数运算 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = -(Math.floor(Math.random() * 8) + 2)
    const b = Math.floor(Math.random() * 5) + 2
    const ans = a * b
    add({
      levelId: levelId(7, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '有理数乘法', difficulty: 2,
      prompt: `(${a}) × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 10,
      options: isChoice ? randChoice(ans + 10, 10, 4) : undefined,
    })
  }

  // L3: 整式 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 5) + 2
    const b = Math.floor(Math.random() * 5) + 2
    const c = Math.floor(Math.random() * 5) + 2
    add({
      levelId: levelId(7, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '整式加减', difficulty: 2,
      prompt: `${a}x + ${b}x = ?`,
      answer: `${a+b}x`, explanation: `${a}x+${b}x=${a+b}x`, xp: 10,
      options: isChoice ? [`${a+b}x`, `${a-b}x`, `${a*b}x`, `${a}x${b}`] : undefined,
    })
  }

  // L4: 一元一次方程 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const x = Math.floor(Math.random() * 10) + 2
    const a = Math.floor(Math.random() * 5) + 2
    const b = a * x + Math.floor(Math.random() * 4) - 2
    add({
      levelId: levelId(7, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '一元一次方程', difficulty: 3,
      prompt: `${a}x - ${a*x - b} = ${b}, x = ?`,
      answer: x, explanation: `${a}x=${b + a*x - b}，x=${x}`, xp: 15,
      options: isChoice ? randChoice(x, 3, 4) : undefined,
    })
  }

  // L5: 几何图形初步 (16题)
  const geoQuestions = [
    { prompt: '两点之间什么最短？', answer: '线段', exp: '两点之间线段最短', opts: ['直线', '射线', '线段', '曲线'] },
    { prompt: '互余的两个角和为？', answer: 90, exp: '互余和为90°', opts: ['45°', '90°', '180°', '360°'] },
    { prompt: '互补的两个角和为？', answer: 180, exp: '互补和为180°', opts: ['90°', '180°', '270°', '360°'] },
    { prompt: '对顶角的关系？', answer: '相等', exp: '对顶角相等', opts: ['互补', '相等', '互余', '不确定'] },
    { prompt: '两直线平行，同位角？', answer: '相等', exp: '同位角相等', opts: ['互补', '相等', '互余', '不确定'] },
    { prompt: '两直线平行，内错角？', answer: '相等', exp: '内错角相等', opts: ['互补', '相等', '互余', '不确定'] },
    { prompt: '两直线平行，同旁内角？', answer: '互补', exp: '同旁内角互补', opts: ['互补', '相等', '互余', '不确定'] },
    { prompt: '一个角50°，它的余角是？', answer: 40, exp: '90-50=40', opts: ['30', '40', '50', '60'] },
    { prompt: '一个角70°，它的补角是？', answer: 110, exp: '180-70=110', opts: ['100', '110', '120', '130'] },
    { prompt: '两条直线相交，有几对对顶角？', answer: 2, exp: '2对对顶角', opts: ['1', '2', '3', '4'] },
    { prompt: '一条直线上有3个点，共有几条线段？', answer: 3, exp: '3条线段', opts: ['1', '2', '3', '4'] },
    { prompt: '线段AB=5cm，C是三等分点，AC=？', answer: '5/3', exp: '5÷3=5/3', opts: ['1', '5/3', '2', '5/2'] },
    { prompt: '角平分线把角分成？', answer: '两个相等的角', exp: '角平分线定义', opts: ['两个相等的角', '两个互补的角', '两个互余的角', '不确定'] },
    { prompt: '垂线段是点到直线的？', answer: '最短距离', exp: '垂线段最短', opts: ['最长距离', '最短距离', '任意距离', '不确定'] },
    { prompt: '过一点可以画几条直线与已知直线平行？', answer: 1, exp: '过直线外一点有且只有一条', opts: ['0', '1', '2', '无数'] },
    { prompt: '一个角120°，它的补角是？', answer: 60, exp: '180-120=60', opts: ['50', '60', '70', '80'] },
  ]
  geoQuestions.forEach((q) => {
    add({
      levelId: levelId(7, 'L5'), type: 'choice',
      knowledgePoint: '几何图形', difficulty: 2,
      prompt: q.prompt, answer: q.answer, explanation: q.exp, xp: 10,
      options: q.opts,
    })
  })

  // BOSS: 综合应用 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = -(Math.floor(Math.random() * 8) + 2)
    const b = Math.floor(Math.random() * 6) + 2
    const ans = a * b
    add({
      levelId: levelId(7, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `(${a}) × ${b} = ?`,
      answer: ans, explanation: `${a}×${b}=${ans}`, xp: 20,
      options: isChoice ? randChoice(ans + 10, 10, 4) : undefined,
    })
  }

  return qs
}

// ============== 八年级 (g8) ==============
function makeG8Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 二次根式 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const n = Math.floor(Math.random() * 10) + 2
    const sq = n * n
    add({
      levelId: levelId(8, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '二次根式', difficulty: 2,
      prompt: `√${sq} = ?`,
      answer: n, explanation: `${n}²=${sq}，所以√${sq}=${n}`, xp: 10,
      options: isChoice ? randChoice(n, 3, 4) : undefined,
    })
  }

  // L2: 一次函数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const k = Math.floor(Math.random() * 5) + 1
    const b = Math.floor(Math.random() * 10) + 1
    const x = Math.floor(Math.random() * 5) + 1
    const ans = k * x + b
    add({
      levelId: levelId(8, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '一次函数', difficulty: 2,
      prompt: `已知y=${k}x+${b}，当x=${x}时，y=?`,
      answer: ans, explanation: `${k}×${x}+${b}=${ans}`, xp: 10,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  // L3: 整式乘除与因式分解 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 5) + 2
    const b = Math.floor(Math.random() * 5) + 2
    add({
      levelId: levelId(8, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '整式乘除', difficulty: 2,
      prompt: `(${a}x)² = ?`,
      answer: `${a*a}x²`, explanation: `(${a}x)²=${a*a}x²`, xp: 10,
      options: isChoice ? [`${a*a}x²`, `${a*a}x`, `${a}x²`, `${a*a*a}x²`] : undefined,
    })
  }

  // L4: 全等三角形 (16题)
  const triangleQuestions = [
    { prompt: '全等三角形判定方法不包括？', answer: 'SSA', exp: 'SSA不能判定全等', opts: ['SAS', 'ASA', 'SSS', 'SSA'] },
    { prompt: '三角形ABC≅三角形DEF，若∠A=40°，则∠D=?', answer: 40, exp: '全等三角形对应角相等', opts: ['20', '40', '60', '80'] },
    { prompt: '三角形ABC≅三角形DEF，AB=7，则DE=?', answer: 7, exp: '全等三角形对应边相等', opts: ['5', '6', '7', '8'] },
    { prompt: '等腰三角形顶角50°，底角=?', answer: 65, exp: '(180-50)/2=65', opts: ['55', '60', '65', '70'] },
    { prompt: '等腰三角形底角45°，顶角=?', answer: 90, exp: '180-45-45=90', opts: ['60', '90', '120', '135'] },
    { prompt: '等边三角形每个角=?°', answer: 60, exp: '180÷3=60', opts: ['45', '60', '90', '120'] },
    { prompt: '用SAS判定全等需要几个条件？', answer: 3, exp: '两边一角共3个条件', opts: ['2', '3', '4', '5'] },
    { prompt: '用ASA判定全等需要几个条件？', answer: 3, exp: '两角一边共3个条件', opts: ['2', '3', '4', '5'] },
    { prompt: '等腰三角形三线合一不包括？', answer: '中位线', exp: '三线：高、中线、角平分线', opts: ['高', '中线', '角平分线', '中位线'] },
    { prompt: '三角形ABC≅三角形DEF，周长分别为?', answer: '相等', exp: '全等三角形周长相等', opts: ['相等', '不相等', '2倍', '不确定'] },
    { prompt: '等腰三角形腰长5，底6，高=?', answer: 4, exp: '√(25-9)=4', opts: ['3', '4', '5', '6'] },
    { prompt: '直角三角形斜边上的中线等于？', answer: '斜边的一半', exp: '直角三角形斜边中线定理', opts: ['斜边的一半', '斜边', '直角边', '2倍斜边'] },
    { prompt: '三角形内角和为？', answer: 180, exp: '180°', opts: ['90', '180', '270', '360'] },
    { prompt: '等腰三角形腰长3，底4，周长=?', answer: 10, exp: '3+3+4=10', opts: ['7', '10', '12', '14'] },
    { prompt: '三角形ABC≅三角形DEF，面积关系？', answer: '相等', exp: '全等三角形面积相等', opts: ['相等', '2倍', '不确定', '成比例'] },
    { prompt: '用SSS判定全等需要几个条件？', answer: 3, exp: '三边对应相等', opts: ['2', '3', '4', '5'] },
  ]
  triangleQuestions.forEach((q) => {
    add({
      levelId: levelId(8, 'L4'), type: 'choice',
      knowledgePoint: '全等三角形', difficulty: 2,
      prompt: q.prompt, answer: q.answer, explanation: q.exp, xp: 10,
      options: q.opts,
    })
  })

  // L5: 分式 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 5) + 2
    const b = Math.floor(Math.random() * 5) + 2
    add({
      levelId: levelId(8, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '分式', difficulty: 2,
      prompt: `分式 1/${a} + 1/${b} 的公分母是？`,
      answer: a * b, explanation: `${a}和${b}的最小公倍数是${a*b}`, xp: 15,
      options: isChoice ? randChoice(a * b, 5, 4) : undefined,
    })
  }

  // BOSS: 综合应用 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const n = Math.floor(Math.random() * 8) + 4
    const sq = n * n
    add({
      levelId: levelId(8, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `√${sq} = ?`,
      answer: n, explanation: `${n}²=${sq}`, xp: 20,
      options: isChoice ? randChoice(n, 3, 4) : undefined,
    })
  }

  return qs
}

// ============== 九年级 (g9) ==============
function makeG9Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 一元二次方程 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const r1 = Math.floor(Math.random() * 6) + 1
    const r2 = Math.floor(Math.random() * 6) + 1
    add({
      levelId: levelId(9, 'L1'), type: 'input',
      knowledgePoint: '一元二次方程', difficulty: 2,
      prompt: `x² - ${r1+r2}x + ${r1*r2} = 0 的一个根是？`,
      answer: r1 < r2 ? r1 : r2, explanation: `两根为${r1}和${r2}`, xp: 15,
    })
  }

  // L2: 二次函数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const h = Math.floor(Math.random() * 5) + 1
    const k = Math.floor(Math.random() * 5) + 1
    add({
      levelId: levelId(9, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '二次函数', difficulty: 2,
      prompt: `y = (x - ${h})² + ${k} 的顶点坐标是？`,
      answer: `(${h},${k})`, explanation: `顶点式直接读出顶点(${h},${k})`, xp: 10,
      options: isChoice ? [`(${h},${k})`, `(${-h},${k})`, `(${h},${-k})`, `(${-h},${-k})`] : undefined,
    })
  }

  // L3: 圆 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const r = Math.floor(Math.random() * 5) + 3
    const ans = +(Math.PI * r * r).toFixed(1)
    add({
      levelId: levelId(9, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '圆', difficulty: 2,
      prompt: `半径为${r}的圆，面积=?π`,
      answer: r * r, explanation: `S=πr²=${r*r}π`, xp: 10,
      options: isChoice ? randChoice(r * r, 10, 4) : undefined,
    })
  }

  // L4: 相似三角形 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const ratio = Math.floor(Math.random() * 4) + 2
    add({
      levelId: levelId(9, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '相似三角形', difficulty: 2,
      prompt: `两个相似三角形相似比为${ratio}，则面积比为？`,
      answer: ratio * ratio, explanation: `面积比=相似比²=${ratio*ratio}`, xp: 10,
      options: isChoice ? randChoice(ratio * ratio, 5, 4) : undefined,
    })
  }

  // L5: 概率初步 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const total = Math.floor(Math.random() * 8) + 4
    const fav = Math.floor(Math.random() * (total - 1)) + 1
    add({
      levelId: levelId(9, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '概率初步', difficulty: 2,
      prompt: `袋中有${total}个球，${fav}个红球，随机取一球为红色的概率=?`,
      answer: `${fav}/${total}`, explanation: `${fav}/${total}`, xp: 10,
      options: isChoice ? [`${fav}/${total}`, `${total-fav}/${total}`, `${fav+1}/${total}`, `${fav-1}/${total}`] : undefined,
    })
  }

  // BOSS: 综合应用 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 5) + 1
    const b = Math.floor(Math.random() * 5) + 1
    const c = Math.floor(Math.random() * 5) + 1
    add({
      levelId: levelId(9, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `x² - ${a+b}x + ${a*b} = 0 的两根之积是？`,
      answer: a * b, explanation: `韦达定理：c/a=${a*b}`, xp: 20,
      options: isChoice ? randChoice(a * b, 3, 4) : undefined,
    })
  }

  return qs
}

// ============== 高一 (g10) ==============
function makeG10Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 集合与逻辑 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const n = Math.floor(Math.random() * 5) + 3
    add({
      levelId: levelId(10, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '集合', difficulty: 2,
      prompt: `集合{1,2,${n}}的子集个数是？`,
      answer: 8, explanation: `3个元素，子集数=2³=8`, xp: 10,
      options: isChoice ? ['4', '6', '8', '10'] : undefined,
    })
  }

  // L2: 指数对数函数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const b = Math.floor(Math.random() * 4) + 2
    const e = Math.floor(Math.random() * 3) + 2
    const ans = Math.pow(b, e)
    add({
      levelId: levelId(10, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '指数函数', difficulty: 2,
      prompt: `${b}^${e} = ?`,
      answer: ans, explanation: `${b}^${e}=${ans}`, xp: 10,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  // L3: 三角函数 (16题)
  const trigValues = [
    { prompt: 'sin30° = ?', answer: '1/2', exp: 'sin30°=1/2', opts: ['1/2', '√2/2', '√3/2', '1'] },
    { prompt: 'sin45° = ?', answer: '√2/2', exp: 'sin45°=√2/2', opts: ['1/2', '√2/2', '√3/2', '1'] },
    { prompt: 'sin60° = ?', answer: '√3/2', exp: 'sin60°=√3/2', opts: ['1/2', '√2/2', '√3/2', '1'] },
    { prompt: 'cos30° = ?', answer: '√3/2', exp: 'cos30°=√3/2', opts: ['1/2', '√2/2', '√3/2', '1'] },
    { prompt: 'cos45° = ?', answer: '√2/2', exp: 'cos45°=√2/2', opts: ['1/2', '√2/2', '√3/2', '1'] },
    { prompt: 'cos60° = ?', answer: '1/2', exp: 'cos60°=1/2', opts: ['1/2', '√2/2', '√3/2', '1'] },
    { prompt: 'tan30° = ?', answer: '√3/3', exp: 'tan30°=√3/3', opts: ['1', '√3/3', '√3', '1/√3'] },
    { prompt: 'tan45° = ?', answer: 1, exp: 'tan45°=1', opts: ['0', '1', '√3', '1/2'] },
    { prompt: 'tan60° = ?', answer: '√3', exp: 'tan60°=√3', opts: ['1', '√3/3', '√3', '2'] },
    { prompt: 'sin0° = ?', answer: 0, exp: 'sin0°=0', opts: ['0', '1/2', '1', '不存在'] },
    { prompt: 'cos0° = ?', answer: 1, exp: 'cos0°=1', opts: ['0', '1/2', '1', '不存在'] },
    { prompt: 'sin90° = ?', answer: 1, exp: 'sin90°=1', opts: ['0', '1/2', '1', '不存在'] },
    { prompt: 'cos90° = ?', answer: 0, exp: 'cos90°=0', opts: ['0', '1/2', '1', '不存在'] },
    { prompt: 'sin²30° + cos²30° = ?', answer: 1, exp: '恒等式=1', opts: ['0', '1/2', '1', '2'] },
    { prompt: 'sin45° + cos45° = ?', answer: '√2', exp: '√2/2+√2/2=√2', opts: ['1', '√2', '√2/2', '2'] },
    { prompt: 'tan60° × tan30° = ?', answer: 1, exp: '√3×√3/3=1', opts: ['1/3', '1', '√3', '3'] },
  ]
  trigValues.forEach((q) => {
    add({
      levelId: levelId(10, 'L3'), type: 'choice',
      knowledgePoint: '三角函数', difficulty: 2,
      prompt: q.prompt, answer: q.answer, explanation: q.exp, xp: 10,
      options: q.opts,
    })
  })

  // L4: 数列 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a1 = Math.floor(Math.random() * 5) + 1
    const d = Math.floor(Math.random() * 4) + 1
    const n = Math.floor(Math.random() * 8) + 3
    const ans = a1 + (n - 1) * d
    add({
      levelId: levelId(10, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '数列', difficulty: 2,
      prompt: `等差数列首项${a1}，公差${d}，第${n}项=?`,
      answer: ans, explanation: `a${n}=${a1}+${n-1}×${d}=${ans}`, xp: 10,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  // L5: 立体几何 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 4) + 2
    add({
      levelId: levelId(10, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '立体几何', difficulty: 2,
      prompt: `棱长为${a}的正方体体积=?`,
      answer: a * a * a, explanation: `${a}³=${a*a*a}`, xp: 10,
      options: isChoice ? randChoice(a * a * a, 5, 4) : undefined,
    })
  }

  // BOSS: 综合 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const b = Math.floor(Math.random() * 3) + 2
    const e = Math.floor(Math.random() * 3) + 2
    const ans = Math.pow(b, e)
    add({
      levelId: levelId(10, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `log_${b}${ans} = ?`,
      answer: e, explanation: `${b}^${e}=${ans}`, xp: 20,
      options: isChoice ? randChoice(e, 2, 4) : undefined,
    })
  }

  return qs
}

// ============== 高二 (g11) ==============
function makeG11Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 直线与圆 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const k = Math.floor(Math.random() * 5) + 1
    const b = Math.floor(Math.random() * 5) + 1
    add({
      levelId: levelId(11, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '直线', difficulty: 2,
      prompt: `直线y=${k}x+${b}的斜率是？`,
      answer: k, explanation: `y=kx+b中，k=${k}`, xp: 10,
      options: isChoice ? randChoice(k, 3, 4) : undefined,
    })
  }

  // L2: 圆锥曲线 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 4) + 3
    const b = Math.floor(Math.random() * 3) + 2
    add({
      levelId: levelId(11, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '椭圆', difficulty: 2,
      prompt: `椭圆x²/${a*a}+y²/${b*b}=1的长半轴长a=?`,
      answer: a, explanation: `a²=${a*a}，a=${a}`, xp: 10,
      options: isChoice ? randChoice(a, 2, 4) : undefined,
    })
  }

  // L3: 平面向量 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const x = Math.floor(Math.random() * 5) + 1
    const y = Math.floor(Math.random() * 5) + 2
    const ans = Math.sqrt(x * x + y * y)
    add({
      levelId: levelId(11, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '平面向量', difficulty: 2,
      prompt: `向量a=(${x},${y})的模|a|=?`,
      answer: ans, explanation: `√(${x}²+${y}²)=${ans}`, xp: 10,
      options: isChoice ? randChoice(Math.round(ans), 3, 4) : undefined,
    })
  }

  // L4: 导数 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const n = Math.floor(Math.random() * 4) + 2
    const x = Math.floor(Math.random() * 3) + 1
    const ans = n * Math.pow(x, n - 1)
    add({
      levelId: levelId(11, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '导数', difficulty: 2,
      prompt: `f(x)=x^${n}，f'(${x})=?`,
      answer: ans, explanation: `f'(x)=${n}x^${n-1}，f'(${x})=${n}×${x}^${n-1}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 3, 4) : undefined,
    })
  }

  // L5: 统计 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 10) + 1
    const b = a + Math.floor(Math.random() * 5) + 2
    add({
      levelId: levelId(11, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '统计', difficulty: 2,
      prompt: `数据${a},${b}的平均数是？`,
      answer: (a + b) / 2, explanation: `(${a}+${b})/2=${(a+b)/2}`, xp: 10,
      options: isChoice ? randChoice((a + b) / 2, 3, 4) : undefined,
    })
  }

  // BOSS: 综合 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const x = Math.floor(Math.random() * 5) + 1
    const y = Math.floor(Math.random() * 5) + 2
    const dot = x * 1 + y * 1
    add({
      levelId: levelId(11, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `向量a=(${x},${y})，b=(1,1)，a·b=?`,
      answer: x + y, explanation: `${x}×1+${y}×1=${x+y}`, xp: 20,
      options: isChoice ? randChoice(x + y, 3, 4) : undefined,
    })
  }

  return qs
}

// ============== 高三 (g12) ==============
function makeG12Questions(): QuestionInput[] {
  const qs: QuestionInput[] = []
  const add = (q: QuestionInput) => qs.push(q)

  // L1: 函数与导数综合 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 4) + 2
    const x = Math.floor(Math.random() * 3) + 1
    add({
      levelId: levelId(12, 'L1'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '导数综合', difficulty: 2,
      prompt: `f(x)=${a}x²，f'(${x})=?`,
      answer: 2 * a * x, explanation: `f'(x)=${2*a}x，f'(${x})=${2*a*x}`, xp: 15,
      options: isChoice ? randChoice(2 * a * x, 3, 4) : undefined,
    })
  }

  // L2: 圆锥曲线综合 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 4) + 3
    const b = Math.floor(Math.random() * 3) + 2
    const c = Math.sqrt(a * a - b * b)
    add({
      levelId: levelId(12, 'L2'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '圆锥曲线综合', difficulty: 2,
      prompt: `椭圆x²/${a*a}+y²/${b*b}=1的焦距2c=?`,
      answer: +(2 * c).toFixed(1), explanation: `c=√(${a*a}-${b*b})≈${c.toFixed(1)}，2c≈${(2*c).toFixed(1)}`, xp: 15,
      options: isChoice ? randChoice(Math.round(2 * c), 2, 4) : undefined,
    })
  }

  // L3: 概率统计综合 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const n = Math.floor(Math.random() * 5) + 4
    const k = Math.floor(Math.random() * (n - 2)) + 2
    add({
      levelId: levelId(12, 'L3'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '概率统计综合', difficulty: 2,
      prompt: `C(${n},${k}) = ?`,
      answer: combination(n, k), explanation: `${n}!/(${k}!${n-k}!)`, xp: 15,
      options: isChoice ? randChoice(combination(n, k), 5, 4) : undefined,
    })
  }

  // L4: 数列综合 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a1 = Math.floor(Math.random() * 3) + 1
    const q = Math.floor(Math.random() * 2) + 2
    const n = Math.floor(Math.random() * 4) + 2
    const ans = a1 * Math.pow(q, n - 1)
    add({
      levelId: levelId(12, 'L4'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '数列综合', difficulty: 2,
      prompt: `等比数列a₁=${a1}，q=${q}，aₙ=?（n=${n}）`,
      answer: ans, explanation: `${a1}×${q}^${n-1}=${ans}`, xp: 15,
      options: isChoice ? randChoice(ans, 5, 4) : undefined,
    })
  }

  // L5: 高考真题 (16题)
  for (let i = 0; i < 16; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 5) + 2
    const x = Math.floor(Math.random() * 3) + 1
    add({
      levelId: levelId(12, 'L5'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '高考真题', difficulty: 2,
      prompt: `f(x)=${a}x³，f'(${x})=?`,
      answer: 3 * a * x * x, explanation: `f'(x)=${3*a}x²，f'(${x})=${3*a*x*x}`, xp: 15,
      options: isChoice ? randChoice(3 * a * x * x, 5, 4) : undefined,
    })
  }

  // BOSS: 综合 (20题)
  for (let i = 0; i < 20; i++) {
    const isChoice = i % 2 === 0
    const a = Math.floor(Math.random() * 4) + 2
    const x = Math.floor(Math.random() * 3) + 1
    add({
      levelId: levelId(12, 'L6_BOSS'), type: isChoice ? 'choice' : 'input',
      knowledgePoint: '综合', difficulty: 3,
      prompt: `f(x)=${a}x²+${a*2}x，f'(${x})=?`,
      answer: 2 * a * x + 2 * a, explanation: `f'(x)=${2*a}x+${2*a}，f'(${x})=${2*a*x+2*a}`, xp: 20,
      options: isChoice ? randChoice(2 * a * x + 2 * a, 5, 4) : undefined,
    })
  }

  return qs
}

// 组合数计算
function combination(n: number, k: number): number {
  if (k > n) return 0
  let result = 1
  for (let i = 1; i <= k; i++) {
    result = result * (n - k + i) / i
  }
  return result
}

// ============== 主函数 ==============

async function main() {
  const dbReady = await initDB()
  if (!dbReady) {
    console.error('[FAIL] 数据库连接失败，请确保 MySQL 已启动')
    process.exit(1)
  }
  console.log('[OK] 数据库连接成功\n')

  const generators: Record<number, () => QuestionInput[]> = {
    1: makeG1Questions,
    2: makeG2Questions,
    3: makeG3Questions,
    4: makeG4Questions,
    5: makeG5Questions,
    6: makeG6Questions,
    7: makeG7Questions,
    8: makeG8Questions,
    9: makeG9Questions,
    10: makeG10Questions,
    11: makeG11Questions,
    12: makeG12Questions,
  }

  let totalSuccess = 0
  let totalFail = 0

  for (let grade = 1; grade <= 12; grade++) {
    const generator = generators[grade]
    const questions = generator()
    
    // 去重
    const seen = new Set<string>()
    const unique = questions.filter(q => {
      const key = `${q.levelId}::${q.prompt}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    console.log(`\n[INFO] 年级 ${grade}：准备导入 ${unique.length} 道题目...`)

    let success = 0
    let fail = 0

    for (let i = 0; i < unique.length; i++) {
      const q = unique[i]
      try {
        await upsertQuestion({
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
        if ((i + 1) % 20 === 0) {
          console.log(`  ...已导入 ${i + 1}/${unique.length}`)
        }
      } catch (err) {
        fail++
        console.error(`  失败: ${q.prompt}`, (err as Error).message)
      }
    }

    console.log(`  年级 ${grade}：成功 ${success} 道，失败 ${fail} 道`)
    totalSuccess += success
    totalFail += fail
  }

  console.log(`\n[OK] 全部导入完成！`)
  console.log(`   总计成功: ${totalSuccess} 道`)
  if (totalFail > 0) console.log(`   总计失败: ${totalFail} 道`)
}

main().catch(console.error)