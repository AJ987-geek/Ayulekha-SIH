import logging
from pathlib import Path
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from sih_ocr.config import settings
from sih_ocr.schemas.document import DocumentSummaryResponse, PrescriptionReviewContext
from sih_ocr.services.ocr_service import extract_document_text
from sih_ocr.services.summarizer_service import (
    extract_markdown_tables,
    generate_medical_summary,
    refine_prescription_with_context,
)

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)


@router.post(
    "/upload",
    response_model=DocumentSummaryResponse,
    summary="Upload and summarize a medical document",
)
async def upload_document(
    file: UploadFile = File(..., description="PDF or image file of the medical report"),
    language_hint: str = Form("en", description="Language hint (e.g. en, hi, ta, etc.)"),
    document_type: str = Form("auto", description="auto, printed, or prescription"),
    chief_complaint: str = Form("", description="Optional reason for visit; used only to review prescription OCR."),
):
    """
    Accept a medical document (PDF or image), digitize every page using embedded text or OCR,
    and generate a structured clinical summary.
    """
    original_filename = file.filename or "uploaded_document"
    extension = Path(original_filename).suffix.lower().lstrip(".")

    # Infer extension from content_type if filename lacks an extension (e.g. camera photo/blob uploads)
    if not extension and file.content_type:
        content_type = file.content_type.lower()
        if "pdf" in content_type:
            extension = "pdf"
        elif "jpeg" in content_type or "jpg" in content_type:
            extension = "jpg"
        elif "png" in content_type:
            extension = "png"
        elif "webp" in content_type:
            extension = "webp"
        elif "bmp" in content_type:
            extension = "bmp"
        elif "tiff" in content_type:
            extension = "tiff"
        elif content_type.startswith("image/"):
            extension = "png"

    if not extension or extension not in settings.ALLOWED_EXTENSIONS:
        allowed_fmt = ", ".join(sorted(settings.ALLOWED_EXTENSIONS))
        fmt_desc = f"'{extension}'" if extension else "unspecified format"
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file format {fmt_desc}. Please upload a PDF or image file ({allowed_fmt}).",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {max_mb} MB.",
        )

    requested_type = document_type.strip().lower()
    if requested_type not in {"auto", "printed", "prescription"}:
        raise HTTPException(status_code=422, detail="document_type must be auto, printed, or prescription.")
    normalized_complaint = chief_complaint.strip()
    if len(normalized_complaint) > 1000:
        raise HTTPException(status_code=422, detail="chief_complaint must not exceed 1000 characters.")

    digitized_text, page_count, engine = extract_document_text(
        content, extension, language_hint, requested_type
    )
    logger.info("OCR engine selected: %s (document_type=%s)", engine, requested_type)
    # Vision OCR already returns the final prescription table and summary from
    # the image itself. Passing it through a second text-only model loses visual
    # evidence and was the source of duplicate/speculative prescription output.
    if engine == "Groq Vision OCR" and requested_type == "prescription":
        summary = refine_prescription_with_context(
            digitized_text,
            PrescriptionReviewContext(chief_complaint=normalized_complaint),
        )
    else:
        summary = generate_medical_summary(digitized_text, page_count, requested_type)

    return DocumentSummaryResponse(
        filename=original_filename,
        page_count=page_count,
        summary=summary,
        engine=engine,
        document_type=requested_type,
        tables=extract_markdown_tables(summary),
    )
