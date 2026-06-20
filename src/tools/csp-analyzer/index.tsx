import { useState, useMemo } from 'react'
import { ShieldWarning } from '@phosphor-icons/react'
import { ToolLayout } from '../../components/ToolLayout'
import type { Tool } from '../types'

type Severity = 'high' | 'medium' | 'low' | 'info'

interface Issue {
  severity: Severity
  directive: string
  message: string
}

interface ParsedDirective {
  name: string
  values: string[]
  issues: Issue[]
}

const SEVERITY_STYLE: Record<Severity, { badge: string; dot: string }> = {
  high:   { badge: 'bg-red-500/20    text-red-400',    dot: 'bg-red-500' },
  medium: { badge: 'bg-yellow-500/20 text-yellow-500', dot: 'bg-yellow-500' },
  low:    { badge: 'bg-blue-500/20   text-blue-400',   dot: 'bg-blue-500' },
  info:   { badge: 'bg-green-500/20  text-green-400',  dot: 'bg-green-500' },
}

// Directives that control script execution — most security-critical
const SCRIPT_DIRECTIVES = new Set(['script-src', 'script-src-elem', 'script-src-attr', 'default-src'])

function checkValues(directive: string, values: string[]): Issue[] {
  const issues: Issue[] = []
  const isScript = SCRIPT_DIRECTIVES.has(directive)

  for (const v of values) {
    if (v === '*') {
      issues.push({ severity: isScript ? 'high' : 'medium', directive, message: `Wildcard * allows any origin` })
    }
    if (v === "'unsafe-inline'") {
      issues.push({ severity: 'high', directive, message: `'unsafe-inline' allows inline scripts/styles — negates CSP protection` })
    }
    if (v === "'unsafe-eval'") {
      issues.push({ severity: 'high', directive, message: `'unsafe-eval' allows eval(), Function(), and similar — enables script injection` })
    }
    if (v === "'unsafe-hashes'") {
      issues.push({ severity: 'medium', directive, message: `'unsafe-hashes' allows hashed inline event handlers` })
    }
    if (v === 'data:') {
      issues.push({ severity: isScript ? 'high' : 'medium', directive, message: `data: URI scheme can be abused for XSS (e.g. data:text/html,<script>...)` })
    }
    if (v === 'blob:') {
      issues.push({ severity: 'medium', directive, message: `blob: URI scheme can be used to bypass CSP in some cases` })
    }
    if (v === 'http:') {
      issues.push({ severity: 'medium', directive, message: `http: allows any HTTP source — insecure, use https: instead` })
    }
    if (v === "'strict-dynamic'" && isScript) {
      issues.push({ severity: 'info', directive, message: `'strict-dynamic' present — allows dynamically-added scripts from trusted scripts` })
    }
    if (v.startsWith("'nonce-")) {
      issues.push({ severity: 'info', directive, message: `Nonce-based allowlisting detected — ensure nonces are random per request` })
    }
    if (v.startsWith("'sha")) {
      issues.push({ severity: 'info', directive, message: `Hash-based allowlisting detected — secure if hashes are correct` })
    }
    if (v === "'none'") {
      issues.push({ severity: 'info', directive, message: `'none' blocks all sources for this directive — strictest setting` })
    }
  }

  return issues
}

const REQUIRED_DIRECTIVES: { name: string; why: string; severity: Severity }[] = [
  { name: 'default-src',   why: 'Fallback for all resource types not explicitly covered',         severity: 'medium' },
  { name: 'script-src',    why: 'Controls JS execution — most critical directive',                severity: 'high' },
  { name: 'object-src',    why: 'Without this, plugins/Flash inherit default-src',                severity: 'medium' },
  { name: 'base-uri',      why: 'Missing base-uri allows <base href> injection to redirect loads', severity: 'medium' },
  { name: 'form-action',   why: 'Controls where forms can submit — missing allows open redirect via POST', severity: 'low' },
  { name: 'frame-ancestors', why: 'Replaces X-Frame-Options — prevents clickjacking',            severity: 'low' },
]

function parse(raw: string): ParsedDirective[] {
  return raw
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(segment => {
      const [name, ...rest] = segment.trim().split(/\s+/)
      const values = rest
      const issues = checkValues(name.toLowerCase(), values.map(v => v.toLowerCase()))
      return { name: name.toLowerCase(), values, issues }
    })
}

function scoreLabel(issues: Issue[]): { label: string; color: string } {
  const highs = issues.filter(i => i.severity === 'high').length
  const meds  = issues.filter(i => i.severity === 'medium').length
  if (highs > 0)       return { label: 'Weak',      color: 'text-red-400' }
  if (meds > 0)        return { label: 'Moderate',  color: 'text-yellow-500' }
  return                      { label: 'Strict',     color: 'text-green-400' }
}

const EXAMPLE = `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src *; object-src 'none'; frame-ancestors 'none'`

function CSPAnalyzer() {
  const [input, setInput] = useState('')

  const { directives, allIssues, missingIssues } = useMemo(() => {
    const cleaned = input.trim().replace(/^content-security-policy:\s*/i, '')
    if (!cleaned) return { directives: [], allIssues: [], missingIssues: [] }

    const directives = parse(cleaned)
    const directiveNames = new Set(directives.map(d => d.name))
    const allIssues = directives.flatMap(d => d.issues)

    const missingIssues: Issue[] = []
    for (const req of REQUIRED_DIRECTIVES) {
      if (!directiveNames.has(req.name)) {
        missingIssues.push({
          severity: req.severity,
          directive: req.name,
          message: `Missing — ${req.why}`,
        })
      }
    }

    // Special: object-src not 'none' warning
    const objDir = directives.find(d => d.name === 'object-src')
    if (objDir && !objDir.values.includes("'none'")) {
      missingIssues.push({
        severity: 'medium',
        directive: 'object-src',
        message: `object-src is not 'none' — plugins/Flash may still load`,
      })
    }

    return { directives, allIssues: [...allIssues, ...missingIssues], missingIssues }
  }, [input])

  const score = scoreLabel(allIssues)

  const sortedIssues = [...allIssues].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2, info: 3 }
    return order[a.severity] - order[b.severity]
  })

  return (
    <ToolLayout title="CSP Analyzer" description="Parse Content-Security-Policy headers and surface misconfigurations">
      <div className="flex flex-col gap-5 max-w-2xl">

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-vs-muted text-xs uppercase tracking-widest">CSP Header value</label>
            <button
              onClick={() => setInput(EXAMPLE)}
              className="text-vs-muted text-xs hover:text-vs-text transition-colors"
            >
              Load example
            </button>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`default-src 'self'; script-src 'self' 'unsafe-inline'; ...`}
            rows={4}
            spellCheck={false}
            className="w-full bg-vs-sidebar border border-vs-border text-vs-text text-sm font-mono px-3 py-2 rounded outline-none focus:border-vs-accent transition-colors resize-none"
          />
          <p className="text-vs-muted text-xs">
            Paste the header value or the full <span className="font-mono text-vs-text">Content-Security-Policy: ...</span> line.
          </p>
        </div>

        {directives.length > 0 && (
          <>
            {/* Score */}
            <div className="flex items-center gap-3">
              <span className="text-vs-muted text-xs uppercase tracking-widest">Policy strength</span>
              <span className={`text-sm font-semibold ${score.color}`}>{score.label}</span>
              <span className="text-vs-muted text-xs">
                {allIssues.filter(i => i.severity === 'high').length} high ·{' '}
                {allIssues.filter(i => i.severity === 'medium').length} medium ·{' '}
                {allIssues.filter(i => i.severity === 'low').length} low
              </span>
            </div>

            {/* Issues */}
            {sortedIssues.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-vs-muted text-xs uppercase tracking-widest">Issues</span>
                <div className="flex flex-col gap-1">
                  {sortedIssues.map((issue, i) => {
                    const s = SEVERITY_STYLE[issue.severity]
                    return (
                      <div key={i} className="flex items-start gap-2 bg-vs-sidebar border border-vs-border rounded px-3 py-2">
                        <span className={`mt-0.5 w-1.5 h-1.5 shrink-0 rounded-full ${s.dot}`} />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${s.badge}`}>
                              {issue.severity}
                            </span>
                            <span className="text-vs-text text-xs font-mono">{issue.directive}</span>
                          </div>
                          <span className="text-vs-muted text-xs">{issue.message}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Directive breakdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-vs-muted text-xs uppercase tracking-widest">Directives</span>
              <div className="bg-vs-sidebar border border-vs-border rounded overflow-hidden">
                {directives.map((d, i) => {
                  const hasIssues = d.issues.some(i => i.severity === 'high' || i.severity === 'medium')
                  return (
                    <div key={i} className="flex items-start gap-3 px-3 py-2 border-b border-vs-border last:border-0">
                      <span className={`text-xs font-mono shrink-0 w-36 ${hasIssues ? 'text-yellow-500' : 'text-vs-text'}`}>
                        {d.name}
                      </span>
                      <span className="text-vs-muted text-xs font-mono flex-1 break-all">
                        {d.values.join(' ') || '(empty)'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </ToolLayout>
  )
}

export default {
  meta: {
    slug: 'csp-analyzer',
    name: 'CSP Analyzer',
    description: 'Parse Content-Security-Policy headers and surface misconfigurations',
    icon: ShieldWarning,
  },
  Component: CSPAnalyzer,
} satisfies Tool
