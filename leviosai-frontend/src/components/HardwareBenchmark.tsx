import { useState } from 'react'

interface BenchmarkData {
  device: string
  tops: number
  power: number
  topsPerWatt: number
  price: number
}

const BENCHMARKS: BenchmarkData[] = [
  { device: 'Jetson Thor',          tops: 2000,  power: 100, topsPerWatt: 20.0,  price: 1999 },
  { device: 'Jetson AGX Orin',      tops: 275,   power: 60,  topsPerWatt: 4.58,  price: 1999 },
  { device: 'Snapdragon 8 Elite',   tops: 100,   power: 8,   topsPerWatt: 12.5,  price: 0 },
  { device: 'AMD Ryzen AI',         tops: 50,    power: 45,  topsPerWatt: 1.11,  price: 449 },
  { device: 'Intel Core Ultra 3',   tops: 47,    power: 28,  topsPerWatt: 1.68,  price: 399 },
  { device: 'Hailo-10',             tops: 40,    power: 5,   topsPerWatt: 8.0,   price: 149 },
  { device: 'Apple A19 Pro',        tops: 38,    power: 6,   topsPerWatt: 6.33,  price: 0 },
  { device: 'Hailo-8',              tops: 26,    power: 2.5, topsPerWatt: 10.4,  price: 99 },
  { device: 'Google Tensor G5',     tops: 15,    power: 5,   topsPerWatt: 3.0,   price: 0 },
  { device: 'STM32 Series',         tops: 0.01,  power: 0.5, topsPerWatt: 0.02,  price: 15 },
]

type Metric = 'tops' | 'power' | 'topsPerWatt' | 'price'

const METRIC_INFO: Record<Metric, { label: string; unit: string; color: string }> = {
  tops:        { label: 'Compute (TOPS)',    unit: 'TOPS',   color: 'bg-accent' },
  power:       { label: 'Power Draw',        unit: 'W',      color: 'bg-yellow-400' },
  topsPerWatt: { label: 'Efficiency',        unit: 'T/W',    color: 'bg-green-400' },
  price:       { label: 'Approx. Price',     unit: 'USD',    color: 'bg-purple-400' },
}

export default function HardwareBenchmark({ selectedDevice }: { selectedDevice?: string }) {
  const [metric, setMetric] = useState<Metric>('tops')
  const [open, setOpen] = useState(false)

  const info = METRIC_INFO[metric]
  const sorted = [...BENCHMARKS].sort((a, b) => b[metric] - a[metric])
  const maxVal = Math.max(...sorted.map(d => d[metric]))

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-3 px-4 py-2.5 text-xs font-mono text-secondary border border-white/8 rounded-xl hover:border-accent/40 hover:text-primary transition-all text-left flex items-center gap-2"
      >
        <span className="text-accent">◈</span>
        <span>Hardware Benchmark Comparison</span>
        <span className="ml-auto text-secondary/30">▾</span>
      </button>
    )
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-white/8 bg-component animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Analysis</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">Hardware Benchmark</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-xs font-mono text-secondary hover:text-primary transition-colors px-2 py-1 rounded border border-white/8 hover:border-white/20"
        >
          ▴ Collapse
        </button>
      </div>

      {/* Metric selector */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {(Object.keys(METRIC_INFO) as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={[
              'px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap',
              metric === m
                ? 'bg-accent/10 border border-accent/30 text-accent'
                : 'border border-white/8 text-secondary hover:border-white/20',
            ].join(' ')}
          >
            {METRIC_INFO[m].label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="space-y-1.5">
        {sorted.map(d => {
          const pct = maxVal > 0 ? (d[metric] / maxVal) * 100 : 0
          const isSelected = selectedDevice && d.device.includes(selectedDevice)
          return (
            <div key={d.device} className={`flex items-center gap-3 text-xs font-mono py-1 rounded-lg px-2 transition-colors ${isSelected ? 'bg-accent/8' : ''}`}>
              <span className={`w-36 truncate flex-shrink-0 ${isSelected ? 'text-accent font-bold' : 'text-secondary'}`}>
                {isSelected && '▸ '}{d.device}
              </span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${info.color} animate-bar`}
                  style={{ width: `${Math.max(pct, 1)}%`, opacity: isSelected ? 1 : 0.6 }}
                />
              </div>
              <span className={`w-20 text-right flex-shrink-0 ${isSelected ? 'text-primary font-bold' : 'text-secondary/70'}`}>
                {d[metric] < 1 ? d[metric].toFixed(2) : d[metric].toLocaleString()} {info.unit}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-secondary/25 font-mono mt-3">* Estimated values. Actual performance may vary by workload and configuration.</p>
    </div>
  )
}
