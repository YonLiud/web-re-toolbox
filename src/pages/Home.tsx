import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { toolGroups, tools } from '../tools/registry'
import { searchTools } from '../tools/search'

export function Home() {
  const [query, setQuery] = useState('')
  const featured = tools.filter(tool =>
    ['hex-calculator', 'http-request', 'jwt-decoder', 'reverse-shell'].includes(tool.meta.slug)
  )
  const searchResults = useMemo(() => searchTools(query).slice(0, query.trim() ? 8 : 5), [query])
  const groupedResults = useMemo(() => {
    if (query.trim()) return searchResults
    return featured.map(tool => ({
      tool,
      group: toolGroups.find(group => group.tools.includes(tool))?.name ?? '',
      aliases: [],
    }))
  }, [featured, query, searchResults])

  return (
    <div className="min-h-full bg-vs-bg px-6 py-10 pb-14 text-vs-text">
      <div className="mx-auto w-full max-w-5xl">
        <section className="mb-10">
          <p className="text-[10px] uppercase tracking-widest text-vs-muted">Yon&apos;s Toolbox</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal">What do you need?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-vs-muted">
            Type a task, payload, format, protocol, or shortcut. The catalog stays out of the way until you need it.
          </p>

          <div className="mt-7 overflow-hidden rounded-2xl border border-vs-border bg-vs-panel">
            <div className="flex items-center gap-3 border-b border-vs-border px-4 py-3">
              <MagnifyingGlass size={20} className="shrink-0 text-vs-muted" />
              <input
                autoFocus
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Try: jwt, eip offset, base64, curl, cidr, reverse shell..."
                className="h-10 w-full bg-transparent text-base text-vs-text outline-none placeholder:text-vs-muted"
              />
              <span className="hidden rounded-md bg-vs-input px-2 py-1 font-mono text-[10px] text-vs-muted sm:block">
                search
              </span>
            </div>

            <div className="divide-y divide-vs-border">
              {groupedResults.map(({ tool, group }) => {
                const Icon = tool.meta.icon
                return (
                  <Link
                    key={tool.meta.slug}
                    to={`/${tool.meta.slug}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-vs-hover"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-vs-input text-vs-muted group-hover:text-vs-accent">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-vs-text">{tool.meta.name}</span>
                      <span className="block truncate text-xs text-vs-muted">{tool.meta.description}</span>
                    </span>
                    <span className="hidden rounded-full bg-vs-input px-2 py-1 text-xs text-vs-muted sm:block">
                      {group}
                    </span>
                  </Link>
                )
              })}
              {groupedResults.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-vs-muted">
                  No matching tools.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {['jwt', 'base64', 'eip offset', 'curl', 'cidr'].map(example => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-full bg-vs-panel px-2.5 py-1 text-xs text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-vs-muted">Catalog</p>
            <span className="font-mono text-xs text-vs-muted">{tools.length} local tools</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
          {toolGroups.map(group => (
            <section key={group.name} className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{group.name}</h2>
                <span className="font-mono text-xs text-vs-muted">{group.tools.length}</span>
              </div>
              <div className="overflow-hidden rounded-lg bg-vs-panel">
                {group.tools.map(({ meta }) => {
                  const Icon = meta.icon
                  return (
                    <Link
                      key={meta.slug}
                      to={`/${meta.slug}`}
                      className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-vs-hover"
                    >
                      <Icon size={17} className="shrink-0 text-vs-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{meta.name}</p>
                        <p className="truncate text-xs text-vs-muted">{meta.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
          </div>
        </section>
      </div>
    </div>
  )
}
