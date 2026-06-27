import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import { Link, NavLink } from 'react-router-dom'
import { Sun, Moon, GithubLogo, MagnifyingGlass, SquaresFour, X } from '@phosphor-icons/react'
import { toolGroups, tools } from '../tools/registry'
import type { Tool } from '../tools/types'
import { useTheme } from '../context/ThemeContext'

type CategoryFilter = 'all' | string

interface SearchDoc {
  tool: Tool
  group: string
  aliases: string[]
  haystack: string
}

const SEARCH_ALIASES: Record<string, string[]> = {
  'jwt-decoder': ['jwt', 'token', 'bearer', 'claims', 'auth', 'json web token'],
  'encode-decode': ['base64', 'urlencode', 'urldecode', 'percent encode', 'decode', 'encode'],
  'hex-calculator': ['hex', 'bytes', 'ascii', 'utf8', 'utf-8', 'decimal', 'binary', 'byte inspector'],
  'hex-viewer': ['hexdump', 'hex dump', 'offset', 'ascii panel', 'binary view'],
  'buffer-overflow': ['bo', 'bof', 'overflow', 'eip', 'rip', 'offset', 'cyclic', 'pattern', 'shellcode', 'nop'],
  'reverse-shell': ['rev shell', 'revshell', 'listener', 'netcat', 'nc', 'payload'],
  'shell-upgrade': ['tty', 'pty', 'stty', 'interactive shell', 'upgrade shell', 'rlwrap', 'socat'],
  'ip-subnet': ['cidr', 'subnet', 'mask', 'netmask', 'network', 'broadcast', 'hosts'],
  'http-request': ['curl', 'raw http', 'headers', 'request', 'method', 'body'],
  'xss-encoder': ['xss', 'waf', 'bypass', 'html encode', 'javascript', 'payload'],
  'path-traversal': ['lfi', 'rfi', 'directory traversal', 'dot dot slash', 'etc passwd'],
  sqli: ['sql', 'sql injection', 'union', 'blind', 'time based', 'database'],
  'hash-calculator': ['sha', 'sha256', 'sha1', 'digest', 'crypto hash'],
  'hash-identifier': ['identify hash', 'md5', 'ntlm', 'bcrypt', 'argon2'],
  'xor-calculator': ['xor', 'single byte', 'bruteforce', 'brute force', 'key'],
  'number-base': ['base convert', 'decimal', 'hexadecimal', 'octal', 'binary'],
  'bitwise-calculator': ['and', 'or', 'not', 'shift', 'bits', 'bit operations'],
  'regex-tester': ['regex', 'regexp', 'regular expression', 'pattern match'],
  'unix-permissions': ['chmod', 'permissions', 'suid', 'sgid', 'sticky', 'octal'],
  'string-converter': ['unicode', 'codepoint', 'utf16', 'utf32', 'escape'],
  'string-table': ['index string', 'character index', 'chars', 'positions'],
  'csp-analyzer': ['content security policy', 'csp', 'headers', 'script src', 'unsafe inline'],
}

const searchDocs: SearchDoc[] = toolGroups.flatMap(group =>
  group.tools.map(tool => {
    const aliases = SEARCH_ALIASES[tool.meta.slug] ?? []
    return {
      tool,
      group: group.name,
      aliases,
      haystack: [
        tool.meta.name,
        tool.meta.description,
        tool.meta.tags.join(' '),
        aliases.join(' '),
        group.name,
      ].join(' '),
    }
  })
)

const fuse = new Fuse(searchDocs, {
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'tool.meta.name', weight: 0.45 },
    { name: 'aliases', weight: 0.28 },
    { name: 'tool.meta.tags', weight: 0.14 },
    { name: 'group', weight: 0.08 },
    { name: 'tool.meta.description', weight: 0.05 },
  ],
})

export function Sidebar() {
  const { theme, toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) {
      return toolGroups
        .filter(group => activeCategory === 'all' || group.name === activeCategory)
        .map(group => ({ ...group }))
    }

    const docs = fuse.search(q)
      .map(result => result.item)
      .filter(doc => activeCategory === 'all' || doc.group === activeCategory)

    return toolGroups
      .filter(group => activeCategory === 'all' || group.name === activeCategory)
      .map(group => ({
        ...group,
        tools: docs
          .filter(doc => doc.group === group.name)
          .map(doc => doc.tool),
      }))
      .filter(group => group.tools.length > 0)
  }, [query, activeCategory])

  const resultCount = filteredGroups.reduce((sum, group) => sum + group.tools.length, 0)
  const hasFilters = query.trim().length > 0 || activeCategory !== 'all'

  const clearFilters = () => {
    setQuery('')
    setActiveCategory('all')
  }

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-vs-border bg-vs-sidebar shadow-[12px_0_32px_rgba(0,0,0,0.16)]">
      <div className="border-b border-vs-border px-4 py-4">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-md border border-vs-border bg-vs-panel text-vs-accent transition-colors group-hover:border-vs-accent">
            <SquaresFour size={17} weight="bold" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-vs-text">Yon&apos;s Toolbox</span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-vs-muted">local operator kit</span>
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-3 border-b border-vs-border px-3 py-3">
        <div className="flex h-9 items-center gap-2 rounded-md border border-vs-border bg-vs-input px-2.5 transition-colors focus-within:border-vs-accent">
          <MagnifyingGlass size={14} className="shrink-0 text-vs-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools, aliases..."
            className="w-full bg-transparent text-sm text-vs-text outline-none placeholder:text-vs-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded p-0.5 text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-vs-muted">Workflows</span>
          <span className="font-mono text-[10px] text-vs-muted">{resultCount}/{tools.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
              activeCategory === 'all'
                ? 'border-vs-accent bg-vs-accent-soft text-vs-text'
                : 'border-vs-border text-vs-muted hover:bg-vs-hover hover:text-vs-text'
            }`}
          >
            All tools
          </button>
          {toolGroups.map(group => (
            <button
              key={group.name}
              type="button"
              onClick={() => setActiveCategory(prev => prev === group.name ? 'all' : group.name)}
              className={`rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                activeCategory === group.name
                  ? 'border-vs-accent bg-vs-accent-soft text-vs-text'
                  : 'border-vs-border text-vs-muted hover:bg-vs-hover hover:text-vs-text'
              }`}
            >
              <span className="block truncate">{group.name}</span>
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {resultCount === 0 && (
          <div className="rounded-md border border-dashed border-vs-border px-3 py-6 text-center">
            <p className="text-xs text-vs-muted">No tools found.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 rounded-md border border-vs-border px-2 py-1 text-xs text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        {filteredGroups.map(group => (
          <div key={group.name} className="mb-4 last:mb-0">
            <div className="mb-1.5 flex items-center justify-between px-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-vs-muted">{group.name}</p>
              <span className="font-mono text-[10px] text-vs-muted">{group.tools.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {group.tools.map(({ meta }) => {
                const Icon = meta.icon
                return (
                  <NavLink
                    key={meta.slug}
                    to={`/${meta.slug}`}
                    onClick={() => setQuery('')}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-sm transition-colors ${
                        isActive
                          ? 'border-vs-accent bg-vs-active text-vs-text shadow-[inset_3px_0_0_var(--vs-accent)]'
                          : 'border-transparent text-vs-muted hover:border-vs-border hover:bg-vs-hover hover:text-vs-text'
                      }`
                    }
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{meta.name}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-vs-border p-3">
        <a
          href="https://github.com/YonLiud/web-re-toolbox"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
        >
          <GithubLogo size={15} />
          <span>GitHub</span>
        </a>
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  )
}
