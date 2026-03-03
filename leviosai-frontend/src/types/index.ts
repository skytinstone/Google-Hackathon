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

export interface SelectedSensor {
  id: string
  name: string
  type: string
  specs: string
}

export interface SavedProject {
  id: string
  name: string
  projectNo: number
  author: string
  ccAuthors: string[]
  description: string
  customDate: string
  createdAt: string
  domain: string | null
  hardware: string | null
  sensors: string[]
  model: string | null
  techniques: string[]
  language: string
}

export interface WizardState {
  currentStep: number
  domain: string | null
  hardware: {
    category: string
    device: string
    specs: string
  } | null
  sensors: SelectedSensor[]
  model: ModelInfo | null
  compatibilityResult: CompatibilityResult | null
  techniques: SelectedTechnique[]
  language: string
  generatedCode: string | null
  projectName: string
  projectNo: number
  projectAuthor: string
  projectCcAuthors: string[]
  projectDescription: string
  projectCustomDate: string
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
  onAddProject?: (project: SavedProject) => void
}
