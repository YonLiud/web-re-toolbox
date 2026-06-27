import { useState, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Sun, Moon, GithubLogo, MagnifyingGlass, X, List, House } from '@phosphor-icons/react'
import { toolGroups, tools } from '../tools/registry'
import { searchTools } from '../tools/search'
import { useTheme } from '../context/ThemeContext'

export function Sidebar() {
  const { theme, toggle } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return toolGroups

    const matches = searchTools(query)
    return toolGroups
      .map(group => ({
        ...group,
        tools: matches.filter(({ tool }) => group.tools.some(groupTool => groupTool.meta.slug === tool.meta.slug)).map(({ tool }) => tool),
      }))
      .filter(group => group.tools.length > 0)
  }, [query])

  return (
    <nav className="relative shrink-0 border-t border-vs-border bg-vs-sidebar/95 px-3 py-2 backdrop-blur">
      {isMenuOpen && (
        <div className="menu-tray absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-xl border border-vs-border bg-vs-panel shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-vs-border p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-vs-muted">Tool menu</span>
              <p className="mt-1 text-sm text-vs-text">Browse by category or search for a tool.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-vs-border bg-vs-input px-3 py-2 focus-within:border-vs-accent md:w-72">
                <MagnifyingGlass size={15} className="shrink-0 text-vs-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-vs-text outline-none placeholder:text-vs-muted"
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
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
                title="Close menu"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid max-h-[58vh] gap-3 overflow-y-auto p-3 md:grid-cols-2 xl:grid-cols-5">
            {filteredGroups.length === 0 && (
              <div className="col-span-full px-3 py-8 text-center text-sm text-vs-muted">No tools found.</div>
            )}
            {filteredGroups.map(group => (
              <section key={group.name} className="min-w-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-vs-muted">{group.name}</h2>
                  <span className="font-mono text-[10px] text-vs-muted">{group.tools.length}</span>
                </div>
                <div className="grid gap-1">
                  {group.tools.map(tool => {
                    const Icon = tool.meta.icon
                    return (
                      <NavLink
                        key={tool.meta.slug}
                        to={`/${tool.meta.slug}`}
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                            isActive ? 'bg-vs-active text-vs-text' : 'text-vs-muted hover:bg-vs-hover hover:text-vs-text'
                          }`
                        }
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-vs-input text-vs-muted group-hover:text-vs-accent">
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{tool.meta.name}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link to="/" className="hidden shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-vs-text hover:bg-vs-hover md:flex">
          <span className="h-5 w-1 rounded-full bg-vs-accent" />
          <span className="font-medium">Toolbox</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen(value => !value)}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            isMenuOpen
              ? 'border-vs-accent bg-vs-accent-soft text-vs-text'
              : 'border-vs-border bg-vs-input text-vs-muted hover:bg-vs-hover hover:text-vs-text'
          }`}
        >
          <List size={16} />
          <span>Menu</span>
          <span className="hidden font-mono text-xs font-normal text-vs-muted sm:inline">{tools.length} tools</span>
        </button>

        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
          title="Home"
        >
          <House size={15} />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <a
          href="https://github.com/YonLiud/web-re-toolbox"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text sm:flex"
        >
          <GithubLogo size={15} />
        </a>
        <button
          onClick={toggle}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-vs-muted transition-colors hover:bg-vs-hover hover:text-vs-text"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </nav>
  )
}
