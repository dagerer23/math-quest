# 地图关卡界面视觉重设计 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 web 端 (`src/`) 新增独立 demo 页 `/map-preview`,用多邻国式视觉(圆形按钮 + 蜿蜒绿色土路 + 深色背景 + 远端对齐知识点标签)渲染 8 关 mock 地图,验证视觉效果。

**Architecture:** SVG 渲染(viewBox 自适应缩放)。坐标算法为纯函数,输出节点位置 + 路径贝塞尔段;组件按 路径/节点/星行/标签 拆分,各司其职;demo 页用 mock 数据组合,挂载到免登录路由。三区分离(中区路径+按钮,左右区信息块)根治重叠;标签远端对齐(贴画布外缘,向远离按钮方向生长)根治文字覆盖。

**Tech Stack:** React 18 + TypeScript + Vite,别名 `@`→`src/`;矢量图标用 `lucide-react`(项目已有);无测试框架,纯函数用 `node` 临时脚本验证,组件用浏览器视觉验证。

**Testing Note:** 项目无 vitest/jest,且 AGENTS.md 规定不给无测试库加测试。故偏离 TDD:纯函数(Task 1)写临时验证脚本 `node` 执行;UI 组件(Task 2-7)以"启动 dev server + 访问 `/map-preview` + 视觉检查"作为验证。验证脚本用完即删,不进仓库。

**Spec:** `docs/superpowers/specs/2026-06-21-map-visual-redesign-design.md`

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/components/map-preview/constants.ts` | 布局参数(画布尺寸/摆幅/半径/颜色)与 mock 类型 |
| `src/components/map-preview/windingPath.ts` | 坐标算法纯函数 `getWindingPositions` |
| `src/components/map-preview/WindingPath.tsx` | SVG 蜿蜒土路(已完成段亮绿 + 未完成段深灰) |
| `src/components/map-preview/MapStarRow.tsx` | 三星行(lucide Star 矢量,实心/空心) |
| `src/components/map-preview/KnowledgeLabel.tsx` | 知识点标签(深底 pill,远端对齐) |
| `src/components/map-preview/MapLevelNode.tsx` | 圆形按钮节点(白顶+彩描边+投影,按状态切换) |
| `src/pages/MapPreview.tsx` | demo 页(mock 8 关数据 + 组合渲染) |
| `src/App.tsx` | 加 lazy import + 免登录路由 `/map-preview` |

**布局坐标系(标准单位,SVG viewBox 200×640):**
- 画布宽 `W=200`,高 `H=640`,中线 `cx=100`,路径摆幅 `amp=18`(路径最远到 x=82/118)
- 节点半径 `r=22`,Boss `r=27`,当前关光晕 `r=30`
- 节点 y:`startY=70`,`step=66`(8 关)
- 安全区:左标签区 `x∈[4,70]`,右标签区 `x∈[130,196]`;按钮左沿 78 / 右沿 122,与标签净距 ≥8
- 标签固定宽 `66`(容最长文字"20以内加减法"),居中文字;远端对齐:右标签右沿=196,左标签左沿=4

---

## Task 1: 坐标算法 `getWindingPositions`

**Files:**
- Create: `src/components/map-preview/constants.ts`
- Create: `src/components/map-preview/windingPath.ts`
- Verify: `scripts/verify-winding.mjs`(临时,验证后删)

- [ ] **Step 1: 创建常量文件 `src/components/map-preview/constants.ts`**

```ts
// 地图布局参数(标准单位,SVG viewBox 200×640)
export const MAP = {
  W: 200,
  H: 640,
  cx: 100,        // 中线 x
  amp: 18,        // 路径摆幅(路径最远到 cx±amp)
  startY: 70,     // 首关 y
  step: 66,       // 关卡纵向间距
  r: 22,          // 普通节点半径
  bossR: 27,      // Boss 节点半径
  currentR: 30,   // 当前关光晕半径
  labelW: 66,     // 标签宽度(容最长文字)
  labelH: 16,     // 标签高度
  leftZoneEnd: 70,   // 左标签区右边界(标签右沿≤此)
  rightZoneStart: 130, // 右标签区左边界(标签左沿≥此)
  canvasRight: 196,  // 右标签右沿贴此
  canvasLeft: 4,     // 左标签左沿贴此
} as const

// 多邻国式配色
export const COLORS = {
  bgTop: '#3B4A5C',
  bgMid: '#283443',
  bgBot: '#1F2A37',
  pathDone: '#58CC02',     // 已完成段亮绿
  pathDoneHL: '#7BE030',   // 已完成段高光虚线
  pathTodo: '#4A5663',     // 未完成段深灰
  pathTodoHL: '#6A7682',   // 未完成段虚线
  nodeDoneBorder: '#3D8C00',
  nodeCurrentBorder: '#58CC02',
  nodeUnlockBorder: '#9AA5B1',
  nodeLockBg: '#3A4654',
  nodeBossBorder: '#7A4FBF',
  nodeWhite: '#FFFFFF',
  starGold: '#FFC700',
  starEmpty: '#5A6678',
  labelBgDone: '#2C3845',
  labelBgLock: '#26303B',
  labelTextDone: '#A8D870',
  labelTextUnlock: '#9AA5B1',
  labelTextLock: '#5A6678',
} as const

// 关卡状态
export type LevelStatus = 'completed' | 'current' | 'unlocked' | 'locked'

// mock 关卡数据结构(复用 Level 的 chapter/isBoss,补充 demo 状态)
export interface MockLevel {
  id: string
  chapter: string
  isBoss: boolean
  status: LevelStatus
  stars: number  // 0-3,已通关点亮颗数
}
```

- [ ] **Step 2: 创建算法文件 `src/components/map-preview/windingPath.ts`**

```ts
import { MAP } from './constants'

export interface NodePos {
  x: number
  y: number
  index: number
  side: 'left' | 'right'  // 信息块所在侧(节点对面):右排节点→信息块在左
}

export interface PathSegment {
  from: NodePos
  to: NodePos
  isCompleted: boolean  // 该段路径是否已完成(亮绿)
}

export interface WindingLayout {
  nodes: NodePos[]
  segments: PathSegment[]
}

/**
 * 生成蜿蜒地图布局。所有节点居中(cx),路径在节点间用贝塞尔左右摆动;
 * 信息块左右交替放在节点对面外侧(side)。
 * @param count   关卡数
 * @param completedUpTo  最后一个已完成关的 index(-1 表示无完成);到该关为止的路径段亮绿
 */
export function getWindingPositions(
  count: number,
  completedUpTo: number = -1,
): WindingLayout {
  const nodes: NodePos[] = []
  for (let i = 0; i < count; i++) {
    const y = MAP.startY + MAP.step * i
    // 信息块左右交替:偶数关→信息块在右(side=right),奇数关→左
    // side 表示信息块所在侧,与节点摆动无关(节点都在中线)
    const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
    nodes.push({ x: MAP.cx, y, index: i, side })
  }

  const segments: PathSegment[] = []
  for (let i = 0; i < count - 1; i++) {
    segments.push({
      from: nodes[i],
      to: nodes[i + 1],
      isCompleted: i <= completedUpTo,  // 段 i 连接 node[i]→node[i+1],到已完成关为止都亮绿
    })
  }
  return { nodes, segments }
}

/**
 * 生成单段贝塞尔路径的 d 属性。
 * 节点都在 cx,控制点左右偏移 amp 产生 S 弯蜿蜒。
 * 偶数段 cp1 左 cp2 右,奇数段反向,避免单调。
 */
export function segmentPath(from: NodePos, to: NodePos): string {
  const midY = (from.y + to.y) / 2
  const flip = from.index % 2 === 0 ? 1 : -1
  const cp1x = MAP.cx - MAP.amp * flip
  const cp2x = MAP.cx + MAP.amp * flip
  return `M ${from.x} ${from.y} C ${cp1x} ${midY}, ${cp2x} ${midY}, ${to.x} ${to.y}`
}
```

- [ ] **Step 3: 写临时验证脚本 `scripts/verify-winding.mjs`**

```js
// 临时验证脚本,验证后删除,不进仓库
import { getWindingPositions, segmentPath } from '../src/components/map-preview/windingPath.ts'

const { nodes, segments } = getWindingPositions(8, 3)
console.log('节点数:', nodes.length, '(期望 8)')
console.log('首关:', nodes[0], '(期望 x=100 y=70 side=right)')
console.log('末关:', nodes[7], '(期望 x=100 y=532 side=left)')
console.log('段数:', segments.length, '(期望 7)')
console.log('段0已完成:', segments[0].isCompleted, '(期望 true)')
console.log('段3已完成:', segments[3].isCompleted, '(期望 true,连接最后已完成关→当前关)')
console.log('段4已完成:', segments[4].isCompleted, '(期望 false)')
console.log('段0路径:', segmentPath(segments[0].from, segments[0].to))
console.log('段1路径:', segmentPath(segments[1].from, segments[1].to), '(应与段0反向)')
// 安全校验:节点都在中线,标签区不重叠
const ok = nodes.every(n => n.x === 100)
console.log('所有节点居中:', ok)
```

- [ ] **Step 4: 运行验证脚本**

Run: `cd /Users/wangzeming/duoinguo/math-quest && npx tsx scripts/verify-winding.mjs`
Expected: 输出节点数 8、首末关坐标正确、段0已完成 true、段3 false、所有节点居中 true,无报错。

- [ ] **Step 5: 删除临时脚本并提交**

```bash
cd /Users/wangzeming/duoinguo/math-quest
rm scripts/verify-winding.mjs
git add src/components/map-preview/constants.ts src/components/map-preview/windingPath.ts
git commit -m "feat(map-preview): 蜿蜒地图坐标算法 getWindingPositions"
```

---

## Task 2: SVG 蜿蜒土路组件 `WindingPath`

**Files:**
- Create: `src/components/map-preview/WindingPath.tsx`

- [ ] **Step 1: 创建组件 `src/components/map-preview/WindingPath.tsx`**

```tsx
import { segmentPath } from './windingPath'
import type { PathSegment } from './windingPath'
import { COLORS } from './constants'

interface WindingPathProps {
  segments: PathSegment[]
}

/** 蜿蜒绿色土路:已完成段亮绿(带圆点高光),未完成段深灰(带圆点虚线) */
export function WindingPath({ segments }: WindingPathProps) {
  return (
    <g>
      {segments.map((seg, i) => {
        const d = segmentPath(seg.from, seg.to)
        const done = seg.isCompleted
        return (
          <g key={`seg-${i}`}>
            {/* 主路径:有宽度的圆角线 */}
            <path
              d={d}
              fill="none"
              stroke={done ? COLORS.pathDone : COLORS.pathTodo}
              strokeWidth={16}
              strokeLinecap="round"
            />
            {/* 高光虚线纹理(多邻国圆点感) */}
            <path
              d={d}
              fill="none"
              stroke={done ? COLORS.pathDoneHL : COLORS.pathTodoHL}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="0.5 10"
              opacity={done ? 0.5 : 0.4}
            />
          </g>
        )
      })}
    </g>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/wangzeming/duoinguo/math-quest
git add src/components/map-preview/WindingPath.tsx
git commit -m "feat(map-preview): 蜿蜒土路 SVG 组件 WindingPath"
```

---

## Task 3: 矢量星行组件 `MapStarRow`

**Files:**
- Create: `src/components/map-preview/MapStarRow.tsx`

- [ ] **Step 1: 创建组件 `src/components/map-preview/MapStarRow.tsx`**

```tsx
import { Star } from 'lucide-react'
import { COLORS } from './constants'

interface MapStarRowProps {
  stars: number       // 已得星数 0-3
  visible: boolean    // 是否显示星行(锁定关不显示)
  x: number           // 星行左上角 x(SVG 坐标)
  y: number           // 星行左上角 y
}

/** 三星行:lucide Star 矢量,已得点亮(金),未得空心(灰) */
export function MapStarRow({ stars, visible, x, y }: MapStarRowProps) {
  if (!visible) return null
  const size = 10
  const gap = 1
  return (
    <g>
      {Array.from({ length: 3 }, (_, i) => {
        const lit = i < stars
        return (
          <foreignObject
            key={i}
            x={x + i * (size + gap)}
            y={y}
            width={size}
            height={size}
          >
            <Star
              size={size}
              fill={lit ? COLORS.starGold : 'none'}
              color={lit ? COLORS.starGold : COLORS.starEmpty}
              strokeWidth={1.5}
            />
          </foreignObject>
        )
      })}
    </g>
  )
}
```

> 注:`foreignObject` 用于在 SVG 内嵌 lucide React 图标(lucide 输出 SVG/HTML)。若浏览器渲染异常,退化为 Step 2 的纯 SVG 星形方案。

- [ ] **Step 2: 退化方案(纯 SVG 星形,若 foreignObject 有问题则替换 Step 1 实现)**

```tsx
import { COLORS } from './constants'

interface MapStarRowProps {
  stars: number
  visible: boolean
  x: number
  y: number
}

const STAR_D = 'M5 0 L6.2 3.4 L10 3.4 L7 5.6 L8.1 9 L5 7 L1.9 9 L3 5.6 L0 3.4 L3.8 3.4 Z'

export function MapStarRow({ stars, visible, x, y }: MapStarRowProps) {
  if (!visible) return null
  const size = 10, gap = 1
  return (
    <g>
      {Array.from({ length: 3 }, (_, i) => {
        const lit = i < stars
        return (
          <path
            key={i}
            d={STAR_D}
            transform={`translate(${x + i * (size + gap)}, ${y}) scale(${size / 10})`}
            fill={lit ? COLORS.starGold : 'none'}
            stroke={lit ? COLORS.starGold : COLORS.starEmpty}
            strokeWidth={1.2}
          />
        )
      })}
    </g>
  )
}
```

- [ ] **Step 3: 提交**

```bash
cd /Users/wangzeming/duoinguo/math-quest
git add src/components/map-preview/MapStarRow.tsx
git commit -m "feat(map-preview): 矢量三星行 MapStarRow"
```

---

## Task 4: 知识点标签组件 `KnowledgeLabel`

**Files:**
- Create: `src/components/map-preview/KnowledgeLabel.tsx`

- [ ] **Step 1: 创建组件 `src/components/map-preview/KnowledgeLabel.tsx`**

```tsx
import { MAP, COLORS } from './constants'
import type { LevelStatus } from './constants'

interface KnowledgeLabelProps {
  text: string         // 知识点文字(Level.chapter)
  status: LevelStatus
  side: 'left' | 'right'  // 远端对齐:left→左沿贴 canvasLeft;right→右沿贴 canvasRight
  centerY: number      // 标签竖直中心对齐按钮中线
}

/** 知识点标签:深底圆角 pill,固定宽,文字居中;远端对齐到画布外缘,向远离按钮方向生长 */
export function KnowledgeLabel({ text, status, side, centerY }: KnowledgeLabelProps) {
  const bg =
    status === 'locked' ? COLORS.labelBgLock : COLORS.labelBgDone
  const textColor =
    status === 'locked'
      ? COLORS.labelTextLock
      : status === 'unlocked'
        ? COLORS.labelTextUnlock
        : COLORS.labelTextDone

  const x =
    side === 'right'
      ? MAP.canvasRight - MAP.labelW  // 右标签右沿贴 196,向左生长
      : MAP.canvasLeft                // 左标签左沿贴 4,向右生长
  const y = centerY - MAP.labelH / 2

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={MAP.labelW}
        height={MAP.labelH}
        rx={MAP.labelH / 2}
        fill={bg}
      />
      <text
        x={x + MAP.labelW / 2}
        y={y + MAP.labelH / 2 + 3.5}
        fontSize={7}
        fontWeight={600}
        fill={textColor}
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/wangzeming/duoinguo/math-quest
git add src/components/map-preview/KnowledgeLabel.tsx
git commit -m "feat(map-preview): 知识点标签 KnowledgeLabel(远端对齐)"
```

---

## Task 5: 节点按钮组件 `MapLevelNode`

**Files:**
- Create: `src/components/map-preview/MapLevelNode.tsx`

- [ ] **Step 1: 创建组件 `src/components/map-preview/MapLevelNode.tsx`**

```tsx
import { Lock, Crown, ChevronUp } from 'lucide-react'
import { MAP, COLORS } from './constants'
import type { LevelStatus } from './constants'
import type { NodePos } from './windingPath'

interface MapLevelNodeProps {
  node: NodePos
  index: number          // 关卡序号(显示编号)
  status: LevelStatus
  isBoss: boolean
}

/** 圆形按钮节点:白顶+彩描边+底部投影,按状态切换。Boss 更大+皇冠;锁定显示锁;当前关发光+脉冲+箭头 */
export function MapLevelNode({ node, index, status, isBoss }: MapLevelNodeProps) {
  const r = isBoss ? MAP.bossR : MAP.r
  const cx = node.x
  const cy = node.y

  // 描边色:Boss 优先紫,否则按状态
  const border = isBoss
    ? COLORS.nodeBossBorder
    : status === 'completed'
      ? COLORS.nodeDoneBorder
      : status === 'current'
        ? COLORS.nodeCurrentBorder
        : status === 'unlocked'
          ? COLORS.nodeUnlockBorder
          : COLORS.nodeLockBg
  const fill = status === 'locked' ? COLORS.nodeLockBg : COLORS.nodeWhite
  const isCurrent = status === 'current'
  const isLocked = status === 'locked'

  return (
    <g>
      {/* 当前关:光晕 + 脉冲圈 */}
      {isCurrent && (
        <>
          <circle cx={cx} cy={cy} r={MAP.currentR} fill={COLORS.nodeCurrentBorder} opacity={0.18} />
          <circle
            cx={cx}
            cy={cy}
            r={MAP.currentR - 4}
            fill="none"
            stroke={COLORS.nodeCurrentBorder}
            strokeWidth={1.5}
            strokeDasharray="2 3"
            opacity={0.7}
          />
        </>
      )}

      {/* 底部投影 */}
      <circle
        cx={cx}
        cy={cy + 4}
        r={r}
        fill={COLORS.bgBot}
        opacity={isLocked ? 0.4 : 0.5}
      />

      {/* 当前关:实色发光底 */}
      {isCurrent && (
        <circle cx={cx} cy={cy} r={r} fill={COLORS.nodeCurrentBorder} />
      )}

      {/* 按钮主体:彩描边 + 白顶(白顶略上移,多邻国双层感) */}
      <circle cx={cx} cy={cy} r={r} fill={border} />
      <circle cx={cx} cy={cy - 2} r={r - 2} fill={fill} />

      {/* 中心内容:Boss 皇冠 / 锁定锁 / 否则编号 */}
      {isBoss ? (
        <foreignObject x={cx - 8} y={cy - 8} width={16} height={16}>
          <Crown size={16} color="#FFD700" fill="#FFD700" />
        </foreignObject>
      ) : isLocked ? (
        <foreignObject x={cx - 6} y={cy - 6} width={12} height={12}>
          <Lock size={12} color="#5A6678" />
        </foreignObject>
      ) : (
        <text
          x={cx}
          y={cy + 5}
          fontSize={16}
          fontWeight={800}
          fill={border}
          textAnchor="middle"
        >
          {index + 1}
        </text>
      )}

      {/* 当前关:向上箭头 */}
      {isCurrent && (
        <foreignObject x={cx - 6} y={cy - 38} width={12} height={12}>
          <ChevronUp size={12} color={COLORS.nodeCurrentBorder} strokeWidth={3} />
        </foreignObject>
      )}
    </g>
  )
}
```

> 注:`foreignObject` 嵌 lucide 图标。若退化,皇冠/锁/箭头改纯 SVG path(参考 Task 3 Step 2 模式)。

- [ ] **Step 2: 提交**

```bash
cd /Users/wangzeming/duoinguo/math-quest
git add src/components/map-preview/MapLevelNode.tsx
git commit -m "feat(map-preview): 圆形节点按钮 MapLevelNode"
```

---

## Task 6: demo 页 `MapPreview` + mock 数据 + 路由

**Files:**
- Create: `src/pages/MapPreview.tsx`
- Modify: `src/App.tsx`(加 lazy import + 路由)

- [ ] **Step 1: 创建 demo 页 `src/pages/MapPreview.tsx`**

```tsx
import { useMemo } from 'react'
import { MAP, COLORS } from '@/components/map-preview/constants'
import { getWindingPositions } from '@/components/map-preview/windingPath'
import { WindingPath } from '@/components/map-preview/WindingPath'
import { MapLevelNode } from '@/components/map-preview/MapLevelNode'
import { MapStarRow } from '@/components/map-preview/MapStarRow'
import { KnowledgeLabel } from '@/components/map-preview/KnowledgeLabel'
import type { MockLevel } from '@/components/map-preview/constants'

// mock 8 关数据(chapter 取自真实 g1/g2 题库)
const MOCK_LEVELS: MockLevel[] = [
  { id: 'g1-L1', chapter: '5以内加减法', isBoss: false, status: 'completed', stars: 3 },
  { id: 'g1-L2', chapter: '10以内加减法', isBoss: false, status: 'completed', stars: 2 },
  { id: 'g1-L3', chapter: '20以内加减法', isBoss: false, status: 'completed', stars: 3 },
  { id: 'g1-L6', chapter: '一年级BOSS', isBoss: true, status: 'completed', stars: 3 },
  { id: 'g2-L1', chapter: '100以内加减法', isBoss: false, status: 'current', stars: 0 },
  { id: 'g2-L2', chapter: '乘法口诀', isBoss: false, status: 'unlocked', stars: 0 },
  { id: 'g2-L3', chapter: '混合运算', isBoss: false, status: 'locked', stars: 0 },
  { id: 'g2-L6', chapter: '综合应用', isBoss: false, status: 'locked', stars: 0 },
]

export default function MapPreview() {
  // 已完成到第 3 关(0-indexed:0,1,2,3 都完成,current 是 index 4)
  const { nodes, segments } = useMemo(
    () => getWindingPositions(MOCK_LEVELS.length, 3),
    [],
  )

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgBot, display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
      <svg
        viewBox={`0 0 ${MAP.W} ${MAP.H}`}
        style={{ width: '100%', maxWidth: 360, height: 'auto' }}
      >
        <defs>
          <radialGradient id="mapBg" cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor={COLORS.bgTop} />
            <stop offset="60%" stopColor={COLORS.bgMid} />
            <stop offset="100%" stopColor={COLORS.bgBot} />
          </radialGradient>
        </defs>
        <rect width={MAP.W} height={MAP.H} fill="url(#mapBg)" />
        {/* 顶部柔光 */}
        <ellipse cx={MAP.cx} cy={0} rx={130} ry={80} fill={COLORS.pathDone} opacity={0.06} />

        {/* 路径 */}
        <WindingPath segments={segments} />

        {/* 每关:标签 + 星行 + 节点 */}
        {nodes.map((node, i) => {
          const level = MOCK_LEVELS[i]
          const r = level.isBoss ? MAP.bossR : MAP.r
          return (
            <g key={level.id}>
              {/* 知识点标签(远端对齐,side 决定左右) */}
              <KnowledgeLabel
                text={level.chapter}
                status={level.status}
                side={node.side}
                centerY={node.y}
              />
              {/* 星行:在标签上方,贴画布外缘侧 */}
              <MapStarRow
                stars={level.stars}
                visible={level.status !== 'locked'}
                x={node.side === 'right' ? MAP.canvasRight - 32 : MAP.canvasLeft + 2}
                y={node.y - r - 14}
              />
              {/* 节点按钮 */}
              <MapLevelNode
                node={node}
                index={i}
                status={level.status}
                isBoss={level.isBoss}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: 在 `src/App.tsx` 加 lazy import**

在 `src/App.tsx` 的 lazy import 区(约第 15 行 `const LayoutPreview = ...` 附近)加一行:

```tsx
const MapPreview = lazy(() => import('@/pages/MapPreview'))
```

- [ ] **Step 3: 在 `src/App.tsx` 加免登录路由**

在 `src/App.tsx` 的 `<Route path="/layout-preview" element={<LayoutPreview />} />` 行(约第 79 行)后加:

```tsx
          <Route path="/map-preview" element={<MapPreview />} />
```

- [ ] **Step 4: 提交**

```bash
cd /Users/wangzeming/duoinguo/math-quest
git add src/pages/MapPreview.tsx src/App.tsx
git commit -m "feat(map-preview): 多邻国式地图 demo 页 /map-preview"
```

---

## Task 7: 启动验证 + 视觉检查

**Files:** 无(仅验证)

- [ ] **Step 1: 确认后端无关,直接启动前端**

Run: `cd /Users/wangzeming/duoinguo/math-quest && npm run dev`
Expected: Vite 启动,输出 `http://localhost:5173`

- [ ] **Step 2: 浏览器访问 demo 页**

打开: `http://localhost:5173/map-preview`
Expected: 看到 8 关多邻国式地图,无白屏/报错。打开浏览器控制台确认无 React 报错。

- [ ] **Step 3: 视觉检查清单(对照 spec)**

逐项核对:
- [ ] 路径蜿蜒(S 弯左右摆动),非平行斜线
- [ ] 已完成段(前 4 关)亮绿 + 圆点高光,后续段深灰虚线
- [ ] 节点为圆形按钮(白顶+彩描边+投影),非椭圆
- [ ] 已完成关(1/2/3/4)绿描边 + 金星点亮;关2 为 2 星(1 空)
- [ ] Boss 关(4)更大 + 紫描边 + 皇冠
- [ ] 当前关(5)发光绿 + 脉冲圈 + 向上箭头 + 空心星
- [ ] 解锁关(6)灰描边白底 + 空心星
- [ ] 锁定关(7/8)深灰底 + 锁图标,无星
- [ ] **知识点标签不覆盖按钮**(左右标签在 x≤70 / x≥130,按钮在 78-122)
- [ ] **星行不与路径重叠**(星在标签上方,路径在节点间)
- [ ] 标签文字完整显示,无截断溢出
- [ ] 背景为深蓝灰渐变,顶部柔光

- [ ] **Step 4: 若 foreignObject 渲染异常,执行退化**

若 lucide 图标(皇冠/锁/箭头/星)在 SVG 内不显示或错位:
- Task 3 切换到 Step 2 纯 SVG 星形
- Task 5 的 Crown/Lock/ChevronUp 改纯 SVG path(参照 Task 3 Step 2 模式手写 path)
重新验证 Step 3 清单。

- [ ] **Step 5: 最终提交(若有退化修改)**

```bash
cd /Users/wangzeming/duoinguo/math-quest
git add -A src/components/map-preview src/pages/MapPreview.tsx
git commit -m "fix(map-preview): 退化纯SVG图标/视觉微调" 2>/dev/null || echo "无修改,跳过"
```

---

## 完成标准

`/map-preview` 页面在 `http://localhost:5173/map-preview` 可访问,8 关 mock 地图满足 Task 7 Step 3 全部视觉检查项,尤其:
1. 路径蜿蜒非单调斜线
2. 知识点标签**不覆盖**按钮(远端对齐生效)
3. 星行**不与路径重叠**
4. 状态仅靠按钮区分(已完成/当前/解锁/锁定/Boss)

后续(不在本计划):移植 taro(SVG→Canvas)、接入真实 `getLevelsByGrade`、替换主页面 `Home.tsx`。
