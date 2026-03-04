// ── Toast notification singleton ─────────────────────────────
// Mirrors syslog.ts pub/sub pattern. Call showToast() from anywhere.

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastEntry {
  id: number
  type: ToastType
  message: string
}

type Listener = (entries: ToastEntry[]) => void

let entries: ToastEntry[] = []
let _id = 0
const listeners = new Set<Listener>()

function notify() {
  const snapshot = [...entries]
  listeners.forEach(l => l(snapshot))
}

export function showToast(message: string, type: ToastType = 'info', duration = 3000): void {
  const id = ++_id
  entries = [{ id, type, message }, ...entries]
  notify()
  setTimeout(() => {
    entries = entries.filter(e => e.id !== id)
    notify()
  }, duration)
}

export function dismissToast(id: number): void {
  entries = entries.filter(e => e.id !== id)
  notify()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  listener([...entries])
  return () => listeners.delete(listener)
}
