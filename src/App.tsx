import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BatteryMedium,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CloudOff,
  CloudSun,
  Download,
  Droplets,
  FileBarChart,
  FileText,
  Filter,
  Gauge,
  Headphones,
  Home,
  Layers3,
  Leaf,
  Map,
  Menu,
  MoreHorizontal,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sprout,
  TicketCheck,
  Tractor,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
  Wifi,
  WifiOff,
  X,
  XCircle,
  Zap,
} from "lucide-react"
import { ReactNode, useEffect, useState } from "react"
import {
  alerts as initialAlerts,
  devices as initialDevices,
  initialAssistanceRequests,
  initialIntegrations,
  initialNotifications,
  initialReports,
  initialTickets,
  plots as initialPlots,
  rules as initialRules,
  users as initialUsers,
  type AlertItem,
  type AssistanceRequest,
  type DeviceItem,
  type IntegrationItem,
  type Plot,
  type ReportItem,
  type RuleItem,
  type Severity,
  type SupportTicket,
  type SystemNotification,
  type UserItem,
} from "./data"

type Experience = "field" | "admin"
type FieldView = "home" | "alerts" | "actions" | "support"
type AdminView = "overview" | "farms" | "users" | "devices" | "rules" | "analytics" | "reports" | "integrations"

type Resolution = {
  status: "accepted" | "rejected"
  reason?: string
  note?: string
  synced: boolean
  date: string
}

type ToastState = { title: string; detail?: string } | null

type SecurityLimits = {
  maxTimePerSector: number
  minPauseHours: number
  maxFlowRate: number
}

const severityLabels: Record<Severity, string> = {
  critical: "Crítica",
  warning: "Atención",
  info: "Informativa",
  success: "Estable",
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) as T : fallback
  } catch {
    return fallback
  }
}

function Button({
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

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input select" {...props} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input textarea" {...props} />
}

function Logo({ compact = false }: { compact?: boolean }) {
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

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Severity | "neutral" | "offline"
  children: ReactNode
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function TrendChart({
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

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
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

function ExperienceSwitch({
  value,
  onChange,
  compact = false,
}: {
  value: Experience
  onChange: (value: Experience) => void
  compact?: boolean
}) {
  return (
    <div className={`experience-switch ${compact ? "compact" : ""}`}>
      <Button
        variant="ghost"
        className={value === "field" ? "active" : ""}
        onClick={() => onChange("field")}
      >
        <Smartphone size={16} /> {!compact && "Campo"}
      </Button>
      <Button
        variant="ghost"
        className={value === "admin" ? "active" : ""}
        onClick={() => onChange("admin")}
      >
        <BarChart3 size={16} /> {!compact && "Administración"}
      </Button>
    </div>
  )
}

function AdminModal({
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

/* =========================================================================
   FIELD EXPERIENCE COMPONENTS
   ========================================================================= */

function FieldHeader({
  online,
  onToggleOnline,
  pending,
  onSwitch,
}: {
  online: boolean
  onToggleOnline: () => void
  pending: number
  onSwitch: () => void
}) {
  return (
    <>
      <div className="field-header">
        <Logo compact />
        <div className="field-title">
          <span>Finca El Manantial</span>
          <small>Valle Verde · Málaga</small>
        </div>
        <Button
          variant="ghost"
          className={`connection-pill ${online ? "is-online" : "is-offline"}`}
          onClick={onToggleOnline}
        >
          {online ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{online ? "Online" : "Sin conexión"}</span>
        </Button>
        <ExperienceSwitch
          value="field"
          compact
          onChange={(value) => value === "admin" && onSwitch()}
        />
      </div>
      {!online && (
        <div className="offline-banner">
          <CloudOff size={18} />
          <div>
            <strong>Trabajando sin conexión</strong>
            <span>
              {pending} cambios se sincronizarán al recuperar cobertura.
            </span>
          </div>
        </div>
      )}
    </>
  )
}

function FieldNav({
  current,
  onChange,
  unreadAlertsCount,
}: {
  current: FieldView
  onChange: (view: FieldView) => void
  unreadAlertsCount: number
}) {
  const items: { id: FieldView; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "alerts", label: "Alertas", icon: Bell },
    { id: "actions", label: "Actuaciones", icon: TicketCheck },
    { id: "support", label: "Soporte", icon: Headphones },
  ]
  return (
    <nav className="field-nav">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.id}
            variant="ghost"
            className={current === item.id ? "active" : ""}
            onClick={() => onChange(item.id)}
          >
            <span className="nav-icon">
              <Icon size={21} />
              {item.id === "alerts" && unreadAlertsCount > 0 && <i />}
            </span>
            {item.label}
          </Button>
        )
      })}
    </nav>
  )
}

function FieldHome({
  plots,
  alerts,
  resolutions,
  onViewAlert,
  onSelectPlot,
}: {
  plots: Plot[]
  alerts: AlertItem[]
  resolutions: Record<string, Resolution>
  onViewAlert: (alert: AlertItem) => void
  onSelectPlot: (plotId: string) => void
}) {
  const [selectedId, setSelectedId] = useState(plots[0]?.id || "p1")
  const [period, setPeriod] = useState("7 días")
  const selected = plots.find((plot) => plot.id === selectedId) ?? plots[0]

  // Find priority alert for selected plot or first unresolved critical alert
  const plotAlert =
    alerts.find(
      (a) =>
        a.plotId === selectedId &&
        (!resolutions[a.id] || resolutions[a.id].status === "rejected"),
    ) ||
    alerts.find((a) => !resolutions[a.id] && a.severity === "critical") ||
    alerts[0]

  const unresolvedCount = alerts.filter((a) => !resolutions[a.id]).length

  return (
    <div className="field-page">
      <div className="field-welcome">
        <div>
          <span className="eyebrow">MIÉRCOLES, 14 DE MAYO</span>
          <div className="display-title">Buenos días, Antonio</div>
          <p>
            {unresolvedCount > 0
              ? `Tienes ${unresolvedCount} actuaciones pendientes en tus parcelas.`
              : "Todas tus parcelas están al día y bajo control."}
          </p>
        </div>
        <div className="weather">
          <CloudSun size={25} />
          <div>
            <strong>24°</strong>
            <span>Despejado</span>
          </div>
        </div>
      </div>
      <div className="field-section-heading">
        <div>
          <span className="section-title">Estado general</span>
          <small>Actualizado en tiempo real</small>
        </div>
        <Select
          value={selectedId}
          onChange={(event) => {
            setSelectedId(event.target.value)
            onSelectPlot(event.target.value)
          }}
          aria-label="Seleccionar parcela"
        >
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>
              {plot.name} ({plot.crop})
            </option>
          ))}
        </Select>
      </div>
      <div className="metric-grid">
        <div className="metric-card featured">
          <div className="metric-icon green">
            <Sprout size={20} />
          </div>
          <div className="metric-label">SALUD DEL CULTIVO</div>
          <div className="metric-value">
            {selected.health}
            <small>/100</small>
          </div>
          <div className="metric-foot positive">
            <TrendingUp size={14} /> +3 esta semana
          </div>
        </div>
        <div className="metric-card">
          <div
            className={`metric-icon ${selected.moisture < 35 ? "red" : "blue"}`}
          >
            <Droplets size={20} />
          </div>
          <div className="metric-label">HUMEDAD DEL SUELO</div>
          <div className="metric-value">
            {selected.moisture}
            <small>%</small>
          </div>
          <div
            className={`metric-foot ${
              selected.moisture < 35 ? "negative" : "neutral"
            }`}
          >
            {selected.moisture < 35 ? (
              <>
                <ArrowDownRight size={14} /> Bajo el umbral
              </>
            ) : (
              "Rango adecuado"
            )}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon blue">
            <Gauge size={20} />
          </div>
          <div className="metric-label">RIEGO DE HOY</div>
          <div className="metric-value">
            18<small>m³</small>
          </div>
          <div className="metric-foot neutral">2 sectores activos</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon amber">
            <TicketCheck size={20} />
          </div>
          <div className="metric-label">TAREAS PENDIENTES</div>
          <div className="metric-value">{unresolvedCount}</div>
          <div className="metric-foot warning">
            {
              alerts.filter(
                (a) => !resolutions[a.id] && a.severity === "critical",
              ).length
            }{" "}
            prioritarias
          </div>
        </div>
      </div>
      <div className="panel moisture-panel">
        <div className="panel-heading">
          <div>
            <span className="section-title">Evolución de humedad</span>
            <small>{selected.name} · Sensor a 30 cm</small>
          </div>
          <div className="segmented small">
            {["7 días", "30 días"].map((item) => (
              <Button
                key={item}
                variant="ghost"
                className={period === item ? "active" : ""}
                onClick={() => setPeriod(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
        <div className="chart-stat">
          <strong>{selected.moisture}%</strong>
          <span>Nivel actual</span>
        </div>
        <TrendChart
          values={
            period === "7 días"
              ? selected.trend
              : [...selected.trend, 45, 42, 39, 43, 46, 41, 40]
          }
          height={110}
          color={selected.moisture < 35 ? "red" : "green"}
        />
        <div className="axis-labels">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Hoy</span>
        </div>
      </div>

      {plotAlert && (
        <div className="priority-action">
          <div className="priority-top">
            <Badge tone={plotAlert.severity}>
              <AlertTriangle size={13} /> PRIORIDAD{" "}
              {plotAlert.severity.toUpperCase()}
            </Badge>
            <span>{plotAlert.time}</span>
          </div>
          <div className="priority-body">
            <div className="priority-icon">
              {plotAlert.category === "Riego" ? (
                <Droplets size={24} />
              ) : plotAlert.category === "Sanidad" ? (
                <Leaf size={24} />
              ) : (
                <Tractor size={24} />
              )}
            </div>
            <div>
              <strong>{plotAlert.title}</strong>
              <span>{plotAlert.description}</span>
            </div>
          </div>
          <Button onClick={() => onViewAlert(plotAlert)}>
            Revisar recomendación <ArrowRight size={17} />
          </Button>
        </div>
      )}

      <div className="field-section-heading compact-heading">
        <div>
          <span className="section-title">Tus parcelas</span>
          <small>
            {plots.length} parcelas ·{" "}
            {plots.reduce((acc, p) => acc + p.area, 0).toFixed(1)} ha
          </small>
        </div>
      </div>
      <div className="plot-list">
        {plots.map((plot) => (
          <Button
            key={plot.id}
            variant="ghost"
            className={`plot-row ${selectedId === plot.id ? "selected" : ""}`}
            onClick={() => {
              setSelectedId(plot.id)
              onSelectPlot(plot.id)
            }}
          >
            <div className={`plot-color ${plot.stress}`} />
            <div className="plot-copy">
              <strong>{plot.name}</strong>
              <span>
                {plot.crop} {plot.variety} · {plot.area} ha
              </span>
            </div>
            <div className="plot-health">
              <strong>{plot.health}</strong>
              <span>salud</span>
            </div>
            <ChevronRight size={18} />
          </Button>
        ))}
      </div>
    </div>
  )
}

function AlertList({
  alerts,
  plots,
  resolutions,
  onSelect,
}: {
  alerts: AlertItem[]
  plots: Plot[]
  resolutions: Record<string, Resolution>
  onSelect: (alert: AlertItem) => void
}) {
  const [filter, setFilter] = useState("Todas")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [showFilterModal, setShowFilterModal] = useState(false)

  const visible = alerts.filter((alert) => {
    const matchesFilter =
      filter === "Todas" ||
      (filter === "Críticas" && alert.severity === "critical") ||
      (filter === "Recomendaciones" && alert.category !== "Riego")

    const matchesCategory =
      categoryFilter === "Todas" || alert.category === categoryFilter

    return matchesFilter && matchesCategory
  })

  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const warningCount = alerts.filter((a) => a.severity === "warning").length
  const infoCount = alerts.filter((a) => a.severity === "info").length

  return (
    <div className="field-page">
      <div className="mobile-page-title">
        <div>
          <span className="display-title">Alertas y recomendaciones</span>
          <p>Actúa a tiempo sobre tus cultivos.</p>
        </div>
        <Button
          variant="secondary"
          className="icon-button"
          onClick={() => setShowFilterModal(true)}
          aria-label="Filtrar por categoría"
        >
          <Filter size={18} />
        </Button>
      </div>
      <div className="alert-summary">
        <div>
          <span className="summary-dot critical" />
          <strong>{criticalCount}</strong>
          <small>Crítica</small>
        </div>
        <div>
          <span className="summary-dot warning" />
          <strong>{warningCount}</strong>
          <small>Atención</small>
        </div>
        <div>
          <span className="summary-dot info" />
          <strong>{infoCount}</strong>
          <small>Consejo</small>
        </div>
      </div>
      <div className="segmented field-filters">
        {["Todas", "Críticas", "Recomendaciones"].map((item) => (
          <Button
            key={item}
            variant="ghost"
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      {categoryFilter !== "Todas" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Badge tone="info">Categoría: {categoryFilter}</Badge>
          <Button
            variant="ghost"
            style={{ fontSize: 10, color: "var(--muted)", cursor: "pointer" }}
            onClick={() => setCategoryFilter("Todas")}
          >
            Limpiar filtro
          </Button>
        </div>
      )}

      <div className="alert-list">
        {visible.map((alert) => {
          const plot = plots.find((item) => item.id === alert.plotId)
          const resolution = resolutions[alert.id]
          return (
            <Button
              key={alert.id}
              variant="ghost"
              className="alert-card"
              onClick={() => onSelect(alert)}
            >
              <div className={`alert-stripe ${alert.severity}`} />
              <div className={`alert-icon ${alert.severity}`}>
                {alert.category === "Riego" ? (
                  <Droplets />
                ) : alert.category === "Sanidad" ? (
                  <Leaf />
                ) : alert.category === "Labor" ? (
                  <Tractor />
                ) : (
                  <BatteryMedium />
                )}
              </div>
              <div className="alert-content">
                <div className="alert-meta">
                  <Badge tone={alert.severity}>
                    {severityLabels[alert.severity]}
                  </Badge>
                  <span>{alert.time}</span>
                </div>
                <strong>{alert.title}</strong>
                <p>{alert.description}</p>
                <span className="alert-location">
                  <Map size={14} /> {plot?.name} · {plot?.crop}
                </span>
                {resolution && (
                  <Badge
                    tone={
                      resolution.status === "accepted" ? "success" : "neutral"
                    }
                  >
                    {resolution.status === "accepted"
                      ? "Aceptada"
                      : "Rechazada"}
                    {!resolution.synced && " · Sin sincronizar"}
                  </Badge>
                )}
              </div>
              <ChevronRight size={19} />
            </Button>
          )
        })}
      </div>

      {showFilterModal && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <div className="sheet-handle" />
            <div className="modal-title">
              <div>
                <span className="display-title small-title">
                  Filtrar por categoría
                </span>
                <p>Selecciona el tipo de recomendación agronómica</p>
              </div>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => setShowFilterModal(false)}
              >
                <X />
              </Button>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {["Todas", "Riego", "Sanidad", "Labor", "Dispositivo"].map(
                (cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "primary" : "secondary"}
                    onClick={() => {
                      setCategoryFilter(cat)
                      setShowFilterModal(false)
                    }}
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    {cat === "Riego" && <Droplets size={16} />}
                    {cat === "Sanidad" && <Leaf size={16} />}
                    {cat === "Labor" && <Tractor size={16} />}
                    {cat === "Dispositivo" && <BatteryMedium size={16} />}
                    {cat}
                  </Button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionsView({
  alerts,
  plots,
  resolutions,
  onOpen,
}: {
  alerts: AlertItem[]
  plots: Plot[]
  resolutions: Record<string, Resolution>
  onOpen: (alert: AlertItem) => void
}) {
  const [tab, setTab] = useState("Pendientes")
  const pending = alerts.filter((alert) => !resolutions[alert.id])
  const done = alerts.filter((alert) => resolutions[alert.id])
  const unsynced = done.filter((alert) => !resolutions[alert.id].synced)
  const list =
    tab === "Pendientes" ? pending : tab === "Registradas" ? done : unsynced

  return (
    <div className="field-page">
      <div className="mobile-page-title">
        <div>
          <span className="display-title">Actuaciones</span>
          <p>Órdenes de trabajo y trazabilidad.</p>
        </div>
      </div>
      <div className="segmented field-filters">
        {[
          ["Pendientes", pending.length],
          ["Registradas", done.length],
          ["Por sincronizar", unsynced.length],
        ].map(([label, count]) => (
          <Button
            key={label}
            variant="ghost"
            className={tab === label ? "active" : ""}
            onClick={() => setTab(String(label))}
          >
            {label} <i>{count}</i>
          </Button>
        ))}
      </div>
      {list.length ? (
        <div className="work-list">
          {list.map((alert) => {
            const resolution = resolutions[alert.id]
            return (
              <Button
                key={alert.id}
                variant="ghost"
                className="work-card"
                onClick={() => onOpen(alert)}
              >
                <div
                  className={`work-check ${
                    resolution
                      ? resolution.status === "accepted"
                        ? "done"
                        : "rejected"
                      : ""
                  }`}
                >
                  {resolution ? (
                    resolution.status === "accepted" ? (
                      <Check />
                    ) : (
                      <X />
                    )
                  ) : (
                    <Tractor />
                  )}
                </div>
                <div>
                  <span>
                    {plots.find((plot) => plot.id === alert.plotId)?.name} ·{" "}
                    {alert.category}
                  </span>
                  <strong>{alert.recommendation}</strong>
                  <small>
                    {resolution
                      ? `${
                          resolution.status === "accepted"
                            ? "Aceptada"
                            : "Rechazada"
                        } por Antonio · ${resolution.date}${
                          resolution.reason ? ` (${resolution.reason})` : ""
                        }`
                      : alert.time}
                  </small>
                </div>
                <ChevronRight size={18} />
              </Button>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <CheckCircle2 size={38} />
          <strong>Todo al día</strong>
          <span>No hay actuaciones en esta bandeja.</span>
        </div>
      )}
    </div>
  )
}

function SupportView({
  online,
  tickets,
  onAddTicket,
  onToast,
}: {
  online: boolean
  tickets: SupportTicket[]
  onAddTicket: (ticket: Omit<SupportTicket, "id" | "date" | "status">) => void
  onToast: (toast: ToastState) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [showGuides, setShowGuides] = useState(false)
  const [showServiceStatus, setShowServiceStatus] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  )

  const [category, setCategory] = useState("Dispositivo o sensor")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    onAddTicket({
      subject,
      category,
      description,
    })
    setShowForm(false)
    setSubject("")
    setDescription("")
    onToast({
      title: online ? "Ticket creado" : "Ticket guardado sin conexión",
      detail: online
        ? "El equipo de soporte ya puede revisarlo."
        : "Se enviará automáticamente al recuperar cobertura.",
    })
  }

  const faqs = [
    {
      q: "¿Cómo calibro una sonda de humedad?",
      a: "Para calibrar la sonda HUM, debes sumergir la punta sensible en una muestra de suelo saturado al 100% (capacidad de campo) durante 15 minutos, y registrar el valor cero desde la pestaña de Dispositivos o solicitar asistencia al soporte técnico.",
    },
    {
      q: "¿Qué ocurre con mis datos sin cobertura?",
      a: "Neutron AgriTech almacena localmente en la memoria de tu dispositivo todas las órdenes de riego, notas de campo y aceptaciones. En cuanto el teléfono detecta señal Wi-Fi o datos móviles, la sincronización se realiza automáticamente sin perder trazabilidad.",
    },
    {
      q: "¿Cómo cambio de parcela en modo Campo?",
      a: "En la pantalla de Inicio de Campo, utiliza el selector desplegable superior o haz clic en cualquiera de las tarjetas de parcela situadas en la parte inferior para ver su curva de humedad y recomendaciones específicas.",
    },
    {
      q: "¿Cómo se activan los riegos automáticos?",
      a: "El responsable de riego puede autorizar la automatización en el panel de Administración > Reglas y automatización. Mientras no esté autorizada, el sistema requiere confirmación previa en campo para cualquier riego.",
    },
  ]

  return (
    <div className="field-page">
      <div className="mobile-page-title">
        <div>
          <span className="display-title">Soporte</span>
          <p>Estamos aquí para ayudarte.</p>
        </div>
      </div>
      <div className="support-hero">
        <div className="support-orbit">
          <Headphones size={30} />
        </div>
        <div>
          <strong>¿Necesitas ayuda en campo?</strong>
          <span>Tiempo medio de respuesta: menos de 2 horas.</span>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nuevo ticket
        </Button>
      </div>

      <div className="quick-help">
        <Button variant="secondary" onClick={() => setShowGuides(true)}>
          <CircleHelp size={21} />
          <span>
            <strong>Guías rápidas</strong>
            <small>Riego, sensores y alertas</small>
          </span>
          <ChevronRight size={18} />
        </Button>
        <Button variant="secondary" onClick={() => setShowServiceStatus(true)}>
          <Radio size={21} />
          <span>
            <strong>Estado del servicio</strong>
            <small>Sistemas operativos</small>
          </span>
          <span className="status-light" />
        </Button>
      </div>

      <div className="field-section-heading compact-heading">
        <div>
          <span className="section-title">Mis tickets</span>
          <small>{tickets.length} consultas registradas</small>
        </div>
      </div>
      <div className="ticket-list">
        {tickets.map((ticket) => (
          <div
            className="ticket-row"
            key={ticket.id}
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedTicket(ticket)}
          >
            <div>
              <strong>{ticket.subject}</strong>
              <span>
                {ticket.id} · {ticket.date} · {ticket.category}
              </span>
            </div>
            <Badge
              tone={
                ticket.status === "Pendiente de envío"
                  ? "offline"
                  : ticket.status === "Resuelto"
                    ? "success"
                    : "info"
              }
            >
              {ticket.status}
            </Badge>
          </div>
        ))}
      </div>

      <div className="faq-block">
        <span className="section-title">Preguntas frecuentes</span>
        <div style={{ marginTop: 8 }}>
          {faqs.map((item, index) => (
            <div className="faq-item" key={item.q}>
              <button
                className="faq-question"
                onClick={() =>
                  setExpandedFaq(expandedFaq === index ? null : index)
                }
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={16}
                  style={{
                    transform:
                      expandedFaq === index ? "rotate(180deg)" : "none",
                    transition: "transform 150ms ease",
                  }}
                />
              </button>
              {expandedFaq === index && (
                <div className="faq-answer">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <form className="modal-sheet" onSubmit={submit}>
            <div className="sheet-handle" />
            <div className="modal-title">
              <div>
                <span className="display-title small-title">Nuevo ticket</span>
                <p>Describe la consulta para que podamos ayudarte.</p>
              </div>
              <Button
                variant="ghost"
                className="icon-button"
                type="button"
                onClick={() => setShowForm(false)}
              >
                <X />
              </Button>
            </div>
            <label>
              Tipo de consulta
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option>Dispositivo o sensor</option>
                <option>Riego y automatización</option>
                <option>Uso de la aplicación</option>
                <option>Problemas agronómicos</option>
              </Select>
            </label>
            <label>
              Asunto
              <Input
                required
                placeholder="Ej. Sonda sin lecturas o valor anómalo"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label>
              Descripción
              <Textarea
                required
                rows={4}
                placeholder="Cuéntanos con detalle qué está ocurriendo en la parcela…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <Button type="submit" className="full-button">
              {online ? "Enviar ticket" : "Guardar para enviar después"}
            </Button>
          </form>
        </div>
      )}

      {selectedTicket && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <div className="sheet-handle" />
            <div className="modal-title">
              <div>
                <span className="display-title small-title">
                  {selectedTicket.id}
                </span>
                <p>{selectedTicket.subject}</p>
              </div>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => setSelectedTicket(null)}
              >
                <X />
              </Button>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge tone="info">{selectedTicket.category}</Badge>
              <Badge
                tone={
                  selectedTicket.status === "Resuelto" ? "success" : "neutral"
                }
              >
                {selectedTicket.status}
              </Badge>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  marginLeft: "auto",
                }}
              >
                {selectedTicket.date}
              </span>
            </div>
            <div
              style={{ background: "#f8faf8", padding: 12, borderRadius: 10 }}
            >
              <strong
                style={{ fontSize: 11, display: "block", marginBottom: 4 }}
              >
                Consulta inicial
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "var(--ink)",
                  lineHeight: 1.5,
                }}
              >
                {selectedTicket.description || selectedTicket.subject}
              </p>
            </div>

            {selectedTicket.replies?.map((reply, i) => (
              <div
                key={i}
                style={{
                  background: "var(--green-50)",
                  border: "1px solid #cfe4d4",
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontSize: 11, color: "var(--green-700)" }}>
                    {reply.from}
                  </strong>
                  <small style={{ fontSize: 9, color: "var(--muted)" }}>
                    {reply.time}
                  </small>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--ink)" }}>
                  {reply.text}
                </p>
              </div>
            ))}

            <Button
              className="full-button"
              variant="secondary"
              onClick={() => {
                onToast({
                  title: "Mensaje registrado",
                  detail: "Tu respuesta se ha adjuntado al ticket.",
                })
                setSelectedTicket(null)
              }}
            >
              Añadir nota de seguimiento
            </Button>
          </div>
        </div>
      )}

      {showGuides && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <div className="sheet-handle" />
            <div className="modal-title">
              <div>
                <span className="display-title small-title">
                  Guías agronómicas
                </span>
                <p>Protocolos de actuación en campo</p>
              </div>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => setShowGuides(false)}
              >
                <X />
              </Button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div>
                  <strong style={{ fontSize: 12 }}>
                    Calibración de sonda tensiométrica
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    Inserte la barrena a 30 cm evitando cámaras de aire.
                    Humedezca con pasta de lodo de la misma parcela para
                    asegurar buen contacto capilar.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div>
                  <strong style={{ fontSize: 12 }}>
                    Estrategia de Riego Deficitario (RDC)
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    En pitaya durante floración mantenga el bulbo entre 32% y
                    45% para estimular la floración sin inducir aborto de yemas.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div>
                  <strong style={{ fontSize: 12 }}>
                    Control preventivo de Phytophthora
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    Revise cuello y raíces tras riegos copiosos o lluvias
                    intensas. Si la humedad supera 70% por más de 12 horas,
                    suspenda riegos y airee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showServiceStatus && (
        <div className="modal-backdrop">
          <div className="modal-sheet">
            <div className="sheet-handle" />
            <div className="modal-title">
              <div>
                <span className="display-title small-title">
                  Estado de la infraestructura
                </span>
                <p>Monitorización en tiempo real de telecomunicaciones</p>
              </div>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => setShowServiceStatus(false)}
              >
                <X />
              </Button>
            </div>
            <div className="service-grid">
              <div className="service-card">
                <div>
                  <strong style={{ fontSize: 11, display: "block" }}>
                    Gateway LoRaWAN El Manantial
                  </strong>
                  <small style={{ fontSize: 9, color: "var(--muted)" }}>
                    Canal 868 MHz · Latencia 18ms
                  </small>
                </div>
                <Badge tone="success">Operativo</Badge>
              </div>
              <div className="service-card">
                <div>
                  <strong style={{ fontSize: 11, display: "block" }}>
                    Servidor de Telemetría IoT
                  </strong>
                  <small style={{ fontSize: 9, color: "var(--muted)" }}>
                    99.98% disponibilidad
                  </small>
                </div>
                <Badge tone="success">Operativo</Badge>
              </div>
              <div className="service-card">
                <div>
                  <strong style={{ fontSize: 11, display: "block" }}>
                    Integración Radar AEMET
                  </strong>
                  <small style={{ fontSize: 9, color: "var(--muted)" }}>
                    Previsión horaria sincronizada
                  </small>
                </div>
                <Badge tone="success">Operativo</Badge>
              </div>
              <div className="service-card">
                <div>
                  <strong style={{ fontSize: 11, display: "block" }}>
                    Sincronización en la nube
                  </strong>
                  <small style={{ fontSize: 9, color: "var(--muted)" }}>
                    Cifrado TLS 1.3 activo
                  </small>
                </div>
                <Badge tone="success">Operativo</Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertDetail({
  alert,
  plots,
  onClose,
  onResolve,
}: {
  alert: AlertItem
  plots: Plot[]
  onClose: () => void
  onResolve: (
    status: "accepted" | "rejected",
    reason?: string,
    note?: string,
  ) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("Condiciones inadecuadas")
  const [fieldNote, setFieldNote] = useState("")
  const plot = plots.find((item) => item.id === alert.plotId)

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet alert-detail-sheet">
        <div className="sheet-handle" />
        <div className="modal-title">
          <Button variant="ghost" className="icon-button" onClick={onClose}>
            <ArrowLeft />
          </Button>
          <div>
            <Badge tone={alert.severity}>
              {severityLabels[alert.severity]}
            </Badge>
            <span>{alert.time}</span>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className={`detail-hero ${alert.severity}`}>
          <div className="detail-icon">
            <AlertTriangle size={27} />
          </div>
          <strong>{alert.title}</strong>
          <span>
            {plot?.name} · {plot?.crop} {plot?.variety}
          </span>
        </div>
        <div className="detail-reading">
          <div>
            <span>LECTURA DETECTADA</span>
            <strong>{alert.reading}</strong>
          </div>
          <div className="reading-map">
            <Map size={25} />
            <i>Sector 3</i>
          </div>
        </div>
        <div className="detail-block">
          <span>QUÉ ESTÁ OCURRIENDO</span>
          <p>
            {alert.description} El sistema ha contrastado la lectura con el
            perfil agronómico de la parcela y la previsión local de las próximas
            horas.
          </p>
        </div>
        <div className="recommendation-box">
          <div>
            <Bot size={21} />
            <span>RECOMENDACIÓN</span>
          </div>
          <strong>{alert.recommendation}</strong>
          <p>
            Actuar hoy reduce el riesgo estimado y ayuda a mantener la curva de
            crecimiento prevista.
          </p>
        </div>

        {!rejecting ? (
          <div>
            <label style={{ marginBottom: 12 }}>
              Observaciones de campo (opcional)
              <Input
                placeholder="Ej. Comprobado sector en persona, inicio de bomba OK"
                value={fieldNote}
                onChange={(e) => setFieldNote(e.target.value)}
              />
            </label>
            <div className="detail-actions">
              <Button
                onClick={() => onResolve("accepted", undefined, fieldNote)}
              >
                <Check size={18} /> Aceptar actuación
              </Button>
              <Button variant="secondary" onClick={() => setRejecting(true)}>
                <X size={18} /> Rechazar
              </Button>
            </div>
          </div>
        ) : (
          <div className="reject-form">
            <span>
              Motivo del rechazo <small>(opcional)</small>
            </span>
            <div className="reason-grid">
              {[
                "No aplica",
                "Ya realizada",
                "Condiciones inadecuadas",
                "Otro",
              ].map((item) => (
                <Button
                  key={item}
                  variant="secondary"
                  className={reason === item ? "selected" : ""}
                  onClick={() => setReason(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Añade un comentario para mantener la trazabilidad…"
              rows={3}
              value={fieldNote}
              onChange={(e) => setFieldNote(e.target.value)}
            />
            <div>
              <Button variant="ghost" onClick={() => setRejecting(false)}>
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={() => onResolve("rejected", reason, fieldNote)}
              >
                Confirmar rechazo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldApp({
  online,
  setOnline,
  plots,
  alerts,
  resolutions,
  onResolve,
  onSwitch,
  toast,
  setToast,
  tickets,
  onAddTicket,
}: {
  online: boolean
  setOnline: (online: boolean) => void
  plots: Plot[]
  alerts: AlertItem[]
  resolutions: Record<string, Resolution>
  onResolve: (
    alert: AlertItem,
    status: "accepted" | "rejected",
    reason?: string,
    note?: string,
  ) => void
  onSwitch: () => void
  toast: ToastState
  setToast: (toast: ToastState) => void
  tickets: SupportTicket[]
  onAddTicket: (ticket: Omit<SupportTicket, "id" | "date" | "status">) => void
}) {
  const [view, setView] = useState<FieldView>("home")
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)
  const pending = Object.values(resolutions).filter(
    (item) => !item.synced,
  ).length
  const unreadAlerts = alerts.filter((a) => !resolutions[a.id]).length

  return (
    <div className="field-app">
      <div className="field-device">
        <FieldHeader
          online={online}
          pending={pending}
          onToggleOnline={() => setOnline(!online)}
          onSwitch={onSwitch}
        />
        <main className="field-content">
          {view === "home" && (
            <FieldHome
              plots={plots}
              alerts={alerts}
              resolutions={resolutions}
              onViewAlert={setSelectedAlert}
              onSelectPlot={() => {}}
            />
          )}
          {view === "alerts" && (
            <AlertList
              alerts={alerts}
              plots={plots}
              resolutions={resolutions}
              onSelect={setSelectedAlert}
            />
          )}
          {view === "actions" && (
            <ActionsView
              alerts={alerts}
              plots={plots}
              resolutions={resolutions}
              onOpen={setSelectedAlert}
            />
          )}
          {view === "support" && (
            <SupportView
              online={online}
              tickets={tickets}
              onAddTicket={onAddTicket}
              onToast={setToast}
            />
          )}
        </main>
        <FieldNav
          current={view}
          onChange={setView}
          unreadAlertsCount={unreadAlerts}
        />
      </div>
      {selectedAlert && (
        <AlertDetail
          alert={selectedAlert}
          plots={plots}
          onClose={() => setSelectedAlert(null)}
          onResolve={(status, reason, note) => {
            onResolve(selectedAlert, status, reason, note)
            setSelectedAlert(null)
            setView("actions")
          }}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

/* =========================================================================
   ADMIN EXPERIENCE COMPONENTS
   ========================================================================= */

const adminNav: {
  group: string
  items: { id: AdminView; label: string; icon: typeof Home }[]
}[] = [
  {
    group: "OPERACIONES",
    items: [
      { id: "overview", label: "Gemelo digital", icon: Layers3 },
      { id: "farms", label: "Explotaciones", icon: Tractor },
    ],
  },
  {
    group: "GESTIÓN",
    items: [
      { id: "users", label: "Clientes y usuarios", icon: UsersRound },
      { id: "devices", label: "Dispositivos IoT", icon: Radio },
      {
        id: "rules",
        label: "Reglas y automatización",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    group: "INTELIGENCIA",
    items: [
      { id: "analytics", label: "Modelos predictivos", icon: TrendingUp },
      { id: "reports", label: "Informes", icon: FileBarChart },
      { id: "integrations", label: "Integraciones", icon: Zap },
    ],
  },
]

function AdminSidebar({
  view,
  onChange,
  onSwitch,
  open,
  onClose,
  devicesCount,
  onToast,
}: {
  view: AdminView
  onChange: (view: AdminView) => void
  onSwitch: () => void
  open: boolean
  onClose: () => void
  devicesCount: number
  onToast: (toast: ToastState) => void
}) {
  return (
    <aside className={`admin-sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-logo">
        <Logo />
        <Button
          variant="ghost"
          className="icon-button sidebar-close"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div
        className="org-selector"
        style={{ cursor: "pointer" }}
        onClick={() =>
          onToast({
            title: "Cooperativa Valle Verde",
            detail: "22,2 ha monitorizadas · 2 explotaciones activas.",
          })
        }
      >
        <div className="org-icon">VV</div>
        <div>
          <strong>Valle Verde</strong>
          <span>Cooperativa</span>
        </div>
        <ChevronDown size={16} />
      </div>
      <nav className="admin-nav">
        {adminNav.map((group) => (
          <div key={group.group}>
            <span>{group.group}</span>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={view === item.id ? "active" : ""}
                  onClick={() => {
                    onChange(item.id)
                    onClose()
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                  {item.id === "devices" && <i>{devicesCount}</i>}
                </Button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Button variant="ghost" onClick={onSwitch}>
          <Smartphone size={18} /> Abrir experiencia Campo{" "}
          <ArrowRight size={15} />
        </Button>
        <div
          className="sidebar-user"
          style={{ cursor: "pointer" }}
          onClick={() =>
            onToast({
              title: "Elena Ruiz",
              detail: "Responsable agronómica · elena.ruiz@valleverde.es",
            })
          }
        >
          <div className="admin-avatar">ER</div>
          <div>
            <strong>Elena Ruiz</strong>
            <span>Responsable agronómica</span>
          </div>
          <MoreHorizontal size={17} />
        </div>
      </div>
    </aside>
  )
}

function AdminTopbar({
  view,
  onMenu,
  plots,
  devices,
  users,
  rules,
  notifications,
  onSelectNav,
  campaign,
  onChangeCampaign,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: {
  view: AdminView
  onMenu: () => void
  plots: Plot[]
  devices: DeviceItem[]
  users: UserItem[]
  rules: RuleItem[]
  notifications: SystemNotification[]
  onSelectNav: (view: AdminView, targetId?: string) => void
  campaign: string
  onChangeCampaign: (camp: string) => void
  onMarkNotificationRead: (id: string) => void
  onMarkAllNotificationsRead: () => void
}) {
  const [query, setQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCampaignSelect, setShowCampaignSelect] = useState(false)

  const name = adminNav
    .flatMap((group) => group.items)
    .find((item) => item.id === view)?.label

  const unreadCount = notifications.filter((n) => !n.read).length

  // Global search filtering
  const filteredPlots = query.trim()
    ? plots.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.crop.toLowerCase().includes(query.toLowerCase()),
      )
    : []
  const filteredDevices = query.trim()
    ? devices.filter(
        (d) =>
          d.id.toLowerCase().includes(query.toLowerCase()) ||
          d.plot.toLowerCase().includes(query.toLowerCase()),
      )
    : []
  const filteredUsers = query.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.role.toLowerCase().includes(query.toLowerCase()),
      )
    : []
  const filteredRules = query.trim()
    ? rules.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : []

  const hasResults =
    filteredPlots.length > 0 ||
    filteredDevices.length > 0 ||
    filteredUsers.length > 0 ||
    filteredRules.length > 0

  return (
    <header className="admin-topbar">
      <div className="topbar-title">
        <Button
          variant="ghost"
          className="icon-button menu-button"
          onClick={onMenu}
        >
          <Menu />
        </Button>
        <div>
          <span>Valle Verde</span>
          <strong>{name}</strong>
        </div>
      </div>
      <div className="topbar-actions" style={{ position: "relative" }}>
        <div className="admin-search" style={{ position: "relative" }}>
          <Search size={17} />
          <Input
            placeholder="Buscar parcelas, sensores, usuarios…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() && (
            <div className="search-dropdown">
              {!hasResults && (
                <div
                  style={{
                    padding: 12,
                    fontSize: 11,
                    color: "var(--muted)",
                    textAlign: "center",
                  }}
                >
                  Sin coincidencias para &quot;{query}&quot;
                </div>
              )}
              {filteredPlots.length > 0 && (
                <div>
                  <div className="search-result-group">Parcelas</div>
                  {filteredPlots.map((plot) => (
                    <button
                      key={plot.id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectNav("farms", plot.id)
                        setQuery("")
                      }}
                    >
                      <Sprout size={14} color="var(--green-700)" />
                      <span>
                        <strong>{plot.name}</strong> ({plot.crop}) · {plot.area}{" "}
                        ha
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {filteredDevices.length > 0 && (
                <div>
                  <div className="search-result-group">Dispositivos IoT</div>
                  {filteredDevices.map((dev) => (
                    <button
                      key={dev.id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectNav("devices", dev.id)
                        setQuery("")
                      }}
                    >
                      <Radio size={14} color="var(--blue)" />
                      <span>
                        <strong>{dev.id}</strong> ({dev.type}) · {dev.plot}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {filteredUsers.length > 0 && (
                <div>
                  <div className="search-result-group">Usuarios</div>
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectNav("users", user.id)
                        setQuery("")
                      }}
                    >
                      <UserRound size={14} color="var(--amber)" />
                      <span>
                        <strong>{user.name}</strong> · {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {filteredRules.length > 0 && (
                <div>
                  <div className="search-result-group">Reglas</div>
                  {filteredRules.map((rule) => (
                    <button
                      key={rule.id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectNav("rules", rule.id)
                        setQuery("")
                      }}
                    >
                      <SlidersHorizontal size={14} color="var(--purple)" />
                      <span>
                        <strong>{rule.name}</strong> ({rule.crop})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <Button
            variant="secondary"
            className="period-button"
            onClick={() => setShowCampaignSelect(!showCampaignSelect)}
          >
            <span>{campaign}</span>
            <ChevronDown size={15} />
          </Button>
          {showCampaignSelect && (
            <div
              className="action-menu-dropdown"
              style={{ left: 0, right: "auto", minWidth: 140 }}
            >
              {["Campaña 2025", "Campaña 2024", "Campaña 2023"].map((c) => (
                <button
                  key={c}
                  className="action-menu-item"
                  onClick={() => {
                    onChangeCampaign(c)
                    setShowCampaignSelect(false)
                  }}
                >
                  {c === campaign ? (
                    <Check size={14} />
                  ) : (
                    <span style={{ width: 14 }} />
                  )}
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <Button
            variant="ghost"
            className={`icon-button ${unreadCount > 0 ? "has-indicator" : ""}`}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Ver avisos del sistema"
          >
            <Bell size={19} />
            {unreadCount > 0 && <i />}
          </Button>

          {showNotifications && (
            <div className="notifications-popover">
              <div className="notifications-header">
                <div>
                  <strong style={{ fontSize: 12 }}>Avisos del sistema</strong>
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      display: "block",
                    }}
                  >
                    {unreadCount} no leídos
                  </span>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    style={{ fontSize: 10, color: "var(--green-700)" }}
                    onClick={onMarkAllNotificationsRead}
                  >
                    Marcar leídos
                  </Button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notification-row ${n.read ? "read" : "unread"}`}
                    onClick={() => onMarkNotificationRead(n.id)}
                  >
                    <span className="dot" />
                    <div style={{ flex: 1, display: "grid", gap: 2 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <strong style={{ fontSize: 11 }}>{n.title}</strong>
                        <small style={{ fontSize: 8, color: "var(--muted)" }}>
                          {n.time}
                        </small>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 10,
                          color: "var(--muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function KpiCard({
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

function FarmMap({
  mode,
  selected,
  onSelect,
  plots,
  zoom,
}: {
  mode: string
  selected: string
  onSelect: (id: string) => void
  plots: Plot[]
  zoom: number
}) {
  const positions = [
    {
      id: "p1",
      d: "M28 40 L205 20 L247 132 L173 206 L38 175 Z",
      labelX: 125,
      labelY: 105,
    },
    {
      id: "p2",
      d: "M253 27 L429 49 L447 178 L305 205 L250 129 Z",
      labelX: 348,
      labelY: 112,
    },
    {
      id: "p3",
      d: "M43 186 L172 215 L218 338 L72 368 L24 286 Z",
      labelX: 116,
      labelY: 278,
    },
    {
      id: "p4",
      d: "M184 211 L304 214 L438 185 L461 313 L362 379 L222 341 Z",
      labelX: 325,
      labelY: 290,
    },
  ]

  return (
    <div className={`farm-map map-mode-${mode}`}>
      <svg
        viewBox="0 0 490 400"
        aria-label="Mapa esquemático de parcelas"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 220ms ease",
        }}
      >
        <defs>
          <pattern
            id="grid"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 22 0 L 0 0 0 22" className="map-grid" />
          </pattern>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity=".12" />
          </filter>
        </defs>
        <rect width="490" height="400" fill="url(#grid)" rx="16" />
        <path
          d="M0 330 C100 290 116 404 260 360 S390 327 490 345"
          className="map-road"
        />
        {positions.map((position, index) => {
          const plot = plots.find((item) => item.id === position.id)
          if (!plot) return null
          return (
            <g
              key={position.id}
              onClick={() => onSelect(position.id)}
              className={`map-plot plot-index-${index} ${
                selected === position.id ? "selected" : ""
              }`}
              role="button"
              tabIndex={0}
            >
              <path d={position.d} filter="url(#shadow)" />
              <text x={position.labelX} y={position.labelY - 8}>
                {plot.name}
              </text>
              <text
                x={position.labelX}
                y={position.labelY + 12}
                className="map-value"
              >
                {mode === "stress"
                  ? `${plot.moisture}% hum.`
                  : mode === "health"
                    ? `${plot.health}% salud`
                    : `${plot.growth}% crec.`}
              </text>
            </g>
          )
        })}
        <circle cx="423" cy="85" r="7" className="sensor-dot" />
        <circle cx="118" cy="237" r="7" className="sensor-dot warning" />
      </svg>
      <div className="map-compass">N</div>
    </div>
  )
}

function Overview({
  plots,
  alerts,
  resolutions,
  devices,
  onNavigateFarms,
  onToast,
  onRefreshTelemetry,
}: {
  plots: Plot[]
  alerts: AlertItem[]
  resolutions: Record<string, Resolution>
  devices: DeviceItem[]
  onNavigateFarms: (plotId: string) => void
  onToast: (toast: ToastState) => void
  onRefreshTelemetry: () => void
}) {
  const [mode, setMode] = useState("stress")
  const [selectedFarm, setSelectedFarm] = useState("Todas las fincas")
  const [selectedId, setSelectedId] = useState(plots[0]?.id || "p3")
  const [zoom, setZoom] = useState(1)

  const filteredPlots =
    selectedFarm === "Todas las fincas"
      ? plots
      : plots.filter((p) => p.owner === selectedFarm)

  const selected = plots.find((plot) => plot.id === selectedId) || plots[0]
  const activeAlertsCount = alerts.filter((a) => !resolutions[a.id]).length
  const connectedDevicesCount = devices.filter(
    (d) => d.status === "Conectado",
  ).length
  const totalArea = plots.reduce((acc, p) => acc + p.area, 0).toFixed(1)

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-title">Visión general</span>
          <p>Monitorización en tiempo real de la cooperativa.</p>
        </div>
        <div>
          <Badge tone="success">
            <span className="live-dot" /> Datos en directo
          </Badge>
          <Button variant="secondary" onClick={onRefreshTelemetry}>
            <RefreshCw size={16} /> Actualizar
          </Button>
        </div>
      </div>
      <div className="kpi-grid">
        <KpiCard
          icon={<Map />}
          label="SUPERFICIE MONITORIZADA"
          value={`${totalArea} ha`}
          delta="+3,7 ha esta campaña"
        />
        <KpiCard
          icon={<AlertTriangle />}
          label="ALERTAS ACTIVAS"
          value={String(activeAlertsCount)}
          delta={`${
            activeAlertsCount > 0
              ? "1 requiere atención inmediata"
              : "Todo bajo control"
          }`}
          tone={activeAlertsCount > 0 ? "amber" : "green"}
        />
        <KpiCard
          icon={<Droplets />}
          label="AHORRO DE AGUA"
          value="18,4%"
          delta="+4,2% vs. campaña anterior"
          tone="blue"
        />
        <KpiCard
          icon={<Radio />}
          label="DISPOSITIVOS ONLINE"
          value={`${connectedDevicesCount}/${devices.length}`}
          delta={`${Math.round((connectedDevicesCount / devices.length) * 100)}% de conectividad`}
          tone="purple"
        />
      </div>
      <div className="twin-grid">
        <div className="admin-panel map-panel">
          <div className="admin-panel-heading">
            <div>
              <strong>Gemelo digital · {selectedFarm}</strong>
              <span>Telemetría LoRaWAN en tiempo real</span>
            </div>
            <Select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
            >
              <option>Todas las fincas</option>
              <option>Finca El Manantial</option>
              <option>Cortijo del Sol</option>
            </Select>
          </div>
          <div className="map-toolbar">
            <div className="segmented">
              <Button
                variant="ghost"
                className={mode === "stress" ? "active" : ""}
                onClick={() => setMode("stress")}
              >
                <Droplets size={15} /> Estrés hídrico
              </Button>
              <Button
                variant="ghost"
                className={mode === "health" ? "active" : ""}
                onClick={() => setMode("health")}
              >
                <ShieldCheck size={15} /> Fitosanitario
              </Button>
              <Button
                variant="ghost"
                className={mode === "growth" ? "active" : ""}
                onClick={() => setMode("growth")}
              >
                <Sprout size={15} /> Crecimiento
              </Button>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div
                className="map-zoom"
                style={{ position: "static", display: "flex", gap: 2 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => setZoom((z) => Math.min(1.4, z + 0.15))}
                  title="Acercar mapa"
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setZoom((z) => Math.max(0.85, z - 0.15))}
                  title="Alejar mapa"
                >
                  −
                </Button>
              </div>
            </div>
          </div>
          <FarmMap
            mode={mode}
            selected={selectedId}
            onSelect={setSelectedId}
            plots={filteredPlots}
            zoom={zoom}
          />
          <div className="map-legend">
            <span>Estado de la parcela</span>
            <div>
              <i className="good" />
              Óptimo
            </div>
            <div>
              <i className="moderate" />
              Moderado
            </div>
            <div>
              <i className="risk" />
              Crítico
            </div>
          </div>
        </div>
        <div className="admin-panel plot-inspector">
          <div className="inspector-hero">
            <div>
              <Badge tone={selected.stress}>
                {severityLabels[selected.stress]}
              </Badge>
              <span>PARCELA SELECCIONADA</span>
            </div>
            <strong>{selected.name}</strong>
            <p>
              {selected.crop} {selected.variety} · {selected.area} ha
            </p>
          </div>
          <div className="inspector-metrics">
            <div>
              <Droplets size={18} />
              <span>Humedad</span>
              <strong>{selected.moisture}%</strong>
            </div>
            <div>
              <Activity size={18} />
              <span>Salud</span>
              <strong>{selected.health}/100</strong>
            </div>
            <div>
              <Sprout size={18} />
              <span>Fase</span>
              <strong>{selected.phase}</strong>
            </div>
          </div>
          <div className="growth-chart">
            <div>
              <span>CURVA DE CRECIMIENTO</span>
              <Badge tone="success">En objetivo</Badge>
            </div>
            <strong>{selected.growth}%</strong>
            <span>del desarrollo esperado</span>
            <TrendChart
              values={[28, 34, 36, 43, 48, 57, 62, selected.growth]}
              color="green"
              height={100}
            />
          </div>
          {alerts.find(
            (a) => a.plotId === selected.id && !resolutions[a.id],
          ) && (
            <div className="inspector-alert">
              <div>
                <AlertTriangle size={17} />
                <strong>1 alerta activa</strong>
                <span>
                  {alerts.find((a) => a.plotId === selected.id)?.title}
                </span>
              </div>
              <ChevronRight size={18} />
            </div>
          )}
          <Button
            className="full-button"
            onClick={() => onNavigateFarms(selected.id)}
          >
            Ver detalle en Explotaciones <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <div className="bottom-grid">
        <div className="admin-panel recent-alerts">
          <div className="admin-panel-heading">
            <div>
              <strong>Alertas recientes</strong>
              <span>Priorizadas por impacto agronómico</span>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                onToast({
                  title: "Historial de alertas",
                  detail: `${alerts.length} alertas registradas en esta campaña.`,
                })
              }
            >
              Ver todas <ArrowRight size={15} />
            </Button>
          </div>
          {alerts.slice(0, 3).map((alert) => {
            const res = resolutions[alert.id]
            return (
              <div className="recent-row" key={alert.id}>
                <div className={`recent-icon ${alert.severity}`}>
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <strong>{alert.title}</strong>
                  <span>
                    {plots.find((plot) => plot.id === alert.plotId)?.name} ·{" "}
                    {alert.time}
                  </span>
                </div>
                {res ? (
                  <Badge
                    tone={res.status === "accepted" ? "success" : "neutral"}
                  >
                    {res.status === "accepted" ? "Aceptada" : "Rechazada"}
                  </Badge>
                ) : (
                  <Badge tone={alert.severity}>
                    {severityLabels[alert.severity]}
                  </Badge>
                )}
                <ChevronRight size={17} />
              </div>
            )
          })}
        </div>
        <div className="admin-panel irrigation-card">
          <div className="admin-panel-heading">
            <div>
              <strong>Riego hoy</strong>
              <span>Consumo acumulado</span>
            </div>
            <Droplets size={20} />
          </div>
          <div className="water-total">
            42,8 <span>m³</span>
          </div>
          <div className="water-target">
            <span>Objetivo diario</span>
            <strong>58 m³</strong>
          </div>
          <div className="progress">
            <i style={{ width: "74%" }} />
          </div>
          <div className="water-breakdown">
            <div>
              <i className="avocado" />
              <span>Aguacate</span>
              <strong>31,2 m³</strong>
            </div>
            <div>
              <i className="pitaya" />
              <span>Pitaya</span>
              <strong>11,6 m³</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminPageHeading({
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

function FarmsView({
  plots,
  selectedPlotId,
  onSelectPlot,
  onAddPlot,
  onUpdatePlot,
  onDeletePlot,
  onTriggerIrrigation,
  onToast,
}: {
  plots: Plot[]
  selectedPlotId?: string
  onSelectPlot: (id: string) => void
  onAddPlot: (plot: Omit<Plot, "id" | "trend">) => void
  onUpdatePlot: (id: string, updates: Partial<Plot>) => void
  onDeletePlot: (id: string) => void
  onTriggerIrrigation: (plotId: string, duration: number) => void
  onToast: (toast: ToastState) => void
}) {
  const [selected, setSelected] = useState(
    selectedPlotId || plots[0]?.id || "p1",
  )
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showIrrigateModal, setShowIrrigateModal] = useState(false)

  // Add Plot Form state
  const [name, setName] = useState("")
  const [crop, setCrop] = useState("Aguacate")
  const [variety, setVariety] = useState("Hass")
  const [area, setArea] = useState(4.5)
  const [owner, setOwner] = useState("Finca El Manantial")
  const [phase, setPhase] = useState("Crecimiento vegetativo")
  const [soil, setSoil] = useState("Franco-arenoso")
  const [irrigationSystem, setIrrigationSystem] = useState("Goteo sectorizado")

  // Sync selected if parent prop changes
  useEffect(() => {
    if (selectedPlotId) setSelected(selectedPlotId)
  }, [selectedPlotId])

  const plot = plots.find((item) => item.id === selected) || plots[0]

  const handleCreatePlot = (e: React.FormEvent) => {
    e.preventDefault()
    onAddPlot({
      name,
      crop,
      variety,
      area: Number(area),
      health: 90,
      moisture: 45,
      phase,
      stress: "success",
      growth: 70,
      owner,
      soil,
      irrigationSystem,
    })
    setShowAddModal(false)
    setName("")
  }

  const farmsList = Array.from(new Set(plots.map((p) => p.owner)))

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Explotaciones y especialización"
        subtitle="Estructura, perfiles agronómicos y configuración de parcelas."
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={17} /> Nueva parcela
          </Button>
        }
      />
      <div className="management-grid">
        <div className="admin-panel tree-panel">
          <div className="admin-panel-heading">
            <div>
              <strong>Estructura organizativa</strong>
              <span>
                {farmsList.length} explotaciones · {plots.length} parcelas
              </span>
            </div>
            <Search size={18} />
          </div>
          <div className="tree">
            <div className="tree-root">
              <ChevronDown />
              <div className="tree-icon coop">VV</div>
              <div>
                <strong>Cooperativa Valle Verde</strong>
                <span>
                  {plots.reduce((acc, p) => acc + p.area, 0).toFixed(1)} ha
                  monitorizadas
                </span>
              </div>
            </div>
            {farmsList.map((farm) => (
              <div className="tree-farm" key={farm}>
                <div className="tree-branch" />
                <ChevronDown size={16} />
                <div className="tree-icon">
                  <Tractor />
                </div>
                <div>
                  <strong>{farm}</strong>
                  <span>
                    {plots.filter((item) => item.owner === farm).length}{" "}
                    parcelas
                  </span>
                </div>
                <div className="tree-plots">
                  {plots
                    .filter((item) => item.owner === farm)
                    .map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={selected === item.id ? "active" : ""}
                        onClick={() => {
                          setSelected(item.id)
                          onSelectPlot(item.id)
                        }}
                      >
                        <span
                          className={`crop-dot ${
                            item.crop === "Aguacate" ? "avocado" : "pitaya"
                          }`}
                        />
                        <div>
                          <strong>{item.name}</strong>
                          <span>
                            {item.crop} · {item.area} ha
                          </span>
                        </div>
                        <ChevronRight />
                      </Button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {plot && (
          <div className="admin-panel detail-panel">
            <div className="detail-cover">
              <div className="contour-lines" />
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  gap: 8,
                }}
              >
                <Button
                  variant="secondary"
                  className="icon-button mini"
                  onClick={() => setShowEditModal(true)}
                  title="Editar parcela"
                >
                  <Settings2 size={15} />
                </Button>
                {plots.length > 1 && (
                  <Button
                    variant="danger"
                    className="icon-button mini"
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Seguro que deseas eliminar la parcela ${plot.name}?`,
                        )
                      ) {
                        onDeletePlot(plot.id)
                      }
                    }}
                    title="Eliminar parcela"
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
              <Badge tone={plot.stress}>{severityLabels[plot.stress]}</Badge>
              <div>
                <span>PARCELA</span>
                <strong>{plot.name}</strong>
                <p>{plot.owner}</p>
              </div>
            </div>
            <div className="detail-info-grid">
              <div>
                <span>CULTIVO</span>
                <strong>
                  {plot.crop} {plot.variety}
                </strong>
              </div>
              <div>
                <span>SUPERFICIE</span>
                <strong>{plot.area} ha</strong>
              </div>
              <div>
                <span>RIEGO</span>
                <strong>{plot.irrigationSystem || "Goteo sectorizado"}</strong>
              </div>
              <div>
                <span>SUELO</span>
                <strong>{plot.soil || "Franco-arenoso"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                onClick={() => setShowIrrigateModal(true)}
              >
                <Droplets size={16} /> Iniciar riego manual
              </Button>
            </div>

            <div className="profile-card">
              <div className="profile-icon">
                <Leaf />
              </div>
              <div>
                <span>PERFIL AGRONÓMICO ACTIVO</span>
                <strong>{plot.crop} mediterráneo · v2.4</strong>
                <p>
                  Umbrales y reglas adaptadas a suelo {plot.soil || "franco"} y
                  riego localizado.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowProfileModal(true)}
              >
                Cambiar perfil
              </Button>
            </div>
            <div className="rules-summary">
              <div>
                <strong>Reglas y monitorización activa</strong>
                <span>
                  Humedad actual: {plot.moisture}% · Salud: {plot.health}/100
                </span>
              </div>
              {[
                ["Humedad óptima de suelo", "38–62%"],
                ["Riesgo fitosanitario", "Modelo preventivo activo"],
                ["Fase fenológica", plot.phase],
              ].map(([ruleLabel, ruleVal]) => (
                <div key={ruleLabel}>
                  <CheckCircle2 />
                  <span>{ruleLabel}</span>
                  <strong>{ruleVal}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AdminModal
          title="Nueva parcela"
          subtitle="Registra una nueva superficie en la cooperativa."
          onClose={() => setShowAddModal(false)}
        >
          <form
            onSubmit={handleCreatePlot}
            style={{ display: "grid", gap: 12 }}
          >
            <label>
              Nombre de la parcela
              <Input
                required
                placeholder="Ej. Parcela El Rincón"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="form-grid-2">
              <label>
                Cultivo
                <Select value={crop} onChange={(e) => setCrop(e.target.value)}>
                  <option>Aguacate</option>
                  <option>Pitaya</option>
                  <option>Mango</option>
                  <option>Cítricos</option>
                  <option>Olivo</option>
                </Select>
              </label>
              <label>
                Variedad
                <Input
                  required
                  placeholder="Ej. Hass, Roja, Valencia"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                />
              </label>
            </div>
            <div className="form-grid-2">
              <label>
                Superficie (hectáreas)
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                />
              </label>
              <label>
                Explotación / Finca
                <Select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                >
                  <option>Finca El Manantial</option>
                  <option>Cortijo del Sol</option>
                </Select>
              </label>
            </div>
            <div className="form-grid-2">
              <label>
                Tipo de suelo
                <Select value={soil} onChange={(e) => setSoil(e.target.value)}>
                  <option>Franco-arenoso</option>
                  <option>Franco-arcilloso</option>
                  <option>Franco-limoso</option>
                  <option>Franco-pedregoso</option>
                </Select>
              </label>
              <label>
                Sistema de riego
                <Select
                  value={irrigationSystem}
                  onChange={(e) => setIrrigationSystem(e.target.value)}
                >
                  <option>Goteo sectorizado</option>
                  <option>Goteo autocompensante</option>
                  <option>Microaspersión</option>
                  <option>Riego localizado superficial</option>
                </Select>
              </label>
            </div>
            <div className="modal-footer">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar parcela</Button>
            </div>
          </form>
        </AdminModal>
      )}

      {showEditModal && plot && (
        <AdminModal
          title={`Editar ${plot.name}`}
          subtitle="Modifica los parámetros de la parcela."
          onClose={() => setShowEditModal(false)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Nombre de la parcela
              <Input
                defaultValue={plot.name}
                onChange={(e) => (plot.name = e.target.value)}
              />
            </label>
            <div className="form-grid-2">
              <label>
                Variedad
                <Input
                  defaultValue={plot.variety}
                  onChange={(e) => (plot.variety = e.target.value)}
                />
              </label>
              <label>
                Superficie (ha)
                <Input
                  type="number"
                  step="0.1"
                  defaultValue={plot.area}
                  onChange={(e) => (plot.area = Number(e.target.value))}
                />
              </label>
            </div>
            <label>
              Fase fenológica
              <Input
                defaultValue={plot.phase}
                onChange={(e) => (plot.phase = e.target.value)}
              />
            </label>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onUpdatePlot(plot.id, {
                    name: plot.name,
                    variety: plot.variety,
                    area: plot.area,
                    phase: plot.phase,
                  })
                  setShowEditModal(false)
                }}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </AdminModal>
      )}

      {showProfileModal && plot && (
        <AdminModal
          title="Cambiar perfil agronómico"
          subtitle={`Asigna un perfil precalibrado a ${plot.name}.`}
          onClose={() => setShowProfileModal(false)}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {[
              {
                name: "Aguacate Subtropical Intensivo v2.4",
                crop: "Aguacate",
                desc: "Optimizado para marcos intensivos, suelo franco y riego de alta frecuencia.",
              },
              {
                name: "Pitaya Riego Deficitario Controlado v1.8",
                crop: "Pitaya",
                desc: "Estimula floración y restringe humedad en periodos de reposo vegetativo.",
              },
              {
                name: "Cítricos y Frutales Valle del Guadalhorce v3.0",
                crop: "Cítricos",
                desc: "Umbrales adaptados a evapotranspiración estival del sur peninsular.",
              },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: 11 }}>{p.name}</strong>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {p.desc}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onToast({
                      title: "Perfil asignado",
                      detail: `Se ha establecido '${p.name}' en ${plot.name}.`,
                    })
                    setShowProfileModal(false)
                  }}
                >
                  Asignar
                </Button>
              </div>
            ))}
          </div>
        </AdminModal>
      )}

      {showIrrigateModal && plot && (
        <AdminModal
          title={`Riego manual en ${plot.name}`}
          subtitle="Inicia un ciclo de riego supervisado en los sectores activos."
          onClose={() => setShowIrrigateModal(false)}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
              Humedad actual: <strong>{plot.moisture}%</strong>. El caudalímetro
              registrará el volumen dosificado.
            </p>
            <div className="form-grid-3">
              {[15, 30, 45].map((mins) => (
                <Button
                  key={mins}
                  variant="secondary"
                  onClick={() => {
                    onTriggerIrrigation(plot.id, mins)
                    setShowIrrigateModal(false)
                  }}
                >
                  {mins} minutos
                </Button>
              ))}
            </div>
            <div className="modal-footer">
              <Button
                variant="ghost"
                onClick={() => setShowIrrigateModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

function UsersView({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToast,
}: {
  users: UserItem[]
  onAddUser: (user: Omit<UserItem, "id" | "initials">) => void
  onUpdateUser: (id: string, updates: Partial<UserItem>) => void
  onDeleteUser: (id: string) => void
  onToast: (toast: ToastState) => void
}) {
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("Todos los roles")
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Responsable agronómica")
  const [farm, setFarm] = useState("Todas")

  const filtered = users.filter((user) => {
    const matchesQuery =
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.role.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    const matchesRole =
      roleFilter === "Todos los roles" || user.role === roleFilter
    return matchesQuery && matchesRole
  })

  const submitNewUser = (e: React.FormEvent) => {
    e.preventDefault()
    onAddUser({
      name,
      email:
        email || `${name.toLowerCase().replace(/\s+/g, ".")}@valleverde.es`,
      role,
      farm,
      status: "Activo",
    })
    setShowForm(false)
    setName("")
    setEmail("")
  }

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Clientes, usuarios y roles"
        subtitle="Gestiona accesos y responsabilidades en toda la cooperativa."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={17} /> Nuevo usuario
          </Button>
        }
      />
      <div className="role-stats">
        {[
          [
            String(users.filter((u) => u.status === "Activo").length),
            "Usuarios activos",
            UsersRound,
          ],
          ["4", "Roles configurados", ShieldCheck],
          [
            String(users.filter((u) => u.status === "Invitado").length),
            "Invitaciones pendientes",
            Bell,
          ],
        ].map(([value, label, Icon]) => (
          <div key={String(label)}>
            <div>
              <Icon />
            </div>
            <strong>{value as string}</strong>
            <span>{label as string}</span>
          </div>
        ))}
      </div>
      <div className="admin-panel table-panel">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <Input
              placeholder="Buscar por nombre, correo o rol…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: 170, minHeight: 38 }}
          >
            <option>Todos los roles</option>
            <option>Responsable agronómica</option>
            <option>Responsable de riego</option>
            <option>Dirección de explotación</option>
            <option>Operario</option>
            <option>Operaria</option>
          </Select>
        </div>
        <div className="data-table users-table">
          <div className="table-row table-head">
            <span>USUARIO</span>
            <span>ROL</span>
            <span>EXPLOTACIÓN</span>
            <span>ESTADO</span>
            <span />
          </div>
          {filtered.map((user) => (
            <div className="table-row" key={user.id || user.name}>
              <div className="person-cell">
                <div>{user.initials}</div>
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>
              </div>
              <span>{user.role}</span>
              <span>{user.farm}</span>
              <span>
                <Badge tone={user.status === "Activo" ? "success" : "warning"}>
                  {user.status}
                </Badge>
              </span>
              <div style={{ position: "relative" }}>
                <Button
                  variant="ghost"
                  className="icon-button"
                  onClick={() =>
                    setActiveMenuId(activeMenuId === user.id ? null : user.id)
                  }
                >
                  <MoreHorizontal />
                </Button>
                {activeMenuId === user.id && (
                  <div className="action-menu-dropdown">
                    <button
                      className="action-menu-item"
                      onClick={() => {
                        setEditingUser(user)
                        setActiveMenuId(null)
                      }}
                    >
                      <Settings2 size={13} /> Editar rol
                    </button>
                    <button
                      className="action-menu-item"
                      onClick={() => {
                        onToast({
                          title: "Invitación reenviada",
                          detail: `Correo de acceso enviado a ${user.email}.`,
                        })
                        setActiveMenuId(null)
                      }}
                    >
                      <RefreshCw size={13} /> Reenviar acceso
                    </button>
                    <button
                      className="action-menu-item danger"
                      onClick={() => {
                        if (window.confirm(`¿Dar de baja a ${user.name}?`)) {
                          onDeleteUser(user.id)
                        }
                        setActiveMenuId(null)
                      }}
                    >
                      <Trash2 size={13} /> Eliminar usuario
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="permissions-card admin-panel">
        <div>
          <ShieldCheck />
          <span>
            <strong>Permisos por rol</strong>
            <small>
              Los permisos se heredan por explotación y pueden ajustarse
              individualmente.
            </small>
          </span>
        </div>
        <div className="permission-pills">
          <Badge tone="success">Dirección · Acceso total</Badge>
          <Badge tone="info">Agronomía · Reglas y datos</Badge>
          <Badge tone="warning">Riego · Automatizaciones</Badge>
          <Badge>Operario · Actuaciones</Badge>
        </div>
      </div>

      {showForm && (
        <AdminModal
          title="Nuevo usuario"
          subtitle="Invita a una persona a Valle Verde."
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={submitNewUser} style={{ display: "grid", gap: 12 }}>
            <label>
              Nombre completo
              <Input
                required
                placeholder="Nombre y apellidos"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Correo electrónico
              <Input
                type="email"
                required
                placeholder="nombre@valleverde.es"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Rol
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option>Responsable agronómica</option>
                <option>Responsable de riego</option>
                <option>Dirección de explotación</option>
                <option>Operario</option>
              </Select>
            </label>
            <label>
              Explotación
              <Select value={farm} onChange={(e) => setFarm(e.target.value)}>
                <option>Todas</option>
                <option>Finca El Manantial</option>
                <option>Cortijo del Sol</option>
              </Select>
            </label>
            <div className="modal-footer">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Enviar invitación</Button>
            </div>
          </form>
        </AdminModal>
      )}

      {editingUser && (
        <AdminModal
          title={`Editar usuario: ${editingUser.name}`}
          subtitle="Actualiza su rol y asignación de fincas."
          onClose={() => setEditingUser(null)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Rol asignado
              <Select
                defaultValue={editingUser.role}
                onChange={(e) => (editingUser.role = e.target.value)}
              >
                <option>Responsable agronómica</option>
                <option>Responsable de riego</option>
                <option>Dirección de explotación</option>
                <option>Operario</option>
              </Select>
            </label>
            <label>
              Explotación
              <Select
                defaultValue={editingUser.farm}
                onChange={(e) => (editingUser.farm = e.target.value)}
              >
                <option>Todas</option>
                <option>Finca El Manantial</option>
                <option>Cortijo del Sol</option>
              </Select>
            </label>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onUpdateUser(editingUser.id, {
                    role: editingUser.role,
                    farm: editingUser.farm,
                  })
                  setEditingUser(null)
                }}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

function DevicesView({
  devices,
  plots,
  onAddDevice,
  onPingDevice,
  onCalibrateDevice,
  onDeleteDevice,
  onToast,
}: {
  devices: DeviceItem[]
  plots: Plot[]
  onAddDevice: (dev: Omit<DeviceItem, "id"> & { id?: string }) => void
  onPingDevice: (id: string) => void
  onCalibrateDevice: (id: string, offset: number) => void
  onDeleteDevice: (id: string) => void
  onToast: (toast: ToastState) => void
}) {
  const [filter, setFilter] = useState("Todos")
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [calibratingDevice, setCalibratingDevice] = useState<DeviceItem | null>(
    null,
  )
  const [calOffset, setCalOffset] = useState(0)

  // Add Device Form
  const [devId, setDevId] = useState("")
  const [devType, setDevType] = useState("Sonda de humedad")
  const [devPlot, setDevPlot] = useState(plots[0]?.name || "La Umbría")

  const shown = devices.filter(
    (device) => filter === "Todos" || device.status === filter,
  )

  const connectedCount = devices.filter((d) => d.status === "Conectado").length
  const lowBatteryCount = devices.filter((d) => d.battery < 20).length
  const noSignalCount = devices.filter((d) => d.status === "Sin señal").length
  const healthPercent = Math.round((connectedCount / devices.length) * 100)

  const submitNewDevice = (e: React.FormEvent) => {
    e.preventDefault()
    const finalId =
      devId.trim() || `HUM-0${Math.floor(Math.random() * 80 + 30)}`
    onAddDevice({
      id: finalId,
      type: devType,
      plot: devPlot,
      battery: 100,
      signal: 95,
      status: "Conectado",
      last: "hace 1 min",
    })
    setShowAddModal(false)
    setDevId("")
  }

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Dispositivos IoT"
        subtitle="Conectividad y estado operativo de los sensores de campo."
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={17} /> Registrar dispositivo
          </Button>
        }
      />
      <div className="device-health">
        <div className="health-score">
          <div className="score-ring">
            <strong>{healthPercent}%</strong>
            <span>online</span>
          </div>
          <div>
            <span>SALUD DE LA RED</span>
            <strong>
              {connectedCount} de {devices.length} dispositivos conectados
            </strong>
            <p>
              La red funciona con normalidad. Hay{" "}
              {devices.length - connectedCount} incidencias que requieren
              revisión.
            </p>
          </div>
        </div>
        <div className="health-metrics">
          <div>
            <Wifi />
            <strong>{connectedCount}</strong>
            <span>Conectados</span>
          </div>
          <div>
            <BatteryMedium />
            <strong>{lowBatteryCount}</strong>
            <span>Batería baja</span>
          </div>
          <div>
            <AlertTriangle />
            <strong>{noSignalCount}</strong>
            <span>Sin señal</span>
          </div>
        </div>
      </div>
      <div className="admin-panel table-panel">
        <div className="table-toolbar">
          <div className="segmented">
            {["Todos", "Conectado", "Atención", "Sin señal"].map((item) => (
              <Button
                key={item}
                variant="ghost"
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              devices.forEach((d) => onPingDevice(d.id))
              onToast({
                title: "Red sincronizada",
                detail: "Se ha solicitado telemetría a todas las sondas.",
              })
            }}
          >
            <RefreshCw size={16} /> Actualizar estado
          </Button>
        </div>
        <div className="data-table devices-table">
          <div className="table-row table-head">
            <span>DISPOSITIVO</span>
            <span>UBICACIÓN</span>
            <span>SEÑAL</span>
            <span>BATERÍA</span>
            <span>ÚLTIMO DATO</span>
            <span>ESTADO</span>
            <span />
          </div>
          {shown.map((device) => (
            <div className="table-row" key={device.id}>
              <div className="device-cell">
                <div>
                  <Radio />
                </div>
                <span>
                  <strong>{device.id}</strong>
                  <small>{device.type}</small>
                </span>
              </div>
              <span>{device.plot}</span>
              <div className="signal-cell">
                <Wifi size={16} />
                <strong>{device.signal ? `${device.signal}%` : "—"}</strong>
              </div>
              <div
                className={`battery-cell ${device.battery < 20 ? "low" : ""}`}
              >
                <BatteryMedium size={17} />
                <strong>{device.battery}%</strong>
              </div>
              <span>{device.last}</span>
              <span>
                <Badge
                  tone={
                    device.status === "Conectado"
                      ? "success"
                      : device.status === "Atención"
                        ? "warning"
                        : "critical"
                  }
                >
                  {device.status}
                </Badge>
              </span>
              <div style={{ position: "relative" }}>
                <Button
                  variant="ghost"
                  className="icon-button"
                  onClick={() =>
                    setActiveMenuId(
                      activeMenuId === device.id ? null : device.id,
                    )
                  }
                >
                  <MoreHorizontal />
                </Button>
                {activeMenuId === device.id && (
                  <div className="action-menu-dropdown">
                    <button
                      className="action-menu-item"
                      onClick={() => {
                        onPingDevice(device.id)
                        setActiveMenuId(null)
                      }}
                    >
                      <RefreshCw size={13} /> Ping / Reconectar
                    </button>
                    <button
                      className="action-menu-item"
                      onClick={() => {
                        setCalibratingDevice(device)
                        setCalOffset(device.calibrationOffset || 0)
                        setActiveMenuId(null)
                      }}
                    >
                      <Settings2 size={13} /> Calibrar sensor
                    </button>
                    <button
                      className="action-menu-item danger"
                      onClick={() => {
                        if (
                          window.confirm(`¿Eliminar el sensor ${device.id}?`)
                        ) {
                          onDeleteDevice(device.id)
                        }
                        setActiveMenuId(null)
                      }}
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AdminModal
          title="Registrar dispositivo IoT"
          subtitle="Añade una nueva sonda o estación meteorológica."
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={submitNewDevice} style={{ display: "grid", gap: 12 }}>
            <label>
              Identificador (EUI / Serial)
              <Input
                placeholder="Ej. HUM-031 (dejar vacío para autogenerar)"
                value={devId}
                onChange={(e) => setDevId(e.target.value)}
              />
            </label>
            <label>
              Tipo de sensor
              <Select
                value={devType}
                onChange={(e) => setDevType(e.target.value)}
              >
                <option>Sonda de humedad</option>
                <option>Estación meteorológica</option>
                <option>Caudalímetro</option>
                <option>Sensor foliar</option>
                <option>Sensor de conductividad eléctrica</option>
              </Select>
            </label>
            <label>
              Parcela asignada
              <Select
                value={devPlot}
                onChange={(e) => setDevPlot(e.target.value)}
              >
                {plots.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.crop})
                  </option>
                ))}
              </Select>
            </label>
            <div className="modal-footer">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Vincular dispositivo</Button>
            </div>
          </form>
        </AdminModal>
      )}

      {calibratingDevice && (
        <AdminModal
          title={`Calibrar ${calibratingDevice.id}`}
          subtitle={`Ajuste de offset para ${calibratingDevice.type}.`}
          onClose={() => setCalibratingDevice(null)}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
              Ajuste fino de compensación porcentual respecto a la lectura de
              laboratorio:
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Input
                type="number"
                step="0.5"
                value={calOffset}
                onChange={(e) => setCalOffset(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{ fontSize: 11, fontWeight: 700 }}>
                % de corrección
              </span>
            </div>
            <div className="modal-footer">
              <Button
                variant="ghost"
                onClick={() => setCalibratingDevice(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onCalibrateDevice(calibratingDevice.id, calOffset)
                  setCalibratingDevice(null)
                }}
              >
                Guardar calibración
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

function RulesView({
  rules,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  automation,
  onToggleAutomation,
  securityLimits,
  onUpdateSecurityLimits,
  onToast,
}: {
  rules: RuleItem[]
  onAddRule: (rule: Omit<RuleItem, "id" | "triggered">) => void
  onToggleRule: (id: string) => void
  onDeleteRule: (id: string) => void
  automation: boolean
  onToggleAutomation: () => void
  securityLimits: SecurityLimits
  onUpdateSecurityLimits: (limits: SecurityLimits) => void
  onToast: (toast: ToastState) => void
}) {
  const [cropFilter, setCropFilter] = useState("Todos los cultivos")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showProfilesModal, setShowProfilesModal] = useState(false)

  // Rule Form state
  const [ruleName, setRuleName] = useState("")
  const [ruleCrop, setRuleCrop] = useState("Pitaya")
  const [condition, setCondition] = useState("Humedad < 32% durante 3 h")
  const [severity, setSeverity] = useState<"Crítica" | "Alta" | "Informativa">(
    "Crítica",
  )
  const [autoAction, setAutoAction] = useState(true)

  // Limits Form state
  const [maxTime, setMaxTime] = useState(securityLimits.maxTimePerSector)
  const [minPause, setMinPause] = useState(securityLimits.minPauseHours)
  const [maxFlow, setMaxFlow] = useState(securityLimits.maxFlowRate)

  const shownRules = rules.filter(
    (rule) =>
      cropFilter === "Todos los cultivos" ||
      rule.crop === cropFilter ||
      rule.crop === "Todos",
  )

  const submitRule = (e: React.FormEvent) => {
    e.preventDefault()
    onAddRule({
      name: ruleName,
      crop: ruleCrop,
      condition,
      severity,
      active: true,
      autoAction,
    })
    setShowAddModal(false)
    setRuleName("")
  }

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Reglas y automatización"
        subtitle="Configura umbrales, severidad y respuestas automáticas."
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={17} /> Crear regla
          </Button>
        }
      />
      <div className="automation-banner">
        <div className="automation-icon">
          <Zap />
        </div>
        <div>
          <span>AUTOMATIZACIÓN DE RIEGO</span>
          <strong>Autorización previa de actuaciones</strong>
          <p>
            Permite al sistema ejecutar riegos dentro de límites seguros cuando
            se active una regla crítica.
          </p>
        </div>
        <div className="automation-status">
          <Badge tone={automation ? "success" : "neutral"}>
            {automation ? "Autorizada" : "Requiere autorización"}
          </Badge>
          <Button
            variant={automation ? "secondary" : "primary"}
            onClick={onToggleAutomation}
          >
            {automation ? "Pausar" : "Revisar y autorizar"}
          </Button>
        </div>
      </div>
      <div className="admin-panel rules-panel">
        <div className="table-toolbar">
          <div>
            <strong>Reglas agronómicas</strong>
            <span>
              {rules.filter((rule) => rule.active).length} activas de{" "}
              {rules.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              style={{ width: 170, minHeight: 36 }}
            >
              <option>Todos los cultivos</option>
              <option>Aguacate</option>
              <option>Pitaya</option>
              <option>Todos</option>
            </Select>
            <Button
              variant="secondary"
              onClick={() => setShowProfilesModal(true)}
            >
              <Settings2 size={16} /> Gestionar perfiles
            </Button>
          </div>
        </div>
        <div className="rules-list">
          {shownRules.map((rule) => (
            <div className="rule-row" key={rule.id}>
              <Button
                variant="ghost"
                className={`toggle ${rule.active ? "active" : ""}`}
                onClick={() => onToggleRule(rule.id)}
                aria-label={`Cambiar estado de ${rule.name}`}
              >
                <i />
              </Button>
              <div
                className={`rule-severity ${
                  rule.severity === "Crítica"
                    ? "critical"
                    : rule.severity === "Alta"
                      ? "warning"
                      : "info"
                }`}
              >
                <AlertTriangle />
              </div>
              <div className="rule-main">
                <strong>{rule.name}</strong>
                <span>{rule.condition}</span>
              </div>
              <Badge>{rule.crop}</Badge>
              <div className="rule-trigger">
                <span>ÚLTIMA ACTIVACIÓN</span>
                <strong>{rule.triggered}</strong>
              </div>
              <Badge
                tone={
                  rule.severity === "Crítica"
                    ? "critical"
                    : rule.severity === "Alta"
                      ? "warning"
                      : "info"
                }
              >
                {rule.severity}
              </Badge>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => {
                  if (window.confirm(`¿Eliminar la regla "${rule.name}"?`)) {
                    onDeleteRule(rule.id)
                  }
                }}
                title="Eliminar regla"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="safety-card">
        <ShieldCheck />
        <div>
          <strong>Límites de seguridad configurados</strong>
          <span>
            Máximo {securityLimits.maxTimePerSector} min por sector · Pausa
            mínima {securityLimits.minPauseHours} h · Caudal máximo{" "}
            {securityLimits.maxFlowRate} m³/h
          </span>
        </div>
        <Button variant="ghost" onClick={() => setShowLimitsModal(true)}>
          Editar límites <ChevronRight size={16} />
        </Button>
      </div>

      {showAddModal && (
        <AdminModal
          title="Crear regla agronómica"
          subtitle="Define umbrales para disparo de alertas o automatismos."
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={submitRule} style={{ display: "grid", gap: 12 }}>
            <label>
              Nombre de la regla
              <Input
                required
                placeholder="Ej. Estrés hídrico en floración"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </label>
            <div className="form-grid-2">
              <label>
                Cultivo aplicable
                <Select
                  value={ruleCrop}
                  onChange={(e) => setRuleCrop(e.target.value)}
                >
                  <option>Pitaya</option>
                  <option>Aguacate</option>
                  <option>Todos</option>
                </Select>
              </label>
              <label>
                Severidad
                <Select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(
                      e.target.value as "Crítica" | "Alta" | "Informativa",
                    )
                  }
                >
                  <option>Crítica</option>
                  <option>Alta</option>
                  <option>Informativa</option>
                </Select>
              </label>
            </div>
            <label>
              Condición de activación
              <Input
                required
                placeholder="Ej. Humedad < 30% durante 4 horas"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={autoAction}
                onChange={(e) => setAutoAction(e.target.checked)}
              />
              <span>
                Ejecutar riego automático si la automatización está autorizada
              </span>
            </label>
            <div className="modal-footer">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar regla</Button>
            </div>
          </form>
        </AdminModal>
      )}

      {showLimitsModal && (
        <AdminModal
          title="Límites de seguridad de riego"
          subtitle="Evita sobre-irrigación y protege la instalación hidráulica."
          onClose={() => setShowLimitsModal(false)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Tiempo máximo continuo por sector (minutos)
              <Input
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(Number(e.target.value))}
              />
            </label>
            <label>
              Pausa mínima entre riegos consecutivos (horas)
              <Input
                type="number"
                value={minPause}
                onChange={(e) => setMinPause(Number(e.target.value))}
              />
            </label>
            <label>
              Caudal máximo permitido (m³/h)
              <Input
                type="number"
                step="0.1"
                value={maxFlow}
                onChange={(e) => setMaxFlow(Number(e.target.value))}
              />
            </label>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setShowLimitsModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onUpdateSecurityLimits({
                    maxTimePerSector: maxTime,
                    minPauseHours: minPause,
                    maxFlowRate: maxFlow,
                  })
                  setShowLimitsModal(false)
                }}
              >
                Guardar límites
              </Button>
            </div>
          </div>
        </AdminModal>
      )}

      {showProfilesModal && (
        <AdminModal
          title="Perfiles agronómicos de la cooperativa"
          subtitle="Catálogo de presets para ajuste automático de reglas."
          onClose={() => setShowProfilesModal(false)}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {[
              {
                crop: "Aguacate",
                profile: "Perfil Hass Intensivo (Málaga)",
                moisture: "38–60%",
                stress: "> 72% Asfixia radicular | < 35% Estrés hídrico",
              },
              {
                crop: "Pitaya",
                profile: "Perfil Pitaya Roja Subtropical",
                moisture: "30–48%",
                stress: "> 65% Pudrición fúngica | < 28% Marchitamiento",
              },
            ].map((p) => (
              <div
                key={p.crop}
                style={{
                  background: "#f7f9f7",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <strong style={{ fontSize: 12, color: "var(--forest-900)" }}>
                  {p.profile}
                </strong>
                <div
                  style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}
                >
                  Humedad objetivo: <strong>{p.moisture}</strong>
                </div>
                <div
                  style={{ fontSize: 9, color: "var(--amber)", marginTop: 2 }}
                >
                  {p.stress}
                </div>
              </div>
            ))}
          </div>
        </AdminModal>
      )}
    </div>
  )
}

function AnalyticsView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [crop, setCrop] = useState("Aguacate")
  const [isCalculating, setIsCalculating] = useState(false)
  const [waterAdj, setWaterAdj] = useState(0)
  const [tempAdj, setTempAdj] = useState(0)

  // Dynamic values calculation based on crop and simulation sliders
  const baseYield = crop === "Aguacate" ? 186.4 : 72.8
  const simulatedYield = (
    baseYield *
    (1 + waterAdj * 0.005 + tempAdj * 0.008)
  ).toFixed(1)

  const baseValues =
    crop === "Aguacate"
      ? [12, 18, 25, 36, 48, 64, 78, 86, 72, 49, 23]
      : [8, 12, 17, 24, 35, 51, 67, 76, 69, 43, 18]

  const values = baseValues.map((v) =>
    Math.round(v * (1 + waterAdj * 0.004 + tempAdj * 0.006)),
  )

  const recalculate = () => {
    setIsCalculating(true)
    setTimeout(() => {
      setIsCalculating(false)
      onToast({
        title: "Modelo recalibrado",
        detail: `Predicción actualizada para ${crop} con 89% de intervalo de confianza.`,
      })
    }, 800)
  }

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Modelos predictivos"
        subtitle="Previsión de rendimiento y ventanas óptimas de recolección."
        action={
          <div className="heading-selects" style={{ display: "flex", gap: 8 }}>
            <Select
              value={crop}
              onChange={(event) => setCrop(event.target.value)}
            >
              <option>Aguacate</option>
              <option>Pitaya</option>
            </Select>
            <Button
              variant="secondary"
              onClick={recalculate}
              disabled={isCalculating}
            >
              <RefreshCw
                size={16}
                className={isCalculating ? "animate-spin" : ""}
              />
              {isCalculating ? "Calculando…" : "Recalcular"}
            </Button>
          </div>
        }
      />
      <div className="prediction-hero">
        <div className="prediction-copy">
          <Badge tone="success">
            <Bot size={13} /> MODELO ACTUALIZADO
          </Badge>
          <span>PRODUCCIÓN ESTIMADA · CAMPAÑA 2025</span>
          <strong>
            {simulatedYield} <small>toneladas</small>
          </strong>
          <p>
            Intervalo probable:{" "}
            {crop === "Aguacate"
              ? `${(Number(simulatedYield) * 0.93).toFixed(1)}–${(Number(simulatedYield) * 1.07).toFixed(1)} t`
              : `${(Number(simulatedYield) * 0.91).toFixed(1)}–${(Number(simulatedYield) * 1.09).toFixed(1)} t`}{" "}
            con un 87% de confianza.
          </p>
          <div className="prediction-delta">
            <TrendingUp />
            <strong>+8,6%</strong>
            <span>respecto a la campaña anterior</span>
          </div>
        </div>
        <div className="harvest-window">
          <span>VENTANA ÓPTIMA DE RECOLECCIÓN</span>
          <div className="calendar-band">
            <i />
            <i className="active" />
            <i className="peak" />
            <i className="active" />
            <i />
          </div>
          <div className="month-labels">
            <span>SEP</span>
            <span>OCT</span>
            <span>NOV</span>
            <span>DIC</span>
            <span>ENE</span>
          </div>
          <strong>
            {crop === "Aguacate" ? "24 oct — 18 dic" : "15 ago — 30 oct"}
          </strong>
          <p>
            Pico de madurez previsto:{" "}
            {crop === "Aguacate" ? "12 de noviembre" : "20 de septiembre"}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="sim-slider-box">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: 12, color: "var(--forest-900)" }}>
              Simulador de escenarios What-If
            </strong>
            <Button
              variant="ghost"
              style={{ fontSize: 10, color: "var(--muted)" }}
              onClick={() => {
                setWaterAdj(0)
                setTempAdj(0)
              }}
            >
              Restablecer parámetros
            </Button>
          </div>
          <div className="form-grid-2">
            <div className="slider-row">
              <div className="slider-row-header">
                <span>Aporte hídrico adicional</span>
                <strong>
                  {waterAdj > 0 ? `+${waterAdj}%` : `${waterAdj}%`}
                </strong>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                value={waterAdj}
                onChange={(e) => setWaterAdj(Number(e.target.value))}
                className="slider-input"
              />
            </div>
            <div className="slider-row">
              <div className="slider-row-header">
                <span>Variación de temperatura media</span>
                <strong>
                  {tempAdj > 0 ? `+${tempAdj}°C` : `${tempAdj}°C`}
                </strong>
              </div>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.5"
                value={tempAdj}
                onChange={(e) => setTempAdj(Number(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="admin-panel yield-chart">
          <div className="admin-panel-heading">
            <div>
              <strong>Curva de producción esperada</strong>
              <span>Toneladas semanales · Intervalo de confianza 87%</span>
            </div>
            <Badge tone="info">Predicción IA</Badge>
          </div>
          <div className="chart-y-label">VOLUMEN (t)</div>
          <TrendChart values={values} height={220} color="green" />
          <div className="analytics-axis">
            <span>AGO</span>
            <span>SEP</span>
            <span>OCT</span>
            <span>NOV</span>
            <span>DIC</span>
            <span>ENE</span>
          </div>
        </div>
        <div className="admin-panel factors-panel">
          <div className="admin-panel-heading">
            <div>
              <strong>Factores principales</strong>
              <span>Impacto sobre la predicción</span>
            </div>
            <CircleHelp size={18} />
          </div>
          {[
            ["Disponibilidad hídrica", "+12%", "positive", 88],
            ["Temperatura acumulada", "+6%", "positive", 68],
            ["Incidencia fitosanitaria", "−3%", "negative", 31],
            ["Carga floral observada", "+9%", "positive", 76],
          ].map(([label, impact, tone, amount]) => (
            <div className="factor-row" key={String(label)}>
              <div>
                <strong>{label as string}</strong>
                <span className={String(tone)}>{impact as string}</span>
              </div>
              <div className="factor-bar">
                <i className={String(tone)} style={{ width: `${amount}%` }} />
              </div>
            </div>
          ))}
          <div className="model-note">
            <Bot />
            <p>
              <strong>Cómo leer esta predicción</strong> El modelo combina datos
              de campo, históricos y previsión meteorológica. No sustituye la
              validación del responsable agronómico.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportsView({
  reports,
  onGenerateReport,
  onToast,
}: {
  reports: ReportItem[]
  onGenerateReport: (rep: Omit<ReportItem, "id" | "size" | "date">) => void
  onToast: (toast: ToastState) => void
}) {
  const [reportType, setReportType] = useState("Consumo hídrico y eficiencia")
  const [farm, setFarm] = useState("Todas las explotaciones")
  const [period, setPeriod] = useState("Campaña 2025")
  const [format, setFormat] = useState<"PDF" | "XLSX" | "CSV">("PDF")
  const [previewingReport, setPreviewingReport] = useState<ReportItem | null>(
    null,
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerateReport({
      name: `${reportType} · ${period}`,
      type: reportType,
      farm,
      period,
      format,
    })
    onToast({
      title: "Documento generado",
      detail: `El informe de ${reportType} ya está listo para descargar.`,
    })
  }

  const downloadFile = (rep: ReportItem) => {
    const content = `INFORME AGRONÓMICO OFICIAL - COOPERATIVA VALLE VERDE\n${rep.name}\nFecha: ${rep.date}\nTipo: ${rep.type}\nExplotación: ${rep.farm}\nPeriodo: ${rep.period}\nFormato: ${rep.format}\n\nResumen ejecutivo:\nSe ha analizado la eficiencia hídrica y trazabilidad de los sectores monitorizados. Todas las lecturas cumplen con el Real Decreto de Nutrición y Uso Sostenible de Suelos.`
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${rep.name.replace(/\s+/g, "_")}.${rep.format.toLowerCase()}`
    a.click()
    URL.revokeObjectURL(url)
    onToast({
      title: "Descarga iniciada",
      detail: `Guardando ${rep.name}.${rep.format.toLowerCase()}`,
    })
  }

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Informes y cumplimiento"
        subtitle="Consumo de recursos, trazabilidad y documentación ambiental."
        action={
          <Button onClick={() => setPreviewingReport(reports[0])}>
            <FileText size={17} /> Ver último informe
          </Button>
        }
      />
      <div className="report-kpis">
        <KpiCard
          icon={<Droplets />}
          label="CONSUMO DE AGUA"
          value="12.840 m³"
          delta="−11,2% vs. campaña anterior"
          tone="blue"
        />
        <KpiCard
          icon={<Leaf />}
          label="INSUMOS APLICADOS"
          value="4,8 t"
          delta="−7,4% por hectárea"
        />
        <KpiCard
          icon={<Gauge />}
          label="EFICIENCIA HÍDRICA"
          value="8,7/10"
          delta="+0,9 puntos"
          tone="purple"
        />
      </div>
      <div className="reports-grid">
        <form className="admin-panel report-builder" onSubmit={handleSubmit}>
          <div className="admin-panel-heading">
            <div>
              <strong>Generador de informes</strong>
              <span>Configura un nuevo documento</span>
            </div>
            <FileBarChart />
          </div>
          <label>
            Tipo de informe
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option>Consumo hídrico y eficiencia</option>
              <option>Uso de insumos y fitosanitarios</option>
              <option>Trazabilidad de actuaciones de campo</option>
              <option>Cumplimiento ambiental SIEX</option>
            </Select>
          </label>
          <div className="form-two">
            <label>
              Explotación
              <Select value={farm} onChange={(e) => setFarm(e.target.value)}>
                <option>Todas las explotaciones</option>
                <option>Finca El Manantial</option>
                <option>Cortijo del Sol</option>
              </Select>
            </label>
            <label>
              Periodo
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option>Campaña 2025</option>
                <option>Último trimestre</option>
                <option>Mes en curso</option>
              </Select>
            </label>
          </div>
          <label>
            Formato de salida
            <Select
              value={format}
              onChange={(e) =>
                setFormat(e.target.value as "PDF" | "XLSX" | "CSV")
              }
            >
              <option value="PDF">Documento PDF Oficial</option>
              <option value="XLSX">Hoja de cálculo Excel (.xlsx)</option>
              <option value="CSV">Datos tabulares CSV</option>
            </Select>
          </label>
          <div className="compliance-note">
            <ShieldCheck />
            <div>
              <strong>Formato compatible con auditoría</strong>
              <span>
                Incluye firma de responsable, fuentes de telemetría y sellado
                temporal.
              </span>
            </div>
          </div>
          <Button type="submit" className="full-button">
            Generar documento <ArrowRight size={16} />
          </Button>
        </form>

        <div className="admin-panel report-history">
          <div className="admin-panel-heading">
            <div>
              <strong>Informes recientes</strong>
              <span>Documentos generados listos para descarga</span>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                onToast({
                  title: "Historial de descargas",
                  detail: `${reports.length} informes disponibles.`,
                })
              }
            >
              Ver archivo
            </Button>
          </div>
          {reports.map((rep) => (
            <div className="report-row" key={rep.id}>
              <div className="file-icon">
                <FileBarChart />
              </div>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setPreviewingReport(rep)}
              >
                <strong>{rep.name}</strong>
                <span>
                  {rep.format} · {rep.size} · {rep.date}
                </span>
              </div>
              <Badge tone="success">Listo</Badge>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => downloadFile(rep)}
                title="Descargar archivo"
              >
                <Download size={16} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {previewingReport && (
        <AdminModal
          title={`Vista previa: ${previewingReport.name}`}
          subtitle={`Generado el ${previewingReport.date} · Formato ${previewingReport.format}`}
          onClose={() => setPreviewingReport(null)}
          className="report-preview-modal"
        >
          <div className="report-doc">
            <div className="report-doc-header">
              <div>
                <strong style={{ fontSize: 14, color: "var(--forest-900)" }}>
                  COOPERATIVA AGRÍCOLA VALLE VERDE
                </strong>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: "var(--muted)",
                    marginTop: 2,
                  }}
                >
                  Certificación de Eficiencia Hídrica y Sostenibilidad · Campaña
                  2025
                </p>
              </div>
              <Badge tone="success">Auditoría Aprobada</Badge>
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Sector / Parcela</th>
                  <th>Cultivo</th>
                  <th>Consumo (m³)</th>
                  <th>Eficiencia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>La Umbría (Sec. 1)</td>
                  <td>Aguacate Hass</td>
                  <td>6.420</td>
                  <td>94%</td>
                </tr>
                <tr>
                  <td>Los Naranjos (Sec. 2)</td>
                  <td>Aguacate Hass</td>
                  <td>3.810</td>
                  <td>97%</td>
                </tr>
                <tr>
                  <td>Loma Alta (Sec. 3)</td>
                  <td>Pitaya Roja</td>
                  <td>1.540</td>
                  <td>91%</td>
                </tr>
                <tr>
                  <td>El Molino (Sec. 4)</td>
                  <td>Pitaya Amarilla</td>
                  <td>1.070</td>
                  <td>95%</td>
                </tr>
              </tbody>
            </table>
            <div
              style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.5 }}
            >
              * Datos recopilados a partir de sondas tensiométricas HUM y
              caudalímetro CAU-009 validados por AgroLab Sur.
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setPreviewingReport(null)}>
                Cerrar vista previa
              </Button>
              <Button onClick={() => downloadFile(previewingReport)}>
                <Download size={16} /> Descargar {previewingReport.format}
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

function IntegrationsView({
  integrations,
  assistanceRequests,
  onToggleIntegration,
  onAddAssistanceRequest,
  onResolveAssistanceRequest,
  onToast,
}: {
  integrations: IntegrationItem[]
  assistanceRequests: AssistanceRequest[]
  onToggleIntegration: (id: string) => void
  onAddAssistanceRequest: (
    req: Omit<AssistanceRequest, "id" | "date" | "status">,
  ) => void
  onResolveAssistanceRequest: (id: string) => void
  onToast: (toast: ToastState) => void
}) {
  const [showAssistanceModal, setShowAssistanceModal] = useState(false)
  const [configuringIntegration, setConfiguringIntegration] =
    useState<IntegrationItem | null>(null)

  // Assistance form
  const [issueName, setIssueName] = useState("")
  const [provider, setProvider] = useState("SenseField")
  const [priority, setPriority] = useState<"Alta" | "Media" | "Baja">("Media")
  const [details, setDetails] = useState("")

  const submitAssistance = (e: React.FormEvent) => {
    e.preventDefault()
    onAddAssistanceRequest({
      name: issueName,
      provider,
      priority,
      details,
    })
    setShowAssistanceModal(false)
    setIssueName("")
    setDetails("")
    onToast({
      title: "Solicitud registrada",
      detail: `Notificación enviada al soporte de ${provider}.`,
    })
  }

  const iconsMap: Record<string, typeof CloudSun> = {
    "AEMET Agro": CloudSun,
    "AgroLab Sur": Sprout,
    SenseField: Radio,
    "Cuaderno Digital": FileBarChart,
  }

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Integraciones y servicios"
        subtitle="Conecta proveedores y coordina asistencia externa."
        action={
          <Button onClick={() => setShowAssistanceModal(true)}>
            <Plus size={17} /> Solicitar asistencia
          </Button>
        }
      />
      <div className="integration-grid">
        {integrations.map((item) => {
          const Icon = iconsMap[item.name] || Zap
          return (
            <div className="integration-card" key={item.id}>
              <div className="integration-top">
                <div>
                  <Icon />
                </div>
                <Badge tone={item.status === "Conectado" ? "success" : "info"}>
                  {item.status}
                </Badge>
              </div>
              <span>{item.category}</span>
              <strong>{item.name}</strong>
              <p>{item.detail}</p>
              <div
                style={{ width: "100%", display: "flex", gap: 6, marginTop: 8 }}
              >
                <Button
                  variant="secondary"
                  style={{ flex: 1 }}
                  onClick={() => setConfiguringIntegration(item)}
                >
                  Configurar
                </Button>
                <Button
                  variant={item.status === "Conectado" ? "ghost" : "primary"}
                  onClick={() => onToggleIntegration(item.id)}
                  style={{ fontSize: 10, padding: "0 8px" }}
                >
                  {item.status === "Conectado" ? "Pausar" : "Conectar"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="admin-panel assistance-panel">
        <div className="admin-panel-heading">
          <div>
            <strong>Solicitudes de asistencia técnica</strong>
            <span>Seguimiento con proveedores externos</span>
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              onToast({
                title: "Asistencia externa",
                detail: `${assistanceRequests.length} tickets en curso con empresas colaboradoras.`,
              })
            }
          >
            Ver todas
          </Button>
        </div>
        {assistanceRequests.map((item) => (
          <div className="assistance-row" key={item.id}>
            <div className="service-icon">
              <Headphones />
            </div>
            <div style={{ flex: 1 }}>
              <strong>{item.name}</strong>
              <span>
                {item.provider} · {item.date}{" "}
                {item.details ? `· ${item.details}` : ""}
              </span>
            </div>
            <Badge
              tone={
                item.priority === "Alta"
                  ? "critical"
                  : item.priority === "Media"
                    ? "warning"
                    : "neutral"
              }
            >
              {item.priority}
            </Badge>
            <Badge tone={item.status === "Resuelta" ? "success" : "info"}>
              {item.status}
            </Badge>
            {item.status !== "Resuelta" ? (
              <Button
                variant="ghost"
                className="icon-button mini"
                onClick={() => onResolveAssistanceRequest(item.id)}
                title="Marcar como resuelta"
              >
                <Check size={16} />
              </Button>
            ) : (
              <ChevronRight size={16} />
            )}
          </div>
        ))}
      </div>

      {showAssistanceModal && (
        <AdminModal
          title="Nueva solicitud de asistencia"
          subtitle="Abre una incidencia directa con el proveedor homologado."
          onClose={() => setShowAssistanceModal(false)}
        >
          <form
            onSubmit={submitAssistance}
            style={{ display: "grid", gap: 12 }}
          >
            <label>
              Proveedor de servicio
              <Select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option>SenseField (Hardware IoT y sondas)</option>
                <option>AgroLab Sur (Análisis foliares y suelo)</option>
                <option>AEMET Agro (Previsión meteorológica)</option>
                <option>Cuaderno Digital (Sincronización SIEX)</option>
              </Select>
            </label>
            <label>
              Motivo de la solicitud
              <Input
                required
                placeholder="Ej. Revisión de sonda HUM-024 o muestreo de raíces"
                value={issueName}
                onChange={(e) => setIssueName(e.target.value)}
              />
            </label>
            <label>
              Prioridad
              <Select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "Alta" | "Media" | "Baja")
                }
              >
                <option>Alta</option>
                <option>Media</option>
                <option>Baja</option>
              </Select>
            </label>
            <label>
              Detalles adicionales
              <Textarea
                rows={3}
                placeholder="Indica parcela, síntomas observados o código de sensor…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </label>
            <div className="modal-footer">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowAssistanceModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Enviar solicitud</Button>
            </div>
          </form>
        </AdminModal>
      )}

      {configuringIntegration && (
        <AdminModal
          title={`Configuración: ${configuringIntegration.name}`}
          subtitle="Ajusta los parámetros de API y sincronización."
          onClose={() => setConfiguringIntegration(null)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Clave de API / Token
              <Input type="password" defaultValue="••••••••••••••••••••••••" />
            </label>
            <div className="form-grid-2">
              <label>
                Frecuencia de sincronización
                <Select
                  defaultValue={
                    configuringIntegration.syncFreq || "Cada 15 min"
                  }
                >
                  <option>Tiempo real</option>
                  <option>Cada 15 min</option>
                  <option>Diario (06:00)</option>
                  <option>Bajo demanda</option>
                </Select>
              </label>
              <label>
                Estado del conector
                <Select defaultValue={configuringIntegration.status}>
                  <option>Conectado</option>
                  <option>Pausado</option>
                  <option>Disponible</option>
                </Select>
              </label>
            </div>
            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => {
                  onToast({
                    title: "Conexión verificada",
                    detail: `Ping exitoso con los servidores de ${configuringIntegration.name} (200 OK).`,
                  })
                }}
              >
                Probar conexión
              </Button>
              <Button
                onClick={() => {
                  onToast({
                    title: "Configuración guardada",
                    detail: `Se han actualizado los parámetros de ${configuringIntegration.name}.`,
                  })
                  setConfiguringIntegration(null)
                }}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

function AdminApp({
  onSwitch,
  toast,
  setToast,
  plots,
  alerts,
  resolutions,
  devices,
  users,
  rules,
  notifications,
  assistanceRequests,
  reports,
  integrations,
  automation,
  onToggleAutomation,
  securityLimits,
  onUpdateSecurityLimits,
  onAddPlot,
  onUpdatePlot,
  onDeletePlot,
  onTriggerIrrigation,
  onAddDevice,
  onPingDevice,
  onCalibrateDevice,
  onDeleteDevice,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onGenerateReport,
  onToggleIntegration,
  onAddAssistanceRequest,
  onResolveAssistanceRequest,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onRefreshTelemetry,
}: {
  onSwitch: () => void
  toast: ToastState
  setToast: (toast: ToastState) => void
  plots: Plot[]
  alerts: AlertItem[]
  resolutions: Record<string, Resolution>
  devices: DeviceItem[]
  users: UserItem[]
  rules: RuleItem[]
  notifications: SystemNotification[]
  assistanceRequests: AssistanceRequest[]
  reports: ReportItem[]
  integrations: IntegrationItem[]
  automation: boolean
  onToggleAutomation: () => void
  securityLimits: SecurityLimits
  onUpdateSecurityLimits: (limits: SecurityLimits) => void
  onAddPlot: (plot: Omit<Plot, "id" | "trend">) => void
  onUpdatePlot: (id: string, updates: Partial<Plot>) => void
  onDeletePlot: (id: string) => void
  onTriggerIrrigation: (plotId: string, duration: number) => void
  onAddDevice: (dev: Omit<DeviceItem, "id"> & { id?: string }) => void
  onPingDevice: (id: string) => void
  onCalibrateDevice: (id: string, offset: number) => void
  onDeleteDevice: (id: string) => void
  onAddUser: (user: Omit<UserItem, "id" | "initials">) => void
  onUpdateUser: (id: string, updates: Partial<UserItem>) => void
  onDeleteUser: (id: string) => void
  onAddRule: (rule: Omit<RuleItem, "id" | "triggered">) => void
  onToggleRule: (id: string) => void
  onDeleteRule: (id: string) => void
  onGenerateReport: (rep: Omit<ReportItem, "id" | "size" | "date">) => void
  onToggleIntegration: (id: string) => void
  onAddAssistanceRequest: (
    req: Omit<AssistanceRequest, "id" | "date" | "status">,
  ) => void
  onResolveAssistanceRequest: (id: string) => void
  onMarkNotificationRead: (id: string) => void
  onMarkAllNotificationsRead: () => void
  onRefreshTelemetry: () => void
}) {
  const [view, setView] = useState<AdminView>("overview")
  const [menuOpen, setMenuOpen] = useState(false)
  const [campaign, setCampaign] = useState("Campaña 2025")
  const [targetPlotId, setTargetPlotId] = useState<string | undefined>(
    undefined,
  )

  const handleSelectNav = (newView: AdminView, targetId?: string) => {
    setView(newView)
    if (targetId) setTargetPlotId(targetId)
  }

  return (
    <div className="admin-app">
      <AdminSidebar
        view={view}
        onChange={setView}
        onSwitch={onSwitch}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        devicesCount={devices.filter((d) => d.status !== "Conectado").length}
        onToast={setToast}
      />
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <div className="admin-main">
        <AdminTopbar
          view={view}
          onMenu={() => setMenuOpen(true)}
          plots={plots}
          devices={devices}
          users={users}
          rules={rules}
          notifications={notifications}
          onSelectNav={handleSelectNav}
          campaign={campaign}
          onChangeCampaign={setCampaign}
          onMarkNotificationRead={onMarkNotificationRead}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
        />
        <main>
          {view === "overview" && (
            <Overview
              plots={plots}
              alerts={alerts}
              resolutions={resolutions}
              devices={devices}
              onNavigateFarms={(id) => {
                setTargetPlotId(id)
                setView("farms")
              }}
              onToast={setToast}
              onRefreshTelemetry={onRefreshTelemetry}
            />
          )}
          {view === "farms" && (
            <FarmsView
              plots={plots}
              selectedPlotId={targetPlotId}
              onSelectPlot={(id) => setTargetPlotId(id)}
              onAddPlot={onAddPlot}
              onUpdatePlot={onUpdatePlot}
              onDeletePlot={onDeletePlot}
              onTriggerIrrigation={onTriggerIrrigation}
              onToast={setToast}
            />
          )}
          {view === "users" && (
            <UsersView
              users={users}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              onToast={setToast}
            />
          )}
          {view === "devices" && (
            <DevicesView
              devices={devices}
              plots={plots}
              onAddDevice={onAddDevice}
              onPingDevice={onPingDevice}
              onCalibrateDevice={onCalibrateDevice}
              onDeleteDevice={onDeleteDevice}
              onToast={setToast}
            />
          )}
          {view === "rules" && (
            <RulesView
              rules={rules}
              onAddRule={onAddRule}
              onToggleRule={onToggleRule}
              onDeleteRule={onDeleteRule}
              automation={automation}
              onToggleAutomation={onToggleAutomation}
              securityLimits={securityLimits}
              onUpdateSecurityLimits={onUpdateSecurityLimits}
              onToast={setToast}
            />
          )}
          {view === "analytics" && <AnalyticsView onToast={setToast} />}
          {view === "reports" && (
            <ReportsView
              reports={reports}
              onGenerateReport={onGenerateReport}
              onToast={setToast}
            />
          )}
          {view === "integrations" && (
            <IntegrationsView
              integrations={integrations}
              assistanceRequests={assistanceRequests}
              onToggleIntegration={onToggleIntegration}
              onAddAssistanceRequest={onAddAssistanceRequest}
              onResolveAssistanceRequest={onResolveAssistanceRequest}
              onToast={setToast}
            />
          )}
        </main>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

/* =========================================================================
   ROOT APP COMPONENT WITH STATE & STORAGE SYNC
   ========================================================================= */

export default function App() {
  const [experience, setExperience] = useState<Experience>(() =>
    readStored("verdant-experience", "field"),
  )
  const [online, setOnlineState] = useState(() =>
    readStored("verdant-online", true),
  )

  // Persistent Domain States
  const [plots, setPlots] = useState<Plot[]>(() =>
    readStored("verdant-plots", initialPlots),
  )
  const [alerts, setAlerts] = useState<AlertItem[]>(() =>
    readStored("verdant-alerts", initialAlerts),
  )
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>(
    () => readStored("verdant-resolutions", {}),
  )
  const [devices, setDevices] = useState<DeviceItem[]>(() =>
    readStored("verdant-devices", initialDevices),
  )
  const [users, setUsers] = useState<UserItem[]>(() =>
    readStored("verdant-users", initialUsers),
  )
  const [rules, setRules] = useState<RuleItem[]>(() =>
    readStored("verdant-rules", initialRules),
  )
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    readStored("verdant-tickets", initialTickets),
  )
  const [assistanceRequests, setAssistanceRequests] =
    useState<AssistanceRequest[]>(() =>
      readStored("verdant-assistance", initialAssistanceRequests),
    )
  const [reports, setReports] = useState<ReportItem[]>(() =>
    readStored("verdant-reports", initialReports),
  )
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(() =>
    readStored("verdant-integrations", initialIntegrations),
  )
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    readStored("verdant-notifications", initialNotifications),
  )
  const [automation, setAutomation] = useState<boolean>(() =>
    readStored("verdant-automation", false),
  )
  const [securityLimits, setSecurityLimits] = useState<SecurityLimits>(() =>
    readStored("verdant-security-limits", {
      maxTimePerSector: 45,
      minPauseHours: 4,
      maxFlowRate: 8.2,
    }),
  )

  const [toast, setToast] = useState<ToastState>(null)

  // LocalStorage synchronizers
  useEffect(() => {
    window.localStorage.setItem(
      "verdant-experience",
      JSON.stringify(experience),
    )
  }, [experience])
  useEffect(() => {
    window.localStorage.setItem("verdant-online", JSON.stringify(online))
  }, [online])
  useEffect(() => {
    window.localStorage.setItem("verdant-plots", JSON.stringify(plots))
  }, [plots])
  useEffect(() => {
    window.localStorage.setItem("verdant-alerts", JSON.stringify(alerts))
  }, [alerts])
  useEffect(() => {
    window.localStorage.setItem(
      "verdant-resolutions",
      JSON.stringify(resolutions),
    )
  }, [resolutions])
  useEffect(() => {
    window.localStorage.setItem("verdant-devices", JSON.stringify(devices))
  }, [devices])
  useEffect(() => {
    window.localStorage.setItem("verdant-users", JSON.stringify(users))
  }, [users])
  useEffect(() => {
    window.localStorage.setItem("verdant-rules", JSON.stringify(rules))
  }, [rules])
  useEffect(() => {
    window.localStorage.setItem("verdant-tickets", JSON.stringify(tickets))
  }, [tickets])
  useEffect(() => {
    window.localStorage.setItem(
      "verdant-assistance",
      JSON.stringify(assistanceRequests),
    )
  }, [assistanceRequests])
  useEffect(() => {
    window.localStorage.setItem("verdant-reports", JSON.stringify(reports))
  }, [reports])
  useEffect(() => {
    window.localStorage.setItem(
      "verdant-integrations",
      JSON.stringify(integrations),
    )
  }, [integrations])
  useEffect(() => {
    window.localStorage.setItem(
      "verdant-notifications",
      JSON.stringify(notifications),
    )
  }, [notifications])
  useEffect(() => {
    window.localStorage.setItem(
      "verdant-automation",
      JSON.stringify(automation),
    )
  }, [automation])
  useEffect(() => {
    window.localStorage.setItem(
      "verdant-security-limits",
      JSON.stringify(securityLimits),
    )
  }, [securityLimits])

  // Connectivity toggle
  const setOnline = (value: boolean) => {
    setOnlineState(value)
    if (value) {
      const unsynced = Object.values(resolutions).filter(
        (item) => !item.synced,
      ).length
      if (unsynced) {
        setResolutions((items) =>
          Object.fromEntries(
            Object.entries(items).map(([id, resolution]) => [
              id,
              { ...resolution, synced: true },
            ]),
          ),
        )
        setToast({
          title: "Cambios sincronizados",
          detail: `${unsynced} actuaciones enviadas correctamente.`,
        })
      } else {
        setToast({
          title: "Conexión recuperada",
          detail: "Todos los datos están sincronizados.",
        })
      }
    } else {
      setToast({
        title: "Modo sin conexión activado",
        detail: "Puedes seguir trabajando con normalidad.",
      })
    }
  }

  // Resolve Alert action
  const resolveAlert = (
    alert: AlertItem,
    status: "accepted" | "rejected",
    reason?: string,
    note?: string,
  ) => {
    setResolutions((items) => ({
      ...items,
      [alert.id]: { status, reason, note, synced: online, date: "Ahora" },
    }))

    // If accepted and is Riego, improve the plot moisture and trend!
    if (status === "accepted" && alert.category === "Riego") {
      setPlots((currentPlots) =>
        currentPlots.map((p) => {
          if (p.id === alert.plotId) {
            const newMoisture = Math.min(65, p.moisture + 14)
            return {
              ...p,
              moisture: newMoisture,
              stress: newMoisture > 34 ? "success" : "warning",
              trend: [...p.trend.slice(1), newMoisture],
            }
          }
          return p
        }),
      )
    }

    setToast({
      title:
        status === "accepted"
          ? "Actuación aceptada"
          : "Recomendación rechazada",
      detail: online
        ? "La trazabilidad y los sensores se han actualizado."
        : "El cambio se sincronizará al recuperar cobertura.",
    })
  }

  // Plot CRUD Actions
  const addPlot = (newPlot: Omit<Plot, "id" | "trend">) => {
    const id = `p${plots.length + 1}`
    const baseMoisture = newPlot.moisture || 44
    const newEntry: Plot = {
      ...newPlot,
      id,
      trend: [
        baseMoisture - 3,
        baseMoisture - 1,
        baseMoisture + 2,
        baseMoisture,
        baseMoisture + 1,
        baseMoisture - 2,
        baseMoisture,
      ],
    }
    setPlots((items) => [...items, newEntry])
    setToast({
      title: "Parcela creada",
      detail: `${newPlot.name} se ha añadido a ${newPlot.owner}.`,
    })
  }

  const updatePlot = (id: string, updates: Partial<Plot>) => {
    setPlots((items) =>
      items.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    )
    setToast({
      title: "Parcela actualizada",
      detail: "Los cambios se han guardado correctamente.",
    })
  }

  const deletePlot = (id: string) => {
    const target = plots.find((p) => p.id === id)
    setPlots((items) => items.filter((p) => p.id !== id))
    setToast({
      title: "Parcela eliminada",
      detail: `${target?.name || "La parcela"} ha sido retirada del sistema.`,
    })
  }

  const triggerIrrigation = (plotId: string, durationMinutes: number) => {
    setPlots((items) =>
      items.map((p) => {
        if (p.id === plotId) {
          const newMoisture = Math.min(
            68,
            p.moisture + Math.round(durationMinutes * 0.35),
          )
          return {
            ...p,
            moisture: newMoisture,
            stress: "success",
            trend: [...p.trend.slice(1), newMoisture],
          }
        }
        return p
      }),
    )
    setToast({
      title: "Riego ejecutado",
      detail: `Ciclo de ${durationMinutes} min completado. La humedad del suelo ha aumentado.`,
    })
  }

  // Device CRUD Actions
  const addDevice = (newDev: Omit<DeviceItem, "id"> & { id?: string }) => {
    const id = newDev.id || `DEV-${Math.floor(Math.random() * 800 + 100)}`
    setDevices((items) => [{ ...newDev, id }, ...items])
    setToast({
      title: "Dispositivo registrado",
      detail: `${id} vinculado a ${newDev.plot}.`,
    })
  }

  const pingDevice = (id: string) => {
    setDevices((items) =>
      items.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "Conectado",
              signal: Math.floor(Math.random() * 15 + 85),
              last: "hace 1 min",
            }
          : d,
      ),
    )
    setToast({
      title: "Respuesta de sensor",
      detail: `Dispositivo ${id} conectado con señal óptima.`,
    })
  }

  const calibrateDevice = (id: string, offset: number) => {
    setDevices((items) =>
      items.map((d) => (d.id === id ? { ...d, calibrationOffset: offset } : d)),
    )
    setToast({
      title: "Sensor calibrado",
      detail: `Offset de ${
        offset > 0 ? `+${offset}` : offset
      }% aplicado a ${id}.`,
    })
  }

  const deleteDevice = (id: string) => {
    setDevices((items) => items.filter((d) => d.id !== id))
    setToast({
      title: "Dispositivo eliminado",
      detail: `El sensor ${id} se ha dado de baja de la red.`,
    })
  }

  // User CRUD Actions
  const addUser = (newUser: Omit<UserItem, "id" | "initials">) => {
    const id = `u${users.length + 1}`
    const initials = newUser.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    setUsers((items) => [...items, { ...newUser, id, initials }])
    setToast({
      title: "Usuario añadido",
      detail: `Se ha invitado a ${newUser.name} como ${newUser.role}.`,
    })
  }

  const updateUser = (id: string, updates: Partial<UserItem>) => {
    setUsers((items) =>
      items.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    )
    setToast({
      title: "Usuario actualizado",
      detail: "Permisos y explotación actualizados.",
    })
  }

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id)
    setUsers((items) => items.filter((u) => u.id !== id))
    setToast({
      title: "Usuario eliminado",
      detail: `${target?.name || "El usuario"} ha sido retirado.`,
    })
  }

  // Rules Actions
  const addRule = (newRule: Omit<RuleItem, "id" | "triggered">) => {
    const id = `r${rules.length + 1}`
    setRules((items) => [
      ...items,
      { ...newRule, id, triggered: "Recién creada" },
    ])
    setToast({
      title: "Regla creada",
      detail: `'${newRule.name}' ya está activa en el motor agronómico.`,
    })
  }

  const toggleRule = (id: string) => {
    setRules((items) =>
      items.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    )
  }

  const deleteRule = (id: string) => {
    setRules((items) => items.filter((r) => r.id !== id))
    setToast({
      title: "Regla eliminada",
      detail: "La regla se ha desinstalado del sistema.",
    })
  }

  const toggleAutomation = () => {
    const nextState = !automation
    setAutomation(nextState)
    setToast({
      title: nextState ? "Automatización autorizada" : "Automatización pausada",
      detail: nextState
        ? "Las reglas críticas podrán dosificar riegos dentro de los límites de seguridad."
        : "Las actuaciones volverán a requerir aprobación humana.",
    })
  }

  // Support & Assistance Actions
  const addTicket = (
    newTicket: Omit<SupportTicket, "id" | "date" | "status">,
  ) => {
    const id = `VV-${1042 + tickets.length}`
    setTickets((items) => [
      {
        ...newTicket,
        id,
        date: "Hoy",
        status: online ? "Abierto" : "Pendiente de envío",
      },
      ...items,
    ])
  }

  const addAssistanceRequest = (
    req: Omit<AssistanceRequest, "id" | "date" | "status">,
  ) => {
    const id = `ast-${assistanceRequests.length + 1}`
    setAssistanceRequests((items) => [
      {
        ...req,
        id,
        date: "Hoy",
        status: "En curso",
      },
      ...items,
    ])
  }

  const resolveAssistanceRequest = (id: string) => {
    setAssistanceRequests((items) =>
      items.map((r) => (r.id === id ? { ...r, status: "Resuelta" } : r)),
    )
    setToast({
      title: "Incidencia resuelta",
      detail: "La solicitud de asistencia externa ha concluido.",
    })
  }

  // Reports Actions
  const generateReport = (rep: Omit<ReportItem, "id" | "size" | "date">) => {
    const id = `rep-${reports.length + 1}`
    const size = rep.format === "PDF" ? "2,7 MB" : "940 KB"
    setReports((items) => [
      {
        ...rep,
        id,
        size,
        date: "Hoy",
      },
      ...items,
    ])
  }

  // Integrations Actions
  const toggleIntegration = (id: string) => {
    setIntegrations((items) =>
      items.map((i) => {
        if (i.id === id) {
          const nextStatus = i.status === "Conectado" ? "Pausado" : "Conectado"
          setToast({
            title: `${i.name}: ${nextStatus}`,
            detail: `El flujo de sincronización se ha ${nextStatus.toLowerCase()}.`,
          })
          return { ...i, status: nextStatus }
        }
        return i
      }),
    )
  }

  // Notifications Actions
  const markNotificationRead = (id: string) => {
    setNotifications((items) =>
      items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const markAllNotificationsRead = () => {
    setNotifications((items) => items.map((n) => ({ ...n, read: true })))
    setToast({
      title: "Avisos actualizados",
      detail: "Todos los avisos marcados como leídos.",
    })
  }

  // Telemetry Refresh Simulation
  const refreshTelemetry = () => {
    setPlots((items) =>
      items.map((p) => {
        const delta = Math.floor(Math.random() * 3) - 1
        const newMoisture = Math.max(20, Math.min(80, p.moisture + delta))
        return {
          ...p,
          moisture: newMoisture,
          trend: [...p.trend.slice(1), newMoisture],
        }
      }),
    )
    setDevices((items) =>
      items.map((d) => ({
        ...d,
        last: "hace 1 min",
      })),
    )
    setToast({
      title: "Telemetría sincronizada",
      detail:
        "Lecturas en directo actualizadas desde todas las sondas de campo.",
    })
  }

  return experience === "field" ? (
    <FieldApp
      online={online}
      setOnline={setOnline}
      plots={plots}
      alerts={alerts}
      resolutions={resolutions}
      onResolve={resolveAlert}
      onSwitch={() => setExperience("admin")}
      toast={toast}
      setToast={setToast}
      tickets={tickets}
      onAddTicket={addTicket}
    />
  ) : (
    <AdminApp
      onSwitch={() => setExperience("field")}
      toast={toast}
      setToast={setToast}
      plots={plots}
      alerts={alerts}
      resolutions={resolutions}
      devices={devices}
      users={users}
      rules={rules}
      notifications={notifications}
      assistanceRequests={assistanceRequests}
      reports={reports}
      integrations={integrations}
      automation={automation}
      onToggleAutomation={toggleAutomation}
      securityLimits={securityLimits}
      onUpdateSecurityLimits={setSecurityLimits}
      onAddPlot={addPlot}
      onUpdatePlot={updatePlot}
      onDeletePlot={deletePlot}
      onTriggerIrrigation={triggerIrrigation}
      onAddDevice={addDevice}
      onPingDevice={pingDevice}
      onCalibrateDevice={calibrateDevice}
      onDeleteDevice={deleteDevice}
      onAddUser={addUser}
      onUpdateUser={updateUser}
      onDeleteUser={deleteUser}
      onAddRule={addRule}
      onToggleRule={toggleRule}
      onDeleteRule={deleteRule}
      onGenerateReport={generateReport}
      onToggleIntegration={toggleIntegration}
      onAddAssistanceRequest={addAssistanceRequest}
      onResolveAssistanceRequest={resolveAssistanceRequest}
      onMarkNotificationRead={markNotificationRead}
      onMarkAllNotificationsRead={markAllNotificationsRead}
      onRefreshTelemetry={refreshTelemetry}
    />
  )
}
