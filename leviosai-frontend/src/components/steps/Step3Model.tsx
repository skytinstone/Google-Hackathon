import { useState, useEffect } from 'react'
import type { StepProps, CompatibilityResult } from '../../types'
import { MODELS, api, hasApiKey } from '../../api/api'
import type { ModelInfoResult } from '../../api/api'

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 45 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={['text-sm font-bold', score >= 70 ? 'text-green-400' : score >= 45 ? 'text-yellow-400' : 'text-red-400'].join(' ')}>
        {score}/100
      </span>
    </div>
  )
}

function CompatibilityPanel({ result }: { result: CompatibilityResult }) {
  return (
    <div className={[
      'mt-6 p-5 rounded-xl border',
      result.compatible
        ? 'bg-green-500/5 border-green-500/20'
        : 'bg-red-500/5 border-red-500/20',
    ].join(' ')}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={[
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
          result.compatible
            ? 'bg-green-500/15 border border-green-500/30 text-green-400'
            : 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
        ].join(' ')}>
          {result.compatible ? '✓' : '!'}
        </span>
        <div>
          <p className={['font-semibold', result.compatible ? 'text-green-400' : 'text-red-400'].join(' ')}>
            {result.compatible ? 'Compatible' : 'May require optimization'}
          </p>
          <p className="text-xs text-secondary">Gemini AI Analysis</p>
        </div>
        <div className="ml-auto w-40">
          <ScoreBar score={result.score} />
        </div>
      </div>

      <p className="text-secondary text-sm mb-4">{result.reason}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {result.considerations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Considerations</p>
            <ul className="space-y-1">
              {result.considerations.map((c, i) => (
                <li key={i} className="text-xs text-secondary flex gap-2">
                  <span className="text-yellow-400 flex-shrink-0">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Recommendations</p>
            <ul className="space-y-1">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-secondary flex gap-2">
                  <span className="text-accent flex-shrink-0">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function LinkChip({ href, label, icon }: { href: string | null; label: string; icon: string }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/4 text-xs text-secondary hover:border-accent/40 hover:text-accent transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
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
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-secondary/70">{description}</p>
    </div>
  )
}

function ModelInfoPanel({ info, loading }: { info: ModelInfoResult | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-white/8 bg-component flex items-center gap-3">
        <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin flex-shrink-0" />
        <span className="text-xs text-secondary">Fetching model info with Gemini AI...</span>
      </div>
    )
  }

  if (!info) return null

  const hasLinks = info.arxiv_url || info.github_url || info.huggingface_url

  return (
    <div className="mt-4 p-4 rounded-xl border border-accent/20 bg-accent/3 space-y-4">
      {/* Meta */}
      <div className="flex items-center justify-between">
        <div>
          {info.organization && (
            <p className="text-xs font-semibold text-primary">{info.organization}</p>
          )}
          {info.year && (
            <p className="text-xs text-secondary">{info.year}</p>
          )}
        </div>
        <p className="text-xs text-accent/60 font-mono uppercase tracking-widest">Model Info</p>
      </div>

      {/* Links */}
      {hasLinks && (
        <div className="flex flex-wrap gap-2">
          <LinkChip href={info.arxiv_url} label="arXiv Paper" icon="📄" />
          <LinkChip href={info.github_url} label="GitHub" icon="⌥" />
          <LinkChip href={info.huggingface_url} label="HuggingFace" icon="🤗" />
        </div>
      )}

      {/* Performance */}
      {info.performance.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
            Performance Benchmarks
          </p>
          <div className="space-y-3">
            {info.performance.map((p, i) => (
              <PerfBar key={i} label={p.label} value={p.value} description={p.description} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Step3Model({ state, updateState, goToStep, onApiKeyNeeded }: StepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfoResult | null>(null)
  const [modelInfoLoading, setModelInfoLoading] = useState(false)

  const domainModels = state.domain ? (MODELS[state.domain] ?? []) : []

  // Auto-fetch model info whenever model selection changes
  useEffect(() => {
    if (!state.model || !state.domain) {
      setModelInfo(null)
      return
    }
    if (!hasApiKey()) return

    let cancelled = false
    setModelInfoLoading(true)
    setModelInfo(null)

    api.getModelInfo(state.model.name, state.domain)
      .then(data => {
        if (!cancelled) setModelInfo(data)
      })
      .catch(() => {
        // Silently ignore — model info is supplementary
      })
      .finally(() => {
        if (!cancelled) setModelInfoLoading(false)
      })

    return () => { cancelled = true }
  }, [state.model?.id, state.domain])

  async function checkCompatibility() {
    if (!state.model || !state.hardware || !state.domain) return
    if (!hasApiKey()) { onApiKeyNeeded(); return }
    setLoading(true)
    setError(null)
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 3 of 5</p>
        <h2 className="text-3xl font-bold text-primary">Select AI Model</h2>
        <p className="text-secondary mt-2">
          Choose a model for <span className="text-accent">{state.domain}</span> on <span className="text-accent">{state.hardware?.device}</span>
        </p>
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {domainModels.map(model => {
          const selected = state.model?.id === model.id
          return (
            <button
              key={model.id}
              onClick={() => selectModel(model)}
              className={[
                'text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
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

      {/* Model Info Panel (auto-fetched on select) */}
      {state.model && (
        <ModelInfoPanel info={modelInfo} loading={modelInfoLoading} />
      )}

      {/* Compatibility Check */}
      {state.model && (
        <div className="mt-6 mb-8">
          <button
            onClick={checkCompatibility}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 border border-accent/40 text-accent font-semibold rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin text-sm">⟳</span>
                Analyzing with Gemini AI...
              </>
            ) : (
              'Check Hardware Compatibility'
            )}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {state.compatibilityResult && (
            <CompatibilityPanel result={state.compatibilityResult} />
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => goToStep(2)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => goToStep(4)}
          disabled={!state.model}
          className="px-6 py-2.5 bg-accent text-white font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
        >
          Next: Techniques →
        </button>
      </div>
    </div>
  )
}
