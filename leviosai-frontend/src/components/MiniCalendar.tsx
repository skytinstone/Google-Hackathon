import { useState, useEffect } from 'react'
import { useDraggable } from '../hooks/useDraggable'

interface Props {
  chatOpen?: boolean
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function MiniCalendar({ chatOpen }: Props) {
  const zoom = parseFloat(document.documentElement.style.zoom || '1') || 1
  const { pos, onMouseDown } = useDraggable('Calendar', window.innerWidth / zoom - 400, 110)
  const [collapsed, setCollapsed] = useState(false)
  const [userCollapsed, setUserCollapsed] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (chatOpen) setCollapsed(true)
    else setCollapsed(userCollapsed)
  }, [chatOpen, userCollapsed])

  function handleToggle() {
    const next = !collapsed
    setCollapsed(next)
    if (!chatOpen) setUserCollapsed(next)
  }

  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = now.toLocaleString('en', { month: 'short' }).toUpperCase()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div
      className="fixed select-none"
      style={{
        left: pos.x, top: pos.y, zIndex: 10, width: 280,
        opacity: chatOpen ? 0 : 1,
        pointerEvents: chatOpen ? 'none' : 'auto',
      }}
    >
      {/* Header — drag handle */}
      <div
        onMouseDown={onMouseDown}
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-t-lg bg-white/5 border border-white/15 border-b-0 cursor-grab hover:bg-white/10 transition-colors active:cursor-grabbing"
        style={collapsed ? { borderRadius: '8px' } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
          <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest">Calendar</span>
          <span className="text-[9px] font-mono text-white/30">{monthName} {year}</span>
        </div>
        <span className="text-[10px] font-mono text-white/30">{collapsed ? '▲' : '▼'}</span>
      </div>

      {!collapsed && (
        <div className="pointer-events-auto rounded-b-lg border border-white/15 border-t-0 bg-[#0a0c14]/95 backdrop-blur-sm overflow-hidden">
          {/* Month / Year */}
          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-white/60">{monthName} {year}</span>
            <span className="text-[9px] font-mono text-accent/60">
              Day {today}
            </span>
          </div>

          {/* Day headers */}
          <div className="px-2 grid grid-cols-7 gap-0.5">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[8px] font-mono text-white/25 py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="px-2 pb-2 grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e-${i}`} className="h-6" />
              }
              const isToday = day === today
              return (
                <div
                  key={day}
                  className={[
                    'h-6 flex items-center justify-center rounded text-[10px] font-mono transition-colors',
                    isToday
                      ? 'bg-accent text-background font-bold'
                      : 'text-white/50 hover:bg-white/5',
                  ].join(' ')}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Today info */}
          <div className="px-3 pb-2 border-t border-white/8 pt-1.5 flex items-center justify-between">
            <span className="text-[8px] font-mono text-white/25 uppercase tracking-widest">Today</span>
            <span className="text-[9px] font-mono text-white/50">
              {now.toLocaleDateString('en-CA')} · {now.toLocaleString('en', { weekday: 'long' })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
