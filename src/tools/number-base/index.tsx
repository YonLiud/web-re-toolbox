import { useState } from 'react'
import { Hash } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Base = 'dec' | 'hex' | 'oct' | 'bin'

const BASES: { value: Base; label: string; prefix: string; radix: number; pattern: RegExp }[] = [
  { value: 'dec', label: 'Decimal',     prefix: '',   radix: 10, pattern: /^-?\d+$/ },
  { value: 'hex', label: 'Hexadecimal', prefix: '0x', radix: 16, pattern: /^[0-9a-fA-F]+$/ },
  { value: 'oct', label: 'Octal',       prefix: '0o', radix: 8,  pattern: /^[0-7]+$/ },
  { value: 'bin', label: 'Binary',      prefix: '0b', radix: 2,  pattern: /^[01]+$/ },
]

function fromBase(val: string, base: Base): bigint | null {
  const b = BASES.find(b => b.value === base)!
  const clean = val.trim().replace(/\s+/g, '')
  if (!clean) return null
  try {
    if (base === 'dec') return BigInt(clean)
    if (!b.pattern.test(clean)) return null
    return BigInt(`${b.prefix}${clean}`)
  } catch {
    return null
  }
}

function toBase(n: bigint, base: Base): string {
  const isNeg = n < 0n
  const abs = isNeg ? -n : n
  const str = abs.toString(BASES.find(b => b.value === base)!.radix)
  return isNeg ? `-${str}` : str
}

function formatBin(n: bigint): string {
  const raw = toBase(n, 'bin')
  const isNeg = raw.startsWith('-')
  const digits = isNeg ? raw.slice(1) : raw
  const padded = digits.padStart(Math.ceil(digits.length / 4) * 4, '0')
  const grouped = padded.match(/.{1,4}/g)!.join(' ')
  return isNeg ? `-${grouped}` : grouped
}

export function NumberBase() {
  const [values, setValues] = useState<Record<Base, string>>({ dec: '', hex: '', oct: '', bin: '' })
  const [error, setError] = useState<Base | null>(null)

  const handleChange = (raw: string, base: Base) => {
    const clean = raw.replace(/\s+/g, '')
    setValues(prev => ({ ...prev, [base]: raw }))

    if (!clean) {
      setValues({ dec: '', hex: '', oct: '', bin: '' })
      setError(null)
      return
    }

    const n = fromBase(clean, base)
    if (n === null) {
      setError(base)
      return
    }

    setError(null)
    setValues({
      dec: toBase(n, 'dec'),
      hex: toBase(n, 'hex').toUpperCase(),
      oct: toBase(n, 'oct'),
      bin: formatBin(n),
    })
  }

  return (
    <ToolLayout title="Number Base Converter" description="Convert numbers between decimal, hex, octal, and binary">
      <div className="flex flex-col gap-3 max-w-lg">
        {BASES.map(({ value, label, prefix }) => (
          <div key={value} className="flex items-center gap-3">
            <div className="w-28 shrink-0">
              <p className="text-vs-text text-sm font-medium">{label}</p>
              <p className="text-vs-muted text-xs font-mono">{prefix || '—'}</p>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={values[value]}
                onChange={e => handleChange(e.target.value, value)}
                placeholder={label.toLowerCase()}
                spellCheck={false}
                className={`w-full bg-vs-sidebar border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none transition-colors ${
                  error === value
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-vs-border focus:border-vs-accent'
                }`}
              />
            </div>
          </div>
        ))}

        {error && (
          <p className="text-red-500 text-xs pl-[124px]">
            Invalid {BASES.find(b => b.value === error)?.label.toLowerCase()} value
          </p>
        )}
      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'number-base',
    name: 'Number Base',
    description: 'Convert numbers between decimal, hex, octal, and binary',
    icon: Hash,
  },
  Component: NumberBase,
} satisfies Tool
