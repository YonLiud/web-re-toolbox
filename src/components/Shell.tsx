import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-vs-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
