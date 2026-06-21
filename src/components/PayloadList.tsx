import { CopyBtn } from './CopyBtn'

export interface PayloadItem {
  id: string
  badge?: string
  badgeClass?: string
  label?: string
  description?: string
  value: string
  note?: string
}

function PayloadRow({ item }: { item: PayloadItem }) {
  return (
    <div className="border-b border-vs-border last:border-b-0 px-4 py-3 hover:bg-vs-hover transition-colors group">
      <div className="flex items-center gap-2 mb-1.5">
        {item.badge && (
          <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${item.badgeClass ?? ''}`}>
            {item.badge}
          </span>
        )}
        {item.label && (
          <span title={item.description} className="text-vs-muted text-xs flex-1 min-w-0 truncate">
            {item.label}
          </span>
        )}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <CopyBtn value={item.value} />
        </span>
      </div>
      <pre className="font-mono text-xs text-vs-text whitespace-pre-wrap break-all leading-relaxed select-all cursor-text">
        {item.value}
      </pre>
      {item.note && (
        <p className="mt-1.5 text-[10px] text-yellow-500/70">⚠ {item.note}</p>
      )}
    </div>
  )
}

export function PayloadList({
  items,
  listLabel = 'Payloads',
  emptyMessage = 'Toggle at least one category above.',
}: {
  items: PayloadItem[]
  listLabel?: string
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return (
      <p className="text-vs-muted text-xs text-center py-6 border border-dashed border-vs-border rounded">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-vs-muted text-xs uppercase tracking-widest">{listLabel}</span>
        <span className="text-vs-muted text-xs">{items.length} result{items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="border border-vs-border rounded overflow-hidden">
        {items.map(item => <PayloadRow key={item.id} item={item} />)}
      </div>
    </div>
  )
}
