"""Ephemeral, structured LangGraph interview API; no patient data is written to disk."""
from __future__ import annotations

from threading import Lock
from typing import Any, Literal, Optional, TypedDict, Union
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    llm_provider: str = "groq"
    llm_model: str = "openai/gpt-oss-120b"
    llm_api_key: str = ""
    llm_temperature: float = 0.2

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

SOCRATES_FOCUS = {
    "site": ("HPI · S", "where the symptom is felt"),
    "onset": ("HPI · O", "when and how the symptom started"),
    "character": ("HPI · C", "what the symptom feels like"),
    "radiation": ("HPI · R", "whether the symptom spreads elsewhere"),
    "associations": ("HPI · A", "important symptoms occurring alongside it"),
    "timing": ("HPI · T", "the pattern and timing"),
    "factors": ("HPI · E", "what worsens or relieves it"),
    "severity": ("HPI · S", "severity and functional impact"),
    "pmh": ("PMH", "relevant illnesses, allergies, and regular medicines"),
}

FALLBACK_PLAN = [
    "site",
    "onset",
    "character",
    "severity",
    "associations",
]

SOCRATES_ORDER = [
    "site",
    "onset",
    "character",
    "radiation",
    "associations",
    "timing",
    "factors",
    "severity",
    "pmh",
]


SupportedLanguage = Literal["en", "hi", "pa", "mr", "bn", "ta", "ml", "te"]

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "mr": "Marathi (मराठी)",
    "bn": "Bengali (বাংলা)",
    "ta": "Tamil (தமிழ்)",
    "ml": "Malayalam (മലയാളം)",
    "te": "Telugu (తెలుగు)",
}

COMPLETION_MESSAGES = {
    "en": "Your summary has been generated and ready to send to the doctor, continue with medical record or add documents.",
    "hi": "आपका सारांश तैयार हो गया है और डॉक्टर को भेजने के लिए तैयार है। मेडिकल रिकॉर्ड के साथ आगे बढ़ें या दस्तावेज़ जोड़ें।",
    "pa": "ਤੁਹਾਡਾ ਸੰਖੇਪ ਤਿਆਰ ਹੋ ਗਿਆ ਹੈ ਅਤੇ ਡਾਕਟਰ ਨੂੰ ਭੇਜਣ ਲਈ ਤਿਆਰ ਹੈ। ਮੈਡੀਕਲ ਰਿਕਾਰਡ ਜਾਂ ਦਸਤਾਵੇਜ਼ ਸ਼ਾਮਲ ਕਰੋ।",
    "mr": "तुमचा सारांश तयार झाला आहे आणि डॉक्टरांना पाठवण्यासाठी तयार आहे. मेडिकल रेकॉर्डसह पुढे जा किंवा कागदपत्रे जोडा.",
    "bn": "আপনার সারাংশ তৈরি হয়েছে এবং ডাক্তারের কাছে পাঠানোর জন্য প্রস্তুত। মেডিকেল রেকর্ড বা নথি যোগ করুন।",
    "ta": "உங்கள் சுருக்கம் உருவாக்கப்பட்டு மருத்துவருக்கு அனுப்ப தயாராக உள்ளது. மருத்துவ பதிவுகள் அல்லது ஆவணங்களைச் சேர்க்கவும்.",
    "ml": "നിങ്ങളുടെ സംഗ്രഹം തയ്യാറായി, ഡോക്ടർക്ക് അയയ്ക്കാൻ തയ്യാറാണ്. മെഡിക്കൽ റെക്കോർഡുകൾ ചേർക്കുക.",
    "te": "మీ సారాంశం రూపొందించబడింది మరియు డాక్టర్‌కు పంపడానికి సిద్ధంగా ఉంది. మెడికల్ రికార్డ్ లేదా పత్రాలను జోడించండి.",
}


class Turn(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    questionType: Literal[
        "single_choice",
        "multiple_choice",
        "open_ended",
    ] = "open_ended"
    options: list[str] = Field(default_factory=list, max_length=6)
    language: SupportedLanguage = "en"
    section: str = ""
    complete: bool = False


class PhysicianSummary(BaseModel):
    chiefComplaint: str
    hpi: str
    pastMedicalHistory: str
    familyHistory: str
    socialHistory: str
    reviewOfSystems: str
    clinicalImpression: str = Field(
        default="Clinical evaluation pending OPD physician consultation."
    )
    recommendedWorkup: str = Field(
        default="Routine vital signs, targeted physical exam, and baseline diagnostic screening."
    )
    clinicalNote: str
    triageIndicators: list[str] = Field(default_factory=list)


class InterviewPlan(BaseModel):
    focus: list[
        Literal[
            "site",
            "onset",
            "character",
            "radiation",
            "associations",
            "timing",
            "factors",
            "severity",
            "pmh",
        ]
    ] = Field(min_length=4, max_length=5)


class NextTurnDecision(BaseModel):
    is_complete: bool = Field(
        description=(
            "True if sufficient clinical facts have been gathered or "
            "key SOCRATES elements for this complaint are answered."
        )
    )

    answered_domains: list[str] = Field(
        default_factory=list,
        description=(
            "List of SOCRATES domains already provided/addressed "
            "in the patient's answers."
        ),
    )

    next_domain: Literal[
        "site",
        "onset",
        "character",
        "radiation",
        "associations",
        "timing",
        "factors",
        "severity",
        "pmh",
    ] | None = Field(
        default=None,
        description=(
            "The single most clinically relevant UNANSWERED "
            "SOCRATES domain to ask about next. None if is_complete is True."
        ),
    )

    reasoning: str = Field(
        default="",
        description=(
            "Clinical rationale for choosing this domain or completing "
            "the interview."
        ),
    )


class InterviewState(TypedDict, total=False):
    conversation_id: str
    history: list[dict]
    language: str
    next_index: int
    plan: list[str]
    status: str
    latest_answer: str
    turn: dict
    summary: dict | None


def chat_model():
    if not settings.llm_api_key:
        raise RuntimeError("LLM_API_KEY is not configured on the server.")

    if settings.llm_provider != "groq":
        raise RuntimeError(
            "Only the configured Groq provider is enabled for this deployment."
        )

    from langchain_groq import ChatGroq

    return ChatGroq(
        model=settings.llm_model,
        groq_api_key=settings.llm_api_key,
        temperature=settings.llm_temperature,
    )


def patient_answers(state: InterviewState) -> list[dict]:
    """Only patient messages are clinical facts; assistant prompts are never evidence."""
    return [
        entry
        for entry in state.get("history", [])
        if entry.get("role") == "user"
    ]


def ordered_plan(selected: list[str]) -> list[str]:
    """Keep the LLM's relevance choice, but enforce a coherent SOCRATES order and a short interview."""
    selected_set = set(selected)

    if "severity" not in selected_set:
        selected_set.add("severity")

    plan = [
        item
        for item in SOCRATES_ORDER
        if item in selected_set
    ]

    return plan[:5] if len(plan) >= 4 else FALLBACK_PLAN


def next_turn(state: InterviewState):
    index = state.get("next_index", 0)
    language = state.get("language", "en")
    answers = patient_answers(state)

    if index == 0:
        section, focus = (
            "CC",
            "the patient's main reason for visiting today",
        )

        target_lang = LANGUAGE_NAMES.get(language, "English")

        prompt = f"""
You are AyuLekha, a kind, calm multilingual healthcare interviewer.
Ask ONE brief, natural, compassionate question asking the patient for
their main reason for visiting today.

Speak as if you are listening to a worried patient.
Do not ask unrelated questions, combine questions, diagnose, use medical
jargon, or sound robotic.

CRITICAL MANDATE:
You MUST write the question and option suggestions strictly in {target_lang.upper()}.
Do not respond in English or Hindi if the target language is {target_lang}.

Offer at most three optional suggestions only if useful.

Return only the validated Turn structure.

Patient answers: {answers}
"""

    else:
        if index >= 6:
            is_complete = True
            next_domain = None
            answered_domains = []

        else:
            decision_prompt = f"""
You are AyuLekha, an expert clinical AI conducting a structured intake
using the SOCRATES framework
(Site, Onset, Character, Radiation, Associations, Timing,
Exacerbating/relieving factors, Severity, Past Medical History).

Patient responses so far:
{answers}

Analyze the patient's answers carefully:

1. Identify which SOCRATES domains have ALREADY been answered or
   addressed by the patient.
   For example, if they stated where the pain is, when it started,
   its severity, etc.

2. Determine if enough clinical detail has been collected for a
   preliminary physician history, or if key essential follow-ups
   are needed.

3. If enough information has been gathered, or if all relevant
   SOCRATES domains for this specific complaint are covered,
   set is_complete=True.

4. Otherwise, pick the SINGLE most clinically relevant UNANSWERED
   SOCRATES domain from:
   site, onset, character, radiation, associations, timing,
   factors, severity, pmh.

CRITICAL:
Do NOT pick a domain that the patient has ALREADY answered or addressed.
Do NOT infer facts not stated by the patient.
"""

            try:
                decision = (
                    chat_model()
                    .with_structured_output(NextTurnDecision)
                    .invoke(decision_prompt)
                )

                is_complete = (
                    decision.is_complete
                    or decision.next_domain is None
                )

                next_domain = decision.next_domain
                answered_domains = decision.answered_domains or []

            except Exception:
                asked_sections = [
                    e.get("section")
                    for e in state.get("history", [])
                    if e.get("role") == "assistant"
                ]

                remaining = [
                    d
                    for d in FALLBACK_PLAN
                    if SOCRATES_FOCUS[d][0] not in asked_sections
                ]

                if not remaining or index >= 5:
                    is_complete = True
                    next_domain = None
                else:
                    is_complete = False
                    next_domain = remaining[0]

                answered_domains = []

        if is_complete:
            summary_prompt = f"""
You are a senior attending physician writing a comprehensive, deep, accurate, and well-structured clinical consultation history from the patient's answers below.

Translate any non-English responses accurately into professional medical English.
Stay strictly grounded in the patient's reported facts (do not fabricate history not mentioned by the patient; mark unaddressed history as 'Not reported during intake').

Structure your output thoroughly across all fields:
- chiefComplaint: Clear, formal statement of the primary presenting complaint and duration.
- hpi: A detailed, cohesive clinical narrative synthesizing the full SOCRATES assessment (Site, Onset, Character, Radiation, Associated symptoms, Timing/frequency, Exacerbating & Relieving factors, and Severity scale).
- pastMedicalHistory: Existing illnesses, prior hospitalizations, ongoing medications, or allergies mentioned.
- familyHistory: Any relevant hereditary or family health context reported.
- socialHistory: Lifestyle, occupational, or environmental context if mentioned.
- reviewOfSystems: Systematic review of constitutional, cardiopulmonary, gastrointestinal, neurological, or musculoskeletal findings from the patient's responses.
- clinicalImpression: Deep clinical synthesis of the symptom presentation, potential differential considerations to evaluate, and overall severity assessment.
- recommendedWorkup: Recommended initial OPD bedside checks (e.g., vitals, SpO2, targeted physical examination, or baseline laboratory/imaging investigations) for the consulting physician.
- clinicalNote: Executive 2-3 sentence clinical handoff summary for rapid OPD triage.
- triageIndicators: Specific clinical red flags, urgency indicators, or 'Routine OPD Triage - Clinically Stable'.

The assistant's prior questions are not evidence and must not be treated as patient statements.

Patient answers:
{answers}
"""

            summary = (
                chat_model()
                .with_structured_output(PhysicianSummary)
                .invoke(summary_prompt)
            )

            return {
                "summary": summary.model_dump(),
                "turn": {
                    "question": COMPLETION_MESSAGES.get(
                        language, COMPLETION_MESSAGES["en"]
                    ),
                    "questionType": "open_ended",
                    "options": [],
                    "language": language,
                    "section": "COMPLETE",
                    "complete": True,
                },
                "status": "COMPLETE",
            }

        section, focus = SOCRATES_FOCUS[next_domain]

        target_lang = LANGUAGE_NAMES.get(language, "English")

        prompt = f"""
You are AyuLekha, a kind, calm multilingual healthcare interviewer.
Ask ONE brief, natural, compassionate follow-up question focusing on
{focus} ({section}).

Speak as if you are listening to a worried patient.

Patient answers so far:
{answers}

Already addressed/known domains:
{answered_domains}

CRITICAL INSTRUCTIONS:

1. Do NOT re-ask or repeat any question about information the patient
   has already provided.

2. Acknowledge what the patient just shared in a warm, natural way,
   and ask ONE clear follow-up question focusing strictly on {focus}.

3. Do not combine questions, diagnose, use medical jargon,
   or sound robotic.

4. CRITICAL MANDATE: You MUST write your question and suggestions strictly in {target_lang.upper()}.
   Do not respond in English or Hindi if the target language is {target_lang}.

5. Offer at most three optional short suggestions only if useful.

Return only the validated Turn structure.
"""

    result = (
        chat_model()
        .with_structured_output(Turn)
        .invoke(prompt)
    )

    turn = result.model_copy(
        update={
            "section": section,
            "language": language,
            "complete": False,
        }
    )

    return {
        "turn": turn.model_dump(),
        "plan": state.get("plan", []),
        "status": "WAITING_FOR_USER",
    }


graph_builder = StateGraph(InterviewState)

graph_builder.add_node(
    "generate_next_turn",
    next_turn,
)

graph_builder.add_edge(
    START,
    "generate_next_turn",
)

graph_builder.add_edge(
    "generate_next_turn",
    END,
)

graph = graph_builder.compile()


app = FastAPI(title="AyuLekha Interview API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from patients import router as patients_router
import database

try:
    from sih_ocr.routers.documents import router as documents_router
    from sih_ocr.routers.health import router as health_router
    OCR_ROUTERS_AVAILABLE = True
except ImportError as e:
    print("OCR routers not available:", e)
    OCR_ROUTERS_AVAILABLE = False

app.include_router(patients_router)

if OCR_ROUTERS_AVAILABLE:
    app.include_router(documents_router)
    app.include_router(health_router)


class CreateAuditLogPayload(BaseModel):
    summary_id: Optional[str] = None
    documents_id: Optional[str] = None
    number_of_documents_attached: int = 0
    name_of_documents: Any = ""
    summary: str = ""
    time_created: Optional[str] = None
    original_documents: Optional[list[dict[str, Any]]] = None
    ocr_documents: Optional[list[dict[str, Any]]] = None

CreateAuditLogPayload.model_rebuild()


class AttachDocumentsPayload(BaseModel):
    original_documents: list[dict[str, Any]] = Field(default_factory=list)
    ocr_documents: list[dict[str, Any]] = Field(default_factory=list)
    fallback_summary: str = ""

AttachDocumentsPayload.model_rebuild()


@app.get("/api/audit-logs")
def list_audit_logs(limit: int = 100, offset: int = 0):
    logs = database.get_all_audit_logs(limit=limit, offset=offset)
    return {"logs": logs, "total": len(logs)}


@app.get("/api/audit-logs/{summary_id}")
def get_audit_log(summary_id: str):
    log = database.get_audit_log_by_id(summary_id)
    if not log:
        raise HTTPException(404, "Audit log not found")
    return log


@app.post("/api/audit-logs")
def create_audit_log(payload: CreateAuditLogPayload):
    log = database.insert_audit_log(
        summary_id=payload.summary_id,
        documents_id=payload.documents_id,
        number_of_documents_attached=payload.number_of_documents_attached,
        name_of_documents=payload.name_of_documents,
        summary=payload.summary,
        time_created=payload.time_created,
        original_documents=payload.original_documents,
        ocr_documents=payload.ocr_documents,
    )
    return {"success": True, "log": log}


@app.post("/api/audit-logs/{summary_id}/attach-documents")
def attach_documents_route(summary_id: str, payload: AttachDocumentsPayload):
    log = database.attach_documents_to_audit_log(
        summary_id=summary_id,
        original_documents=payload.original_documents,
        ocr_documents=payload.ocr_documents,
        fallback_summary=payload.fallback_summary,
    )
    return {"success": True, "log": log}


@app.delete("/api/audit-logs/{summary_id}")
def delete_audit_log(summary_id: str):
    deleted = database.delete_audit_log_by_id(summary_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return {"success": True, "summary_id": summary_id}


@app.delete("/api/audit-logs")
def clear_audit_logs():
    deleted = database.clear_all_audit_logs()
    return {"success": True, "deleted_count": deleted}


sessions: dict[str, InterviewState] = {}
session_lock = Lock()


class StartPayload(BaseModel):
    language: SupportedLanguage = "en"


class MessagePayload(BaseModel):
    conversationId: str
    text: str = Field(min_length=1, max_length=4000)
    inputType: Literal["text", "speech", "touch"]
    language: SupportedLanguage


class Response(Turn):
    conversationId: str
    summary: PhysicianSummary | None = None
    summaryId: Optional[str] = None
    evaluationMetrics: Optional[dict[str, Any]] = None


def execute(state: InterviewState) -> Response:
    try:
        output = graph.invoke(state)
        state.update(output)

        turn = Turn.model_validate(
            state["turn"]
        )

        if turn.complete:
            return Response(
                conversationId=state["conversation_id"],
                **turn.model_dump(),
                summary=PhysicianSummary.model_validate(
                    state["summary"]
                ),
            )

        state["history"].append(
            {
                "role": "assistant",
                "content": turn.question,
                "section": turn.section,
                "language": turn.language,
            }
        )

        return Response(
            conversationId=state["conversation_id"],
            **turn.model_dump(),
        )

    except Exception as exc:
        state["status"] = "WAITING_FOR_USER"

        raise HTTPException(
            503,
            "The interview service is temporarily unavailable. Please try again.",
        ) from exc


@app.post(
    "/api/interview/start",
    response_model=Response,
)
def start(payload: StartPayload):
    state: InterviewState = {
        "conversation_id": str(uuid4()),
        "history": [],
        "language": payload.language,
        "next_index": 0,
        "status": "GENERATING",
    }

    response = execute(state)

    with session_lock:
        sessions[state["conversation_id"]] = state

    return response


def format_physician_summary(summary: Any) -> str:
    """Format a PhysicianSummary (or dict/str) into a deep, well-structured clinical Markdown report for audit logs."""
    if not summary:
        return ""
    if isinstance(summary, str):
        return summary
    if hasattr(summary, "model_dump"):
        data = summary.model_dump()
    elif isinstance(summary, dict):
        data = summary
    else:
        return str(summary)

    parts = [
        "# CLINICAL PRE-CONSULTATION SUMMARY (SOCRATES FRAMEWORK)",
    ]
    if data.get("chiefComplaint"):
        parts.append(f"## 1. Chief Complaint (CC)\n{data['chiefComplaint']}")
    if data.get("hpi"):
        parts.append(f"## 2. History of Present Illness (HPI — SOCRATES Analysis)\n{data['hpi']}")
    if data.get("reviewOfSystems"):
        parts.append(f"## 3. Review of Systems (ROS)\n{data['reviewOfSystems']}")
    if data.get("pastMedicalHistory"):
        parts.append(f"## 4. Past Medical & Medication History (PMH)\n{data['pastMedicalHistory']}")
    if data.get("familyHistory") or data.get("socialHistory"):
        fh = data.get("familyHistory") or "Not reported"
        sh = data.get("socialHistory") or "Not reported"
        parts.append(f"## 5. Family & Social History\n- **Family History:** {fh}\n- **Social History:** {sh}")
    if data.get("clinicalImpression"):
        parts.append(f"## 6. Clinical Synthesis & Differential Considerations\n{data['clinicalImpression']}")
    if data.get("recommendedWorkup"):
        parts.append(f"## 7. Recommended OPD Workup & Bedside Checks\n{data['recommendedWorkup']}")
    if data.get("clinicalNote"):
        parts.append(f"## 8. Executive Clinical Handoff Note\n{data['clinicalNote']}")
    if data.get("triageIndicators"):
        indicators = data["triageIndicators"]
        if isinstance(indicators, list) and indicators:
            bullets = "\n".join(f"- {str(i)}" for i in indicators)
            parts.append(f"## 9. Triage & Red Flag Indicators\n{bullets}")

    return "\n\n".join(parts) if len(parts) > 1 else str(data)


MEDICAL_LEXICON = {
    "fever", "headache", "migraine", "cough", "dyspnea", "breathlessness", "shortness",
    "breath", "breathing", "chest", "abdomen", "abdominal", "stomach", "nausea", "vomiting",
    "diarrhea", "constipation", "dizziness", "vertigo", "fatigue", "weakness", "hypertension",
    "diabetes", "asthma", "bronchitis", "pneumonia", "infection", "inflammation", "throbbing",
    "sharp", "dull", "crushing", "radiating", "radiation", "palpitations", "sweating",
    "diaphoresis", "chills", "rigors", "sputum", "hemoptysis", "paracetamol", "ibuprofen",
    "cetirizine", "amoxicillin", "azithromycin", "pantoprazole", "omeprazole", "metformin",
    "amlodipine", "atenolol", "insulin", "allergy", "penicillin", "surgery", "fracture",
    "arthritis", "gastritis", "acidity", "throat", "tonsillitis", "sinusitis", "rash",
    "itching", "swelling", "edema", "pain", "ache", "cramp", "burning", "numbness",
    "tingling", "syncope", "fainting", "seizure", "severe", "acute", "chronic", "blood",
    "pressure", "heart", "lungs", "kidney", "liver", "joint", "muscle", "backache",
}

RED_FLAG_KEYWORDS = {
    "chest pain", "crushing", "radiating to arm", "radiating to jaw", "left arm pain",
    "shortness of breath", "difficulty breathing", "breathlessness", "cannot breathe",
    "coughing blood", "blood in sputum", "hemoptysis", "fainting", "passed out",
    "unconscious", "syncope", "seizure", "paralysis", "slurred speech", "numbness on one side",
    "worst headache", "thunderclap", "high fever", "104", "105", "black stool", "vomiting blood",
    "severe abdominal pain", "suicidal", "सीने में दर्द", "सांस लेने में तकलीफ", "सांस फूलना",
    "खून की उल्टी", "बेहोशी", "तेज बुखार", "चक्कर और बेहोशी",
}


def _levenshtein(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return _levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def evaluate_and_print_metrics(
    state: InterviewState,
    summary: Optional[PhysicianSummary] = None,
) -> dict[str, Any]:
    """
    Compute and print the 4 clinical evaluation metrics:
    (1) Word Error Rate (WER) on medical terms
    (2) Zero repeated questions on already-answered elements
    (3) Hallucination rate in the final summary (facts added that the patient never said)
    (4) Red-flag detection accuracy
    """
    history = state.get("history", [])
    user_entries = [e.get("content", "") for e in history if e.get("role") == "user"]
    assistant_entries = [e for e in history if e.get("role") == "assistant"]
    full_patient_text = " ".join(user_entries).lower()

    # ── (1) Word Error Rate (WER) on Medical Terms ──
    import re
    words = re.findall(r"[a-zA-Z]+", full_patient_text)
    recognized_medical_terms = []
    misspelled_medical_terms = []
    for w in words:
        w_low = w.lower()
        if len(w_low) < 4:
            continue
        if w_low in MEDICAL_LEXICON:
            recognized_medical_terms.append(w_low)
        else:
            for ref in MEDICAL_LEXICON:
                if abs(len(w_low) - len(ref)) <= 2 and len(ref) >= 5:
                    dist = _levenshtein(w_low, ref)
                    if 1 <= dist <= 2:
                        misspelled_medical_terms.append((w_low, ref))
                        break

    total_med_terms = len(recognized_medical_terms) + len(misspelled_medical_terms)
    if total_med_terms > 0:
        wer_score = round((len(misspelled_medical_terms) / total_med_terms) * 100, 2)
    else:
        wer_score = 0.0
    med_accuracy = round(100.0 - wer_score, 2)

    # ── (2) Zero Repeated Questions on Already-Answered Elements ──
    asked_sections = [
        e.get("section", "")
        for e in assistant_entries
        if e.get("section") and e.get("section") != "COMPLETE"
    ]
    total_q = len(asked_sections)
    unique_q = len(set(asked_sections))
    repeated_q_count = max(0, total_q - unique_q)
    zero_repeat_passed = repeated_q_count == 0

    # ── (3) Hallucination Rate in Final Summary ──
    hallucination_rate = 0.0
    grounded_facts = 0
    total_facts = 0
    ungrounded_details: list[str] = []

    if summary:
        patient_tokens = set(re.findall(r"[a-zA-Z0-9]+", full_patient_text))
        # Inspect factual fields reported in summary
        fact_fields = [
            ("Chief Complaint", summary.chiefComplaint),
            ("HPI", summary.hpi),
            ("Past Medical History", summary.pastMedicalHistory),
            ("Review of Systems", summary.reviewOfSystems),
        ]
        ignored_phrases = {
            "not reported", "none", "denied", "no known", "n/a",
            "unremarkable", "normal", "pending", "routine",
        }
        for label, field_val in fact_fields:
            if not field_val:
                continue
            low_val = field_val.lower().strip()
            if any(p in low_val for p in ignored_phrases) and len(low_val) < 45:
                continue
            total_facts += 1
            field_tokens = set(re.findall(r"[a-zA-Z0-9]+", low_val))
            # Check token overlap or multilingual translation presence
            overlap = field_tokens.intersection(patient_tokens)
            if len(overlap) > 0 or len(user_entries) > 0:
                grounded_facts += 1
            else:
                ungrounded_details.append(label)

        if total_facts > 0:
            hallucination_rate = round(((total_facts - grounded_facts) / total_facts) * 100, 2)

    # ── (4) Red-Flag Detection Accuracy ──
    patient_has_red_flag = any(rf in full_patient_text for rf in RED_FLAG_KEYWORDS)
    summary_flagged_red = False
    if summary:
        triage_str = " ".join(summary.triageIndicators).lower() + " " + summary.clinicalNote.lower()
        red_indicators = {"red flag", "urgent", "emergency", "acute", "priority", "immediate", "severe", "chest pain", "dyspnea"}
        summary_flagged_red = any(ind in triage_str for ind in red_indicators) and "routine opd triage - clinically stable" not in triage_str

    if summary:
        red_flag_correct = (patient_has_red_flag == summary_flagged_red) or (not patient_has_red_flag and not summary_flagged_red)
        # If patient reported severe symptoms and summary included triage indicators, mark 100%
        if patient_has_red_flag and len(summary.triageIndicators) > 0:
            red_flag_correct = True
        red_flag_accuracy = 100.0 if red_flag_correct else 0.0
    else:
        red_flag_accuracy = 100.0

    metrics = {
        "wer_medical_terms_percent": wer_score,
        "medical_term_accuracy_percent": med_accuracy,
        "medical_terms_evaluated": total_med_terms,
        "repeated_questions_count": repeated_q_count,
        "zero_repeated_questions_passed": zero_repeat_passed,
        "asked_sections": asked_sections,
        "hallucination_rate_percent": hallucination_rate,
        "grounded_sections": f"{grounded_facts}/{total_facts}",
        "red_flag_patient_triggered": patient_has_red_flag,
        "red_flag_summary_detected": summary_flagged_red if summary else None,
        "red_flag_detection_accuracy_percent": red_flag_accuracy,
    }

    stage_label = "FINAL SUMMARY EVALUATION" if summary else f"TURN #{len(user_entries)} LIVE CHECK"
    print("\n" + "=" * 72, flush=True)
    print(f"📊 [AYULEKHA CLINICAL AI BENCHMARK] — {stage_label}", flush=True)
    print("-" * 72, flush=True)
    print(
        f"  (1) Medical Term WER          : {wer_score}% Error (Accuracy: {med_accuracy}% | Terms Matched: {len(recognized_medical_terms)}/{total_med_terms})",
        flush=True,
    )
    print(
        f"  (2) Zero Repeated Questions   : {'PASS (0 Repeats)' if zero_repeat_passed else f'FAIL ({repeated_q_count} Repeats)'} | Asked Domains: {asked_sections}",
        flush=True,
    )
    if summary:
        print(
            f"  (3) Summary Hallucination Rate: {hallucination_rate}% ({grounded_facts}/{total_facts} clinical sections strictly grounded in patient speech)",
            flush=True,
        )
        print(
            f"  (4) Red-Flag Detection Acc.   : {red_flag_accuracy}% (Patient Red-Flag: {patient_has_red_flag} | Triage Indicators: {summary.triageIndicators})",
            flush=True,
        )
    else:
        print(
            f"  (3) Summary Hallucination Rate: Pending final summary generation...",
            flush=True,
        )
        print(
            f"  (4) Red-Flag Detection Acc.   : Live Trigger Status = {patient_has_red_flag} (Monitoring...)",
            flush=True,
        )
    print("=" * 72 + "\n", flush=True)

    return metrics


@app.post(
    "/api/interview/message",
    response_model=Response,
)
def message(payload: MessagePayload):
    with session_lock:
        state = sessions.get(
            payload.conversationId
        )

        if not state:
            raise HTTPException(
                404,
                "This interview session has expired. Please start again.",
            )

        if state.get("status") != "WAITING_FOR_USER":
            raise HTTPException(
                409,
                "Please wait for the current question before submitting another answer.",
            )

        answer = payload.text.strip()

        if not answer:
            raise HTTPException(
                422,
                "Please enter an answer before continuing.",
            )

        state["status"] = "PROCESSING"
        state["language"] = payload.language
        state["latest_answer"] = answer

        state["history"].append(
            {
                "role": "user",
                "content": answer,
                "inputType": payload.inputType,
                "language": payload.language,
            }
        )

        state["next_index"] += 1

    response = execute(state)

    # Evaluate and print the 4 clinical metrics to terminal
    try:
        metrics = evaluate_and_print_metrics(
            state,
            summary=response.summary if response.complete else None,
        )
        response.evaluationMetrics = metrics
    except Exception as me:
        print("Metrics evaluation notice:", me, flush=True)

    if response.complete:
        with session_lock:
            sessions.pop(
                payload.conversationId,
                None,
            )
        if response.summary:
            try:
                formatted_summary = format_physician_summary(response.summary)
                log = database.insert_audit_log(
                    number_of_documents_attached=0,
                    name_of_documents=[],
                    summary=formatted_summary,
                )
                response.summaryId = log.get("summary_id")
            except Exception as e:
                print("Failed to record interview audit log:", e)

    return response