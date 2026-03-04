import { useI18n, setLocale, type Locale } from '../utils/i18n'
import { useTheme } from '../utils/theme'

export type Tab = 'dashboard' | 'project' | 'shop' | 'contact' | 'settings' | 'admin'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  isAdmin?: boolean
  loggedInUser?: string
  apiKeyConfirmed?: boolean
  onApiKeyClick?: () => void
  cartItemCount?: number
  onLogout?: () => void
}

const TAB_IDS: Tab[] = ['dashboard', 'project', 'shop', 'contact']
const TAB_KEYS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  project:   'nav.project',
  shop:      'nav.shop',
  contact:   'nav.contact',
}

export default function TopNav({ activeTab, onTabChange, isAdmin, loggedInUser, apiKeyConfirmed, onApiKeyClick, cartItemCount, onLogout }: Props) {
  const { t, locale } = useI18n()
  const { theme, setTheme } = useTheme()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-component/95 backdrop-blur-md border-b border-white/8 flex items-center px-8">

      {/* Brand */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <img src="/leviosai.png" alt="LeviosAI" className="w-8 h-8 object-contain" />
        <span className="text-primary font-bold text-lg font-mono tracking-tight">LeviosAI</span>
      </div>

      {/* Tabs */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {TAB_IDS.map(id => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={[
              'relative px-6 py-2 text-sm font-mono font-medium rounded-lg transition-all duration-200',
              activeTab === id
                ? 'text-primary bg-white/8'
                : 'text-secondary hover:text-primary hover:bg-white/4',
            ].join(' ')}
          >
            {t(TAB_KEYS[id])}
            {id === 'shop' && cartItemCount !== undefined && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center px-1 text-[9px] font-bold bg-red-500 text-white rounded-full">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
            {activeTab === id && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        {isAdmin && (
          <button
            onClick={() => onTabChange('admin')}
            className={[
              'p-2 rounded-lg transition-colors text-xs font-mono font-bold',
              activeTab === 'admin'
                ? 'text-red-400 bg-red-500/10'
                : 'text-secondary hover:text-red-400 hover:bg-white/4',
            ].join(' ')}
            aria-label="Admin"
            title="Admin Console"
          >
            ADM
          </button>
        )}
        <button
          onClick={() => onTabChange('settings')}
          className={[
            'p-2 rounded-lg transition-colors text-xs font-mono',
            activeTab === 'settings'
              ? 'text-primary bg-white/8'
              : 'text-secondary hover:text-primary hover:bg-white/4',
          ].join(' ')}
          aria-label="Settings"
          title={t('nav.settings')}
        >
          SET
        </button>
        {loggedInUser && (
          <span className="text-xs font-mono text-secondary/70 border border-white/8 rounded-lg px-2.5 py-1">
            {loggedInUser}
          </span>
        )}
        {onApiKeyClick && (
          <button
            onClick={onApiKeyClick}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors text-xs font-mono',
              apiKeyConfirmed
                ? 'border-green-500/30 text-green-400 hover:border-green-500/60'
                : 'border-white/10 text-secondary hover:border-white/20 hover:text-primary',
            ].join(' ')}
          >
            {apiKeyConfirmed && <span className="text-green-400">✓</span>}
            <span>{apiKeyConfirmed ? 'API Key' : 'API Key'}</span>
          </button>
        )}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-mono font-bold text-secondary hover:text-primary hover:bg-white/5 transition-colors"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? '☀' : '◐'}
        </button>
        <button
          onClick={() => setLocale(locale === 'en' ? 'ko' : 'en' as Locale)}
          className="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-mono font-bold text-secondary hover:text-primary hover:bg-white/5 transition-colors"
          title="Toggle Language"
        >
          {locale === 'en' ? 'KO' : 'EN'}
        </button>
        <span className="text-xs font-mono text-accent/60 border border-accent/20 rounded-lg px-2.5 py-1">v0.9</span>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400 text-xs font-mono font-bold hover:bg-red-500/10 transition-colors"
          >
            LOG OUT
          </button>
        )}
      </div>
    </nav>
  )
}
