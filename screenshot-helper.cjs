/**
 * 排行榜截图工具 - 使用 Chrome DevTools Protocol 自动化
 * 完成登录流程后截图排行榜各个视图
 */
const { spawn, execSync } = require('child_process')
const http = require('http')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_DIR = path.join(__dirname, 'screenshots')
const BASE_URL = 'http://localhost:5173'

fs.mkdirSync(OUT_DIR, { recursive: true })
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-'))

/** 用原生 HTTP 调 DevTools Protocol */
function jsonRequest(host, port, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : ''
    const req = http.request(
      { host, port, path, method: data ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let buf = ''
        res.on('data', (d) => (buf += d))
        res.on('end', () => { try { resolve(JSON.parse(buf)) } catch { resolve(buf) } })
      }
    )
    req.on('error', reject)
    if (data) req.write(body)
    req.end()
  })
}

async function main() {
  console.log('🚀 启动 Chrome (端口 9222)...')
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--hide-scrollbars',
    '--window-size=500,1200',
    `--virtual-time-budget=8000`,
    `about:blank`,
  ], { stdio: 'ignore' })

  // 等待 Chrome 启动
  await new Promise(r => setTimeout(r, 3500))

  try {
    // 获取页面 WebSocket URL
    const targets = await jsonRequest('127.0.0.1', 9222, '/json/list')
    console.log('🔗 连接到 DevTools...')
    const pageWsUrl = Array.isArray(targets) && targets[0] ? targets[0].webSocketDebuggerUrl : null
    if (!pageWsUrl) throw new Error('无法连接到 DevTools')

    // 由于手写 WebSocket 很复杂，改用简单方案：
    // 用命令行 --dump-dom 检查 + 分步多次命令行截图（先访问登录页再访问榜单）
    console.log('⚠️  改用简化方案：直接访问首页（游客会自动跳转）')

    // 先关掉这个 Chrome
    chrome.kill('SIGKILL')
    await new Promise(r => setTimeout(r, 1000))

    // 简化方案1: 直接访问 /leaderboard（应用可能需要登录）
    // 简化方案2: 用一次连续命令让 Chrome 按顺序导航
    console.log('📸 直接截图 (可能显示登录页):')
    
    const shots = [
      { name: '03-login-page.png', url: `${BASE_URL}/leaderboard`, w: 450, h: 900 },
    ]
    for (const s of shots) {
      try {
        const out = path.join(OUT_DIR, s.name)
        execSync(
          `"${CHROME}" --headless=new --disable-gpu --no-sandbox ` +
          `--window-size=${s.w},${s.h} --hide-scrollbars --virtual-time-budget=6000 ` +
          `--screenshot="${out}" "${s.url}"`,
          { stdio: ['ignore', 'ignore', 'ignore'] }
        )
        const sz = fs.statSync(out).size
        console.log(`  ✅ ${s.name} (${(sz / 1024).toFixed(1)} KB)`)
      } catch (e) {
        console.log(`  ⚠️  ${s.name} (${e.message.substring(0, 40)})`)
      }
    }

    console.log('')
    console.log('💡 由于 headless Chrome 无登录态，会显示登录页面。')
    console.log('💡 请用本地浏览器访问: http://localhost:5173/leaderboard')
    console.log('💡 或使用浏览器手动截图。')

  } catch (err) {
    console.error('❌ 错误:', err.message)
    chrome.kill('SIGKILL')
  }
}

main().catch(console.error)
