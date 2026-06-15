/**
 * 排行榜截图脚本 - 通过 Chrome DevTools Protocol 截图不同视图
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const OUT_DIR = path.join(__dirname, 'screenshots')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE_URL = 'http://localhost:5173/leaderboard'

function shot(filename, width, height) {
  const out = path.join(OUT_DIR, filename)
  try {
    execSync(
      `"${CHROME}" --headless=new --disable-gpu --no-sandbox --window-size=${width},${height} ` +
      `--hide-scrollbars --virtual-time-budget=5000 --screenshot="${out}" "${BASE_URL}" 2>&1`,
      { stdio: ['ignore', 'pipe', 'pipe'] }
    )
    const size = fs.statSync(out).size
    console.log(`  ✅ ${filename} (${(size / 1024).toFixed(1)} KB)`)
  } catch (e) {
    // 忽略非致命错误
    if (fs.existsSync(out)) {
      const size = fs.statSync(out).size
      console.log(`  ✅ ${filename} (${(size / 1024).toFixed(1)} KB)`)
    } else {
      console.log(`  ❌ ${filename} 失败`)
    }
  }
}

console.log('📸 开始截取排行榜页面...')
console.log('')
shot('01-leaderboard-mobile-450x900.png', 450, 900)
shot('02-leaderboard-mobile-full-450x1200.png', 450, 1200)
shot('03-leaderboard-tablet-768x1200.png', 768, 1200)
shot('04-leaderboard-desktop-1280x900.png', 1280, 900)
console.log('')
console.log('🎉 截图完成！保存在: screenshots/ 目录')
