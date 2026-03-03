import { useState, useEffect } from 'react'
import type { WizardState } from '../types'
import ProfileModal from './ProfileModal'
import { subscribe, type LogEntry } from '../utils/syslog'

const LOG_TYPE_STYLE: Record<string, string> = {
  AUTH: 'text-green-400', NAV: 'text-accent', STEP: 'text-accent',
  ACT: 'text-primary/40', OK: 'text-green-400', ERR: 'text-red-400',
  INIT: 'text-yellow-400', GEN: 'text-yellow-400',
}

const STEPS = [
  { num: 1, label: 'Domain',          key: 'domain'        as const },
  { num: 2, label: 'Hardware',        key: 'hardware'      as const },
  { num: 3, label: 'HW Config',       key: 'hardware'      as const },
  { num: 4, label: 'AI Model',        key: 'model'         as const },
  { num: 5, label: 'Techniques',      key: 'techniques'    as const },
  { num: 6, label: 'Code Generation', key: 'generatedCode' as const },
  { num: 7, label: 'Complete',        key: 'generatedCode' as const },
]

function getStepSubtitle(state: WizardState, stepNum: number): string {
  switch (stepNum) {
    case 1: return state.domain ?? ''
    case 2: return state.hardware ? state.hardware.device : ''
    case 3: return state.hardware ? `${state.sensors.length} sensor${state.sensors.length !== 1 ? 's' : ''}` : ''
    case 4: return state.model ? state.model.name : ''
    case 5: return state.techniques.length > 0 ? state.techniques.map(t => t.name).join(', ') : ''
    case 6: return state.generatedCode ? state.language : ''
    case 7: return state.projectName || ''
    default: return ''
  }
}

interface SidebarProps {
  state: WizardState
  goToStep: (step: number) => void
  onLogout: () => void
}

export default function Sidebar({ state, goToStep, onLogout }: SidebarProps) {
  const [location, setLocation] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [logCollapsed, setLogCollapsed] = useState(false)

  useEffect(() => subscribe(setLogEntries), [])

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then((data: { city?: string; country_name?: string }) => {
        if (data.city && data.country_name) setLocation(`${data.city}, ${data.country_name}`)
      })
      .catch(() => null)
  }, [])

  function isCompleted(n: number) { return n < state.currentStep }
  function isClickable(n: number)  { return n < state.currentStep }

  return (
    <>
      <aside className="w-64 h-full bg-component flex flex-col justify-between flex-shrink-0 border-r border-white/5">
        {/* Header */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-xs font-bold font-mono">◈</span>
            </div>
            <h1 className="text-sm font-bold text-primary tracking-tight font-mono truncate">
              {state.projectName || 'New Project'}
            </h1>
          </div>
          <p className="text-xs text-secondary/60 mb-5 font-mono truncate">
            {state.domain ?? 'No domain selected'}
          </p>

          {/* ── Pipeline section divider ── */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-white/6" />
            <span className="font-mono text-[9px] text-secondary/50 uppercase tracking-[0.22em]">Pipeline</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Step list with vertical connector line */}
          <nav>
            <ul className="relative">
              <div className="absolute left-[18px] top-5 bottom-5 w-px bg-white/5 pointer-events-none" />
              {STEPS.map((step, idx) => {
                const completed = isCompleted(step.num)
                const active    = step.num === state.currentStep
                const clickable = isClickable(step.num)
                const subtitle  = getStepSubtitle(state, step.num)
                return (
                  <li key={step.num} className={idx < STEPS.length - 1 ? 'mb-0.5' : ''}>
                    <button
                      onClick={() => clickable && goToStep(step.num)}
                      disabled={!clickable && !active}
                      className={[
                        'w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        active    ? 'bg-white/6 border border-white/12' :
                        completed ? 'hover:bg-white/5 cursor-pointer' :
                                    'opacity-35 cursor-not-allowed',
                      ].join(' ')}
                    >
                      <span className={[
                        'relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 font-mono',
                        active    ? 'bg-white/15 border border-white/30 text-primary' :
                        completed ? 'bg-green-500/15 text-green-400' :
                                    'bg-white/6 text-secondary',
                      ].join(' ')}>
                        {completed ? '✓' : step.num}
                      </span>
                      <div className="min-w-0">
                        <p className={[
                          'text-sm font-medium leading-tight',
                          active || completed ? 'text-primary' : 'text-secondary',
                        ].join(' ')}>
                          {step.label}
                        </p>
                        {subtitle && (
                          <p className="text-xs text-secondary mt-0.5 truncate" title={subtitle}>{subtitle}</p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* ── System Log (above profile) ──────────────────────── */}
        {logEntries.length > 0 && (
          <div className="border-t border-white/5">
            <button
              onClick={() => setLogCollapsed(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <span className="text-[9px] font-mono text-secondary/50 uppercase tracking-[0.18em]">Sys Log</span>
                <span className="text-[9px] text-secondary/25">· {logEntries.length}</span>
              </div>
              <span className="text-secondary/25 text-[9px]">{logCollapsed ? '▲' : '▼'}</span>
            </button>
            {!logCollapsed && (
              <div className="max-h-[148px] overflow-y-auto">
                {logEntries.slice(0, 6).map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={[
                      'flex items-start gap-1.5 px-4 py-1 border-t border-white/[0.03]',
                      idx === 0 ? 'animate-fade-in' : '',
                    ].join(' ')}
                  >
                    <span className={`flex-shrink-0 text-[8px] font-bold font-mono w-8 mt-0.5 ${LOG_TYPE_STYLE[entry.type] ?? 'text-primary/40'}`}>
                      {entry.type}
                    </span>
                    <span className="text-[9px] text-secondary/50 font-mono leading-tight line-clamp-2">
                      ▸ {entry.message}
                    </span>
                  </div>
                ))}
                <div className="px-4 py-1.5 flex items-center gap-1.5 border-t border-white/[0.03]">
                  <span className="text-green-400/30 animate-blink text-[10px]">█</span>
                  <span className="text-[8px] font-mono text-secondary/20">ops terminal</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User profile (clickable → ProfileModal) + Logout */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 px-2 py-2 bg-background rounded-lg hover:bg-white/4 transition-colors text-left group"
          >
            <div className="w-8 h-8 bg-white/10 border border-white/15 rounded-full flex-shrink-0 flex items-center justify-center text-primary text-xs font-bold font-mono">
              S
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary truncate">stevenshin16</p>
              <p className="text-xs text-green-400">● Online</p>
              {location && <p className="text-xs text-secondary mt-0.5 truncate">{location}</p>}
            </div>
            <span className="text-secondary/40 text-xs flex-shrink-0 group-hover:text-secondary transition-colors">▸</span>
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/8 text-secondary hover:border-red-500/30 hover:text-red-400 transition-colors text-xs font-mono"
          >
            <span className="text-[11px]">⏻</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {showProfile && (
        <ProfileModal location={location} onClose={() => setShowProfile(false)} />
      )}
    </>
  )
}
