import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]

# Load environment variables from backend/.env first, then root .env as fallback
load_dotenv(BACKEND_DIR / ".env", override=True)
load_dotenv(ROOT_DIR / ".env")


class Settings:
    """Application configuration and runtime settings."""

    # Project metadata
    PROJECT_NAME: str = "Medical Document Digitizer API"
    VERSION: str = "1.0.0"

    # Directory Paths
    ROOT_PATH: Path = ROOT_DIR
    FRONTEND_PATH: Path = ROOT_DIR / "frontend"

    # File validation limits
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_BYTES", 25 * 1024 * 1024))  # 25 MB
    ALLOWED_EXTENSIONS: set[str] = {
        "pdf", "png", "jpg", "jpeg", "bmp", "tiff", "tif", "webp", "jfif", "heic"
    }

    # CORS configuration - allow external frontend apps (e.g. React/Vite/Next.js)
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]

    # LLM Provider Configuration (Groq with OpenAI/GPT model)
    LLM_PROVIDER: str = "groq"
    LLM_REQUEST_TIMEOUT: int = int(os.getenv("LLM_REQUEST_TIMEOUT", "90"))

    # Groq configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
    GROQ_VISION_MODEL: str = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b").strip()
    GROQ_API_URL: str = os.getenv(
        "GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"
    ).strip()
    HANDWRITING_OCR_ENGINE: str = os.getenv("HANDWRITING_OCR_ENGINE", "vision").strip().lower()
    HANDWRITING_OCR_FALLBACK_TROCR: bool = os.getenv(
        "HANDWRITING_OCR_FALLBACK_TROCR", "false"
    ).strip().lower() in {"1", "true", "yes"}


settings = Settings()
