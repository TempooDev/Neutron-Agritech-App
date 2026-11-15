// Tipos del modo demo en vivo. Reflejan los DTOs de aspire/Neutron.DemoApi/Simulation/Models.cs.
import type { Severity } from "../data"

export type DemoSource = "connecting" | "api" | "local"

export type DemoWeather = {
  airTemp: number
  humidity: number
  wind: number
  radiation: number
  et0Today: number
  rainLast24h: number
  summary: string
}

export type DemoPlot = {
  id: string
  name: string
  crop: string
  variety: string
  area: number
  owner: string
  phase: string
  sector: number
  moisture: number
  soilTemp: number
  health: number
  growth: number
  stress: Severity
  trend: number[]
  trend30: number[]
  irrigating: boolean
  flowM3h: number
  nominalFlowM3h: number
  phytoRisk: number
  trapCount: number
  lowThreshold: number
  highThreshold: number
}

export type DemoAlert = {
  id: string
  ruleId: string
  title: string
  description: string
  plotId: string
  severity: Severity
  category: "Riego" | "Sanidad" | "Labor" | "Dispositivo"
  time: string
  recommendation: string
  reading: string
  raisedAt: string
  resolved: boolean
  irrigationMinutes?: number | null
}

export type DemoDevice = {
  id: string
  type: string
  plot: string
  plotId: string
  battery: number
  signal: number
  status: "Conectado" | "Atención" | "Sin señal"
  last: string
  calibrationOffset: number
  reading: string
}

export type DemoEvent = { simTime: string; kind: string; text: string }

export type DemoScenario = {
  id: string
  label: string
  description: string
  startedAt?: string | null
}

export type DemoImpact = {
  totalAreaHa: number
  simulatedDays: number
  waterAppliedM3: number
  waterBaselineM3: number
  waterSavedM3: number
  waterSavedPct: number
  alertsRaised: number
  alertsActedOn: number
  healthProtectedPts: number
  perHa: {
    waterSavedM3: number
    waterEur: number
    energyEur: number
    fertilizerEur: number
    lossesAvoidedEur: number
    totalBenefitEur: number
    subscriptionEur: number
    netBenefitEur: number
    roi: number
    paybackMonths: number
  }
  assumptions: {
    waterPriceEurM3: number
    energyEurM3: number
    baselineWaterM3HaYear: number
    fertilizerEurHaYear: number
    fertilizerSavingPct: number
    cropValueEurHa: number
    lossesAvoidedPct: number
    subscriptionEurHaYear: number
    source: string
  }
}

export type DemoSnapshot = {
  runId: string
  simTime: string
  serverTime: string
  speed: number
  paused: boolean
  scenario: DemoScenario
  weather: DemoWeather
  plots: DemoPlot[]
  alerts: DemoAlert[]
  devices: DemoDevice[]
  impact: DemoImpact
  events: DemoEvent[]
}

export const SCENARIOS: DemoScenario[] = [
  {
    id: "normal",
    label: "Condiciones normales",
    description: "Clima mediterráneo templado, riego programado a las 06:00.",
  },
  {
    id: "heatwave",
    label: "Ola de calor",
    description:
      "Máximas de 40 °C, humedad muy baja y viento de poniente. La ETc casi se duplica.",
  },
  {
    id: "pest",
    label: "Brote de plaga",
    description:
      "Lluvia y humedad alta en El Manantial (Phytophthora) y repunte de trips en El Molino.",
  },
  {
    id: "irrigation-failure",
    label: "Fallo de riego",
    description:
      "Rotura en la tubería del sector 2: el caudalímetro marca de más y la humedad no sube.",
  },
]
