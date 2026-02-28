import { useState, useRef } from 'react'
import type { StepProps } from '../../types'
import { HARDWARE, analyzeHardwarePdf, hasApiKey } from '../../api/api'

type HardwareMap = typeof HARDWARE

export default function Step2Hardware({ state, updateState, goToStep, onApiKeyNeeded }: StepProps) {
  const [openCategory, setOpenCategory] = useState<string>(
    state.hardware?.category ?? Object.keys(HARDWARE)[0]
  )
  const [hardware, setHardware] = useState<HardwareMap>({ ...HARDWARE })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function selectDevice(category: string, device: { id: string; name: string; specs: string }) {
    updateState({
      hardware: { category, device: device.name, specs: device.specs },
      model: null,
      compatibilityResult: null,
      techniques: [],
      generatedCode: null,
    })
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!hasApiKey()) { onApiKeyNeeded(); return }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const result = await analyzeHardwarePdf(file)
      const newDevice = { id: result.id, name: result.name, specs: result.specs }
      setHardware(prev => ({
        ...prev,
        [result.category]: {
          description: prev[result.category]?.description ?? result.description,
          devices: [...(prev[result.category]?.devices ?? []), newDevice],
        },
      }))
      setOpenCategory(result.category)
      setUploadSuccess(`"${result.name}" has been added to ${result.category}.`)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to analyze PDF')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
      <div className="space-y-3 mb-6">
        {Object.entries(hardware).map(([category, data]) => {
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

      {/* PDF Upload Section */}
      <div className="mb-10 rounded-xl border border-dashed border-accent/30 bg-accent/4 px-5 py-4">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">
          Add Custom Hardware
        </p>
        <p className="text-xs text-secondary mb-3">
          Upload a hardware datasheet (PDF) — Gemini AI will extract specs and add it to the list above.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <label className={[
            'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-colors',
            uploading
              ? 'border-white/10 text-secondary cursor-not-allowed'
              : 'border-accent/40 text-accent hover:bg-accent/10',
          ].join(' ')}>
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                Analyzing PDF...
              </>
            ) : (
              'Upload Datasheet (PDF)'
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={handlePdfUpload}
            />
          </label>
        </div>

        {uploadSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <span>✓</span>
            <span>{uploadSuccess}</span>
          </div>
        )}
        {uploadError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <span>!</span>
            <span>{uploadError}</span>
          </div>
        )}
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
