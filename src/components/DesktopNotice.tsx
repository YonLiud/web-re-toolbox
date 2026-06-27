import { useState } from 'react'
import { Monitor, X } from '@phosphor-icons/react'

const STORAGE_KEY = 'web-re-toolbox-desktop-notice-dismissed'

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function DesktopNotice() {
  const [dismissed, setDismissed] = useState(wasDismissed)

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore storage failures; the notice can still dismiss for this render.
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="desktop-notice fixed inset-0 z-50 hidden bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-20 max-w-sm rounded-md border border-vs-border bg-vs-panel p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-vs-border bg-vs-input text-vs-accent">
            <Monitor size={20} weight="bold" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-vs-text">Desktop recommended</h2>
            <p className="mt-1 text-sm leading-relaxed text-vs-muted">
              This toolbox is built for wide layouts, keyboard use, and copy-heavy workflows. Mobile works best for quick checks.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            title="Dismiss"
            className="rounded p-1 text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
          >
            <X size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full rounded-md border border-vs-accent bg-vs-accent-soft px-3 py-2 text-sm font-medium text-vs-text transition-colors hover:bg-vs-hover"
        >
          Continue anyway
        </button>
      </div>
    </div>
  )
}
