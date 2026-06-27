import type { ReactNode } from 'react'
import { Check } from '@phosphor-icons/react'

type Option<T extends string> = {
  value: T
  label: string
  hint?: string
}

export function WorkbenchGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
      {children}
    </div>
  )
}

export function Panel({
  title,
  eyebrow,
  children,
  actions,
  className = '',
}: {
  title?: string
  eyebrow?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section className={`border border-vs-border bg-vs-panel rounded-md ${className}`}>
      {(title || eyebrow || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-vs-border px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <p className="text-[10px] uppercase tracking-widest text-vs-muted">{eyebrow}</p>}
            {title && <h2 className="mt-0.5 text-sm font-semibold text-vs-text">{title}</h2>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function ControlLabel({ children }: { children: ReactNode }) {
  return <span className="text-[10px] uppercase tracking-widest text-vs-muted">{children}</span>
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  compact = false,
}: {
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  compact?: boolean
}) {
  return (
    <div className="inline-flex max-w-full overflow-hidden rounded-md border border-vs-border bg-vs-sidebar">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          title={option.hint}
          className={[
            'border-r border-vs-border text-xs transition-colors last:border-r-0',
            compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
            value === option.value
              ? 'bg-vs-active text-vs-text'
              : 'text-vs-muted hover:bg-vs-hover hover:text-vs-text',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function ToggleChip({
  selected,
  children,
  onClick,
}: {
  selected: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
        selected
          ? 'border-vs-accent bg-vs-accent-soft text-vs-text'
          : 'border-vs-border bg-vs-sidebar text-vs-muted hover:bg-vs-hover hover:text-vs-text',
      ].join(' ')}
    >
      {selected && <Check size={12} weight="bold" className="text-vs-accent" />}
      {children}
    </button>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
  error,
  actions,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  error?: boolean
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <ControlLabel>{label}</ControlLabel>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className={[
          'w-full resize-y rounded-md border bg-vs-input px-3 py-2 font-mono text-sm leading-relaxed text-vs-text outline-none transition-colors placeholder:text-vs-muted',
          error ? 'border-red-500' : 'border-vs-border focus:border-vs-accent',
        ].join(' ')}
      />
    </div>
  )
}

export function MetricStrip({
  items,
}: {
  items: { label: string; value: string; tone?: 'normal' | 'warn' | 'good' }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-vs-border bg-vs-border sm:grid-cols-4">
      {items.map(item => (
        <div key={item.label} className="bg-vs-sidebar px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-vs-muted">{item.label}</p>
          <p
            className={[
              'mt-1 font-mono text-sm',
              item.tone === 'warn' ? 'text-yellow-400' : item.tone === 'good' ? 'text-green-400' : 'text-vs-text',
            ].join(' ')}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export function OutputBlock({
  label,
  value,
  action,
  muted,
}: {
  label: string
  value: string
  action?: ReactNode
  muted?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-md border border-vs-border bg-vs-sidebar">
      <div className="flex items-center justify-between gap-2 border-b border-vs-border px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-vs-muted">{label}</span>
        {action}
      </div>
      <pre
        className={[
          'max-h-48 overflow-auto whitespace-pre-wrap break-all px-3 py-2 font-mono text-xs leading-relaxed',
          muted ? 'text-vs-muted' : 'text-vs-text',
        ].join(' ')}
      >
        {value}
      </pre>
    </div>
  )
}
