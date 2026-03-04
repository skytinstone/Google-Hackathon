import { useState, useEffect } from 'react'
import { subscribe, type LogEntry, type LogType } from '../utils/syslog'
import { useTheme } from '../utils/theme'

const TYPE_COLOR_DARK: Record<LogType, string> = {
  AUTH: '#4ade80',
  NAV:  '#6b96be',
  STEP: '#6b96be',
  ACT:  '#e8edf5',
  OK:   '#4ade80',
  ERR:  '#f87171',
  INIT: '#facc15',
  GEN:  '#facc15',
}

const TYPE_COLOR_LIGHT: Record<LogType, string> = {
  AUTH: '#16a34a',
  NAV:  '#2563eb',
  STEP: '#2563eb',
  ACT:  '#1a1a2e',
  OK:   '#16a34a',
  ERR:  '#dc2626',
  INIT: '#ca8a04',
  GEN:  '#ca8a04',
}

interface Props {
  position?: 'left' | 'right' | 'top-right'
  sidebarVisible?: boolean
}

export default function SystemLog({ position = 'left', sidebarVisible }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const { theme } = useTheme()

  useEffect(() => subscribe(setEntries), [])

  if (entries.length === 0) return null

  const isRight = position === 'right'
  const isTopRight = position === 'top-right'
  const isLight = theme === 'light'
  const TYPE_COLOR = isLight ? TYPE_COLOR_LIGHT : TYPE_COLOR_DARK

  // Position: center for login, top-right for main, left fallback
  const posStyle: React.CSSProperties = isTopRight
    ? { left: '285px', bottom: '40px' }
    : isRight
      ? { left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }
      : { left: sidebarVisible ? '272px' : '100px' }

  const fixedClass = 'fixed z-40 font-mono select-none pointer-events-none transition-all duration-300'

  return (
    <div
      className={fixedClass}
      style={{ ...posStyle, maxWidth: '560px' }}
    >
      {entries.slice(0, 10).map((entry, idx) => (
        <div
          key={entry.id}
          className={[
            'flex items-center gap-2 py-0.5',
            isRight ? 'justify-center' : '',
            idx === 0 ? 'animate-fade-in' : '',
          ].join(' ')}
          style={{ opacity: 1 }}
        >
          <span className="text-[11px] tabular-nums" style={{ color: isLight ? '#16a34a' : '#4ade80' }}>{entry.time}</span>
          <span className="text-[11px] font-bold tracking-wider" style={{ color: TYPE_COLOR[entry.type] }}>
            {entry.type}
          </span>
          <span className={`text-[11px] ${isLight ? 'text-black/40' : 'text-white/50'}`}>▸</span>
          <span className={`text-[11px] leading-tight truncate ${isLight ? 'text-black/70' : 'text-white/70'}`}>{entry.message}</span>
        </div>
      ))}
    </div>
  )
}
