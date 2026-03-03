import { useState, useRef } from 'react'
import type { KeyboardEvent } from 'react'

interface NewProjectFormData {
  name: string
  projectNo: number
  author: string
  ccAuthors: string[]
  customDate: string
  description: string
}

interface Props {
  nextProjectNo: number
  defaultAuthor: string
  onSubmit: (data: NewProjectFormData) => void
  onCancel: () => void
}

export default function NewProjectModal({ nextProjectNo, defaultAuthor, onSubmit, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [name, setName]             = useState('')
  const [author, setAuthor]         = useState(defaultAuthor)
  const [ccAuthors, setCcAuthors]   = useState<string[]>([])
  const [ccInput, setCcInput]       = useState('')
  const [customDate, setCustomDate] = useState(today)
  const [description, setDescription] = useState('')

  const ccRef = useRef<HTMLInputElement>(null)

  function addCc() {
    const val = ccInput.trim()
    if (val && !ccAuthors.includes(val)) {
      setCcAuthors(prev => [...prev, val])
    }
    setCcInput('')
  }

  function removeCc(cc: string) {
    setCcAuthors(prev => prev.filter(c => c !== cc))
  }

  function handleCcKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addCc()
    } else if (e.key === 'Backspace' && !ccInput && ccAuthors.length > 0) {
      setCcAuthors(prev => prev.slice(0, -1))
    }
  }

  function handleSubmit() {
    if (!name.trim() || !author.trim()) return
    onSubmit({
      name: name.trim(),
      projectNo: nextProjectNo,
      author: author.trim(),
      ccAuthors,
      customDate,
      description: description.trim(),
    })
  }

  const isValid = name.trim().length > 0 && author.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="relative w-full max-w-lg mx-4 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl animate-fade-in overflow-hidden">

        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
          <div>
            <p className="text-[10px] font-mono text-accent/70 uppercase tracking-widest mb-0.5">New Project</p>
            <h3 className="text-primary font-bold text-lg">Create Project</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-secondary/50 px-2.5 py-1 bg-white/4 border border-white/8 rounded-lg">
              No. {String(nextProjectNo).padStart(3, '0')}
            </span>
            <button
              onClick={onCancel}
              className="text-secondary hover:text-primary transition-colors text-sm leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Project Name */}
          <div>
            <label className="block text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Autonomous Vehicle Vision System"
              autoFocus
              className="w-full bg-background/60 border border-white/10 text-primary rounded-xl px-4 py-3 text-sm placeholder:text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors font-mono"
            />
          </div>

          {/* Author + Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-1.5">
                Author <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Your name"
                className="w-full bg-background/60 border border-white/10 text-primary rounded-xl px-4 py-3 text-sm placeholder:text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="w-full bg-background/60 border border-white/10 text-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors font-mono"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* CC Authors */}
          <div>
            <label className="block text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-1.5">
              CC (Contributors)
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[46px] bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-accent/50 transition-colors">
              {ccAuthors.map(cc => (
                <span
                  key={cc}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-accent/15 border border-accent/25 text-accent rounded-lg font-mono"
                >
                  {cc}
                  <button
                    onClick={() => removeCc(cc)}
                    className="text-accent/60 hover:text-accent leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                ref={ccRef}
                type="text"
                value={ccInput}
                onChange={e => setCcInput(e.target.value)}
                onKeyDown={handleCcKeyDown}
                onBlur={addCc}
                placeholder={ccAuthors.length === 0 ? 'Add names, press Enter…' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-primary text-sm placeholder:text-secondary/30 focus:outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-secondary/40 font-mono mt-1">Press Enter or comma to add multiple contributors</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the project goal and scope..."
              rows={3}
              className="w-full bg-background/60 border border-white/10 text-primary rounded-xl px-4 py-3 text-sm placeholder:text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors font-mono resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/6 bg-white/1">
          <p className="text-[10px] font-mono text-secondary/40">
            Auto No. <span className="text-accent/60">{String(nextProjectNo).padStart(3, '0')}</span>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-white/10 text-secondary text-sm font-mono rounded-lg hover:border-white/20 hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors flex items-center gap-2"
            >
              <span>Start Pipeline</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
