import { useState, useCallback, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import ApiKeyModal from './components/ApiKeyModal'
import LoadingScreen from './components/LoadingScreen'
import TopNav from './components/TopNav'
import type { Tab } from './components/TopNav'
import Sidebar from './components/Sidebar'
import ChatBot from './components/ChatBot'
import FloatingChatButton from './components/FloatingChatButton'
import NewProjectModal from './components/NewProjectModal'
import DashboardPage from './components/pages/DashboardPage'
import ContactPage from './components/pages/ContactPage'
import SettingsPage from './components/pages/SettingsPage'
import AdminPage from './components/pages/AdminPage'
import AdminMainPage from './components/pages/AdminMainPage'
import ShopPage from './components/pages/ShopPage'
import DeployPage from './components/pages/DeployPage'
import LaunchPage from './components/pages/LaunchPage'
import Toast from './components/Toast'
import ProjectDetailModal from './components/ProjectDetailModal'
import ProfileModal from './components/ProfileModal'
import CustomCursor from './components/CustomCursor'
import Step1Domain from './components/steps/Step1Domain'
import Step2Hardware from './components/steps/Step2Hardware'
import Step3HardwareConfig from './components/steps/Step3HardwareConfig'
import Step3Model from './components/steps/Step3Model'
import Step4Technique from './components/steps/Step4Technique'
import Step5CodeGen from './components/steps/Step5CodeGen'
import Step7Complete from './components/steps/Step7Complete'
import type { WizardState, SavedProject, CartItem } from './types'
import { addLog } from './utils/syslog'
import { addNotification } from './utils/notifications'
import { showToast } from './utils/toast'
import { initTheme } from './utils/theme'
import SystemLog from './components/SystemLog'
import { VerticalWatermark, VerticalPageName } from './components/PageDecorations'

type ActiveTab = Tab

const initialState: WizardState = {
  currentStep: 1,
  domain: null,
  hardware: null,
  sensors: [],
  model: null,
  compatibilityResult: null,
  techniques: [],
  language: 'Python',
  generatedCode: null,
  projectName: '',
  projectNo: 1,
  projectAuthor: '',
  projectCcAuthors: [],
  projectDescription: '',
  projectCustomDate: '',
}

// ── Route ↔ Tab mapping ─────────────────────────────────────────
const TAB_TO_PATH: Record<ActiveTab, string> = {
  dashboard: '/dashboard',
  project:   '/project',
  shop:      '/shop',
  deploy:    '/build',
  launch:    '/launch',
  contact:   '/contact',
  settings:  '/settings',
  admin:     '/admin',
}

function pathToTab(pathname: string): ActiveTab {
  if (pathname.startsWith('/project'))     return 'project'
  if (pathname.startsWith('/shop') || pathname.startsWith('/procurement')) return 'shop'
  if (pathname.startsWith('/build') || pathname.startsWith('/deploy')) return 'deploy'
  if (pathname.startsWith('/launch'))      return 'launch'
  if (pathname.startsWith('/contact'))     return 'contact'
  if (pathname.startsWith('/settings'))    return 'settings'
  if (pathname.startsWith('/admin'))       return 'admin'
  return 'dashboard'
}

// ── Login Page ───────────────────────────────────────────────
function LoginPage({
  onLogin,
  transitioning,
  onTransitionComplete,
}: {
  onLogin: (username?: string) => void
  transitioning: boolean
  onTransitionComplete: () => void
}) {
  return (
    <>
      <LoginScreen onLogin={onLogin} />
      {transitioning && (
        <LoadingScreen onComplete={onTransitionComplete} duration={1000} hasBackdrop />
      )}
    </>
  )
}

// ── Main App Page ─────────────────────────────────────────────
function MainPage({
  state, setState, savedProjects, setSavedProjects, loggedInUser,
  shopCart, setShopCart, onLogout: appLogout,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  savedProjects: SavedProject[]
  setSavedProjects: React.Dispatch<React.SetStateAction<SavedProject[]>>
  loggedInUser: string
  shopCart: CartItem[]
  setShopCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  onLogout: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()

  // Derive active tab from URL
  const activeTab: ActiveTab = useMemo(() => pathToTab(location.pathname), [location.pathname])

  const [showApiModal, setShowApiModal] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [pendingStep, setPendingStep]     = useState<number | null>(null)
  const [chatOpen, setChatOpen]           = useState(false)
  const [pendingLogout, setPendingLogout] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [detailProject, setDetailProject] = useState<SavedProject | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    try {
      const p = localStorage.getItem('leviosai_profile')
      return p ? JSON.parse(p).photo : null
    } catch { return null }
  })

  // ── Location detection ────────────────────────────────────
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => setUserLocation(`${d.city}, ${d.country_name}`))
      .catch(() => setUserLocation('Unknown'))
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === '1') { e.preventDefault(); handleTabChange('dashboard') }
      else if (ctrl && e.key === '2') { e.preventDefault(); handleTabChange('project') }
      else if (ctrl && e.key === '3') { e.preventDefault(); handleTabChange('shop') }
      else if (ctrl && e.key === '4') { e.preventDefault(); handleTabChange('deploy') }
      else if (ctrl && e.key === '5') { e.preventDefault(); handleTabChange('launch') }
      else if (ctrl && e.key === '6') { e.preventDefault(); handleTabChange('contact') }
      else if (ctrl && e.key === '7') { e.preventDefault(); handleTabChange('settings') }
      else if (ctrl && e.key === 'n') { e.preventDefault(); handleNewProject() }
      else if (ctrl && e.key === '/') { e.preventDefault(); setShowShortcuts(v => !v) }
      else if (e.key === 'Escape') {
        if (showShortcuts) setShowShortcuts(false)
        else if (showProfile) setShowProfile(false)
        else if (detailProject) setDetailProject(null)
        else if (showApiModal) setShowApiModal(false)
        else if (showNewProjectModal) setShowNewProjectModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const handleTransitionComplete = useCallback(() => {
    setTransitioning(false)
    if (pendingLogout) {
      setState(initialState)
      setChatOpen(false)
      setPendingLogout(false)
      appLogout()
    } else if (pendingStep !== null) {
      const stepMessages: Record<number, string> = {
        1: 'Domain selection phase activated',
        2: 'Hardware survey initiated · scanning inventory',
        3: 'Topology mapping engaged · sensor array',
        4: 'AI model catalogue queried',
        5: 'Optimization matrix analysis',
        6: 'Code synthesis engine primed',
        7: 'Pipeline integrity check · all systems nominal',
      }
      addLog(stepMessages[pendingStep] ?? `Module ${pendingStep} loaded`, 'STEP')
      setState(prev => ({ ...prev, currentStep: pendingStep }))
      setPendingStep(null)
    }
  }, [pendingLogout, pendingStep, appLogout, setState])

  function updateState(updates: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...updates }))
  }

  function goToStep(step: number) {
    setPendingStep(step)
    setTransitioning(true)
  }

  function handleLogout() {
    setPendingLogout(true)
    setTransitioning(true)
    addLog('Session terminated · all clearances revoked', 'AUTH')
  }

  const isAdmin = loggedInUser === 'admin'

  function addProject(project: SavedProject) {
    setSavedProjects(prev => [project, ...prev])
    navigate(TAB_TO_PATH.dashboard)
    addLog(`Project "${project.name}" committed · dashboard updated`, 'OK')
    addNotification(`Project "${project.name}" saved to dashboard`, 'project')
    showToast('Project saved to dashboard', 'success')
  }

  function handleNewProject() {
    setShowNewProjectModal(true)
  }

  function handleNewProjectSubmit(data: {
    name: string; projectNo: number; author: string
    ccAuthors: string[]; customDate: string; description: string
    template?: import('./components/ProjectTemplates').ProjectTemplate
  }) {
    const t = data.template
    setState({
      ...initialState,
      projectName: data.name,
      projectNo: data.projectNo,
      projectAuthor: data.author,
      projectCcAuthors: data.ccAuthors,
      projectDescription: data.description,
      projectCustomDate: data.customDate,
      ...(t ? { domain: t.domain } : {}),
    })
    setShowNewProjectModal(false)
    navigate(TAB_TO_PATH.project)
    addLog(`Pipeline initialized · "${data.name}"${t ? ` · template: ${t.name}` : ''}`, 'INIT')
    addNotification(`New pipeline "${data.name}" created`, 'project')
    if (t) showToast(`Template "${t.name}" applied`, 'info')
  }

  function handleTabChange(tab: ActiveTab) {
    if (tab === 'project' && !state.projectName) {
      setShowNewProjectModal(true)
      return
    }
    navigate(TAB_TO_PATH[tab])
    if (tab === 'project') setChatOpen(false)
    const tabLogs: Record<string, string> = {
      dashboard: 'Loading ops dashboard · fetching telemetry',
      project:   'Pipeline wizard engaged · awaiting configuration',
      shop:      'Component shop · scanning inventory',
      deploy:    'Build console · assembly & environment setup',
      launch:    'Launch pad · benchmark & validation',
      contact:   'Opening comms channel · signal strength optimal',
      settings:  'Opening system configuration · preferences panel',
      admin:     'Admin console accessed · elevated privileges',
    }
    addLog(tabLogs[tab] ?? `Tab ${tab} loaded`, 'NAV')
  }

  // ── Cart operations ──────────────────────────────────────
  function addToCart(productId: string, quantity: number, sourceProjectId: string | null) {
    setShopCart(prev => {
      const existing = prev.find(c => c.productId === productId)
      if (existing) {
        return prev.map(c => c.productId === productId ? { ...c, quantity: c.quantity + quantity } : c)
      }
      return [...prev, { productId, quantity, addedAt: new Date().toISOString(), sourceProjectId }]
    })
    addNotification(`Added ${quantity}× item to cart`, 'cart')
  }

  function removeFromCart(productId: string) {
    setShopCart(prev => prev.filter(c => c.productId !== productId))
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setShopCart(prev => prev.map(c => c.productId === productId ? { ...c, quantity } : c))
  }

  function clearCart() {
    setShopCart([])
    showToast('Cart cleared', 'info')
  }

  const sidebarVisible = activeTab === 'project'
  const stepProps = {
    state, updateState, goToStep,
    onApiKeyNeeded: () => setShowApiModal(true),
    onAddProject: addProject,
    onGoToShop: () => handleTabChange('shop'),
  }

  function renderStep() {
    switch (state.currentStep) {
      case 1: return <Step1Domain        {...stepProps} />
      case 2: return <Step2Hardware      {...stepProps} />
      case 3: return <Step3HardwareConfig {...stepProps} />
      case 4: return <Step3Model         {...stepProps} />
      case 5: return <Step4Technique     {...stepProps} />
      case 6: return <Step5CodeGen       {...stepProps} />
      case 7: return <Step7Complete      {...stepProps} />
      default: return <Step1Domain       {...stepProps} />
    }
  }

  function renderContent() {
    if (activeTab === 'dashboard') return (
      <DashboardPage
        projects={savedProjects}
        onOpenProject={(project) => setDetailProject(project)}
        onNewProject={handleNewProject}
        onNavigate={handleTabChange}
      />
    )
    if (activeTab === 'shop') return (
      <ShopPage
        state={state}
        cartItems={shopCart}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onClearCart={clearCart}
        savedProjects={savedProjects}
      />
    )
    if (activeTab === 'deploy') return (
      <DeployPage
        state={state}
        savedProjects={savedProjects}
        onGoToProject={() => handleTabChange('project')}
      />
    )
    if (activeTab === 'launch') return (
      <LaunchPage
        state={state}
        savedProjects={savedProjects}
        onGoToProject={() => handleTabChange('project')}
      />
    )
    if (activeTab === 'contact') return <ContactPage />
    if (activeTab === 'settings') return <SettingsPage />
    if (activeTab === 'admin' && isAdmin) return <AdminPage />
    return renderStep()
  }

  return (
    <>
      <Toast />
      <TopNav activeTab={activeTab} onTabChange={handleTabChange} isAdmin={isAdmin} loggedInUser={loggedInUser} onProfileClick={() => { setShowProfile(true); addLog('Profile panel accessed', 'NAV') }} profilePhoto={profilePhoto} />
      {activeTab !== 'shop' && <VerticalWatermark sidebarVisible={sidebarVisible} />}
      <VerticalPageName name={activeTab} chatOpen={chatOpen} />

      <div className="flex h-screen bg-background overflow-hidden pt-16">
        <div
          className={[
            'flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
            sidebarVisible ? 'w-64' : 'w-0',
          ].join(' ')}
        >
          <Sidebar state={state} goToStep={goToStep} />
        </div>

        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{ marginRight: chatOpen ? '360px' : '0px' }}
        >
          <main className="flex-1 overflow-y-auto p-8">
            {renderContent()}
          </main>
        </div>

        {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}

        {showProfile && (
          <ProfileModal
            username={loggedInUser}
            location={userLocation}
            onClose={() => {
              setShowProfile(false)
              try {
                const p = localStorage.getItem('leviosai_profile')
                setProfilePhoto(p ? JSON.parse(p).photo : null)
              } catch { /* ignore */ }
            }}
            onLogout={handleLogout}
          />
        )}

        {detailProject && (
          <ProjectDetailModal
            project={detailProject}
            onClose={() => setDetailProject(null)}
            onDuplicate={p => setSavedProjects(prev => [p, ...prev])}
            onDelete={id => setSavedProjects(prev => prev.filter(p => p.id !== id))}
          />
        )}

        {showNewProjectModal && (
          <NewProjectModal
            nextProjectNo={savedProjects.length + 1}
            defaultAuthor={(() => {
              try { const p = localStorage.getItem('leviosai_profile'); return p ? JSON.parse(p).name : 'Minseok Shin' } catch { return 'Minseok Shin' }
            })()}
            onSubmit={handleNewProjectSubmit}
            onCancel={() => setShowNewProjectModal(false)}
          />
        )}
      </div>

      {transitioning && (
        <LoadingScreen onComplete={handleTransitionComplete} duration={700} hasBackdrop />
      )}

      <FloatingChatButton isOpen={chatOpen} onToggle={() => {
        addLog(chatOpen ? 'AI assistant standing by' : 'AI assistant engaged', 'ACT')
        setChatOpen(v => !v)
      }} />

      <ChatBot
        isOpen={chatOpen}
        onToggle={() => setChatOpen(v => !v)}
        currentStep={activeTab === 'project' ? state.currentStep : 0}
        state={state}
      />

      <SystemLog position="top-right" />

      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-component shadow-2xl animate-fade-in p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-primary font-bold font-mono">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-secondary hover:text-primary">✕</button>
            </div>
            <div className="space-y-2">
              {[
                ['⌘/Ctrl + 1', 'Dashboard'],
                ['⌘/Ctrl + 2', 'Pipeline'],
                ['⌘/Ctrl + 3', 'Shop'],
                ['⌘/Ctrl + 4', 'Build'],
                ['⌘/Ctrl + 5', 'Launch'],
                ['⌘/Ctrl + 6', 'Contact'],
                ['⌘/Ctrl + 7', 'Settings'],
                ['⌘/Ctrl + N', 'New Pipeline'],
                ['⌘/Ctrl + /', 'Toggle Shortcuts'],
                ['Escape', 'Close Modal'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-secondary">{desc}</span>
                  <kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-accent text-[10px]">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Mobile Guard ─────────────────────────────────────────────
function MobileGuard() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 text-center">
      <img src="/leviosai.png" alt="LeviosAI" className="w-20 h-20 object-contain mb-6 opacity-80" />
      <h1 className="text-2xl font-bold font-mono text-primary tracking-tight mb-2">LeviosAI</h1>
      <p className="text-xs font-mono text-accent/70 uppercase tracking-widest mb-6">Edge AI Optimization Platform</p>
      <div className="p-5 rounded-2xl border border-white/10 bg-component max-w-sm">
        <p className="text-sm font-mono text-primary mb-2">Desktop or Tablet Required</p>
        <p className="text-xs font-mono text-secondary leading-relaxed">
          LeviosAI is optimized for larger screens. Please access from a tablet (iPad) or desktop browser for the full experience.
        </p>
      </div>
      <p className="text-[10px] font-mono text-secondary/30 mt-8">Google AI Hackathon 2026</p>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────
function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [state, setState] = useState<WizardState>(initialState)

  useEffect(() => { initTheme() }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    try {
      const stored = localStorage.getItem('leviosai_projects')
      return stored ? (JSON.parse(stored) as SavedProject[]) : []
    } catch { return [] }
  })

  const [shopCart, setShopCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('leviosai_shop_cart')
      return stored ? (JSON.parse(stored) as CartItem[]) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('leviosai_projects', JSON.stringify(savedProjects))
  }, [savedProjects])

  useEffect(() => {
    localStorage.setItem('leviosai_shop_cart', JSON.stringify(shopCart))
  }, [shopCart])

  function handleLogin(username?: string) {
    setLoggedInUser(username || '')
    setTransitioning(true)
    addLog('Authentication handshake complete · operator terminal active', 'AUTH')
    addNotification(`Signed in as ${username || 'user'}`, 'auth')
    setTimeout(() => addLog('Loading ops dashboard · fetching telemetry', 'NAV'), 350)
  }

  function handleLoginTransitionComplete() {
    setTransitioning(false)
    setIsLoggedIn(true)
  }

  function handleAppLogout() {
    setIsLoggedIn(false)
    setLoggedInUser('')
    addLog('Session terminated · all clearances revoked', 'AUTH')
  }

  if (isMobile) return <MobileGuard />

  return (
    <>
      <CustomCursor />
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <LoginPage
                  onLogin={handleLogin}
                  transitioning={transitioning}
                  onTransitionComplete={handleLoginTransitionComplete}
                />
          }
        />
        <Route
          path="/*"
          element={
            isLoggedIn
              ? loggedInUser === 'admin'
                ? <AdminMainPage loggedInUser={loggedInUser} onLogout={handleAppLogout} />
                : <MainPage
                    state={state}
                    setState={setState}
                    savedProjects={savedProjects}
                    setSavedProjects={setSavedProjects}
                    loggedInUser={loggedInUser}
                    shopCart={shopCart}
                    setShopCart={setShopCart}
                    onLogout={handleAppLogout}
                  />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </>
  )
}

export default App
