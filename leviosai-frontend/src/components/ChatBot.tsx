import { useState, useRef, useEffect, useCallback } from 'react'
import { callGeminiDirect, hasApiKey, CHATBOT_CONTEXTS } from '../api/api'
import type { WizardState } from '../types'

interface ChatMsg { role: 'user' | 'bot'; text: string }

interface Props {
  isOpen: boolean
  onToggle: () => void
  currentStep: number
  state: WizardState
}

export default function ChatBot({ isOpen, onToggle: _onToggle, currentStep, state }: Props) {
  const ctx = CHATBOT_CONTEXTS[currentStep] ?? CHATBOT_CONTEXTS[1]
  const [msgs, setMsgs]     = useState<ChatMsg[]>([{ role: 'bot', text: ctx.welcome }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const prevStep = useRef(currentStep)

  // Inject welcome message when step changes
  useEffect(() => {
    if (prevStep.current !== currentStep) {
      prevStep.current = currentStep
      const newCtx = CHATBOT_CONTEXTS[currentStep] ?? CHATBOT_CONTEXTS[1]
      setMsgs([{ role: 'bot', text: newCtx.welcome }])
    }
  }, [currentStep])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // Build context string for the system prompt
  const buildContext = useCallback((): string => {
    const parts: string[] = []
    if (state.domain)    parts.push(`Domain: ${state.domain}`)
    if (state.hardware)  parts.push(`Hardware: ${state.hardware.device} (${state.hardware.specs})`)
    if (state.model)     parts.push(`Model: ${state.model.name} (${state.model.params})`)
    if (state.techniques.length > 0) parts.push(`Techniques: ${state.techniques.map(t => t.name).join(', ')}`)
    return parts.length > 0 ? `\n\nCurrent user selections: ${parts.join(' | ')}` : ''
  }, [state])

  async function submit() {
    const text = input.trim()
    if (!text || loading) return

    if (!hasApiKey()) {
      setMsgs(m => [...m, { role: 'user', text }, { role: 'bot', text: 'Please set your Gemini API key first (top-right button).' }])
      setInput('')
      return
    }

    setMsgs(m => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const systemPrompt = ctx.systemPrompt + buildContext()
      const response = await callGeminiDirect(systemPrompt, text, 0.7)
      setMsgs(m => [...m, { role: 'bot', text: response.trim() }])
    } catch (e) {
      setMsgs(m => [...m, { role: 'bot', text: e instanceof Error ? e.message : 'An error occurred. Please check your API key.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Slide-in panel ── */}
      <div
        className={[
          'fixed top-0 right-0 bottom-0 z-30 w-[360px]',
          'bg-[#0a0b10] border-l border-white/8 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Panel header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6 flex-shrink-0">
          <img src="/leviosai.png" alt="LeviosAI" className="w-7 h-7 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-primary font-bold text-sm font-mono">LeviosAI Assistant</p>
            <p className="text-secondary text-[10px] font-mono uppercase tracking-wider truncate">{ctx.title}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-mono">Live</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-2 border-b border-white/4 flex-shrink-0 bg-white/1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-secondary/50 uppercase tracking-wider">Step {currentStep} of 7</span>
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-[10px] font-mono text-accent/70">{ctx.title}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {msgs.map((m, i) => (
            <div key={i} className={['flex gap-2.5', m.role === 'user' ? 'flex-row-reverse' : ''].join(' ')}>
              {m.role === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-white/6 border border-white/10 flex-shrink-0 flex items-center justify-center mt-0.5 overflow-hidden">
                  <img src="/leviosai.png" alt="" className="w-4 h-4 object-contain opacity-80" />
                </div>
              )}
              <div className={[
                'max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed',
                m.role === 'bot'
                  ? 'bg-white/4 border border-white/6 text-secondary'
                  : 'bg-white/10 border border-white/15 text-primary',
              ].join(' ')}>
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/6 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/leviosai.png" alt="" className="w-4 h-4 object-contain opacity-80" />
              </div>
              <div className="px-3.5 py-3 rounded-xl bg-white/4 border border-white/6 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-secondary/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
          {getQuickPrompts(currentStep).map((p, i) => (
            <button
              key={i}
              onClick={() => { setInput(p) }}
              className="text-[10px] px-2.5 py-1 bg-white/4 border border-white/8 text-secondary hover:border-white/20 hover:text-primary rounded-full transition-all font-mono"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 p-4 border-t border-white/6 flex-shrink-0">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
            placeholder="Ask anything about this step..."
            rows={1}
            className="flex-1 bg-background/60 border border-white/10 text-primary text-xs rounded-lg px-3 py-2.5 placeholder:text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors resize-none font-mono leading-relaxed"
            style={{ minHeight: '40px', maxHeight: '96px' }}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center bg-primary text-background rounded-lg disabled:opacity-30 hover:bg-primary/85 transition-colors font-bold text-sm flex-shrink-0"
          >
            ↑
          </button>
        </div>

        {/* Branding footer */}
        <div className="px-5 py-2 border-t border-white/4 flex-shrink-0">
          <p className="text-[10px] text-secondary/30 font-mono text-center">LeviosAI Assistant</p>
        </div>
      </div>
    </>
  )
}

function getQuickPrompts(step: number): string[] {
  const map: Record<number, string[]> = {
    0: ['What is Edge AI?', 'Best hardware?', 'Getting started'],
    1: ['What is BCI?', 'CV vs LLM?', 'Best for robotics?'],
    2: ['Jetson vs Hailo?', 'Low power options?', 'Best for mobile?'],
    3: ['YOLOv8 vs YOLOv11?', 'Smallest LLM?', 'EEGNet explained'],
    4: ['PTQ vs QAT?', 'Best combo?', 'Pruning trade-offs?'],
    5: ['Explain imports', 'Add INT8 support', 'Optimize latency'],
  }
  return map[step] ?? map[0]
}
