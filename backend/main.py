"""Ephemeral, structured LangGraph interview API; no patient data is written to disk."""
from __future__ import annotations

from threading import Lock
from typing import Literal, TypedDict
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


class Turn(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    questionType: Literal[
        "single_choice",
        "multiple_choice",
        "open_ended",
    ] = "open_ended"
    options: list[str] = Field(default_factory=list, max_length=6)
    language: Literal["en", "hi"] = "en"
    section: str = ""
    complete: bool = False


class PhysicianSummary(BaseModel):
    chiefComplaint: str
    hpi: str
    pastMedicalHistory: str
    familyHistory: str
    socialHistory: str
    reviewOfSystems: str
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

        prompt = f"""
You are AyuLekha, a kind, calm multilingual healthcare interviewer.
Ask ONE brief, natural, compassionate question asking the patient for
their main reason for visiting today.

Speak as if you are listening to a worried patient.
Do not ask unrelated questions, combine questions, diagnose, use medical
jargon, or sound robotic.

Write in {'Hindi' if language == 'hi' else 'English'};
a patient may answer in either language.

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
Write a very concise, physician-ready English history from the
patient answers below.

Translate accurately.
Do not invent facts, assume answers, or diagnose.

Each section must be one short sentence or 'Not reported'.

Keep the clinical note to one sentence and include triage flags
only when directly supported.

The assistant's prior questions are not evidence and must not
be mentioned.

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
                    "question": (
                        "Thank you. I have prepared your brief "
                        "history for the doctor."
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

4. Write in {'Hindi' if language == 'hi' else 'English'};
   a patient may answer in either language.

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

app.include_router(patients_router)


sessions: dict[str, InterviewState] = {}
session_lock = Lock()


class StartPayload(BaseModel):
    language: Literal["en", "hi"] = "en"


class MessagePayload(BaseModel):
    conversationId: str
    text: str = Field(min_length=1, max_length=4000)
    inputType: Literal["text", "speech", "touch"]
    language: Literal["en", "hi"]


class Response(Turn):
    conversationId: str
    summary: PhysicianSummary | None = None


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

    if response.complete:
        with session_lock:
            sessions.pop(
                payload.conversationId,
                None,
            )

    return response