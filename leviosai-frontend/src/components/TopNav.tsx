type Tab = 'dashboard' | 'project' | 'contact'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'project',   label: 'Project' },
  { id: 'contact',   label: 'Contact' },
]

export default function TopNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-component/95 backdrop-blur-md border-b border-white/8 flex items-center px-8">

      {/* Brand — left */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <img src="/leviosai.png" alt="LeviosAI" className="w-8 h-8 object-contain" />
        <span className="text-primary font-bold text-lg font-mono tracking-tight">LeviosAI</span>
      </div>

      {/* Tabs — absolutely centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={[
              'relative px-6 py-2 text-sm font-mono font-medium rounded-lg transition-all duration-200',
              activeTab === tab.id
                ? 'text-primary bg-white/8'
                : 'text-secondary hover:text-primary hover:bg-white/4',
            ].join(' ')}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Right: version tag */}
      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-mono text-accent/60 border border-accent/20 rounded-lg px-2.5 py-1">v2.0</span>
      </div>
    </nav>
  )
}
