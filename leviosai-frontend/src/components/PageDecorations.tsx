import { useState, useEffect } from 'react'

// ── Vertical LEVIOSAI watermark (bottom-left) ───────────────
export function VerticalWatermark({ sidebarVisible }: { sidebarVisible?: boolean }) {
  const text = 'LEVIOSAI'
  const [count, setCount] = useState(0)

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setCount(i)
      if (i >= text.length) clearInterval(id)
    }, 130)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="fixed bottom-10 pointer-events-none select-none transition-all duration-300"
      style={{ zIndex: 0, left: sidebarVisible ? '272px' : '16px' }}
    >
      <p
        className="text-[72px] font-black font-mono tracking-[0.18em] text-white/[0.045] leading-none"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {text.slice(0, count)}
        {count < text.length && (
          <span className="animate-blink text-white/[0.06]">_</span>
        )}
      </p>
    </div>
  )
}

// ── Vertical page name (top-right) ─────────────────────────
export function VerticalPageName({ name, chatOpen }: { name: string; chatOpen?: boolean }) {
  return (
    <div
      className="fixed top-24 pointer-events-none select-none transition-all duration-300"
      style={{ zIndex: 0, right: chatOpen ? '376px' : '16px' }}
    >
      <p
        className="text-[48px] font-black font-mono tracking-[0.18em] text-white/[0.03] leading-none uppercase"
        style={{ writingMode: 'vertical-rl' }}
      >
        {name}
      </p>
    </div>
  )
}

// ── Horizontal date/time (top-left, two lines) ─────────────
export function VerticalDateTime({ sidebarVisible }: { sidebarVisible?: boolean }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false })

  return (
    <div
      className="fixed top-20 pointer-events-none select-none transition-all duration-300"
      style={{ zIndex: 0, left: sidebarVisible ? '272px' : '16px' }}
    >
      <p className="text-[34px] font-black font-mono tracking-[0.08em] text-white/30 leading-[0.95]">
        {dateStr}
      </p>
      <p className="text-[34px] font-black font-mono tracking-[0.08em] text-white/30 leading-[0.95]">
        {timeStr}
      </p>
    </div>
  )
}
