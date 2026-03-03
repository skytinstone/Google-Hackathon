import { useState, useCallback, useEffect } from 'react'
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showApiModal, setShowApiModal] = useState(false)
  const [state, setState] = useState<WizardState>(initialState)

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true)
  const [transitioning, setTransitioning]   = useState(false)
  const [pendingStep, setPendingStep]        = useState<number | null>(null)

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  // Chatbot
  const [chatOpen, setChatOpen] = useState(false)

  // Logout
  const [pendingLogout, setPendingLogout] = useState(false)

  // Dashboard projects — persisted to localStorage
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    try {
      const stored = localStorage.getItem('leviosai_projects')
      return stored ? (JSON.parse(stored) as SavedProject[]) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('leviosai_projects', JSON.stringify(savedProjects))
  }, [savedProjects])

  // New project modal
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  const handleInitialLoadComplete = useCallback(() => {
    setInitialLoading(false)
  }, [])

  const handleTransitionComplete = useCallback(() => {
    setTransitioning(false)
    if (pendingLogout) {
      setIsLoggedIn(false)
      setState(initialState)
      setChatOpen(false)
      setActiveTab('dashboard')
      setPendingLogout(false)
    } else if (pendingStep !== null) {
      setState(prev => ({ ...prev, currentStep: pendingStep }))
      setPendingStep(null)
    }
  }, [pendingLogout, pendingStep])

  function updateState(updates: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...updates }))
  }

  function goToStep(step: number) {
    setPendingStep(step)
    setTransitioning(true)
  }

  function handleLogin() {
    setIsLoggedIn(true)
    setTransitioning(true)
  }

  function handleLogout() {
    setPendingLogout(true)
    setTransitioning(true)
  }

  function addProject(project: SavedProject) {
    setSavedProjects(prev => [project, ...prev])
    setActiveTab('dashboard')
  }

  function handleNewProject() {
    setShowNewProjectModal(true)
  }

  function handleNewProjectSubmit(data: {
    name: string; projectNo: number; author: string
    ccAuthors: string[]; customDate: string; description: string
  }) {
    // Pre-fill wizard state with project metadata
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
  }

  function handleTabChange(tab: ActiveTab) {
    if (tab === 'project' && !state.projectName) {
      // No active project — show creation modal before entering wizard
      setShowNewProjectModal(true)
      return
    }
    setActiveTab(tab)
    if (tab === 'project') setChatOpen(false)
  }

  // ── Initial site load ────────────────────────────────────────
  if (initialLoading) {
    return <LoadingScreen onComplete={handleInitialLoadComplete} duration={1800} />
  }

  // ── Login screen ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        {transitioning && (
          <LoadingScreen onComplete={handleTransitionComplete} duration={1000} hasBackdrop />
        )}
      </>
    )
  }

  // ── Main app ─────────────────────────────────────────────────
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
      {/* Fixed top navigation */}
      <TopNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex h-screen bg-background overflow-hidden pt-16">
        {/* Sidebar — slides in when Project tab active */}
        <div
          className={[
            'flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
            sidebarVisible ? 'w-64' : 'w-0',
          ].join(' ')}
        >
          <Sidebar
            state={state}
            goToStep={goToStep}
            onLogout={handleLogout}
          />
        </div>

        {/* Main content — shifts left when chatbot is open */}
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{ marginRight: (activeTab === 'project' && chatOpen) ? '360px' : '0px' }}
        >
          {/* Top bar */}
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

            {/* Chat toggle — only in Project tab */}
            {activeTab === 'project' && (
              <button
                onClick={() => setChatOpen(v => !v)}
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

      {/* Step-transition loading overlay */}
      {transitioning && (
        <LoadingScreen onComplete={handleTransitionComplete} duration={700} hasBackdrop />
      )}

      {/* Chatbot — only in Project tab */}
      {activeTab === 'project' && (
        <ChatBot
          isOpen={chatOpen}
          onToggle={() => setChatOpen(v => !v)}
          currentStep={state.currentStep}
          state={state}
        />
      )}
    </>
  )
}

export default App
