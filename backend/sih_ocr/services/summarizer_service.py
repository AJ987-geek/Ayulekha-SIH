import logging
import re
from typing import Dict, List, Optional
import requests
from sih_ocr.config import settings
from sih_ocr.schemas.document import PrescriptionReviewContext

logger = logging.getLogger(__name__)


def _plain_cell(value: str) -> str:
    """Keep JSON table cells readable when Markdown uses emphasis."""
    return re.sub(r"\s+", " ", re.sub(r"[*_`]", "", value)).strip()


def extract_markdown_tables(markdown: str) -> List[Dict[str, object]]:
    """Convert well-formed Markdown tables into JSON-safe dataframe records.

    The LLM output remains the human-readable source of truth. This lightweight
    parser gives the API/UI a structured representation without a second model
    call or a heavyweight pandas dependency.
    """
    tables: List[Dict[str, object]] = []
    lines = markdown.splitlines()
    index = 0

    while index + 1 < len(lines):
        header = lines[index].strip()
        separator = lines[index + 1].strip()
        if not (header.startswith("|") and header.endswith("|") and re.fullmatch(r"[| :\-]+", separator)):
            index += 1
            continue

        columns = [_plain_cell(cell) for cell in header.strip("|").split("|")]
        if not columns or any(not column for column in columns):
            index += 1
            continue

        title = "Extracted data"
        for previous in reversed(lines[:index]):
            match = re.match(r"^#{2,6}\s+(.+?)\s*$", previous.strip())
            if match:
                title = match.group(1)
                break

        rows: List[Dict[str, str]] = []
        index += 2
        while index < len(lines):
            row = lines[index].strip()
            if not (row.startswith("|") and row.endswith("|")):
                break
            cells = [cell.strip() for cell in row.strip("|").split("|")]
            if len(cells) == len(columns):
                rows.append(dict(zip(columns, (_plain_cell(cell) for cell in cells))))
            index += 1

        if rows:
            tables.append({"title": title, "columns": columns, "rows": rows})

    return tables


def _call_groq(prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
    """Call Groq API using OpenAI-compatible chat completions endpoint."""
    api_key = settings.GROQ_API_KEY
    if not api_key or api_key == "your_groq_api_key_here":
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt or (
                    "You are an expert clinical pharmacologist and medical document reader. "
                    "You excel at deciphering messy, cursive doctor handwriting, handwritten prescriptions, "
                    "medical abbreviations (Rx, tab, cap, syr, 1-0-1, OD, BD, TDS, SOS), and diagnostic lab reports. "
                    "You structure all medical findings into clean, beautiful Markdown."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
    }
    try:
        response = requests.post(
            settings.GROQ_API_URL,
            headers=headers,
            json=payload,
            timeout=settings.LLM_REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        if choices and "message" in choices[0]:
            content = choices[0]["message"].get("content", "").strip()
            if content:
                return content
    except Exception as exc:
        logger.warning("Groq API request (%s) failed: %s", settings.GROQ_MODEL, exc)
    return None


def refine_prescription_with_context(
    vision_extraction: str, context: PrescriptionReviewContext
) -> str:
    """Reconcile visual OCR with supplied context without creating a prescription.

    This is intentionally a separate stage from image OCR, so later context
    sources (triage form, clinician note, validated medication history) can be
    added to ``PrescriptionReviewContext`` without changing the OCR provider.
    """
    complaint = context.chief_complaint.strip() or "Not provided"
    prompt = f"""Reconcile this candidate prescription extraction with the chief
complaint. This is clerical digitization support, not prescribing.

CHIEF COMPLAINT:
{complaint}

VISUAL OCR CANDIDATE:
{vision_extraction}

Return exactly this Markdown format:

### Prescriptions
| # | Medication | Dosage / Strength | Frequency | Duration | Instructions | Review Status |

Rules:
- Keep only medicines present in the visual OCR candidate.
- You may correct an OCR spelling only when the correction is strongly supported
  by the candidate text and complaint context. Never add a medicine based on
  the complaint alone.
- If a name or field is uncertain, preserve the candidate text and set Review
  Status to `Verify original`; do not use “possible” or “likely”.
- Use `Not legible` for missing fields, rather than guessing.
- Do not diagnose, recommend treatment, change a dose, or add patient details.

### Prescription Summary
- At most three concise bullets: the supplied chief complaint, which medicine
  names were normalized (if any), and fields that need verification.
"""
    system_prompt = (
        "You are a cautious prescription transcription reviewer. Preserve the "
        "original visual evidence and never infer or prescribe a drug."
    )
    refined = _call_groq(prompt, system_prompt)
    # A failed optional reconciliation must never discard the vision result.
    return refined or vision_extraction


def generate_medical_summary(text: str, page_count: int, document_type: str = "auto") -> str:
    """
    Format and summarize digitized medical text (prescriptions or lab reports)
    using Groq LLM API.
    """
    if not text or not text.strip():
        return "No readable clinical information could be extracted from this document. Please upload a clearer photo or scan."

    kind = "handwritten prescription" if document_type == "prescription" else "diagnostic or printed clinical report"
    prompt = f"""Analyze ALL {page_count} page(s) of this {kind}.
Transcribe only information supported by the OCR. Do not invent medicine names,
dosages, diagnoses, patient details, or clinical advice.

DIGITIZED RAW TEXT:
{text}

OUTPUT FORMAT — follow exactly:

FOR A PRESCRIPTION:
### Prescriptions
Output exactly one Markdown table:
| # | Medication | Dosage / Strength | Frequency | Duration | Instructions |
Only include rows with a legible medication name. Use `Not legible` for an
unreadable field. Do not give possible/likely drug-name guesses.

### Prescription Summary
Give at most three short bullets about the prescriptions that were legible and
critical fields that could not be read. Do not include patient details,
diagnosis, boilerplate warnings, or raw OCR fragments.

FOR A REPORT:
### Digitized Results
Output one Markdown table per test panel:
| Test | Value | Unit | Reference Range | Status |
Status must be High, Low, Normal, or Not stated, based only on the stated
reference range.

### Report Summary
Give concise bullets for High results, Low results, and values that cannot be
classified. Do not include patient details or restate all normal values.

RULES: Output only Markdown. Never repeat a table or heading. Never make a
clinical diagnosis or recommend changing a medicine.
"""

    summary: Optional[str] = _call_groq(prompt)

    if summary:
        return summary

    return (
        "### Digitized Document Content\n\n"
        f"{text}\n\n"
        "---\n"
        f"*Note: Configure GROQ_API_KEY in backend/.env for AI clinical formatting.*"
    )
