import { useState, type ReactNode } from 'react'

/** Pontinho de ajuda com tooltip — pensado para iniciantes. */
export function InfoDot({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Ajuda"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="grid h-4 w-4 place-items-center rounded-full border border-white/20 text-[10px] font-bold text-parchment-200/80 hover:border-arcane-400 hover:text-arcane-400"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-1/2 top-6 z-20 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-900 p-3 text-xs font-normal leading-relaxed text-parchment-100 shadow-xl">
          {children}
        </span>
      )}
    </span>
  )
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 flex items-center gap-1.5 panel-title">
        {label}
        {hint && <InfoDot>{hint}</InfoDot>}
      </span>
      {children}
    </label>
  )
}

export function TextField({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`stat-input ${className}`}
    />
  )
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  className = '',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  className?: string
}) {
  return (
    <input
      type="number"
      value={Number.isNaN(value) ? '' : value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10)
        onChange(Number.isNaN(n) ? 0 : n)
      }}
      className={`stat-input text-center ${className}`}
    />
  )
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`stat-input appearance-none ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="stat-input resize-y leading-relaxed"
    />
  )
}

export function SectionCard({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg text-parchment-100">
          {title}
          {hint && <InfoDot>{hint}</InfoDot>}
        </h2>
        {action}
      </header>
      {children}
    </section>
  )
}
