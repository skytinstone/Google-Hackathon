import { useState, useEffect } from 'react'
import TypewriterText from '../TypewriterText'
import { showToast } from '../../utils/toast'
import { addLog } from '../../utils/syslog'
import { setLocale as setI18nLocale } from '../../utils/i18n'

const ACCENT_PRESETS = [
  { name: 'Default Blue', value: '#6b96be' },
  { name: 'Emerald',     value: '#6bbeA0' },
  { name: 'Violet',      value: '#9b7fbe' },
  { name: 'Amber',       value: '#be9b6b' },
  { name: 'Rose',        value: '#be6b8a' },
]

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [apiKeyMasked, setApiKeyMasked] = useState('')
  const [accentColor, setAccentColor] = useState('#6b96be')
  const [language, setLanguage] = useState<'en' | 'ko'>('en')

  useEffect(() => {
    const key = localStorage.getItem('leviosai_gemini_key') || ''
    if (key) {
      setApiKey(key)
      setApiKeyMasked(key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.slice(-4))
    }
    const theme = localStorage.getItem('leviosai_accent')
    if (theme) setAccentColor(theme)
    const lang = localStorage.getItem('leviosai_lang') as 'en' | 'ko' | null
    if (lang) setLanguage(lang)
  }, [])

  function handleAccentChange(color: string) {
    setAccentColor(color)
    localStorage.setItem('leviosai_accent', color)
    document.documentElement.style.setProperty('--color-accent', color)
    showToast('Accent color updated', 'success')
    addLog(`Theme accent updated · ${color}`, 'ACT')
  }

  function handleLanguageChange(lang: 'en' | 'ko') {
    setLanguage(lang)
    setI18nLocale(lang)
    showToast(lang === 'ko' ? '언어가 한국어로 변경되었습니다' : 'Language set to English', 'success')
    addLog(`Language preference · ${lang === 'ko' ? 'Korean' : 'English'}`, 'ACT')
  }

  function handleClearApiKey() {
    localStorage.removeItem('leviosai_gemini_key')
    setApiKey('')
    setApiKeyMasked('')
    showToast('API Key removed', 'info')
    addLog('API Key cleared from local storage', 'ACT')
  }

  function handleExportProjects() {
    try {
      const data = localStorage.getItem('leviosai_projects') || '[]'
      const projects = JSON.parse(data)
      const blob = new Blob([JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), projects }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leviosai_projects_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast(`Exported ${projects.length} project(s)`, 'success')
      addLog(`Exported ${projects.length} project(s) to JSON`, 'OK')
    } catch {
      showToast('Export failed', 'error')
    }
  }

  function handleImportProjects() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const imported = parsed.projects || parsed
        if (!Array.isArray(imported)) throw new Error('Invalid format')
        const existing = JSON.parse(localStorage.getItem('leviosai_projects') || '[]')
        const existingIds = new Set(existing.map((p: { id: string }) => p.id))
        const newProjects = imported.filter((p: { id: string }) => !existingIds.has(p.id))
        const merged = [...newProjects, ...existing]
        localStorage.setItem('leviosai_projects', JSON.stringify(merged))
        showToast(`Imported ${newProjects.length} new project(s)`, 'success')
        addLog(`Imported ${newProjects.length} project(s) from JSON`, 'OK')
        // Trigger re-render by dispatching storage event
        window.dispatchEvent(new Event('storage'))
      } catch {
        showToast('Invalid project file', 'error')
      }
    }
    input.click()
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-mono text-accent/60 uppercase tracking-widest mb-1">System</p>
        <h1 className="text-2xl font-bold text-primary font-mono tracking-tight">
          <TypewriterText text="Settings" speed={40} />
        </h1>
        <p className="text-xs text-secondary/50 font-mono mt-1">Configure system preferences and manage data</p>
      </div>

      <div className="space-y-5">
        {/* API Key Management */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Authentication</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">API Key Management</p>
          <div className="mt-4">
            {apiKey ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-secondary">
                  {apiKeyMasked}
                </div>
                <span className="text-green-400 text-xs font-mono">● Active</span>
                <button
                  onClick={handleClearApiKey}
                  className="px-3 py-1.5 text-xs font-mono border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-xs text-secondary/50 font-mono">No API key configured. Use the API Key button in the toolbar to add one.</p>
            )}
          </div>
        </div>

        {/* Theme — Accent Color */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Appearance</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">Accent Color</p>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handleAccentChange(p.value)}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-mono',
                  accentColor === p.value
                    ? 'border-white/30 bg-white/8 text-primary'
                    : 'border-white/8 text-secondary hover:border-white/20',
                ].join(' ')}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.value }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Locale</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">Language</p>
          <div className="mt-4 flex items-center gap-3">
            {([['en', 'English'], ['ko', '한국어']] as const).map(([code, label]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={[
                  'px-4 py-2 rounded-xl border transition-all text-xs font-mono',
                  language === code
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-white/8 text-secondary hover:border-white/20',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Data</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">Project Data Management</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleExportProjects}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-xs font-mono text-secondary hover:border-accent/40 hover:text-primary transition-all"
            >
              <span>↓</span> Export Projects
            </button>
            <button
              onClick={handleImportProjects}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-xs font-mono text-secondary hover:border-accent/40 hover:text-primary transition-all"
            >
              <span>↑</span> Import Projects
            </button>
          </div>
          <p className="text-[10px] text-secondary/30 font-mono mt-3">Projects are stored in browser localStorage. Export regularly to prevent data loss.</p>
        </div>

        {/* About */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">System</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">About LeviosAI</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-secondary">Version</span>
              <span className="text-primary">0.9</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-secondary">Platform</span>
              <span className="text-primary">Edge AI Optimization</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-secondary">Stack</span>
              <span className="text-primary">React 19 + TypeScript + Vite</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-secondary">Developer</span>
              <span className="text-primary">Minseok Shin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
