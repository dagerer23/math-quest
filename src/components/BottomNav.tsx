import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Trophy, User, Target } from 'lucide-react'
import clsx from 'clsx'

const items = [
  { to: '/', label: '地图', icon: Home },
  { to: '/daily-goals', label: '目标', icon: Target },
  { to: '/mistakes', label: '错题', icon: BookOpen },
  { to: '/leaderboard', label: '榜单', icon: Trophy },
  { to: '/profile', label: '我的', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      <ul className="flex justify-around items-center py-2">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <li key={it.to} className="flex-1">
              <NavLink
                to={it.to}
                end={it.to === '/'}
                aria-label={it.label}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-1 py-1.5 px-2 transition-all',
                    isActive ? 'text-duolingo-green' : 'text-gray-400',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={clsx('p-2 rounded-xl transition-[transform,background-color] origin-center', isActive ? 'bg-duolingo-green/10 scale-110' : '')}>
                      <Icon size={22} />
                    </div>
                    <span className="text-xs font-bold">{it.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
