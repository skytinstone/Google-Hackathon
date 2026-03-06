import TypewriterText from '../TypewriterText'
import type { SavedProject } from '../../types'

interface Props {
  projects: SavedProject[]
  onNewPipeline: () => void
  onEditPipeline: (project: SavedProject) => void
  onDeletePipeline: (id: string) => void
}

export default function PipelineManagePage({ projects, onNewPipeline, onEditPipeline, onDeletePipeline }: Props) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono text-accent/60 uppercase tracking-widest mb-1">Project</p>
          <h1 className="text-2xl font-bold text-primary font-mono tracking-tight">
            <TypewriterText text="Pipeline Manager" speed={40} />
          </h1>
          <p className="text-xs text-secondary/50 font-mono mt-1">
            {projects.length} pipeline{projects.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <button
          onClick={onNewPipeline}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background font-semibold rounded-lg hover:bg-primary/85 transition-colors text-sm"
        >
          <span className="text-lg leading-none">+</span>
          New Pipeline
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-5">
            <span className="text-3xl text-secondary/30 font-mono">◈</span>
          </div>
          <p className="text-primary font-semibold text-base mb-1">No Pipelines Yet</p>
          <p className="text-xs text-secondary/50 font-mono mb-6">Create your first Edge AI pipeline to get started</p>
          <button
            onClick={onNewPipeline}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent/15 text-accent border border-accent/30 font-semibold rounded-lg hover:bg-accent/25 transition-colors text-sm"
          >
            <span className="text-lg leading-none">+</span>
            Create Pipeline
          </button>
        </div>
      )}

      {/* Pipeline cards grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <PipelineCard
              key={project.id}
              project={project}
              onEdit={() => onEditPipeline(project)}
              onDelete={() => onDeletePipeline(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PipelineCard({ project, onEdit, onDelete }: { project: SavedProject; onEdit: () => void; onDelete: () => void }) {
  const date = project.customDate || project.createdAt?.split('T')[0] || '--'
  const techCount = project.techniques?.length ?? 0

  return (
    <div
      onClick={onEdit}
      className="group relative p-5 rounded-2xl border border-white/8 bg-component hover:border-accent/30 hover:bg-white/[0.03] transition-all cursor-pointer"
    >
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-secondary/30 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 text-xs"
        title="Delete pipeline"
      >
        ✕
      </button>

      {/* Project number badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-mono font-bold text-accent/60 bg-accent/8 px-2 py-0.5 rounded">
          #{String(project.projectNo).padStart(3, '0')}
        </span>
        <span className="text-[9px] font-mono text-secondary/40">{date}</span>
      </div>

      {/* Name */}
      <h3 className="text-sm font-bold text-primary font-mono leading-snug mb-2 pr-6 truncate" title={project.name}>
        {project.name}
      </h3>

      {/* Description */}
      {project.description && (
        <p className="text-[11px] text-secondary/60 mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {project.domain && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-accent/8 text-accent/70 border border-accent/15">
            {project.domain}
          </span>
        )}
        {project.hardware && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/4 text-secondary/60 border border-white/8">
            {project.hardware}
          </span>
        )}
        {project.model && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-green-500/8 text-green-400/70 border border-green-500/15">
            {project.model}
          </span>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-[10px] font-mono text-secondary/40">
        {project.sensors?.length > 0 && (
          <span>{project.sensors.length} sensor{project.sensors.length !== 1 ? 's' : ''}</span>
        )}
        {techCount > 0 && (
          <span>{techCount} technique{techCount !== 1 ? 's' : ''}</span>
        )}
        <span>{project.language}</span>
      </div>

      {/* Author */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-secondary/40">{project.author}</span>
        <span className="text-[10px] font-mono text-accent/40 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to edit →
        </span>
      </div>
    </div>
  )
}
