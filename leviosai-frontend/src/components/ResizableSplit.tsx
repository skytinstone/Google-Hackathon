import { useState, useRef, useCallback, useEffect } from 'react'

interface ResizableSplitProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftPercent?: number
  minLeftPercent?: number
  maxLeftPercent?: number
  className?: string
}

export default function ResizableSplit({
  left,
  right,
  defaultLeftPercent = 50,
  minLeftPercent = 25,
  maxLeftPercent = 75,
  className = '',
}: ResizableSplitProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = (x / rect.width) * 100
      setLeftPercent(Math.min(maxLeftPercent, Math.max(minLeftPercent, pct)))
    }

    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [minLeftPercent, maxLeftPercent])

  return (
    <div ref={containerRef} className={`flex flex-1 min-h-0 ${className}`}>
      {/* Left panel */}
      <div className="overflow-y-auto pr-1" style={{ width: `${leftPercent}%` }}>
        {left}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="flex-shrink-0 w-2 cursor-col-resize group flex items-center justify-center relative"
      >
        <div className="w-px h-full bg-white/8 group-hover:bg-accent/40 transition-colors" />
      </div>

      {/* Right panel */}
      <div className="overflow-y-auto pl-1 min-w-0 flex flex-col" style={{ width: `${100 - leftPercent}%` }}>
        {right}
      </div>
    </div>
  )
}
