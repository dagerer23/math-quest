const path = require('path')

const config = {
  projectName: 'math-quest-taro',
  date: '2026-6-16',
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2 / 1
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  alias: {
    '@': path.resolve(__dirname, '../src')
  },
  framework: 'react',
  compiler: 'webpack5',
  plugins: [
    '@tarojs/plugin-platform-h5',
    '@tarojs/plugin-platform-weapp',
    'unocss/taro',
  ],
  mini: {
    compile: {
      include: [
        (modulePath) => modulePath.startsWith(path.resolve(__dirname, '../src'))
      ]
    }
  },
  h5: {
    esnextModules: ['zustand'],
    router: {
      mode: 'hash'
    },
    outputRoot: 'dist-h5',
    htmlPluginOption: {
      template: path.resolve(__dirname, '../public/index.html')
    },
    chain: (chain: any) => {
      chain.plugin('html').tap((args: any[]) => {
        args[0].template = path.resolve(__dirname, '../public/index.html')
        return args
      })
    }
  }
}

module.exports = config
