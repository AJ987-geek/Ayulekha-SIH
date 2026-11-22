"""
100% Local Deterministic Medical Document Structurer & Table Extractor.
Operates entirely offline on local PaddleOCR-VL-1.6 / PaddleOCR / TrOCR output without any external API keys.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple
from sih_ocr.schemas.document import PrescriptionReviewContext

logger = logging.getLogger(__name__)


def _plain_cell(value: str) -> str:
    """Keep JSON table cells readable when Markdown uses emphasis."""
    return re.sub(r"\s+", " ", re.sub(r"[*_`]", "", value)).strip()


def extract_markdown_tables(markdown: str) -> List[Dict[str, object]]:
    """Convert well-formed Markdown tables into JSON-safe dataframe records."""
    tables: List[Dict[str, object]] = []
    lines = markdown.splitlines()
    index = 0

    while index + 1 < len(lines):
        header = lines[index].strip()
        separator = lines[index + 1].strip()
        if not (
            header.startswith("|")
            and header.endswith("|")
            and re.fullmatch(r"[| :\-]+", separator)
        ):
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
                rows.append(
                    dict(zip(columns, (_plain_cell(cell) for cell in cells)))
                )
            index += 1

        if rows:
            tables.append({"title": title, "columns": columns, "rows": rows})

    return tables


# ── Local Deterministic Prescription & Lab Report Parser ────────────────────

_MED_PREFIX_RE = re.compile(
    r"\b(?:tab(?:let)?s?|cap(?:sule)?s?|syp|syr(?:up)?|inj(?:ection)?|oint(?:ment)?|drops?|gel|cream|lotion|sachet|inhaler|neb)\b\.?",
    re.IGNORECASE,
)
_DOSE_RE = re.compile(
    r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm|ml|iu|%|units?|tab(?:let)?s?|cap(?:sule)?s?|drops?|puff)\b",
    re.IGNORECASE,
)
_FREQ_RE = re.compile(
    r"\b(?:OD|BD|BID|TDS|TID|QID|SOS|HS|PRN|STAT|1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|1-1-0|0-1-1|once\s+daily|twice\s+daily|thrice\s+daily|daily|every\s+\d+\s*h(?:ours|rs)?)\b",
    re.IGNORECASE,
)
_DUR_RE = re.compile(
    r"(?:\b(?:x|for)\s*\d+\s*(?:days?|d|weeks?|wks?|months?|mos?)\b|\b\d+\s*(?:days?|weeks?|months?)\b)",
    re.IGNORECASE,
)
_INSTR_RE = re.compile(
    r"\b(?:after\s+(?:food|meals?)|before\s+(?:food|meals?)|with\s+(?:food|meals?|water|milk)|empty\s+stomach|at\s+bedtime|morning|night|evening|as\s+needed|as\s+directed)\b",
    re.IGNORECASE,
)

# Lab line pattern: e.g., "Hemoglobin 13.5 g/dL 12.0 - 16.0"
_LAB_LINE_RE = re.compile(
    r"^\s*([A-Za-z][A-Za-z0-9\s\(\)\-\/,\.]{2,40}?)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*([A-Za-z%\/\^\d\.\u00b5\u03bc]+)?\s*(?:\(?\s*(\d+(?:\.\d+)?\s*[\-–]\s*\d+(?:\.\d+)?)\s*\)?)?\s*$"
)


def _parse_prescription_rows(lines: List[str]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for raw_line in lines:
        line = re.sub(r"^\s*(?:\d+[\.\)\-]|[\-\*\u2022]|Rx:?)\s*", "", raw_line.strip(), flags=re.IGNORECASE)
        if len(line) < 3:
            continue

        has_med_prefix = bool(_MED_PREFIX_RE.search(line))
        doses = _DOSE_RE.findall(line)
        freqs = _FREQ_RE.findall(line)
        durs = _DUR_RE.findall(line)
        instrs = _INSTR_RE.findall(line)

        if not (has_med_prefix or (doses and (freqs or durs))):
            continue

        # Extract clean medication name
        med_name = line
        # Strip trailing schedule parts after ' - ' or ' — '
        if " - " in med_name:
            med_name = med_name.split(" - ")[0].strip()
        else:
            for pattern in (_FREQ_RE, _DUR_RE, _INSTR_RE):
                med_name = pattern.sub("", med_name)
            med_name = re.sub(r"[\-–,;]+$", "", med_name).strip()

        if not med_name:
            med_name = line[:40].strip()

        rows.append({
            "Medication": med_name,
            "Dosage / Strength": ", ".join(doses) if doses else "As written",
            "Frequency": ", ".join(freqs) if freqs else "As directed",
            "Duration": ", ".join(durs).lstrip("xX ").strip() if durs else "As needed",
            "Instructions": ", ".join(instrs) if instrs else "Standard oral/clinical use",
        })
    return rows


def _classify_lab_status(val_str: str, ref_str: str) -> str:
    if not ref_str:
        return "Not stated"
    m = re.search(r"(\d+(?:\.\d+)?)\s*[\-–]\s*(\d+(?:\.\d+)?)", ref_str)
    if not m:
        return "Not stated"
    try:
        val = float(val_str)
        low = float(m.group(1))
        high = float(m.group(2))
        if val < low:
            return "Low"
        if val > high:
            return "High"
        return "Normal"
    except Exception:
        return "Not stated"


def _parse_lab_rows(lines: List[str]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    ignored_headers = {"page", "date", "time", "age", "phone", "mobile", "patient", "doctor", "hospital"}
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("--- Page") or line.startswith("|"):
            continue
        m = _LAB_LINE_RE.match(line)
        if not m:
            continue
        test_name, val_str, unit_str, ref_str = m.groups()
        test_name = test_name.strip(" .:-")
        if len(test_name) < 2 or test_name.lower() in ignored_headers:
            continue
        # Only count as lab row if unit or reference range is present, or known test keyword
        known_lab = any(
            k in test_name.lower()
            for k in (
                "hemoglobin", "hb", "wbc", "rbc", "platelet", "glucose", "sugar", "hba1c",
                "cholesterol", "HDL", "LDL", "triglyceride", "creatinine", "urea", "bilirubin",
                "sgot", "sgpt", "alt", "ast", "tsh", "t3", "t4", "sodium", "potassium",
                "calcium", "vitamin", "esr", "crp", "neutrophil", "lymphocyte", "pcv", "mcv",
            )
        )
        if not (unit_str or ref_str or known_lab):
            continue
        status = _classify_lab_status(val_str, ref_str or "")
        rows.append({
            "Test": test_name,
            "Value": val_str,
            "Unit": unit_str or "-",
            "Reference Range": ref_str or "Not stated",
            "Status": status,
        })
    return rows


def refine_prescription_with_context(
    vision_extraction: str, context: PrescriptionReviewContext
) -> str:
    """Local pass-through reconciliation without external API keys."""
    return vision_extraction


def generate_medical_summary(text: str, page_count: int, document_type: str = "auto") -> str:
    """
    Format and structure digitized medical text locally (0 API keys used).
    Works seamlessly with PaddleOCR-VL-1.6 Markdown output, PaddleOCR text, and PyMuPDF text.
    """
    if not text or not text.strip():
        return "No readable clinical information could be extracted from this document. Please upload a clearer photo or scan."

    cleaned = text.strip()

    # If PaddleOCR-VL-1.6 already produced Markdown tables, keep them and append a summary header if needed
    existing_tables = extract_markdown_tables(cleaned)
    if existing_tables:
        return cleaned

    raw_lines = [
        ln.strip()
        for ln in cleaned.splitlines()
        if ln.strip() and not ln.strip().startswith("--- Page")
    ]

    med_rows = _parse_prescription_rows(raw_lines)
    lab_rows = _parse_lab_rows(raw_lines)

    sections: List[str] = []

    if med_rows and (document_type in ("auto", "prescription") or not lab_rows):
        table_lines = [
            "### Prescriptions",
            "| # | Medication | Dosage / Strength | Frequency | Duration | Instructions |",
            "|---|---|---|---|---|---|",
        ]
        for idx, r in enumerate(med_rows, start=1):
            table_lines.append(
                f"| {idx} | {r['Medication']} | {r['Dosage / Strength']} | {r['Frequency']} | {r['Duration']} | {r['Instructions']} |"
            )
        sections.append("\n".join(table_lines))

        bullets = [
            f"- **{r['Medication']}** ({r['Dosage / Strength']}) — {r['Frequency']} for {r['Duration']} ({r['Instructions']})"
            for r in med_rows
        ]
        sections.append("### Prescription Summary\n" + "\n".join(bullets))

    if lab_rows and (document_type in ("auto", "printed", "lab_report") or not med_rows):
        table_lines = [
            "### Digitized Results",
            "| Test | Value | Unit | Reference Range | Status |",
            "|---|---|---|---|---|",
        ]
        for r in lab_rows:
            table_lines.append(
                f"| {r['Test']} | {r['Value']} | {r['Unit']} | {r['Reference Range']} | {r['Status']} |"
            )
        sections.append("\n".join(table_lines))

        abnormal = [r for r in lab_rows if r["Status"] in ("High", "Low")]
        if abnormal:
            ab_bullets = [
                f"- **{r['Test']}**: {r['Value']} {r['Unit']} (*{r['Status']}*, Ref: {r['Reference Range']})"
                for r in abnormal
            ]
            sections.append("### Report Summary (Abnormal Findings)\n" + "\n".join(ab_bullets))
        else:
            sections.append(
                f"### Report Summary\n- Extracted {len(lab_rows)} laboratory parameters locally across {page_count} page(s)."
            )

    # Always include the full digitized text block so every line read by local OCR is visible
    sections.append(f"### Digitized Clinical Text ({page_count} Page(s))\n{cleaned}")

    return "\n\n".join(sections)
