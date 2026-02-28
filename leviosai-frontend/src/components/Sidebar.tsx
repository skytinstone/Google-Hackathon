import { useState, useEffect } from 'react'
import type { WizardState } from '../types'

const STEPS = [
  { num: 1, label: 'Domain', key: 'domain' as const },
  { num: 2, label: 'Hardware', key: 'hardware' as const },
  { num: 3, label: 'Model Selection', key: 'model' as const },
  { num: 4, label: 'Techniques', key: 'techniques' as const },
  { num: 5, label: 'Code Generation', key: 'generatedCode' as const },
]

function getStepSubtitle(state: WizardState, stepNum: number): string {
  switch (stepNum) {
    case 1: return state.domain ?? ''
    case 2: return state.hardware ? state.hardware.device : ''
    case 3: return state.model ? state.model.name : ''
    case 4: return state.techniques.length > 0
      ? state.techniques.map(t => t.name).join(', ')
      : ''
    case 5: return state.generatedCode ? state.language : ''
    default: return ''
  }
}

interface SidebarProps {
  state: WizardState
  goToStep: (step: number) => void
}

export default function Sidebar({ state, goToStep }: SidebarProps) {
  const [location, setLocation] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then((data: { city?: string; country_name?: string }) => {
        if (data.city && data.country_name) {
          setLocation(`${data.city}, ${data.country_name}`)
        }
      })
      .catch(() => null)
  }, [])

  function isCompleted(stepNum: number) {
    return stepNum < state.currentStep
  }

  function isClickable(stepNum: number) {
    return stepNum < state.currentStep
  }

  return (
    <aside className="w-64 bg-component flex flex-col justify-between flex-shrink-0 border-r border-white/5">
      {/* Header */}
      <div className="p-5">
        <h1 className="text-xl font-bold text-accent mb-1 tracking-tight">LeviosAI</h1>
        <p className="text-xs text-secondary mb-6">Edge AI Optimization</p>

        {/* Step List */}
        <nav>
          <ul className="space-y-1">
            {STEPS.map(step => {
              const completed = isCompleted(step.num)
              const active = step.num === state.currentStep
              const clickable = isClickable(step.num)
              const subtitle = getStepSubtitle(state, step.num)

              return (
                <li key={step.num}>
                  <button
                    onClick={() => clickable && goToStep(step.num)}
                    disabled={!clickable && !active}
                    className={[
                      'w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      active
                        ? 'bg-accent/15 border border-accent/30'
                        : completed
                          ? 'hover:bg-white/5 cursor-pointer'
                          : 'opacity-40 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {/* Step indicator */}
                    <span
                      className={[
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
                        active
                          ? 'bg-accent text-white'
                          : completed
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/10 text-secondary',
                      ].join(' ')}
                    >
                      {completed ? '✓' : step.num}
                    </span>

                    {/* Label */}
                    <div className="min-w-0">
                      <p
                        className={[
                          'text-sm font-medium leading-tight',
                          active ? 'text-primary' : completed ? 'text-primary' : 'text-secondary',
                        ].join(' ')}
                      >
                        {step.label}
                      </p>
                      {subtitle && (
                        <p className="text-xs text-accent mt-0.5 truncate" title={subtitle}>
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 bg-background rounded-lg">
          <div className="w-8 h-8 bg-accent rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">stevenshin16</p>
            <p className="text-xs text-green-400">● Online</p>
            {location && (
              <p className="text-xs text-secondary mt-0.5 truncate" title={location}>
                {location}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
