import type { CSSProperties } from 'react'
import {
  Trophy, Flame, Heart, Coins, Gem, Star, Lock,
  Target, BookOpen, Home, User, Users,
  Check, CheckCircle2, X, XCircle,
  ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Plus, Minus,
  Gift, Calendar, Clock, AlarmClock,
  HelpCircle, AlertTriangle, BarChart3,
  Pencil, Trash2, RotateCw, Settings,
  Volume2, VolumeX, Vibrate, VibrateOff,
  Download, LogOut, Crown, Sparkles, Zap,
  Construction, Search, Gamepad2, Hourglass,
  Clipboard, Ruler, Scale, Triangle, Square, Circle,
  Package, Car, Bird, Banknote,
  Apple, Candy, Banana, ChartPie,
  Swords, Rocket, Brain, Palette, Dumbbell,
  Backpack, FileText, PartyPopper, Flower2,
  Globe2, Shield, Award,
  Citrus, GlassWater, Drumstick, Cat, PawPrint, Pizza, Ribbon,
  Lightbulb, Frown, Divide, Hash, Cloud,
  type LucideIcon,
} from 'lucide-react'

/**
 * 语义图标注册表：SemanticKey -> lucide-react 组件
 * 键名与 Taro 端 icon-data.ts 完全对齐，数据层字段统一存 SemanticKey
 */
const registry: Record<string, LucideIcon> = {
  trophy: Trophy,
  fire: Flame,
  heart: Heart,
  heartOutline: Heart,
  coin: Coins,
  diamond: Gem,
  star: Star,
  starOutline: Star,
  lock: Lock,
  goal: Target,
  book: BookOpen,
  home: Home,
  user: User,
  users: Users,
  check: Check,
  checkCircle: CheckCircle2,
  x: X,
  xCircle: XCircle,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  plus: Plus,
  minus: Minus,
  gift: Gift,
  calendar: Calendar,
  clock: Clock,
  alarm: AlarmClock,
  question: HelpCircle,
  warning: AlertTriangle,
  chart: BarChart3,
  pencil: Pencil,
  trash: Trash2,
  refresh: RotateCw,
  settings: Settings,
  soundOn: Volume2,
  soundOff: VolumeX,
  vibrateOn: Vibrate,
  vibrateOff: VibrateOff,
  download: Download,
  logout: LogOut,
  edit: Pencil,
  crown: Crown,
  sparkles: Sparkles,
  lightning: Zap,
  construction: Construction,
  search: Search,
  gamepad: Gamepad2,
  hourglass: Hourglass,
  clipboard: Clipboard,
  ruler: Ruler,
  scale: Scale,
  triangle: Triangle,
  square: Square,
  circle: Circle,
  package: Package,
  car: Car,
  bird: Bird,
  banknote: Banknote,
  apple: Apple,
  candy: Candy,
  banana: Banana,
  pie: ChartPie,
  sword: Swords,
  rocket: Rocket,
  brain: Brain,
  palette: Palette,
  muscle: Dumbbell,
  backpack: Backpack,
  memo: FileText,
  party: PartyPopper,
  flower: Flower2,
  globe: Globe2,
  shield: Shield,
  medal: Award,
  citrus: Citrus,
  glassWater: GlassWater,
  drumstick: Drumstick,
  cat: Cat,
  panda: PawPrint,
  pizza: Pizza,
  ribbon: Ribbon,
  lightbulb: Lightbulb,
  frown: Frown,
  divide: Divide,
  hash: Hash,
  cloud: Cloud,
}

interface IconProps {
  /** 语义键名，与 Taro 端 icon-data.ts 的 key 对齐 */
  name: string
  size?: number
  /** 描边颜色，默认 currentColor（继承父元素文字色） */
  color?: string
  /** 填充颜色，默认 none（线条图标） */
  fill?: string
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

/**
 * Lucide 图标渲染组件（Web 端）
 * 用于数据驱动场景（成就 icon 字段、题目 illustration 等）从 SemanticKey 解析图标
 * 直接使用 lucide-react 的场景无需本组件，直接 import 即可
 */
export function Icon({ name, size = 24, color, fill = 'none', strokeWidth = 2, className, style }: IconProps) {
  const Cmp = registry[name]
  if (!Cmp) return null
  return <Cmp size={size} color={color} fill={fill} strokeWidth={strokeWidth} className={className} style={style} />
}
