import { useState, useRef, useEffect, useCallback } from 'react'

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system'
  text: string
}

const TAB_ALIASES: Record<string, string> = {
  dashboard: 'dashboard',
  home: 'dashboard',
  project: 'project',
  pipeline: 'project',
  shop: 'shop',
  store: 'shop',
  build: 'deploy',
  deploy: 'deploy',
  launch: 'launch',
  contact: 'contact',
  settings: 'settings',
  admin: 'admin',
}

const HELP_TEXT = [
  'Available commands:',
  '',
  ' Navigation',
  '  cd <page>    — navigate to page',
  '  cd ..        — go back (dashboard)',
  '  ls           — list pages',
  '  pwd          — current page',
  '',
  ' Project',
  '  status       — project statistics',
  '  projects     — list saved projects',
  '  export       — copy projects to clipboard',
  '  mem          — storage usage',
  '',
  ' System',
  '  time         — current time (all zones)',
  '  date         — current date',
  '  uptime       — session uptime',
  '  neofetch     — system info banner',
  '  ping <host>  — test connection',
  '  weather      — local weather info',
  '',
  ' Utility',
  '  calc <expr>  — calculator (e.g. 3*4+2)',
  '  history      — command history',
  '  shortcuts    — keyboard shortcuts',
  '  echo <msg>   — echo a message',
  '  random       — random tech quote',
  '',
  ' Info',
  '  about        — about LeviosAI',
  '  version      — version info',
  '  whoami       — current user',
  '  hostname     — system hostname',
  '  ascii        — show logo',
  '',
  '  help         — this message',
  '  clear        — clear terminal',
]

const ASCII_LOGO = [
  '  _           _           _  ',
  ' | |   ___ __(_)___ ___  /_\\ |',
  ' | |__/ -_) V / / _ (_-</ _ \\|',
  ' |____\\___|_/|_\\___/__/_/ \\_\\|',
  '  Edge AI Optimization Platform',
]

const PAGE_LIST = [
  'dashboard  — main hub',
  'project    — pipeline wizard',
  'shop       — parts & packages',
  'build      — deploy simulator',
  'launch     — launch checklist',
  'contact    — contact page',
  'settings   — app settings',
]

const SHORTCUTS = [
  'Keyboard shortcuts:',
  '  Ctrl+1  Dashboard',
  '  Ctrl+2  Pipeline',
  '  Ctrl+3  Shop',
  '  Ctrl+4  Build',
  '  Ctrl+5  Launch',
  '  Ctrl+6  Contact',
  '  Ctrl+7  Settings',
]

const QUOTES = [
  '"The best way to predict the future is to invent it." — Alan Kay',
  '"Talk is cheap. Show me the code." — Linus Torvalds',
  '"Simplicity is the ultimate sophistication." — Da Vinci',
  '"First, solve the problem. Then, write the code." — John Johnson',
  '"Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke',
  '"The only way to do great work is to love what you do." — Steve Jobs',
  '"Move fast and break things." — Mark Zuckerberg',
  '"AI is the new electricity." — Andrew Ng',
  '"Edge computing brings intelligence closer to reality."',
  '"Optimize at the edge, deploy at scale."',
]

interface Props {
  onNavigate?: (tab: import('./TopNav').Tab) => void
  currentTab?: string
  chatOpen?: boolean
}

export default function CommandTerminal({ onNavigate, currentTab, chatOpen }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [userCollapsed, setUserCollapsed] = useState(false)
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: 'LeviosAI Terminal v1.0.0' },
    { type: 'system', text: 'Type "help" for available commands.' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const startTime = useRef(Date.now())
  const navHistory = useRef<string[]>([])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  // Track current tab for cd ..
  useEffect(() => {
    if (currentTab) {
      navHistory.current.push(currentTab)
    }
  }, [currentTab])

  // Auto-collapse when chat opens, restore when chat closes
  useEffect(() => {
    if (chatOpen) {
      setCollapsed(true)
    } else {
      setCollapsed(userCollapsed)
    }
  }, [chatOpen, userCollapsed])

  function handleToggle() {
    const next = !collapsed
    setCollapsed(next)
    if (!chatOpen) setUserCollapsed(next)
  }

  const processCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    const rawArgs = cmd.trim().split(/\s+/)
    const args = trimmed.split(/\s+/)
    const command = args[0]

    const add = (newLines: TerminalLine[]) => {
      setLines(prev => [...prev, { type: 'input', text: `> ${cmd}` }, ...newLines])
    }

    switch (command) {
      case 'help':
        add(HELP_TEXT.map(t => ({ type: 'output' as const, text: t })))
        break

      case 'clear':
        setLines([{ type: 'system', text: 'Terminal cleared.' }])
        break

      // ── Navigation ──────────────────────────
      case 'cd': {
        const target = args[1]
        if (!target) {
          add([{ type: 'output', text: 'Usage: cd <page> or cd ..' }])
          break
        }
        if (target === '..') {
          if (onNavigate) {
            const hist = navHistory.current
            if (hist.length > 1) {
              hist.pop()
              const prev = hist[hist.length - 1]
              add([{ type: 'output', text: `← back to ${prev}` }])
              onNavigate(prev as import('./TopNav').Tab)
            } else {
              add([{ type: 'output', text: '← back to dashboard' }])
              onNavigate('dashboard')
            }
          } else {
            add([{ type: 'error', text: 'Navigation not available' }])
          }
          break
        }
        const resolved = TAB_ALIASES[target]
        if (resolved) {
          if (onNavigate) {
            add([{ type: 'output', text: `→ navigating to ${resolved}` }])
            onNavigate(resolved as import('./TopNav').Tab)
          } else {
            add([{ type: 'error', text: 'Navigation not available' }])
          }
        } else {
          add([{ type: 'error', text: `unknown page: ${target}` }, { type: 'output', text: 'Type "ls" to see available pages.' }])
        }
        break
      }

      case 'ls':
        add([
          { type: 'output', text: 'Pages:' },
          ...PAGE_LIST.map(t => ({ type: 'output' as const, text: `  ${t}` })),
        ])
        break

      case 'pwd':
        add([{ type: 'output', text: `/${currentTab ?? 'unknown'}` }])
        break

      // ── Project ─────────────────────────────
      case 'status': {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('leviosai_'))
        const projects = keys.filter(k => k.includes('_project_')).length
        const parts = keys.filter(k => k.includes('_parts_')).length
        const pkgs = keys.filter(k => k.includes('_packages_')).length
        add([
          { type: 'output', text: `Storage keys: ${keys.length}` },
          { type: 'output', text: `Projects:     ${projects}` },
          { type: 'output', text: `Part lists:   ${parts}` },
          { type: 'output', text: `Pkg lists:    ${pkgs}` },
        ])
        break
      }

      case 'projects': {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('leviosai_project_'))
        if (keys.length === 0) {
          add([{ type: 'output', text: 'No saved projects.' }])
        } else {
          const items: TerminalLine[] = [{ type: 'output', text: `Saved projects (${keys.length}):` }]
          keys.slice(0, 8).forEach((k, i) => {
            try {
              const p = JSON.parse(localStorage.getItem(k) ?? '{}')
              items.push({ type: 'output', text: `  ${i + 1}. ${p.name ?? 'Untitled'} [${p.hardware ?? '?'}]` })
            } catch {
              items.push({ type: 'output', text: `  ${i + 1}. (parse error)` })
            }
          })
          if (keys.length > 8) items.push({ type: 'output', text: `  ... and ${keys.length - 8} more` })
          add(items)
        }
        break
      }

      case 'export': {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('leviosai_project_'))
        if (keys.length === 0) {
          add([{ type: 'error', text: 'No projects to export.' }])
        } else {
          const data = keys.map(k => {
            try { return JSON.parse(localStorage.getItem(k) ?? '{}') } catch { return null }
          }).filter(Boolean)
          navigator.clipboard.writeText(JSON.stringify(data, null, 2))
            .then(() => add([{ type: 'output', text: `Copied ${data.length} projects to clipboard.` }]))
            .catch(() => add([{ type: 'error', text: 'Clipboard write failed.' }]))
        }
        break
      }

      case 'mem': {
        let total = 0
        const counts: Record<string, number> = {}
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (!k) continue
          const size = (localStorage.getItem(k) ?? '').length * 2 // UTF-16
          total += size
          if (k.startsWith('leviosai_')) {
            const cat = k.split('_').slice(1, 3).join('_')
            counts[cat] = (counts[cat] ?? 0) + size
          }
        }
        const fmt = (b: number) => b > 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`
        const items: TerminalLine[] = [
          { type: 'output', text: `Total localStorage: ${fmt(total)}` },
          { type: 'output', text: `Keys: ${localStorage.length}` },
        ]
        Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([cat, size]) => {
          items.push({ type: 'output', text: `  ${cat}: ${fmt(size)}` })
        })
        add(items)
        break
      }

      // ── System ──────────────────────────────
      case 'time': {
        const now = new Date()
        const fmt = (tz: string, label: string) =>
          `${label}  ${now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`
        add([
          { type: 'output', text: fmt('Asia/Seoul', 'Seoul  ') },
          { type: 'output', text: fmt('America/New_York', 'NYC    ') },
          { type: 'output', text: fmt('Europe/London', 'London ') },
        ])
        break
      }

      case 'date': {
        const now = new Date()
        add([{ type: 'output', text: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }])
        break
      }

      case 'uptime': {
        const elapsed = Math.floor((Date.now() - startTime.current) / 1000)
        const h = Math.floor(elapsed / 3600)
        const m = Math.floor((elapsed % 3600) / 60)
        const s = elapsed % 60
        add([{ type: 'output', text: `Session uptime: ${h}h ${m}m ${s}s` }])
        break
      }

      case 'neofetch': {
        const now = new Date()
        const elapsed = Math.floor((Date.now() - startTime.current) / 1000)
        const keys = Object.keys(localStorage).filter(k => k.startsWith('leviosai_'))
        add([
          { type: 'output', text: '  ╭──────────────────────╮' },
          { type: 'output', text: '  │   L E V I O S A I    │' },
          { type: 'output', text: '  ╰──────────────────────╯' },
          { type: 'output', text: `  OS      Web (${navigator.platform})` },
          { type: 'output', text: `  Engine  React 19 + Vite 7` },
          { type: 'output', text: `  AI      Gemini + Edge HW` },
          { type: 'output', text: `  Page    /${currentTab ?? '?'}` },
          { type: 'output', text: `  Uptime  ${Math.floor(elapsed / 60)}m ${elapsed % 60}s` },
          { type: 'output', text: `  Data    ${keys.length} storage keys` },
          { type: 'output', text: `  Time    ${now.toLocaleTimeString('en-GB', { hour12: false })}` },
          { type: 'output', text: `  Lang    ${navigator.language}` },
          { type: 'output', text: `  Screen  ${screen.width}x${screen.height}` },
        ])
        break
      }

      case 'ping': {
        const host = args[1] || 'leviosai.local'
        const latencies = Array.from({ length: 4 }, () => Math.floor(Math.random() * 30 + 5))
        const items: TerminalLine[] = [
          { type: 'output', text: `PING ${host}:` },
        ]
        latencies.forEach((ms, i) => {
          items.push({ type: 'output', text: `  seq=${i} time=${ms}ms ttl=64` })
        })
        const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
        items.push({ type: 'output', text: `  --- avg=${avg}ms, 0% loss ---` })
        add(items)
        break
      }

      case 'weather': {
        try {
          const cached = localStorage.getItem('leviosai_weather_cache')
          if (cached) {
            const w = JSON.parse(cached)
            add([
              { type: 'output', text: `${w.icon} ${w.temp} · ${w.desc}` },
              { type: 'output', text: `  ${w.city ?? 'Unknown location'}` },
            ])
          } else {
            add([{ type: 'output', text: 'Fetching weather...' }])
            fetch('https://ipapi.co/json/')
              .then(r => r.json())
              .then((d: { latitude: number; longitude: number; city: string }) => {
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${d.latitude}&longitude=${d.longitude}&current=temperature_2m,weather_code&timezone=auto`)
                  .then(r => r.json())
                  .then((w: { current: { temperature_2m: number; weather_code: number } }) => {
                    const code = w.current.weather_code
                    let desc = 'Clear', icon = '☀'
                    if (code >= 1 && code <= 3) { desc = 'Cloudy'; icon = '⛅' }
                    else if (code >= 45 && code <= 48) { desc = 'Foggy'; icon = '🌫' }
                    else if (code >= 51 && code <= 67) { desc = 'Rainy'; icon = '🌧' }
                    else if (code >= 71 && code <= 77) { desc = 'Snowy'; icon = '❄' }
                    else if (code >= 80 && code <= 99) { desc = 'Stormy'; icon = '⛈' }
                    const result = { icon, temp: `${w.current.temperature_2m}°C`, desc, city: d.city }
                    localStorage.setItem('leviosai_weather_cache', JSON.stringify(result))
                    setLines(prev => [...prev,
                      { type: 'output', text: `${icon} ${result.temp} · ${desc}` },
                      { type: 'output', text: `  ${d.city}` },
                    ])
                  })
              })
              .catch(() => setLines(prev => [...prev, { type: 'error', text: 'Weather fetch failed.' }]))
          }
        } catch {
          add([{ type: 'error', text: 'Weather unavailable.' }])
        }
        break
      }

      // ── Utility ─────────────────────────────
      case 'calc': {
        const expr = rawArgs.slice(1).join(' ')
        if (!expr) {
          add([{ type: 'output', text: 'Usage: calc <expression>' }, { type: 'output', text: '  e.g. calc 3.14 * 5 * 5' }])
          break
        }
        try {
          // Safe eval: only allow numbers and math operators
          if (!/^[\d\s+\-*/().%^]+$/.test(expr)) {
            add([{ type: 'error', text: 'Invalid expression (numbers & operators only)' }])
            break
          }
          const result = new Function(`return (${expr})`)()
          add([{ type: 'output', text: `= ${result}` }])
        } catch {
          add([{ type: 'error', text: 'Calculation error' }])
        }
        break
      }

      case 'history':
        setHistory(prev => {
          if (prev.length === 0) {
            setLines(l => [...l, { type: 'input', text: `> ${cmd}` }, { type: 'output', text: 'No command history.' }])
          } else {
            const items: TerminalLine[] = [
              { type: 'input', text: `> ${cmd}` },
              { type: 'output', text: `History (${prev.length}):` },
              ...prev.slice(-10).map((h, i) => ({ type: 'output' as const, text: `  ${i + 1}. ${h}` })),
            ]
            setLines(l => [...l, ...items])
          }
          return prev
        })
        return // early return since we handle setLines manually

      case 'shortcuts':
        add(SHORTCUTS.map(t => ({ type: 'output' as const, text: t })))
        break

      case 'random':
        add([{ type: 'output', text: QUOTES[Math.floor(Math.random() * QUOTES.length)] }])
        break

      // ── Info ─────────────────────────────────
      case 'about':
        add([
          { type: 'output', text: 'LeviosAI — Edge AI Optimization Platform' },
          { type: 'output', text: 'Google AI Hackathon 2026' },
          { type: 'output', text: 'Powered by Gemini + Edge Hardware' },
        ])
        break

      case 'version':
        add([{ type: 'output', text: 'LeviosAI v1.0.0 · Build 2026.03' }])
        break

      case 'echo':
        add([{ type: 'output', text: rawArgs.slice(1).join(' ') || '' }])
        break

      case 'whoami':
        add([{ type: 'output', text: 'operator@leviosai' }])
        break

      case 'hostname':
        add([{ type: 'output', text: 'edge-console-01.leviosai.local' }])
        break

      case 'ascii':
        add(ASCII_LOGO.map(t => ({ type: 'output' as const, text: t })))
        break

      case '':
        break

      default:
        add([{ type: 'error', text: `command not found: ${command}` }, { type: 'output', text: 'Type "help" for available commands.' }])
    }
  }, [onNavigate, currentTab])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (input.trim()) {
        setHistory(prev => [...prev, input])
        setHistoryIdx(-1)
      }
      processCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1)
        setHistoryIdx(newIdx)
        setInput(history[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx >= 0) {
        const newIdx = historyIdx + 1
        if (newIdx >= history.length) {
          setHistoryIdx(-1)
          setInput('')
        } else {
          setHistoryIdx(newIdx)
          setInput(history[newIdx])
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Tab auto-complete for commands
      const partial = input.trim().toLowerCase()
      if (partial) {
        const all = ['help','clear','cd','ls','pwd','status','projects','export','mem','time','date','uptime','neofetch','ping','weather','calc','history','shortcuts','echo','random','about','version','whoami','hostname','ascii']
        const match = all.find(c => c.startsWith(partial))
        if (match) setInput(match + ' ')
      }
    }
  }

  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-white/90'
      case 'output': return 'text-white/60'
      case 'error': return 'text-red-400'
      case 'system': return 'text-white/40'
    }
  }

  return (
    <div
      className="select-none"
      style={{ width: 280 }}
    >
      {/* Header */}
      <div
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-t-lg bg-white/5 border border-white/15 border-b-0 cursor-pointer hover:bg-white/10 transition-colors"
        style={collapsed ? { borderRadius: '8px' } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest">Terminal</span>
        </div>
        <span className="text-[10px] font-mono text-white/30">{collapsed ? '▲' : '▼'}</span>
      </div>

      {!collapsed && (
        <div
          className="pointer-events-auto rounded-b-lg border border-white/15 border-t-0 bg-[#0a0c14]/95 backdrop-blur-sm overflow-hidden"
        >
          {/* Output */}
          <div
            ref={scrollRef}
            className="px-3 py-2 overflow-y-auto font-mono text-[10px] leading-relaxed"
            style={{ maxHeight: 180 }}
          >
            {lines.map((line, i) => (
              <p key={i} className={`${lineColor(line.type)} whitespace-pre`}>{line.text}</p>
            ))}
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-1 px-3 py-1.5 border-t border-white/10 bg-[#060810]"
            onClick={() => inputRef.current?.focus()}
          >
            <span className="text-white/50 text-[10px] font-mono font-bold">{'>'}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white/80 text-[10px] font-mono outline-none placeholder:text-white/20 caret-white"
              placeholder="type a command..."
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </div>
  )
}
