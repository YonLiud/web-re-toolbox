import { useState, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Sun, Moon, GithubLogo, MagnifyingGlass, SquaresFour, X } from '@phosphor-icons/react'
import { toolGroups, tools } from '../tools/registry'
import { useTheme } from '../context/ThemeContext'

type CategoryFilter = 'all' | string

export function Sidebar() {
  const { theme, toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return toolGroups
      .filter(group => activeCategory === 'all' || group.name === activeCategory)
      .map(group => ({
        ...group,
        tools: group.tools.filter(({ meta }) => {
          const matchesQuery = q
            ? meta.name.toLowerCase().includes(q) ||
              meta.description.toLowerCase().includes(q) ||
              meta.tags.some(tag => tag.toLowerCase().includes(q)) ||
              group.name.toLowerCase().includes(q)
            : true
          return matchesQuery
        }),
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
            placeholder="Search tools, tags..."
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
