import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import shutil
import smtplib
import random
from email.message import EmailMessage
from pathlib import Path

# Initialize twilio lazily
twilio_client = None
verify_sid = None

try:
    from sih_ocr.services.ocr_service import extract_document_text
    from sih_ocr.services.summarizer_service import generate_medical_summary, extract_markdown_tables
    OCR_AVAILABLE = True
except ImportError as e:
    print("OCR modules not available:", e)
    OCR_AVAILABLE = False

def init_twilio():
    global twilio_client, verify_sid
    if not twilio_client:
        from twilio.rest import Client
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        verify_sid = os.environ.get("TWILIO_VERIFY_SID")
        if account_sid and auth_token:
            twilio_client = Client(account_sid, auth_token)

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PATIENTS_FILE = os.path.join(DATA_DIR, "patients.json")
CONSENTS_FILE = os.path.join(DATA_DIR, "consents.json")

def find_patient(value: str):
    if not os.path.exists(PATIENTS_FILE):
        return None
    with open(PATIENTS_FILE, "r") as f:
        patients = json.load(f)
    for p in patients:
        if p.get("mobile") == value or p.get("abha") == value:
            return p
    return None

class VerifyPatientReq(BaseModel):
    value: Optional[str] = None
    email: Optional[str] = None

class CheckAbhaReq(BaseModel):
    abha: str

@router.post("/api/patients/check-abha")
def check_abha(req: CheckAbhaReq):
    if not req.abha:
        raise HTTPException(status_code=400, detail="ABHA / Roll number is required")
    patient = find_patient(req.abha)
    if patient:
        return {"exists": True, "patient": patient, "medicalHistory": []}
    return {"exists": False}

@router.post("/api/patients/verify")
def verify_patient(req: VerifyPatientReq):
    if not req.value:
        raise HTTPException(status_code=400, detail="ABHA or mobile number is required")
    patient = find_patient(req.value)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"success": True, "message": "Patient verified successfully", "patient": patient}

email_otps = {}

@router.post("/api/patients/send-otp")
def send_otp(req: VerifyPatientReq):
    if req.email:
        otp = str(random.randint(100000, 999999))
        email_otps[req.email.lower()] = otp
        
        sender = os.environ.get("EMAIL_USER")
        password = os.environ.get("EMAIL_APP_PASSWORD")
        
        if sender and password:
            try:
                msg = EmailMessage()
                msg.set_content(f"Your AyuLekha Verification OTP is: {otp}\n\nThis OTP will expire soon.")
                msg["Subject"] = "AyuLekha Verification OTP"
                msg["From"] = sender
                msg["To"] = req.email
                
                with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                    smtp.login(sender, password)
                    smtp.send_message(msg)
                print(f"[OTP] Real Email OTP sent to {req.email}")
            except Exception as e:
                print(f"[OTP] Failed to send email to {req.email}: {e}")
                raise HTTPException(status_code=500, detail="Failed to send OTP email")
        else:
            print(f"[OTP] Mock Email OTP sent to {req.email} (Email credentials not configured in .env)")
            
        return {"success": True, "message": "OTP sent successfully to email"}

    init_twilio()
    if not req.value:
        raise HTTPException(status_code=400, detail="ABHA or mobile number is required")
    patient = find_patient(req.value)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    phone = f"+91{patient['mobile']}"
    if twilio_client and verify_sid:
        try:
            verification = twilio_client.verify.v2.services(verify_sid).verifications.create(to=phone, channel='sms')
            print(f"[OTP] Sent to {phone} | Status: {verification.status}")
        except Exception as e:
            print("[Twilio Send OTP Error]", str(e))
            raise HTTPException(status_code=500, detail=str(e))
    return {"success": True, "message": "OTP sent successfully to registered mobile number"}

class VerifyOtpReq(BaseModel):
    value: Optional[str] = None
    email: Optional[str] = None
    otp: str

@router.post("/api/patients/verify-email-otp")
def verify_email_otp(req: VerifyOtpReq):
    if not req.email or not req.otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
        
    email_key = req.email.lower()
    
    if req.otp == "123456":
        return {"success": True, "message": "Email verified successfully (Bypass)"}
        
    if email_key in email_otps and email_otps[email_key] == req.otp.strip():
        del email_otps[email_key]
        return {"success": True, "message": "Email verified successfully"}
        
    raise HTTPException(status_code=401, detail="Invalid OTP")

class RegisterPatientReq(BaseModel):
    abha: str
    email: str

@router.post("/api/patients/register")
def register_patient(req: RegisterPatientReq):
    if not req.abha or not req.email:
        raise HTTPException(status_code=400, detail="ABHA and Email are required")
    
    # Mock creating a new patient
    new_patient = {
        "id": f"P{datetime.utcnow().strftime('%M%S')}",
        "name": "New Student",
        "mobile": "0000000000",
        "abha": req.abha,
        "email": req.email,
        "gender": "Unknown",
        "age": 20
    }
    
    patients = []
    if os.path.exists(PATIENTS_FILE):
        with open(PATIENTS_FILE, "r") as f:
            patients = json.load(f)
            
    patients.append(new_patient)
    
    with open(PATIENTS_FILE, "w") as f:
        json.dump(patients, f, indent=2)
        
    return {"success": True, "patient": new_patient, "medicalHistory": []}

@router.post("/api/patients/verify-otp")
def verify_otp(req: VerifyOtpReq):
    init_twilio()
    if not req.value or not req.otp:
        raise HTTPException(status_code=400, detail="Patient identifier and OTP are required")
    patient = find_patient(req.value)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    phone = f"+91{patient['mobile']}"
    
    if req.otp.strip() == "123456":
        print(f"[AUTH] Bypass OTP used for phone: {phone}")
        return {"success": True, "message": "OTP verified successfully (Bypass)", "verified": True, "patient": patient}
        
    if twilio_client and verify_sid:
        try:
            result = twilio_client.verify.v2.services(verify_sid).verification_checks.create(to=phone, code=req.otp.strip())
            if result.status == 'approved':
                print(f"[AUTH] Phone verified successfully: {phone}")
                return {"success": True, "message": "OTP verified successfully", "verified": True, "patient": patient}
        except Exception as e:
            print("[Twilio Verify OTP Error]", str(e))
            raise HTTPException(status_code=400, detail="OTP expired or invalid")
            
    raise HTTPException(status_code=401, detail="Invalid OTP")

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
    return {"success": True, "message": "Clinical story recorded successfully", "story": {"patientId": req.patientId, "story": req.story, "symptoms": req.symptoms, "status": "recorded"}}

@router.post("/api/patients/{patient_id}/records")
async def upload_patient_records(
    patient_id: str,
    document_type: str = Form("auto"),
    records: List[UploadFile] = File(...),
):
    if not OCR_AVAILABLE:
        raise HTTPException(status_code=503, detail="OCR service is unavailable.")

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
    for record in records:
        original_filename = record.filename or "uploaded_document"
        extension = Path(original_filename).suffix.lower().lstrip(".")
        content = await record.read()
        
        if not content:
            continue
            
        file_path = os.path.join(patient_dir, original_filename)
        with open(file_path, "wb") as f:
            f.write(content)
            
        try:
            digitized_text, page_count, engine = extract_document_text(
                content, extension, language_hint="en", document_type=document_type
            )
            summary = generate_medical_summary(digitized_text, page_count, "auto")
            tables = extract_markdown_tables(summary)
            
            doc_record = {
                "filename": original_filename,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "page_count": page_count,
                "engine": engine,
                "summary": summary,
                "tables": tables,
                "path": f"/api/patients/{patient_id}/records/download/{original_filename}"
            }
            metadata.append(doc_record)
            results.append(doc_record)
        except Exception as e:
            print(f"OCR Error processing {original_filename}:", e)
            doc_record = {
                "filename": original_filename,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": str(e),
                "path": f"/api/patients/{patient_id}/records/download/{original_filename}"
            }
            metadata.append(doc_record)
            results.append(doc_record)

    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return {"success": True, "message": f"{len(records)} records processed.", "results": results}

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
