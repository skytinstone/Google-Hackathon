import { useState, useRef, useCallback } from 'react'

interface Position { x: number; y: number }

export function useDraggable(name: string, initialX: number, initialY: number) {
  const [pos, setPos] = useState<Position>({ x: initialX, y: initialY })
  const dragging = useRef(false)
  const offset = useRef<Position>({ x: 0, y: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: ev.clientX - offset.current.x, y: ev.clientY - offset.current.y })
    }

    const onUp = (ev: MouseEvent) => {
      dragging.current = false
      const finalX = ev.clientX - offset.current.x
      const finalY = ev.clientY - offset.current.y
      console.log(`[Widget Position] ${name}: left=${finalX}, top=${finalY}`)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [pos, name])

  return { pos, onMouseDown }
}
