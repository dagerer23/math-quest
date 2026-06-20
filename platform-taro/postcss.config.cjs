// platform-taro 独立的 postcss 配置
// 覆盖根目录的 postcss.config.cjs（该文件引用了 platform-taro 未安装的 tailwindcss）
// global.css 为纯 CSS，无需额外 postcss 插件
module.exports = {
  plugins: {}
}
