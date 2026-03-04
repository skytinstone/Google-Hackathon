import { useState, useRef, useCallback } from 'react'

interface Props {
  isOpen: boolean
  onToggle: () => void
}

export default function FloatingChatButton({ isOpen, onToggle }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false })
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y, moved: false }
    setDragging(true)

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
      setPos({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy })
    }
    function onUp() {
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos])

  function handleClick() {
    if (!dragRef.current.moved) onToggle()
  }

  return (
    <button
      ref={btnRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={[
        'fixed z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200',
        dragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-110',
        isOpen
          ? 'bg-accent border-2 border-accent/60 shadow-[0_0_24px_rgba(107,150,190,0.4)]'
          : 'bg-component border-2 border-white/15 hover:border-accent/40 shadow-[0_0_20px_rgba(0,0,0,0.5)]',
      ].join(' ')}
      style={{
        right: `${24 - pos.x}px`,
        bottom: `${24 - pos.y}px`,
      }}
      title="LeviosAI Assistant"
    >
      {isOpen ? (
        <span className="text-white text-lg font-bold">✕</span>
      ) : (
        <img src="/leviosai.png" alt="AI" className="w-7 h-7 object-contain" />
      )}
      {!isOpen && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-component animate-pulse" />
      )}
    </button>
  )
}
