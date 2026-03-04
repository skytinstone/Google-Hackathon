import { useState, useCallback, useRef } from 'react'
import type { StepProps, SelectedSensor } from '../../types'
import { SENSORS } from '../../api/api'
import TypewriterText from '../TypewriterText'

const SENSOR_ICONS: Record<string, string> = {
  Vision: 'CAM', Depth: 'LDR', RF: 'RF', Audio: 'MIC',
  Motion: 'IMU', Thermal: 'THM', Proximity: 'PRX', Location: 'GPS',
}

// ── Tooltip ───────────────────────────────────────────────────
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none animate-fade-in">
          <div className="bg-[#0e1017] border border-white/15 rounded-xl shadow-2xl px-4 py-3 min-w-[200px] max-w-[260px]">
            {content}
          </div>
          <div className="w-2 h-2 bg-[#0e1017] border-r border-b border-white/15 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )
}

// ── Sensor Node ───────────────────────────────────────────────
function SensorNode({
  sensor, index, total,
  isDragOver, onDragStart, onDragOver, onDragDrop, onDragEnd, onMoveUp, onMoveDown,
}: {
  sensor: SelectedSensor
  index: number
  total: number
  isDragOver: boolean
  onDragStart: (i: number) => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDragDrop: (i: number) => void
  onDragEnd: () => void
  onMoveUp: (i: number) => void
  onMoveDown: (i: number) => void
}) {
  const sensorData = SENSORS.find(s => s.id === sensor.id)

  return (
    <Tooltip content={
      <div>
        <p className="text-primary font-semibold text-xs mb-1">
          {SENSOR_ICONS[sensor.type] ?? '◎'} {sensor.name}
        </p>
        <p className="text-[10px] font-mono text-accent/80 mb-1">{sensor.type} · {sensor.specs}</p>
        {sensorData && <p className="text-[10px] text-secondary leading-relaxed">{sensorData.description}</p>}
        <p className="text-[10px] text-secondary/50 font-mono mt-1">Drag or use ▲▼ to reorder</p>
      </div>
    }>
      <div
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={e => onDragOver(e, index)}
        onDrop={() => onDragDrop(index)}
        onDragEnd={onDragEnd}
        className={[
          'relative px-4 py-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-200 select-none',
          isDragOver
            ? 'border-accent bg-accent/20 scale-105 shadow-[0_0_20px_rgba(107,150,190,0.4)]'
            : 'border-white/15 bg-[#0e1017] hover:border-accent/50 hover:bg-accent/5 shadow-lg',
        ].join(' ')}
        style={{ minWidth: '140px' }}
      >
        {/* ▲/▼ reorder buttons */}
        <div className="absolute top-1 right-1 flex flex-col gap-0.5">
          <button
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onMoveUp(index) }}
            disabled={index === 0}
            className="w-5 h-4 flex items-center justify-center text-secondary/40 hover:text-primary disabled:opacity-20 transition-colors text-[10px] leading-none cursor-pointer"
          >▲</button>
          <button
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onMoveDown(index) }}
            disabled={index >= total - 1}
            className="w-5 h-4 flex items-center justify-center text-secondary/40 hover:text-primary disabled:opacity-20 transition-colors text-[10px] leading-none cursor-pointer"
          >▼</button>
        </div>

        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-[10px] font-bold font-mono text-accent/80 bg-accent/10 px-1.5 py-0.5 rounded flex-shrink-0">{SENSOR_ICONS[sensor.type] ?? 'SEN'}</span>
          <div>
            <p className="text-xs font-semibold text-primary">{sensor.name}</p>
            <p className="text-[10px] font-mono text-accent/70">{sensor.type}</p>
          </div>
        </div>
        <p className="text-[10px] text-secondary/70 font-mono">{sensor.specs}</p>

        {/* Connector dot (right side) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent border-2 border-[#0e1017] shadow-[0_0_8px_rgba(107,150,190,0.6)]" />
      </div>
    </Tooltip>
  )
}

// ── Main Hardware Node ────────────────────────────────────────
function HardwareNode({ name, specs }: { name: string; specs: string }) {
  return (
    <Tooltip content={
      <div>
        <p className="text-primary font-semibold text-xs mb-1">⬡ {name}</p>
        <p className="text-[10px] font-mono text-accent/80 mb-1">Main Compute Unit</p>
        <p className="text-[10px] text-secondary">{specs}</p>
      </div>
    }>
      <div className="relative px-6 py-5 rounded-2xl border-2 border-accent/60 bg-accent/10 shadow-[0_0_30px_rgba(107,150,190,0.2)] min-w-[180px]">
        {/* Left connector dot */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-[#0e1017] shadow-[0_0_10px_rgba(107,150,190,0.8)]" />
        {/* Right connector dot */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0e1017] shadow-[0_0_10px_rgba(74,222,128,0.8)]" />

        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">⬡</span>
          </div>
          <p className="text-primary font-bold text-sm">{name}</p>
          <p className="text-[10px] font-mono text-accent/80 mt-0.5">Main Compute</p>
          <p className="text-[10px] text-secondary/70 mt-1">{specs}</p>
        </div>
      </div>
    </Tooltip>
  )
}

// ── AI Placeholder Node ───────────────────────────────────────
function AIPlaceholderNode({ modelName }: { modelName: string | null }) {
  return (
    <div className="relative px-5 py-4 rounded-xl border border-green-400/30 bg-green-400/5 min-w-[150px]">
      {/* Left connector dot */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0e1017] shadow-[0_0_8px_rgba(74,222,128,0.6)]" />

      <div className="text-center">
        <div className="w-8 h-8 rounded-lg bg-green-400/15 border border-green-400/25 flex items-center justify-center mx-auto mb-1.5">
          <span className="text-base">◈</span>
        </div>
        <p className="text-green-400 font-semibold text-xs">
          {modelName ?? 'AI Model'}
        </p>
        <p className="text-[10px] font-mono text-green-400/60 mt-0.5">Next Step →</p>
      </div>
    </div>
  )
}

// ── SVG Connector Lines ───────────────────────────────────────
function ConnectorLines({ sensorCount }: { sensorCount: number }) {
  if (sensorCount === 0) return null

  const nodeHeight = 80
  const gap = 12
  const totalHeight = sensorCount * nodeHeight + (sensorCount - 1) * gap
  const centerY = totalHeight / 2

  const lines: React.ReactNode[] = []
  for (let i = 0; i < sensorCount; i++) {
    const y = i * (nodeHeight + gap) + nodeHeight / 2
    lines.push(
      <line
        key={i}
        x1="0" y1={y}
        x2="80" y2={centerY}
        stroke="url(#lineGrad)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.7"
      />
    )
  }

  return (
    <svg width="80" height={totalHeight} className="flex-shrink-0">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6b96be" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6b96be" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {lines}
      {/* Hub point */}
      <circle cx="80" cy={centerY} r="4" fill="#6b96be" opacity="0.8" />
    </svg>
  )
}

// ── Main Step ─────────────────────────────────────────────────
export default function Step3HardwareConfig({ state, updateState, goToStep }: StepProps) {
  const dragSrcRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((i: number) => {
    dragSrcRef.current = i
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault()
    setDragOverIndex(i)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragSrcRef.current = null
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((targetIndex: number) => {
    const src = dragSrcRef.current
    if (src === null || src === targetIndex) {
      dragSrcRef.current = null; setDragOverIndex(null); return
    }
    const newSensors = [...state.sensors]
    const [moved] = newSensors.splice(src, 1)
    newSensors.splice(targetIndex, 0, moved)
    updateState({ sensors: newSensors })
    dragSrcRef.current = null; setDragOverIndex(null)
  }, [state.sensors, updateState])

  const handleMoveUp = useCallback((i: number) => {
    if (i === 0) return
    const newSensors = [...state.sensors]
    ;[newSensors[i - 1], newSensors[i]] = [newSensors[i], newSensors[i - 1]]
    updateState({ sensors: newSensors })
  }, [state.sensors, updateState])

  const handleMoveDown = useCallback((i: number) => {
    if (i >= state.sensors.length - 1) return
    const newSensors = [...state.sensors]
    ;[newSensors[i], newSensors[i + 1]] = [newSensors[i + 1], newSensors[i]]
    updateState({ sensors: newSensors })
  }, [state.sensors, updateState])

  const hasSensors = state.sensors.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header + Next button */}
      <div className="mb-6 flex-shrink-0 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 3 of 7</p>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight"><TypewriterText text="Hardware Configuration" speed={40} /></h2>
          <p className="text-secondary mt-2">
            Your pipeline configuration — hover nodes for specs, drag to reorder sensors
          </p>
        </div>
        <button
          onClick={() => goToStep(4)}
          disabled={!state.hardware}
          className="flex-shrink-0 px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors"
        >
          Next: AI Model →
        </button>
      </div>

      {/* Pipeline Diagram */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 rounded-2xl border border-white/8 bg-[#09090f] overflow-auto p-8 flex items-center">
          <div className="flex items-center gap-0 w-full justify-center">

            {/* Sensor Nodes Column */}
            {hasSensors && (
              <div className="flex flex-col gap-3 flex-shrink-0">
                {state.sensors.map((sensor, i) => (
                  <SensorNode
                    key={sensor.id}
                    sensor={sensor}
                    index={i}
                    total={state.sensors.length}
                    isDragOver={dragOverIndex === i}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            )}

            {/* Connector Lines: sensors → main HW */}
            {hasSensors && state.hardware && (
              <ConnectorLines sensorCount={state.sensors.length} />
            )}

            {/* No sensors placeholder */}
            {!hasSensors && state.hardware && (
              <div className="flex items-center gap-3 mr-4">
                <div className="px-4 py-3 rounded-xl border border-dashed border-white/12 text-center min-w-[140px]">
                  <p className="text-secondary/50 text-xs font-mono">No sensors selected</p>
                  <p className="text-secondary/30 text-[10px] mt-1">Go back to add sensors</p>
                </div>
                <div className="w-8 h-px bg-accent/30" />
              </div>
            )}

            {/* Main Hardware Node */}
            {state.hardware ? (
              <>
                <HardwareNode name={state.hardware.device} specs={state.hardware.specs} />

                {/* Arrow → AI Model */}
                <div className="flex items-center gap-0 mx-3">
                  <div className="w-10 h-px bg-gradient-to-r from-accent/60 to-green-400/60" />
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-green-400/60 border-b-[5px] border-b-transparent" />
                </div>

                <AIPlaceholderNode modelName={state.model?.name ?? null} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-secondary/50 font-mono text-sm">No hardware selected</p>
                <p className="text-secondary/30 text-xs mt-1">Go back to Step 2 to select hardware</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-[10px] font-mono text-secondary/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-px border-t border-dashed border-accent/60" />
            <span>Sensor data flow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-px bg-gradient-to-r from-accent/60 to-green-400/60" />
            <span>Compute output</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-secondary/30">▲▼</span>
            <span>Reorder sensors</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-accent">{state.sensors.length} sensor{state.sensors.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className="text-primary">{state.hardware?.device ?? 'No HW'}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 flex-shrink-0">
        <button
          onClick={() => goToStep(2)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            const hw = state.hardware
            if (!hw) return
            const sensors = state.sensors
            const html = `<!DOCTYPE html><html><head><title>Hardware Configuration - LeviosAI</title>
<style>body{font-family:monospace;padding:40px;color:#222;max-width:800px;margin:0 auto}
h1{font-size:24px;border-bottom:2px solid #6b96be;padding-bottom:8px}
h2{font-size:16px;color:#6b96be;margin-top:24px}
table{width:100%;border-collapse:collapse;margin-top:8px}
td,th{padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px}
th{background:#f5f5f5;font-weight:bold}
.badge{display:inline-block;background:#e8f0fe;color:#1a73e8;padding:2px 8px;border-radius:4px;font-size:11px;margin-right:4px}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #ddd;font-size:11px;color:#888}</style></head>
<body><h1>LeviosAI — Hardware Configuration</h1>
<p>Generated: ${new Date().toLocaleString()}</p>
<h2>Main Compute Unit</h2>
<table><tr><th>Device</th><td>${hw.device}</td></tr>
<tr><th>Category</th><td>${hw.category}</td></tr>
<tr><th>Specs</th><td>${hw.specs}</td></tr></table>
${sensors.length > 0 ? `<h2>Sensors (${sensors.length})</h2>
<table><tr><th>#</th><th>Name</th><th>Type</th><th>Specs</th></tr>
${sensors.map((s, i) => `<tr><td>${i + 1}</td><td>${s.name}</td><td>${s.type}</td><td>${s.specs}</td></tr>`).join('')}
</table>` : '<h2>Sensors</h2><p>No sensors configured</p>'}
${state.domain ? `<h2>Domain</h2><p><span class="badge">${state.domain}</span></p>` : ''}
<div class="footer">LeviosAI · Edge AI Optimization Platform</div></body></html>`
            const w = window.open('', '_blank')
            if (w) { w.document.write(html); w.document.close(); w.print() }
          }}
          disabled={!state.hardware}
          className="px-4 py-2.5 border border-accent/30 text-accent font-mono text-xs rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-30"
        >
          PDF Download
        </button>
      </div>
    </div>
  )
}
