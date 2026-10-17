import { Check, Leaf, X } from "lucide-react"
import { ReactNode, useEffect } from "react"
import type { Severity } from "./data"

export type ToastState = { title: string; detail?: string } | null

export function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) as T : fallback
  } catch {
    return fallback
  }
}

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input select" {...props} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input textarea" {...props} />
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-wrap">
      <div className="logo-mark">
        <Leaf size={compact ? 18 : 21} strokeWidth={2.4} />
      </div>
      {!compact && (
        <div>
          <div className="logo-name">Neutron</div>
          <div className="logo-sub">AgriTech</div>
        </div>
      )}
    </div>
  )
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Severity | "neutral" | "offline"
  children: ReactNode
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function TrendChart({
  values,
  color = "green",
  height = 84,
  showArea = true,
}: {
  values: number[]
  color?: "green" | "amber" | "red" | "blue"
  height?: number
  showArea?: boolean
}) {
  const width = 300
  const min = Math.min(...values) - 4
  const max = Math.max(...values) + 4
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / (max - min)) * (height - 12) - 6
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg
      className={`trend-chart chart-${color}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-label="Gráfica de evolución"
    >
      {[0.25, 0.5, 0.75].map((y) => (
        <line
          key={y}
          x1="0"
          x2={width}
          y1={height * y}
          y2={height * y}
          className="chart-grid"
        />
      ))}
      {showArea && (
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          className="chart-area"
        />
      )}
      <polyline points={points} className="chart-line" />
      <circle
        cx={width}
        cy={points.split(" ").at(-1)?.split(",")[1]}
        r="4"
        className="chart-dot"
      />
    </svg>
  )
}

export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onClose, 3600)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <div className="toast-icon">
        <Check size={16} />
      </div>
      <div className="toast-copy">
        <strong>{toast.title}</strong>
        {toast.detail && <span>{toast.detail}</span>}
      </div>
      <Button
        variant="ghost"
        className="icon-button mini"
        aria-label="Cerrar aviso"
        onClick={onClose}
      >
        <X size={16} />
      </Button>
    </div>
  )
}

export function AdminModal({
  title,
  subtitle,
  onClose,
  children,
  className = "",
}: {
  title: string
  subtitle: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <div className="modal-backdrop admin-modal-backdrop">
      <div className={`admin-modal ${className}`}>
        <div className="modal-title">
          <div>
            <span className="display-title small-title">{title}</span>
            <p>{subtitle}</p>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose}>
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function KpiCard({
  icon,
  label,
  value,
  delta,
  tone = "green",
}: {
  icon: ReactNode
  label: string
  value: string
  delta: string
  tone?: string
}) {
  return (
    <div className="admin-kpi">
      <div className={`kpi-icon ${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{delta}</small>
      </div>
    </div>
  )
}

export function AdminPageHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="admin-page-heading">
      <div>
        <span className="admin-title">{title}</span>
        <p>{subtitle}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <Button
          key={option.id}
          variant="ghost"
          className={value === option.id ? "active" : ""}
          onClick={() => onChange(option.id)}
        >
          {option.label}
          {option.count !== undefined && <i className="seg-count">{option.count}</i>}
        </Button>
      ))}
    </div>
  )
}

export function TableRow({
  columns,
  head = false,
  children,
  onClick,
  active = false,
}: {
  columns: string
  head?: boolean
  children: ReactNode
  onClick?: () => void
  active?: boolean
}) {
  return (
    <div
      className={`table-row ${head ? "table-head" : ""} ${onClick ? "clickable-row" : ""} ${active ? "active-row" : ""}`}
      style={{ gridTemplateColumns: columns }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="x-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="x-note">{children}</div>
}

export function euro(amount: number) {
  return amount.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  })
}
