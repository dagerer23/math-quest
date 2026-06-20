// 关卡连接线（Canvas 2D 贝塞尔曲线，对齐 Web 端 SVG path）
// 小程序不支持 SVG，用单个 Canvas 一次性绘制所有曲线，性能优于多段 rotated View
import { useEffect } from 'react'
import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { NodePos } from './helpers'

export interface PathSegment {
  from: NodePos
  to: NodePos
  isCompleted: boolean
}

interface PathsCanvasProps {
  paths: PathSegment[]
  width: number
  height: number
  pathColor: string
  pathActive: string
}

export function PathsCanvas({ paths, width, height, pathColor, pathActive }: PathsCanvasProps) {
  const canvasId = 'level-paths-canvas'

  useEffect(() => {
    if (paths.length === 0 || width <= 0 || height <= 0) return

    const query = Taro.createSelectorQuery()
    query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = Taro.getSystemInfoSync().pixelRatio || 1
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, res[0].width, res[0].height)

      paths.forEach((p) => {
        // 三次贝塞尔曲线控制点（对齐 Web 端 PathConnector 逻辑）
        const midY = (p.from.y + p.to.y) / 2
        const controlOffsetY = (p.to.y - p.from.y) * 0.15
        const cp1 = { x: p.from.x, y: midY - controlOffsetY }
        const cp2 = { x: p.to.x, y: midY + controlOffsetY }

        ctx.beginPath()
        ctx.moveTo(p.from.x, p.from.y)
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p.to.x, p.to.y)
        ctx.strokeStyle = p.isCompleted ? pathActive : pathColor
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.setLineDash(p.isCompleted ? [] : [4, 6])
        ctx.globalAlpha = p.isCompleted ? 1 : 0.7
        ctx.stroke()
      })
    })
  }, [paths, width, height, pathColor, pathActive])

  return (
    <Canvas
      type="2d"
      id={canvasId}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  )
}
