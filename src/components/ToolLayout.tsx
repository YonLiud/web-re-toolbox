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
      <div className="bg-vs-bg px-6 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-vs-muted">Bench</p>
            <h1 className="mt-1 text-xl font-semibold tracking-normal">{title}</h1>
            {description && <p className="mt-1 max-w-3xl text-sm text-vs-muted">{description}</p>}
          </div>
          {aside}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-10">
        <div className="mx-auto w-full max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  )
}
