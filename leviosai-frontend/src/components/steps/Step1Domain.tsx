import type { StepProps } from '../../types'
import { DOMAINS, DOMAIN_DETAILS } from '../../api/api'
import TypewriterText from '../TypewriterText'
import ResizableSplit from '../ResizableSplit'

export default function Step1Domain({ state, updateState, goToStep }: StepProps) {
  function select(name: string) {
    updateState({
      domain: name,
      hardware: null,
      sensors: [],
      model: null,
      compatibilityResult: null,
      techniques: [],
      generatedCode: null,
    })
  }

  const selectedDetail = state.domain ? DOMAIN_DETAILS[state.domain] : null

  return (
    <div className="h-full flex flex-col">
      {/* Header + Next button */}
      <div className="mb-6 flex-shrink-0 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 1 of 7</p>
          <h2 className="text-3xl font-bold text-primary font-mono tracking-tight"><TypewriterText text="Select AI Domain" speed={40} /></h2>
          <p className="text-secondary mt-2">Choose the application domain for your Edge AI deployment</p>
        </div>
        <button
          onClick={() => goToStep(2)}
          disabled={!state.domain}
          className="flex-shrink-0 px-6 py-2.5 bg-primary text-background font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/85 transition-colors mr-[610px] mt-[60px]"
        >
          Next: Hardware →
        </button>
      </div>

      {/* Split layout */}
      <ResizableSplit
        className="mr-[360px]"
        defaultLeftPercent={40}
        left={
          <div className="flex flex-col gap-3">
          {DOMAINS.map(domain => {
            const selected = state.domain === domain.name
            return (
              <button
                key={domain.id}
                onClick={() => select(domain.name)}
                className={[
                  'text-left p-4 rounded-xl border transition-all duration-150 flex items-center gap-4',
                  selected
                    ? 'bg-accent/10 border-accent shadow-lg shadow-accent/10'
                    : 'bg-component border-white/8 hover:border-accent/40 hover:bg-accent/5',
                ].join(' ')}
              >
                <span className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent text-base flex-shrink-0">
                  ◈
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={['font-semibold', selected ? 'text-accent' : 'text-primary'].join(' ')}>
                    {domain.name}
                  </h3>
                  <p className="text-secondary text-xs mt-0.5 line-clamp-2">{domain.description}</p>
                </div>
                {selected && (
                  <span className="flex-shrink-0 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-[10px]">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
        }
        right={
        <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left' }}>
          {!selectedDetail ? (
            <div className="h-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/10 bg-white/2 p-8">
              <div className="w-12 h-12 rounded-full bg-white/6 border border-white/10 flex items-center justify-center mb-4">
                <span className="text-secondary text-xl">←</span>
              </div>
              <p className="text-secondary font-mono text-sm">Select a domain to see details</p>
              <p className="text-secondary/50 text-xs mt-1">Industries, use cases & key technologies</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto space-y-4 animate-fade-in">
              {/* Tagline */}
              <div className="p-5 rounded-xl bg-accent/8 border border-accent/20">
                <p className="text-xs font-mono text-accent uppercase tracking-widest mb-1">{state.domain}</p>
                <p className="text-primary font-semibold leading-snug">{selectedDetail.tagline}</p>
              </div>

              {/* Industries */}
              <div className="p-5 rounded-xl bg-component border border-white/8">
                <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-3">Applicable Industries</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDetail.industries.map(ind => (
                    <span key={ind} className="px-2.5 py-1 bg-white/6 border border-white/10 rounded-full text-xs text-secondary font-mono">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              <div className="p-5 rounded-xl bg-component border border-white/8">
                <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-3">Representative Use Cases</p>
                <div className="space-y-3">
                  {selectedDetail.useCases.map(uc => (
                    <div key={uc.title} className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-primary font-medium">{uc.title}</p>
                        <p className="text-xs text-secondary mt-0.5">{uc.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Technologies */}
              <div className="p-5 rounded-xl bg-component border border-white/8">
                <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-3">Key Technologies</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDetail.keyTechs.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-accent/10 border border-accent/25 rounded text-xs text-accent font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        }
      />

    </div>
  )
}
