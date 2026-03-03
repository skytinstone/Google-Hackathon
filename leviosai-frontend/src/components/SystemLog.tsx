import { useState, useEffect } from 'react'
import { subscribe, type LogEntry, type LogType } from '../utils/syslog'

const TYPE_STYLE: Record<LogType, string> = {
  AUTH: 'text-green-400',
  NAV:  'text-accent',
  STEP: 'text-accent',
  ACT:  'text-primary/50',
  OK:   'text-green-400',
  ERR:  'text-red-400',
  INIT: 'text-yellow-400',
  GEN:  'text-yellow-400',
}

export default function SystemLog() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => subscribe(setEntries), [])

  if (entries.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[340px] font-mono text-[10px] select-none">

      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-component/95 backdrop-blur-sm border border-white/10 rounded-t-lg hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-secondary/60 tracking-[0.18em] uppercase text-[9px]">System Log</span>
          <span className="text-secondary/25">·</span>
          <span className="text-secondary/25 text-[9px]">{entries.length} events</span>
        </div>
        <span className="text-secondary/30 text-[9px]">{collapsed ? '▲' : '▼'}</span>
      </button>

      {/* Entries */}
      {!collapsed && (
        <div className="bg-[#05050a]/95 backdrop-blur-sm border border-t-0 border-white/10 rounded-b-lg overflow-hidden">
          <div className="max-h-[216px] overflow-y-auto">
            {entries.slice(0, 7).map((entry, idx) => (
              <div
                key={entry.id}
                className={[
                  'flex items-start gap-2 px-3 py-1.5 border-b border-white/[0.04] last:border-0',
                  idx === 0 ? 'animate-fade-in' : 'opacity-80',
                ].join(' ')}
              >
                <span className="text-secondary/20 flex-shrink-0 tabular-nums">{entry.time}</span>
                <span className={`flex-shrink-0 w-[36px] text-[9px] font-bold tracking-wider ${TYPE_STYLE[entry.type]}`}>
                  {entry.type}
                </span>
                <span className="text-secondary/55 leading-tight">▸ {entry.message}</span>
              </div>
            ))}
          </div>

          {/* Terminal cursor */}
          <div className="px-3 py-1 border-t border-white/[0.04] flex items-center gap-1.5">
            <span className="text-green-400/30 animate-blink text-[11px]">█</span>
            <span className="text-secondary/20 text-[9px]">ops terminal active</span>
          </div>
        </div>
      )}
    </div>
  )
}
