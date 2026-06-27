import { useState, useMemo } from 'react'
import { ShieldWarning } from '@phosphor-icons/react'
import { CopyBtn } from '../../components/CopyBtn'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type NopArch = 'x86' | 'x64' | 'arm' | 'arm64'
type Mode = 'pattern' | 'find-offset' | 'payload'

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const MAX_PATTERN_LENGTH = UPPER.length * LOWER.length * DIGITS.length * 3

interface OffsetCandidate {
  label: string
  value: string
  offset: number
}

function generatePattern(length: number): string {
  let pattern = ''
  for (const a of UPPER) {
    for (const b of LOWER) {
      for (const c of DIGITS) {
        pattern += `${a}${b}${c}`
        if (pattern.length >= length) return pattern.slice(0, length)
      }
    }
  }
  return pattern.slice(0, length)
}

function isHexCandidate(value: string): boolean {
  const clean = value.replace(/^(0x)/i, '').replace(/\s+/g, '')
  return clean.length >= 2 && clean.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(clean)
}

function hexToAscii(hex: string): string {
  const clean = hex.replace(/^(0x)/i, '').replace(/\s+/g, '')
  return Array.from({ length: clean.length / 2 }, (_, i) =>
    String.fromCharCode(parseInt(clean.slice(i * 2, i * 2 + 2), 16))
  ).join('')
}

function reverseHexBytes(hex: string): string {
  const clean = hex.replace(/^(0x)/i, '').replace(/\s+/g, '')
  return clean.match(/../g)?.reverse().join('') ?? clean
}

function uniqueCandidates(search: string): { label: string; value: string }[] {
  const raw = search.trim()
  if (!raw) return []

  const candidates = [{ label: 'Text', value: raw }]
  if (isHexCandidate(raw)) {
    candidates.push({ label: 'Hex bytes', value: hexToAscii(raw) })
    candidates.push({ label: 'Hex little-endian', value: hexToAscii(reverseHexBytes(raw)) })
  }

  const seen = new Set<string>()
  return candidates.filter(candidate => {
    const key = `${candidate.label}:${candidate.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return candidate.value.length > 0
  })
}

function findOffsets(pattern: string, search: string): OffsetCandidate[] {
  return uniqueCandidates(search)
    .map(candidate => ({ ...candidate, offset: pattern.indexOf(candidate.value) }))
    .filter(candidate => candidate.offset >= 0)
}

function generateNops(count: number, arch: NopArch): string {
  const nopBytes: Record<string, string> = {
    x86: '90',
    x64: '90',
    arm: '00 00 a0 e1',
    arm64: '1f 20 03 d5',
  }
  const nop = nopBytes[arch]
  const nops = Array(count).fill(nop).join(' ')
  return nops
}

function BufferOverflowBuilder() {
  const [mode, setMode] = useState<Mode>('pattern')
  const [patternLength, setPatternLength] = useState(100)
  const [offsetValue, setOffsetValue] = useState('')
  const [nopCount, setNopCount] = useState(10)
  const [nopArch, setNopArch] = useState<NopArch>('x86')
  const [shellcode, setShellcode] = useState('')
  const [searchPattern, setSearchPattern] = useState('')

  const safePatternLength = Math.min(Math.max(patternLength, 1), MAX_PATTERN_LENGTH)
  const pattern = useMemo(() => generatePattern(safePatternLength), [safePatternLength])
  const foundOffsets = useMemo(() => findOffsets(pattern, searchPattern), [pattern, searchPattern])

  const nops = useMemo(() => generateNops(nopCount, nopArch), [nopCount, nopArch])

  const payload = useMemo(() => {
    const parts = []
    if (nopCount > 0) parts.push(nops)
    if (shellcode.trim()) {
      const sc = shellcode.replace(/\s+/g, ' ').trim()
      parts.push(sc)
    }
    if (offsetValue) {
      const diff = parseInt(offsetValue) - (parts.map(p => p.split(' ').length).reduce((a, b) => a + b, 0))
      if (diff > 0) {
        parts.push(Array(diff).fill('41').join(' '))
      }
    }
    return parts.join(' ')
  }, [nops, nopCount, shellcode, offsetValue])

  const modeLabels: Record<Mode, string> = {
    pattern: 'Pattern',
    'find-offset': 'Find Offset',
    payload: 'Payload',
  }

  return (
    <ToolLayout title="Buffer Overflow Builder" description="Generate cyclic patterns, find offsets, and assemble simple BO payloads">
      <div className="flex flex-col gap-5 max-w-4xl">

        {/* Mode selector */}
        <div className="flex gap-2">
          {(['pattern', 'find-offset', 'payload'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs capitalize border rounded transition-colors ${
                mode === m
                  ? 'border-vs-accent bg-vs-active text-vs-text'
                  : 'border-vs-border bg-vs-sidebar text-vs-muted hover:bg-vs-hover'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Pattern Generator */}
        {mode === 'pattern' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-vs-muted text-xs uppercase tracking-widest">Pattern Length</label>
                <input
                  type="number"
                  min="1"
                  max={MAX_PATTERN_LENGTH}
                  value={patternLength}
                  onChange={e => setPatternLength(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 bg-vs-sidebar border border-vs-border text-vs-text text-xs px-2 py-1 rounded outline-none focus:border-vs-accent"
                />
              </div>
              <textarea
                readOnly
                value={pattern}
                rows={6}
                className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-3 py-2 rounded resize-none"
              />
              <div className="flex items-center justify-between text-xs text-vs-muted">
                <span>{pattern.length} bytes generated</span>
                <CopyBtn value={pattern} />
              </div>
            </div>

            <div className="bg-vs-sidebar border border-vs-border rounded p-3 text-xs text-vs-muted">
              <p>Pattern characteristics:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Metasploit-style triplets: uppercase, lowercase, digit.</li>
                <li>Unique 4-byte windows through the generated range.</li>
                <li>Maximum reliable length: {MAX_PATTERN_LENGTH.toLocaleString()} bytes.</li>
                <li>Use the Find Offset tab with copied register bytes after a crash.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Find Offset */}
        {mode === 'find-offset' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-vs-muted text-xs uppercase tracking-widest">Search Value (hex or text)</label>
                <input
                  type="text"
                  value={searchPattern}
                  onChange={e => setSearchPattern(e.target.value)}
                  placeholder="e.g. 41414141 or just 4141"
                  className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-3 py-2 rounded outline-none focus:border-vs-accent"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-vs-muted text-xs uppercase tracking-widest">Pattern Length</label>
                <input
                  type="number"
                  min="1"
                  max={MAX_PATTERN_LENGTH}
                  value={patternLength}
                  onChange={e => setPatternLength(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs px-2 py-1 rounded outline-none focus:border-vs-accent"
                />
              </div>
            </div>

            {foundOffsets.length > 0 && (
              <div className="flex flex-col gap-2 bg-vs-sidebar border border-vs-border rounded p-4">
                <p className="text-vs-muted text-xs uppercase tracking-widest mb-3">Result</p>
                {foundOffsets.map(found => (
                  <div key={`${found.label}-${found.offset}`} className="rounded border border-vs-border bg-vs-bg px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-vs-muted text-xs">{found.label}</span>
                      <span className="font-mono text-sm text-vs-text">{found.offset} bytes</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-vs-muted">
                      <span>hex: <span className="font-mono text-vs-text">0x{found.offset.toString(16)}</span></span>
                      <span>dword: <span className="font-mono text-vs-text">{Math.floor(found.offset / 4)}</span></span>
                      <span>matched: <span className="font-mono text-vs-text">{found.value}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchPattern && foundOffsets.length === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                <p className="text-yellow-500 text-xs">Pattern not found. Try increasing the generated length or paste the register value as hex, e.g. 0x39654138.</p>
              </div>
            )}

            <textarea
                readOnly
                value={pattern}
                rows={6}
                className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-3 py-2 rounded resize-none"
            />
          </div>
        )}

        {/* Payload Builder */}
        {mode === 'payload' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-vs-muted text-xs uppercase tracking-widest">NOP Count</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={nopCount}
                  onChange={e => setNopCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs px-2 py-1 rounded outline-none focus:border-vs-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-vs-muted text-xs uppercase tracking-widest">Architecture</label>
                <select
                  value={nopArch}
                  onChange={e => setNopArch(e.target.value as NopArch)}
                  className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs px-2 py-1 rounded outline-none focus:border-vs-accent"
                >
                  <option value="x86">x86 (0x90)</option>
                  <option value="x64">x64 (0x90)</option>
                  <option value="arm">ARM (mov r0, r0)</option>
                  <option value="arm64">ARM64 (nop)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-vs-muted text-xs uppercase tracking-widest">Shellcode (space-separated hex)</label>
              <textarea
                value={shellcode}
                onChange={e => setShellcode(e.target.value)}
                placeholder="e.g. 48 31 c0 50 48 bb 2f 62 69 6e 2f 2f 73 68"
                rows={3}
                className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-3 py-2 rounded outline-none focus:border-vs-accent resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-vs-muted text-xs uppercase tracking-widest">Total Payload Size (bytes)</label>
              <input
                type="number"
                min="0"
                value={offsetValue}
                onChange={e => setOffsetValue(e.target.value)}
                placeholder="Leave empty for no padding"
                className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs px-3 py-2 rounded outline-none focus:border-vs-accent"
              />
            </div>

            {payload && (
              <div className="bg-vs-sidebar border border-vs-border rounded p-3">
                <p className="text-vs-muted text-xs uppercase tracking-widest mb-2">Generated Payload</p>
                <textarea
                  readOnly
                  value={payload}
                  rows={4}
                  className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-3 py-2 rounded resize-none"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-vs-muted">
                  <span>Total bytes: {payload.split(' ').filter(s => s.length > 0).length}</span>
                  <CopyBtn value={payload} />
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
    slug: 'buffer-overflow',
    name: 'Buffer Overflow Builder',
    description: 'Generate patterns, find offsets, and build BO payloads',
    icon: ShieldWarning,
    tags: ['exploit', 'binary', 'payload'],
  },
  Component: BufferOverflowBuilder,
} satisfies Tool
