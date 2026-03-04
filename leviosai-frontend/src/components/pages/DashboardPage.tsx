import { useMemo, useState, useEffect } from 'react'
import TypewriterText from '../TypewriterText'
import WorldMap from '../WorldMap'
import { useI18n } from '../../utils/i18n'
import type { SavedProject } from '../../types'

interface Props {
  projects: SavedProject[]
  onOpenProject: (project: SavedProject) => void
  onNewProject: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#6b96be', '#4ade80', '#f59e0b', '#ef4444',
  '#a78bfa', '#f472b6', '#06b6d4', '#84cc16',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ tag, title, badge, live }: { tag: string; title: string; badge?: string; live?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">{tag}</p>
        <p className="text-sm font-bold text-primary mt-0.5 font-mono">{title}</p>
      </div>
      {live ? (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400/70">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-pulse inline-block" />
          Live
        </span>
      ) : badge ? (
        <span className="text-[10px] font-mono text-secondary/30 border border-white/6 rounded px-2 py-0.5">
          {badge}
        </span>
      ) : null}
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={[
        'p-5 rounded-xl border text-center animate-count-in',
        accent
          ? 'border-accent/30 bg-accent/5 animate-data-pulse'
          : 'border-white/6 bg-component',
      ].join(' ')}
    >
      <p className={`text-3xl font-bold font-mono tabular-nums ${accent ? 'text-accent' : 'text-primary'}`}>
        {value}
      </p>
      <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-[0.18em] mt-2">{label}</p>
    </div>
  )
}

function BarRow({
  label, count, total, colorClass = 'bg-accent',
}: { label: string; count: number; total: number; colorClass?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-secondary/80 truncate">{label}</span>
        <span className="text-xs font-mono text-primary tabular-nums flex-shrink-0">
          {count}
          <span className="text-secondary/40 ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full animate-bar`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Donut Chart ────────────────────────────────────────────────────────────

function DonutChart({ data, total, label }: {
  data: { name: string; count: number; color: string }[]
  total: number
  label: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const id = setTimeout(() => setMounted(true), 50); return () => clearTimeout(id) }, [])

  const R = 48, CX = 60, CY = 60, STROKE = 12
  const C = 2 * Math.PI * R

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center py-6">
        <svg viewBox="0 0 120 120" className="w-28 h-28">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
          <text x={CX} y={CY + 2} textAnchor="middle" fill="currentColor" className="text-secondary/30" style={{ fontSize: '16px', fontFamily: 'monospace' }}>0</text>
        </svg>
        <p className="text-[10px] font-mono text-secondary/30 mt-2">No data</p>
      </div>
    )
  }

  let cumOffset = 0

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        {data.map((seg, i) => {
          const segLen = total > 0 ? (seg.count / total) * C : 0
          const dashOffset = C - cumOffset
          cumOffset += segLen
          return (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={`${segLen} ${C - segLen}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{
                opacity: mounted ? 1 : 0,
                transition: `opacity 0.6s ease ${i * 0.1}s`,
              }}
              strokeLinecap="butt"
            />
          )
        })}
        <text x={CX} y={CY - 2} textAnchor="middle" fill="currentColor" className="text-primary" style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 700 }}>
          {total}
        </text>
        <text x={CX} y={CY + 13} textAnchor="middle" fill="currentColor" className="text-secondary/50" style={{ fontSize: '7px', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
        {data.map((seg, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] font-mono text-secondary/70">
            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: seg.color }} />
            {seg.name} ({seg.count})
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Activity Heatmap ───────────────────────────────────────────────────────

function ActivityHeatmap({ projects }: { projects: SavedProject[] }) {
  const { t } = useI18n()

  const { cells, totalInWindow } = useMemo(() => {
    const map = new Map<string, number>()
    projects.forEach(p => {
      const d = new Date(p.createdAt).toISOString().slice(0, 10)
      map.set(d, (map.get(d) ?? 0) + 1)
    })

    const today = new Date()
    const result: { date: string; count: number; week: number; day: number }[] = []
    let total = 0

    for (let w = 11; w >= 0; w--) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(today)
        date.setDate(date.getDate() - (w * 7 + (6 - d)))
        const key = date.toISOString().slice(0, 10)
        const count = map.get(key) ?? 0
        total += count
        result.push({ date: key, count, week: 11 - w, day: d })
      }
    }

    return { cells: result, totalInWindow: total }
  }, [projects])

  const cellSize = 10, gap = 2, labelW = 24
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono text-secondary/40">
          {totalInWindow} pipeline{totalInWindow !== 1 ? 's' : ''} in 12 weeks
        </p>
        <div className="flex items-center gap-1 text-[10px] font-mono text-secondary/30">
          <span>Less</span>
          {[0.04, 0.2, 0.4, 0.7].map((opacity, i) => (
            <span key={i} className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: i === 0 ? 'rgba(255,255,255,0.04)' : `rgba(107,150,190,${opacity})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
      {totalInWindow === 0 ? (
        <p className="text-xs font-mono text-secondary/30 text-center py-4">{t('dashboard.noActivity')}</p>
      ) : (
        <svg viewBox={`0 0 ${labelW + 12 * (cellSize + gap)} ${7 * (cellSize + gap)}`} className="w-full h-auto">
          {dayLabels.map((label, i) =>
            label ? (
              <text key={i} x={labelW - 4} y={i * (cellSize + gap) + cellSize - 1} textAnchor="end" fill="currentColor" className="text-secondary/40" style={{ fontSize: '7px', fontFamily: 'monospace' }}>
                {label}
              </text>
            ) : null
          )}
          {cells.map((cell, i) => (
            <rect
              key={i}
              x={labelW + cell.week * (cellSize + gap)}
              y={cell.day * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={
                cell.count === 0 ? 'rgba(255,255,255,0.04)'
                : cell.count === 1 ? 'rgba(107,150,190,0.3)'
                : cell.count === 2 ? 'rgba(107,150,190,0.5)'
                : 'rgba(107,150,190,0.7)'
              }
              className="animate-heatmap-cell"
              style={{ animationDelay: `${i * 4}ms` }}
            >
              <title>{cell.date}: {cell.count} pipeline(s)</title>
            </rect>
          ))}
        </svg>
      )}
    </div>
  )
}

// ── System Health Panel ────────────────────────────────────────────────────

function SystemHealthPanel() {
  const { t } = useI18n()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(v => v + 1), 3000)
    return () => clearInterval(id)
  }, [])

  const cpu = 42 + ((tick % 7) * 5)
  const gpu = 58 + ((tick % 5) * 6)
  const mem = 35 + ((tick % 6) * 4)

  const gauges = [
    { label: 'CPU', value: cpu },
    { label: 'GPU', value: gpu },
    { label: 'MEM', value: mem },
  ]

  function gaugeColor(v: number) {
    if (v < 60) return '#4ade80'
    if (v < 80) return '#f59e0b'
    return '#ef4444'
  }

  const R = 30, CX = 36, CY = 36, SW = 5
  const C = 2 * Math.PI * R

  const uptimeMs = Date.now() - 1709510400000
  const days = Math.floor(uptimeMs / 86400000)
  const hrs = Math.floor((uptimeMs % 86400000) / 3600000)
  const mins = Math.floor((uptimeMs % 3600000) / 60000)

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {gauges.map(g => {
          const filled = (g.value / 100) * C
          return (
            <div key={g.label} className="flex flex-col items-center">
              <svg viewBox="0 0 72 72" className="w-16 h-16">
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke={gaugeColor(g.value)}
                  strokeWidth={SW}
                  strokeDasharray={`${filled} ${C - filled}`}
                  transform={`rotate(-90 ${CX} ${CY})`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1.5s ease, stroke 0.5s ease' }}
                />
                <text x={CX} y={CY + 2} textAnchor="middle" fill="currentColor" className="text-primary" style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}>
                  {g.value}%
                </text>
              </svg>
              <p className="text-[10px] font-mono text-secondary/50 uppercase tracking-widest mt-0.5">{g.label}</p>
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-white/6 text-center">
        <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-1">
          {t('dashboard.uptime')}
        </p>
        <p className="text-sm font-mono text-primary tabular-nums animate-gauge-tick">
          {days}d {String(hrs).padStart(2, '0')}:{String(mins).padStart(2, '0')}
        </p>
      </div>
    </div>
  )
}

// ── Sensor × Hardware Matrix ───────────────────────────────────────────────

function SensorHardwareMatrix({ projects }: { projects: SavedProject[] }) {
  const { sensors, hardwares, pairs } = useMemo(() => {
    const pairSet = new Set<string>()
    const sensorSet = new Set<string>()
    const hwSet = new Set<string>()

    projects.forEach(p => {
      if (p.hardware) {
        hwSet.add(p.hardware)
        p.sensors.forEach(s => {
          sensorSet.add(s)
          pairSet.add(`${s}|${p.hardware}`)
        })
      }
    })

    return {
      sensors: Array.from(sensorSet).slice(0, 8),
      hardwares: Array.from(hwSet).slice(0, 6),
      pairs: pairSet,
    }
  }, [projects])

  if (sensors.length === 0 || hardwares.length === 0) {
    return <p className="text-xs font-mono text-secondary/30 py-4 text-center">No sensor-hardware data</p>
  }

  const cellSize = 24
  const labelLeft = 80
  const labelTop = 50
  const svgW = labelLeft + hardwares.length * cellSize + 8
  const svgH = labelTop + sensors.length * cellSize + 8

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {/* Column headers */}
      {hardwares.map((hw, i) => (
        <text
          key={hw}
          x={labelLeft + i * cellSize + cellSize / 2}
          y={labelTop - 8}
          textAnchor="end"
          fill="currentColor"
          className="text-secondary/50"
          style={{ fontSize: '6px', fontFamily: 'monospace' }}
          transform={`rotate(-45, ${labelLeft + i * cellSize + cellSize / 2}, ${labelTop - 8})`}
        >
          {hw.length > 12 ? hw.slice(0, 12) + '…' : hw}
        </text>
      ))}
      {/* Row headers + dots */}
      {sensors.map((sensor, row) => (
        <g key={sensor}>
          <text
            x={labelLeft - 6}
            y={labelTop + row * cellSize + cellSize / 2 + 3}
            textAnchor="end"
            fill="currentColor"
            className="text-secondary/50"
            style={{ fontSize: '7px', fontFamily: 'monospace' }}
          >
            {sensor.length > 12 ? sensor.slice(0, 12) + '…' : sensor}
          </text>
          {hardwares.map((hw, col) => {
            const exists = pairs.has(`${sensor}|${hw}`)
            return (
              <circle
                key={hw}
                cx={labelLeft + col * cellSize + cellSize / 2}
                cy={labelTop + row * cellSize + cellSize / 2}
                r={exists ? 5 : 3}
                fill={exists ? '#6b96be' : 'rgba(255,255,255,0.06)'}
                style={{ transition: 'fill 0.3s, r 0.3s' }}
              >
                <title>{sensor} × {hw}</title>
              </circle>
            )
          })}
        </g>
      ))}
    </svg>
  )
}

// ── Project Card ───────────────────────────────────────────────────────────

function ProjectCard({ project, onOpen }: { project: SavedProject; onOpen: (p: SavedProject) => void }) {
  const displayDate = project.customDate
    ? new Date(project.customDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : new Date(project.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })

  return (
    <button
      onClick={() => onOpen(project)}
      className="text-left p-5 rounded-2xl border border-white/8 bg-component hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-mono text-secondary/40">
            No.{String(project.projectNo ?? 1).padStart(3, '0')}
          </span>
          <p className="text-primary font-bold text-base group-hover:text-accent transition-colors truncate mt-0.5">
            {project.name}
          </p>
          <p className="text-xs text-secondary/60 font-mono mt-0.5">
            {displayDate} · {project.author || 'Unknown'}
          </p>
          {project.description && (
            <p className="text-xs text-secondary/50 mt-1.5 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors">
          <span className="text-accent text-base">◈</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {project.domain && (
          <span className="text-[10px] px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-full font-mono">
            {project.domain}
          </span>
        )}
        {project.hardware && (
          <span className="text-[10px] px-2 py-0.5 bg-white/6 border border-white/10 text-secondary rounded-full font-mono">
            ⬡ {project.hardware}
          </span>
        )}
        {project.model && (
          <span className="text-[10px] px-2 py-0.5 bg-white/6 border border-white/10 text-secondary rounded-full font-mono">
            ◎ {project.model}
          </span>
        )}
      </div>

      {project.sensors.length > 0 && (
        <p className="text-xs text-secondary/60 font-mono mb-1">
          <span className="text-secondary/40">Sensors: </span>
          {project.sensors.join(', ')}
        </p>
      )}
      {project.techniques.length > 0 && (
        <p className="text-xs text-secondary/60 font-mono">
          <span className="text-secondary/40">Tech: </span>
          {project.techniques.join(', ')}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-[10px] font-mono text-secondary/50 uppercase tracking-wider">
          {project.language}
        </span>
        <span className="text-secondary/30 text-xs group-hover:text-accent transition-colors">↗</span>
      </div>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DashboardPage({ projects, onOpenProject, onNewProject }: Props) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDomain, setFilterDomain] = useState<string | ''>('')
  const [filterHardware, setFilterHardware] = useState<string | ''>('')

  const stats = useMemo(() => {
    const domains   = Array.from(new Set(projects.map(p => p.domain).filter(Boolean)))   as string[]
    const hardwares = Array.from(new Set(projects.map(p => p.hardware).filter(Boolean))) as string[]
    const models    = Array.from(new Set(projects.map(p => p.model).filter(Boolean)))    as string[]

    const domainCounts: Record<string, number> = {}
    const hwCounts:     Record<string, number> = {}
    const langCounts:   Record<string, number> = {}
    const modelCounts:  Record<string, number> = {}
    const techniqueCounts: Record<string, number> = {}

    projects.forEach(p => {
      if (p.domain)    domainCounts[p.domain]    = (domainCounts[p.domain]    ?? 0) + 1
      if (p.hardware)  hwCounts[p.hardware]      = (hwCounts[p.hardware]      ?? 0) + 1
      if (p.language)  langCounts[p.language]    = (langCounts[p.language]    ?? 0) + 1
      if (p.model)     modelCounts[p.model]      = (modelCounts[p.model]      ?? 0) + 1
      p.techniques.forEach(tech => {
        techniqueCounts[tech] = (techniqueCounts[tech] ?? 0) + 1
      })
    })

    const recent = [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)

    const allSensors = Array.from(new Set(projects.flatMap(p => p.sensors)))
    const allTechniques = Array.from(new Set(projects.flatMap(p => p.techniques)))

    return { domains, hardwares, models, domainCounts, hwCounts, langCounts, modelCounts, techniqueCounts, recent, allSensors, allTechniques }
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q)) ||
        (p.author?.toLowerCase().includes(q)) ||
        (p.model?.toLowerCase().includes(q))
      const matchesDomain = !filterDomain || p.domain === filterDomain
      const matchesHw = !filterHardware || p.hardware === filterHardware
      return matchesSearch && matchesDomain && matchesHw
    })
  }, [projects, searchQuery, filterDomain, filterHardware])

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      {/* World map background */}
      <div className="absolute -top-8 -left-8 -right-8 h-[400px] overflow-hidden rounded-2xl">
        <WorldMap />
      </div>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 relative" style={{ zIndex: 1 }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[10px] font-semibold text-accent/70 uppercase tracking-[0.25em] font-mono">
              {t('dashboard.subtitle')}
            </p>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              {t('dashboard.live')}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight animate-flicker">
            <TypewriterText text={t('dashboard.title')} speed={45} showCursor />
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-secondary text-sm font-mono">
              {projects.length > 0
                ? `${projects.length} ${t('dashboard.totalPipelines')} · ${stats.domains.length} ${t('dashboard.activeDomains')} · ${stats.hardwares.length} ${t('dashboard.hwConfigs')}`
                : t('dashboard.noPipelines')}
            </p>
            <span className="text-[10px] font-mono text-secondary/30 hidden sm:block">
              {dateStr} · {timeStr}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 mt-1">
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary/85 transition-colors text-sm font-mono"
          >
            <span>+</span>
            <span>{t('dashboard.newPipeline')}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards (6) ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label={t('dashboard.totalPipelines')}    value={projects.length}             accent />
        <KpiCard label={t('dashboard.activeDomains')}     value={stats.domains.length}        />
        <KpiCard label={t('dashboard.hwConfigs')}         value={stats.hardwares.length}      />
        <KpiCard label={t('dashboard.modelsDeployed')}    value={stats.models.length}         />
        <KpiCard label={t('dashboard.sensorsActive')}     value={stats.allSensors.length}     />
        <KpiCard label={t('dashboard.techniquesApplied')} value={stats.allTechniques.length}  />
      </div>

      {/* ── Analytics (shown only when projects exist) ──────── */}
      {projects.length > 0 && (
        <>
          {/* Row A: Domain Donut + Hardware Donut + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Analytics" title={t('dashboard.domainDist')} badge={`${projects.length} total`} />
              <DonutChart
                data={Object.entries(stats.domainCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, count], i) => ({ name, count, color: CHART_COLORS[i % CHART_COLORS.length] }))}
                total={projects.length}
                label={t('dashboard.totalPipelines')}
              />
            </div>

            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Infrastructure" title={t('dashboard.hwUtilization')} />
              <DonutChart
                data={Object.entries(stats.hwCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, count], i) => ({ name, count, color: CHART_COLORS[(i + 3) % CHART_COLORS.length] }))}
                total={projects.length}
                label={t('dashboard.hwConfigs')}
              />
            </div>

            {/* Recent Activity */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Timeline" title={t('dashboard.recentActivity')} live />
              <div className="space-y-0">
                {stats.recent.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-accent ring-2 ring-accent/20' : 'bg-white/15'}`} />
                      {i < stats.recent.length - 1 && (
                        <div className="w-px bg-white/8 mt-1" style={{ height: '28px' }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-mono text-primary truncate">{p.name}</p>
                        <span className="text-[10px] font-mono text-secondary/30 flex-shrink-0">
                          {relativeTime(p.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-secondary/50 mt-0.5">
                        <span className="text-secondary/30">No.{String(p.projectNo ?? 1).padStart(3, '0')} · </span>
                        {p.domain ?? '—'} · {p.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row B: Activity Heatmap */}
          <div className="p-5 rounded-2xl border border-white/8 bg-component">
            <SectionHeader tag="Activity" title={t('dashboard.activityHeatmap')} />
            <ActivityHeatmap projects={projects} />
          </div>

          {/* Row C: Technique Usage + Language Distribution + System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Technique Usage */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Optimization" title={t('dashboard.techniqueUsage')} />
              {Object.keys(stats.techniqueCounts).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.techniqueCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([tech, count], i) => (
                      <BarRow key={tech} label={tech} count={count} total={projects.length} colorClass={i === 0 ? 'bg-accent' : i === 1 ? 'bg-green-400/50' : 'bg-primary/40'} />
                    ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-secondary/30">No techniques applied</p>
              )}
            </div>

            {/* Language Distribution */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Codegen" title={t('dashboard.langDist')} />
              {Object.keys(stats.langCounts).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.langCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, count]) => (
                      <BarRow key={lang} label={lang} count={count} total={projects.length} colorClass="bg-blue-400/50" />
                    ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-secondary/30">No language data</p>
              )}

              {/* Sensor coverage tags */}
              {stats.allSensors.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/6">
                  <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-3">
                    {t('dashboard.sensorCoverage')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.allSensors.map(s => (
                      <span
                        key={s}
                        className="text-[10px] px-2.5 py-1 bg-white/4 border border-white/8 text-secondary/70 rounded font-mono hover:border-accent/25 hover:text-secondary transition-colors"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* System Health */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="System" title={t('dashboard.systemHealth')} live />
              <SystemHealthPanel />
            </div>
          </div>

          {/* Row D: Deployed Models + Sensor-Hardware Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Deployed Models */}
            {Object.keys(stats.modelCounts).length > 0 && (
              <div className="p-5 rounded-2xl border border-white/8 bg-component">
                <SectionHeader tag="AI" title="Deployed Models" badge={`${stats.models.length} unique`} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats.modelCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([model, count]) => (
                      <div
                        key={model}
                        className="p-3 rounded-xl border border-white/6 bg-white/2 hover:border-accent/20 transition-colors"
                      >
                        <p className="text-xs font-mono text-primary truncate">{model}</p>
                        <p className="text-[10px] font-mono text-secondary/40 mt-1">
                          {count} deployment{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sensor × Hardware Matrix */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Coverage" title={t('dashboard.sensorMatrix')} />
              <SensorHardwareMatrix projects={projects} />
            </div>
          </div>
        </>
      )}

      {/* ── Pipeline grid ──────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-white/10 bg-white/1">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
            <img src="/leviosai.png" alt="" className="w-8 h-8 object-contain opacity-60" />
          </div>
          <p className="text-primary font-bold text-lg mb-2 font-mono">{t('dashboard.noPipelines')}</p>
          <p className="text-secondary text-sm mb-6 text-center max-w-sm">
            {t('dashboard.initPipeline')}
          </p>
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary/85 transition-colors font-mono"
          >
            <span>+</span>
            <span>{t('dashboard.initPipeline')}</span>
          </button>
        </div>
      ) : (
        <div>
          {/* Search & Filter bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40 text-sm">⌕</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.search')}
                className="w-full bg-component border border-white/8 text-primary rounded-xl pl-9 pr-4 py-2.5 text-xs placeholder:text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors font-mono"
              />
            </div>
            {stats.domains.length > 0 && (
              <select
                value={filterDomain}
                onChange={e => setFilterDomain(e.target.value)}
                className="bg-component border border-white/8 text-primary rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">{t('dashboard.allDomains')}</option>
                {stats.domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            {stats.hardwares.length > 0 && (
              <select
                value={filterHardware}
                onChange={e => setFilterHardware(e.target.value)}
                className="bg-component border border-white/8 text-primary rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">{t('dashboard.allHardware')}</option>
                {stats.hardwares.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">{t('dashboard.allPipelines')}</p>
            <p className="text-[10px] font-mono text-secondary/25">
              {filteredProjects.length}{filteredProjects.length !== projects.length ? ` / ${projects.length}` : ''} record{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} onOpen={onOpenProject} />
            ))}
            <button
              onClick={onNewProject}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-white/10 hover:border-accent/30 hover:bg-accent/3 transition-all duration-200 group min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:border-accent/30 transition-colors">
                <span className="text-secondary text-xl group-hover:text-accent transition-colors">+</span>
              </div>
              <p className="text-secondary text-sm font-mono group-hover:text-primary transition-colors">
                {t('dashboard.newPipeline')}
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
