import { useCallback } from 'react'
import type { StepProps } from '../../types'
import TypewriterText from '../TypewriterText'
import HardwarePipelineCanvas from '../HardwarePipelineCanvas'
import { buildPdfHtml } from '../../utils/pdfTemplate'

const SENSOR_ICONS: Record<string, string> = {
  Vision: 'CAM', Depth: 'LDR', RF: 'RF', Audio: 'MIC',
  Motion: 'IMU', Thermal: 'THM', Proximity: 'PRX', Location: 'GPS',
}

export default function Step3HardwareConfig({ state, updateState, goToStep }: StepProps) {

  const handleQuantityChange = useCallback((i: number, delta: number) => {
    const newSensors = [...state.sensors]
    const current = newSensors[i].quantity ?? 1
    newSensors[i] = { ...newSensors[i], quantity: Math.max(1, Math.min(99, current + delta)) }
    updateState({ sensors: newSensors })
  }, [state.sensors, updateState])

  const handleMoveUp = useCallback((i: number) => {
    if (i === 0) return
    const ns = [...state.sensors]
    ;[ns[i - 1], ns[i]] = [ns[i], ns[i - 1]]
    updateState({ sensors: ns })
  }, [state.sensors, updateState])

  const handleMoveDown = useCallback((i: number) => {
    if (i >= state.sensors.length - 1) return
    const ns = [...state.sensors]
    ;[ns[i], ns[i + 1]] = [ns[i + 1], ns[i]]
    updateState({ sensors: ns })
  }, [state.sensors, updateState])

  const totalUnits = state.sensors.reduce((s, x) => s + (x.quantity ?? 1), 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header + Next button */}
      <div className="mb-4 flex-shrink-0 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 3 of 7</p>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight">
            <TypewriterText text="Hardware Configuration" speed={40} />
          </h2>
          <p className="text-secondary mt-2">
            Drag nodes to reposition · Click output port then input port to connect · Right-click line to delete
          </p>
        </div>
        <button
          onClick={() => goToStep(4)}
          disabled={!state.hardware}
          className="flex-shrink-0 px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors mr-[610px] mt-[60px]"
        >
          Next: AI Model →
        </button>
      </div>

      {/* Interactive Pipeline Canvas */}
      <div className="flex-1 min-h-0 rounded-2xl border border-white/8 overflow-hidden mr-[360px]" style={{ background: '#09090f' }}>
        <HardwarePipelineCanvas state={state} />
      </div>

      {/* Sensor controls strip */}
      {state.sensors.length > 0 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap mr-[360px]">
          <span className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mr-1">
            Sensors: {state.sensors.length} type{state.sensors.length !== 1 ? 's' : ''} · {totalUnits} unit{totalUnits !== 1 ? 's' : ''}
          </span>
          {state.sensors.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 bg-component border border-white/8 rounded-lg">
              {/* Reorder */}
              <button onClick={() => handleMoveUp(i)} disabled={i === 0}
                className="text-secondary/40 hover:text-primary disabled:opacity-20 transition-colors text-[9px]">▲</button>
              <button onClick={() => handleMoveDown(i)} disabled={i >= state.sensors.length - 1}
                className="text-secondary/40 hover:text-primary disabled:opacity-20 transition-colors text-[9px]">▼</button>
              <span className="font-bold text-accent/70 ml-0.5">{SENSOR_ICONS[s.type] ?? 'SEN'}</span>
              <span className="text-primary truncate max-w-[80px]">{s.name}</span>
              {/* Quantity */}
              <button onClick={() => handleQuantityChange(i, -1)} disabled={(s.quantity ?? 1) <= 1}
                className="w-4 h-4 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-secondary disabled:opacity-20 ml-1">-</button>
              <span className="w-4 text-center font-bold text-accent tabular-nums">{s.quantity ?? 1}</span>
              <button onClick={() => handleQuantityChange(i, 1)}
                className="w-4 h-4 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-secondary">+</button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-4 flex-shrink-0 mr-[360px]">
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
            const body = `
<h2 style="font-size:16px;color:#6b96be;margin-top:20px;">Main Compute Unit</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;">
<tr><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">Device</th><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${hw.device}</td></tr>
<tr><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">Category</th><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${hw.category}</td></tr>
<tr><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">Specs</th><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${hw.specs}</td></tr>
</table>
${sensors.length > 0 ? `<h2 style="font-size:16px;color:#6b96be;margin-top:24px;">Sensors (${sensors.length} types, ${sensors.reduce((sum, x) => sum + (x.quantity ?? 1), 0)} units)</h2>
<table style="width:100%;border-collapse:collapse;margin-top:8px;">
<tr><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">#</th><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">Name</th><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">Type</th><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">Qty</th><th style="padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px;background:#f5f5f5;font-weight:bold;">Specs</th></tr>
${sensors.map((s, i) => `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${i + 1}</td><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${s.name}</td><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${s.type}</td><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${s.quantity ?? 1}</td><td style="padding:8px 12px;border:1px solid #ddd;font-size:13px;">${s.specs}</td></tr>`).join('')}
</table>` : '<p style="margin-top:16px;color:#888;">No sensors configured</p>'}`
            const html = buildPdfHtml({ title: 'Hardware Configuration', state, body })
            const w = window.open('', '_blank')
            if (w) { w.document.write(html); w.document.close() }
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
