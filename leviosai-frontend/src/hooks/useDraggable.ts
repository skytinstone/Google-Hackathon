import { useState, useRef, useCallback } from 'react'

interface Position { x: number; y: number }

function getZoom(): number {
  return parseFloat(document.documentElement.style.zoom || '1') || 1
}

export function useDraggable(name: string, initialX: number, initialY: number) {
  const [pos, setPos] = useState<Position>({ x: initialX, y: initialY })
  const dragging = useRef(false)
  const offset = useRef<Position>({ x: 0, y: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const zoom = getZoom()
    dragging.current = true
    offset.current = { x: e.clientX / zoom - pos.x, y: e.clientY / zoom - pos.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const z = getZoom()
      setPos({ x: ev.clientX / z - offset.current.x, y: ev.clientY / z - offset.current.y })
    }

    const onUp = (ev: MouseEvent) => {
      dragging.current = false
      const z = getZoom()
      const finalX = ev.clientX / z - offset.current.x
      const finalY = ev.clientY / z - offset.current.y
      console.log(`[Widget Position] ${name}: left=${Math.round(finalX)}, top=${Math.round(finalY)}`)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [pos, name])

  return { pos, onMouseDown }
}
