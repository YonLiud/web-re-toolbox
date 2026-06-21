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
    <div className="rounded border border-vs-border overflow-hidden hover:border-vs-accent/40 transition-colors group">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-vs-sidebar border-b border-vs-border/50">
        {item.badge && (
          <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${item.badgeClass ?? ''}`}>
            {item.badge}
          </span>
        )}
        {item.label && (
          <span title={item.description} className="text-vs-muted text-xs flex-1 truncate">
            {item.label}
          </span>
        )}
        <CopyBtn value={item.value} />
      </div>
      <pre
        title={!item.label && item.description ? item.description : undefined}
        className="px-3 py-2.5 bg-vs-bg font-mono text-xs text-vs-text break-all whitespace-pre-wrap leading-relaxed select-all cursor-text"
      >
        {item.value}
      </pre>
      {item.note && (
        <div className="px-3 py-1.5 border-t border-vs-border/50 text-[10px] text-yellow-500/80">
          ⚠ {item.note}
        </div>
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
      <div className="flex flex-col gap-1.5">
        {items.map(item => <PayloadRow key={item.id} item={item} />)}
      </div>
    </div>
  )
}
