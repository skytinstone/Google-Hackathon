"""
LeviosAI RAG Knowledge Base Builder
Converts platform data + Edge AI expertise into ChromaDB vector store
"""

from langchain_core.documents import Document

# ============================================================
# Edge AI Knowledge Documents
# ============================================================

def build_platform_documents() -> list[Document]:
    """Convert all platform static data into LangChain documents."""
    docs: list[Document] = []

    # ── Hardware Knowledge ──────────────────────────────────
    hardware_docs = [
        {
            "category": "Nvidia Jetson",
            "content": """NVIDIA Jetson is a family of high-performance edge AI computing modules designed for robotics, autonomous machines, and embedded AI applications.

Jetson Thor: NVIDIA's most powerful edge AI module with ARM Cortex-A78AE CPU and 2000+ TOPS of AI performance. Features NVIDIA Blackwell GPU architecture. Designed primarily for humanoid robotics, autonomous machines, and complex multi-modal AI workloads. Supports CUDA, TensorRT, and DeepStream.

Jetson AGX Orin: Features 12-core ARM Cortex-A78AE CPU, 64GB LPDDR5 memory, 275 TOPS AI performance with 64 Ampere CUDA cores. Supports PCIe Gen 4 x8. Ideal for autonomous vehicles, medical imaging, smart cities, and industrial inspection. Supports JetPack SDK with CUDA, cuDNN, TensorRT.

Deployment Tips: Use TensorRT for maximum inference throughput. Apply INT8 quantization with calibration datasets for best performance. Use NVIDIA DeepStream for video analytics pipelines. JetPack SDK includes all necessary libraries.""",
        },
        {
            "category": "Hailo",
            "content": """Hailo manufactures dedicated AI inference acceleration chips optimized for edge deployment with ultra-low power consumption.

Hailo-8: 26 TOPS inference performance at only 2.5W typical power. Available in M.2 and mPCIe form factors. Raspberry Pi HAT available for prototyping. Best for always-on surveillance, retail analytics, and smart home applications.

Hailo-10: 40 TOPS inference at 5W TDP. Supports generative AI workloads with ultra-low latency streaming. Next-generation architecture with improved efficiency per watt.

Deployment Tips: Use Hailo Dataflow Compiler (DFC) to compile models. ONNX is the primary import format. Supports quantization during compilation. Hailo Model Zoo provides pre-optimized models for common tasks.""",
        },
        {
            "category": "Mobile AP",
            "content": """Mobile Application Processors with dedicated AI engines for on-device intelligence.

Qualcomm Snapdragon 8 Elite Gen 5: Oryon CPU (4+4 cores), Hexagon NPU with 100+ TOPS, Adreno 830 GPU, 4nm TSMC process. Best for smartphone AI, on-device LLM, and camera AI features. Use Qualcomm AI Engine Direct SDK.

Apple A19 Pro: 6-core Neural Engine with 38+ TOPS. Apple Intelligence on-device. 6-core GPU on 3nm process. Best for iOS AI applications using Core ML framework.

Google Tensor G5: Custom Google TPU with 15 TOPS. Gemini Nano on-device support. Titan M3 security chip. TSMC 3nm. Best for Android AI with ML Kit and TensorFlow Lite.

Deployment Tips: For Snapdragon, use QNN (Qualcomm Neural Network) SDK. For Apple, use Core ML Tools for model conversion. For Tensor, use TensorFlow Lite with GPU delegate.""",
        },
        {
            "category": "PC",
            "content": """Desktop/laptop processors with integrated AI acceleration for PC-based edge AI.

Intel Core Ultra Series 3: Intel NPU with 47 TOPS. Intel Arc integrated GPU. DDR5/LPDDR5X support. PCIe 5.0 x16. Use OpenVINO toolkit for model optimization and inference.

AMD Ryzen AI (Strix Point+): XDNA 2 NPU with 50 TOPS. RDNA 3.5 integrated GPU. Zen 5 CPU cores on 4nm process. Use AMD Vitis AI or ONNX Runtime with DirectML.

Deployment Tips: OpenVINO is the recommended framework for Intel platforms. For AMD, use DirectML provider in ONNX Runtime. Both support INT8 quantization for NPU acceleration.""",
        },
        {
            "category": "Embedded",
            "content": """Microcontroller-based embedded systems for ultra-low-power AI inference at the extreme edge.

STM32 Series: ARM Cortex-M series (M0 to M7). Micro-watt range sleep current. STM32Cube.AI for neural network deployment on MCU. Extensive HAL library.

Deployment Tips: Use STM32Cube.AI to convert TensorFlow Lite or ONNX models to optimized C code. Models must be extremely small (typically under 1MB). Focus on TinyML applications: keyword spotting, anomaly detection, gesture recognition. Use INT8 quantization as standard practice.""",
        },
    ]

    for hw in hardware_docs:
        docs.append(Document(
            page_content=hw["content"],
            metadata={"source": "platform", "type": "hardware", "category": hw["category"]},
        ))

    # ── AI Model Knowledge ──────────────────────────────────
    model_docs = [
        {
            "domain": "Computer Vision",
            "content": """Computer Vision Models for Edge AI Deployment:

YOLOv8n (3.2M params): Ultralytics nano YOLO for real-time object detection. Extremely fast inference, suitable for resource-constrained devices. mAP@0.5: ~37% on COCO. Best for: Jetson Nano, Hailo-8, mobile devices.

YOLOv11s (9.4M params): Latest YOLO architecture small variant. Improved accuracy over YOLOv8 with similar speed. Good balance of accuracy and speed for edge deployment.

YOLOv9c (25.3M params): Uses Programmable Gradient Information (PGI). Higher accuracy but requires more compute. Best for powerful edge devices like Jetson AGX Orin.

MobileNetV3-Small (2.5M params): Google's lightweight image classification network. Optimized for mobile devices with hardware-aware NAS. Excellent for real-time classification tasks.

EfficientDet-Lite0 (3.4M params): Mobile-optimized object detection from Google. Good accuracy-efficiency tradeoff. Works well with TensorFlow Lite.

ResNet50 (25M params): Classic deep residual network. Widely supported across all frameworks. Good baseline for transfer learning.

SSD MobileNetV2 (4M params): Fast single-shot multi-box detection. Excellent for real-time detection on mobile and embedded devices.

DETR-ResNet50 (41M params): Facebook's end-to-end transformer-based object detection. Higher accuracy but more computationally intensive.

NanoDet-Plus (1.2M params): Ultra-lightweight anchor-free detector. Ideal for extremely constrained devices like STM32 with sufficient RAM.

Optimization: Apply TensorRT FP16/INT8 for NVIDIA hardware. Use ONNX Runtime for cross-platform deployment. Pruning can reduce model size by 50-80% with minimal accuracy loss.""",
        },
        {
            "domain": "LLM",
            "content": """Large Language Models for Edge AI Deployment:

Exaone 4.0 1.2B (1.2B params): LG AI Research edge-optimized LLM. Good Korean language support. Designed for on-device deployment.

Qwen2.5-0.5B (0.5B params): Alibaba ultra-lightweight LLM. Smallest practical LLM for edge devices. Good multilingual support.

LLaMA 3.2 1B (1B params): Meta's edge-optimized LLaMA variant. Excellent performance for its size. Wide ecosystem support with llama.cpp.

TinyLLaMA-1.1B (1.1B params): Community's smallest LLaMA-compatible model. Good for experimentation and lightweight chatbots.

Phi-3 Mini 3.8B (3.8B params): Microsoft small language model. Surprisingly strong reasoning for its size. Good for code and math.

Gemma 2 2B (2B params): Google's lightweight open model. Strong performance with efficient architecture.

SmolLM2 1.7B (1.7B params): Hugging Face ultra-compact LLM. Optimized for edge deployment.

DeepSeek-R1-Distill 1.5B (1.5B params): DeepSeek reasoning distilled small model. Strong reasoning capabilities.

Optimization: 4-bit GGUF quantization with llama.cpp is the most common edge deployment method. Use KV-cache optimization for reduced memory. LoRA/QLoRA for efficient fine-tuning. Token compression (ToMe) can reduce inference time by 30-50%.""",
        },
        {
            "domain": "Auto Speech Recognition",
            "content": """Speech Recognition Models for Edge AI Deployment:

Whisper Small (244M params): OpenAI's multilingual STT model. Supports 99 languages. Good accuracy but relatively large for edge.
Whisper Tiny (39M params): Ultra-lightweight variant. Suitable for resource-constrained devices with acceptable accuracy.

Wav2Vec 2.0 Base (94M params): Meta's self-supervised speech recognition. Strong performance with fine-tuning.

Tacotron 2 (28M params): Google's Neural TTS synthesizer. High-quality speech synthesis.

DeepSpeech 0.9 (188M params): Mozilla open-source STT. Good community support but being superseded by newer models.

Conformer-CTC (120M params): Google conformer for streaming ASR. Excellent for real-time applications.

FastConformer (114M params): NVIDIA optimized conformer for edge. Best performance on NVIDIA hardware.

Squeezeformer (64M params): Efficient conformer variant specifically designed for edge devices. Good accuracy-size tradeoff.

Zipformer (78M params): Next-gen ASR architecture with zip attention mechanism. State-of-the-art edge ASR.

Optimization: CTC greedy decoding for fastest inference. Beam search for higher accuracy. Chunk-based streaming for real-time low-latency. VAD-triggered processing to save compute on silence.""",
        },
        {
            "domain": "BCI",
            "content": """Brain-Computer Interface Models for Edge AI Deployment:

EEGNet (2.6K params): Compact CNN for EEG-based BCI classification. Extremely lightweight, runs on any edge device including MCUs.

DeepConvNet (140K params): Deep EEG classification for motor imagery. Higher accuracy than EEGNet but more compute.

ShallowConvNet (48K params): Shallow CNN for raw EEG decoding. Good for frequency-domain features.

EEGFormer (5.8M params): Transformer-based EEG neural decoding. Best accuracy but requires more powerful edge devices.

EEG-Conformer (3.2M params): Convolution-enhanced transformer. Good balance of accuracy and efficiency.

FBCNet (12K params): Filter-bank CNN for multi-band EEG features. Very efficient.

ATCNet (115K params): Attention temporal convolutional network. Strong temporal feature extraction.

Optimization: Transfer learning with subject-specific fine-tuning is critical for BCI. Data augmentation (noise injection, frequency shift) improves generalization. INT8 quantization works well for EEG models due to their small size. Real-time constraint is typically 100ms for motor imagery BCI.""",
        },
    ]

    for model in model_docs:
        docs.append(Document(
            page_content=model["content"],
            metadata={"source": "platform", "type": "model", "domain": model["domain"]},
        ))

    # ── Optimization Techniques Knowledge ───────────────────
    technique_docs = [
        {
            "technique": "Quantization",
            "content": """Quantization for Edge AI Model Optimization:

Quantization reduces weight precision (FP32 -> INT8/INT4) to shrink model size and speed up inference.

Post-Training Quantization (PTQ): Applied after training. No retraining required. Fast to apply. Typical speedup: 2-4x. Accuracy loss: 0.5-2%. Best for: quick deployment, well-trained models.
- Static PTQ: Uses calibration dataset to determine quantization parameters
- Dynamic PTQ: Quantizes weights offline, activations at runtime

Quantization-Aware Training (QAT): Simulates quantization during training. Requires retraining but recovers accuracy. Typical accuracy recovery: 90-99% of original. Best for: accuracy-critical applications.

INT8 Quantization: Most widely supported. 4x memory reduction from FP32. Supported by TensorRT, ONNX Runtime, TFLite.
INT4 Quantization: 8x memory reduction. Used primarily for LLMs (GPTQ, GGUF). Some accuracy loss acceptable.
FP16: 2x memory reduction with minimal accuracy loss. Supported on GPUs with tensor cores.

Hardware-Specific Tips:
- NVIDIA: Use TensorRT INT8 with calibration for best results
- Hailo: Quantization is automatic during DFC compilation
- Mobile: TFLite quantization or Core ML quantization
- MCU: INT8 is typically mandatory due to memory constraints""",
        },
        {
            "technique": "Pruning",
            "content": """Pruning for Edge AI Model Optimization:

Pruning removes redundant weights or neurons to reduce model size and computation.

Unstructured Pruning: Removes individual weights (sets to zero). Can achieve high compression (90%+ sparsity). Requires sparse computation support for actual speedup. Libraries: torch.nn.utils.prune, SparseML.

Structured Pruning: Removes entire channels, filters, or layers. Hardware-friendly with direct inference speedup. Typical compression: 2-10x. No special hardware support needed. Libraries: torch-pruning, NNI.

Magnitude Pruning: Remove weights with smallest absolute values. Simple and effective baseline.
Gradient-based Pruning: Use gradient information to identify important weights. Better accuracy retention.
Learning-rate Rewinding: After pruning, rewind learning rate and retrain. Lottery ticket hypothesis approach.

Best Practices:
- Start with 20-30% pruning and gradually increase
- Always fine-tune after pruning to recover accuracy
- Structured pruning is preferred for edge deployment (actual speedup)
- Combine with quantization for maximum compression
- CV models tolerate 50-80% pruning well
- LLMs are more sensitive, typically 20-40% pruning""",
        },
        {
            "technique": "Knowledge Distillation",
            "content": """Knowledge Distillation for Edge AI Model Optimization:

Knowledge Distillation trains a compact student model to mimic a larger teacher model's behavior.

Response-Based KD: Student learns from teacher's output probability distributions (soft labels). Temperature parameter controls softness. Simple to implement.

Feature-Based KD: Student learns from teacher's intermediate feature representations. Better for complex tasks. Requires architectural alignment between teacher and student.

Practical Guide:
- Teacher model should be at least 2-4x larger than student
- Temperature of 3-6 typically works well
- Combine soft and hard label loss (alpha = 0.5-0.7 for soft labels)
- Train for more epochs than standard training
- Use same training data as teacher
- Student architecture doesn't need to match teacher

Edge AI Application:
- Distill large server model into edge-deployable student
- Example: ResNet152 teacher -> MobileNetV3 student
- Example: GPT-4 teacher -> Phi-3 Mini student (response distillation)
- Combine with quantization for additional compression""",
        },
        {
            "technique": "Edge-Specific Optimization",
            "content": """Edge-Specific Optimization Techniques:

TensorRT Optimization (NVIDIA):
- FP16: Half-precision for 2x speedup with minimal accuracy loss
- INT8 with Calibration: Best TensorRT performance with dataset calibration
- Layer fusion, kernel auto-tuning, dynamic tensor memory

LoRA / QLoRA (LLM):
- LoRA: Low-rank adaptation matrices for efficient fine-tuning
- QLoRA: 4-bit quantization + LoRA for memory-efficient training
- Reduces trainable parameters by 90%+

Token Compression (LLM):
- Token Merging (ToMe): Merge similar tokens to reduce sequence length
- Token Pruning: Drop low-importance tokens during inference
- 30-50% speedup with minimal quality loss

CTC Optimization (ASR):
- Greedy Decoding: Fastest path, minimal overhead
- Beam Search: Higher accuracy with configurable beam width

Streaming Inference (ASR):
- Chunk-based: Process fixed-size audio chunks for constant latency
- VAD-triggered: Process only speech segments to save compute

Transfer Learning (BCI):
- Subject-specific fine-tuning: Freeze early layers, fine-tune on target
- Domain adaptation: Align feature distributions across subjects

Model Compilation:
- ONNX Runtime: Cross-platform inference optimization
- TVM: Deep learning compiler for any hardware
- OpenVINO: Intel hardware optimization
- Core ML: Apple hardware optimization""",
        },
    ]

    for tech in technique_docs:
        docs.append(Document(
            page_content=tech["content"],
            metadata={"source": "platform", "type": "technique", "technique": tech["technique"]},
        ))

    # ── Edge AI Deployment Best Practices ───────────────────
    best_practices = [
        {
            "topic": "Deployment Pipeline",
            "content": """Edge AI Deployment Pipeline Best Practices:

1. Model Selection: Choose the smallest model that meets accuracy requirements. Start with nano/tiny variants.

2. Optimization Chain (recommended order):
   a. Knowledge Distillation (if starting from large model)
   b. Pruning (structured for edge, 30-60% sparsity)
   c. Quantization (INT8 PTQ first, QAT if accuracy insufficient)
   d. Hardware-specific compilation (TensorRT, OpenVINO, CoreML)

3. Benchmarking:
   - Measure latency, throughput, memory, and power consumption
   - Test on actual target hardware (simulation may differ)
   - Use representative test datasets

4. Memory Budget Planning:
   - Reserve memory for OS, runtime, and input/output buffers
   - Model size after optimization should fit in 50-70% of available RAM
   - For LLMs: KV-cache grows with context length

5. Power Management:
   - Profile power consumption during inference
   - Use batch processing when real-time isn't required
   - Implement sleep/wake patterns for always-on applications

6. Production Considerations:
   - Model versioning and OTA update capability
   - Fallback mechanisms for model failures
   - Monitoring inference latency and accuracy drift
   - Thermal management for sustained workloads""",
        },
        {
            "topic": "Framework Selection",
            "content": """Edge AI Framework Selection Guide:

NVIDIA Jetson: TensorRT (best performance), ONNX Runtime, PyTorch with CUDA, DeepStream (video analytics)

Hailo: Hailo Dataflow Compiler, ONNX (input format), Hailo Model Zoo

Qualcomm Snapdragon: QNN SDK, SNPE, ONNX Runtime with QNN EP, TFLite

Apple Devices: Core ML, Core ML Tools (conversion), Create ML

Google Tensor: TensorFlow Lite, ML Kit, MediaPipe

Intel: OpenVINO, ONNX Runtime with OpenVINO EP

AMD: ONNX Runtime with DirectML EP, Vitis AI

STM32 MCU: STM32Cube.AI, TensorFlow Lite Micro, CMSIS-NN

Cross-Platform: ONNX Runtime (widest hardware support), TensorFlow Lite (mobile/embedded), llama.cpp (LLM specific)

LLM Specific: llama.cpp (GGUF format), vLLM (server), Ollama (local), MLC LLM (mobile)

Recommendation: Start with ONNX Runtime for maximum portability, then optimize with hardware-specific tools.""",
        },
        {
            "topic": "Performance Optimization",
            "content": """Edge AI Performance Optimization Tips:

Latency Optimization:
- Use hardware-specific runtimes (TensorRT > generic ONNX Runtime on NVIDIA)
- Enable operator fusion in the inference runtime
- Use async inference with double-buffering for continuous workloads
- Reduce input resolution when possible (640x480 vs 1920x1080)

Throughput Optimization:
- Batch multiple inputs when latency allows
- Use pipeline parallelism (capture -> preprocess -> inference -> postprocess)
- Multi-stream inference on GPUs

Memory Optimization:
- Use in-place operations to reduce memory allocations
- Enable memory pooling in inference runtimes
- Share memory between preprocessing and inference
- For LLMs: Use paged attention (vLLM) or quantized KV-cache

Power Optimization:
- Use dynamic voltage and frequency scaling (DVFS)
- Implement inference scheduling (batch during off-peak)
- Profile and optimize idle power consumption
- Use dedicated NPUs instead of GPU when available

Model-Specific Tips:
- CV: Reduce input size, use lighter backbone, skip postprocessing for classification
- LLM: Use speculative decoding, KV-cache reuse, continuous batching
- ASR: VAD-gated processing, streaming chunk size optimization
- BCI: Sliding window with overlap, feature caching""",
        },
    ]

    for bp in best_practices:
        docs.append(Document(
            page_content=bp["content"],
            metadata={"source": "platform", "type": "best_practice", "topic": bp["topic"]},
        ))

    # ── LeviosAI Platform Guide ─────────────────────────────
    platform_guide = Document(
        page_content="""LeviosAI Platform User Guide:

LeviosAI is an Edge AI Optimization Platform that helps users design, build, and deploy AI models on edge hardware devices.

Platform Workflow (7 Steps):
1. Domain Selection: Choose AI domain (Computer Vision, LLM, ASR, BCI)
2. Hardware & Sensors: Select target edge hardware and sensors
3. Hardware Configuration: Configure sensor pipeline and data flow
4. AI Model Selection: Choose appropriate AI model for your domain
5. Optimization: Apply optimization techniques (quantization, pruning, KD, etc.)
6. Code Generation: Generate deployment-ready code in Python/C++/CUDA
7. Project Complete: Review, download, and deploy

Supported Hardware Categories:
- NVIDIA Jetson (Thor, AGX Orin) - High-performance edge
- Hailo (Hailo-8, Hailo-10) - Dedicated AI acceleration
- Mobile AP (Snapdragon, Apple, Tensor) - Mobile devices
- PC (Intel Ultra, AMD Ryzen AI) - Desktop/laptop AI
- Embedded (STM32) - Ultra-low-power MCU

The platform uses Google Gemini AI for intelligent recommendations, compatibility analysis, and code generation. All AI features are powered by Gemini 2.5 Flash model through LangChain RAG pipeline for enhanced, context-aware responses.""",
        metadata={"source": "platform", "type": "guide", "topic": "overview"},
    )
    docs.append(platform_guide)

    return docs
