import { useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

interface HashType {
  name: string
  length: number
  charset: 'hex' | 'base64' | 'any'
  prefix?: string
  confidence: 'likely' | 'possible'
  note?: string
}

const HASH_PATTERNS: { match: (input: string) => HashType[] } = {
  match(input: string): HashType[] {
    const s = input.trim()
    const results: HashType[] = []

    const isHex = /^[0-9a-fA-F]+$/.test(s)
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(s)

    if (isHex) {
      if (s.length === 8)   results.push({ name: 'CRC-32',      length: 8,   charset: 'hex', confidence: 'likely' })
      if (s.length === 32)  results.push({ name: 'MD5',          length: 32,  charset: 'hex', confidence: 'likely' })
      if (s.length === 32)  results.push({ name: 'NTLM',         length: 32,  charset: 'hex', confidence: 'possible', note: 'Same length as MD5' })
      if (s.length === 32)  results.push({ name: 'MD4',          length: 32,  charset: 'hex', confidence: 'possible', note: 'Same length as MD5' })
      if (s.length === 40)  results.push({ name: 'SHA-1',        length: 40,  charset: 'hex', confidence: 'likely' })
      if (s.length === 40)  results.push({ name: 'RIPEMD-160',   length: 40,  charset: 'hex', confidence: 'possible', note: 'Same length as SHA-1' })
      if (s.length === 56)  results.push({ name: 'SHA-224',      length: 56,  charset: 'hex', confidence: 'likely' })
      if (s.length === 56)  results.push({ name: 'SHA3-224',     length: 56,  charset: 'hex', confidence: 'possible', note: 'Same length as SHA-224' })
      if (s.length === 64)  results.push({ name: 'SHA-256',      length: 64,  charset: 'hex', confidence: 'likely' })
      if (s.length === 64)  results.push({ name: 'SHA3-256',     length: 64,  charset: 'hex', confidence: 'possible', note: 'Same length as SHA-256' })
      if (s.length === 64)  results.push({ name: 'BLAKE2s-256',  length: 64,  charset: 'hex', confidence: 'possible', note: 'Same length as SHA-256' })
      if (s.length === 96)  results.push({ name: 'SHA-384',      length: 96,  charset: 'hex', confidence: 'likely' })
      if (s.length === 96)  results.push({ name: 'SHA3-384',     length: 96,  charset: 'hex', confidence: 'possible', note: 'Same length as SHA-384' })
      if (s.length === 128) results.push({ name: 'SHA-512',      length: 128, charset: 'hex', confidence: 'likely' })
      if (s.length === 128) results.push({ name: 'SHA3-512',     length: 128, charset: 'hex', confidence: 'possible', note: 'Same length as SHA-512' })
      if (s.length === 128) results.push({ name: 'Whirlpool',    length: 128, charset: 'hex', confidence: 'possible', note: 'Same length as SHA-512' })
      if (s.length === 128) results.push({ name: 'BLAKE2b-512',  length: 128, charset: 'hex', confidence: 'possible', note: 'Same length as SHA-512' })
    }

    if (s.startsWith('$2a$') || s.startsWith('$2b$') || s.startsWith('$2y$'))
      results.push({ name: 'bcrypt', length: 60, charset: 'any', confidence: 'likely' })
    if (s.startsWith('$1$'))
      results.push({ name: 'MD5crypt', length: 0, charset: 'any', confidence: 'likely' })
    if (s.startsWith('$5$'))
      results.push({ name: 'SHA-256crypt', length: 0, charset: 'any', confidence: 'likely' })
    if (s.startsWith('$6$'))
      results.push({ name: 'SHA-512crypt', length: 0, charset: 'any', confidence: 'likely' })
    if (s.startsWith('$argon2'))
      results.push({ name: 'Argon2', length: 0, charset: 'any', confidence: 'likely' })
    if (s.startsWith('$pbkdf2'))
      results.push({ name: 'PBKDF2', length: 0, charset: 'any', confidence: 'likely' })

    if (isBase64 && !isHex) {
      const byteLen = Math.floor((s.replace(/=+$/, '').length * 3) / 4)
      if (byteLen === 16) results.push({ name: 'MD5 (Base64)',    length: 24,  charset: 'base64', confidence: 'possible' })
      if (byteLen === 20) results.push({ name: 'SHA-1 (Base64)',  length: 28,  charset: 'base64', confidence: 'possible' })
      if (byteLen === 32) results.push({ name: 'SHA-256 (Base64)', length: 44, charset: 'base64', confidence: 'possible' })
      if (byteLen === 64) results.push({ name: 'SHA-512 (Base64)', length: 88, charset: 'base64', confidence: 'possible' })
    }

    return results
  }
}

function HashIdentifier() {
  const [input, setInput] = useState('')

  const results = input.trim() ? HASH_PATTERNS.match(input) : []
  const likely = results.filter(r => r.confidence === 'likely')
  const possible = results.filter(r => r.confidence === 'possible')

  return (
    <ToolLayout title="Hash Identifier" description="Identify the likely algorithm behind a hash string">
      <div className="flex flex-col gap-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <p className="text-vs-muted text-xs border-l-2 border-vs-border pl-3 leading-relaxed">
            Paste a hash and the tool will match it against known formats by length, charset, and prefix.
            Multiple candidates are normal — many algorithms produce the same output length.
          </p>
        </div>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste hash here..."
          rows={3}
          spellCheck={false}
          className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors resize-none"
        />

        {input.trim() && (
          <div className="flex flex-col gap-4">
            {results.length === 0 && (
              <p className="text-vs-muted text-sm">No known hash format matched.</p>
            )}

            {likely.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-vs-muted text-xs uppercase tracking-widest">Likely</span>
                <div className="flex flex-col gap-1">
                  {likely.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-vs-sidebar border border-vs-border rounded">
                      <span className="text-vs-text text-sm font-medium">{r.name}</span>
                      <span className="text-vs-muted text-xs font-mono">{r.length ? `${r.length} chars` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {possible.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-vs-muted text-xs uppercase tracking-widest">Also possible</span>
                <div className="flex flex-col gap-1">
                  {possible.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-vs-sidebar border border-vs-border rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-vs-text text-sm font-medium">{r.name}</span>
                        {r.note && <span className="text-vs-muted text-xs">{r.note}</span>}
                      </div>
                      <span className="text-vs-muted text-xs font-mono">{r.length ? `${r.length} chars` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-vs-muted text-xs">
              Input length: <span className="font-mono text-vs-text">{input.trim().length}</span> chars
            </p>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'hash-identifier',
    name: 'Hash Identifier',
    description: 'Identify the likely algorithm behind a hash string',
    icon: MagnifyingGlass,
  },
  Component: HashIdentifier,
} satisfies Tool
