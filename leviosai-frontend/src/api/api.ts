import type { CompatibilityResult, CustomHardwareResult } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const API_KEY_STORAGE = 'leviosai_gemini_key'

export function getApiKey(): string { return localStorage.getItem(API_KEY_STORAGE) ?? '' }
export function setApiKey(key: string) { localStorage.setItem(API_KEY_STORAGE, key.trim()) }
export function clearApiKey() { localStorage.removeItem(API_KEY_STORAGE) }
export function hasApiKey(): boolean { return !!localStorage.getItem(API_KEY_STORAGE)?.trim() }

export async function validateApiKey(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/validate-key`, {
    method: 'POST',
    headers: { 'X-Gemini-Api-Key': key.trim() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid API key' })) as { detail?: string }
    throw new Error(err.detail ?? 'Invalid API key')
  }
}

export async function analyzeHardwarePdf(file: File): Promise<CustomHardwareResult> {
  const apiKey = getApiKey()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/analyze-hardware`, {
    method: 'POST',
    headers: apiKey ? { 'X-Gemini-Api-Key': apiKey } : {},
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Analysis failed' })) as { detail?: string }
    throw new Error(err.detail ?? 'Analysis failed')
  }
  return res.json() as Promise<CustomHardwareResult>
}

// ── Call Gemini API directly from browser ────────────────────
export async function callGeminiDirect(
  systemPrompt: string,
  userMessage: string,
  temperature = 0.7,
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('API key not set. Please configure your Gemini API key first.')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature, maxOutputTokens: 2048 },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? 'Gemini API error')
  }
  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Types ────────────────────────────────────────────────────
export interface LoginResult { message: string }
export interface CompatibilityRequest {
  domain: string; hardware_category: string; hardware_device: string
  model_name: string; model_params?: string
}
export interface TechniqueItemReq { id: string; name: string; subtype?: string }
export interface CodeGenRequest {
  domain: string; hardware_category: string; hardware_device: string
  model_name: string; techniques: TechniqueItemReq[]; language: string
  modification_prompt?: string
}
export interface CodeGenResult { code: string; language: string; model: string; hardware: string; techniques: string[] }
export interface ModelInfoResult {
  arxiv_url: string | null; github_url: string | null; huggingface_url: string | null
  year: string | null; organization: string | null
  performance: Array<{ label: string; value: number; description: string }>
}

// ── Fetch helper ─────────────────────────────────────────────
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const apiKey = getApiKey()
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
    ...(apiKey ? { 'X-Gemini-Api-Key': apiKey } : {}),
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' })) as { detail?: string }
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

// ── API Client ───────────────────────────────────────────────
export const api = {
  login: (username: string, password: string): Promise<LoginResult> =>
    fetchJSON(`${API_BASE}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  checkCompatibility: (data: CompatibilityRequest): Promise<CompatibilityResult> =>
    fetchJSON(`${API_BASE}/api/check-compatibility`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  generateCode: (data: CodeGenRequest): Promise<CodeGenResult> =>
    fetchJSON(`${API_BASE}/api/generate-code`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getModelInfo: (modelName: string, domain: string): Promise<ModelInfoResult> =>
    fetchJSON(`${API_BASE}/api/model-info`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name: modelName, domain }),
    }),
}

// ── Static Data ──────────────────────────────────────────────
export const DOMAINS = [
  { id: 'cv',  name: 'Computer Vision',         description: 'Image & video analysis for object detection, classification, and segmentation' },
  { id: 'llm', name: 'LLM',                     description: 'Large Language Models for text generation, understanding, and reasoning' },
  { id: 'asr', name: 'Auto Speech Recognition', description: 'TTS/STT models for speech synthesis and voice recognition' },
  { id: 'bci', name: 'BCI',                     description: 'Brain-Computer Interface models for EEG / neural signal decoding and motor imagery classification' },
]

export const HARDWARE: Record<string, { description: string; devices: { id: string; name: string; specs: string }[] }> = {
  'Nvidia Jetson': {
    description: 'High-performance edge AI computing modules',
    devices: [
      { id: 'jetson_thor',     name: 'Jetson Thor',     specs: 'ARM Cortex-A78AE, 2000 TOPS' },
      { id: 'jetson_agx_orin', name: 'Jetson AGX Orin', specs: 'ARM Cortex-A78AE, 275 TOPS' },
    ],
  },
  'Hailo': {
    description: 'Dedicated AI inference acceleration chips',
    devices: [
      { id: 'hailo8',  name: 'Hailo-8',  specs: '26 TOPS, 2.5W' },
      { id: 'hailo10', name: 'Hailo-10', specs: '40 TOPS, 5W' },
    ],
  },
  'Mobile AP': {
    description: 'Mobile application processors with dedicated AI engines',
    devices: [
      { id: 'snapdragon8elite', name: 'Qualcomm Snapdragon 8 Elite Gen 5', specs: 'Hexagon NPU, 100+ TOPS' },
      { id: 'apple_a19pro',     name: 'Apple A19 Pro',                     specs: 'Neural Engine, 38+ TOPS' },
      { id: 'tensor_g5',        name: 'Google Tensor G5',                  specs: 'TPU, 15 TOPS' },
    ],
  },
  'PC': {
    description: 'Desktop/laptop processors with integrated AI acceleration',
    devices: [
      { id: 'intel_ultra3',  name: 'Intel Core Ultra Series 3',  specs: 'Intel NPU, 47 TOPS' },
      { id: 'amd_ryzen_ai',  name: 'AMD Ryzen AI (Strix Point+)', specs: 'XDNA 2 NPU, 50 TOPS' },
    ],
  },
  'Embedded': {
    description: 'Microcontroller-based embedded systems for ultra-low-power inference',
    devices: [
      { id: 'stm32', name: 'STM32 Series', specs: 'ARM Cortex-M, MCU-class' },
    ],
  },
}

// Hardware details for the Preview panel (keyed by device id)
export const HARDWARE_DETAILS: Record<string, {
  productUrl: string
  datasheetUrl: string | null
  features: string[]
}> = {
  jetson_thor: {
    productUrl: 'https://developer.nvidia.com/embedded/jetson-thor',
    datasheetUrl: null,
    features: ['ARM Cortex-A78AE CPU', '2000+ TOPS (projected)', 'NVIDIA Blackwell GPU', 'Designed for humanoid robotics'],
  },
  jetson_agx_orin: {
    productUrl: 'https://developer.nvidia.com/embedded/jetson-agx-orin-developer-kit',
    datasheetUrl: 'https://developer.nvidia.com/downloads/assets/embedded/secure/jetson/agx_orin/docs/jetson_agx_orin_module_ds_v1.0.pdf',
    features: ['12-core ARM Cortex-A78AE', '64 GB LPDDR5', '275 TOPS', '64 Ampere CUDA cores', 'PCIe Gen 4 x8'],
  },
  hailo8: {
    productUrl: 'https://hailo.ai/products/hailo-8/',
    datasheetUrl: 'https://hailo.ai/wp-content/uploads/2023/01/Hailo-8-Product-Brief-2023.pdf',
    features: ['26 TOPS inference', '2.5 W typical power', 'M.2 / mPCIe form factor', 'Raspberry Pi HAT available'],
  },
  hailo10: {
    productUrl: 'https://hailo.ai/products/hailo-10/',
    datasheetUrl: null,
    features: ['40 TOPS inference', '5 W TDP', 'Generative AI support', 'Ultra-low latency streaming'],
  },
  snapdragon8elite: {
    productUrl: 'https://www.qualcomm.com/products/mobile/snapdragon/smartphones/snapdragon-8-series-mobile-platforms/snapdragon-8-elite',
    datasheetUrl: null,
    features: ['Oryon CPU (4+4 cores)', 'Hexagon NPU 100+ TOPS', 'Adreno 830 GPU', '4 nm TSMC process'],
  },
  apple_a19pro: {
    productUrl: 'https://www.apple.com/iphone/',
    datasheetUrl: null,
    features: ['6-core Neural Engine 38+ TOPS', 'Apple Intelligence on-device', '6-core GPU', '3 nm process node'],
  },
  tensor_g5: {
    productUrl: 'https://store.google.com/gb/category/phones',
    datasheetUrl: null,
    features: ['Custom Google TPU 15 TOPS', 'Gemini Nano on-device', 'Titan M3 security chip', 'TSMC 3 nm'],
  },
  intel_ultra3: {
    productUrl: 'https://www.intel.com/content/www/us/en/products/docs/processors/core-ultra/core-ultra-3-series.html',
    datasheetUrl: null,
    features: ['Intel NPU 47 TOPS', 'Intel Arc iGPU', 'DDR5 / LPDDR5X support', 'PCIe 5.0 x16'],
  },
  amd_ryzen_ai: {
    productUrl: 'https://www.amd.com/en/products/processors/laptop/ryzen/ryzen-ai-processor-series.html',
    datasheetUrl: null,
    features: ['XDNA 2 NPU 50 TOPS', 'RDNA 3.5 iGPU', 'Zen 5 CPU cores', '4 nm process'],
  },
  stm32: {
    productUrl: 'https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html',
    datasheetUrl: 'https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf',
    features: ['ARM Cortex-M series (M0→M7)', 'µW-range sleep current', 'STM32Cube.AI for ML', 'Extensive HAL library'],
  },
}

export const MODELS: Record<string, { id: string; name: string; params: string; description: string }[]> = {
  'Computer Vision': [
    { id: 'yolov8n',         name: 'YOLOv8n',            params: '3.2M',  description: 'Nano YOLO for real-time object detection' },
    { id: 'yolov11s',        name: 'YOLOv11s',           params: '9.4M',  description: 'Latest YOLO architecture, small variant' },
    { id: 'mobilenetv3',     name: 'MobileNetV3-Small',  params: '2.5M',  description: 'Lightweight image classification' },
    { id: 'efficientdet_lite', name: 'EfficientDet-Lite0', params: '3.4M', description: 'Mobile-optimized object detection' },
    { id: 'resnet50',        name: 'ResNet50',            params: '25M',   description: 'Deep residual network for classification' },
    { id: 'ssd_mobilenet',   name: 'SSD MobileNetV2',    params: '4M',    description: 'Fast single-shot multi-box detection' },
  ],
  'LLM': [
    { id: 'exaone4',   name: 'Exaone 4.0 1.2B', params: '1.2B', description: 'LG AI Research edge-optimized LLM' },
    { id: 'qwen2_5',   name: 'Qwen2.5-0.5B',   params: '0.5B', description: 'Alibaba ultra-lightweight LLM' },
    { id: 'llama3_2',  name: 'LLaMA 3.2 1B',   params: '1B',   description: 'Meta edge-optimized LLaMA' },
    { id: 'tinyllama', name: 'TinyLLaMA-1.1B',  params: '1.1B', description: "Community's smallest LLaMA-compatible model" },
    { id: 'phi3_mini', name: 'Phi-3 Mini 3.8B', params: '3.8B', description: 'Microsoft small language model' },
  ],
  'Auto Speech Recognition': [
    { id: 'tacotron2',    name: 'Tacotron 2',      params: '28M',  description: 'Google Neural TTS synthesizer' },
    { id: 'whisper_small', name: 'Whisper Small',   params: '244M', description: 'OpenAI multilingual STT model' },
    { id: 'wav2vec2_base', name: 'Wav2Vec 2.0 Base', params: '94M', description: 'Meta self-supervised speech recognition' },
    { id: 'deepspeech',   name: 'DeepSpeech 0.9',  params: '188M', description: 'Mozilla open-source STT' },
  ],
  'BCI': [
    { id: 'eegnet',        name: 'EEGNet',        params: '2.6K', description: 'Compact CNN for EEG-based BCI classification' },
    { id: 'deepconvnet',   name: 'DeepConvNet',   params: '140K', description: 'Deep EEG classification for motor imagery' },
    { id: 'shallowconvnet', name: 'ShallowConvNet', params: '48K', description: 'Shallow CNN for raw EEG decoding' },
    { id: 'eegformer',     name: 'EEGFormer',     params: '5.8M', description: 'Transformer-based EEG neural decoding' },
  ],
}

export const TECHNIQUES = [
  {
    id: 'quantization', name: 'Quantization',
    description: 'Reduce weight precision (FP32 → INT8/INT4) to shrink model size and speed up inference',
    subtypes: [
      { id: 'ptq', name: 'PTQ', fullName: 'Post Training Quantization', description: 'Quantize after training. Fast, no retraining required.' },
      { id: 'qat', name: 'QAT', fullName: 'Quantization Aware Training', description: 'Simulate quantization during training for higher accuracy. Requires retraining.' },
    ],
  },
  {
    id: 'pruning', name: 'Pruning',
    description: 'Remove redundant weights or neurons to reduce model size and computation',
    subtypes: [
      { id: 'unstructured', name: 'Unstructured', fullName: 'Unstructured Pruning', description: 'Remove individual weights. High compression, harder to accelerate on hardware.' },
      { id: 'structured',   name: 'Structured',   fullName: 'Structured Pruning',   description: 'Remove entire channels/filters. Hardware-friendly with direct inference speedup.' },
    ],
  },
  {
    id: 'kd', name: 'Knowledge Distillation',
    description: 'Train a compact student model to mimic a larger teacher model behavior',
    subtypes: [
      { id: 'response', name: 'Response-Based', fullName: 'Response-Based KD', description: "Student learns from teacher's output probability distributions." },
      { id: 'feature',  name: 'Feature-Based',  fullName: 'Feature-Based KD',  description: "Student learns from teacher's intermediate feature representations." },
    ],
  },
]

// Domain-specific techniques
export const TECHNIQUES_BY_DOMAIN: Record<string, typeof TECHNIQUES> = {
  'Computer Vision': [
    TECHNIQUES[0], // Quantization
    TECHNIQUES[1], // Pruning
    TECHNIQUES[2], // Knowledge Distillation
    {
      id: 'tensorrt', name: 'TensorRT Optimization',
      description: 'NVIDIA TensorRT engine compilation for maximum GPU inference throughput',
      subtypes: [
        { id: 'fp16', name: 'FP16', fullName: 'FP16 Precision', description: 'Half-precision floating point for 2× speedup with minimal accuracy loss.' },
        { id: 'int8_calib', name: 'INT8+Calibration', fullName: 'INT8 with Calibration', description: 'Integer 8-bit with dataset calibration for highest TensorRT performance.' },
      ],
    },
  ],
  'LLM': [
    TECHNIQUES[0], // Quantization
    TECHNIQUES[1], // Pruning
    TECHNIQUES[2], // Knowledge Distillation
    {
      id: 'lora', name: 'LoRA / QLoRA',
      description: 'Low-Rank Adaptation for efficient fine-tuning and compression of large language models',
      subtypes: [
        { id: 'lora_base', name: 'LoRA', fullName: 'Low-Rank Adaptation', description: 'Inject trainable low-rank matrices for efficient parameter fine-tuning.' },
        { id: 'qlora',     name: 'QLoRA', fullName: 'Quantized LoRA', description: 'Combines 4-bit quantization with LoRA for memory-efficient training.' },
      ],
    },
    {
      id: 'token_compression', name: 'Token Compression',
      description: 'Reduce input token count through merging or pruning for faster LLM inference',
      subtypes: [
        { id: 'token_merge', name: 'Token Merging', fullName: 'Token Merging (ToMe)', description: 'Merge similar tokens to reduce sequence length without retraining.' },
        { id: 'token_prune', name: 'Token Pruning', fullName: 'Dynamic Token Pruning', description: 'Dynamically drop low-importance tokens during inference.' },
      ],
    },
  ],
  'Auto Speech Recognition': [
    TECHNIQUES[0], // Quantization
    TECHNIQUES[1], // Pruning
    {
      id: 'ctc_opt', name: 'CTC Optimization',
      description: 'Connectionist Temporal Classification decoding optimizations for faster STT',
      subtypes: [
        { id: 'ctc_greedy', name: 'Greedy Decode', fullName: 'CTC Greedy Decoding', description: 'Fastest CTC decoding path with minimal overhead.' },
        { id: 'ctc_beam',   name: 'Beam Search', fullName: 'CTC Beam Search', description: 'Higher accuracy beam search decoding with configurable width.' },
      ],
    },
    {
      id: 'streaming', name: 'Streaming Inference',
      description: 'Chunk-based streaming for real-time low-latency speech processing',
      subtypes: [
        { id: 'chunk_based', name: 'Chunk-Based', fullName: 'Chunk-Based Streaming', description: 'Process audio in fixed-size chunks for constant latency.' },
        { id: 'vad_trigger', name: 'VAD-Triggered', fullName: 'Voice Activity Detection Trigger', description: 'Process only speech segments using VAD gating.' },
      ],
    },
  ],
  'BCI': [
    TECHNIQUES[0], // Quantization
    TECHNIQUES[1], // Pruning
    {
      id: 'transfer', name: 'Transfer Learning',
      description: 'Adapt pre-trained EEG models to new subjects or paradigms with minimal data',
      subtypes: [
        { id: 'fine_tune', name: 'Fine-Tuning', fullName: 'Subject-Specific Fine-Tuning', description: 'Freeze early layers and fine-tune on target subject EEG data.' },
        { id: 'domain_adapt', name: 'Domain Adaptation', fullName: 'Cross-Subject Domain Adaptation', description: 'Align feature distributions across subjects for generalization.' },
      ],
    },
    {
      id: 'data_aug', name: 'Data Augmentation',
      description: 'Generate synthetic EEG samples to improve generalization and robustness',
      subtypes: [
        { id: 'noise_inject', name: 'Noise Injection', fullName: 'Gaussian Noise Injection', description: 'Add controlled noise to EEG signals for regularization.' },
        { id: 'freq_shift',   name: 'Frequency Shift', fullName: 'Frequency-Domain Augmentation', description: 'Shift frequency bands to simulate different neural states.' },
      ],
    },
  ],
}

// Sensors / peripheral options
export const SENSORS = [
  { id: 'camera',     name: 'Camera',         type: 'Vision',    specs: 'Up to 4K@60fps',          description: 'RGB/RGBD camera for visual perception & CV inference' },
  { id: 'lidar',      name: 'LiDAR',          type: 'Depth',     specs: '360°, 100 m range',        description: '3D point cloud for environment mapping & obstacle detection' },
  { id: 'radar',      name: 'Radar',          type: 'RF',        specs: '77 GHz, all-weather',      description: 'Radio wave-based object detection, works in fog & rain' },
  { id: 'mic',        name: 'Microphone',     type: 'Audio',     specs: 'Array mic, noise-cancel',  description: 'Audio capture for speech recognition & sound events' },
  { id: 'imu',        name: 'IMU',            type: 'Motion',    specs: '6-DOF, 1 kHz',            description: 'Inertial measurement for motion tracking & navigation' },
  { id: 'thermal',    name: 'Thermal Camera', type: 'Thermal',   specs: '640×512, −20~550 °C',     description: 'Infrared thermal imaging for heat signature detection' },
  { id: 'ultrasonic', name: 'Ultrasonic',     type: 'Proximity', specs: '2 cm – 4 m range',        description: 'Short-range distance sensing for proximity detection' },
  { id: 'gps',        name: 'GPS / GNSS',     type: 'Location',  specs: 'Multi-band, cm accuracy', description: 'Global positioning and satellite navigation' },
]

// Domain detail info for the right-side panel in Step 1
export const DOMAIN_DETAILS: Record<string, {
  tagline: string
  industries: string[]
  useCases: { title: string; description: string }[]
  keyTechs: string[]
}> = {
  'Computer Vision': {
    tagline: 'Enable machines to interpret and understand visual information from the world',
    industries: ['Automotive & ADAS', 'Healthcare & Medical Imaging', 'Retail & Smart Checkout', 'Industrial Inspection', 'Security & Surveillance', 'Agriculture & Crop Monitoring'],
    useCases: [
      { title: 'Autonomous Driving', description: 'Real-time object detection and lane tracking for self-driving vehicles' },
      { title: 'Medical Diagnosis', description: 'Tumor detection and pathology analysis from CT/MRI scans' },
      { title: 'Quality Control', description: 'Defect detection on manufacturing production lines' },
      { title: 'Smart Retail', description: 'Cashier-less checkout and shelf inventory management' },
    ],
    keyTechs: ['YOLO', 'ResNet', 'EfficientDet', 'TensorRT', 'OpenCV'],
  },
  'LLM': {
    tagline: 'Deploy large language model intelligence directly on edge devices',
    industries: ['Consumer Electronics', 'Enterprise Software', 'Healthcare', 'Education & E-Learning', 'Customer Service', 'Legal & Compliance'],
    useCases: [
      { title: 'On-Device Assistant', description: 'Private AI assistant running locally without cloud dependency' },
      { title: 'Code Completion', description: 'Real-time code suggestion and generation in IDEs' },
      { title: 'Document Analysis', description: 'Summarization and Q&A over private enterprise documents' },
      { title: 'Offline Translation', description: 'Real-time language translation without internet connectivity' },
    ],
    keyTechs: ['LLaMA', 'Phi-3', 'Qwen', 'llama.cpp', 'GGUF/GGML'],
  },
  'Auto Speech Recognition': {
    tagline: 'Convert speech to text and synthesize natural-sounding audio at the edge',
    industries: ['Smart Home & IoT', 'Automotive In-Cabin', 'Healthcare Documentation', 'Call Centers', 'Broadcasting & Media', 'Accessibility Tools'],
    useCases: [
      { title: 'Voice Assistant', description: 'Always-on wake word detection and voice command processing' },
      { title: 'Medical Transcription', description: 'Real-time clinical note-taking from physician dictation' },
      { title: 'In-Car ASR', description: 'Hands-free navigation and control in automotive systems' },
      { title: 'Live Captioning', description: 'Real-time speech-to-text for accessibility and broadcasting' },
    ],
    keyTechs: ['Whisper', 'Wav2Vec2', 'Tacotron2', 'ONNX Runtime', 'WebRTC VAD'],
  },
  'BCI': {
    tagline: 'Decode neural signals to bridge the gap between mind and machine',
    industries: ['Neurotechnology', 'Medical Rehabilitation', 'Gaming & XR', 'Military & Defense', 'Research & Academia', 'Assistive Technology'],
    useCases: [
      { title: 'Motor Imagery Control', description: 'Control prosthetics and wheelchairs via imagined movement EEG' },
      { title: 'Neurofeedback Therapy', description: 'Real-time EEG biofeedback for ADHD and anxiety treatment' },
      { title: 'Cognitive Load Monitoring', description: 'Detect pilot/operator fatigue from neural signal patterns' },
      { title: 'Thought-to-Text', description: 'Decode intended speech from neural activity for paralyzed patients' },
    ],
    keyTechs: ['EEGNet', 'EEGFormer', 'MNE-Python', 'BrainFlow', 'OpenBCI'],
  },
}

export const LANGUAGES = ['Python', 'C++', 'C', 'CUDA', 'TensorRT Python']

// File formats for code download (lang maps to API language param, ext = file extension)
export const FILE_FORMATS = [
  { lang: 'Python',           ext: 'py',    label: 'Python (.py)' },
  { lang: 'Python',           ext: 'ipynb', label: 'Python Notebook (.ipynb)' },
  { lang: 'C++',              ext: 'cpp',   label: 'C++ (.cpp)' },
  { lang: 'C',                ext: 'c',     label: 'C (.c)' },
  { lang: 'CUDA',             ext: 'cu',    label: 'CUDA (.cu)' },
  { lang: 'TensorRT Python',  ext: 'py',    label: 'TensorRT Python (.py)' },
]

// Chatbot step-specific context (7 steps)
export const CHATBOT_CONTEXTS: Record<number, { title: string; systemPrompt: string; welcome: string }> = {
  1: {
    title: 'Domain Selection',
    systemPrompt: 'You are LeviosAI, a professional Edge AI optimization assistant. Help the user choose an AI application domain. Available domains: Computer Vision (object detection/classification/segmentation), LLM (text generation/reasoning), Auto Speech Recognition (TTS/STT), BCI (Brain-Computer Interface/EEG decoding). Be concise, technical, and professional.',
    welcome: 'I can help you select the right AI domain. What is your target use case?',
  },
  2: {
    title: 'Hardware & Sensors',
    systemPrompt: 'You are LeviosAI, a professional Edge AI optimization assistant. Help the user select edge hardware and sensors. Hardware: NVIDIA Jetson (high TOPS, robotics), Hailo (dedicated AI chip, low power), Mobile AP (Snapdragon/Apple/Tensor), PC (Intel/AMD with NPU), Embedded (STM32). Sensors: Camera, LiDAR, Radar, Microphone, IMU, Thermal, Ultrasonic, GPS. Advise on sensor fusion and power budgets.',
    welcome: 'Tell me your deployment scenario — I will recommend optimal hardware and sensors.',
  },
  3: {
    title: 'Hardware Configuration',
    systemPrompt: 'You are LeviosAI, a professional Edge AI optimization assistant. Help the user understand their hardware pipeline configuration. Explain sensor data flows, bandwidth requirements, synchronization challenges, and how data moves from sensors through the main compute unit to the AI model.',
    welcome: 'Your hardware pipeline is configured. Ask me about data flows, bandwidth, or sensor fusion strategies.',
  },
  4: {
    title: 'AI Model Selection',
    systemPrompt: 'You are LeviosAI, a professional Edge AI optimization assistant. Help select AI models. CV: YOLOv8n/YOLOv11s/MobileNetV3/EfficientDet/ResNet50/SSD MobileNet. LLM: Exaone/Qwen/LLaMA/TinyLLaMA/Phi-3. ASR: Tacotron2/Whisper/Wav2Vec2/DeepSpeech. BCI: EEGNet/DeepConvNet/ShallowConvNet/EEGFormer. Explain architectures and edge performance.',
    welcome: 'I can compare model architectures and help you pick the best fit for your hardware.',
  },
  5: {
    title: 'Optimization Techniques',
    systemPrompt: 'You are LeviosAI, a professional Edge AI optimization assistant. Explain domain-specific optimization techniques: CV: Quantization/Pruning/KD/TensorRT. LLM: Quantization/LoRA/Token Compression. ASR: CTC Optimization/Streaming Inference. BCI: Transfer Learning/Data Augmentation. Give concrete recommendations based on domain, hardware, and model.',
    welcome: 'Ask me about optimization techniques best suited for your domain and hardware.',
  },
  6: {
    title: 'Code Generation',
    systemPrompt: 'You are LeviosAI, a professional Edge AI optimization assistant. Help with the generated deployment code. Explain code sections, debug issues, suggest performance improvements, and answer questions about PyTorch, TensorRT, ONNX, and edge deployment best practices.',
    welcome: 'Code generated! Ask me to explain any section or suggest optimizations.',
  },
  7: {
    title: 'Project Complete',
    systemPrompt: 'You are LeviosAI, a professional Edge AI optimization assistant. The user has completed their edge AI pipeline configuration. Help them understand next steps: deployment, testing, benchmarking, and maintenance. Suggest tools like NVIDIA DeepStream, TensorRT, ONNX Runtime for their specific configuration.',
    welcome: 'Your project is ready! Ask me about deployment strategies, benchmarking tools, or next steps.',
  },
}
