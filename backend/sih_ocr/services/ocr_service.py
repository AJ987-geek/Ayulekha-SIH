"""
High-Speed GPU-Accelerated Local Medical OCR Service (Zero External API Keys).

Optimizations for Speed:
1. Automatic NVIDIA CUDA GPU detection (`gpu:0` / `cuda:0`) for PaddleOCR-VL-1.6, PaddleOCR, and TrOCR.
2. Smart VLM gating: runs 2B-parameter `PaddleOCR-VL-1.6` automatically when CUDA GPU is active (or when `FORCE_PADDLE_VL_CPU=true`), and uses ultra-fast `PP-OCRv6_medium` on CPU so uploads finish in ~1–2 seconds instead of minutes.
3. Single-pass fast exit: downscales oversized camera images to 1280px max dimension and returns immediately on Pass 1 when text is detected (avoiding 3x redundant OpenCV multi-candidate passes).
"""

import io
import json
import logging
import os
import re
import sys
import threading
import time
import types
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Stub modelscope before importing paddleocr so paddlex does not trigger `import torch`
# into the paddlepaddle-gpu process (prevents Windows cuDNN DLL collision).
if "modelscope" not in sys.modules:
    _ms_stub = types.ModuleType("modelscope")
    _ms_hub = types.ModuleType("modelscope.hub")
    _ms_errors = types.ModuleType("modelscope.hub.errors")
    _ms_stub.hub = _ms_hub
    _ms_hub.errors = _ms_errors
    sys.modules["modelscope"] = _ms_stub
    sys.modules["modelscope.hub"] = _ms_hub
    sys.modules["modelscope.hub.errors"] = _ms_errors

from fastapi import HTTPException
import numpy as np
from PIL import Image
import pymupdf

# Ensure local cache directory is set BEFORE importing paddleocr / paddlex
from sih_ocr.config import settings
from sih_ocr.services.image_processor import (
    correct_orientation,
    preprocess_for_handwriting,
)

logger = logging.getLogger(__name__)

# ── Local Engine Caches & GPU Detection ─────────────────────────────────────
_OCR_LOCK = threading.Lock()
_OCR_INSTANCES: Dict[str, object] = {}
_PADDLE_AVAILABLE: Optional[bool] = None

_VL_LOCK = threading.Lock()
_PADDLE_VL_INSTANCE: Optional[object] = None
_PADDLE_VL_AVAILABLE: Optional[bool] = None

_PADDLE_GPU_AVAILABLE: Optional[bool] = None


def _is_paddle_gpu_available() -> bool:
    """Detect whether PaddlePaddle is compiled with CUDA and sees an NVIDIA GPU."""
    global _PADDLE_GPU_AVAILABLE
    if _PADDLE_GPU_AVAILABLE is not None:
        return _PADDLE_GPU_AVAILABLE
    try:
        import paddle
        _PADDLE_GPU_AVAILABLE = bool(
            paddle.device.is_compiled_with_cuda()
            and paddle.device.cuda.device_count() > 0
        )
    except Exception:
        _PADDLE_GPU_AVAILABLE = False
    logger.info("Paddle CUDA GPU available: %s", _PADDLE_GPU_AVAILABLE)
    return _PADDLE_GPU_AVAILABLE


def _get_paddle_device() -> str:
    """Return 'gpu:0' when CUDA is available, otherwise 'cpu'."""
    configured = os.getenv("PADDLE_OCR_DEVICE", "").strip()
    if configured:
        return configured
    return "gpu:0" if _is_paddle_gpu_available() else "cpu"


def _fast_resize(image: Image.Image, max_side: int = 1280) -> Image.Image:
    """Cap oversized camera photos to 1280px max dimension for 3-5x faster OCR inference."""
    image = correct_orientation(image).convert("RGB")
    w, h = image.size
    longest = max(w, h)
    if longest > max_side:
        scale = max_side / float(longest)
        return image.resize((int(w * scale), int(h * scale)), Image.BILINEAR)
    return image


LANGUAGE_MAP = {
    "en": "en", "auto": "en", "": "en",
    "hi": "hi", "mr": "mr", "devanagari": "hi",
    "ta": "ta", "te": "te", "ka": "ka", "kn": "ka",
    "gu": "en", "bn": "en",
    "ch": "ch", "french": "fr", "german": "de",
    "latin": "en", "arabic": "ar", "korean": "korean",
    "japan": "japan", "cyrillic": "ru",
}

SUPPORTED_PADDLE_LANGS = {
    "en", "ch", "korean", "japan", "de", "fr",
    "ar", "ru", "hi", "mr", "ta", "te", "ka",
}


def clean_text(text: str) -> str:
    """Normalize whitespace and remove excessive blank lines."""
    if not text:
        return ""
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


# ── 1. Local PaddleOCR-VL-1.6 Engine (GPU-Accelerated) ──────────────────────

def _has_local_vl_weights() -> bool:
    """Check if PaddleOCR-VL-1.6 weights are downloaded in the local cache."""
    paddlex_dir = Path(os.environ.get("PADDLE_PDX_CACHE_HOME", "")) / "official_models"
    if not paddlex_dir.exists():
        return False
    return (paddlex_dir / "PaddleOCR-VL-1.6").exists()


def get_paddle_vl_engine():
    """
    Lazily initialize local PaddleOCR-VL-1.6 (`PaddleOCRVL(pipeline_version='v1.6')`).
    Note: PaddleOCR-VL-1.6 is a 2B-parameter Vision-Language Model. To keep OCR fast (<2s),
    it runs automatically when CUDA GPU is active (`gpu:0`), or when `FORCE_PADDLE_VL_CPU=true`.
    """
    global _PADDLE_VL_INSTANCE, _PADDLE_VL_AVAILABLE
    if not settings.ENABLE_PADDLE_VL or _PADDLE_VL_AVAILABLE is False:
        return None

    force_cpu = os.getenv("FORCE_PADDLE_VL_CPU", "false").strip().lower() in {"1", "true", "yes"}
    if not _is_paddle_gpu_available() and not force_cpu:
        # Skip 2B VLM on CPU to avoid 60-120s CPU bottleneck; use fast PP-OCRv6 instead
        return None

    if not _has_local_vl_weights():
        return None

    with _VL_LOCK:
        if _PADDLE_VL_INSTANCE is not None:
            return _PADDLE_VL_INSTANCE
        try:
            from paddleocr import PaddleOCRVL
            device = _get_paddle_device()
            logger.info("Initializing local PaddleOCR-VL (%s) on device=%s...", settings.PADDLE_VL_VERSION, device)
            _PADDLE_VL_INSTANCE = PaddleOCRVL(
                pipeline_version=settings.PADDLE_VL_VERSION,
                device=device,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
            )
            _PADDLE_VL_AVAILABLE = True
            logger.info("Local PaddleOCR-VL-%s initialized on %s.", settings.PADDLE_VL_VERSION, device)
            return _PADDLE_VL_INSTANCE
        except Exception as exc:
            logger.warning("Local PaddleOCR-VL init notice: %s", exc)
            _PADDLE_VL_AVAILABLE = False
            return None


def _run_paddle_vl_ocr(vl_engine, image: Image.Image) -> str:
    """Run local PaddleOCR-VL-1.6 prediction and extract Markdown / text blocks."""
    img_array = np.array(_fast_resize(image, max_side=1280))
    chunks: List[str] = []

    results = vl_engine.predict(img_array)
    for res in results or []:
        if hasattr(res, "markdown"):
            md = res.markdown
            if isinstance(md, dict):
                md_text = md.get("markdown_texts") or md.get("text") or ""
                if md_text and str(md_text).strip():
                    chunks.append(str(md_text).strip())
                    continue
            elif isinstance(md, str) and md.strip():
                chunks.append(md.strip())
                continue

        payload = res.json if hasattr(res, "json") else res
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except Exception:
                payload = {}
        if isinstance(payload, dict):
            res_dict = payload.get("res", payload)
            if isinstance(res_dict, dict):
                rec_texts = (
                    res_dict.get("rec_texts")
                    or res_dict.get("texts")
                    or res_dict.get("markdown_texts")
                    or []
                )
                if isinstance(rec_texts, str) and rec_texts.strip():
                    chunks.append(rec_texts.strip())
                elif isinstance(rec_texts, list):
                    chunks.extend(str(t).strip() for t in rec_texts if str(t).strip())

    return clean_text("\n\n".join(chunks))


# ── 2. Fast Local PaddleOCR (PP-OCRv5/v6) Engine ────────────────────────────

def _init_paddle_ocr(lang: str):
    from paddleocr import PaddleOCR
    device = _get_paddle_device()
    return PaddleOCR(
        lang=lang,
        device=device,
        enable_mkldnn=False,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        text_det_limit_side_len=960,
        text_recognition_batch_size=16,
    )


def get_paddle_ocr_engine(language_hint: str):
    global _PADDLE_AVAILABLE
    if _PADDLE_AVAILABLE is False:
        return None

    target_lang = LANGUAGE_MAP.get((language_hint or "").strip().lower(), "en")
    if target_lang not in SUPPORTED_PADDLE_LANGS:
        target_lang = "en"

    with _OCR_LOCK:
        if target_lang in _OCR_INSTANCES:
            return _OCR_INSTANCES[target_lang]
        try:
            t0 = time.perf_counter()
            engine = _init_paddle_ocr(target_lang)
            _OCR_INSTANCES[target_lang] = engine
            _PADDLE_AVAILABLE = True
            logger.info(
                "Local PaddleOCR ('%s') ready in %.2fs on device=%s",
                target_lang,
                time.perf_counter() - t0,
                _get_paddle_device(),
            )
            return engine
        except Exception as exc:
            logger.warning("Local PaddleOCR init for '%s' failed: %s", target_lang, exc)
            if target_lang != "en":
                try:
                    if "en" not in _OCR_INSTANCES:
                        _OCR_INSTANCES["en"] = _init_paddle_ocr("en")
                    _PADDLE_AVAILABLE = True
                    return _OCR_INSTANCES["en"]
                except Exception as fb_exc:
                    logger.warning("Local PaddleOCR English fallback failed: %s", fb_exc)
            if not _OCR_INSTANCES:
                _PADDLE_AVAILABLE = False
            return None


def _run_paddle_ocr(ocr_engine, image: Image.Image) -> str:
    img_array = np.array(image.convert("RGB"))
    lines: List[str] = []
    result = (
        ocr_engine.predict(img_array)
        if hasattr(ocr_engine, "predict")
        else ocr_engine.ocr(img_array, cls=True)
    )
    for page_result in result or []:
        payload = page_result
        if hasattr(payload, "json"):
            payload = payload.json
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = {}

        if isinstance(payload, dict):
            res_inner = payload.get("res", payload)
            if isinstance(res_inner, dict):
                recognized = res_inner.get("rec_texts") or res_inner.get("texts") or []
            else:
                recognized = payload.get("rec_texts") or payload.get("texts") or []
            lines.extend(str(text).strip() for text in recognized if str(text).strip())
            continue

        if hasattr(page_result, "get"):
            recognized = page_result.get("rec_texts") or page_result.get("texts") or []
            if recognized:
                lines.extend(str(text).strip() for text in recognized if str(text).strip())
                continue

        if isinstance(page_result, (list, tuple)):
            for line in page_result:
                if line and len(line) > 1 and line[1] and line[1][0]:
                    text_content = str(line[1][0]).strip()
                    if text_content:
                        lines.append(text_content)
    return "\n".join(lines)


# ── 3. Single-Pass Fast Local Image OCR ─────────────────────────────────────

def ocr_single_image_printed(image: Image.Image, language_hint: str = "en") -> Tuple[str, str]:
    """
    Fast single-pass OCR extraction for printed reports and prescriptions.
    """
    t0 = time.perf_counter()
    fast_img = _fast_resize(image, max_side=1280)
    device_tag = "GPU" if _is_paddle_gpu_available() else "Local Fast"

    # 1. If CUDA GPU is active, run PaddleOCR-VL-1.6 on GPU
    vl_engine = get_paddle_vl_engine()
    if vl_engine is not None:
        try:
            vl_text = _run_paddle_vl_ocr(vl_engine, fast_img)
            if vl_text and vl_text.strip():
                logger.info("PaddleOCR-VL-1.6 finished in %.2fs", time.perf_counter() - t0)
                return clean_text(vl_text), f"PaddleOCR-VL-{settings.PADDLE_VL_VERSION} ({device_tag})"
        except Exception as exc:
            logger.warning("PaddleOCR-VL fallback to PaddleOCR: %s", exc)

    # 2. Fast Single-Pass PaddleOCR (PP-OCRv6)
    paddle_engine = get_paddle_ocr_engine(language_hint)
    if paddle_engine is not None:
        try:
            extracted = _run_paddle_ocr(paddle_engine, fast_img)
            if len(extracted.strip()) >= 12:
                logger.info("Fast single-pass PaddleOCR finished in %.2fs", time.perf_counter() - t0)
                return clean_text(extracted), f"PaddleOCR PP-OCRv6 ({device_tag})"
            # Only run a second contrast-enhanced pass if Pass 1 found almost no text
            enhanced_img = _fast_resize(preprocess_for_handwriting(fast_img), max_side=1280)
            extracted_enh = _run_paddle_ocr(paddle_engine, enhanced_img)
            best = extracted_enh if len(extracted_enh.strip()) > len(extracted.strip()) else extracted
            if best.strip():
                logger.info("Two-pass PaddleOCR finished in %.2fs", time.perf_counter() - t0)
                return clean_text(best), f"PaddleOCR PP-OCRv6 ({device_tag})"
        except Exception as exc:
            logger.warning("PaddleOCR error: %s", exc)

    return "[Image processed locally: No legible text detected. Please upload a clearer scan.]", f"PaddleOCR ({device_tag})"


def ocr_single_image_handwritten(
    image: Image.Image,
    language_hint: str = "en",
    document_type: str = "auto",
) -> Tuple[str, str]:
    """
    Fast handwritten / prescription OCR.
    Uses single-pass PP-OCRv6 first; only invokes TrOCR when explicitly needed or on CUDA GPU.
    """
    fast_img = _fast_resize(image, max_side=1280)
    paddle_text, paddle_engine_name = ocr_single_image_printed(fast_img, language_hint)

    words = re.findall(r"[A-Za-z0-9]{2,}", paddle_text or "")
    has_good_text = not paddle_text.startswith("[Image processed") and len(words) >= 4

    # If single-pass PaddleOCR already read clear text, return immediately without waiting for second model
    if has_good_text and document_type != "prescription_trocr_only":
        return paddle_text, paddle_engine_name

    # Run TrOCR (uses CUDA GPU FP16 if available) when PaddleOCR found little text on a handwritten image
    try:
        from sih_ocr.services.trocr_service import trocr_service
        trocr_cache = trocr_service._cache_dir()
        if trocr_cache.exists() and any(trocr_cache.iterdir()):
            trocr_text, _conf = trocr_service.extract(fast_img)
            if trocr_text and len(trocr_text.strip()) > len(paddle_text.strip()):
                gpu_label = "GPU" if trocr_service._device == "cuda" else "Local"
                return clean_text(trocr_text), f"TrOCR ({gpu_label} Handwritten)"
    except Exception as exc:
        logger.debug("TrOCR fallback notice: %s", exc)

    return paddle_text, paddle_engine_name


# ── Public API ──────────────────────────────────────────────────────────────

def _render_pdf_page(page) -> Image.Image:
    """Render one PDF page to an RGB image at 1.5x resolution for fast OCR."""
    pix = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def extract_document_text(
    content: bytes,
    extension: str,
    language_hint: str = "en",
    document_type: str = "auto",
) -> Tuple[str, int, str]:
    """
    High-speed local Document OCR Extraction (PDFs and Images).
    """
    if not content:
        raise HTTPException(status_code=400, detail="The document file is empty.")

    ext = (extension or "").strip().lower()

    if ext == "pdf":
        try:
            pdf = pymupdf.open(stream=content, filetype="pdf")
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="The PDF file is corrupted or cannot be read.",
            ) from exc

        if not pdf.page_count:
            raise HTTPException(status_code=400, detail="The PDF contains no pages.")

        page_texts: List[str] = []
        page_engines: List[str] = []
        for index, page in enumerate(pdf):
            # Always check native embedded PDF text first (instantaneous: <0.01s)
            embedded_text = clean_text(page.get_text("text"))
            if len(embedded_text) >= 15:
                page_texts.append(embedded_text)
                page_engines.append("PyMuPDF (Instant PDF Text)")
                continue
            try:
                image = _render_pdf_page(page)
                page_text, engine = ocr_single_image_printed(image, language_hint)
                page_texts.append(page_text)
                page_engines.append(engine)
            except Exception as pix_exc:
                logger.warning("Failed to OCR PDF page %d: %s", index, pix_exc)
                page_texts.append("")
                page_engines.append("Local OCR Error")

        text = "\n\n".join(
            f"--- Page {num} ---\n{pt or '[No readable text found]'}"
            for num, pt in enumerate(page_texts, 1)
        )
        engine = " + ".join(dict.fromkeys(page_engines))
        return clean_text(text), pdf.page_count, engine or "PaddleOCR (Local)"

    # Image files (JPG, PNG, WEBP, BMP, TIFF)
    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image file is invalid or corrupted.",
        ) from exc

    if document_type in ("printed", "lab_report"):
        extracted_text, engine_used = ocr_single_image_printed(image, language_hint)
    else:
        extracted_text, engine_used = ocr_single_image_handwritten(
            image, language_hint, document_type=document_type
        )
    return extracted_text, 1, engine_used
