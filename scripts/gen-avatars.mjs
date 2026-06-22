/**
 * DiceBear 头像预生成脚本（ESM）
 * 使用 @dicebear/core 生成 SVG，再用 sharp 转为 PNG
 * 输出 15 个 Lorelei 头像 PNG 到 platform-taro/src/assets/avatars/
 * 运行方式：node scripts/gen-avatars.mjs
 */
import { Style, Avatar } from '@dicebear/core'
import lorelei from '@dicebear/styles/lorelei.json' with { type: 'json' }
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const AVATAR_SEEDS = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia']

const AVATAR_COLORS = [
  'E8F9D8', 'E0F4FF', 'FFF5D6', 'FFE4E4', 'F3E8FF', 'F3F4F6',
]

function getColorIndex(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

// 输出到 Taro 项目的 assets 目录
const outputDir = path.resolve(__dirname, '../platform-taro/src/assets/avatars')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function main() {
  console.log('开始生成 DiceBear 头像 PNG...')
  console.log('输出目录:', outputDir)

  // 禁用胡子：将 beard 组件概率设为 0
  const styleData = JSON.parse(JSON.stringify(lorelei))
  if (styleData.components?.beard) {
    styleData.components.beard.probability = 0
  }
  const loreleiStyle = new Style(styleData)

  for (const seed of AVATAR_SEEDS) {
    const colorBg = AVATAR_COLORS[getColorIndex(seed)]
    const avatar = new Avatar(loreleiStyle, {
      seed: seed,
      backgroundColor: [colorBg],
    })
    const svg = avatar.toString()

    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(200, 200)
      .png()
      .toBuffer()

    const pngPath = path.join(outputDir, `${seed}.png`)
    fs.writeFileSync(pngPath, pngBuffer)
    console.log(`  生成: ${seed}.png (${pngBuffer.length} bytes)`)
  }

  console.log(`\n完成！共生成 ${AVATAR_SEEDS.length} 个头像到 ${outputDir}`)
}

main().catch((err) => {
  console.error('生成失败:', err)
  process.exit(1)
})
