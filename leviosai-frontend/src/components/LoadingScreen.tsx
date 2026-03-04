import { useEffect, useState, useCallback } from 'react'

interface Props {
  onComplete: () => void
  /** Total animation duration in ms */
  duration?: number
  /** true = translucent overlay with backdrop-blur (page transitions) */
  hasBackdrop?: boolean
}

const LOADING_TEXT = 'INITIALIZING SYSTEM...'

export default function LoadingScreen({ onComplete, duration = 1800, hasBackdrop = false }: Props) {
  const [charIndex, setCharIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [exiting, setExiting] = useState(false)

  const complete = useCallback(onComplete, [onComplete])

  const typingDuration = duration * 0.55
  const charDelay = typingDuration / LOADING_TEXT.length

  useEffect(() => {
    if (charIndex < LOADING_TEXT.length) {
      const id = setTimeout(() => setCharIndex(i => i + 1), charDelay)
      return () => clearTimeout(id)
    }
    // Typing done → show "SYSTEM READY"
    const holdTimer = setTimeout(() => {
      setReady(true)
      const exitTimer = setTimeout(() => {
        setExiting(true)
        setTimeout(complete, 300)
      }, duration * 0.2)
      return () => clearTimeout(exitTimer)
    }, duration * 0.15)
    return () => clearTimeout(holdTimer)
  }, [charIndex, charDelay, duration, complete])

  const progress = Math.min((charIndex / LOADING_TEXT.length) * 100, 100)

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center',
        'transition-opacity duration-300 ease-out',
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100',
        hasBackdrop
          ? 'bg-black/55 backdrop-blur-2xl'
          : 'bg-[#09090f]',
      ].join(' ')}
    >
      {/* Grid texture */}
      {!hasBackdrop && (
        <div className="absolute inset-0 bg-tech-grid opacity-50 pointer-events-none" />
      )}

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(107,150,190,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Typewriter text */}
        <div className="font-mono font-bold uppercase tracking-[0.3em] text-sm" style={{ color: '#e8edf5' }}>
          {ready ? (
            <span style={{ color: '#4ade80' }}>SYSTEM READY</span>
          ) : (
            <>
              {LOADING_TEXT.slice(0, charIndex)}
              <span className="inline-block w-[2px] h-[14px] bg-accent ml-0.5 align-middle animate-blink" />
            </>
          )}
        </div>

        {/* Brand */}
        <span
          className="font-mono uppercase tracking-[0.22em]"
          style={{ color: '#5c6b7d', fontSize: 10 }}
        >
          LeviosAI
        </span>

        {/* Progress line */}
        <div
          className="relative overflow-hidden rounded-full"
          style={{ width: 120, height: 2, background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: ready
                ? 'rgba(74,222,128,0.6)'
                : 'linear-gradient(90deg, rgba(107,150,190,0.3), rgba(200,220,240,0.7))',
              transition: 'width 0.1s linear, background 0.3s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
