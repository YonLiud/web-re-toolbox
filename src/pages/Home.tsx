import { Link } from 'react-router-dom'
import { tools } from '../tools/registry'

export function Home() {
  return (
    <div className="p-6 bg-vs-bg h-full text-vs-text">
      <p className="text-vs-muted text-xs uppercase tracking-widest mb-6">All Tools</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.map(({ meta }) => {
          const Icon = meta.icon
          return (
            <Link
              key={meta.slug}
              to={`/${meta.slug}`}
              className="flex flex-col gap-3 p-4 rounded border border-vs-border bg-vs-sidebar hover:bg-vs-hover transition-colors"
            >
              <Icon size={24} />
              <div>
                <p className="text-sm font-medium">{meta.name}</p>
                <p className="text-vs-muted text-xs mt-0.5">{meta.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
