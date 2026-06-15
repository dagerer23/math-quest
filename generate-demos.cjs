/**
 * 前端真机演示截图脚本
 * 1. 启动 Vite dev server
 * 2. 使用 headless Chrome 访问各页面
 * 3. 注入用户状态跳过登录
 * 4. 生成每个核心页面的 PNG 截图
 */
const { spawn, execSync } = require('child_process')
const http = require('http')
const WebSocket = require('ws')
const path = require('path')
const fs = require('fs')
const os = require('os')

const ROOT = __dirname
const NODE = path.join(ROOT, '.node', 'bin', 'node')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_DIR = path.join(ROOT, 'public', 'demo')
const BASE_URL = 'http://localhost:5174'

fs.mkdirSync(OUT_DIR, { recursive: true })

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function testPort(port) {
  return new Promise(resolve => {
    const req = http.get(`http://127.0.0.1:${port}`, { timeout: 1000 }, () => resolve(true))
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

// ============ Dev Server ============
let vite = null
function startDevServer() {
  return new Promise(async (resolve) => {
    console.log('🚀 启动 Vite dev server (端口 5174)...')
    vite = spawn(NODE, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '5174', '--host'], {
      cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PATH: process.env.PATH }
    })
    let started = false
    const check = async () => {
      if (started) return
      const ok = await testPort(5174)
      if (ok) {
        started = true
        console.log('   ✅ Vite server ready')
        resolve()
      } else {
        setTimeout(check, 500)
      }
    }
    setTimeout(check, 1500)
  })
}

function stopDevServer() {
  if (vite) { try { process.kill(vite.pid, 'SIGKILL') } catch(e) {} }
}

// ============ Chrome DevTools ============
let chrome = null
let ws = null
let cdpId = 0

async function startChrome() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mq-chrome-'))
  console.log('🌐 启动 headless Chrome...')
  chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=9223',
    '--remote-debugging-address=127.0.0.1',
    '--hide-scrollbars',
    '--window-size=420,900',
    'about:blank'
  ], { stdio: 'ignore' })
  await sleep(3500)

  // 获取新页面
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 9223, path: '/json/new', method: 'PUT' }, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try {
          const page = JSON.parse(data)
          ws = new WebSocket(page.webSocketDebuggerUrl)
          ws.on('open', async () => {
            await cdp('Page.enable')
            await cdp('Runtime.enable')
            await cdp('DOM.enable')
            await cdp('Page.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 2, mobile: true, fitWindow: false })
            console.log('   ✅ Chrome ready')
            resolve()
          })
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    cdpId++
    const id = cdpId
    const timeout = setTimeout(() => reject(new Error('timeout: ' + method)), 15000)
    const handler = (msg) => {
      const data = JSON.parse(msg.toString())
      if (data.id === id) {
        clearTimeout(timeout)
        ws.removeListener('message', handler)
        if (data.error) reject(data.error)
        else resolve(data.result)
      }
    }
    ws.on('message', handler)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

function stopChrome() {
  if (ws) try { ws.close() } catch(e) {}
  if (chrome) try { chrome.kill('SIGKILL') } catch(e) {}
}

// ============ 注入用户状态 ============
async function injectUserState(grade = 2, theme) {
  const bg = theme?.bg || '#FBF4F0'
  const accent = theme?.accent || '#E0896E'
  const accentSoft = theme?.accentSoft || '#F8E2D9'

  const state = {
    state: {
      isLoggedIn: true,
      profile: {
        avatar: '🧒',
        nickname: '数学小达人',
        learningStage: 'primary',
        learningGoal: 'consolidation',
        targetGrade: grade,
        phone: '13800000000'
      },
      grade: grade,
      xp: 2680,
      coins: 150,
      diamonds: 12,
      hearts: 5,
      maxHearts: 5,
      streak: 7,
      comboMax: 15,
      rank: '黄金',
      unlockedLevels: ['lvl-1', 'lvl-2', 'lvl-3', 'lvl-4', 'lvl-5'],
      completedLevels: {
        'lvl-1': { stars: 3, completedAt: Date.now() - 86400000 },
        'lvl-2': { stars: 2, completedAt: Date.now() - 43200000 },
        'lvl-3': { stars: 3, completedAt: Date.now() - 21600000 }
      },
      mistakeIds: ['q-mistake-1', 'q-mistake-2', 'q-mistake-3'],
      mistakeMastery: {},
      achievements: [
        { id: 'first-correct', unlockedAt: Date.now() - 604800000 },
        { id: 'streak-3', unlockedAt: Date.now() - 500000000 },
        { id: 'level-10', unlockedAt: Date.now() - 300000000 }
      ],
      settings: { sound: true, vibration: true },
      lastActiveDate: '2025-06-16',
      dailyGoals: [
        { id: 'questions', target: 30, current: 18, reward: '20 金币' },
        { id: 'levels', target: 2, current: 1, reward: '1 钻石' },
        { id: 'combo', target: 5, current: 3, reward: '10 XP' }
      ],
      dailyGoalDate: '2025-06-16',
      dailyXp: 180,
      dailyQuestions: 18,
      inventory: [],
      treasureBoxes: [],
      learningStats: {
        totalQuestions: 486,
        correctQuestions: 412,
        totalDays: 14,
        weeklyStreak: 7,
        knowledgeProgress: {
          'addition': 0.85,
          'subtraction': 0.72,
          'multiplication': 0.65,
          'division': 0.45,
          'fractions': 0.30
        }
      },
      hasCompletedOnboarding: true,
      userId: 'demo-user-001',
      assessment: {
        id: 'demo-assessment-001',
        completedAt: Date.now(),
        score: 85,
        recommendedDifficulty: grade,
        answers: []
      },
      systemConfigs: {
        'combo.show_threshold': 3,
        'combo.sound_threshold': 5,
        'heart.recover_minutes': 30
      }
    },
    version: 0
  }

  await cdp('Runtime.evaluate', {
    expression: `
      localStorage.setItem('mathquest.user.v1', ${JSON.stringify(JSON.stringify(state))});
      localStorage.setItem('auth_token', 'demo-token');
      document.body.style.backgroundColor = ${JSON.stringify(bg)};
      'injected';
    `
  })
  await sleep(800)
}

// ============ 截图 ============
async function capture(pathname, outputName, waitMs = 3500, clickSteps = []) {
  console.log(`📸 ${outputName} (${pathname})...`)
  await cdp('Page.navigate', { url: BASE_URL + pathname })
  await sleep(waitMs)

  for (const step of clickSteps) {
    await cdp('Runtime.evaluate', { expression: step.js })
    await sleep(step.wait || 1200)
  }

  // 获取页面实际高度
  let result
  try {
    result = await cdp('Runtime.evaluate', { expression: 'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 900)' })
  } catch(e) { result = { value: 900 } }
  const height = Math.min(result?.value || 900, 1400)

  await cdp('Page.setDeviceMetricsOverride', {
    width: 420, height: height, deviceScaleFactor: 2, mobile: true, fitWindow: false
  })
  await sleep(500)

  const shot = await cdp('Page.captureScreenshot', { format: 'png' })
  const outPath = path.join(OUT_DIR, outputName)
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
  const kb = (shot.data.length / 1024).toFixed(0)
  console.log(`   ✅ ${kb} KB`)

  // 恢复默认尺寸
  await cdp('Page.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 2, mobile: true, fitWindow: false })
}

// ============ 主题配色 ============
const THEMES = {
  1: { bg: '#F0F7F5', accent: '#4A9E8A', accentSoft: '#D8ECE5' },
  2: { bg: '#FBF4F0', accent: '#E0896E', accentSoft: '#F8E2D9' },
  3: { bg: '#F3F0F7', accent: '#8B7AB8', accentSoft: '#E3DDEF' }
}

// ============ Main ============
async function main() {
  try {
    await startDevServer()
    await startChrome()

    // ===== 首页地图 (二年级主题) =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/', '01-home-map.png', 4000)

    // ===== 答题战斗页 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/battle/lvl-4', '02-battle-page.png', 4500)

    // ===== 结算结果页 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/result/lvl-3', '03-result-page.png', 4000)

    // ===== 排行榜 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/leaderboard', '04-leaderboard.png', 4000)

    // ===== 错题本 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/mistakes', '05-mistakes.png', 4000)

    // ===== 个人中心 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/profile', '06-profile.png', 4000)

    // ===== 每日目标 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/daily-goals', '07-daily-goals.png', 4000)

    // ===== 学习统计 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/stats', '08-stats.png', 4000)

    // ===== 登录页 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    // 清除状态以显示登录页
    await cdp('Runtime.evaluate', { expression: `localStorage.clear(); 'cleared'` })
    await sleep(500)
    await capture('/login', '09-login-page.png', 3500)

    // ===== 能力测评 =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    await injectUserState(2, THEMES[2])
    await capture('/assessment', '10-assessment.png', 4000)

    console.log('\n━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 全部截图完成！保存位置: ' + OUT_DIR)
    const files = fs.readdirSync(OUT_DIR).sort()
    for (const f of files) {
      const size = fs.statSync(path.join(OUT_DIR, f)).size
      console.log(`   ${f} (${(size / 1024).toFixed(1)} KB)`)
    }

  } catch (err) {
    console.error('❌ 错误:', err.message)
    process.exit(1)
  } finally {
    stopChrome()
    stopDevServer()
    process.exit(0)
  }
}

process.on('SIGINT', () => { stopChrome(); stopDevServer(); process.exit(0) })
main()
