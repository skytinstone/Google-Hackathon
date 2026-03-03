import { useState, useEffect, useRef, type FormEvent } from 'react'
import { api } from '../api/api'

interface LoginScreenProps {
  onLogin: () => void
}


export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showPw, setShowPw]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.login(username, password)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-tech-grid min-h-screen flex flex-col items-center justify-center relative overflow-hidden">

      {/* Matrix grid animation */}
      <MatrixGrid />

      {/* Corner decorations */}
      <CornerDecor position="top-left" />
      <CornerDecor position="top-right" />
      <CornerDecor position="bottom-left" />
      <CornerDecor position="bottom-right" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-white/3 blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="animate-fade-in relative z-10 w-full max-w-md mx-4">

        {/* Top status bar */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-xs text-green-400 tracking-widest uppercase">System Online</span>
          <span className="ml-auto font-mono text-xs text-secondary">v1.0.0</span>
        </div>

        {/* Card */}
        <div className="bg-[#13131a]/90 backdrop-blur-sm border border-white/8 rounded-2xl p-8 glow-accent">

          {/* Brand */}
          <div className="mb-6">
            <div className="flex items-center gap-3 leading-none">
              <img src="/leviosai.png" alt="LeviosAI" className="w-9 h-9 object-contain rounded-md" />
              <h1 className="font-mono text-2xl font-bold text-primary tracking-tight leading-none">
                LeviosAI
              </h1>
            </div>
            <p className="text-xs text-secondary font-mono mt-1.5">Edge AI Optimization Platform</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="font-mono text-xs text-secondary tracking-widest">AUTHENTICATE</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block font-mono text-xs text-secondary uppercase tracking-widest mb-2">
                User ID
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">
                  &gt;_
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your ID"
                  autoComplete="username"
                  required
                  className="w-full bg-background/60 border border-white/10 text-primary font-mono text-sm rounded-lg pl-10 pr-4 py-3 placeholder:text-secondary/40 focus:outline-none focus:border-accent/60 focus:bg-background/80 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-mono text-xs text-secondary uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">
                  ••
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-background/60 border border-white/10 text-primary font-mono text-sm rounded-lg pl-10 pr-12 py-3 placeholder:text-secondary/40 focus:outline-none focus:border-accent/60 focus:bg-background/80 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors text-xs font-mono"
                  tabIndex={-1}
                >
                  {showPw ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="w-4 h-4 flex-shrink-0 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold">!</span>
                <p className="text-red-400 font-mono text-xs">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full mt-2 font-mono text-sm font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-200 bg-primary text-background hover:bg-primary/85 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Initialize Session
                  <span className="animate-blink">_</span>
                </span>
              )}
            </button>
          </form>

        </div>

        {/* Bottom label */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="font-mono text-xs text-secondary/50">Developed by Minseok Shin</span>
          <span className="font-mono text-xs text-secondary/50">Google Hackathon 2026</span>
        </div>
      </div>
    </div>
  )
}

/* ── Matrix Grid Animation ───────────────────────────────── */

interface Particle {
  gx: number
  gy: number
  dir: 'h' | 'v'
  progress: number
  speed: number
  segLen: number
}

function MatrixGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GRID = 48
    const COLOR = '107, 150, 190'
    let animId: number
    let width = 0
    let height = 0

    function resize() {
      if (!canvas) return
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    function spawnParticle(): Particle {
      const dir: 'h' | 'v' = Math.random() < 0.5 ? 'h' : 'v'
      const cols = Math.floor(width / GRID) + 1
      const rows = Math.floor(height / GRID) + 1
      return {
        gx: Math.floor(Math.random() * cols) * GRID,
        gy: Math.floor(Math.random() * rows) * GRID,
        dir,
        progress: 0,
        speed: 0.004 + Math.random() * 0.012,
        segLen: 2 + Math.floor(Math.random() * 5),
      }
    }

    const particles: Particle[] = Array.from({ length: 35 }, () => {
      const p = spawnParticle()
      p.progress = Math.random()
      return p
    })

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.progress += p.speed
        if (p.progress >= 1) {
          particles[i] = spawnParticle()
          continue
        }

        const t = p.progress
        const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1
        const dist = t * p.segLen * GRID

        const x = p.dir === 'h' ? p.gx + dist : p.gx
        const y = p.dir === 'h' ? p.gy : p.gy + dist

        // Glow head
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10)
        glow.addColorStop(0, `rgba(${COLOR}, ${alpha * 0.95})`)
        glow.addColorStop(0.3, `rgba(${COLOR}, ${alpha * 0.45})`)
        glow.addColorStop(1, `rgba(${COLOR}, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fill()

        // Trail
        const trailDist = Math.min(dist, GRID * 1.5)
        const tx = p.dir === 'h' ? x - trailDist : x
        const ty = p.dir === 'h' ? y : y - trailDist
        const trail = ctx.createLinearGradient(tx, ty, x, y)
        trail.addColorStop(0, `rgba(${COLOR}, 0)`)
        trail.addColorStop(1, `rgba(${COLOR}, ${alpha * 0.55})`)
        ctx.strokeStyle = trail
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  )
}

type CornerPos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

function CornerDecor({ position }: { position: CornerPos }) {
  const base = 'absolute w-16 h-16 pointer-events-none'
  const posMap: Record<CornerPos, string> = {
    'top-left':     'top-6 left-6 border-t border-l',
    'top-right':    'top-6 right-6 border-t border-r',
    'bottom-left':  'bottom-6 left-6 border-b border-l',
    'bottom-right': 'bottom-6 right-6 border-b border-r',
  }
  return (
    <div className={`${base} ${posMap[position]} border-white/12`} />
  )
}
