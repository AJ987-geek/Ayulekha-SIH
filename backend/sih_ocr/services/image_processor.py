"""
Advanced Image Pre-processing Pipeline for Medical Document OCR.

Optimized for:
- Handwritten doctor prescriptions (faint ink, cursive, ruled paper)
- Camera photos (shadows, glare, skew, low resolution)
- Lab report scans (faded print, uneven lighting)
"""

import logging
from typing import List

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)


def pil_to_cv2(image: Image.Image) -> np.ndarray:
    """Convert PIL Image (RGB) to OpenCV BGR numpy array."""
    rgb = np.array(image)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def cv2_to_pil(img: np.ndarray) -> Image.Image:
    """Convert OpenCV BGR/Gray numpy array to PIL Image (RGB)."""
    if len(img.shape) == 2:
        return Image.fromarray(img).convert("RGB")
    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))


# ---------------------------------------------------------------------------
# Individual Enhancement Steps
# ---------------------------------------------------------------------------

def upscale_if_small(image: Image.Image, min_width: int = 1200) -> Image.Image:
    """Upscale small / low-res camera photos so OCR has enough pixel data."""
    w, h = image.size
    if w < min_width:
        scale = min_width / w
        new_size = (int(w * scale), int(h * scale))
        return image.resize(new_size, Image.LANCZOS)
    return image


def correct_orientation(image: Image.Image) -> Image.Image:
    """Auto-rotate based on EXIF orientation tag (common in phone photos)."""
    try:
        from PIL.ExifTags import Base as ExifBase
        exif = image.getexif()
        orientation = exif.get(ExifBase.Orientation, 1)
        rotations = {3: 180, 6: 270, 8: 90}
        if orientation in rotations:
            return image.rotate(rotations[orientation], expand=True)
    except Exception:
        pass
    return image


def enhance_contrast_clahe(img_cv: np.ndarray) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).
    Dramatically improves faint ink visibility on handwritten prescriptions.
    """
    if len(img_cv.shape) == 3:
        lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
        l_channel, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)
        merged = cv2.merge([l_enhanced, a, b])
        return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    else:
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        return clahe.apply(img_cv)


def denoise_bilateral(img_cv: np.ndarray) -> np.ndarray:
    """
    Bilateral filter: removes camera sensor noise and paper grain
    while preserving pen stroke edges.
    """
    return cv2.bilateralFilter(img_cv, d=9, sigmaColor=75, sigmaSpace=75)


def sharpen_text(img_cv: np.ndarray) -> np.ndarray:
    """Unsharp-mask style sharpening to crisp up fuzzy handwriting edges."""
    gaussian = cv2.GaussianBlur(img_cv, (0, 0), 3)
    return cv2.addWeighted(img_cv, 1.5, gaussian, -0.5, 0)


def remove_ruled_lines(gray: np.ndarray) -> np.ndarray:
    """
    Attempt to remove horizontal ruled lines from notebook paper
    that interfere with OCR character segmentation.
    """
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    detected_lines = cv2.morphologyEx(
        gray, cv2.MORPH_OPEN, horizontal_kernel, iterations=2
    )
    # Inpaint detected lines
    mask = cv2.threshold(detected_lines, 0, 255, cv2.THRESH_BINARY)[1]
    if cv2.countNonZero(mask) > 0:
        repaired = cv2.inpaint(gray, mask, 3, cv2.INPAINT_TELEA)
        return repaired
    return gray


def adaptive_binarize(gray: np.ndarray) -> np.ndarray:
    """
    Adaptive thresholding optimized for handwritten text on
    uneven backgrounds (ruled paper, shadows, camera vignetting).
    """
    return cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15,
    )


def deskew(gray: np.ndarray) -> np.ndarray:
    """
    Detect dominant text angle and rotate to correct skew
    from crooked camera captures.
    """
    try:
        coords = np.column_stack(np.where(gray < 128))
        if len(coords) < 50:
            return gray
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        # Only correct meaningful skew (> 0.5 degrees, < 15 degrees)
        if abs(angle) < 0.5 or abs(angle) > 15:
            return gray
        h, w = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(
            gray, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )
    except Exception:
        return gray


# ---------------------------------------------------------------------------
# High-Level Pipelines
# ---------------------------------------------------------------------------

def preprocess_for_handwriting(image: Image.Image) -> Image.Image:
    """
    Full pre-processing pipeline optimized for handwritten doctor prescriptions.
    Steps:
      1. EXIF orientation correction
      2. Upscale if low-res
      3. PIL sharpness + contrast boost
      4. CLAHE contrast enhancement
      5. Bilateral denoising
      6. Sharpening
    Returns an enhanced color image suitable for PaddleOCR.
    """
    try:
        image = correct_orientation(image)
        image = upscale_if_small(image, min_width=1500)

        # PIL-level enhancements
        image = ImageEnhance.Sharpness(image).enhance(1.8)
        image = ImageEnhance.Contrast(image).enhance(1.4)

        # OpenCV pipeline
        img_cv = pil_to_cv2(image)
        img_cv = enhance_contrast_clahe(img_cv)
        img_cv = denoise_bilateral(img_cv)
        img_cv = sharpen_text(img_cv)

        return cv2_to_pil(img_cv)
    except Exception as exc:
        logger.warning("Handwriting pre-processing failed, using original: %s", exc)
        return image


def preprocess_binarized(image: Image.Image) -> Image.Image:
    """
    Aggressive binarization pipeline for very faint / low-contrast text.
    Steps:
      1. Upscale
      2. Grayscale conversion
      3. CLAHE on grayscale
      4. Remove ruled lines (notebook paper)
      5. Adaptive binarization
      6. Deskew
    Returns a black-and-white image optimized for maximum OCR recall.
    """
    try:
        image = correct_orientation(image)
        image = upscale_if_small(image, min_width=1500)

        img_cv = pil_to_cv2(image)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        gray = remove_ruled_lines(gray)
        gray = adaptive_binarize(gray)
        gray = deskew(gray)

        return cv2_to_pil(gray)
    except Exception as exc:
        logger.warning("Binarization pre-processing failed, using original: %s", exc)
        return image


def generate_ocr_candidates(image: Image.Image) -> List[Image.Image]:
    """
    Generate multiple pre-processed versions of the input image.
    The OCR engine will run on each and merge the best results.

    Returns a list of PIL Images:
      [0] Original (orientation-corrected + upscaled)
      [1] Handwriting-enhanced (CLAHE + denoise + sharpen)
      [2] Binarized (adaptive threshold, line removal, deskew)
    """
    base = correct_orientation(image)
    base = upscale_if_small(base, min_width=1500)

    candidates = [base]

    enhanced = preprocess_for_handwriting(image)
    candidates.append(enhanced)

    binarized = preprocess_binarized(image)
    candidates.append(binarized)

    return candidates
