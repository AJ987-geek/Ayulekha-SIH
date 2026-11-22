import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]

# Configure writable local cache directories for PaddleOCR-VL-1.6, PaddleX, and HuggingFace TrOCR
CACHE_DIR = BACKEND_DIR / "data" / ".ocr_cache"
PADDLEX_CACHE_DIR = CACHE_DIR / "paddlex"
PADDLE_CACHE_DIR = CACHE_DIR / "paddle"
HF_CACHE_DIR = CACHE_DIR / "hf"

for d in (CACHE_DIR, PADDLEX_CACHE_DIR, PADDLE_CACHE_DIR, HF_CACHE_DIR):
    d.mkdir(parents=True, exist_ok=True)

os.environ["PADDLE_PDX_CACHE_HOME"] = str(PADDLEX_CACHE_DIR)
os.environ["PADDLEX_HOME"] = str(PADDLEX_CACHE_DIR)
os.environ["PADDLE_HOME"] = str(PADDLE_CACHE_DIR)
os.environ["HF_HOME"] = str(HF_CACHE_DIR)
os.environ.setdefault("TROCR_CACHE_DIR", str(CACHE_DIR / "trocr"))
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_enable_pir_in_executor"] = "0"

# Prevent Protobuf Gencode/Runtime minor version mismatch error (e.g. 7.36.1 vs 7.35.1)
try:
    import google.protobuf.runtime_version as _pb_rv
    _pb_rv.ValidateProtobufRuntimeVersion = lambda *args, **kwargs: None
except Exception:
    pass

# Load environment variables from backend/.env first, then root .env as fallback
load_dotenv(BACKEND_DIR / ".env", override=True)
load_dotenv(ROOT_DIR / ".env")


class Settings:
    """Application configuration and runtime settings (100% Local OCR Mode)."""

    PROJECT_NAME: str = "Medical Document Digitizer API (Local PaddleOCR-VL-1.6)"
    VERSION: str = "2.0.0"

    ROOT_PATH: Path = ROOT_DIR
    FRONTEND_PATH: Path = ROOT_DIR / "frontend"
    OCR_CACHE_DIR: Path = CACHE_DIR

    # File validation limits
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_BYTES", 25 * 1024 * 1024))  # 25 MB
    ALLOWED_EXTENSIONS: set[str] = {
        "pdf", "png", "jpg", "jpeg", "bmp", "tiff", "tif", "webp", "jfif", "heic"
    }

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]

    # Local OCR Engine Configuration (No external API keys required)
    OCR_USE_LOCAL_ONLY: bool = True
    PADDLE_VL_VERSION: str = os.getenv("PADDLE_VL_VERSION", "v1.6").strip()
    ENABLE_PADDLE_VL: bool = os.getenv("ENABLE_PADDLE_VL", "true").strip().lower() in {
        "1", "true", "yes"
    }
    HANDWRITING_OCR_ENGINE: str = os.getenv("HANDWRITING_OCR_ENGINE", "paddle_vl").strip().lower()
    HANDWRITING_OCR_FALLBACK_TROCR: bool = os.getenv(
        "HANDWRITING_OCR_FALLBACK_TROCR", "true"
    ).strip().lower() in {"1", "true", "yes"}


settings = Settings()
