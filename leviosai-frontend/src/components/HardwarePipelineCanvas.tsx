import { useRef, useState, useCallback, useEffect } from 'react'
import type { WizardState } from '../types'
import { exportCanvasPdf } from '../utils/pdfTemplate'

const NODE_W = 160
const NODE_H = 66
const PORT_R = 6
const PORT_HIT = 14

const TYPE_COL: Record<string, [number, number, number]> = {
  Vision: [107, 150, 190], Depth: [130, 170, 200], RF: [160, 130, 200],
  Audio: [200, 160, 100], Motion: [100, 200, 160], Thermal: [200, 120, 100],
  Proximity: [180, 180, 100], Location: [100, 180, 200],
}

interface GNode {
  id: string; type: 'sensor' | 'hardware' | 'ai'
  label: string; detail: string; sub?: string
  x: number; y: number; color: [number, number, number]
}
interface GConn { from: string; to: string }

function initLayout(state: WizardState): { nodes: GNode[]; conns: GConn[] } {
  const nodes: GNode[] = []
  const conns: GConn[] = []
  const S = state.sensors.length
  state.sensors.forEach((s, i) => {
    const yOff = S > 1 ? (i - (S - 1) / 2) * (NODE_H + 20) : 0
    nodes.push({
      id: `s_${s.id}`, type: 'sensor', label: s.type,
      detail: s.name, sub: `${s.quantity ?? 1}x · ${s.specs}`,
      x: -280, y: yOff, color: TYPE_COL[s.type] ?? [107, 150, 190],
    })
  })
  if (state.hardware) {
    nodes.push({
      id: 'hw', type: 'hardware', label: 'COMPUTE',
      detail: state.hardware.device, sub: state.hardware.specs,
      x: 0, y: 0, color: [107, 150, 190],
    })
    state.sensors.forEach(s => conns.push({ from: `s_${s.id}`, to: 'hw' }))
  }
  nodes.push({
    id: 'ai', type: 'ai', label: 'AI MODEL',
    detail: state.model?.name ?? 'Next Step',
    sub: state.model?.params, x: 280, y: 0, color: [74, 222, 128],
  })
  if (state.hardware) conns.push({ from: 'hw', to: 'ai' })
  return { nodes, conns }
}

export default function HardwarePipelineCanvas({ state }: { state: WizardState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<GNode[]>([])
  const connsRef = useRef<GConn[]>([])
  const prevKeyRef = useRef('')

  // View
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const [lightMode, setLightMode] = useState(false)
  const [is3D, setIs3D] = useState(false)
  const lightRef = useRef(false)
  const is3DRef = useRef(false)
  const rotRef = useRef({ x: 0.35, y: -0.3 })
  const autoRotRef = useRef(false)
  const timeRef = useRef(0)
  const animRef = useRef(0)

  // Interaction
  const dragNodeRef = useRef<string | null>(null)
  const panningRef = useRef(false)
  const rotatingRef = useRef(false)
  const connDrawRef = useRef<{ fromId: string } | null>(null)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const mousePosRef = useRef({ x: 0, y: 0 })
  const hoverPortRef = useRef<{ nodeId: string; side: 'in' | 'out' } | null>(null)

  useEffect(() => { lightRef.current = lightMode }, [lightMode])
  useEffect(() => {
    is3DRef.current = is3D
    if (is3D) { rotRef.current = { x: 0.35, y: -0.3 }; autoRotRef.current = true }
    else { rotRef.current = { x: 0, y: 0 }; autoRotRef.current = false }
  }, [is3D])

  // Init/update nodes
  useEffect(() => {
    const key = JSON.stringify({
      s: state.sensors.map(s => s.id + (s.quantity ?? 1)),
      h: state.hardware?.device, m: state.model?.name,
    })
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key
      const { nodes, conns } = initLayout(state)
      // Preserve positions for existing nodes
      const oldMap = new Map(nodesRef.current.map(n => [n.id, n]))
      nodesRef.current = nodes.map(n => {
        const old = oldMap.get(n.id)
        return old ? { ...n, x: old.x, y: old.y } : n
      })
      connsRef.current = conns
    } else {
      // Just update labels
      const { nodes } = initLayout(state)
      nodesRef.current = nodesRef.current.map(n => {
        const upd = nodes.find(u => u.id === n.id)
        return upd ? { ...n, label: upd.label, detail: upd.detail, sub: upd.sub, color: upd.color } : n
      })
    }
  }, [state.sensors, state.hardware, state.model])

  // World ↔ screen
  const w2s = useCallback((wx: number, wy: number, cw: number, ch: number) => {
    const z = zoomRef.current
    return { x: cw / 2 + wx * z + panRef.current.x, y: ch / 2 + wy * z + panRef.current.y }
  }, [])

  const project3D = useCallback((wx: number, wy: number, _wz: number, cw: number, ch: number) => {
    const { x: rX, y: rY } = rotRef.current
    const zm = zoomRef.current
    const cosY = Math.cos(rY), sinY = Math.sin(rY)
    const x1 = wx * cosY - _wz * sinY
    const z1 = wx * sinY + _wz * cosY
    const cosX = Math.cos(rX), sinX = Math.sin(rX)
    const y1 = wy * cosX - z1 * sinX
    const z2 = wy * sinX + z1 * cosX
    const fov = 800 / zm
    const scale = fov / (fov + z2 + 400)
    return {
      x: cw / 2 + x1 * scale + panRef.current.x,
      y: ch / 2 + y1 * scale + panRef.current.y,
      scale,
    }
  }, [])

  const nodeScreen = useCallback((n: GNode, cw: number, ch: number) => {
    if (is3DRef.current) {
      const p = project3D(n.x, n.y, 0, cw, ch)
      return { x: p.x, y: p.y, s: p.scale }
    }
    const p = w2s(n.x, n.y, cw, ch)
    return { x: p.x, y: p.y, s: zoomRef.current }
  }, [w2s, project3D])

  // Hit test
  const hitTest = useCallback((mx: number, my: number, cw: number, ch: number) => {
    const nodes = nodesRef.current
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]
      const { x: sx, y: sy, s } = nodeScreen(n, cw, ch)
      const nw = NODE_W * s, nh = NODE_H * s
      // Output port (right)
      if (Math.hypot(mx - (sx + nw / 2), my - sy) < PORT_HIT * s)
        return { type: 'port' as const, nodeId: n.id, side: 'out' as const }
      // Input port (left)
      if (Math.hypot(mx - (sx - nw / 2), my - sy) < PORT_HIT * s)
        return { type: 'port' as const, nodeId: n.id, side: 'in' as const }
      // Node body
      if (mx >= sx - nw / 2 && mx <= sx + nw / 2 && my >= sy - nh / 2 && my <= sy + nh / 2)
        return { type: 'node' as const, nodeId: n.id }
    }
    return null
  }, [nodeScreen])

  // ── Draw ─────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const light = lightRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const w = rect.width, h = rect.height
    canvas.width = w * dpr; canvas.height = h * dpr
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Background
    ctx.fillStyle = light ? '#ffffff' : '#09090f'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.globalAlpha = light ? 0.12 : 0.06
    ctx.strokeStyle = light ? '#000' : '#fff'
    ctx.lineWidth = 0.5
    const gs = 40 * zoomRef.current
    const offX = ((panRef.current.x % gs) + gs) % gs
    const offY = ((panRef.current.y % gs) + gs) % gs
    for (let x = offX; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = offY; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    ctx.globalAlpha = 1

    const nodes = nodesRef.current
    const conns = connsRef.current

    // ── Connections ──
    for (const c of conns) {
      const fn = nodes.find(n => n.id === c.from)
      const tn = nodes.find(n => n.id === c.to)
      if (!fn || !tn) continue
      const fs = nodeScreen(fn, w, h), ts = nodeScreen(tn, w, h)
      const fx = fs.x + NODE_W * fs.s / 2, fy = fs.y
      const tx = ts.x - NODE_W * ts.s / 2, ty = ts.y
      const cpOff = Math.max(40, Math.abs(tx - fx) * 0.4)
      const [r, g, b] = tn.color
      ctx.beginPath()
      ctx.moveTo(fx, fy)
      ctx.bezierCurveTo(fx + cpOff, fy, tx - cpOff, ty, tx, ty)
      ctx.strokeStyle = `rgba(${r},${g},${b}, ${light ? 0.5 : 0.35})`
      ctx.lineWidth = 2 * Math.min(fs.s, ts.s)
      ctx.stroke()

      // Animated pulse
      const t = (timeRef.current * 0.4 + conns.indexOf(c) * 0.15) % 1
      const mt = 1 - t
      const px = mt ** 3 * fx + 3 * mt ** 2 * t * (fx + cpOff) + 3 * mt * t ** 2 * (tx - cpOff) + t ** 3 * tx
      const py = mt ** 3 * fy + 3 * mt ** 2 * t * fy + 3 * mt * t ** 2 * ty + t ** 3 * ty
      ctx.beginPath()
      ctx.arc(px, py, 3 * Math.min(fs.s, ts.s), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r},${g},${b}, ${0.8 - t * 0.5})`
      ctx.fill()
    }

    // ── Connection being drawn ──
    if (connDrawRef.current) {
      const fn = nodes.find(n => n.id === connDrawRef.current!.fromId)
      if (fn) {
        const fs = nodeScreen(fn, w, h)
        const fx = fs.x + NODE_W * fs.s / 2, fy = fs.y
        const mx = mousePosRef.current.x, my = mousePosRef.current.y
        const cpOff = Math.max(30, Math.abs(mx - fx) * 0.4)
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.bezierCurveTo(fx + cpOff, fy, mx - cpOff, my, mx, my)
        ctx.strokeStyle = light ? 'rgba(107,150,190,0.6)' : 'rgba(107,150,190,0.4)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // ── Nodes ──
    for (const n of nodes) {
      const { x: sx, y: sy, s } = nodeScreen(n, w, h)
      const [r, g, b] = n.color
      const nw = NODE_W * s, nh = NODE_H * s
      const x = sx - nw / 2, y = sy - nh / 2

      // Glow
      ctx.shadowColor = `rgba(${r},${g},${b}, ${light ? 0.2 : 0.3})`
      ctx.shadowBlur = 16 * s

      // Card
      const rad = 10 * s
      ctx.beginPath()
      ctx.roundRect(x, y, nw, nh, rad)
      ctx.fillStyle = light ? `rgba(${r},${g},${b}, 0.12)` : `rgba(${r},${g},${b}, 0.1)`
      ctx.fill()
      ctx.strokeStyle = `rgba(${r},${g},${b}, ${n.type === 'hardware' ? (light ? 0.8 : 0.6) : (light ? 0.5 : 0.4)})`
      ctx.lineWidth = n.type === 'hardware' ? 2.5 * s : 1.2 * s
      ctx.stroke()
      ctx.shadowBlur = 0

      // Label
      ctx.fillStyle = `rgba(${r},${g},${b}, ${light ? 0.7 : 0.5})`
      ctx.font = `${Math.max(7, 8 * s)}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(n.label, sx, sy - 16 * s)

      // Detail
      ctx.fillStyle = light ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'
      ctx.font = `bold ${Math.max(9, 11 * s)}px -apple-system, sans-serif`
      const detail = n.detail.length > 20 ? n.detail.slice(0, 19) + '...' : n.detail
      ctx.fillText(detail, sx, sy + 2 * s)

      // Sub
      if (n.sub) {
        ctx.fillStyle = light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'
        ctx.font = `${Math.max(7, 8 * s)}px monospace`
        const sub = n.sub.length > 24 ? n.sub.slice(0, 23) + '...' : n.sub
        ctx.fillText(sub, sx, sy + 18 * s)
      }

      // Ports
      const hp = hoverPortRef.current
      // Input port (left)
      ctx.beginPath()
      ctx.arc(x, sy, PORT_R * s, 0, Math.PI * 2)
      const inH = hp && hp.nodeId === n.id && hp.side === 'in'
      ctx.fillStyle = inH ? `rgba(${r},${g},${b}, 0.9)` : `rgba(${r},${g},${b}, ${light ? 0.3 : 0.2})`
      ctx.fill()
      ctx.strokeStyle = `rgba(${r},${g},${b}, ${light ? 0.6 : 0.4})`
      ctx.lineWidth = 1.2 * s
      ctx.stroke()
      // Output port (right)
      ctx.beginPath()
      ctx.arc(x + nw, sy, PORT_R * s, 0, Math.PI * 2)
      const outH = hp && hp.nodeId === n.id && hp.side === 'out'
      ctx.fillStyle = outH ? `rgba(${r},${g},${b}, 0.9)` : `rgba(${r},${g},${b}, ${light ? 0.3 : 0.2})`
      ctx.fill()
      ctx.strokeStyle = `rgba(${r},${g},${b}, ${light ? 0.6 : 0.4})`
      ctx.stroke()
    }

    // HUD
    ctx.shadowBlur = 0
    ctx.fillStyle = light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('HARDWARE PIPELINE', w / 2, 18)
    ctx.fillStyle = light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)'
    ctx.font = '9px monospace'
    const hint = is3DRef.current
      ? 'drag: rotate · shift+drag: pan · node drag: move · port→port: connect · right-click: delete'
      : 'drag node to move · port→port to connect · right-click line to delete · scroll: zoom'
    ctx.fillText(hint, w / 2, h - 12)
  }, [nodeScreen])

  // Animation loop
  useEffect(() => {
    let running = true
    const loop = () => {
      if (!running) return
      timeRef.current += 0.012
      if (autoRotRef.current && is3DRef.current) rotRef.current.y += 0.004
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [draw])

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current + (e.deltaY > 0 ? -0.08 : 0.08)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const getPos = useCallback((e: React.MouseEvent) => {
    const r = containerRef.current?.getBoundingClientRect()
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 }
  }, [])

  const getSize = useCallback(() => {
    const r = containerRef.current?.getBoundingClientRect()
    return r ? { w: r.width, h: r.height } : { w: 0, h: 0 }
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getPos(e)
    const { w, h } = getSize()
    lastMouseRef.current = pos
    const hit = hitTest(pos.x, pos.y, w, h)

    if (hit?.type === 'port' && hit.side === 'out') {
      connDrawRef.current = { fromId: hit.nodeId }
      mousePosRef.current = pos
    } else if (hit?.type === 'node') {
      dragNodeRef.current = hit.nodeId
      autoRotRef.current = false
    } else if (is3DRef.current && !e.shiftKey) {
      rotatingRef.current = true
      autoRotRef.current = false
    } else {
      panningRef.current = true
    }
  }, [getPos, getSize, hitTest])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getPos(e)
    const { w, h } = getSize()
    const dx = pos.x - lastMouseRef.current.x
    const dy = pos.y - lastMouseRef.current.y
    lastMouseRef.current = pos
    mousePosRef.current = pos

    // Hover
    const hit = hitTest(pos.x, pos.y, w, h)
    hoverPortRef.current = hit?.type === 'port' ? { nodeId: hit.nodeId, side: hit.side } : null

    // Cursor
    const cv = canvasRef.current
    if (cv) {
      if (connDrawRef.current || hit?.type === 'port') cv.style.cursor = 'crosshair'
      else if (dragNodeRef.current) cv.style.cursor = 'grabbing'
      else if (hit?.type === 'node') cv.style.cursor = 'grab'
      else cv.style.cursor = is3DRef.current ? 'grab' : 'default'
    }

    if (dragNodeRef.current) {
      const node = nodesRef.current.find(n => n.id === dragNodeRef.current)
      if (node) {
        const { s } = nodeScreen(node, w, h)
        node.x += dx / s
        node.y += dy / s
      }
    } else if (panningRef.current) {
      panRef.current.x += dx
      panRef.current.y += dy
    } else if (rotatingRef.current) {
      rotRef.current.y += dx * 0.006
      rotRef.current.x += dy * 0.004
    }
  }, [getPos, getSize, hitTest, nodeScreen])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const pos = getPos(e)
    const { w, h } = getSize()

    if (connDrawRef.current) {
      const hit = hitTest(pos.x, pos.y, w, h)
      if (hit?.type === 'port' && hit.side === 'in' && hit.nodeId !== connDrawRef.current.fromId) {
        const exists = connsRef.current.some(c => c.from === connDrawRef.current!.fromId && c.to === hit.nodeId)
        if (!exists) connsRef.current = [...connsRef.current, { from: connDrawRef.current.fromId, to: hit.nodeId }]
      }
      connDrawRef.current = null
    }

    if (rotatingRef.current && is3DRef.current)
      setTimeout(() => { if (!rotatingRef.current) autoRotRef.current = true }, 3000)

    dragNodeRef.current = null
    panningRef.current = false
    rotatingRef.current = false
  }, [getPos, getSize, hitTest])

  // Right-click to delete connection
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pos = getPos(e)
    const { w, h } = getSize()
    const nodes = nodesRef.current
    let bestIdx = -1, bestDist = 20
    for (let ci = 0; ci < connsRef.current.length; ci++) {
      const c = connsRef.current[ci]
      const fn = nodes.find(n => n.id === c.from)
      const tn = nodes.find(n => n.id === c.to)
      if (!fn || !tn) continue
      const fs = nodeScreen(fn, w, h), ts = nodeScreen(tn, w, h)
      const fx = fs.x + NODE_W * fs.s / 2, fy = fs.y
      const tx = ts.x - NODE_W * ts.s / 2, ty = ts.y
      const cpOff = Math.max(40, Math.abs(tx - fx) * 0.4)
      for (let t = 0; t <= 1; t += 0.04) {
        const mt = 1 - t
        const px = mt ** 3 * fx + 3 * mt ** 2 * t * (fx + cpOff) + 3 * mt * t ** 2 * (tx - cpOff) + t ** 3 * tx
        const py = mt ** 3 * fy + 3 * mt ** 2 * t * fy + 3 * mt * t ** 2 * ty + t ** 3 * ty
        const d = Math.hypot(pos.x - px, pos.y - py)
        if (d < bestDist) { bestDist = d; bestIdx = ci }
      }
    }
    if (bestIdx >= 0) connsRef.current = connsRef.current.filter((_, i) => i !== bestIdx)
  }, [getPos, getSize, nodeScreen])

  const onMouseLeave = useCallback(() => {
    dragNodeRef.current = null
    panningRef.current = false
    rotatingRef.current = false
    connDrawRef.current = null
    hoverPortRef.current = null
  }, [])

  const resetLayout = useCallback(() => {
    const { nodes, conns } = initLayout(state)
    nodesRef.current = nodes
    connsRef.current = conns
    panRef.current = { x: 0, y: 0 }
    zoomRef.current = 1
  }, [state])

  const exportPdf = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    exportCanvasPdf(canvas, 'Hardware Pipeline', state)
  }, [state])

  const btnClass = lightMode
    ? 'bg-white/90 border-black/15 text-gray-700 hover:bg-white shadow-sm'
    : 'bg-white/8 border-white/15 text-white/60 hover:bg-white/15 hover:text-white'

  return (
    <div ref={containerRef} className="h-full w-full relative">
      {/* Toolbar */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
        <button onClick={resetLayout} title="Reset Layout"
          className={`flex items-center justify-center h-7 px-2 rounded-lg border text-[10px] font-mono font-bold tracking-wide transition-all ${btnClass}`}
        >Reset</button>
        <button onClick={() => setLightMode(v => !v)} title={lightMode ? 'Dark' : 'Light'}
          className={`flex items-center justify-center w-7 h-7 rounded-lg border text-[11px] font-mono transition-all ${btnClass}`}
        >{lightMode ? 'LT' : 'DK'}</button>
        <button onClick={() => setIs3D(v => !v)} title={is3D ? '2D' : '3D'}
          className={`flex items-center justify-center h-7 px-2 rounded-lg border text-[10px] font-mono font-bold tracking-wide transition-all ${btnClass}`}
        >{is3D ? '2D' : '3D'}</button>
        <button onClick={exportPdf} title="Export PDF"
          className={`flex items-center justify-center h-7 px-2 rounded-lg border text-[10px] font-mono font-bold tracking-wide transition-all ${btnClass}`}
        >PDF</button>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onContextMenu={onContextMenu}
      />
    </div>
  )
}
