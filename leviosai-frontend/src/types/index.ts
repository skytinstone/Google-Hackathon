export interface HardwareDevice {
  id: string
  name: string
  specs: string
}

export interface HardwareCategory {
  description: string
  devices: HardwareDevice[]
}

export interface ModelInfo {
  id: string
  name: string
  params: string
  description: string
}

export interface TechniqueSubtype {
  id: string
  name: string
  fullName: string
  description: string
}

export interface Technique {
  id: string
  name: string
  description: string
  subtypes: TechniqueSubtype[]
}

export interface CompatibilityResult {
  compatible: boolean
  score: number
  reason: string
  considerations: string[]
  recommendations: string[]
}

export interface SelectedTechnique {
  id: string
  name: string
  subtype: string | null
}

export interface WizardState {
  currentStep: number
  domain: string | null
  hardware: {
    category: string
    device: string
    specs: string
  } | null
  model: ModelInfo | null
  compatibilityResult: CompatibilityResult | null
  techniques: SelectedTechnique[]
  language: string
  generatedCode: string | null
}

export interface CustomHardwareResult {
  category: string
  id: string
  name: string
  specs: string
  description: string
}

export interface StepProps {
  state: WizardState
  updateState: (updates: Partial<WizardState>) => void
  goToStep: (step: number) => void
  onApiKeyNeeded: () => void
}
