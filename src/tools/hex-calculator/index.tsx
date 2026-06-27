import { useMemo, useState } from 'react'
import { MathOperations } from '@phosphor-icons/react'
import { CopyBtn } from '../../components/CopyBtn'
import {
  ControlLabel,
  MetricStrip,
  OutputBlock,
  Panel,
  SegmentedControl,
  TextAreaField,
  ToggleChip,
  WorkbenchGrid,
} from '../../components/Workbench'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type InputType = 'auto' | 'hex' | 'text'
type ActiveType = 'hex' | 'text'
type OutputFormat = 'text' | 'hex' | 'compact-hex' | 'decimal' | 'binary' | 'url' | 'c-array'

interface ParsedSegment {
  source: string
  bytes: Uint8Array
  error?: string
}

const decoder = new TextDecoder('utf-8', { fatal: false })
const encoder = new TextEncoder()

const TYPE_OPTIONS = [
  { value: 'auto', label: 'Auto', hint: 'Detect hex when the input is valid byte pairs' },
  { value: 'hex', label: 'Hex' },
  { value: 'text', label: 'Text' },
] as const

const OUTPUTS: { value: OutputFormat; label: string }[] = [
  { value: 'text', label: 'UTF-8 text' },
  { value: 'hex', label: 'Hex spaced' },
  { value: 'compact-hex', label: 'Hex compact' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'binary', label: 'Binary' },
  { value: 'url', label: 'Percent' },
  { value: 'c-array', label: 'C bytes' },
]

const SAMPLES = [
  { label: 'Hello', value: '48 65 6c 6c 6f 2c 20 79 6f 6e' },
  { label: 'ELF', value: '7f 45 4c 46 02 01 01 00' },
  { label: 'URL', value: 'https://yonliud.dev/toolbox?x=1' },
]

function cleanHex(input: string): { clean: string; invalid: boolean } {
  const withoutPrefixes = input.replace(/0x/gi, '').replace(/\\x/gi, '')
  const compact = withoutPrefixes.replace(/[\s,;:_-]+/g, '')
  return {
    clean: compact,
    invalid: compact.length > 0 && !/^[0-9a-fA-F]+$/.test(compact),
  }
}

function parseHex(input: string): ParsedSegment {
  const { clean, invalid } = cleanHex(input)
  if (!clean) return { source: input, bytes: new Uint8Array(), error: 'Enter at least one byte.' }
  if (invalid) return { source: input, bytes: new Uint8Array(), error: 'Hex can only contain 0-9 and a-f byte pairs.' }
  if (clean.length % 2 !== 0) return { source: input, bytes: new Uint8Array(), error: 'Hex needs an even number of digits.' }

  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  return { source: input, bytes }
}

function parseText(input: string): ParsedSegment {
  return { source: input, bytes: encoder.encode(input) }
}

function looksLikeHex(input: string): boolean {
  const { clean, invalid } = cleanHex(input)
  return clean.length > 0 && clean.length % 2 === 0 && !invalid
}

function resolveDelimiter(value: string): string {
  if (value === '\\n') return '\n'
  if (value === '\\t') return '\t'
  if (value === 'space') return ' '
  return value
}

function splitInput(input: string, delimiter: string): string[] {
  const resolved = resolveDelimiter(delimiter)
  if (!resolved) return [input]
  return input.split(resolved).filter(part => part.length > 0)
}

function entropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0
  const counts = new Map<number, number>()
  bytes.forEach(byte => counts.set(byte, (counts.get(byte) ?? 0) + 1))

  let total = 0
  counts.forEach(count => {
    const p = count / bytes.length
    total -= p * Math.log2(p)
  })
  return total
}

function analyze(bytes: Uint8Array) {
  const values = Array.from(bytes)
  const printable = values.filter(byte => byte >= 0x20 && byte <= 0x7e).length
  const nulls = values.filter(byte => byte === 0).length
  const high = values.filter(byte => byte > 0x7f).length
  return {
    length: bytes.length,
    unique: new Set(values).size,
    printable,
    nulls,
    high,
    entropy: entropy(bytes),
  }
}

function toHex(bytes: Uint8Array, separator = ' '): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(separator)
}

function toBinary(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(2).padStart(8, '0')).join(' ')
}

function toDecimal(bytes: Uint8Array): string {
  return Array.from(bytes).join(', ')
}

function toPercent(bytes: Uint8Array): string {
  return Array.from(bytes, byte => `%${byte.toString(16).padStart(2, '0').toUpperCase()}`).join('')
}

function toCArray(bytes: Uint8Array): string {
  return `{ ${Array.from(bytes, byte => `0x${byte.toString(16).padStart(2, '0')}`).join(', ')} }`
}

function formatOutput(bytes: Uint8Array, format: OutputFormat): string {
  if (bytes.length === 0) return ''
  switch (format) {
    case 'text':
      return decoder.decode(bytes)
    case 'hex':
      return toHex(bytes)
    case 'compact-hex':
      return toHex(bytes, '')
    case 'decimal':
      return toDecimal(bytes)
    case 'binary':
      return toBinary(bytes)
    case 'url':
      return toPercent(bytes)
    case 'c-array':
      return toCArray(bytes)
  }
}

function hexDump(bytes: Uint8Array, cols = 16): string {
  const rows: string[] = []
  for (let offset = 0; offset < bytes.length; offset += cols) {
    const slice = bytes.slice(offset, offset + cols)
    const hex = Array.from(slice, byte => byte.toString(16).padStart(2, '0')).join(' ').padEnd(cols * 3 - 1, ' ')
    const ascii = Array.from(slice, byte => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.')).join('')
    rows.push(`${offset.toString(16).padStart(8, '0')}  ${hex}  |${ascii}|`)
  }
  return rows.join('\n')
}

function formatBytes(bytes: number): string {
  return `${bytes} byte${bytes === 1 ? '' : 's'}`
}

function HexCalculator() {
  const [input, setInput] = useState('')
  const [inputType, setInputType] = useState<InputType>('auto')
  const [delimiter, setDelimiter] = useState('')
  const [outputs, setOutputs] = useState<OutputFormat[]>(['text', 'hex', 'decimal'])

  const detectedType: ActiveType = useMemo(() => (looksLikeHex(input) ? 'hex' : 'text'), [input])
  const activeType = inputType === 'auto' ? detectedType : inputType
  const parts = useMemo(() => splitInput(input, delimiter), [input, delimiter])

  const segments = useMemo<ParsedSegment[]>(() => {
    return parts.map(part => (activeType === 'hex' ? parseHex(part) : parseText(part)))
  }, [parts, activeType])

  const validSegments = segments.filter(segment => !segment.error)
  const totalBytes = validSegments.reduce((sum, segment) => sum + segment.bytes.length, 0)
  const combined = useMemo(() => {
    const bytes = new Uint8Array(totalBytes)
    let offset = 0
    validSegments.forEach(segment => {
      bytes.set(segment.bytes, offset)
      offset += segment.bytes.length
    })
    return bytes
  }, [totalBytes, validSegments])

  const stats = analyze(combined)
  const firstError = segments.find(segment => segment.error)?.error
  const hasInput = input.length > 0

  const toggleOutput = (format: OutputFormat) => {
    setOutputs(current =>
      current.includes(format)
        ? current.filter(item => item !== format)
        : [...current, format]
    )
  }

  return (
    <ToolLayout
      title="Hex Calculator"
      description="Convert between text and bytes, inspect entropy, split captures, and copy clean output formats."
      aside={
        <div className="flex flex-col items-end gap-1 text-xs text-vs-muted">
          <span className="font-mono text-vs-text">{inputType === 'auto' ? `auto: ${detectedType}` : activeType}</span>
          <span>{hasInput ? formatBytes(totalBytes) : 'waiting for input'}</span>
        </div>
      }
    >
      <WorkbenchGrid>
        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title="Input"
            eyebrow="Source"
            actions={
              hasInput && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="rounded-md border border-vs-border px-2 py-1 text-xs text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
                >
                  Clear
                </button>
              )
            }
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-2">
                  <ControlLabel>Read as</ControlLabel>
                  <SegmentedControl value={inputType} options={TYPE_OPTIONS} onChange={setInputType} />
                </div>
                <div className="flex min-w-56 flex-1 flex-col gap-2">
                  <ControlLabel>Split delimiter</ControlLabel>
                  <input
                    value={delimiter}
                    onChange={event => setDelimiter(event.target.value)}
                    placeholder="empty, space, comma, \\n, \\t"
                    spellCheck={false}
                    className="h-[34px] rounded-md border border-vs-border bg-vs-input px-3 font-mono text-sm text-vs-text outline-none transition-colors placeholder:text-vs-muted focus:border-vs-accent"
                  />
                </div>
              </div>

              <TextAreaField
                label={activeType === 'hex' ? 'Hex bytes' : 'Text'}
                value={input}
                onChange={setInput}
                rows={9}
                error={Boolean(firstError)}
                placeholder={activeType === 'hex' ? '48 65 6c 6c 6f  or  0x48,0x65,0x6c' : 'Paste text, tokens, headers, or captured output'}
                actions={
                  <div className="flex flex-wrap justify-end gap-1">
                    {SAMPLES.map(sample => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => setInput(sample.value)}
                        className="rounded border border-vs-border px-1.5 py-0.5 text-[10px] text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                }
              />

              {firstError && (
                <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {firstError}
                </p>
              )}
            </div>
          </Panel>

          {hasInput && (
            <Panel title="Converted output" eyebrow={`${validSegments.length} segment${validSegments.length === 1 ? '' : 's'}`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {OUTPUTS.map(format => (
                    <ToggleChip key={format.value} selected={outputs.includes(format.value)} onClick={() => toggleOutput(format.value)}>
                      {format.label}
                    </ToggleChip>
                  ))}
                </div>

                {outputs.length === 0 && (
                  <p className="rounded-md border border-dashed border-vs-border px-3 py-6 text-center text-xs text-vs-muted">
                    Select at least one output format.
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  {segments.map((segment, index) => (
                    <div key={`${index}-${segment.source}`} className="flex flex-col gap-3">
                      {segments.length > 1 && (
                        <div className="flex items-center justify-between gap-3 border-b border-vs-border pb-2">
                          <span className="text-xs font-medium text-vs-text">Segment {index + 1}</span>
                          <span className="font-mono text-xs text-vs-muted">{segment.error ? 'invalid' : formatBytes(segment.bytes.length)}</span>
                        </div>
                      )}

                      {segment.error ? (
                        <OutputBlock label="Error" value={segment.error} muted />
                      ) : (
                        outputs.map(format => {
                          const label = OUTPUTS.find(item => item.value === format)?.label ?? format
                          const value = formatOutput(segment.bytes, format)
                          return (
                            <OutputBlock
                              key={format}
                              label={label}
                              value={value}
                              muted={!value}
                              action={value ? <CopyBtn value={value} /> : undefined}
                            />
                          )
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Byte profile" eyebrow="Analysis">
            <MetricStrip
              items={[
                { label: 'Bytes', value: String(stats.length) },
                { label: 'Unique', value: String(stats.unique) },
                { label: 'Printable', value: stats.length ? `${stats.printable}/${stats.length}` : '0/0' },
                { label: 'Entropy', value: `${stats.entropy.toFixed(2)} b/B`, tone: stats.entropy > 6.5 ? 'warn' : 'normal' },
              ]}
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-vs-muted">
              <div className="rounded-md border border-vs-border bg-vs-sidebar px-3 py-2">
                Null bytes <span className="float-right font-mono text-vs-text">{stats.nulls}</span>
              </div>
              <div className="rounded-md border border-vs-border bg-vs-sidebar px-3 py-2">
                High bytes <span className="float-right font-mono text-vs-text">{stats.high}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Hex dump" eyebrow="Preview" actions={combined.length > 0 ? <CopyBtn value={hexDump(combined)} /> : undefined}>
            {combined.length > 0 ? (
              <pre className="max-h-[28rem] overflow-auto whitespace-pre font-mono text-xs leading-relaxed text-vs-text">
                {hexDump(combined.slice(0, 512))}
                {combined.length > 512 ? `\n... ${combined.length - 512} bytes hidden` : ''}
              </pre>
            ) : (
              <p className="py-8 text-center text-xs text-vs-muted">Paste bytes or text to see a classic offset view.</p>
            )}
          </Panel>
        </div>
      </WorkbenchGrid>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'hex-calculator',
    name: 'Hex Calculator',
    description: 'Convert text and hex bytes with byte stats and copyable formats',
    icon: MathOperations,
    tags: ['encoding', 'conversion', 'analysis'],
  },
  Component: HexCalculator,
} satisfies Tool
