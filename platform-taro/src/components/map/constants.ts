// 地图布局参数（与web端demo按比例1:1.875完全对齐，web端W=200，小程序W=375）
export const MAP = {
  W: 375, // SVG宽度，适配小程序屏幕
  cx: 187.5, // 中线x坐标：100*1.875=187.5
  amp: 50, // 路径摆幅，调大让弯曲更明显，与demo视觉一致
  startY: 131, // 首关y坐标：70*1.875=131.25≈131
  step: 120, // 关卡纵向间距，调小让关卡更紧凑，与demo一致
  r: 40, // 普通节点半径
  bossR: 50, // Boss节点半径
  currentR: 56, // 当前关光晕半径
  labelW: 90, // 标签宽度
  labelH: 30, // 标签高度
  leftZoneEnd: 70, // 左标签右边界
  rightZoneStart: 270, // 右标签左边界
  canvasRight: 360, // 右标签右边界
  canvasLeft: 15, // 左标签左边界
} as const

// 多邻国式配色（与web端完全一致，无任何修改）
export const COLORS = {
  bgTop: '#3B4A5C',
  bgMid: '#283443',
  bgBot: '#1F2A37',
  pathDone: '#58CC02', // 已完成段亮绿色
  pathDoneHL: '#7BE030', // 已完成段高光虚线
  pathTodo: '#4A5663', // 未完成段深灰色
  pathTodoHL: '#6A7682', // 未完成段高光虚线
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
