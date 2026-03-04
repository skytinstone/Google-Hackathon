import { useState } from 'react'
import type { StepProps, SelectedTechnique } from '../../types'
import { TECHNIQUES, TECHNIQUES_BY_DOMAIN, callGeminiDirect, hasApiKey } from '../../api/api'
import TypewriterText from '../TypewriterText'

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
    <div className="max-w-3xl mx-auto">
      {/* Header + Next button */}
      <div className="mb-8 flex items-start justify-between">
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
        <button
          onClick={() => goToStep(6)}
          disabled={!canProceed}
          className="flex-shrink-0 px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors"
        >
          Next: Generate Code →
        </button>
      </div>

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
      <div className="space-y-4 mb-10">
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
        <div className="mb-6 px-4 py-3 bg-component rounded-lg border border-white/8">
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

      {/* Navigation */}
      <div className="flex">
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
