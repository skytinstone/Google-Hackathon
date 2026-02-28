import type { CompatibilityResult, CustomHardwareResult } from '../types'

// ============================================================
// API Base URL
// In development: empty string — Vite proxy routes /api/* and /login to localhost:8000
// In production:  set VITE_API_BASE_URL in Vercel dashboard (e.g. https://api.leviosai.cloud)
// ============================================================

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

// ============================================================
// Gemini API Key (stored in localStorage for local dev)
// ============================================================

const API_KEY_STORAGE = 'leviosai_gemini_key'

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? ''
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key.trim())
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE)
}

export function hasApiKey(): boolean {
  return !!localStorage.getItem(API_KEY_STORAGE)?.trim()
}

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

// ============================================================
// API Request/Response Types
// ============================================================

export interface LoginResult {
  message: string
}

export interface CompatibilityRequest {
  domain: string
  hardware_category: string
  hardware_device: string
  model_name: string
  model_params?: string
}

export interface TechniqueItemReq {
  id: string
  name: string
  subtype?: string
}

export interface CodeGenRequest {
  domain: string
  hardware_category: string
  hardware_device: string
  model_name: string
  techniques: TechniqueItemReq[]
  language: string
}

export interface CodeGenResult {
  code: string
  language: string
  model: string
  hardware: string
  techniques: string[]
}

export interface ModelInfoResult {
  arxiv_url: string | null
  github_url: string | null
  huggingface_url: string | null
  year: string | null
  organization: string | null
  performance: Array<{ label: string; value: number; description: string }>
}

// ============================================================
// Fetch Helper
// ============================================================

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

// ============================================================
// API Client
// ============================================================

export const api = {
  login: (username: string, password: string): Promise<LoginResult> =>
    fetchJSON(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  checkCompatibility: (data: CompatibilityRequest): Promise<CompatibilityResult> =>
    fetchJSON(`${API_BASE}/api/check-compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  generateCode: (data: CodeGenRequest): Promise<CodeGenResult> =>
    fetchJSON(`${API_BASE}/api/generate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getModelInfo: (modelName: string, domain: string): Promise<ModelInfoResult> =>
    fetchJSON(`${API_BASE}/api/model-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name: modelName, domain }),
    }),
}

// ============================================================
// Static Data (client-side, avoids extra network requests)
// ============================================================

export const DOMAINS = [
  {
    id: 'cv',
    name: 'Computer Vision',
    description: 'Image & video analysis for object detection, classification, and segmentation',
  },
  {
    id: 'llm',
    name: 'LLM',
    description: 'Large Language Models for text generation, understanding, and reasoning',
  },
  {
    id: 'asr',
    name: 'Auto Speech Recognition',
    description: 'TTS/STT models for speech synthesis and voice recognition',
  },
]

export const HARDWARE: Record<string, { description: string; devices: { id: string; name: string; specs: string }[] }> = {
  'Nvidia Jetson': {
    description: 'High-performance edge AI computing modules',
    devices: [
      { id: 'jetson_thor', name: 'Jetson Thor', specs: 'ARM Cortex-A78AE, 2000 TOPS' },
      { id: 'jetson_agx_orin', name: 'Jetson AGX Orin', specs: 'ARM Cortex-A78AE, 275 TOPS' },
    ],
  },
  'Hailo': {
    description: 'Dedicated AI inference acceleration chips',
    devices: [
      { id: 'hailo8', name: 'Hailo-8', specs: '26 TOPS, 2.5W' },
      { id: 'hailo10', name: 'Hailo-10', specs: '40 TOPS, 5W' },
    ],
  },
  'Mobile AP': {
    description: 'Mobile application processors with dedicated AI engines',
    devices: [
      { id: 'snapdragon8elite', name: 'Qualcomm Snapdragon 8 Elite Gen 5', specs: 'Hexagon NPU, 100+ TOPS' },
      { id: 'apple_a19pro', name: 'Apple A19 Pro', specs: 'Neural Engine, 38+ TOPS' },
      { id: 'tensor_g5', name: 'Google Tensor G5', specs: 'TPU, 15 TOPS' },
    ],
  },
  'PC': {
    description: 'Desktop/laptop processors with integrated AI acceleration',
    devices: [
      { id: 'intel_ultra3', name: 'Intel Core Ultra Series 3', specs: 'Intel NPU, 47 TOPS' },
      { id: 'amd_ryzen_ai', name: 'AMD Ryzen AI (Strix Point+)', specs: 'XDNA 2 NPU, 50 TOPS' },
    ],
  },
  'Embedded': {
    description: 'Microcontroller-based embedded systems for ultra-low-power inference',
    devices: [
      { id: 'stm32', name: 'STM32 Series', specs: 'ARM Cortex-M, MCU-class' },
    ],
  },
}

export const MODELS: Record<string, { id: string; name: string; params: string; description: string }[]> = {
  'Computer Vision': [
    { id: 'yolov8n', name: 'YOLOv8n', params: '3.2M', description: 'Nano YOLO for real-time object detection' },
    { id: 'yolov11s', name: 'YOLOv11s', params: '9.4M', description: 'Latest YOLO architecture, small variant' },
    { id: 'mobilenetv3', name: 'MobileNetV3-Small', params: '2.5M', description: 'Lightweight image classification' },
    { id: 'efficientdet_lite', name: 'EfficientDet-Lite0', params: '3.4M', description: 'Mobile-optimized object detection' },
    { id: 'resnet50', name: 'ResNet50', params: '25M', description: 'Deep residual network for classification' },
    { id: 'ssd_mobilenet', name: 'SSD MobileNetV2', params: '4M', description: 'Fast single-shot multi-box detection' },
  ],
  'LLM': [
    { id: 'exaone4', name: 'Exaone 4.0 1.2B', params: '1.2B', description: 'LG AI Research edge-optimized LLM' },
    { id: 'qwen2_5', name: 'Qwen2.5-0.5B', params: '0.5B', description: 'Alibaba ultra-lightweight LLM' },
    { id: 'llama3_2', name: 'LLaMA 3.2 1B', params: '1B', description: 'Meta edge-optimized LLaMA' },
    { id: 'tinyllama', name: 'TinyLLaMA-1.1B', params: '1.1B', description: "Community's smallest LLaMA-compatible model" },
    { id: 'phi3_mini', name: 'Phi-3 Mini 3.8B', params: '3.8B', description: 'Microsoft small language model' },
  ],
  'Auto Speech Recognition': [
    { id: 'tacotron2', name: 'Tacotron 2', params: '28M', description: 'Google Neural TTS synthesizer' },
    { id: 'whisper_small', name: 'Whisper Small', params: '244M', description: 'OpenAI multilingual STT model' },
    { id: 'wav2vec2_base', name: 'Wav2Vec 2.0 Base', params: '94M', description: 'Meta self-supervised speech recognition' },
    { id: 'deepspeech', name: 'DeepSpeech 0.9', params: '188M', description: 'Mozilla open-source STT' },
  ],
}

export const TECHNIQUES = [
  {
    id: 'quantization',
    name: 'Quantization',
    description: 'Reduce weight precision (FP32 → INT8/INT4) to shrink model size and speed up inference',
    subtypes: [
      { id: 'ptq', name: 'PTQ', fullName: 'Post Training Quantization', description: 'Quantize after training. Fast, no retraining required.' },
      { id: 'qat', name: 'QAT', fullName: 'Quantization Aware Training', description: 'Simulate quantization during training for higher accuracy. Requires retraining.' },
    ],
  },
  {
    id: 'pruning',
    name: 'Pruning',
    description: 'Remove redundant weights or neurons to reduce model size and computation',
    subtypes: [
      { id: 'unstructured', name: 'Unstructured', fullName: 'Unstructured Pruning', description: 'Remove individual weights. High compression, harder to accelerate on hardware.' },
      { id: 'structured', name: 'Structured', fullName: 'Structured Pruning', description: 'Remove entire channels/filters. Hardware-friendly with direct inference speedup.' },
    ],
  },
  {
    id: 'kd',
    name: 'Knowledge Distillation',
    description: 'Train a compact student model to mimic a larger teacher model behavior',
    subtypes: [
      { id: 'response', name: 'Response-Based', fullName: 'Response-Based KD', description: "Student learns from teacher's output probability distributions." },
      { id: 'feature', name: 'Feature-Based', fullName: 'Feature-Based KD', description: "Student learns from teacher's intermediate feature representations." },
    ],
  },
]

export const LANGUAGES = ['Python', 'C++', 'C', 'CUDA', 'TensorRT Python']
