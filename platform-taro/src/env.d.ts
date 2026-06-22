/**
 * 运行时环境变量类型声明
 *
 * Taro 编译期会通过 webpack DefinePlugin 把 process.env.XXX 替换为字面量，
 * 因此小程序运行时即使没有 process 对象也能正常工作。
 * 此文件仅为 TypeScript 类型检查提供声明。
 */
declare const process: {
  env: {
    NODE_ENV?: string
    TARO_ENV?: string
    /** 本机局域网IP，构建时自动获取，供真机预览使用 */
    MQ_LAN_HOST?: string
    /** 阿里云服务器公网IP，生产部署时通过环境变量注入 */
    MQ_PROD_HOST?: string
    /** 后端服务端口 */
    MQ_SERVER_PORT?: string
    [key: string]: string | undefined
  }
}

/** 微信小程序全局对象 */
declare const wx: any
