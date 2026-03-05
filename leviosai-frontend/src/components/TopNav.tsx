import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../utils/i18n'
import { useNotifications, type Notification } from '../utils/notifications'

export type Tab = 'dashboard' | 'project' | 'shop' | 'deploy' | 'launch' | 'contact' | 'settings' | 'admin'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  isAdmin?: boolean
  loggedInUser?: string
  onProfileClick?: () => void
  profilePhoto?: string | null
}

const TAB_IDS: Tab[] = ['dashboard', 'project', 'shop', 'deploy', 'launch', 'contact']
const TAB_KEYS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  project:   'nav.pipeline',
  shop:      'nav.shop',
  deploy:    'nav.build',
  launch:    'nav.launch',
  contact:   'nav.contact',
}

const TYPE_ICON: Record<Notification['type'], string> = {
  cart:    '◈',
  project: '◆',
  system:  '▸',
  auth:    '●',
}

const TYPE_COLOR: Record<Notification['type'], string> = {
  cart:    'text-amber-400',
  project: 'text-accent',
  system:  'text-secondary',
  auth:    'text-green-400',
}

export default function TopNav({ activeTab, onTabChange, isAdmin, loggedInUser, onProfileClick, profilePhoto }: Props) {
  const { t } = useI18n()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bellOpen])

  function handleBellClick() {
    if (bellOpen) {
      setBellOpen(false)
    } else {
      setBellOpen(true)
      markAllRead()
    }
  }

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

        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={handleBellClick}
            className={[
              'relative p-2 rounded-lg transition-colors',
              bellOpen
                ? 'text-primary bg-white/8'
                : 'text-secondary hover:text-primary hover:bg-white/4',
            ].join(' ')}
            aria-label="Notifications"
            title="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center px-0.5 text-[8px] font-bold bg-red-500 text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-[#0e1017] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-mono text-secondary/40">{notifications.length}</span>
                )}
              </div>
              <div className="overflow-y-auto max-h-80">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs font-mono text-secondary/40">No notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="px-4 py-2.5 border-b border-white/4 last:border-b-0 hover:bg-white/3 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`text-[10px] mt-0.5 flex-shrink-0 ${TYPE_COLOR[n.type]}`}>
                          {TYPE_ICON[n.type]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-primary/80 leading-relaxed">{n.message}</p>
                          <p className="text-[9px] font-mono text-secondary/30 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={[
            'p-2 rounded-lg transition-colors',
            activeTab === 'settings'
              ? 'text-primary bg-white/8'
              : 'text-secondary hover:text-primary hover:bg-white/4',
          ].join(' ')}
          aria-label="Settings"
          title={t('nav.settings')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Profile */}
        {loggedInUser && (
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 text-xs font-mono text-secondary/70 border border-white/8 rounded-lg px-2.5 py-1 hover:border-white/20 hover:text-primary transition-colors cursor-pointer"
            title="Profile"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
                {loggedInUser.charAt(0).toUpperCase()}
              </span>
            )}
            {loggedInUser}
          </button>
        )}
      </div>
    </nav>
  )
}
