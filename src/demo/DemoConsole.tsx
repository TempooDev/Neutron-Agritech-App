// Panel del presentador: escenarios guionados, velocidad, impacto y registro de eventos.
// Atajos: Ctrl+Shift+D abre/cierra · Alt+1..4 lanzan escenarios · Alt+0 reinicia.
import {
  Activity,
  Bug,
  CloudSun,
  Droplets,
  Flame,
  Gauge,
  Maximize2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Sun,
  Wrench,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import type { LiveDemo } from "./useLiveDemo"
import type { DemoImpact, DemoSnapshot } from "./types"
import { SCENARIOS } from "./types"

const scenarioIcons: Record<string, typeof Sun> = {
  normal: Sun,
  heatwave: Flame,
  pest: Bug,
  "irrigation-failure": Wrench,
}

const SPEEDS = [
  { value: 60, label: "×60", hint: "1 s = 1 min" },
  { value: 600, label: "×600", hint: "1 s = 10 min" },
  { value: 1800, label: "×1800", hint: "1 s = 30 min" },
]

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })

function simClock(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DemoSourceBadge({ demo }: { demo: LiveDemo }) {
  const label =
    demo.source === "api"
      ? "En vivo · Neutron API"
      : demo.source === "local"
        ? "En vivo · simulación local"
        : "Conectando…"
  return (
    <span className={`demo-source demo-source-${demo.source}`}>
      <span className="demo-source-dot" /> {label}
    </span>
  )
}

export default function DemoConsole({
  demo,
  enabled,
  onToggleEnabled,
}: {
  demo: LiveDemo
  enabled: boolean
  onToggleEnabled: (value: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [tab, setTab] = useState<"scenarios" | "impact" | "log">("scenarios")
  const [board, setBoard] = useState(false)
  const snap = demo.snapshot

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault()
        setHidden((h) => !h)
        return
      }
      if (!e.altKey || !enabled) return
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select")) return
      if (e.key === "0") {
        e.preventDefault()
        demo.reset()
      }
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < SCENARIOS.length) {
        e.preventDefault()
        demo.startScenario(SCENARIOS[idx].id)
      }
      if (e.key.toLowerCase() === "i") {
        e.preventDefault()
        setBoard((b) => !b)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [demo, enabled])

  if (hidden) return null

  return (
    <>
      {!open && (
        <button
          type="button"
          className={`demo-fab ${enabled ? `demo-fab-${demo.source}` : "demo-fab-off"}`}
          onClick={() => setOpen(true)}
          aria-label="Abrir panel de demo"
        >
          <Activity size={16} />
          <span>Demo</span>
          {enabled && snap && <small>{snap.scenario.label}</small>}
        </button>
      )}

      {open && (
        <aside className="demo-console" aria-label="Panel de demo">
          <header className="demo-console-head">
            <div>
              <strong>Modo demo</strong>
              {enabled ? <DemoSourceBadge demo={demo} /> : <span className="demo-source">Datos estáticos</span>}
            </div>
            <button type="button" className="demo-icon" onClick={() => setOpen(false)} aria-label="Cerrar panel">
              <X size={16} />
            </button>
          </header>

          <label className="demo-switch">
            <input type="checkbox" checked={enabled} onChange={(e) => onToggleEnabled(e.target.checked)} />
            <span>Datos en vivo (sensores simulados)</span>
          </label>

          {enabled && snap && (
            <>
              <section className="demo-clock">
                <div>
                  <span className="demo-label">Hora en la finca</span>
                  <strong>{simClock(snap.simTime)}</strong>
                </div>
                <div className="demo-weather">
                  <CloudSun size={16} />
                  <span>
                    {nf1.format(snap.weather.airTemp)} °C · {nf.format(snap.weather.humidity)} % HR ·{" "}
                    {snap.weather.summary}
                  </span>
                </div>
                <div className="demo-speed">
                  <button
                    type="button"
                    className="demo-icon"
                    onClick={() => demo.setPaused(!snap.paused)}
                    aria-label={snap.paused ? "Reanudar" : "Pausar"}
                  >
                    {snap.paused ? <Play size={15} /> : <Pause size={15} />}
                  </button>
                  {SPEEDS.map((s) => (
                    <button
                      type="button"
                      key={s.value}
                      title={s.hint}
                      className={snap.speed === s.value ? "active" : ""}
                      onClick={() => demo.setSpeed(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>

              <nav className="demo-tabs">
                {(
                  [
                    ["scenarios", "Escenarios"],
                    ["impact", "Impacto"],
                    ["log", "Registro"],
                  ] as const
                ).map(([id, label]) => (
                  <button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
                    {label}
                  </button>
                ))}
              </nav>

              <div className="demo-body">
                {tab === "scenarios" && (
                  <div className="demo-scenarios">
                    {SCENARIOS.map((s, i) => {
                      const Icon = scenarioIcons[s.id] ?? Sun
                      const active = snap.scenario.id === s.id
                      return (
                        <button
                          type="button"
                          key={s.id}
                          className={`demo-scenario ${active ? "active" : ""}`}
                          onClick={() => demo.startScenario(s.id)}
                        >
                          <span className="demo-scenario-icon">
                            <Icon size={18} />
                          </span>
                          <span>
                            <strong>
                              {s.label} <kbd>Alt+{i + 1}</kbd>
                            </strong>
                            <small>{s.description}</small>
                          </span>
                        </button>
                      )
                    })}
                    <div className="demo-plots">
                      {snap.plots.map((p) => (
                        <div key={p.id} className={`demo-plot demo-plot-${p.stress}`}>
                          <span>{p.name}</span>
                          <strong>{nf1.format(p.moisture)} %</strong>
                          <small>
                            {p.irrigating ? (
                              <>
                                <Droplets size={11} /> {nf.format(p.flowM3h)} m³/h
                              </>
                            ) : (
                              `Salud ${p.health}`
                            )}
                          </small>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="demo-reset" onClick={demo.reset}>
                      <RotateCcw size={14} /> Reiniciar demo <kbd>Alt+0</kbd>
                    </button>
                  </div>
                )}

                {tab === "impact" && (
                  <div>
                    <ImpactSummary impact={snap.impact} compact />
                    <button type="button" className="demo-reset" onClick={() => setBoard(true)}>
                      <Maximize2 size={14} /> Mostrar a pantalla completa <kbd>Alt+I</kbd>
                    </button>
                  </div>
                )}

                {tab === "log" && (
                  <ul className="demo-log">
                    {snap.events.map((e, i) => (
                      <li key={`${e.simTime}-${i}`} className={`demo-log-${e.kind}`}>
                        <time>{new Date(e.simTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</time>
                        <span>{e.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <footer className="demo-foot">
                <label className="demo-switch small">
                  <input
                    type="checkbox"
                    checked={demo.forceLocal}
                    onChange={(e) => demo.setForceLocal(e.target.checked)}
                  />
                  <span>Forzar simulación local (sin API)</span>
                </label>
                <small>Ctrl+Shift+D oculta el botón</small>
              </footer>
            </>
          )}
        </aside>
      )}

      {board && snap && <ImpactBoard snapshot={snap} demo={demo} onClose={() => setBoard(false)} />}
    </>
  )
}

function ImpactSummary({ impact, compact = false }: { impact: DemoImpact; compact?: boolean }) {
  const h = impact.perHa
  const rows = [
    { label: "Agua", value: h.waterEur, color: "var(--blue)" },
    { label: "Energía de bombeo", value: h.energyEur, color: "var(--purple)" },
    { label: "Fertilizantes", value: h.fertilizerEur, color: "var(--amber)" },
    { label: "Pérdidas evitadas", value: h.lossesAvoidedEur, color: "var(--green-600)" },
  ]
  const max = Math.max(h.totalBenefitEur, h.subscriptionEur)
  return (
    <div className={`demo-impact ${compact ? "compact" : ""}`}>
      <div className="demo-impact-kpis">
        <div>
          <span className="demo-label">Agua ahorrada ({nf.format(impact.simulatedDays)} días)</span>
          <strong>{nf.format(impact.waterSavedM3)} m³</strong>
          <small>{nf1.format(impact.waterSavedPct)} % frente a riego fijo</small>
        </div>
        <div>
          <span className="demo-label">Beneficio estimado</span>
          <strong>{nf.format(h.totalBenefitEur)} €/ha/año</strong>
          <small>
            Cuota {nf.format(h.subscriptionEur)} €/ha · ROI ×{nf1.format(h.roi)}
          </small>
        </div>
        <div>
          <span className="demo-label">Recuperación</span>
          <strong>{nf1.format(h.paybackMonths)} meses</strong>
          <small>Neto +{nf.format(h.netBenefitEur)} €/ha/año</small>
        </div>
        <div>
          <span className="demo-label">Alertas gestionadas</span>
          <strong>
            {impact.alertsActedOn}/{impact.alertsRaised}
          </strong>
          <small>{nf1.format(impact.healthProtectedPts)} pts de salud protegidos</small>
        </div>
      </div>

      <div className="demo-bars" aria-label="Desglose del beneficio por hectárea">
        <div className="demo-bar-row">
          <span>Beneficio</span>
          <div className="demo-bar-track">
            {rows.map((r) => (
              <i key={r.label} style={{ width: `${(r.value / max) * 100}%`, background: r.color }} title={`${r.label}: ${r.value} €`} />
            ))}
          </div>
          <b>{nf.format(h.totalBenefitEur)} €</b>
        </div>
        <div className="demo-bar-row">
          <span>Cuota Neutron</span>
          <div className="demo-bar-track">
            <i style={{ width: `${(h.subscriptionEur / max) * 100}%`, background: "var(--forest-800)" }} />
          </div>
          <b>{nf.format(h.subscriptionEur)} €</b>
        </div>
        <ul className="demo-legend">
          {rows.map((r) => (
            <li key={r.label}>
              <i style={{ background: r.color }} /> {r.label} <b>{nf.format(r.value)} €</b>
            </li>
          ))}
        </ul>
      </div>
      <p className="demo-assumptions">
        Supuestos: agua {impact.assumptions.waterPriceEurM3} €/m³, bombeo {impact.assumptions.energyEurM3} €/m³, consumo de
        referencia {nf.format(impact.assumptions.baselineWaterM3HaYear)} m³/ha/año, {impact.assumptions.fertilizerSavingPct} % de
        ahorro en fertirriego y {impact.assumptions.lossesAvoidedPct} % de pérdidas de cosecha evitadas. {impact.assumptions.source}.
      </p>
    </div>
  )
}

function ImpactBoard({ snapshot, demo, onClose }: { snapshot: DemoSnapshot; demo: LiveDemo; onClose: () => void }) {
  const i = snapshot.impact
  const farmTotal = i.perHa.netBenefitEur * i.totalAreaHa
  return (
    <div className="demo-board" role="dialog" aria-modal="true" aria-label="Panel de impacto">
      <div className="demo-board-inner">
        <header>
          <div>
            <span className="demo-label">Cooperativa Valle Verde · {nf1.format(i.totalAreaHa)} ha monitorizadas</span>
            <h2>Impacto de Neutron</h2>
          </div>
          <div className="demo-board-actions">
            <DemoSourceBadge demo={demo} />
            <button type="button" className="demo-icon" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="demo-board-hero">
          <div>
            <Droplets />
            <strong>{nf.format(i.perHa.waterSavedM3)} m³</strong>
            <span>de agua ahorrada por hectárea y año</span>
          </div>
          <div>
            <Gauge />
            <strong>×{nf1.format(i.perHa.roi)}</strong>
            <span>retorno sobre la cuota de {nf.format(i.perHa.subscriptionEur)} €/ha/año</span>
          </div>
          <div>
            <Radio />
            <strong>{nf.format(farmTotal)} €</strong>
            <span>de beneficio neto anual para esta finca</span>
          </div>
        </div>
        <ImpactSummary impact={i} />
      </div>
    </div>
  )
}
