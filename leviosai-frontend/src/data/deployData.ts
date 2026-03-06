// ── Deploy Console data: pin maps, SDK steps, benchmark profiles ──

import type { SelectedSensor } from '../types'

/* ================================================================
   Types
   ================================================================ */

export interface ConnectorRegion {
  id: string
  label: string
  x: number; y: number; w: number; h: number
  color: string
}

export interface SensorWire {
  sensorType: string
  iface: string        // CSI, USB, UART, SPI, I2C, GPIO, Ethernet
  connectorId: string
  voltage: string
  wireColor: string
  note: string
}

export interface HardwarePinMap {
  category: string
  devices: string[]
  boardW: number; boardH: number
  connectors: ConnectorRegion[]
  sensorWires: SensorWire[]
}

export interface SdkStep {
  id: string
  title: string
  subtitle: string
  commands: string[]
  platform: string[]
  estimatedTime: string
  optional: boolean
}

export interface BenchmarkProfile {
  hardware: string
  baseLatencyMs: number
  baseFps: number
  baseMemoryMb: number
  basePowerW: number
  baseAccuracy: number
}

export interface AssemblyStep {
  id: string
  label: string
  detail: string
  sensorType: string
  iface: string
  voltage: string
  wireColor: string
}

export interface DeployLogLine {
  delay: number
  text: string
  type: 'info' | 'ok' | 'warn' | 'err'
}

/* ================================================================
   Hardware Pin Maps
   ================================================================ */

const JETSON_PIN_MAP: HardwarePinMap = {
  category: 'Nvidia Jetson',
  devices: ['Jetson Thor', 'Jetson AGX Orin'],
  boardW: 320, boardH: 220,
  connectors: [
    { id: 'csi0', label: 'CSI-0', x: 40, y: 12, w: 35, h: 14, color: '#4ade80' },
    { id: 'csi1', label: 'CSI-1', x: 85, y: 12, w: 35, h: 14, color: '#4ade80' },
    { id: 'usb3', label: 'USB 3.0', x: 265, y: 20, w: 20, h: 40, color: '#60a5fa' },
    { id: 'usb2', label: 'USB 2.0', x: 265, y: 70, w: 20, h: 40, color: '#60a5fa' },
    { id: 'eth', label: 'Ethernet', x: 265, y: 120, w: 20, h: 35, color: '#fbbf24' },
    { id: 'gpio', label: '40-pin GPIO', x: 200, y: 12, w: 22, h: 85, color: '#c084fc' },
    { id: 'pcie', label: 'PCIe', x: 140, y: 190, w: 60, h: 14, color: '#f97316' },
    { id: 'power', label: 'USB-C PD', x: 10, y: 100, w: 16, h: 30, color: '#ef4444' },
  ],
  sensorWires: [
    { sensorType: 'camera', iface: 'CSI', connectorId: 'csi0', voltage: '1.8V', wireColor: '#4ade80', note: 'MIPI CSI-2 ribbon cable' },
    { sensorType: 'lidar', iface: 'UART/Ethernet', connectorId: 'eth', voltage: '12V', wireColor: '#fbbf24', note: 'Ethernet or UART header' },
    { sensorType: 'radar', iface: 'SPI', connectorId: 'gpio', voltage: '3.3V', wireColor: '#f97316', note: 'SPI0 on GPIO header (pins 19/21/23/24)' },
    { sensorType: 'mic', iface: 'USB', connectorId: 'usb3', voltage: 'USB', wireColor: '#e0e0e0', note: 'USB audio device' },
    { sensorType: 'imu', iface: 'I2C', connectorId: 'gpio', voltage: '3.3V', wireColor: '#c084fc', note: 'I2C bus 1 (GPIO 2/3)' },
    { sensorType: 'thermal', iface: 'USB/I2C', connectorId: 'usb2', voltage: 'USB', wireColor: '#ef4444', note: 'USB or I2C thermal module' },
    { sensorType: 'ultrasonic', iface: 'GPIO', connectorId: 'gpio', voltage: '5V', wireColor: '#06b6d4', note: 'GPIO trigger/echo pins' },
    { sensorType: 'gps', iface: 'UART', connectorId: 'gpio', voltage: '3.3V', wireColor: '#22c55e', note: 'UART TX/RX (GPIO 14/15)' },
  ],
}

const HAILO_PIN_MAP: HardwarePinMap = {
  category: 'Hailo',
  devices: ['Hailo-8', 'Hailo-10'],
  boardW: 280, boardH: 200,
  connectors: [
    { id: 'csi', label: 'CSI', x: 30, y: 10, w: 30, h: 12, color: '#4ade80' },
    { id: 'usb', label: 'USB 3.0', x: 230, y: 20, w: 18, h: 35, color: '#60a5fa' },
    { id: 'gpio', label: '40-pin GPIO', x: 170, y: 10, w: 20, h: 75, color: '#c084fc' },
    { id: 'eth', label: 'Ethernet', x: 230, y: 65, w: 18, h: 30, color: '#fbbf24' },
    { id: 'pcie', label: 'M.2 (Hailo)', x: 60, y: 130, w: 50, h: 16, color: '#f97316' },
    { id: 'power', label: 'USB-C', x: 8, y: 90, w: 14, h: 25, color: '#ef4444' },
  ],
  sensorWires: [
    { sensorType: 'camera', iface: 'CSI', connectorId: 'csi', voltage: '1.8V', wireColor: '#4ade80', note: 'RPi Camera ribbon' },
    { sensorType: 'lidar', iface: 'UART', connectorId: 'gpio', voltage: '3.3V', wireColor: '#fbbf24', note: 'UART on GPIO header' },
    { sensorType: 'radar', iface: 'SPI', connectorId: 'gpio', voltage: '3.3V', wireColor: '#f97316', note: 'SPI0 on GPIO' },
    { sensorType: 'mic', iface: 'USB', connectorId: 'usb', voltage: 'USB', wireColor: '#e0e0e0', note: 'USB audio' },
    { sensorType: 'imu', iface: 'I2C', connectorId: 'gpio', voltage: '3.3V', wireColor: '#c084fc', note: 'I2C1 on GPIO' },
    { sensorType: 'thermal', iface: 'USB', connectorId: 'usb', voltage: 'USB', wireColor: '#ef4444', note: 'USB thermal' },
    { sensorType: 'ultrasonic', iface: 'GPIO', connectorId: 'gpio', voltage: '5V', wireColor: '#06b6d4', note: 'GPIO trigger/echo' },
    { sensorType: 'gps', iface: 'UART', connectorId: 'gpio', voltage: '3.3V', wireColor: '#22c55e', note: 'UART on GPIO' },
  ],
}

const STM32_PIN_MAP: HardwarePinMap = {
  category: 'Embedded',
  devices: ['STM32 Series'],
  boardW: 240, boardH: 260,
  connectors: [
    { id: 'dcmi', label: 'DCMI', x: 20, y: 15, w: 40, h: 14, color: '#4ade80' },
    { id: 'spi1', label: 'SPI1', x: 180, y: 20, w: 20, h: 30, color: '#f97316' },
    { id: 'i2c1', label: 'I2C1', x: 180, y: 60, w: 20, h: 25, color: '#c084fc' },
    { id: 'uart', label: 'UART', x: 180, y: 100, w: 20, h: 25, color: '#fbbf24' },
    { id: 'gpio_a', label: 'GPIO-A', x: 10, y: 50, w: 14, h: 70, color: '#60a5fa' },
    { id: 'gpio_b', label: 'GPIO-B', x: 10, y: 130, w: 14, h: 70, color: '#60a5fa' },
    { id: 'usb', label: 'USB', x: 100, y: 235, w: 30, h: 14, color: '#e0e0e0' },
    { id: 'power', label: 'VIN', x: 60, y: 235, w: 25, h: 14, color: '#ef4444' },
  ],
  sensorWires: [
    { sensorType: 'camera', iface: 'DCMI', connectorId: 'dcmi', voltage: '3.3V', wireColor: '#4ade80', note: 'DCMI parallel interface' },
    { sensorType: 'imu', iface: 'SPI/I2C', connectorId: 'spi1', voltage: '3.3V', wireColor: '#c084fc', note: 'SPI1 or I2C1' },
    { sensorType: 'ultrasonic', iface: 'Timer', connectorId: 'gpio_a', voltage: '5V', wireColor: '#06b6d4', note: 'Timer capture GPIO' },
    { sensorType: 'gps', iface: 'UART', connectorId: 'uart', voltage: '3.3V', wireColor: '#22c55e', note: 'UART TX/RX' },
    { sensorType: 'mic', iface: 'I2S/ADC', connectorId: 'i2c1', voltage: '3.3V', wireColor: '#e0e0e0', note: 'I2S or ADC input' },
    { sensorType: 'thermal', iface: 'I2C', connectorId: 'i2c1', voltage: '3.3V', wireColor: '#ef4444', note: 'I2C thermal' },
  ],
}

const GENERIC_PIN_MAP: HardwarePinMap = {
  category: 'Generic',
  devices: [],
  boardW: 260, boardH: 180,
  connectors: [
    { id: 'usb1', label: 'USB 1', x: 220, y: 20, w: 18, h: 30, color: '#60a5fa' },
    { id: 'usb2', label: 'USB 2', x: 220, y: 60, w: 18, h: 30, color: '#60a5fa' },
    { id: 'usb3', label: 'USB 3', x: 220, y: 100, w: 18, h: 30, color: '#60a5fa' },
    { id: 'eth', label: 'Ethernet', x: 220, y: 140, w: 18, h: 25, color: '#fbbf24' },
    { id: 'power', label: 'Power', x: 10, y: 80, w: 16, h: 25, color: '#ef4444' },
  ],
  sensorWires: [
    { sensorType: 'camera', iface: 'USB', connectorId: 'usb1', voltage: 'USB', wireColor: '#4ade80', note: 'USB camera' },
    { sensorType: 'lidar', iface: 'USB/Ethernet', connectorId: 'eth', voltage: '12V', wireColor: '#fbbf24', note: 'Ethernet or USB' },
    { sensorType: 'mic', iface: 'USB', connectorId: 'usb2', voltage: 'USB', wireColor: '#e0e0e0', note: 'USB audio' },
    { sensorType: 'imu', iface: 'USB', connectorId: 'usb3', voltage: 'USB', wireColor: '#c084fc', note: 'USB IMU' },
  ],
}

// Pin maps are accessed via getPinMap() below

export function getPinMap(category: string): HardwarePinMap {
  const cat = category.toLowerCase()
  if (cat.includes('jetson') || cat.includes('nvidia')) return JETSON_PIN_MAP
  if (cat.includes('hailo')) return HAILO_PIN_MAP
  if (cat.includes('stm32') || cat.includes('embedded')) return STM32_PIN_MAP
  return GENERIC_PIN_MAP
}

/* ================================================================
   Assembly Steps (derived from pin map + selected sensors)
   ================================================================ */

export function getAssemblySteps(pinMap: HardwarePinMap, sensors: SelectedSensor[]): AssemblyStep[] {
  const steps: AssemblyStep[] = []
  const sensorTypes = new Set(sensors.map(s => s.type))

  for (const wire of pinMap.sensorWires) {
    if (sensorTypes.has(wire.sensorType)) {
      const sensor = sensors.find(s => s.type === wire.sensorType)
      steps.push({
        id: `${wire.sensorType}_${wire.connectorId}`,
        label: `Connect ${sensor?.name ?? wire.sensorType} (${wire.iface})`,
        detail: `${wire.note} · ${wire.voltage}`,
        sensorType: wire.sensorType,
        iface: wire.iface,
        voltage: wire.voltage,
        wireColor: wire.wireColor,
      })
    }
  }

  // Always add power + verify steps
  steps.push({
    id: 'power_on',
    label: 'Connect power supply and boot',
    detail: 'Ensure all cables are secure before powering on',
    sensorType: '_system',
    iface: 'Power',
    voltage: '',
    wireColor: '#ef4444',
  })
  steps.push({
    id: 'verify_devices',
    label: 'Verify device nodes',
    detail: 'ls /dev/video* /dev/ttyUSB* /dev/i2c-*',
    sensorType: '_system',
    iface: 'System',
    voltage: '',
    wireColor: '#6b96be',
  })

  return steps
}

/* ================================================================
   SDK Steps
   ================================================================ */

export const SDK_STEPS: SdkStep[] = [
  // ── Base OS ──
  {
    id: 'base_ssh',
    title: 'Base OS & SSH',
    subtitle: 'Initial system setup and remote access',
    commands: [
      '# Update system packages',
      'sudo apt-get update && sudo apt-get upgrade -y',
      '# Enable SSH (if not already)',
      'sudo systemctl enable ssh && sudo systemctl start ssh',
      '# Check IP address',
      'hostname -I',
    ],
    platform: ['Nvidia Jetson', 'Hailo', 'PC', 'Embedded'],
    estimatedTime: '2 min',
    optional: false,
  },
  // ── Nvidia JetPack ──
  {
    id: 'jetpack',
    title: 'JetPack SDK',
    subtitle: 'CUDA + cuDNN + TensorRT runtime',
    commands: [
      'sudo apt-get install -y nvidia-jetpack',
      'pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124',
      '# Verify TensorRT',
      'dpkg -l | grep tensorrt',
      '# Verify CUDA',
      'nvcc --version',
    ],
    platform: ['Nvidia Jetson'],
    estimatedTime: '8 min',
    optional: false,
  },
  // ── HailoRT ──
  {
    id: 'hailort',
    title: 'HailoRT',
    subtitle: 'Hailo runtime driver + PCIe kernel module',
    commands: [
      '# Download HailoRT from developer zone',
      'wget https://hailo.ai/developer-zone/sw-downloads -O hailort_4.x.deb',
      'sudo dpkg -i hailort_4.x.deb',
      'pip install hailort',
      '# Verify device',
      'hailortcli fw-control identify',
    ],
    platform: ['Hailo'],
    estimatedTime: '5 min',
    optional: false,
  },
  // ── STM32 ──
  {
    id: 'stm32cube',
    title: 'STM32CubeIDE',
    subtitle: 'Embedded toolchain + HAL drivers',
    commands: [
      '# Install STM32CubeMX + CubeIDE',
      'sudo apt install stm32cubemx',
      '# Install ARM GCC toolchain',
      'sudo apt install gcc-arm-none-eabi',
      '# Flash via ST-Link',
      'st-flash write firmware.bin 0x8000000',
    ],
    platform: ['Embedded'],
    estimatedTime: '5 min',
    optional: false,
  },
  // ── PC / Mobile ──
  {
    id: 'pc_runtime',
    title: 'AI Runtime',
    subtitle: 'ONNX Runtime / OpenVINO / CoreML',
    commands: [
      'pip install onnxruntime-gpu',
      '# Or for Intel:',
      'pip install openvino',
      '# Verify runtime',
      'python -c "import onnxruntime; print(onnxruntime.get_available_providers())"',
    ],
    platform: ['PC', 'Mobile AP'],
    estimatedTime: '3 min',
    optional: false,
  },
  // ── Python dependencies ──
  {
    id: 'python_deps',
    title: 'Python Dependencies',
    subtitle: 'Project-specific packages',
    commands: [
      'pip install numpy opencv-python pillow',
      'pip install ultralytics   # YOLOv8/v11',
      'pip install transformers  # HuggingFace models',
      'pip install onnx onnxsim  # Model export',
    ],
    platform: ['Nvidia Jetson', 'Hailo', 'PC', 'Mobile AP'],
    estimatedTime: '3 min',
    optional: false,
  },
  // ── C++ dependencies ──
  {
    id: 'cpp_deps',
    title: 'C++ Build Tools',
    subtitle: 'CMake + OpenCV + model runtime',
    commands: [
      'sudo apt install cmake build-essential',
      'sudo apt install libopencv-dev',
      '# Build project',
      'mkdir build && cd build && cmake .. && make -j$(nproc)',
    ],
    platform: ['Nvidia Jetson', 'Hailo', 'PC', 'Embedded'],
    estimatedTime: '4 min',
    optional: true,
  },
  // ── Model download ──
  {
    id: 'model_download',
    title: 'Model Download',
    subtitle: 'Download and convert the optimized model',
    commands: [
      '# Download model weights',
      'wget https://huggingface.co/models/<model_name>/resolve/main/weights.onnx',
      '# Optimize for target runtime',
      'python optimize_model.py --input weights.onnx --output model_opt.engine',
      '# Verify model loads',
      'python -c "import model_loader; model_loader.test(\'model_opt.engine\')"',
    ],
    platform: ['Nvidia Jetson', 'Hailo', 'PC', 'Mobile AP', 'Embedded'],
    estimatedTime: '5 min',
    optional: false,
  },
]

export function getSdkSteps(category: string, language: string): SdkStep[] {
  return SDK_STEPS.filter(step => {
    if (!step.platform.some(p => category.includes(p) || p.includes(category.split(' ')[0]))) {
      // Special: base_ssh, python_deps, model_download are universal
      if (!['base_ssh', 'python_deps', 'model_download'].includes(step.id)) return false
    }
    // Filter C++ deps only if language is C++
    if (step.id === 'cpp_deps' && !language.includes('C++')) return false
    return true
  })
}

/* ================================================================
   Benchmark Profiles
   ================================================================ */

export const BENCHMARK_PROFILES: BenchmarkProfile[] = [
  { hardware: 'Jetson Thor', baseLatencyMs: 8, baseFps: 125, baseMemoryMb: 2400, basePowerW: 25, baseAccuracy: 92.5 },
  { hardware: 'Jetson AGX Orin', baseLatencyMs: 14, baseFps: 71, baseMemoryMb: 1800, basePowerW: 18, baseAccuracy: 91.0 },
  { hardware: 'Hailo-8', baseLatencyMs: 6, baseFps: 166, baseMemoryMb: 512, basePowerW: 2.5, baseAccuracy: 88.5 },
  { hardware: 'Hailo-10', baseLatencyMs: 4.5, baseFps: 220, baseMemoryMb: 640, basePowerW: 5, baseAccuracy: 89.0 },
  { hardware: 'Snapdragon 8 Elite', baseLatencyMs: 18, baseFps: 55, baseMemoryMb: 1200, basePowerW: 8, baseAccuracy: 90.0 },
  { hardware: 'Apple A19 Pro', baseLatencyMs: 12, baseFps: 83, baseMemoryMb: 900, basePowerW: 6, baseAccuracy: 91.5 },
  { hardware: 'Google Tensor G5', baseLatencyMs: 20, baseFps: 50, baseMemoryMb: 1100, basePowerW: 7, baseAccuracy: 89.5 },
  { hardware: 'Intel Core Ultra', baseLatencyMs: 22, baseFps: 45, baseMemoryMb: 2000, basePowerW: 28, baseAccuracy: 91.0 },
  { hardware: 'AMD Ryzen AI', baseLatencyMs: 19, baseFps: 52, baseMemoryMb: 1800, basePowerW: 25, baseAccuracy: 90.5 },
  { hardware: 'STM32 Series', baseLatencyMs: 45, baseFps: 22, baseMemoryMb: 64, basePowerW: 0.3, baseAccuracy: 82.0 },
]

// Optimization reduction multipliers
export const TECHNIQUE_EFFECTS: Record<string, { latency: number; memory: number; fps: number; power: number; accuracyDrop: number }> = {
  quantization:           { latency: 0.55, memory: 0.45, fps: 1.8,  power: 0.70, accuracyDrop: 1.5 },
  pruning:                { latency: 0.70, memory: 0.60, fps: 1.4,  power: 0.80, accuracyDrop: 0.8 },
  'knowledge distillation': { latency: 0.65, memory: 0.55, fps: 1.5,  power: 0.75, accuracyDrop: 0.5 },
}

export interface BenchmarkResult {
  baseLatencyMs: number
  optLatencyMs: number
  baseFps: number
  optFps: number
  baseMemoryMb: number
  optMemoryMb: number
  basePowerW: number
  optPowerW: number
  baseAccuracy: number
  optAccuracy: number
  efficiencyScore: number
}

export function getBenchmarkResult(device: string, techniques: { id: string; name: string }[]): BenchmarkResult {
  // Find closest matching profile
  const profile = BENCHMARK_PROFILES.find(p =>
    device.toLowerCase().includes(p.hardware.toLowerCase().split(' ')[0])
  ) ?? BENCHMARK_PROFILES[BENCHMARK_PROFILES.length - 1]

  let latMul = 1, memMul = 1, fpsMul = 1, powMul = 1, accDrop = 0
  for (const tech of techniques) {
    const key = tech.name.toLowerCase()
    for (const [k, v] of Object.entries(TECHNIQUE_EFFECTS)) {
      if (key.includes(k)) {
        latMul *= v.latency
        memMul *= v.memory
        fpsMul *= v.fps
        powMul *= v.power
        accDrop += v.accuracyDrop
        break
      }
    }
  }

  const optLatency = Math.round(profile.baseLatencyMs * latMul * 10) / 10
  const optFps = Math.round(profile.baseFps * fpsMul)
  const optMemory = Math.round(profile.baseMemoryMb * memMul)
  const optPower = Math.round(profile.basePowerW * powMul * 10) / 10
  const optAccuracy = Math.round((profile.baseAccuracy - accDrop) * 10) / 10

  // Efficiency = weighted score (lower latency, lower power, higher fps = better)
  const latScore = Math.max(0, 100 - optLatency * 2)
  const fpsScore = Math.min(100, optFps / 2)
  const powScore = Math.max(0, 100 - optPower * 3)
  const efficiencyScore = Math.round(latScore * 0.3 + fpsScore * 0.35 + powScore * 0.2 + optAccuracy * 0.15)

  return {
    baseLatencyMs: profile.baseLatencyMs,
    optLatencyMs: optLatency,
    baseFps: profile.baseFps,
    optFps,
    baseMemoryMb: profile.baseMemoryMb,
    optMemoryMb: optMemory,
    basePowerW: profile.basePowerW,
    optPowerW: optPower,
    baseAccuracy: profile.baseAccuracy,
    optAccuracy,
    efficiencyScore: Math.min(99, Math.max(10, efficiencyScore)),
  }
}

/* ================================================================
   Deploy Simulation Log
   ================================================================ */

export function getDeployLogLines(device: string, projectName: string): DeployLogLine[] {
  return [
    { delay: 0,    text: 'Initializing deploy sequence...', type: 'info' },
    { delay: 500,  text: `Target: ${device}`, type: 'info' },
    { delay: 900,  text: 'Establishing SSH connection to 192.168.1.100...', type: 'info' },
    { delay: 1500, text: 'SSH handshake complete [OK]', type: 'ok' },
    { delay: 2000, text: `Uploading project "${projectName}" (2.3 MB)...`, type: 'info' },
    { delay: 3200, text: 'File transfer: 100% [OK]', type: 'ok' },
    { delay: 3700, text: 'Installing dependencies...', type: 'info' },
    { delay: 4800, text: 'torch==2.4.0 installed [OK]', type: 'ok' },
    { delay: 5300, text: 'opencv-python==4.10.0 installed [OK]', type: 'ok' },
    { delay: 5800, text: 'Loading optimized model...', type: 'info' },
    { delay: 6800, text: 'Model loaded: model_opt.engine [OK]', type: 'ok' },
    { delay: 7300, text: 'Running inference validation...', type: 'info' },
    { delay: 8500, text: 'Inference test: 10/10 PASSED [OK]', type: 'ok' },
    { delay: 9000, text: 'Starting benchmark suite...', type: 'info' },
    { delay: 10200, text: 'Benchmark: latency, throughput, memory — DONE [OK]', type: 'ok' },
    { delay: 10800, text: `Deployment complete — ${device} ready`, type: 'ok' },
  ]
}
