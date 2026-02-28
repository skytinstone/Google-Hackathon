import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import ApiKeyScreen from './components/ApiKeyScreen'
import ApiKeyModal from './components/ApiKeyModal'
import Sidebar from './components/Sidebar'
import Step1Domain from './components/steps/Step1Domain'
import Step2Hardware from './components/steps/Step2Hardware'
import Step3Model from './components/steps/Step3Model'
import Step4Technique from './components/steps/Step4Technique'
import Step5CodeGen from './components/steps/Step5CodeGen'
import { hasApiKey, getApiKey } from './api/api'
import type { WizardState } from './types'

const initialState: WizardState = {
  currentStep: 1,
  domain: null,
  hardware: null,
  model: null,
  compatibilityResult: null,
  techniques: [],
  language: 'Python',
  generatedCode: null,
}

function App() {
  const [apiKeySet, setApiKeySet] = useState(hasApiKey())
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showApiModal, setShowApiModal] = useState(false)
  const [state, setState] = useState<WizardState>(initialState)

  if (!apiKeySet) {
    return <ApiKeyScreen onSaved={() => setApiKeySet(true)} />
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  function updateState(updates: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...updates }))
  }

  function goToStep(step: number) {
    setState(prev => ({ ...prev, currentStep: step }))
  }

  const stepProps = { state, updateState, goToStep, onApiKeyNeeded: () => setShowApiModal(true) }

  function renderStep() {
    switch (state.currentStep) {
      case 1: return <Step1Domain {...stepProps} />
      case 2: return <Step2Hardware {...stepProps} />
      case 3: return <Step3Model {...stepProps} />
      case 4: return <Step4Technique {...stepProps} />
      case 5: return <Step5CodeGen {...stepProps} />
      default: return <Step1Domain {...stepProps} />
    }
  }

  const apiKeyConfirmed = !!getApiKey()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar state={state} goToStep={goToStep} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-end px-8 py-2.5 border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setShowApiModal(true)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-mono',
              apiKeyConfirmed
                ? 'border-green-500/30 text-green-400 hover:border-green-500/60'
                : 'border-white/10 text-secondary hover:border-accent/40 hover:text-accent',
            ].join(' ')}
          >
            {apiKeyConfirmed && <span className="text-green-400">✓</span>}
            <span>{apiKeyConfirmed ? 'API Key Confirmed' : 'API Key'}</span>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-8">
          {renderStep()}
        </main>
      </div>

      {showApiModal && (
        <ApiKeyModal onClose={() => setShowApiModal(false)} />
      )}
    </div>
  )
}

export default App
