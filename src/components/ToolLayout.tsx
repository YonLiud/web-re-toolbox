import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  children: ReactNode
  aside?: ReactNode
}

export function ToolLayout({ title, description, children, aside }: Props) {
  return (
    <div className="flex min-h-full flex-col bg-vs-bg text-vs-text">
      <div className="border-b border-vs-border bg-vs-bg/95 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-vs-muted">Tool</p>
            <h1 className="mt-1 text-xl font-semibold">{title}</h1>
            {description && <p className="mt-1 max-w-3xl text-sm text-vs-muted">{description}</p>}
          </div>
          {aside}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  )
}
