import { useState, useEffect, useRef, type FormEvent } from 'react'
import { api } from '../api/api'
import { useI18n, setLocale, type Locale } from '../utils/i18n'
import SystemLog from './SystemLog'

interface LoginScreenProps {
  onLogin: (username?: string) => void
}

/* ================================================================
   CSS Keyframes
   ================================================================ */
const STYLE_ID = 'login-intro-keyframes'
function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes hintPulse {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 0.8; }
    }
    @keyframes cardSlideIn {
      0%   { opacity:0; transform: translateX(40px); }
      100% { opacity:1; transform: translateX(0); }
    }
    @keyframes fadeIn {
      0%   { opacity:0; }
      100% { opacity:1; }
    }
    @keyframes cursorBlink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

/* ================================================================
   Phase:
   0 = dark
   1 = LEVIOSAI typewriter (centered, giant)
   2 = typing done → "Click anywhere" hint
   3 = brand moves left + shrinks, login card slides in from right
   ================================================================ */

// ── Decorative sub-components ────────────────────────────────

function VerticalWatermark() {
  const text = 'LEVIOSAI'
  const [count, setCount] = useState(0)

  useEffect(() => {
    let i = 0
    const id = setInterval(() => { i++; setCount(i); if (i >= text.length) clearInterval(id) }, 130)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed left-4 bottom-10 pointer-events-none select-none" style={{ zIndex: 0 }}>
      <p className="text-[72px] font-black font-mono tracking-[0.18em] text-white/[0.045] leading-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        {text.slice(0, count)}
        {count < text.length && <span className="animate-blink text-white/[0.06]">_</span>}
      </p>
    </div>
  )
}

function DateTimeDisplay() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <div className="fixed left-6 top-10 pointer-events-none select-none z-0 text-left">
      <p className="text-[38px] font-black font-mono tracking-[0.1em] text-white/30 leading-[0.9]">{now.toLocaleDateString('en-CA')}</p>
      <p className="text-[38px] font-black font-mono tracking-[0.1em] text-white/30 leading-[0.9]">{now.toLocaleTimeString('en-GB', { hour12: false })}</p>
    </div>
  )
}

function IpCountryDisplay() {
  const [info, setInfo] = useState<{ ip: string; country: string } | null>(null)
  useEffect(() => {
    // Try multiple APIs with fallback chain
    const apis = [
      { url: 'https://ipapi.co/json/', parse: (d: Record<string, string>) => ({ ip: d.ip, country: d.country_name }) },
      { url: 'https://ipwho.is/', parse: (d: Record<string, string>) => ({ ip: d.ip, country: d.country }) },
      { url: 'https://api.ipify.org?format=json', parse: (d: Record<string, string>) => ({ ip: d.ip, country: 'South Korea' }) },
    ]
    let cancelled = false
    async function fetchIp() {
      for (const api of apis) {
        if (cancelled) return
        try {
          const res = await fetch(api.url, { signal: AbortSignal.timeout(3000) })
          const data = await res.json()
          if (!cancelled) {
            const parsed = api.parse(data)
            setInfo({ ip: parsed.ip || '0.0.0.0', country: parsed.country || 'Unknown' })
            return
          }
        } catch { /* try next */ }
      }
      if (!cancelled) setInfo({ ip: '127.0.0.1', country: 'Local' })
    }
    fetchIp()
    return () => { cancelled = true }
  }, [])
  if (!info) return null
  return (
    <div className="fixed right-4 top-28 pointer-events-none select-none z-0">
      <p className="text-[20px] font-mono font-bold tracking-[0.18em] text-white/[0.12] leading-tight" style={{ writingMode: 'vertical-rl' }}>{info.ip} · {info.country}</p>
    </div>
  )
}

function VersionDisplay() {
  return (
    <div className="fixed right-6 bottom-6 pointer-events-none select-none z-0 text-right">
      <p className="text-[20px] font-mono font-bold tracking-[0.15em] text-white/[0.12] leading-relaxed">Version 0.9</p>
      <p className="text-[20px] font-mono font-bold tracking-[0.15em] text-white/[0.12] leading-relaxed">Updated 2026.03.04</p>
    </div>
  )
}

// ── Matrix Grid ──────────────────────────────────────────────

interface Particle { gx: number; gy: number; dir: 'h' | 'v'; progress: number; speed: number; segLen: number }

function MatrixGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const GRID = 48; const COLOR = '107, 150, 190'
    let animId: number; let width = 0; let height = 0
    function resize() { if (!canvas) return; width = canvas.offsetWidth; height = canvas.offsetHeight; canvas.width = width; canvas.height = height }
    resize(); window.addEventListener('resize', resize)
    function spawnParticle(): Particle {
      const dir: 'h' | 'v' = Math.random() < 0.5 ? 'h' : 'v'
      return { gx: Math.floor(Math.random() * (Math.floor(width / GRID) + 1)) * GRID, gy: Math.floor(Math.random() * (Math.floor(height / GRID) + 1)) * GRID, dir, progress: 0, speed: 0.004 + Math.random() * 0.012, segLen: 2 + Math.floor(Math.random() * 5) }
    }
    const particles: Particle[] = Array.from({ length: 35 }, () => { const p = spawnParticle(); p.progress = Math.random(); return p })
    function draw() {
      if (!ctx) return; ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]; p.progress += p.speed
        if (p.progress >= 1) { particles[i] = spawnParticle(); continue }
        const t = p.progress; const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1
        const dist = t * p.segLen * GRID
        const x = p.dir === 'h' ? p.gx + dist : p.gx; const y = p.dir === 'h' ? p.gy : p.gy + dist
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10)
        glow.addColorStop(0, `rgba(${COLOR}, ${alpha * 0.95})`); glow.addColorStop(0.3, `rgba(${COLOR}, ${alpha * 0.45})`); glow.addColorStop(1, `rgba(${COLOR}, 0)`)
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill()
        const trailDist = Math.min(dist, GRID * 1.5)
        const tx = p.dir === 'h' ? x - trailDist : x; const ty = p.dir === 'h' ? y : y - trailDist
        const trail = ctx.createLinearGradient(tx, ty, x, y)
        trail.addColorStop(0, `rgba(${COLOR}, 0)`); trail.addColorStop(1, `rgba(${COLOR}, ${alpha * 0.55})`)
        ctx.strokeStyle = trail; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke()
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

type CornerPos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
function CornerDecor({ position }: { position: CornerPos }) {
  const base = 'absolute w-16 h-16 pointer-events-none'
  const posMap: Record<CornerPos, string> = {
    'top-left': 'top-6 left-6 border-t border-l', 'top-right': 'top-6 right-6 border-t border-r',
    'bottom-left': 'bottom-6 left-6 border-b border-l', 'bottom-right': 'bottom-6 right-6 border-b border-r',
  }
  return <div className={`${base} ${posMap[position]} border-white/12`} />
}

/* ================================================================
   Main Login Screen
   ================================================================ */
export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t, locale } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showPw, setShowPw]     = useState(false)
  const [phase, setPhase]       = useState(0)
  const [clicked, setClicked]   = useState(false)

  // Typewriter state
  const BRAND = 'LEVIOSAI'
  const [charCount, setCharCount] = useState(0)
  const [typingDone, setTypingDone] = useState(false)

  useEffect(() => {
    injectKeyframes()
    // Start phase 1 (typewriter begins) after short dark delay
    const t1 = setTimeout(() => setPhase(1), 300)
    return () => clearTimeout(t1)
  }, [])

  // Typewriter effect: one character at a time
  useEffect(() => {
    if (phase < 1) return
    let i = 0
    const id = setInterval(() => {
      i++
      setCharCount(i)
      if (i >= BRAND.length) {
        clearInterval(id)
        // Small pause after typing completes, then show click hint
        setTimeout(() => {
          setTypingDone(true)
          setPhase(2)
        }, 400)
      }
    }, 180) // 180ms per character for dramatic effect
    return () => clearInterval(id)
  }, [phase >= 1 ? 1 : 0])

  function handleScreenClick() {
    if (phase < 2 || clicked) return
    setClicked(true)
    setTimeout(() => setPhase(3), 100) // brand moves left + card slides in
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try { await api.login(username, password); onLogin(username) }
    catch (err) { setError(err instanceof Error ? err.message : 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div
      className="bg-tech-grid min-h-screen flex items-center justify-center relative overflow-hidden"
      onClick={handleScreenClick}
    >
      {/* Background layers */}
      <div className="transition-opacity duration-700" style={{ opacity: phase >= 1 ? 1 : 0 }}>
        <VerticalWatermark />
        <DateTimeDisplay />
        <IpCountryDisplay />
        <VersionDisplay />
        <MatrixGrid />
        <CornerDecor position="top-left" />
        <CornerDecor position="top-right" />
        <CornerDecor position="bottom-left" />
        <CornerDecor position="bottom-right" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none transition-opacity duration-700" style={{ opacity: phase >= 1 ? 1 : 0 }} />

      {/* ── Language toggle — top-right ── */}
      <div className="fixed top-6 right-6 z-40 flex items-center gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
        {([['en', 'English'], ['ko', '한국어']] as const).map(([code, label]) => (
          <button
            key={code}
            onClick={() => setLocale(code as Locale)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all',
              locale === code
                ? 'bg-white/10 text-primary border border-white/20'
                : 'text-secondary/50 hover:text-primary hover:bg-white/5',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ Main content area: side-by-side in phase 3 ═══ */}
      <div
        className="relative z-20 flex items-center justify-center gap-16 w-full px-8"
        style={{
          transition: phase >= 3 ? 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {/* ── Brand (LEVIOSAI typewriter) ── */}
        <div
          className="flex flex-col items-center select-none pointer-events-none"
          style={{
            transition: phase >= 3 ? 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
            flex: phase >= 3 ? '0 0 auto' : '1 1 auto',
          }}
        >
          <h1
            className="font-black font-mono tracking-[0.12em] text-primary leading-none relative whitespace-nowrap"
            style={{
              fontSize: phase >= 3 ? '64px' : 'clamp(80px, 12vw, 160px)',
              transition: phase >= 3 ? 'font-size 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
              animation: 'none',
            }}
          >
            {/* Typed characters */}
            {BRAND.slice(0, charCount)}

            {/* Cursor only while actively typing */}
            {phase >= 1 && !typingDone && (
              <span className="text-accent/80 font-light">_</span>
            )}
          </h1>

          {/* Click hint (phase 2) */}
          {phase === 2 && !clicked && (
            <p
              className="mt-8 text-sm font-mono text-secondary/60 tracking-[0.3em] uppercase"
              style={{ animation: 'hintPulse 2s ease-in-out infinite' }}
            >
              {t('login.clickToContinue')}
            </p>
          )}
        </div>

        {/* ── White vertical divider ── */}
        {phase >= 3 && (
          <div className="h-80 w-px bg-white/15 flex-shrink-0" style={{ animation: 'fadeIn 0.6s ease-out both' }} />
        )}

        {/* ── Login card (phase 3, slides in from right) ── */}
        {phase >= 3 && (
          <div
            className="relative z-30 w-full max-w-md pointer-events-auto flex-shrink-0"
            style={{ animation: 'cardSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top status bar */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-xs text-green-400 tracking-widest uppercase">{t('login.systemOnline')}</span>
            </div>

            {/* Card */}
            <div className="bg-[#13131a]/90 backdrop-blur-sm border border-white/8 rounded-2xl p-8 glow-accent">
              {/* Tagline — larger, i18n */}
              <p className="text-center font-mono text-sm text-secondary/70 leading-relaxed mb-1">
                {t('login.tagline1')}
              </p>
              <p className="text-center font-mono text-sm text-accent/80 leading-relaxed mb-6">
                {t('login.tagline2')}
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/8" />
                <span className="font-mono text-xs text-secondary tracking-widest">{t('login.authenticate')}</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-secondary uppercase tracking-widest mb-2">User ID</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">&gt;_</span>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('login.enterUsername')} autoComplete="username" required className="w-full bg-background/60 border border-white/10 text-primary font-mono text-sm rounded-lg pl-10 pr-4 py-3 placeholder:text-secondary/40 focus:outline-none focus:border-accent/60 focus:bg-background/80 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-secondary uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">••</span>
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.enterPassword')} autoComplete="current-password" required className="w-full bg-background/60 border border-white/10 text-primary font-mono text-sm rounded-lg pl-10 pr-12 py-3 placeholder:text-secondary/40 focus:outline-none focus:border-accent/60 focus:bg-background/80 transition-all" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors text-xs font-mono" tabIndex={-1}>{showPw ? 'HIDE' : 'SHOW'}</button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="w-4 h-4 flex-shrink-0 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold">!</span>
                    <p className="text-red-400 font-mono text-xs">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading || !username || !password} className="w-full mt-2 font-mono text-sm font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-200 bg-primary text-background hover:bg-primary/85 disabled:opacity-30 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('login.authenticating')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {t('login.submit')}
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
        )}
      </div>

      {/* Navigate Log — right side */}
      <SystemLog position="right" />
    </div>
  )
}
