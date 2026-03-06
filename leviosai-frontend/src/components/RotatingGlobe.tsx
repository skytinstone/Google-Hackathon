import { useEffect, useRef } from 'react'

interface Props {
  size?: number
  chatOpen?: boolean
}

export default function RotatingGlobe({ size = 220, chatOpen }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const angleRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r = size / 2 - 8

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, size, size)
      const angle = angleRef.current

      // Outer circle (globe edge)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Latitude lines (horizontal ellipses)
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180
        const y = cy - Math.sin(latRad) * r
        const rx = Math.cos(latRad) * r
        ctx.beginPath()
        ctx.ellipse(cx, y, rx, rx * 0.08, 0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.08)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Longitude lines (vertical ellipses that rotate)
      for (let i = 0; i < 8; i++) {
        const lng = (i * Math.PI) / 4 + angle
        const rxScale = Math.cos(lng)
        const rx = Math.abs(rxScale) * r

        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, r, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(100, 200, 255, ${0.06 + Math.abs(rxScale) * 0.1})`
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      // Continent outlines (connected lines) + dots
      const continentGroups = getContinentOutlines()
      continentGroups.forEach(outline => {
        const projected = outline.map(([lat, lng]) => project(lat, lng, angle, r, cx, cy))
        const visible = projected.filter(p => p !== null) as { x: number; y: number; opacity: number; z: number }[]

        // Draw connected lines between visible points
        if (visible.length >= 2) {
          ctx.beginPath()
          ctx.moveTo(visible[0].x, visible[0].y)
          for (let i = 1; i < visible.length; i++) {
            ctx.lineTo(visible[i].x, visible[i].y)
          }
          ctx.closePath()
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)'
          ctx.lineWidth = 0.8
          ctx.stroke()

          // Fill with very subtle green
          ctx.fillStyle = 'rgba(74, 222, 128, 0.04)'
          ctx.fill()
        }

        // Draw green dots at each point
        visible.forEach(({ x, y, opacity }) => {
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(74, 222, 128, ${opacity})`
          ctx.fill()
        })
      })

      // Glow at center
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      gradient.addColorStop(0, 'rgba(74, 222, 128, 0.03)')
      gradient.addColorStop(1, 'rgba(74, 222, 128, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      angleRef.current += 0.005
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [size])

  return (
    <div
      className="fixed pointer-events-none select-none"
      style={{
        left: 110, bottom: 150, zIndex: 15,
        opacity: chatOpen ? 0 : 0.7,
        transform: chatOpen ? 'scale(0.3) rotate(-30deg)' : 'scale(1) rotate(0deg)',
        transformOrigin: 'bottom left',
        filter: chatOpen ? 'blur(10px)' : 'blur(0px)',
        transition: 'opacity 0.6s ease, transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.6s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
      />
    </div>
  )
}

function project(
  lat: number, lng: number, rotation: number,
  radius: number, cx: number, cy: number
): { x: number; y: number; opacity: number; z: number } | null {
  const latRad = (lat * Math.PI) / 180
  const lngRad = ((lng * Math.PI) / 180) + rotation
  const x3d = Math.cos(latRad) * Math.sin(lngRad)
  const z3d = Math.cos(latRad) * Math.cos(lngRad)
  const y3d = Math.sin(latRad)

  if (z3d < -0.1) return null
  return {
    x: cx + x3d * radius,
    y: cy - y3d * radius,
    opacity: 0.2 + z3d * 0.35,
    z: z3d,
  }
}

// Continent outlines as ordered [lat, lng] paths
function getContinentOutlines(): [number, number][][] {
  return [
    // Asia (outline)
    [
      [50, 40], [55, 55], [60, 70], [65, 90], [60, 100],
      [55, 120], [50, 130], [45, 140], [40, 140], [35, 135],
      [30, 120], [20, 110], [10, 105], [15, 100], [20, 95],
      [25, 80], [30, 70], [35, 55], [40, 45], [45, 40], [50, 40],
    ],
    // Europe (outline)
    [
      [36, -5], [38, 0], [43, -8], [47, -2], [48, 2],
      [50, 5], [55, 12], [58, 15], [63, 10], [65, 25],
      [60, 30], [55, 37], [50, 30], [47, 20], [45, 15],
      [42, 12], [40, 15], [38, 25], [36, 25], [36, -5],
    ],
    // Africa (outline)
    [
      [35, -5], [35, 10], [30, 32], [25, 35], [20, 40],
      [10, 42], [5, 40], [0, 42], [-5, 40], [-10, 40],
      [-15, 35], [-20, 35], [-25, 33], [-30, 30], [-35, 25],
      [-33, 18], [-30, 15], [-20, 12], [-10, 14], [-5, 10],
      [0, 10], [5, 2], [10, -5], [15, -15], [25, -15],
      [30, -5], [35, -5],
    ],
    // North America (outline)
    [
      [70, -160], [65, -140], [60, -140], [55, -130], [50, -125],
      [45, -125], [40, -120], [35, -118], [30, -115], [25, -110],
      [20, -105], [18, -100], [20, -90], [25, -90], [30, -85],
      [35, -80], [40, -75], [45, -70], [48, -60], [50, -55],
      [55, -60], [60, -65], [65, -70], [70, -90], [72, -120],
      [70, -160],
    ],
    // South America (outline)
    [
      [12, -70], [10, -75], [5, -77], [0, -80], [-5, -80],
      [-5, -75], [-10, -70], [-15, -75], [-20, -70], [-25, -65],
      [-30, -60], [-35, -58], [-40, -65], [-45, -68], [-50, -70],
      [-55, -68], [-55, -65], [-50, -60], [-40, -55], [-35, -50],
      [-30, -48], [-25, -45], [-20, -40], [-15, -40], [-10, -37],
      [-5, -35], [0, -50], [5, -55], [8, -60], [10, -65], [12, -70],
    ],
    // Australia (outline)
    [
      [-12, 130], [-15, 125], [-20, 115], [-25, 115], [-30, 115],
      [-33, 118], [-35, 120], [-35, 135], [-37, 140], [-38, 145],
      [-37, 150], [-35, 152], [-30, 153], [-25, 150], [-20, 148],
      [-15, 145], [-12, 142], [-12, 135], [-12, 130],
    ],
  ]
}
