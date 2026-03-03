import { useState, useEffect } from 'react'

interface Props {
  text: string
  speed?: number      // ms per character
  delay?: number      // ms before starting
  className?: string
  showCursor?: boolean
  onDone?: () => void
}

export default function TypewriterText({
  text,
  speed = 35,
  delay = 0,
  className = '',
  showCursor = false,
  onDone,
}: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let timeout: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>

    timeout = setTimeout(() => {
      let i = 0
      interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
          onDone?.()
        }
      }, speed)
    }, delay)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [text, speed, delay]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={className}>
      {displayed}
      {showCursor && (
        <span
          className={[
            'inline-block w-0.5 h-[0.85em] bg-accent align-middle ml-0.5',
            done ? 'animate-cursor' : '',
          ].join(' ')}
        />
      )}
    </span>
  )
}
