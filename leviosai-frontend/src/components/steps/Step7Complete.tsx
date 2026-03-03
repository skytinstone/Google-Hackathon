import { useState } from 'react'
import type { StepProps, SavedProject } from '../../types'

const SENSOR_ICONS: Record<string, string> = {
  Vision: 'CAM', Depth: 'LDR', RF: 'RF', Audio: 'MIC',
  Motion: 'IMU', Thermal: 'THM', Proximity: 'PRX', Location: 'GPS',
}

export default function Step7Complete({ state, updateState, goToStep, onAddProject }: StepProps) {
  const [projectName, setProjectName] = useState(state.projectName || '')
  const [added, setAdded] = useState(false)

  function handleAddProject() {
    if (!projectName.trim()) return
    const project: SavedProject = {
      id: `proj_${Date.now()}`,
      name: projectName.trim(),
      projectNo: state.projectNo || 1,
      author: state.projectAuthor || 'Unknown',
      ccAuthors: state.projectCcAuthors || [],
      description: state.projectDescription || '',
      customDate: state.projectCustomDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      domain: state.domain,
      hardware: state.hardware?.device ?? null,
      sensors: state.sensors.map(s => s.name),
      model: state.model?.name ?? null,
      techniques: state.techniques.map(t => t.name),
      language: state.language,
    }
    updateState({ projectName: projectName.trim() })
    onAddProject?.(project)
    setAdded(true)
  }

  const summary = [
    { label: 'Domain',      value: state.domain,                   icon: '◈' },
    { label: 'Hardware',    value: state.hardware?.device,          icon: '⬡' },
    { label: 'Sensors',     value: state.sensors.length > 0 ? state.sensors.map(s => s.name).join(', ') : null, icon: '◎' },
    { label: 'AI Model',    value: state.model ? `${state.model.name} (${state.model.params})` : null, icon: '◈' },
    { label: 'Techniques',  value: state.techniques.length > 0 ? state.techniques.map(t => t.subtype ? `${t.name} · ${t.subtype.toUpperCase()}` : t.name).join(', ') : null, icon: '⬡' },
    { label: 'Language',    value: state.language,                  icon: '⌨' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 7 of 7</p>
        <h2 className="text-3xl font-bold text-primary">Configuration Complete</h2>
        <p className="text-secondary mt-2">Review your Edge AI pipeline and save it to your Dashboard</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left — Summary */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {/* Success banner */}
          <div className="mb-5 p-5 rounded-2xl border border-green-500/25 bg-green-500/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <div>
              <p className="text-green-400 font-bold text-base">Pipeline Ready</p>
              <p className="text-secondary text-sm mt-0.5">All 6 configuration steps completed successfully</p>
            </div>
          </div>

          {/* Configuration summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {summary.map(item => item.value && (
              <div key={item.label} className="p-4 rounded-xl border border-white/8 bg-component">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-secondary/60 text-xs font-mono">{item.icon}</span>
                  <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-widest">{item.label}</p>
                </div>
                <p className="text-sm text-primary font-medium leading-snug">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Sensor diagram preview */}
          {state.sensors.length > 0 && (
            <div className="p-4 rounded-xl border border-white/8 bg-component mb-5">
              <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-3">Hardware Pipeline</p>
              <div className="flex items-center gap-2 flex-wrap">
                {state.sensors.map(s => (
                  <span key={s.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white/6 border border-white/10 text-secondary rounded-lg font-mono">
                    <span className="text-[9px] font-bold text-accent/60">{SENSOR_ICONS[s.type] ?? 'SEN'}</span>{s.name}
                  </span>
                ))}
                <span className="text-accent/50 text-sm">→</span>
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-accent/10 border border-accent/25 text-accent rounded-lg font-mono">
                  ⬡ {state.hardware?.device}
                </span>
                <span className="text-green-400/50 text-sm">→</span>
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg font-mono">
                  ◈ {state.model?.name}
                </span>
              </div>
            </div>
          )}

          {/* Compatibility score if available */}
          {state.compatibilityResult && (
            <div className={[
              'p-4 rounded-xl border mb-5',
              state.compatibilityResult.compatible
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-yellow-500/20 bg-yellow-500/5',
            ].join(' ')}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-widest">Compatibility Score</p>
                <span className={['text-sm font-bold', state.compatibilityResult.score >= 70 ? 'text-green-400' : 'text-yellow-400'].join(' ')}>
                  {state.compatibilityResult.score}/100
                </span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={state.compatibilityResult.score >= 70 ? 'bg-green-500 h-full rounded-full' : 'bg-yellow-500 h-full rounded-full'}
                  style={{ width: `${state.compatibilityResult.score}%`, transition: 'width 0.6s ease' }}
                />
              </div>
              <p className="text-xs text-secondary mt-2">{state.compatibilityResult.reason}</p>
            </div>
          )}
        </div>

        {/* Right — Save to Dashboard */}
        <div className="w-72 flex-shrink-0">
          <div className="rounded-2xl border border-white/10 bg-component overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6 bg-white/2">
              <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-0.5">Save Project</p>
              <p className="text-primary font-semibold">Add to Dashboard</p>
            </div>

            <div className="p-5 space-y-4">
              {added ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                    <span className="text-green-400 text-xl">✓</span>
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold">Project Saved!</p>
                    <p className="text-xs text-secondary mt-1">"{projectName}" added to Dashboard</p>
                  </div>
                  <button
                    onClick={() => { setAdded(false); setProjectName('') }}
                    className="mt-2 text-xs text-secondary/60 hover:text-secondary underline transition-colors font-mono"
                  >
                    Save another
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-mono text-secondary/60 uppercase tracking-widest block mb-2">
                      Project Name
                    </label>
                    <input
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddProject()}
                      placeholder={`${state.domain ?? 'My'} Project`}
                      className="w-full bg-background/60 border border-white/10 text-primary rounded-lg px-3 py-2.5 text-sm placeholder:text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors font-mono"
                    />
                  </div>

                  {/* Quick preview */}
                  <div className="space-y-1.5 text-xs text-secondary/70">
                    {state.domain && (
                      <div className="flex items-center gap-2">
                        <span className="text-accent/60">◈</span>
                        <span>{state.domain}</span>
                      </div>
                    )}
                    {state.hardware && (
                      <div className="flex items-center gap-2">
                        <span className="text-accent/60">⬡</span>
                        <span>{state.hardware.device}</span>
                      </div>
                    )}
                    {state.model && (
                      <div className="flex items-center gap-2">
                        <span className="text-accent/60">◎</span>
                        <span>{state.model.name}</span>
                      </div>
                    )}
                    {state.sensors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-accent/60">◎</span>
                        <span>{state.sensors.length} sensor{state.sensors.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAddProject}
                    disabled={!projectName.trim()}
                    className="w-full py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <span>+</span>
                    <span>Add Project</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Start over */}
          <button
            onClick={() => goToStep(1)}
            className="mt-3 w-full py-2 border border-white/8 text-secondary text-xs font-mono rounded-lg hover:border-white/20 hover:text-primary transition-colors"
          >
            ↺ Start New Pipeline
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 flex-shrink-0">
        <button
          onClick={() => goToStep(6)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
