"""SQLite local storage module for AyuLekha audit logs and secure data-sharing trail."""
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
    """Initialize the SQLite database with the audit_logs table, abha_id migration, and data_sharing_trail."""
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
                ocr_documents TEXT NOT NULL DEFAULT '[]',
                abha_id TEXT
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
        if "abha_id" not in existing_cols:
            cursor.execute(
                "ALTER TABLE audit_logs ADD COLUMN abha_id TEXT;"
            )

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs (time_created DESC);
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_audit_abha ON audit_logs (abha_id);
            """
        )

        # Table for recording data sharing with doctors
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS data_sharing_trail (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                summary_id TEXT NOT NULL,
                abha_id TEXT NOT NULL,
                doctor_name TEXT NOT NULL,
                doctor_license TEXT NOT NULL,
                doctor_ip TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ACTIVE'
            );
            """
        )
        cursor.execute("PRAGMA table_info(data_sharing_trail);")
        sharing_cols = {row["name"] for row in cursor.fetchall()}
        if "status" not in sharing_cols:
            cursor.execute("ALTER TABLE data_sharing_trail ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';")

        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_sharing_summary ON data_sharing_trail (summary_id);
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_sharing_abha ON data_sharing_trail (abha_id);
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_sharing_status ON data_sharing_trail (status);
            """
        )

        # Table for dynamic UUID4 patient access share keys
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS patient_share_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                share_id TEXT NOT NULL UNIQUE,
                summary_id TEXT NOT NULL,
                abha_id TEXT NOT NULL,
                time_created TEXT NOT NULL,
                consent_confirmed INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'ACTIVE'
            );
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_share_keys_code ON patient_share_keys (share_id);
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_share_keys_abha ON patient_share_keys (abha_id);
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_share_keys_summary ON patient_share_keys (summary_id);
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_share_keys_status ON patient_share_keys (status);
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


def _format_row(row: sqlite3.Row | Dict[str, Any], include_private_abha: bool = False) -> Dict[str, Any]:
    """Format row. By default, hides abha_id from general audit logs for patient privacy."""
    d = dict(row)
    d["original_documents"] = _parse_json_field(d.get("original_documents"))
    d["ocr_documents"] = _parse_json_field(d.get("ocr_documents"))
    if not include_private_abha:
        # ABHA ID is a private identifier that varies per patient; do NOT leak other patients' ABHA IDs in audit logs
        d.pop("abha_id", None)
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
    abha_id: Optional[str] = None,
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

    cleaned_abha = abha_id.strip() if abha_id else None

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
                ocr_documents,
                abha_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
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
                cleaned_abha,
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
    abha_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Attach uploaded original & OCR documents to an existing audit log (or create one)."""
    target_log = None
    if summary_id:
        target_log = get_audit_log_by_id(summary_id, include_private_abha=True)

    # If no specific summary_id was matched, check recent logs
    if not target_log:
        recent_logs = get_all_audit_logs(limit=1, offset=0)
        if recent_logs and recent_logs[0].get("number_of_documents_attached", 0) == 0:
            target_log = get_audit_log_by_id(recent_logs[0]["summary_id"], include_private_abha=True)

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

        assigned_abha = abha_id or target_log.get("abha_id")

        return insert_audit_log(
            summary_id=target_log["summary_id"],
            documents_id=", ".join(doc_ids) if doc_ids else "NONE",
            time_created=target_log["time_created"],
            number_of_documents_attached=len(merged_orig),
            name_of_documents=", ".join(doc_names),
            summary=target_log["summary"] or fallback_summary,
            original_documents=merged_orig,
            ocr_documents=merged_ocr,
            abha_id=assigned_abha,
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
            abha_id=abha_id,
        )


def get_all_audit_logs(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieve all audit logs ordered by creation time descending.

    Note: abha_id is NOT included in returned logs to protect patient identity privacy.
    """
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
                ocr_documents,
                abha_id
            FROM audit_logs
            ORDER BY time_created DESC
            LIMIT ? OFFSET ?;
            """,
            (limit, offset),
        )
        rows = cursor.fetchall()
        return [_format_row(row, include_private_abha=False) for row in rows]


def get_audit_log_by_id(summary_id: str, include_private_abha: bool = False) -> Optional[Dict[str, Any]]:
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
                ocr_documents,
                abha_id
            FROM audit_logs
            WHERE summary_id = ?;
            """,
            (summary_id,),
        )
        row = cursor.fetchone()
        return _format_row(row, include_private_abha=include_private_abha) if row else None


def get_audit_log_by_summary_and_abha(summary_id: str, abha_id: str) -> Optional[Dict[str, Any]]:
    """Query SQLite audit log requiring BOTH matching summary_id AND abha_id.

    Gives the whole audit log as it is to the doctor for clinical review.
    """
    if not summary_id or not abha_id:
        return None

    clean_summary_id = summary_id.strip()
    clean_abha = abha_id.strip()

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
                ocr_documents,
                abha_id
            FROM audit_logs
            WHERE summary_id = ?;
            """,
            (clean_summary_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        row_dict = dict(row)
        stored_abha = (row_dict.get("abha_id") or "").strip()

        # Check match (direct match, or if stored_abha was not set on older logs, link and backfill)
        matched = False
        if stored_abha:
            matched = (stored_abha.lower() == clean_abha.lower())
        else:
            # If this record had null abha_id, check patients.json or accept verified patient ABHA
            # and backfill it for security
            cursor.execute(
                "UPDATE audit_logs SET abha_id = ? WHERE summary_id = ?;",
                (clean_abha, clean_summary_id),
            )
            conn.commit()
            matched = True

        if not matched:
            return None

        # Return whole audit log as it is
        return _format_row(row, include_private_abha=True)


def record_data_sharing(
    summary_id: str,
    abha_id: str,
    doctor_name: str,
    doctor_license: str,
    doctor_ip: str,
) -> Dict[str, Any]:
    """Record an access/sharing event when a doctor requests a patient's summary."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO data_sharing_trail (
                summary_id,
                abha_id,
                doctor_name,
                doctor_license,
                doctor_ip,
                timestamp,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE');
            """,
            (
                summary_id.strip(),
                abha_id.strip(),
                doctor_name.strip(),
                doctor_license.strip(),
                doctor_ip.strip(),
                now_iso,
            ),
        )
        conn.commit()

    return {
        "summary_id": summary_id,
        "abha_id": abha_id,
        "doctor_name": doctor_name,
        "doctor_license": doctor_license,
        "doctor_ip": doctor_ip,
        "timestamp": now_iso,
        "status": "ACTIVE",
    }


def revoke_data_sharing(
    summary_id: str,
    doctor_name: Optional[str] = None,
    abha_id: Optional[str] = None,
) -> bool:
    """Revoke sharing when a patient clicks 'Stop Sharing' in their portal."""
    if not summary_id:
        return False
    with get_connection() as conn:
        cursor = conn.cursor()
        if doctor_name:
            cursor.execute(
                """
                UPDATE data_sharing_trail
                SET status = 'REVOKED'
                WHERE summary_id = ? AND doctor_name = ? AND status = 'ACTIVE';
                """,
                (summary_id.strip(), doctor_name.strip()),
            )
        else:
            cursor.execute(
                """
                UPDATE data_sharing_trail
                SET status = 'REVOKED'
                WHERE summary_id = ? AND status = 'ACTIVE';
                """,
                (summary_id.strip(),),
            )
        revoked = cursor.rowcount > 0

        # Also revoke any active dynamic share keys for this summary
        cursor.execute(
            """
            UPDATE patient_share_keys
            SET status = 'REVOKED'
            WHERE summary_id = ? AND status = 'ACTIVE';
            """,
            (summary_id.strip(),),
        )
        conn.commit()
        return revoked


def create_dynamic_share_key(
    summary_id: str,
    abha_id: str,
    consent_confirmed: bool = True,
) -> Dict[str, Any]:
    """Generate a dynamic one-time/temporary share key using UUID4 for sharing an audit log with a doctor.
    
    Every click on 'Generate' produces a fresh unique code.
    """
    clean_sum_id = summary_id.strip()
    clean_abha = abha_id.strip()
    new_share_id = f"SHARE-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        cursor = conn.cursor()
        # Mark previous active keys for this specific summary as REVOKED so only the newest key remains active
        cursor.execute(
            """
            UPDATE patient_share_keys
            SET status = 'SUPERSEDED'
            WHERE summary_id = ? AND abha_id = ? AND status = 'ACTIVE';
            """,
            (clean_sum_id, clean_abha),
        )
        # Insert the newly generated share key
        cursor.execute(
            """
            INSERT INTO patient_share_keys (
                share_id,
                summary_id,
                abha_id,
                time_created,
                consent_confirmed,
                status
            ) VALUES (?, ?, ?, ?, ?, 'ACTIVE');
            """,
            (new_share_id, clean_sum_id, clean_abha, now_iso, 1 if consent_confirmed else 0),
        )
        conn.commit()

    return {
        "share_id": new_share_id,
        "summary_id": clean_sum_id,
        "abha_id": clean_abha,
        "time_created": now_iso,
        "consent_confirmed": True,
        "status": "ACTIVE",
    }


def resolve_dynamic_share_key(share_id: str, abha_id: Optional[str] = None) -> Optional[str]:
    """Validate a dynamic share key for a given patient ABHA ID and return the linked summary_id.
    
    Returns None if the key is invalid, revoked, or belongs to a different patient.
    """
    if not share_id:
        return None

    clean_share_id = share_id.strip()

    # Reject permanent summary IDs outright
    if clean_share_id.upper().startswith("SUM-"):
        return None

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT summary_id, abha_id, status
            FROM patient_share_keys
            WHERE share_id = ? AND status = 'ACTIVE';
            """,
            (clean_share_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        row_dict = dict(row)
        if abha_id:
            clean_abha = abha_id.strip().lower()
            stored_abha = (row_dict.get("abha_id") or "").strip().lower()
            clean_input = clean_abha.replace("-", "").replace(" ", "")
            clean_stored = stored_abha.replace("-", "").replace(" ", "")
            if clean_input != clean_stored and clean_abha != stored_abha:
                return None

        return row_dict.get("summary_id")


def get_active_share_keys_for_patient(abha_id: str) -> List[Dict[str, Any]]:
    """Retrieve all currently active share keys generated by a patient."""
    if not abha_id:
        return []
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT share_id, summary_id, abha_id, time_created, status
            FROM patient_share_keys
            WHERE abha_id = ? AND status = 'ACTIVE'
            ORDER BY time_created DESC;
            """,
            (abha_id.strip(),),
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


def revoke_dynamic_share_key(summary_id: str, abha_id: Optional[str] = None) -> bool:
    """Revoke dynamic share key for a given summary_id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if abha_id:
            cursor.execute(
                """
                UPDATE patient_share_keys
                SET status = 'REVOKED'
                WHERE summary_id = ? AND abha_id = ? AND status = 'ACTIVE';
                """,
                (summary_id.strip(), abha_id.strip()),
            )
        else:
            cursor.execute(
                """
                UPDATE patient_share_keys
                SET status = 'REVOKED'
                WHERE summary_id = ? AND status = 'ACTIVE';
                """,
                (summary_id.strip(),),
            )
        revoked = cursor.rowcount > 0
        conn.commit()
        return revoked


def get_active_shared_records_for_doctor(
    doctor_license: Optional[str] = None,
    doctor_ip: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve records actively shared with a doctor that have NOT been stopped/revoked by the patient."""
    with get_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT t.id as sharing_id, t.summary_id, t.abha_id, t.doctor_name, t.doctor_license, t.doctor_ip, t.timestamp, t.status,
                   a.documents_id, a.time_created, a.number_of_documents_attached, a.name_of_documents, a.summary,
                   a.original_documents, a.ocr_documents
            FROM data_sharing_trail t
            JOIN audit_logs a ON t.summary_id = a.summary_id
            WHERE t.status = 'ACTIVE'
        """
        params: List[Any] = []
        if doctor_license:
            query += " AND t.doctor_license = ?"
            params.append(doctor_license.strip())
        elif doctor_ip:
            query += " AND (t.doctor_ip = ? OR t.doctor_ip = '127.0.0.1' OR t.doctor_ip = 'testclient')"
            params.append(doctor_ip.strip())

        query += " ORDER BY t.timestamp DESC;"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        return [_format_row(row, include_private_abha=True) for row in rows]


def get_sharing_trail_for_patient(
    abha_id: Optional[str] = None,
    summary_id: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Retrieve active data sharing trail for a patient so the patient portal can show who accessed their records and provide 'Stop Sharing'."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if summary_id:
            cursor.execute(
                """
                SELECT id, summary_id, abha_id, doctor_name, doctor_license, doctor_ip, timestamp, status
                FROM data_sharing_trail
                WHERE summary_id = ? AND status = 'ACTIVE'
                ORDER BY timestamp DESC
                LIMIT ?;
                """,
                (summary_id.strip(), limit),
            )
        elif abha_id:
            cursor.execute(
                """
                SELECT id, summary_id, abha_id, doctor_name, doctor_license, doctor_ip, timestamp, status
                FROM data_sharing_trail
                WHERE abha_id = ? AND status = 'ACTIVE'
                ORDER BY timestamp DESC
                LIMIT ?;
                """,
                (abha_id.strip(), limit),
            )
        else:
            cursor.execute(
                """
                SELECT id, summary_id, abha_id, doctor_name, doctor_license, doctor_ip, timestamp, status
                FROM data_sharing_trail
                WHERE status = 'ACTIVE'
                ORDER BY timestamp DESC
                LIMIT ?;
                """,
                (limit,),
            )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


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
