import { useState, useRef, useEffect } from 'react'
import type { StepProps, SelectedTechnique } from '../../types'
import { api, FILE_FORMATS, DOMAINS, HARDWARE, MODELS, TECHNIQUES_BY_DOMAIN, TECHNIQUES, hasApiKey, callGeminiDirect } from '../../api/api'
import TypewriterText from '../TypewriterText'
import { addLog } from '../../utils/syslog'
import ResizableSplit from '../ResizableSplit'

interface FileFormat { lang: string; ext: string; label: string }
type EditSection = 'domain' | 'hardware' | 'model' | 'techniques' | null
interface ChatMsg { role: 'user' | 'bot'; text: string }

// ── File Format Dropdown ──────────────────────────────────────
function FormatSelect({ value, onChange }: { value: FileFormat; onChange: (f: FileFormat) => void }) {
  return (
    <div>
      <label className="text-xs text-secondary uppercase tracking-wider font-semibold block mb-2">Output Format</label>
      <select
        value={`${value.lang}|${value.ext}`}
        onChange={e => {
          const [lang, ext] = e.target.value.split('|')
          const found = FILE_FORMATS.find(f => f.lang === lang && f.ext === ext)
          if (found) onChange(found)
        }}
        className="w-full bg-component border border-white/10 text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
      >
        {FILE_FORMATS.map(f => (
          <option key={`${f.lang}|${f.ext}`} value={`${f.lang}|${f.ext}`}>{f.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Inline Config Editor ──────────────────────────────────────
function ConfigEditor({ state, updateState }: Pick<StepProps, 'state' | 'updateState' | 'goToStep'>) {
  const [open, setOpen] = useState<EditSection>(null)
  function toggle(s: EditSection) { setOpen(prev => prev === s ? null : s) }
  const domainModels = state.domain ? (MODELS[state.domain] ?? []) : []
  const availableTechs = (state.domain && TECHNIQUES_BY_DOMAIN[state.domain]) ? TECHNIQUES_BY_DOMAIN[state.domain] : TECHNIQUES

  function setDomain(name: string) { updateState({ domain: name, generatedCode: null }); setOpen(null) }
  function setHardware(category: string, device: { id: string; name: string; specs: string }) {
    updateState({ hardware: { category, device: device.name, specs: device.specs }, generatedCode: null }); setOpen(null)
  }
  function setModel(model: { id: string; name: string; params: string; description: string }) {
    updateState({ model, compatibilityResult: null, generatedCode: null }); setOpen(null)
  }
  function toggleTech(techId: string, techName: string) {
    const has = state.techniques.some(t => t.id === techId)
    updateState({
      techniques: has
        ? state.techniques.filter(t => t.id !== techId)
        : [...state.techniques, { id: techId, name: techName, subtype: null } as SelectedTechnique],
      generatedCode: null,
    })
  }

  const rows: { key: EditSection; label: string; value: string }[] = [
    { key: 'domain',     label: 'Domain',     value: state.domain ?? '—' },
    { key: 'hardware',   label: 'Hardware',   value: state.hardware?.device ?? '—' },
    { key: 'model',      label: 'AI Model',   value: state.model ? `${state.model.name} (${state.model.params})` : '—' },
    { key: 'techniques', label: 'Techniques', value: state.techniques.length > 0 ? state.techniques.map(t => t.name).join(', ') : '—' },
  ]

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/2 border-b border-white/6">
        <p className="text-xs font-mono text-secondary/60 uppercase tracking-wider">Configuration</p>
        <p className="text-[10px] text-secondary/40 font-mono">Edit inline</p>
      </div>

      {rows.map(row => {
        const isOpen = open === row.key
        return (
          <div key={row.key} className="border-b border-white/5 last:border-0">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-[10px] font-mono text-secondary/50 uppercase tracking-wider">{row.label}</p>
                <p className="text-xs text-accent font-medium mt-0.5 truncate" title={row.value}>{row.value}</p>
              </div>
              <button
                onClick={() => toggle(row.key)}
                className={[
                  'flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono transition-all duration-200 flex-shrink-0',
                  isOpen ? 'border-white/20 text-primary bg-white/8' : 'border-white/8 text-secondary hover:border-white/20',
                ].join(' ')}
              >
                {isOpen ? '▲' : '▼'}
              </button>
            </div>

            <div style={{ maxHeight: isOpen ? '280px' : '0px', overflow: 'hidden', transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1)' }}>
              <div className="px-4 pb-3 border-t border-white/5 bg-white/1">
                {row.key === 'domain' && (
                  <div className="pt-2 space-y-1">
                    {DOMAINS.map(d => (
                      <button key={d.id} onClick={() => setDomain(d.name)}
                        className={['w-full text-left px-3 py-2 rounded-lg border transition-all text-xs flex items-center gap-2',
                          state.domain === d.name ? 'bg-accent/10 border-accent/40 text-primary' : 'border-white/6 text-secondary hover:border-white/20'].join(' ')}>
                        <span className="w-6 h-6 rounded bg-white/6 flex items-center justify-center font-mono font-bold flex-shrink-0">{d.id.toUpperCase()}</span>
                        <span className="font-semibold">{d.name}</span>
                        {state.domain === d.name && <span className="ml-auto text-green-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
                {row.key === 'hardware' && (
                  <div className="pt-2 space-y-2 overflow-y-auto max-h-[220px]">
                    {Object.entries(HARDWARE).map(([cat, data]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-mono text-secondary/50 uppercase tracking-wider mb-1">{cat}</p>
                        <div className="grid grid-cols-1 gap-1">
                          {data.devices.map(dev => (
                            <button key={dev.id} onClick={() => setHardware(cat, dev)}
                              className={['text-left px-3 py-1.5 rounded border text-xs transition-all',
                                state.hardware?.device === dev.name ? 'bg-accent/10 border-accent/40 text-primary' : 'border-white/6 text-secondary hover:border-white/20'].join(' ')}>
                              <span className="font-semibold">{dev.name}</span>
                              <span className="text-secondary/60 ml-2">{dev.specs}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {row.key === 'model' && (
                  <div className="pt-2 space-y-1 overflow-y-auto max-h-[220px]">
                    {domainModels.length > 0 ? domainModels.map(m => (
                      <button key={m.id} onClick={() => setModel(m)}
                        className={['w-full text-left px-3 py-2 rounded-lg border transition-all text-xs flex items-center justify-between',
                          state.model?.id === m.id ? 'bg-accent/10 border-accent/40 text-primary' : 'border-white/6 text-secondary hover:border-white/20'].join(' ')}>
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-secondary/60">{m.params}</span>
                      </button>
                    )) : <p className="text-xs text-secondary py-2">Select a domain first</p>}
                  </div>
                )}
                {row.key === 'techniques' && (
                  <div className="pt-2 space-y-1">
                    {availableTechs.map(tech => {
                      const enabled = state.techniques.some(t => t.id === tech.id)
                      return (
                        <button key={tech.id} onClick={() => toggleTech(tech.id, tech.name)}
                          className={['w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs',
                            enabled ? 'bg-accent/8 border-accent/30' : 'border-white/6 hover:border-white/20'].join(' ')}>
                          <span className={['w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors',
                            enabled ? 'bg-accent/30 border-accent/60 text-accent' : 'border-white/20'].join(' ')}>{enabled && '✓'}</span>
                          <span className="font-semibold text-primary">{tech.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Code Modification Chat ────────────────────────────────────
function CodeModChat({ code, context, onCodeUpdate }: { code: string; context: string; onCodeUpdate: (c: string) => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ role: 'bot', text: 'Describe what to modify.' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function submit() {
    const text = input.trim(); if (!text || loading) return
    setMsgs(m => [...m, { role: 'user', text }]); setInput(''); setLoading(true)
    try {
      const system = 'Apply the modification and return ONLY the complete modified code without markdown fences.'
      const prompt = `Code (${context}):\n\`\`\`\n${code}\n\`\`\`\n\nModification: ${text}\n\nReturn only the complete modified code:`
      const raw = await callGeminiDirect(system, prompt, 0.2)
      const cleaned = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
      onCodeUpdate(cleaned)
      setMsgs(m => [...m, { role: 'bot', text: 'Done! Code updated.' }])
    } catch (e) {
      setMsgs(m => [...m, { role: 'bot', text: e instanceof Error ? e.message : 'Failed.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden mt-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/2 border-b border-white/6">
        <img src="/leviosai.png" alt="" className="w-3.5 h-3.5 object-contain opacity-60" />
        <p className="text-[10px] font-mono text-secondary uppercase tracking-wider">Code Mod Chat</p>
        <span className="ml-auto text-[10px] text-secondary/40 font-mono">AI Chat</span>
      </div>
      <div className="max-h-36 overflow-y-auto p-3 space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={['flex gap-2', m.role === 'user' ? 'flex-row-reverse' : ''].join(' ')}>
            {m.role === 'bot' && <img src="/leviosai.png" alt="" className="w-4 h-4 object-contain opacity-50 flex-shrink-0 mt-0.5" />}
            <div className={['max-w-[88%] px-2.5 py-1.5 rounded-lg text-xs',
              m.role === 'bot' ? 'bg-white/4 border border-white/6 text-secondary' : 'bg-primary/10 border border-primary/15 text-primary'].join(' ')}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5 px-2.5 py-1.5">
            {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-secondary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 px-3 pb-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
          placeholder="e.g. Add batch processing..."
          className="flex-1 bg-background/60 border border-white/10 text-primary text-xs rounded-lg px-2.5 py-2 placeholder:text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors font-mono" />
        <button onClick={submit} disabled={!input.trim() || loading}
          className="px-2.5 py-2 bg-primary text-background text-xs font-bold rounded-lg disabled:opacity-30 hover:bg-primary/85 transition-colors">
          ↑
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Step5CodeGen({ state, updateState, goToStep }: StepProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)
  const [format, setFormat]         = useState<FileFormat>(FILE_FORMATS[0])

  async function generateCode() {
    if (!state.domain || !state.hardware || !state.model) return
    if (!hasApiKey()) { return }
    setGenerating(true); setError(null)
    addLog(`Generating ${format.lang} inference code · ${state.model.name} on ${state.hardware.device}`, 'GEN')
    try {
      const result = await api.generateCode({
        domain: state.domain,
        hardware_category: state.hardware.category,
        hardware_device: state.hardware.device,
        model_name: state.model.name,
        techniques: state.techniques.map(t => ({ id: t.id, name: t.name, subtype: t.subtype ?? undefined })),
        language: format.lang,
      })
      updateState({ generatedCode: result.code, language: format.lang })
      const lines = result.code.split('\n').length
      addLog(`Code synthesis complete · ${lines} lines generated · ready for deployment`, 'OK')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code generation failed')
      addLog('Code synthesis failed · check API key and configuration', 'ERR')
    } finally { setGenerating(false) }
  }

  function copyCode() {
    if (!state.generatedCode) return
    navigator.clipboard.writeText(state.generatedCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => undefined)
  }

  function downloadCode() {
    if (!state.generatedCode) return
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const hw   = (state.hardware?.device ?? 'hw').replace(/\s+/g, '_').replace(/[^\w]/g, '')
    const mdl  = (state.model?.name ?? 'model').replace(/\s+/g, '_').replace(/[^\w]/g, '')
    const filename = `${date}_${hw}_${mdl}.${format.ext}`
    const blob = new Blob([state.generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: filename }).click()
    URL.revokeObjectURL(url)
  }

  function openGitHubGist() {
    navigator.clipboard.writeText(state.generatedCode ?? '').catch(() => undefined)
    window.open('https://gist.github.com/', '_blank')
  }

  const codeContext = `${state.domain} · ${state.model?.name} · ${state.hardware?.device}`

  return (
    <div className="h-full flex flex-col">
      {/* Header + Next button */}
      <div className="mb-4 flex-shrink-0 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 6 of 7</p>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight"><TypewriterText text="Generate Code" speed={40} /></h2>
          <p className="text-secondary mt-1">Edit configuration inline · generate · download</p>
        </div>
        <button
          onClick={() => goToStep(7)}
          disabled={!state.generatedCode}
          className="flex-shrink-0 px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors mr-[610px] mt-[60px]"
        >
          Next: Complete →
        </button>
      </div>

      {/* Split layout */}
      <ResizableSplit
        className="mr-[360px]"
        defaultLeftPercent={40}
        left={
        <div className="flex flex-col">
          <ConfigEditor state={state} updateState={updateState} goToStep={goToStep} />

          <FormatSelect value={format} onChange={f => { setFormat(f); updateState({ generatedCode: null }) }} />

          <button
            onClick={generateCode}
            disabled={generating}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors text-sm"
          >
            {generating
              ? <><span className="animate-spin">⟳</span>Generating...</>
              : 'Generate Code'}
          </button>

          {error && (
            <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg">{error}</p>
          )}
        </div>
        }
        right={
        <div className="flex flex-col h-full">
          {state.generatedCode ? (
            <div className="flex flex-col h-full animate-fade-in">
              {/* Code block */}
              <div className="rounded-xl border border-white/10 overflow-hidden flex flex-col flex-1 min-h-0">
                {/* Code header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/3 border-b border-white/8 flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs text-secondary font-mono">
                    <span>{format.label}</span>
                    <span>·</span>
                    <span>{state.model?.name}</span>
                    <span>·</span>
                    <span>{state.hardware?.device}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={copyCode} className="flex items-center gap-1 text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-white/8 hover:border-white/20 transition-all">
                      {copied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                    <button onClick={downloadCode} className="flex items-center gap-1 text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-white/8 hover:border-white/20 transition-all">
                      ↓ Download
                    </button>
                    <button onClick={openGitHubGist} className="flex items-center gap-1 text-xs text-secondary hover:text-primary px-2 py-1 rounded border border-white/8 hover:border-white/20 transition-all">
                      ⌥ Gist
                    </button>
                  </div>
                </div>
                <pre className="flex-1 overflow-auto text-xs leading-relaxed font-mono bg-background/60">
                  <code className="flex">
                    <span className="flex flex-col text-right pr-4 pl-4 py-4 text-secondary/30 select-none border-r border-white/5 flex-shrink-0 sticky left-0 bg-background/60">
                      {state.generatedCode?.split('\n').map((_, i) => (
                        <span key={i}>{i + 1}</span>
                      ))}
                    </span>
                    <span className="flex-1 py-4 pl-4 pr-4 text-primary overflow-x-auto whitespace-pre">
                      {state.generatedCode}
                    </span>
                  </code>
                </pre>
              </div>

              {/* Code modification chat */}
              <div className="flex-shrink-0">
                <CodeModChat code={state.generatedCode} context={codeContext} onCodeUpdate={c => updateState({ generatedCode: c })} />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2">
              <div className="w-14 h-14 rounded-full bg-white/4 border border-white/10 flex items-center justify-center mb-4">
                <span className="text-2xl">⌨</span>
              </div>
              <p className="text-secondary font-mono text-sm">No code generated yet</p>
              <p className="text-secondary/50 text-xs mt-1">Configure options on the left and click Generate</p>
            </div>
          )}
        </div>
        }
      />

      {/* Navigation */}
      <div className="flex mt-4 flex-shrink-0">
        <button
          onClick={() => goToStep(5)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
