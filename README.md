# AyuLekha

A multilingual patient-history interviewer. The React frontend provides the OPD intake interface; the Python backend uses LangChain and LangGraph to hold the interview state and generate one structured question at a time.

The default model is Groq's `openai/gpt-oss-120b`. Its API key remains on the backend and is never sent to the browser.

## Prerequisites

- Node.js 20 or newer
- Python 3.11 or newer
- A Groq API key from the [Groq Console](https://console.groq.com/keys)

## First-time setup

Open two PowerShell terminals in the project folder.

### Terminal 1 — backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `backend/.env` and replace the placeholder API key. Keep these values:

```env
LLM_PROVIDER=groq
LLM_MODEL=openai/gpt-oss-120b
LLM_API_KEY=your-groq-api-key
```

Start the API:

```powershell
uvicorn main:app --reload --port 8000
```

The API is available at `http://127.0.0.1:8000`; its documentation is at `http://127.0.0.1:8000/docs`.

### Terminal 2 — frontend

```powershell
npm install
npm run dev
```

Open the Vite address shown in the terminal, usually `http://localhost:5173`. The frontend proxies `/api` requests to port 8000, so keep both processes running.

## Using the interview

1. Complete triage, identity, and consent to reach **Your Story**.
2. The AI asks one question and remains in `WAITING_FOR_USER` until you submit an answer.
3. Type, hold the microphone to speak, or select an AI-provided suggestion. Voice transcription is placed into the same editable input field.
4. Review the answer and select **Submit answer**. Only submission advances the conversation.

## Configuration and safety

All model configuration is in `backend/.env`: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, and `LLM_TEMPERATURE`. Never commit `backend/.env` or put an API key in frontend code.
