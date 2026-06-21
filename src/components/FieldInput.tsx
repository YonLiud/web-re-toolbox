interface FieldInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: boolean
  mono?: boolean
  type?: string
  className?: string
}

export function FieldInput({
  label, value, onChange, placeholder,
  error, mono = true, type = 'text', className = 'flex-1',
}: FieldInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-vs-muted text-xs uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={[
          'w-full bg-vs-sidebar border text-vs-text text-sm px-3 py-2 rounded outline-none transition-colors',
          mono ? 'font-mono' : '',
          error ? 'border-red-500' : 'border-vs-border focus:border-vs-accent',
        ].join(' ')}
      />
    </div>
  )
}
