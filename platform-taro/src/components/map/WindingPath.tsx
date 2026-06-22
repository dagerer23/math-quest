import { useEffect } from 'react'
import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PathSegment } from './layout'
import { MAP, COLORS } from './constants'

interface WindingPathProps {
  segments: PathSegment[]
  /** 容器总高度，用于 Canvas 画布尺寸 */
  height: number
  /** 画布宽度（与 MAP.W 一致），用具体像素值确保小程序 Canvas 尺寸正确 */
  width?: number
}

const CANVAS_ID = 'winding-path-canvas'

/**
 * 蜿蜒路径（Canvas 贝塞尔曲线，多邻国式 S 型立体管道）
 * 从上一关圆圈底部边缘出发，连接到下一关圆圈顶部边缘
 * 三层绘制：深色边缘 + 主色 + 中心高光，形成立体管道质感
 */
export function WindingPath({ segments, height, width = MAP.W }: WindingPathProps) {
  useEffect(() => {
    if (segments.length === 0 || height <= 0) return

    const query = Taro.createSelectorQuery()
    query.select(`#${CANVAS_ID}`).fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = Taro.getSystemInfoSync().pixelRatio || 1
      // 用传入的具体尺寸，避免 createSelectorQuery 返回 0 导致绘制失败
      const w = res[0].width || width
      const h = res[0].height || height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      const pathWidth = 18 // 主管道粗细，加粗更显眼
      const nodeOffset = MAP.r // 从节点圆圈边缘出发的偏移量

      // 复用同一条贝塞尔路径的辅助函数
      const tracePath = (
        ctx: CanvasRenderingContext2D,
        fromX: number, fromY: number,
        toX: number, toY: number,
        cp1x: number, cp2x: number, midY: number,
      ) => {
        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        ctx.bezierCurveTo(cp1x, midY, cp2x, midY, toX, toY)
      }

      segments.forEach((seg) => {
        // 起点在上一关底部边缘，终点在下一关顶部边缘
        const fromX = seg.from.x
        const fromY = seg.from.y + nodeOffset
        const toX = seg.to.x
        const toY = seg.to.y - nodeOffset
        const midY = (fromY + toY) / 2
        // S 形蛇形：偶数段先左后右，奇数段先右后左，交替蜿蜒
        const flip = seg.from.index % 2 === 0 ? 1 : -1
        const cp1x = MAP.cx - MAP.amp * flip
        const cp2x = MAP.cx + MAP.amp * flip

        const done = seg.isCompleted
        const mainColor = done ? COLORS.pathDone : COLORS.pathTodo
        const edgeColor = done ? '#3D8C00' : '#2B3540'
        const hlColor = done ? COLORS.pathDoneHL : COLORS.pathTodoHL

        // 第1层：深色边缘（立体管道的阴影侧/轮廓）
        tracePath(ctx, fromX, fromY, toX, toY, cp1x, cp2x, midY)
        ctx.strokeStyle = edgeColor
        ctx.lineWidth = pathWidth + 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        // 第2层：主色（鲜亮草绿管道主体）
        tracePath(ctx, fromX, fromY, toX, toY, cp1x, cp2x, midY)
        ctx.strokeStyle = mainColor
        ctx.lineWidth = pathWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        // 第3层：中心高光（管道反光，细线模拟立体感）
        tracePath(ctx, fromX, fromY, toX, toY, cp1x, cp2x, midY)
        ctx.strokeStyle = hlColor
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
      })
    })
  }, [segments, height, width])

  return (
    <Canvas
      type="2d"
      id={CANVAS_ID}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
      }}
    />
  )
}
