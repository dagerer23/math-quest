import { Component, PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
// import 'virtual:uno.css'  // 暂时禁用，需要 unocss/taro 插件支持
import '@/styles/global.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  return children
}

export default App
