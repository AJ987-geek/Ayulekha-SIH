"""Lazy TrOCR service for handwritten prescriptions.

The model is intentionally loaded on the first prescription request.  This keeps
the API responsive for the common lab-report/PDF path, which only needs
PaddleOCR.
"""

from __future__ import annotations

import logging
import os
import threading
import time
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class _IgnoreUnusedTrOCRPoolerWarning(logging.Filter):
    """Hide only the known unused ViT pooler checkpoint compatibility notice."""

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return not (
            "Some weights of VisionEncoderDecoderModel were not initialized" in message
            and "encoder.pooler.dense" in message
        )


class TrOCRPrescriptionService:
    """Read handwritten prescription lines with Microsoft's TrOCR model."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._processor = None
        self._model = None
        self._device = None

    @staticmethod
    def _cache_dir() -> Path:
        """Return a project-stable cache path, independent of the server CWD."""
        configured = os.getenv("TROCR_CACHE_DIR")
        if configured:
            return Path(configured).expanduser().resolve()
        # services/ -> app/ -> backend/ -> project root
        return Path(__file__).resolve().parents[3] / ".model_cache" / "trocr"

    def _ensure_model(self) -> None:
        if self._model is not None:
            return

        with self._lock:
            if self._model is not None:
                return

            try:
                # Heavy imports and model download happen only when this engine is used.
                import torch
                from transformers import TrOCRProcessor, VisionEncoderDecoderModel

                # The base checkpoint is materially more accurate on difficult
                # handwriting than the small checkpoint. It is the default for
                # prescriptions; choose the small model explicitly only when a
                # faster cold start matters more than recognition quality.
                model_name = os.getenv("TROCR_MODEL", "microsoft/trocr-base-handwritten")
                cache_dir = self._cache_dir()
                cache_dir.mkdir(parents=True, exist_ok=True)
                logger.info("Loading TrOCR prescription model: %s", model_name)

                # The handwritten model uses a Roberta BPE tokenizer. Keep the
                # image processor on its portable implementation: it only needs
                # Pillow/NumPy and does not require torchvision on a CPU server.
                # The explicit fallback below still avoids AutoTokenizer's
                # slow-tokenizer conversion path after a partial cache download.
                try:
                    self._processor = TrOCRProcessor.from_pretrained(
                        model_name, cache_dir=str(cache_dir), use_fast=False
                    )
                except Exception as processor_exc:
                    logger.warning("Standard TrOCR processor load failed: %s", processor_exc)
                    from transformers import RobertaTokenizerFast, ViTImageProcessor

                    image_processor = ViTImageProcessor.from_pretrained(
                        model_name, cache_dir=str(cache_dir)
                    )
                    tokenizer = RobertaTokenizerFast.from_pretrained(
                        model_name, cache_dir=str(cache_dir)
                    )
                    self._processor = TrOCRProcessor(
                        image_processor=image_processor, tokenizer=tokenizer
                    )

                self._device = "cuda" if torch.cuda.is_available() else "cpu"
                load_started = time.perf_counter()
                # Do not enable low_cpu_mem_usage here. With this combined
                # VisionEncoderDecoder checkpoint it can leave encoder weights on
                # PyTorch's meta device, which then fails at ``model.to(...)``.
                # Loading normally is reliable on both CPU and CUDA; the smaller
                # default checkpoint keeps its cold start reasonable.
                transformers_logger = logging.getLogger("transformers.modeling_utils")
                warning_filter = _IgnoreUnusedTrOCRPoolerWarning()
                transformers_logger.addFilter(warning_filter)
                try:
                    self._model = VisionEncoderDecoderModel.from_pretrained(
                        model_name,
                        cache_dir=str(cache_dir),
                    )
                finally:
                    transformers_logger.removeFilter(warning_filter)
                self._model.to(self._device).eval()
                logger.info(
                    "TrOCR model loaded in %.1f seconds (model=%s, device=%s)",
                    time.perf_counter() - load_started, model_name, self._device,
                )
            except Exception as exc:
                # A failed lazy load must not leave a half-initialized singleton;
                # the next upload can retry after the operator fixes the venv.
                self._processor = None
                self._model = None
                self._device = None
                raise RuntimeError(
                    "TrOCR could not start. Use a valid Python virtual environment "
                    "and install the project's pinned requirements with: "
                    "python -m pip install -r requirements.txt. "
                    f"Original error: {exc}"
                ) from exc

    @staticmethod
    def _line_images(image: Image.Image) -> List[Image.Image]:
        """Split a prescription into text-line crops, with a safe full-page fallback."""
        rgb = np.array(image.convert("RGB"))
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        height, width = gray.shape
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(30, min(150, width // 15)), 3))
        contours, _ = cv2.findContours(cv2.dilate(binary, kernel, iterations=1), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        boxes = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w >= max(40, width // 30) and h >= max(10, height // 80):
                boxes.append((x, y, w, h))
        if not boxes:
            return [image.convert("RGB")]

        boxes.sort(key=lambda box: box[1])
        pad = max(4, height // 200)
        return [
            image.crop((max(0, x - pad), max(0, y - pad), min(width, x + w + pad), min(height, y + h + pad))).convert("RGB")
            for x, y, w, h in boxes
        ]

    def extract(self, image: Image.Image) -> Tuple[str, float]:
        """Return line-preserving text and an approximate generation confidence."""
        self._ensure_model()
        import torch
        logger.info("TrOCR in use for this handwritten prescription (device=%s)", self._device)

        lines: List[str] = []
        confidences: List[float] = []
        line_images = self._line_images(image)
        # TrOCR resizes every crop to the same ViT input size. Running those
        # crops in small batches eliminates most per-line Python/model overhead
        # without changing the reading order.
        batch_size = max(1, int(os.getenv("TROCR_BATCH_SIZE", "8")))
        num_beams = max(1, int(os.getenv("TROCR_NUM_BEAMS", "4")))
        max_new_tokens = max(16, int(os.getenv("TROCR_MAX_NEW_TOKENS", "96")))

        for start in range(0, len(line_images), batch_size):
            batch = line_images[start:start + batch_size]
            pixel_values = self._processor(batch, return_tensors="pt").pixel_values.to(self._device)
            with torch.no_grad():
                generated = self._model.generate(
                    pixel_values,
                    max_new_tokens=max_new_tokens,
                    num_beams=num_beams,
                    return_dict_in_generate=True,
                    output_scores=True,
                )
            decoded_lines = self._processor.batch_decode(
                generated.sequences, skip_special_tokens=True
            )
            lines.extend(text.strip() for text in decoded_lines if text.strip())

            # Sequence scores are already length-normalized by generation and
            # are stable for batched beam search. They are only diagnostic; OCR
            # text is never discarded based on this approximate confidence.
            if getattr(generated, "sequences_scores", None) is not None:
                confidences.extend(
                    float(score.exp().item()) for score in generated.sequences_scores
                )

        return "\n".join(lines), float(np.mean(confidences)) if confidences else 0.0


trocr_service = TrOCRPrescriptionService()
