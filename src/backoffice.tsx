import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Handshake,
  Headphones,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Radio,
  Receipt,
  Send,
  ShoppingCart,
  Smartphone,
  Star,
  Truck,
  UserCog,
  UsersRound,
  Wallet,
  X,
} from "lucide-react"
import { useState } from "react"
import type { SupportTicket } from "./data"
import {
  initialBackofficeTickets,
  initialClients,
  initialInternalUsers,
  initialInventory,
  initialInvoices,
  initialLeads,
  initialPurchaseOrders,
  initialSuppliers,
  type BackofficeTicket,
  type ClientAccount,
  type InternalUser,
  type InventoryItem,
  type Invoice,
  type Lead,
  type LeadStage,
  type PurchaseOrder,
  type Supplier,
} from "./extraData"
import {
  AdminModal,
  AdminPageHeading,
  Badge,
  Button,
  Field,
  Input,
  KpiCard,
  Logo,
  Note,
  Segmented,
  Select,
  TableRow,
  Textarea,
  Toast,
  euro,
  type ToastState,
} from "./ui"

type BackofficeView =
  | "crm"
  | "billing"
  | "purchasing"
  | "inventory"
  | "tickets"
  | "team"

const backofficeNav: {
  group: string
  items: { id: BackofficeView; label: string; icon: typeof Menu; app: string }[]
}[] = [
  {
    group: "COMERCIAL · CRM",
    items: [
      { id: "crm", label: "Clientes y oportunidades", icon: Handshake, app: "APP-06" },
    ],
  },
  {
    group: "ECONOMÍA · ERP INTERNO",
    items: [
      { id: "billing", label: "Suscripciones y facturas", icon: Receipt, app: "APP-11" },
      { id: "purchasing", label: "Compras y proveedores", icon: ShoppingCart, app: "APP-11 · APP-09" },
    ],
  },
  {
    group: "OPERACIONES",
    items: [
      { id: "inventory", label: "Inventario de dispositivos", icon: Package, app: "APP-04" },
      { id: "tickets", label: "Soporte y tickets", icon: Headphones, app: "APP-10" },
      { id: "team", label: "Equipo interno", icon: UserCog, app: "Identidad y accesos" },
    ],
  },
]

const stages: LeadStage[] = [
  "Cliente potencial",
  "Propuesta",
  "Negociación",
  "Contratado",
]

const planPrices: Record<ClientAccount["plan"], number> = {
  Básico: 99,
  Profesional: 640,
  Cooperativa: 890,
}

/* ----------------------------------------------------------------------- */

function CrmView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [clients, setClients] = useState<ClientAccount[]>(initialClients)
  const [tab, setTab] = useState<"pipeline" | "clients">("pipeline")
  const [showLead, setShowLead] = useState(false)
  const [company, setCompany] = useState("")
  const [contact, setContact] = useState("")
  const [type, setType] = useState<Lead["type"]>("Empresa agrícola")
  const [hectares, setHectares] = useState(40)

  const advance = (lead: Lead) => {
    const next = stages[stages.indexOf(lead.stage) + 1]
    if (!next) return
    setLeads((items) =>
      items.map((l) => (l.id === lead.id ? { ...l, stage: next } : l)),
    )
    onToast({ title: `${lead.company}`, detail: `Avanza a «${next}».` })
  }

  const activate = (lead: Lead) => {
    const plan: ClientAccount["plan"] =
      lead.type === "Cooperativa"
        ? "Cooperativa"
        : lead.hectares > 50
          ? "Profesional"
          : "Básico"
    setClients((items) => [
      ...items,
      {
        id: `cl-${items.length + 1}`,
        name: lead.company,
        type: lead.type,
        plan,
        plots: Math.max(1, Math.round(lead.hectares / 20)),
        sensors: Math.max(4, Math.round(lead.hectares / 5)),
        monthly: planPrices[plan],
        contractEnd: "Pendiente de firma",
        status: "Alta en curso",
        owner: "Sara León",
      },
    ])
    setLeads((items) => items.filter((l) => l.id !== lead.id))
    setTab("clients")
    onToast({
      title: "Alta de cliente iniciada",
      detail: `Se crea la cuenta de ${lead.company} y su usuario administrador en el panel web.`,
    })
  }

  const pipelineValue = leads.reduce((sum, l) => sum + l.value, 0)
  const mrr = clients
    .filter((c) => c.status === "Activo")
    .reduce((sum, c) => sum + c.monthly, 0)

  const statusTone = (status: ClientAccount["status"]) =>
    status === "Activo"
      ? "success"
      : status === "Impago"
        ? "critical"
        : status === "Alta en curso"
          ? "info"
          : "warning"

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Clientes y oportunidades"
        subtitle="Captación, propuestas, contratos y alta de nuevas cooperativas y empresas agrícolas."
        action={
          <Button onClick={() => setShowLead(true)}>
            <Plus size={17} /> Nuevo cliente potencial
          </Button>
        }
      />
      <div className="kpi-grid">
        <KpiCard
          icon={<Briefcase />}
          label="OPORTUNIDADES ABIERTAS"
          value={String(leads.length)}
          delta={`${euro(pipelineValue)}/mes en negociación`}
          tone="amber"
        />
        <KpiCard
          icon={<Building2 />}
          label="CLIENTES"
          value={String(clients.length)}
          delta={`${clients.filter((c) => c.status === "Activo").length} activos`}
        />
        <KpiCard
          icon={<Wallet />}
          label="INGRESO RECURRENTE"
          value={euro(mrr)}
          delta="Mensual, suscripciones activas"
          tone="blue"
        />
        <KpiCard
          icon={<Radio />}
          label="SENSORES CONTRATADOS"
          value={String(clients.reduce((s, c) => s + c.sensors, 0))}
          delta={`${clients.reduce((s, c) => s + c.plots, 0)} parcelas`}
          tone="purple"
        />
      </div>

      <div className="x-gap-top">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "pipeline", label: "Embudo comercial", count: leads.length },
            { id: "clients", label: "Cartera de clientes", count: clients.length },
          ]}
        />
      </div>

      {tab === "pipeline" && (
        <div className="pipeline x-gap-top">
          {stages.map((stage) => {
            const items = leads.filter((l) => l.stage === stage)
            return (
              <div className="pipeline-col" key={stage}>
                <div className="pipeline-col-head">
                  <strong>{stage}</strong>
                  <i>{items.length}</i>
                </div>
                {items.map((lead) => (
                  <div className="pipeline-card" key={lead.id}>
                    <strong>{lead.company}</strong>
                    <span>
                      {lead.type} · {lead.region} · {lead.hectares} ha
                    </span>
                    <span>Contacto: {lead.contact}</span>
                    <small>Siguiente paso: {lead.next}</small>
                    <div className="pipeline-card-foot">
                      <b>{euro(lead.value)}/mes</b>
                      {stage === "Contratado" ? (
                        <Button onClick={() => activate(lead)}>
                          Dar de alta <ArrowRight size={14} />
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => advance(lead)}>
                          Avanzar <ArrowRight size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="pipeline-empty">Sin oportunidades</div>}
              </div>
            )
          })}
        </div>
      )}

      {tab === "clients" && (
        <div className="admin-panel table-panel x-gap-top">
          <div className="data-table">
            <TableRow columns="1.4fr .8fr .6fr .8fr .6fr .8fr .8fr" head>
              <span>CLIENTE</span>
              <span>PLAN</span>
              <span>PARCELAS</span>
              <span>SENSORES</span>
              <span>CUOTA</span>
              <span>FIN DE CONTRATO</span>
              <span>ESTADO</span>
            </TableRow>
            {clients.map((client) => (
              <TableRow columns="1.4fr .8fr .6fr .8fr .6fr .8fr .8fr" key={client.id}>
                <span className="x-stack">
                  <strong>{client.name}</strong>
                  <small>
                    {client.type} · gestor {client.owner}
                  </small>
                </span>
                <span>{client.plan}</span>
                <span>{client.plots}</span>
                <span>{client.sensors}</span>
                <span>{euro(client.monthly)}</span>
                <span>{client.contractEnd}</span>
                <span>
                  <Badge tone={statusTone(client.status)}>{client.status}</Badge>
                </span>
              </TableRow>
            ))}
          </div>
        </div>
      )}

      {showLead && (
        <AdminModal
          title="Nuevo cliente potencial"
          subtitle="Se registra en el CRM y entra en el embudo comercial."
          onClose={() => setShowLead(false)}
        >
          <form
            className="x-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!company.trim()) return
              setLeads((items) => [
                ...items,
                {
                  id: `ld-${Date.now()}`,
                  company,
                  type,
                  contact: contact || "Sin asignar",
                  region: "Andalucía",
                  hectares,
                  stage: "Cliente potencial",
                  value: Math.round(hectares * 5.5),
                  next: "Primera llamada",
                },
              ])
              setShowLead(false)
              setCompany("")
              setContact("")
              onToast({ title: "Cliente potencial creado", detail: company })
            }}
          >
            <Field label="Empresa o cooperativa">
              <Input required value={company} onChange={(e) => setCompany(e.target.value)} />
            </Field>
            <div className="form-grid-2">
              <Field label="Tipo">
                <Select value={type} onChange={(e) => setType(e.target.value as Lead["type"])}>
                  <option>Cooperativa</option>
                  <option>Empresa agrícola</option>
                  <option>Explotación familiar</option>
                </Select>
              </Field>
              <Field label="Superficie (ha)">
                <Input
                  type="number"
                  min={1}
                  value={hectares}
                  onChange={(e) => setHectares(Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Persona de contacto">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </Field>
            <div className="modal-footer">
              <Button variant="ghost" type="button" onClick={() => setShowLead(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------------- */

function BillingView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [filter, setFilter] = useState<"all" | Invoice["status"]>("all")

  const shown = invoices.filter((i) => filter === "all" || i.status === filter)
  const pending = invoices
    .filter((i) => i.status !== "Pagada")
    .reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter((i) => i.status === "Vencida")
  const collected = invoices
    .filter((i) => i.status === "Pagada")
    .reduce((s, i) => s + i.amount, 0)

  const tone = (status: Invoice["status"]) =>
    status === "Pagada" ? "success" : status === "Vencida" ? "critical" : "warning"

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Suscripciones y facturas"
        subtitle="Facturación periódica según parcelas y sensores contratados. Los datos de contrato llegan desde el CRM."
        action={
          <Button
            onClick={() => {
              const id = `FAC-2025-0${413 + invoices.length}`
              setInvoices((items) => [
                {
                  id,
                  client: "Finca Las Adelfas",
                  concept: "Suscripción plan Básico · junio",
                  amount: 99,
                  issued: "Hoy",
                  due: "En 30 días",
                  status: "Pendiente",
                },
                ...items,
              ])
              onToast({ title: "Factura emitida", detail: `${id} · Finca Las Adelfas` })
            }}
          >
            <Plus size={17} /> Emitir factura
          </Button>
        }
      />
      <div className="kpi-grid">
        <KpiCard icon={<Wallet />} label="COBRADO ESTE MES" value={euro(collected)} delta="Cobros conciliados" />
        <KpiCard icon={<Receipt />} label="PENDIENTE DE COBRO" value={euro(pending)} delta={`${invoices.filter((i) => i.status !== "Pagada").length} facturas`} tone="amber" />
        <KpiCard icon={<X />} label="VENCIDAS" value={String(overdue.length)} delta={overdue.map((i) => i.client).join(", ") || "Ninguna"} tone="purple" />
        <KpiCard icon={<BarChart3 />} label="SUSCRIPCIONES ACTIVAS" value="3" delta="Básico 1 · Profesional 1 · Cooperativa 1" tone="blue" />
      </div>
      <div className="admin-panel table-panel x-gap-top">
        <div className="table-toolbar">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "Todas", count: invoices.length },
              { id: "Pendiente", label: "Pendientes" },
              { id: "Vencida", label: "Vencidas" },
              { id: "Pagada", label: "Pagadas" },
            ]}
          />
          <Badge tone="neutral">ERP interno · Odoo</Badge>
        </div>
        <div className="data-table">
          <TableRow columns=".9fr 1.1fr 1.5fr .6fr .5fr .6fr .6fr .8fr" head>
            <span>FACTURA</span>
            <span>CLIENTE</span>
            <span>CONCEPTO</span>
            <span>IMPORTE</span>
            <span>EMITIDA</span>
            <span>VENCE</span>
            <span>ESTADO</span>
            <span />
          </TableRow>
          {shown.map((invoice) => (
            <TableRow columns=".9fr 1.1fr 1.5fr .6fr .5fr .6fr .6fr .8fr" key={invoice.id}>
              <strong>{invoice.id}</strong>
              <span>{invoice.client}</span>
              <span>{invoice.concept}</span>
              <strong>{euro(invoice.amount)}</strong>
              <span>{invoice.issued}</span>
              <span>{invoice.due}</span>
              <span>
                <Badge tone={tone(invoice.status)}>{invoice.status}</Badge>
              </span>
              <span>
                {invoice.status !== "Pagada" ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setInvoices((items) =>
                        items.map((i) => (i.id === invoice.id ? { ...i, status: "Pagada" } : i)),
                      )
                      onToast({ title: "Cobro registrado", detail: `${invoice.id} · ${euro(invoice.amount)}` })
                    }}
                  >
                    Registrar cobro
                  </Button>
                ) : (
                  <CheckCircle2 size={16} className="x-ok" />
                )}
              </span>
            </TableRow>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------- */

function PurchasingView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [tab, setTab] = useState<"orders" | "suppliers">("orders")
  const [showOrder, setShowOrder] = useState(false)
  const [supplier, setSupplier] = useState(initialSuppliers[1].name)
  const [items, setItems] = useState("")
  const [amount, setAmount] = useState(500)

  const tone = (status: PurchaseOrder["status"]) =>
    status === "Recibido" ? "success" : status === "Confirmado" ? "info" : status === "Enviado" ? "warning" : "neutral"

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Compras y proveedores"
        subtitle="Pedidos de aprovisionamiento de NEUTRON y directorio de empresas externas asociadas."
        action={
          <Button onClick={() => setShowOrder(true)}>
            <Plus size={17} /> Nuevo pedido
          </Button>
        }
      />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { id: "orders", label: "Pedidos de compra", count: orders.length },
          { id: "suppliers", label: "Directorio de proveedores", count: suppliers.length },
        ]}
      />

      {tab === "orders" && (
        <div className="admin-panel table-panel x-gap-top">
          <div className="data-table">
            <TableRow columns=".6fr 1fr 1.8fr .7fr .6fr 1fr .7fr" head>
              <span>PEDIDO</span>
              <span>PROVEEDOR</span>
              <span>CONTENIDO</span>
              <span>IMPORTE</span>
              <span>FECHA</span>
              <span>CANAL</span>
              <span>ESTADO</span>
            </TableRow>
            {orders.map((order) => (
              <TableRow columns=".6fr 1fr 1.8fr .7fr .6fr 1fr .7fr" key={order.id}>
                <strong>{order.id}</strong>
                <span>{order.supplier}</span>
                <span>{order.items}</span>
                <strong>{euro(order.amount)}</strong>
                <span>{order.date}</span>
                <span>{order.channel}</span>
                <span>
                  <Badge tone={tone(order.status)}>{order.status}</Badge>
                </span>
              </TableRow>
            ))}
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="supplier-grid x-gap-top">
          {suppliers.map((s) => (
            <div className={`admin-panel x-pad supplier-card ${s.active ? "" : "inactive"}`} key={s.id}>
              <div className="admin-panel-heading">
                <div>
                  <strong>{s.name}</strong>
                  <span>
                    {s.category} · {s.region}
                  </span>
                </div>
                <Badge tone={s.active ? "success" : "offline"}>{s.active ? "Activo" : "Inactivo"}</Badge>
              </div>
              <span className="x-muted">{s.contact}</span>
              <div className="supplier-foot">
                <span>
                  <Star size={13} /> {s.rating.toFixed(1)}
                </span>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setSuppliers((list) => list.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)))
                  }
                >
                  {s.active ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showOrder && (
        <AdminModal
          title="Nuevo pedido de compra"
          subtitle="Se registra en el ERP interno. Si el proveedor tiene portal, el módulo de terceros lo envía y devuelve la confirmación."
          onClose={() => setShowOrder(false)}
        >
          <form
            className="x-form"
            onSubmit={(e) => {
              e.preventDefault()
              const id = `PO-00${88 + orders.length - 3}`
              setOrders((list) => [
                {
                  id,
                  supplier,
                  items: items || "Material de instalación",
                  amount,
                  date: "Hoy",
                  channel: supplier === "SenseField" ? "Portal proveedor (APP-09)" : "Correo",
                  status: "Enviado",
                },
                ...list,
              ])
              setShowOrder(false)
              setItems("")
              onToast({ title: "Pedido enviado", detail: `${id} · ${supplier}` })
            }}
          >
            <Field label="Proveedor">
              <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                {suppliers
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
              </Select>
            </Field>
            <Field label="Contenido del pedido">
              <Textarea rows={3} value={items} onChange={(e) => setItems(e.target.value)} />
            </Field>
            <Field label="Importe estimado (€)">
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </Field>
            <div className="modal-footer">
              <Button variant="ghost" type="button" onClick={() => setShowOrder(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Send size={16} /> Enviar pedido
              </Button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------------- */

function InventoryView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [filter, setFilter] = useState<"all" | InventoryItem["location"]>("all")
  const [assigning, setAssigning] = useState<InventoryItem | null>(null)
  const [client, setClient] = useState(initialClients[0].name)
  const [plot, setPlot] = useState("")

  const shown = inventory.filter((i) => filter === "all" || i.location === filter)
  const count = (loc: InventoryItem["location"]) => inventory.filter((i) => i.location === loc).length

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Inventario de dispositivos"
        subtitle="Stock, número de serie y asignación de sensores, gateways y actuadores a cliente y parcela."
      />
      <div className="kpi-grid">
        <KpiCard icon={<Package />} label="EN ALMACÉN" value={String(count("Almacén"))} delta="Disponibles para instalar" tone="amber" />
        <KpiCard icon={<Radio />} label="INSTALADOS" value={String(count("Instalado"))} delta="Asignados a parcela" />
        <KpiCard icon={<Truck />} label="EN REPARACIÓN" value={String(count("En reparación"))} delta="Con proveedor de reparación" tone="purple" />
        <KpiCard icon={<Building2 />} label="CLIENTES CON EQUIPOS" value={String(new Set(inventory.filter((i) => i.client).map((i) => i.client)).size)} delta="Según el inventario" tone="blue" />
      </div>
      <div className="admin-panel table-panel x-gap-top">
        <div className="table-toolbar">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "Todos", count: inventory.length },
              { id: "Almacén", label: "Almacén" },
              { id: "Instalado", label: "Instalados" },
              { id: "En reparación", label: "En reparación" },
            ]}
          />
        </div>
        <div className="data-table">
          <TableRow columns="1fr 1.1fr 1fr .7fr 1.2fr .5fr .7fr" head>
            <span>Nº DE SERIE</span>
            <span>MODELO</span>
            <span>TIPO</span>
            <span>UBICACIÓN</span>
            <span>CLIENTE · PARCELA</span>
            <span>FIRMWARE</span>
            <span />
          </TableRow>
          {shown.map((item) => (
            <TableRow columns="1fr 1.1fr 1fr .7fr 1.2fr .5fr .7fr" key={item.serial}>
              <strong>{item.serial}</strong>
              <span>{item.model}</span>
              <span>{item.kind}</span>
              <span>
                <Badge tone={item.location === "Instalado" ? "success" : item.location === "Almacén" ? "info" : "warning"}>
                  {item.location}
                </Badge>
              </span>
              <span>{item.client ? `${item.client} · ${item.plot}` : "—"}</span>
              <span>{item.firmware}</span>
              <span>
                {item.location === "Almacén" && (
                  <Button variant="secondary" onClick={() => setAssigning(item)}>
                    Asignar
                  </Button>
                )}
              </span>
            </TableRow>
          ))}
        </div>
      </div>

      {assigning && (
        <AdminModal
          title={`Asignar ${assigning.serial}`}
          subtitle="Se crea la orden de instalación para el técnico y el dispositivo queda vinculado a la parcela."
          onClose={() => setAssigning(null)}
        >
          <form
            className="x-form"
            onSubmit={(e) => {
              e.preventDefault()
              setInventory((list) =>
                list.map((i) =>
                  i.serial === assigning.serial
                    ? { ...i, location: "Instalado", client, plot: plot || "Por definir" }
                    : i,
                ),
              )
              onToast({ title: "Dispositivo asignado", detail: `${assigning.serial} → ${client}` })
              setAssigning(null)
              setPlot("")
            }}
          >
            <Field label="Cliente">
              <Select value={client} onChange={(e) => setClient(e.target.value)}>
                {initialClients.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Parcela">
              <Input placeholder="Ej. Loma Alta" value={plot} onChange={(e) => setPlot(e.target.value)} />
            </Field>
            <div className="modal-footer">
              <Button variant="ghost" type="button" onClick={() => setAssigning(null)}>
                Cancelar
              </Button>
              <Button type="submit">Asignar</Button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------------- */

const clientTicketStatus: Record<SupportTicket["status"], BackofficeTicket["status"]> = {
  Abierto: "Abierto",
  "Pendiente de envío": "Abierto",
  "En revisión": "En curso",
  Resuelto: "Cerrado",
}

function TicketsView({
  clientTickets,
  onReplyClientTicket,
  onToast,
}: {
  clientTickets: SupportTicket[]
  onReplyClientTicket: (id: string, text: string, close: boolean) => void
  onToast: (toast: ToastState) => void
}) {
  const [own, setOwn] = useState<BackofficeTicket[]>(initialBackofficeTickets)
  const [filter, setFilter] = useState<"open" | "all">("open")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState("")

  const fromClient: BackofficeTicket[] = clientTickets
    .filter((t) => t.status !== "Pendiente de envío")
    .map((t) => ({
      id: t.id,
      client: "Cooperativa Valle Verde",
      subject: t.subject,
      category: t.category,
      priority: t.category === "Dispositivo o sensor" ? "Alta" : "Media",
      status: clientTicketStatus[t.status],
      agent: t.replies?.length ? "Javier Soto" : "Sin asignar",
      opened: t.date,
    }))
  const all = [...fromClient, ...own]
  const shown = all.filter((t) => filter === "all" || t.status !== "Cerrado")
  const selected = all.find((t) => t.id === selectedId)
  const isClientTicket = (id: string) => clientTickets.some((t) => t.id === id)

  const answer = (close: boolean) => {
    if (!selected) return
    if (isClientTicket(selected.id)) {
      onReplyClientTicket(selected.id, reply || "Incidencia revisada por soporte.", close)
    } else {
      setOwn((list) =>
        list.map((t) =>
          t.id === selected.id
            ? { ...t, status: close ? "Cerrado" : "Esperando cliente", agent: t.agent === "Sin asignar" ? "Nuria Campos" : t.agent }
            : t,
        ),
      )
    }
    onToast({
      title: close ? "Ticket cerrado" : "Respuesta enviada",
      detail: `${selected.id} · ${selected.client}`,
    })
    setReply("")
    setSelectedId(null)
  }

  const tone = (status: BackofficeTicket["status"]) =>
    status === "Cerrado" ? "success" : status === "En curso" ? "info" : status === "Abierto" ? "warning" : "neutral"

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Soporte y tickets"
        subtitle="Cola de incidencias de todos los clientes: apertura, seguimiento y cierre. Datos del cliente desde el CRM."
        action={<Badge tone="neutral">Proveedor externo de soporte</Badge>}
      />
      <div className="admin-panel table-panel">
        <div className="table-toolbar">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: "open", label: "Abiertos", count: all.filter((t) => t.status !== "Cerrado").length },
              { id: "all", label: "Todos", count: all.length },
            ]}
          />
        </div>
        <div className="data-table">
          <TableRow columns=".6fr 1.1fr 1.6fr .8fr .5fr .8fr .8fr" head>
            <span>TICKET</span>
            <span>CLIENTE</span>
            <span>ASUNTO</span>
            <span>CATEGORÍA</span>
            <span>PRIORIDAD</span>
            <span>AGENTE</span>
            <span>ESTADO</span>
          </TableRow>
          {shown.map((t) => (
            <TableRow
              columns=".6fr 1.1fr 1.6fr .8fr .5fr .8fr .8fr"
              key={t.id}
              onClick={() => setSelectedId(t.id)}
            >
              <strong>{t.id}</strong>
              <span>{t.client}</span>
              <span className="x-stack">
                <strong>{t.subject}</strong>
                <small>{t.opened}</small>
              </span>
              <span>{t.category}</span>
              <span>
                <Badge tone={t.priority === "Alta" ? "critical" : t.priority === "Media" ? "warning" : "neutral"}>{t.priority}</Badge>
              </span>
              <span>{t.agent}</span>
              <span>
                <Badge tone={tone(t.status)}>{t.status}</Badge>
              </span>
            </TableRow>
          ))}
        </div>
      </div>

      {selected && (
        <AdminModal
          title={`${selected.id} · ${selected.subject}`}
          subtitle={`${selected.client} · ${selected.category}`}
          onClose={() => setSelectedId(null)}
        >
          <div className="x-form">
            <Note>
              Cliente {selected.client}: datos de contrato y contacto consultados en el CRM.
              {isClientTicket(selected.id) && " La respuesta aparecerá en su panel web y en la app móvil."}
            </Note>
            <Field label="Respuesta al cliente">
              <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} />
            </Field>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => answer(false)}>
                <Send size={16} /> Responder
              </Button>
              <Button onClick={() => answer(true)}>
                <CheckCircle2 size={16} /> Responder y cerrar
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------------- */

function TeamView({ onToast }: { onToast: (toast: ToastState) => void }) {
  const [team, setTeam] = useState<InternalUser[]>(initialInternalUsers)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [role, setRole] = useState<InternalUser["role"]>("Soporte")

  const permissions: Record<InternalUser["role"], string> = {
    Administración: "Todo el back-office",
    Soporte: "Tickets, clientes (lectura)",
    "Técnico de instalación": "Inventario, órdenes de instalación",
    Agrónomo: "Recomendaciones y asistencia",
    Comercial: "CRM y propuestas",
    Finanzas: "Facturación, cobros y compras",
  }

  return (
    <div className="admin-page">
      <AdminPageHeading
        title="Equipo interno"
        subtitle="Usuarios de NEUTRON con sus roles y permisos en el back-office."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={17} /> Invitar
          </Button>
        }
      />
      <div className="admin-panel table-panel">
        <div className="data-table">
          <TableRow columns="1.3fr 1fr 1.4fr .6fr .7fr 32px" head>
            <span>NOMBRE</span>
            <span>ROL</span>
            <span>PERMISOS</span>
            <span>ESTADO</span>
            <span>ÚLTIMO ACCESO</span>
            <span />
          </TableRow>
          {team.map((user) => (
            <TableRow columns="1.3fr 1fr 1.4fr .6fr .7fr 32px" key={user.id}>
              <span className="x-stack">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
              <span>{user.role}</span>
              <span>{permissions[user.role]}</span>
              <span>
                <Badge tone={user.status === "Activo" ? "success" : user.status === "Invitado" ? "info" : "offline"}>
                  {user.status}
                </Badge>
              </span>
              <span>{user.lastAccess}</span>
              <Button
                variant="ghost"
                className="icon-button"
                title={user.status === "Suspendido" ? "Reactivar" : "Suspender"}
                onClick={() => {
                  setTeam((list) =>
                    list.map((u) =>
                      u.id === user.id ? { ...u, status: u.status === "Suspendido" ? "Activo" : "Suspendido" } : u,
                    ),
                  )
                  onToast({
                    title: user.status === "Suspendido" ? "Acceso reactivado" : "Acceso suspendido",
                    detail: user.name,
                  })
                }}
              >
                <MoreHorizontal size={16} />
              </Button>
            </TableRow>
          ))}
        </div>
      </div>

      {showForm && (
        <AdminModal title="Invitar a NEUTRON" subtitle="Recibirá un correo para acceder con su cuenta corporativa." onClose={() => setShowForm(false)}>
          <form
            className="x-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              setTeam((list) => [
                ...list,
                {
                  id: `iu-${Date.now()}`,
                  name,
                  email: `${name.toLowerCase().split(" ").join(".")}@neutron.ag`,
                  role,
                  status: "Invitado",
                  lastAccess: "—",
                },
              ])
              setShowForm(false)
              setName("")
              onToast({ title: "Invitación enviada", detail: `${name} · ${role}` })
            }}
          >
            <Field label="Nombre completo">
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Rol">
              <Select value={role} onChange={(e) => setRole(e.target.value as InternalUser["role"])}>
                {Object.keys(permissions).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <div className="modal-footer">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">Invitar</Button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

/* =========================================================================
   Experiencia Back-office NEUTRON
   ========================================================================= */

export default function BackofficeApp({
  onSwitchAdmin,
  onSwitchField,
  toast,
  setToast,
  clientTickets,
  onReplyClientTicket,
}: {
  onSwitchAdmin: () => void
  onSwitchField: () => void
  toast: ToastState
  setToast: (toast: ToastState) => void
  clientTickets: SupportTicket[]
  onReplyClientTicket: (id: string, text: string, close: boolean) => void
}) {
  const [view, setView] = useState<BackofficeView>("crm")
  const [menuOpen, setMenuOpen] = useState(false)
  const current = backofficeNav.flatMap((g) => g.items).find((i) => i.id === view)

  return (
    <div className="admin-app backoffice-app">
      <aside className={`admin-sidebar backoffice-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Logo />
          <Button variant="ghost" className="icon-button sidebar-close" onClick={() => setMenuOpen(false)}>
            <X />
          </Button>
        </div>
        <div className="org-selector">
          <div className="org-icon">N</div>
          <div>
            <strong>NEUTRON</strong>
            <span>Back-office interno</span>
          </div>
        </div>
        <nav className="admin-nav">
          {backofficeNav.map((group) => (
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
                      setView(item.id)
                      setMenuOpen(false)
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Button variant="ghost" onClick={onSwitchAdmin}>
            <UsersRound size={18} /> Panel del cliente <ArrowRight size={15} />
          </Button>
          <Button variant="ghost" onClick={onSwitchField}>
            <Smartphone size={18} /> Experiencia Campo <ArrowRight size={15} />
          </Button>
          <div className="sidebar-user">
            <div className="admin-avatar">LM</div>
            <div>
              <strong>Laura Méndez</strong>
              <span>Administración NEUTRON</span>
            </div>
          </div>
        </div>
      </aside>
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-title">
            <Button variant="ghost" className="icon-button menu-button" onClick={() => setMenuOpen(true)}>
              <Menu />
            </Button>
            <div>
              <span>Back-office NEUTRON</span>
              <strong>{current?.label}</strong>
            </div>
          </div>
          <Badge tone="neutral">{current?.app}</Badge>
        </header>
        <main>
          {view === "crm" && <CrmView onToast={setToast} />}
          {view === "billing" && <BillingView onToast={setToast} />}
          {view === "purchasing" && <PurchasingView onToast={setToast} />}
          {view === "inventory" && <InventoryView onToast={setToast} />}
          {view === "tickets" && (
            <TicketsView clientTickets={clientTickets} onReplyClientTicket={onReplyClientTicket} onToast={setToast} />
          )}
          {view === "team" && <TeamView onToast={setToast} />}
        </main>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
