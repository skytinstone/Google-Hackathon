import { useState, useEffect } from 'react'
import type { StepProps, CompatibilityResult } from '../../types'
import { MODELS, api, hasApiKey } from '../../api/api'
import type { ModelInfoResult } from '../../api/api'

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 45 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={['text-xs font-bold', score >= 70 ? 'text-green-400' : score >= 45 ? 'text-yellow-400' : 'text-red-400'].join(' ')}>
        {score}/100
      </span>
    </div>
  )
}

function LinkChip({ href, label, icon }: { href: string | null; label: string; icon: string }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/4 text-xs text-secondary hover:border-accent/40 hover:text-accent transition-colors">
      <span>{icon}</span><span>{label}</span>
    </a>
  )
}

function PerfBar({ label, value, description }: { label: string; value: number; description: string }) {
  const color = value >= 70 ? 'bg-accent' : value >= 45 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = value >= 70 ? 'text-accent' : value >= 45 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-primary">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-0.5">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-[10px] text-secondary/70">{description}</p>
    </div>
  )
}

export default function Step3Model({ state, updateState, goToStep, onApiKeyNeeded }: StepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfoResult | null>(null)
  const [modelInfoLoading, setModelInfoLoading] = useState(false)

  const domainModels = state.domain ? (MODELS[state.domain] ?? []) : []

  useEffect(() => {
    if (!state.model || !state.domain) { setModelInfo(null); return }
    if (!hasApiKey()) return
    let cancelled = false
    setModelInfoLoading(true)
    setModelInfo(null)
    api.getModelInfo(state.model.name, state.domain)
      .then(data => { if (!cancelled) setModelInfo(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setModelInfoLoading(false) })
    return () => { cancelled = true }
  }, [state.model?.id, state.domain])

  async function checkCompatibility() {
    if (!state.model || !state.hardware || !state.domain) return
    if (!hasApiKey()) { onApiKeyNeeded(); return }
    setLoading(true); setError(null)
    try {
      const result = await api.checkCompatibility({
        domain: state.domain,
        hardware_category: state.hardware.category,
        hardware_device: state.hardware.device,
        model_name: state.model.name,
        model_params: state.model.params,
      })
      updateState({ compatibilityResult: result })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compatibility check failed')
    } finally {
      setLoading(false)
    }
  }

  function selectModel(model: { id: string; name: string; params: string; description: string }) {
    updateState({ model, compatibilityResult: null })
    setError(null)
  }

  // Right panel content
  function renderRightPanel() {
    if (!state.model) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/10 bg-white/2 p-8">
          <div className="w-12 h-12 rounded-full bg-white/6 border border-white/10 flex items-center justify-center mb-4">
            <span className="text-secondary text-xl">←</span>
          </div>
          <p className="text-secondary font-mono text-sm">Select a model to see details</p>
          <p className="text-secondary/50 text-xs mt-1">Benchmarks, links & compatibility check</p>
        </div>
      )
    }

    return (
      <div className="h-full overflow-y-auto space-y-4 animate-fade-in">
        {/* Selected model header */}
        <div className="p-4 rounded-xl bg-accent/8 border border-accent/20">
          <p className="text-[10px] font-mono text-accent/70 uppercase tracking-widest mb-1">Selected Model</p>
          <div className="flex items-center justify-between">
            <p className="text-primary font-bold">{state.model.name}</p>
            <span className="text-xs px-2 py-0.5 bg-white/8 text-secondary rounded-full">{state.model.params}</span>
          </div>
          <p className="text-xs text-secondary mt-1">{state.model.description}</p>
        </div>

        {/* Model info loading */}
        {modelInfoLoading && (
          <div className="p-4 rounded-xl border border-white/8 bg-component flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin flex-shrink-0" />
            <span className="text-xs text-secondary">Fetching model info...</span>
          </div>
        )}

        {/* Model info */}
        {modelInfo && (
          <div className="p-4 rounded-xl border border-white/8 bg-component space-y-3">
            <div className="flex items-center justify-between">
              <div>
                {modelInfo.organization && <p className="text-xs font-semibold text-primary">{modelInfo.organization}</p>}
                {modelInfo.year && <p className="text-xs text-secondary">{modelInfo.year}</p>}
              </div>
              <p className="text-[10px] text-accent/60 font-mono uppercase tracking-widest">Model Info</p>
            </div>
            {(modelInfo.arxiv_url || modelInfo.github_url || modelInfo.huggingface_url) && (
              <div className="flex flex-wrap gap-2">
                <LinkChip href={modelInfo.arxiv_url} label="arXiv" icon="↗" />
                <LinkChip href={modelInfo.github_url} label="GitHub" icon="↗" />
                <LinkChip href={modelInfo.huggingface_url} label="HuggingFace" icon="↗" />
              </div>
            )}
            {modelInfo.performance.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Performance</p>
                <div className="space-y-2.5">
                  {modelInfo.performance.map((p, i) => (
                    <PerfBar key={i} label={p.label} value={p.value} description={p.description} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compatibility check */}
        <div className="p-4 rounded-xl border border-white/8 bg-component">
          <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-3">Hardware Compatibility</p>
          <button
            onClick={checkCompatibility}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-accent/40 text-accent text-sm font-semibold rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><span className="animate-spin">⟳</span> Analyzing...</>
            ) : 'Check Compatibility'}
          </button>
          {error && (
            <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
          )}
          {state.compatibilityResult && (
            <CompatibilityPanel result={state.compatibilityResult} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 4 of 7</p>
        <h2 className="text-3xl font-bold text-primary">Select AI Model</h2>
        <p className="text-secondary mt-2">
          Choose a model for <span className="text-accent">{state.domain}</span> on <span className="text-accent">{state.hardware?.device}</span>
        </p>
      </div>

      {/* Split layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left — Model grid */}
        <div className="w-2/5 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-2">
            {domainModels.map(model => {
              const selected = state.model?.id === model.id
              return (
                <button
                  key={model.id}
                  onClick={() => selectModel(model)}
                  className={[
                    'text-left px-4 py-3 rounded-xl border transition-all duration-150',
                    selected
                      ? 'bg-accent/10 border-accent'
                      : 'bg-component border-white/8 hover:border-accent/40 hover:bg-accent/5',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={['font-semibold text-sm', selected ? 'text-accent' : 'text-primary'].join(' ')}>
                      {model.name}
                    </p>
                    <span className="text-xs px-2 py-0.5 bg-white/8 text-secondary rounded-full flex-shrink-0">
                      {model.params}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1">{model.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right — Model info + Compatibility */}
        <div className="flex-1 min-w-0">
          {renderRightPanel()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 flex-shrink-0">
        <button
          onClick={() => goToStep(3)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => goToStep(5)}
          disabled={!state.model}
          className="px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors"
        >
          Next: Techniques →
        </button>
      </div>
    </div>
  )
}

// ── CompatibilityPanel (inline) ────────────────────────────────
function CompatibilityPanel({ result }: { result: CompatibilityResult }) {
  return (
    <div className={[
      'mt-3 p-3 rounded-xl border',
      result.compatible ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20',
    ].join(' ')}>
      <div className="flex items-center gap-2 mb-2">
        <span className={[
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
          result.compatible
            ? 'bg-green-500/15 border border-green-500/30 text-green-400'
            : 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
        ].join(' ')}>
          {result.compatible ? '✓' : '!'}
        </span>
        <p className={['text-xs font-semibold', result.compatible ? 'text-green-400' : 'text-red-400'].join(' ')}>
          {result.compatible ? 'Compatible' : 'Needs optimization'}
        </p>
        <div className="flex-1"><ScoreBar score={result.score} /></div>
      </div>
      <p className="text-xs text-secondary mb-2">{result.reason}</p>
      <div className="space-y-1.5">
        {result.considerations.slice(0, 2).map((c, i) => (
          <p key={i} className="text-xs text-secondary flex gap-1.5"><span className="text-yellow-400">•</span>{c}</p>
        ))}
        {result.recommendations.slice(0, 2).map((r, i) => (
          <p key={i} className="text-xs text-secondary flex gap-1.5"><span className="text-accent">→</span>{r}</p>
        ))}
      </div>
    </div>
  )
}
