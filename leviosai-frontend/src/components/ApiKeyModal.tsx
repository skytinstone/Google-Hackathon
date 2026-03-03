import { useState, type FormEvent } from 'react'
import { setApiKey, getApiKey, validateApiKey } from '../api/api'

interface ApiKeyModalProps {
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const [key, setKey]         = useState(getApiKey())
  const [show, setShow]       = useState(false)
  const [status, setStatus]   = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!key.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await validateApiKey(key.trim())
      setApiKey(key.trim())
      setStatus('success')
      setTimeout(() => onClose(), 2200)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Invalid API key')
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal Card */}
      <div className="relative w-full max-w-md mx-4 bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl animate-fade-in">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-7">
          {/* Header */}
          <div className="mb-5">
            <p className="font-mono text-xs text-accent uppercase tracking-widest mb-1">Configuration</p>
            <h2 className="text-xl font-bold text-primary">Gemini API Key</h2>
            <p className="text-xs text-secondary mt-1 leading-relaxed">
              Your key is stored in the browser only and sent directly to the backend.
            </p>
          </div>

          {/* ── Success State ── */}
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center">
                <span className="text-3xl text-green-400">✓</span>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-semibold text-base">API Key saved!</p>
                <p className="text-xs text-secondary mt-1">Gemini AI features are now active.</p>
              </div>
            </div>
          ) : (
            /* ── Form State ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input */}
              <div>
                <label className="block font-mono text-xs text-secondary uppercase tracking-widest mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={key}
                    onChange={e => { setKey(e.target.value); setStatus('idle'); setErrorMsg('') }}
                    placeholder="AIzaSy..."
                    required
                    className="w-full bg-background/60 border border-white/10 text-primary font-mono text-sm rounded-lg px-4 pr-16 py-3 placeholder:text-secondary/40 focus:outline-none focus:border-accent/60 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary text-xs font-mono transition-colors"
                  >
                    {show ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {status === 'error' && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold">!</span>
                  <p className="text-red-400 font-mono text-xs leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {/* Info */}
              <div className="px-3 py-2.5 rounded-lg bg-accent/8 border border-accent/20">
                <p className="text-accent font-mono text-xs">
                  Get your key →{' '}
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

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-white/10 text-secondary font-semibold rounded-lg hover:border-white/20 hover:text-primary transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!key.trim() || status === 'loading'}
                  className="flex-1 py-2.5 bg-primary text-background font-semibold rounded-lg hover:bg-primary/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate & Save'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
