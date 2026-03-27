import { useState, useMemo } from 'react'
import type { StepProps, SelectedTechnique } from '../../types'
import { TECHNIQUES, TECHNIQUES_BY_DOMAIN, HARDWARE, callGeminiDirect, hasApiKey } from '../../api/api'
import { analyzeTechniques, type TechniqueAnalysis } from '../../utils/knowledgeGraph'
import TypewriterText from '../TypewriterText'
import ResizableSplit from '../ResizableSplit'
import PipelineGraph3D from '../PipelineGraph3D'

// Domain-specific recommended technique IDs
const DOMAIN_RECOMMENDATIONS: Record<string, string[]> = {
  'Computer Vision': ['quantization', 'tensorrt'],
  'LLM': ['quantization', 'lora'],
  'Auto Speech Recognition': ['quantization', 'ctc_opt'],
  'BCI': ['quantization', 'transfer'],
}

export default function Step4Technique({ state, updateState, goToStep, onApiKeyNeeded }: StepProps) {
  // Use domain-specific techniques if available, fall back to common techniques
  const availableTechs = (state.domain && TECHNIQUES_BY_DOMAIN[state.domain]) ? TECHNIQUES_BY_DOMAIN[state.domain] : TECHNIQUES
  const [recommendedIds, setRecommendedIds] = useState<string[]>(
    state.domain ? (DOMAIN_RECOMMENDATIONS[state.domain] ?? ['quantization']) : ['quantization']
  )
  const [recommending, setRecommending] = useState(false)

  // Knowledge Graph technique analysis
  const techAnalysis = useMemo<TechniqueAnalysis | null>(() => {
    if (state.techniques.length === 0) return null
    const hwId = state.hardware
      ? Object.values(HARDWARE).flatMap(c => c.devices).find(d => d.name === state.hardware?.device)?.id
      : undefined
    return analyzeTechniques(
      state.techniques.map(t => t.id),
      state.domain ?? undefined,
      hwId,
    )
  }, [state.techniques, state.domain, state.hardware?.device])

  async function handleRecommend() {
    if (!state.domain || !state.model) return
    if (!hasApiKey()) { onApiKeyNeeded?.(); return }
    setRecommending(true)
    try {
      const techNames = availableTechs.map(t => `${t.id}:${t.name}`).join(', ')
      const prompt = `For ${state.domain} with ${state.model.name} (${state.model.params}) on ${state.hardware?.device ?? 'edge device'}, which 2 optimization techniques are best? Available: ${techNames}. Reply ONLY with the technique IDs separated by commas. Example: quantization, pruning`
      const result = await callGeminiDirect('You are an Edge AI optimization expert. Reply only with technique IDs.', prompt, 0.3)
      const ids = result.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      if (ids.length > 0) setRecommendedIds(ids)
    } catch {
      // keep defaults
    } finally {
      setRecommending(false)
    }
  }
  function isTechEnabled(id: string) {
    return state.techniques.some(t => t.id === id)
  }

  function getSelectedSubtype(techId: string): string | null {
    return state.techniques.find(t => t.id === techId)?.subtype ?? null
  }

  function toggleTech(techId: string, techName: string) {
    if (isTechEnabled(techId)) {
      updateState({ techniques: state.techniques.filter(t => t.id !== techId) })
    } else {
      const newTech: SelectedTechnique = { id: techId, name: techName, subtype: null }
      updateState({ techniques: [...state.techniques, newTech] })
    }
  }

  function selectSubtype(techId: string, subtypeId: string | null) {
    updateState({
      techniques: state.techniques.map(t =>
        t.id === techId ? { ...t, subtype: subtypeId } : t
      ),
    })
  }

  const canProceed = state.techniques.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-1 flex-shrink-0 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 5 of 7</p>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight"><TypewriterText text="Optimization Techniques" speed={40} /></h2>
          <p className="text-secondary mt-2">
            {state.domain
              ? <><span className="text-accent">{state.domain}</span>-specific techniques for <span className="text-accent">{state.model?.name}</span></>
              : <>Select one or more techniques to apply to <span className="text-accent">{state.model?.name}</span></>
            }
          </p>
        </div>
      </div>

      {/* Split layout */}
      <ResizableSplit
        className="mr-[360px]"
        defaultLeftPercent={45}
        left={
          <div>
            {/* Recommend button */}
            <button
              onClick={handleRecommend}
              disabled={recommending}
              className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 border border-accent/30 text-accent text-xs font-mono rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {recommending ? (
                <><span className="animate-spin">⟳</span> Analyzing best techniques...</>
              ) : (
                <><span>⟳</span> AI Recommend Techniques</>
              )}
            </button>

            {/* Technique Cards */}
            <div className="space-y-4">
              {availableTechs.map(tech => {
                const enabled = isTechEnabled(tech.id)
                const selectedSubtype = getSelectedSubtype(tech.id)
                const isRecommended = recommendedIds.includes(tech.id)

                return (
                  <div
                    key={tech.id}
                    className={[
                      'rounded-xl border transition-all duration-150 relative',
                      enabled
                        ? 'bg-accent/8 border-accent/30'
                        : isRecommended
                          ? 'bg-green-500/5 border-green-500/30 shadow-[0_0_12px_rgba(74,222,128,0.1)]'
                          : 'bg-component border-white/8',
                    ].join(' ')}
                  >
                    {isRecommended && !enabled && (
                      <span className="absolute -top-2 right-4 text-[9px] font-bold font-mono bg-green-500 text-white px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    )}
                    {/* Technique Header */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleTech(tech.id, tech.name)}
                        className={[
                          'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                          enabled ? 'bg-accent' : 'bg-white/15',
                        ].join(' ')}
                        aria-label={`Toggle ${tech.name}`}
                      >
                        <span
                          className={[
                            'absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                            enabled ? 'translate-x-6' : 'translate-x-1',
                          ].join(' ')}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={['font-semibold', enabled ? 'text-primary' : isRecommended ? 'text-green-400' : 'text-secondary'].join(' ')}>
                          {tech.name}
                        </p>
                        <p className="text-xs text-secondary mt-0.5">{tech.description}</p>
                      </div>
                    </div>

                    {/* Subtype Selection */}
                    {enabled && (
                      <div className="px-5 pb-4">
                        <p className="text-xs text-secondary uppercase tracking-wider font-semibold mb-2">Select Variant</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tech.subtypes.map(sub => {
                            const active = selectedSubtype === sub.id
                            return (
                              <button
                                key={sub.id}
                                onClick={() => selectSubtype(tech.id, active ? null : sub.id)}
                                className={[
                                  'text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150',
                                  active
                                    ? 'bg-accent/15 border-accent text-primary'
                                    : 'bg-background/50 border-white/8 text-secondary hover:border-accent/40 hover:text-primary',
                                ].join(' ')}
                              >
                                <p className="font-semibold">{sub.name}</p>
                                <p className="text-xs text-secondary mt-0.5">{sub.description}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Selection Summary */}
            {state.techniques.length > 0 && (
              <div className="mt-4 px-4 py-3 bg-component rounded-lg border border-white/8">
                <p className="text-xs text-secondary uppercase tracking-wider font-semibold mb-2">Selected Techniques</p>
                <div className="flex flex-wrap gap-2">
                  {state.techniques.map(t => (
                    <span key={t.id} className="text-xs px-3 py-1 bg-accent/15 text-accent border border-accent/20 rounded-full">
                      {t.name}{t.subtype ? ` · ${t.subtype.toUpperCase()}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Graph Analysis */}
            {techAnalysis && (techAnalysis.synergies.length > 0 || techAnalysis.warnings.length > 0 || techAnalysis.suggestions.length > 0) && (
              <div className="mt-3 space-y-2">
                {/* Synergies */}
                {techAnalysis.synergies.map((syn, i) => (
                  <div key={i} className="px-4 py-2.5 rounded-lg border border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold font-mono bg-green-500 text-white px-1.5 py-0.5 rounded-full leading-none">{syn.score}</span>
                      <span className="text-xs font-semibold text-green-400">{syn.label}</span>
                      <span className="text-[10px] font-mono text-green-400/60 ml-auto">{syn.pair.join(' + ')}</span>
                    </div>
                    <p className="text-[11px] text-secondary">{syn.description}</p>
                    <p className="text-[10px] text-green-400/70 font-mono mt-1">
                      Recommended order: {syn.recommendedOrder.join(' → ')}
                    </p>
                  </div>
                ))}

                {/* Warnings */}
                {techAnalysis.warnings.map((w, i) => (
                  <div key={i} className="px-4 py-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2">
                    <span className="text-yellow-400 text-xs mt-0.5 flex-shrink-0">!</span>
                    <p className="text-[11px] text-yellow-300/80">{w.message}</p>
                  </div>
                ))}

                {/* Suggestions */}
                {techAnalysis.suggestions.map((s, i) => (
                  <div key={i} className="px-4 py-2.5 rounded-lg border border-accent/20 bg-accent/5 flex items-start gap-2">
                    <span className="text-accent text-xs mt-0.5 flex-shrink-0">+</span>
                    <p className="text-[11px] text-secondary">
                      <span className="text-accent font-semibold">{s.techniqueId}</span> — {s.reason}
                    </p>
                  </div>
                ))}

                {/* Recommended Order */}
                {techAnalysis.recommendedOrder.length > 1 && (
                  <div className="px-4 py-2 rounded-lg border border-white/8 bg-white/3">
                    <p className="text-[10px] font-mono text-secondary/60 uppercase tracking-widest mb-1">Recommended Application Order</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {techAnalysis.recommendedOrder.map((tid, i) => {
                        const tech = state.techniques.find(t => t.id === tid)
                        return (
                          <span key={tid} className="flex items-center gap-1">
                            {i > 0 && <span className="text-accent/50 text-xs">→</span>}
                            <span className="text-[11px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/15 rounded font-mono">
                              {i + 1}. {tech?.name ?? tid}
                            </span>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        }
        right={
          <div className="flex flex-col h-full min-h-0">
            {/* Next button */}
            <div className="flex justify-end mb-3 flex-shrink-0">
              <button
                onClick={() => goToStep(6)}
                disabled={!canProceed}
                className="px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors"
              >
                Next: Generate Code →
              </button>
            </div>

            {/* Pipeline ERD Graph — fills remaining height */}
            <div className="flex-1 min-h-0 rounded-2xl border border-white/8 overflow-hidden" style={{ background: '#09090f' }}>
              <PipelineGraph3D state={state} />
            </div>
          </div>
        }
      />

      {/* Navigation */}
      <div className="flex mt-2 flex-shrink-0 mr-[360px]">
        <button
          onClick={() => goToStep(4)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
