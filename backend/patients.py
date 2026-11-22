import os
import re
import json
import time
import shutil
import smtplib
import random
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from email.message import EmailMessage

from dotenv import load_dotenv

# Ensure .env is explicitly loaded into environment
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    load_dotenv()

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

# =====================================================================
# TRIAL / DEMO PHONE NUMBERS
# User can enter their two trial phone numbers here (left empty by default)
# Example: "9876543210" or "919876543210"
# =====================================================================
TRIAL_PHONE_NUMBERS = [
    os.environ.get("TRIAL_PHONE_1", "").strip(),  # Trial Phone 1 (leave empty for user to fill)
    os.environ.get("TRIAL_PHONE_2", "").strip(),  # Trial Phone 2 (leave empty for user to fill)
]

def normalize_phone(phone: Optional[str]) -> str:
    """Normalize any phone string to a clean 10-digit Indian mobile number."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", str(phone))
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    return digits

# In-memory OTP store for phone numbers: { "9876543210": {"otp": "123456", "expires_at": 1700000000} }
phone_otps: Dict[str, Dict[str, Any]] = {}
email_otps: Dict[str, str] = {}

# Initialize twilio lazily
twilio_client = None
verify_sid = None

def init_twilio():
    global twilio_client, verify_sid
    if not twilio_client:
        try:
            from twilio.rest import Client
            account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
            auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
            verify_sid = os.environ.get("TWILIO_VERIFY_SID")
            if account_sid and auth_token:
                twilio_client = Client(account_sid, auth_token)
        except Exception as te:
            print("[Twilio Init Notice]", te)


def dispatch_fast2sms(target_phone: str, otp: str) -> Dict[str, Any]:
    """Send cellular SMS via Fast2SMS (Indian SMS Gateway with instant delivery)."""
    api_key = os.environ.get("FAST2SMS_API_KEY", "").strip()
    if not api_key:
        return {"sent": False, "reason": "FAST2SMS_API_KEY not configured"}

    url = "https://www.fast2sms.com/dev/bulkV2"
    
    # Try route 'otp' first, then fallback to route 'q'
    routes_to_try = [
        {
            "route": "otp",
            "variables_values": otp,
            "numbers": target_phone,
        },
        {
            "route": "q",
            "message": f"Your AyuLekha Health Verification OTP is {otp}. Valid for 10 minutes. Do not share with anyone.",
            "language": "english",
            "flash": 0,
            "numbers": target_phone,
        }
    ]

    last_error = ""
    for payload in routes_to_try:
        encoded_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=encoded_data,
            headers={
                "authorization": api_key,
                "Content-Type": "application/json",
                "User-Agent": "AyuLekha/2.0",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8")
                res_json = json.loads(body)
                success = res_json.get("return") is True
                if success:
                    print(f"[Fast2SMS Success] Route={payload['route']} | Response={res_json}")
                    return {"sent": True, "provider": "Fast2SMS", "response": res_json}
                else:
                    last_error = res_json.get("message") or str(res_json)
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            try:
                err_json = json.loads(err_body)
                msg = err_json.get("message") or err_body
                status_code = err_json.get("status_code")
                last_error = f"{msg} (Code {status_code})"
            except Exception:
                last_error = err_body or str(he)
            print(f"[Fast2SMS Route '{payload['route']}' Notice] {last_error}")
        except Exception as e:
            last_error = str(e)
            print(f"[Fast2SMS Dispatch Error] {e}")

    return {"sent": False, "error": last_error}


def dispatch_twilio(target_phone: str, otp: str) -> Dict[str, Any]:
    """Send cellular SMS via Twilio Verify or Twilio Messages."""
    init_twilio()
    if not twilio_client:
        return {"sent": False, "reason": "Twilio credentials not configured"}
    full_phone = f"+91{target_phone}"
    try:
        if verify_sid:
            v = twilio_client.verify.v2.services(verify_sid).verifications.create(to=full_phone, channel='sms')
            print(f"[Twilio Verify Success] Status={v.status} | SID={v.sid}")
            return {"sent": True, "status": v.status, "provider": "Twilio Verify"}
        else:
            from_num = os.environ.get("TWILIO_PHONE_NUMBER", "").strip()
            if from_num:
                formatted_from = from_num if from_num.startswith("+") else f"+91{from_num}"
                msg = twilio_client.messages.create(
                    body=f"Your AyuLekha Verification OTP is {otp}. Valid for 10 minutes.",
                    from_=formatted_from,
                    to=full_phone,
                )
                print(f"[Twilio SMS Success] SID={msg.sid}")
                return {"sent": True, "sid": msg.sid, "provider": "Twilio SMS"}
    except Exception as twe:
        code = getattr(twe, "code", None)
        msg = getattr(twe, "msg", str(twe))
        error_detail = f"{msg} (Twilio Code {code})" if code else str(twe)
        if code == 21608:
            error_detail = f"Twilio Trial Restriction: +91{target_phone} must be added as a Verified Caller ID in Twilio Console."
        elif code == 20003:
            error_detail = "Twilio Trial has expired or requires a purchased Twilio Virtual Number."
        print(f"[Twilio Error] {error_detail}")
        return {"sent": False, "error": error_detail, "code": code}

    return {"sent": False, "reason": "TWILIO_PHONE_NUMBER or TWILIO_VERIFY_SID missing"}

try:
    from sih_ocr.services.ocr_service import extract_document_text
    from sih_ocr.services.summarizer_service import generate_medical_summary, extract_markdown_tables
    OCR_AVAILABLE = True
except ImportError as e:
    print("OCR modules not available:", e)
    OCR_AVAILABLE = False

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PATIENTS_FILE = os.path.join(DATA_DIR, "patients.json")
CONSENTS_FILE = os.path.join(DATA_DIR, "consents.json")

def find_patient(value: str):
    """Find patient by ABHA ID, mobile phone number, or patient ID."""
    if not os.path.exists(PATIENTS_FILE) or not value:
        return None
    try:
        with open(PATIENTS_FILE, "r", encoding="utf-8-sig") as f:
            patients = json.load(f)
    except Exception:
        patients = []
        
    clean_val = str(value).strip().lower()
    norm_phone = normalize_phone(clean_val)
    
    for p in patients:
        p_abha = str(p.get("abha", "")).strip().lower()
        p_mobile = normalize_phone(str(p.get("mobile", "") or p.get("phone", "")))
        p_id = str(p.get("id", "")).strip().lower()
        
        if clean_val and (p_abha == clean_val or p_id == clean_val):
            return p
        if norm_phone and p_mobile == norm_phone:
            return p
    return None

class VerifyPatientReq(BaseModel):
    value: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CheckAbhaReq(BaseModel):
    abha: str

@router.post("/api/patients/check-abha")
def check_abha(req: CheckAbhaReq):
    """Check if an ABHA ID is already registered or available."""
    clean_abha = req.abha.strip()
    if not clean_abha:
        raise HTTPException(status_code=400, detail="ABHA ID is required")
    patient = find_patient(clean_abha)
    if patient:
        return {
            "exists": True,
            "message": f"ABHA ID '{clean_abha}' is already available / registered.",
            "patient": patient,
            "medicalHistory": patient.get("medicalHistory", [])
        }
    return {
        "exists": False,
        "message": f"ABHA ID '{clean_abha}' is available for new registration."
    }

@router.post("/api/patients/verify")
def verify_patient(req: VerifyPatientReq):
    search_val = req.value or req.phone
    if not search_val:
        raise HTTPException(status_code=400, detail="ABHA ID or mobile number is required")
    patient = find_patient(search_val)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return {"success": True, "message": "Patient verified successfully", "patient": patient}

@router.post("/api/patients/send-phone-otp")
@router.post("/api/patients/send-otp")
def send_otp(req: VerifyPatientReq):
    """Send OTP directly to the patient's phone number via SMS or terminal dispatch.
    
    Supports both existing patient logins and new patient registrations.
    """
    raw_input = req.phone or req.value

    # If email is specifically sent and no phone input was provided
    if req.email and not raw_input:
        otp = str(random.randint(100000, 999999))
        email_otps[req.email.lower()] = otp
        sender = os.environ.get("EMAIL_USER")
        password = os.environ.get("EMAIL_APP_PASSWORD")
        if sender and password:
            try:
                msg = EmailMessage()
                msg.set_content(f"Your AyuLekha Verification OTP is: {otp}\n\nThis OTP will expire in 10 minutes.")
                msg["Subject"] = "AyuLekha Verification OTP"
                msg["From"] = sender
                msg["To"] = req.email
                with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                    smtp.login(sender, password)
                    smtp.send_message(msg)
                print(f"[OTP] Email OTP sent to {req.email}")
            except Exception as e:
                print(f"[OTP] Email send failed: {e}")
        return {"success": True, "message": "OTP sent successfully to email", "dev_otp": otp}

    if not raw_input:
        raise HTTPException(status_code=400, detail="Mobile phone number or ABHA ID is required")

    # Determine whether raw_input is ABHA ID or phone number
    target_phone = normalize_phone(raw_input)
    patient = find_patient(raw_input)

    # If it was an ABHA ID of an existing patient, resolve their linked phone
    if patient and not target_phone:
        target_phone = normalize_phone(patient.get("mobile") or patient.get("phone"))

    if not target_phone or len(target_phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile phone number.")

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    phone_otps[target_phone] = {
        "otp": otp,
        "expires_at": time.time() + 600,  # 10 minutes expiry
    }

    # Check if this phone number is a configured trial number
    is_trial = any(normalize_phone(num) == target_phone for num in TRIAL_PHONE_NUMBERS if num)

    # Attempt cellular SMS dispatch
    sms_sent = False
    sms_provider = "Console / Trial Gateway"
    delivery_notes = []

    # 1. Attempt Fast2SMS (Instant Indian SMS Gateway)
    if os.environ.get("FAST2SMS_API_KEY"):
        res = dispatch_fast2sms(target_phone, otp)
        if res.get("sent"):
            sms_sent = True
            sms_provider = "Fast2SMS (Cellular SMS Delivered)"
        else:
            delivery_notes.append(f"Fast2SMS: {res.get('error', 'Blocked by provider')}")

    # 2. Attempt Twilio if Fast2SMS not used or failed
    if not sms_sent and (os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN")):
        res = dispatch_twilio(target_phone, otp)
        if res.get("sent"):
            sms_sent = True
            sms_provider = f"Twilio ({res.get('provider', 'Cellular SMS Delivered')})"
        else:
            delivery_notes.append(f"Twilio: {res.get('error', 'Blocked by provider')}")

    # Display prominent terminal log for easy testing & trials
    print("\n" + "=" * 72)
    print(" [AYULEKHA PHONE OTP GATEWAY]")
    print(f" Recipient Phone Number : +91 {target_phone} {'(Configured Trial Number)' if is_trial else ''}")
    print(f" 6-Digit OTP Code       : {otp}")
    print(" Valid Duration         : 10 Minutes")
    print(f" Cellular SMS Status    : {sms_provider}")
    if not sms_sent and delivery_notes:
        print(" Provider Status Notes  :")
        for note in delivery_notes:
            print(f"   • {note}")
        print(" Instant Bypass / Test  : You can enter the OTP above or use test code '123456'.")
    print("=" * 72 + "\n", flush=True)

    masked_phone = f"+91 ******{target_phone[-4:]}"
    return {
        "success": True,
        "message": f"OTP generated for {masked_phone}",
        "phone": target_phone,
        "dev_otp": otp,
        "is_trial": is_trial,
        "sms_sent": sms_sent,
        "sms_provider": sms_provider,
        "delivery_notes": delivery_notes,
    }

class VerifyOtpReq(BaseModel):
    value: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    otp: str

@router.post("/api/patients/verify-phone-otp")
@router.post("/api/patients/verify-otp")
def verify_phone_otp(req: VerifyOtpReq):
    """Verify 6-digit phone OTP for both login and new registration."""
    otp_code = (req.otp or "").strip()
    if not otp_code:
        raise HTTPException(status_code=400, detail="OTP is required")

    raw_phone = req.phone or req.value
    target_phone = normalize_phone(raw_phone)

    # Check email OTP if email is provided
    if req.email and not target_phone:
        email_key = req.email.lower()
        if otp_code == "123456" or (email_key in email_otps and email_otps[email_key] == otp_code):
            email_otps.pop(email_key, None)
            return {"success": True, "message": "Email verified successfully"}
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    if not target_phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    # Validate OTP (Accept test bypass 123456, in-memory generated OTP, or Twilio Verify check)
    stored = phone_otps.get(target_phone)
    is_valid = False

    if otp_code == "123456":
        is_valid = True
    elif stored and stored["otp"] == otp_code and stored["expires_at"] > time.time():
        is_valid = True
        phone_otps.pop(target_phone, None)
    else:
        init_twilio()
        if twilio_client and verify_sid:
            try:
                check = twilio_client.verify.v2.services(verify_sid).verification_checks.create(to=f"+91{target_phone}", code=otp_code)
                if check.status == 'approved':
                    is_valid = True
                    phone_otps.pop(target_phone, None)
            except Exception as te:
                print(f"[Twilio Verify Check Note] {te}")

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP code. Use bypass 123456 for testing.")

    # Check if patient already exists with this phone number
    existing_patient = find_patient(target_phone)

    if existing_patient:
        print(f"[AUTH] Existing patient logged in via Phone OTP: {existing_patient.get('name')} (+91 {target_phone})")
        return {
            "success": True,
            "verified": True,
            "isNewPatient": False,
            "message": f"Welcome back, {existing_patient.get('name', 'Patient')}!",
            "patient": existing_patient,
            "phone": target_phone,
        }
    else:
        print(f"[AUTH] Phone verified for new citizen registration: +91 {target_phone}")
        return {
            "success": True,
            "verified": True,
            "isNewPatient": True,
            "message": "Phone number verified. Please enter your ABHA ID to complete registration.",
            "phone": target_phone,
        }

@router.post("/api/patients/verify-email-otp")
def verify_email_otp(req: VerifyOtpReq):
    if not req.email or not req.otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    email_key = req.email.lower()
    if req.otp == "123456" or (email_key in email_otps and email_otps[email_key] == req.otp.strip()):
        email_otps.pop(email_key, None)
        return {"success": True, "message": "Email verified successfully"}
    raise HTTPException(status_code=401, detail="Invalid OTP")

class RegisterPatientReq(BaseModel):
    abha: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = ""
    name: Optional[str] = "New Patient"
    age: Optional[int] = 25
    bloodGroup: Optional[str] = "O+"
    allergies: Optional[str] = "None"
    gender: Optional[str] = "Male"

@router.post("/api/patients/register")
def register_patient(req: RegisterPatientReq):
    """Register first-time patient after verifying phone.
    
    If ABHA ID is already available/registered, rejects duplicate and instructs to log in.
    """
    clean_abha = req.abha.strip()
    if not clean_abha:
        raise HTTPException(status_code=400, detail="ABHA ID is required for registration.")

    # Compulsory requirement: If ABHA ID is already available, inform the patient
    existing_patient = find_patient(clean_abha)
    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail=f"ABHA ID is already available. A patient with ABHA ID '{clean_abha}' is already registered. Please log in instead.",
        )

    phone_num = normalize_phone(req.phone or req.mobile or "")
    
    new_patient = {
        "id": f"P{int(datetime.now().timestamp()) % 100000:05d}",
        "name": (req.name or "New Patient").strip(),
        "mobile": phone_num,
        "phone": phone_num,
        "abha": clean_abha,
        "email": (req.email or "").strip(),
        "gender": req.gender or "Male",
        "age": req.age if req.age else 25,
        "bloodGroup": req.bloodGroup or "O+",
        "allergies": (req.allergies or "None").strip(),
        "registeredAt": datetime.now(timezone.utc).isoformat(),
        "medicalHistory": [],
    }

    patients = []
    if os.path.exists(PATIENTS_FILE):
        try:
            with open(PATIENTS_FILE, "r", encoding="utf-8-sig") as f:
                patients = json.load(f)
        except Exception:
            patients = []

    patients.append(new_patient)
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(PATIENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(patients, f, indent=2)

    print(f"[REGISTRATION] New patient successfully registered: {new_patient['name']} | ABHA: {clean_abha} | Mobile: {phone_num}")

    return {
        "success": True,
        "message": "Patient registered successfully",
        "patient": new_patient,
        "medicalHistory": [],
    }

class ConsentReq(BaseModel):
    patientId: str
    consent: bool

@router.post("/api/patients/consent")
def save_consent(req: ConsentReq):
    if not req.patientId:
        raise HTTPException(status_code=400, detail="Patient ID is required")
    
    consents = []
    if os.path.exists(CONSENTS_FILE):
        with open(CONSENTS_FILE, "r") as f:
            try:
                consents = json.load(f)
            except:
                pass
            
    record = {"patientId": req.patientId, "consent": req.consent, "timestamp": datetime.utcnow().isoformat() + "Z"}
    consents.append(record)
    
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CONSENTS_FILE, "w") as f:
        json.dump(consents, f, indent=2)
        
    return {"success": True, "message": "Clinical consent recorded successfully", "consent": record}

class StoryReq(BaseModel):
    patientId: str
    story: str
    symptoms: Optional[list] = []

@router.post("/api/patients/story")
def save_story(req: StoryReq):
    if not req.patientId or not req.story:
        raise HTTPException(status_code=400, detail="Patient ID and story are required")
        
    patients = []
    if os.path.exists(PATIENTS_FILE):
        with open(PATIENTS_FILE, "r") as f:
            patients = json.load(f)
            
    updated = False
    for p in patients:
        if p.get("id") == req.patientId:
            p["story"] = req.story
            p["symptoms"] = req.symptoms
            updated = True
            break
            
    if updated:
        with open(PATIENTS_FILE, "w") as f:
            json.dump(patients, f, indent=2)

    try:
        import database
        database.insert_audit_log(
            number_of_documents_attached=0,
            name_of_documents=["Patient Clinical Story"],
            summary=req.story,
        )
    except Exception as dbe:
        print("Audit log insert error in save_story:", dbe)

    return {"success": True, "message": "Clinical story recorded successfully", "story": {"patientId": req.patientId, "story": req.story, "symptoms": req.symptoms, "status": "recorded"}}

@router.post("/api/patients/{patient_id}/records")
async def upload_patient_records(
    patient_id: str,
    document_type: str = Form("auto"),
    summary_id: Optional[str] = Form(None),
    records: List[UploadFile] = File(...),
):
    patient_dir = os.path.join(DATA_DIR, "documents", patient_id)
    os.makedirs(patient_dir, exist_ok=True)
    metadata_file = os.path.join(patient_dir, "metadata.json")
    
    metadata = []
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
        except Exception as e:
            print("Error reading metadata:", e)
    
    results = []
    original_docs_for_audit = []
    ocr_docs_for_audit = []

    for idx, record in enumerate(records):
        original_filename = record.filename or f"document_{idx+1}.pdf"
        extension = Path(original_filename).suffix.lower().lstrip(".")
        content = await record.read()
        
        if not content:
            continue
            
        file_path = os.path.join(patient_dir, original_filename)
        with open(file_path, "wb") as f:
            f.write(content)

        download_url = f"/api/patients/{patient_id}/records/download/{original_filename}"
        now_iso = datetime.utcnow().isoformat() + "Z"
        doc_uid = f"DOC-{int(datetime.utcnow().timestamp())}-{idx+1}"

        original_docs_for_audit.append({
            "id": doc_uid,
            "filename": original_filename,
            "url": download_url,
            "path": download_url,
            "extension": extension,
            "size_bytes": len(content),
            "document_type": document_type,
            "timestamp": now_iso,
        })
            
        try:
            if OCR_AVAILABLE:
                normalized_doc_type = "printed" if document_type in ("lab_report", "printed") else ("prescription" if document_type == "prescription" else "auto")
                digitized_text, page_count, engine = extract_document_text(
                    content, extension, language_hint="en", document_type=normalized_doc_type
                )
                summary = generate_medical_summary(digitized_text, page_count, normalized_doc_type)
                tables = extract_markdown_tables(summary)
            else:
                digitized_text = f"Original document '{original_filename}' archived ({len(content)} bytes)."
                page_count = 1
                engine = "Direct Archive"
                summary = f"Document **{original_filename}** uploaded and stored in clinical repository."
                tables = []
            
            doc_record = {
                "id": doc_uid,
                "filename": original_filename,
                "timestamp": now_iso,
                "page_count": page_count,
                "engine": engine,
                "raw_ocr_text": digitized_text,
                "summary": summary,
                "tables": tables,
                "path": download_url
            }
            metadata.append(doc_record)
            results.append(doc_record)

            ocr_docs_for_audit.append({
                "id": f"OCR-{doc_uid}",
                "filename": original_filename,
                "engine": engine,
                "page_count": page_count,
                "ocr_text": digitized_text or summary,
                "structured_summary": summary,
                "tables": tables,
                "timestamp": now_iso,
            })
        except Exception as e:
            print(f"OCR Error processing {original_filename}:", e)
            fallback_summary = f"Document **{original_filename}** archived. (OCR parse note: {str(e)})"
            doc_record = {
                "id": doc_uid,
                "filename": original_filename,
                "timestamp": now_iso,
                "engine": "Archive Fallback",
                "error": str(e),
                "summary": fallback_summary,
                "path": download_url
            }
            metadata.append(doc_record)
            results.append(doc_record)

            ocr_docs_for_audit.append({
                "id": f"OCR-{doc_uid}",
                "filename": original_filename,
                "engine": "Archive Fallback",
                "page_count": 1,
                "ocr_text": fallback_summary,
                "structured_summary": fallback_summary,
                "tables": [],
                "timestamp": now_iso,
            })

    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    audit_log_entry = None
    try:
        import database
        summary_texts = [r.get("summary", "") for r in results if r.get("summary")]
        combined_summary = "\n\n---\n\n".join(summary_texts) if summary_texts else f"{len(original_docs_for_audit)} medical document(s) uploaded and indexed."
        audit_log_entry = database.attach_documents_to_audit_log(
            summary_id=summary_id,
            original_documents=original_docs_for_audit,
            ocr_documents=ocr_docs_for_audit,
            fallback_summary=combined_summary,
            abha_id=patient_id,
        )
    except Exception as dbe:
        print("Database audit log attach error in patients.py:", dbe)

    return {
        "success": True,
        "message": f"{len(results)} records processed.",
        "results": results,
        "summary_id": audit_log_entry.get("summary_id") if audit_log_entry else summary_id,
        "audit_log": audit_log_entry,
    }

@router.get("/api/patients/{patient_id}/records")
def get_patient_records(patient_id: str):
    patient_dir = os.path.join(DATA_DIR, "documents", patient_id)
    metadata_file = os.path.join(patient_dir, "metadata.json")
    if not os.path.exists(metadata_file):
        return {"records": []}
    
    try:
        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        return {"records": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading records")

from fastapi.responses import FileResponse
@router.get("/api/patients/{patient_id}/records/download/{filename}")
def download_patient_record(patient_id: str, filename: str):
    file_path = os.path.join(DATA_DIR, "documents", patient_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@router.get("/api/patients/queue")
def get_patient_queue():
    patients = []
    if os.path.exists(PATIENTS_FILE):
        try:
            with open(PATIENTS_FILE, "r") as f:
                patients = json.load(f)
        except Exception as e:
            print("Error reading patients:", e)
            
    # Format patients for the queue
    queue = []
    for idx, p in enumerate(patients):
        status = 'in-progress' if idx == 0 else 'waiting'
        queue.append({
            'token': f"B-{100+idx}",
            'id': p.get('id', ''),
            'name': p.get('name', 'Unknown'),
            'age': f"{p.get('age') or '??'}y {(p.get('gender') or 'U')[0].upper()}",
            'condition': 'Triage complete',
            'status': status,
            'redFlag': False,
            'bloodGroup': p.get('bloodGroup', ''),
            'allergies': p.get('allergies', ''),
            'abha': p.get('abha', ''),
            'story': p.get('story', ''),
            'symptoms': p.get('symptoms', [])
        })
    return {"queue": queue}
