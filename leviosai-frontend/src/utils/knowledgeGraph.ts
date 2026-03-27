/**
 * LeviosAI Knowledge Graph — Client-side recommendation engine
 *
 * Provides instant scoring for:
 *   1. Domain → Hardware affinity
 *   2. Hardware × Model compatibility
 *   3. Technique synergy / conflict analysis
 */

// ── Hardware Specifications ───────────────────────────────────

interface HWSpec {
  tops: number
  memoryGb: number
  powerW: number
  category: string
}

const HW_SPECS: Record<string, HWSpec> = {
  jetson_thor:      { tops: 2000, memoryGb: 128, powerW: 100, category: 'Nvidia Jetson' },
  jetson_agx_orin:  { tops: 275,  memoryGb: 64,  powerW: 60,  category: 'Nvidia Jetson' },
  hailo8:           { tops: 26,   memoryGb: 2,   powerW: 2.5, category: 'Hailo' },
  hailo10:          { tops: 40,   memoryGb: 4,   powerW: 5,   category: 'Hailo' },
  snapdragon8elite: { tops: 100,  memoryGb: 16,  powerW: 8,   category: 'Mobile AP' },
  apple_a19pro:     { tops: 38,   memoryGb: 8,   powerW: 6,   category: 'Mobile AP' },
  tensor_g5:        { tops: 15,   memoryGb: 12,  powerW: 5,   category: 'Mobile AP' },
  intel_ultra3:     { tops: 47,   memoryGb: 32,  powerW: 28,  category: 'PC' },
  amd_ryzen_ai:     { tops: 50,   memoryGb: 32,  powerW: 28,  category: 'PC' },
  stm32:            { tops: 0.1,  memoryGb: 0.002, powerW: 0.1, category: 'Embedded' },
}

// ── Model Specifications ──────────────────────────────────────

interface ModelSpec {
  paramsM: number
  minTops: number
  minMemGb: number
  domain: string
}

const MODEL_SPECS: Record<string, ModelSpec> = {
  // Computer Vision
  yolov8n:         { paramsM: 3.2,   minTops: 2,   minMemGb: 0.3,  domain: 'Computer Vision' },
  yolov11s:        { paramsM: 9.4,   minTops: 5,   minMemGb: 0.5,  domain: 'Computer Vision' },
  mobilenetv3:     { paramsM: 2.5,   minTops: 1,   minMemGb: 0.2,  domain: 'Computer Vision' },
  efficientdet_lite: { paramsM: 3.4, minTops: 2,   minMemGb: 0.3,  domain: 'Computer Vision' },
  resnet50:        { paramsM: 25,    minTops: 10,  minMemGb: 1.5,  domain: 'Computer Vision' },
  ssd_mobilenet:   { paramsM: 4,     minTops: 2,   minMemGb: 0.3,  domain: 'Computer Vision' },
  yolov9c:         { paramsM: 25.3,  minTops: 12,  minMemGb: 1.5,  domain: 'Computer Vision' },
  detr_resnet50:   { paramsM: 41,    minTops: 20,  minMemGb: 2.5,  domain: 'Computer Vision' },
  efficientnetb0:  { paramsM: 5.3,   minTops: 3,   minMemGb: 0.4,  domain: 'Computer Vision' },
  nanodet_plus:    { paramsM: 1.2,   minTops: 0.5, minMemGb: 0.1,  domain: 'Computer Vision' },
  // LLM
  exaone4:         { paramsM: 1200,  minTops: 30,  minMemGb: 3,    domain: 'LLM' },
  qwen2_5:         { paramsM: 500,   minTops: 15,  minMemGb: 1.5,  domain: 'LLM' },
  llama3_2:        { paramsM: 1000,  minTops: 25,  minMemGb: 2.5,  domain: 'LLM' },
  tinyllama:       { paramsM: 1100,  minTops: 28,  minMemGb: 2.8,  domain: 'LLM' },
  phi3_mini:       { paramsM: 3800,  minTops: 60,  minMemGb: 8,    domain: 'LLM' },
  gemma2_2b:       { paramsM: 2000,  minTops: 40,  minMemGb: 5,    domain: 'LLM' },
  smollm2:         { paramsM: 1700,  minTops: 35,  minMemGb: 4,    domain: 'LLM' },
  mistral_7b:      { paramsM: 7000,  minTops: 100, minMemGb: 16,   domain: 'LLM' },
  llama3_1_8b:     { paramsM: 8000,  minTops: 120, minMemGb: 18,   domain: 'LLM' },
  deepseek_r1:     { paramsM: 1500,  minTops: 32,  minMemGb: 3.5,  domain: 'LLM' },
  // ASR
  tacotron2:       { paramsM: 28,    minTops: 5,   minMemGb: 0.5,  domain: 'Auto Speech Recognition' },
  whisper_small:   { paramsM: 244,   minTops: 15,  minMemGb: 1.5,  domain: 'Auto Speech Recognition' },
  wav2vec2_base:   { paramsM: 94,    minTops: 8,   minMemGb: 0.8,  domain: 'Auto Speech Recognition' },
  deepspeech:      { paramsM: 188,   minTops: 12,  minMemGb: 1.2,  domain: 'Auto Speech Recognition' },
  whisper_tiny:    { paramsM: 39,    minTops: 3,   minMemGb: 0.3,  domain: 'Auto Speech Recognition' },
  conformer:       { paramsM: 120,   minTops: 10,  minMemGb: 1,    domain: 'Auto Speech Recognition' },
  hubert_base:     { paramsM: 95,    minTops: 8,   minMemGb: 0.8,  domain: 'Auto Speech Recognition' },
  fastconformer:   { paramsM: 114,   minTops: 9,   minMemGb: 0.9,  domain: 'Auto Speech Recognition' },
  squeezeformer:   { paramsM: 64,    minTops: 5,   minMemGb: 0.5,  domain: 'Auto Speech Recognition' },
  zipformer:       { paramsM: 78,    minTops: 6,   minMemGb: 0.6,  domain: 'Auto Speech Recognition' },
  // BCI
  eegnet:          { paramsM: 0.0026, minTops: 0.01, minMemGb: 0.001, domain: 'BCI' },
  deepconvnet:     { paramsM: 0.14,   minTops: 0.05, minMemGb: 0.01,  domain: 'BCI' },
  shallowconvnet:  { paramsM: 0.048,  minTops: 0.02, minMemGb: 0.005, domain: 'BCI' },
  eegformer:       { paramsM: 5.8,    minTops: 1,    minMemGb: 0.1,   domain: 'BCI' },
  eeg_conformer:   { paramsM: 3.2,    minTops: 0.5,  minMemGb: 0.05,  domain: 'BCI' },
  fbcnet:          { paramsM: 0.012,   minTops: 0.01, minMemGb: 0.002, domain: 'BCI' },
  tidnet:          { paramsM: 0.086,   minTops: 0.03, minMemGb: 0.008, domain: 'BCI' },
  atcnet:          { paramsM: 0.115,   minTops: 0.04, minMemGb: 0.01,  domain: 'BCI' },
  eeginception:    { paramsM: 0.042,   minTops: 0.02, minMemGb: 0.005, domain: 'BCI' },
  bciiv2a_cnn:     { paramsM: 0.028,   minTops: 0.01, minMemGb: 0.003, domain: 'BCI' },
}

// ── Domain → Hardware Affinity ────────────────────────────────

const DOMAIN_HW_AFFINITY: Record<string, Record<string, number>> = {
  'Computer Vision': {
    'Nvidia Jetson': 95, 'Hailo': 88, 'Mobile AP': 75, 'PC': 72, 'Embedded': 35,
  },
  'LLM': {
    'Nvidia Jetson': 92, 'PC': 85, 'Mobile AP': 68, 'Hailo': 30, 'Embedded': 8,
  },
  'Auto Speech Recognition': {
    'Mobile AP': 90, 'PC': 85, 'Nvidia Jetson': 80, 'Hailo': 58, 'Embedded': 30,
  },
  'BCI': {
    'Embedded': 92, 'Mobile AP': 78, 'PC': 72, 'Nvidia Jetson': 65, 'Hailo': 55,
  },
}

// ── Technique Synergy Data ────────────────────────────────────

export interface Synergy {
  pair: [string, string]
  score: number
  label: string
  description: string
  recommendedOrder: string[]
}

const TECHNIQUE_SYNERGIES: Synergy[] = [
  { pair: ['pruning', 'quantization'], score: 88, label: 'Strong Synergy', description: 'Prune redundant weights first, then quantize for maximum compression', recommendedOrder: ['pruning', 'quantization'] },
  { pair: ['kd', 'quantization'], score: 85, label: 'Strong Synergy', description: 'Distill knowledge to a smaller model, then quantize for edge deployment', recommendedOrder: ['kd', 'quantization'] },
  { pair: ['kd', 'pruning'], score: 78, label: 'Good Synergy', description: 'Distill first, then prune the student model for further reduction', recommendedOrder: ['kd', 'pruning'] },
  { pair: ['quantization', 'tensorrt'], score: 95, label: 'Excellent Synergy', description: 'INT8 quantization + TensorRT compilation for maximum NVIDIA throughput', recommendedOrder: ['quantization', 'tensorrt'] },
  { pair: ['pruning', 'tensorrt'], score: 80, label: 'Good Synergy', description: 'Structured pruning reduces ops, TensorRT optimizes the execution graph', recommendedOrder: ['pruning', 'tensorrt'] },
  { pair: ['quantization', 'lora'], score: 90, label: 'Excellent Synergy', description: 'QLoRA combines 4-bit quantization with LoRA for memory-efficient tuning', recommendedOrder: ['quantization', 'lora'] },
  { pair: ['quantization', 'ctc_opt'], score: 82, label: 'Good Synergy', description: 'Quantized model with optimized CTC decoding for fast speech recognition', recommendedOrder: ['quantization', 'ctc_opt'] },
  { pair: ['quantization', 'streaming'], score: 80, label: 'Good Synergy', description: 'Quantized streaming pipeline for low-latency real-time ASR', recommendedOrder: ['quantization', 'streaming'] },
  { pair: ['ctc_opt', 'streaming'], score: 88, label: 'Strong Synergy', description: 'CTC greedy decoding is ideal for streaming chunk-based inference', recommendedOrder: ['streaming', 'ctc_opt'] },
  { pair: ['quantization', 'transfer'], score: 76, label: 'Moderate Synergy', description: 'Fine-tune via transfer learning, then quantize the adapted model', recommendedOrder: ['transfer', 'quantization'] },
  { pair: ['transfer', 'data_aug'], score: 85, label: 'Strong Synergy', description: 'Data augmentation improves generalization of transfer-learned BCI models', recommendedOrder: ['data_aug', 'transfer'] },
  { pair: ['pruning', 'lora'], score: 72, label: 'Moderate Synergy', description: 'Prune base model, then apply LoRA for efficient task adaptation', recommendedOrder: ['pruning', 'lora'] },
  { pair: ['kd', 'tensorrt'], score: 82, label: 'Good Synergy', description: 'Distill to a compact student model, then compile with TensorRT', recommendedOrder: ['kd', 'tensorrt'] },
  { pair: ['token_compression', 'quantization'], score: 78, label: 'Good Synergy', description: 'Reduce token count + quantize weights for compound LLM speedup', recommendedOrder: ['quantization', 'token_compression'] },
]

// Hardware-specific technique warnings
const TECHNIQUE_HW_CATEGORIES: Record<string, string[]> = {
  tensorrt: ['Nvidia Jetson'],
  lora: ['Nvidia Jetson', 'PC'],
}

// ── Scoring Helpers ───────────────────────────────────────────

function clamp(lo: number, hi: number, val: number): number {
  return Math.max(lo, Math.min(hi, val))
}

function sigmoid(ratio: number, midpoint = 1, steepness = 4): number {
  const x = (ratio / midpoint - 1) * steepness
  return 100 / (1 + Math.exp(-x))
}

// ── Public API ────────────────────────────────────────────────

export interface HardwareScore {
  deviceId: string
  category: string
  score: number
  reason: string
}

/**
 * Score all hardware devices for a given domain.
 * Returns sorted by score descending.
 */
export function getHardwareScores(domain: string): HardwareScore[] {
  const domainTopsNeeds: Record<string, number> = {
    'Computer Vision': 10,
    'LLM': 50,
    'Auto Speech Recognition': 8,
    'BCI': 0.5,
  }
  const needed = domainTopsNeeds[domain] ?? 10

  const results: HardwareScore[] = Object.entries(HW_SPECS).map(([id, hw]) => {
    const affinity = DOMAIN_HW_AFFINITY[domain]?.[hw.category] ?? 50
    const topsScore = sigmoid(hw.tops / (needed || 1))
    const powerScore = clamp(0, 100, 100 - hw.powerW * 0.5)
    const score = Math.round(clamp(0, 100, affinity * 0.55 + topsScore * 0.30 + powerScore * 0.15))

    let reason: string
    if (affinity >= 85) reason = `Highly optimized for ${domain}`
    else if (affinity >= 70) reason = `Good fit for ${domain}`
    else reason = `Moderate fit for ${domain}`

    return { deviceId: id, category: hw.category, score, reason }
  })

  results.sort((a, b) => b.score - a.score)
  return results
}

export interface ModelScore {
  modelId: string
  score: number
  reason: string
  topsRatio: number
}

/**
 * Score all domain models against specific hardware.
 * Returns sorted by score descending.
 */
export function getModelScores(domain: string, hardwareId: string): ModelScore[] {
  const hw = HW_SPECS[hardwareId]
  if (!hw) return []

  const results: ModelScore[] = Object.entries(MODEL_SPECS)
    .filter(([, spec]) => spec.domain === domain)
    .map(([id, model]) => {
      const topsRatio = model.minTops > 0 ? hw.tops / model.minTops : 999
      const memRatio = model.minMemGb > 0 ? hw.memoryGb / model.minMemGb : 999

      const topsScore = sigmoid(topsRatio, 1, 3)
      const memScore = sigmoid(memRatio, 1, 3)
      const penalty = topsRatio > 50 ? 10 : 0

      const score = Math.round(clamp(0, 100, topsScore * 0.55 + memScore * 0.45 - penalty))

      let reason: string
      if (topsRatio < 0.5) reason = `Insufficient: ${hw.tops} vs ${model.minTops} TOPS needed`
      else if (topsRatio < 1) reason = `Tight fit — optimization essential`
      else if (topsRatio < 3) reason = `Good match — balanced performance`
      else reason = `Ample headroom — room for batching`

      return { modelId: id, score, reason, topsRatio: Math.round(topsRatio * 10) / 10 }
    })

  results.sort((a, b) => b.score - a.score)
  return results
}

export interface TechniqueAnalysis {
  synergies: Synergy[]
  warnings: { technique: string; message: string }[]
  suggestions: { techniqueId: string; reason: string }[]
  recommendedOrder: string[]
}

/**
 * Analyze selected techniques for synergies, conflicts, and warnings.
 */
export function analyzeTechniques(
  techniqueIds: string[],
  domain?: string,
  hardwareId?: string,
): TechniqueAnalysis {
  const idSet = new Set(techniqueIds)

  // Synergies
  const synergies = TECHNIQUE_SYNERGIES.filter(
    s => idSet.has(s.pair[0]) && idSet.has(s.pair[1]),
  )

  // Hardware warnings
  const warnings: { technique: string; message: string }[] = []
  if (hardwareId) {
    const hw = HW_SPECS[hardwareId]
    if (hw) {
      for (const techId of techniqueIds) {
        const allowedCats = TECHNIQUE_HW_CATEGORIES[techId]
        if (allowedCats && !allowedCats.includes(hw.category)) {
          warnings.push({
            technique: techId,
            message: `${techId} is optimized for ${allowedCats.join(', ')} — limited benefit on ${hw.category}`,
          })
        }
      }
    }
  }

  // Suggestions
  const suggestions: { techniqueId: string; reason: string }[] = []
  if (hardwareId) {
    const hw = HW_SPECS[hardwareId]
    if (hw?.category === 'Nvidia Jetson' && !idSet.has('tensorrt')) {
      suggestions.push({ techniqueId: 'tensorrt', reason: 'TensorRT compilation recommended for NVIDIA Jetson' })
    }
    if (hw?.category === 'Embedded' && !idSet.has('quantization')) {
      suggestions.push({ techniqueId: 'quantization', reason: 'Quantization is essential for MCU-class embedded' })
    }
  }
  if (domain === 'LLM' && !idSet.has('lora') && idSet.has('quantization')) {
    suggestions.push({ techniqueId: 'lora', reason: 'QLoRA pairs well with quantization for efficient LLM fine-tuning' })
  }

  // Recommended order
  const ORDER: Record<string, number> = {
    data_aug: 1, transfer: 2, kd: 3, pruning: 4, lora: 5,
    token_compression: 6, quantization: 7, ctc_opt: 8, streaming: 9, tensorrt: 10,
  }
  const recommendedOrder = [...techniqueIds].sort((a, b) => (ORDER[a] ?? 50) - (ORDER[b] ?? 50))

  return { synergies, warnings, suggestions, recommendedOrder }
}
