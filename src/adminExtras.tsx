import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Droplets,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  Lightbulb,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Thermometer,
  TrendingDown,
  X,
} from "lucide-react"
import { useState } from "react"
import type { AlertItem, Plot, SupportTicket } from "./data"
import {
  apiEndpoints,
  type ActuationLog,
  type ErpDataset,
  type Resolution,
} from "./extraData"
import {
  AdminModal,
  AdminPageHeading,
  Badge,
  Button,
  Field,
  Input,
  KpiCard,
  Note,
  Segmented,
  Select,
  TableRow,
  Textarea,
  type ToastState,
} from "./ui"

/* =========================================================================
   Índice de estrés hídrico (OF-15) y ahorro estimado (OF-14)
   Valores de ejemplo calculados a partir de los datos del prototipo.
   ========================================================================= */

export function stressIndex(plot: Plot, index: number) {
  const temperature = 27 + ((index * 3) % 7)
  const humidity = 48 - ((index * 5) % 15)
  const radiation = 620 + ((index * 70) % 240)
  const et0 = 4.1 + ((index * 0.4) % 1.6)
  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        (60 - plot.moisture) * 1.5 +
          (temperature - 24) * 2.2 +
          (55 - humidity) * 0.6 +
          (radiation - 500) * 0.03 +
          et0 * 3,
      ),
    ),
  )
  return { score, temperature, humidity, radiation, et0: et0.toFixed(1) }
}

function stressTone(score: number) {
  return score >= 60 ? "critical" : score >= 35 ? "warning" : "success"
}

function estimatedSaving(alert: AlertItem, plot?: Plot) {
  const area = plot?.area ?? 5
  if (alert.category === "Riego")
    return { value: Math.round(area * 4.6), unit: "m³ de agua" }
  if (alert.category === "Sanidad")
    return { value: Math.round(area * 1.8), unit: "kg de fitosanitario" }
  return { value: Math.round(area * 0.6), unit: "horas de operario" }
}

function recommendationSource(alert: AlertItem) {
  return alert.category === "Riego" || alert.category === "Sanidad"
    ? "Modelo predictivo"
    : "Regla configurada"
}

export function RecommendationsView({
  plots,
  alerts,
  resolutions,
  onResolve,
  onToast,
}: {
  plots: Plot[]
  alerts: AlertItem[]
  resolutions: Record<string, Resolution>
  onResolve: (
    alert: AlertItem,
    status: "accepted" | "rejected",
    reason?: string,
    note?: string,
  ) => void
  onToast: (toast: ToastState) => void
}) {
  const [tab, setTab] = useState<"pending" | "history">("pending")
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState("No aplica")
  const [note, setNote] = useState("")

  const pending = alerts.filter((alert) => !resolutions[alert.id])
  const resolved = alerts.filter((alert) => resolutions[alert.id])
  const accepted = resolved.filter(
    (alert) => resolutions[alert.id].status === "accepted",
  )
  const waterSaved = accepted
    .filter((alert) => alert.category === "Riego")
    .reduce(
      (sum, alert) =>
        sum +
        estimatedSaving(
          alert,
          plots.find((plot) => plot.id === alert.plotId),
        ).value,
      0,
    )

  const plotName = (id: string) =>
    plots.find((plot) => plot.id === id)?.name ?? "Parcela"

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Recomendaciones"
        subtitle="Motor de IA y reglas: motivo de cada recomendación, ahorro estimado y respuesta del usuario."
        action={
          <Badge tone="info">
            <Bot size={13} /> APP-03 Motor de IA
          </Badge>
        }
      />
      <div className="kpi-grid">
        <KpiCard
          icon={<Lightbulb />}
          label="PENDIENTES DE DECISIÓN"
          value={String(pending.length)}
          delta="Requieren aceptación o rechazo"
          tone="amber"
        />
        <KpiCard
          icon={<CheckCircle2 />}
          label="ACEPTADAS"
          value={String(accepted.length)}
          delta={`${resolved.length - accepted.length} rechazadas con motivo`}
        />
        <KpiCard
          icon={<Droplets />}
          label="AGUA AHORRADA (ESTIMADA)"
          value={`${waterSaved} m³`}
          delta="Recomendaciones de riego seguidas"
          tone="blue"
        />
        <KpiCard
          icon={<TrendingDown />}
          label="TASA DE ACEPTACIÓN"
          value={
            resolved.length
              ? `${Math.round((accepted.length / resolved.length) * 100)}%`
              : "—"
          }
          delta="Sirve para reentrenar los modelos"
          tone="purple"
        />
      </div>

      <div className="x-grid-2 x-gap-top">
        <div className="admin-panel x-pad">
          <div className="admin-panel-heading">
            <div>
              <strong>Índice de estrés hídrico por parcela</strong>
              <span>
                Humedad del suelo, temperatura, humedad ambiente, radiación y
                evapotranspiración prevista
              </span>
            </div>
            <Thermometer size={18} />
          </div>
          <div className="stress-list">
            {plots.map((plot, index) => {
              const stress = stressIndex(plot, index)
              const tone = stressTone(stress.score)
              return (
                <div className="stress-row" key={plot.id}>
                  <div className="stress-row-top">
                    <strong>{plot.name}</strong>
                    <span>{plot.crop}</span>
                    <Badge tone={tone}>
                      {stress.score} / 100
                    </Badge>
                  </div>
                  <div className="stress-bar">
                    <i
                      className={tone}
                      style={{ width: `${stress.score}%` }}
                    />
                  </div>
                  <small>
                    Suelo {plot.moisture}% · {stress.temperature} °C · HR{" "}
                    {stress.humidity}% · {stress.radiation} W/m² · ET₀{" "}
                    {stress.et0} mm/día
                  </small>
                </div>
              )
            })}
          </div>
        </div>

        <div className="admin-panel x-pad">
          <div className="admin-panel-heading">
            <div>
              <strong>Bandeja de recomendaciones</strong>
              <span>
                Una recomendación no es una orden de riego: la ejecución pasa
                por el módulo de actuación.
              </span>
            </div>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { id: "pending", label: "Pendientes", count: pending.length },
                { id: "history", label: "Historial", count: resolved.length },
              ]}
            />
          </div>

          {tab === "pending" && (
            <div className="reco-list">
              {pending.length === 0 && (
                <div className="x-empty">
                  <CheckCircle2 size={28} />
                  <strong>No hay recomendaciones pendientes</strong>
                </div>
              )}
              {pending.map((alert) => {
                const plot = plots.find((p) => p.id === alert.plotId)
                const saving = estimatedSaving(alert, plot)
                return (
                  <div className="reco-card" key={alert.id}>
                    <div className="reco-head">
                      <Badge tone={alert.severity}>{alert.category}</Badge>
                      <span>
                        {plotName(alert.plotId)} · {alert.time}
                      </span>
                      <em>{recommendationSource(alert)}</em>
                    </div>
                    <strong>{alert.recommendation}</strong>
                    <div className="reco-why">
                      <Lightbulb size={14} />
                      <p>
                        <b>Por qué:</b> {alert.description} Lectura actual:{" "}
                        {alert.reading}.
                      </p>
                    </div>
                    <div className="reco-saving">
                      <Droplets size={14} /> Ahorro estimado si se sigue:{" "}
                      <b>
                        {saving.value} {saving.unit}
                      </b>
                    </div>
                    {rejectingId === alert.id ? (
                      <div className="reco-reject">
                        <Select
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        >
                          <option>No aplica</option>
                          <option>Ya realizada</option>
                          <option>Condiciones inadecuadas</option>
                          <option>Otro</option>
                        </Select>
                        <Input
                          placeholder="Comentario opcional"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                        <Button
                          variant="danger"
                          onClick={() => {
                            onResolve(alert, "rejected", reason, note)
                            setRejectingId(null)
                            setNote("")
                            onToast({
                              title: "Recomendación rechazada",
                              detail: `Motivo registrado: ${reason}.`,
                            })
                          }}
                        >
                          Confirmar rechazo
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setRejectingId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="reco-actions">
                        <Button
                          onClick={() => {
                            onResolve(alert, "accepted")
                            onToast({
                              title: "Recomendación aceptada",
                              detail:
                                "Se ha registrado tu respuesta y se ha enviado al módulo de actuación.",
                            })
                          }}
                        >
                          <Check size={16} /> Aceptar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setRejectingId(alert.id)
                            setReason("No aplica")
                          }}
                        >
                          <X size={16} /> Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === "history" && (
            <div className="data-table">
              <TableRow columns="1.4fr .8fr .7fr 1fr .6fr" head>
                <span>RECOMENDACIÓN</span>
                <span>PARCELA</span>
                <span>RESPUESTA</span>
                <span>MOTIVO</span>
                <span>SINCRONIZADA</span>
              </TableRow>
              {resolved.map((alert) => {
                const resolution = resolutions[alert.id]
                return (
                  <TableRow columns="1.4fr .8fr .7fr 1fr .6fr" key={alert.id}>
                    <strong>{alert.recommendation}</strong>
                    <span>{plotName(alert.plotId)}</span>
                    <span>
                      <Badge
                        tone={
                          resolution.status === "accepted"
                            ? "success"
                            : "critical"
                        }
                      >
                        {resolution.status === "accepted"
                          ? "Aceptada"
                          : "Rechazada"}
                      </Badge>
                    </span>
                    <span>
                      {resolution.reason ?? "—"}
                      {resolution.note ? ` · ${resolution.note}` : ""}
                    </span>
                    <span>{resolution.synced ? "Sí" : "Pendiente"}</span>
                  </TableRow>
                )
              })}
              {resolved.length === 0 && (
                <div className="x-empty">
                  <strong>Aún no hay respuestas registradas</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Registro de actuaciones (APP-05 · OF-16, OF-40, OF-41)
   ========================================================================= */

export function ActuationsView({
  actuations,
  plots,
  automation,
  onToggleAutomation,
  onManualIrrigation,
}: {
  actuations: ActuationLog[]
  plots: Plot[]
  automation: boolean
  onToggleAutomation: () => void
  onManualIrrigation: (plotId: string, minutes: number) => void
}) {
  const [filter, setFilter] = useState<
    "all" | "Manual" | "Automática" | "issues"
  >("all")
  const [showOrder, setShowOrder] = useState(false)
  const [plotId, setPlotId] = useState(plots[0]?.id ?? "")
  const [minutes, setMinutes] = useState(15)

  const shown = actuations.filter((item) => {
    if (filter === "all") return true
    if (filter === "issues")
      return item.result === "Error de campo" || item.result === "Anulada"
    if (filter === "Automática") return item.origin !== "Manual"
    return item.origin === "Manual"
  })

  const tone = (result: ActuationLog["result"]) =>
    result === "Confirmada"
      ? "success"
      : result === "En curso"
        ? "info"
        : result === "Anulada"
          ? "warning"
          : "critical"

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Registro de actuaciones"
        subtitle="Quién ordenó cada riego, cuándo, con qué origen y qué confirmó el actuador en campo."
        action={
          <Button onClick={() => setShowOrder(true)}>
            <Plus size={17} /> Orden manual de riego
          </Button>
        }
      />

      <div className={`automation-banner ${automation ? "on" : "off"}`}>
        <div>
          {automation ? <PlayCircle /> : <PauseCircle />}
          <span>
            <strong>
              {automation
                ? "Automatización autorizada y en curso"
                : "Automatización suspendida"}
            </strong>
            <small>
              {automation
                ? "Las reglas autorizadas pueden ordenar riegos dentro de los límites de seguridad. Una orden manual autorizada siempre prevalece."
                : "Ninguna regla ejecutará riegos hasta que se vuelva a autorizar. Las recomendaciones siguen llegando."}
            </small>
          </span>
        </div>
        <Button
          variant={automation ? "danger" : "primary"}
          onClick={onToggleAutomation}
        >
          {automation ? "Suspender automatización" : "Reanudar automatización"}
        </Button>
      </div>

      <div className="admin-panel table-panel">
        <div className="table-toolbar">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "Todas", count: actuations.length },
              { id: "Manual", label: "Manuales" },
              { id: "Automática", label: "Automáticas" },
              { id: "issues", label: "Incidencias" },
            ]}
          />
          <Badge tone="neutral">
            <ShieldCheck size={13} /> Registro de auditoría
          </Badge>
        </div>
        <div className="data-table">
          <TableRow columns=".55fr .8fr 1.5fr .8fr 1.2fr .75fr .75fr" head>
            <span>ID</span>
            <span>PARCELA</span>
            <span>ACTUACIÓN</span>
            <span>ORIGEN</span>
            <span>SOLICITADA POR</span>
            <span>FECHA</span>
            <span>RESULTADO</span>
          </TableRow>
          {shown.map((item) => (
            <TableRow
              columns=".55fr .8fr 1.5fr .8fr 1.2fr .75fr .75fr"
              key={item.id}
            >
              <strong>{item.id}</strong>
              <span>{item.plot}</span>
              <span className="x-stack">
                <strong>{item.action}</strong>
                {item.detail && <small>{item.detail}</small>}
              </span>
              <span>{item.origin}</span>
              <span>{item.requestedBy}</span>
              <span>{item.date}</span>
              <span>
                <Badge tone={tone(item.result)}>{item.result}</Badge>
              </span>
            </TableRow>
          ))}
        </div>
      </div>

      {showOrder && (
        <AdminModal
          title="Orden manual de riego"
          subtitle="Solo usuarios con permiso de riego. Se registrará tu nombre, la hora y la confirmación del actuador."
          onClose={() => setShowOrder(false)}
        >
          <form
            className="x-form"
            onSubmit={(e) => {
              e.preventDefault()
              onManualIrrigation(plotId, minutes)
              setShowOrder(false)
            }}
          >
            <Field label="Parcela">
              <Select value={plotId} onChange={(e) => setPlotId(e.target.value)}>
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name} · {plot.crop}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duración (minutos)">
              <Input
                type="number"
                min={5}
                max={90}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </Field>
            {automation && (
              <Note>
                Hay una automatización activa. Esta orden manual tendrá
                prioridad sobre ella mientras dure.
              </Note>
            )}
            <div className="modal-footer">
              <Button variant="ghost" type="button" onClick={() => setShowOrder(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Droplets size={16} /> Enviar orden
              </Button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

/* =========================================================================
   Soporte desde el panel web (APP-10 integrado mediante INT-15)
   ========================================================================= */

export function SupportAdminView({
  tickets,
  onAddTicket,
  onToast,
}: {
  tickets: SupportTicket[]
  onAddTicket: (ticket: Omit<SupportTicket, "id" | "date" | "status">) => void
  onToast: (toast: ToastState) => void
}) {
  const [selectedId, setSelectedId] = useState(tickets[0]?.id)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("Dispositivo o sensor")
  const [description, setDescription] = useState("")
  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0]

  const tone = (status: SupportTicket["status"]) =>
    status === "Resuelto"
      ? "success"
      : status === "En revisión"
        ? "info"
        : status === "Pendiente de envío"
          ? "offline"
          : "warning"

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Soporte"
        subtitle="Abre y consulta incidencias. El seguimiento lo realiza el equipo de soporte de NEUTRON."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={17} /> Nueva incidencia
          </Button>
        }
      />
      <div className="x-grid-2 support-grid">
        <div className="admin-panel table-panel">
          <div className="data-table">
            <TableRow columns=".6fr 1.6fr .8fr .5fr" head>
              <span>TICKET</span>
              <span>ASUNTO</span>
              <span>ESTADO</span>
              <span>FECHA</span>
            </TableRow>
            {tickets.map((ticket) => (
              <TableRow
                columns=".6fr 1.6fr .8fr .5fr"
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                active={selected?.id === ticket.id}
              >
                <strong>{ticket.id}</strong>
                <span className="x-stack">
                  <strong>{ticket.subject}</strong>
                  <small>{ticket.category}</small>
                </span>
                <span>
                  <Badge tone={tone(ticket.status)}>{ticket.status}</Badge>
                </span>
                <span>{ticket.date}</span>
              </TableRow>
            ))}
          </div>
        </div>
        <div className="admin-panel x-pad">
          {selected ? (
            <div className="ticket-thread">
              <div className="admin-panel-heading">
                <div>
                  <strong>{selected.subject}</strong>
                  <span>
                    {selected.id} · {selected.category}
                  </span>
                </div>
                <Badge tone={tone(selected.status)}>{selected.status}</Badge>
              </div>
              {selected.description && (
                <div className="thread-msg mine">
                  <b>Tú</b>
                  <p>{selected.description}</p>
                  <small>{selected.date}</small>
                </div>
              )}
              {(selected.replies ?? []).map((reply, i) => (
                <div className="thread-msg" key={i}>
                  <b>
                    <Headphones size={12} /> {reply.from}
                  </b>
                  <p>{reply.text}</p>
                  <small>{reply.time}</small>
                </div>
              ))}
              {!selected.replies?.length && (
                <Note>
                  El equipo de soporte responderá aquí. Recibirás un aviso en
                  el panel y en la app móvil.
                </Note>
              )}
            </div>
          ) : (
            <div className="x-empty">
              <strong>No hay incidencias abiertas</strong>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <AdminModal
          title="Nueva incidencia"
          subtitle="Se enviará al equipo de soporte con los datos de tu organización."
          onClose={() => setShowForm(false)}
        >
          <form
            className="x-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!subject.trim()) return
              onAddTicket({ subject, category, description })
              setShowForm(false)
              setSubject("")
              setDescription("")
              onToast({
                title: "Incidencia enviada",
                detail: "Soporte la revisará y te responderá en este panel.",
              })
            }}
          >
            <Field label="Asunto">
              <Input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. La sonda HUM-012 no envía datos"
              />
            </Field>
            <Field label="Categoría">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Dispositivo o sensor</option>
                <option>Riego y automatización</option>
                <option>Aplicación</option>
                <option>Usuarios y accesos</option>
                <option>Facturación</option>
              </Select>
            </Field>
            <Field label="Descripción">
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div className="modal-footer">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Send size={16} /> Enviar
              </Button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

/* =========================================================================
   API pública y ERP del cliente (APP-08 · OF-46, OF-47)
   ========================================================================= */

export function ApiErpView({
  datasets,
  onToggleDataset,
  onSendNow,
  onToast,
}: {
  datasets: ErpDataset[]
  onToggleDataset: (id: string) => void
  onSendNow: () => void
  onToast: (toast: ToastState) => void
}) {
  const [showSecret, setShowSecret] = useState(false)
  const [secret, setSecret] = useState("nt_live_8f3a9c27e1b44d0c9a61")
  const [frequency, setFrequency] = useState("Diaria (06:00)")

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="API y ERP del cliente"
        subtitle="Comparte con tu ERP solo los datos acordados: predicciones, consumos y necesidades."
        action={<Badge tone="info">Fase 2</Badge>}
      />
      <div className="x-grid-2">
        <div className="admin-panel x-pad">
          <div className="admin-panel-heading">
            <div>
              <strong>Conexión con el ERP</strong>
              <span>SAP Business One · Cooperativa Valle Verde</span>
            </div>
            <Badge tone="success">Conectado</Badge>
          </div>
          <div className="x-form">
            <Field label="Frecuencia de envío">
              <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option>Diaria (06:00)</option>
                <option>Semanal (lunes)</option>
                <option>Bajo demanda</option>
              </Select>
            </Field>
          </div>
          <div className="dataset-list">
            {datasets.map((dataset) => (
              <div className="dataset-row" key={dataset.id}>
                <div>
                  <strong>{dataset.name}</strong>
                  <small>{dataset.description}</small>
                  <small>Último envío: {dataset.lastSent}</small>
                </div>
                <button
                  type="button"
                  className={`x-toggle ${dataset.enabled ? "on" : ""}`}
                  aria-label={`Compartir ${dataset.name}`}
                  onClick={() => onToggleDataset(dataset.id)}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>
          <Note>
            Las facturas, cobros y pagos de NEUTRON se gestionan en su ERP
            interno y nunca se envían al ERP del cliente.
          </Note>
          <div className="modal-footer">
            <Button variant="secondary" onClick={onSendNow}>
              <RefreshCw size={16} /> Enviar ahora
            </Button>
          </div>
        </div>

        <div className="admin-panel x-pad">
          <div className="admin-panel-heading">
            <div>
              <strong>Credenciales de la API</strong>
              <span>OAuth2 · client credentials · acceso por ámbitos</span>
            </div>
            <KeyRound size={18} />
          </div>
          <div className="x-form">
            <Field label="Client ID">
              <div className="x-inline">
                <Input readOnly value="valleverde-erp" />
                <Button
                  variant="ghost"
                  className="icon-button"
                  type="button"
                  onClick={() =>
                    onToast({ title: "Copiado", detail: "Client ID copiado." })
                  }
                >
                  <Copy size={16} />
                </Button>
              </div>
            </Field>
            <Field label="Client secret">
              <div className="x-inline">
                <Input
                  readOnly
                  value={showSecret ? secret : "•".repeat(secret.length)}
                />
                <Button
                  variant="ghost"
                  className="icon-button"
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </Field>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setSecret(
                  `nt_live_${Math.random().toString(16).slice(2, 10)}${Math.random()
                    .toString(16)
                    .slice(2, 14)}`,
                )
                onToast({
                  title: "Secreto regenerado",
                  detail: "El anterior deja de funcionar en 24 horas.",
                })
              }}
            >
              <RefreshCw size={16} /> Regenerar secreto
            </Button>
          </div>
          <div className="data-table x-gap-top">
            <TableRow columns=".4fr 1.3fr 1.3fr .9fr" head>
              <span>MÉTODO</span>
              <span>RUTA</span>
              <span>DESCRIPCIÓN</span>
              <span>ÁMBITO</span>
            </TableRow>
            {apiEndpoints.map((endpoint) => (
              <TableRow columns=".4fr 1.3fr 1.3fr .9fr" key={endpoint.path}>
                <span>
                  <Badge tone={endpoint.method === "GET" ? "info" : "warning"}>
                    {endpoint.method}
                  </Badge>
                </span>
                <code>{endpoint.path}</code>
                <span>{endpoint.description}</span>
                <code>{endpoint.scope}</code>
              </TableRow>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
