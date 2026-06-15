/**
 * 通过 Chrome DevTools Protocol 自动化：登录 → 完成引导 → 截图排行榜
 */
const { spawn } = require('child_process')
const http = require('http')
const WebSocket = require('ws')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_DIR = path.join(__dirname, 'screenshots')
const BASE_URL = 'http://localhost:5173'

fs.mkdirSync(OUT_DIR, { recursive: true })
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-'))

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function cdpGet() {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 9222, path: '/json/new', method: 'PUT' }, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    req.end()
  })
}

let cmdId = 0
function cdpCmd(ws, method, params = {}) {
  cmdId++
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout: ' + method)), 15000)
    const handler = (msg) => {
      const data = JSON.parse(msg.toString())
      if (data.id === cmdId) {
        clearTimeout(timeout)
        ws.removeListener('message', handler)
        if (data.error) reject(data.error)
        else resolve(data.result)
      }
    }
    ws.on('message', handler)
    ws.send(JSON.stringify({ id: cmdId, method, params }))
  })
}

async function main() {
  console.log('🚀 启动 Chrome...')
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--hide-scrollbars',
    '--window-size=500,1200',
    'about:blank',
  ], { stdio: 'ignore' })

  await sleep(4000)

  try {
    // 创建新页面
    const page = await cdpGet()
    const ws = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((r) => ws.on('open', r))
    console.log('✅ 已连接到 DevTools')

    // 启用必要的域
    await cdpCmd(ws, 'Page.enable')
    await cdpCmd(ws, 'Runtime.enable')
    await cdpCmd(ws, 'DOM.enable')

    // 直接访问页面后注入用户状态
    console.log('📄 访问首页...')
    await cdpCmd(ws, 'Page.navigate', { url: BASE_URL + '/' })
    await sleep(2500)

    // 注入 Zustand state 模拟已登录 + 完成 onboarding + 完成测评 的用户
    console.log('🔐 注入用户状态 (跳过登录/onboarding)...')
    await cdpCmd(ws, 'Runtime.evaluate', {
      expression: `
        (function() {
          var userState = {
            state: {
              isLoggedIn: true,
              profile: {
                avatar: '🧒',
                nickname: '排行榜达人',
                learningStage: 'primary',
                learningGoal: 'consolidation',
                targetGrade: 3,
                phone: '13800000000'
              },
              grade: 3,
              xp: 2680,
              coins: 150,
              diamonds: 12,
              hearts: 5,
              maxHearts: 5,
              streak: 7,
              comboMax: 15,
              rank: '黄金',
              unlockedLevels: [],
              completedLevels: {},
              mistakeIds: [],
              mistakeMastery: {},
              achievements: [],
              settings: { sound: true, vibration: true },
              lastActiveDate: '2025-06-13',
              dailyGoals: [],
              inventory: [],
              treasureBoxes: [],
              learningStats: { totalQuestions: 0, correctQuestions: 0, totalDays: 0, weeklyStreak: 0, knowledgeProgress: {} },
              hasCompletedOnboarding: true,
              userId: 'demo-user-001',
              assessment: {
                id: 'demo-assessment-001',
                completedAt: Date.now(),
                score: 85,
                recommendedDifficulty: 2,
                answers: []
              }
            },
            version: 0
          };
          localStorage.setItem('mathquest.user.v1', JSON.stringify(userState));
          localStorage.setItem('auth_token', 'demo-token');
          console.log('State injected');
          return 'injected';
        })()
      `,
    })
    await sleep(1500)

    console.log('🏆 导航到排行榜...')
    await cdpCmd(ws, 'Page.navigate', { url: BASE_URL + '/leaderboard' })
    await sleep(3500)

    // 截图1: 默认视图 (好友榜)
    console.log('📸 截图 1 - 好友榜...')
    const shot1 = await cdpCmd(ws, 'Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(OUT_DIR, '01-leaderboard-friends.png'), Buffer.from(shot1.data, 'base64'))
    console.log('   ✅ (大小: ' + (shot1.data.length / 1024).toFixed(0) + ' KB)')

    // 截图2: 全国榜
    console.log('📸 截图 2 - 全国榜...')
    await cdpCmd(ws, 'Runtime.evaluate', {
      expression: `
        (function() {
          const btns = document.querySelectorAll('button');
          for (let b of btns) {
            if (b.textContent.includes('全国')) { b.click(); return 'clicked'; }
          }
          return 'not-found';
        })()
      `,
    })
    await sleep(1500)
    const shot2 = await cdpCmd(ws, 'Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(OUT_DIR, '02-leaderboard-national.png'), Buffer.from(shot2.data, 'base64'))
    console.log('   ✅ (大小: ' + (shot2.data.length / 1024).toFixed(0) + ' KB)')

    // 截图3: 段位说明
    console.log('📸 截图 3 - 段位说明...')
    await cdpCmd(ws, 'Runtime.evaluate', {
      expression: `
        (function() {
          const btns = document.querySelectorAll('button');
          for (let b of btns) {
            if (b.textContent.includes('段位')) { b.click(); return 'clicked'; }
          }
          return 'not-found';
        })()
      `,
    })
    await sleep(1500)
    const shot3 = await cdpCmd(ws, 'Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(OUT_DIR, '03-leaderboard-rank.png'), Buffer.from(shot3.data, 'base64'))
    console.log('   ✅ (大小: ' + (shot3.data.length / 1024).toFixed(0) + ' KB)')

    // 截图4: 高分辨率 (全页面)
    console.log('📸 截图 4 - 整页高分辨率...')
    const layout = await cdpCmd(ws, 'Page.getLayoutMetrics')
    const contentHeight = layout.contentSize.height
    const contentWidth = layout.contentSize.width
    await cdpCmd(ws, 'Emulation.setDeviceMetricsOverride', {
      width: contentWidth,
      height: contentHeight,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(1000)
    const shot4 = await cdpCmd(ws, 'Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(OUT_DIR, '04-leaderboard-high-res.png'), Buffer.from(shot4.data, 'base64'))
    console.log('   ✅ (大小: ' + (shot4.data.length / 1024).toFixed(0) + ' KB, 分辨率: ' + contentWidth + 'x' + contentHeight + ')')

    ws.close()
    chrome.kill('SIGKILL')

    console.log('')
    console.log('🎉 全部截图完成！保存在 screenshots/ 目录')
  } catch (err) {
    console.error('❌ 错误:', err)
    try { chrome.kill('SIGKILL') } catch(e) {}
  }
}

main().catch(console.error)
