import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  children: ReactNode
}

export function ToolLayout({ title, description, children }: Props) {
  return (
    <div className="flex flex-col h-full p-6 bg-vs-bg text-vs-text overflow-auto">
      <div className="mb-6 pb-4 border-b border-vs-border">
        <h1 className="text-lg font-semibold">{title}</h1>
        {description && <p className="text-vs-muted text-sm mt-1">{description}</p>}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
