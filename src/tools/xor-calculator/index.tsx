import { useState, useMemo } from 'react'
import { MathOperations } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Mode = 'text' | 'hex'

function textToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function hexToBytes(s: string): Uint8Array | null {
  const clean = s.replace(/\s+/g, '')
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) return null
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ')
}

function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++)
    out[i] = data[i] ^ key[i % key.length]
  return out
}

function isPrintable(bytes: Uint8Array): boolean {
  return Array.from(bytes).every(b => b >= 0x20 && b < 0x7f)
}

function XORCalculator() {
  const [input, setInput] = useState('')
  const [inputMode, setInputMode] = useState<Mode>('text')
  const [key, setKey] = useState('')
  const [keyMode, setKeyMode] = useState<Mode>('text')
  const [brute, setBrute] = useState(false)

  const inputBytes = useMemo(() => {
    if (!input.trim()) return null
    return inputMode === 'text' ? textToBytes(input) : hexToBytes(input)
  }, [input, inputMode])

  const keyBytes = useMemo(() => {
    if (!key.trim()) return null
    return keyMode === 'text' ? textToBytes(key) : hexToBytes(key)
  }, [key, keyMode])

  const result = useMemo(() => {
    if (!inputBytes || !keyBytes) return null
    return xorBytes(inputBytes, keyBytes)
  }, [inputBytes, keyBytes])

  const bruteResults = useMemo(() => {
    if (!brute || !inputBytes) return []
    return Array.from({ length: 256 }, (_, i) => {
      const k = new Uint8Array([i])
      const out = xorBytes(inputBytes, k)
      return { key: i, bytes: out, text: bytesToText(out), printable: isPrintable(out) }
    }).filter(r => r.printable)
  }, [brute, inputBytes])

  const inputError = input.trim() && inputBytes === null
  const keyError = key.trim() && keyBytes === null

  function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
    return (
      <div className="flex border border-vs-border rounded overflow-hidden">
        {(['text', 'hex'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-2 py-1 text-xs transition-colors ${
              mode === m ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    )
  }

  return (
    <ToolLayout title="XOR Calculator" description="XOR bytes with a key, or brute-force a single-byte key">
      <div className="flex flex-col gap-5 max-w-2xl">

        {/* Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-vs-muted text-xs uppercase tracking-widest">Input</label>
            <ModeToggle mode={inputMode} onChange={m => { setInputMode(m); setInput('') }} />
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={inputMode === 'hex' ? 'e.g. 48 65 6c 6c 6f' : 'Plain text...'}
            rows={3}
            spellCheck={false}
            className={`w-full bg-vs-sidebar border text-vs-text text-sm px-3 py-2 rounded outline-none transition-colors resize-none font-mono ${
              inputError ? 'border-red-500' : 'border-vs-border focus:border-vs-accent'
            }`}
          />
          {inputError && <p className="text-red-500 text-xs">Invalid hex input.</p>}
        </div>

        {/* Key */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-vs-muted text-xs uppercase tracking-widest">Key</label>
            <ModeToggle mode={keyMode} onChange={m => { setKeyMode(m); setKey('') }} />
          </div>
          <input
            type="text"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder={keyMode === 'hex' ? 'e.g. ff or de ad be ef' : 'Key string...'}
            spellCheck={false}
            className={`w-full bg-vs-sidebar border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none transition-colors ${
              keyError ? 'border-red-500' : 'border-vs-border focus:border-vs-accent'
            }`}
          />
          {keyError && <p className="text-red-500 text-xs">Invalid hex key.</p>}
        </div>

        {/* Result */}
        {result && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-vs-muted text-xs uppercase tracking-widest">Result — Hex</label>
              <div className="bg-vs-sidebar border border-vs-border rounded px-3 py-2 font-mono text-xs text-vs-text break-all select-all">
                {bytesToHex(result)}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-vs-muted text-xs uppercase tracking-widest">Result — String</label>
              <div className="bg-vs-sidebar border border-vs-border rounded px-3 py-2 font-mono text-xs text-vs-text break-all select-all">
                {bytesToText(result)}
              </div>
            </div>
          </div>
        )}

        {/* Brute force */}
        {inputBytes && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setBrute(b => !b)}
              className={`self-start flex items-center gap-2 px-3 py-1.5 text-xs border rounded transition-colors ${
                brute
                  ? 'border-vs-accent text-vs-text bg-vs-active'
                  : 'border-vs-border text-vs-muted bg-vs-sidebar hover:bg-vs-hover hover:text-vs-text'
              }`}
            >
              Single-byte brute force
            </button>

            {brute && (
              <div className="flex flex-col gap-1">
                <p className="text-vs-muted text-xs">
                  {bruteResults.length} printable results out of 256 keys
                </p>
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                  {bruteResults.length === 0 && (
                    <p className="text-vs-muted text-xs px-1">No fully printable results.</p>
                  )}
                  {bruteResults.map(({ key: k, text }) => (
                    <div key={k} className="flex items-center gap-3 px-3 py-1.5 bg-vs-sidebar border border-vs-border rounded">
                      <span className="text-vs-muted font-mono text-xs w-12 shrink-0">
                        0x{k.toString(16).padStart(2, '0')}
                      </span>
                      <span className="text-vs-text font-mono text-xs break-all">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'xor-calculator',
    name: 'XOR Calculator',
    description: 'XOR bytes with a key, or brute-force a single-byte key',
    icon: MathOperations,
  },
  Component: XORCalculator,
} satisfies Tool
