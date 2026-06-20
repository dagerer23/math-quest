/**
 * 从 Web 端 lucide-react@0.451.0 提取所需图标的 SVG path 数据
 * 生成 platform-taro/src/utils/icon-data.ts，供 Taro 端自研 Icon 组件使用
 * 用法: node scripts/gen-icons.cjs
 */
const fs = require('fs')
const path = require('path')

const iconsDir = path.resolve(__dirname, '../../node_modules/lucide-react/dist/esm/icons')
const outFile = path.resolve(__dirname, '../src/utils/icon-data.ts')

// SemanticKey -> lucide 图标文件名(kebab-case)
// 键名两端一致；多个 SemanticKey 可映射同一 lucide 图标（如 star/starOutline）
const map = {
  trophy: 'trophy',
  fire: 'flame',
  heart: 'heart',
  heartOutline: 'heart',
  coin: 'coins',
  diamond: 'gem',
  star: 'star',
  starOutline: 'star',
  lock: 'lock',
  goal: 'goal',
  book: 'book-open',
  home: 'house',
  user: 'user',
  users: 'users',
  check: 'check',
  checkCircle: 'circle-check',
  x: 'x',
  xCircle: 'circle-x',
  arrowRight: 'arrow-right',
  arrowLeft: 'arrow-left',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  plus: 'plus',
  minus: 'minus',
  gift: 'gift',
  calendar: 'calendar',
  clock: 'clock',
  alarm: 'alarm-clock',
  question: 'circle-help',
  warning: 'triangle-alert',
  chart: 'chart-no-axes-column-increasing',
  pencil: 'pencil',
  trash: 'trash-2',
  refresh: 'rotate-cw',
  settings: 'settings',
  soundOn: 'volume-2',
  soundOff: 'volume-x',
  vibrateOn: 'vibrate',
  vibrateOff: 'vibrate-off',
  download: 'download',
  logout: 'log-out',
  edit: 'pencil',
  crown: 'crown',
  sparkles: 'sparkles',
  lightning: 'zap',
  construction: 'construction',
  search: 'search',
  gamepad: 'gamepad-2',
  hourglass: 'hourglass',
  clipboard: 'clipboard',
  ruler: 'ruler',
  scale: 'scale',
  triangle: 'triangle',
  square: 'square',
  circle: 'circle',
  package: 'package',
  car: 'car',
  bird: 'bird',
  banknote: 'banknote',
  apple: 'apple',
  candy: 'candy',
  banana: 'banana',
  pie: 'chart-pie',
  sword: 'swords',
  rocket: 'rocket',
  brain: 'brain',
  palette: 'palette',
  muscle: 'dumbbell',
  backpack: 'backpack',
  memo: 'file-text',
  party: 'party-popper',
  flower: 'flower-2',
  globe: 'earth',
  shield: 'shield',
  medal: 'award',
  ghost: 'ghost',
  citrus: 'citrus',
  glassWater: 'glass-water',
  drumstick: 'drumstick',
  cat: 'cat',
  panda: 'paw-print',
  pizza: 'pizza',
  ribbon: 'ribbon',
  lightbulb: 'lightbulb',
  frown: 'frown',
  divide: 'divide',
  hash: 'hash',
  cloud: 'cloud',
  delete: 'delete',
}

function extractChildren(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const m = content.match(/createLucideIcon\(["'][^"']+["'],\s*(\[[\s\S]*?\])\s*\)/)
  if (!m) return null
  try {
    return new Function('return ' + m[1])()
  } catch (e) {
    return null
  }
}

const result = {}
const missing = []
const failed = []

for (const [key, file] of Object.entries(map)) {
  const fp = path.join(iconsDir, file + '.js')
  if (!fs.existsSync(fp)) {
    missing.push(`${key} -> ${file}.js`)
    continue
  }
  const children = extractChildren(fp)
  if (!children) {
    failed.push(`${key} -> ${file}.js (提取失败)`)
    continue
  }
  result[key] = children
}

let ts = `// 自动生成，请勿手动编辑\n// 数据源: lucide-react@0.451.0 (ISC)\n\n`
ts += `export interface IconNode { tag: string; attrs: Record<string, string> }\n\n`
ts += `export const iconData: Record<string, IconNode[]> = {\n`
for (const [key, children] of Object.entries(result)) {
  const clean = children.map(([tag, attrs]) => {
    const { key: _k, ...rest } = attrs
    return { tag, attrs: rest }
  })
  ts += `  ${JSON.stringify(key)}: ${JSON.stringify(clean)},\n`
}
ts += `}\n`

fs.writeFileSync(outFile, ts)

console.log(`生成完成: ${Object.keys(result).length} 个图标 -> ${path.relative(path.resolve(__dirname, '..'), outFile)}`)
if (missing.length) console.log('缺失文件:\n' + missing.join('\n'))
if (failed.length) console.log('提取失败:\n' + failed.join('\n'))
if (!missing.length && !failed.length) console.log('全部图标提取成功')
