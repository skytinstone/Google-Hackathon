import { useEffect, useState, useCallback } from 'react'

interface Props {
  onComplete: () => void
  /** Total animation duration in ms */
  duration?: number
  /** true = translucent overlay with backdrop-blur (page transitions) */
  hasBackdrop?: boolean
}

export default function LoadingScreen({ onComplete, duration = 1800, hasBackdrop = false }: Props) {
  const [fill, setFill] = useState(0)
  const [exiting, setExiting] = useState(false)

  const complete = useCallback(onComplete, [onComplete])

  useEffect(() => {
    const fillDuration = duration * 0.72
    let raf: number
    const start = performance.now()

    function tick(now: number) {
      const t = Math.min((now - start) / fillDuration, 1)
      // Ease-out power curve: fast at start, slows to a stop
      const eased = 1 - Math.pow(1 - t, 2.8)
      setFill(eased * 100)

      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        // Brief hold at 100%, then fade out
        setTimeout(() => {
          setExiting(true)
          setTimeout(complete, 360)
        }, duration * 0.13)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, complete])

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center',
        'transition-opacity duration-[360ms] ease-out',
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100',
        hasBackdrop
          ? 'bg-black/55 backdrop-blur-2xl'
          : 'bg-[#09090f]',
      ].join(' ')}
    >
      {/* Static grid texture (initial load only) */}
      {!hasBackdrop && (
        <div className="absolute inset-0 bg-tech-grid opacity-50 pointer-events-none" />
      )}

      {/* Radial ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 360,
          height: 360,
          background: 'radial-gradient(circle, rgba(107,150,190,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Logo fill container */}
        <div className="relative w-28 h-28 select-none">

          {/* Ghost base: desaturated, dim */}
          <img
            src="/leviosai.png"
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ opacity: 0.1, filter: 'grayscale(100%) brightness(4)' }}
          />

          {/* Filling logo — rises from bottom via clip-path */}
          <img
            src="/leviosai.png"
            alt="LeviosAI"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              clipPath: `inset(${100 - fill}% 0 0 0)`,
            }}
          />

          {/* Liquid edge glow at fill boundary */}
          {fill > 1 && fill < 99.5 && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${100 - fill}%`,
                height: 2,
                background:
                  'linear-gradient(90deg, transparent, rgba(200,220,240,0.7) 30%, rgba(220,235,250,0.9) 50%, rgba(200,220,240,0.7) 70%, transparent)',
                boxShadow: '0 0 10px 2px rgba(190,215,240,0.35)',
              }}
            />
          )}
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="font-mono font-bold uppercase tracking-[0.35em]"
            style={{ color: '#e8edf5', fontSize: 13 }}
          >
            LeviosAI
          </span>
          <span
            className="font-mono uppercase tracking-[0.22em]"
            style={{ color: '#5c6b7d', fontSize: 10 }}
          >
            {fill >= 99 ? 'System Ready' : 'Initializing...'}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="relative overflow-hidden"
          style={{ width: 144, height: 1, background: 'rgba(255,255,255,0.07)' }}
        >
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-full"
            style={{
              width: `${fill}%`,
              background:
                'linear-gradient(90deg, rgba(107,150,190,0.3), rgba(200,220,240,0.85))',
              transition: 'none',
            }}
          />
          {/* Leading glow dot */}
          <div
            className="absolute top-0 h-full"
            style={{
              left: `calc(${fill}% - 12px)`,
              width: 12,
              background:
                'linear-gradient(90deg, transparent, rgba(200,220,240,0.65))',
              boxShadow: '2px 0 8px rgba(190,215,240,0.55)',
              transition: 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}
