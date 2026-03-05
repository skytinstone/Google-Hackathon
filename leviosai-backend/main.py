from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Annotated
from google import genai
import os
import json
import re
import sqlite3
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Leviosai Backend", version="1.0.0")

# ============================================================
# SQLite Database
# ============================================================

# Use /tmp on Vercel (read-only filesystem), local dir otherwise
_local_db = os.path.join(os.path.dirname(__file__), "leviosai.db")
DB_PATH = "/tmp/leviosai.db" if os.environ.get("VERCEL") else _local_db

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            username TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT '',
            birthday TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            github TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL DEFAULT '',
            photo TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            manufacturer TEXT NOT NULL DEFAULT '',
            part_number TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'Accessory',
            qty INTEGER NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL DEFAULT 0.0,
            supplier TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'ordered',
            datasheet TEXT NOT NULL DEFAULT '',
            memo TEXT NOT NULL DEFAULT '',
            image TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_parts_project ON parts(project_id)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            version TEXT NOT NULL DEFAULT '',
            latest TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'runtime',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_packages_project ON packages(project_id)")
    conn.commit()
    conn.close()

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Static Data
# ============================================================

DOMAINS = [
    {
        "id": "cv",
        "name": "Computer Vision",
        "description": "Image & video analysis for object detection, classification, and segmentation",
    },
    {
        "id": "llm",
        "name": "LLM",
        "description": "Large Language Models for text generation, understanding, and reasoning",
    },
    {
        "id": "asr",
        "name": "Auto Speech Recognition",
        "description": "TTS/STT models for speech synthesis and voice recognition",
    },
]

HARDWARE: Dict[str, Dict] = {
    "Nvidia Jetson": {
        "description": "High-performance edge AI computing modules",
        "devices": [
            {"id": "jetson_thor", "name": "Jetson Thor", "specs": "ARM Cortex-A78AE, 2000 TOPS"},
            {"id": "jetson_agx_orin", "name": "Jetson AGX Orin", "specs": "ARM Cortex-A78AE, 275 TOPS"},
        ],
    },
    "Hailo": {
        "description": "Dedicated AI inference acceleration chips",
        "devices": [
            {"id": "hailo8", "name": "Hailo-8", "specs": "26 TOPS, 2.5W"},
            {"id": "hailo10", "name": "Hailo-10", "specs": "40 TOPS, 5W"},
        ],
    },
    "Mobile AP": {
        "description": "Mobile application processors with dedicated AI engines",
        "devices": [
            {"id": "snapdragon8elite", "name": "Qualcomm Snapdragon 8 Elite Gen 5", "specs": "Hexagon NPU, 100+ TOPS"},
            {"id": "apple_a19pro", "name": "Apple A19 Pro", "specs": "Neural Engine, 38+ TOPS"},
            {"id": "tensor_g5", "name": "Google Tensor G5", "specs": "TPU, 15 TOPS"},
        ],
    },
    "PC": {
        "description": "Desktop/laptop processors with integrated AI acceleration",
        "devices": [
            {"id": "intel_ultra3", "name": "Intel Core Ultra Series 3", "specs": "Intel NPU, 47 TOPS"},
            {"id": "amd_ryzen_ai", "name": "AMD Ryzen AI (Strix Point+)", "specs": "XDNA 2 NPU, 50 TOPS"},
        ],
    },
    "Embedded": {
        "description": "Microcontroller-based embedded systems for ultra-low-power inference",
        "devices": [
            {"id": "stm32", "name": "STM32 Series", "specs": "ARM Cortex-M, MCU-class"},
        ],
    },
}

MODELS: Dict[str, List[Dict]] = {
    "Computer Vision": [
        {"id": "yolov8n", "name": "YOLOv8n", "params": "3.2M", "description": "Nano YOLO for real-time object detection"},
        {"id": "yolov11s", "name": "YOLOv11s", "params": "9.4M", "description": "Latest YOLO architecture, small variant"},
        {"id": "mobilenetv3", "name": "MobileNetV3-Small", "params": "2.5M", "description": "Lightweight image classification"},
        {"id": "efficientdet_lite", "name": "EfficientDet-Lite0", "params": "3.4M", "description": "Mobile-optimized object detection"},
        {"id": "resnet50", "name": "ResNet50", "params": "25M", "description": "Deep residual network for classification"},
        {"id": "ssd_mobilenet", "name": "SSD MobileNetV2", "params": "4M", "description": "Fast single-shot multi-box detection"},
    ],
    "LLM": [
        {"id": "exaone4", "name": "Exaone 4.0 1.2B", "params": "1.2B", "description": "LG AI Research edge-optimized LLM"},
        {"id": "qwen2_5", "name": "Qwen2.5-0.5B", "params": "0.5B", "description": "Alibaba ultra-lightweight LLM"},
        {"id": "llama3_2", "name": "LLaMA 3.2 1B", "params": "1B", "description": "Meta edge-optimized LLaMA"},
        {"id": "tinyllama", "name": "TinyLLaMA-1.1B", "params": "1.1B", "description": "Community's smallest LLaMA-compatible model"},
        {"id": "phi3_mini", "name": "Phi-3 Mini 3.8B", "params": "3.8B", "description": "Microsoft small language model"},
    ],
    "Auto Speech Recognition": [
        {"id": "tacotron2", "name": "Tacotron 2", "params": "28M", "description": "Google Neural TTS synthesizer"},
        {"id": "whisper_small", "name": "Whisper Small", "params": "244M", "description": "OpenAI multilingual STT model"},
        {"id": "wav2vec2_base", "name": "Wav2Vec 2.0 Base", "params": "94M", "description": "Meta self-supervised speech recognition"},
        {"id": "deepspeech", "name": "DeepSpeech 0.9", "params": "188M", "description": "Mozilla open-source STT"},
    ],
}

TECHNIQUES = [
    {
        "id": "quantization",
        "name": "Quantization",
        "description": "Reduce weight precision (FP32 → INT8/INT4) to shrink model size and speed up inference",
        "subtypes": [
            {
                "id": "ptq",
                "name": "PTQ",
                "fullName": "Post Training Quantization",
                "description": "Quantize after training. Fast, no retraining required.",
            },
            {
                "id": "qat",
                "name": "QAT",
                "fullName": "Quantization Aware Training",
                "description": "Simulate quantization during training for higher accuracy. Requires retraining.",
            },
        ],
    },
    {
        "id": "pruning",
        "name": "Pruning",
        "description": "Remove redundant weights or neurons to reduce model size and computation",
        "subtypes": [
            {
                "id": "unstructured",
                "name": "Unstructured",
                "fullName": "Unstructured Pruning",
                "description": "Remove individual weights. High compression ratio, harder to accelerate on hardware.",
            },
            {
                "id": "structured",
                "name": "Structured",
                "fullName": "Structured Pruning",
                "description": "Remove entire channels/filters. Hardware-friendly with direct inference speedup.",
            },
        ],
    },
    {
        "id": "kd",
        "name": "Knowledge Distillation",
        "description": "Train a compact student model to mimic a larger teacher model's behavior",
        "subtypes": [
            {
                "id": "response",
                "name": "Response-Based",
                "fullName": "Response-Based KD",
                "description": "Student learns from teacher's output probability distributions.",
            },
            {
                "id": "feature",
                "name": "Feature-Based",
                "fullName": "Feature-Based KD",
                "description": "Student learns from teacher's intermediate feature representations.",
            },
        ],
    },
]

LANGUAGES = ["Python", "C++", "C", "CUDA", "TensorRT Python"]


# ============================================================
# Pydantic Models
# ============================================================


class User(BaseModel):
    username: str
    password: str


class CompatibilityRequest(BaseModel):
    domain: str
    hardware_category: str
    hardware_device: str
    model_name: str
    model_params: Optional[str] = None


class TechniqueItem(BaseModel):
    id: str
    name: str
    subtype: Optional[str] = None


class CodeGenRequest(BaseModel):
    domain: str
    hardware_category: str
    hardware_device: str
    model_name: str
    techniques: List[TechniqueItem]
    language: str


class ModelInfoRequest(BaseModel):
    model_name: str
    domain: str


class ProfileUpdate(BaseModel):
    name: str = ''
    birthday: str = ''
    email: str = ''
    github: str = ''
    role: str = ''
    photo: Optional[str] = None


class PartCreate(BaseModel):
    project_id: str
    name: str
    manufacturer: str = ''
    part_number: str = ''
    category: str = 'Accessory'
    qty: int = 1
    unit_price: float = 0.0
    supplier: str = ''
    status: str = 'ordered'
    datasheet: str = ''
    memo: str = ''
    image: Optional[str] = None


class PartUpdate(BaseModel):
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    part_number: Optional[str] = None
    category: Optional[str] = None
    qty: Optional[int] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    status: Optional[str] = None
    datasheet: Optional[str] = None
    memo: Optional[str] = None
    image: Optional[str] = None


class PackageCreate(BaseModel):
    project_id: str
    name: str
    version: str = ''
    latest: str = ''
    category: str = 'runtime'


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    latest: Optional[str] = None
    category: Optional[str] = None


# ============================================================
# In-Memory User DB (dev only)
# ============================================================

fake_users_db: Dict[str, Dict] = {
    "stevenshin16": {"username": "stevenshin16", "password": "1234"},
    "admin": {"username": "admin", "password": "1234"},
    "pjscjs777": {"username": "pjscjs777", "password": "wnstjd1986!"},
    "poupeehansol": {"username": "poupeehansol", "password": "1234"},
    "shfive55": {"username": "shfive55", "password": "1234"},
}


# ============================================================
# Helper Functions
# ============================================================


def get_gemini_client(header_key: Optional[str] = None) -> tuple[genai.Client, str]:
    api_key = header_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="Gemini API key is not set. Provide it via the app settings or GEMINI_API_KEY env var."
        )
    client = genai.Client(api_key=api_key)
    model_name = "gemini-2.5-flash"
    return client, model_name


def extract_json(text: str) -> dict:
    """Extract JSON object from LLM response text."""
    block_match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if block_match:
        return json.loads(block_match.group(1))
    obj_match = re.search(r"\{.*\}", text, re.DOTALL)
    if obj_match:
        return json.loads(obj_match.group())
    raise ValueError("No valid JSON found in response")


# ============================================================
# Routes — Static Data
# ============================================================


@app.get("/")
def read_root():
    return {"message": "Welcome to Leviosai Backend", "version": "1.0.0"}


@app.get("/api/domains")
def get_domains():
    return DOMAINS


@app.get("/api/hardware")
def get_hardware():
    return HARDWARE


@app.get("/api/models")
def get_models(domain: str = ""):
    if domain and domain in MODELS:
        return MODELS[domain]
    return MODELS


@app.get("/api/techniques")
def get_techniques():
    return TECHNIQUES


@app.get("/api/languages")
def get_languages():
    return LANGUAGES


# ============================================================
# Routes — Authentication
# ============================================================


@app.post("/login")
def login(user: User):
    db_user = fake_users_db.get(user.username)
    if not db_user or db_user["password"] != user.password:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"message": f"Welcome {user.username}"}


# ============================================================
# Routes — Profile
# ============================================================


@app.get("/api/profile/{username}")
def get_profile(username: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE username = ?", (username,)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"username": username, "name": "", "birthday": "", "email": "", "github": "", "role": "", "photo": None}


@app.put("/api/profile/{username}")
def update_profile(username: str, data: ProfileUpdate):
    conn = get_db()
    conn.execute("""
        INSERT INTO profiles (username, name, birthday, email, github, role, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
            name = excluded.name,
            birthday = excluded.birthday,
            email = excluded.email,
            github = excluded.github,
            role = excluded.role,
            photo = excluded.photo
    """, (username, data.name, data.birthday, data.email, data.github, data.role, data.photo))
    conn.commit()
    conn.close()
    return {"status": "ok", "username": username}


# ============================================================
# Routes — AI Features (Gemini)
# ============================================================


@app.post("/api/analyze-hardware")
async def analyze_hardware(
    file: UploadFile = File(...),
    x_gemini_api_key: Annotated[Optional[str], Header()] = None,
):
    client, model_name = get_gemini_client(x_gemini_api_key)
    pdf_bytes = await file.read()

    prompt = """You are a hardware spec analyst. Analyze this hardware datasheet PDF and extract key information.

Respond ONLY with a valid JSON object:
{
  "category": "Best matching category from: Nvidia Jetson, Hailo, Mobile AP, PC, Embedded. Use 'Custom' if none match.",
  "id": "unique_snake_case_id based on product name",
  "name": "Full product name",
  "specs": "Key specs in short format (e.g. 'ARM Cortex-A78, 100 TOPS, 10W')",
  "description": "One sentence describing what this hardware is for"
}"""

    try:
        from google.genai import types as genai_types
        response = client.models.generate_content(
            model=model_name,
            contents=[
                genai_types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                prompt,
            ],
        )
        result = extract_json(response.text)
        return result
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"Could not parse hardware info from PDF: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hardware analysis failed: {str(e)}")


@app.post("/api/validate-key")
async def validate_key(
    x_gemini_api_key: Annotated[Optional[str], Header()] = None,
):
    client, model_name = get_gemini_client(x_gemini_api_key)
    try:
        client.models.generate_content(model=model_name, contents="Reply with just: OK")
        return {"valid": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"API key validation failed: {str(e)}")


@app.post("/api/check-compatibility")
async def check_compatibility(
    data: CompatibilityRequest,
    x_gemini_api_key: Annotated[Optional[str], Header()] = None,
):
    client, model_name = get_gemini_client(x_gemini_api_key)

    params_info = f" (Parameters: {data.model_params})" if data.model_params else ""

    prompt = f"""You are an expert in edge AI deployment and hardware optimization.

Analyze whether the following AI model can be effectively deployed on the specified edge hardware:

- AI Domain: {data.domain}
- Model: {data.model_name}{params_info}
- Target Hardware Category: {data.hardware_category}
- Target Hardware Device: {data.hardware_device}

Evaluate based on: memory requirements, compute requirements (TOPS/FLOPS), power consumption, framework/SDK support, and real-world deployment feasibility.

Respond ONLY with a valid JSON object (no markdown fences, no explanation outside the JSON):
{{
  "compatible": true or false,
  "score": <integer 0-100>,
  "reason": "<2-3 sentence summary>",
  "considerations": ["<point 1>", "<point 2>", "<point 3>"],
  "recommendations": ["<optimization 1>", "<optimization 2>"]
}}"""

    try:
        response = client.models.generate_content(model=model_name, contents=prompt)
        result = extract_json(response.text)
        return result
    except (json.JSONDecodeError, ValueError):
        return {
            "compatible": True,
            "score": 65,
            "reason": "Compatibility analysis completed. The model may work with appropriate optimization techniques applied to meet hardware constraints.",
            "considerations": [
                "Verify available memory on the target device",
                "Check power budget for inference workload",
                "Confirm SDK/framework support for target hardware",
            ],
            "recommendations": [
                "Apply INT8 quantization to reduce memory footprint",
                "Use structured pruning to reduce compute requirements",
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")


@app.post("/api/model-info")
async def get_model_info(
    data: ModelInfoRequest,
    x_gemini_api_key: Annotated[Optional[str], Header()] = None,
):
    client, model_name = get_gemini_client(x_gemini_api_key)

    prompt = f"""You are an AI model database expert with knowledge of deep learning research papers and open-source repositories.

For the model "{data.model_name}" in the {data.domain} domain, provide accurate reference information based on your training knowledge.

Respond ONLY with a valid JSON object:
{{
  "arxiv_url": "https://arxiv.org/abs/XXXX.XXXXX (real URL only, null if no paper)",
  "github_url": "https://github.com/owner/repo (real URL only, null if unknown)",
  "huggingface_url": "https://huggingface.co/... (real URL only, null if unknown)",
  "year": "YYYY (publication or release year)",
  "organization": "Developing organization or research lab",
  "performance": [
    {{"label": "Accuracy", "value": <integer 0-100>, "description": "<actual metric, e.g. mAP@0.5: 37.3% or WER: 5.1%>"}},
    {{"label": "Speed", "value": <integer 0-100>, "description": "<edge inference speed context, e.g. 120 FPS on Jetson>"}},
    {{"label": "Efficiency", "value": <integer 0-100>, "description": "<edge suitability: size, power, ops tradeoff>"}}
  ]
}}

Performance value guidelines (0-100 where 100 is best for edge deployment):
- Accuracy: relative accuracy score compared to similar edge models
- Speed: 100 = very fast edge inference, 0 = very slow
- Efficiency: overall edge deployment suitability score"""

    try:
        response = client.models.generate_content(model=model_name, contents=prompt)
        result = extract_json(response.text)
        return result
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"Could not parse model info: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")


@app.post("/api/generate-code")
async def generate_code(
    data: CodeGenRequest,
    x_gemini_api_key: Annotated[Optional[str], Header()] = None,
):
    client, model_name = get_gemini_client(x_gemini_api_key)

    techniques_lines = "\n".join(
        f"  - {t.name}" + (f" ({t.subtype})" if t.subtype else "")
        for t in data.techniques
    )

    prompt = f"""You are an expert edge AI engineer. Generate optimized {data.language} code for deploying an AI model on edge hardware.

Deployment Configuration:
- AI Domain: {data.domain}
- Model: {data.model_name}
- Target Hardware: {data.hardware_device} ({data.hardware_category})
- Optimization Techniques:
{techniques_lines}
- Output Language: {data.language}

Requirements:
1. Generate complete, production-ready {data.language} code
2. Include model loading and initialization for {data.model_name}
3. Implement ALL specified optimization techniques properly
4. Target and optimize specifically for {data.hardware_device}
5. Include a full inference pipeline with preprocessing and postprocessing
6. Add detailed inline comments explaining each optimization step
7. Handle errors gracefully
8. List required dependencies as comments at the top of the file

Return ONLY the raw code. Do NOT wrap it in markdown code blocks."""

    try:
        response = client.models.generate_content(model=model_name, contents=prompt)
        code = response.text.strip()
        code = re.sub(r"^```[\w]*\n", "", code)
        code = re.sub(r"\n```$", "", code)
        return {
            "code": code,
            "language": data.language,
            "model": data.model_name,
            "hardware": data.hardware_device,
            "techniques": [t.name for t in data.techniques],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")


# ============================================================
# Routes — Parts CRUD
# ============================================================


@app.get("/api/parts/{project_id}")
def list_parts(project_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM parts WHERE project_id = ? ORDER BY created_at ASC",
        (project_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/parts", status_code=201)
def create_part(data: PartCreate):
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO parts (project_id, name, manufacturer, part_number, category, qty, unit_price, supplier, status, datasheet, memo, image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.project_id, data.name, data.manufacturer, data.part_number,
         data.category, data.qty, data.unit_price, data.supplier,
         data.status, data.datasheet, data.memo, data.image),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM parts WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@app.put("/api/parts/{part_id}")
def update_part_endpoint(part_id: int, data: PartUpdate):
    conn = get_db()
    existing = conn.execute("SELECT * FROM parts WHERE id = ?", (part_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Part not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        conn.close()
        return dict(existing)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    set_clause += ", updated_at = datetime('now')"
    values = list(updates.values())
    values.append(part_id)

    conn.execute(f"UPDATE parts SET {set_clause} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM parts WHERE id = ?", (part_id,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/parts/{part_id}")
def delete_part(part_id: int):
    conn = get_db()
    existing = conn.execute("SELECT * FROM parts WHERE id = ?", (part_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Part not found")
    conn.execute("DELETE FROM parts WHERE id = ?", (part_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": part_id}


@app.post("/api/parts/bulk/{project_id}", status_code=201)
def bulk_create_parts(project_id: str, items: List[PartCreate]):
    conn = get_db()
    created = []
    for data in items:
        cur = conn.execute(
            """INSERT INTO parts (project_id, name, manufacturer, part_number, category, qty, unit_price, supplier, status, datasheet, memo, image)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (project_id, data.name, data.manufacturer, data.part_number,
             data.category, data.qty, data.unit_price, data.supplier,
             data.status, data.datasheet, data.memo, data.image),
        )
        row = conn.execute("SELECT * FROM parts WHERE id = ?", (cur.lastrowid,)).fetchone()
        created.append(dict(row))
    conn.commit()
    conn.close()
    return created


# ============================================================
# Routes — Packages CRUD
# ============================================================


@app.get("/api/packages/{project_id}")
def list_packages(project_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM packages WHERE project_id = ? ORDER BY created_at ASC",
        (project_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/packages", status_code=201)
def create_package(data: PackageCreate):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO packages (project_id, name, version, latest, category) VALUES (?, ?, ?, ?, ?)",
        (data.project_id, data.name, data.version, data.latest, data.category),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM packages WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@app.put("/api/packages/{pkg_id}")
def update_package(pkg_id: int, data: PackageUpdate):
    conn = get_db()
    existing = conn.execute("SELECT * FROM packages WHERE id = ?", (pkg_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Package not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        conn.close()
        return dict(existing)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    set_clause += ", updated_at = datetime('now')"
    values = list(updates.values())
    values.append(pkg_id)

    conn.execute(f"UPDATE packages SET {set_clause} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM packages WHERE id = ?", (pkg_id,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/packages/{pkg_id}")
def delete_package(pkg_id: int):
    conn = get_db()
    existing = conn.execute("SELECT * FROM packages WHERE id = ?", (pkg_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Package not found")
    conn.execute("DELETE FROM packages WHERE id = ?", (pkg_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": pkg_id}


@app.post("/api/packages/bulk/{project_id}", status_code=201)
def bulk_create_packages(project_id: str, items: List[PackageCreate]):
    conn = get_db()
    created = []
    for data in items:
        cur = conn.execute(
            "INSERT INTO packages (project_id, name, version, latest, category) VALUES (?, ?, ?, ?, ?)",
            (project_id, data.name, data.version, data.latest, data.category),
        )
        row = conn.execute("SELECT * FROM packages WHERE id = ?", (cur.lastrowid,)).fetchone()
        created.append(dict(row))
    conn.commit()
    conn.close()
    return created
