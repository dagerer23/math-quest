import { useEffect } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function BattlePage() {
  useEffect(() => {
    // Battle page is just an alias for assessment
    Taro.redirectTo({ url: '/pages/assessment/index' })
  }, [])
  return <View />
}
