import { useState, useRef } from 'react'
import type { StepProps, SelectedSensor } from '../../types'
import { HARDWARE, HARDWARE_DETAILS, SENSORS, analyzeHardwarePdf, hasApiKey } from '../../api/api'
import TypewriterText from '../TypewriterText'
import HardwareBenchmark from '../HardwareBenchmark'
import ResizableSplit from '../ResizableSplit'

type HardwareMap = typeof HARDWARE

// Sensor type label map
const SENSOR_ICONS: Record<string, string> = {
  Vision: 'CAM', Depth: 'LDR', RF: 'RF', Audio: 'MIC',
  Motion: 'IMU', Thermal: 'THM', Proximity: 'PRX', Location: 'GPS',
}

// ── Hardware Right Panel ──────────────────────────────────────
function HardwareRightPanel({
  hardware, deviceId, sensors, onSensorToggle, onSensorQuantity,
}: {
  hardware: { device: string; specs: string } | null
  deviceId: string
  sensors: SelectedSensor[]
  onSensorToggle: (s: SelectedSensor) => void
  onSensorQuantity: (id: string, delta: number) => void
}) {
  const details = deviceId ? HARDWARE_DETAILS[deviceId] : null

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Hardware Info */}
      {hardware ? (
        <div className="rounded-xl border border-accent/25 bg-accent/5 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent/15">
            <div>
              <p className="text-[10px] font-mono text-accent/70 uppercase tracking-widest">Selected Hardware</p>
              <p className="text-primary font-semibold text-sm mt-0.5">{hardware.device}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 border border-accent/25 text-accent rounded-full font-mono">{hardware.specs}</span>
          </div>

          {details && (
            <div className="p-4 space-y-3">
              {/* Features */}
              <div>
                <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-2">Key Features</p>
                <ul className="space-y-1">
                  {details.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-secondary">
                      <span className="text-accent/60 mt-0.5 flex-shrink-0">▸</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Links */}
              <div className="grid grid-cols-2 gap-2">
                {details.productUrl && (
                  <a href={details.productUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/8 bg-white/3 hover:border-white/20 transition-all text-xs text-secondary hover:text-primary">
                    <span className="font-mono text-[10px]">URL</span><span className="font-mono">Product</span><span className="ml-auto">↗</span>
                  </a>
                )}
                {details.datasheetUrl ? (
                  <a href={details.datasheetUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/8 bg-white/3 hover:border-white/20 transition-all text-xs text-secondary hover:text-primary">
                    <span className="font-mono text-[10px]">PDF</span><span className="font-mono">Datasheet</span><span className="ml-auto">↓</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 opacity-40 text-xs text-secondary">
                    <span className="font-mono text-[10px]">PDF</span><span className="font-mono">Datasheet</span>
                  </div>
                )}
                <a href={`https://sketchfab.com/search?q=${encodeURIComponent(hardware.device)}&type=models`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/8 bg-white/3 hover:border-white/20 transition-all text-xs text-secondary hover:text-primary">
                  <span className="font-mono text-[10px]">3D</span><span className="font-mono">3D Model</span><span className="ml-auto">↗</span>
                </a>
                <a href={`https://grabcad.com/library?query=${encodeURIComponent(hardware.device)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/8 bg-white/3 hover:border-white/20 transition-all text-xs text-secondary hover:text-primary">
                  <span>⬡</span><span className="font-mono">CAD File</span><span className="ml-auto">↗</span>
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-6 text-center">
          <p className="text-secondary text-xs font-mono">← Select hardware to see details</p>
        </div>
      )}

      {/* Sensor Selection */}
      <div className="rounded-xl border border-white/8 bg-component overflow-hidden">
        <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest">Peripheral Sensors</p>
            <p className="text-primary text-sm font-semibold mt-0.5">Optional Hardware</p>
          </div>
          {sensors.length > 0 && (
            <span className="text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
              {sensors.length} type{sensors.length !== 1 ? 's' : ''} · {sensors.reduce((s, x) => s + (x.quantity ?? 1), 0)} unit{sensors.reduce((s, x) => s + (x.quantity ?? 1), 0) !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="p-4 grid grid-cols-2 gap-2">
          {SENSORS.map(s => {
            const selected = sensors.some(sel => sel.id === s.id)
            return (
              <button
                key={s.id}
                onClick={() => onSensorToggle({ id: s.id, name: s.name, type: s.type, specs: s.specs })}
                title={s.description}
                className={[
                  'relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-200',
                  selected
                    ? 'border-accent bg-accent/10 shadow-[0_0_14px_rgba(107,150,190,0.25)]'
                    : 'border-white/8 bg-background/50 hover:border-white/20 hover:bg-white/4',
                ].join(' ')}
              >
                <span className="text-[10px] font-mono font-bold text-accent/70 flex-shrink-0 min-w-[28px] text-center">
                  {SENSOR_ICONS[s.type] ?? 'SEN'}
                </span>
                <div className="min-w-0">
                  <p className={['text-xs font-semibold truncate', selected ? 'text-accent' : 'text-primary'].join(' ')}>
                    {s.name}
                  </p>
                  <p className="text-[10px] text-secondary/70 font-mono truncate">{s.type}</p>
                </div>
                {selected && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {sensors.length > 0 && (
          <div className="px-4 pb-3 space-y-1.5">
            {sensors.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-[10px] font-mono px-2.5 py-1.5 bg-accent/5 border border-accent/15 text-accent rounded-lg">
                <span className="font-bold">{SENSOR_ICONS[s.type] ?? '◎'}</span>
                <span className="flex-1 truncate">{s.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); onSensorQuantity(s.id, -1) }}
                    disabled={(s.quantity ?? 1) <= 1}
                    className="w-5 h-5 flex items-center justify-center rounded bg-accent/10 hover:bg-accent/20 text-accent/70 hover:text-accent disabled:opacity-20 transition-colors cursor-pointer"
                  >−</button>
                  <span className="w-5 text-center font-bold tabular-nums">{s.quantity ?? 1}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onSensorQuantity(s.id, 1) }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-accent/10 hover:bg-accent/20 text-accent/70 hover:text-accent transition-colors cursor-pointer"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Step ─────────────────────────────────────────────────
export default function Step2Hardware({ state, updateState, goToStep, onApiKeyNeeded }: StepProps) {
  const [openCategory, setOpenCategory] = useState<string>(
    state.hardware?.category ?? Object.keys(HARDWARE)[0],
  )
  const [hardware, setHardware] = useState<HardwareMap>({ ...HARDWARE })
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function selectDevice(category: string, device: { id: string; name: string; specs: string }) {
    updateState({
      hardware: { category, device: device.name, specs: device.specs },
      model: null, compatibilityResult: null, techniques: [], generatedCode: null,
    })
  }

  function toggleSensor(sensor: SelectedSensor) {
    const has = state.sensors.some(s => s.id === sensor.id)
    updateState({ sensors: has ? state.sensors.filter(s => s.id !== sensor.id) : [...state.sensors, { ...sensor, quantity: 1 }] })
  }

  function changeSensorQuantity(id: string, delta: number) {
    updateState({
      sensors: state.sensors.map(s =>
        s.id === id ? { ...s, quantity: Math.max(1, Math.min(99, (s.quantity ?? 1) + delta)) } : s
      ),
    })
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!hasApiKey()) { onApiKeyNeeded(); return }
    setUploading(true); setUploadError(null); setUploadSuccess(null)
    try {
      const result = await analyzeHardwarePdf(file)
      const newDevice = { id: result.id, name: result.name, specs: result.specs }
      setHardware(prev => ({
        ...prev,
        [result.category]: {
          description: prev[result.category]?.description ?? result.description,
          devices: [...(prev[result.category]?.devices ?? []), newDevice],
        },
      }))
      setOpenCategory(result.category)
      setUploadSuccess(`"${result.name}" has been added to ${result.category}.`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to analyze PDF')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const selectedDeviceId = state.hardware
    ? hardware[state.hardware.category]?.devices.find(d => d.name === state.hardware!.device)?.id ?? ''
    : ''

  return (
    <div className="h-full flex flex-col">
      {/* Header + Next button */}
      <div className="mb-6 flex-shrink-0 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 2 of 7</p>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight"><TypewriterText text="Select Target Hardware" speed={40} /></h2>
          <p className="text-secondary mt-2">Choose the edge device and peripheral sensors for your AI deployment</p>
        </div>
        <button
          onClick={() => goToStep(3)}
          disabled={!state.hardware}
          className="flex-shrink-0 px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors mr-[610px] mt-[60px]"
        >
          Next: HW Config →
        </button>
      </div>

      {/* Split layout */}
      <ResizableSplit
        className="mr-[360px]"
        defaultLeftPercent={50}
        left={
          <div className="flex flex-col gap-3">
          <div className="space-y-2">
            {Object.entries(hardware).map(([category, data]) => {
              const isOpen = openCategory === category
              const categorySelected = state.hardware?.category === category
              return (
                <div
                  key={category}
                  className={[
                    'rounded-xl border transition-all duration-150',
                    categorySelected ? 'border-accent/40 bg-accent/5' : 'border-white/8 bg-component',
                  ].join(' ')}
                >
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => setOpenCategory(isOpen ? '' : category)}
                  >
                    <div>
                      <span className={['font-semibold text-sm', categorySelected ? 'text-accent' : 'text-primary'].join(' ')}>
                        {category}
                      </span>
                      <p className="text-secondary text-xs mt-0.5">{data.description}</p>
                    </div>
                    <span className="text-secondary text-xs ml-2 flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3 grid grid-cols-1 gap-2">
                      {data.devices.map(device => {
                        const selected = state.hardware?.device === device.name
                        return (
                          <button
                            key={device.id}
                            onClick={() => selectDevice(category, device)}
                            className={[
                              'text-left px-3 py-2.5 rounded-lg border transition-all duration-150',
                              selected
                                ? 'bg-accent/15 border-accent text-primary'
                                : 'bg-background/50 border-white/8 text-secondary hover:border-accent/40 hover:text-primary',
                            ].join(' ')}
                          >
                            <p className="font-medium text-sm">{device.name}</p>
                            <p className="text-xs text-secondary mt-0.5">{device.specs}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* PDF Upload */}
          <div className="rounded-xl border border-dashed border-accent/25 bg-accent/3 px-4 py-3">
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Custom Hardware</p>
            <p className="text-xs text-secondary mb-2">Upload a datasheet PDF — AI extracts specs automatically.</p>
            <label className={[
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors',
              uploading ? 'border-white/10 text-secondary cursor-not-allowed' : 'border-accent/40 text-accent hover:bg-accent/10',
            ].join(' ')}>
              {uploading
                ? <><span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />Analyzing...</>
                : 'Upload PDF'}
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={handlePdfUpload} />
            </label>
            {uploadSuccess && (
              <p className="mt-2 text-xs text-green-400 flex items-center gap-1"><span>✓</span>{uploadSuccess}</p>
            )}
            {uploadError && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1"><span>!</span>{uploadError}</p>
            )}
          </div>
        </div>
        }
        right={
          <HardwareRightPanel
            hardware={state.hardware}
            deviceId={selectedDeviceId}
            sensors={state.sensors}
            onSensorToggle={toggleSensor}
            onSensorQuantity={changeSensorQuantity}
          />
        }
      />

      {/* Hardware Benchmark */}
      <div className="mr-[360px]">
        <HardwareBenchmark selectedDevice={state.hardware?.device} />
      </div>

      {/* Navigation */}
      <div className="flex mt-6 flex-shrink-0 mr-[360px]">
        <button
          onClick={() => goToStep(1)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
