"""
LeviosAI RAG Chain — LangChain 1.2 + Gemini + ChromaDB
"""

import os
import logging
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter

from knowledge_base import build_platform_documents

logger = logging.getLogger(__name__)

# ============================================================
# Singleton Vector Store
# ============================================================

_vectorstore: Optional[Chroma] = None
_embeddings: Optional[GoogleGenerativeAIEmbeddings] = None

CHROMA_DIR = os.path.join(os.path.dirname(__file__), ".chroma_db")


def get_embeddings(api_key: str) -> GoogleGenerativeAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=api_key,
        )
    return _embeddings


def get_vectorstore(api_key: str) -> Chroma:
    """Get or create the ChromaDB vector store with platform knowledge."""
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    embeddings = get_embeddings(api_key)

    # Check if DB already exists
    if os.path.exists(CHROMA_DIR) and os.listdir(CHROMA_DIR):
        _vectorstore = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=embeddings,
            collection_name="leviosai_knowledge",
        )
        count = _vectorstore._collection.count()
        if count > 0:
            logger.info(f"Loaded existing ChromaDB with {count} documents")
            return _vectorstore

    # Build fresh knowledge base
    logger.info("Building knowledge base from scratch...")
    docs = build_platform_documents()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    splits = splitter.split_documents(docs)
    logger.info(f"Split into {len(splits)} chunks")

    _vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name="leviosai_knowledge",
    )
    logger.info(f"ChromaDB created with {len(splits)} chunks at {CHROMA_DIR}")
    return _vectorstore


def add_documents(api_key: str, texts: list[str], metadata: Optional[dict] = None) -> int:
    """Add custom documents to the knowledge base."""
    vs = get_vectorstore(api_key)
    docs = [
        __import__("langchain_core.documents", fromlist=["Document"]).Document(
            page_content=t,
            metadata=metadata or {"source": "user_upload", "type": "custom"},
        )
        for t in texts
    ]
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = splitter.split_documents(docs)
    vs.add_documents(splits)
    return len(splits)


# ============================================================
# RAG Chain
# ============================================================

SYSTEM_PROMPT = """You are LeviosAI, an expert Edge AI optimization assistant powered by RAG (Retrieval-Augmented Generation).
You help users design, build, and deploy AI models on edge hardware devices.

Use the following retrieved context to provide accurate, technical answers.
If the context doesn't contain relevant information, use your general knowledge but clearly indicate when you're going beyond the provided context.

Be concise, technical, and professional. Provide actionable recommendations.
When discussing hardware, models, or optimization techniques, include specific numbers (TOPS, params, latency) when available.

Retrieved Context:
{context}"""

STEP_PROMPTS: dict[int, str] = {
    0: "You are helping with general Edge AI questions. Provide comprehensive answers using the knowledge base.",
    1: "You are helping the user choose an AI application domain. Available: Computer Vision, LLM, ASR, BCI. Use retrieved context about each domain to guide selection.",
    2: "You are helping select edge hardware and sensors. Use retrieved hardware specs and deployment tips to recommend optimal combinations.",
    3: "You are helping configure the hardware pipeline. Explain data flows, bandwidth, and sensor fusion using platform knowledge.",
    4: "You are helping select an AI model. Use retrieved model details including parameter counts, accuracy metrics, and edge suitability.",
    5: "You are helping choose optimization techniques. Use retrieved knowledge about quantization, pruning, KD, and domain-specific techniques.",
    6: "You are helping with generated deployment code. Use retrieved framework knowledge and best practices for code review.",
    7: "The project is complete. Use retrieved deployment pipeline knowledge to suggest next steps, benchmarking, and maintenance.",
}


def format_docs(docs) -> str:
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


def build_rag_chain(
    api_key: str,
    step: int = 0,
    temperature: float = 0.7,
):
    """Build a RAG chain for the given step context."""
    vs = get_vectorstore(api_key)
    retriever = vs.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 10},
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
        max_output_tokens=2048,
    )

    step_context = STEP_PROMPTS.get(step, STEP_PROMPTS[0])

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT + "\n\n" + step_context),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{question}"),
    ])

    chain = (
        {
            "context": lambda x: format_docs(retriever.invoke(x["question"])),
            "question": lambda x: x["question"],
            "chat_history": lambda x: x.get("chat_history", []),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain


async def rag_chat(
    api_key: str,
    question: str,
    step: int = 0,
    chat_history: Optional[list[dict]] = None,
    temperature: float = 0.7,
) -> dict:
    """Execute RAG-enhanced chat and return response with sources."""
    vs = get_vectorstore(api_key)

    # Retrieve relevant documents
    retriever = vs.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 10},
    )
    retrieved_docs = retriever.invoke(question)
    context = format_docs(retrieved_docs)

    # Build messages for chat history
    messages: list = []
    if chat_history:
        for msg in chat_history[-10:]:  # Keep last 10 messages
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg["content"]))

    # Build LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
        max_output_tokens=2048,
    )

    step_context = STEP_PROMPTS.get(step, STEP_PROMPTS[0])
    system_content = SYSTEM_PROMPT.format(context=context) + "\n\n" + step_context

    all_messages = [SystemMessage(content=system_content)] + messages + [HumanMessage(content=question)]

    response = await llm.ainvoke(all_messages)

    # Extract source metadata
    sources = []
    seen = set()
    for doc in retrieved_docs:
        src_key = f"{doc.metadata.get('type', '')}:{doc.metadata.get('category', doc.metadata.get('domain', doc.metadata.get('topic', '')))}"
        if src_key not in seen:
            seen.add(src_key)
            sources.append({
                "type": doc.metadata.get("type", "unknown"),
                "category": doc.metadata.get("category", doc.metadata.get("domain", doc.metadata.get("topic", ""))),
            })

    return {
        "answer": response.content,
        "sources": sources,
        "rag_enabled": True,
    }


# ============================================================
# Enhanced Gemini calls (RAG-augmented versions of existing endpoints)
# ============================================================

async def rag_check_compatibility(
    api_key: str,
    domain: str,
    hardware_category: str,
    hardware_device: str,
    model_name: str,
    model_params: Optional[str] = None,
) -> dict:
    """RAG-enhanced compatibility check with knowledge base context."""
    vs = get_vectorstore(api_key)
    retriever = vs.as_retriever(search_kwargs={"k": 4})

    # Retrieve relevant hardware and model docs
    hw_docs = retriever.invoke(f"{hardware_category} {hardware_device} deployment specs")
    model_docs = retriever.invoke(f"{model_name} {domain} edge deployment")
    context = format_docs(hw_docs + model_docs)

    params_info = f" (Parameters: {model_params})" if model_params else ""

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.3,
    )

    prompt = f"""You are an expert in edge AI deployment and hardware optimization.

Use the following knowledge base context for accurate analysis:
{context}

Analyze whether the following AI model can be effectively deployed on the specified edge hardware:

- AI Domain: {domain}
- Model: {model_name}{params_info}
- Target Hardware Category: {hardware_category}
- Target Hardware Device: {hardware_device}

Evaluate based on: memory requirements, compute requirements (TOPS/FLOPS), power consumption, framework/SDK support, and real-world deployment feasibility.

Respond ONLY with a valid JSON object (no markdown fences, no explanation outside the JSON):
{{
  "compatible": true or false,
  "score": <integer 0-100>,
  "reason": "<2-3 sentence summary>",
  "considerations": ["<point 1>", "<point 2>", "<point 3>"],
  "recommendations": ["<optimization 1>", "<optimization 2>"]
}}"""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    return response.content


async def rag_generate_code(
    api_key: str,
    domain: str,
    hardware_category: str,
    hardware_device: str,
    model_name: str,
    techniques: list[dict],
    language: str,
) -> str:
    """RAG-enhanced code generation with knowledge base context."""
    vs = get_vectorstore(api_key)
    retriever = vs.as_retriever(search_kwargs={"k": 4})

    # Retrieve relevant technique and framework docs
    technique_names = " ".join(t.get("name", "") for t in techniques)
    tech_docs = retriever.invoke(f"{technique_names} optimization implementation")
    hw_docs = retriever.invoke(f"{hardware_device} {language} deployment framework")
    context = format_docs(tech_docs + hw_docs)

    techniques_lines = "\n".join(
        f"  - {t.get('name', '')}" + (f" ({t.get('subtype', '')})" if t.get("subtype") else "")
        for t in techniques
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.4,
        max_output_tokens=4096,
    )

    prompt = f"""You are an expert edge AI engineer. Generate optimized {language} code for deploying an AI model on edge hardware.

Use the following knowledge base context for accurate implementation:
{context}

Deployment Configuration:
- AI Domain: {domain}
- Model: {model_name}
- Target Hardware: {hardware_device} ({hardware_category})
- Optimization Techniques:
{techniques_lines}
- Output Language: {language}

Requirements:
1. Generate complete, production-ready {language} code
2. Include model loading and initialization for {model_name}
3. Implement ALL specified optimization techniques properly
4. Target and optimize specifically for {hardware_device}
5. Include a full inference pipeline with preprocessing and postprocessing
6. Add detailed inline comments explaining each optimization step
7. Handle errors gracefully
8. List required dependencies as comments at the top of the file

Return ONLY the raw code. Do NOT wrap it in markdown code blocks."""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    return response.content
