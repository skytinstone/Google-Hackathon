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
  position?: 'left' | 'right' | 'top-right' | 'bottom-left'
  sidebarVisible?: boolean
}

export default function SystemLog({ position = 'left', sidebarVisible }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [expanded, setExpanded] = useState(false)
  const { theme } = useTheme()

  useEffect(() => subscribe(setEntries), [])

  if (entries.length === 0) return null

  const isRight = position === 'right'
  const isTopRight = position === 'top-right'
  const isBottomLeft = position === 'bottom-left'
  const isLight = theme === 'light'
  const TYPE_COLOR = isLight ? TYPE_COLOR_LIGHT : TYPE_COLOR_DARK

  const posStyle: React.CSSProperties = isBottomLeft
    ? { left: '24px', bottom: '40px' }
    : (isTopRight || isRight)
    ? { left: '4px', bottom: '500px' }
    : { left: sidebarVisible ? '272px' : '100px' }

  const shown = expanded ? entries.slice(0, 10) : entries.slice(0, 4)
  const hasMore = entries.length > 4

  return (
    <div
      className="fixed z-40 font-mono select-none transition-all duration-300"
      style={{ ...posStyle, maxWidth: '480px' }}
    >
      {/* Toggle button */}
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className={`pointer-events-auto mb-0.5 text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded border transition-colors ${
            isLight
              ? 'text-black/40 border-black/10 hover:bg-black/5'
              : 'text-white/30 border-white/10 hover:bg-white/5'
          }`}
        >
          {expanded ? '▾ Collapse' : `▸ Log (${entries.length})`}
        </button>
      )}
      {shown.map((entry, idx) => (
        <div
          key={entry.id}
          className={[
            'flex items-center gap-1.5 py-0.5',
            idx === 0 ? 'animate-fade-in' : '',
          ].join(' ')}
        >
          <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: isLight ? '#16a34a' : '#4ade80' }}>
            {entry.time.slice(0, 5)}
          </span>
          <span className="text-[10px] font-bold tracking-wider flex-shrink-0" style={{ color: TYPE_COLOR[entry.type] }}>
            {entry.type}
          </span>
          <span className={`text-[10px] leading-tight truncate max-w-[280px] ${isLight ? 'text-black/60' : 'text-white/50'}`}>
            {entry.message}
          </span>
        </div>
      ))}
    </div>
  )
}
