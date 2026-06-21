import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { toolGroups } from '../tools/registry'

export function Home() {
  return (
    <div className="p-6 bg-vs-bg h-full overflow-auto">
      <div className="max-w-2xl flex flex-col gap-8">
        {toolGroups.map(group => (
          <section key={group.name}>
            <p className="text-vs-muted text-[10px] uppercase tracking-widest mb-2">{group.name}</p>
            <div className="border border-vs-border rounded overflow-hidden">
              {group.tools.map(({ meta }, i) => {
                const Icon = meta.icon
                return (
                  <Link
                    key={meta.slug}
                    to={`/${meta.slug}`}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-vs-hover transition-colors group ${
                      i < group.tools.length - 1 ? 'border-b border-vs-border' : ''
                    }`}
                  >
                    <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center bg-vs-active text-vs-muted group-hover:text-vs-text transition-colors">
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-vs-text text-sm font-medium leading-snug">{meta.name}</p>
                      <p className="text-vs-muted text-xs truncate mt-0.5">{meta.description}</p>
                    </div>
                    <ArrowRight size={13} className="text-vs-border group-hover:text-vs-muted transition-colors shrink-0" />
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
