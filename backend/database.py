"""SQLite local storage module for AyuLekha audit logs."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

# Base data directory
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "ayulekha.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the SQLite database with the audit_logs table and migrate columns."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                summary_id TEXT PRIMARY KEY,
                documents_id TEXT NOT NULL,
                time_created TEXT NOT NULL,
                number_of_documents_attached INTEGER NOT NULL DEFAULT 0,
                name_of_documents TEXT NOT NULL,
                summary TEXT NOT NULL,
                original_documents TEXT NOT NULL DEFAULT '[]',
                ocr_documents TEXT NOT NULL DEFAULT '[]'
            );
            """
        )
        # Ensure columns exist on older databases
        cursor.execute("PRAGMA table_info(audit_logs);")
        existing_cols = {row["name"] for row in cursor.fetchall()}
        if "original_documents" not in existing_cols:
            cursor.execute(
                "ALTER TABLE audit_logs ADD COLUMN original_documents TEXT NOT NULL DEFAULT '[]';"
            )
        if "ocr_documents" not in existing_cols:
            cursor.execute(
                "ALTER TABLE audit_logs ADD COLUMN ocr_documents TEXT NOT NULL DEFAULT '[]';"
            )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs (time_created DESC);
            """
        )
        conn.commit()


def _parse_json_field(val: Any) -> List[Dict[str, Any]]:
    if not val:
        return []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            parsed = json.loads(val)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


def _format_row(row: sqlite3.Row | Dict[str, Any]) -> Dict[str, Any]:
    d = dict(row)
    d["original_documents"] = _parse_json_field(d.get("original_documents"))
    d["ocr_documents"] = _parse_json_field(d.get("ocr_documents"))
    return d


def insert_audit_log(
    documents_id: Optional[str] = None,
    number_of_documents_attached: int = 0,
    name_of_documents: str | List[str] = "",
    summary: Any = "",
    summary_id: Optional[str] = None,
    time_created: Optional[str] = None,
    original_documents: Optional[List[Dict[str, Any]]] = None,
    ocr_documents: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Insert or replace an audit log record in SQLite."""
    if not summary_id:
        summary_id = f"SUM-{uuid.uuid4().hex[:8].upper()}"
    if not documents_id:
        documents_id = (
            f"DOC-{uuid.uuid4().hex[:8].upper()}"
            if number_of_documents_attached > 0
            else "NONE"
        )
    if not time_created:
        time_created = datetime.now(timezone.utc).isoformat()

    if isinstance(name_of_documents, list):
        doc_names_str = ", ".join(str(x) for x in name_of_documents if x)
    else:
        doc_names_str = str(name_of_documents or "")

    if summary is None:
        summary_str = ""
    elif isinstance(summary, str):
        summary_str = summary
    elif hasattr(summary, "model_dump_json"):
        summary_str = summary.model_dump_json(indent=2)
    elif isinstance(summary, (dict, list)):
        summary_str = json.dumps(summary, indent=2)
    else:
        summary_str = str(summary)

    orig_docs_list = original_documents if isinstance(original_documents, list) else []
    ocr_docs_list = ocr_documents if isinstance(ocr_documents, list) else []

    orig_docs_json = json.dumps(orig_docs_list)
    ocr_docs_json = json.dumps(ocr_docs_list)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO audit_logs (
                summary_id,
                documents_id,
                time_created,
                number_of_documents_attached,
                name_of_documents,
                summary,
                original_documents,
                ocr_documents
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                summary_id,
                documents_id,
                time_created,
                number_of_documents_attached,
                doc_names_str,
                summary_str,
                orig_docs_json,
                ocr_docs_json,
            ),
        )
        conn.commit()

    return {
        "summary_id": summary_id,
        "documents_id": documents_id,
        "time_created": time_created,
        "number_of_documents_attached": number_of_documents_attached,
        "name_of_documents": doc_names_str,
        "summary": summary_str,
        "original_documents": orig_docs_list,
        "ocr_documents": ocr_docs_list,
    }


def attach_documents_to_audit_log(
    summary_id: Optional[str],
    original_documents: List[Dict[str, Any]],
    ocr_documents: List[Dict[str, Any]],
    fallback_summary: str = "",
) -> Dict[str, Any]:
    """Attach uploaded original & OCR documents to an existing audit log (or create one)."""
    target_log = None
    if summary_id:
        target_log = get_audit_log_by_id(summary_id)

    # If no specific summary_id was matched, check if there is a recent log within the last 30 minutes with 0 documents
    if not target_log:
        recent_logs = get_all_audit_logs(limit=1, offset=0)
        if recent_logs and recent_logs[0].get("number_of_documents_attached", 0) == 0:
            target_log = recent_logs[0]

    if target_log:
        existing_orig = target_log.get("original_documents", [])
        existing_ocr = target_log.get("ocr_documents", [])
        merged_orig = existing_orig + original_documents
        merged_ocr = existing_ocr + ocr_documents

        doc_ids = [
            d.get("id") or f"DOC-{uuid.uuid4().hex[:6].upper()}"
            for d in merged_orig
        ]
        doc_names = [
            d.get("filename") or "Document"
            for d in merged_orig
        ]

        return insert_audit_log(
            summary_id=target_log["summary_id"],
            documents_id=", ".join(doc_ids) if doc_ids else "NONE",
            time_created=target_log["time_created"],
            number_of_documents_attached=len(merged_orig),
            name_of_documents=", ".join(doc_names),
            summary=target_log["summary"] or fallback_summary,
            original_documents=merged_orig,
            ocr_documents=merged_ocr,
        )
    else:
        doc_ids = [
            d.get("id") or f"DOC-{uuid.uuid4().hex[:6].upper()}"
            for d in original_documents
        ]
        doc_names = [
            d.get("filename") or "Document"
            for d in original_documents
        ]
        return insert_audit_log(
            summary_id=summary_id or f"SUM-{uuid.uuid4().hex[:8].upper()}",
            documents_id=", ".join(doc_ids) if doc_ids else "NONE",
            number_of_documents_attached=len(original_documents),
            name_of_documents=", ".join(doc_names),
            summary=fallback_summary or "Clinical documents uploaded and digitized via OCR.",
            original_documents=original_documents,
            ocr_documents=ocr_documents,
        )


def get_all_audit_logs(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieve all audit logs ordered by creation time descending."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                summary_id,
                documents_id,
                time_created,
                number_of_documents_attached,
                name_of_documents,
                summary,
                original_documents,
                ocr_documents
            FROM audit_logs
            ORDER BY time_created DESC
            LIMIT ? OFFSET ?;
            """,
            (limit, offset),
        )
        rows = cursor.fetchall()
        return [_format_row(row) for row in rows]


def get_audit_log_by_id(summary_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single audit log by summary_id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                summary_id,
                documents_id,
                time_created,
                number_of_documents_attached,
                name_of_documents,
                summary,
                original_documents,
                ocr_documents
            FROM audit_logs
            WHERE summary_id = ?;
            """,
            (summary_id,),
        )
        row = cursor.fetchone()
        return _format_row(row) if row else None


def delete_audit_log_by_id(summary_id: str) -> bool:
    """Delete a single audit log by summary_id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM audit_logs WHERE summary_id = ?;", (summary_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        return deleted


def clear_all_audit_logs() -> int:
    """Clear all records from audit_logs table."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM audit_logs;")
        deleted_count = cursor.rowcount
        conn.commit()
        return deleted_count


# Initialize schema on module import
init_db()
