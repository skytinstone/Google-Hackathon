import { useState } from 'react'
import type { StepProps } from '../../types'
import { api, LANGUAGES, hasApiKey } from '../../api/api'

export default function Step5CodeGen({ state, updateState, goToStep, onApiKeyNeeded }: StepProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generateCode() {
    if (!state.domain || !state.hardware || !state.model) return
    if (!hasApiKey()) { onApiKeyNeeded(); return }
    setGenerating(true)
    setError(null)
    try {
      const result = await api.generateCode({
        domain: state.domain,
        hardware_category: state.hardware.category,
        hardware_device: state.hardware.device,
        model_name: state.model.name,
        techniques: state.techniques.map(t => ({
          id: t.id,
          name: t.name,
          subtype: t.subtype ?? undefined,
        })),
        language: state.language,
      })
      updateState({ generatedCode: result.code })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function copyCode() {
    if (!state.generatedCode) return
    navigator.clipboard.writeText(state.generatedCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => undefined)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 5 of 5</p>
        <h2 className="text-3xl font-bold text-primary">Generate Code</h2>
        <p className="text-secondary mt-2">Generate optimized deployment code using Gemini AI</p>
      </div>

      {/* Configuration Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Domain', value: state.domain ?? '—' },
          { label: 'Hardware', value: state.hardware?.device ?? '—' },
          { label: 'Model', value: state.model?.name ?? '—' },
          {
            label: 'Techniques',
            value: state.techniques.length > 0
              ? state.techniques.map(t => t.name).join(', ')
              : '—',
          },
        ].map(item => (
          <div key={item.label} className="bg-component rounded-lg px-4 py-3 border border-white/8">
            <p className="text-xs text-secondary uppercase tracking-wider">{item.label}</p>
            <p className="text-sm text-accent font-medium mt-1 truncate" title={item.value}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Language + Generate */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider font-semibold block mb-2">
            Output Language
          </label>
          <select
            value={state.language}
            onChange={e => updateState({ language: e.target.value, generatedCode: null })}
            className="bg-component border border-white/10 text-primary rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <button
          onClick={generateCode}
          disabled={generating}
          className="mt-5 flex items-center gap-2 px-6 py-2.5 bg-accent text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
        >
          {generating ? (
            <>
              <span className="animate-spin">⟳</span>
              Generating with Gemini AI...
            </>
          ) : (
            'Generate Code'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">
          {error}
        </p>
      )}

      {/* Code Output */}
      {state.generatedCode && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {/* Code Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/8">
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary font-mono">{state.language}</span>
              <span className="text-xs text-secondary">·</span>
              <span className="text-xs text-secondary">{state.model?.name}</span>
              <span className="text-xs text-secondary">·</span>
              <span className="text-xs text-secondary">{state.hardware?.device}</span>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors px-3 py-1 rounded border border-white/10 hover:border-white/20"
            >
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
          </div>

          {/* Code Content */}
          <pre className="p-5 overflow-x-auto text-xs leading-relaxed text-primary font-mono bg-background/60 max-h-[500px] overflow-y-auto">
            <code>{state.generatedCode}</code>
          </pre>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => goToStep(4)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
        {state.generatedCode && (
          <button
            onClick={() => {
              updateState({
                currentStep: 1,
                domain: null,
                hardware: null,
                model: null,
                compatibilityResult: null,
                techniques: [],
                generatedCode: null,
              })
              goToStep(1)
            }}
            className="px-6 py-2.5 border border-accent/40 text-accent font-semibold rounded-lg hover:bg-accent/10 transition-colors"
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  )
}
