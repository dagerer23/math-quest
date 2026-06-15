import { Outlet } from 'react-router-dom'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'
import { useEffect } from 'react'
import { unlockAudio } from '@/utils/sound'
import { useUserStore } from '@/store/useUserStore'
import { todayKey } from '@/utils/time'

export default function Layout() {
  const lastActiveDate = useUserStore((s) => s.lastActiveDate)
  useEffect(() => {
    const handler = () => unlockAudio()
    window.addEventListener('touchstart', handler, { once: true })
    window.addEventListener('click', handler, { once: true })
    return () => {
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('click', handler)
    }
  }, [])

  useEffect(() => {
    if (lastActiveDate !== todayKey()) {
      // small reminder; real streak update happens in registerSession
    }
  }, [lastActiveDate])

  return (
    <div className="shell flex flex-col h-screen overflow-hidden">
      <StatusBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
