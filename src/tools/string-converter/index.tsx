import { useState, useMemo } from 'react'
import { ArrowsLeftRight, CheckCircle, XCircle } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Format = 'ascii' | 'utf8' | 'utf16' | 'utf32' | 'codepoints' | 'js-escape' | 'html-entities'

const FORMATS: { value: Format; label: string; description: string }[] = [
  {
    value: 'ascii',
    label: 'ASCII',
    description: 'ASCII only covers 128 characters (0–127): English letters, digits, and basic punctuation. Any character outside this range is invalid ASCII.',
  },
  {
    value: 'utf8',
    label: 'UTF-8',
    description: 'Encodes each character as 1–4 bytes. The most common encoding on the web. Non-ASCII characters (like Hebrew or emoji) use multiple bytes.',
  },
  {
    value: 'utf16',
    label: 'UTF-16',
    description: 'Encodes each character as 2 or 4 bytes using 16-bit code units. Used internally by JavaScript and Windows.',
  },
  {
    value: 'utf32',
    label: 'UTF-32',
    description: 'Encodes every character as exactly 4 bytes (32 bits). Simple but wasteful — every ASCII character still takes 4 bytes.',
  },
  {
    value: 'codepoints',
    label: 'Code Points',
    description: 'Shows each character as its Unicode code point in U+XXXX notation. This is the canonical way to reference a character in the Unicode standard.',
  },
  {
    value: 'js-escape',
    label: 'JS Escape',
    description: 'JavaScript string escape sequences. BMP characters use \\uXXXX, characters outside the BMP (like most emoji) use \\u{XXXXX}.',
  },
  {
    value: 'html-entities',
    label: 'HTML Entities',
    description: 'Hex numeric character references (&#xXXXX;). Safe for embedding any Unicode character in HTML without worrying about encoding issues.',
  },
]

function codePoints(input: string): number[] {
  return Array.from(input).map(c => c.codePointAt(0)!)
}

function encode(input: string, format: Format): string {
  if (!input) return ''
  switch (format) {
    case 'ascii': {
      return Array.from(input).map(c => {
        const code = c.charCodeAt(0)
        return code > 127 ? `[?]` : code.toString(10)
      }).join(' ')
    }
    case 'utf8': {
      const bytes = new TextEncoder().encode(input)
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ')
    }
    case 'utf16':
      return Array.from({ length: input.length }, (_, i) =>
        input.charCodeAt(i).toString(16).padStart(4, '0')
      ).join(' ')
    case 'utf32':
      return codePoints(input).map(cp => cp.toString(16).padStart(8, '0')).join(' ')
    case 'codepoints':
      return codePoints(input).map(cp => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`).join(' ')
    case 'js-escape':
      return Array.from(input).map(c => {
        const cp = c.codePointAt(0)!
        if (cp < 0x80) return c
        return cp > 0xFFFF ? `\\u{${cp.toString(16)}}` : `\\u${cp.toString(16).padStart(4, '0')}`
      }).join('')
    case 'html-entities':
      return Array.from(input).map(c => {
        const cp = c.codePointAt(0)!
        return cp < 0x80 ? c : `&#x${cp.toString(16).toUpperCase()};`
      }).join('')
  }
}

function decode(raw: string, format: Format): { value: string; error: string | null } {
  if (!raw.trim()) return { value: '', error: null }
  try {
    switch (format) {
      case 'ascii': {
        const tokens = raw.trim().split(/\s+/)
        if (tokens.some(t => !/^\d+$/.test(t))) throw new Error('Expected decimal values like: 72 101 108')
        const values = tokens.map(Number)
        if (values.some(v => v > 127)) throw new Error('Values above 127 are not valid ASCII')
        if (values.some(v => v < 0)) throw new Error('Negative values are not valid ASCII')
        return { value: values.map(v => String.fromCharCode(v)).join(''), error: null }
      }
      case 'utf8': {
        const tokens = raw.trim().split(/\s+/)
        if (tokens.some(t => !/^[0-9a-fA-F]{1,2}$/.test(t)))
          throw new Error('Expected hex bytes like: 68 65 6c 6c 6f')
        const bytes = new Uint8Array(tokens.map(t => parseInt(t, 16)))
        return { value: new TextDecoder().decode(bytes), error: null }
      }
      case 'utf16': {
        const tokens = raw.trim().split(/\s+/)
        if (tokens.some(t => !/^[0-9a-fA-F]{1,4}$/.test(t)))
          throw new Error('Expected 4-digit hex units like: 0068 05d0')
        return { value: tokens.map(t => String.fromCharCode(parseInt(t, 16))).join(''), error: null }
      }
      case 'utf32': {
        const tokens = raw.trim().split(/\s+/)
        if (tokens.some(t => !/^[0-9a-fA-F]{1,8}$/.test(t)))
          throw new Error('Expected 8-digit hex units like: 00000068 000005d0')
        return { value: tokens.map(t => String.fromCodePoint(parseInt(t, 16))).join(''), error: null }
      }
      case 'codepoints': {
        const tokens = raw.trim().split(/\s+/)
        if (tokens.some(t => !/^U\+[0-9a-fA-F]{1,6}$/i.test(t)))
          throw new Error('Expected code points like: U+0041 U+05D0')
        return { value: tokens.map(t => String.fromCodePoint(parseInt(t.slice(2), 16))).join(''), error: null }
      }
      case 'js-escape': {
        const result = raw
          .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        return { value: result, error: null }
      }
      case 'html-entities': {
        const result = raw
          .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
        return { value: result, error: null }
      }
    }
  } catch (e) {
    return { value: '', error: (e as Error).message }
  }
}

function StringConverter() {
  const [format, setFormat] = useState<Format>('utf8')
  const [source, setSource] = useState<'string' | 'encoded'>('string')
  const [stringVal, setStringVal] = useState('')
  const [encodedVal, setEncodedVal] = useState('')

  const activeFormat = FORMATS.find(f => f.value === format)!

  const decodeResult = useMemo(
    () => source === 'encoded' ? decode(encodedVal, format) : null,
    [encodedVal, format, source]
  )

  const handleStringChange = (val: string) => {
    setSource('string')
    setStringVal(val)
    setEncodedVal(encode(val, format))
  }

  const handleEncodedChange = (val: string) => {
    setSource('encoded')
    setEncodedVal(val)
    setStringVal(decode(val, format).value)
  }

  const handleFormatChange = (f: Format) => {
    setFormat(f)
    if (source === 'string') {
      setEncodedVal(encode(stringVal, f))
    } else {
      setStringVal(decode(encodedVal, f).value)
    }
  }

  const hasNonAscii = format === 'ascii' && source === 'string' && Array.from(stringVal).some(c => c.charCodeAt(0) > 127)
  const isValid = !hasNonAscii && (source !== 'encoded' || decodeResult?.error === null)
  const hasEncoded = encodedVal.trim().length > 0

  return (
    <ToolLayout title="Unicode Converter" description="Encode and decode strings across Unicode formats">
      <div className="flex flex-col gap-5">

        <div className="flex flex-wrap gap-2">
          {FORMATS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFormatChange(f.value)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                format === f.value
                  ? 'border-vs-accent text-vs-text bg-vs-active'
                  : 'border-vs-border text-vs-muted bg-vs-sidebar hover:bg-vs-hover hover:text-vs-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-vs-muted text-xs border-l-2 border-vs-border pl-3 leading-relaxed">
          {activeFormat.description}
        </p>

        {hasNonAscii && (
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <XCircle size={13} /> Your string contains non-ASCII characters — they are shown as [?] in the output.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-vs-muted text-xs uppercase tracking-widest">String</label>
            <textarea
              value={stringVal}
              onChange={e => handleStringChange(e.target.value)}
              placeholder="Plain text..."
              rows={6}
              className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-vs-muted text-xs uppercase tracking-widest">{activeFormat.label}</label>
              {hasEncoded && (
                <span className={`flex items-center gap-1 text-xs ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                  {isValid
                    ? <><CheckCircle size={12} /> Valid</>
                    : <><XCircle size={12} /> {decodeResult?.error}</>
                  }
                </span>
              )}
            </div>
            <textarea
              value={encodedVal}
              onChange={e => handleEncodedChange(e.target.value)}
              placeholder="Paste here to decode..."
              rows={6}
              className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm px-3 py-2 rounded outline-none focus:border-vs-accent font-mono transition-colors resize-none"
            />
          </div>
        </div>

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'string-converter',
    name: 'Unicode Converter',
    description: 'Encode and decode strings across Unicode formats',
    icon: ArrowsLeftRight,
    tags: ['encoding', 're'],
  },
  Component: StringConverter,
} satisfies Tool
