import { useState, useMemo } from 'react'
import { Key, WarningCircle, CheckCircle, Clock } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '=='.slice((base64.length % 4) || 4)
  return decodeURIComponent(escape(atob(padded)))
}

function parseJWT(token: string): { header: object; payload: object; signature: string } | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return null
  try {
    return {
      header:    JSON.parse(base64urlDecode(parts[0])),
      payload:   JSON.parse(base64urlDecode(parts[1])),
      signature: parts[2],
    }
  } catch {
    return null
  }
}

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleString()
}

function ClaimRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-vs-border last:border-0">
      <span className="text-vs-muted text-xs font-mono w-12 shrink-0 pt-0.5">{label}</span>
      <span className="text-vs-text text-xs font-mono break-all">{JSON.stringify(value)}</span>
    </div>
  )
}

function Section({ title, data }: { title: string; data: object }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-vs-muted text-xs uppercase tracking-widest">{title}</span>
      <div className="bg-vs-sidebar border border-vs-border rounded px-3 py-1">
        {Object.entries(data).map(([k, v]) => <ClaimRow key={k} label={k} value={v} />)}
      </div>
    </div>
  )
}

function JWTDecoder() {
  const [input, setInput] = useState('')

  const result = useMemo(() => input.trim() ? parseJWT(input) : null, [input])

  const now = Math.floor(Date.now() / 1000)
  const payload = result?.payload as Record<string, unknown> | undefined
  const exp = payload?.exp as number | undefined
  const nbf = payload?.nbf as number | undefined
  const iat = payload?.iat as number | undefined

  const isExpired  = exp !== undefined && now > exp
  const notYetValid = nbf !== undefined && now < nbf

  return (
    <ToolLayout title="JWT Decoder" description="Decode and inspect JSON Web Tokens">
      <div className="flex flex-col gap-5 max-w-2xl">

        <p className="text-vs-muted text-xs border-l-2 border-vs-border pl-3 leading-relaxed">
          Paste a JWT to decode its header and payload. The signature is not verified — this tool only decodes, it does not validate.
        </p>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          rows={3}
          spellCheck={false}
          className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors resize-none"
        />

        {input.trim() && !result && (
          <div className="flex items-center gap-2 text-red-500 text-xs">
            <WarningCircle size={14} /> Invalid JWT — expected 3 dot-separated Base64URL parts.
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-4">

            {/* Status bar */}
            <div className="flex flex-wrap gap-2">
              {exp !== undefined && (
                <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
                  isExpired
                    ? 'text-red-500 border-red-500 bg-red-500/10'
                    : 'text-green-500 border-green-500 bg-green-500/10'
                }`}>
                  {isExpired ? <WarningCircle size={12} /> : <CheckCircle size={12} />}
                  {isExpired ? `Expired ${formatTime(exp)}` : `Expires ${formatTime(exp)}`}
                </span>
              )}
              {notYetValid && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border text-yellow-500 border-yellow-500 bg-yellow-500/10">
                  <Clock size={12} /> Not valid until {formatTime(nbf!)}
                </span>
              )}
              {iat !== undefined && (
                <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border text-vs-muted border-vs-border">
                  <Clock size={12} /> Issued {formatTime(iat)}
                </span>
              )}
            </div>

            <Section title="Header" data={result.header} />
            <Section title="Payload" data={result.payload} />

            <div className="flex flex-col gap-1">
              <span className="text-vs-muted text-xs uppercase tracking-widest">Signature</span>
              <div className="bg-vs-sidebar border border-vs-border rounded px-3 py-2 font-mono text-xs text-vs-muted break-all">
                {result.signature}
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
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and inspect JSON Web Tokens',
    icon: Key,
    tags: ['web', 'auth', 'encoding'],
  },
  Component: JWTDecoder,
} satisfies Tool
