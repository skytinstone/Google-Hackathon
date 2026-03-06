import { useState, useRef, useEffect, useCallback } from 'react'
import { ragChat, hasApiKey, CHATBOT_CONTEXTS } from '../api/api'
import type { WizardState } from '../types'

interface ChatMsg {
  role: 'user' | 'bot'
  text: string
  sources?: Array<{ type: string; category: string }>
  ragEnabled?: boolean
}

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
  const [listening, setListening] = useState(false)
  const [lang, setLang]     = useState<'en' | 'ko'>('en')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
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

  // Build chat history for RAG context
  const buildChatHistory = useCallback(() => {
    return msgs.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))
  }, [msgs])

  // Build context suffix from wizard state
  const _buildContext = useCallback((): string => {
    const parts: string[] = []
    if (state.domain)    parts.push(`Domain: ${state.domain}`)
    if (state.hardware)  parts.push(`Hardware: ${state.hardware.device} (${state.hardware.specs})`)
    if (state.model)     parts.push(`Model: ${state.model.name} (${state.model.params})`)
    if (state.techniques.length > 0) parts.push(`Techniques: ${state.techniques.map(t => t.name).join(', ')}`)
    return parts.length > 0 ? `\n\nCurrent user selections: ${parts.join(' | ')}` : ''
  }, [state])

  // Voice recognition
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMsgs(m => [...m, { role: 'bot', text: lang === 'ko' ? '이 브라우저에서는 음성 인식이 지원되지 않습니다.' : 'Speech recognition is not supported in this browser.' }])
      return
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'ko' ? 'ko-KR' : 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setInput(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [listening, lang])

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
      // Append wizard state context to the question
      const contextSuffix = _buildContext()
      const fullMessage = contextSuffix ? `${text}${contextSuffix}` : text

      const result = await ragChat(fullMessage, currentStep, buildChatHistory(), 0.7)
      setMsgs(m => [...m, {
        role: 'bot',
        text: result.answer.trim(),
        sources: result.sources,
        ragEnabled: result.rag_enabled,
      }])
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
          'bg-[#0a0a0a] border-l border-white/8 flex flex-col',
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
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-accent/60 bg-accent/8 px-1.5 py-0.5 rounded">RAG</span>
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
                {m.role === 'bot' && m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/6 flex flex-wrap gap-1">
                    {m.sources.map((s, si) => (
                      <span key={si} className="text-[9px] font-mono text-accent/50 bg-accent/5 px-1.5 py-0.5 rounded">
                        {s.type}{s.category ? `: ${s.category}` : ''}
                      </span>
                    ))}
                    {m.ragEnabled && (
                      <span className="text-[9px] font-mono text-green-400/50 bg-green-400/5 px-1.5 py-0.5 rounded">RAG</span>
                    )}
                  </div>
                )}
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

        {/* Language toggle + Quick prompts */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setLang(v => v === 'en' ? 'ko' : 'en')}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/10 bg-white/4 text-accent hover:bg-white/8 transition-all"
            >
              {lang === 'en' ? 'EN → 한국어' : '한국어 → EN'}
            </button>
            <span className="text-[9px] font-mono text-secondary/40">
              {lang === 'ko' ? '한국어 모드' : 'English mode'}
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {getQuickPrompts(currentStep, lang).map((p, i) => (
              <button
                key={i}
                onClick={() => { setInput(p) }}
                className="text-[10px] px-2.5 py-1 bg-white/4 border border-white/8 text-secondary hover:border-white/20 hover:text-primary rounded-full transition-all font-mono"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-1.5 p-4 border-t border-white/6 flex-shrink-0">
          {/* Voice button */}
          <button
            onClick={toggleVoice}
            title={listening ? (lang === 'ko' ? '음성 중지' : 'Stop listening') : (lang === 'ko' ? '음성 입력' : 'Voice input')}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-lg border text-sm flex-shrink-0 transition-all',
              listening
                ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                : 'bg-white/4 border-white/10 text-secondary hover:border-white/20 hover:text-primary',
            ].join(' ')}
          >
            {listening ? '◉' : 'MIC'}
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
            placeholder={lang === 'ko' ? '이 단계에 대해 질문하세요...' : 'Ask anything about this step...'}
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
          <p className="text-[10px] text-secondary/30 font-mono text-center">LeviosAI RAG Assistant — LangChain + Gemini</p>
        </div>
      </div>
    </>
  )
}

function getQuickPrompts(step: number, lang: 'en' | 'ko' = 'en'): string[] {
  if (lang === 'ko') {
    const map: Record<number, string[]> = {
      0: ['Edge AI란?', '추천 하드웨어?', '시작하기'],
      1: ['BCI란 무엇인가요?', 'CV vs LLM?', '로보틱스에 최적은?'],
      2: ['Jetson vs Hailo?', '저전력 옵션?', '모바일 추천?'],
      3: ['YOLOv8 vs YOLOv11?', '가장 작은 LLM?', 'EEGNet 설명'],
      4: ['PTQ vs QAT?', '최적 조합?', '프루닝 장단점?'],
      5: ['코드 설명해줘', 'INT8 지원 추가', '레이턴시 최적화'],
    }
    return map[step] ?? map[0]
  }
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
