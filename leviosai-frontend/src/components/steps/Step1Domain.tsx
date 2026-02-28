import type { StepProps } from '../../types'
import { DOMAINS } from '../../api/api'

export default function Step1Domain({ state, updateState, goToStep }: StepProps) {
  function select(name: string) {
    // Reset downstream selections when domain changes
    updateState({
      domain: name,
      hardware: null,
      model: null,
      compatibilityResult: null,
      techniques: [],
      generatedCode: null,
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 1 of 5</p>
        <h2 className="text-3xl font-bold text-primary">Select AI Domain</h2>
        <p className="text-secondary mt-2">Choose the application domain for your Edge AI deployment</p>
      </div>

      {/* Domain Cards */}
      <div className="grid grid-cols-1 gap-4 mb-10">
        {DOMAINS.map(domain => {
          const selected = state.domain === domain.name
          return (
            <button
              key={domain.id}
              onClick={() => select(domain.name)}
              className={[
                'text-left p-5 rounded-xl border transition-all duration-150 flex items-center gap-5',
                selected
                  ? 'bg-accent/10 border-accent shadow-lg shadow-accent/10'
                  : 'bg-component border-white/8 hover:border-accent/40 hover:bg-accent/5',
              ].join(' ')}
            >
              <span className="w-12 h-12 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent font-mono font-bold text-sm flex-shrink-0">
                {domain.id.toUpperCase()}
              </span>
              <div className="min-w-0">
                <h3 className={['font-semibold text-lg', selected ? 'text-accent' : 'text-primary'].join(' ')}>
                  {domain.name}
                </h3>
                <p className="text-secondary text-sm mt-0.5">{domain.description}</p>
              </div>
              {selected && (
                <span className="ml-auto flex-shrink-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-xs">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={() => goToStep(2)}
          disabled={!state.domain}
          className="px-6 py-2.5 bg-accent text-white font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
        >
          Next: Hardware →
        </button>
      </div>
    </div>
  )
}
