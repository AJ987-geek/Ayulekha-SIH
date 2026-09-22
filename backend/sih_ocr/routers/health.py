from fastapi import APIRouter
from sih_ocr.config import settings
from sih_ocr.schemas.document import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Check API health")
def get_health():
    """Health check endpoint to verify backend service status."""
    return HealthResponse(
        status="ok",
        storage="stateless",
        version=settings.VERSION,
    )
