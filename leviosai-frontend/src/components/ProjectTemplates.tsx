export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  domain: string
  hardwareCategory: string
  hardwareDevice: string
  hardwareSpecs: string
  suggestedModel: string
  sensors: string[]
  techniques: string[]
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'autonomous_camera',
    name: 'Autonomous Driving',
    description: 'YOLOv8 object detection on Jetson AGX Orin with camera + LiDAR',
    icon: 'AV',
    domain: 'Computer Vision',
    hardwareCategory: 'Nvidia Jetson',
    hardwareDevice: 'Jetson AGX Orin',
    hardwareSpecs: 'ARM Cortex-A78AE, 275 TOPS',
    suggestedModel: 'YOLOv8n',
    sensors: ['Camera', 'LiDAR'],
    techniques: ['Quantization', 'TensorRT Optimization'],
  },
  {
    id: 'voice_assistant',
    name: 'Edge Voice Assistant',
    description: 'Whisper STT on mobile AP with microphone array',
    icon: 'MIC',
    domain: 'Auto Speech Recognition',
    hardwareCategory: 'Mobile AP',
    hardwareDevice: 'Snapdragon 8 Elite',
    hardwareSpecs: 'Kryo CPU, Hexagon NPU, 45 TOPS',
    suggestedModel: 'Whisper Small',
    sensors: ['Microphone'],
    techniques: ['Quantization', 'CTC Optimization'],
  },
  {
    id: 'bci_control',
    name: 'BCI Motor Control',
    description: 'EEGNet brain-computer interface on embedded MCU',
    icon: 'BCI',
    domain: 'BCI',
    hardwareCategory: 'Embedded MCU',
    hardwareDevice: 'STM32N6',
    hardwareSpecs: 'ARM Cortex-M55 + Cortex-M4, 600 MHz',
    suggestedModel: 'EEGNet',
    sensors: ['IMU'],
    techniques: ['Quantization', 'Transfer Learning'],
  },
  {
    id: 'smart_security',
    name: 'Smart Security Camera',
    description: 'MobileNetV3 classification on Hailo-8 with thermal sensor',
    icon: 'CAM',
    domain: 'Computer Vision',
    hardwareCategory: 'Hailo',
    hardwareDevice: 'Hailo-8',
    hardwareSpecs: '26 TOPS, 2.5W',
    suggestedModel: 'MobileNetV3',
    sensors: ['Camera', 'Thermal Camera'],
    techniques: ['Quantization', 'Pruning'],
  },
  {
    id: 'edge_llm',
    name: 'Edge LLM Chatbot',
    description: 'Phi-3 Mini on Jetson for on-device conversational AI',
    icon: 'LLM',
    domain: 'LLM',
    hardwareCategory: 'Nvidia Jetson',
    hardwareDevice: 'Jetson Thor',
    hardwareSpecs: 'ARM Grace CPU, 2000 TOPS',
    suggestedModel: 'Phi-3',
    sensors: [],
    techniques: ['Quantization', 'LoRA / QLoRA'],
  },
]

export function TemplateSelector({ onSelect }: { onSelect: (template: ProjectTemplate) => void }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-3">Quick Start Templates</p>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="flex-shrink-0 w-44 text-left p-3 rounded-xl border border-white/8 bg-background/40 hover:border-accent/40 hover:bg-accent/5 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">{t.icon}</span>
              <span className="text-[10px] font-mono text-accent/50 bg-accent/8 px-1.5 py-0.5 rounded">{t.domain.split(' ')[0]}</span>
            </div>
            <p className="text-xs font-bold text-primary font-mono group-hover:text-accent transition-colors truncate">{t.name}</p>
            <p className="text-[10px] text-secondary/50 mt-0.5 line-clamp-2 leading-relaxed">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
