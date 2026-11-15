import { createContext, useContext } from "react"
import type { DemoSnapshot } from "./types"

// Snapshot en vivo accesible desde cualquier vista sin tener que pasar props por toda la app.
export const DemoSnapshotContext = createContext<DemoSnapshot | null>(null)

export function useDemoSnapshot() {
  return useContext(DemoSnapshotContext)
}
