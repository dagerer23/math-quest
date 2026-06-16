import { Component, PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import '@/styles/global.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  return children
}

export default App
