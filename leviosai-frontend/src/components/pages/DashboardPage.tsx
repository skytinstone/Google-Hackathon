import { useMemo, useState, useEffect } from 'react'
import TypewriterText from '../TypewriterText'
import type { SavedProject } from '../../types'

// ── Vertical LEVIOSAI watermark ────────────────────────────────
function VerticalWatermark() {
  const text = 'LEVIOSAI'
  const [count, setCount] = useState(0)

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setCount(i)
      if (i >= text.length) clearInterval(id)
    }, 130)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="fixed left-4 bottom-10 pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      <p
        className="text-[72px] font-black font-mono tracking-[0.18em] text-white/[0.045] leading-none"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {text.slice(0, count)}
        {count < text.length && (
          <span className="animate-blink text-white/[0.06]">_</span>
        )}
      </p>
    </div>
  )
}

interface Props {
  projects: SavedProject[]
  onOpenProject: () => void
  onNewProject: () => void
}

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
      <p className={`text-4xl font-bold font-mono tabular-nums ${accent ? 'text-accent' : 'text-primary'}`}>
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

function ProjectCard({ project, onOpen }: { project: SavedProject; onOpen: () => void }) {
  const displayDate = project.customDate
    ? new Date(project.customDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : new Date(project.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })

  return (
    <button
      onClick={onOpen}
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
  const stats = useMemo(() => {
    const domains   = Array.from(new Set(projects.map(p => p.domain).filter(Boolean)))   as string[]
    const hardwares = Array.from(new Set(projects.map(p => p.hardware).filter(Boolean))) as string[]
    const models    = Array.from(new Set(projects.map(p => p.model).filter(Boolean)))    as string[]

    const domainCounts: Record<string, number> = {}
    const hwCounts:     Record<string, number> = {}
    const langCounts:   Record<string, number> = {}
    const modelCounts:  Record<string, number> = {}

    projects.forEach(p => {
      if (p.domain)    domainCounts[p.domain]    = (domainCounts[p.domain]    ?? 0) + 1
      if (p.hardware)  hwCounts[p.hardware]      = (hwCounts[p.hardware]      ?? 0) + 1
      if (p.language)  langCounts[p.language]    = (langCounts[p.language]    ?? 0) + 1
      if (p.model)     modelCounts[p.model]      = (modelCounts[p.model]      ?? 0) + 1
    })

    const recent = [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)

    const allSensors = Array.from(new Set(projects.flatMap(p => p.sensors)))

    return { domains, hardwares, models, domainCounts, hwCounts, langCounts, modelCounts, recent, allSensors }
  }, [projects])

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <>
    {/* Background LEVIOSAI watermark — fixed bottom-left, vertical */}
    <VerticalWatermark />

    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[10px] font-semibold text-accent/70 uppercase tracking-[0.25em] font-mono">
              LeviosAI · Operations Center
            </p>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              LIVE
            </span>
          </div>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight animate-flicker">
            <TypewriterText text="Operations Center" speed={45} showCursor />
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-secondary text-sm font-mono">
              {projects.length > 0
                ? `${projects.length} pipeline${projects.length !== 1 ? 's' : ''} · ${stats.domains.length} domain${stats.domains.length !== 1 ? 's' : ''} · ${stats.hardwares.length} hw config${stats.hardwares.length !== 1 ? 's' : ''}`
                : 'No pipelines initialized'}
            </p>
            <span className="text-[10px] font-mono text-secondary/30 hidden sm:block">
              {dateStr} · {timeStr}
            </span>
          </div>
        </div>

        {/* System status chip + New Pipeline button */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 mt-1">
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary/85 transition-colors text-sm font-mono"
          >
            <span>+</span>
            <span>New Pipeline</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-secondary/40 border border-white/6 rounded px-2 py-0.5 bg-white/2">
              SYS: NOMINAL
            </span>
            <span className="text-[10px] font-mono text-accent/50 border border-accent/15 rounded px-2 py-0.5">
              v2.0
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Pipelines"   value={projects.length}       accent />
        <KpiCard label="Active Domains"    value={stats.domains.length}  />
        <KpiCard label="Hardware Configs"  value={stats.hardwares.length} />
        <KpiCard label="Models Deployed"   value={stats.models.length}   />
      </div>

      {/* ── Analytics (shown only when projects exist) ──────── */}
      {projects.length > 0 && (
        <>
          {/* Row 1: Domain dist + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Domain distribution */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Analytics</p>
                  <p className="text-sm font-bold text-primary mt-0.5 font-mono">Domain Distribution</p>
                </div>
                <span className="text-[10px] font-mono text-secondary/30 border border-white/6 rounded px-2 py-0.5">
                  {projects.length} total
                </span>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.domainCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([domain, count]) => (
                    <BarRow key={domain} label={domain} count={count} total={projects.length} colorClass="bg-accent" />
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Timeline</p>
                  <p className="text-sm font-bold text-primary mt-0.5 font-mono">Recent Activity</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400/60 animate-pulse inline-block" />
                  Live
                </span>
              </div>
              <div className="space-y-0">
                {stats.recent.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-accent ring-2 ring-accent/20' : 'bg-white/15'}`}
                      />
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

          {/* Row 2: Hardware utilization + Language / Sensor breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Hardware breakdown */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <div className="mb-5">
                <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Infrastructure</p>
                <p className="text-sm font-bold text-primary mt-0.5 font-mono">Hardware Utilization</p>
              </div>
              {Object.keys(stats.hwCounts).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.hwCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([hw, count]) => (
                      <BarRow key={hw} label={hw} count={count} total={projects.length} colorClass="bg-primary/50" />
                    ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-secondary/30">No hardware data</p>
              )}
            </div>

            {/* Language + Sensor breakdown */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <div className="mb-5">
                <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Codegen</p>
                <p className="text-sm font-bold text-primary mt-0.5 font-mono">Language Distribution</p>
              </div>
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

              {/* Sensor coverage */}
              {stats.allSensors.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/6">
                  <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-3">
                    Sensor Coverage
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
          </div>

          {/* Row 3: Model deployment table */}
          {Object.keys(stats.modelCounts).length > 0 && (
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">AI</p>
                  <p className="text-sm font-bold text-primary mt-0.5 font-mono">Deployed Models</p>
                </div>
                <span className="text-[10px] font-mono text-secondary/30 border border-white/6 rounded px-2 py-0.5">
                  {stats.models.length} unique
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
        </>
      )}

      {/* ── Pipeline grid ──────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-white/10 bg-white/1">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
            <img src="/leviosai.png" alt="" className="w-8 h-8 object-contain opacity-60" />
          </div>
          <p className="text-primary font-bold text-lg mb-2 font-mono">No Pipelines Initialized</p>
          <p className="text-secondary text-sm mb-6 text-center max-w-sm">
            Configure the 7-step Edge AI pipeline and save your first project.
          </p>
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary/85 transition-colors font-mono"
          >
            <span>+</span>
            <span>Initialize Pipeline</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">All Pipelines</p>
            <p className="text-[10px] font-mono text-secondary/25">
              {projects.length} record{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} onOpen={onOpenProject} />
            ))}
            {/* New pipeline card */}
            <button
              onClick={onNewProject}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-white/10 hover:border-accent/30 hover:bg-accent/3 transition-all duration-200 group min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:border-accent/30 transition-colors">
                <span className="text-secondary text-xl group-hover:text-accent transition-colors">+</span>
              </div>
              <p className="text-secondary text-sm font-mono group-hover:text-primary transition-colors">
                New Pipeline
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
