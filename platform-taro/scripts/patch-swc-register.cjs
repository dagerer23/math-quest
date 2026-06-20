const fs = require('fs')
const path = require('path')

// @swc/register@0.1.10 passes a `cwd` field to swc.transformSync, which
// @swc/core@1.3.96 (pinned by @tarojs/helper@4.2.0) rejects with
// "unknown field `cwd`", breaking Taro config loading. Strip it before
// the swc call. Idempotent: safe to run on every install.
const file = path.resolve(__dirname, '../node_modules/@swc/register/lib/node.js')
if (!fs.existsSync(file)) {
  console.log('[patch-swc-register] target not found, skipping')
  process.exit(0)
}
let src = fs.readFileSync(file, 'utf8')
const needle = '    delete opts.only;\n    delete opts.ignore;'
if (src.includes('delete opts.cwd;')) {
  console.log('[patch-swc-register] already patched')
  process.exit(0)
}
if (!src.includes(needle)) {
  console.error('[patch-swc-register] could not find anchor; file changed?')
  process.exit(1)
}
src = src.replace(needle, needle + '\n    delete opts.cwd;')
fs.writeFileSync(file, src)
console.log('[patch-swc-register] patched @swc/register to drop cwd')
