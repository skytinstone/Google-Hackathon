// ── Theme + Font-size singleton ──────────────────────────────
// Mirrors i18n.ts pub/sub pattern.

import { useState, useEffect } from 'react'

export type ThemeMode = 'dark' | 'light'
export type FontSize = 'small' | 'medium' | 'large'

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small:  '13px',
  medium: '15px',
  large:  '17px',
}

type Listener = () => void

let currentTheme: ThemeMode = (localStorage.getItem('leviosai_theme') as ThemeMode) || 'dark'
let currentFontSize: FontSize = (localStorage.getItem('leviosai_fontsize') as FontSize) || 'medium'
const listeners = new Set<Listener>()

function applyTheme() {
  const root = document.documentElement
  root.setAttribute('data-theme', currentTheme)
}

function applyFontSize() {
  document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[currentFontSize])
}

export function setTheme(mode: ThemeMode): void {
  currentTheme = mode
  localStorage.setItem('leviosai_theme', mode)
  applyTheme()
  listeners.forEach(l => l())
}

export function getTheme(): ThemeMode {
  return currentTheme
}

export function setFontSize(size: FontSize): void {
  currentFontSize = size
  localStorage.setItem('leviosai_fontsize', size)
  applyFontSize()
  listeners.forEach(l => l())
}

export function getFontSize(): FontSize {
  return currentFontSize
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Call on app init
export function initTheme(): void {
  applyTheme()
  applyFontSize()
}

// ── React hook ───────────────────────────────────────────────

export function useTheme() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const unsub = subscribeTheme(() => forceUpdate(n => n + 1))
    return unsub
  }, [])

  return {
    theme: currentTheme,
    fontSize: currentFontSize,
    setTheme,
    setFontSize,
  }
}
