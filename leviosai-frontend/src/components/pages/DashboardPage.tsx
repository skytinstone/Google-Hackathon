import type { SavedProject } from '../../types'

interface Props {
  projects: SavedProject[]
  onOpenProject: () => void
  onNewProject: () => void
}

function ProjectCard({ project, onOpen }: { project: SavedProject; onOpen: () => void }) {
  const displayDate = project.customDate
    ? new Date(project.customDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <button
      onClick={onOpen}
      className="text-left p-5 rounded-2xl border border-white/8 bg-component hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono text-secondary/40">No.{String(project.projectNo ?? 1).padStart(3, '0')}</span>
          </div>
          <p className="text-primary font-bold text-base group-hover:text-accent transition-colors truncate">{project.name}</p>
          <p className="text-xs text-secondary/60 font-mono mt-0.5">{displayDate} · {project.author || 'Unknown'}</p>
          {project.description && (
            <p className="text-xs text-secondary/50 mt-1 line-clamp-2 leading-relaxed">{project.description}</p>
          )}
        </div>
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-base">◈</span>
        </div>
      </div>

      {/* Badges */}
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

      {/* Sensors + techniques */}
      {project.sensors.length > 0 && (
        <p className="text-xs text-secondary/60 font-mono mb-1">
          <span className="text-secondary/40">Sensors:</span> {project.sensors.join(', ')}
        </p>
      )}
      {project.techniques.length > 0 && (
        <p className="text-xs text-secondary/60 font-mono">
          <span className="text-secondary/40">Tech:</span> {project.techniques.join(', ')}
        </p>
      )}

      {/* Language tag + arrow */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-[10px] font-mono text-secondary/50 uppercase tracking-wider">{project.language}</span>
        <span className="text-secondary/30 text-xs group-hover:text-accent transition-colors">↗</span>
      </div>
    </button>
  )
}

export default function DashboardPage({ projects, onOpenProject, onNewProject }: Props) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Dashboard</p>
          <h2 className="text-3xl font-bold text-primary">Your Projects</h2>
          <p className="text-secondary mt-2">
            {projects.length > 0
              ? `${projects.length} saved pipeline${projects.length !== 1 ? 's' : ''}`
              : 'No saved projects yet'}
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary/85 transition-colors text-sm flex-shrink-0 mt-1"
        >
          <span>+</span>
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-white/10 bg-white/2">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
            <img src="/leviosai.png" alt="" className="w-8 h-8 object-contain opacity-60" />
          </div>
          <p className="text-primary font-bold text-lg mb-2">No Projects Yet</p>
          <p className="text-secondary text-sm mb-6 text-center max-w-sm">
            Complete the 7-step Edge AI pipeline wizard and save your first project.
          </p>
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary/85 transition-colors"
          >
            <span>+</span>
            <span>Start a Project</span>
          </button>
        </div>
      ) : (
        /* Project grid */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} onOpen={onOpenProject} />
            ))}

            {/* New project card */}
            <button
              onClick={onNewProject}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-white/10 hover:border-accent/30 hover:bg-accent/3 transition-all duration-200 group min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:border-accent/30 transition-colors">
                <span className="text-secondary text-xl group-hover:text-accent transition-colors">+</span>
              </div>
              <p className="text-secondary text-sm font-mono group-hover:text-primary transition-colors">New Project</p>
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Projects', value: projects.length },
              { label: 'Domains Used', value: new Set(projects.map(p => p.domain).filter(Boolean)).size },
              { label: 'Hardware Configs', value: new Set(projects.map(p => p.hardware).filter(Boolean)).size },
              { label: 'Models Deployed', value: new Set(projects.map(p => p.model).filter(Boolean)).size },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-xl border border-white/6 bg-component text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
