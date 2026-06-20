import { useState, useMemo } from 'react'
import { ChartBar } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Base = 'dec' | 'hex' | 'bin'
type Width = 8 | 16 | 32

function parse(val: string, base: Base): bigint | null {
  const clean = val.trim().replace(/\s+/g, '')
  if (!clean) return null
  try {
    if (base === 'dec') return BigInt(clean)
    if (base === 'hex') return /^[0-9a-fA-F]+$/.test(clean) ? BigInt('0x' + clean) : null
    if (base === 'bin') return /^[01]+$/.test(clean) ? BigInt('0b' + clean) : null
  } catch {}
  return null
}

function fmt(n: bigint, base: Base, width: Width): string {
  const masked = BigInt.asUintN(width, n)
  if (base === 'dec') return masked.toString(10)
  if (base === 'hex') return masked.toString(16).toUpperCase().padStart(width / 4, '0')
  return masked.toString(2).padStart(width, '0').match(/.{4}/g)!.join(' ')
}

function BitGrid({ value, width }: { value: bigint; width: Width }) {
  const masked = BigInt.asUintN(width, value)
  const bits = masked.toString(2).padStart(width, '0').split('').map(Number)

  return (
    <div className="flex flex-wrap gap-0.5">
      {bits.map((bit, i) => (
        <div
          key={i}
          title={`bit ${width - 1 - i}`}
          className={`w-5 h-5 text-[10px] flex items-center justify-center rounded-sm font-mono transition-colors ${
            bit ? 'bg-vs-accent text-white' : 'bg-vs-sidebar border border-vs-border text-vs-muted'
          }`}
        >
          {bit}
        </div>
      ))}
    </div>
  )
}

function ResultRow({ label, value, base, width }: { label: string; value: bigint; base: Base; width: Width }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-vs-border last:border-0">
      <span className="text-vs-muted text-xs font-mono w-16 shrink-0">{label}</span>
      <span className="text-vs-text text-xs font-mono flex-1 break-all">{fmt(value, base, width)}</span>
    </div>
  )
}

function NumberInput({
  label, value, onChange, base, width, error
}: {
  label: string; value: string; onChange: (v: string) => void
  base: Base; width: Width; error: boolean
}) {
  const placeholder = base === 'hex' ? 'FF' : base === 'bin' ? '11001100' : '255'
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <label className="text-vs-muted text-xs uppercase tracking-widest">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={`w-full bg-vs-sidebar border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none transition-colors ${
          error ? 'border-red-500' : 'border-vs-border focus:border-vs-accent'
        }`}
      />
    </div>
  )
}

export function BitwiseCalculator() {
  const [aVal, setAVal] = useState('')
  const [bVal, setBVal] = useState('')
  const [base, setBase] = useState<Base>('hex')
  const [width, setWidth] = useState<Width>(8)
  const [shift, setShift] = useState('1')

  const a = useMemo(() => parse(aVal, base), [aVal, base])
  const b = useMemo(() => parse(bVal, base), [bVal, base])
  const shiftN = useMemo(() => { const n = parseInt(shift); return isNaN(n) ? 0 : Math.max(0, Math.min(n, width - 1)) }, [shift, width])

  const ops = useMemo(() => {
    if (a === null) return null
    const mask = (1n << BigInt(width)) - 1n
    const aM = BigInt.asUintN(width, a)
    const bM = b !== null ? BigInt.asUintN(width, b) : null
    return {
      notA:  ~aM & mask,
      and:   bM !== null ? aM & bM : null,
      or:    bM !== null ? aM | bM : null,
      xor:   bM !== null ? aM ^ bM : null,
      notB:  bM !== null ? (~bM & mask) : null,
      shl:   (aM << BigInt(shiftN)) & mask,
      shr:   aM >> BigInt(shiftN),
    }
  }, [a, b, width, shiftN])

  const BASES: { value: Base; label: string }[] = [
    { value: 'dec', label: 'Dec' },
    { value: 'hex', label: 'Hex' },
    { value: 'bin', label: 'Bin' },
  ]

  const WIDTHS: Width[] = [8, 16, 32]

  return (
    <ToolLayout title="Bitwise Calculator" description="AND, OR, XOR, NOT, and bit shifts with visual bit display">
      <div className="flex flex-col gap-5 max-w-2xl">

        {/* Controls */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-vs-muted text-xs uppercase tracking-widest">Input base</span>
            <div className="flex border border-vs-border rounded overflow-hidden">
              {BASES.map(({ value, label }) => (
                <button key={value} onClick={() => { setBase(value); setAVal(''); setBVal('') }}
                  className={`px-3 py-1.5 text-xs transition-colors ${base === value ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-vs-muted text-xs uppercase tracking-widest">Bit width</span>
            <div className="flex border border-vs-border rounded overflow-hidden">
              {WIDTHS.map(w => (
                <button key={w} onClick={() => setWidth(w)}
                  className={`px-3 py-1.5 text-xs transition-colors ${width === w ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'}`}>
                  {w}-bit
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex gap-3">
          <NumberInput label="A" value={aVal} onChange={setAVal} base={base} width={width} error={aVal !== '' && a === null} />
          <NumberInput label="B" value={bVal} onChange={setBVal} base={base} width={width} error={bVal !== '' && b === null} />
        </div>

        {/* Bit grids */}
        {a !== null && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-vs-muted text-xs">A</span>
              <BitGrid value={a} width={width} />
            </div>
            {b !== null && (
              <div className="flex flex-col gap-1">
                <span className="text-vs-muted text-xs">B</span>
                <BitGrid value={b} width={width} />
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {ops && (
          <div className="flex flex-col gap-4">
            <div className="bg-vs-sidebar border border-vs-border rounded px-3">
              <ResultRow label="NOT A"  value={ops.notA} base={base} width={width} />
              {ops.and  !== null && <ResultRow label="A AND B" value={ops.and}  base={base} width={width} />}
              {ops.or   !== null && <ResultRow label="A OR B"  value={ops.or}   base={base} width={width} />}
              {ops.xor  !== null && <ResultRow label="A XOR B" value={ops.xor}  base={base} width={width} />}
              {ops.notB !== null && <ResultRow label="NOT B"   value={ops.notB} base={base} width={width} />}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-vs-muted text-xs uppercase tracking-widest">Shift amount</span>
                <input
                  type="number"
                  value={shift}
                  onChange={e => setShift(e.target.value)}
                  min={0} max={width - 1}
                  className="w-16 bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-2 py-1 rounded outline-none focus:border-vs-accent"
                />
              </div>
              <div className="bg-vs-sidebar border border-vs-border rounded px-3">
                <ResultRow label={`A << ${shiftN}`} value={ops.shl} base={base} width={width} />
                <ResultRow label={`A >> ${shiftN}`} value={ops.shr} base={base} width={width} />
              </div>
            </div>
          </div>
        )}

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'bitwise-calculator',
    name: 'Bitwise Calculator',
    description: 'AND, OR, XOR, NOT, and bit shifts with visual bit display',
    icon: ChartBar,
  },
  Component: BitwiseCalculator,
} satisfies Tool
