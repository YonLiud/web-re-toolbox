import { useState, useMemo, useRef } from 'react'
import { Globe, Plus, X } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import { CopyBtn } from '../../components/CopyBtn'
import type { Tool } from '../types'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
const HAS_BODY = new Set<Method>(['POST', 'PUT', 'PATCH', 'DELETE'])

const QUICK_HEADERS: { label: string; key: string; value: string }[] = [
  { label: 'Content-Type JSON',     key: 'Content-Type',            value: 'application/json' },
  { label: 'Content-Type Form',     key: 'Content-Type',            value: 'application/x-www-form-urlencoded' },
  { label: 'Authorization Bearer',  key: 'Authorization',           value: 'Bearer ' },
  { label: 'Cookie',                key: 'Cookie',                  value: 'session=' },
  { label: 'User-Agent',            key: 'User-Agent',              value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  { label: 'Referer',               key: 'Referer',                 value: 'https://trusted.com' },
  { label: 'Origin',                key: 'Origin',                  value: 'https://evil.com' },
  { label: 'X-Forwarded-For',       key: 'X-Forwarded-For',         value: '127.0.0.1' },
  { label: 'X-Forwarded-Host',      key: 'X-Forwarded-Host',        value: 'evil.com' },
  { label: 'X-Original-URL',        key: 'X-Original-URL',          value: '/admin' },
  { label: 'X-Rewrite-URL',         key: 'X-Rewrite-URL',           value: '/admin' },
  { label: 'X-HTTP-Method-Override',key: 'X-HTTP-Method-Override',  value: 'PUT' },
  { label: 'Host override',         key: 'Host',                    value: 'internal.service' },
]

interface Header { id: number; key: string; value: string }

let nextId = 1

function parseURL(raw: string) {
  const url = raw.trim()
  if (!url) return null
  try {
    const u = new URL(url)
    return { host: u.host, path: u.pathname + u.search + u.hash || '/' }
  } catch {
    const m = url.match(/^(?:https?:\/\/)?([^/]+)(\/.*)?$/)
    if (m) return { host: m[1], path: m[2] || '/' }
    return { host: url, path: '/' }
  }
}

function buildRaw(method: Method, url: string, headers: Header[], body: string) {
  const parsed = parseURL(url)
  if (!parsed) return ''
  const lines: string[] = [`${method} ${parsed.path} HTTP/1.1`, `Host: ${parsed.host}`]
  for (const h of headers) if (h.key.trim()) lines.push(`${h.key.trim()}: ${h.value}`)
  if (HAS_BODY.has(method) && body) lines.push('', body)
  return lines.join('\r\n')
}

function buildCurl(method: Method, url: string, headers: Header[], body: string) {
  const parts: string[] = [`curl -X ${method} "${url}"`]
  for (const h of headers) if (h.key.trim()) parts.push(`  -H "${h.key.trim()}: ${h.value.replace(/"/g, '\\"')}"`)
  if (HAS_BODY.has(method) && body) parts.push(`  -d '${body.replace(/'/g, "'\\''")}'`)
  return parts.join(' \\\n')
}

// --- JSON body editor ---

const LINE_H = 20 // px — must match both textarea and gutter

function parseJsonError(msg: string, text: string): { error: string; line: number | null } {
  const lineM = msg.match(/at line (\d+)/)
  if (lineM) return { error: msg.replace(/\s+at line.+$/, ''), line: parseInt(lineM[1]) }
  const posM = msg.match(/at position (\d+)/)
  if (posM) {
    const pos = parseInt(posM[1])
    return { error: msg.replace(/\s+at position.+$/, ''), line: text.slice(0, pos).split('\n').length }
  }
  return { error: msg.replace(/^SyntaxError:\s*/, ''), line: null }
}

function BodyEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const taRef     = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lineCount = Math.max(1, value.split('\n').length)
  const isJson    = value.trimStart().startsWith('{') || value.trimStart().startsWith('[')

  const jsonState = useMemo(() => {
    if (!isJson || !value.trim()) return { error: null, line: null }
    try { JSON.parse(value); return { error: null, line: null } }
    catch (e) { return parseJsonError((e as Error).message, value) }
  }, [value, isJson])

  const format = () => {
    try { onChange(JSON.stringify(JSON.parse(value.trim()), null, 2)) } catch { /* no-op */ }
  }

  const syncScroll = () => {
    if (taRef.current && gutterRef.current)
      gutterRef.current.scrollTop = taRef.current.scrollTop
  }

  const hasError  = isJson && !!jsonState.error
  const isValid   = isJson && !jsonState.error && value.trim().length > 0
  const canFormat = isValid

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-vs-muted text-xs uppercase tracking-widest">Body</label>
        <div className="flex items-center gap-3">
          {isValid && (
            <span className="text-green-400 text-xs">✓ valid json</span>
          )}
          {hasError && (
            <span
              className="text-red-400 text-xs font-mono truncate max-w-[260px]"
              title={jsonState.error ?? ''}
            >
              ✕ {jsonState.error && jsonState.error.length > 42
                ? jsonState.error.slice(0, 42) + '…'
                : jsonState.error}
            </span>
          )}
          <button
            onClick={format}
            disabled={!canFormat}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
              canFormat
                ? 'border-vs-border text-vs-muted hover:bg-vs-hover hover:text-vs-text'
                : 'border-vs-border text-vs-border opacity-30 cursor-not-allowed'
            }`}
          >
            Format
          </button>
        </div>
      </div>

      <div className={`flex border rounded overflow-hidden transition-colors ${
        hasError ? 'border-red-500/50' : 'border-vs-border focus-within:border-vs-accent'
      }`}>
        {/* Line number gutter */}
        <div
          ref={gutterRef}
          className="overflow-hidden select-none bg-vs-active border-r border-vs-border py-2"
          style={{ lineHeight: `${LINE_H}px` }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              style={{ height: LINE_H, lineHeight: `${LINE_H}px` }}
              className={`text-right text-xs font-mono px-2 ${
                jsonState.line === i + 1
                  ? 'text-red-400 bg-red-500/10'
                  : 'text-vs-muted'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          rows={8}
          spellCheck={false}
          placeholder={'{\n  "key": "value"\n}'}
          style={{ lineHeight: `${LINE_H}px` }}
          className="flex-1 bg-vs-sidebar text-vs-text text-sm font-mono px-3 py-2 outline-none resize-none"
        />
      </div>

      {hasError && jsonState.line && (
        <p className="text-red-400 text-xs font-mono">
          line {jsonState.line}: {jsonState.error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------


function OutputBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-vs-muted text-xs uppercase tracking-widest">{label}</span>
        <CopyBtn value={value} size={13} />
      </div>
      <pre className="bg-vs-sidebar border border-vs-border rounded p-3 text-vs-text text-xs font-mono whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">
        {value || <span className="text-vs-muted italic">—</span>}
      </pre>
    </div>
  )
}

function HttpRequestBuilder() {
  const [method, setMethod]   = useState<Method>('GET')
  const [url, setUrl]         = useState('https://example.com/api/endpoint')
  const [headers, setHeaders] = useState<Header[]>([])
  const [body, setBody]       = useState('')
  const [showQuick, setShowQuick] = useState(false)

  const addHeader = (key = '', value = '') =>
    setHeaders(prev => [...prev, { id: nextId++, key, value }])

  const updateHeader = (id: number, field: 'key' | 'value', val: string) =>
    setHeaders(prev => prev.map(h => h.id === id ? { ...h, [field]: val } : h))

  const removeHeader = (id: number) =>
    setHeaders(prev => prev.filter(h => h.id !== id))

  const raw  = useMemo(() => buildRaw(method, url, headers, body),  [method, url, headers, body])
  const curl = useMemo(() => buildCurl(method, url, headers, body), [method, url, headers, body])

  return (
    <ToolLayout title="HTTP Request Builder" description="Craft raw HTTP requests and cURL commands with custom headers and body">
      <div className="flex flex-col gap-5 max-w-2xl">

        {/* Method + URL */}
        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-vs-muted text-xs uppercase tracking-widest">Method</label>
            <div className="flex border border-vs-border rounded overflow-hidden">
              {METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`px-2.5 py-2 text-xs transition-colors ${method === m ? 'bg-vs-active text-vs-text' : 'bg-vs-sidebar text-vs-muted hover:bg-vs-hover'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-vs-muted text-xs uppercase tracking-widest">URL</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              spellCheck={false}
              className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors"
            />
          </div>
        </div>

        {/* Headers */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-vs-muted text-xs uppercase tracking-widest">Headers</span>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowQuick(v => !v)}
                  className="flex items-center gap-1 text-xs text-vs-muted hover:text-vs-text transition-colors px-2 py-1 rounded border border-vs-border hover:bg-vs-hover"
                >
                  Quick add
                </button>
                {showQuick && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-vs-sidebar border border-vs-border rounded shadow-lg w-56">
                    {QUICK_HEADERS.map(qh => (
                      <button
                        key={qh.label}
                        onClick={() => { addHeader(qh.key, qh.value); setShowQuick(false) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-vs-text hover:bg-vs-hover transition-colors"
                      >
                        <span className="text-vs-muted">{qh.key}: </span>{qh.value || '…'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => addHeader()}
                className="flex items-center gap-1 text-xs text-vs-muted hover:text-vs-text transition-colors px-2 py-1 rounded border border-vs-border hover:bg-vs-hover"
              >
                <Plus size={11} /> Add
              </button>
            </div>
          </div>

          {headers.length > 0 && (
            <div className="flex flex-col gap-1">
              {headers.map(h => (
                <div key={h.id} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={h.key}
                    onChange={e => updateHeader(h.id, 'key', e.target.value)}
                    placeholder="Header-Name"
                    spellCheck={false}
                    className="w-40 shrink-0 bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-2 py-1.5 rounded outline-none focus:border-vs-accent transition-colors"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={e => updateHeader(h.id, 'value', e.target.value)}
                    placeholder="value"
                    spellCheck={false}
                    className="flex-1 bg-vs-sidebar border border-vs-border text-vs-text text-xs font-mono px-2 py-1.5 rounded outline-none focus:border-vs-accent transition-colors"
                  />
                  <button onClick={() => removeHeader(h.id)} className="shrink-0 text-vs-muted hover:text-red-400 transition-colors p-1">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {headers.length === 0 && (
            <p className="text-vs-muted text-xs text-center py-2 border border-dashed border-vs-border rounded">
              No headers — use Add or Quick add above.
            </p>
          )}
        </div>

        {/* Body */}
        {HAS_BODY.has(method) && (
          <BodyEditor value={body} onChange={setBody} />
        )}

        <div className="border-t border-vs-border pt-4 flex flex-col gap-4">
          <OutputBox label="Raw HTTP" value={raw} />
          <OutputBox label="cURL"     value={curl} />
        </div>

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'http-request',
    name: 'HTTP Request Builder',
    description: 'Craft raw HTTP requests and cURL commands with custom headers',
    icon: Globe,
    tags: ['web', 'pentest'],
  },
  Component: HttpRequestBuilder,
} satisfies Tool
