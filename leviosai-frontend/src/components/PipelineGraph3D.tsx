import { useState, useRef, useEffect, useCallback } from 'react'
import type { WizardState } from '../types'
import { exportCanvasPdf } from '../utils/pdfTemplate'

interface Node3D {
  label: string
  detail: string
  sub?: string
  color: [number, number, number]
  y: number
}

const NODE_COLORS: Record<string, [number, number, number]> = {
  accent: [107, 150, 190],
  cyan:   [34, 211, 238],
  green:  [74, 222, 128],
  yellow: [250, 204, 21],
}

function buildNodes(state: WizardState): Node3D[] {
  const nodes: Node3D[] = []
  let y = 0
  const spacing = 1.4

  if (state.domain) {
    nodes.push({ label: 'DOMAIN', detail: state.domain, color: NODE_COLORS.accent, y })
    y += spacing
  }
  if (state.hardware) {
    nodes.push({ label: 'HARDWARE', detail: state.hardware.device, sub: state.hardware.specs, color: NODE_COLORS.accent, y })
    y += spacing
  }
  if (state.sensors?.length > 0) {
    nodes.push({
      label: 'SENSORS', detail: `${state.sensors.length} peripheral${state.sensors.length !== 1 ? 's' : ''}`,
      sub: state.sensors.map(s => s.name).join(', '), color: NODE_COLORS.cyan, y,
    })
    y += spacing
  }
  if (state.model) {
    nodes.push({ label: 'AI MODEL', detail: state.model.name, sub: state.model.params, color: NODE_COLORS.green, y })
    y += spacing
  }
  if (state.techniques.length > 0) {
    state.techniques.forEach(t => {
      nodes.push({
        label: 'OPTIMIZE', detail: t.name,
        sub: t.subtype ? t.subtype.toUpperCase() : undefined,
        color: NODE_COLORS.yellow, y,
      })
      y += spacing
    })
  }
  const totalH = y - spacing
  nodes.forEach(n => n.y -= totalH / 2)
  return nodes
}

export default function PipelineGraph3D({ state }: { state: WizardState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rotY = useRef(-0.3)
  const rotX = useRef(0.35)
  const zoom = useRef(1.0)
  const panX = useRef(0)
  const panY = useRef(0)
  const dragging = useRef(false)
  const panning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const autoRotate = useRef(true)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [lightMode, setLightMode] = useState(false)
  const [is3D, setIs3D] = useState(true)
  const lightRef = useRef(false)
  const is3DRef = useRef(true)

  useEffect(() => { lightRef.current = lightMode }, [lightMode])
  useEffect(() => {
    is3DRef.current = is3D
    panX.current = 0
    panY.current = 0
    if (!is3D) {
      rotX.current = 0
      rotY.current = 0
      autoRotate.current = false
    } else {
      rotX.current = 0.35
      rotY.current = -0.3
      autoRotate.current = true
    }
  }, [is3D])

  const nodes = buildNodes(state)

  const project = useCallback((x: number, y: number, z: number, w: number, h: number, rX: number, rY: number, zm: number) => {
    const px = panX.current
    const py = panY.current
    if (!is3DRef.current) {
      const scale = zm
      return { sx: w / 2 + x * scale * w * 0.22 + px, sy: h / 2 + y * scale * h * 0.22 + py, scale, z: 0 }
    }
    const cosY = Math.cos(rY), sinY = Math.sin(rY)
    const x1 = x * cosY - z * sinY
    const z1 = x * sinY + z * cosY
    const cosX = Math.cos(rX), sinX = Math.sin(rX)
    const y1 = y * cosX - z1 * sinX
    const z2 = y * sinX + z1 * cosX
    const fov = 4.5 / zm
    const scale = fov / (fov + z2 + 3) * zm
    return { sx: w / 2 + x1 * scale * w * 0.22 + px, sy: h / 2 + y1 * scale * h * 0.22 + py, scale, z: z2 }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const light = lightRef.current
    const mode3D = is3DRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (light) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    } else {
      ctx.fillStyle = '#09090f'
      ctx.fillRect(0, 0, w, h)
    }

    const rX = rotX.current
    const rY = rotY.current
    const zm = zoom.current

    ctx.globalAlpha = light ? 0.3 : 0.18
    ctx.strokeStyle = light ? '#000000' : '#ffffff'
    ctx.lineWidth = 0.7
    const gridSize = 6
    const gridStep = 0.8
    if (mode3D) {
      for (let i = -gridSize; i <= gridSize; i += gridStep) {
        const p1 = project(i, 2.5, -gridSize, w, h, rX, rY, zm)
        const p2 = project(i, 2.5, gridSize, w, h, rX, rY, zm)
        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke()
        const p3 = project(-gridSize, 2.5, i, w, h, rX, rY, zm)
        const p4 = project(gridSize, 2.5, i, w, h, rX, rY, zm)
        ctx.beginPath(); ctx.moveTo(p3.sx, p3.sy); ctx.lineTo(p4.sx, p4.sy); ctx.stroke()
      }
    } else {
      for (let i = -gridSize; i <= gridSize; i += gridStep) {
        const yy = h / 2 + i * zm * h * 0.22 * 0.18
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke()
      }
    }
    ctx.globalAlpha = 1

    if (nodes.length === 0) {
      ctx.fillStyle = light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('No pipeline configured', w / 2, h / 2)
      return
    }

    const projected = nodes.map(n => {
      const p = project(0, n.y, 0, w, h, rX, rY, zm)
      return { ...n, ...p }
    })
    projected.sort((a, b) => b.z - a.z)

    for (let i = 0; i < nodes.length - 1; i++) {
      const a = project(0, nodes[i].y, 0, w, h, rX, rY, zm)
      const b = project(0, nodes[i + 1].y, 0, w, h, rX, rY, zm)
      const [r, g, bb] = nodes[i + 1].color
      const connAlpha = light ? 0.7 : 0.5
      const grad = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy)
      grad.addColorStop(0, `rgba(${nodes[i].color.join(',')}, ${connAlpha})`)
      grad.addColorStop(1, `rgba(${r},${g},${bb}, ${connAlpha})`)
      ctx.strokeStyle = grad
      ctx.lineWidth = 2 * Math.min(a.scale, b.scale)
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke()

      const t = (timeRef.current * 0.5 + i * 0.3) % 1
      const px = a.sx + (b.sx - a.sx) * t
      const py = a.sy + (b.sy - a.sy) * t
      const ps = (a.scale + b.scale) / 2
      ctx.beginPath()
      ctx.arc(px, py, 2.5 * ps, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r},${g},${bb}, ${0.8 - t * 0.6})`
      ctx.fill()
    }

    for (const n of projected) {
      const [r, g, b] = n.color
      const s = n.scale
      const bw = 150 * s
      const bh = 60 * s
      const x = n.sx - bw / 2
      const y = n.sy - bh / 2

      ctx.shadowColor = light ? `rgba(${r},${g},${b}, 0.25)` : `rgba(${r},${g},${b}, 0.4)`
      ctx.shadowBlur = 20 * s

      if (mode3D) {
        const depth = 8 * s
        ctx.fillStyle = `rgba(${r},${g},${b}, ${light ? 0.1 : 0.06})`
        ctx.beginPath()
        ctx.moveTo(x + 6, y + bh)
        ctx.lineTo(x + bw - 6, y + bh)
        ctx.lineTo(x + bw - 6 + depth * 0.4, y + bh + depth)
        ctx.lineTo(x + 6 + depth * 0.4, y + bh + depth)
        ctx.fill()

        ctx.fillStyle = `rgba(${r},${g},${b}, ${light ? 0.08 : 0.04})`
        ctx.beginPath()
        ctx.moveTo(x + bw, y + 6)
        ctx.lineTo(x + bw, y + bh - 6)
        ctx.lineTo(x + bw + depth * 0.4, y + bh - 6 + depth)
        ctx.lineTo(x + bw + depth * 0.4, y + 6 + depth)
        ctx.fill()
      }

      ctx.shadowBlur = 0

      const radius = 10 * s
      ctx.beginPath()
      ctx.roundRect(x, y, bw, bh, radius)
      ctx.fillStyle = light ? `rgba(${r},${g},${b}, 0.15)` : `rgba(${r},${g},${b}, 0.12)`
      ctx.fill()
      ctx.strokeStyle = `rgba(${r},${g},${b}, ${light ? 0.7 : 0.5})`
      ctx.lineWidth = 1.2 * s
      ctx.stroke()

      ctx.fillStyle = `rgba(${r},${g},${b}, ${light ? 0.9 : 0.7})`
      ctx.font = `${Math.max(8, 9 * s)}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(n.label, n.sx, n.sy - 12 * s)

      ctx.fillStyle = light ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'
      ctx.font = `bold ${Math.max(9, 11 * s)}px -apple-system, sans-serif`
      const detail = n.detail.length > 18 ? n.detail.slice(0, 17) + '...' : n.detail
      ctx.fillText(detail, n.sx, n.sy + 4 * s)

      if (n.sub) {
        ctx.fillStyle = light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)'
        ctx.font = `${Math.max(7, 8 * s)}px monospace`
        const sub = n.sub.length > 22 ? n.sub.slice(0, 21) + '...' : n.sub
        ctx.fillText(sub, n.sx, n.sy + 18 * s)
      }
    }

    ctx.shadowBlur = 0
    ctx.fillStyle = light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('PIPELINE OVERVIEW', w / 2, 20)
    ctx.fillStyle = light ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)'
    ctx.font = '9px monospace'
    const hint = mode3D ? `${nodes.length} stages · drag: rotate · shift+drag: pan · scroll: zoom` : `${nodes.length} stages · drag to pan · scroll to zoom`
    ctx.fillText(hint, w / 2, h - 14)
  }, [nodes, project])

  useEffect(() => {
    let running = true
    const loop = () => {
      if (!running) return
      timeRef.current += 0.012
      if (autoRotate.current && is3DRef.current) {
        rotY.current += 0.006
      }
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [draw])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.08 : 0.08
      zoom.current = Math.max(0.4, Math.min(3.0, zoom.current + delta))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    lastMouse.current = { x: e.clientX, y: e.clientY }
    if (e.shiftKey || !is3DRef.current) {
      panning.current = true
    } else {
      dragging.current = true
      autoRotate.current = false
    }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    if (panning.current) {
      panX.current += dx
      panY.current += dy
    } else if (dragging.current) {
      rotY.current += dx * 0.008
      rotX.current += dy * 0.005
    }
  }, [])

  const onMouseUp = useCallback(() => {
    const wasDragging = dragging.current
    dragging.current = false
    panning.current = false
    if (wasDragging && is3DRef.current) {
      setTimeout(() => { if (!dragging.current) autoRotate.current = true }, 3000)
    }
  }, [])

  const exportPdf = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    exportCanvasPdf(canvas, 'Pipeline Overview', state)
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setLightMode(v => !v)}
          title={lightMode ? 'Switch to Dark' : 'Switch to Light'}
          className={[
            'flex items-center justify-center w-7 h-7 rounded-lg border text-[11px] font-mono transition-all',
            lightMode
              ? 'bg-white/90 border-black/15 text-gray-700 hover:bg-white shadow-sm'
              : 'bg-white/8 border-white/15 text-white/60 hover:bg-white/15 hover:text-white',
          ].join(' ')}
        >
          {lightMode ? 'LT' : 'DK'}
        </button>
        <button
          onClick={() => setIs3D(v => !v)}
          title={is3D ? 'Switch to 2D' : 'Switch to 3D'}
          className={[
            'flex items-center justify-center h-7 px-2 rounded-lg border text-[10px] font-mono font-bold tracking-wide transition-all',
            lightMode
              ? 'bg-white/90 border-black/15 text-gray-700 hover:bg-white shadow-sm'
              : 'bg-white/8 border-white/15 text-white/60 hover:bg-white/15 hover:text-white',
          ].join(' ')}
        >
          {is3D ? '2D' : '3D'}
        </button>
        <button
          onClick={exportPdf}
          title="Export as PDF"
          className={[
            'flex items-center justify-center h-7 px-2 rounded-lg border text-[10px] font-mono font-bold tracking-wide transition-all',
            lightMode
              ? 'bg-white/90 border-black/15 text-gray-700 hover:bg-white shadow-sm'
              : 'bg-white/8 border-white/15 text-white/60 hover:bg-white/15 hover:text-white',
          ].join(' ')}
        >
          PDF
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  )
}
