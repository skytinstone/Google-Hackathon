import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { WizardState, SavedProject } from '../../types'
import { useI18n } from '../../utils/i18n'
import { useTheme } from '../../utils/theme'
import { addLog } from '../../utils/syslog'
import { showToast } from '../../utils/toast'
import { callGeminiDirect, hasApiKey } from '../../api/api'
import TypewriterText from '../TypewriterText'
import SystemInfoPanel from '../SystemInfoPanel'
import {
  getPinMap,
  getAssemblySteps,
  getBenchmarkResult,
  getSdkSteps,
  getDeployLogLines,
  TECHNIQUE_EFFECTS,
  BENCHMARK_PROFILES,
  type HardwarePinMap,
  type AssemblyStep,
  type BenchmarkResult,
  type DeployLogLine,
} from '../../data/deployData'

interface Props {
  state: WizardState
  savedProjects: SavedProject[]
  onGoToProject: () => void
}

type LaunchTab = 'overview' | 'deploy' | 'performance' | 'notes' | 'media'

const TAB_LIST: { id: LaunchTab; key: string; icon: string }[] = [
  { id: 'overview',    key: 'launch.tabOverview',    icon: '◈' },
  { id: 'deploy',      key: 'launch.tabDeploy',      icon: '▶' },
  { id: 'performance', key: 'launch.tabPerformance', icon: '◉' },
  { id: 'notes',       key: 'launch.tabNotes',       icon: '◆' },
  { id: 'media',       key: 'launch.tabMedia',       icon: '▣' },
]

/* ── localStorage helpers ── */
function loadJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveJson(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

/* ── Helper: resolve techniques from WizardState or SavedProject ── */
function resolveTechniques(state: WizardState, project: SavedProject) {
  return state.techniques.length > 0
    ? state.techniques
    : (project.techniques ?? []).map((name, i) => ({ id: `saved_${i}`, name, subtype: null }))
}

/* ================================================================
   Project Selector (shared pattern)
   ================================================================ */
function ProjectSelector({ projects, onSelect, onGoToProject }: {
  projects: SavedProject[]; onSelect: (p: SavedProject) => void; onGoToProject: () => void
}) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <span className="text-4xl mb-4 opacity-20">🚀</span>
        <p className="text-sm font-mono text-secondary/50 mb-4">No saved pipelines yet</p>
        <button onClick={onGoToProject}
          className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors">
          Create Pipeline
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-4">Select a pipeline to launch</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map(p => (
          <button key={p.id} onClick={() => onSelect(p)}
            className={`text-left p-4 rounded-xl border transition-all hover:border-accent/30 hover:scale-[1.01] ${isLight ? 'bg-white border-black/8' : 'bg-component border-white/6'}`}>
            <p className="text-sm font-mono font-bold text-primary truncate">{p.name}</p>
            <p className="text-[10px] font-mono text-secondary/50 mt-1 truncate">{p.hardware ?? 'No HW'} · {p.model ?? 'No model'}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   Reusable: Arc Gauge (SVG)
   ================================================================ */
function ArcGauge({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const pct = Math.min(value / max, 1)
  const r = 38; const cx = 50; const cy = 50
  const startAngle = -225; const endAngle = 45
  const range = endAngle - startAngle
  const circumference = 2 * Math.PI * r
  const arcLength = (range / 360) * circumference
  const filled = pct * arcLength

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={isLight ? '#e5e7eb' : '#ffffff0a'} strokeWidth="6"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset="0" strokeLinecap="round"
          transform={`rotate(${startAngle + 180} ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${filled} ${circumference}`}
          strokeDashoffset="0" strokeLinecap="round"
          transform={`rotate(${startAngle + 180} ${cx} ${cy})`}
          className="animate-arc-fill" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="text-[13px] font-mono font-bold" fill={isLight ? '#111' : '#e5e7eb'}>{Math.round(value)}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[7px] font-mono" fill={isLight ? '#888' : '#a1a1aa'}>{unit}</text>
      </svg>
      <span className="text-[10px] font-mono text-secondary/70 mt-1">{label}</span>
    </div>
  )
}

/* ================================================================
   Reusable: Terminal Block
   ================================================================ */
function TerminalBlock({ title, subtitle, commands, estimatedTime }: {
  title: string; subtitle: string; commands: string[]; estimatedTime: string
}) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [copied, setCopied] = useState(false)

  function copyAll() {
    navigator.clipboard.writeText(commands.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-black/8' : 'border-white/6'}`}>
      <div className={`flex items-center justify-between px-4 py-2 ${isLight ? 'bg-gray-100' : 'bg-white/3'}`}>
        <div>
          <span className="text-xs font-mono font-bold text-primary">{title}</span>
          <span className="text-[9px] font-mono text-secondary/40 ml-2">{subtitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-secondary/30">{estimatedTime}</span>
          <button onClick={copyAll} className="text-[10px] font-mono text-accent hover:text-accent/80 transition-colors">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className={`px-4 py-3 font-mono text-xs leading-relaxed ${isLight ? 'bg-gray-50 text-black/70' : 'bg-[#060810] text-green-400/80'}`}>
        {commands.map((cmd, i) => (
          <div key={i} className="flex">
            <span className={isLight ? 'text-black/30 mr-2' : 'text-green-600/50 mr-2'}>$</span>
            <span>{cmd}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   Reusable: Board SVG (shared between inline + modal)
   ================================================================ */
function BoardSvg({ pinMap, className }: { pinMap: HardwarePinMap; className?: string }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <svg viewBox={`0 0 ${pinMap.boardW} ${pinMap.boardH}`} className={className}>
      <rect x="2" y="2" width={pinMap.boardW - 4} height={pinMap.boardH - 4} rx="8" fill={isLight ? '#f3f4f6' : '#111827'} stroke={isLight ? '#d1d5db' : '#374151'} strokeWidth="1.5" />
      <text x={pinMap.boardW / 2} y="18" textAnchor="middle" fill={isLight ? '#111' : '#fff'} fontSize="9" fontFamily="monospace" fontWeight="bold">{pinMap.category}</text>
      {pinMap.connectors.map(c => (
        <g key={c.id}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="3" fill={isLight ? '#dbeafe' : '#1e3a5f'} stroke={isLight ? '#93c5fd' : '#60a5fa'} strokeWidth="0.8" />
          <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 3} textAnchor="middle" fill={isLight ? '#1d4ed8' : '#93c5fd'} fontSize="6" fontFamily="monospace">{c.label}</text>
        </g>
      ))}
      {pinMap.sensorWires.map((w: import('../../data/deployData').SensorWire, i: number) => {
        const conn = pinMap.connectors.find(c => c.id === w.connectorId)
        if (!conn) return null
        const sx = conn.x + conn.w / 2; const sy = conn.y
        return (
          <line key={i} x1={sx} y1={sy} x2={sx} y2={sy - 20} stroke={w.wireColor} strokeWidth="2" strokeDasharray="4 2" className="animate-dash-flow" opacity="0.7" />
        )
      })}
    </svg>
  )
}

/* ================================================================
   Reusable: Assembly Diagram Compact (SVG) + Fullscreen Modal
   ================================================================ */
function HardwareAssemblyDiagramCompact({ pinMap, steps, checkedSteps, onToggleStep, customSteps, onAddCustom, onRemoveCustom }: {
  pinMap: HardwarePinMap
  steps: AssemblyStep[]
  checkedSteps: Set<string>
  onToggleStep: (id: string) => void
  customSteps: { id: string; label: string }[]
  onAddCustom: (label: string) => void
  onRemoveCustom: (id: string) => void
}) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [showModal, setShowModal] = useState(false)
  const [newItem, setNewItem] = useState('')

  const allSteps = [...steps, ...customSteps.map(c => ({ ...c, detail: '', connectorId: '' }))]

  function handleAdd() {
    if (!newItem.trim()) return
    onAddCustom(newItem.trim())
    setNewItem('')
  }

  const checklistUi = (
    <div className="space-y-1.5">
      {allSteps.map(step => {
        const isChecked = checkedSteps.has(step.id)
        const isCustom = customSteps.some(c => c.id === step.id)
        return (
          <div key={step.id} className="flex items-center gap-1">
            <button onClick={() => onToggleStep(step.id)}
              className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${isChecked ? (isLight ? 'border-green-200 bg-green-50' : 'border-green-500/20 bg-green-500/5') : (isLight ? 'border-black/6' : 'border-white/6')}`}>
              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${isChecked ? 'bg-green-500 text-white' : (isLight ? 'border border-black/15' : 'border border-white/15')}`}>{isChecked ? '✓' : ''}</span>
              <span className={`text-xs font-mono ${isChecked ? 'text-primary' : (isLight ? 'text-black/50' : 'text-white/50')}`}>{step.label}</span>
            </button>
            {isCustom && (
              <button onClick={() => onRemoveCustom(step.id)}
                className="text-red-400/50 hover:text-red-400 text-xs px-1 transition-colors flex-shrink-0">✕</button>
            )}
          </div>
        )
      })}
      <div className="flex items-center gap-2 mt-2">
        <input value={newItem} onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add custom step..."
          className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-[#060810] border-white/10'} text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50`} />
        <button onClick={handleAdd}
          className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-accent border border-accent/30 hover:bg-accent/10 transition-colors">+</button>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Enlarged SVG — click to open fullscreen */}
        <button onClick={() => setShowModal(true)}
          className={`flex-shrink-0 rounded-xl border p-4 cursor-pointer hover:border-accent/30 transition-colors ${isLight ? 'bg-gray-50 border-black/8' : 'bg-[#060810] border-white/6'}`}>
          <BoardSvg pinMap={pinMap} className="w-[480px] h-auto" />
          <p className={`text-[9px] font-mono text-center mt-2 ${isLight ? 'text-black/30' : 'text-white/30'}`}>Click to enlarge</p>
        </button>
        <div className="flex-1 min-w-0">
          {checklistUi}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className={`relative rounded-2xl border p-6 max-w-[90vw] max-h-[90vh] overflow-auto ${isLight ? 'bg-white border-black/10' : 'bg-[#0a0c14] border-white/10'}`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-mono font-bold text-primary">{pinMap.category} — Hardware Diagram</p>
              <button onClick={() => setShowModal(false)}
                className={`px-3 py-1 rounded-lg text-xs font-mono ${isLight ? 'text-black/40 hover:bg-black/5' : 'text-white/40 hover:bg-white/5'} transition-colors`}>✕ Close</button>
            </div>
            <BoardSvg pinMap={pinMap} className="w-full max-w-[800px] h-auto mx-auto" />
          </div>
        </div>
      )}
    </>
  )
}

/* ================================================================
   Quick Actions Bar
   ================================================================ */
function QuickActionsBar({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const hwCat = (state.hardware?.category ?? project.hardware ?? '').toLowerCase()
  const btnCls = `px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors ${isLight ? 'text-black/50 border border-black/10 hover:bg-black/5' : 'text-secondary/60 border border-white/10 hover:bg-white/5'}`

  function copySsh() {
    let user = 'user'
    if (hwCat.includes('jetson') || hwCat.includes('nvidia')) user = 'nvidia'
    else if (hwCat.includes('hailo') || hwCat.includes('raspberry')) user = 'pi'
    else if (hwCat.includes('stm32')) { navigator.clipboard.writeText('st-flash write firmware.bin 0x08000000'); showToast('Flash command copied', 'success'); return }
    navigator.clipboard.writeText(`ssh ${user}@192.168.1.100`)
    showToast('SSH command copied', 'success')
  }

  function copyTestScript() {
    const lang = project.language ?? state.language
    const script = lang.includes('C++')
      ? `cd ~/project && mkdir -p build && cd build\ncmake .. -DCMAKE_BUILD_TYPE=Release\nmake -j$(nproc)\n./test_inference --model model_opt.engine`
      : `cd ~/project\npython3 -c "import torch; print('CUDA:', torch.cuda.is_available())"\npython3 main.py --test --model model_opt.onnx`
    navigator.clipboard.writeText(script)
    showToast('Test script copied', 'success')
  }

  function exportConfig() {
    navigator.clipboard.writeText(JSON.stringify(project, null, 2))
    showToast('Config JSON copied', 'success')
  }

  function viewLogs() {
    addLog('Opened system log viewer', 'NAV')
    showToast('Check system log panel below', 'info')
  }

  return (
    <div className={`flex items-center gap-2 px-6 py-2 border-b flex-shrink-0 ${isLight ? 'border-black/6 bg-gray-50/50' : 'border-white/4 bg-white/[0.015]'}`}>
      <span className="text-[9px] font-mono text-secondary/30 mr-1">Quick:</span>
      <button onClick={copySsh} className={btnCls}>{t('launch.quickCopySsh')}</button>
      <button onClick={copyTestScript} className={btnCls}>{t('launch.quickTestScript')}</button>
      <button onClick={exportConfig} className={btnCls}>{t('launch.quickExportConfig')}</button>
      <button onClick={viewLogs} className={btnCls}>{t('launch.quickViewLogs')}</button>
    </div>
  )
}

/* ================================================================
   TAB: Overview (Benchmark + Diagram)
   ================================================================ */
function OverviewTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const hwCategory = state.hardware?.category ?? project.hardware ?? ''
  const sensors = state.sensors.length > 0
    ? state.sensors
    : (project.sensors ?? []).map((name, i) => ({ id: `saved_${i}`, name, type: name, specs: '' }))
  const techniques = resolveTechniques(state, project)

  const pinMap: HardwarePinMap = useMemo(() => getPinMap(hwCategory), [hwCategory])
  const steps: AssemblyStep[] = useMemo(() => getAssemblySteps(pinMap, sensors), [pinMap, sensors])
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(() => {
    const saved = loadJson<string[]>(`leviosai_launch_checks_${project.id}`, [])
    return new Set(saved)
  })
  const [customSteps, setCustomSteps] = useState<{ id: string; label: string }[]>(() =>
    loadJson<{ id: string; label: string }[]>(`leviosai_launch_custom_steps_${project.id}`, [])
  )

  useEffect(() => {
    saveJson(`leviosai_launch_checks_${project.id}`, [...checkedSteps])
  }, [checkedSteps, project.id])

  useEffect(() => {
    saveJson(`leviosai_launch_custom_steps_${project.id}`, customSteps)
  }, [customSteps, project.id])

  function toggleStep(id: string) {
    setCheckedSteps(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function addCustomStep(label: string) {
    setCustomSteps(prev => [...prev, { id: `custom_${Date.now()}`, label }])
  }

  function removeCustomStep(id: string) {
    setCustomSteps(prev => prev.filter(s => s.id !== id))
    setCheckedSteps(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const benchmark = useMemo(() => {
    const deviceId = state.hardware?.device ?? project.hardware ?? ''
    return getBenchmarkResult(deviceId, techniques)
  }, [state.hardware, project.hardware, techniques])

  const GAUGE_CONFIG = [
    { label: 'Latency', value: benchmark.optLatencyMs, max: 100, unit: 'ms', color: '#60a5fa' },
    { label: 'Throughput', value: benchmark.optFps, max: 200, unit: 'FPS', color: '#34d399' },
    { label: 'Memory', value: benchmark.optMemoryMb, max: 16000, unit: 'MB', color: '#a78bfa' },
    { label: 'Power', value: benchmark.optPowerW, max: 100, unit: 'W', color: '#f59e0b' },
    { label: 'Accuracy', value: benchmark.optAccuracy, max: 100, unit: '%', color: '#f472b6' },
    { label: 'Efficiency', value: benchmark.efficiencyScore, max: 100, unit: 'pts', color: '#22d3ee' },
  ]

  return (
    <div className="space-y-6">
      {/* Pipeline Summary */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3`}>
        {[
          { label: 'Domain', value: project.domain },
          { label: 'Hardware', value: project.hardware },
          { label: 'Model', value: project.model },
          { label: 'Language', value: project.language },
        ].map(item => (
          <div key={item.label} className={`px-4 py-3 rounded-xl border ${isLight ? 'bg-white border-black/8' : 'bg-component border-white/6'}`}>
            <p className="text-[9px] font-mono text-secondary/40 uppercase">{item.label}</p>
            <p className="text-sm font-mono font-bold text-primary mt-0.5 truncate">{item.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Benchmark Gauges */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">Benchmark (Estimated)</p>
        <div className="flex flex-wrap gap-6 justify-center">
          {GAUGE_CONFIG.map(g => (
            <ArcGauge key={g.label} label={g.label} value={g.value} max={g.max} unit={g.unit} color={g.color} />
          ))}
        </div>
      </div>

      {/* Assembly Diagram */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">Assembly Checklist</p>
        <HardwareAssemblyDiagramCompact pinMap={pinMap} steps={steps} checkedSteps={checkedSteps} onToggleStep={toggleStep} customSteps={customSteps} onAddCustom={addCustomStep} onRemoveCustom={removeCustomStep} />
      </div>

      {/* QR Code */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">Project Share</p>
        <div className={`inline-flex items-center gap-4 px-5 py-4 rounded-xl border ${isLight ? 'bg-white border-black/8' : 'bg-component border-white/6'}`}>
          <QrCodeSvg data={`LEVIOSAI|${project.name}|${project.domain}|${project.hardware}|${project.model}`} size={80} />
          <div>
            <p className="text-xs font-mono font-bold text-primary">{project.name}</p>
            <p className="text-[10px] font-mono text-secondary/50 mt-0.5">Scan to view project config</p>
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(project, null, 2)); showToast('Project config copied', 'success') }}
              className="mt-2 text-[10px] font-mono text-accent border border-accent/20 px-2 py-0.5 rounded hover:bg-accent/10 transition-colors">
              Copy JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   Simple QR Code SVG (deterministic, no external lib)
   ================================================================ */
function QrCodeSvg({ data, size = 80 }: { data: string; size?: number }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const grid = useMemo(() => {
    const n = 21
    const cells: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false))
    const drawFinder = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4
        cells[oy + y][ox + x] = border || inner
      }
    }
    drawFinder(0, 0); drawFinder(14, 0); drawFinder(0, 14)
    let hash = 0
    for (let i = 0; i < data.length; i++) { hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0 }
    let seed = Math.abs(hash)
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (cells[y][x]) continue
      if ((x < 8 && y < 8) || (x >= 13 && y < 8) || (x < 8 && y >= 13)) continue
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      cells[y][x] = (seed % 3) === 0
    }
    for (let i = 8; i < 13; i++) { cells[6][i] = i % 2 === 0; cells[i][6] = i % 2 === 0 }
    return cells
  }, [data])

  const cellSize = size / 21
  const fg = isLight ? '#111827' : '#e5e7eb'
  const bg = isLight ? '#ffffff' : '#0a0c14'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill={bg} rx="4" />
      {grid.map((row, y) => row.map((cell, x) =>
        cell ? <rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill={fg} /> : null
      ))}
    </svg>
  )
}

/* ================================================================
   TAB: Deploy (Commands + Simulation + Device Status)
   ================================================================ */
const LOG_COLORS: Record<DeployLogLine['type'], string> = {
  info: 'text-secondary/70',
  ok: 'text-green-400',
  warn: 'text-amber-400',
  err: 'text-red-400',
}

function generateDeviceStatus(project: SavedProject) {
  const hw = (project.hardware ?? 'edge-device').toLowerCase()
  let ramTotal = 8, diskTotal = 64
  if (hw.includes('jetson')) { ramTotal = 32; diskTotal = 512 }
  else if (hw.includes('hailo')) { ramTotal = 4; diskTotal = 32 }
  else if (hw.includes('stm32')) { ramTotal = 0.256; diskTotal = 2 }
  return {
    cpuTemp: 42 + Math.floor(Math.random() * 15),
    ramUsed: +(ramTotal * (0.25 + Math.random() * 0.2)).toFixed(1),
    ramTotal,
    diskUsed: Math.floor(diskTotal * (0.15 + Math.random() * 0.1)),
    diskTotal,
    uptime: `${Math.floor(Math.random() * 48)}h ${Math.floor(Math.random() * 60)}m`,
    ip: '192.168.1.100',
    hostname: hw.replace(/\s+/g, '-').slice(0, 24),
  }
}

function DeployTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [deployStatus, setDeployStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')
  const [deployLog, setDeployLog] = useState<DeployLogLine[]>([])
  const [deployProgress, setDeployProgress] = useState(0)
  const abortRef = useRef(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const deviceStatus = useMemo(() => generateDeviceStatus(project), [project])
  const hwCategory = state.hardware?.category ?? project.hardware ?? ''
  const sdkSteps = useMemo(() => getSdkSteps(hwCategory, project.language), [hwCategory, project.language])

  useEffect(() => {
    return () => { abortRef.current = true }
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [deployLog])

  const runDeploy = useCallback(async () => {
    const device = project.hardware ?? 'edge-device'
    const lines = getDeployLogLines(device, project.name)
    abortRef.current = false
    setDeployStatus('running')
    setDeployLog([])
    setDeployProgress(0)

    for (let i = 0; i < lines.length; i++) {
      if (abortRef.current) break
      const delay = i === 0 ? lines[0].delay : lines[i].delay - lines[i - 1].delay
      await new Promise(r => setTimeout(r, Math.max(delay, 50)))
      if (abortRef.current) break
      setDeployLog(prev => [...prev, lines[i]])
      setDeployProgress(((i + 1) / lines.length) * 100)
    }
    if (!abortRef.current) {
      setDeployStatus('success')
      showToast('Deployment simulation complete', 'success')
      addLog(`Deploy simulation complete for "${project.name}"`, 'OK')
    }
  }, [project])

  const statusBadge = {
    idle: { text: 'Ready', cls: isLight ? 'text-black/30 bg-black/5' : 'text-secondary/40 bg-white/5' },
    running: { text: t('launch.deploying'), cls: 'text-blue-400 bg-blue-500/10 animate-pulse' },
    success: { text: t('launch.deployComplete'), cls: 'text-green-400 bg-green-500/10' },
    failed: { text: 'Failed', cls: 'text-red-400 bg-red-500/10' },
  }[deployStatus]

  const sshUser = hwCategory.toLowerCase().includes('jetson') ? 'nvidia'
    : hwCategory.toLowerCase().includes('hailo') ? 'pi' : 'user'

  return (
    <div className="space-y-6">
      {/* Deployment Commands */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">{t('launch.deployCommands')}</p>
        <div className="space-y-3">
          {sdkSteps.slice(0, 3).map(step => (
            <TerminalBlock key={step.id} title={step.title} subtitle={step.subtitle} commands={step.commands} estimatedTime={step.estimatedTime} />
          ))}
          <TerminalBlock
            title="SSH & Transfer"
            subtitle="Connect and deploy model"
            commands={[
              `ssh ${sshUser}@${deviceStatus.ip}`,
              `scp model_opt.${project.language.includes('C++') ? 'engine' : 'onnx'} ${sshUser}@${deviceStatus.ip}:~/models/`,
              `scp main.${project.language.includes('C++') ? 'cpp' : 'py'} ${sshUser}@${deviceStatus.ip}:~/project/`,
            ]}
            estimatedTime="~30s"
          />
          <TerminalBlock
            title="Inference Test"
            subtitle="Run model validation"
            commands={project.language.includes('C++')
              ? ['cd ~/project && mkdir -p build && cd build', 'cmake .. -DCMAKE_BUILD_TYPE=Release && make -j$(nproc)', './test_inference --model ~/models/model_opt.engine']
              : ['cd ~/project', 'python3 main.py --test --model ~/models/model_opt.onnx', 'echo "Test complete"']
            }
            estimatedTime="~10s"
          />
        </div>
      </div>

      {/* Deploy Simulation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest">{t('launch.deploySimulation')}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${statusBadge.cls}`}>{statusBadge.text}</span>
            {deployStatus === 'idle' || deployStatus === 'success' || deployStatus === 'failed' ? (
              <button onClick={runDeploy}
                className="text-[10px] font-mono font-bold px-3 py-1 rounded-lg text-accent border border-accent/30 hover:bg-accent/10 transition-colors">
                {t('launch.runDeploy')}
              </button>
            ) : (
              <button onClick={() => { abortRef.current = true; setDeployStatus('failed') }}
                className="text-[10px] font-mono font-bold px-3 py-1 rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-1.5 rounded-full mb-3 ${isLight ? 'bg-black/5' : 'bg-white/5'}`}>
          <div className={`h-full rounded-full transition-all duration-300 ${deployStatus === 'failed' ? 'bg-red-500' : deployStatus === 'success' ? 'bg-green-500' : 'bg-accent'}`}
            style={{ width: `${deployProgress}%` }} />
        </div>

        {/* Log Output */}
        <div className={`h-[240px] overflow-y-auto rounded-xl border px-4 py-3 font-mono text-xs leading-relaxed ${isLight ? 'bg-gray-50 border-black/8' : 'bg-[#060810] border-white/6'}`}>
          {deployLog.length === 0 && <p className="text-secondary/20">Click "Run Deploy" to start deployment simulation...</p>}
          {deployLog.map((line, i) => (
            <div key={i} className={`${LOG_COLORS[line.type]}`}>
              <span className="text-secondary/20 mr-2">[{(line.delay / 1000).toFixed(1)}s]</span>
              {line.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Device Status Panel */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest">{t('launch.deviceStatus')}</p>
          <span className="flex items-center gap-1 text-[9px] font-mono text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t('launch.connectionStatus')}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'CPU Temp', value: `${deviceStatus.cpuTemp}°C`, color: deviceStatus.cpuTemp < 50 ? 'text-green-400' : deviceStatus.cpuTemp < 70 ? 'text-amber-400' : 'text-red-400' },
            { label: 'RAM', value: `${deviceStatus.ramUsed}/${deviceStatus.ramTotal} GB`, color: 'text-blue-400' },
            { label: 'Disk', value: `${deviceStatus.diskUsed}/${deviceStatus.diskTotal} GB`, color: 'text-purple-400' },
            { label: 'Uptime', value: deviceStatus.uptime, color: 'text-secondary' },
            { label: 'IP', value: deviceStatus.ip, color: 'text-accent' },
            { label: 'Host', value: deviceStatus.hostname, color: 'text-secondary' },
          ].map(item => (
            <div key={item.label} className={`px-3 py-2.5 rounded-xl border ${isLight ? 'bg-white border-black/8' : 'bg-component border-white/6'}`}>
              <p className="text-[8px] font-mono text-secondary/40 uppercase">{item.label}</p>
              <p className={`text-xs font-mono font-bold mt-0.5 truncate ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Sensor Detection */}
        {(project.sensors ?? []).length > 0 && (
          <div className="mt-3">
            <p className="text-[9px] font-mono text-secondary/40 uppercase mb-2">{t('launch.sensorStatus')}</p>
            <div className="flex flex-wrap gap-2">
              {project.sensors.map((sensor, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${isLight ? 'border-green-200 bg-green-50' : 'border-green-500/20 bg-green-500/5'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] font-mono text-green-600 dark:text-green-400">{sensor}</span>
                  <span className="text-[8px] font-mono text-green-500/60">Detected</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   TAB: Performance (Before/After + Technique Simulator + Score)
   ================================================================ */
function calcDelta(base: number, opt: number, lowerBetter: boolean): { text: string; positive: boolean } {
  if (base === 0) return { text: '—', positive: false }
  const pct = ((opt - base) / base) * 100
  const sign = pct >= 0 ? '+' : ''
  const positive = lowerBetter ? pct < 0 : pct > 0
  return { text: `${sign}${Math.round(pct)}%`, positive }
}

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: 'A+', color: '#22c55e' }
  if (score >= 80) return { letter: 'A', color: '#4ade80' }
  if (score >= 70) return { letter: 'B', color: '#60a5fa' }
  if (score >= 60) return { letter: 'C', color: '#f59e0b' }
  if (score >= 50) return { letter: 'D', color: '#f97316' }
  return { letter: 'F', color: '#ef4444' }
}

function PerformanceTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const allTechniques = resolveTechniques(state, project)
  const deviceId = state.hardware?.device ?? project.hardware ?? ''

  const [enabledTechniques, setEnabledTechniques] = useState<Set<string>>(() => {
    return new Set(allTechniques.map(t => t.name))
  })

  function toggleTechnique(name: string) {
    setEnabledTechniques(prev => {
      const s = new Set(prev)
      s.has(name) ? s.delete(name) : s.add(name)
      return s
    })
  }

  const baseline: BenchmarkResult = useMemo(() => getBenchmarkResult(deviceId, []), [deviceId])
  const optimized: BenchmarkResult = useMemo(() => {
    const active = allTechniques.filter(t => enabledTechniques.has(t.name))
    return getBenchmarkResult(deviceId, active)
  }, [deviceId, allTechniques, enabledTechniques])

  const METRICS = [
    { label: 'Latency', baseVal: baseline.optLatencyMs, optVal: optimized.optLatencyMs, max: 100, unit: 'ms', color: '#60a5fa', lowerBetter: true },
    { label: 'Throughput', baseVal: baseline.optFps, optVal: optimized.optFps, max: 200, unit: 'FPS', color: '#34d399', lowerBetter: false },
    { label: 'Memory', baseVal: baseline.optMemoryMb, optVal: optimized.optMemoryMb, max: 16000, unit: 'MB', color: '#a78bfa', lowerBetter: true },
    { label: 'Power', baseVal: baseline.optPowerW, optVal: optimized.optPowerW, max: 100, unit: 'W', color: '#f59e0b', lowerBetter: true },
    { label: 'Accuracy', baseVal: baseline.optAccuracy, optVal: optimized.optAccuracy, max: 100, unit: '%', color: '#f472b6', lowerBetter: false },
  ]

  const grade = getGrade(optimized.efficiencyScore)

  // Find matching hardware profile name
  const matchedProfile = BENCHMARK_PROFILES.find(p =>
    deviceId.toLowerCase().includes(p.hardware.toLowerCase().split(' ')[0])
  )?.hardware ?? 'Generic'

  return (
    <div className="space-y-6">
      {/* Hardware Profile Info */}
      <div className={`px-4 py-3 rounded-xl border ${isLight ? 'bg-white border-black/8' : 'bg-component border-white/6'}`}>
        <p className="text-[9px] font-mono text-secondary/40 uppercase">Benchmark Profile</p>
        <p className="text-sm font-mono font-bold text-primary mt-0.5">{matchedProfile}</p>
      </div>

      {/* Before / After Comparison */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">{t('launch.beforeOpt')}</p>
        <div className="flex flex-wrap gap-6 justify-center">
          {METRICS.map(m => (
            <ArcGauge key={`base_${m.label}`} label={m.label} value={m.baseVal} max={m.max} unit={m.unit} color={`${m.color}66`} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">{t('launch.afterOpt')}</p>
        <div className="flex flex-wrap gap-6 justify-center">
          {METRICS.map(m => (
            <ArcGauge key={`opt_${m.label}`} label={m.label} value={m.optVal} max={m.max} unit={m.unit} color={m.color} />
          ))}
        </div>
      </div>

      {/* Delta Row */}
      <div className="flex flex-wrap gap-4 justify-center">
        {METRICS.map(m => {
          const delta = calcDelta(m.baseVal, m.optVal, m.lowerBetter)
          return (
            <div key={`delta_${m.label}`} className={`px-3 py-1.5 rounded-lg border text-center ${delta.positive ? (isLight ? 'border-green-200 bg-green-50' : 'border-green-500/20 bg-green-500/5') : (isLight ? 'border-red-200 bg-red-50' : 'border-red-500/20 bg-red-500/5')}`}>
              <p className="text-[9px] font-mono text-secondary/50">{m.label}</p>
              <p className={`text-xs font-mono font-bold ${delta.positive ? 'text-green-500' : 'text-red-400'}`}>{delta.text}</p>
            </div>
          )
        })}
      </div>

      {/* Technique Simulator */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">{t('launch.techniqueSimulator')}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {allTechniques.map(tech => {
            const isOn = enabledTechniques.has(tech.name)
            const hasEffect = Object.keys(TECHNIQUE_EFFECTS).some(k => tech.name.toLowerCase().includes(k))
            return (
              <button key={tech.id} onClick={() => toggleTechnique(tech.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                  isOn
                    ? 'bg-accent/15 text-accent border-accent/30'
                    : isLight ? 'text-black/30 border-black/10 hover:bg-black/5' : 'text-secondary/30 border-white/10 hover:bg-white/5'
                }`}>
                {isOn ? '✓ ' : ''}{tech.name}
                {!hasEffect && <span className="text-[8px] ml-1 opacity-50">(no data)</span>}
              </button>
            )
          })}
          {allTechniques.length === 0 && (
            <p className="text-xs font-mono text-secondary/30">No optimization techniques selected in pipeline</p>
          )}
        </div>

        {/* Technique Impact Table */}
        <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-black/8' : 'border-white/6'}`}>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className={isLight ? 'bg-gray-100' : 'bg-white/3'}>
                <th className="text-left px-4 py-2 text-secondary/60">Technique</th>
                <th className="text-center px-3 py-2 text-secondary/60">Latency</th>
                <th className="text-center px-3 py-2 text-secondary/60">Memory</th>
                <th className="text-center px-3 py-2 text-secondary/60">FPS</th>
                <th className="text-center px-3 py-2 text-secondary/60">Power</th>
                <th className="text-center px-3 py-2 text-secondary/60">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(TECHNIQUE_EFFECTS).map(([name, fx]) => (
                <tr key={name} className={`border-t ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                  <td className="px-4 py-2 text-primary font-bold capitalize">{name}</td>
                  <td className="text-center px-3 py-2 text-green-400">-{Math.round((1 - fx.latency) * 100)}%</td>
                  <td className="text-center px-3 py-2 text-green-400">-{Math.round((1 - fx.memory) * 100)}%</td>
                  <td className="text-center px-3 py-2 text-green-400">+{Math.round((fx.fps - 1) * 100)}%</td>
                  <td className="text-center px-3 py-2 text-green-400">-{Math.round((1 - fx.power) * 100)}%</td>
                  <td className="text-center px-3 py-2 text-red-400">-{fx.accuracyDrop}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Efficiency Score Card */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">{t('launch.efficiencyScore')}</p>
        <div className={`flex items-center gap-6 px-6 py-5 rounded-xl border ${isLight ? 'bg-white border-black/8' : 'bg-component border-white/6'}`}>
          <div className="text-center">
            <p className="text-5xl font-mono font-black" style={{ color: grade.color }}>{optimized.efficiencyScore}</p>
            <p className="text-[9px] font-mono text-secondary/40 mt-1">/ 100</p>
          </div>
          <div className="flex items-center justify-center w-16 h-16 rounded-full border-4" style={{ borderColor: grade.color }}>
            <span className="text-2xl font-mono font-black" style={{ color: grade.color }}>{grade.letter}</span>
          </div>
          <div className="flex-1 space-y-1.5">
            {[
              { label: 'Latency Score', weight: '30%', color: '#60a5fa' },
              { label: 'Throughput Score', weight: '35%', color: '#34d399' },
              { label: 'Power Score', weight: '20%', color: '#f59e0b' },
              { label: 'Accuracy Score', weight: '15%', color: '#f472b6' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-mono text-secondary/60 flex-1">{item.label}</span>
                <span className="text-[10px] font-mono text-secondary/40">{item.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   TAB: AI Notes
   ================================================================ */
interface TodoItem { id: string; text: string; done: boolean }

function AiNotesTab({ project }: { project: SavedProject }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const notesKey = `leviosai_deploy_notes_${project.id}`
  const todosKey = `leviosai_deploy_todos_${project.id}`

  const [notes, setNotes] = useState(() => loadJson<string>(notesKey, `# ${project.name} — Launch Notes\n\n`))
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
    } catch {
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

  function toggleTodo(id: string) { setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function removeTodo(id: string) { setTodos(prev => prev.filter(t => t.id !== id)) }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-2">Notes (Markdown)</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className={`w-full h-[400px] px-4 py-3 rounded-xl border font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-accent/50 ${isLight ? 'bg-white border-black/8 text-black/80' : 'bg-[#060810] border-white/6 text-primary'}`} />
        </div>
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
            {aiResult || <p className={isLight ? 'text-black/20' : 'text-secondary/20'}>Click "AI Analyze" to get deployment recommendations based on your pipeline configuration.</p>}
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
    const match = ytUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
    const videoId = match?.[1]
    if (!videoId) { showToast('Invalid YouTube URL', 'error'); return }
    setMedia(prev => [...prev, { id: `yt_${Date.now()}`, type: 'youtube', url: videoId, caption: '' }])
    setYtUrl('')
  }

  function removeMedia(id: string) { setMedia(prev => prev.filter(m => m.id !== id)) }

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
                <iframe src={`https://www.youtube.com/embed/${item.url}`} className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowFullScreen title={item.caption || 'YouTube video'} />
              )}
              <button onClick={() => removeMedia(item.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
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
   MAIN: LaunchPage
   ================================================================ */
export default function LaunchPage({ state, savedProjects, onGoToProject }: Props) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null)
  const [activeTab, setActiveTab] = useState<LaunchTab>('overview')

  function handleSelectProject(p: SavedProject) {
    setSelectedProject(p)
    setActiveTab('overview')
    addLog(`Launch: loaded pipeline "${p.name}"`, 'NAV')
  }

  if (!selectedProject) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <SystemInfoPanel />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[10px] font-semibold text-accent/70 uppercase tracking-[0.25em] font-mono mb-2">LeviosAI · Launch Console</p>
            <h2 className="text-3xl font-bold text-primary font-mono tracking-tight">
              <TypewriterText text="Launch Console" speed={45} showCursor />
            </h2>
          </div>
          <ProjectSelector projects={savedProjects} onSelect={handleSelectProject} onGoToProject={onGoToProject} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SystemInfoPanel />

      {/* Content panel with semi-transparent background over grid */}
      <div className="flex flex-col flex-1 overflow-hidden mt-2 mb-2 rounded-xl border border-white/6 bg-[#0a0c14]/85 backdrop-blur-sm" style={{ width: '63%', marginLeft: 'calc(2% + 290px)', marginRight: 'auto', marginTop: '5px' }}>
      <div className="px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-1">{t('launch.pageTitle')}</p>
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

      {/* Quick Actions Bar */}
      <div className="max-w-7xl mx-auto w-full">
        <QuickActionsBar project={selectedProject} state={state} />
      </div>

      {/* Tab Bar */}
      <div className="flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 pb-3 pt-2">
          <div className={`flex items-center gap-1 pb-3 border-b ${isLight ? 'border-black/8' : 'border-white/6'}`} style={{ maxWidth: '70%' }}>
          {TAB_LIST.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : isLight ? 'text-black/40 border border-transparent hover:bg-black/5' : 'text-secondary/40 border border-transparent hover:bg-white/5'
              }`}>
              <span className="text-[10px]">{tab.icon}</span>
              {t(tab.key)}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <OverviewTab project={selectedProject} state={state} />}
          {activeTab === 'deploy' && <DeployTab project={selectedProject} state={state} />}
          {activeTab === 'performance' && <PerformanceTab project={selectedProject} state={state} />}
          {activeTab === 'notes' && <AiNotesTab project={selectedProject} />}
          {activeTab === 'media' && <MediaTab project={selectedProject} />}
        </div>
      </div>
      </div>{/* end content panel */}
    </div>
  )
}
