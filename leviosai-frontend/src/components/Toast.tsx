import { useState, useEffect } from 'react'
import { subscribe, dismissToast, type ToastEntry, type ToastType } from '../utils/toast'

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}

const COLORS: Record<ToastType, { border: string; icon: string }> = {
  success: { border: 'border-green-500/30', icon: 'text-green-400' },
  error:   { border: 'border-red-500/30',   icon: 'text-red-400' },
  info:    { border: 'border-accent/30',     icon: 'text-accent' },
  warning: { border: 'border-yellow-500/30', icon: 'text-yellow-400' },
}

function ToastItem({ entry }: { entry: ToastEntry }) {
  const c = COLORS[entry.type]
  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl border bg-component shadow-2xl animate-fade-in min-w-[260px] max-w-[360px]',
        c.border,
      ].join(' ')}
    >
      <span className={`text-sm font-bold flex-shrink-0 ${c.icon}`}>{ICONS[entry.type]}</span>
      <span className="text-xs font-mono text-primary flex-1">{entry.message}</span>
      <button
        onClick={() => dismissToast(entry.id)}
        className="text-secondary/40 hover:text-primary text-xs flex-shrink-0 ml-1 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

export default function Toast() {
  const [entries, setEntries] = useState<ToastEntry[]>([])

  useEffect(() => subscribe(setEntries), [])

  if (entries.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2">
      {entries.map(e => <ToastItem key={e.id} entry={e} />)}
    </div>
  )
}
