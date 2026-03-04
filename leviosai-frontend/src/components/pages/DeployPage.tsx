import { useState, useEffect, useRef, useMemo } from 'react'
import type { WizardState, SavedProject } from '../../types'
import { useI18n } from '../../utils/i18n'
import { useTheme } from '../../utils/theme'
import { addLog } from '../../utils/syslog'
import { showToast } from '../../utils/toast'
import { callGeminiDirect, hasApiKey } from '../../api/api'
import { generateBom, getProductById } from '../../data/shopData'
import TypewriterText from '../TypewriterText'
import {
  getPinMap,
  getAssemblySteps,
  getSdkSteps,
  getBenchmarkResult,
  getDeployLogLines,
  type HardwarePinMap,
  type AssemblyStep,
  type SdkStep,
  type BenchmarkResult,
  type DeployLogLine,
} from '../../data/deployData'

interface Props {
  state: WizardState
  savedProjects: SavedProject[]
  onGoToProject: () => void
}

type DeployTab = 'overview' | 'hardware' | 'software' | 'notes' | 'media'

const TAB_LIST: { id: DeployTab; key: string; icon: string }[] = [
  { id: 'overview', key: 'deploy.tabOverview', icon: '◈' },
  { id: 'hardware', key: 'deploy.tabHardware', icon: '⬡' },
  { id: 'software', key: 'deploy.tabSoftware', icon: '⬢' },
  { id: 'notes', key: 'deploy.tabNotes', icon: '◆' },
  { id: 'media', key: 'deploy.tabMedia', icon: '▣' },
]

/* ── localStorage helpers ── */
function loadJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveJson(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

/* ================================================================
   Reusable: Terminal Block
   ================================================================ */
function TerminalBlock({ title, subtitle, commands, estimatedTime }: {
  title: string; subtitle: string; commands: string[]; estimatedTime?: string
}) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(commands.filter(c => !c.startsWith('#')).join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-black/8' : 'border-white/6'}`}>
      <div className={`flex items-center justify-between px-4 py-2 ${isLight ? 'bg-gray-100' : 'bg-white/3'}`}>
        <div><span className="text-xs font-mono font-bold text-primary">{title}</span><span className="text-[10px] font-mono text-secondary/50 ml-2">{subtitle}</span></div>
        <div className="flex items-center gap-2">
          {estimatedTime && <span className="text-[10px] font-mono text-secondary/40">~{estimatedTime}</span>}
          <button onClick={handleCopy} className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${copied ? 'text-green-400 bg-green-500/10' : isLight ? 'text-black/40 hover:bg-black/5' : 'text-secondary/50 hover:bg-white/5'}`}>
            {copied ? t('deploy.copied') : t('deploy.copyAll')}
          </button>
        </div>
      </div>
      <div className={`px-4 py-3 font-mono text-sm leading-relaxed ${isLight ? 'bg-gray-50' : 'bg-[#060810]'}`}>
        {commands.map((cmd, i) => (
          <div key={i} className={cmd.startsWith('#') ? (isLight ? 'text-black/30' : 'text-secondary/30') : ''}>
            {cmd.startsWith('#') ? <span>{cmd}</span> : <><span className={isLight ? 'text-green-600' : 'text-green-400'}>$ </span><span className={isLight ? 'text-black/70' : 'text-accent/90'}>{cmd}</span></>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   Reusable: SVG Gauges
   ================================================================ */
function ArcGauge({ value, max, label, unit, color, animKey }: { value: number; max: number; label: string; unit: string; color: string; animKey: number }) {
  const { theme } = useTheme(); const isLight = theme === 'light'
  const r = 50; const circ = Math.PI * r; const offset = circ * (1 - Math.min(value / max, 1))
  return (
    <div className={`p-4 rounded-xl border text-center ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
      <svg viewBox="0 0 120 70" className="w-full max-w-[140px] mx-auto">
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke={isLight ? '#e0e0e0' : '#ffffff0a'} strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} key={animKey}
          style={{ '--arc-total': `${circ}`, '--arc-offset': `${offset}` } as React.CSSProperties} className="animate-arc-fill" />
        <text x="60" y="55" textAnchor="middle" fontSize="16" fontFamily="monospace" fontWeight="bold" fill={color}>{value % 1 !== 0 ? value.toFixed(1) : value}</text>
        <text x="60" y="67" textAnchor="middle" fontSize="7" fontFamily="monospace" fill={isLight ? '#00000040' : '#ffffff30'}>{unit}</text>
      </svg>
      <p className="text-[10px] font-mono font-bold text-secondary/60 mt-1">{label}</p>
    </div>
  )
}

function RingGauge({ value, max, label, unit, color, animKey }: { value: number; max: number; label: string; unit: string; color: string; animKey: number }) {
  const { theme } = useTheme(); const isLight = theme === 'light'
  const r = 40; const circ = 2 * Math.PI * r; const offset = circ * (1 - Math.min(value / max, 1))
  return (
    <div className={`p-4 rounded-xl border text-center ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
      <svg viewBox="0 0 100 100" className="w-full max-w-[120px] mx-auto">
        <circle cx="50" cy="50" r={r} fill="none" stroke={isLight ? '#e0e0e0' : '#ffffff0a'} strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 50 50)" key={animKey}
          style={{ '--arc-total': `${circ}`, '--arc-offset': `${offset}` } as React.CSSProperties} className="animate-arc-fill" />
        <text x="50" y="47" textAnchor="middle" fontSize="16" fontFamily="monospace" fontWeight="bold" fill={color}>{value % 1 !== 0 ? value.toFixed(1) : value}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="7" fontFamily="monospace" fill={isLight ? '#00000040' : '#ffffff30'}>{unit}</text>
      </svg>
      <p className="text-[10px] font-mono font-bold text-secondary/60 mt-1">{label}</p>
    </div>
  )
}

/* ================================================================
   PROJECT SELECTOR
   ================================================================ */
function ProjectSelector({ projects, onSelect, onGoToProject }: {
  projects: SavedProject[]; onSelect: (p: SavedProject) => void; onGoToProject: () => void
}) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mb-6 ${isLight ? 'bg-gray-100 border border-black/8' : 'bg-component border border-white/6'}`}>◈</div>
        <h2 className="text-xl font-bold font-mono text-primary mb-2">{t('deploy.noProjects')}</h2>
        <p className="text-sm font-mono text-secondary/50 mb-8">{t('deploy.noStateDesc')}</p>
        <button onClick={onGoToProject} className="px-6 py-3 bg-accent text-background font-mono font-bold text-sm rounded-lg hover:bg-accent/80 transition-colors">
          → {t('deploy.goToProject')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-1">Deploy</p>
        <h1 className="text-2xl font-bold text-primary font-mono tracking-tight">
          <TypewriterText text={t('deploy.selectProject')} speed={30} />
        </h1>
        <p className="text-xs font-mono text-secondary/50 mt-1">{t('deploy.selectProjectDesc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map(p => (
          <button key={p.id} onClick={() => onSelect(p)}
            className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.01] ${isLight ? 'border-black/8 hover:border-accent/30 bg-white' : 'border-white/6 hover:border-accent/20 bg-component'}`}>
            <p className="text-sm font-mono font-bold text-primary truncate">{p.name}</p>
            <p className="text-[10px] font-mono text-accent mt-1">{p.hardware ?? 'No hardware'}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {p.domain && <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isLight ? 'bg-accent/10 text-accent' : 'bg-accent/10 text-accent'}`}>{p.domain}</span>}
              <span className="text-[9px] font-mono text-secondary/40">{p.sensors?.length ?? 0} sensors</span>
              {p.model && <span className="text-[9px] font-mono text-secondary/40">{p.model}</span>}
            </div>
            <p className="text-[9px] font-mono text-secondary/30 mt-2">{new Date(p.createdAt).toLocaleDateString()}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   TAB: Overview
   ================================================================ */
function OverviewTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [animKey, setAnimKey] = useState(0)

  const benchmark = useMemo(() => getBenchmarkResult(project.hardware ?? '', state.techniques), [project.hardware, state.techniques])
  const pinMap = useMemo(() => state.hardware ? getPinMap(state.hardware.category) : null, [state.hardware])
  const assemblySteps = useMemo(() => pinMap ? getAssemblySteps(pinMap, state.sensors) : [], [pinMap, state.sensors])
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set())

  const latColor = benchmark.optLatencyMs < 15 ? '#4ade80' : benchmark.optLatencyMs < 30 ? '#fbbf24' : '#f87171'
  const powColor = benchmark.optPowerW < 5 ? '#4ade80' : benchmark.optPowerW < 15 ? '#fbbf24' : '#f87171'
  const effColor = benchmark.efficiencyScore >= 80 ? '#4ade80' : benchmark.efficiencyScore >= 50 ? '#fbbf24' : '#f87171'

  return (
    <div className="space-y-6">
      {/* Pipeline Summary */}
      <div className={`p-5 rounded-2xl border ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">Pipeline Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Domain', value: project.domain ?? '—' },
            { label: 'Hardware', value: project.hardware ?? '—' },
            { label: 'Model', value: project.model ?? '—' },
            { label: 'Language', value: project.language },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-mono font-bold text-primary truncate">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {project.sensors?.map(s => (
            <span key={s} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isLight ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>{s}</span>
          ))}
          {project.techniques?.map(t => (
            <span key={t} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isLight ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* Board Diagram (if hardware available) */}
      {pinMap && assemblySteps.length > 0 && (
        <div className={`p-5 rounded-2xl border ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">{t('deploy.boardDiagram')}</p>
          <HardwareAssemblyDiagramCompact pinMap={pinMap} steps={assemblySteps} checkedSteps={checkedSteps}
            onToggleStep={id => setCheckedSteps(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })} />
        </div>
      )}

      {/* Benchmark Gauges */}
      <div className={`p-5 rounded-2xl border ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest">{t('deploy.phase4')}</p>
          <button onClick={() => setAnimKey(k => k + 1)} className="text-[10px] font-mono text-accent border border-accent/20 px-2 py-0.5 rounded hover:bg-accent/10 transition-colors">
            {t('deploy.rerunBenchmark')}
          </button>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <ArcGauge value={benchmark.optLatencyMs} max={60} label="Latency" unit="ms" color={latColor} animKey={animKey} />
          <ArcGauge value={benchmark.optFps} max={300} label="FPS" unit="FPS" color="#60a5fa" animKey={animKey} />
          <RingGauge value={benchmark.optMemoryMb} max={4096} label="Memory" unit="MB" color="#c084fc" animKey={animKey} />
          <ArcGauge value={benchmark.optPowerW} max={30} label="Power" unit="W" color={powColor} animKey={animKey} />
          <ArcGauge value={benchmark.optAccuracy} max={100} label="Accuracy" unit="%" color="#fbbf24" animKey={animKey} />
          <RingGauge value={benchmark.efficiencyScore} max={100} label="Efficiency" unit="pts" color={effColor} animKey={animKey} />
        </div>
      </div>
    </div>
  )
}

/* Compact Assembly Diagram (reused in Overview) */
function HardwareAssemblyDiagramCompact({ pinMap, steps, checkedSteps, onToggleStep }: {
  pinMap: HardwarePinMap; steps: AssemblyStep[]; checkedSteps: Set<string>; onToggleStep: (id: string) => void
}) {
  const { theme } = useTheme(); const isLight = theme === 'light'
  const { boardW, boardH, connectors, sensorWires } = pinMap
  const activeTypes = new Set(steps.filter(s => s.sensorType !== '_system').map(s => s.sensorType))
  const visibleWires = sensorWires.filter(w => activeTypes.has(w.sensorType))

  return (
    <div className="flex gap-4 flex-col lg:flex-row">
      <div className={`flex-1 rounded-xl border p-3 ${isLight ? 'border-black/8 bg-gray-50' : 'border-white/6 bg-[#060810]'}`}>
        <svg viewBox={`-20 -60 ${boardW + 40} ${boardH + 80}`} className="w-full max-h-[280px]">
          <rect x="0" y="0" width={boardW} height={boardH} rx="8" fill={isLight ? '#f0f0f5' : '#0e1017'} stroke={isLight ? '#c0c0d0' : '#6b96be40'} strokeWidth="1.5" />
          <text x={boardW / 2} y={boardH / 2} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontFamily="monospace" fill={isLight ? '#00000015' : '#ffffff08'}>{pinMap.category}</text>
          {connectors.map(c => (
            <g key={c.id}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="2" fill={isLight ? '#e8e8f0' : '#1a1f2e'} stroke={`${c.color}40`} strokeWidth="1" />
              <text x={c.x + c.w / 2} y={c.y - 4} textAnchor="middle" fontSize="6" fontFamily="monospace" fill={`${c.color}90`}>{c.label}</text>
            </g>
          ))}
          {visibleWires.map((wire, i) => {
            const conn = connectors.find(c => c.id === wire.connectorId); if (!conn) return null
            const cx = conn.x + conn.w / 2, cy = conn.y + conn.h / 2, sY = -45, sX = 30 + i * 55
            const stepId = `${wire.sensorType}_${wire.connectorId}`, isChecked = checkedSteps.has(stepId)
            return (
              <g key={wire.sensorType}>
                <path d={`M${sX + 20},${sY + 22} L${sX + 20},${Math.min(cy, sY + 40)} L${cx},${cy}`} fill="none" stroke={wire.wireColor}
                  strokeWidth={isChecked ? 2 : 1} opacity={isChecked ? 1 : 0.3} strokeDasharray={isChecked ? undefined : '4 3'} className={isChecked ? 'animate-dash-flow' : ''} />
                <g transform={`translate(${sX}, ${sY})`}>
                  <rect width="40" height="22" rx="4" fill={isLight ? '#f0f0f5' : '#0e1017'} stroke={isChecked ? wire.wireColor : `${wire.wireColor}40`} strokeWidth={isChecked ? 1.5 : 1} />
                  <text x="20" y="14" textAnchor="middle" fontSize="7" fontFamily="monospace" fill={isChecked ? wire.wireColor : `${wire.wireColor}60`}>{wire.sensorType.toUpperCase().slice(0, 6)}</text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="lg:w-64 space-y-1">
        {steps.map((step, i) => {
          const isChecked = checkedSteps.has(step.id)
          return (
            <button key={step.id} onClick={() => onToggleStep(step.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${isChecked ? (isLight ? 'border-green-200 bg-green-50' : 'border-green-500/20 bg-green-500/5') : (isLight ? 'border-black/6' : 'border-white/6')}`}>
              <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] flex-shrink-0 ${isChecked ? 'bg-green-500 text-white' : (isLight ? 'border border-black/15' : 'border border-white/15')}`}>{isChecked ? '✓' : ''}</span>
              <span className={`text-[10px] font-mono truncate ${isChecked ? 'text-primary' : 'text-secondary/60'}`}>{step.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================
   TAB: Hardware (Part List Management)
   ================================================================ */
interface PartItem { id: string; name: string; qty: number; status: 'ordered' | 'arrived' | 'assembled'; memo: string; image: string | null }

function HardwareTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const storageKey = `leviosai_deploy_parts_${project.id}`

  const [parts, setParts] = useState<PartItem[]>(() => {
    const saved = loadJson<PartItem[]>(storageKey, [])
    if (saved.length > 0) return saved
    // Auto-populate from BOM
    const bom = state.hardware ? generateBom(state) : []
    return bom.map(b => {
      const prod = getProductById(b.productId)
      return { id: b.productId, name: prod?.name ?? b.productId, qty: b.quantity, status: 'ordered' as const, memo: '', image: null }
    })
  })

  useEffect(() => { saveJson(storageKey, parts) }, [parts, storageKey])

  const [newPartName, setNewPartName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageTarget, setImageTarget] = useState<string | null>(null)

  function addPart() {
    if (!newPartName.trim()) return
    setParts(prev => [...prev, { id: `custom_${Date.now()}`, name: newPartName.trim(), qty: 1, status: 'ordered', memo: '', image: null }])
    setNewPartName('')
  }

  function updatePart(id: string, updates: Partial<PartItem>) {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  function removePart(id: string) {
    setParts(prev => prev.filter(p => p.id !== id))
  }

  function exportCsv() {
    const csv = ['Name,Qty,Status,Memo', ...parts.map(p => `"${p.name}",${p.qty},${p.status},"${p.memo}"`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project.name}_partlist.csv`; a.click()
    showToast('Part list exported', 'success')
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !imageTarget) return
    const reader = new FileReader()
    reader.onload = ev => { updatePart(imageTarget, { image: ev.target?.result as string }); setImageTarget(null) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const STATUS_COLORS: Record<string, string> = {
    ordered: isLight ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    arrived: isLight ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    assembled: isLight ? 'text-green-600 bg-green-50 border-green-200' : 'text-green-400 bg-green-500/10 border-green-500/20',
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <input value={newPartName} onChange={e => setNewPartName(e.target.value)} placeholder="Part name..."
          onKeyDown={e => e.key === 'Enter' && addPart()}
          className={`px-3 py-2 rounded-lg border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-background/60 border-white/10'} text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50`} />
        <button onClick={addPart} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-accent border border-accent/30 hover:bg-accent/10 transition-colors">{t('deploy.addPart')}</button>
        <button onClick={exportCsv} className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${isLight ? 'text-black/40 border border-black/10 hover:bg-black/5' : 'text-secondary/50 border border-white/10 hover:bg-white/5'}`}>{t('deploy.exportCsv')}</button>
      </div>

      {/* Part List */}
      <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-black/8' : 'border-white/6'}`}>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className={isLight ? 'bg-gray-100' : 'bg-white/3'}>
              <th className="text-left px-4 py-2 text-secondary/60">Part</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-16">Qty</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-24">Status</th>
              <th className="text-left px-2 py-2 text-secondary/60">Memo</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-16">Photo</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id} className={`border-t ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                <td className="px-4 py-2 text-primary font-bold">{part.name}</td>
                <td className="text-center px-2 py-2">
                  <input type="number" value={part.qty} min={1} onChange={e => updatePart(part.id, { qty: parseInt(e.target.value) || 1 })}
                    className={`w-12 text-center rounded border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-background/60 border-white/10'} text-primary`} />
                </td>
                <td className="text-center px-2 py-2">
                  <select value={part.status} onChange={e => updatePart(part.id, { status: e.target.value as PartItem['status'] })}
                    className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${STATUS_COLORS[part.status]} cursor-pointer`}>
                    <option value="ordered">Ordered</option>
                    <option value="arrived">Arrived</option>
                    <option value="assembled">Assembled</option>
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input value={part.memo} onChange={e => updatePart(part.id, { memo: e.target.value })} placeholder="..."
                    className={`w-full px-2 py-1 rounded border text-[10px] font-mono ${isLight ? 'bg-white border-black/8' : 'bg-background/60 border-white/8'} text-secondary`} />
                </td>
                <td className="text-center px-2 py-2">
                  {part.image ? (
                    <img src={part.image} alt="" className="w-8 h-8 rounded object-cover mx-auto cursor-pointer hover:scale-150 transition-transform" />
                  ) : (
                    <button onClick={() => { setImageTarget(part.id); fileRef.current?.click() }}
                      className="text-[10px] text-secondary/40 hover:text-accent transition-colors">+</button>
                  )}
                </td>
                <td className="px-1">
                  <button onClick={() => removePart(part.id)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {parts.length === 0 && <p className="text-center py-8 text-xs font-mono text-secondary/30">No parts added</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  )
}

/* ================================================================
   TAB: Software (Packages + Code + Tools)
   ================================================================ */
interface PackageItem { name: string; version: string; latest: string }

const DEFAULT_PY_PACKAGES: PackageItem[] = [
  { name: 'torch', version: '2.4.0', latest: '2.4.0' },
  { name: 'torchvision', version: '0.19.0', latest: '0.19.0' },
  { name: 'opencv-python', version: '4.10.0', latest: '4.10.0' },
  { name: 'numpy', version: '1.26.4', latest: '2.0.0' },
  { name: 'ultralytics', version: '8.2.0', latest: '8.3.0' },
  { name: 'onnxruntime', version: '1.18.0', latest: '1.19.0' },
]

const DEFAULT_CPP_PACKAGES: PackageItem[] = [
  { name: 'CMake', version: '3.28', latest: '3.30' },
  { name: 'OpenCV', version: '4.9.0', latest: '4.10.0' },
  { name: 'TensorRT', version: '8.6', latest: '10.0' },
  { name: 'CUDA Toolkit', version: '12.4', latest: '12.6' },
]

function SoftwareTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const storageKey = `leviosai_deploy_packages_${project.id}`
  const gitKey = `leviosai_deploy_git_${project.id}`

  const [packages, setPackages] = useState<PackageItem[]>(() =>
    loadJson(storageKey, state.language.includes('C++') ? DEFAULT_CPP_PACKAGES : DEFAULT_PY_PACKAGES)
  )
  const [gitUrl, setGitUrl] = useState(() => loadJson(gitKey, ''))
  const [newPkg, setNewPkg] = useState('')

  useEffect(() => { saveJson(storageKey, packages) }, [packages, storageKey])
  useEffect(() => { saveJson(gitKey, gitUrl) }, [gitUrl, gitKey])

  const sdkSteps = useMemo(() => state.hardware ? getSdkSteps(state.hardware.category, state.language) : [], [state.hardware, state.language])

  function addPackage() {
    if (!newPkg.trim()) return
    setPackages(prev => [...prev, { name: newPkg.trim(), version: '—', latest: '—' }])
    setNewPkg('')
  }

  function downloadCode() {
    if (!state.generatedCode) { showToast('No generated code available', 'info'); return }
    const ext = state.language.includes('C++') ? 'cpp' : state.language.includes('.ipynb') ? 'ipynb' : 'py'
    const blob = new Blob([state.generatedCode], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project.name}_main.${ext}`; a.click()
    showToast('Code downloaded', 'success')
  }

  return (
    <div className="space-y-5">
      {/* Package Registry */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">Package Registry</p>
        <div className="flex items-center gap-2 mb-3">
          <input value={newPkg} onChange={e => setNewPkg(e.target.value)} placeholder="Package name..."
            onKeyDown={e => e.key === 'Enter' && addPackage()}
            className={`px-3 py-2 rounded-lg border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-background/60 border-white/10'} text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50`} />
          <button onClick={addPackage} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-accent border border-accent/30 hover:bg-accent/10 transition-colors">{t('deploy.addPackage')}</button>
        </div>
        <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-black/8' : 'border-white/6'}`}>
          <table className="w-full text-xs font-mono">
            <thead><tr className={isLight ? 'bg-gray-100' : 'bg-white/3'}>
              <th className="text-left px-4 py-2 text-secondary/60">Package</th>
              <th className="text-center px-3 py-2 text-secondary/60">Current</th>
              <th className="text-center px-3 py-2 text-secondary/60">Latest</th>
              <th className="text-center px-3 py-2 text-secondary/60 w-16">Status</th>
            </tr></thead>
            <tbody>
              {packages.map((pkg, i) => {
                const upToDate = pkg.version === pkg.latest || pkg.latest === '—'
                return (
                  <tr key={i} className={`border-t ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                    <td className="px-4 py-2 text-primary font-bold">{pkg.name}</td>
                    <td className="text-center px-3 py-2 text-secondary">{pkg.version}</td>
                    <td className="text-center px-3 py-2 text-secondary/60">{pkg.latest}</td>
                    <td className="text-center px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${upToDate ? (isLight ? 'bg-green-50 text-green-600' : 'bg-green-500/10 text-green-400') : (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400')}`}>
                        {upToDate ? 'OK' : 'UPDATE'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Tools */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">External Tools</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={() => window.open(`vscode://file/${project.name}`, '_blank')}
            className={`p-4 rounded-xl border text-left transition-all hover:border-accent/30 ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
            <span className="text-lg">⌨</span>
            <p className="text-xs font-mono font-bold text-primary mt-2">{t('deploy.openVscode')}</p>
            <p className="text-[9px] font-mono text-secondary/40 mt-0.5">vscode:// URI</p>
          </button>
          <button onClick={downloadCode}
            className={`p-4 rounded-xl border text-left transition-all hover:border-accent/30 ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
            <span className="text-lg">↓</span>
            <p className="text-xs font-mono font-bold text-primary mt-2">{t('deploy.downloadCode')}</p>
            <p className="text-[9px] font-mono text-secondary/40 mt-0.5">{state.language}</p>
          </button>
          <div className={`p-4 rounded-xl border ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
            <span className="text-lg">⎇</span>
            <p className="text-xs font-mono font-bold text-primary mt-2">GitHub</p>
            <input value={gitUrl} onChange={e => setGitUrl(e.target.value)} placeholder="https://github.com/..."
              className={`w-full mt-1.5 px-2 py-1 rounded border text-[10px] font-mono ${isLight ? 'bg-gray-50 border-black/8' : 'bg-background/60 border-white/8'} text-primary placeholder:text-secondary/30`} />
          </div>
        </div>
      </div>

      {/* SDK Commands */}
      {sdkSteps.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">SDK Commands</p>
          <div className="space-y-3">
            {sdkSteps.slice(0, 3).map(step => (
              <TerminalBlock key={step.id} title={step.title} subtitle={step.subtitle} commands={step.commands} estimatedTime={step.estimatedTime} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   TAB: AI Notes
   ================================================================ */
interface TodoItem { id: string; text: string; done: boolean }

function AiNotesTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const notesKey = `leviosai_deploy_notes_${project.id}`
  const todosKey = `leviosai_deploy_todos_${project.id}`

  const [notes, setNotes] = useState(() => loadJson<string>(notesKey, `# ${project.name} — Deploy Notes\n\n`))
  const [todos, setTodos] = useState<TodoItem[]>(() => loadJson(todosKey, []))
  const [newTodo, setNewTodo] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { saveJson(notesKey, notes) }, [notes, notesKey])
  useEffect(() => { saveJson(todosKey, todos) }, [todos, todosKey])

  async function runAiAnalysis() {
    if (!hasApiKey()) { showToast('API key required for AI analysis', 'info'); return }
    setAiLoading(true)
    try {
      const prompt = `You are an Edge AI deployment expert. Analyze this pipeline and provide 5 actionable recommendations:
- Domain: ${project.domain}
- Hardware: ${project.hardware}
- Sensors: ${project.sensors?.join(', ')}
- Model: ${project.model}
- Techniques: ${project.techniques?.join(', ')}
- Language: ${project.language}

Provide recommendations in markdown format covering: hardware setup tips, software optimization, potential issues, testing strategy, and production readiness checklist.`
      const result = await callGeminiDirect('You are a senior Edge AI engineer providing deployment recommendations. Be specific and practical.', prompt, 0.7)
      setAiResult(result)
      addLog('AI deployment analysis complete', 'GEN')
    } catch (err) {
      showToast('AI analysis failed', 'error')
    }
    setAiLoading(false)
  }

  function appendToNotes() {
    if (!aiResult) return
    setNotes(prev => prev + '\n\n---\n## AI Recommendations\n' + aiResult)
    showToast('Added to notes', 'success')
  }

  function addTodo() {
    if (!newTodo.trim()) return
    setTodos(prev => [...prev, { id: `t_${Date.now()}`, text: newTodo.trim(), done: false }])
    setNewTodo('')
  }

  function toggleTodo(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function removeTodo(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Markdown Editor */}
        <div>
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-2">Notes (Markdown)</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className={`w-full h-[400px] px-4 py-3 rounded-xl border font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-accent/50 ${isLight ? 'bg-white border-black/8 text-black/80' : 'bg-[#060810] border-white/6 text-primary'}`} />
        </div>

        {/* AI Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono text-accent uppercase tracking-widest">AI Agent</p>
            <div className="flex gap-2">
              {aiResult && (
                <button onClick={appendToNotes} className="text-[10px] font-mono text-green-400 border border-green-500/20 px-2 py-0.5 rounded hover:bg-green-500/10 transition-colors">
                  {t('deploy.addToNotes')}
                </button>
              )}
              <button onClick={runAiAnalysis} disabled={aiLoading}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-colors ${aiLoading ? 'text-secondary/30' : 'text-accent border border-accent/20 hover:bg-accent/10'}`}>
                {aiLoading ? t('deploy.aiAnalyzing') : t('deploy.aiAnalyze')}
              </button>
            </div>
          </div>
          <div className={`h-[400px] overflow-y-auto px-4 py-3 rounded-xl border font-mono text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'bg-gray-50 border-black/8 text-black/70' : 'bg-component border-white/6 text-secondary/70'}`}>
            {aiResult || (
              <p className={isLight ? 'text-black/20' : 'text-secondary/20'}>
                Click "AI Analyze" to get deployment recommendations based on your pipeline configuration.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-2">Checklist</p>
        <div className="flex items-center gap-2 mb-2">
          <input value={newTodo} onChange={e => setNewTodo(e.target.value)} placeholder="Add task..."
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-background/60 border-white/10'} text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50`} />
          <button onClick={addTodo} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-accent border border-accent/30 hover:bg-accent/10 transition-colors">{t('deploy.addTodo')}</button>
        </div>
        <div className="space-y-1">
          {todos.map(todo => (
            <div key={todo.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${todo.done ? (isLight ? 'border-green-200 bg-green-50' : 'border-green-500/20 bg-green-500/5') : (isLight ? 'border-black/6' : 'border-white/6')}`}>
              <button onClick={() => toggleTodo(todo.id)}
                className={`w-4 h-4 rounded flex items-center justify-center text-[8px] flex-shrink-0 ${todo.done ? 'bg-green-500 text-white' : (isLight ? 'border border-black/15' : 'border border-white/15')}`}>
                {todo.done ? '✓' : ''}
              </button>
              <span className={`flex-1 text-xs font-mono ${todo.done ? 'line-through text-secondary/40' : 'text-primary'}`}>{todo.text}</span>
              <button onClick={() => removeTodo(todo.id)} className="text-red-400/30 hover:text-red-400 text-xs transition-colors">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   TAB: Media (Gallery + YouTube + Social)
   ================================================================ */
interface MediaItem { id: string; type: 'image' | 'youtube'; url: string; caption: string }

function MediaTab({ project }: { project: SavedProject }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const storageKey = `leviosai_deploy_media_${project.id}`

  const [media, setMedia] = useState<MediaItem[]>(() => loadJson(storageKey, []))
  const [ytUrl, setYtUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { saveJson(storageKey, media) }, [media, storageKey])

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setMedia(prev => [...prev, { id: `img_${Date.now()}`, type: 'image', url: ev.target?.result as string, caption: file.name }])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function addYouTube() {
    if (!ytUrl.trim()) return
    // Extract video ID
    const match = ytUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
    const videoId = match?.[1]
    if (!videoId) { showToast('Invalid YouTube URL', 'error'); return }
    setMedia(prev => [...prev, { id: `yt_${Date.now()}`, type: 'youtube', url: videoId, caption: '' }])
    setYtUrl('')
  }

  function removeMedia(id: string) {
    setMedia(prev => prev.filter(m => m.id !== id))
  }

  function shareTwitter() {
    const text = `Built an Edge AI project: "${project.name}" using ${project.hardware ?? 'custom hardware'} with ${project.model ?? 'AI model'}. #EdgeAI #LEVIOSAI`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareLinkedIn() {
    const text = `Just deployed an Edge AI pipeline "${project.name}" using LEVIOSAI platform! Hardware: ${project.hardware}, Model: ${project.model}`
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://leviosai.dev')}&summary=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-5">
      {/* Upload actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-accent border border-accent/30 hover:bg-accent/10 transition-colors">
          {t('deploy.uploadImage')}
        </button>
        <div className="flex items-center gap-1">
          <input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="YouTube URL..."
            onKeyDown={e => e.key === 'Enter' && addYouTube()}
            className={`px-3 py-2 rounded-lg border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-background/60 border-white/10'} text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50 w-56`} />
          <button onClick={addYouTube} className={`px-3 py-2 rounded-lg text-xs font-mono font-bold ${isLight ? 'text-red-600 border border-red-200 hover:bg-red-50' : 'text-red-400 border border-red-500/20 hover:bg-red-500/10'} transition-colors`}>
            YouTube
          </button>
        </div>
        <div className="flex-1" />
        <button onClick={shareTwitter} className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${isLight ? 'text-sky-600 border border-sky-200 hover:bg-sky-50' : 'text-sky-400 border border-sky-500/20 hover:bg-sky-500/10'}`}>
          𝕏 Share
        </button>
        <button onClick={shareLinkedIn} className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${isLight ? 'text-blue-700 border border-blue-200 hover:bg-blue-50' : 'text-blue-400 border border-blue-500/20 hover:bg-blue-500/10'}`}>
          LinkedIn
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />

      {/* Gallery */}
      {media.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${isLight ? 'border-dashed border-black/10' : 'border-dashed border-white/8'}`}>
          <span className="text-3xl mb-3 opacity-20">▣</span>
          <p className="text-xs font-mono text-secondary/30">Upload images or add YouTube videos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map(item => (
            <div key={item.id} className={`rounded-xl border overflow-hidden group relative ${isLight ? 'border-black/8' : 'border-white/6'}`}>
              {item.type === 'image' ? (
                <img src={item.url} alt={item.caption} className="w-full aspect-video object-cover" />
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${item.url}`}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                  title={item.caption || 'YouTube video'}
                />
              )}
              <button onClick={() => removeMedia(item.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ✕
              </button>
              {item.caption && (
                <div className={`px-2 py-1.5 ${isLight ? 'bg-white' : 'bg-component'}`}>
                  <p className="text-[10px] font-mono text-secondary/50 truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   MAIN: DeployPage
   ================================================================ */
export default function DeployPage({ state, savedProjects, onGoToProject }: Props) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null)
  const [activeTab, setActiveTab] = useState<DeployTab>('overview')

  function handleSelectProject(p: SavedProject) {
    setSelectedProject(p)
    setActiveTab('overview')
    addLog(`Deploy: loaded pipeline "${p.name}"`, 'NAV')
  }

  /* ── No project selected → show selector ── */
  if (!selectedProject) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <ProjectSelector projects={savedProjects} onSelect={handleSelectProject} onGoToProject={onGoToProject} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-1">Deploy</p>
            <h1 className="text-2xl font-bold text-primary font-mono tracking-tight">
              <TypewriterText text={selectedProject.name} speed={30} />
            </h1>
            <p className="text-xs font-mono text-secondary/50 mt-1">
              {selectedProject.hardware ?? 'No hardware'} · {selectedProject.model ?? 'No model'} · {selectedProject.language}
            </p>
          </div>
          <button onClick={() => setSelectedProject(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${isLight ? 'text-black/40 border border-black/10 hover:bg-black/5' : 'text-secondary/50 border border-white/10 hover:bg-white/5'}`}>
            ← Projects
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex items-center gap-1 px-6 pb-3 border-b flex-shrink-0 ${isLight ? 'border-black/8' : 'border-white/6'}`}>
        {TAB_LIST.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-accent/15 text-accent border border-accent/30'
                : isLight
                ? 'text-black/40 border border-transparent hover:bg-black/5'
                : 'text-secondary/40 border border-transparent hover:bg-white/5'
            }`}>
            <span className="text-[10px]">{tab.icon}</span>
            {t(tab.key)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'overview' && <OverviewTab project={selectedProject} state={state} />}
        {activeTab === 'hardware' && <HardwareTab project={selectedProject} state={state} />}
        {activeTab === 'software' && <SoftwareTab project={selectedProject} state={state} />}
        {activeTab === 'notes' && <AiNotesTab project={selectedProject} state={state} />}
        {activeTab === 'media' && <MediaTab project={selectedProject} />}
      </div>
    </div>
  )
}
