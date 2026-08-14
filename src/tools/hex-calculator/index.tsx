import { useMemo, useState } from 'react'

class ExpressionParser {
  private index = 0
  private readonly source: string

  constructor(source: string) {
    this.source = source
  }

  parse(): bigint {
    const value = this.parseExpression()
    this.skipWhitespace()
    if (this.index !== this.source.length) throw new Error(`Unexpected character "${this.source[this.index]}"`)
    return value
  }

  private parseExpression(): bigint {
    let value = this.parseTerm()
    while (true) {
      this.skipWhitespace()
      if (this.consume('+')) value += this.parseTerm()
      else if (this.consume('-')) value -= this.parseTerm()
      else return value
    }
  }

  private parseTerm(): bigint {
    let value = this.parseFactor()
    while (true) {
      this.skipWhitespace()
      if (this.consume('*')) value *= this.parseFactor()
      else if (this.consume('/')) {
        const divisor = this.parseFactor()
        if (divisor === 0n) throw new Error('Cannot divide by zero')
        value /= divisor
      } else if (this.consume('%')) {
        const divisor = this.parseFactor()
        if (divisor === 0n) throw new Error('Cannot divide by zero')
        value %= divisor
      } else return value
    }
  }

  private parseFactor(): bigint {
    this.skipWhitespace()
    if (this.consume('+')) return this.parseFactor()
    if (this.consume('-')) return -this.parseFactor()
    if (this.consume('(')) {
      const value = this.parseExpression()
      this.skipWhitespace()
      if (!this.consume(')')) throw new Error('Expected closing parenthesis')
      return value
    }

    const start = this.index
    const isHex = this.source.slice(this.index, this.index + 2).toLowerCase() === '0x'
    if (isHex) {
      this.index += 2
      const digitsStart = this.index
      while (/[0-9a-f]/i.test(this.source[this.index] ?? '')) this.index++
      if (this.index === digitsStart) throw new Error('Expected hexadecimal digits after 0x')
    } else {
      while (/\d/.test(this.source[this.index] ?? '')) this.index++
      if (this.index === start) throw new Error('Expected a number')
    }
    return BigInt(this.source.slice(start, this.index))
  }

  private consume(character: string) {
    if (this.source[this.index] !== character) return false
    this.index++
    return true
  }

  private skipWhitespace() {
    while (/\s/.test(this.source[this.index] ?? '')) this.index++
  }
}

function calculate(input: string): { value?: bigint; error?: string } {
  if (!input.trim()) return {}
  try {
    return { value: new ExpressionParser(input).parse() }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid expression' }
  }
}

function toHex(value: bigint) {
  return value < 0n ? `-0x${(-value).toString(16).toUpperCase()}` : `0x${value.toString(16).toUpperCase()}`
}

export function HexCalculator() {
  const [input, setInput] = useState('0x56 - 0x23 + 5')
  const [copied, setCopied] = useState(false)
  const result = useMemo(() => calculate(input), [input])
  const output = result.value === undefined ? '' : toHex(result.value)

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="border-b px-6 py-5">
        <h2 className="font-semibold">Expression</h2>
        <p className="mt-1 text-sm text-muted-foreground">Supports 0x values, +, -, *, /, %, and parentheses.</p>
      </div>
      <div className="space-y-5 p-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Calculate</span>
          <input
            autoFocus
            value={input}
            onChange={event => setInput(event.target.value)}
            spellCheck={false}
            placeholder="0x56 - 0x23 + 5"
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 font-mono text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </label>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Result</span>
            <button type="button" onClick={copyOutput} disabled={!output} className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
              {copied ? 'Copied' : 'Copy hex'}
            </button>
          </div>
          <output className="block rounded-md border bg-muted p-4 font-mono text-2xl font-semibold tracking-tight">
            {result.error ? <span className="text-red-600">{result.error}</span> : output || 'Enter an expression'}
          </output>
          {result.value !== undefined && <p className="font-mono text-sm text-muted-foreground">{result.value.toString(10)} decimal</p>}
        </div>
      </div>
    </section>
  )
}
