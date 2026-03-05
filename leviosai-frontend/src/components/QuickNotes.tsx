import { useState, useEffect, useRef } from 'react'
import { useDraggable } from '../hooks/useDraggable'

const STORAGE_KEY = 'leviosai_quick_notes'
const PINS_KEY = 'leviosai_pinned_items'

interface PinnedItem {
  id: string
  label: string
  color: string
  createdAt: string
}

function loadJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

interface Props {
  chatOpen?: boolean
}

export default function QuickNotes({ chatOpen }: Props) {
  const { pos, onMouseDown } = useDraggable('QuickNotes', window.innerWidth - 400, 556)
  const [collapsed, setCollapsed] = useState(false)
  const [userCollapsed, setUserCollapsed] = useState(false)
  const [notes, setNotes] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [pins, setPins] = useState<PinnedItem[]>(() => loadJson<PinnedItem[]>(PINS_KEY, []))
  const [showPinInput, setShowPinInput] = useState(false)
  const [pinLabel, setPinLabel] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Auto-save notes with debounce
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, notes)
    }, 400)
    return () => clearTimeout(saveTimer.current)
  }, [notes])

  // Save pins
  useEffect(() => {
    localStorage.setItem(PINS_KEY, JSON.stringify(pins))
  }, [pins])

  // Auto-collapse when chat opens, restore when chat closes
  useEffect(() => {
    if (chatOpen) {
      setCollapsed(true)
    } else {
      setCollapsed(userCollapsed)
    }
  }, [chatOpen, userCollapsed])

  function handleToggle() {
    const next = !collapsed
    setCollapsed(next)
    if (!chatOpen) setUserCollapsed(next)
  }

  const COLORS = ['#4ade80', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#34d399']

  function addPin() {
    if (!pinLabel.trim()) return
    const newPin: PinnedItem = {
      id: Date.now().toString(),
      label: pinLabel.trim(),
      color: COLORS[pins.length % COLORS.length],
      createdAt: new Date().toISOString(),
    }
    setPins(prev => [...prev, newPin])
    setPinLabel('')
    setShowPinInput(false)
  }

  function removePin(id: string) {
    setPins(prev => prev.filter(p => p.id !== id))
  }

  const charCount = notes.length

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
          <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest">Quick Notes</span>
        </div>
        <div className="flex items-center gap-2">
          {charCount > 0 && (
            <span className="text-[8px] font-mono text-white/25">{charCount} chars</span>
          )}
          <span className="text-[10px] font-mono text-white/30">{collapsed ? '▲' : '▼'}</span>
        </div>
      </div>

      {!collapsed && (
        <div className="pointer-events-auto rounded-b-lg border border-white/15 border-t-0 bg-[#0a0c14]/95 backdrop-blur-sm overflow-hidden">
          {/* Pinned Items */}
          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Pinned</span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPinInput(s => !s) }}
                className="text-[10px] font-mono text-white/40 hover:text-white/80 transition-colors"
              >
                +
              </button>
            </div>

            {showPinInput && (
              <div className="flex items-center gap-1 mb-1.5">
                <input
                  value={pinLabel}
                  onChange={e => setPinLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPin()}
                  placeholder="Pin label..."
                  className="flex-1 bg-transparent border border-white/15 rounded px-2 py-0.5 text-[10px] font-mono text-white/80 placeholder:text-white/20 outline-none focus:border-white/30"
                  autoFocus
                />
                <button
                  onClick={addPin}
                  className="text-[10px] font-mono text-white/70 hover:text-white px-1"
                >
                  Add
                </button>
              </div>
            )}

            {pins.length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-1">
                {pins.map(pin => (
                  <span
                    key={pin.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono group"
                    style={{
                      backgroundColor: pin.color + '15',
                      color: pin.color,
                      border: `1px solid ${pin.color}30`,
                    }}
                  >
                    {pin.label}
                    <button
                      onClick={() => removePin(pin.id)}
                      className="opacity-0 group-hover:opacity-100 text-[8px] hover:text-white transition-opacity ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : !showPinInput && (
              <p className="text-[9px] font-mono text-white/15 mb-1">No pinned items</p>
            )}
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-white/10" />

          {/* Notes textarea */}
          <div className="px-3 pt-1.5 pb-2">
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Memo</span>
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Write quick notes here...&#10;Auto-saved to localStorage."
              className="w-full mt-1 bg-transparent text-[10px] font-mono text-white/70 placeholder:text-white/15 outline-none resize-none leading-relaxed"
              rows={6}
              spellCheck={false}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1 border-t border-white/10 bg-[#060810]">
            <span className="text-[8px] font-mono text-white/20">auto-saved</span>
            <button
              onClick={() => { setNotes(''); setPins([]) }}
              className="text-[8px] font-mono text-red-400/30 hover:text-red-400/60 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
