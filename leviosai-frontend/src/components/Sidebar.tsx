import type { WizardState } from '../types'

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
}

export default function Sidebar({ state, goToStep }: SidebarProps) {

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

        {/* LEVIOSAI Brand */}
        <div className="p-4 border-t border-white/5 flex items-center justify-center gap-2">
          <img src="/leviosai.png" alt="LeviosAI" className="w-5 h-5 object-contain opacity-40" />
          <span className="font-mono text-primary/30 font-bold tracking-[0.15em] text-sm">LEVIOSAI</span>
        </div>
      </aside>
    </>
  )
}
