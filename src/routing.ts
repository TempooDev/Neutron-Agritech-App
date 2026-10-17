/* =========================================================================
   Rutas por aplicación, para poder enlazar (o poner un QR) a cada una:
   /campo/…       App de campo (APP-02)
   /panel/…       Panel de control web (APP-01)
   /backoffice/…  Back-office NEUTRON (CRM APP-06, ERP APP-11, soporte APP-10…)
   ========================================================================= */

export type Experience = "field" | "admin" | "backoffice"

type Route = { slug: string; label: string; app: string }

export const experienceBase: Record<Experience, string> = {
  field: "/campo",
  admin: "/panel",
  backoffice: "/backoffice",
}

export const routes: Record<Experience, Record<string, Route>> = {
  field: {
    home: { slug: "", label: "Inicio", app: "App de Campo" },
    alerts: { slug: "alertas", label: "Alertas", app: "App de Campo" },
    actions: { slug: "actuaciones", label: "Actuaciones", app: "App de Campo" },
    support: { slug: "soporte", label: "Soporte", app: "App de Campo" },
  },
  admin: {
    overview: { slug: "", label: "Gemelo digital", app: "Panel de Control Web" },
    farms: { slug: "explotaciones", label: "Explotaciones", app: "Panel de Control Web" },
    recommendations: { slug: "recomendaciones", label: "Recomendaciones", app: "Panel de Control Web" },
    actuations: { slug: "actuaciones", label: "Actuaciones", app: "Panel de Control Web" },
    users: { slug: "usuarios", label: "Clientes y usuarios", app: "Panel de Control Web" },
    devices: { slug: "dispositivos", label: "Dispositivos IoT", app: "Panel de Control Web" },
    rules: { slug: "reglas", label: "Reglas y automatización", app: "Panel de Control Web" },
    analytics: { slug: "modelos-predictivos", label: "Modelos predictivos", app: "Panel de Control Web" },
    reports: { slug: "informes", label: "Informes", app: "Panel de Control Web" },
    integrations: { slug: "integraciones", label: "Integraciones", app: "Panel de Control Web" },
    api: { slug: "api-erp", label: "API y ERP", app: "Panel de Control Web" },
    support: { slug: "soporte", label: "Soporte", app: "Panel de Control Web" },
  },
  backoffice: {
    crm: { slug: "crm", label: "Clientes y oportunidades", app: "CRM" },
    billing: { slug: "facturacion", label: "Suscripciones y facturas", app: "ERP NEUTRON" },
    purchasing: { slug: "compras", label: "Compras y proveedores", app: "ERP NEUTRON" },
    inventory: { slug: "inventario", label: "Inventario de dispositivos", app: "Gestión IoT" },
    tickets: { slug: "soporte", label: "Soporte y tickets", app: "Soporte a Usuario" },
    team: { slug: "equipo", label: "Equipo interno", app: "Back-office NEUTRON" },
  },
}

function segments() {
  return window.location.pathname.split("/").filter(Boolean)
}

/** Aplicación indicada en la URL actual, si la hay. */
export function experienceFromPath(): Experience | undefined {
  const first = `/${segments()[0] ?? ""}`
  return (Object.keys(experienceBase) as Experience[]).find(
    (exp) => experienceBase[exp] === first,
  )
}

/** Vista indicada en la URL actual para esa aplicación, o la primera. */
export function viewFromPath<T extends string>(experience: Experience): T {
  const [first, slug = ""] = segments()
  const table = routes[experience]
  const ids = Object.keys(table)
  if (`/${first ?? ""}` !== experienceBase[experience]) return ids[0] as T
  return (ids.find((id) => table[id].slug === slug) ?? ids[0]) as T
}

/** Actualiza la URL y el título del navegador para la vista actual. */
export function syncRoute(experience: Experience, view: string) {
  const route = routes[experience][view]
  if (!route) return
  const path = route.slug
    ? `${experienceBase[experience]}/${route.slug}`
    : experienceBase[experience]
  if (window.location.pathname !== path) {
    // Desde "/" o una ruta desconocida se reemplaza, para no dejar una
    // entrada vacía en el historial.
    if (experienceFromPath()) window.history.pushState(null, "", path)
    else window.history.replaceState(null, "", path)
  }
  document.title = `${route.label} · ${route.app} | NEUTRON`
}
