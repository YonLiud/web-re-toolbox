import { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Sun, Moon, GithubLogo, MagnifyingGlass } from '@phosphor-icons/react'
import { tools } from '../tools/registry'
import { useTheme } from '../context/ThemeContext'

const ALL_TAGS = Array.from(
  new Set(tools.flatMap(t => t.meta.tags))
).sort()

export function Sidebar() {
  const { theme, toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = tools
    if (activeTag)
      list = list.filter(({ meta }) => meta.tags.includes(activeTag))
    if (query.trim())
      list = list.filter(({ meta }) =>
        meta.name.toLowerCase().includes(query.toLowerCase()) ||
        meta.description.toLowerCase().includes(query.toLowerCase())
      )
    return list
  }, [query, activeTag])

  return (
    <aside className="w-56 flex flex-col h-screen bg-vs-sidebar border-r border-vs-border shrink-0">
      <div className="px-4 py-3 border-b border-vs-border">
        <NavLink to="/" className="text-vs-text text-xs font-semibold tracking-widest uppercase hover:text-vs-accent transition-colors">yon's toolbox</NavLink>
      </div>

      <div className="px-3 py-2 border-b border-vs-border flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-vs-bg border border-vs-border rounded px-2 py-1">
          <MagnifyingGlass size={12} className="text-vs-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="bg-transparent text-vs-text text-xs outline-none w-full placeholder:text-vs-muted"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(prev => prev === tag ? null : tag)}
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                activeTag === tag
                  ? 'border-vs-accent text-vs-accent bg-vs-accent/10'
                  : 'border-vs-border text-vs-muted hover:border-vs-text hover:text-vs-text'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <p className="text-vs-muted text-xs px-4 py-3">No tools found.</p>
        )}
        {filtered.map(({ meta }) => {
          const Icon = meta.icon
          return (
            <NavLink
              key={meta.slug}
              to={`/${meta.slug}`}
              onClick={() => setQuery('')}
              className={({ isActive }) =>
                `flex items-center gap-2.5 py-1.5 text-sm transition-colors border-l-2 pl-[14px] ${
                  isActive
                    ? 'bg-vs-active text-vs-text border-vs-accent'
                    : 'text-vs-muted hover:bg-vs-hover hover:text-vs-text border-transparent'
                }`
              }
            >
              <Icon size={15} />
              {meta.name}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-vs-border p-3 flex flex-col gap-1">
        <a
          href="https://github.com/YonLiud/web-re-toolbox"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-vs-muted hover:text-vs-text text-sm px-1 py-1 transition-colors"
        >
          <GithubLogo size={15} />
          <span>GitHub</span>
        </a>
        <button
          onClick={toggle}
          className="flex items-center gap-2 text-vs-muted hover:text-vs-text text-sm w-full px-1 py-1 transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  )
}
