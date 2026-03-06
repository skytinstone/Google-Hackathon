import { useState, useEffect } from 'react'
import TypewriterText from '../TypewriterText'
import { showToast } from '../../utils/toast'
import { addLog } from '../../utils/syslog'
import { setApiKey as saveApiKey, validateApiKey } from '../../api/api'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '')
import { useI18n, setLocale as setI18nLocale } from '../../utils/i18n'
import { useTheme, type ThemeMode, type FontSize, type ZoomLevel } from '../../utils/theme'

const ACCENT_PRESETS = [
  { name: 'Default Blue', value: '#6b96be' },
  { name: 'Emerald',     value: '#6bbeA0' },
  { name: 'Violet',      value: '#9b7fbe' },
  { name: 'Amber',       value: '#be9b6b' },
  { name: 'Rose',        value: '#be6b8a' },
]

const FONT_SIZE_PRESETS: { label: string; key: string; value: FontSize }[] = [
  { label: 'S', key: 'settings.fontSmall',  value: 'small'  },
  { label: 'M', key: 'settings.fontMedium', value: 'medium' },
  { label: 'L', key: 'settings.fontLarge',  value: 'large'  },
]

export default function SettingsPage() {
  const { t } = useI18n()
  const { theme, fontSize, zoom, autoZoomPercent, setTheme: applyTheme, setFontSize: applyFontSize, setZoom: applyZoom } = useTheme()
  const [apiKey, setApiKey] = useState('')
  const [apiKeyMasked, setApiKeyMasked] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeySaving, setApiKeySaving] = useState(false)
  const [apiKeyShowInput, setApiKeyShowInput] = useState(false)
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
    addLog(`Theme accent updated · ${color}`, 'ACT')
  }

  function handleFontSizeChange(size: FontSize) {
    applyFontSize(size)
    addLog(`Font size updated · ${size}`, 'ACT')
  }

  function handleZoomChange(level: ZoomLevel) {
    applyZoom(level)
    addLog(`Display zoom updated · ${level}%`, 'ACT')
  }

  function handleThemeChange(mode: ThemeMode) {
    applyTheme(mode)
    addLog(`Theme mode · ${mode}`, 'ACT')
  }

  function handleLanguageChange(lang: 'en' | 'ko') {
    setLanguage(lang)
    setI18nLocale(lang)
    addLog(`Language preference · ${lang === 'ko' ? 'Korean' : 'English'}`, 'ACT')
  }

  function handleClearApiKey() {
    localStorage.removeItem('leviosai_gemini_key')
    setApiKey('')
    setApiKeyMasked('')
    showToast('API Key removed', 'info')
    addLog('API Key cleared from local storage', 'ACT')
  }

  async function handleSaveApiKey() {
    const trimmed = apiKeyInput.trim()
    if (!trimmed) return
    setApiKeySaving(true)
    try {
      await validateApiKey(trimmed)
    } catch (e) {
      if (API_BASE) {
        // Only block save if backend is configured and reachable
        showToast(e instanceof Error ? e.message : 'Invalid API key', 'error')
        setApiKeySaving(false)
        return
      }
      // No backend — save anyway
    }
    saveApiKey(trimmed)
    setApiKey(trimmed)
    setApiKeyMasked(trimmed.slice(0, 4) + '•'.repeat(Math.max(0, trimmed.length - 8)) + trimmed.slice(-4))
    setApiKeyInput('')
    setApiKeyShowInput(false)
    setApiKeySaving(false)
    showToast('API Key saved', 'success')
    addLog('API Key updated', 'OK')
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
          <TypewriterText text={t('settings.title')} speed={40} />
        </h1>
        <p className="text-xs text-secondary/50 font-mono mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-5">
        {/* API Key Management */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Authentication</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">{t('settings.apiKey')}</p>
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
                  {t('settings.removeKey')}
                </button>
              </div>
            ) : apiKeyShowInput ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveApiKey() }}
                    placeholder="AIza..."
                    autoFocus
                    className="flex-1 bg-background/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim() || apiKeySaving}
                    className="px-4 py-2 text-xs font-mono font-bold bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {apiKeySaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setApiKeyShowInput(false); setApiKeyInput('') }}
                    className="px-3 py-2 text-xs font-mono text-secondary border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] font-mono text-secondary/40">
                  Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent/60 hover:text-accent underline">aistudio.google.com</a> · Stored in localStorage only
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-secondary/50 font-mono">{t('settings.apiKeyDesc')}</p>
                <button
                  onClick={() => setApiKeyShowInput(true)}
                  className="px-4 py-2 text-xs font-mono font-bold text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
                >
                  {t('settings.enterKey')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Theme — Accent Color */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Appearance</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">{t('settings.accent')}</p>
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

        {/* Font Size */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Appearance</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">{t('settings.fontSize')}</p>
          <div className="mt-4 flex items-center gap-3">
            {FONT_SIZE_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handleFontSizeChange(p.value)}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-mono',
                  fontSize === p.value
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-white/8 text-secondary hover:border-white/20',
                ].join(' ')}
              >
                <span className="font-bold" style={{ fontSize: p.value === 'small' ? '11px' : p.value === 'large' ? '15px' : '13px' }}>
                  {p.label}
                </span>
                {t(p.key)}
              </button>
            ))}
          </div>
        </div>

        {/* Display Zoom */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Appearance</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">Display Zoom</p>
          <p className="text-[10px] text-secondary/40 font-mono mt-1">Auto mode adapts to your screen size (32&quot; QHD baseline)</p>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {(['auto', '90', '100', '110', '120', '130'] as ZoomLevel[]).map(level => (
              <button
                key={level}
                onClick={() => handleZoomChange(level)}
                className={[
                  'px-3 py-2 rounded-xl border transition-all text-xs font-mono font-bold',
                  zoom === level
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-white/8 text-secondary hover:border-white/20',
                ].join(' ')}
              >
                {level === 'auto' ? `Auto (${autoZoomPercent}%)` : `${level}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Mode */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Appearance</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">{t('settings.theme')}</p>
          <div className="mt-4 flex items-center gap-3">
            {([['dark', 'settings.themeDark', '◐'], ['light', 'settings.themeLight', '☀']] as const).map(([mode, key, icon]) => (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-mono',
                  theme === mode
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-white/8 text-secondary hover:border-white/20',
                ].join(' ')}
              >
                <span>{icon}</span>
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">Locale</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">{t('settings.language')}</p>
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
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">{t('settings.data')}</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleExportProjects}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-xs font-mono text-secondary hover:border-accent/40 hover:text-primary transition-all"
            >
              <span>↓</span> {t('settings.exportProjects')}
            </button>
            <button
              onClick={handleImportProjects}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-xs font-mono text-secondary hover:border-accent/40 hover:text-primary transition-all"
            >
              <span>↑</span> {t('settings.importProjects')}
            </button>
          </div>
          <p className="text-[10px] text-secondary/30 font-mono mt-3">Projects are stored in browser localStorage. Export regularly to prevent data loss.</p>
        </div>

        {/* About */}
        <div className="p-5 rounded-2xl border border-white/8 bg-component">
          <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest">System</p>
          <p className="text-sm font-bold text-primary mt-0.5 font-mono">{t('settings.about')}</p>
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
