import { useState } from 'react'
import type { StepProps } from '../../types'
import { HARDWARE } from '../../api/api'

export default function Step2Hardware({ state, updateState, goToStep }: StepProps) {
  const [openCategory, setOpenCategory] = useState<string>(
    state.hardware?.category ?? Object.keys(HARDWARE)[0]
  )

  function selectDevice(category: string, device: { id: string; name: string; specs: string }) {
    updateState({
      hardware: { category, device: device.name, specs: device.specs },
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
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Step 2 of 5</p>
        <h2 className="text-3xl font-bold text-primary">Select Target Hardware</h2>
        <p className="text-secondary mt-2">
          Choose the edge device where your AI model will run
        </p>
      </div>

      {/* Hardware Categories */}
      <div className="space-y-3 mb-10">
        {Object.entries(HARDWARE).map(([category, data]) => {
          const isOpen = openCategory === category
          const categorySelected = state.hardware?.category === category

          return (
            <div
              key={category}
              className={[
                'rounded-xl border transition-all duration-150',
                categorySelected
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-white/8 bg-component',
              ].join(' ')}
            >
              {/* Category Header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenCategory(isOpen ? '' : category)}
              >
                <div>
                  <span className={['font-semibold', categorySelected ? 'text-accent' : 'text-primary'].join(' ')}>
                    {category}
                  </span>
                  <span className="text-secondary text-sm ml-3">{data.description}</span>
                </div>
                <span className="text-secondary text-sm ml-4 flex-shrink-0">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Device List */}
              {isOpen && (
                <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.devices.map(device => {
                    const selected = state.hardware?.device === device.name
                    return (
                      <button
                        key={device.id}
                        onClick={() => selectDevice(category, device)}
                        className={[
                          'text-left px-4 py-3 rounded-lg border transition-all duration-150',
                          selected
                            ? 'bg-accent/15 border-accent text-primary'
                            : 'bg-background/50 border-white/8 text-secondary hover:border-accent/40 hover:text-primary',
                        ].join(' ')}
                      >
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-secondary mt-0.5">{device.specs}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => goToStep(1)}
          className="px-6 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => goToStep(3)}
          disabled={!state.hardware}
          className="px-6 py-2.5 bg-accent text-white font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
        >
          Next: Model Selection →
        </button>
      </div>
    </div>
  )
}
