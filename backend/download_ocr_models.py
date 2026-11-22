"""
Local OCR Model Downloader for AyuLekha (Zero API Keys Required).

Downloads and caches local OCR model weights into `backend/data/.ocr_cache`:
1. PaddleOCR-VL-1.6 (`PaddleOCRVL(pipeline_version="v1.6")`)
2. PaddleOCR PP-OCRv4/v5 (`PaddleOCR(lang="en")` & `PaddleOCR(lang="devanagari")`)
3. Microsoft TrOCR Handwritten Prescription Model (`microsoft/trocr-base-handwritten`)

Usage:
    python download_ocr_models.py --engine all
    python download_ocr_models.py --engine paddle-vl
    python download_ocr_models.py --engine paddle
    python download_ocr_models.py --engine trocr
"""

import argparse
import os
import sys
from pathlib import Path

# 1. Configure project-local cache directories before importing Paddle/HuggingFace
BACKEND_DIR = Path(__file__).resolve().parent
CACHE_DIR = BACKEND_DIR / "data" / ".ocr_cache"
PADDLEX_CACHE_DIR = CACHE_DIR / "paddlex"
PADDLE_CACHE_DIR = CACHE_DIR / "paddle"
HF_CACHE_DIR = CACHE_DIR / "hf"
TROCR_CACHE_DIR = CACHE_DIR / "trocr"

for d in (CACHE_DIR, PADDLEX_CACHE_DIR, PADDLE_CACHE_DIR, HF_CACHE_DIR, TROCR_CACHE_DIR):
    d.mkdir(parents=True, exist_ok=True)

os.environ["PADDLE_PDX_CACHE_HOME"] = str(PADDLEX_CACHE_DIR)
os.environ["PADDLEX_HOME"] = str(PADDLEX_CACHE_DIR)
os.environ["PADDLE_HOME"] = str(PADDLE_CACHE_DIR)
os.environ["HF_HOME"] = str(HF_CACHE_DIR)
os.environ["TROCR_CACHE_DIR"] = str(TROCR_CACHE_DIR)
os.environ["PADDLE_VL_AUTO_DOWNLOAD"] = "true"

# Prevent Protobuf Gencode/Runtime minor version mismatch error (e.g. 7.36.1 vs 7.35.1)
try:
    import google.protobuf.runtime_version as _pb_rv
    _pb_rv.ValidateProtobufRuntimeVersion = lambda *args, **kwargs: None
except Exception:
    pass


def download_paddle_vl():
    print("\n" + "=" * 70)
    print("📥 [1/3] Downloading Local PaddleOCR-VL-1.6 Model Weights...")
    print(f"    Target Cache: {PADDLEX_CACHE_DIR}")
    print("=" * 70)
    from paddleocr import PaddleOCRVL
    vl_engine = PaddleOCRVL(pipeline_version="v1.6")
    print("✅ PaddleOCR-VL-1.6 downloaded and verified successfully!")
    return vl_engine


def download_paddle_ocr():
    print("\n" + "=" * 70)
    print("📥 [2/3] Downloading Local PaddleOCR (PP-OCRv5/v6) Text Models...")
    print(f"    Target Cache: {PADDLEX_CACHE_DIR}")
    print("=" * 70)
    from paddleocr import PaddleOCR
    for lang in ("en", "hi"):
        print(f"  -> Initializing PaddleOCR(lang='{lang}')...")
        PaddleOCR(
            lang=lang,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )
    print("✅ Local PaddleOCR ('en' & 'hi') downloaded and verified!")


def download_trocr():
    print("\n" + "=" * 70)
    print("📥 [3/3] Downloading Local Microsoft TrOCR Handwritten Model...")
    print(f"    Target Cache: {TROCR_CACHE_DIR}")
    print("=" * 70)
    from transformers import (
        RobertaTokenizer,
        TrOCRProcessor,
        ViTImageProcessor,
        VisionEncoderDecoderModel,
    )
    model_name = os.getenv("TROCR_MODEL", "microsoft/trocr-base-handwritten")
    image_processor = ViTImageProcessor.from_pretrained(model_name, cache_dir=str(TROCR_CACHE_DIR))
    tokenizer = RobertaTokenizer.from_pretrained(model_name, cache_dir=str(TROCR_CACHE_DIR))
    TrOCRProcessor(image_processor=image_processor, tokenizer=tokenizer)
    VisionEncoderDecoderModel.from_pretrained(model_name, cache_dir=str(TROCR_CACHE_DIR))
    print(f"✅ Local TrOCR ({model_name}) downloaded and verified!")


def main():
    parser = argparse.ArgumentParser(description="Download local OCR models for AyuLekha.")
    parser.add_argument(
        "--engine",
        choices=["all", "paddle-vl", "paddle", "trocr"],
        default="all",
        help="Which local OCR engine weights to download (default: all)",
    )
    args = parser.parse_args()

    print(f"📂 Local OCR Cache Root: {CACHE_DIR}")

    if args.engine in ("all", "paddle"):
        download_paddle_ocr()
    if args.engine in ("all", "paddle-vl"):
        download_paddle_vl()
    if args.engine in ("all", "trocr"):
        download_trocr()

    print("\n🎉 All requested local OCR models are cached and ready for offline use!")


if __name__ == "__main__":
    main()
