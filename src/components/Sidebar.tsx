import { NavLink } from 'react-router-dom'
import { Sun, Moon, GithubLogo } from '@phosphor-icons/react'
import { tools } from '../tools/registry'
import { useTheme } from '../context/ThemeContext'

export function Sidebar() {
  const { theme, toggle } = useTheme()

  return (
    <aside className="w-56 flex flex-col h-screen bg-vs-sidebar border-r border-vs-border shrink-0">
      <div className="px-4 py-3 border-b border-vs-border">
        <NavLink to="/" className="text-vs-text text-xs font-semibold tracking-widest uppercase hover:text-vs-accent transition-colors">yon's toolbox</NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {tools.map(({ meta }) => {
          const Icon = meta.icon
          return (
            <NavLink
              key={meta.slug}
              to={`/${meta.slug}`}
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
