import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import Step1Domain from './components/steps/Step1Domain'
import Step2Hardware from './components/steps/Step2Hardware'
import Step3Model from './components/steps/Step3Model'
import Step4Technique from './components/steps/Step4Technique'
import Step5CodeGen from './components/steps/Step5CodeGen'
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [state, setState] = useState<WizardState>(initialState)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  function updateState(updates: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...updates }))
  }

  function goToStep(step: number) {
    setState(prev => ({ ...prev, currentStep: step }))
  }

  const stepProps = { state, updateState, goToStep }

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar state={state} goToStep={goToStep} />
      <main className="flex-1 overflow-y-auto p-8">
        {renderStep()}
      </main>
    </div>
  )
}

export default App
