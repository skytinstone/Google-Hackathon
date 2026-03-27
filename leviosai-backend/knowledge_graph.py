"""
LeviosAI Knowledge Graph — Relationship-based recommendation engine

Provides scoring algorithms for:
  1. Domain → Hardware affinity
  2. Hardware × Model compatibility
  3. Technique synergy / conflict analysis
"""

from __future__ import annotations
import math
from typing import Optional

# ============================================================
# Hardware Specifications
# ============================================================

HARDWARE_SPECS: dict[str, dict] = {
    "jetson_thor":      {"tops": 2000, "memory_gb": 128, "power_w": 100, "category": "Nvidia Jetson"},
    "jetson_agx_orin":  {"tops": 275,  "memory_gb": 64,  "power_w": 60,  "category": "Nvidia Jetson"},
    "hailo8":           {"tops": 26,   "memory_gb": 2,   "power_w": 2.5, "category": "Hailo"},
    "hailo10":          {"tops": 40,   "memory_gb": 4,   "power_w": 5,   "category": "Hailo"},
    "snapdragon8elite": {"tops": 100,  "memory_gb": 16,  "power_w": 8,   "category": "Mobile AP"},
    "apple_a19pro":     {"tops": 38,   "memory_gb": 8,   "power_w": 6,   "category": "Mobile AP"},
    "tensor_g5":        {"tops": 15,   "memory_gb": 12,  "power_w": 5,   "category": "Mobile AP"},
    "intel_ultra3":     {"tops": 47,   "memory_gb": 32,  "power_w": 28,  "category": "PC"},
    "amd_ryzen_ai":     {"tops": 50,   "memory_gb": 32,  "power_w": 28,  "category": "PC"},
    "stm32":            {"tops": 0.1,  "memory_gb": 0.002, "power_w": 0.1, "category": "Embedded"},
}

HARDWARE_NAMES: dict[str, str] = {
    "jetson_thor": "Jetson Thor",
    "jetson_agx_orin": "Jetson AGX Orin",
    "hailo8": "Hailo-8",
    "hailo10": "Hailo-10",
    "snapdragon8elite": "Qualcomm Snapdragon 8 Elite Gen 5",
    "apple_a19pro": "Apple A19 Pro",
    "tensor_g5": "Google Tensor G5",
    "intel_ultra3": "Intel Core Ultra Series 3",
    "amd_ryzen_ai": "AMD Ryzen AI (Strix Point+)",
    "stm32": "STM32 Series",
}

# ============================================================
# Model Specifications
# ============================================================

def _parse_params(params_str: str) -> float:
    """Parse parameter string like '3.2M' or '1.2B' to millions."""
    s = params_str.strip().upper()
    if s.endswith("B"):
        return float(s[:-1]) * 1000
    elif s.endswith("M"):
        return float(s[:-1])
    elif s.endswith("K"):
        return float(s[:-1]) / 1000
    return float(s)


MODEL_SPECS: dict[str, dict] = {
    # Computer Vision
    "yolov8n":         {"params_m": 3.2,   "min_tops": 2,   "min_mem_gb": 0.3,  "domain": "Computer Vision"},
    "yolov11s":        {"params_m": 9.4,   "min_tops": 5,   "min_mem_gb": 0.5,  "domain": "Computer Vision"},
    "mobilenetv3":     {"params_m": 2.5,   "min_tops": 1,   "min_mem_gb": 0.2,  "domain": "Computer Vision"},
    "efficientdet_lite": {"params_m": 3.4, "min_tops": 2,   "min_mem_gb": 0.3,  "domain": "Computer Vision"},
    "resnet50":        {"params_m": 25,    "min_tops": 10,  "min_mem_gb": 1.5,  "domain": "Computer Vision"},
    "ssd_mobilenet":   {"params_m": 4,     "min_tops": 2,   "min_mem_gb": 0.3,  "domain": "Computer Vision"},
    "yolov9c":         {"params_m": 25.3,  "min_tops": 12,  "min_mem_gb": 1.5,  "domain": "Computer Vision"},
    "detr_resnet50":   {"params_m": 41,    "min_tops": 20,  "min_mem_gb": 2.5,  "domain": "Computer Vision"},
    "efficientnetb0":  {"params_m": 5.3,   "min_tops": 3,   "min_mem_gb": 0.4,  "domain": "Computer Vision"},
    "nanodet_plus":    {"params_m": 1.2,   "min_tops": 0.5, "min_mem_gb": 0.1,  "domain": "Computer Vision"},
    # LLM
    "exaone4":         {"params_m": 1200,  "min_tops": 30,  "min_mem_gb": 3,    "domain": "LLM"},
    "qwen2_5":         {"params_m": 500,   "min_tops": 15,  "min_mem_gb": 1.5,  "domain": "LLM"},
    "llama3_2":        {"params_m": 1000,  "min_tops": 25,  "min_mem_gb": 2.5,  "domain": "LLM"},
    "tinyllama":       {"params_m": 1100,  "min_tops": 28,  "min_mem_gb": 2.8,  "domain": "LLM"},
    "phi3_mini":       {"params_m": 3800,  "min_tops": 60,  "min_mem_gb": 8,    "domain": "LLM"},
    "gemma2_2b":       {"params_m": 2000,  "min_tops": 40,  "min_mem_gb": 5,    "domain": "LLM"},
    "smollm2":         {"params_m": 1700,  "min_tops": 35,  "min_mem_gb": 4,    "domain": "LLM"},
    "mistral_7b":      {"params_m": 7000,  "min_tops": 100, "min_mem_gb": 16,   "domain": "LLM"},
    "llama3_1_8b":     {"params_m": 8000,  "min_tops": 120, "min_mem_gb": 18,   "domain": "LLM"},
    "deepseek_r1":     {"params_m": 1500,  "min_tops": 32,  "min_mem_gb": 3.5,  "domain": "LLM"},
    # ASR
    "tacotron2":       {"params_m": 28,    "min_tops": 5,   "min_mem_gb": 0.5,  "domain": "Auto Speech Recognition"},
    "whisper_small":   {"params_m": 244,   "min_tops": 15,  "min_mem_gb": 1.5,  "domain": "Auto Speech Recognition"},
    "wav2vec2_base":   {"params_m": 94,    "min_tops": 8,   "min_mem_gb": 0.8,  "domain": "Auto Speech Recognition"},
    "deepspeech":      {"params_m": 188,   "min_tops": 12,  "min_mem_gb": 1.2,  "domain": "Auto Speech Recognition"},
    "whisper_tiny":    {"params_m": 39,    "min_tops": 3,   "min_mem_gb": 0.3,  "domain": "Auto Speech Recognition"},
    "conformer":       {"params_m": 120,   "min_tops": 10,  "min_mem_gb": 1,    "domain": "Auto Speech Recognition"},
    "hubert_base":     {"params_m": 95,    "min_tops": 8,   "min_mem_gb": 0.8,  "domain": "Auto Speech Recognition"},
    "fastconformer":   {"params_m": 114,   "min_tops": 9,   "min_mem_gb": 0.9,  "domain": "Auto Speech Recognition"},
    "squeezeformer":   {"params_m": 64,    "min_tops": 5,   "min_mem_gb": 0.5,  "domain": "Auto Speech Recognition"},
    "zipformer":       {"params_m": 78,    "min_tops": 6,   "min_mem_gb": 0.6,  "domain": "Auto Speech Recognition"},
    # BCI
    "eegnet":          {"params_m": 0.0026, "min_tops": 0.01, "min_mem_gb": 0.001, "domain": "BCI"},
    "deepconvnet":     {"params_m": 0.14,   "min_tops": 0.05, "min_mem_gb": 0.01,  "domain": "BCI"},
    "shallowconvnet":  {"params_m": 0.048,  "min_tops": 0.02, "min_mem_gb": 0.005, "domain": "BCI"},
    "eegformer":       {"params_m": 5.8,    "min_tops": 1,    "min_mem_gb": 0.1,   "domain": "BCI"},
    "eeg_conformer":   {"params_m": 3.2,    "min_tops": 0.5,  "min_mem_gb": 0.05,  "domain": "BCI"},
    "fbcnet":          {"params_m": 0.012,   "min_tops": 0.01, "min_mem_gb": 0.002, "domain": "BCI"},
    "tidnet":          {"params_m": 0.086,   "min_tops": 0.03, "min_mem_gb": 0.008, "domain": "BCI"},
    "atcnet":          {"params_m": 0.115,   "min_tops": 0.04, "min_mem_gb": 0.01,  "domain": "BCI"},
    "eeginception":    {"params_m": 0.042,   "min_tops": 0.02, "min_mem_gb": 0.005, "domain": "BCI"},
    "bciiv2a_cnn":     {"params_m": 0.028,   "min_tops": 0.01, "min_mem_gb": 0.003, "domain": "BCI"},
}

# ============================================================
# Domain → Hardware Category Affinity  (0–100)
# ============================================================

DOMAIN_HW_AFFINITY: dict[str, dict[str, int]] = {
    "Computer Vision": {
        "Nvidia Jetson": 95,
        "Hailo": 88,
        "Mobile AP": 75,
        "PC": 72,
        "Embedded": 35,
    },
    "LLM": {
        "Nvidia Jetson": 92,
        "PC": 85,
        "Mobile AP": 68,
        "Hailo": 30,
        "Embedded": 8,
    },
    "Auto Speech Recognition": {
        "Mobile AP": 90,
        "PC": 85,
        "Nvidia Jetson": 80,
        "Hailo": 58,
        "Embedded": 30,
    },
    "BCI": {
        "Embedded": 92,
        "Mobile AP": 78,
        "PC": 72,
        "Nvidia Jetson": 65,
        "Hailo": 55,
    },
}

# ============================================================
# Technique Synergy & Conflict Data
# ============================================================

TECHNIQUE_SYNERGIES: list[dict] = [
    {
        "pair": ["pruning", "quantization"],
        "score": 88,
        "label": "Strong Synergy",
        "description": "Prune redundant weights first, then quantize for maximum compression with minimal accuracy loss",
        "recommended_order": ["pruning", "quantization"],
    },
    {
        "pair": ["kd", "quantization"],
        "score": 85,
        "label": "Strong Synergy",
        "description": "Distill knowledge to a smaller model, then quantize the student for edge deployment",
        "recommended_order": ["kd", "quantization"],
    },
    {
        "pair": ["kd", "pruning"],
        "score": 78,
        "label": "Good Synergy",
        "description": "Distill first, then prune the student model for further size reduction",
        "recommended_order": ["kd", "pruning"],
    },
    {
        "pair": ["quantization", "tensorrt"],
        "score": 95,
        "label": "Excellent Synergy",
        "description": "INT8 quantization combined with TensorRT compilation yields maximum throughput on NVIDIA GPUs",
        "recommended_order": ["quantization", "tensorrt"],
    },
    {
        "pair": ["pruning", "tensorrt"],
        "score": 80,
        "label": "Good Synergy",
        "description": "Structured pruning reduces ops, TensorRT further optimizes the execution graph",
        "recommended_order": ["pruning", "tensorrt"],
    },
    {
        "pair": ["quantization", "lora"],
        "score": 90,
        "label": "Excellent Synergy",
        "description": "QLoRA combines 4-bit quantization with LoRA adapters for memory-efficient fine-tuning",
        "recommended_order": ["quantization", "lora"],
    },
    {
        "pair": ["quantization", "ctc_opt"],
        "score": 82,
        "label": "Good Synergy",
        "description": "Quantized model with optimized CTC decoding for fast real-time speech recognition",
        "recommended_order": ["quantization", "ctc_opt"],
    },
    {
        "pair": ["quantization", "streaming"],
        "score": 80,
        "label": "Good Synergy",
        "description": "Quantized streaming pipeline for low-latency real-time ASR on edge",
        "recommended_order": ["quantization", "streaming"],
    },
    {
        "pair": ["ctc_opt", "streaming"],
        "score": 88,
        "label": "Strong Synergy",
        "description": "CTC greedy decoding is ideal for streaming chunk-based inference",
        "recommended_order": ["streaming", "ctc_opt"],
    },
    {
        "pair": ["quantization", "transfer"],
        "score": 76,
        "label": "Moderate Synergy",
        "description": "Fine-tune via transfer learning, then quantize the adapted model",
        "recommended_order": ["transfer", "quantization"],
    },
    {
        "pair": ["transfer", "data_aug"],
        "score": 85,
        "label": "Strong Synergy",
        "description": "Data augmentation improves generalization of transfer-learned BCI models",
        "recommended_order": ["data_aug", "transfer"],
    },
    {
        "pair": ["pruning", "lora"],
        "score": 72,
        "label": "Moderate Synergy",
        "description": "Prune base model, then apply LoRA for efficient task adaptation",
        "recommended_order": ["pruning", "lora"],
    },
    {
        "pair": ["kd", "tensorrt"],
        "score": 82,
        "label": "Good Synergy",
        "description": "Distill to a compact student model, then compile with TensorRT",
        "recommended_order": ["kd", "tensorrt"],
    },
    {
        "pair": ["token_compression", "quantization"],
        "score": 78,
        "label": "Good Synergy",
        "description": "Reduce token count + quantize weights for compound LLM speedup",
        "recommended_order": ["quantization", "token_compression"],
    },
]

TECHNIQUE_CONFLICTS: list[dict] = [
    {
        "pair": ["tensorrt", "hailo"],
        "severity": "hard",
        "description": "TensorRT is NVIDIA-only — cannot run on Hailo hardware",
    },
]

# Hardware-specific technique warnings
TECHNIQUE_HW_WARNINGS: dict[str, list[str]] = {
    "tensorrt": ["Nvidia Jetson"],     # Only effective on these categories
    "lora": ["Nvidia Jetson", "PC"],   # Needs enough memory for LoRA adapters
}

# ============================================================
# Scoring Functions
# ============================================================

def _clamp(lo: float, hi: float, val: float) -> float:
    return max(lo, min(hi, val))


def _sigmoid_score(ratio: float, midpoint: float = 1.0, steepness: float = 4.0) -> float:
    """Smooth S-curve scoring: 0 at ratio=0, 50 at midpoint, ~100 at 2×midpoint."""
    x = (ratio / midpoint - 1) * steepness
    return 100 / (1 + math.exp(-x))


def compute_hardware_score(domain: str, hw_id: str) -> dict:
    """Score a hardware device's suitability for a domain (0–100)."""
    hw = HARDWARE_SPECS.get(hw_id)
    if not hw:
        return {"score": 0, "reason": "Unknown hardware"}

    affinity = DOMAIN_HW_AFFINITY.get(domain, {}).get(hw["category"], 50)

    # Power efficiency bonus: lower power is better for edge
    power_score = _clamp(0, 100, 100 - hw["power_w"] * 0.5)

    # TOPS adequacy for domain
    domain_tops_needs = {
        "Computer Vision": 10,
        "LLM": 50,
        "Auto Speech Recognition": 8,
        "BCI": 0.5,
    }
    needed = domain_tops_needs.get(domain, 10)
    tops_score = _sigmoid_score(hw["tops"] / needed if needed > 0 else 100)

    score = round(_clamp(0, 100, affinity * 0.55 + tops_score * 0.30 + power_score * 0.15))

    # Generate reason
    reasons = []
    if affinity >= 85:
        reasons.append(f"Highly optimized for {domain}")
    elif affinity >= 70:
        reasons.append(f"Good fit for {domain}")
    else:
        reasons.append(f"Moderate fit for {domain}")

    if hw["tops"] >= needed * 3:
        reasons.append(f"{hw['tops']} TOPS — significant compute headroom")
    elif hw["tops"] >= needed:
        reasons.append(f"{hw['tops']} TOPS — adequate compute capacity")
    else:
        reasons.append(f"{hw['tops']} TOPS — may be insufficient")

    return {
        "device_id": hw_id,
        "device_name": HARDWARE_NAMES.get(hw_id, hw_id),
        "category": hw["category"],
        "score": score,
        "reason": ". ".join(reasons),
    }


def compute_model_score(hw_id: str, model_id: str) -> dict:
    """Score a model's compatibility with specific hardware (0–100)."""
    hw = HARDWARE_SPECS.get(hw_id)
    model = MODEL_SPECS.get(model_id)
    if not hw or not model:
        return {"score": 0, "reason": "Unknown hardware or model"}

    # TOPS headroom
    tops_ratio = hw["tops"] / model["min_tops"] if model["min_tops"] > 0 else 999
    tops_score = _sigmoid_score(tops_ratio, midpoint=1.0, steepness=3.0)

    # Memory headroom
    mem_ratio = hw["memory_gb"] / model["min_mem_gb"] if model["min_mem_gb"] > 0 else 999
    mem_score = _sigmoid_score(mem_ratio, midpoint=1.0, steepness=3.0)

    # Penalty for overkill (wasted resources)
    efficiency_penalty = 0
    if tops_ratio > 50:
        efficiency_penalty = 10  # Massive overkill

    score = round(_clamp(0, 100, tops_score * 0.55 + mem_score * 0.45 - efficiency_penalty))

    # Reason
    if tops_ratio < 0.5:
        reason = f"Insufficient compute: {hw['tops']} TOPS vs {model['min_tops']} TOPS needed"
    elif tops_ratio < 1:
        reason = f"Tight fit: {hw['tops']} TOPS for {model['min_tops']} TOPS requirement — optimization essential"
    elif tops_ratio < 3:
        reason = f"Good match: {hw['tops']} TOPS for {model['min_tops']} TOPS — balanced performance"
    else:
        reason = f"Ample headroom: {hw['tops']} TOPS for {model['min_tops']} TOPS — room for batching"

    return {
        "model_id": model_id,
        "score": score,
        "reason": reason,
        "tops_ratio": round(tops_ratio, 1),
        "mem_ratio": round(mem_ratio, 1),
    }


def recommend_hardware(domain: str) -> list[dict]:
    """Rank all hardware devices by domain affinity. Returns sorted list."""
    results = []
    for hw_id in HARDWARE_SPECS:
        entry = compute_hardware_score(domain, hw_id)
        results.append(entry)
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def recommend_models(domain: str, hw_id: str) -> list[dict]:
    """Rank domain models by hardware compatibility. Returns sorted list."""
    results = []
    for model_id, spec in MODEL_SPECS.items():
        if spec["domain"] != domain:
            continue
        entry = compute_model_score(hw_id, model_id)
        results.append(entry)
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def analyze_techniques(
    technique_ids: list[str],
    domain: Optional[str] = None,
    hw_id: Optional[str] = None,
) -> dict:
    """Analyze technique combinations for synergies, conflicts, and warnings."""
    synergies = []
    conflicts = []
    warnings = []

    id_set = set(technique_ids)

    # Find synergies
    for syn in TECHNIQUE_SYNERGIES:
        a, b = syn["pair"]
        if a in id_set and b in id_set:
            synergies.append(syn)

    # Find conflicts
    for con in TECHNIQUE_CONFLICTS:
        a, b = con["pair"]
        if a in id_set and b in id_set:
            conflicts.append(con)

    # Hardware-specific warnings
    if hw_id:
        hw = HARDWARE_SPECS.get(hw_id)
        if hw:
            hw_cat = hw["category"]
            for tech_id in technique_ids:
                allowed_cats = TECHNIQUE_HW_WARNINGS.get(tech_id)
                if allowed_cats and hw_cat not in allowed_cats:
                    warnings.append({
                        "technique": tech_id,
                        "message": f"{tech_id} is optimized for {', '.join(allowed_cats)} — may not benefit {hw_cat} hardware",
                    })

    # Suggest additional techniques
    suggestions = []
    if hw_id:
        hw = HARDWARE_SPECS.get(hw_id)
        if hw and hw["category"] == "Nvidia Jetson" and "tensorrt" not in id_set:
            suggestions.append({
                "technique_id": "tensorrt",
                "reason": "TensorRT compilation recommended for NVIDIA Jetson hardware",
            })
        if hw and hw["category"] == "Embedded" and "quantization" not in id_set:
            suggestions.append({
                "technique_id": "quantization",
                "reason": "Quantization is essential for MCU-class embedded deployment",
            })

    if domain == "LLM" and "lora" not in id_set and "quantization" in id_set:
        suggestions.append({
            "technique_id": "lora",
            "reason": "QLoRA pairs well with quantization for efficient LLM fine-tuning",
        })

    # Recommended application order
    ORDER_PRIORITY = {
        "data_aug": 1, "transfer": 2, "kd": 3,
        "pruning": 4, "lora": 5, "token_compression": 6,
        "quantization": 7, "ctc_opt": 8, "streaming": 9, "tensorrt": 10,
    }
    ordered = sorted(technique_ids, key=lambda t: ORDER_PRIORITY.get(t, 50))

    return {
        "synergies": synergies,
        "conflicts": conflicts,
        "warnings": warnings,
        "suggestions": suggestions,
        "recommended_order": ordered,
    }
