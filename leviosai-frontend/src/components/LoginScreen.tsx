import { useState, useEffect, useRef, type FormEvent } from 'react'
import { api } from '../api/api'
import { useI18n, setLocale, type Locale } from '../utils/i18n'
import { addLog } from '../utils/syslog'
import { getGeoInfo, type GeoInfo } from '../utils/geoInfo'
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

function LoginInfoPanel() {
  const [tick, setTick] = useState(0)
  const [geo, setGeo] = useState<GeoInfo | null>(null)
  const [weather, setWeather] = useState<{ temp: string; desc: string; icon: string } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    getGeoInfo().then(info => {
      setGeo(info)
      if (info.latitude && info.longitude) {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${info.latitude}&longitude=${info.longitude}&current=temperature_2m,weather_code&timezone=auto`)
          .then(r => r.json())
          .then((w: { current: { temperature_2m: number; weather_code: number } }) => {
            const code = w.current.weather_code
            let desc = 'Clear'; let icon = '--'
            if (code >= 1 && code <= 3) { desc = 'Cloudy'; icon = 'CL' }
            else if (code >= 45 && code <= 48) { desc = 'Foggy'; icon = 'FG' }
            else if (code >= 51 && code <= 67) { desc = 'Rainy'; icon = 'RN' }
            else if (code >= 71 && code <= 77) { desc = 'Snowy'; icon = 'SN' }
            else if (code >= 80 && code <= 99) { desc = 'Stormy'; icon = 'ST' }
            setWeather({ temp: `${w.current.temperature_2m}°C`, desc, icon })
          })
          .catch(() => setWeather({ temp: '—', desc: 'Unavailable', icon: '—' }))
      }
    })
  }, [])

  const now = new Date(Date.now() + tick * 0)
  const fmtTz = (tz: string) => now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  const T = 'text-green-400'
  const V = 'text-white/80'
  const D = 'text-green-400/50'
  const L = 'text-[10px] font-mono leading-relaxed'

  return (
    <>
      {/* Top-left: System info (IP, Location, Weather, Time) */}
      <div className="fixed left-6 top-10 pointer-events-none select-none z-0" style={{}}>
        <div className="space-y-3">
          <div>
            <p className={`${L} ${D} uppercase tracking-widest mb-0.5`}>Network</p>
            <p className={L}><span className={T}>IP: </span><span className={V}>{geo?.ip ?? '...'}</span></p>
            <p className={L}><span className={T}>Location: </span><span className={V}>{geo ? `${geo.city}, ${geo.country}` : '...'}</span></p>
          </div>
          <div>
            <p className={`${L} ${D} uppercase tracking-widest mb-0.5`}>Weather</p>
            {weather ? (
              <p className={L}><span className={V}>{weather.icon} {weather.temp} · {weather.desc}</span></p>
            ) : (
              <p className={`${L} ${V} animate-pulse`}>Loading...</p>
            )}
          </div>
          <div>
            <p className={`${L} ${D} uppercase tracking-widest mb-0.5`}>Time</p>
            <p className={L}><span className={T}>Date: </span><span className={V}>{now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></p>
            <p className={L}><span className={T}>Seoul &nbsp;&nbsp;</span><span className={V}>{fmtTz('Asia/Seoul')}</span></p>
            <p className={L}><span className={T}>NYC &nbsp;&nbsp;&nbsp;&nbsp;</span><span className={V}>{fmtTz('America/New_York')}</span></p>
            <p className={L}><span className={T}>London &nbsp;</span><span className={V}>{fmtTz('Europe/London')}</span></p>
          </div>
        </div>
      </div>

      {/* Top-right vertical: IP · Country (decorative) */}
      {geo && (
        <div className="fixed right-4 top-28 pointer-events-none select-none z-0" style={{}}>
          <p className="text-[20px] font-mono font-bold tracking-[0.18em] text-white/[0.12] leading-tight" style={{ writingMode: 'vertical-rl' }}>{geo.ip} · {geo.country}</p>
        </div>
      )}
    </>
  )
}

function VersionDisplay() {
  return (
    <div className="fixed right-6 bottom-6 pointer-events-none select-none z-0 text-right" style={{}}>
      <p className="text-[20px] font-mono font-bold tracking-[0.15em] text-white/[0.12] leading-relaxed">Version 0.9</p>
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
  const [socialPopup, setSocialPopup] = useState(false)

  // Typewriter state
  const BRAND = 'LEVIOSAI'
  const [charCount, setCharCount] = useState(0)
  const [typingDone, setTypingDone] = useState(false)

  useEffect(() => {
    injectKeyframes()
    addLog('Login module initialized · awaiting credentials', 'INIT')
    // Start phase 1 (typewriter begins) after short dark delay
    const t1 = setTimeout(() => {
      setPhase(1)
      addLog('Boot sequence started · rendering LEVIOSAI', 'INIT')
    }, 300)
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
          addLog('Brand render complete · click anywhere to proceed', 'OK')
        }, 400)
      }
    }, 180) // 180ms per character for dramatic effect
    return () => clearInterval(id)
  }, [phase >= 1 ? 1 : 0])

  function handleScreenClick(e: React.MouseEvent) {
    const x = Math.round(e.clientX)
    const y = Math.round(e.clientY)

    if (phase < 2) return

    if (!clicked) {
      setClicked(true)
      addLog(`User interaction detected at (${x}, ${y}) · opening terminal`, 'ACT')
      setTimeout(() => {
        setPhase(3)
        addLog('Authentication console loaded · ready for input', 'NAV')
      }, 100)
      return
    }

    // After phase 3: log every click on empty areas
    addLog(`Click event at (${x}, ${y}) · no target element`, 'ACT')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    addLog(`Authentication attempt · user: ${username}`, 'AUTH')
    try {
      await api.login(username, password)
      addLog(`Authentication handshake complete · operator terminal active`, 'OK')
      onLogin(username)
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      addLog(`Authentication failed · ${msg}`, 'ERR')
      setError(msg)
    }
    finally { setLoading(false) }
  }

  return (
    <div
      className="bg-tech-grid h-screen flex items-center justify-center relative overflow-hidden"
      onClick={handleScreenClick}
    >
      {/* Background layers */}
      <div className="transition-opacity duration-700" style={{ opacity: phase >= 1 ? 1 : 0 }}>
        <VerticalWatermark />
        <LoginInfoPanel />
        <VersionDisplay />
        <MatrixGrid />
        <CornerDecor position="top-left" />
        <CornerDecor position="top-right" />
        <CornerDecor position="bottom-left" />
        <CornerDecor position="bottom-right" />
      </div>


      {/* ── Notice banner — top center ── */}
      <div className="fixed top-3 left-0 right-0 z-30 text-center pointer-events-none">
        <p className="text-white/70 text-xs font-mono">
          <span className="font-bold tracking-wider mr-2">Notice :</span>
          {t('login.notice')}
        </p>
      </div>

      {/* ── Language toggle — top-right ── */}
      <div className="fixed top-6 right-6 z-40 flex items-center gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
        {([['en', 'English'], ['ko', '한국어']] as const).map(([code, label]) => (
          <button
            key={code}
            onClick={() => { setLocale(code as Locale); addLog(`Locale switched to ${code === 'en' ? 'English' : 'Korean'}`, 'ACT') }}
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
          transform: 'scale(var(--login-scale, 1))',
          transformOrigin: 'center center',
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
            <div className="bg-[#13131a]/90 backdrop-blur-sm border border-white/8 rounded-2xl p-8">
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

              {/* Social login divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/8" />
                <span className="font-mono text-[10px] text-secondary/50 uppercase tracking-widest">OR</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Social login buttons */}
              <div className="space-y-2.5">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => { addLog('Google OAuth initiated', 'AUTH'); setSocialPopup(true); setTimeout(() => setSocialPopup(false), 2500) }}
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all text-sm font-mono"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-primary/80">{t('login.google')}</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => { addLog('Apple OAuth initiated', 'AUTH'); setSocialPopup(true); setTimeout(() => setSocialPopup(false), 2500) }}
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all text-sm font-mono"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="text-primary/80">{t('login.apple')}</span>
                </button>

                {/* Kakao */}
                <button
                  type="button"
                  onClick={() => { addLog('Kakao OAuth initiated', 'AUTH'); setSocialPopup(true); setTimeout(() => setSocialPopup(false), 2500) }}
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-[#FEE500]/20 bg-[#FEE500]/[0.06] hover:bg-[#FEE500]/[0.12] hover:border-[#FEE500]/30 transition-all text-sm font-mono"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FEE500">
                    <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.37 6.24-.19.7-.68 2.53-.78 2.93-.12.49.18.49.38.36.15-.1 2.44-1.66 3.43-2.34.85.12 1.72.18 2.6.18 5.52 0 10-3.36 10-7.44S17.52 3 12 3z"/>
                  </svg>
                  <span className="text-[#FEE500]/80">{t('login.kakao')}</span>
                </button>
              </div>
            </div>

            {/* Bottom label */}
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="font-mono text-xs text-secondary/50">© 2026 Horcrux Technology</span>
              <span className="font-mono text-xs text-secondary/50">Founder Minseok Shin</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigate Log — same position as Dashboard */}
      <SystemLog position="top-right" />

      {/* Social login "coming soon" popup */}
      {socialPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setSocialPopup(false)}
          style={{ animation: 'socialBgIn 0.4s ease-out both' }}
        >
          <div
            className="relative flex flex-col items-center gap-5 px-14 py-10 rounded-3xl border border-accent/20 bg-[#0b0c14]/95 shadow-[0_0_80px_rgba(107,150,190,0.15),0_0_30px_rgba(107,150,190,0.1)]"
            style={{ animation: 'socialCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Glow ring behind logo */}
            <div
              className="absolute top-6 w-20 h-20 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(107,150,190,0.15) 0%, transparent 70%)',
                animation: 'socialGlow 2s ease-in-out infinite',
              }}
            />

            {/* Logo with entrance */}
            <div
              className="relative flex items-center gap-3"
              style={{ animation: 'socialLogoIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both' }}
            >
              <img src="/leviosai.png" alt="LeviosAI" className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(107,150,190,0.3)]" />
              <span className="text-primary font-bold text-2xl font-mono tracking-tight">LeviosAI</span>
            </div>

            {/* Animated divider line */}
            <div
              className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
              style={{ animation: 'socialLineIn 0.5s ease-out 0.4s both', width: '120px' }}
            />

            {/* Message with stagger */}
            <p
              className="text-secondary/80 font-mono text-sm tracking-widest uppercase"
              style={{ animation: 'socialTextIn 0.5s ease-out 0.55s both' }}
            >
              It will be updated soon
            </p>

            {/* Progress bar at bottom */}
            <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-accent/40 rounded-full"
                style={{ animation: 'socialProgress 2.5s linear' }}
              />
            </div>
          </div>

          <style>{`
            @keyframes socialBgIn {
              from { background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
              to   { background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); }
            }
            @keyframes socialCardIn {
              from { opacity: 0; transform: translateY(30px) scale(0.9); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes socialLogoIn {
              from { opacity: 0; transform: translateY(-10px) scale(0.8); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes socialLineIn {
              from { opacity: 0; width: 0px; }
              to   { opacity: 1; width: 120px; }
            }
            @keyframes socialTextIn {
              from { opacity: 0; transform: translateY(8px); letter-spacing: 0.5em; }
              to   { opacity: 1; transform: translateY(0); letter-spacing: 0.15em; }
            }
            @keyframes socialGlow {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50%      { opacity: 1; transform: scale(1.2); }
            }
            @keyframes socialProgress {
              from { width: 0%; }
              to   { width: 100%; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
