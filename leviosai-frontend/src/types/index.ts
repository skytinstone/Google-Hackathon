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
  quantity?: number
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
  onGoToShop?: () => void
  onReturnToManage?: () => void
}

// ── Shop Types ──────────────────────────────────────────────

export type StoreId = 'amazon' | 'aliexpress' | 'naver' | 'auction' | '11st' | 'coupang' | 'ebay' | 'mouser' | 'digikey'
export type ShopCategory = 'main_board' | 'sensor' | 'cable' | 'power' | 'frame' | 'accessory' | 'fastener' | 'wiring'

export interface Store {
  id: StoreId
  name: string
  nameKo: string
  searchUrl: string
  logoChar: string
  color: string
}

export interface ShopProduct {
  id: string
  name: string
  nameKo: string
  category: ShopCategory
  description: string
  specs: string
  priceRange: { min: number; max: number }
  associatedHardware: string[]
  associatedSensors: string[]
  searchKeywords: Partial<Record<StoreId, string>>
  tags: string[]
}

export interface CartItem {
  productId: string
  quantity: number
  addedAt: string
  sourceProjectId: string | null
}

export interface BomEntry {
  category: ShopCategory
  productId: string
  productName: string
  reason: string
  quantity: number
  required: boolean
}
