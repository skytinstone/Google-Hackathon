import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import ApiKeyModal from './components/ApiKeyModal'
import LoadingScreen from './components/LoadingScreen'
import TopNav from './components/TopNav'
import Sidebar from './components/Sidebar'
import ChatBot from './components/ChatBot'
import NewProjectModal from './components/NewProjectModal'
import DashboardPage from './components/pages/DashboardPage'
import ContactPage from './components/pages/ContactPage'
import Step1Domain from './components/steps/Step1Domain'
import Step2Hardware from './components/steps/Step2Hardware'
import Step3HardwareConfig from './components/steps/Step3HardwareConfig'
import Step3Model from './components/steps/Step3Model'
import Step4Technique from './components/steps/Step4Technique'
import Step5CodeGen from './components/steps/Step5CodeGen'
import Step7Complete from './components/steps/Step7Complete'
import { getApiKey } from './api/api'
import type { WizardState, SavedProject } from './types'
import { addLog } from './utils/syslog'
import SystemLog from './components/SystemLog'

type ActiveTab = 'dashboard' | 'project' | 'contact'

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

// ── Login Page ───────────────────────────────────────────────
function LoginPage({
  onLogin,
  transitioning,
  onTransitionComplete,
}: {
  onLogin: () => void
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
  state, setState, savedProjects, setSavedProjects,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  savedProjects: SavedProject[]
  setSavedProjects: React.Dispatch<React.SetStateAction<SavedProject[]>>
}) {
  const navigate = useNavigate()
  const [showApiModal, setShowApiModal] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [pendingStep, setPendingStep]     = useState<number | null>(null)
  const [activeTab, setActiveTab]         = useState<ActiveTab>('dashboard')
  const [chatOpen, setChatOpen]           = useState(false)
  const [pendingLogout, setPendingLogout] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  const handleTransitionComplete = useCallback(() => {
    setTransitioning(false)
    if (pendingLogout) {
      setState(initialState)
      setChatOpen(false)
      setActiveTab('dashboard')
      setPendingLogout(false)
      navigate('/login')
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
  }, [pendingLogout, pendingStep, navigate, setState])

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

  function addProject(project: SavedProject) {
    setSavedProjects(prev => [project, ...prev])
    setActiveTab('dashboard')
    addLog(`Project "${project.name}" committed · dashboard updated`, 'OK')
  }

  function handleNewProject() {
    setShowNewProjectModal(true)
  }

  function handleNewProjectSubmit(data: {
    name: string; projectNo: number; author: string
    ccAuthors: string[]; customDate: string; description: string
  }) {
    setState({
      ...initialState,
      projectName: data.name,
      projectNo: data.projectNo,
      projectAuthor: data.author,
      projectCcAuthors: data.ccAuthors,
      projectDescription: data.description,
      projectCustomDate: data.customDate,
    })
    setShowNewProjectModal(false)
    setActiveTab('project')
    addLog(`Pipeline initialized · "${data.name}"`, 'INIT')
  }

  function handleTabChange(tab: ActiveTab) {
    if (tab === 'project' && !state.projectName) {
      setShowNewProjectModal(true)
      return
    }
    setActiveTab(tab)
    if (tab === 'project') setChatOpen(false)
    const tabLogs: Record<ActiveTab, string> = {
      dashboard: 'Loading ops dashboard · fetching telemetry',
      project:   'Pipeline wizard engaged · awaiting configuration',
      contact:   'Opening comms channel · signal strength optimal',
    }
    addLog(tabLogs[tab], 'NAV')
  }

  const apiKeyConfirmed = !!getApiKey()
  const sidebarVisible = activeTab === 'project'
  const stepProps = {
    state, updateState, goToStep,
    onApiKeyNeeded: () => setShowApiModal(true),
    onAddProject: addProject,
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
        onOpenProject={() => handleTabChange('project')}
        onNewProject={handleNewProject}
      />
    )
    if (activeTab === 'contact') return <ContactPage />
    return renderStep()
  }

  return (
    <>
      <TopNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex h-screen bg-background overflow-hidden pt-16">
        <div
          className={[
            'flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
            sidebarVisible ? 'w-64' : 'w-0',
          ].join(' ')}
        >
          <Sidebar state={state} goToStep={goToStep} onLogout={handleLogout} />
        </div>

        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{ marginRight: (activeTab === 'project' && chatOpen) ? '360px' : '0px' }}
        >
          <div className="flex items-center justify-end gap-3 px-8 py-2.5 border-b border-white/5 flex-shrink-0">
            <button
              onClick={() => setShowApiModal(true)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-mono',
                apiKeyConfirmed
                  ? 'border-green-500/30 text-green-400 hover:border-green-500/60'
                  : 'border-white/10 text-secondary hover:border-white/20 hover:text-primary',
              ].join(' ')}
            >
              {apiKeyConfirmed && <span className="text-green-400">✓</span>}
              <span>{apiKeyConfirmed ? 'API Key Confirmed' : 'API Key'}</span>
            </button>

            {activeTab === 'project' && (
              <button
                onClick={() => {
                  addLog(chatOpen ? 'AI assistant standing by · query mode off' : 'AI assistant engaged · awaiting query', 'ACT')
                  setChatOpen(v => !v)
                }}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-mono',
                  chatOpen
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-white/10 text-secondary hover:border-white/20 hover:text-primary',
                ].join(' ')}
                aria-label={chatOpen ? 'Close assistant' : 'Open AI assistant'}
              >
                <img src="/leviosai.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>{chatOpen ? 'Close Assistant' : 'AI Assistant'}</span>
              </button>
            )}
          </div>

          <main className="flex-1 overflow-y-auto p-8">
            {renderContent()}
          </main>
        </div>

        {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} />}

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

      {activeTab === 'project' && (
        <ChatBot
          isOpen={chatOpen}
          onToggle={() => setChatOpen(v => !v)}
          currentStep={state.currentStep}
          state={state}
        />
      )}

      {activeTab !== 'project' && <SystemLog />}
    </>
  )
}

// ── Root App ──────────────────────────────────────────────────
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [state, setState] = useState<WizardState>(initialState)

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    try {
      const stored = localStorage.getItem('leviosai_projects')
      return stored ? (JSON.parse(stored) as SavedProject[]) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('leviosai_projects', JSON.stringify(savedProjects))
  }, [savedProjects])

  const handleInitialLoadComplete = useCallback(() => {
    setInitialLoading(false)
  }, [])

  function handleLogin() {
    setTransitioning(true)
    addLog('Authentication handshake complete · operator terminal active', 'AUTH')
    setTimeout(() => addLog('Loading ops dashboard · fetching telemetry', 'NAV'), 350)
  }

  function handleLoginTransitionComplete() {
    setTransitioning(false)
    setIsLoggedIn(true)
  }

  if (initialLoading) {
    return <LoadingScreen onComplete={handleInitialLoadComplete} duration={1800} />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn
            ? <Navigate to="/main" replace />
            : <LoginPage
                onLogin={handleLogin}
                transitioning={transitioning}
                onTransitionComplete={handleLoginTransitionComplete}
              />
        }
      />
      <Route
        path="/main"
        element={
          isLoggedIn
            ? <MainPage
                state={state}
                setState={setState}
                savedProjects={savedProjects}
                setSavedProjects={setSavedProjects}
              />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="/" element={<Navigate to={isLoggedIn ? '/main' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={isLoggedIn ? '/main' : '/login'} replace />} />
    </Routes>
  )
}

export default App
