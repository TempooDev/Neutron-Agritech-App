// Conexión del frontend con la API de demo orquestada por Aspire.
// - Si /api responde, recibe snapshots en vivo por Server-Sent Events.
// - Si no, arranca el simulador local del navegador (modo de respaldo) y sigue
//   reintentando la API en segundo plano para volver a ella en cuanto esté disponible.
import { useCallback, useEffect, useRef, useState } from "react"
import { LocalSimulator } from "./localSim"
import type { DemoSnapshot, DemoSource } from "./types"

const API = (import.meta.env.VITE_NEUTRON_API_URL as string | undefined) ?? "/api"
const RETRY_MS = 10_000

async function post(path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
}

export type LiveDemo = {
  enabled: boolean
  source: DemoSource
  snapshot: DemoSnapshot | null
  forceLocal: boolean
  setForceLocal: (value: boolean) => void
  startScenario: (id: string) => void
  reset: () => void
  setSpeed: (speed: number) => void
  setPaused: (paused: boolean) => void
  irrigate: (plotId: string, minutes: number) => void
  resolveAlert: (id: string, status: "accepted" | "rejected", reason?: string) => void
}

export function useLiveDemo(enabled: boolean): LiveDemo {
  const [source, setSource] = useState<DemoSource>("connecting")
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null)
  const [forceLocal, setForceLocal] = useState(false)
  const localRef = useRef<LocalSimulator | null>(null)
  const sourceRef = useRef<DemoSource>("connecting")
  sourceRef.current = source

  // Conexión con la API (SSE) con reintentos.
  useEffect(() => {
    if (!enabled || forceLocal) return
    let es: EventSource | null = null
    let retry: number | undefined
    let cancelled = false

    const connect = async () => {
      try {
        const ctrl = new AbortController()
        const timeout = window.setTimeout(() => ctrl.abort(), 2500)
        const res = await fetch(`${API}/snapshot`, { signal: ctrl.signal })
        window.clearTimeout(timeout)
        if (!res.ok || !res.headers.get("content-type")?.includes("json")) throw new Error("sin API")
        if (cancelled) return
        setSnapshot((await res.json()) as DemoSnapshot)
        setSource("api")
        es = new EventSource(`${API}/stream`)
        es.addEventListener("snapshot", (ev) => {
          setSnapshot(JSON.parse((ev as MessageEvent<string>).data) as DemoSnapshot)
        })
        es.onerror = () => {
          es?.close()
          es = null
          if (cancelled) return
          setSource("local")
          retry = window.setTimeout(connect, RETRY_MS)
        }
      } catch {
        if (cancelled) return
        setSource("local")
        retry = window.setTimeout(connect, RETRY_MS)
      }
    }
    connect()
    return () => {
      cancelled = true
      es?.close()
      window.clearTimeout(retry)
    }
  }, [enabled, forceLocal])

  useEffect(() => {
    if (enabled && forceLocal) setSource("local")
  }, [enabled, forceLocal])

  // Simulador local cuando no hay API.
  useEffect(() => {
    if (!enabled || source !== "local") return
    localRef.current ??= new LocalSimulator()
    const sim = localRef.current
    setSnapshot(sim.snapshot())
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      sim.advance(now - last)
      last = now
      setSnapshot(sim.snapshot())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [enabled, source])

  // Ejecuta una acción en la API o en el simulador local según la fuente activa.
  const run = useCallback(
    (remote: () => Promise<void>, local: (sim: LocalSimulator) => void) => {
      if (sourceRef.current === "api") {
        remote().catch(() => undefined)
        return
      }
      const sim = localRef.current
      if (!sim) return
      local(sim)
      setSnapshot(sim.snapshot())
    },
    [],
  )

  return {
    enabled,
    source: enabled ? source : "connecting",
    snapshot: enabled ? snapshot : null,
    forceLocal,
    setForceLocal,
    startScenario: (id) => run(() => post(`/demo/scenarios/${id}`), (s) => s.startScenario(id)),
    reset: () => run(() => post("/demo/reset"), (s) => s.reset()),
    setSpeed: (speed) => run(() => post("/demo/speed", { speed }), (s) => s.setSpeed(speed)),
    setPaused: (paused) => run(() => post(paused ? "/demo/pause" : "/demo/resume"), (s) => s.setPaused(paused)),
    irrigate: (plotId, minutes) =>
      run(() => post(`/plots/${plotId}/irrigate`, { minutes }), (s) => s.irrigate(plotId, minutes)),
    resolveAlert: (id, status, reason) =>
      run(() => post(`/alerts/${id}/resolve`, { status, reason }), (s) => s.resolveAlert(id, status, reason)),
  }
}
