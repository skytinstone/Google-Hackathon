import { useState, useEffect, useRef, useMemo } from 'react'
import type { WizardState, SavedProject } from '../../types'
import { useI18n } from '../../utils/i18n'
import { useTheme } from '../../utils/theme'
import { addLog } from '../../utils/syslog'
import { showToast } from '../../utils/toast'
import { generateBom, getProductById } from '../../data/shopData'
import TypewriterText from '../TypewriterText'
import { getSdkSteps } from '../../data/deployData'

interface Props {
  state: WizardState
  savedProjects: SavedProject[]
  onGoToProject: () => void
}

type BuildTab = 'hardware' | 'software'

const TAB_LIST: { id: BuildTab; key: string; icon: string }[] = [
  { id: 'hardware', key: 'deploy.tabHardware', icon: '⬡' },
  { id: 'software', key: 'deploy.tabSoftware', icon: '⬢' },
]

/* ── localStorage helpers ── */
function loadJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveJson(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

/* ================================================================
   Reusable: Terminal Block
   ================================================================ */
function TerminalBlock({ title, subtitle, commands, estimatedTime }: {
  title: string; subtitle: string; commands: string[]; estimatedTime: string
}) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [copied, setCopied] = useState(false)

  function copyAll() {
    navigator.clipboard.writeText(commands.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-black/8' : 'border-white/6'}`}>
      <div className={`flex items-center justify-between px-4 py-2 ${isLight ? 'bg-gray-100' : 'bg-white/3'}`}>
        <div>
          <span className="text-xs font-mono font-bold text-primary">{title}</span>
          <span className="text-[9px] font-mono text-secondary/40 ml-2">{subtitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-secondary/30">{estimatedTime}</span>
          <button onClick={copyAll} className="text-[10px] font-mono text-accent hover:text-accent/80 transition-colors">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className={`px-4 py-3 font-mono text-xs leading-relaxed ${isLight ? 'bg-gray-50 text-black/70' : 'bg-[#060810] text-green-400/80'}`}>
        {commands.map((cmd, i) => (
          <div key={i} className="flex">
            <span className={isLight ? 'text-black/30 mr-2' : 'text-green-600/50 mr-2'}>$</span>
            <span>{cmd}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   Project Selector
   ================================================================ */
function ProjectSelector({ projects, onSelect, onGoToProject }: {
  projects: SavedProject[]; onSelect: (p: SavedProject) => void; onGoToProject: () => void
}) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <span className="text-4xl mb-4 opacity-20">⬡</span>
        <p className="text-sm font-mono text-secondary/50 mb-4">No saved pipelines yet</p>
        <button onClick={onGoToProject}
          className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors">
          Create Pipeline
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-4">Select a pipeline to build</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map(p => (
          <button key={p.id} onClick={() => onSelect(p)}
            className={`text-left p-4 rounded-xl border transition-all hover:border-accent/30 hover:scale-[1.01] ${isLight ? 'bg-white border-black/8' : 'bg-component border-white/6'}`}>
            <p className="text-sm font-mono font-bold text-primary truncate">{p.name}</p>
            <p className="text-[10px] font-mono text-secondary/50 mt-1 truncate">{p.hardware ?? 'No HW'} · {p.model ?? 'No model'}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ================================================================
   TAB: Hardware (Part List Management — DB-backed)
   ================================================================ */
const PART_CATEGORIES = ['Board', 'Sensor', 'Cable', 'Power', 'Frame', 'Accessory'] as const

interface AddPartForm {
  name: string; manufacturer: string; part_number: string; category: string
  qty: number; unit_price: number; supplier: string; datasheet: string; memo: string
}
const EMPTY_FORM: AddPartForm = { name: '', manufacturer: '', part_number: '', category: 'Accessory', qty: 1, unit_price: 0, supplier: '', datasheet: '', memo: '' }

function HardwareTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [parts, setParts] = useState<import('../../api/api').PartData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddPartForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('All')
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageTarget, setImageTarget] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { api } = await import('../../api/api')
        const data = await api.listParts(project.id)
        if (!cancelled) setParts(data)
      } catch {
        const saved = loadJson<import('../../api/api').PartData[]>(`leviosai_deploy_parts_${project.id}`, [])
        if (!cancelled) setParts(saved)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [project.id])

  useEffect(() => { if (!loading) saveJson(`leviosai_deploy_parts_${project.id}`, parts) }, [parts, loading, project.id])

  async function handleAddPart() {
    if (!form.name.trim()) { showToast('Part name is required', 'error'); return }
    setSaving(true)
    try {
      const { api } = await import('../../api/api')
      const created = await api.createPart({
        project_id: project.id, name: form.name.trim(), manufacturer: form.manufacturer.trim(),
        part_number: form.part_number.trim(), category: form.category, qty: form.qty,
        unit_price: form.unit_price, supplier: form.supplier.trim(), status: 'ordered',
        datasheet: form.datasheet.trim(), memo: form.memo.trim(), image: null,
      })
      setParts(prev => [...prev, created])
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast('Part added', 'success')
      addLog(`Part added: ${created.name}`, 'ACT')
    } catch {
      showToast('Failed to save — saved locally', 'error')
      const local: import('../../api/api').PartData = {
        id: Date.now(), project_id: project.id, name: form.name.trim(), manufacturer: form.manufacturer.trim(),
        part_number: form.part_number.trim(), category: form.category, qty: form.qty,
        unit_price: form.unit_price, supplier: form.supplier.trim(), status: 'ordered',
        datasheet: form.datasheet.trim(), memo: form.memo.trim(), image: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setParts(prev => [...prev, local])
      setForm(EMPTY_FORM)
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleUpdatePart(id: number, updates: import('../../api/api').PartUpdateData) {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    try {
      const { api } = await import('../../api/api')
      await api.updatePart(id, updates)
    } catch { /* offline */ }
  }

  async function handleDeletePart(id: number) {
    setParts(prev => prev.filter(p => p.id !== id))
    try {
      const { api } = await import('../../api/api')
      await api.deletePart(id)
    } catch { /* offline */ }
    showToast('Part removed', 'success')
  }

  async function autoBom() {
    if (!state.hardware) return
    const bom = generateBom(state)
    const items = bom.map(b => {
      const prod = getProductById(b.productId)
      return {
        project_id: project.id, name: prod?.name ?? b.productId, manufacturer: '',
        part_number: b.productId, category: 'Board' as string, qty: b.quantity,
        unit_price: 0, supplier: '', status: 'ordered', datasheet: '', memo: 'Auto from BOM', image: null,
      }
    })
    try {
      const { api } = await import('../../api/api')
      const created = await api.bulkCreateParts(project.id, items)
      setParts(prev => [...prev, ...created])
    } catch {
      const locals = items.map((it, i) => ({ ...it, id: Date.now() + i, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
      setParts(prev => [...prev, ...locals])
    }
    showToast(`${bom.length} parts added from BOM`, 'success')
  }

  function exportCsv() {
    const header = 'Name,Manufacturer,Part Number,Category,Qty,Unit Price,Supplier,Status,Datasheet,Memo'
    const rows = parts.map(p =>
      `"${p.name}","${p.manufacturer}","${p.part_number}","${p.category}",${p.qty},${p.unit_price},"${p.supplier}","${p.status}","${p.datasheet}","${p.memo}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project.name}_partlist.csv`; a.click()
    showToast('Part list exported', 'success')
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || imageTarget === null) return
    const reader = new FileReader()
    reader.onload = ev => { handleUpdatePart(imageTarget, { image: ev.target?.result as string }); setImageTarget(null) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const STATUS_COLORS: Record<string, string> = {
    ordered: isLight ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    arrived: isLight ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    assembled: isLight ? 'text-green-600 bg-green-50 border-green-200' : 'text-green-400 bg-green-500/10 border-green-500/20',
  }

  const filtered = filterCat === 'All' ? parts : parts.filter(p => p.category === filterCat)
  const totalCost = parts.reduce((s, p) => s + p.unit_price * p.qty, 0)

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-[#060810] border-white/10'} text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50`
  const labelCls = 'text-[10px] font-mono text-secondary/60 uppercase tracking-wider mb-1'

  if (loading) return <p className="text-center py-12 text-xs font-mono text-secondary/40 animate-pulse">Loading parts...</p>

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${isLight ? 'bg-gray-50 border-black/6' : 'bg-white/[0.02] border-white/6'}`}>
        <div className="flex items-center gap-6 text-xs font-mono">
          <span className="text-secondary/60">Parts: <span className="text-primary font-bold">{parts.length}</span></span>
          <span className="text-secondary/60">Total Cost: <span className="text-accent font-bold">${totalCost.toFixed(2)}</span></span>
          <span className="text-secondary/60">Assembled: <span className="text-green-400 font-bold">{parts.filter(p => p.status === 'assembled').length}/{parts.length}</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowForm(true)} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-accent border border-accent/30 hover:bg-accent/10 transition-colors">+ {t('deploy.addPart')}</button>
        {state.hardware && parts.length === 0 && (
          <button onClick={autoBom} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors">Auto BOM</button>
        )}
        <button onClick={exportCsv} className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${isLight ? 'text-black/40 border border-black/10 hover:bg-black/5' : 'text-secondary/50 border border-white/10 hover:bg-white/5'}`}>{t('deploy.exportCsv')}</button>
        <div className="ml-auto flex gap-1">
          {['All', ...PART_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${filterCat === cat ? 'bg-accent/20 text-accent border border-accent/30' : (isLight ? 'text-black/30 hover:bg-black/5' : 'text-secondary/30 hover:bg-white/5')}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add Part Form */}
      {showForm && (
        <div className={`rounded-xl border p-5 space-y-4 ${isLight ? 'bg-white border-black/8' : 'bg-[#0a0c14] border-white/8'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-mono font-bold text-primary">Add New Part</p>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="text-secondary/40 hover:text-primary text-xs">✕</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div><p className={labelCls}>Name *</p><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Jetson AGX Orin" className={inputCls} /></div>
            <div><p className={labelCls}>Manufacturer</p><input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. NVIDIA" className={inputCls} /></div>
            <div><p className={labelCls}>Part Number</p><input value={form.part_number} onChange={e => setForm(f => ({ ...f, part_number: e.target.value }))} placeholder="e.g. 900-13701-0040" className={inputCls} /></div>
            <div><p className={labelCls}>Category</p>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                {PART_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><p className={labelCls}>Qty</p><input type="number" min={1} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: parseInt(e.target.value) || 1 }))} className={inputCls} /></div>
            <div><p className={labelCls}>Unit Price ($)</p><input type="number" min={0} step={0.01} value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))} className={inputCls} /></div>
            <div><p className={labelCls}>Supplier</p><input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Amazon, Mouser" className={inputCls} /></div>
            <div><p className={labelCls}>Datasheet URL</p><input value={form.datasheet} onChange={e => setForm(f => ({ ...f, datasheet: e.target.value }))} placeholder="https://..." className={inputCls} /></div>
          </div>
          <div><p className={labelCls}>Memo</p><input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="Optional notes..." className={inputCls} /></div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className={`px-4 py-2 rounded-lg text-xs font-mono ${isLight ? 'text-black/40 hover:bg-black/5' : 'text-secondary/40 hover:bg-white/5'} transition-colors`}>Cancel</button>
            <button onClick={handleAddPart} disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Part'}
            </button>
          </div>
        </div>
      )}

      {/* Part List Table */}
      <div className={`rounded-xl border overflow-x-auto ${isLight ? 'border-black/8' : 'border-white/6'}`}>
        <table className="w-full text-xs font-mono min-w-[900px]">
          <thead>
            <tr className={isLight ? 'bg-gray-100' : 'bg-white/3'}>
              <th className="text-left px-3 py-2 text-secondary/60">Name</th>
              <th className="text-left px-2 py-2 text-secondary/60">Manufacturer</th>
              <th className="text-left px-2 py-2 text-secondary/60">Part #</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-20">Category</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-14">Qty</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-20">Price</th>
              <th className="text-left px-2 py-2 text-secondary/60">Supplier</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-24">Status</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-10">Doc</th>
              <th className="text-center px-2 py-2 text-secondary/60 w-12">Photo</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(part => (
              <tr key={part.id} className={`border-t ${isLight ? 'border-black/5 hover:bg-black/[0.02]' : 'border-white/5 hover:bg-white/[0.02]'} transition-colors`}>
                <td className="px-3 py-2 text-primary font-bold">{part.name}</td>
                <td className="px-2 py-2 text-secondary/70">{part.manufacturer || '—'}</td>
                <td className="px-2 py-2 text-secondary/50 text-[10px]">{part.part_number || '—'}</td>
                <td className="text-center px-2 py-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-black/5 text-black/50' : 'bg-white/5 text-secondary/50'}`}>{part.category}</span>
                </td>
                <td className="text-center px-2 py-2">
                  <input type="number" value={part.qty} min={1} onChange={e => handleUpdatePart(part.id, { qty: parseInt(e.target.value) || 1 })}
                    className={`w-12 text-center rounded border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-background/60 border-white/10'} text-primary`} />
                </td>
                <td className="text-center px-2 py-2 text-accent font-bold">{part.unit_price > 0 ? `$${part.unit_price.toFixed(2)}` : '—'}</td>
                <td className="px-2 py-2 text-secondary/60 text-[10px]">{part.supplier || '—'}</td>
                <td className="text-center px-2 py-2">
                  <select value={part.status} onChange={e => handleUpdatePart(part.id, { status: e.target.value })}
                    className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${STATUS_COLORS[part.status] ?? ''} cursor-pointer`}>
                    <option value="ordered">Ordered</option>
                    <option value="arrived">Arrived</option>
                    <option value="assembled">Assembled</option>
                  </select>
                </td>
                <td className="text-center px-2 py-2">
                  {part.datasheet ? (
                    <a href={part.datasheet} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-[10px]">PDF</a>
                  ) : <span className="text-secondary/20">—</span>}
                </td>
                <td className="text-center px-2 py-2">
                  {part.image ? (
                    <img src={part.image} alt="" className="w-8 h-8 rounded object-cover mx-auto cursor-pointer hover:scale-150 transition-transform" />
                  ) : (
                    <button onClick={() => { setImageTarget(part.id); fileRef.current?.click() }}
                      className="text-[10px] text-secondary/40 hover:text-accent transition-colors">+</button>
                  )}
                </td>
                <td className="px-1">
                  <button onClick={() => handleDeletePart(part.id)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-xs font-mono text-secondary/30">{parts.length === 0 ? 'No parts added yet' : 'No parts in this category'}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  )
}

/* ================================================================
   TAB: Software (Packages + Code + Tools — DB-backed)
   ================================================================ */
interface LocalPkg { id: number; name: string; version: string; latest: string; category: string }

const DEFAULT_PY_PACKAGES: Omit<LocalPkg, 'id'>[] = [
  { name: 'torch', version: '2.4.0', latest: '2.4.0', category: 'runtime' },
  { name: 'torchvision', version: '0.19.0', latest: '0.19.0', category: 'runtime' },
  { name: 'opencv-python', version: '4.10.0', latest: '4.10.0', category: 'runtime' },
  { name: 'numpy', version: '1.26.4', latest: '2.0.0', category: 'runtime' },
  { name: 'ultralytics', version: '8.2.0', latest: '8.3.0', category: 'framework' },
  { name: 'onnxruntime', version: '1.18.0', latest: '1.19.0', category: 'runtime' },
]

const DEFAULT_CPP_PACKAGES: Omit<LocalPkg, 'id'>[] = [
  { name: 'CMake', version: '3.28', latest: '3.30', category: 'build' },
  { name: 'OpenCV', version: '4.9.0', latest: '4.10.0', category: 'runtime' },
  { name: 'TensorRT', version: '8.6', latest: '10.0', category: 'runtime' },
  { name: 'CUDA Toolkit', version: '12.4', latest: '12.6', category: 'runtime' },
]

function SoftwareTab({ project, state }: { project: SavedProject; state: WizardState }) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const gitKey = `leviosai_deploy_git_${project.id}`

  const [packages, setPackages] = useState<LocalPkg[]>([])
  const [loading, setLoading] = useState(true)
  const [gitUrl, setGitUrl] = useState(() => loadJson(gitKey, ''))
  const [newPkg, setNewPkg] = useState('')
  const [saving, setSaving] = useState(false)

  // Load from backend
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { api } = await import('../../api/api')
        const data = await api.listPackages(project.id)
        if (!cancelled) setPackages(data.map(d => ({ id: d.id, name: d.name, version: d.version, latest: d.latest, category: d.category })))
      } catch {
        const saved = loadJson<LocalPkg[]>(`leviosai_deploy_packages_${project.id}`, [])
        if (!cancelled) setPackages(saved)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [project.id])

  // Backup to localStorage
  useEffect(() => { if (!loading) saveJson(`leviosai_deploy_packages_${project.id}`, packages) }, [packages, loading, project.id])
  useEffect(() => { saveJson(gitKey, gitUrl) }, [gitUrl, gitKey])

  const sdkSteps = useMemo(() => state.hardware ? getSdkSteps(state.hardware.category, state.language) : [], [state.hardware, state.language])

  async function addPackage() {
    if (!newPkg.trim()) return
    setSaving(true)
    try {
      const { api } = await import('../../api/api')
      const created = await api.createPackage({ project_id: project.id, name: newPkg.trim(), version: '—', latest: '—', category: 'runtime' })
      setPackages(prev => [...prev, { id: created.id, name: created.name, version: created.version, latest: created.latest, category: created.category }])
    } catch {
      setPackages(prev => [...prev, { id: Date.now(), name: newPkg.trim(), version: '—', latest: '—', category: 'runtime' }])
    }
    setNewPkg('')
    setSaving(false)
  }

  async function deletePackage(id: number) {
    setPackages(prev => prev.filter(p => p.id !== id))
    try { const { api } = await import('../../api/api'); await api.deletePackage(id) } catch { /* offline */ }
  }

  async function autoPopulateDefaults() {
    const defaults = state.language.includes('C++') ? DEFAULT_CPP_PACKAGES : DEFAULT_PY_PACKAGES
    try {
      const { api } = await import('../../api/api')
      const items = defaults.map(d => ({ project_id: project.id, ...d }))
      const created = await api.bulkCreatePackages(project.id, items)
      setPackages(prev => [...prev, ...created.map(c => ({ id: c.id, name: c.name, version: c.version, latest: c.latest, category: c.category }))])
    } catch {
      const locals = defaults.map((d, i) => ({ id: Date.now() + i, ...d }))
      setPackages(prev => [...prev, ...locals])
    }
    showToast(`${defaults.length} default packages added`, 'success')
  }

  function downloadCode() {
    if (!state.generatedCode) { showToast('No generated code available', 'info'); return }
    const ext = state.language.includes('C++') ? 'cpp' : state.language.includes('.ipynb') ? 'ipynb' : 'py'
    const blob = new Blob([state.generatedCode], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project.name}_main.${ext}`; a.click()
    showToast('Code downloaded', 'success')
  }

  if (loading) return <p className="text-center py-12 text-xs font-mono text-secondary/40 animate-pulse">Loading packages...</p>

  return (
    <div className="space-y-5">
      {/* Package Registry */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">Package Registry</p>
        <div className="flex items-center gap-2 mb-3">
          <input value={newPkg} onChange={e => setNewPkg(e.target.value)} placeholder="Package name..."
            onKeyDown={e => e.key === 'Enter' && addPackage()}
            className={`px-3 py-2 rounded-lg border text-xs font-mono ${isLight ? 'bg-white border-black/10' : 'bg-background/60 border-white/10'} text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50`} />
          <button onClick={addPackage} disabled={saving} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-accent border border-accent/30 hover:bg-accent/10 transition-colors disabled:opacity-50">{t('deploy.addPackage')}</button>
          {packages.length === 0 && (
            <button onClick={autoPopulateDefaults} className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors">Auto Defaults</button>
          )}
        </div>
        <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-black/8' : 'border-white/6'}`}>
          <table className="w-full text-xs font-mono">
            <thead><tr className={isLight ? 'bg-gray-100' : 'bg-white/3'}>
              <th className="text-left px-4 py-2 text-secondary/60">Package</th>
              <th className="text-center px-3 py-2 text-secondary/60">Current</th>
              <th className="text-center px-3 py-2 text-secondary/60">Latest</th>
              <th className="text-center px-3 py-2 text-secondary/60 w-20">Category</th>
              <th className="text-center px-3 py-2 text-secondary/60 w-16">Status</th>
              <th className="w-8" />
            </tr></thead>
            <tbody>
              {packages.map(pkg => {
                const upToDate = pkg.version === pkg.latest || pkg.latest === '—'
                return (
                  <tr key={pkg.id} className={`border-t ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                    <td className="px-4 py-2 text-primary font-bold">{pkg.name}</td>
                    <td className="text-center px-3 py-2 text-secondary">{pkg.version}</td>
                    <td className="text-center px-3 py-2 text-secondary/60">{pkg.latest}</td>
                    <td className="text-center px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-black/5 text-black/50' : 'bg-white/5 text-secondary/50'}`}>{pkg.category}</span>
                    </td>
                    <td className="text-center px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${upToDate ? (isLight ? 'bg-green-50 text-green-600' : 'bg-green-500/10 text-green-400') : (isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400')}`}>
                        {upToDate ? 'OK' : 'UPDATE'}
                      </span>
                    </td>
                    <td className="px-1">
                      <button onClick={() => deletePackage(pkg.id)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {packages.length === 0 && <p className="text-center py-6 text-xs font-mono text-secondary/30">No packages added yet</p>}
        </div>
      </div>

      {/* External Tools */}
      <div>
        <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">External Tools</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={() => window.open(`vscode://file/${project.name}`, '_blank')}
            className={`p-4 rounded-xl border text-left transition-all hover:border-accent/30 ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
            <span className="text-lg">⌨</span>
            <p className="text-xs font-mono font-bold text-primary mt-2">{t('deploy.openVscode')}</p>
            <p className="text-[9px] font-mono text-secondary/40 mt-0.5">vscode:// URI</p>
          </button>
          <button onClick={downloadCode}
            className={`p-4 rounded-xl border text-left transition-all hover:border-accent/30 ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
            <span className="text-lg">↓</span>
            <p className="text-xs font-mono font-bold text-primary mt-2">{t('deploy.downloadCode')}</p>
            <p className="text-[9px] font-mono text-secondary/40 mt-0.5">{state.language}</p>
          </button>
          <div className={`p-4 rounded-xl border ${isLight ? 'border-black/8 bg-white' : 'border-white/6 bg-component'}`}>
            <span className="text-lg">⎇</span>
            <p className="text-xs font-mono font-bold text-primary mt-2">GitHub</p>
            <input value={gitUrl} onChange={e => setGitUrl(e.target.value)} placeholder="https://github.com/..."
              className={`w-full mt-1.5 px-2 py-1 rounded border text-[10px] font-mono ${isLight ? 'bg-gray-50 border-black/8' : 'bg-background/60 border-white/8'} text-primary placeholder:text-secondary/30`} />
          </div>
        </div>
      </div>

      {/* SDK Commands */}
      {sdkSteps.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">SDK Commands</p>
          <div className="space-y-3">
            {sdkSteps.slice(0, 3).map(step => (
              <TerminalBlock key={step.id} title={step.title} subtitle={step.subtitle} commands={step.commands} estimatedTime={step.estimatedTime} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   MAIN: DeployPage (Build)
   ================================================================ */
export default function DeployPage({ state, savedProjects, onGoToProject }: Props) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null)
  const [activeTab, setActiveTab] = useState<BuildTab>('hardware')

  function handleSelectProject(p: SavedProject) {
    setSelectedProject(p)
    setActiveTab('hardware')
    addLog(`Build: loaded pipeline "${p.name}"`, 'NAV')
  }

  if (!selectedProject) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[10px] font-semibold text-accent/70 uppercase tracking-[0.25em] font-mono mb-2">LeviosAI · Build Console</p>
            <h2 className="text-3xl font-bold text-primary font-mono tracking-tight">
              <TypewriterText text={t('deploy.tabHardware').includes('하드웨어') ? 'Build Console' : 'Build Console'} speed={45} showCursor />
            </h2>
          </div>
          <ProjectSelector projects={savedProjects} onSelect={handleSelectProject} onGoToProject={onGoToProject} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-1">Build</p>
            <h1 className="text-2xl font-bold text-primary font-mono tracking-tight">
              <TypewriterText text={selectedProject.name} speed={30} />
            </h1>
            <p className="text-xs font-mono text-secondary/50 mt-1">
              {selectedProject.hardware ?? 'No hardware'} · {selectedProject.model ?? 'No model'} · {selectedProject.language}
            </p>
          </div>
          <button onClick={() => setSelectedProject(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${isLight ? 'text-black/40 border border-black/10 hover:bg-black/5' : 'text-secondary/50 border border-white/10 hover:bg-white/5'}`}>
            ← Projects
          </button>
        </div>
      </div>

      <div className={`border-b flex-shrink-0 ${isLight ? 'border-black/8' : 'border-white/6'}`}>
        <div className="max-w-6xl mx-auto flex items-center gap-1 px-6 pb-3">
          {TAB_LIST.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : isLight ? 'text-black/40 border border-transparent hover:bg-black/5' : 'text-secondary/40 border border-transparent hover:bg-white/5'
              }`}>
              <span className="text-[10px]">{tab.icon}</span>
              {t(tab.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'hardware' && <HardwareTab project={selectedProject} state={state} />}
          {activeTab === 'software' && <SoftwareTab project={selectedProject} state={state} />}
        </div>
      </div>
    </div>
  )
}
