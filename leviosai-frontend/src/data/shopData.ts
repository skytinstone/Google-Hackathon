import type { Store, ShopProduct, ShopCategory, BomEntry, WizardState } from '../types'

// ── Stores ──────────────────────────────────────────────────

export const STORES: Store[] = [
  { id: 'amazon',     name: 'Amazon',             nameKo: '아마존',          searchUrl: 'https://www.amazon.com/s?k={query}',                         logoChar: 'AZ', color: '#FF9900' },
  { id: 'aliexpress', name: 'AliExpress',          nameKo: '알리익스프레스',   searchUrl: 'https://www.aliexpress.com/wholesale?SearchText={query}',     logoChar: 'AE', color: '#E43225' },
  { id: 'coupang',    name: 'Coupang',             nameKo: '쿠팡',            searchUrl: 'https://www.coupang.com/np/search?q={query}',                 logoChar: 'CP', color: '#E31837' },
  { id: 'naver',      name: 'Naver Smart Store',   nameKo: '네이버 쇼핑',     searchUrl: 'https://search.shopping.naver.com/search/all?query={query}',  logoChar: 'NV', color: '#03C75A' },
  { id: 'auction',    name: 'Auction',             nameKo: '옥션',            searchUrl: 'https://browse.auction.co.kr/search?keyword={query}',         logoChar: 'OK', color: '#FF6F00' },
  { id: '11st',       name: '11st',                nameKo: '11번가',          searchUrl: 'https://search.11st.co.kr/Search.tmall?kwd={query}',          logoChar: '11', color: '#FF0000' },
  { id: 'ebay',       name: 'eBay',                nameKo: '이베이',          searchUrl: 'https://www.ebay.com/sch/i.html?_nkw={query}',                logoChar: 'eB', color: '#E53238' },
  { id: 'mouser',     name: 'Mouser',              nameKo: '마우저',          searchUrl: 'https://www.mouser.com/Search/Refine?Keyword={query}',        logoChar: 'MO', color: '#004B87' },
  { id: 'digikey',    name: 'DigiKey',             nameKo: '디지키',          searchUrl: 'https://www.digikey.com/en/products/result?keywords={query}',  logoChar: 'DK', color: '#CC0000' },
]

export function generateStoreUrl(store: Store, product: ShopProduct): string {
  const keyword = product.searchKeywords[store.id] || product.name
  return store.searchUrl.replace('{query}', encodeURIComponent(keyword))
}

// ── Category metadata ───────────────────────────────────────

export const SHOP_CATEGORIES: Record<ShopCategory, { label: string; labelKo: string; icon: string }> = {
  main_board: { label: 'Main Board',          labelKo: '메인 보드',       icon: '⬡' },
  sensor:     { label: 'Sensors',             labelKo: '센서',           icon: '◎' },
  cable:      { label: 'Cables & Connectors', labelKo: '케이블/커넥터',   icon: '⌁' },
  wiring:     { label: 'Wiring & Terminals',  labelKo: '배선/터미널',     icon: '⏚' },
  fastener:   { label: 'Nuts & Bolts',        labelKo: '너트/볼트',      icon: '⊛' },
  power:      { label: 'Power Supply',        labelKo: '전원 공급',      icon: 'PWR' },
  frame:      { label: 'Frame & Chassis',     labelKo: '프레임/케이스',   icon: '▣' },
  accessory:  { label: 'Accessories',         labelKo: '액세서리',       icon: '◈' },
}

// ── Product Catalog ─────────────────────────────────────────

export const PRODUCT_CATALOG: ShopProduct[] = [
  // ── Main Boards ─────────────────────────────────────────
  {
    id: 'mb_jetson_orin', name: 'NVIDIA Jetson AGX Orin 64GB Dev Kit', nameKo: 'NVIDIA Jetson AGX Orin 64GB 개발 키트',
    category: 'main_board', description: 'Complete developer kit with carrier board, heatsink, and power adapter',
    specs: '275 TOPS, 64GB LPDDR5, 12-core ARM A78AE', priceRange: { min: 1599, max: 1999 },
    associatedHardware: ['jetson_agx_orin'], associatedSensors: [],
    searchKeywords: { amazon: 'NVIDIA Jetson AGX Orin Developer Kit', naver: 'Jetson AGX Orin 개발자 키트' },
    tags: ['USB-C', 'PCIe', 'HDMI', 'DP'],
  },
  {
    id: 'mb_jetson_thor', name: 'NVIDIA Jetson Thor (Pre-order)', nameKo: 'NVIDIA Jetson Thor (사전예약)',
    category: 'main_board', description: 'Next-gen robotics compute platform, Blackwell GPU architecture',
    specs: '2000 TOPS (projected), Blackwell GPU', priceRange: { min: 2499, max: 3499 },
    associatedHardware: ['jetson_thor'], associatedSensors: [],
    searchKeywords: { amazon: 'NVIDIA Jetson Thor Developer Kit', naver: 'Jetson Thor 개발자 키트' },
    tags: ['PCIe 5.0', 'Blackwell', 'Robotics'],
  },
  {
    id: 'mb_hailo8_m2', name: 'Hailo-8 M.2 AI Acceleration Module', nameKo: 'Hailo-8 M.2 AI 가속 모듈',
    category: 'main_board', description: 'M.2 form factor AI inference accelerator',
    specs: '26 TOPS, 2.5W, M.2 Key B+M', priceRange: { min: 149, max: 199 },
    associatedHardware: ['hailo8'], associatedSensors: [],
    searchKeywords: { amazon: 'Hailo-8 M.2 AI accelerator module', naver: 'Hailo-8 AI 가속 모듈' },
    tags: ['M.2', 'PCIe', '2.5W'],
  },
  {
    id: 'mb_hailo8_rpi', name: 'Hailo-8 Raspberry Pi AI HAT+', nameKo: 'Hailo-8 라즈베리파이 AI HAT+',
    category: 'main_board', description: 'Raspberry Pi compatible AI acceleration HAT',
    specs: '26 TOPS, Pi 5 compatible', priceRange: { min: 69, max: 99 },
    associatedHardware: ['hailo8'], associatedSensors: [],
    searchKeywords: { amazon: 'Hailo-8 Raspberry Pi AI HAT', naver: 'Hailo-8 라즈베리파이 HAT' },
    tags: ['RPi', 'HAT', 'GPIO'],
  },
  {
    id: 'mb_hailo10', name: 'Hailo-10 AI Module', nameKo: 'Hailo-10 AI 모듈',
    category: 'main_board', description: 'Next-gen AI accelerator with generative AI support',
    specs: '40 TOPS, 5W, Gen AI ready', priceRange: { min: 199, max: 299 },
    associatedHardware: ['hailo10'], associatedSensors: [],
    searchKeywords: { amazon: 'Hailo-10 AI acceleration module', naver: 'Hailo-10 AI 모듈' },
    tags: ['M.2', 'GenAI', '5W'],
  },
  {
    id: 'mb_stm32_discovery', name: 'STM32F407 Discovery Board', nameKo: 'STM32F407 Discovery 보드',
    category: 'main_board', description: 'ARM Cortex-M4 development board with onboard debugger',
    specs: '168 MHz, 1MB Flash, 192KB RAM', priceRange: { min: 15, max: 25 },
    associatedHardware: ['stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'STM32F407 Discovery Board', naver: 'STM32F407 디스커버리 보드', aliexpress: 'STM32F407G-DISC1 development board' },
    tags: ['Cortex-M4', 'ST-Link', 'USB'],
  },
  {
    id: 'mb_nucleo_h743', name: 'NUCLEO-H743ZI2', nameKo: 'NUCLEO-H743ZI2 보드',
    category: 'main_board', description: 'High-performance STM32H7 Nucleo board with Ethernet',
    specs: '480 MHz, 2MB Flash, 1MB RAM, Ethernet', priceRange: { min: 25, max: 40 },
    associatedHardware: ['stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'NUCLEO-H743ZI2 STM32', naver: 'NUCLEO-H743ZI2' },
    tags: ['Cortex-M7', 'Ethernet', 'Arduino'],
  },
  {
    id: 'mb_intel_nuc_ultra', name: 'Intel NUC Ultra Mini PC', nameKo: 'Intel NUC Ultra 미니 PC',
    category: 'main_board', description: 'Compact mini PC with Intel Core Ultra and integrated NPU',
    specs: 'Core Ultra, 47 TOPS NPU, DDR5', priceRange: { min: 699, max: 999 },
    associatedHardware: ['intel_ultra3'], associatedSensors: [],
    searchKeywords: { amazon: 'Intel NUC Core Ultra mini PC NPU', naver: 'Intel NUC Ultra 미니PC' },
    tags: ['NPU', 'DDR5', 'Thunderbolt'],
  },
  {
    id: 'mb_amd_ryzen_minipc', name: 'AMD Ryzen AI Mini PC', nameKo: 'AMD Ryzen AI 미니 PC',
    category: 'main_board', description: 'Mini PC with AMD Ryzen AI and XDNA NPU',
    specs: 'Ryzen AI, 50 TOPS NPU, DDR5', priceRange: { min: 599, max: 899 },
    associatedHardware: ['amd_ryzen_ai'], associatedSensors: [],
    searchKeywords: { amazon: 'AMD Ryzen AI mini PC XDNA NPU', naver: 'AMD Ryzen AI 미니PC' },
    tags: ['XDNA', 'NPU', 'DDR5'],
  },

  // ── Sensors ─────────────────────────────────────────────
  {
    id: 'sen_rpi_cam3', name: 'Raspberry Pi Camera Module 3', nameKo: '라즈베리파이 카메라 모듈 3',
    category: 'sensor', description: '12MP Sony IMX708 sensor with autofocus and HDR',
    specs: '12MP, 4608x2592, AF, HDR, CSI-2', priceRange: { min: 25, max: 35 },
    associatedHardware: ['hailo8', 'hailo10'], associatedSensors: ['camera'],
    searchKeywords: { amazon: 'Raspberry Pi Camera Module 3', naver: '라즈베리파이 카메라 모듈3' },
    tags: ['CSI', '12MP', 'AF'],
  },
  {
    id: 'sen_realsense_d455', name: 'Intel RealSense D455', nameKo: 'Intel RealSense D455 뎁스 카메라',
    category: 'sensor', description: 'Stereo depth camera with global shutter and IMU',
    specs: '1280x720 depth, 90fps, 6m range, IMU', priceRange: { min: 299, max: 369 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor', 'intel_ultra3', 'amd_ryzen_ai'], associatedSensors: ['camera'],
    searchKeywords: { amazon: 'Intel RealSense D455 depth camera', naver: 'Intel RealSense D455' },
    tags: ['USB 3.1', 'Depth', 'IMU'],
  },
  {
    id: 'sen_arducam_imx477', name: 'ArduCam IMX477 HQ Camera', nameKo: 'ArduCam IMX477 HQ 카메라',
    category: 'sensor', description: '12.3MP high quality camera with C/CS mount lens support',
    specs: '12.3MP, Sony IMX477, C-mount', priceRange: { min: 45, max: 75 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor', 'hailo8'], associatedSensors: ['camera'],
    searchKeywords: { amazon: 'ArduCam IMX477 camera module', naver: 'ArduCam IMX477 카메라', aliexpress: 'IMX477 12.3MP camera module CSI' },
    tags: ['CSI', 'C-mount', '12.3MP'],
  },
  {
    id: 'sen_rplidar_a1', name: 'RPLIDAR A1M8', nameKo: 'RPLIDAR A1M8 라이다 스캐너',
    category: 'sensor', description: '360-degree 2D laser scanner, 12m range',
    specs: '360°, 12m range, 8000 samples/s', priceRange: { min: 99, max: 139 },
    associatedHardware: [], associatedSensors: ['lidar'],
    searchKeywords: { amazon: 'RPLIDAR A1M8 360 laser scanner', naver: 'RPLIDAR A1M8 라이다', aliexpress: 'RPLIDAR A1 360 degree laser scanner' },
    tags: ['UART', '360°', '12m'],
  },
  {
    id: 'sen_livox_mid360', name: 'Livox Mid-360 3D LiDAR', nameKo: 'Livox Mid-360 3D 라이다',
    category: 'sensor', description: 'Compact 3D LiDAR with 360° FOV and high point density',
    specs: '360° FOV, 40m range, 200k pts/s', priceRange: { min: 499, max: 699 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor'], associatedSensors: ['lidar'],
    searchKeywords: { amazon: 'Livox Mid-360 LiDAR', naver: 'Livox Mid-360 라이다' },
    tags: ['Ethernet', '3D', '360°'],
  },
  {
    id: 'sen_ti_iwr1443', name: 'TI IWR1443 mmWave Radar', nameKo: 'TI IWR1443 밀리미터파 레이다',
    category: 'sensor', description: '77GHz mmWave radar sensor evaluation module',
    specs: '77GHz, 4 TX/3 RX, 120m range', priceRange: { min: 199, max: 299 },
    associatedHardware: [], associatedSensors: ['radar'],
    searchKeywords: { amazon: 'TI IWR1443 mmWave radar evaluation module', naver: 'TI IWR1443 밀리미터파 레이다' },
    tags: ['77GHz', 'UART', 'SPI'],
  },
  {
    id: 'sen_respeaker_4mic', name: 'ReSpeaker 4-Mic Array', nameKo: 'ReSpeaker 4채널 마이크 어레이',
    category: 'sensor', description: '4-channel circular microphone array with LED ring',
    specs: '4-mic, beamforming, I2S/USB', priceRange: { min: 29, max: 45 },
    associatedHardware: [], associatedSensors: ['mic'],
    searchKeywords: { amazon: 'ReSpeaker 4-Mic Array for Raspberry Pi', naver: 'ReSpeaker 4채널 마이크 어레이' },
    tags: ['I2S', 'USB', 'LED'],
  },
  {
    id: 'sen_inmp441', name: 'INMP441 MEMS Microphone', nameKo: 'INMP441 MEMS 마이크 모듈',
    category: 'sensor', description: 'Low-power digital MEMS microphone with I2S output',
    specs: 'I2S, 61dB SNR, omnidirectional', priceRange: { min: 3, max: 8 },
    associatedHardware: ['stm32'], associatedSensors: ['mic'],
    searchKeywords: { amazon: 'INMP441 MEMS microphone module I2S', naver: 'INMP441 마이크 모듈', aliexpress: 'INMP441 I2S MEMS microphone' },
    tags: ['I2S', 'MEMS', '3.3V'],
  },
  {
    id: 'sen_mpu6050', name: 'MPU-6050 6-DOF IMU', nameKo: 'MPU-6050 6축 IMU 모듈',
    category: 'sensor', description: '3-axis gyroscope + 3-axis accelerometer, I2C interface',
    specs: '6-DOF, I2C, 16-bit ADC', priceRange: { min: 3, max: 8 },
    associatedHardware: [], associatedSensors: ['imu'],
    searchKeywords: { amazon: 'MPU-6050 IMU 6-axis gyroscope accelerometer', naver: 'MPU-6050 6축 자이로 가속도 센서', aliexpress: 'GY-521 MPU6050' },
    tags: ['I2C', '6-DOF', '3.3V'],
  },
  {
    id: 'sen_bno055', name: 'BNO055 9-DOF Absolute Orientation IMU', nameKo: 'BNO055 9축 절대 방향 IMU',
    category: 'sensor', description: '9-axis absolute orientation sensor with sensor fusion',
    specs: '9-DOF, built-in fusion, UART/I2C', priceRange: { min: 25, max: 40 },
    associatedHardware: [], associatedSensors: ['imu'],
    searchKeywords: { amazon: 'Adafruit BNO055 9-DOF IMU', naver: 'BNO055 9축 IMU' },
    tags: ['I2C', '9-DOF', 'Fusion'],
  },
  {
    id: 'sen_flir_lepton', name: 'FLIR Lepton 3.5 Thermal Module', nameKo: 'FLIR Lepton 3.5 열화상 모듈',
    category: 'sensor', description: 'Long-wave infrared thermal camera core module',
    specs: '160x120, -10~400°C, SPI', priceRange: { min: 199, max: 289 },
    associatedHardware: [], associatedSensors: ['thermal'],
    searchKeywords: { amazon: 'FLIR Lepton 3.5 thermal camera module', naver: 'FLIR Lepton 3.5 열화상' },
    tags: ['SPI', 'LWIR', '160x120'],
  },
  {
    id: 'sen_hcsr04', name: 'HC-SR04 Ultrasonic Sensor', nameKo: 'HC-SR04 초음파 센서',
    category: 'sensor', description: 'Budget ultrasonic distance sensor, 2cm-4m range',
    specs: '2cm-4m, 40kHz, 5V/3.3V', priceRange: { min: 2, max: 5 },
    associatedHardware: [], associatedSensors: ['ultrasonic'],
    searchKeywords: { amazon: 'HC-SR04 ultrasonic sensor module', naver: 'HC-SR04 초음파 거리 센서', aliexpress: 'HC-SR04 ultrasonic distance sensor' },
    tags: ['GPIO', '5V', '4m'],
  },
  {
    id: 'sen_ublox_neo_m9n', name: 'u-blox NEO-M9N GPS Module', nameKo: 'u-blox NEO-M9N GPS 모듈',
    category: 'sensor', description: 'Multi-GNSS receiver with concurrent reception (GPS, Galileo, BeiDou, GLONASS)',
    specs: 'Multi-GNSS, 1.5m CEP, UART/I2C/SPI', priceRange: { min: 35, max: 55 },
    associatedHardware: [], associatedSensors: ['gps'],
    searchKeywords: { amazon: 'u-blox NEO-M9N GPS GNSS module', naver: 'NEO-M9N GPS 모듈' },
    tags: ['UART', 'GNSS', '1.5m'],
  },

  // ── Cables & Connectors ─────────────────────────────────
  {
    id: 'cab_csi_ffc_15', name: 'CSI FFC Cable 15-pin (30cm)', nameKo: 'CSI FFC 케이블 15핀 30cm',
    category: 'cable', description: 'Flexible flat cable for MIPI CSI-2 camera connection',
    specs: '15-pin, 30cm, gold-plated', priceRange: { min: 3, max: 8 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor', 'hailo8'], associatedSensors: ['camera'],
    searchKeywords: { amazon: 'CSI camera ribbon cable 15 pin 30cm', naver: 'CSI 카메라 케이블 15핀', aliexpress: 'CSI FFC cable 15pin raspberry pi' },
    tags: ['CSI', 'FFC', '15-pin'],
  },
  {
    id: 'cab_usb3_ac', name: 'USB 3.0 Type-A to Type-C Cable (1m)', nameKo: 'USB 3.0 A to C 케이블 1m',
    category: 'cable', description: 'High-speed USB 3.0 data and power cable',
    specs: '5Gbps, 3A, 1m', priceRange: { min: 5, max: 12 },
    associatedHardware: [], associatedSensors: ['camera'],
    searchKeywords: { amazon: 'USB 3.0 Type A to C cable 1m', naver: 'USB 3.0 A to C 케이블' },
    tags: ['USB-C', '5Gbps', '3A'],
  },
  {
    id: 'cab_ethernet_cat6', name: 'Ethernet Cable CAT6 (2m)', nameKo: '이더넷 케이블 CAT6 2m',
    category: 'cable', description: 'High-speed ethernet cable for LiDAR and network connectivity',
    specs: 'CAT6, 1Gbps, 2m, RJ45', priceRange: { min: 3, max: 8 },
    associatedHardware: [], associatedSensors: ['lidar'],
    searchKeywords: { amazon: 'CAT6 ethernet cable 2m', naver: 'CAT6 이더넷 랜케이블 2m' },
    tags: ['RJ45', 'CAT6', '1Gbps'],
  },
  {
    id: 'cab_jumper_kit', name: 'Jumper Wire Kit (M/M + M/F + F/F)', nameKo: '점퍼 와이어 키트 (M/M + M/F + F/F)',
    category: 'cable', description: '120pcs dupont jumper wire kit in three configurations',
    specs: '120pcs, 20cm, 2.54mm pitch', priceRange: { min: 5, max: 10 },
    associatedHardware: ['stm32'], associatedSensors: ['imu', 'ultrasonic', 'mic'],
    searchKeywords: { amazon: 'dupont jumper wire kit 120pcs', naver: '점퍼 와이어 키트 듀폰', aliexpress: 'dupont wire jumper cable 120pcs' },
    tags: ['Dupont', '2.54mm', '120pcs'],
  },
  {
    id: 'cab_breadboard', name: 'Solderless Breadboard 830-point', nameKo: '브레드보드 830홀',
    category: 'cable', description: 'Full-size solderless breadboard for prototyping',
    specs: '830 points, 165x55mm', priceRange: { min: 3, max: 8 },
    associatedHardware: ['stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'breadboard 830 point solderless', naver: '브레드보드 830홀', aliexpress: 'breadboard 830 point MB-102' },
    tags: ['830-pt', 'Proto'],
  },
  {
    id: 'cab_hdmi_micro', name: 'Micro HDMI to HDMI Cable (1.5m)', nameKo: 'Micro HDMI to HDMI 케이블 1.5m',
    category: 'cable', description: 'Display connection for Jetson and SBC boards',
    specs: 'Micro HDMI, 4K@60Hz, 1.5m', priceRange: { min: 6, max: 12 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor'], associatedSensors: [],
    searchKeywords: { amazon: 'micro HDMI to HDMI cable 4K', naver: 'Micro HDMI to HDMI 케이블' },
    tags: ['HDMI', '4K', 'Display'],
  },
  {
    id: 'cab_usbc_data', name: 'USB-C to USB-C Cable (1m)', nameKo: 'USB-C to USB-C 케이블 1m',
    category: 'cable', description: 'USB 3.2 Gen 2 cable for high-speed data transfer and PD charging',
    specs: '10Gbps, 100W PD, 1m', priceRange: { min: 8, max: 15 },
    associatedHardware: ['jetson_agx_orin', 'intel_ultra3', 'amd_ryzen_ai'], associatedSensors: [],
    searchKeywords: { amazon: 'USB-C cable 10Gbps 100W PD', naver: 'USB-C 케이블 10Gbps PD' },
    tags: ['USB-C', '10Gbps', '100W PD'],
  },

  // ── Power Supply ────────────────────────────────────────
  {
    id: 'pwr_65w_usbc', name: '65W USB-C PD Power Adapter', nameKo: '65W USB-C PD 충전기',
    category: 'power', description: 'Compact GaN USB-C PD power adapter for Jetson and laptops',
    specs: '65W, USB-C PD 3.0, GaN', priceRange: { min: 25, max: 45 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor', 'intel_ultra3', 'amd_ryzen_ai'], associatedSensors: [],
    searchKeywords: { amazon: '65W USB C PD GaN charger', naver: '65W USB-C PD GaN 충전기' },
    tags: ['USB-C', 'PD', '65W', 'GaN'],
  },
  {
    id: 'pwr_dc_19v', name: 'DC 19V/4.74A Barrel Adapter', nameKo: 'DC 19V/4.74A 어댑터',
    category: 'power', description: 'DC barrel jack power supply for Jetson AGX Orin',
    specs: '19V, 4.74A, 5.5x2.5mm barrel', priceRange: { min: 15, max: 25 },
    associatedHardware: ['jetson_agx_orin'], associatedSensors: [],
    searchKeywords: { amazon: '19V 4.74A DC barrel power adapter 5.5mm', naver: '19V DC 어댑터 5.5mm' },
    tags: ['DC', '19V', 'Barrel'],
  },
  {
    id: 'pwr_5v_3a', name: '5V/3A USB-C Power Supply', nameKo: '5V/3A USB-C 전원 공급장치',
    category: 'power', description: 'Official-grade power supply for Raspberry Pi and Hailo HAT',
    specs: '5V, 3A, USB-C', priceRange: { min: 8, max: 15 },
    associatedHardware: ['hailo8', 'hailo10'], associatedSensors: [],
    searchKeywords: { amazon: '5V 3A USB-C Raspberry Pi power supply', naver: '5V 3A USB-C 라즈베리파이 전원' },
    tags: ['USB-C', '5V', '3A'],
  },
  {
    id: 'pwr_27w_rpi', name: '27W USB-C PD Adapter (RPi 5)', nameKo: '27W USB-C PD 어댑터 (RPi 5용)',
    category: 'power', description: 'Official Raspberry Pi 27W USB-C PD power supply',
    specs: '27W, 5.1V/5A, USB-C PD', priceRange: { min: 12, max: 18 },
    associatedHardware: ['hailo8', 'hailo10'], associatedSensors: [],
    searchKeywords: { amazon: 'Raspberry Pi 5 27W USB-C power supply', naver: '라즈베리파이5 27W USB-C 전원' },
    tags: ['USB-C', 'PD', '27W'],
  },
  {
    id: 'pwr_5v_microusb', name: '5V/2A Micro USB Power Supply', nameKo: '5V/2A Micro USB 전원',
    category: 'power', description: 'Basic power supply for STM32 and microcontroller boards',
    specs: '5V, 2A, Micro USB', priceRange: { min: 4, max: 8 },
    associatedHardware: ['stm32'], associatedSensors: [],
    searchKeywords: { amazon: '5V 2A micro USB power supply adapter', naver: '5V 2A 마이크로 USB 어댑터', aliexpress: '5V 2A micro USB power adapter' },
    tags: ['Micro USB', '5V', '2A'],
  },
  {
    id: 'pwr_bench', name: 'Adjustable Bench Power Supply 30V/5A', nameKo: '가변 벤치 전원 공급기 30V/5A',
    category: 'power', description: 'Variable DC bench supply for lab development and testing',
    specs: '0-30V, 0-5A, LCD display', priceRange: { min: 45, max: 80 },
    associatedHardware: ['stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'adjustable bench power supply 30V 5A', naver: '가변 벤치 전원 공급기 30V 5A' },
    tags: ['Variable', '30V', 'LCD'],
  },

  // ── Frame & Chassis ─────────────────────────────────────
  {
    id: 'frm_jetson_case', name: 'Waveshare Jetson AGX Orin Metal Case', nameKo: 'Waveshare Jetson AGX Orin 메탈 케이스',
    category: 'frame', description: 'Aluminum enclosure with heatsink for Jetson AGX Orin',
    specs: 'Aluminum, passive cooling, VESA mount', priceRange: { min: 49, max: 79 },
    associatedHardware: ['jetson_agx_orin'], associatedSensors: [],
    searchKeywords: { amazon: 'Waveshare Jetson AGX Orin metal case aluminum', naver: 'Jetson AGX Orin 알루미늄 케이스' },
    tags: ['Aluminum', 'VESA', 'Passive'],
  },
  {
    id: 'frm_rpi_case', name: 'Argon ONE V3 Pi 5 Case', nameKo: 'Argon ONE V3 라즈베리파이 5 케이스',
    category: 'frame', description: 'Premium aluminum case for Raspberry Pi 5 with M.2 expansion',
    specs: 'Aluminum, M.2 slot, active fan, GPIO', priceRange: { min: 29, max: 49 },
    associatedHardware: ['hailo8', 'hailo10'], associatedSensors: [],
    searchKeywords: { amazon: 'Argon ONE V3 Raspberry Pi 5 case', naver: 'Argon ONE V3 라즈베리파이5 케이스' },
    tags: ['RPi5', 'M.2', 'Fan'],
  },
  {
    id: 'frm_2020_alu', name: '2020 Aluminum Extrusion Frame Kit', nameKo: '2020 알루미늄 프레임 키트',
    category: 'frame', description: 'Modular aluminum extrusion frame for custom robot/vehicle builds',
    specs: '2020 profile, 500mm x8, brackets x16', priceRange: { min: 35, max: 65 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: '2020 aluminum extrusion frame kit 500mm', naver: '2020 알루미늄 프로파일 프레임 키트', aliexpress: '2020 V-slot aluminum extrusion kit' },
    tags: ['2020', '500mm', 'Modular'],
  },
  {
    id: 'frm_acrylic_mount', name: 'Acrylic Mounting Plate Kit', nameKo: '아크릴 마운팅 플레이트 키트',
    category: 'frame', description: 'Transparent acrylic base plates with standoffs for prototyping',
    specs: '150x100mm, 3mm thick, M3 standoffs', priceRange: { min: 8, max: 15 },
    associatedHardware: ['stm32', 'hailo8'], associatedSensors: [],
    searchKeywords: { amazon: 'acrylic mounting plate standoff kit for Arduino', naver: '아크릴 마운팅 플레이트 키트', aliexpress: 'acrylic base plate M3 standoffs' },
    tags: ['Acrylic', 'M3', 'Proto'],
  },
  {
    id: 'frm_din_rail', name: 'DIN Rail Mount Kit', nameKo: 'DIN 레일 마운트 키트',
    category: 'frame', description: 'Industrial DIN rail mounting brackets and rail',
    specs: '35mm DIN rail, 300mm, 4 brackets', priceRange: { min: 10, max: 20 },
    associatedHardware: ['jetson_agx_orin', 'stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'DIN rail mount bracket kit 35mm', naver: 'DIN 레일 마운트 키트' },
    tags: ['DIN', '35mm', 'Industrial'],
  },
  {
    id: 'frm_robot_car', name: '4WD Robot Car Chassis Kit', nameKo: '4WD 로봇 차량 섀시 키트',
    category: 'frame', description: 'Four-wheel drive robot car platform with motors and encoder',
    specs: '4 DC motors, encoder wheels, 260mm', priceRange: { min: 25, max: 55 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: '4WD robot car chassis kit with motors encoder', naver: '4WD 로봇 자동차 섀시 키트', aliexpress: '4WD smart robot car chassis kit' },
    tags: ['4WD', 'Motors', 'Encoder'],
  },
  {
    id: 'frm_drone', name: 'F450 Quadcopter Frame Kit', nameKo: 'F450 쿼드콥터 프레임 키트',
    category: 'frame', description: 'Lightweight quadcopter frame for drone-based edge AI',
    specs: '450mm wheelbase, PCB arms, ~280g', priceRange: { min: 15, max: 30 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'F450 quadcopter drone frame kit', naver: 'F450 쿼드콥터 드론 프레임', aliexpress: 'F450 quadcopter frame kit 450mm' },
    tags: ['450mm', 'Drone', 'PCB'],
  },

  // ── Accessories ─────────────────────────────────────────
  {
    id: 'acc_microsd_128', name: 'MicroSD Card 128GB (A2, V30)', nameKo: 'MicroSD 카드 128GB (A2, V30)',
    category: 'accessory', description: 'High-speed micro SD for OS and model storage',
    specs: '128GB, A2, V30, 160MB/s read', priceRange: { min: 12, max: 20 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor', 'hailo8', 'hailo10', 'stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'micro SD 128GB A2 V30 high speed', naver: 'MicroSD 128GB A2 V30' },
    tags: ['A2', 'V30', '128GB'],
  },
  {
    id: 'acc_nvme_256', name: 'NVMe SSD 256GB (M.2 2280)', nameKo: 'NVMe SSD 256GB (M.2 2280)',
    category: 'accessory', description: 'Fast NVMe storage for Jetson and mini PC platforms',
    specs: '256GB, M.2 2280, PCIe Gen3/4', priceRange: { min: 25, max: 45 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor', 'intel_ultra3', 'amd_ryzen_ai'], associatedSensors: [],
    searchKeywords: { amazon: 'NVMe SSD 256GB M.2 2280', naver: 'NVMe SSD 256GB M.2' },
    tags: ['NVMe', 'M.2', '256GB'],
  },
  {
    id: 'acc_heatsink_fan', name: 'Heatsink + Fan Kit (40mm)', nameKo: '방열판 + 팬 키트 (40mm)',
    category: 'accessory', description: 'Active cooling kit for SBCs and AI accelerator modules',
    specs: '40mm fan, aluminum heatsink, thermal pad', priceRange: { min: 5, max: 15 },
    associatedHardware: ['jetson_agx_orin', 'hailo8', 'hailo10'], associatedSensors: [],
    searchKeywords: { amazon: 'heatsink fan kit 40mm Jetson Raspberry Pi', naver: '방열판 팬 키트 40mm', aliexpress: '40mm heatsink cooling fan kit' },
    tags: ['40mm', 'Fan', 'Thermal'],
  },
  {
    id: 'acc_wifi_ax210', name: 'Intel AX210 WiFi 6E + BT 5.3 Module', nameKo: 'Intel AX210 WiFi 6E + BT 5.3 모듈',
    category: 'accessory', description: 'Tri-band WiFi 6E and Bluetooth 5.3 M.2 module',
    specs: 'WiFi 6E, BT 5.3, M.2 2230', priceRange: { min: 15, max: 25 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor'], associatedSensors: [],
    searchKeywords: { amazon: 'Intel AX210 WiFi 6E Bluetooth M.2', naver: 'Intel AX210 WiFi 6E 모듈' },
    tags: ['WiFi 6E', 'BT 5.3', 'M.2'],
  },
  {
    id: 'acc_antenna_kit', name: 'Dual Antenna Kit (2.4/5GHz + GPS)', nameKo: '듀얼 안테나 키트 (WiFi + GPS)',
    category: 'accessory', description: 'External antennas for WiFi/BT and GPS reception',
    specs: '2x WiFi antenna, 1x GPS antenna, IPEX connectors', priceRange: { min: 8, max: 15 },
    associatedHardware: [], associatedSensors: ['gps'],
    searchKeywords: { amazon: 'WiFi GPS antenna kit IPEX u.FL', naver: 'WiFi GPS 안테나 키트' },
    tags: ['IPEX', 'WiFi', 'GPS'],
  },
  {
    id: 'acc_esd_wrist', name: 'Anti-Static Wrist Strap', nameKo: '정전기 방지 손목 밴드',
    category: 'accessory', description: 'ESD protection wrist strap for safe hardware assembly',
    specs: 'Adjustable, 1.8m cord, alligator clip', priceRange: { min: 3, max: 8 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'anti static wrist strap ESD', naver: '정전기 방지 손목 밴드', aliexpress: 'ESD anti static wrist strap' },
    tags: ['ESD', 'Safety'],
  },
  {
    id: 'acc_thermal_paste', name: 'Thermal Paste (Noctua NT-H1)', nameKo: '써멀 페이스트 (Noctua NT-H1)',
    category: 'accessory', description: 'Premium thermal compound for heatsink application',
    specs: '3.5g, 8.9 W/mK', priceRange: { min: 8, max: 14 },
    associatedHardware: ['jetson_agx_orin', 'jetson_thor', 'intel_ultra3', 'amd_ryzen_ai'], associatedSensors: [],
    searchKeywords: { amazon: 'Noctua NT-H1 thermal paste', naver: 'Noctua NT-H1 써멀페이스트' },
    tags: ['Thermal', '8.9W/mK'],
  },
  {
    id: 'acc_multimeter', name: 'Digital Multimeter', nameKo: '디지털 멀티미터',
    category: 'accessory', description: 'Essential measurement tool for voltage, current, and continuity',
    specs: 'Auto-range, AC/DC, capacitance', priceRange: { min: 15, max: 35 },
    associatedHardware: ['stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'digital multimeter auto range', naver: '디지털 멀티미터 오토레인지' },
    tags: ['Test', 'Auto-range'],
  },
  {
    id: 'acc_screwdriver_kit', name: 'Precision Screwdriver Set (25-in-1)', nameKo: '정밀 드라이버 세트 (25-in-1)',
    category: 'accessory', description: 'Precision screwdriver kit for electronics assembly',
    specs: '25 bits, magnetic, aluminum handle', priceRange: { min: 10, max: 20 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'precision screwdriver set 25 in 1 electronics', naver: '정밀 드라이버 세트 25in1' },
    tags: ['25-in-1', 'Magnetic'],
  },

  // ── Wiring & Terminals ────────────────────────────────────
  {
    id: 'wir_16awg_silicone', name: '16AWG Silicone Wire Kit (6 colors)', nameKo: '16AWG 실리콘 전선 키트 (6색)',
    category: 'wiring', description: 'Flexible silicone insulated wire for power distribution',
    specs: '16AWG, 6 colors x 3m, 600V', priceRange: { min: 12, max: 22 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: '16AWG silicone wire kit 6 colors', naver: '16AWG 실리콘 전선 키트', coupang: '16AWG 실리콘 와이어' },
    tags: ['16AWG', 'Silicone', '600V'],
  },
  {
    id: 'wir_22awg_hookup', name: '22AWG Hookup Wire Kit (10 colors)', nameKo: '22AWG 연결 전선 키트 (10색)',
    category: 'wiring', description: 'Solid core hookup wire for signal connections and breadboard',
    specs: '22AWG, 10 colors x 5m, solid core', priceRange: { min: 8, max: 15 },
    associatedHardware: ['stm32'], associatedSensors: [],
    searchKeywords: { amazon: '22AWG hookup wire kit solid core', naver: '22AWG 후크업 와이어', aliexpress: '22AWG solid core wire kit' },
    tags: ['22AWG', 'Solid', 'Signal'],
  },
  {
    id: 'wir_usb_port_a', name: 'USB Type-A Panel Mount Port', nameKo: 'USB Type-A 패널마운트 포트',
    category: 'wiring', description: 'Panel mount USB-A female port with solder terminals',
    specs: 'USB 2.0, panel mount, 2-pack', priceRange: { min: 4, max: 9 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'USB Type A panel mount female connector', naver: 'USB A 패널마운트 커넥터', mouser: 'USB Type-A panel mount receptacle' },
    tags: ['USB-A', 'Panel', 'Solder'],
  },
  {
    id: 'wir_usb_port_c', name: 'USB Type-C Panel Mount Port', nameKo: 'USB Type-C 패널마운트 포트',
    category: 'wiring', description: 'Panel mount USB-C female receptacle with pigtail wires',
    specs: 'USB-C, panel mount, 30cm pigtail', priceRange: { min: 6, max: 12 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'USB Type C panel mount female connector', naver: 'USB-C 패널마운트', coupang: 'USB C 패널 마운트 커넥터' },
    tags: ['USB-C', 'Panel', 'Pigtail'],
  },
  {
    id: 'wir_jst_xh_kit', name: 'JST-XH Connector Kit (2-5 pin)', nameKo: 'JST-XH 커넥터 키트 (2~5핀)',
    category: 'wiring', description: 'JST XH 2.54mm pitch connector housing and crimp terminal kit',
    specs: '2/3/4/5 pin, 2.54mm, 200+ pcs', priceRange: { min: 8, max: 15 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'JST XH connector kit 2.54mm', naver: 'JST-XH 커넥터 키트 2.54mm', aliexpress: 'JST XH 2.54 connector kit' },
    tags: ['JST-XH', '2.54mm', 'Crimp'],
  },
  {
    id: 'wir_yh396_housing', name: 'YH396 Connector Housing Kit', nameKo: 'YH396 커넥터 하우징 키트',
    category: 'wiring', description: 'YH396 3.96mm pitch connector housing and pin terminal set',
    specs: '2/3/4/5/6 pin, 3.96mm pitch, 100+ pcs', priceRange: { min: 10, max: 18 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'VH3.96 connector housing terminal kit', naver: 'VH3.96 커넥터 하우징 터미널', aliexpress: 'VH3.96mm connector housing pin kit' },
    tags: ['VH3.96', 'Housing', 'Terminal'],
  },
  {
    id: 'wir_crimp_terminal', name: 'Wire Crimp Terminal Assortment', nameKo: '전선 압착 단자 세트',
    category: 'wiring', description: 'Insulated crimp terminal set with ring, spade, and bullet types',
    specs: '280pcs, 22-10AWG, color-coded', priceRange: { min: 8, max: 16 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'wire crimp terminal assortment kit insulated', naver: '전선 압착단자 세트', coupang: '압착 단자 세트 280pcs' },
    tags: ['Crimp', 'Ring', 'Spade'],
  },
  {
    id: 'wir_heat_shrink', name: 'Heat Shrink Tubing Kit (127pcs)', nameKo: '열수축 튜브 키트 (127개)',
    category: 'wiring', description: 'Polyolefin heat shrink tubing in 7 sizes for wire insulation',
    specs: '127pcs, 2:1 ratio, 7 sizes', priceRange: { min: 5, max: 10 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'heat shrink tubing kit 127pcs', naver: '열수축 튜브 키트', aliexpress: 'heat shrink tube assortment 127pcs' },
    tags: ['Heat Shrink', '2:1', '127pcs'],
  },
  {
    id: 'wir_crimp_tool', name: 'Crimping Tool (JST/Dupont/XH)', nameKo: '압착 공구 (JST/듀폰/XH)',
    category: 'wiring', description: 'Precision crimping tool for JST, Dupont, and XH terminals',
    specs: 'SN-28B, 0.1-1.0mm²', priceRange: { min: 15, max: 28 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'SN-28B crimping tool JST dupont', naver: 'SN-28B 압착기 듀폰 JST', aliexpress: 'SN-28B crimping plier' },
    tags: ['SN-28B', 'Crimp', 'Tool'],
  },
  {
    id: 'wir_dc_jack', name: 'DC Power Jack Panel Mount (5.5x2.1mm)', nameKo: 'DC 전원잭 패널마운트 (5.5x2.1mm)',
    category: 'wiring', description: 'DC barrel jack female panel mount connector for power input',
    specs: '5.5x2.1mm, panel mount, 5-pack', priceRange: { min: 3, max: 7 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'DC power jack 5.5x2.1mm panel mount', naver: 'DC 전원잭 패널마운트 5.5mm', aliexpress: 'DC-022 5.5x2.1 panel mount' },
    tags: ['DC', '5.5mm', 'Panel'],
  },

  // ── Nuts & Bolts (Fasteners) ──────────────────────────────
  {
    id: 'fst_m3_kit', name: 'M3 Screw & Nut Assortment Kit', nameKo: 'M3 나사/너트 세트',
    category: 'fastener', description: 'M3 stainless steel screw kit with hex nuts and washers',
    specs: '500pcs, M3, 6-20mm lengths, SS304', priceRange: { min: 10, max: 18 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'M3 screw nut washer assortment kit stainless', naver: 'M3 나사 너트 세트 스테인리스', coupang: 'M3 나사 세트 500pcs' },
    tags: ['M3', 'SS304', '500pcs'],
  },
  {
    id: 'fst_m2_5_kit', name: 'M2.5 Standoff Spacer Kit', nameKo: 'M2.5 스탠드오프 세트',
    category: 'fastener', description: 'M2.5 nylon/brass standoffs for PCB and SBC mounting',
    specs: '300pcs, M2.5, nylon + brass, male/female', priceRange: { min: 8, max: 15 },
    associatedHardware: ['hailo8', 'stm32'], associatedSensors: [],
    searchKeywords: { amazon: 'M2.5 standoff spacer kit nylon brass', naver: 'M2.5 스탠드오프 세트 나일론', aliexpress: 'M2.5 nylon standoff kit PCB' },
    tags: ['M2.5', 'Nylon', 'Standoff'],
  },
  {
    id: 'fst_m4_hex', name: 'M4 Hex Socket Head Bolt Kit', nameKo: 'M4 육각 소켓 볼트 세트',
    category: 'fastener', description: 'M4 alloy steel hex socket cap screws for frame assembly',
    specs: '200pcs, M4, 8-30mm, 12.9 grade', priceRange: { min: 10, max: 18 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'M4 hex socket head cap screw kit', naver: 'M4 육각 소켓 볼트 세트', coupang: 'M4 육각 볼트 세트' },
    tags: ['M4', 'Hex', '12.9'],
  },
  {
    id: 'fst_tnut_2020', name: '2020 T-Nut Sliding Kit', nameKo: '2020 T너트 슬라이딩 키트',
    category: 'fastener', description: 'T-slot nuts for 2020 aluminum extrusion profile assembly',
    specs: 'M4/M5, 50pcs, drop-in type', priceRange: { min: 6, max: 12 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: '2020 T-nut drop in M5', naver: '2020 알루미늄 프로파일 T너트', aliexpress: '2020 T nut M5 drop in' },
    tags: ['2020', 'T-Nut', 'M5'],
  },
  {
    id: 'fst_zip_ties', name: 'Cable Tie Assortment (500pcs)', nameKo: '케이블 타이 세트 (500개)',
    category: 'fastener', description: 'Nylon cable ties in various sizes for cable management',
    specs: '500pcs, 100-300mm, black', priceRange: { min: 5, max: 10 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'cable tie assortment 500pcs nylon', naver: '케이블 타이 세트 500pcs', coupang: '나일론 케이블타이 500개' },
    tags: ['Nylon', '500pcs', 'Cable'],
  },
  {
    id: 'fst_rubber_feet', name: 'Self-Adhesive Rubber Feet (50pcs)', nameKo: '고무 발판 (50개)',
    category: 'fastener', description: 'Non-slip rubber bumper feet for enclosure and PCB base',
    specs: '50pcs, 10x3mm, self-adhesive', priceRange: { min: 3, max: 7 },
    associatedHardware: [], associatedSensors: [],
    searchKeywords: { amazon: 'rubber feet self adhesive bumper pads', naver: '고무 발판 접착식', aliexpress: 'self adhesive rubber feet pads' },
    tags: ['Rubber', 'Adhesive', '50pcs'],
  },
]

// ── BOM Generation ──────────────────────────────────────────

export function generateBom(state: WizardState): BomEntry[] {
  const entries: BomEntry[] = []

  // Determine hardware device ID from state
  const hardwareDeviceId = findHardwareDeviceId(state.hardware?.device ?? '')
  const sensorIds = state.sensors.map(s => s.id)

  // 1. Main Board
  const boardProducts = PRODUCT_CATALOG.filter(
    p => p.category === 'main_board' && p.associatedHardware.includes(hardwareDeviceId)
  )
  for (const p of boardProducts.slice(0, 2)) {
    entries.push({
      category: 'main_board', productId: p.id, productName: p.name,
      reason: `Main compute: ${state.hardware?.device ?? 'Selected hardware'}`,
      quantity: 1, required: true,
    })
  }

  // 2. Sensors
  for (const sid of sensorIds) {
    const sensorProducts = PRODUCT_CATALOG.filter(
      p => p.category === 'sensor' && p.associatedSensors.includes(sid)
    )
    for (const p of sensorProducts.slice(0, 1)) {
      entries.push({
        category: 'sensor', productId: p.id, productName: p.name,
        reason: `Sensor: ${state.sensors.find(s => s.id === sid)?.name ?? sid}`,
        quantity: 1, required: true,
      })
    }
  }

  // 3. Cables — match hardware + sensor combos
  const cableProducts = PRODUCT_CATALOG.filter(p => {
    if (p.category !== 'cable') return false
    const hwMatch = p.associatedHardware.length === 0 || p.associatedHardware.includes(hardwareDeviceId)
    const senMatch = p.associatedSensors.length === 0 || p.associatedSensors.some(s => sensorIds.includes(s))
    return hwMatch && senMatch && (p.associatedHardware.length > 0 || p.associatedSensors.length > 0)
  })
  for (const p of cableProducts) {
    entries.push({
      category: 'cable', productId: p.id, productName: p.name,
      reason: 'Connectivity for hardware + sensors',
      quantity: 1, required: true,
    })
  }

  // 4. Power
  const powerProducts = PRODUCT_CATALOG.filter(
    p => p.category === 'power' && p.associatedHardware.includes(hardwareDeviceId)
  )
  for (const p of powerProducts.slice(0, 1)) {
    entries.push({
      category: 'power', productId: p.id, productName: p.name,
      reason: `Power supply for ${state.hardware?.device ?? 'device'}`,
      quantity: 1, required: true,
    })
  }

  // 5. Frame — based on hardware
  const frameProducts = PRODUCT_CATALOG.filter(
    p => p.category === 'frame' && (p.associatedHardware.includes(hardwareDeviceId) || p.associatedHardware.length === 0)
  )
  for (const p of frameProducts.slice(0, 2)) {
    entries.push({
      category: 'frame', productId: p.id, productName: p.name,
      reason: 'Enclosure / mounting',
      quantity: 1, required: false,
    })
  }

  // 6. Accessories — match hardware
  const accProducts = PRODUCT_CATALOG.filter(
    p => p.category === 'accessory' && (p.associatedHardware.includes(hardwareDeviceId) || p.associatedHardware.length === 0)
  )
  for (const p of accProducts.slice(0, 3)) {
    entries.push({
      category: 'accessory', productId: p.id, productName: p.name,
      reason: 'Recommended accessory',
      quantity: 1, required: false,
    })
  }

  return entries
}

// ── Helpers ─────────────────────────────────────────────────

const DEVICE_ID_MAP: Record<string, string> = {
  'jetson thor': 'jetson_thor',
  'jetson agx orin': 'jetson_agx_orin',
  'hailo-8': 'hailo8',
  'hailo-10': 'hailo10',
  'snapdragon': 'snapdragon8elite',
  'apple a19': 'apple_a19pro',
  'tensor g5': 'tensor_g5',
  'intel core ultra': 'intel_ultra3',
  'amd ryzen': 'amd_ryzen_ai',
  'stm32': 'stm32',
}

export function findHardwareDeviceId(deviceName: string): string {
  const lower = deviceName.toLowerCase()
  for (const [key, id] of Object.entries(DEVICE_ID_MAP)) {
    if (lower.includes(key)) return id
  }
  return ''
}

export function getProductById(id: string): ShopProduct | undefined {
  return PRODUCT_CATALOG.find(p => p.id === id)
}

export function getProductsByCategory(category: ShopCategory): ShopProduct[] {
  return PRODUCT_CATALOG.filter(p => p.category === category)
}
