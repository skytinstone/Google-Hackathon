import { useState } from 'react'
import type { StepProps, SavedProject, SelectedSensor, WizardState } from '../../types'
import TypewriterText from '../TypewriterText'
import { showToast } from '../../utils/toast'

const SENSOR_ICONS: Record<string, string> = {
  Vision: 'CAM', Depth: 'LDR', RF: 'RF', Audio: 'MIC',
  Motion: 'IMU', Thermal: 'THM', Proximity: 'PRX', Location: 'GPS',
}

// ── ERD Pipeline diagram (read-only preview) ─────────────────
function PipelineDiagram({
  sensors, hardware, model,
}: {
  sensors: SelectedSensor[]
  hardware: { device: string; specs: string } | null
  model: { name: string; params?: string } | null
}) {
  if (!hardware) return null
  const N = sensors.length
  const NODE_H = 58
  const GAP = 8
  const totalH = N > 0 ? N * NODE_H + (N - 1) * GAP : NODE_H
  const centerY = totalH / 2

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-1">
      {/* Sensor nodes */}
      {N > 0 && (
        <div className="flex flex-col flex-shrink-0" style={{ gap: GAP }}>
          {sensors.map(s => (
            <div
              key={s.id}
              className="relative px-3 py-2 rounded-xl border border-white/15 bg-[#0e1017] flex items-center gap-2"
              style={{ minWidth: 118, height: NODE_H }}
            >
              <span className="text-[9px] font-bold font-mono text-accent/80 bg-accent/10 px-1 py-0.5 rounded flex-shrink-0">
                {SENSOR_ICONS[s.type] ?? 'SEN'}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-primary truncate">{s.name}</p>
                <p className="text-[9px] font-mono text-accent/60">{s.type}</p>
                <p className="text-[9px] text-secondary/50 font-mono leading-tight truncate">{s.specs}</p>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-accent border border-[#0e1017] shadow-[0_0_6px_rgba(107,150,190,0.6)]" />
            </div>
          ))}
        </div>
      )}

      {/* SVG connector: sensors → HW */}
      {N > 0 && (
        <svg width="56" height={totalH} className="flex-shrink-0">
          <defs>
            <linearGradient id="s7grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6b96be" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6b96be" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {sensors.map((_, i) => {
            const y = i * (NODE_H + GAP) + NODE_H / 2
            return (
              <line key={i} x1="2" y1={y} x2="52" y2={centerY}
                stroke="url(#s7grad)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
            )
          })}
          <circle cx="52" cy={centerY} r="3" fill="#6b96be" opacity="0.8" />
        </svg>
      )}
      {N === 0 && <div className="w-6 flex-shrink-0" />}

      {/* Hardware node */}
      <div
        className="relative px-4 py-3 rounded-2xl border-2 border-accent/60 bg-accent/10 shadow-[0_0_20px_rgba(107,150,190,0.18)] flex-shrink-0 text-center"
        style={{ minWidth: 136 }}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent border-2 border-[#0e1017] shadow-[0_0_8px_rgba(107,150,190,0.8)]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0e1017] shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
        <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-1.5">
          <span className="text-base">⬡</span>
        </div>
        <p className="text-primary font-bold text-xs">{hardware.device}</p>
        <p className="text-[9px] font-mono text-accent/70 mt-0.5">Main Compute</p>
        <p className="text-[9px] text-secondary/50 font-mono mt-0.5 leading-tight">{hardware.specs}</p>
      </div>

      {/* Arrow HW → AI */}
      {model && (
        <div className="flex items-center mx-2 flex-shrink-0">
          <div className="w-8 h-px bg-gradient-to-r from-accent/60 to-green-400/60" />
          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-green-400/60 border-b-[4px] border-b-transparent" />
        </div>
      )}

      {/* AI Model node */}
      {model && (
        <div
          className="relative px-4 py-3 rounded-xl border border-green-400/30 bg-green-400/5 flex-shrink-0 text-center"
          style={{ minWidth: 128 }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-400 border-2 border-[#0e1017]" />
          <div className="w-7 h-7 rounded-lg bg-green-400/15 border border-green-400/25 flex items-center justify-center mx-auto mb-1.5">
            <span className="text-sm">◈</span>
          </div>
          <p className="text-green-400 font-semibold text-xs">{model.name}</p>
          {model.params && <p className="text-[9px] font-mono text-green-400/60 mt-0.5">{model.params}</p>}
          <p className="text-[9px] font-mono text-green-400/40 mt-0.5">AI Model</p>
        </div>
      )}
    </div>
  )
}

// ── Deployment Guide ──────────────────────────────────────────
function getDeploymentSteps(state: WizardState) {
  const steps: { title: string; desc: string; cmd?: string }[] = []
  const hw = state.hardware?.category || ''
  const lang = state.language || 'Python'

  // 1. Environment
  if (lang === 'Python' || lang === 'Python (.ipynb)') {
    steps.push({ title: 'Environment Setup', desc: 'Create a virtual environment and install base dependencies', cmd: 'python -m venv venv && source venv/bin/activate\npip install torch torchvision onnxruntime numpy' })
  } else if (lang === 'C++') {
    steps.push({ title: 'Environment Setup', desc: 'Install build tools and libraries', cmd: 'sudo apt install cmake g++ libopencv-dev' })
  } else {
    steps.push({ title: 'Environment Setup', desc: 'Install required runtime and build dependencies for your platform' })
  }

  // 2. Hardware SDK
  if (hw.includes('Jetson') || hw.includes('Nvidia')) {
    steps.push({ title: 'JetPack SDK Setup', desc: 'Install NVIDIA JetPack with CUDA, cuDNN, and TensorRT', cmd: 'sudo apt install nvidia-jetpack\n# Verify: dpkg -l | grep tensorrt' })
  } else if (hw.includes('Hailo')) {
    steps.push({ title: 'Hailo SDK Setup', desc: 'Install Hailo Runtime and HailoRT libraries', cmd: 'pip install hailort\n# Download Hailo Model Zoo from developer zone' })
  } else if (hw.includes('Mobile')) {
    steps.push({ title: 'Mobile SDK Setup', desc: 'Configure mobile inference framework (TFLite / NNAPI / Core ML)' })
  } else if (hw.includes('Embedded') || hw.includes('STM32')) {
    steps.push({ title: 'Embedded Toolchain', desc: 'Install STM32CubeIDE and X-CUBE-AI for model conversion', cmd: 'stm32cubeide --install-xcubeai' })
  }

  // 3. Model prep
  steps.push({ title: 'Model Preparation', desc: `Download and optimize ${state.model?.name ?? 'your model'} for edge deployment` })

  // 4. Optimization
  if (state.techniques.length > 0) {
    const techNames = state.techniques.map(t => t.name).join(', ')
    steps.push({ title: 'Apply Optimizations', desc: `Run optimization pipeline: ${techNames}` })
  }

  // 5. Deploy & Test
  steps.push({ title: 'Deploy & Test', desc: 'Transfer the optimized model to target device and run inference validation' })

  // 6. Benchmark
  steps.push({ title: 'Performance Benchmark', desc: 'Measure latency, throughput, memory usage, and power consumption on target hardware' })

  return steps
}

function DeploymentGuide({ state }: { state: WizardState }) {
  const [open, setOpen] = useState(false)
  const steps = getDeploymentSteps(state)
  const [copied, setCopied] = useState<number | null>(null)

  function copyCmd(idx: number, cmd: string) {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(idx)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="p-5 rounded-2xl border border-white/8 bg-component mb-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Deployment</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">Quick Start Guide</p>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs font-mono text-secondary hover:text-primary transition-colors px-2 py-1 rounded border border-white/8 hover:border-white/20"
        >
          {open ? '▴ Collapse' : '▾ Expand'}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-[10px] font-bold font-mono">
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 bg-white/8 mt-1" />}
              </div>
              <div className="flex-1 pb-3">
                <p className="text-xs font-bold text-primary font-mono">{s.title}</p>
                <p className="text-[11px] text-secondary mt-0.5">{s.desc}</p>
                {s.cmd && (
                  <div className="mt-2 relative group">
                    <pre className="bg-background/60 border border-white/5 rounded-lg p-3 text-[10px] font-mono text-accent/80 overflow-x-auto whitespace-pre">
                      {s.cmd}
                    </pre>
                    <button
                      onClick={() => copyCmd(i, s.cmd!)}
                      className="absolute top-1.5 right-1.5 text-[10px] font-mono text-secondary/40 hover:text-primary bg-background/80 px-1.5 py-0.5 rounded border border-white/8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copied === i ? '✓' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Step7Complete({ state, updateState, goToStep, onAddProject, onGoToShop }: StepProps) {
  const [projectName, setProjectName] = useState(state.projectName || '')
  const [added, setAdded] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

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
    setAdded(true)
    setShowPopup(true)

    // Auto redirect to Dashboard after 2.5s
    setTimeout(() => {
      onAddProject?.(project)
    }, 2500)
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
        <h2 className="text-3xl font-bold text-primary font-mono tracking-tight"><TypewriterText text="Configuration Complete" speed={40} /></h2>
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

          {/* Hardware Pipeline ERD */}
          {state.hardware && (
            <div className="p-4 rounded-xl border border-white/8 bg-component mb-5">
              <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-4">Hardware Pipeline</p>
              <PipelineDiagram
                sensors={state.sensors}
                hardware={state.hardware}
                model={state.model}
              />
              <div className="mt-3 flex items-center gap-4 text-[9px] font-mono text-secondary/40">
                {state.sensors.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px border-t border-dashed border-accent/50" />
                    <span>Sensor → Compute</span>
                  </div>
                )}
                {state.model && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px bg-gradient-to-r from-accent/50 to-green-400/50" />
                    <span>Compute → AI</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deployment Guide */}
          <DeploymentGuide state={state} />

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

          {/* Shop components */}
          {onGoToShop && state.hardware && (
            <button
              onClick={onGoToShop}
              className="mt-3 w-full py-2 border border-accent/30 text-accent text-xs font-mono font-semibold rounded-lg hover:bg-accent/10 hover:border-accent/50 transition-colors flex items-center justify-center gap-2"
            >
              🛒 Shop Components
            </button>
          )}

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

      {/* Completion popup overlay */}
      {showPopup && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="text-center">
            {/* Animated checkmark circle */}
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-green-500 flex items-center justify-center"
              style={{ animation: 'popIn 0.4s ease-out' }}
            >
              <svg
                className="w-12 h-12 text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline
                  points="20 6 9 17 4 12"
                  style={{
                    strokeDasharray: 24,
                    strokeDashoffset: 0,
                    animation: 'drawCheck 0.5s 0.3s ease-out both',
                  }}
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-primary font-mono" style={{ animation: 'popIn 0.3s 0.4s ease-out both' }}>
              Project Created!
            </h3>
            <p className="text-secondary mt-2" style={{ animation: 'popIn 0.3s 0.5s ease-out both' }}>
              "{projectName}" has been saved successfully
            </p>
            <p className="text-xs text-secondary/50 mt-6 font-mono" style={{ animation: 'popIn 0.3s 0.7s ease-out both' }}>
              Redirecting to Dashboard...
            </p>
            <div className="mt-3 flex justify-center">
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ animation: 'fillBar 2.5s linear' }}
                />
              </div>
            </div>
          </div>

          {/* Inline keyframes */}
          <style>{`
            @keyframes popIn {
              from { opacity: 0; transform: scale(0.8); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes drawCheck {
              from { stroke-dashoffset: 24; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes fillBar {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
