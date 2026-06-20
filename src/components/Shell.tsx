import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen bg-vs-bg">
      <Sidebar />
      <main key={pathname} className="flex-1 overflow-auto page-transition">
        {children}
      </main>
    </div>
  )
}
