// ── Theme + Font-size + Zoom singleton ──────────────────────
// Mirrors i18n.ts pub/sub pattern.

import { useState, useEffect } from 'react'

export type ThemeMode = 'dark' | 'light'
export type FontSize = 'small' | 'medium' | 'large'
export type ZoomLevel = 'auto' | '90' | '100' | '110' | '120' | '130'

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small:  '15px',
  medium: '17px',
  large:  '20px',
}

const ZOOM_MAP: Record<Exclude<ZoomLevel, 'auto'>, string> = {
  '90':  '0.9',
  '100': '1',
  '110': '1.1',
  '120': '1.2',
  '130': '1.3',
}

// ── Auto-zoom baseline: 32" QHD (2560x1440) at zoom 1.1 ──
// The app was designed at this resolution. Auto mode scales to match.
const DESIGN_WIDTH = 2560
const DESIGN_HEIGHT = 1440
const DESIGN_ZOOM = 1.1

function computeAutoZoom(): number {
  // Step 1: Temporarily reset zoom to 1 so we can measure the TRUE viewport
  const root = document.documentElement
  const prevZoom = root.style.zoom
  root.style.zoom = '1'

  // Step 2: Read actual viewport pixel dimensions (no zoom distortion)
  const realW = window.innerWidth
  const realH = window.innerHeight

  // Step 3: Restore previous zoom immediately (minimizes visual flicker)
  root.style.zoom = prevZoom

  // Step 4: Calculate the zoom needed to make this viewport
  // display the same proportional layout as 32" QHD at zoom 1.1
  const zoomW = (realW / DESIGN_WIDTH) * DESIGN_ZOOM
  const zoomH = (realH / DESIGN_HEIGHT) * DESIGN_ZOOM
  const zoom = Math.min(zoomW, zoomH)

  // Clamp between 0.4 and 2.0 for safety
  return Math.round(Math.max(0.4, Math.min(2.0, zoom)) * 1000) / 1000
}

type Listener = () => void

// ── One-time migration: old default '110' → new default 'auto' ──
const ZOOM_MIGRATED_KEY = 'leviosai_zoom_v2'
if (!localStorage.getItem(ZOOM_MIGRATED_KEY)) {
  localStorage.setItem('leviosai_zoom', 'auto')
  localStorage.setItem(ZOOM_MIGRATED_KEY, '1')
}

let currentTheme: ThemeMode = (localStorage.getItem('leviosai_theme') as ThemeMode) || 'dark'
let currentFontSize: FontSize = (localStorage.getItem('leviosai_fontsize') as FontSize) || 'medium'
let currentZoom: ZoomLevel = (localStorage.getItem('leviosai_zoom') as ZoomLevel) || 'auto'
let computedAutoZoom: number = DESIGN_ZOOM
const listeners = new Set<Listener>()

function applyTheme() {
  const root = document.documentElement
  root.setAttribute('data-theme', currentTheme)
}

function applyFontSize() {
  document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[currentFontSize])
}

function applyZoom() {
  let zoomValue: string
  if (currentZoom === 'auto') {
    computedAutoZoom = computeAutoZoom()
    zoomValue = String(computedAutoZoom)
  } else {
    zoomValue = ZOOM_MAP[currentZoom]
  }
  const root = document.documentElement
  root.style.setProperty('zoom', zoomValue)
  // CSS zoom scales rendered size: 100vh * zoom < viewport when zoom < 1.
  // Compensate by making html taller so rendered height fills the viewport.
  root.style.setProperty('--zoom', zoomValue)
  root.style.minHeight = `calc(100vh / ${zoomValue})`
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

export function getComputedZoom(): number {
  if (currentZoom === 'auto') return computedAutoZoom
  return parseFloat(ZOOM_MAP[currentZoom])
}

export function getAutoZoomPercent(): number {
  return Math.round(computeAutoZoom() * 100)
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Call on app init
let resizeTimer: ReturnType<typeof setTimeout> | null = null

export function initTheme(): void {
  applyTheme()
  applyFontSize()
  applyZoom()

  // Debounced resize handler — recalculate auto-zoom when viewport changes
  window.addEventListener('resize', () => {
    if (currentZoom !== 'auto') return
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      applyZoom()
      listeners.forEach(l => l())
    }, 150)
  })
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
    autoZoomPercent: getAutoZoomPercent(),
    setTheme,
    setFontSize,
    setZoom,
  }
}
