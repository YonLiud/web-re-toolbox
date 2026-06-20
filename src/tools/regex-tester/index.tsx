import { useState, useMemo } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

const FLAGS = [
  { flag: 'g', label: 'g', title: 'Global — find all matches' },
  { flag: 'i', label: 'i', title: 'Case insensitive' },
  { flag: 'm', label: 'm', title: 'Multiline — ^ and $ match line boundaries' },
  { flag: 's', label: 's', title: 'Dot-all — . matches newlines too' },
  { flag: 'u', label: 'u', title: 'Unicode — full Unicode support' },
]

interface Match {
  index: number
  value: string
  groups: (string | undefined)[]
  namedGroups: Record<string, string> | null
}

function buildRegex(pattern: string, flags: Set<string>): RegExp | null {
  try {
    return new RegExp(pattern, [...flags].join(''))
  } catch {
    return null
  }
}

function getMatches(regex: RegExp, text: string): Match[] {
  const matches: Match[] = []
  if (regex.flags.includes('g')) {
    let m: RegExpExecArray | null
    regex.lastIndex = 0
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        index: m.index,
        value: m[0],
        groups: m.slice(1),
        namedGroups: m.groups ? { ...m.groups } : null,
      })
      if (m[0].length === 0) regex.lastIndex++
    }
  } else {
    const m = regex.exec(text)
    if (m) matches.push({
      index: m.index,
      value: m[0],
      groups: m.slice(1),
      namedGroups: m.groups ? { ...m.groups } : null,
    })
  }
  return matches
}

function HighlightedText({ text, matches }: { text: string; matches: Match[] }) {
  if (!text) return null
  if (matches.length === 0) return <span className="text-vs-text">{text}</span>

  const segments: { text: string; highlight: boolean }[] = []
  let cursor = 0

  for (const m of matches) {
    if (m.index > cursor) segments.push({ text: text.slice(cursor, m.index), highlight: false })
    segments.push({ text: m.value, highlight: true })
    cursor = m.index + m.value.length
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlight: false })

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight
          ? <mark key={i} className="bg-vs-accent/30 text-vs-text rounded-sm">{seg.text}</mark>
          : <span key={i} className="text-vs-text">{seg.text}</span>
      )}
    </>
  )
}

function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<Set<string>>(new Set(['g']))
  const [text, setText] = useState('')

  const toggleFlag = (f: string) =>
    setFlags(prev => { const next = new Set(prev); next.has(f) ? next.delete(f) : next.add(f); return next })

  const regex = useMemo(() => pattern ? buildRegex(pattern, flags) : null, [pattern, flags])
  const regexError = pattern && regex === null

  const matches = useMemo(() => {
    if (!regex || !text) return []
    try { return getMatches(regex, text) } catch { return [] }
  }, [regex, text])

  return (
    <ToolLayout title="Regex Tester" description="Test regular expressions with live match highlighting">
      <div className="flex flex-col gap-5 max-w-2xl">

        {/* Pattern + flags */}
        <div className="flex flex-col gap-2">
          <label className="text-vs-muted text-xs uppercase tracking-widest">Pattern</label>
          <div className={`flex items-center bg-vs-sidebar border rounded transition-colors ${regexError ? 'border-red-500' : 'border-vs-border focus-within:border-vs-accent'}`}>
            <span className="text-vs-muted px-3 font-mono text-sm select-none">/</span>
            <input
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="[a-z]+"
              spellCheck={false}
              className="flex-1 bg-transparent text-vs-text text-sm font-mono outline-none py-2"
            />
            <span className="text-vs-muted px-1 font-mono text-sm select-none">/</span>
            <div className="flex items-center gap-0.5 px-2">
              {FLAGS.map(({ flag, label, title }) => (
                <button
                  key={flag}
                  onClick={() => toggleFlag(flag)}
                  title={title}
                  className={`w-6 h-6 text-xs font-mono rounded transition-colors ${
                    flags.has(flag)
                      ? 'bg-vs-active text-vs-text border border-vs-accent'
                      : 'text-vs-muted hover:text-vs-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {regexError && <p className="text-red-500 text-xs">Invalid regular expression.</p>}
        </div>

        {/* Test string */}
        <div className="flex flex-col gap-2">
          <label className="text-vs-muted text-xs uppercase tracking-widest">Test string</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste text to test against..."
            rows={5}
            spellCheck={false}
            className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors resize-none"
          />
        </div>

        {/* Highlighted preview */}
        {text && regex && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-vs-muted text-xs uppercase tracking-widest">Preview</label>
              <span className="text-vs-muted text-xs">
                {matches.length === 0 ? 'No matches' : `${matches.length} match${matches.length !== 1 ? 'es' : ''}`}
              </span>
            </div>
            <div className="bg-vs-sidebar border border-vs-border rounded px-3 py-2 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
              <HighlightedText text={text} matches={matches} />
            </div>
          </div>
        )}

        {/* Match list */}
        {matches.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-vs-muted text-xs uppercase tracking-widest">Matches</label>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className="bg-vs-sidebar border border-vs-border rounded px-3 py-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-vs-text text-xs font-mono break-all">{m.value || <em className="text-vs-muted">empty</em>}</span>
                    <span className="text-vs-muted text-xs font-mono shrink-0 ml-3">index {m.index}</span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {m.groups.map((g, gi) => (
                        <span key={gi} className="text-vs-muted text-xs font-mono">
                          group {gi + 1}: <span className="text-vs-text">{g ?? 'undefined'}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {m.namedGroups && Object.keys(m.namedGroups).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {Object.entries(m.namedGroups).map(([k, v]) => (
                        <span key={k} className="text-vs-muted text-xs font-mono">
                          {k}: <span className="text-vs-text">{v}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions with live match highlighting',
    icon: MagnifyingGlass,
    tags: ['util'],
  },
  Component: RegexTester,
} satisfies Tool
