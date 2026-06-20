import { useState, useMemo } from 'react'
import { Code } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

const MAX_BYTES = 4096

type InputMode = 'text' | 'hex'

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.replace(/\s+/g, '')
  if (clean.length % 2 !== 0) return null
  if (!/^[0-9a-fA-F]*$/.test(clean)) return null
  const arr = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) arr[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  return arr
}

const isPrintable = (b: number) => b >= 0x20 && b < 0x7f

function HexDump({
  bytes, cols, hovered, setHovered,
}: {
  bytes: Uint8Array
  cols: number
  hovered: number | null
  setHovered: (i: number | null) => void
}) {
  const rows: Uint8Array[] = []
  for (let i = 0; i < bytes.length; i += cols) rows.push(bytes.slice(i, i + cols))
  const half = cols / 2

  return (
    <div className="font-mono text-xs overflow-x-auto">
      {/* Header */}
      <div className="flex gap-3 text-vs-muted pb-1 mb-1 border-b border-vs-border select-none">
        <span className="w-[4.5rem] shrink-0">Offset</span>
        <div className="flex gap-1">
          {Array.from({ length: cols }, (_, i) => (
            <span key={i} className={`w-[1.4rem] text-center${i === half - 1 ? ' mr-2' : ''}`}>
              {i.toString(16).padStart(2, '0')}
            </span>
          ))}
        </div>
        <span className="ml-2">ASCII</span>
      </div>

      {rows.map((row, ri) => {
        const base = ri * cols
        return (
          <div key={ri} className="flex gap-3 hover:bg-vs-hover/30 rounded items-start py-px">
            {/* Offset */}
            <span className="w-[4.5rem] shrink-0 text-vs-muted select-none">
              {base.toString(16).padStart(8, '0')}
            </span>

            {/* Hex bytes */}
            <div className="flex gap-1">
              {Array.from({ length: cols }, (_, ci) => {
                const idx = base + ci
                const byte = row[ci]
                const exists = ci < row.length
                const isHov = hovered === idx
                return (
                  <span
                    key={ci}
                    onMouseEnter={() => exists ? setHovered(idx) : undefined}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-[1.4rem] text-center cursor-default transition-colors${ci === half - 1 ? ' mr-2' : ''} ${
                      !exists
                        ? 'text-transparent select-none'
                        : isHov
                        ? 'bg-vs-accent/40 text-vs-text rounded-sm'
                        : 'text-vs-text'
                    }`}
                  >
                    {exists ? byte.toString(16).padStart(2, '0') : '00'}
                  </span>
                )
              })}
            </div>

            {/* ASCII */}
            <div className="flex ml-2">
              {Array.from(row).map((byte, ci) => {
                const idx = base + ci
                const isHov = hovered === idx
                return (
                  <span
                    key={ci}
                    onMouseEnter={() => setHovered(idx)}
                    onMouseLeave={() => setHovered(null)}
                    className={`cursor-default transition-colors leading-none ${
                      isHov
                        ? 'bg-vs-accent/40 rounded-sm'
                        : isPrintable(byte)
                        ? 'text-vs-text'
                        : 'text-vs-muted'
                    }`}
                  >
                    {isPrintable(byte) ? String.fromCharCode(byte) : '.'}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HexViewerTool() {
  const [mode, setMode] = useState<InputMode>('text')
  const [input, setInput] = useState('')
  const [cols, setCols] = useState(16)
  const [hovered, setHovered] = useState<number | null>(null)

  const { bytes, error } = useMemo(() => {
    if (!input.trim()) return { bytes: null, error: false }
    if (mode === 'text') return { bytes: textToBytes(input), error: false }
    const b = hexToBytes(input)
    return { bytes: b ?? null, error: b === null }
  }, [input, mode])

  const truncated = bytes && bytes.length > MAX_BYTES
  const displayed = truncated ? bytes.slice(0, MAX_BYTES) : bytes

  return (
    <ToolLayout title="Hex Viewer" description="Classic hex dump — offset, hex bytes, and ASCII panel with hover highlighting">
      <div className="flex flex-col gap-5">

        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-vs-muted text-xs uppercase tracking-widest">Input mode</span>
            <div className="flex border border-vs-border rounded overflow-hidden">
              {(['text', 'hex'] as InputMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setInput('') }}
                  className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                    mode === m ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-vs-muted text-xs uppercase tracking-widest">Columns</span>
            <div className="flex border border-vs-border rounded overflow-hidden">
              {[8, 16, 32].map(c => (
                <button
                  key={c}
                  onClick={() => setCols(c)}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    cols === c ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-vs-muted text-xs uppercase tracking-widest">
            {mode === 'text' ? 'Text input' : 'Hex string — space-separated or continuous'}
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              mode === 'text'
                ? 'Paste text or binary data...'
                : '48 65 6c 6c 6f  or  48656c6c6f'
            }
            rows={4}
            spellCheck={false}
            className={`w-full bg-vs-sidebar border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none transition-colors resize-none ${
              error ? 'border-red-500' : 'border-vs-border focus:border-vs-accent'
            }`}
          />
          {error && <p className="text-red-500 text-xs">Invalid hex — must be an even number of hex digits.</p>}
        </div>

        {displayed && displayed.length > 0 && (
          <>
            <div className="flex items-center gap-4 text-xs text-vs-muted">
              <span>{bytes!.length} bytes</span>
              <span>{Math.ceil(bytes!.length / cols)} rows</span>
              {truncated && <span className="text-yellow-500">Showing first {MAX_BYTES} of {bytes!.length} bytes</span>}
            </div>

            <div className="bg-vs-sidebar border border-vs-border rounded p-3">
              <HexDump bytes={displayed} cols={cols} hovered={hovered} setHovered={setHovered} />
            </div>
          </>
        )}

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'hex-viewer',
    name: 'Hex Viewer',
    description: 'Classic hex dump with offset, hex bytes, and ASCII panel',
    icon: Code,
    tags: ['re', 'binary'],
  },
  Component: HexViewerTool,
} satisfies Tool
