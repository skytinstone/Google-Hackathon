// ── Theme + Font-size + Zoom singleton ──────────────────────
// Mirrors i18n.ts pub/sub pattern.

import { useState, useEffect } from 'react'

export type ThemeMode = 'dark' | 'light'
export type FontSize = 'small' | 'medium' | 'large'
export type ZoomLevel = '90' | '100' | '110' | '120' | '130'

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small:  '15px',
  medium: '17px',
  large:  '20px',
}

const ZOOM_MAP: Record<ZoomLevel, string> = {
  '90':  '0.9',
  '100': '1',
  '110': '1.1',
  '120': '1.2',
  '130': '1.3',
}

type Listener = () => void

let currentTheme: ThemeMode = (localStorage.getItem('leviosai_theme') as ThemeMode) || 'dark'
let currentFontSize: FontSize = (localStorage.getItem('leviosai_fontsize') as FontSize) || 'medium'
let currentZoom: ZoomLevel = (localStorage.getItem('leviosai_zoom') as ZoomLevel) || '110'
const listeners = new Set<Listener>()

function applyTheme() {
  const root = document.documentElement
  root.setAttribute('data-theme', currentTheme)
}

function applyFontSize() {
  document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[currentFontSize])
}

function applyZoom() {
  document.documentElement.style.setProperty('zoom', ZOOM_MAP[currentZoom])
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

export function setZoom(level: ZoomLevel): void {
  currentZoom = level
  localStorage.setItem('leviosai_zoom', level)
  applyZoom()
  listeners.forEach(l => l())
}

export function getZoom(): ZoomLevel {
  return currentZoom
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Call on app init
export function initTheme(): void {
  applyTheme()
  applyFontSize()
  applyZoom()
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
    zoom: currentZoom,
    setTheme,
    setFontSize,
    setZoom,
  }
}
