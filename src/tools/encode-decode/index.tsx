import { useState, useMemo } from 'react'
import { LockKey, CheckCircle, XCircle } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Format = 'base64' | 'url' | 'hex' | 'binary'

const FORMATS: { value: Format; label: string; description: string }[] = [
  {
    value: 'base64',
    label: 'Base64',
    description: 'Encodes binary data as ASCII text using 64 printable characters. Commonly used to embed images, files, or binary payloads in JSON, HTML, or email.',
  },
  {
    value: 'url',
    label: 'URL',
    description: 'Percent-encodes characters that are not safe in a URL. Spaces become %20, special characters become %XX sequences.',
  },
  {
    value: 'hex',
    label: 'Hex',
    description: 'Represents each Unicode code point as a hexadecimal number. Useful for debugging, low-level inspection, or passing strings through systems that only handle ASCII.',
  },
  {
    value: 'binary',
    label: 'Binary',
    description: 'Shows the raw UTF-8 bytes as groups of 8 bits. Each byte is one group of 0s and 1s.',
  },
]

function encode(input: string, format: Format): string {
  if (!input) return ''
  switch (format) {
    case 'base64':
      return btoa(unescape(encodeURIComponent(input)))
    case 'url':
      return encodeURIComponent(input)
    case 'hex':
      return Array.from(input).map(c => c.codePointAt(0)!.toString(16).padStart(4, '0')).join(' ')
    case 'binary':
      return Array.from(new TextEncoder().encode(input))
        .map(b => b.toString(2).padStart(8, '0'))
        .join(' ')
  }
}

function decode(raw: string, format: Format): { value: string; error: string | null } {
  if (!raw.trim()) return { value: '', error: null }
  try {
    switch (format) {
      case 'base64':
        return { value: decodeURIComponent(escape(atob(raw.trim()))), error: null }
      case 'url':
        return { value: decodeURIComponent(raw), error: null }
      case 'hex': {
        const tokens = raw.trim().split(/\s+/)
        if (tokens.some(t => !/^[0-9a-fA-F]+$/.test(t)))
          throw new Error('Expected hex values like: 0048 0065 006c')
        return { value: tokens.map(t => String.fromCodePoint(parseInt(t, 16))).join(''), error: null }
      }
      case 'binary': {
        const tokens = raw.trim().split(/\s+/)
        if (tokens.some(t => !/^[01]{1,8}$/.test(t)))
          throw new Error('Expected 8-bit groups like: 01001000 01100101')
        const bytes = new Uint8Array(tokens.map(t => parseInt(t, 2)))
        return { value: new TextDecoder().decode(bytes), error: null }
      }
    }
  } catch (e) {
    return { value: '', error: (e as Error).message }
  }
}

function EncodeDecode() {
  const [format, setFormat] = useState<Format>('base64')
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

  const isValid = source !== 'encoded' || decodeResult?.error === null
  const hasEncoded = encodedVal.trim().length > 0

  return (
    <ToolLayout title="Encode / Decode" description="Encode and decode strings using common formats">
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
    slug: 'encode-decode',
    name: 'Encode / Decode',
    description: 'Encode and decode strings using common formats',
    icon: LockKey,
    tags: ['encoding'],
  },
  Component: EncodeDecode,
} satisfies Tool
