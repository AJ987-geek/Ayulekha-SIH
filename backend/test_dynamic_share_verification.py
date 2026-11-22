# pyright: reportMissingImports=false
# flake8: noqa: E402, F401
import os
import sys
import uuid
import json
from pathlib import Path
from unittest.mock import MagicMock
from fastapi import HTTPException

# Add backend directory to sys.path so backend modules can be imported
backend_path = Path(r"e:\AyuLekha-2\Ayulekha-SIH\backend").resolve()
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

try:
    from database import (  # type: ignore
        init_db,
        insert_audit_log,
        create_dynamic_share_key,
        resolve_dynamic_share_key,
        get_active_share_keys_for_patient,
        revoke_dynamic_share_key,
    )
    from doctor import request_patient_access, DoctorAccessPayload  # type: ignore
except ImportError:
    import importlib.util

    def _import_from_file(module_name: str, file_path: Path):
        spec = importlib.util.spec_from_file_location(module_name, str(file_path))
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot load module {module_name} from {file_path}")
        mod = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = mod
        spec.loader.exec_module(mod)
        return mod

    db_mod = _import_from_file("database", backend_path / "database.py")
    doc_mod = _import_from_file("doctor", backend_path / "doctor.py")

    init_db = db_mod.init_db
    insert_audit_log = db_mod.insert_audit_log
    create_dynamic_share_key = db_mod.create_dynamic_share_key
    resolve_dynamic_share_key = db_mod.resolve_dynamic_share_key
    get_active_share_keys_for_patient = db_mod.get_active_share_keys_for_patient
    revoke_dynamic_share_key = db_mod.revoke_dynamic_share_key
    request_patient_access = doc_mod.request_patient_access
    DoctorAccessPayload = doc_mod.DoctorAccessPayload


def run_tests():
    init_db()
    print("DB initialized.")

    # 1. Create a dummy summary audit log
    test_summary_id = f"SUM-{uuid.uuid4().hex[:8].upper()}"
    test_abha = "91-4820-9921-3041"
    insert_audit_log(
        summary_id=test_summary_id,
        summary=json.dumps({"chief_complaint": "Headache", "duration": "2 days"}),
        abha_id=test_abha,
    )
    print(f"Created test summary: {test_summary_id}")

    # 2. Test rejection of permanent SUM-* key in resolve_dynamic_share_key
    res = resolve_dynamic_share_key(test_summary_id, test_abha)
    assert res is None, "Permanent summary_id must not resolve directly!"
    print("PASS: Permanent summary_id is rejected by resolver.")

    # 3. Test generate share ID
    share_res = create_dynamic_share_key(test_summary_id, test_abha, consent_confirmed=True)
    assert "share_id" in share_res
    share_id = share_res["share_id"]
    assert share_id.startswith("SHARE-"), f"Expected SHARE- prefix, got {share_id}"
    print(f"PASS: Dynamic share key created: {share_id}")

    # 4. Resolve the dynamic share key
    resolved_sum_id = resolve_dynamic_share_key(share_id, test_abha)
    assert resolved_sum_id == test_summary_id, f"Expected {test_summary_id}, got {resolved_sum_id}"
    print(f"PASS: Dynamic share key {share_id} resolved correctly to {resolved_sum_id}")

    # 5. Fetch active share keys
    active_keys = get_active_share_keys_for_patient(test_abha)
    matching = [k for k in active_keys if k["share_id"] == share_id]
    assert len(matching) == 1, "Active share key must appear in patient's active keys list"
    print(f"PASS: Active key present in patient share keys: {matching[0]['share_id']}")

    # 6. Test Doctor Access with permanent SUM-* (must fail HTTP 400)
    mock_request = MagicMock()
    mock_request.client.host = "127.0.0.1"

    req_invalid = DoctorAccessPayload(
        abha_id=test_abha,
        share_id=test_summary_id,
        license_number="12345",
        doctor_name="Dr. S. Sharma",
    )
    try:
        request_patient_access(req_invalid, mock_request)
        assert False, "Doctor access with SUM-* should have raised HTTPException 400!"
    except HTTPException as e:
        assert "Permanent Summary IDs (SUM-*) cannot be used" in e.detail
        print(f"PASS: Doctor access rejected permanent SUM-* id with message: {e.detail}")

    # Test Doctor Access with valid SHARE-* key
    req_valid = DoctorAccessPayload(
        abha_id=test_abha,
        share_id=share_id,
        license_number="12345",
        doctor_name="Dr. S. Sharma",
    )
    doc_res = request_patient_access(req_valid, mock_request)
    assert doc_res.get("success") is True, f"Doctor access failed: {doc_res}"
    assert doc_res.get("summary_id") == test_summary_id
    print("PASS: Doctor access succeeded with dynamic SHARE-* id!")

    # 7. Generate a new key and verify the previous one is superseded
    share_res2 = create_dynamic_share_key(test_summary_id, test_abha, consent_confirmed=True)
    share_id_2 = share_res2["share_id"]
    assert share_id_2 != share_id

    resolved_old = resolve_dynamic_share_key(share_id, test_abha)
    assert resolved_old is None, "Old dynamic share key should have been superseded/revoked!"
    resolved_new = resolve_dynamic_share_key(share_id_2, test_abha)
    assert resolved_new == test_summary_id, "New dynamic share key should resolve successfully!"
    print(f"PASS: New dynamic key {share_id_2} superseded {share_id}.")

    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀")


if __name__ == "__main__":
    run_tests()
