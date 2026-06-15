import clsx from 'clsx'

interface Props {
  value: number
  max: number
  color?: 'cyan' | 'purple' | 'pink' | 'yellow' | 'green' | 'blue'
  className?: string
  showShimmer?: boolean
  label?: string
}

const colors = {
  cyan: 'from-duolingo-green to-duolingo-blue',
  purple: 'from-duolingo-purple to-[#A050FF]',
  pink: 'from-duolingo-red to-[#CC3A3A]',
  yellow: 'from-duolingo-gold to-[#D9A800]',
  green: 'from-duolingo-green to-[#46A302]',
  blue: 'from-duolingo-blue to-[#0F9ADE]',
}

export default function ProgressBar({ value, max, color = 'green', className, showShimmer = true, label }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-1 text-xs text-gray-500">
          <span>{label}</span>
          <span className="font-bold">{value}/{max}</span>
        </div>
      )}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={clsx('h-full bg-gradient-to-r transition-all duration-500 ease-out relative', colors[color])}
          style={{ width: `${pct}%` }}
        >
          {showShimmer && pct > 0 && (
            <div className="absolute inset-0 progress-shimmer" />
          )}
        </div>
      </div>
    </div>
  )
}
