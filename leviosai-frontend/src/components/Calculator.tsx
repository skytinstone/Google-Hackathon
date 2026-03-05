import { useState, useEffect } from 'react'
import { useDraggable } from '../hooks/useDraggable'

interface Props {
  chatOpen?: boolean
}

export default function Calculator({ chatOpen }: Props) {
  const zoom = parseFloat(document.documentElement.style.zoom || '1') || 1
  const { pos, onMouseDown } = useDraggable('Calculator', window.innerWidth / zoom - 400, 320)
  const [collapsed, setCollapsed] = useState(false)
  const [userCollapsed, setUserCollapsed] = useState(false)
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [fresh, setFresh] = useState(true)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    if (chatOpen) setCollapsed(true)
    else setCollapsed(userCollapsed)
  }, [chatOpen, userCollapsed])

  function handleToggle() {
    const next = !collapsed
    setCollapsed(next)
    if (!chatOpen) setUserCollapsed(next)
  }

  function inputDigit(d: string) {
    if (fresh) {
      setDisplay(d)
      setFresh(false)
    } else {
      setDisplay(display === '0' && d !== '.' ? d : display + d)
    }
  }

  function inputOp(nextOp: string) {
    const current = parseFloat(display)
    if (prev !== null && op && !fresh) {
      const result = calc(prev, current, op)
      setDisplay(format(result))
      setPrev(result)
    } else {
      setPrev(current)
    }
    setOp(nextOp)
    setFresh(true)
  }

  function calc(a: number, b: number, operator: string): number {
    switch (operator) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : NaN
      default: return b
    }
  }

  function format(n: number): string {
    if (isNaN(n)) return 'Error'
    if (!isFinite(n)) return 'Error'
    const s = n.toPrecision(10)
    return parseFloat(s).toString()
  }

  function execute() {
    if (prev === null || !op) return
    const current = parseFloat(display)
    const result = calc(prev, current, op)
    const expr = `${format(prev)} ${op} ${format(current)} = ${format(result)}`
    setHistory(h => [expr, ...h].slice(0, 5))
    setDisplay(format(result))
    setPrev(null)
    setOp(null)
    setFresh(true)
  }

  function clear() {
    setDisplay('0')
    setPrev(null)
    setOp(null)
    setFresh(true)
  }

  function toggleSign() {
    setDisplay(format(parseFloat(display) * -1))
  }

  function percent() {
    setDisplay(format(parseFloat(display) / 100))
  }

  const BTN = 'flex items-center justify-center rounded text-[11px] font-mono transition-colors h-7'
  const NUM = `${BTN} bg-white/5 text-white/80 hover:bg-white/10 active:bg-white/15`
  const OP_STYLE = `${BTN} bg-accent/15 text-accent hover:bg-accent/25 active:bg-accent/35`
  const FN = `${BTN} bg-white/8 text-white/50 hover:bg-white/12`

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
          <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest">Calculator</span>
        </div>
        <span className="text-[10px] font-mono text-white/30">{collapsed ? '▲' : '▼'}</span>
      </div>

      {!collapsed && (
        <div className="pointer-events-auto rounded-b-lg border border-white/15 border-t-0 bg-[#0a0c14]/95 backdrop-blur-sm overflow-hidden">
          {/* Display */}
          <div className="px-3 pt-2 pb-1">
            {op && prev !== null && (
              <div className="text-[9px] font-mono text-white/25 text-right truncate">
                {format(prev)} {op}
              </div>
            )}
            <div className="text-right text-lg font-mono text-white/90 font-bold truncate leading-tight">
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="px-2 pb-2 grid grid-cols-4 gap-1">
            <button onClick={clear} className={FN}>C</button>
            <button onClick={toggleSign} className={FN}>±</button>
            <button onClick={percent} className={FN}>%</button>
            <button onClick={() => inputOp('÷')} className={`${OP_STYLE} ${op === '÷' && fresh ? 'ring-1 ring-accent/50' : ''}`}>÷</button>

            <button onClick={() => inputDigit('7')} className={NUM}>7</button>
            <button onClick={() => inputDigit('8')} className={NUM}>8</button>
            <button onClick={() => inputDigit('9')} className={NUM}>9</button>
            <button onClick={() => inputOp('×')} className={`${OP_STYLE} ${op === '×' && fresh ? 'ring-1 ring-accent/50' : ''}`}>×</button>

            <button onClick={() => inputDigit('4')} className={NUM}>4</button>
            <button onClick={() => inputDigit('5')} className={NUM}>5</button>
            <button onClick={() => inputDigit('6')} className={NUM}>6</button>
            <button onClick={() => inputOp('-')} className={`${OP_STYLE} ${op === '-' && fresh ? 'ring-1 ring-accent/50' : ''}`}>−</button>

            <button onClick={() => inputDigit('1')} className={NUM}>1</button>
            <button onClick={() => inputDigit('2')} className={NUM}>2</button>
            <button onClick={() => inputDigit('3')} className={NUM}>3</button>
            <button onClick={() => inputOp('+')} className={`${OP_STYLE} ${op === '+' && fresh ? 'ring-1 ring-accent/50' : ''}`}>+</button>

            <button onClick={() => inputDigit('0')} className={`${NUM} col-span-2`}>0</button>
            <button onClick={() => inputDigit('.')} className={NUM}>.</button>
            <button onClick={execute} className={`${BTN} bg-accent text-background font-bold hover:bg-accent/80`}>=</button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="px-3 pb-2 border-t border-white/10 pt-1.5">
              <span className="text-[8px] font-mono text-white/25 uppercase tracking-widest">History</span>
              {history.map((h, i) => (
                <div key={i} className="text-[9px] font-mono text-white/35 truncate">{h}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
