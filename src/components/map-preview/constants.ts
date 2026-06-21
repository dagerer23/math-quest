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
