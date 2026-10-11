export type Severity = "critical" | "warning" | "info" | "success"

export type Plot = {
  id: string
  name: string
  crop: string
  variety: string
  area: number
  health: number
  moisture: number
  trend: number[]
  phase: string
  stress: Severity
  growth: number
  owner: string
}

export type AlertItem = {
  id: string
  title: string
  description: string
  plotId: string
  severity: Severity
  category: "Riego" | "Sanidad" | "Labor" | "Dispositivo"
  time: string
  recommendation: string
  reading: string
}

export const plots: Plot[] = [
  {
    id: "p1",
    name: "La Umbría",
    crop: "Aguacate",
    variety: "Hass",
    area: 8.4,
    health: 92,
    moisture: 41,
    trend: [46, 44, 43, 39, 36, 38, 41],
    phase: "Engorde de fruto",
    stress: "warning",
    growth: 78,
    owner: "Finca El Manantial",
  },
  {
    id: "p2",
    name: "Los Naranjos",
    crop: "Aguacate",
    variety: "Hass",
    area: 5.2,
    health: 97,
    moisture: 56,
    trend: [51, 54, 52, 55, 58, 57, 56],
    phase: "Engorde de fruto",
    stress: "success",
    growth: 84,
    owner: "Finca El Manantial",
  },
  {
    id: "p3",
    name: "Loma Alta",
    crop: "Pitaya",
    variety: "Roja",
    area: 3.7,
    health: 71,
    moisture: 29,
    trend: [43, 40, 38, 34, 31, 28, 29],
    phase: "Floración",
    stress: "critical",
    growth: 66,
    owner: "Cortijo del Sol",
  },
  {
    id: "p4",
    name: "El Molino",
    crop: "Pitaya",
    variety: "Amarilla",
    area: 4.9,
    health: 88,
    moisture: 47,
    trend: [42, 44, 43, 45, 46, 48, 47],
    phase: "Cuajado",
    stress: "info",
    growth: 72,
    owner: "Cortijo del Sol",
  },
]

export const alerts: AlertItem[] = [
  {
    id: "a1",
    title: "Estrés hídrico elevado",
    description:
      "La humedad se mantiene por debajo del umbral durante 6 horas.",
    plotId: "p3",
    severity: "critical",
    category: "Riego",
    time: "Hace 18 min",
    recommendation: "Iniciar riego sector 3 durante 35 minutos",
    reading: "29% humedad · umbral 34%",
  },
  {
    id: "a2",
    title: "Riesgo de Phytophthora",
    description:
      "Las condiciones de suelo y temperatura aumentan el riesgo fitosanitario.",
    plotId: "p1",
    severity: "warning",
    category: "Sanidad",
    time: "Hace 2 h",
    recommendation: "Revisar cuello y raíces en la zona norte",
    reading: "Riesgo estimado 68%",
  },
  {
    id: "a3",
    title: "Ventana óptima de poda",
    description:
      "La previsión meteorológica favorece la actuación durante las próximas 48 h.",
    plotId: "p2",
    severity: "info",
    category: "Labor",
    time: "Hoy, 07:20",
    recommendation: "Programar poda ligera de mantenimiento",
    reading: "Viento < 12 km/h · sin lluvia",
  },
  {
    id: "a4",
    title: "Batería de sonda baja",
    description:
      "La sonda HUM-024 puede dejar de transmitir en los próximos días.",
    plotId: "p4",
    severity: "warning",
    category: "Dispositivo",
    time: "Ayer, 18:42",
    recommendation: "Sustituir batería de la sonda HUM-024",
    reading: "Batería 14%",
  },
]

export const devices = [
  {
    id: "HUM-018",
    type: "Sonda de humedad",
    plot: "La Umbría",
    battery: 82,
    signal: 94,
    status: "Conectado",
    last: "hace 3 min",
  },
  {
    id: "MET-003",
    type: "Estación meteorológica",
    plot: "Los Naranjos",
    battery: 100,
    signal: 88,
    status: "Conectado",
    last: "hace 1 min",
  },
  {
    id: "HUM-024",
    type: "Sonda de humedad",
    plot: "El Molino",
    battery: 14,
    signal: 72,
    status: "Atención",
    last: "hace 12 min",
  },
  {
    id: "CAU-009",
    type: "Caudalímetro",
    plot: "Loma Alta",
    battery: 67,
    signal: 0,
    status: "Sin señal",
    last: "hace 3 h",
  },
  {
    id: "FOL-011",
    type: "Sensor foliar",
    plot: "La Umbría",
    battery: 73,
    signal: 91,
    status: "Conectado",
    last: "hace 6 min",
  },
]

export const users = [
  {
    name: "Elena Ruiz",
    role: "Responsable agronómica",
    farm: "Todas",
    status: "Activo",
    initials: "ER",
  },
  {
    name: "Miguel Torres",
    role: "Responsable de riego",
    farm: "El Manantial",
    status: "Activo",
    initials: "MT",
  },
  {
    name: "Lucía Moreno",
    role: "Dirección de explotación",
    farm: "Cortijo del Sol",
    status: "Activo",
    initials: "LM",
  },
  {
    name: "Antonio Vega",
    role: "Operario",
    farm: "El Manantial",
    status: "Invitado",
    initials: "AV",
  },
  {
    name: "Sara Campos",
    role: "Operaria",
    farm: "Cortijo del Sol",
    status: "Activo",
    initials: "SC",
  },
]

export const rules = [
  {
    id: "r1",
    name: "Estrés hídrico crítico",
    crop: "Pitaya",
    condition: "Humedad < 34% durante 4 h",
    severity: "Crítica",
    active: true,
    triggered: "Hoy, 09:42",
  },
  {
    id: "r2",
    name: "Riesgo de asfixia radicular",
    crop: "Aguacate",
    condition: "Humedad > 72% durante 8 h",
    severity: "Alta",
    active: true,
    triggered: "Hace 12 días",
  },
  {
    id: "r3",
    name: "Ventana favorable de poda",
    crop: "Todos",
    condition: "Viento < 15 km/h y sin lluvia",
    severity: "Informativa",
    active: true,
    triggered: "Hoy, 07:20",
  },
  {
    id: "r4",
    name: "Protección por helada",
    crop: "Todos",
    condition: "Temperatura < 2 °C",
    severity: "Crítica",
    active: false,
    triggered: "Sin activaciones",
  },
]
