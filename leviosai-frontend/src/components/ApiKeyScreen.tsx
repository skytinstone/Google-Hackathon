import { useState, type FormEvent } from 'react'
import { setApiKey } from '../api/api'

interface ApiKeyScreenProps {
  onSaved: () => void
}

export default function ApiKeyScreen({ onSaved }: ApiKeyScreenProps) {
  const [key, setKey]     = useState('')
  const [show, setShow]   = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!key.trim().startsWith('AI')) {
      setError('API key should start with "AI". Please check your key.')
      return
    }
    setApiKey(key.trim())
    onSaved()
  }

  return (
    <div className="bg-tech-grid min-h-screen flex flex-col items-center justify-center relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="animate-fade-in relative z-10 w-full max-w-md mx-4">

        {/* Top label */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="font-mono text-xs text-yellow-400 tracking-widest uppercase">API Key Required</span>
          <span className="ml-auto font-mono text-xs text-secondary">v1.0.0</span>
        </div>

        {/* Card */}
        <div className="bg-[#13131a]/90 backdrop-blur-sm border border-white/8 rounded-2xl p-8 glow-accent">

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-mono text-xl font-bold text-primary tracking-tight">
              Configure Gemini API Key
            </h1>
            <p className="text-xs text-secondary font-mono mt-1.5 leading-relaxed">
              Enter your Google Gemini API key to enable AI features.<br />
              The key is stored locally in your browser only.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="font-mono text-xs text-secondary tracking-widest">SETUP</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-secondary uppercase tracking-widest mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">
                  🔑
                </span>
                <input
                  type={show ? 'text' : 'password'}
                  value={key}
                  onChange={e => { setKey(e.target.value); setError(null) }}
                  placeholder="AIza..."
                  required
                  className="w-full bg-background/60 border border-white/10 text-primary font-mono text-sm rounded-lg pl-10 pr-16 py-3 placeholder:text-secondary/40 focus:outline-none focus:border-accent/60 focus:bg-background/80 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors text-xs font-mono"
                  tabIndex={-1}
                >
                  {show ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="w-4 h-4 flex-shrink-0 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold">!</span>
                <p className="text-red-400 font-mono text-xs">{error}</p>
              </div>
            )}

            {/* Info box */}
            <div className="px-3 py-2.5 rounded-lg bg-accent/8 border border-accent/20">
              <p className="text-accent font-mono text-xs leading-relaxed">
                Get your key at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary transition-colors"
                >
                  aistudio.google.com
                </a>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!key.trim()}
              className="w-full mt-2 font-mono text-sm font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-200 bg-accent text-white hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                Save & Continue
                <span className="animate-blink">_</span>
              </span>
            </button>
          </form>

        </div>

        {/* Bottom label */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="font-mono text-xs text-secondary/50">Key is stored in localStorage</span>
          <span className="font-mono text-xs text-secondary/50">Never sent to 3rd parties</span>
        </div>
      </div>
    </div>
  )
}
