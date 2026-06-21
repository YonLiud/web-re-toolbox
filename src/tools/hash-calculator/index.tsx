import { useState, useEffect } from 'react'
import { Scales } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const
type Algorithm = typeof ALGORITHMS[number]

async function computeHash(input: string, algorithm: Algorithm): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const buffer = await crypto.subtle.digest(algorithm, bytes)
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function HashCalculator() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<Record<Algorithm, string>>({
    'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '',
  })
  const [copied, setCopied] = useState<Algorithm | null>(null)

  useEffect(() => {
    let cancelled = false
    ALGORITHMS.forEach(async algo => {
      const hash = await computeHash(input, algo)
      if (!cancelled) setHashes(h => ({ ...h, [algo]: hash }))
    })
    return () => { cancelled = true }
  }, [input])

  const copy = (algo: Algorithm) => {
    navigator.clipboard.writeText(hashes[algo])
    setCopied(algo)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <ToolLayout title="Hash Calculator" description="Compute cryptographic hashes from a string">
      <div className="flex flex-col gap-5 max-w-2xl">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type or paste text to hash..."
          rows={3}
          className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors resize-none"
        />

        <div className="flex flex-col gap-2">
          {ALGORITHMS.map(algo => (
            <div key={algo} className="flex items-center gap-3">
              <span className="text-vs-muted text-xs font-mono w-16 shrink-0">{algo}</span>
              <div
                className="flex-1 font-mono text-xs text-vs-text bg-vs-sidebar border border-vs-border rounded px-3 py-2 break-all min-h-[34px]"
              >
                {input ? hashes[algo] : ''}
              </div>
              <button
                onClick={() => copy(algo)}
                disabled={!hashes[algo]}
                className="shrink-0 px-3 py-1.5 text-xs border border-vs-border bg-vs-sidebar text-vs-muted hover:text-vs-text hover:bg-vs-hover rounded transition-colors disabled:opacity-30"
              >
                {copied === algo ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}
        </div>

        <p className="text-vs-muted text-xs border-l-2 border-vs-border pl-3">
          Uses the browser's native Web Crypto API. MD5 is not supported natively — use the Hash Identifier to recognize MD5 hashes by their format.
        </p>
      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'hash-calculator',
    name: 'Hash Calculator',
    description: 'Compute SHA-1, SHA-256, SHA-384, SHA-512 hashes',
    icon: Scales,
    tags: ['crypto', 'hash'],
  },
  Component: HashCalculator,
} satisfies Tool
