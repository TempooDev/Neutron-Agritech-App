// Simulador de respaldo que corre en el navegador cuando la API de Aspire no está disponible
// (sin red en la sala, portátil sin .NET...). Es una versión compacta del motor de
// aspire/Neutron.DemoApi/Simulation: mismas parcelas, reglas, escenarios e impacto.
import type { Severity } from "../data"
import type {
  DemoAlert,
  DemoDevice,
  DemoEvent,
  DemoImpact,
  DemoPlot,
  DemoSnapshot,
} from "./types"
import { SCENARIOS } from "./types"

const STEP_H = 5 / 60
const MM_TO_PCT = 1.5
const FIELD_CAPACITY = 60
const HISTORY_DAYS = 30

type Seed = {
  id: string
  name: string
  crop: "Aguacate" | "Pitaya"
  variety: string
  area: number
  owner: string
  phase: string
  sector: number
  kc: number
  low: number
  target: number
  high: number
  moisture: number
  health: number
  growth: number
  programmedMin: number
  flowMeter: string
}

const SEEDS: Seed[] = [
  { id: "p1", name: "La Umbría", crop: "Aguacate", variety: "Hass", area: 8.4, owner: "Finca El Manantial", phase: "Engorde de fruto", sector: 1, kc: 0.75, low: 35, target: 48, high: 68, moisture: 41, health: 92, growth: 78, programmedMin: 54, flowMeter: "CAU-004" },
  { id: "p2", name: "Los Naranjos", crop: "Aguacate", variety: "Hass", area: 5.2, owner: "Finca El Manantial", phase: "Engorde de fruto", sector: 2, kc: 0.75, low: 35, target: 50, high: 70, moisture: 56, health: 97, growth: 84, programmedMin: 54, flowMeter: "CAU-012" },
  { id: "p3", name: "Loma Alta", crop: "Pitaya", variety: "Roja", area: 3.7, owner: "Cortijo del Sol", phase: "Floración", sector: 3, kc: 0.5, low: 34, target: 45, high: 65, moisture: 30, health: 71, growth: 66, programmedMin: 26, flowMeter: "CAU-009" },
  { id: "p4", name: "El Molino", crop: "Pitaya", variety: "Amarilla", area: 4.9, owner: "Cortijo del Sol", phase: "Cuajado", sector: 4, kc: 0.5, low: 30, target: 44, high: 65, moisture: 47, health: 88, growth: 72, programmedMin: 36, flowMeter: "CAU-015" },
]

const DEVICE_SEEDS: { id: string; type: string; plotId: string; battery: number; signal: number; offline?: boolean; offset?: number }[] = [
  { id: "HUM-018", type: "Sonda de humedad", plotId: "p1", battery: 82, signal: 94 },
  { id: "FOL-011", type: "Sensor foliar", plotId: "p1", battery: 73, signal: 91 },
  { id: "CAU-004", type: "Caudalímetro", plotId: "p1", battery: 88, signal: 86 },
  { id: "MET-003", type: "Estación meteorológica", plotId: "p2", battery: 100, signal: 88 },
  { id: "HUM-021", type: "Sonda de humedad", plotId: "p2", battery: 91, signal: 90 },
  { id: "CAU-012", type: "Caudalímetro", plotId: "p2", battery: 76, signal: 83 },
  { id: "HUM-030", type: "Sonda de humedad", plotId: "p3", battery: 64, signal: 78 },
  { id: "CAU-009", type: "Caudalímetro", plotId: "p3", battery: 67, signal: 0, offline: true, offset: 1 },
  { id: "HUM-024", type: "Sonda de humedad", plotId: "p4", battery: 14, signal: 72, offset: -2 },
  { id: "TRP-002", type: "Trampa inteligente", plotId: "p4", battery: 58, signal: 80 },
  { id: "CAU-015", type: "Caudalímetro", plotId: "p4", battery: 81, signal: 84 },
]

const SCENARIO_MODS: Record<string, { temp: number; hum: number; wind: number }> = {
  normal: { temp: 0, hum: 0, wind: 0 },
  heatwave: { temp: 11, hum: -25, wind: 8 },
  pest: { temp: -3, hum: 18, wind: 0 },
  "irrigation-failure": { temp: 0, hum: 0, wind: 0 },
}

const IMPACT = {
  waterPrice: 0.35,
  energy: 0.12,
  baseline: { Aguacate: 6500, Pitaya: 3500 },
  cropValue: { Aguacate: 24000, Pitaya: 30000 },
  fertilizer: 900,
  fertilizerPct: 10,
  lossesPct: 2,
  subscription: 490,
  overIrrigation: 1.35,
}

type PlotState = {
  seed: Seed
  nominal: number
  moisture: number
  measured: number
  soilTemp: number
  health: number
  growth: number
  irrigationH: number
  flow: number
  leak: boolean
  rainPending: number
  wetHours: number
  phyto: number
  traps: number
  treatedUntil: number
  suspendedUntil: number
  lowH: number
  nearLowH: number
  flowAnomalyH: number
  applied: number
  baseline: number
  history: { t: number; m: number }[]
}

type DeviceState = (typeof DEVICE_SEEDS)[number] & { offline: boolean; lastTx: number }

type Condition = Omit<DemoAlert, "id" | "time" | "raisedAt" | "resolved">

type AlertState = {
  id: string
  key: string
  cond: Condition
  severity: Severity
  raisedAt: number
  resolved: boolean
  clearedH: number
}

// Generador pseudoaleatorio con semilla (mulberry32) para que la demo sea reproducible.
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rank = (s: Severity) => ({ critical: 0, warning: 1, info: 2, success: 3 })[s]
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d
const HOUR = 3_600_000

export class LocalSimulator {
  private rand = rng(42)
  private sim = 0
  private speed = 600
  private paused = false
  private scenario = "normal"
  private scenarioStartedAt: number | null = null
  private weather = { airTemp: 22, humidity: 55, wind: 8, radiation: 0, et0h: 0 }
  private dayTempOffset = 0
  private dayCloud = 1
  private lastDay = -1
  private et0Today = 0
  private rainLog: number[] = []
  private plots: PlotState[] = []
  private devices: DeviceState[] = []
  private active = new Map<string, AlertState>()
  private archived: AlertState[] = []
  private events: DemoEvent[] = []
  private seq = 0
  private runId = ""
  private raised = 0
  private actedOn = 0
  private healthProtected = 0
  private impactSince = 0

  constructor() {
    this.reset()
  }

  reset() {
    this.rand = rng(42)
    const now = new Date()
    now.setHours(10, 0, 0, 0)
    this.sim = now.getTime()
    this.scenario = "normal"
    this.scenarioStartedAt = null
    this.active.clear()
    this.archived = []
    this.events = []
    this.rainLog = []
    this.seq = 0
    this.runId = Math.random().toString(36).slice(2, 6)
    this.raised = 0
    this.actedOn = 0
    this.healthProtected = 0
    this.paused = false
    this.plots = SEEDS.map((seed) => ({
      seed,
      nominal: seed.area * 40,
      moisture: seed.moisture,
      measured: seed.moisture,
      soilTemp: 21,
      health: seed.health,
      growth: seed.growth,
      irrigationH: 0,
      flow: 0,
      leak: false,
      rainPending: 0,
      wetHours: 0,
      phyto: 18,
      traps: 3,
      treatedUntil: 0,
      suspendedUntil: 0,
      lowH: 0,
      nearLowH: 0,
      flowAnomalyH: 0,
      applied: 0,
      baseline: 0,
      history: [],
    }))
    this.warmUp()
    this.impactSince = this.sim - HISTORY_DAYS * 24 * HOUR
    this.devices = DEVICE_SEEDS.map((d) => ({
      ...d,
      offline: !!d.offline,
      lastTx: this.sim - Math.floor(this.rand() * 11 + 1) * 60_000,
    }))
    this.event("demo", "Simulación local iniciada · finca Valle Verde con 30 días de historial")
    this.evaluate()
  }

  setSpeed(speed: number) {
    this.speed = Math.max(1, Math.min(3600, speed))
    this.event("demo", `Velocidad de simulación ×${this.speed}`)
  }

  setPaused(paused: boolean) {
    this.paused = paused
    this.event("demo", paused ? "Simulación en pausa" : "Simulación reanudada")
  }

  startScenario(id: string) {
    const scenario = SCENARIOS.find((s) => s.id === id)
    if (!scenario) return
    this.scenario = id
    this.scenarioStartedAt = this.sim
    for (const p of this.plots) {
      p.leak = false
      p.rainPending = 0
    }
    if (id === "heatwave") {
      const h = new Date(this.sim).getHours()
      if (h < 8 || h > 16) {
        let guard = 0
        while (new Date(this.sim).getHours() !== 11 && guard++ < 288) this.step(true)
      }
    } else if (id === "pest") {
      for (const p of this.plots)
        if (p.seed.owner === "Finca El Manantial") p.rainPending = p.seed.id === "p1" ? 26 : 12
    } else if (id === "irrigation-failure") {
      const p = this.plots.find((x) => x.seed.id === "p2")!
      p.leak = true
      this.startIrrigation(p, 60, "Riego programado")
    }
    this.event("scenario", `Escenario «${scenario.label}» iniciado`)
  }

  irrigate(plotId: string, minutes: number, origin = "Orden manual") {
    const p = this.plots.find((x) => x.seed.id === plotId)
    if (p) this.startIrrigation(p, Math.max(5, Math.min(240, minutes)), origin)
  }

  resolveAlert(id: string, status: "accepted" | "rejected", reason?: string) {
    const alert = [...this.active.values(), ...this.archived].find((a) => a.id === id)
    if (!alert || alert.resolved) return
    alert.resolved = true
    const p = this.plots.find((x) => x.seed.id === alert.cond.plotId)!
    if (status === "accepted") {
      this.actedOn++
      this.applyRecommendation(alert, p)
      this.event("action", `Recomendación aceptada · ${alert.cond.title} (${p.seed.name})`)
    } else {
      this.event("action", `Recomendación rechazada · ${alert.cond.title}${reason ? ` · ${reason}` : ""}`)
    }
  }

  advance(realMs: number) {
    if (this.paused) return
    const simH = (realMs / HOUR) * this.speed
    const steps = Math.max(1, Math.round(simH / STEP_H))
    for (let i = 0; i < steps; i++) this.step(true)
  }

  // ---------------------------------------------------------------- motor

  private gauss(sigma: number) {
    const u1 = 1 - this.rand()
    const u2 = this.rand()
    return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  private warmUp() {
    const end = this.sim
    this.sim = end - HISTORY_DAYS * 24 * HOUR
    while (this.sim < end) this.step(false)
    for (const p of this.plots) {
      const delta = p.moisture - p.seed.moisture
      const n = p.history.length
      p.history = p.history.map((h, i) => ({
        ...h,
        m: round(Math.min(80, Math.max(8, h.m - delta * Math.pow(i / Math.max(1, n - 1), 1.6)))),
      }))
      p.moisture = p.seed.moisture
      p.measured = p.seed.moisture
      p.health = p.seed.health
      p.growth = p.seed.growth
      p.lowH = p.moisture < p.seed.low ? 6 : 0
      p.nearLowH = p.moisture < p.seed.low + 4 ? 6 : 0
      p.wetHours = 0
      p.phyto = 18
      p.traps = 3
      p.flowAnomalyH = 0
      p.flow = 0
      p.irrigationH = 0
    }
  }

  private step(evaluate: boolean) {
    this.sim += STEP_H * HOUR
    const date = new Date(this.sim)
    const hour = date.getHours() + date.getMinutes() / 60
    const day = Math.floor(this.sim / (24 * HOUR))
    if (day !== this.lastDay) {
      this.lastDay = day
      this.et0Today = 0
      this.dayTempOffset = this.gauss(1.8)
      this.dayCloud = this.rand() < 0.2 ? 0.55 + this.rand() * 0.3 : 1
      for (const p of this.plots)
        p.traps = this.scenario === "pest" && p.seed.crop === "Pitaya" ? p.traps * 0.6 : 1 + Math.floor(this.rand() * 4)
    }

    this.updateWeather(hour)
    this.et0Today += this.weather.et0h * STEP_H

    for (const p of this.plots) {
      if (Math.abs(hour - 6) < STEP_H / 2 && p.suspendedUntil < this.sim)
        this.startIrrigation(p, p.seed.programmedMin, "Riego programado", evaluate)
      this.stepPlot(p, STEP_H)
    }
    for (const d of this.devices) {
      if (!d.offline) {
        if (d.type !== "Estación meteorológica") d.battery = Math.max(0, d.battery - 0.012 * STEP_H)
        if (this.sim - d.lastTx >= 15 * 60_000) d.lastTx = this.sim
      }
    }

    if (Math.round((this.sim / HOUR) * 12) % 6 === 0) {
      const cutoff = this.sim - HISTORY_DAYS * 24 * HOUR
      for (const p of this.plots) {
        p.history.push({ t: this.sim, m: round(p.measured) })
        while (p.history.length && p.history[0].t < cutoff) p.history.shift()
      }
    }
    if (evaluate) this.evaluate()
  }

  private updateWeather(hour: number) {
    const mod = SCENARIO_MODS[this.scenario]
    const f = 0.5 * (1 + Math.cos((Math.PI * (hour - 15)) / 12))
    const tMin = 15 + mod.temp * 0.6 + this.dayTempOffset * 0.5
    const tMax = 29 + mod.temp + this.dayTempOffset
    const raining = this.plots.some((p) => p.rainPending > 0)
    const cloud = raining ? 0.35 : this.scenario === "pest" ? 0.75 : this.dayCloud
    const w = this.weather
    w.airTemp = tMin + (tMax - tMin) * f + this.gauss(0.25)
    w.humidity = Math.min(99, Math.max(8, 78 - 38 * f + mod.hum + (raining ? 18 : 0) + this.gauss(1)))
    w.wind = Math.max(0, 7 + 7 * f + mod.wind + this.gauss(1.2))
    w.radiation = Math.max(0, Math.sin((Math.PI * (hour - 6.5)) / 13.5)) * 860 * cloud
    const factor = (1 + 0.03 * (w.airTemp - 20)) * (1 + (55 - w.humidity) / 140) * (1 + w.wind / 80)
    w.et0h = Math.max(0, 0.00042 * w.radiation * factor)
  }

  private stepPlot(p: PlotState, dt: number) {
    const s = p.seed
    let rain = 0
    if (p.rainPending > 0) {
      rain = Math.min(p.rainPending, 11 * dt)
      p.rainPending -= rain
    }
    if (p === this.plots[0]) {
      this.rainLog.push(rain)
      if (this.rainLog.length > 288) this.rainLog.shift()
    }

    const dryness = Math.min(1, Math.max(0.3, (p.moisture - 12) / (s.low - 12)))
    const etc = this.weather.et0h * s.kc * dryness * dt

    let delivered = 0
    if (p.irrigationH > 0) {
      const h = Math.min(dt, p.irrigationH)
      p.irrigationH -= h
      const flow = p.nominal * (p.leak ? 1.65 : 1)
      const effective = p.nominal * (p.leak ? 0.2 : 1)
      p.flow = flow * (h / dt) * (1 + this.gauss(0.015))
      p.applied += flow * h
      delivered = (effective * h) / (s.area * 10)
    } else if (p.leak) {
      const leak = p.nominal * 0.22
      p.flow = leak * (1 + this.gauss(0.03))
      p.applied += leak * dt
    } else {
      p.flow = 0
    }

    p.baseline += etc * s.area * 10 * IMPACT.overIrrigation
    p.moisture += (delivered + rain * 0.6 - etc) * MM_TO_PCT
    if (p.moisture > FIELD_CAPACITY) p.moisture -= (p.moisture - FIELD_CAPACITY) * 0.04 * dt
    p.moisture = Math.min(82, Math.max(8, p.moisture))
    p.measured = p.moisture + this.gauss(0.2)

    const soilTarget = 0.55 * this.weather.airTemp + 0.45 * 21 + (p.moisture > 55 ? -1 : 0)
    p.soilTemp += (soilTarget - p.soilTemp) * Math.min(1, dt / 5)

    const treated = p.treatedUntil > this.sim
    if (s.crop === "Aguacate") {
      const wet = p.moisture > s.high - 8 && p.soilTemp > 16 && !treated
      p.wetHours = wet ? p.wetHours + dt : Math.max(0, p.wetHours - dt * (treated ? 2 : 0.4))
      p.phyto = Math.min(96, Math.max(5, 18 + p.wetHours * 10))
    } else {
      const pressure = this.scenario === "pest" && s.id === "p4" && !treated ? 4.5 : 0.08
      if (treated) p.traps = Math.max(1, p.traps - 4 * dt)
      else p.traps = Math.min(60, p.traps + pressure * dt * (this.weather.airTemp > 22 ? 1.2 : 0.7))
    }

    const heat = this.weather.airTemp > 36 ? 1.6 : 1
    let drop = 0
    if (p.moisture < s.low) drop += 0.22 * (1 + (s.low - p.moisture) / 8) * heat
    if (p.moisture > s.high + 4) drop += 0.06
    if (p.phyto > 60) drop += (0.08 * (p.phyto - 60)) / 30
    if (p.traps > 25) drop += 0.04
    if (drop > 0) p.health -= drop * dt
    else if (p.health < s.health + 4) p.health += 0.05 * dt
    p.health = Math.min(99, Math.max(20, p.health))
    if (p.health > 80) p.growth = Math.min(100, p.growth + 0.004 * dt)

    p.lowH = p.moisture < s.low ? p.lowH + dt : 0
    p.nearLowH = p.moisture < s.low + 4 ? p.nearLowH + dt : 0
    const irrigating = p.irrigationH > 0
    const anomaly = irrigating ? Math.abs(p.flow / p.nominal - 1) > 0.35 : p.flow > p.nominal * 0.05
    p.flowAnomalyH = anomaly ? p.flowAnomalyH + dt : 0
  }

  private startIrrigation(p: PlotState, minutes: number, origin: string, log = true) {
    p.irrigationH = Math.max(p.irrigationH, minutes / 60)
    if (log) this.event("irrigation", `${origin} · ${p.seed.name} · ${Math.round(minutes)} min`)
  }

  private applyRecommendation(alert: AlertState, p: PlotState) {
    switch (alert.cond.ruleId) {
      case "water-stress":
      case "water-near":
      case "heat":
        this.healthProtected += Math.max(2, (p.seed.low - p.moisture) * 0.6)
        this.startIrrigation(p, alert.cond.irrigationMinutes ?? 30, "Recomendación aceptada")
        break
      case "flow-anomaly":
        p.leak = false
        p.irrigationH = 0
        this.event("irrigation", `Válvula del sector ${p.seed.sector} cerrada · aviso a mantenimiento`)
        break
      case "phytophthora":
        p.treatedUntil = this.sim + 48 * HOUR
        p.suspendedUntil = this.sim + 48 * HOUR
        this.healthProtected += 4
        break
      case "thrips":
        p.treatedUntil = this.sim + 72 * HOUR
        this.healthProtected += 2
        break
      case "battery": {
        const d = this.devices.find((x) => x.plotId === p.seed.id && x.battery < 20)
        if (d) d.battery = 100
        break
      }
      case "offline":
        for (const d of this.devices.filter((x) => x.plotId === p.seed.id && x.offline)) {
          d.offline = false
          d.lastTx = this.sim
        }
        break
    }
  }

  // ---------------------------------------------------------------- reglas

  private minutesToTarget(p: PlotState) {
    const deficit = Math.max(0, (p.seed.low + 6 - p.moisture) / MM_TO_PCT)
    const hours = (deficit * p.seed.area * 10) / p.nominal
    return Math.min(150, Math.max(15, Math.ceil((hours * 60) / 5) * 5))
  }

  private conditions(): Condition[] {
    const out: Condition[] = []
    const w = this.weather
    const hour = new Date(this.sim).getHours()
    const rain24 = this.rainLog.reduce((a, b) => a + b, 0)
    for (const p of this.plots) {
      const s = p.seed
      const reading = `${p.measured.toFixed(1)}% humedad · umbral ${s.low}%`
      if (p.lowH >= 1) {
        const m = this.minutesToTarget(p)
        out.push({ ruleId: "water-stress", plotId: s.id, title: "Estrés hídrico elevado", description: `La humedad lleva ${p.lowH < 1.5 ? "1 hora" : `${Math.round(p.lowH)} horas`} por debajo del umbral de ${s.crop.toLowerCase()} (${s.low} %).`, severity: "critical", category: "Riego", recommendation: `Iniciar riego sector ${s.sector} durante ${m} minutos`, reading, irrigationMinutes: m })
      } else if (p.nearLowH >= 1.5 && p.irrigationH <= 0) {
        const m = this.minutesToTarget(p)
        out.push({ ruleId: "water-near", plotId: s.id, title: "Humedad cerca del umbral", description: `La tendencia de las últimas horas indica que ${s.name} cruzará el umbral antes del próximo riego programado.`, severity: "warning", category: "Riego", recommendation: `Adelantar riego del sector ${s.sector}: ${m} minutos`, reading, irrigationMinutes: m })
      }
      if (p.flowAnomalyH >= 1 / 6) {
        const ratio = (p.flow / p.nominal) * 100
        const closed = p.irrigationH <= 0
        out.push({ ruleId: "flow-anomaly", plotId: s.id, title: closed ? "Caudal fuera de programa: posible fuga" : ratio > 100 ? "Caudal anómalo: posible fuga" : "Caudal bajo: posible obstrucción", description: closed ? `El caudalímetro ${s.flowMeter} registra ${Math.round(p.flow)} m³/h con la válvula cerrada. Se está perdiendo agua.` : `El caudalímetro ${s.flowMeter} marca ${Math.round(ratio)}% del caudal nominal y la humedad del suelo no responde al riego.`, severity: "critical", category: "Riego", recommendation: `Cerrar la válvula del sector ${s.sector} y revisar la tubería principal`, reading: `${Math.round(p.flow)} m³/h · nominal ${Math.round(p.nominal)} m³/h` })
      }
      if (s.crop === "Aguacate" && p.phyto >= 50)
        out.push({ ruleId: "phytophthora", plotId: s.id, title: "Riesgo de Phytophthora", description: "Suelo saturado y temperatura radicular templada durante varias horas: condiciones favorables para Phytophthora cinnamomi.", severity: p.phyto >= 75 ? "critical" : "warning", category: "Sanidad", recommendation: "Suspender riego 48 h y aplicar fosetil-Al en la zona norte", reading: `Riesgo estimado ${Math.round(p.phyto)}% · humedad ${Math.round(p.measured)}%` })
      if (s.crop === "Pitaya" && p.traps >= 20)
        out.push({ ruleId: "thrips", plotId: s.id, title: "Aumento de capturas de trips", description: "La trampa cromática registra un número de capturas muy superior a la media de la semana.", severity: p.traps >= 35 ? "critical" : "warning", category: "Sanidad", recommendation: "Revisar flores y programar suelta de Orius laevigatus", reading: `${Math.round(p.traps)} capturas/24 h · media 3` })
      if (w.airTemp >= 37 && (s.crop === "Aguacate" || p.moisture < s.target)) {
        const m = Math.max(20, Math.round(this.minutesToTarget(p) / 2))
        out.push({ ruleId: "heat", plotId: s.id, title: "Golpe de calor en curso", description: `Temperatura del aire de ${w.airTemp.toFixed(1)} °C y humedad relativa del ${Math.round(w.humidity)}%. El ${s.crop.toLowerCase()} cierra estomas y el fruto puede quemarse.`, severity: "critical", category: "Labor", recommendation: `Pulso de riego de ${m} min ahora y adelantar el programa a las 05:00`, reading: `${w.airTemp.toFixed(1)} °C · HR ${Math.round(w.humidity)}% · ETc ×${(1 + (w.airTemp - 29) / 12).toFixed(1)}`, irrigationMinutes: m })
      }
      if (s.id === "p2" && hour >= 7 && hour < 12 && w.wind < 12 && rain24 < 0.5 && w.airTemp < 32)
        out.push({ ruleId: "pruning", plotId: s.id, title: "Ventana óptima de poda", description: "Previsión sin lluvia y viento flojo: buena cicatrización de cortes en las próximas 48 horas.", severity: "info", category: "Labor", recommendation: "Programar poda ligera de mantenimiento", reading: `Viento ${Math.round(w.wind)} km/h · sin lluvia` })
    }
    for (const d of this.devices) {
      if (d.offline)
        out.push({ ruleId: "offline", plotId: d.plotId, title: `${d.type} sin señal`, description: `${d.id} no transmite desde hace más de 3 horas. Sin este dato el riego del sector se decide a ciegas.`, severity: "warning", category: "Dispositivo", recommendation: "Revisar gateway LoRaWAN y alimentación del equipo", reading: `${d.id} · señal 0%` })
      else if (d.battery < 20)
        out.push({ ruleId: "battery", plotId: d.plotId, title: "Batería de sonda baja", description: `La sonda ${d.id} puede dejar de transmitir en las próximas 48 horas si no se recarga.`, severity: "warning", category: "Dispositivo", recommendation: `Sustituir batería o limpiar panel solar de ${d.id}`, reading: `Batería ${Math.round(d.battery)}%` })
    }
    return out
  }

  private evaluate() {
    const seen = new Set<string>()
    for (const c of this.conditions()) {
      const key = `${c.ruleId}:${c.plotId}`
      seen.add(key)
      const existing = this.active.get(key)
      if (existing) {
        existing.clearedH = 0
        if (!existing.resolved) {
          existing.cond = c
          if (rank(c.severity) < rank(existing.severity)) existing.severity = c.severity
        }
        continue
      }
      this.active.set(key, { id: `${c.ruleId}-${c.plotId}-${this.runId}${++this.seq}`, key, cond: c, severity: c.severity, raisedAt: this.sim, resolved: false, clearedH: 0 })
      this.raised++
      const name = this.plots.find((p) => p.seed.id === c.plotId)!.seed.name
      const label = c.severity === "critical" ? "Alerta crítica" : c.severity === "warning" ? "Aviso" : "Recomendación"
      this.event("alert", `${label} · ${c.title} · ${name}`)
    }
    for (const [key, a] of this.active) {
      if (seen.has(key)) continue
      a.clearedH += STEP_H
      if (a.resolved || a.clearedH >= 1) {
        this.active.delete(key)
        if (a.resolved) {
          this.archived.unshift(a)
          this.archived = this.archived.slice(0, 12)
        }
      }
    }
  }

  private event(kind: string, text: string) {
    this.events.unshift({ simTime: new Date(this.sim).toISOString(), kind, text })
    this.events = this.events.slice(0, 40)
  }

  // ---------------------------------------------------------------- snapshot

  snapshot(): DemoSnapshot {
    const plots: DemoPlot[] = this.plots.map((p) => {
      const byDay = new Map<string, number[]>()
      for (const h of p.history) {
        const k = new Date(h.t).toDateString()
        byDay.set(k, [...(byDay.get(k) ?? []), h.m])
      }
      const daily = [...byDay.values()].map((v) => round(v.reduce((a, b) => a + b, 0) / v.length))
      const current = round(p.measured)
      if (daily.length) daily[daily.length - 1] = current
      else daily.push(current)
      const s = p.seed
      const stress: Severity =
        p.moisture < s.low || p.phyto >= 75 || p.health < 60
          ? "critical"
          : p.moisture < s.low + 4 || p.phyto >= 50 || p.traps >= 20 || p.leak
            ? "warning"
            : p.moisture > s.high
              ? "info"
              : "success"
      return {
        id: s.id, name: s.name, crop: s.crop, variety: s.variety, area: s.area, owner: s.owner, phase: s.phase, sector: s.sector,
        moisture: current, soilTemp: round(p.soilTemp), health: Math.round(p.health), growth: Math.round(p.growth), stress,
        trend: daily.slice(-7), trend30: daily.slice(-30), irrigating: p.irrigationH > 0, flowM3h: round(p.flow), nominalFlowM3h: p.nominal,
        phytoRisk: Math.round(p.phyto), trapCount: Math.round(p.traps), lowThreshold: s.low, highThreshold: s.high,
      }
    })

    const alerts: DemoAlert[] = [...this.active.values(), ...this.archived]
      .sort((a, b) => Number(a.resolved) - Number(b.resolved) || rank(a.severity) - rank(b.severity) || b.raisedAt - a.raisedAt)
      .map((a) => {
        const mins = Math.max(0, Math.floor((this.sim - a.raisedAt) / 60_000))
        const time = mins < 1 ? "Ahora" : mins < 60 ? `Hace ${mins} min` : mins < 1440 ? `Hace ${Math.floor(mins / 60)} h` : `Hace ${Math.floor(mins / 1440)} d`
        return { ...a.cond, id: a.id, severity: a.severity, time, raisedAt: new Date(a.raisedAt).toISOString(), resolved: a.resolved }
      })

    const devices: DemoDevice[] = this.devices.map((d) => {
      const p = this.plots.find((x) => x.seed.id === d.plotId)!
      const mins = Math.floor((this.sim - d.lastTx) / 60_000)
      const w = this.weather
      const reading =
        d.type === "Sonda de humedad" ? `${p.measured.toFixed(1)} % · ${p.soilTemp.toFixed(1)} °C`
          : d.type === "Caudalímetro" ? (d.offline ? "Sin datos" : `${p.flow.toFixed(1)} m³/h`)
            : d.type === "Estación meteorológica" ? `${w.airTemp.toFixed(1)} °C · ${Math.round(w.humidity)} % HR · ${Math.round(w.wind)} km/h`
              : d.type === "Trampa inteligente" ? `${Math.round(p.traps)} capturas/24 h`
                : `Δ hoja-aire ${p.moisture < p.seed.low ? "+" : "-"}${(Math.abs(w.airTemp - 30) / 6 + 0.4).toFixed(1)} °C`
      return {
        id: d.id, type: d.type, plot: p.seed.name, plotId: d.plotId, battery: Math.round(d.battery), signal: d.offline ? 0 : Math.round(Math.min(100, Math.max(40, d.signal + this.gauss(2)))),
        status: d.offline ? "Sin señal" : d.battery < 20 ? "Atención" : "Conectado",
        last: d.offline ? "hace 3 h" : mins <= 1 ? "hace 1 min" : `hace ${mins} min`, calibrationOffset: d.offset ?? 0, reading,
      }
    })

    const rain24 = this.rainLog.reduce((a, b) => a + b, 0)
    const w = this.weather
    return {
      runId: this.runId,
      simTime: new Date(this.sim).toISOString(),
      serverTime: new Date().toISOString(),
      speed: this.speed,
      paused: this.paused,
      scenario: { ...SCENARIOS.find((s) => s.id === this.scenario)!, startedAt: this.scenarioStartedAt ? new Date(this.scenarioStartedAt).toISOString() : null },
      weather: {
        airTemp: round(w.airTemp), humidity: Math.round(w.humidity), wind: round(w.wind), radiation: Math.round(w.radiation), et0Today: round(this.et0Today), rainLast24h: round(rain24),
        summary: this.rainLog.slice(-12).reduce((a, b) => a + b, 0) > 0.5 ? "Lluvia" : w.airTemp >= 36 ? "Calor extremo" : w.radiation < 50 ? "Noche despejada" : this.scenario === "pest" ? "Nuboso y húmedo" : "Soleado",
      },
      plots,
      alerts,
      devices,
      impact: this.impact(),
      events: [...this.events],
    }
  }

  private impact(): DemoImpact {
    const area = this.plots.reduce((a, p) => a + p.seed.area, 0)
    const applied = this.plots.reduce((a, p) => a + p.applied, 0)
    const baseline = this.plots.reduce((a, p) => a + p.baseline, 0)
    const saved = baseline - applied
    const pct = baseline > 1 ? Math.max(-50, Math.min(45, (saved / baseline) * 100)) : 0
    const days = (this.sim - this.impactSince) / (24 * HOUR)
    const weighted = (by: Record<string, number>) => this.plots.reduce((a, p) => a + p.seed.area * by[p.seed.crop], 0) / area
    const pctProj = days < 1 ? 20 : Math.max(0, Math.min(40, pct))
    const baselineHa = weighted(IMPACT.baseline)
    const savedHa = (baselineHa * pctProj) / 100
    const waterEur = savedHa * IMPACT.waterPrice
    const energyEur = savedHa * IMPACT.energy
    const fertEur = (IMPACT.fertilizer * IMPACT.fertilizerPct) / 100
    const lossesEur = (weighted(IMPACT.cropValue) * IMPACT.lossesPct) / 100
    const total = waterEur + energyEur + fertEur + lossesEur
    const sub = IMPACT.subscription
    return {
      totalAreaHa: round(area), simulatedDays: round(days), waterAppliedM3: Math.round(applied), waterBaselineM3: Math.round(baseline),
      waterSavedM3: Math.round(saved), waterSavedPct: round(pct), alertsRaised: this.raised, alertsActedOn: this.actedOn, healthProtectedPts: round(this.healthProtected),
      perHa: {
        waterSavedM3: Math.round(savedHa), waterEur: Math.round(waterEur), energyEur: Math.round(energyEur), fertilizerEur: Math.round(fertEur),
        lossesAvoidedEur: Math.round(lossesEur), totalBenefitEur: Math.round(total), subscriptionEur: sub, netBenefitEur: Math.round(total - sub),
        roi: round(total / sub, 2), paybackMonths: round(sub / (total / 12)),
      },
      assumptions: {
        waterPriceEurM3: IMPACT.waterPrice, energyEurM3: IMPACT.energy, baselineWaterM3HaYear: Math.round(baselineHa), fertilizerEurHaYear: IMPACT.fertilizer,
        fertilizerSavingPct: IMPACT.fertilizerPct, cropValueEurHa: Math.round(weighted(IMPACT.cropValue)), lossesAvoidedPct: IMPACT.lossesPct, subscriptionEurHaYear: sub,
        source: "Estimaciones de demo · tarifa del estudio de pricing (490 €/ha/año, tramo 10–30 ha)",
      },
    }
  }
}
