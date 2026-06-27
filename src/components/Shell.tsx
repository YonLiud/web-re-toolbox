import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { DesktopNotice } from './DesktopNotice'
import { Sidebar } from './Sidebar'

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen bg-vs-bg text-vs-text">
      <DesktopNotice />
      <Sidebar />
      <main key={pathname} className="min-w-0 flex-1 overflow-auto page-transition">
        {children}
      </main>
    </div>
  )
}
