import { Star, Lock } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  earned: 0 | 1 | 2 | 3
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { box: 28, icon: 16 },
  md: { box: 44, icon: 22 },
  lg: { box: 64, icon: 32 },
}

export default function StarRow({ earned, size = 'md' }: Props) {
  const s = sizes[size]
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => {
        const on = i < earned
        return (
          <div
            key={i}
            className={clsx(
              'relative grid place-items-center transition-all',
              on ? 'drop-shadow-[0_0_8px_rgba(255,210,63,0.8)]' : 'opacity-30',
            )}
            style={{ width: s.box, height: s.box }}
          >
            <Star
              size={s.icon}
              className={clsx(on ? 'fill-neon-yellow text-neon-yellow' : 'text-ink/40')}
              strokeWidth={2}
            />
            {!on && size !== 'sm' && (
              <Lock size={s.icon / 2.4} className="absolute text-ink/40" />
            )}
          </div>
        )
      })}
    </div>
  )
}
