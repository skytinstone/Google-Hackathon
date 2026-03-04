import { useState, useEffect } from 'react'
import { subscribe, type LogEntry, type LogType } from '../utils/syslog'

const TYPE_COLOR: Record<LogType, string> = {
  AUTH: '#4ade80',
  NAV:  '#6b96be',
  STEP: '#6b96be',
  ACT:  '#e8edf5',
  OK:   '#4ade80',
  ERR:  '#f87171',
  INIT: '#facc15',
  GEN:  '#facc15',
}

interface Props {
  position?: 'left' | 'right'
  sidebarVisible?: boolean
}

export default function SystemLog({ position = 'left', sidebarVisible }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([])

  useEffect(() => subscribe(setEntries), [])

  if (entries.length === 0) return null

  const isRight = position === 'right'

  // Position: center for login, left with sidebar offset for main
  const posStyle: React.CSSProperties = isRight
    ? { left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }
    : { left: sidebarVisible ? '272px' : '100px' }

  return (
    <div
      className="fixed bottom-6 z-40 font-mono select-none pointer-events-none transition-all duration-300"
      style={{ ...posStyle, maxWidth: '560px' }}
    >
      {entries.slice(0, 6).map((entry, idx) => (
        <div
          key={entry.id}
          className={[
            'flex items-center gap-2 py-0.5',
            isRight ? 'justify-center' : '',
            idx === 0 ? 'animate-fade-in' : '',
          ].join(' ')}
          style={{ opacity: 1 - idx * 0.13 }}
        >
          <span className="text-[11px] tabular-nums" style={{ color: '#4ade80' }}>{entry.time}</span>
          <span className="text-[11px] font-bold tracking-wider" style={{ color: TYPE_COLOR[entry.type] }}>
            {entry.type}
          </span>
          <span className="text-white/50 text-[11px]">▸</span>
          <span className="text-white/70 text-[11px] leading-tight truncate">{entry.message}</span>
        </div>
      ))}
    </div>
  )
}
