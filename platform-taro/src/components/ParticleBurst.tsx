import { useEffect, useMemo, useState } from 'react'
import { View } from '@tarojs/components'

interface Props {
  trigger: number
  color?: string
}

// 答对粒子特效组件（Taro 端，用 CSS 动画近似 framer-motion 的径向爆发）
// 粒子数量 / 大小 / 颜色 / 轨迹对齐 Web 端 ParticleBurst
const COUNT = 14

export default function ParticleBurst({ trigger, color = '#FFD23F' }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger > 0) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 900)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  // 每个 trigger 生成一组稳定的粒子轨迹（对齐 Web 端：14 个，半径 80~130）
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }).map((_, i) => {
      const angle = (i / COUNT) * Math.PI * 2
      const dist = 80 + Math.random() * 50
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      }
    })
  }, [trigger])

  if (!show || !trigger) return null

  return (
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 20,
    }}>
      {particles.map((p, i) => (
        <View
          key={`${trigger}-${i}`}
          className="taro-burst"
          // 用 CSS 变量把每个粒子的终点坐标传给 keyframe（小程序支持 CSS 自定义属性）
          style={`--tx:${p.x}px;--ty:${p.y}px;position:absolute;left:50%;top:50%;margin-left:-5px;margin-top:-5px;width:10px;height:10px;border-radius:2px;background:${color};box-shadow:0 0 12px ${color};`}
        />
      ))}
    </View>
  )
}
