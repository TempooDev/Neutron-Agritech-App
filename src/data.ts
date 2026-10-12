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
  soil?: string
  irrigationSystem?: string
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

export type DeviceItem = {
  id: string
  type: string
  plot: string
  battery: number
  signal: number
  status: "Conectado" | "Atención" | "Sin señal"
  last: string
  calibrationOffset?: number
}

export type UserItem = {
  id: string
  name: string
  email: string
  role: string
  farm: string
  status: "Activo" | "Invitado"
  initials: string
}

export type RuleItem = {
  id: string
  name: string
  crop: string
  condition: string
  severity: "Crítica" | "Alta" | "Informativa"
  active: boolean
  triggered: string
  autoAction?: boolean
}

export type SupportTicket = {
  id: string
  subject: string
  category: string
  description?: string
  status: "Abierto" | "En revisión" | "Pendiente de envío" | "Resuelto"
  date: string
  replies?: { from: string; text: string; time: string }[]
}

export type AssistanceRequest = {
  id: string
  name: string
  provider: string
  status: "En curso" | "Asignada" | "Resuelta"
  priority: "Alta" | "Media" | "Baja"
  date: string
  details?: string
}

export type ReportItem = {
  id: string
  name: string
  type: string
  farm: string
  period: string
  format: "PDF" | "XLSX" | "CSV"
  size: string
  date: string
}

export type IntegrationItem = {
  id: string
  name: string
  category: string
  status: "Conectado" | "Disponible" | "Pausado"
  detail: string
  apiKey?: string
  syncFreq?: string
  lastSync?: string
}

export type SystemNotification = {
  id: string
  title: string
  message: string
  time: string
  type: Severity
  read: boolean
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
    soil: "Franco-arenoso",
    irrigationSystem: "Goteo autocompensante",
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
    soil: "Franco-arcilloso",
    irrigationSystem: "Goteo sectorizado",
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
    soil: "Franco-pedregoso",
    irrigationSystem: "Microaspersión y goteo",
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
    soil: "Franco-limoso",
    irrigationSystem: "Goteo localizado",
  },
]

export const alerts: AlertItem[] = [
  {
    id: "a1",
    title: "Estrés hídrico elevado",
    description:
      "La humedad se mantiene por debajo del umbral durante 6 horas continuas.",
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
      "Las condiciones de humedad relativa y temperatura radicular elevan el riesgo fúngico.",
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
      "La previsión meteorológica favorece la cicatrización durante las próximas 48 horas.",
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
      "La sonda HUM-024 puede dejar de transmitir en las próximas 48 horas si no se recarga.",
    plotId: "p4",
    severity: "warning",
    category: "Dispositivo",
    time: "Ayer, 18:42",
    recommendation: "Sustituir batería o limpiar panel solar de HUM-024",
    reading: "Batería 14%",
  },
]

export const devices: DeviceItem[] = [
  {
    id: "HUM-018",
    type: "Sonda de humedad",
    plot: "La Umbría",
    battery: 82,
    signal: 94,
    status: "Conectado",
    last: "hace 3 min",
    calibrationOffset: 0,
  },
  {
    id: "MET-003",
    type: "Estación meteorológica",
    plot: "Los Naranjos",
    battery: 100,
    signal: 88,
    status: "Conectado",
    last: "hace 1 min",
    calibrationOffset: 0,
  },
  {
    id: "HUM-024",
    type: "Sonda de humedad",
    plot: "El Molino",
    battery: 14,
    signal: 72,
    status: "Atención",
    last: "hace 12 min",
    calibrationOffset: -2,
  },
  {
    id: "CAU-009",
    type: "Caudalímetro",
    plot: "Loma Alta",
    battery: 67,
    signal: 0,
    status: "Sin señal",
    last: "hace 3 h",
    calibrationOffset: 1,
  },
  {
    id: "FOL-011",
    type: "Sensor foliar",
    plot: "La Umbría",
    battery: 73,
    signal: 91,
    status: "Conectado",
    last: "hace 6 min",
    calibrationOffset: 0,
  },
]

export const users: UserItem[] = [
  {
    id: "u1",
    name: "Elena Ruiz",
    email: "elena.ruiz@valleverde.es",
    role: "Responsable agronómica",
    farm: "Todas",
    status: "Activo",
    initials: "ER",
  },
  {
    id: "u2",
    name: "Miguel Torres",
    email: "miguel.torres@valleverde.es",
    role: "Responsable de riego",
    farm: "Finca El Manantial",
    status: "Activo",
    initials: "MT",
  },
  {
    id: "u3",
    name: "Lucía Moreno",
    email: "lucia.moreno@valleverde.es",
    role: "Dirección de explotación",
    farm: "Cortijo del Sol",
    status: "Activo",
    initials: "LM",
  },
  {
    id: "u4",
    name: "Antonio Vega",
    email: "antonio.vega@valleverde.es",
    role: "Operario",
    farm: "Finca El Manantial",
    status: "Invitado",
    initials: "AV",
  },
  {
    id: "u5",
    name: "Sara Campos",
    email: "sara.campos@valleverde.es",
    role: "Operaria",
    farm: "Cortijo del Sol",
    status: "Activo",
    initials: "SC",
  },
]

export const rules: RuleItem[] = [
  {
    id: "r1",
    name: "Estrés hídrico crítico",
    crop: "Pitaya",
    condition: "Humedad < 34% durante 4 h",
    severity: "Crítica",
    active: true,
    triggered: "Hoy, 09:42",
    autoAction: true,
  },
  {
    id: "r2",
    name: "Riesgo de asfixia radicular",
    crop: "Aguacate",
    condition: "Humedad > 72% durante 8 h",
    severity: "Alta",
    active: true,
    triggered: "Hace 12 días",
    autoAction: false,
  },
  {
    id: "r3",
    name: "Ventana favorable de poda",
    crop: "Todos",
    condition: "Viento < 15 km/h y sin lluvia",
    severity: "Informativa",
    active: true,
    triggered: "Hoy, 07:20",
    autoAction: false,
  },
  {
    id: "r4",
    name: "Protección por helada",
    crop: "Todos",
    condition: "Temperatura < 2 °C",
    severity: "Crítica",
    active: false,
    triggered: "Sin activaciones",
    autoAction: true,
  },
]

export const initialTickets: SupportTicket[] = [
  {
    id: "VV-1042",
    subject: "Lecturas irregulares en sonda HUM-024",
    category: "Dispositivo o sensor",
    description:
      "La sonda marca saltos de 15% de humedad entre mediciones consecutivas.",
    status: "En revisión",
    date: "12 may",
    replies: [
      {
        from: "Soporte Técnico",
        text: "Hemos verificado la señal de telemetría y sugerimos una recalibración a cero o revisión de raíces alrededor del sensor.",
        time: "12 may, 14:30",
      },
    ],
  },
]

export const initialAssistanceRequests: AssistanceRequest[] = [
  {
    id: "ast-1",
    name: "Revisión de caudalímetro CAU-009",
    provider: "SenseField",
    status: "En curso",
    priority: "Alta",
    date: "Hoy, 10:15",
    details:
      "Pérdida de conectividad LoRaWAN desde hace 3 horas en sector Loma Alta.",
  },
  {
    id: "ast-2",
    name: "Análisis de riesgo Phytophthora",
    provider: "AgroLab Sur",
    status: "Asignada",
    priority: "Media",
    date: "Ayer, 16:40",
    details: "Muestreo de suelo y raíces en parcela La Umbría sector norte.",
  },
  {
    id: "ast-3",
    name: "Validación de datos meteorológicos",
    provider: "AEMET Agro",
    status: "Resuelta",
    priority: "Baja",
    date: "10 may",
    details:
      "Ajuste de pluviometría de referencia para la cuenca del Guadalhorce.",
  },
]

export const initialReports: ReportItem[] = [
  {
    id: "rep-1",
    name: "Consumo hídrico · Abril 2025",
    type: "Consumo hídrico y eficiencia",
    farm: "Finca El Manantial",
    period: "Abril 2025",
    format: "PDF",
    size: "2,4 MB",
    date: "12 may 2025",
  },
  {
    id: "rep-2",
    name: "Trazabilidad de insumos · T1",
    type: "Uso de insumos",
    farm: "Todas las explotaciones",
    period: "Primer Trimestre 2025",
    format: "XLSX",
    size: "846 KB",
    date: "03 abr 2025",
  },
  {
    id: "rep-3",
    name: "Memoria ambiental · Campaña 2024",
    type: "Cumplimiento ambiental",
    farm: "Todas las explotaciones",
    period: "Campaña 2024",
    format: "PDF",
    size: "4,1 MB",
    date: "18 feb 2025",
  },
  {
    id: "rep-4",
    name: "Justificación inversión IoT",
    type: "Trazabilidad de actuaciones",
    farm: "Cortijo del Sol",
    period: "Anual 2024",
    format: "PDF",
    size: "1,8 MB",
    date: "29 ene 2025",
  },
]

export const initialIntegrations: IntegrationItem[] = [
  {
    id: "int-1",
    name: "AEMET Agro",
    category: "Meteorología",
    status: "Conectado",
    detail:
      "Previsión horaria, radar de lluvia y avisos meteorológicos oficiales.",
    syncFreq: "Cada 15 min",
    lastSync: "Hace 4 min",
  },
  {
    id: "int-2",
    name: "AgroLab Sur",
    category: "Asesoría agronómica",
    status: "Conectado",
    detail:
      "Análisis periódico de suelo, agua de riego y diagnóstico fitopatológico.",
    syncFreq: "Diario",
    lastSync: "Hoy, 06:00",
  },
  {
    id: "int-3",
    name: "SenseField",
    category: "Hardware IoT",
    status: "Conectado",
    detail: "Gestión de sondas, gateways LoRaWAN y telemetría de campo.",
    syncFreq: "Tiempo real",
    lastSync: "Hace 1 min",
  },
  {
    id: "int-4",
    name: "Cuaderno Digital",
    category: "Cumplimiento",
    status: "Disponible",
    detail:
      "Sincronización automática de labores y tratamientos con el SIEX oficial.",
    syncFreq: "Bajo demanda",
    lastSync: "Sin sincronizar",
  },
]

export const initialNotifications: SystemNotification[] = [
  {
    id: "notif-1",
    title: "Alerta de estrés hídrico",
    message: "Loma Alta sector 3 ha caído por debajo de 30% de humedad.",
    time: "Hace 18 min",
    type: "critical",
    read: false,
  },
  {
    id: "notif-2",
    title: "Sincronización IoT",
    message: "18 de 20 dispositivos han transmitido telemetría correctamente.",
    time: "Hace 35 min",
    type: "info",
    read: false,
  },
  {
    id: "notif-3",
    title: "Regla automática ejecutada",
    message: "Ventana favorable de poda notificada al equipo de campo.",
    time: "Hace 3 h",
    type: "success",
    read: true,
  },
  {
    id: "notif-4",
    title: "Batería baja en sonda",
    message: "Sonda HUM-024 al 14% de batería restante.",
    time: "Ayer",
    type: "warning",
    read: true,
  },
]
