import { useMemo, useState } from 'react'
import TypewriterText from '../TypewriterText'
import { useI18n } from '../../utils/i18n'
import { getBenchmarkResult } from '../../data/deployData'
import SystemInfoPanel from '../SystemInfoPanel'
import type { SavedProject } from '../../types'

interface Props {
  projects: SavedProject[]
  onOpenProject: (project: SavedProject) => void
  onNewProject: () => void
  onNavigate: (tab: import('../TopNav').Tab) => void
  chatOpen?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T }
  catch { return fallback }
}

function getGrade(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: 'A+', color: '#4ade80' }
  if (score >= 80) return { letter: 'A',  color: '#22c55e' }
  if (score >= 70) return { letter: 'B',  color: '#6b96be' }
  if (score >= 60) return { letter: 'C',  color: '#f59e0b' }
  if (score >= 50) return { letter: 'D',  color: '#f97316' }
  return { letter: 'F', color: '#ef4444' }
}

interface ProjectStage {
  pipeline: boolean
  shop: boolean
  build: boolean
  launch: boolean
}

function getProjectStage(p: SavedProject): ProjectStage {
  const pipeline = true
  const shop = !!(p.hardware && p.sensors.length > 0)
  const build = loadJson<unknown[]>(`leviosai_deploy_parts_${p.id}`, []).length > 0
  const launch = loadJson<unknown[]>(`leviosai_deploy_media_${p.id}`, []).length > 0
    || loadJson<unknown[]>(`leviosai_launch_checks_${p.id}`, []).length > 0
  return { pipeline, shop, build, launch }
}

function getProjectScore(p: SavedProject): number | null {
  if (!p.hardware) return null
  const techniques = p.techniques.map(t => ({ id: t, name: t }))
  const result = getBenchmarkResult(p.hardware, techniques)
  return result.efficiencyScore
}

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

function countStages(stage: ProjectStage): number {
  return [stage.pipeline, stage.shop, stage.build, stage.launch].filter(Boolean).length
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

function KpiCard({ label, value, suffix, accent }: { label: string; value: string | number; suffix?: string; accent?: boolean }) {
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
        {suffix && <span className="text-base text-secondary/40 ml-0.5">{suffix}</span>}
      </p>
      <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-[0.18em] mt-2">{label}</p>
    </div>
  )
}

// ── Stage Progress Bar ────────────────────────────────────────────────────

const STAGE_KEYS: (keyof ProjectStage)[] = ['pipeline', 'shop', 'build', 'launch']

function StageProgressBar({ project, stage, score, onClick, t }: {
  project: SavedProject
  stage: ProjectStage
  score: number | null
  onClick: () => void
  t: (key: string) => string
}) {
  const grade = score != null ? getGrade(score) : null

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border border-white/8 bg-component hover:border-accent/30 hover:bg-accent/3 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {grade && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: grade.color + '22', color: grade.color, border: `1px solid ${grade.color}44` }}
            >
              {grade.letter}
            </span>
          )}
          <p className="text-sm font-mono text-primary truncate group-hover:text-accent transition-colors">
            {project.name}
          </p>
        </div>
        <span className="text-[10px] font-mono text-secondary/30 flex-shrink-0">
          {score != null ? `${score}/100` : '—'}
        </span>
      </div>
      <div className="flex gap-1">
        {STAGE_KEYS.map(key => (
          <div key={key} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-1.5 rounded-full transition-colors ${
                stage[key] ? 'bg-accent' : 'bg-white/8'
              }`}
            />
            <span className={`text-[8px] font-mono uppercase tracking-wider ${
              stage[key] ? 'text-accent/70' : 'text-secondary/30'
            }`}>
              {t(`dashboard.stage.${key}`)}
            </span>
          </div>
        ))}
      </div>
    </button>
  )
}

// ── Quick Action Card ─────────────────────────────────────────────────────

function QuickActionCard({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/8 bg-component hover:border-accent/30 hover:bg-accent/5 transition-all group"
    >
      <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[10px] font-mono text-secondary/70 group-hover:text-accent transition-colors text-center leading-tight">
        {label}
      </span>
    </button>
  )
}

// ── Performance Rank Row ──────────────────────────────────────────────────

function PerformanceRankRow({ rank, project, score, onClick }: {
  rank: number
  project: SavedProject
  score: number
  onClick: () => void
}) {
  const grade = getGrade(score)
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2 px-1 hover:bg-white/3 rounded-lg transition-colors group"
    >
      <span className={`text-xs font-mono tabular-nums w-5 text-right ${rank <= 3 ? 'text-accent font-bold' : 'text-secondary/40'}`}>
        #{rank}
      </span>
      <span
        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ backgroundColor: grade.color + '22', color: grade.color, border: `1px solid ${grade.color}44` }}
      >
        {grade.letter}
      </span>
      <span className="text-xs font-mono text-primary truncate flex-1 group-hover:text-accent transition-colors">
        {project.name}
      </span>
      <span className="text-xs font-mono text-secondary/50 tabular-nums flex-shrink-0">
        {score}
      </span>
    </button>
  )
}

// ── Project Card (simplified) ─────────────────────────────────────────────

function ProjectCard({ project, stage, score, onOpen }: {
  project: SavedProject
  stage: ProjectStage
  score: number | null
  onOpen: (p: SavedProject) => void
}) {
  const grade = score != null ? getGrade(score) : null
  const stageCount = countStages(stage)

  return (
    <button
      onClick={() => onOpen(project)}
      className="text-left p-5 rounded-2xl border border-white/8 bg-component hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-mono text-secondary/40">
            No.{String(project.projectNo ?? 1).padStart(3, '0')}
          </span>
          <p className="text-primary font-bold text-base group-hover:text-accent transition-colors truncate mt-0.5">
            {project.name}
          </p>
        </div>
        {grade ? (
          <span
            className="text-xs font-mono font-bold px-2 py-1 rounded-lg flex-shrink-0"
            style={{ backgroundColor: grade.color + '22', color: grade.color, border: `1px solid ${grade.color}44` }}
          >
            {grade.letter}
          </span>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors">
            <span className="text-accent text-base">◈</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
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

      {/* Mini stage bar */}
      <div className="flex gap-1 mb-2">
        {STAGE_KEYS.map(key => (
          <div
            key={key}
            className={`flex-1 h-1 rounded-full ${stage[key] ? 'bg-accent' : 'bg-white/8'}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-secondary/40">
          {stageCount}/4 stages
        </span>
        <span className="text-secondary/30 text-xs group-hover:text-accent transition-colors">↗</span>
      </div>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DashboardPage({ projects, onOpenProject, onNewProject, onNavigate, chatOpen }: Props) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDomain, setFilterDomain] = useState<string | ''>('')
  const [filterHardware, setFilterHardware] = useState<string | ''>('')

  const stats = useMemo(() => {
    const domains   = Array.from(new Set(projects.map(p => p.domain).filter(Boolean))) as string[]
    const hardwares = Array.from(new Set(projects.map(p => p.hardware).filter(Boolean))) as string[]

    // Parts & Packages from localStorage
    let totalParts = 0
    let totalPackages = 0
    const stageMap = new Map<string, ProjectStage>()
    const scoreMap = new Map<string, number | null>()

    projects.forEach(p => {
      totalParts += loadJson<unknown[]>(`leviosai_deploy_parts_${p.id}`, []).length
      totalPackages += loadJson<unknown[]>(`leviosai_deploy_packages_${p.id}`, []).length
      stageMap.set(p.id, getProjectStage(p))
      scoreMap.set(p.id, getProjectScore(p))
    })

    // Average score
    const scores = Array.from(scoreMap.values()).filter((s): s is number => s != null)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

    // Recent projects (by createdAt desc)
    const recent = [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)

    // Ranked by score desc
    const ranked = [...projects]
      .map(p => ({ project: p, score: scoreMap.get(p.id) }))
      .filter((r): r is { project: SavedProject; score: number } => r.score != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    return { domains, hardwares, totalParts, totalPackages, avgScore, stageMap, scoreMap, recent, ranked }
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

  // Pipeline progress — top 6 projects by creation date
  const progressProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  return (
    <div className="relative">
      {/* ── System Info + Widgets (fixed) ──────────────────────── */}
      <SystemInfoPanel />


      {/* Content panel with semi-transparent background over grid */}
      <div className="rounded-xl border border-white/6 bg-[#0a0c14]/85 backdrop-blur-sm p-6 space-y-8" style={{ width: '63%', marginLeft: 'calc(2% + 290px)', marginRight: 'auto', marginTop: '5px' }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
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
                ? `${projects.length} ${t('dashboard.totalPipelines')} · ${stats.domains.length} ${t('dashboard.activeDomains')}`
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

      {/* ── KPI Cards (4) ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label={t('dashboard.totalPipelines')} value={projects.length} accent />
        <KpiCard label={t('dashboard.partsTracked')}   value={stats.totalParts} />
        <KpiCard label={t('dashboard.packages')}       value={stats.totalPackages} />
        <KpiCard label={t('dashboard.avgScore')}       value={stats.avgScore ?? '—'} suffix={stats.avgScore != null ? '/100' : undefined} />
      </div>

      {/* ── Content (only when projects exist) ───────────────── */}
      {projects.length > 0 && (
        <>
          {/* Pipeline Progress */}
          <div className="p-5 rounded-2xl border border-white/8 bg-component">
            <SectionHeader tag="Progress" title={t('dashboard.pipelineProgress')} badge={`${projects.length} total`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {progressProjects.map(p => (
                <StageProgressBar
                  key={p.id}
                  project={p}
                  stage={stats.stageMap.get(p.id) ?? { pipeline: true, shop: false, build: false, launch: false }}
                  score={stats.scoreMap.get(p.id) ?? null}
                  onClick={() => onOpenProject(p)}
                  t={t}
                />
              ))}
            </div>
          </div>

          {/* 3-column grid: Quick Actions / Performance Ranking / Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Quick Actions */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Actions" title={t('dashboard.quickActions')} />
              <div className="grid grid-cols-2 gap-3">
                <QuickActionCard icon="+" label={t('dashboard.createPipeline')} onClick={onNewProject} />
                <QuickActionCard icon="⚙" label={t('dashboard.goToBuild')} onClick={() => onNavigate('deploy')} />
                <QuickActionCard icon="▶" label={t('dashboard.goToLaunch')} onClick={() => onNavigate('launch')} />
                <QuickActionCard icon="◈" label={t('dashboard.goToShop')} onClick={() => onNavigate('shop')} />
              </div>
            </div>

            {/* Performance Ranking */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Ranking" title={t('dashboard.performanceRanking')} badge={`${stats.ranked.length} scored`} />
              {stats.ranked.length > 0 ? (
                <div className="space-y-0.5">
                  {stats.ranked.map((r, i) => (
                    <PerformanceRankRow
                      key={r.project.id}
                      rank={i + 1}
                      project={r.project}
                      score={r.score}
                      onClick={() => onOpenProject(r.project)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-secondary/30 text-center py-6">
                  No scored projects yet
                </p>
              )}
            </div>

            {/* Activity Feed */}
            <div className="p-5 rounded-2xl border border-white/8 bg-component">
              <SectionHeader tag="Timeline" title={t('dashboard.activityFeed')} live />
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
        </>
      )}

      {/* ── Pipeline Grid ──────────────────────────────────── */}
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
              <ProjectCard
                key={project.id}
                project={project}
                stage={stats.stageMap.get(project.id) ?? { pipeline: true, shop: false, build: false, launch: false }}
                score={stats.scoreMap.get(project.id) ?? null}
                onOpen={onOpenProject}
              />
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
      </div>{/* end content panel */}
    </div>
  )
}
