"""
Advanced Multi-Engine Medical OCR Service.

Combines:
1. OpenCV Image Pre-processing (CLAHE, bilateral denoising, adaptive binarization, deskewing)
2. Multi-Candidate OCR Extraction (PaddleOCR + PyTesseract fallback)
3. Groq Medical AI Language Model (openai/gpt-oss-120b) for handwriting deciphering & clinical structuring
"""

import base64
import io
import json
import logging
import re
import threading
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException
import numpy as np
from PIL import Image
import pymupdf
import requests

from sih_ocr.config import settings
from sih_ocr.services.image_processor import (
    correct_orientation,
    generate_ocr_candidates,
    preprocess_for_handwriting,
)

logger = logging.getLogger(__name__)

# ── Engine Caches ───────────────────────────────────────────────────────────
_OCR_LOCK = threading.Lock()
_OCR_INSTANCES: Dict[str, object] = {}
_PADDLE_AVAILABLE: Optional[bool] = None

LANGUAGE_MAP = {
    "en": "en", "auto": "en", "": "en",
    "hi": "devanagari", "mr": "devanagari",
    "ta": "ta", "te": "te", "ka": "ka", "kn": "ka",
    "gu": "latin", "bn": "latin",
    "ch": "ch", "french": "french", "german": "german",
    "latin": "latin", "arabic": "arabic", "korean": "korean",
    "japan": "japan", "cyrillic": "cyrillic", "devanagari": "devanagari",
}

SUPPORTED_PADDLE_LANGS = {
    "en", "ch", "korean", "japan", "german", "french",
    "latin", "arabic", "cyrillic", "devanagari", "ta", "te", "ka",
}


def clean_text(text: str) -> str:
    """Normalize whitespace and remove excessive blank lines."""
    if not text:
        return ""
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


# ── Vision Model Check ──────────────────────────────────────────────────────

def _image_to_base64_jpeg(image: Image.Image, quality: int = 90) -> str:
    image = image.convert("RGB")
    max_dim = 2048
    if max(image.size) > max_dim:
        image.thumbnail((max_dim, max_dim), Image.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def _try_vision_ocr(image: Image.Image, language_hint: str = "en") -> Optional[str]:
    """Read a prescription with the configured hosted vision model."""
    api_key = settings.GROQ_API_KEY
    if not api_key or api_key == "your_groq_api_key_here":
        return None

    vision_model = settings.GROQ_VISION_MODEL
    if not vision_model:
        return None

    try:
        # Vision models retain more handwriting context from the original color
        # photo than from aggressive thresholding. Correct orientation only;
        # _image_to_base64_jpeg handles safe downscaling for the API request.
        image_data_url = _image_to_base64_jpeg(correct_orientation(image))

        prompt = """Read this handwritten prescription directly from the image.
Inspect each prescription line carefully before responding. Return exactly this
Markdown format, with no patient details, diagnosis, explanation, or duplicate
sections:

### Prescriptions
| # | Medication | Dosage / Strength | Frequency | Duration | Instructions |

Include a row only when the medicine name itself is legible. Transcribe the
medicine name as written; do not guess, expand, or substitute a drug name. Use
`Not legible` only for unreadable fields within an otherwise legible row.

### Prescription Summary
- At most three concise bullets describing only the legible prescriptions and
  critical missing fields.

Do not write “possible”, “likely”, raw OCR fragments, or generic warnings.
Do not repeat the table or headings."""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                }
            ],
            "temperature": 0,
            "max_completion_tokens": 1600,
        }

        response = requests.post(
            settings.GROQ_API_URL,
            headers=headers,
            json=payload,
            timeout=settings.LLM_REQUEST_TIMEOUT,
        )
        if response.status_code == 200:
            data = response.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                content = choices[0]["message"].get("content", "").strip()
                if content:
                    return content
    except Exception as exc:
        logger.warning("Vision OCR unavailable: %s", exc)

    return None


# ── PaddleOCR Multi-Candidate Engine ────────────────────────────────────────

def _init_paddle_ocr(lang: str):
    from paddleocr import PaddleOCR
    # PaddleOCR 3.x uses this compact constructor.  Its ``ocr`` compatibility
    # method is still supported, while older 2.x installations accept it too.
    return PaddleOCR(lang=lang)


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
            engine = _init_paddle_ocr(target_lang)
            _OCR_INSTANCES[target_lang] = engine
            _PADDLE_AVAILABLE = True
            logger.info("PaddleOCR initialized for language '%s'", target_lang)
            return engine
        except Exception as exc:
            logger.warning("PaddleOCR init for '%s' failed: %s", target_lang, exc)
            if target_lang != "en":
                try:
                    if "en" not in _OCR_INSTANCES:
                        _OCR_INSTANCES["en"] = _init_paddle_ocr("en")
                    _PADDLE_AVAILABLE = True
                    return _OCR_INSTANCES["en"]
                except Exception as fb_exc:
                    logger.warning("PaddleOCR English fallback failed: %s", fb_exc)
            if not _OCR_INSTANCES:
                _PADDLE_AVAILABLE = False
            return None


def _run_paddle_ocr(ocr_engine, image: Image.Image) -> str:
    img_array = np.array(image)
    lines = []
    # 3.x exposes ``predict`` and returns OCRResult/dict objects containing
    # ``rec_texts``.  2.x returns nested [box, (text, score)] line lists.
    result = ocr_engine.predict(img_array) if hasattr(ocr_engine, "predict") else ocr_engine.ocr(img_array, cls=True)
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
            recognized = payload.get("rec_texts") or payload.get("texts") or []
            lines.extend(str(text).strip() for text in recognized if str(text).strip())
            continue

        # Legacy PaddleOCR 2.x result shape.
        for line in page_result or []:
            if line and len(line) > 1 and line[1] and line[1][0]:
                text_content = str(line[1][0]).strip()
                if text_content:
                    lines.append(text_content)
    return "\n".join(lines)


def _run_tesseract_ocr(image: Image.Image) -> str:
    try:
        import pytesseract
        return pytesseract.image_to_string(image).strip()
    except Exception:
        return ""


# ── Multi-Pass Single Image Processing ──────────────────────────────────────

def ocr_single_image_printed(image: Image.Image, language_hint: str = "en") -> str:
    """
    Extract text using multi-candidate pre-processing and OCR engine fusion.
    """
    # PaddleOCR is the primary engine for printed reports and digital PDFs.
    # A local Tesseract fallback keeps this route usable if Paddle is unavailable.
    candidates = generate_ocr_candidates(image)
    paddle_engine = get_paddle_ocr_engine(language_hint)
    if paddle_engine is not None:
        logger.info("PaddleOCR in use for this printed document")

    best_text = ""
    for cand_img in candidates:
        extracted = ""
        if paddle_engine is not None:
            try:
                extracted = _run_paddle_ocr(paddle_engine, cand_img)
            except Exception as exc:
                logger.debug("PaddleOCR candidate error: %s", exc)

        if not extracted.strip():
            extracted = _run_tesseract_ocr(cand_img)

        if extracted.strip():
            if len(extracted.strip()) > len(best_text):
                best_text = extracted.strip()

    if best_text:
        return clean_text(best_text)

    logger.warning("PaddleOCR completed but no readable text was found in the image")
    return "[Image processed: No text could be detected. Ensure photo is well-lit and in focus.]"


# ── Handwritten Image Engine (TrOCR, with PaddleOCR safety net) ─────────────

def ocr_single_image_handwritten(image: Image.Image, language_hint: str = "en") -> Tuple[str, str]:
    """
    Extract text from a photographed / handwritten image using TrOCR.

    Hosted vision OCR is the default because cursive prescriptions are not a
    good fit for a generic local TrOCR checkpoint. It avoids model downloads
    and uses the image itself, rather than asking a text model to reconstruct
    heavily corrupted OCR output. Local TrOCR is retained as an explicit
    opt-in fallback for offline deployments.
    """
    if settings.HANDWRITING_OCR_ENGINE != "trocr":
        vision_text = _try_vision_ocr(image, language_hint)
        if vision_text and vision_text.strip():
            return clean_text(vision_text), "Groq Vision OCR"
        if not settings.HANDWRITING_OCR_FALLBACK_TROCR:
            logger.warning("Vision OCR produced no text; using lightweight PaddleOCR fallback")
            return ocr_single_image_printed(image, language_hint), "PaddleOCR (vision fallback)"

    def readability_score(candidate: str) -> int:
        """Rank OCR candidates without pretending a noisy string is clinical text."""
        words = re.findall(r"[A-Za-z]{2,}", candidate or "")
        alpha_count = sum(char.isalpha() for char in candidate or "")
        # Reward distinct word-like tokens but cap length so a long corrupted
        # string does not automatically beat a short, legible medicine name.
        return min(alpha_count, 160) + min(len(words), 20) * 12

    try:
        from sih_ocr.services.trocr_service import trocr_service
        preprocessed = preprocess_for_handwriting(image)
        text, _confidence = trocr_service.extract(preprocessed)
        best_text = text
        best_score = readability_score(text)

        # Aggressive contrast processing can sometimes erase light pen strokes
        # or make a ruled sheet look like text. Retry only weak first-pass OCR
        # with the original/upscaled and binarized variants.
        if best_score < 70:
            candidates = generate_ocr_candidates(image)
            for candidate in (candidates[0], candidates[-1]):
                candidate_text, _candidate_confidence = trocr_service.extract(candidate)
                candidate_score = readability_score(candidate_text)
                if candidate_score > best_score:
                    best_text = candidate_text
                    best_score = candidate_score

        if best_text and best_text.strip():
            return clean_text(best_text), "TrOCR"
        logger.warning("TrOCR returned no text; falling back to PaddleOCR")
    except Exception as exc:
        logger.warning("TrOCR unavailable/failed (%s); falling back to PaddleOCR", exc)

    fallback_text = ocr_single_image_printed(image, language_hint)
    return fallback_text, "PaddleOCR (fallback)"


# ── Public API ──────────────────────────────────────────────────────────────

def ocr_images(images: List[Image.Image], language_hint: str = "en") -> str:
    """Extract text from a set of standalone image files (camera photos)."""
    if not images:
        return ""
    pages = []
    for page_number, image in enumerate(images, start=1):
        page_text, _engine = ocr_single_image_handwritten(image, language_hint)
        pages.append(f"--- Page {page_number} ---\n{page_text}")
    return clean_text("\n\n".join(pages))


def _render_pdf_page(page) -> Image.Image:
    """Render one page without repeatedly rasterising the whole document."""
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def extract_document_text(
    content: bytes, extension: str, language_hint: str = "en", document_type: str = "auto"
) -> Tuple[str, int, str]:
    """
    `document_type="prescription"` selects the TrOCR handwriting route for
    both images and PDF pages. Other PDFs retain embedded text when available
    and otherwise use PaddleOCR. This matters because a scanned handwritten
    prescription is often uploaded as a PDF, not only as a camera image.
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

        handwritten_pdf = document_type == "prescription"
        page_texts: List[str] = []
        page_engines: List[str] = []
        for index, page in enumerate(pdf):
            if not handwritten_pdf:
                embedded_text = clean_text(page.get_text("text"))
                if embedded_text:
                    page_texts.append(embedded_text)
                    page_engines.append("native PDF text")
                    continue
            try:
                image = _render_pdf_page(page)
                if handwritten_pdf:
                    page_text, engine = ocr_single_image_handwritten(image, language_hint)
                else:
                    page_text, engine = ocr_single_image_printed(image, language_hint), "PaddleOCR"
                page_texts.append(page_text)
                page_engines.append(engine)
            except Exception as pix_exc:
                logger.warning("Failed to OCR PDF page %d: %s", index, pix_exc)
                page_texts.append("")
                page_engines.append("OCR failed")
        text = "\n\n".join(f"--- Page {num} ---\n{pt or '[No readable text found]'}" for num, pt in enumerate(page_texts, 1))
        engine = " + ".join(dict.fromkeys(page_engines))
        return clean_text(text), pdf.page_count, engine or "OCR unavailable"

    # Image files (prescription photos, lab scans) always go through TrOCR
    # first, since it's the dedicated handwriting engine and PaddleOCR is
    # reserved for printed documents (PDFs, and TrOCR's own safety-net fallback).
    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image file is invalid or corrupted.",
        ) from exc

    extracted_text, engine_used = ocr_single_image_handwritten(image, language_hint)
    return extracted_text, 1, engine_used
