import { Link } from 'react-router-dom'
import { toolGroups, tools } from '../tools/registry'

export function Home() {
  const featured = tools.slice(0, 4)

  return (
    <div className="min-h-full bg-vs-bg p-6 text-vs-text">
      <div className="mb-6 border-b border-vs-border pb-5">
        <p className="text-[10px] uppercase tracking-widest text-vs-muted">Yon&apos;s Toolbox</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Operator workbench</h1>
            <p className="mt-1 max-w-2xl text-sm text-vs-muted">
              Encoding, payload shaping, binary inspection, and network helpers grouped by the job you are doing.
            </p>
          </div>
          <div className="rounded-md border border-vs-border bg-vs-panel px-3 py-2 font-mono text-xs text-vs-muted">
            {tools.length} tools / local only
          </div>
        </div>
      </div>

      <section className="mb-7">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-vs-muted">Quick start</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map(({ meta }) => {
            const Icon = meta.icon
            return (
              <Link
                key={meta.slug}
                to={`/${meta.slug}`}
                className="group flex min-h-28 flex-col justify-between rounded-md border border-vs-border bg-vs-panel p-4 transition-colors hover:border-vs-accent hover:bg-vs-hover"
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon size={22} className="text-vs-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-vs-muted group-hover:text-vs-text">
                    open
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{meta.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-vs-muted">{meta.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {toolGroups.map(group => (
          <section key={group.name} className="min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{group.name}</h2>
              <span className="font-mono text-xs text-vs-muted">{group.tools.length}</span>
            </div>
            <div className="overflow-hidden rounded-md border border-vs-border bg-vs-panel">
              {group.tools.map(({ meta }) => {
                const Icon = meta.icon
                return (
                  <Link
                    key={meta.slug}
                    to={`/${meta.slug}`}
                    className="flex items-center gap-3 border-b border-vs-border px-3 py-3 transition-colors last:border-b-0 hover:bg-vs-hover"
                  >
                    <Icon size={18} className="shrink-0 text-vs-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{meta.name}</p>
                      <p className="truncate text-xs text-vs-muted">{meta.description}</p>
                    </div>
                    <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                      {meta.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="rounded border border-vs-border px-1.5 py-0.5 text-[10px] text-vs-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
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
