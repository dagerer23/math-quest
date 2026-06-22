const path = require('path')
const os = require('os')
const webpack = require('webpack')

/**
 * 自动获取本机局域网 IPv4 地址（用于真机预览时小程序访问本机后端）
 * 遍历所有网卡，取第一个非内部回环的 IPv4 地址
 */
function getLocalIP(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

// 后端服务端口
const SERVER_PORT = process.env.MQ_SERVER_PORT || '3001'
// 本地局域网IP：构建时自动获取本机IP，也可通过 MQ_LAN_HOST 环境变量手动覆盖
const LAN_HOST = process.env.MQ_LAN_HOST || getLocalIP()
// 阿里云服务器公网IP：生产部署时通过 MQ_PROD_HOST 环境变量注入，无需改动代码
const PROD_HOST = process.env.MQ_PROD_HOST || ''

/**
 * 把环境变量通过 DefinePlugin 注入到运行时代码中
 * Taro 编译期会把 process.env.XXX 替换为字面量，小程序运行时无需 process 对象
 */
function injectEnv(chain: any) {
  chain
    .plugin('mq-env-define')
    .use(webpack.DefinePlugin, [
      {
        'process.env.MQ_LAN_HOST': JSON.stringify(LAN_HOST),
        'process.env.MQ_PROD_HOST': JSON.stringify(PROD_HOST),
        'process.env.MQ_SERVER_PORT': JSON.stringify(SERVER_PORT)
      }
    ])
}

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
  outputRoot: path.resolve(__dirname, '../../dist-webapp'),
  alias: {
    '@': path.resolve(__dirname, '../src')
  },
  framework: 'react',
  compiler: 'webpack5',
  plugins: [
    '@tarojs/plugin-platform-h5',
    '@tarojs/plugin-platform-weapp',
    // 'unocss/taro',  // 暂时禁用，unocss/taro 子路径不可用
  ],
  mini: {
    compile: {
      include: [
        (modulePath: string) => modulePath.startsWith(path.resolve(__dirname, '../src'))
      ]
    },
    webpackChain: (chain: any) => injectEnv(chain)
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
    },
    webpackChain: (chain: any) => injectEnv(chain)
  }
}

module.exports = config
