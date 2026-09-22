from typing import Dict, List

from pydantic import BaseModel, Field


class StructuredTable(BaseModel):
    """A dataframe-style table extracted from the clinical Markdown summary."""

    title: str = Field(..., description="Heading immediately above the table.")
    columns: List[str] = Field(..., description="Column names in display order.")
    rows: List[Dict[str, str]] = Field(..., description="Normalized table rows.")


class PrescriptionReviewContext(BaseModel):
    """User-supplied context for prescription reconciliation.

    New context fields can be added here later without changing the OCR stage.
    """

    chief_complaint: str = Field("", max_length=1000)


class DocumentSummaryResponse(BaseModel):
    """Response payload for document upload and analysis."""

    filename: str = Field(..., description="Original name of the uploaded document.")
    page_count: int = Field(..., description="Number of pages digitized.", ge=1)
    summary: str = Field(..., description="Markdown-formatted clinical summary.")
    engine: str = Field(..., description="OCR engine selected for this document.")
    document_type: str = Field(..., description="The requested processing route.")
    tables: List[StructuredTable] = Field(
        default_factory=list,
        description="Dataframe-style medication or lab-result tables extracted from the summary.",
    )


class HealthResponse(BaseModel):
    """Response payload for API health check."""

    status: str = Field("ok", description="Server health status.")
    storage: str = Field("stateless", description="Storage mode of the application.")
    version: str = Field(..., description="Application version.")
