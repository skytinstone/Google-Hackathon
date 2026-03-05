import { useState, useEffect, useRef } from 'react'

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const [visible, setVisible] = useState(false)
  const rafRef = useRef(0)
  const posRef = useRef({ x: -200, y: -200 })

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPos({ ...posRef.current })
          rafRef.current = 0
        })
      }
    }

    function handleEnter() { setVisible(true) }
    function handleLeave() { setVisible(false) }

    window.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseenter', handleEnter)
    document.addEventListener('mouseleave', handleLeave)
    setVisible(true)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseenter', handleEnter)
      document.removeEventListener('mouseleave', handleLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!visible) return null

  // Compensate for CSS zoom on <html> so label sticks to the real cursor
  const zoom = parseFloat(document.documentElement.style.zoom || '1') || 1
  const x = pos.x / zoom
  const y = pos.y / zoom

  const xStr = String(Math.round(pos.x)).padStart(4, '0')
  const yStr = String(Math.round(pos.y)).padStart(4, '0')

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none"
      style={{ zIndex: 99999, transform: `translate(${x + 16}px, ${y + 4}px)` }}
    >
      <div>
        <p className="text-[11px] font-mono font-bold tracking-wider leading-tight text-white/70">
          X:{xStr}
        </p>
        <p className="text-[11px] font-mono font-bold tracking-wider leading-tight text-white/70">
          Y:{yStr}
        </p>
      </div>
    </div>
  )
}
