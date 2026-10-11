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
  Droplets,
  FileBarChart,
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
  alerts,
  devices,
  plots,
  rules as initialRules,
  users,
  type AlertItem,
  type Severity,
} from "./data"

type Experience = "field" | "admin"
type FieldView = "home" | "alerts" | "actions" | "support"
type AdminView = "overview" | "farms" | "users" | "devices" | "rules" | "analytics" | "reports" | "integrations"
type Resolution = {
  status: "accepted" | "rejected"
  reason?: string
  synced: boolean
  date: string
}
type ToastState = { title: string; detail?: string } | null

const severityLabels: Record<Severity, string> = {
  critical: "Crítica",
  warning: "Atención",
  info: "Informativa",
  success: "Estable",
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
    const timer = window.setTimeout(onClose, 3400)
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
}: {
  current: FieldView
  onChange: (view: FieldView) => void
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
              {item.id === "alerts" && <i />}
            </span>
            {item.label}
          </Button>
        )
      })}
    </nav>
  )
}

function FieldHome({
  onViewAlert,
}: {
  onViewAlert: (alert: AlertItem) => void
}) {
  const [selectedId, setSelectedId] = useState("p1")
  const [period, setPeriod] = useState("7 días")
  const selected = plots.find((plot) => plot.id === selectedId) ?? plots[0]
  return (
    <div className="field-page">
      <div className="field-welcome">
        <div>
          <span className="eyebrow">MIÉRCOLES, 14 DE MAYO</span>
          <div className="display-title">Buenos días, Antonio</div>
          <p>Tu finca requiere atención en una parcela.</p>
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
          <small>Actualizado hace 3 min</small>
        </div>
        <Select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          aria-label="Seleccionar parcela"
        >
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>
              {plot.name}
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
          <div className="metric-value">3</div>
          <div className="metric-foot warning">1 prioritaria</div>
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
      <div className="priority-action">
        <div className="priority-top">
          <Badge tone="critical">
            <AlertTriangle size={13} /> PRIORIDAD ALTA
          </Badge>
          <span>Hace 18 min</span>
        </div>
        <div className="priority-body">
          <div className="priority-icon">
            <Droplets size={24} />
          </div>
          <div>
            <strong>Estrés hídrico en Loma Alta</strong>
            <span>La humedad lleva 6 h por debajo del umbral recomendado.</span>
          </div>
        </div>
        <Button onClick={() => onViewAlert(alerts[0])}>
          Revisar recomendación <ArrowRight size={17} />
        </Button>
      </div>
      <div className="field-section-heading compact-heading">
        <div>
          <span className="section-title">Tus parcelas</span>
          <small>4 parcelas · 22,2 ha</small>
        </div>
      </div>
      <div className="plot-list">
        {plots.map((plot) => (
          <Button
            key={plot.id}
            variant="ghost"
            className={`plot-row ${selectedId === plot.id ? "selected" : ""}`}
            onClick={() => setSelectedId(plot.id)}
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
  onSelect,
  resolutions,
}: {
  onSelect: (alert: AlertItem) => void
  resolutions: Record<string, Resolution>
}) {
  const [filter, setFilter] = useState("Todas")
  const visible = alerts.filter(
    (alert) =>
      filter === "Todas" ||
      (filter === "Críticas"
        ? alert.severity === "critical"
        : alert.category === "Labor"),
  )
  return (
    <div className="field-page">
      <div className="mobile-page-title">
        <div>
          <span className="display-title">Alertas y recomendaciones</span>
          <p>Actúa a tiempo sobre tus cultivos.</p>
        </div>
        <Button variant="secondary" className="icon-button">
          <Filter size={18} />
        </Button>
      </div>
      <div className="alert-summary">
        <div>
          <span className="summary-dot critical" />
          <strong>1</strong>
          <small>Crítica</small>
        </div>
        <div>
          <span className="summary-dot warning" />
          <strong>2</strong>
          <small>Atención</small>
        </div>
        <div>
          <span className="summary-dot info" />
          <strong>1</strong>
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
    </div>
  )
}

function ActionsView({
  resolutions,
  onOpen,
}: {
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
                        } por Antonio · ${resolution.date}`
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
  onToast,
}: {
  online: boolean
  onToast: (toast: ToastState) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [tickets, setTickets] = useState([
    {
      id: "VV-1042",
      subject: "Lecturas irregulares sonda",
      status: "En revisión",
      date: "12 may",
    },
  ])
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setTickets((items) => [
      {
        id: `VV-${1042 + items.length}`,
        subject: "Nueva consulta de campo",
        status: online ? "Abierto" : "Pendiente de envío",
        date: "Ahora",
      },
      ...items,
    ])
    setShowForm(false)
    onToast({
      title: online ? "Ticket creado" : "Ticket guardado sin conexión",
      detail: online
        ? "El equipo de soporte ya puede revisarlo."
        : "Se enviará al recuperar cobertura.",
    })
  }
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
        <Button variant="secondary">
          <CircleHelp size={21} />
          <span>
            <strong>Guías rápidas</strong>
            <small>Riego, sensores y alertas</small>
          </span>
          <ChevronRight size={18} />
        </Button>
        <Button variant="secondary">
          <Radio size={21} />
          <span>
            <strong>Estado del servicio</strong>
            <small>Todos los sistemas operativos</small>
          </span>
          <span className="status-light" />
        </Button>
      </div>
      <div className="field-section-heading compact-heading">
        <div>
          <span className="section-title">Mis tickets</span>
          <small>{tickets.length} consultas recientes</small>
        </div>
      </div>
      <div className="ticket-list">
        {tickets.map((ticket) => (
          <div className="ticket-row" key={ticket.id}>
            <div>
              <strong>{ticket.subject}</strong>
              <span>
                {ticket.id} · {ticket.date}
              </span>
            </div>
            <Badge
              tone={ticket.status === "Pendiente de envío" ? "offline" : "info"}
            >
              {ticket.status}
            </Badge>
          </div>
        ))}
      </div>
      <div className="faq-block">
        <span className="section-title">Preguntas frecuentes</span>
        {[
          "¿Cómo calibro una sonda de humedad?",
          "¿Qué ocurre con mis datos sin cobertura?",
          "¿Cómo cambio de parcela?",
        ].map((item) => (
          <Button key={item} variant="ghost">
            {item}
            <ChevronRight size={17} />
          </Button>
        ))}
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
              <Select required>
                <option>Dispositivo o sensor</option>
                <option>Riego</option>
                <option>Uso de la aplicación</option>
              </Select>
            </label>
            <label>
              Asunto
              <Input required placeholder="Ej. Sonda sin lecturas" />
            </label>
            <label>
              Descripción
              <Textarea
                required
                rows={4}
                placeholder="Cuéntanos qué está ocurriendo…"
              />
            </label>
            <Button type="submit" className="full-button">
              {online ? "Enviar ticket" : "Guardar para enviar después"}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

function AlertDetail({
  alert,
  onClose,
  onResolve,
}: {
  alert: AlertItem
  onClose: () => void
  onResolve: (status: "accepted" | "rejected", reason?: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
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
          <Button variant="ghost" className="icon-button">
            <MoreHorizontal />
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
            perfil agronómico de la parcela y la previsión local.
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
          <div className="detail-actions">
            <Button onClick={() => onResolve("accepted")}>
              <Check size={18} /> Aceptar actuación
            </Button>
            <Button variant="secondary" onClick={() => setRejecting(true)}>
              <X size={18} /> Rechazar
            </Button>
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
            />
            <div>
              <Button variant="ghost" onClick={() => setRejecting(false)}>
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={() => onResolve("rejected", reason)}
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
  resolutions,
  onResolve,
  onSwitch,
  toast,
  setToast,
}: {
  online: boolean
  setOnline: (online: boolean) => void
  resolutions: Record<string, Resolution>
  onResolve: (
    alert: AlertItem,
    status: "accepted" | "rejected",
    reason?: string,
  ) => void
  onSwitch: () => void
  toast: ToastState
  setToast: (toast: ToastState) => void
}) {
  const [view, setView] = useState<FieldView>("home")
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)
  const pending = Object.values(resolutions).filter(
    (item) => !item.synced,
  ).length
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
          {view === "home" && <FieldHome onViewAlert={setSelectedAlert} />}
          {view === "alerts" && (
            <AlertList onSelect={setSelectedAlert} resolutions={resolutions} />
          )}
          {view === "actions" && (
            <ActionsView resolutions={resolutions} onOpen={setSelectedAlert} />
          )}
          {view === "support" && (
            <SupportView online={online} onToast={setToast} />
          )}
        </main>
        <FieldNav current={view} onChange={setView} />
      </div>
      {selectedAlert && (
        <AlertDetail
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={(status, reason) => {
            onResolve(selectedAlert, status, reason)
            setSelectedAlert(null)
            setView("actions")
          }}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

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
}: {
  view: AdminView
  onChange: (view: AdminView) => void
  onSwitch: () => void
  open: boolean
  onClose: () => void
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
      <div className="org-selector">
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
                  {item.id === "devices" && <i>2</i>}
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
        <div className="sidebar-user">
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

function AdminTopbar({ view, onMenu }: { view: AdminView; onMenu: () => void }) {
  const name = adminNav
    .flatMap((group) => group.items)
    .find((item) => item.id === view)?.label
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
      <div className="topbar-actions">
        <div className="admin-search">
          <Search size={17} />
          <Input placeholder="Buscar parcelas, sensores…" />
        </div>
        <Button variant="secondary" className="period-button">
          <span>Campaña 2025</span>
          <ChevronDown size={15} />
        </Button>
        <Button variant="ghost" className="icon-button has-indicator">
          <Bell size={19} />
          <i />
        </Button>
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
}: {
  mode: string
  selected: string
  onSelect: (id: string) => void
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
      <svg viewBox="0 0 490 400" aria-label="Mapa esquemático de parcelas">
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
          const plot = plots.find((item) => item.id === position.id)!
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
      <div className="map-zoom">
        <Button variant="ghost">+</Button>
        <Button variant="ghost">−</Button>
      </div>
    </div>
  )
}

function Overview() {
  const [mode, setMode] = useState("stress")
  const [selectedId, setSelectedId] = useState("p3")
  const selected = plots.find((plot) => plot.id === selectedId)!
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
          <Button variant="secondary">
            <RefreshCw size={16} /> Actualizar
          </Button>
        </div>
      </div>
      <div className="kpi-grid">
        <KpiCard
          icon={<Map />}
          label="SUPERFICIE MONITORIZADA"
          value="22,2 ha"
          delta="+3,7 ha esta campaña"
        />
        <KpiCard
          icon={<AlertTriangle />}
          label="ALERTAS ACTIVAS"
          value="4"
          delta="1 requiere atención"
          tone="amber"
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
          value="18/20"
          delta="90% de conectividad"
          tone="purple"
        />
      </div>
      <div className="twin-grid">
        <div className="admin-panel map-panel">
          <div className="admin-panel-heading">
            <div>
              <strong>Gemelo digital · El Manantial</strong>
              <span>Última actualización hace 3 minutos</span>
            </div>
            <Select>
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
            <Button variant="secondary" className="icon-button">
              <Layers3 size={17} />
            </Button>
          </div>
          <FarmMap mode={mode} selected={selectedId} onSelect={setSelectedId} />
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
          <div className="inspector-alert">
            <div>
              <AlertTriangle size={17} />
              <strong>1 alerta activa</strong>
              <span>Estrés hídrico detectado en sector 3</span>
            </div>
            <ChevronRight size={18} />
          </div>
          <Button className="full-button">
            Ver detalle de parcela <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <div className="bottom-grid">
        <div className="admin-panel recent-alerts">
          <div className="admin-panel-heading">
            <div>
              <strong>Alertas recientes</strong>
              <span>Priorizadas por impacto</span>
            </div>
            <Button variant="ghost">
              Ver todas <ArrowRight size={15} />
            </Button>
          </div>
          {alerts.slice(0, 3).map((alert) => (
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
              <Badge tone={alert.severity}>
                {severityLabels[alert.severity]}
              </Badge>
              <ChevronRight size={17} />
            </div>
          ))}
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

function FarmsView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [selected, setSelected] = useState("p1")
  const plot = plots.find((item) => item.id === selected)!
  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Explotaciones y especialización"
        subtitle="Estructura, perfiles agronómicos y configuración de parcelas."
        action={
          <Button
            onClick={() =>
              onToast({
                title: "Explotación preparada",
                detail: "El formulario de alta se ha abierto en modo demo.",
              })
            }
          >
            <Plus size={17} /> Nueva explotación
          </Button>
        }
      />
      <div className="management-grid">
        <div className="admin-panel tree-panel">
          <div className="admin-panel-heading">
            <div>
              <strong>Estructura organizativa</strong>
              <span>2 explotaciones · 4 parcelas</span>
            </div>
            <Search size={18} />
          </div>
          <div className="tree">
            <div className="tree-root">
              <ChevronDown />
              <div className="tree-icon coop">VV</div>
              <div>
                <strong>Cooperativa Valle Verde</strong>
                <span>22,2 ha monitorizadas</span>
              </div>
            </div>
            {["Finca El Manantial", "Cortijo del Sol"].map((farm) => (
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
                        onClick={() => setSelected(item.id)}
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
        <div className="admin-panel detail-panel">
          <div className="detail-cover">
            <div className="contour-lines" />
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
              <strong>Goteo sectorizado</strong>
            </div>
            <div>
              <span>RESPONSABLE</span>
              <strong>Miguel Torres</strong>
            </div>
          </div>
          <div className="profile-card">
            <div className="profile-icon">
              <Leaf />
            </div>
            <div>
              <span>PERFIL AGRONÓMICO ACTIVO</span>
              <strong>{plot.crop} mediterráneo · v2.4</strong>
              <p>
                Umbrales y reglas adaptadas a suelo franco-arenoso y riego
                localizado.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                onToast({
                  title: "Perfil actualizado",
                  detail: `Se ha asignado el perfil de ${plot.crop}.`,
                })
              }
            >
              Cambiar perfil
            </Button>
          </div>
          <div className="rules-summary">
            <div>
              <strong>Reglas especializadas</strong>
              <span>6 reglas activas para este cultivo</span>
            </div>
            {[
              "Humedad óptima de suelo",
              "Riesgo fitosanitario",
              "Curva de crecimiento",
            ].map((item, index) => (
              <div key={item}>
                <CheckCircle2 />
                <span>{item}</span>
                <strong>
                  {index === 0
                    ? "38–62%"
                    : index === 1
                      ? "Modelo activo"
                      : "En objetivo"}
                </strong>
              </div>
            ))}
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

function UsersView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [query, setQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const filtered = users.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.role.toLowerCase().includes(query.toLowerCase()),
  )
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
          ["24", "Usuarios activos", UsersRound],
          ["4", "Roles configurados", ShieldCheck],
          ["2", "Invitaciones pendientes", Bell],
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
              placeholder="Buscar por nombre o rol…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button variant="secondary">
            <Filter size={16} /> Todos los roles
          </Button>
          <Button variant="secondary">
            <SlidersHorizontal size={16} /> Filtros
          </Button>
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
            <div className="table-row" key={user.name}>
              <div className="person-cell">
                <div>{user.initials}</div>
                <span>
                  <strong>{user.name}</strong>
                  <small>
                    {user.name.toLowerCase().replace(" ", ".")}@valleverde.es
                  </small>
                </span>
              </div>
              <span>{user.role}</span>
              <span>{user.farm}</span>
              <span>
                <Badge tone={user.status === "Activo" ? "success" : "warning"}>
                  {user.status}
                </Badge>
              </span>
              <Button variant="ghost" className="icon-button">
                <MoreHorizontal />
              </Button>
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
          <label>
            Nombre completo
            <Input placeholder="Nombre y apellidos" />
          </label>
          <label>
            Correo electrónico
            <Input type="email" placeholder="nombre@empresa.es" />
          </label>
          <label>
            Rol
            <Select>
              <option>Responsable agronómico</option>
              <option>Responsable de riego</option>
              <option>Dirección de explotación</option>
              <option>Operario</option>
            </Select>
          </label>
          <label>
            Explotación
            <Select>
              <option>Todas las explotaciones</option>
              <option>Finca El Manantial</option>
              <option>Cortijo del Sol</option>
            </Select>
          </label>
          <div className="modal-footer">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowForm(false)
                onToast({
                  title: "Invitación enviada",
                  detail: "El nuevo usuario recibirá instrucciones por correo.",
                })
              }}
            >
              Enviar invitación
            </Button>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

function DevicesView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [filter, setFilter] = useState("Todos")
  const shown = devices.filter(
    (device) => filter === "Todos" || device.status === filter,
  )
  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Dispositivos IoT"
        subtitle="Conectividad y estado operativo de los sensores de campo."
        action={
          <Button
            onClick={() =>
              onToast({
                title: "Modo de registro activado",
                detail: "Buscando dispositivos cercanos durante 5 minutos.",
              })
            }
          >
            <Plus size={17} /> Registrar dispositivo
          </Button>
        }
      />
      <div className="device-health">
        <div className="health-score">
          <div className="score-ring">
            <strong>90%</strong>
            <span>online</span>
          </div>
          <div>
            <span>SALUD DE LA RED</span>
            <strong>18 de 20 dispositivos conectados</strong>
            <p>
              La red funciona con normalidad. Hay 2 incidencias que requieren
              revisión.
            </p>
          </div>
        </div>
        <div className="health-metrics">
          <div>
            <Wifi />
            <strong>18</strong>
            <span>Conectados</span>
          </div>
          <div>
            <BatteryMedium />
            <strong>1</strong>
            <span>Batería baja</span>
          </div>
          <div>
            <AlertTriangle />
            <strong>1</strong>
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
          <Button variant="secondary">
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
              <Button variant="ghost" className="icon-button">
                <MoreHorizontal />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RulesView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [ruleItems, setRuleItems] = useState(initialRules)
  const [automation, setAutomation] = useState(false)
  const toggle = (id: string) =>
    setRuleItems((items) =>
      items.map((rule) =>
        rule.id === id ? { ...rule, active: !rule.active } : rule,
      ),
    )
  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Reglas y automatización"
        subtitle="Configura umbrales, severidad y respuestas automáticas."
        action={
          <Button
            onClick={() =>
              onToast({
                title: "Nueva regla preparada",
                detail: "Se ha creado un borrador editable.",
              })
            }
          >
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
            onClick={() => {
              setAutomation(!automation)
              onToast({
                title: automation
                  ? "Automatización pausada"
                  : "Automatización autorizada",
                detail: automation
                  ? "Las actuaciones vuelven a requerir aprobación."
                  : "Los límites de seguridad ya están activos.",
              })
            }}
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
              {ruleItems.filter((rule) => rule.active).length} activas de{" "}
              {ruleItems.length}
            </span>
          </div>
          <div>
            <Button variant="secondary">
              <Filter size={16} /> Todos los cultivos
            </Button>
            <Button variant="secondary">
              <Settings2 size={16} /> Gestionar perfiles
            </Button>
          </div>
        </div>
        <div className="rules-list">
          {ruleItems.map((rule) => (
            <div className="rule-row" key={rule.id}>
              <Button
                variant="ghost"
                className={`toggle ${rule.active ? "active" : ""}`}
                onClick={() => toggle(rule.id)}
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
              <Button variant="ghost" className="icon-button">
                <MoreHorizontal />
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
            Máximo 45 min por sector · Pausa mínima 4 h · Caudal máximo 8,2 m³/h
          </span>
        </div>
        <Button variant="ghost">
          Editar límites <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function AnalyticsView() {
  const [crop, setCrop] = useState("Aguacate")
  const values =
    crop === "Aguacate"
      ? [12, 18, 25, 36, 48, 64, 78, 86, 72, 49, 23]
      : [8, 12, 17, 24, 35, 51, 67, 76, 69, 43, 18]
  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Modelos predictivos"
        subtitle="Previsión de rendimiento y ventanas óptimas de recolección."
        action={
          <div className="heading-selects">
            <Select
              value={crop}
              onChange={(event) => setCrop(event.target.value)}
            >
              <option>Aguacate</option>
              <option>Pitaya</option>
            </Select>
            <Button variant="secondary">
              <RefreshCw size={16} /> Recalcular
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
            {crop === "Aguacate" ? "186,4" : "72,8"} <small>toneladas</small>
          </strong>
          <p>
            Intervalo probable: {crop === "Aguacate" ? "174–198 t" : "65–81 t"}{" "}
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
          <strong>24 oct — 18 dic</strong>
          <p>Pico de madurez previsto: 12 de noviembre</p>
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

function ReportsView({ onToast }: { onToast: (toast: ToastState) => void }) {
  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Informes y cumplimiento"
        subtitle="Consumo de recursos, trazabilidad y documentación ambiental."
        action={
          <Button
            onClick={() =>
              onToast({
                title: "Informe generado",
                detail: "El informe de consumo hídrico ya está disponible.",
              })
            }
          >
            <Plus size={17} /> Generar informe
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
        <div className="admin-panel report-builder">
          <div className="admin-panel-heading">
            <div>
              <strong>Generador de informes</strong>
              <span>Configura un nuevo documento</span>
            </div>
            <FileBarChart />
          </div>
          <label>
            Tipo de informe
            <Select>
              <option>Consumo hídrico y eficiencia</option>
              <option>Uso de insumos</option>
              <option>Trazabilidad de actuaciones</option>
              <option>Cumplimiento ambiental</option>
            </Select>
          </label>
          <div className="form-two">
            <label>
              Explotación
              <Select>
                <option>Todas las explotaciones</option>
                <option>Finca El Manantial</option>
              </Select>
            </label>
            <label>
              Periodo
              <Select>
                <option>Campaña 2025</option>
                <option>Último trimestre</option>
              </Select>
            </label>
          </div>
          <div className="compliance-note">
            <ShieldCheck />
            <div>
              <strong>Formato compatible con auditoría</strong>
              <span>
                Incluye metodología, fuentes y trazabilidad de los datos.
              </span>
            </div>
          </div>
          <Button
            className="full-button"
            onClick={() =>
              onToast({
                title: "Generando informe",
                detail: "Recibirás una notificación cuando esté listo.",
              })
            }
          >
            Generar documento <ArrowRight size={16} />
          </Button>
        </div>
        <div className="admin-panel report-history">
          <div className="admin-panel-heading">
            <div>
              <strong>Informes recientes</strong>
              <span>Documentos generados en los últimos 90 días</span>
            </div>
            <Button variant="ghost">Ver archivo</Button>
          </div>
          {[
            ["Consumo hídrico · Abril 2025", "PDF · 2,4 MB", "12 may 2025"],
            ["Trazabilidad de insumos · T1", "XLSX · 846 KB", "03 abr 2025"],
            ["Memoria ambiental · Campaña 2024", "PDF · 4,1 MB", "18 feb 2025"],
            ["Justificación inversión IoT", "PDF · 1,8 MB", "29 ene 2025"],
          ].map(([name, meta, date]) => (
            <div className="report-row" key={name}>
              <div className="file-icon">
                <FileBarChart />
              </div>
              <div>
                <strong>{name}</strong>
                <span>
                  {meta} · {date}
                </span>
              </div>
              <Badge tone="success">Listo</Badge>
              <Button variant="ghost" className="icon-button">
                <ArrowDownRight />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IntegrationsView({
  onToast,
}: {
  onToast: (toast: ToastState) => void
}) {
  const integrations = [
    {
      name: "AEMET Agro",
      category: "Meteorología",
      status: "Conectado",
      icon: CloudSun,
      detail: "Previsión horaria y alertas meteorológicas",
    },
    {
      name: "AgroLab Sur",
      category: "Asesoría agronómica",
      status: "Conectado",
      icon: Sprout,
      detail: "Análisis de suelo y diagnóstico foliar",
    },
    {
      name: "SenseField",
      category: "Hardware IoT",
      status: "Conectado",
      icon: Radio,
      detail: "Catálogo y soporte de sensores",
    },
    {
      name: "Cuaderno Digital",
      category: "Cumplimiento",
      status: "Disponible",
      icon: FileBarChart,
      detail: "Sincronización con cuaderno de campo",
    },
  ]
  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Integraciones y servicios"
        subtitle="Conecta proveedores y coordina asistencia externa."
        action={
          <Button
            onClick={() =>
              onToast({
                title: "Solicitud creada",
                detail: "El proveedor recibirá los detalles de la incidencia.",
              })
            }
          >
            <Plus size={17} /> Solicitar asistencia
          </Button>
        }
      />
      <div className="integration-grid">
        {integrations.map((item) => {
          const Icon = item.icon
          return (
            <div className="integration-card" key={item.name}>
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
              <Button variant="secondary">
                {item.status === "Conectado" ? "Configurar" : "Conectar"}{" "}
                <ArrowRight size={15} />
              </Button>
            </div>
          )
        })}
      </div>
      <div className="admin-panel assistance-panel">
        <div className="admin-panel-heading">
          <div>
            <strong>Solicitudes de asistencia</strong>
            <span>Seguimiento con proveedores externos</span>
          </div>
          <Button variant="ghost">Ver todas</Button>
        </div>
        {[
          [
            "Revisión de caudalímetro CAU-009",
            "SenseField",
            "En curso",
            "Alta",
          ],
          [
            "Análisis de riesgo Phytophthora",
            "AgroLab Sur",
            "Asignada",
            "Media",
          ],
          [
            "Validación de datos meteorológicos",
            "AEMET Agro",
            "Resuelta",
            "Baja",
          ],
        ].map(([name, provider, status, priority]) => (
          <div className="assistance-row" key={name}>
            <div className="service-icon">
              <Headphones />
            </div>
            <div>
              <strong>{name}</strong>
              <span>{provider} · Actualizado hoy</span>
            </div>
            <Badge
              tone={
                priority === "Alta"
                  ? "critical"
                  : priority === "Media"
                    ? "warning"
                    : "neutral"
              }
            >
              {priority}
            </Badge>
            <Badge tone={status === "Resuelta" ? "success" : "info"}>
              {status}
            </Badge>
            <ChevronRight />
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="modal-backdrop admin-modal-backdrop">
      <div className="admin-modal">
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

function AdminApp({
  onSwitch,
  toast,
  setToast,
}: {
  onSwitch: () => void
  toast: ToastState
  setToast: (toast: ToastState) => void
}) {
  const [view, setView] = useState<AdminView>("overview")
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="admin-app">
      <AdminSidebar
        view={view}
        onChange={setView}
        onSwitch={onSwitch}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <div className="admin-main">
        <AdminTopbar view={view} onMenu={() => setMenuOpen(true)} />
        <main>
          {view === "overview" && <Overview />}
          {view === "farms" && <FarmsView onToast={setToast} />}
          {view === "users" && <UsersView onToast={setToast} />}
          {view === "devices" && <DevicesView onToast={setToast} />}
          {view === "rules" && <RulesView onToast={setToast} />}
          {view === "analytics" && <AnalyticsView />}
          {view === "reports" && <ReportsView onToast={setToast} />}
          {view === "integrations" && <IntegrationsView onToast={setToast} />}
        </main>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) as T : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [experience, setExperience] = useState<Experience>(() =>
    readStored("verdant-experience", "field"),
  )
  const [online, setOnlineState] = useState(() =>
    readStored("verdant-online", true),
  )
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>(
    () => readStored("verdant-resolutions", {}),
  )
  const [toast, setToast] = useState<ToastState>(null)

  useEffect(
    () =>
      window.localStorage.setItem(
        "verdant-experience",
        JSON.stringify(experience),
      ),
    [experience],
  )
  useEffect(
    () => window.localStorage.setItem("verdant-online", JSON.stringify(online)),
    [online],
  )
  useEffect(
    () =>
      window.localStorage.setItem(
        "verdant-resolutions",
        JSON.stringify(resolutions),
      ),
    [resolutions],
  )

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

  const resolveAlert = (
    alert: AlertItem,
    status: "accepted" | "rejected",
    reason?: string,
  ) => {
    setResolutions((items) => ({
      ...items,
      [alert.id]: { status, reason, synced: online, date: "Ahora" },
    }))
    setToast({
      title:
        status === "accepted"
          ? "Actuación aceptada"
          : "Recomendación rechazada",
      detail: online
        ? "La trazabilidad se ha actualizado."
        : "El cambio se sincronizará al recuperar cobertura.",
    })
  }

  return experience === "field" ? (
    <FieldApp
      online={online}
      setOnline={setOnline}
      resolutions={resolutions}
      onResolve={resolveAlert}
      onSwitch={() => setExperience("admin")}
      toast={toast}
      setToast={setToast}
    />
  ) : (
    <AdminApp
      onSwitch={() => setExperience("field")}
      toast={toast}
      setToast={setToast}
    />
  )
}
