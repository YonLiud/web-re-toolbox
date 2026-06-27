import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { DesktopNotice } from './DesktopNotice'
import { Sidebar } from './Sidebar'

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen flex-col bg-vs-bg text-vs-text">
      <DesktopNotice />
      <main key={pathname} className="min-h-0 flex-1 overflow-auto page-transition">
        {children}
      </main>
      <Sidebar />
    </div>
  )
}
