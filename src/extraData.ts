/* =========================================================================
   Datos de ejemplo para las pantallas añadidas en la Entrega 2:
   registro de actuaciones (APP-05), API/ERP del cliente (APP-08),
   CRM (APP-06), ERP interno Odoo (APP-11), servicio de terceros (APP-09)
   y soporte a usuario (APP-10).
   ========================================================================= */

export type Resolution = {
  status: "accepted" | "rejected"
  reason?: string
  note?: string
  synced: boolean
  date: string
}

export type ActuationLog = {
  id: string
  plot: string
  action: string
  origin: "Manual" | "Automática" | "Recomendación aceptada"
  requestedBy: string
  date: string
  result: "Confirmada" | "En curso" | "Error de campo" | "Anulada"
  detail?: string
}

export type ErpDataset = {
  id: string
  name: string
  description: string
  enabled: boolean
  lastSent: string
}

export type ApiEndpoint = {
  method: "GET" | "POST"
  path: string
  description: string
  scope: string
}

export type LeadStage = "Cliente potencial" | "Propuesta" | "Negociación" | "Contratado"

export type Lead = {
  id: string
  company: string
  type: "Cooperativa" | "Empresa agrícola" | "Explotación familiar"
  contact: string
  region: string
  hectares: number
  stage: LeadStage
  value: number
  next: string
}

export type ClientAccount = {
  id: string
  name: string
  type: "Cooperativa" | "Empresa agrícola" | "Explotación familiar"
  plan: "Básico" | "Profesional" | "Cooperativa"
  plots: number
  sensors: number
  monthly: number
  contractEnd: string
  status: "Activo" | "Alta en curso" | "Impago" | "Baja solicitada"
  owner: string
}

export type Invoice = {
  id: string
  client: string
  concept: string
  amount: number
  issued: string
  due: string
  status: "Pagada" | "Pendiente" | "Vencida"
}

export type Supplier = {
  id: string
  name: string
  category: "Asesoría agronómica" | "Mantenimiento" | "Reparación" | "Hardware IoT" | "Insumos"
  region: string
  contact: string
  rating: number
  active: boolean
}

export type PurchaseOrder = {
  id: string
  supplier: string
  items: string
  amount: number
  date: string
  channel: "Portal proveedor (APP-09)" | "Correo" | "Manual"
  status: "Borrador" | "Enviado" | "Confirmado" | "Recibido"
}

export type InventoryItem = {
  serial: string
  model: string
  kind: "Sonda de humedad" | "Estación meteorológica" | "Caudalímetro" | "Gateway LoRaWAN" | "Electroválvula"
  location: "Almacén" | "Instalado" | "En reparación"
  client?: string
  plot?: string
  firmware: string
}

export type BackofficeTicket = {
  id: string
  client: string
  subject: string
  category: string
  priority: "Alta" | "Media" | "Baja"
  status: "Abierto" | "En curso" | "Esperando cliente" | "Cerrado"
  agent: string
  opened: string
}

export type InternalUser = {
  id: string
  name: string
  email: string
  role: "Administración" | "Soporte" | "Técnico de instalación" | "Agrónomo" | "Comercial" | "Finanzas"
  status: "Activo" | "Invitado" | "Suspendido"
  lastAccess: string
}

export const initialActuations: ActuationLog[] = [
  {
    id: "act-108",
    plot: "Loma Alta",
    action: "Riego sector 3 · 25 min",
    origin: "Automática",
    requestedBy: "Regla «Humedad crítica aguacate»",
    date: "Hoy, 07:40",
    result: "Confirmada",
    detail: "Electroválvula EV-12 confirmó apertura y cierre. Caudal medio 3,1 m³/h.",
  },
  {
    id: "act-107",
    plot: "La Umbría",
    action: "Apertura válvula norte · 15 min",
    origin: "Manual",
    requestedBy: "Antonio Pérez (Responsable de riego)",
    date: "Ayer, 19:05",
    result: "Confirmada",
  },
  {
    id: "act-106",
    plot: "El Molino",
    action: "Programa anti-heladas",
    origin: "Automática",
    requestedBy: "Regla «Riesgo de helada»",
    date: "Ayer, 05:12",
    result: "Anulada",
    detail: "Anulada por intervención manual de Elena Ruiz: la previsión se corrigió a 3 °C.",
  },
  {
    id: "act-105",
    plot: "Los Naranjos",
    action: "Riego sector 1 · 20 min",
    origin: "Recomendación aceptada",
    requestedBy: "Elena Ruiz (Responsable agronómica)",
    date: "14 may, 08:30",
    result: "Error de campo",
    detail: "Sin confirmación del actuador EV-04 tras 3 reintentos. Se abrió solicitud de mantenimiento.",
  },
]

export const initialErpDatasets: ErpDataset[] = [
  {
    id: "erp-1",
    name: "Predicción de cosecha",
    description: "Toneladas estimadas por parcela y ventana de recolección.",
    enabled: true,
    lastSent: "Hoy, 06:00",
  },
  {
    id: "erp-2",
    name: "Consumo de recursos",
    description: "Agua (m³) e insumos aplicados por parcela y semana.",
    enabled: true,
    lastSent: "Hoy, 06:00",
  },
  {
    id: "erp-3",
    name: "Necesidades previstas",
    description: "Previsión de insumos y mano de obra para las próximas 4 semanas.",
    enabled: false,
    lastSent: "Nunca",
  },
  {
    id: "erp-4",
    name: "Estructura de explotaciones",
    description: "Explotaciones, parcelas, cultivos y superficies.",
    enabled: true,
    lastSent: "12 may",
  },
]

export const apiEndpoints: ApiEndpoint[] = [
  { method: "GET", path: "/v1/explotaciones", description: "Listado de explotaciones y parcelas", scope: "farms:read" },
  { method: "GET", path: "/v1/parcelas/{id}/mediciones", description: "Serie temporal de mediciones", scope: "telemetry:read" },
  { method: "GET", path: "/v1/predicciones/cosecha", description: "Predicciones de producción", scope: "predictions:read" },
  { method: "GET", path: "/v1/consumos", description: "Consumo de agua e insumos", scope: "consumption:read" },
  { method: "POST", path: "/v1/webhooks", description: "Suscripción a eventos de alertas", scope: "alerts:subscribe" },
]

export const initialLeads: Lead[] = [
  { id: "ld-1", company: "SAT Axarquía Tropical", type: "Cooperativa", contact: "María Gómez", region: "Málaga", hectares: 340, stage: "Negociación", value: 1890, next: "Reunión técnica 22 may" },
  { id: "ld-2", company: "Hermanos Ortega", type: "Explotación familiar", contact: "Luis Ortega", region: "Granada", hectares: 18, stage: "Propuesta", value: 149, next: "Enviar propuesta revisada" },
  { id: "ld-3", company: "Agrícola Campo de Níjar", type: "Empresa agrícola", contact: "Rocío Martín", region: "Almería", hectares: 95, stage: "Cliente potencial", value: 620, next: "Primera llamada" },
  { id: "ld-4", company: "Olivares del Genil", type: "Cooperativa", contact: "Pedro Ruiz", region: "Córdoba", hectares: 520, stage: "Cliente potencial", value: 2400, next: "Demo en feria Expoliva" },
  { id: "ld-5", company: "Finca Las Adelfas", type: "Explotación familiar", contact: "Carmen Vidal", region: "Málaga", hectares: 12, stage: "Contratado", value: 99, next: "Instalación 27 may" },
]

export const initialClients: ClientAccount[] = [
  { id: "cl-1", name: "Cooperativa Valle Verde", type: "Cooperativa", plan: "Cooperativa", plots: 4, sensors: 20, monthly: 890, contractEnd: "31 dic 2026", status: "Activo", owner: "Sara León" },
  { id: "cl-2", name: "Subtropicales del Sol", type: "Empresa agrícola", plan: "Profesional", plots: 9, sensors: 34, monthly: 640, contractEnd: "30 jun 2026", status: "Activo", owner: "Sara León" },
  { id: "cl-3", name: "Finca Los Almendros", type: "Explotación familiar", plan: "Básico", plots: 2, sensors: 6, monthly: 99, contractEnd: "15 mar 2026", status: "Impago", owner: "Iván Prieto" },
  { id: "cl-4", name: "Finca Las Adelfas", type: "Explotación familiar", plan: "Básico", plots: 1, sensors: 4, monthly: 99, contractEnd: "27 may 2027", status: "Alta en curso", owner: "Iván Prieto" },
]

export const initialInvoices: Invoice[] = [
  { id: "FAC-2025-0412", client: "Cooperativa Valle Verde", concept: "Suscripción plan Cooperativa · mayo", amount: 890, issued: "1 may", due: "31 may", status: "Pendiente" },
  { id: "FAC-2025-0411", client: "Subtropicales del Sol", concept: "Suscripción plan Profesional · mayo", amount: 640, issued: "1 may", due: "31 may", status: "Pagada" },
  { id: "FAC-2025-0398", client: "Finca Los Almendros", concept: "Suscripción plan Básico · abril", amount: 99, issued: "1 abr", due: "30 abr", status: "Vencida" },
  { id: "FAC-2025-0390", client: "Cooperativa Valle Verde", concept: "Instalación 6 sondas adicionales", amount: 1380, issued: "18 abr", due: "18 may", status: "Pagada" },
  { id: "FAC-2025-0377", client: "Subtropicales del Sol", concept: "Suscripción plan Profesional · abril", amount: 640, issued: "1 abr", due: "30 abr", status: "Pagada" },
]

export const initialSuppliers: Supplier[] = [
  { id: "sp-1", name: "AgroLab Sur", category: "Asesoría agronómica", region: "Málaga", contact: "lab@agrolabsur.es", rating: 4.8, active: true },
  { id: "sp-2", name: "SenseField", category: "Hardware IoT", region: "Sevilla", contact: "pedidos@sensefield.io", rating: 4.5, active: true },
  { id: "sp-3", name: "RiegoTec Mantenimiento", category: "Mantenimiento", region: "Málaga", contact: "avisos@riegotec.es", rating: 4.2, active: true },
  { id: "sp-4", name: "Electro Campo Reparaciones", category: "Reparación", region: "Granada", contact: "taller@electrocampo.es", rating: 3.9, active: true },
  { id: "sp-5", name: "Fertiandalucía", category: "Insumos", region: "Almería", contact: "comercial@fertiandalucia.es", rating: 4.1, active: false },
]

export const initialPurchaseOrders: PurchaseOrder[] = [
  { id: "PO-0087", supplier: "SenseField", items: "40 sondas de humedad SF-200 · 4 gateways", amount: 6840, date: "Hoy", channel: "Portal proveedor (APP-09)", status: "Enviado" },
  { id: "PO-0086", supplier: "RiegoTec Mantenimiento", items: "Contrato de mantenimiento trimestral", amount: 1200, date: "10 may", channel: "Correo", status: "Confirmado" },
  { id: "PO-0085", supplier: "SenseField", items: "12 electroválvulas EV-1\"", amount: 1560, date: "2 may", channel: "Portal proveedor (APP-09)", status: "Recibido" },
]

export const initialInventory: InventoryItem[] = [
  { serial: "SF200-00931", model: "SenseField SF-200", kind: "Sonda de humedad", location: "Instalado", client: "Cooperativa Valle Verde", plot: "Loma Alta", firmware: "2.4.1" },
  { serial: "SF200-00932", model: "SenseField SF-200", kind: "Sonda de humedad", location: "Instalado", client: "Cooperativa Valle Verde", plot: "La Umbría", firmware: "2.4.1" },
  { serial: "GW8-00112", model: "Kerlink iStation", kind: "Gateway LoRaWAN", location: "Instalado", client: "Subtropicales del Sol", plot: "Sector Este", firmware: "5.1.0" },
  { serial: "CAU-00045", model: "Hidro Q-40", kind: "Caudalímetro", location: "En reparación", client: "Cooperativa Valle Verde", plot: "Loma Alta", firmware: "1.9.3" },
  { serial: "EV1-00210", model: "Electroválvula EV-1\"", kind: "Electroválvula", location: "Almacén", firmware: "—" },
  { serial: "SF200-01004", model: "SenseField SF-200", kind: "Sonda de humedad", location: "Almacén", firmware: "2.4.1" },
  { serial: "MET-00031", model: "Davis Vantage Pro2", kind: "Estación meteorológica", location: "Almacén", firmware: "3.0.0" },
]

export const initialBackofficeTickets: BackofficeTicket[] = [
  { id: "SUP-2210", client: "Subtropicales del Sol", subject: "No llegan notificaciones push al móvil", category: "Aplicación", priority: "Media", status: "En curso", agent: "Nuria Campos", opened: "Hoy, 09:12" },
  { id: "SUP-2207", client: "Finca Los Almendros", subject: "Consulta sobre la factura de abril", category: "Facturación", priority: "Baja", status: "Esperando cliente", agent: "Nuria Campos", opened: "Ayer" },
  { id: "SUP-2199", client: "Cooperativa Valle Verde", subject: "Alta de 3 operarios nuevos", category: "Usuarios y accesos", priority: "Baja", status: "Cerrado", agent: "Javier Soto", opened: "9 may" },
]

export const initialInternalUsers: InternalUser[] = [
  { id: "iu-1", name: "Laura Méndez", email: "laura.mendez@neutron.ag", role: "Administración", status: "Activo", lastAccess: "Hace 5 min" },
  { id: "iu-2", name: "Nuria Campos", email: "nuria.campos@neutron.ag", role: "Soporte", status: "Activo", lastAccess: "Hace 12 min" },
  { id: "iu-3", name: "Javier Soto", email: "javier.soto@neutron.ag", role: "Soporte", status: "Activo", lastAccess: "Hoy, 08:40" },
  { id: "iu-4", name: "Rubén Castillo", email: "ruben.castillo@neutron.ag", role: "Técnico de instalación", status: "Activo", lastAccess: "Ayer" },
  { id: "iu-5", name: "Ana Belén Torres", email: "ana.torres@neutron.ag", role: "Agrónomo", status: "Activo", lastAccess: "Hoy, 10:02" },
  { id: "iu-6", name: "Sara León", email: "sara.leon@neutron.ag", role: "Comercial", status: "Activo", lastAccess: "Hoy, 09:30" },
  { id: "iu-7", name: "Iván Prieto", email: "ivan.prieto@neutron.ag", role: "Comercial", status: "Invitado", lastAccess: "—" },
  { id: "iu-8", name: "Marta Gil", email: "marta.gil@neutron.ag", role: "Finanzas", status: "Activo", lastAccess: "Ayer" },
]
