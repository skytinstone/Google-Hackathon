import type { SavedProject } from '../types'
import { showToast } from '../utils/toast'
import { addLog } from '../utils/syslog'

interface Props {
  project: SavedProject
  onClose: () => void
  onDuplicate: (project: SavedProject) => void
  onDelete: (projectId: string) => void
}

export default function ProjectDetailModal({ project, onClose, onDuplicate, onDelete }: Props) {
  function handleDuplicate() {
    const copy: SavedProject = {
      ...project,
      id: `proj_${Date.now()}`,
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
    }
    onDuplicate(copy)
    showToast(`Duplicated "${project.name}"`, 'success')
    addLog(`Project duplicated · "${copy.name}"`, 'OK')
    onClose()
  }

  function handleDelete() {
    onDelete(project.id)
    showToast(`Deleted "${project.name}"`, 'info')
    addLog(`Project deleted · "${project.name}"`, 'ERR')
    onClose()
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), projects: [project] }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leviosai_${project.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Project exported', 'success')
  }

  const fields = [
    { label: 'Domain', value: project.domain, icon: '◈' },
    { label: 'Hardware', value: project.hardware, icon: '⬡' },
    { label: 'AI Model', value: project.model, icon: '◎' },
    { label: 'Language', value: project.language, icon: '⌨' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-component shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/6 bg-white/2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                No.{String(project.projectNo).padStart(3, '0')}
              </span>
              <h2 className="text-lg font-bold text-primary font-mono">{project.name}</h2>
            </div>
            <button onClick={onClose} className="text-secondary hover:text-primary transition-colors text-lg">✕</button>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs font-mono text-secondary/50">
            <span>{project.author}</span>
            <span>·</span>
            <span>{project.customDate || new Date(project.createdAt).toLocaleDateString()}</span>
            {project.ccAuthors.length > 0 && (
              <>
                <span>·</span>
                <span>+{project.ccAuthors.length} contributor{project.ccAuthors.length > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Description */}
          {project.description && (
            <p className="text-xs text-secondary leading-relaxed">{project.description}</p>
          )}

          {/* Config Summary */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => f.value && (
              <div key={f.label} className="p-3 rounded-xl border border-white/8 bg-background/40">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-secondary/40 text-xs">{f.icon}</span>
                  <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">{f.label}</p>
                </div>
                <p className="text-sm text-primary font-medium">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Sensors */}
          {project.sensors.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-2">Sensors ({project.sensors.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {project.sensors.map(s => (
                  <span key={s} className="px-2 py-1 text-[10px] font-mono text-accent bg-accent/8 border border-accent/15 rounded-lg">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Techniques */}
          {project.techniques.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-2">Techniques ({project.techniques.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {project.techniques.map(t => (
                  <span key={t} className="px-2 py-1 text-[10px] font-mono text-primary/70 bg-white/5 border border-white/8 rounded-lg">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/6 flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-white/8 text-secondary rounded-lg hover:border-accent/40 hover:text-primary transition-all"
          >
            ↓ Export
          </button>
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-white/8 text-secondary rounded-lg hover:border-accent/40 hover:text-primary transition-all"
          >
            ⊕ Duplicate
          </button>
          <div className="flex-1" />
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
