// ── Palantir-style system log singleton ──────────────────────
// Call addLog() from anywhere; SystemLog component subscribes.

export type LogType = 'AUTH' | 'NAV' | 'STEP' | 'ACT' | 'OK' | 'ERR' | 'INIT' | 'GEN'

export interface LogEntry {
  id: number
  time: string
  type: LogType
  message: string
}

type Listener = (entries: LogEntry[]) => void

let entries: LogEntry[] = []
let _id = 0
const listeners = new Set<Listener>()

function notify() {
  const snapshot = [...entries]
  listeners.forEach(l => l(snapshot))
}

export function addLog(message: string, type: LogType = 'ACT'): void {
  const now = new Date()
  const time = now.toTimeString().slice(0, 8)
  entries = [{ id: ++_id, time, type, message }, ...entries].slice(0, 10)
  notify()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  listener([...entries]) // immediate sync
  return () => listeners.delete(listener)
}

export function getEntries(): LogEntry[] {
  return [...entries]
}
