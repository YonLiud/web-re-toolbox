import { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react'

export function CopyBtn({ value, size = 13 }: { value: string; size?: number }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      title="Copy"
      className="shrink-0 p-1 rounded text-vs-muted hover:text-vs-text hover:bg-vs-active transition-colors"
    >
      {copied
        ? <Check size={size} weight="bold" className="text-green-400" />
        : <Copy size={size} />}
    </button>
  )
}
